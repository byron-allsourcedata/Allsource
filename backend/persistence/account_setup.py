import logging
from models.users import Users
from schemas.account_setup import PotentialTeamMembers
from db_dependencies import Db
from resolver import injectable
from sqlalchemy import exists, func, case, or_


logger = logging.getLogger(__name__)


@injectable
class AccountSetupPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_potential_team_members(
        self, company_name: str
    ) -> list[dict[str, str]]:
        pattern = f"%{company_name}%"

        subq = (
            self.db.query(
                Users.full_name.label("full_name"),
                Users.email.label("email"),
            )
            .filter(
                Users.company_name.ilike(pattern),
                Users.team_access_level in ("owner", None),
            )
            .subquery()
        )

        rows = (
            self.db.query(subq.c.full_name, subq.c.email)
            .filter(subq.c.rn == 1)
            .all()
        )

        return [{"full_name": r.full_name, "email": r.email} for r in rows]

    def get_potential_team_members(
        self, company_name: str
    ) -> list[PotentialTeamMembers]:
        pattern = f"%{company_name}%"

        priority = case(((Users.team_access_level == "owner", 1)), else_=2)

        # row_number partitioned by company_name, сортировка по приоритету, затем по id как tie-breaker
        rn = (
            func.row_number()
            .over(
                partition_by=Users.company_name, order_by=(priority, Users.id)
            )
            .label("rn")
        )

        subq = (
            self.db.query(
                Users.full_name.label("full_name"),
                Users.email.label("email"),
                Users.company_name.label("company_name"),
                rn,
            )
            .filter(
                Users.company_name.ilike(pattern),
                or_(
                    Users.team_access_level == "owner",
                    Users.team_access_level.is_(None),
                ),
            )
            .subquery()
        )

        rows = (
            self.db.query(subq.c.full_name, subq.c.email, subq.c.company_name)
            .filter(subq.c.rn == 1)
            .all()
        )

        return [
            PotentialTeamMembers(
                full_name=r.full_name,
                email=r.email,
                company_name=r.company_name,
            )
            for r in rows
        ]

    def has_potential_team_members(self, company_name: str) -> bool:
        pattern = f"%{company_name}%"
        return self.db.query(
            exists().where(Users.company_name.ilike(pattern))
        ).scalar()
