from decimal import Decimal
from db_dependencies import Db
from enums import UserStatusInAdmin
from models.referral_payouts import ReferralPayouts
from sqlalchemy import func, case, or_, desc, asc, literal
from sqlalchemy.orm import aliased
from models.users import Users
from models.partner import Partner
from models.subscriptions import UserSubscriptions
from models.referral_users import ReferralUser
from datetime import datetime
from constant import COST_CONTACT_ON_BASIC_PLAN

from resolver import injectable


@injectable
class ReferralUserPersistence:
    def __init__(self, db: Db):
        self.db = db

    def calculate_user_status(self):
        return case(
            (
                func.coalesce(Users.is_email_confirmed, False) == False,
                literal("Need confirm email"),
            ),
            (
                func.coalesce(Users.has_credit_card, False) == True,
                literal("Card on"),
            ),
            else_=literal("Signed up"),
        )

    def get_referral_users(
        self,
        user_id,
        search_term,
        start_date,
        end_date,
        offset,
        limit,
        order_by,
        order,
    ):
        order_column = getattr(Users, order_by, Users.id)
        order_direction = (
            asc(order_column) if order == "asc" else desc(order_column)
        )

        MasterPartner = aliased(Partner)

        query = (
            self.db.query(
                Users.id,  # 0
                Users.full_name,  # 1
                Users.email,  # 2
                Users.last_login,  # 3
                ReferralUser.created_at.label("join_date"),  # 4
                func.max(ReferralPayouts.paid_at).label(
                    "last_payment_date"
                ),  # 5
                func.max(ReferralPayouts.created_at).label(
                    "reward_payout_date"
                ),  # 6
                func.max(
                    case(
                        (ReferralPayouts.status == "pending", "pending"),
                        (ReferralPayouts.status == None, "pending"),
                        else_="paid",
                    )
                ).label("reward_status"),  # 7
                Users.overage_leads_count.label("overage_leads_count"),  # 8
                func.max(ReferralPayouts.plan_amount).label("plan_amount"),  # 9
                func.max(UserSubscriptions.status).label(
                    "subscription_status"
                ),  # 10
                self.calculate_user_status().label("status"),  # 11
                func.max(Partner.commission).label("partner_commission"),  # 12
                Partner.is_master.label("partner_is_master"),  # 13
                func.max(MasterPartner.commission).label(
                    "master_commission"
                ),  # 14
            )
            .outerjoin(ReferralUser, ReferralUser.user_id == Users.id)
            .outerjoin(Partner, Partner.user_id == ReferralUser.parent_user_id)
            .outerjoin(MasterPartner, MasterPartner.id == Partner.master_id)
            .outerjoin(ReferralPayouts, ReferralPayouts.user_id == Users.id)
            .outerjoin(
                UserSubscriptions,
                UserSubscriptions.id == Users.current_subscription_id,
            )
            .filter(ReferralUser.parent_user_id == user_id)
            .group_by(
                Users.id,
                Users.full_name,
                Users.email,
                ReferralUser.created_at,
                UserSubscriptions.status,
                Users.is_email_confirmed,
                Users.has_credit_card,
                Partner.is_master,
            )
        )

        if search_term:
            query = query.filter(
                or_(
                    Users.full_name.ilike(search_term),
                    Users.email.ilike(search_term),
                )
            )

        if start_date:
            query = query.filter(ReferralUser.created_at >= start_date)
        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(ReferralUser.created_at <= end_date)

        query = query.order_by(order_direction)

        accounts = query.offset(offset).limit(limit).all()

        results = []

        for account in accounts:
            overage = account[8]
            partner_commission = account[12]
            partner_is_master = account[13]
            master_commission = account[14]

            monthly_spends, commission_amount = (
                self._compute_commission_for_account(
                    overage,
                    partner_commission,
                    partner_is_master,
                    master_commission,
                )
            )

            results.append(
                {
                    "id": account[0],
                    "account_name": account[1],
                    "email": account[2],
                    "last_login": account[3],
                    "join_date": account[4],
                    "last_payment_date": account[5],
                    "reward_payout_date": account[6],
                    "reward_status": account[7].capitalize()
                    if account[7]
                    else "Inactive",
                    "monthly_spends": monthly_spends
                    if monthly_spends
                    else "--",
                    "status": account[11],
                    "commission_rates": commission_amount
                    if commission_amount
                    else "--",
                }
            )

        return results, query.count()

    def _compute_commission_for_account(
        self, overage_leads_count, partner_comm, partner_is_master, master_comm
    ):
        if overage_leads_count is None:
            return None, None

        monthly_spends = overage_leads_count * COST_CONTACT_ON_BASIC_PLAN

        if master_comm and partner_is_master:
            raw_comm = master_comm - partner_comm
        else:
            raw_comm = partner_comm

        raw_comm = raw_comm / Decimal("100")

        commission_amount = monthly_spends * raw_comm

        return monthly_spends, commission_amount

    def is_user_referral(self, user_id: int) -> bool:
        return (
            self.db.query(ReferralUser)
            .filter(
                ReferralUser.user_id == user_id,
            )
            .first()
            is not None
        )

    def verify_user_relationship(self, parent_id: int, user_id: int) -> bool:
        return (
            self.db.query(ReferralUser)
            .filter(
                ReferralUser.parent_user_id == parent_id,
                ReferralUser.user_id == user_id,
            )
            .first()
            is not None
        )
