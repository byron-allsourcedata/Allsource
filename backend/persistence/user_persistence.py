import json
import logging
from datetime import datetime, timedelta
from urllib.parse import uses_query

from sqlalchemy import func, desc, asc, case
from sqlalchemy.orm import Session, aliased

from enums import TeamsInvitationStatus, SignUpStatus
from models.partner import Partner
from models.referral_payouts import ReferralPayouts
from models.referral_users import ReferralUser
from models.teams_invitations import TeamInvitation
from models.users import Users
from models.users_domains import UserDomains
from models.audience_sources import AudienceSource

logger = logging.getLogger(__name__)


class UserPersistence:
    UNLIMITED_CREDITS = -1

    def __init__(self, db: Session):
        self.db = db

    def set_reset_password_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.reset_password_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()

    def save_user_domain(self, user_id: int, domain: str):
        user_domain = self.db.query(UserDomains).filter(UserDomains.domain == domain,
                                                        UserDomains.user_id == user_id).first()
        if user_domain:
            return user_domain
        user_domain = UserDomains(user_id=user_id, domain=domain.replace('https://', '').replace('http://', ''))
        self.db.add(user_domain)
        self.db.commit()
        return user_domain

    def charge_credit(self, user_id: int):
        user = self.db.query(Users).filter(Users.id == user_id).first()

        if user and user.leads_credits != self.UNLIMITED_CREDITS:
            user.leads_credits = user.leads_credits - 1
            self.db.commit()

    def get_team_members(self, user_id: int):
        users = self.db.query(Users).filter(Users.team_owner_id == user_id).all()
        return users

    def get_combined_team_info(self, user_id: int):
        users = self.db.query(Users).filter(Users.team_owner_id == user_id).all()
        invitations = self.db.query(TeamInvitation).filter(TeamInvitation.team_owner_id == user_id).all()
        combined_info = users + invitations
        return combined_info

    def set_verified_email_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.verified_email_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()

    def get_user_by_email(self, email: str):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object

    def check_status_invitations(self, admin_token, user_mail):
        result = {
            'success': False
        }
        teams_invitation = self.db.query(TeamInvitation).filter(TeamInvitation.token == admin_token).first()
        if teams_invitation:
            if teams_invitation.mail != user_mail:
                result['error'] = SignUpStatus.NOT_VALID_EMAIL
            if teams_invitation.status == TeamsInvitationStatus.PENDING.value:
                result['success'] = True
                result['team_owner_id'] = teams_invitation.team_owner_id
        else:
            result['error'] = SignUpStatus.TEAM_INVITATION_INVALID
        return result

    def get_user_by_id(self, user_id, result_as_object=False):
        user, partner_is_active = self.db.query(Users, Partner.is_active) \
            .filter(Users.id == user_id) \
            .outerjoin(Partner, Partner.user_id == user_id) \
            .first()
        result_user = None
        if user:
            result_user = {
                "id": user.id,
                "email": user.email,
                "password": user.password,
                "is_email_confirmed": user.is_email_confirmed,
                "is_with_card": user.is_with_card,
                "is_company_details_filled": user.is_company_details_filled,
                "is_partner": user.is_partner,
                "business_type": user.business_type,
                "full_name": user.full_name,
                "team_owner_id": user.team_owner_id,
                "image": user.image,
                "company_name": user.company_name,
                "company_website": user.company_website,
                "company_email_address": user.company_email_address,
                "employees_workers": user.employees_workers,
                "created_at": user.created_at,
                "last_login": user.last_login,
                "customer_id": user.customer_id,
                "reset_password_sent_at": user.reset_password_sent_at,
                'pixel_code_sent_at': user.pixel_code_sent_at,
                "verified_email_sent_at": user.verified_email_sent_at,
                "is_book_call_passed": user.is_book_call_passed,
                "stripe_payment_url": user.stripe_payment_url,
                'role': user.role,
                'calendly_uuid': user.calendly_uuid,
                'calendly_invitee_uuid': user.calendly_invitee_uuid,
                'activate_steps_percent': user.activate_steps_percent,
                'leads_credits': user.leads_credits,
                'prospect_credits': user.prospect_credits,
                'is_leads_auto_charging': user.is_leads_auto_charging,
                'team_access_level': user.team_access_level,
                'current_subscription_id': user.current_subscription_id,
                'awin_awc': user.awin_awc,
                'source_platform': user.source_platform,
                'shop_domain': user.shop_domain,
                'shopify_token': user.shopify_token,
                'connected_stripe_account_id': user.connected_stripe_account_id,
                'utm_params': user.utm_params,
                'is_stripe_connected': user.is_stripe_connected,
                'stripe_connected_email': user.stripe_connected_email,
                'stripe_connected_currently_due': user.stripe_connected_currently_due,
                'partner_is_active': partner_is_active
            }
        self.db.rollback()
        if result_as_object:
            return user
        return result_user

    def set_last_signed_in(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        user.last_signed_in = datetime.now()
        self.db.commit()

    def get_user_team_member_by_id(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        result_user = None
        if user:
            result_user = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                'team_access_level': user.team_access_level,
                'is_email_confirmed': user.is_email_confirmed,
                'change_email_sent_at': user.change_email_sent_at,
                'team_owner_id': user.team_owner_id,
                'password': user.password,
                'source_platform': user.source_platform
            }
        self.db.rollback()
        return result_user

    def update_teams_owner_id(self, user_id, teams_token, owner_id):
        teams_invitation = self.db.query(TeamInvitation).filter(
            TeamInvitation.token == teams_token
        ).first()
        user_data = self.db.query(Users).filter(Users.id == user_id).first()
        user_data.team_owner_id = owner_id
        user_data.is_email_confirmed = True
        user_data.team_access_level = teams_invitation.access_level
        user_data.invited_by_id = teams_invitation.invited_by_id
        user_data.added_on = datetime.now()
        self.db.flush()
        self.db.delete(teams_invitation)
        self.db.commit()

    def email_confirmed(self, user_id: int):
        query = self.db.query(Users).filter(Users.id == user_id)
        if query:
            self.db.query(Users).filter(Users.id == user_id).update({"is_email_confirmed": True})
            self.db.commit()

    def book_call_confirmed(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update({Users.is_book_call_passed: True},
                                                                synchronize_session=False)
        self.db.commit()

    def set_partner_role(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update({Users.is_partner: True},
                                                                synchronize_session=False)
        self.db.commit()

    def update_password(self, user_id: int, password: str):
        self.db.query(Users).filter(Users.id == user_id).update({Users.password: password},
                                                                synchronize_session=False)
        self.db.commit()

    def update_calendly_uuid(self, user_id: int, uuid: str, invitees: str):
        self.db.query(Users).filter(Users.id == user_id).update(
            {
                Users.calendly_uuid: uuid,
                Users.calendly_invitee_uuid: invitees
            },
            synchronize_session=False
        )
        self.db.commit()

    def get_users(self):
        users = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            Users.is_with_card,
            Users.company_name,
            Users.is_email_confirmed,
            Users.is_book_call_passed,
            Users.stripe_payment_url
        ).all()

        return [
            {
                "id": user[0],
                "email": user[1],
                "full_name": user[2],
                "created_at": user[3],
                "is_with_card": user[4],
                "company_name": user[5],
                "is_email_confirmed": user[6],
                "is_book_call_passed": user[7],
                "stripe_payment_url": user[8]
            }
            for user in users
        ]

    def get_admin_users(self, page, per_page):
        Inviter = aliased(Users)
        query = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            Users.last_login,
            Inviter.email.label("invited_by_email"),
            Users.role
        ) .outerjoin(Inviter, Users.invited_by_id == Inviter.id)\
            .filter(Users.role.contains(['admin']))
        total_count = query.count()
        users = query.order_by(desc(Users.id)).offset((page - 1) * per_page).limit(per_page).all()
        return users, total_count

    def get_customer_users(self, page, per_page):
        query = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            Users.last_login,
            Users.role,
            func.count(
                case(
                    (UserDomains.is_pixel_installed == True, 1)
                )
            ).label('pixel_installed_count')
        ) \
        .outerjoin(UserDomains, UserDomains.user_id == Users.id)\
        .filter(Users.role.contains(['customer']))\
        .group_by(Users.id)
        total_count = query.count()
        users = query.order_by(desc(Users.id)).offset((page - 1) * per_page).limit(per_page).all()
        return users, total_count

    def get_not_partner_users(self, page, per_page):
        query = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            Users.is_with_card,
            Users.company_name,
            Users.is_email_confirmed,
            Users.is_book_call_passed,
            Users.stripe_payment_url
        ).filter(Users.is_partner == False)
        total_count = query.count()
        users = query.order_by(desc(Users.id)).offset((page - 1) * per_page).limit(per_page).all()
        users_dict = [
            dict(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at,
                is_with_card=user.is_with_card,
                company_name=user.company_name,
                is_email_confirmed=user.is_email_confirmed,
                is_book_call_passed=user.is_book_call_passed,
                stripe_payment_url=user.stripe_payment_url
            )
            for user in users
        ]
        return users_dict, total_count

    def add_stripe_account(self, user_id: int, stripe_connected_account_id: str):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.connected_stripe_account_id: stripe_connected_account_id},
            synchronize_session=False
        )
        self.db.commit()

    def confirm_stripe_connect(self, user_id: int):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        if not user:
            return False

        user.is_stripe_connected = True
        user.stripe_connected_currently_due = None

        if user.is_partner:
            partner = self.db.query(Partner).filter(Partner.user_id == user_id).first()
            if partner:
                partner.status = "active"

        self.db.commit()
        return True

    def update_stripe_info(self, user_id: int, email: str = None, currently_due: list = None):
        update_data = {}
        if email:
            update_data[Users.stripe_connected_email] = email
        if currently_due:
            update_data[Users.stripe_connected_currently_due] = currently_due

        if update_data:
            self.db.query(Users).filter(Users.id == user_id).update(update_data, synchronize_session=False)
            self.db.commit()

    def delete_stripe_info(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.connected_stripe_account_id: None,
             Users.is_stripe_connected: False,
             Users.stripe_connected_currently_due: None,
             Users.stripe_connected_email: None},
            synchronize_session=False
        )
        self.db.commit()

    def get_accounts(self, search_term, start_date, end_date, offset, limit, order_by, order):
        parent_users = aliased(Users)

        order_column = getattr(Users, order_by, Users.id)
        order_direction = asc(order_column) if order == "asc" else desc(order_column)

        query = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            ReferralPayouts.plan_amount,
            ReferralPayouts.status,
            ReferralPayouts.paid_at,
            Users.is_email_confirmed,
            Users.is_stripe_connected,
            ReferralUser.referral_program_type,
            parent_users.company_name.label("parent_company"),
            ReferralUser.parent_user_id,
            ReferralPayouts.status,
            ReferralPayouts.created_at,
            Users.source_platform,
            Users.utm_params
        ).outerjoin(ReferralPayouts, Users.id == ReferralPayouts.user_id
                    ).outerjoin(ReferralUser, Users.id == ReferralUser.user_id
                                ).outerjoin(parent_users, ReferralUser.parent_user_id == parent_users.id
                                            ).filter(Users.is_partner == False,
                                                     (Users.role == None) | ~Users.role.any('admin'))

        if search_term:
            query = query.filter(
                (Users.full_name.ilike(search_term)) | (Users.email.ilike(search_term))
            )

        if start_date:
            query = query.filter(Users.created_at >= start_date)
        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Users.created_at <= end_date)

        query = query.order_by(order_direction)

        accounts = query.offset(offset).limit(limit).all()

        def parse_utm_source(utm_params):
            try:
                utm_data = json.loads(utm_params) if utm_params else {}
                return utm_data.get("utm_source", "Other").capitalize()
            except json.JSONDecodeError:
                return "Other"

        return [
            {
                "id": account[0],
                "email": account[1],
                "full_name": account[2],
                "created_at": account[3],
                "plan_amount": account[4] if account[4] else "--",
                "status": (
                    "Signup" if account[7] and not account[8] else
                    "Active" if account[7] and account[8] else
                    "Inactive"
                ),
                "sources": (
                    f"{account[9].capitalize()}({account[10]})" if account[9] and account[10] else
                    account[14] if account[14] else
                    parse_utm_source(account[15])
                ),
                "reward_status": account[5].capitalize() if account[5] else "Inactive",
                "will_pay": True if account[12] else False,
                "paid_at": False if account[6] else True,
                "reward_payout_date": account[6] if account[6] else (
                            datetime.now().replace(day=1) + timedelta(days=32)).replace(day=1).strftime('%Y-%m-%d'),
                "last_payment_date": account[13],
            }
            for account in accounts
        ], query.count()

    def has_sources_for_user(self, user_id: int) -> bool:
        return self.db.query(AudienceSource).filter(AudienceSource.user_id == user_id).first() is not None