import logging
from utils.strings import normalize_host_raw
from models.users import Users
from models.users_domains import UserDomains
from schemas.account_setup import PotentialTeamMembers
from db_dependencies import Db
from resolver import injectable
from sqlalchemy import exists, func, case, or_
from enums import TeamAccessLevel


logger = logging.getLogger(__name__)


@injectable
class AccountSetupPersistence:
    def __init__(self, db: Db):
        self.db = db

    def _one_per_company_from_query(self, base_query, user_id: int):
        priority = case(((Users.team_access_level == "owner", 1)), else_=2)
        email_host_expr = func.lower(
            func.split_part(func.coalesce(Users.email, ""), "@", 2)
        ).label("email_host")
        rn = (
            func.row_number()
            .over(
                partition_by=func.lower(
                    func.split_part(func.coalesce(Users.email, ""), "@", 2)
                ),
                order_by=(priority, Users.id),
            )
            .label("rn")
        )

        subq = base_query.with_entities(
            Users.full_name.label("full_name"),
            Users.email.label("email"),
            Users.company_name.label("company_name"),
            Users.id.label("id"),
            email_host_expr,
            rn,
        ).subquery()

        rows = (
            self.db.query(
                subq.c.full_name, subq.c.email, subq.c.company_name, subq.c.id
            )
            .filter(subq.c.rn == 1)
            .filter(subq.c.company_name is not None)
            .filter(subq.c.id != user_id)
            .all()
        )

        return [
            PotentialTeamMembers(
                full_name=r.full_name,
                email=r.email,
                company_name=r.company_name,
                id=r.id,
            )
            for r in rows
        ]

    def find_by_email_host(
        self, host: str, user_id: int
    ) -> list[PotentialTeamMembers]:
        host_norm = normalize_host_raw(host)
        if not host_norm:
            return []

        pattern = f"%@{host_norm}%"
        base_q = self.db.query(Users).filter(
            Users.email.ilike(pattern),
            or_(
                Users.team_access_level == "owner",
                Users.team_access_level.is_(None),
            ),
        )
        return self._one_per_company_from_query(base_q, user_id)

    def find_by_users_domains(
        self, host: str, user_id: int
    ) -> list[PotentialTeamMembers]:
        host_norm = normalize_host_raw(host)
        if not host_norm:
            return []

        base_q = (
            self.db.query(Users)
            .join(UserDomains, UserDomains.user_id == Users.id)
            .filter(
                UserDomains.is_pixel_installed == True,
                or_(
                    func.lower(UserDomains.domain) == host_norm,
                    UserDomains.domain.ilike(f"%{host_norm}"),
                ),
                or_(
                    Users.team_access_level == "owner",
                    Users.team_access_level.is_(None),
                ),
            )
        )

        return self._one_per_company_from_query(base_q, user_id)

    def find_by_company_website(
        self, host: str, user_id: int
    ) -> list[PotentialTeamMembers]:
        host_norm = normalize_host_raw(host)
        if not host_norm:
            return []

        base_q = self.db.query(Users).filter(
            or_(
                Users.company_website.ilike(f"%{host_norm}%"),
                func.lower(Users.company_website).ilike(f"%{host_norm}%"),
            ),
            or_(
                Users.team_access_level == "owner",
                Users.team_access_level.is_(None),
            ),
        )
        return self._one_per_company_from_query(base_q, user_id)

    def has_exist_team(self, company_name: str) -> bool:
        return self.db.query(
            exists().where(Users.company_name == company_name)
        ).scalar()
