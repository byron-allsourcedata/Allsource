import logging
from datetime import datetime, timezone
from enums import PlanAlias
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
import os
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv
from models.leads_users import LeadUser
from models.plans import SubscriptionPlan
from models.subscription_transactions import SubscriptionTransactions
from models.subscriptions import Subscription, UserSubscriptions
from models.users import Users, User
from persistence.partners_persistence import PartnersPersistence
from models.users_domains import UserDomains
from models.users_payments_transactions import UsersPaymentsTransactions
from persistence.plans_persistence import PlansPersistence
from persistence.user_persistence import UserPersistence
from utils import get_utc_aware_date_for_postgres
from decimal import *
from models.referral_payouts import ReferralPayouts
from models.referral_users import ReferralUser
from services.stripe_service import determine_plan_name_from_product_id
from urllib.parse import urlencode
import requests
from services.referral import ReferralService
load_dotenv()

logger = logging.getLogger(__name__)


class SubscriptionService:
    def __init__(self, db: Session, user_persistence_service: UserPersistence, plans_persistence: PlansPersistence, referral_service: ReferralService,
                 partners_persistence: PartnersPersistence):
        self.plans_persistence = plans_persistence
        self.db = db
        self.user_persistence_service = user_persistence_service
        self.UNLIMITED = -1
        self.referral_service = referral_service
        self.partners_persistence = partners_persistence

    def get_userid_by_customer(self, customer_id):
        result = self.db.query(User, ReferralPayouts.id, ReferralUser.parent_user_id) \
            .join(ReferralPayouts, ReferralPayouts.user_id == User.id, isouter=True) \
            .join(ReferralUser, ReferralUser.user_id == User.id, isouter=True) \
            .filter(User.customer_id == customer_id) \
            .first()
        
        if result is None:
            return None 
        
        user, referral_payout_id, parent_user_id = result

        return {
            "user": user,
            "payout_id": referral_payout_id,
            "parent_user_id": parent_user_id
        }

    
    def get_billing_history_shopify(self, user_id, page, per_page):
        start_index = (page - 1) * per_page
        
        billing_history = self.db.query(SubscriptionTransactions) \
            .filter(SubscriptionTransactions.user_id == user_id) \
            .order_by(SubscriptionTransactions.created_at.desc()) \
            .offset(start_index) \
            .limit(per_page) \
            .all()

        result = []
        for billing_data in billing_history:
            billing_hash = {
                'date': billing_data.created_at.strftime('%b %d, %Y'),
                'invoice_id': billing_data.charge_id,
                'pricing_plan': billing_data.plan_name,
                'total': billing_data.amount,
                'status': billing_data.status
            }
            result.append(billing_hash)

        count = self.db.query(SubscriptionTransactions) \
            .filter(SubscriptionTransactions.user_id == user_id) \
            .count()

        max_page = (count + per_page - 1) // per_page

        return result, count, max_page

    def get_user_by_shopify_shop_id(self, shop_id: str):
        return self.db.query(User).filter(User.shop_id == str(shop_id)).first()


    def cancellation_downgrade(self, subscription_id):
        self.db.query(UserSubscriptions).where(UserSubscriptions.id == subscription_id).update(
            {"downgrade_at": None, 'downgrade_price_id': None})
        self.db.commit()

    def check_duplicate_send(self, stripe_request_created_at, platform_subscription_id, price_id):
        subscription_data = self.db.query(SubscriptionTransactions).filter(
            SubscriptionTransactions.price_id == price_id,
            SubscriptionTransactions.platform_subscription_id == platform_subscription_id
        ).order_by(SubscriptionTransactions.stripe_request_created_at.desc()).first()
        if subscription_data:
            if subscription_data.stripe_request_created_at is not None:
                if isinstance(subscription_data.stripe_request_created_at, str):
                    subscription_datetime = datetime.strptime(subscription_data.stripe_request_created_at,
                                                              "%Y-%m-%d %H:%M:%S")
                else:
                    subscription_datetime = subscription_data.stripe_request_created_at

                if stripe_request_created_at <= subscription_datetime.replace(tzinfo=None):
                    return True
        return False

    def is_user_have_subscription(self, user_id):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.user_id == user_id).limit(1).scalar()

    def construct_webhook_response(self, subscription):
        response = {
            "success_msg": {
                "subscription": {
                    "user_id": subscription.user_id,
                    "plan_start": subscription.plan_start,
                    "plan_end": subscription.plan_end,
                    "created_at": subscription.created_at,
                    "status": subscription.status,
                    "platform_subscription_id": subscription.platform_subscription_id,
                    "plan_id": subscription.plan_id,
                    "stripe_request_created_at": subscription.stripe_request_created_at,
                    "domains_limit": subscription.domains_limit,
                    "integrations_limit": subscription.integrations_limit
                }
            }
        }
        return response

    def get_user_subscription(self, user_id):
        user_subscription = (
            self.db.query(UserSubscriptions)
            .join(User, User.current_subscription_id == UserSubscriptions.id)
            .filter(User.id == user_id)
            .first()
        )
        return user_subscription

    def get_user_subscription_with_trial_status(self, user_id):
        result_dict = {
            'subscription': None,
            'is_artificial_status': False,
            'artificial_trial_days': None,
        }
        result = self.plans_persistence.get_user_subscription_with_trial_status(user_id)
        if result:
            user_subscription, is_free_trial, trail_days, currency, price, alias = result
            result_dict['subscription'] = user_subscription
            result_dict['artificial_trial_days'] = trail_days
            result_dict['is_artificial_status'] = is_free_trial
            result_dict['alias'] = alias

        return result_dict

    def is_user_has_active_subscription(self, user_id):
        result = self.get_user_subscription_with_trial_status(user_id=user_id)
        return self.is_subscription_active(result)

    def is_subscription_active(self, subscription_with_trial):
        if not subscription_with_trial['subscription']:
            return False
        if subscription_with_trial['is_artificial_status']:
            if not subscription_with_trial['subscription'].plan_end:
                return True

        if subscription_with_trial['subscription'].status == 'inactive':
            return False
        subscription_plan_end = subscription_with_trial['subscription'].plan_end.replace(tzinfo=timezone.utc)

        return subscription_plan_end > datetime.now(timezone.utc)

    def is_allow_add_lead(self, user_id):
        result = self.get_user_subscription_with_trial_status(user_id=user_id)
        is_active = self.is_subscription_active(result)
        user_subscription = result['subscription']
        if not user_subscription:
            return False
        if not is_active and user_subscription.status == 'inactive':
            billing_date = user_subscription.plan_end.astimezone(timezone.utc)
            if billing_date + relativedelta(months=1) <= datetime.now(timezone.utc):
                return False

        return True

    def is_trial_subscription(self, user_id):
        user_subscription = self.get_user_subscription(user_id=user_id)
        if user_subscription:
            if user_subscription.is_trial:
                return True

        return False

    def create_payments_transaction(self, user_id, stripe_payload, product_description, quantity):
        payment_intent = stripe_payload.get("data", {}).get("object", {})
        transaction_id = payment_intent.get("id")
        users_payments_transactions = self.db.query(UsersPaymentsTransactions).filter(
            UsersPaymentsTransactions.transaction_id == transaction_id).first()
        if not users_payments_transactions:
            created_timestamp = stripe_payload.get("created")
            created_at = datetime.fromtimestamp(created_timestamp, timezone.utc).replace(
                tzinfo=None) if created_timestamp else None
            status = payment_intent.get("status")
            if status == 'succeeded':
                payment_transaction_obj = UsersPaymentsTransactions(
                    user_id=user_id,
                    transaction_id=transaction_id,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    stripe_request_created_at=created_at,
                    status=status,
                    amount_credits=quantity,
                    type=product_description
                )
                self.db.add(payment_transaction_obj)
                self.db.commit()
            return True
        return False
    
    def create_shopify_subscription_transaction(self, subscription_info, user_id, plan: SubscriptionPlan, charge_id):
        status = subscription_info.get("status", "").lower()
        if status in ('cancelled', 'declined'):
            status = 'canceled'
        created_at = datetime.fromisoformat(subscription_info.get("created_at"))
        start_date = created_at
        end_date = start_date + (
            relativedelta(months=1) if plan.interval == "month" else relativedelta(years=1)
        ) if status != "cancelled" else start_date

        subscription_transaction_obj = SubscriptionTransactions(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            currency=plan.currency,
            charge_id=charge_id,
            plan_id=plan.id,
            plan_name=plan.title,
            created_at=created_at,
            status=status,
            amount=plan.price
        )
        self.db.add(subscription_transaction_obj)
        self.db.flush()

    
    def get_plan_by_title_and_interval(self, plan_type, interval):
        return self.plans_persistence.get_plan_by_title_and_interval(plan_type, interval)
    
    def get_plan_by_title_price(self, plan_name, payment_amount):
        return self.plans_persistence.get_plan_by_title_price(plan_name, payment_amount)
        
    def create_subscription_transaction(self, user_id, stripe_payload: dict):
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        stripe_request_created_timestamp = stripe_payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(
            tzinfo=None)
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)
        created_at = get_utc_aware_date_for_postgres()
        currency = stripe_payload.get("data").get("object").get("currency")
        amount = Decimal(stripe_payload.get("data").get("object").get("plan").get("amount_decimal")) / Decimal(100)
        price_id = stripe_payload.get("data").get("object").get("plan").get("id")
        status = stripe_payload.get("data").get("object").get("status")
        plan_type = determine_plan_name_from_product_id(
            stripe_payload.get("data").get("object").get("plan").get("product"))
        interval = stripe_payload.get("data").get("object").get("plan").get("interval")
        payment_platform_subscription_id = stripe_payload.get("data").get("object").get("id")
        transaction_id = stripe_payload.get("id")
        plan_id = self.plans_persistence.get_plan_by_title_and_interval(plan_type, interval).id
        subscription_transaction_obj = SubscriptionTransactions(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            currency=currency,
            price_id=price_id,
            plan_id=plan_id,
            transaction_id=transaction_id,
            platform_subscription_id=payment_platform_subscription_id,
            plan_name=plan_type,
            created_at=created_at,
            status=status,
            stripe_request_created_at=stripe_request_created_at,
            amount=amount
        )
        self.db.add(subscription_transaction_obj)
        self.db.flush()
        return subscription_transaction_obj

    def create_payment_from_webhook(self, user_id, stripe_payload, product_description, quantity):
        payment_intent = stripe_payload.get("data", {}).get("object", {})
        amount_credits = quantity
        status = payment_intent.get("status")
        if status == "succeeded":
            if product_description == 'leads_credits':
                user = self.db.query(User).filter(User.id == user_id).first()
                lead_users = self.db.query(LeadUser).filter(LeadUser.user_id == user.id).limit(quantity).all()
                for lead_user in lead_users:
                    lead_user.is_active = True
                self.db.commit()
            elif product_description == 'prospect_credits':
                user = self.db.query(User).filter(User.id == user_id).first()
                if user.prospect_credits is None:
                    user.prospect_credits = 0
                user.prospect_credits += int(amount_credits)
                self.db.commit()
        return status

    def get_user_payment_by_transaction_id(self, transaction_id):
        user_payment_transaction = self.db.query(UsersPaymentsTransactions).filter(
            UsersPaymentsTransactions.transaction_id == transaction_id
        ).first()

        return user_payment_transaction
    
    def trackAwinConversion(self, user: User, price, subscription_type, date, subscription_id):
        refer = os.getenv('SITE_URL')
        awc = user.awin_awc
        order_id = f"{subscription_id}_{user.id}_{date}"
        awin_campaign_id = os.getenv('AWIN_CAMPAIGN_ID')
        mode = 1 if os.getenv('APP_MODE') == 'dev' else 0
        params = {
            "tt": "ss",
            "tv": "2",
            "merchant": f"{awin_campaign_id}",
            "amount": price,
            "ch": "aw",
            "cr": "USD",
            "parts": f"{subscription_type}:{price}",
            "ref": f"{order_id}",
            "t": mode,
            "cks": awc
        }
        request_url = f"https://www.awin1.com/sread.php?{urlencode(params)}"
        headers = {'Referer': refer}
        response = requests.get(request_url, headers=headers)
        return response
    
    def create_subscription_from_partners(self, user_id):
        plan = self.plans_persistence.get_plan_by_alias(PlanAlias.PARTNERS.value)
        plan_start = datetime.now(timezone.utc).replace(tzinfo=None)
        add_subscription_obj = Subscription(
            domains_limit=plan.domains_limit,
            integrations_limit=plan.integrations_limit,
            plan_start = plan_start,
            plan_end = plan_start + relativedelta(months=1),
            user_id=user_id,
            updated_at=plan_start.isoformat() + "Z",
            created_at=plan_start.isoformat() + "Z",
            members_limit=plan.members_limit,
            status='active',
            plan_id=plan.id,
            is_trial=False,
            lead_credit_price=plan.lead_credit_price
        )
        self.db.add(add_subscription_obj)
        self.db.flush()
        user = self.db.query(User).filter(User.id == user_id).first()
        user.activate_steps_percent=50
        user.leads_credits=plan.leads_credits
        user.prospect_credits=plan.prospect_credits
        user.current_subscription_id=add_subscription_obj.id
        self.db.commit()

    def create_subscription_from_free_trial(self, user_id, ftd=None):
        plan = self.plans_persistence.get_free_trial_plan(ftd)
        status = 'active'
        created_at = datetime.strptime(get_utc_aware_date_for_postgres(), '%Y-%m-%dT%H:%M:%SZ')
        add_subscription_obj = Subscription(
            domains_limit=plan.domains_limit,
            integrations_limit=plan.integrations_limit,
            user_id=user_id,
            updated_at=created_at.isoformat() + "Z",
            created_at=created_at.isoformat() + "Z",
            members_limit=plan.members_limit,
            status=status,
            plan_id=plan.id,
            is_trial=True,
            lead_credit_price=plan.lead_credit_price
        )
        self.db.add(add_subscription_obj)
        self.db.flush()
        user = self.db.query(User).filter(User.id == user_id).first()
        user.activate_steps_percent=50
        user.leads_credits=plan.leads_credits
        user.prospect_credits=plan.prospect_credits
        user.current_subscription_id=add_subscription_obj.id
        user.is_book_call_passed=True
        self.db.commit()

        if user.awin_awc:
            self.trackAwinConversion(user, 0, 'FREE_TRIAL', add_subscription_obj.created_at.strftime('%Y-%m-%d'), add_subscription_obj.id)

    def remove_trial(self, user_id: int):
        trial_subscription = self.get_user_subscription(user_id)
        trial_subscription.is_trial = False

        trial_subscription.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        trial_subscription.plan_end = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

    def save_downgrade_price_id(self, price_id, subscription: UserSubscriptions):
        subscription.downgrade_price_id = price_id
        subscription.cancel_scheduled_at = None
        subscription.cancellation_reason = None
        subscription.downgrade_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

    def get_subscription_by_price_id(self, price_id):
        return self.db.query(UserSubscriptions).filter(UserSubscriptions.platform_subscription_id == price_id)

    def get_additional_credits_price_id(self):
        stripe_price_id = self.db.query(SubscriptionPlan.stripe_price_id).filter(
            SubscriptionPlan.title == 'Additional_prospect_credits'
        ).scalar()
        return stripe_price_id

    def update_users_domains(self, user_id, domains_limit):
        domains = self.db.query(UserDomains).filter(UserDomains.user_id == user_id).all()
        if domains:
            sorted_domains = sorted(domains, key=lambda x: x.created_at)
            for i, domain in enumerate(sorted_domains, start=1):
                domain.is_enable = i <= domains_limit or domains_limit == self.UNLIMITED
        self.db.commit()

    def update_team_members(self, team_owner_id, members_limit):
        if team_owner_id and members_limit != self.UNLIMITED:
            users = self.db.query(Users).filter(Users.team_owner_id == team_owner_id).all()
            if users:
                sorted_users = sorted(users,
                                      key=lambda x: x.added_on or datetime.min)
                for i, user in enumerate(sorted_users, start=1):
                    if i >= members_limit:
                        self.db.delete(user)

                self.db.commit()

    def get_plan_by_price(self, lead_credit_price):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.price == lead_credit_price).first()
    
    def process_shopify_subscription(self, user, plan, subscription_info, charge_id):
        result = {'status': None, 'lead_credit_price': None}
        
        status = subscription_info.get("status", "").lower()
        if status in ('cancelled', 'declined'):
            status = 'canceled'
        created_at = datetime.fromisoformat(subscription_info.get("created_at"))
        start_date = created_at

        if status == 'canceled':
            end_date = start_date
        else:
            end_date = start_date + relativedelta(months=1) if plan.interval == "month" else start_date + relativedelta(years=1)
            
        if status == 'active':
            result['lead_credit_price'] = plan.lead_credit_price

            self.db.query(UserSubscriptions).where(
                UserSubscriptions.user_id == user.id,
                UserSubscriptions.status == 'active'
            ).update({"status": "inactive", "updated_at": datetime.now(timezone.utc).replace(tzinfo=None)})
            
            user_subscription = UserSubscriptions(
                plan_start=start_date,
                plan_end=end_date,
                domains_limit=plan.domains_limit,
                integrations_limit=plan.integrations_limit,
                plan_id=plan.id,
                members_limit=plan.members_limit,
                status=status,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                user_id=user.id,
                lead_credit_price=plan.lead_credit_price,
                is_trial=False
            )

            self.db.add(user_subscription)

            self.update_users_domains(user.id, plan.domains_limit)
            self.update_team_members(user.id, plan.members_limit)
            
            user.leads_credits = max(plan.leads_credits - user.leads_credits, 0)
            user.prospect_credits = plan.prospect_credits
            user.current_subscription_id = user_subscription.id
            user.is_leads_auto_charging = True
            user.stripe_payment_url = None if user.stripe_payment_url else user.stripe_payment_url
            user.charge_id = charge_id

        elif status == "canceled":
            self.db.query(UserSubscriptions).filter(
                UserSubscriptions.id == user.current_subscription_id
            ).update({"status": status})
        
        user.payment_status = status
        self.db.commit()
        
        result['status'] = status
        return result

    
    def process_subscription(self, user: Users, stripe_payload, payout_id, referral_parent_id):
        result = {
            'status': None,
            'lead_credit_price': None
        }
        user_id = user.id
        platform_subscription_id = stripe_payload.get("id")
        price_id = stripe_payload.get("plan").get("id")
        canceled_at = stripe_payload.get("canceled_at")
        start_date_timestamp = stripe_payload.get("current_period_start")
        end_date_timestamp = stripe_payload.get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)

        stripe_status = stripe_payload.get("status")
        if stripe_status in ["active", "succeeded", "trialing"]:
            status = "active"
        elif stripe_status in ["incomplete", "requires_action", "pending", "past_due", "open"]:
            status = "inactive"
        else:
            status = "canceled"

        plan = stripe_payload['items']['data'][0]['plan']
        interval = plan['interval']
        interval_count = plan['interval_count']
        actual_start_date = start_date
        actual_end_date = end_date
        if stripe_status == 'trialing':
            actual_start_date = end_date
            if interval == 'month':
                actual_end_date = actual_start_date + relativedelta(months=+interval_count)
            elif interval == 'year':
                actual_end_date = actual_start_date + relativedelta(years=+interval_count)


        if status == 'active':
            user_subscription = self.db.query(UserSubscriptions).where(
                UserSubscriptions.platform_subscription_id == platform_subscription_id,
                UserSubscriptions.price_id == price_id).first()
            price_id = stripe_payload['items']['data'][0]['plan']['id']
            plan = self.plans_persistence.get_plan_by_price_id(price_id)
            
            if referral_parent_id and not payout_id:
                partner = self.partners_persistence.get_partner_by_user_id(referral_parent_id)
                if partner and partner.commission and partner.is_active:
                    discount = stripe_payload.get("discount")
                    amount_decimal = Decimal(stripe_payload.get("plan").get("amount_decimal")) / Decimal(100)
                    if discount and discount.get("coupon"):
                        coupon = discount["coupon"]
                        amount_off = coupon.get("amount_off")
                        percent_off = coupon.get("percent_off")
                        discount_amount = Decimal(0)
                        if amount_off:
                            discount_amount += Decimal(amount_off) / Decimal(100)
                        if percent_off:
                            discount_amount += (amount_decimal * Decimal(percent_off)) / Decimal(100)
                        final_amount = max(amount_decimal - discount_amount, Decimal(0))
                    else:
                        final_amount = amount_decimal
                        
                    reward_amount = round(Decimal(partner.commission) / Decimal(100) * final_amount, 2)
                    self.referral_service.create_referral_payouts(reward_amount, user_id, referral_parent_id, 'partner', final_amount)
                    if partner.master_id:
                        master_partner = self.partners_persistence.get_partner_by_user_id(partner.master_id)
                        if master_partner and master_partner.commission and master_partner.is_active:
                            master_reward_amount = round(Decimal(master_partner.commission - partner.commission) / Decimal(100) * reward_amount, 2)
                            self.referral_service.create_referral_payouts(master_reward_amount, referral_parent_id, partner.master_id, 'master_partner', reward_amount)
                        
                
            domains_limit = plan.domains_limit
            integrations_limit = plan.integrations_limit
            leads_credits = plan.leads_credits
            prospect_credits = plan.prospect_credits
            members_limit = plan.members_limit
            lead_credit_price = plan.lead_credit_price
            result['lead_credit_price'] = lead_credit_price
            if user_subscription and user_subscription.status == 'active':
                if canceled_at:
                    user_subscription.cancel_scheduled_at = datetime.fromtimestamp(canceled_at, timezone.utc).replace(
                        tzinfo=None)
                if start_date > user_subscription.plan_start:
                    user_subscription.plan_start = start_date
                    user_subscription.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
                    user_subscription.plan_end = end_date
                    user_subscription.is_trial = False
                    user.leads_credits = leads_credits if user.leads_credits >= 0 else leads_credits - user.leads_credits
                    user.prospect_credits = prospect_credits
                self.db.flush()
            else:
                self.db.query(UserSubscriptions).where(UserSubscriptions.user_id == user_id,
                                                       UserSubscriptions.status == 'active').update(
                    {"status": "inactive", "updated_at": datetime.now(timezone.utc).replace(tzinfo=None)})
                self.db.flush()
                user_subscription = UserSubscriptions(
                    plan_start=actual_start_date,
                    plan_end=actual_end_date,
                    domains_limit=domains_limit,
                    integrations_limit=integrations_limit,
                    plan_id=plan.id,
                    members_limit=members_limit,
                    status=status,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    user_id=user_id,
                    price_id=price_id,
                    platform_subscription_id=platform_subscription_id,
                    lead_credit_price=lead_credit_price,
                    is_trial=True if stripe_status == 'trialing' else False
                )
                self.db.add(user_subscription)
                self.db.flush()
                self.update_users_domains(user_id, domains_limit)
                self.update_team_members(user.id, members_limit)
                user.leads_credits = leads_credits if user.leads_credits >= 0 else leads_credits - user.leads_credits
                user.prospect_credits = prospect_credits
                user.current_subscription_id = user_subscription.id
                user.is_leads_auto_charging = True
                if user.stripe_payment_url:
                    user.stripe_payment_url = None
                self.db.flush()
            if user.awin_awc:
                if stripe_status == 'trialing':
                    self.trackAwinConversion(user, 0, 'FREE_TRIAL', user_subscription.plan_start.strftime('%Y-%m-%d'), user_subscription.id)
                else:
                    self.trackAwinConversion(user, plan.price, 'SUBSCRIPTION', user_subscription.plan_start.strftime('%Y-%m-%d'), user_subscription.id)

        if status == "canceled" or status == 'inactive':
            self.db.query(UserSubscriptions).filter(
                UserSubscriptions.platform_subscription_id == platform_subscription_id,
                UserSubscriptions.price_id == price_id
            ).update({"status": status})

        user.payment_status = status
        self.db.commit()
        result['status'] = status
        return result

    def get_invitation_limit(self, user_id):
        return len(self.user_persistence_service.get_combined_team_info(user_id=user_id)) + 1

    def check_invitation_limit(self, user_id):
        user_subscription = self.get_user_subscription(user_id)
        if user_subscription:
            subscription_member_limit = user_subscription.members_limit
            user_member_limit = len(self.user_persistence_service.get_combined_team_info(user_id=user_id)) + 1
            if user_member_limit < subscription_member_limit or subscription_member_limit == self.UNLIMITED:
                return True

        return False
