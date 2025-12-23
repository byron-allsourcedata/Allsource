from domains.leads.entities import LeadUser


class LeadsUsersRepository:
    def __init__(self, ch_client) -> None:
        self.ch = ch_client

    def _build_payload(self, users: list[LeadUser]) -> list[dict]:
        payload: list[dict] = []
        for u in users:
            payload.append(
                {
                    "pixel_id": u.pixel_id,
                    "profile_pid_all": u.profile_pid_all,
                    "company_id": u.company_id,
                    "behavior_type": u.behavior_type,
                    "created_at": u.created_at,
                    "first_visit_id": u.first_visit_id,
                    "is_converted_sales": u.is_converted_sales,
                    "is_returning_visitor": u.is_returning_visitor,
                    "total_visit": u.total_visit,
                    "average_visit_time": u.average_visit_time,
                    "total_visit_time": u.total_visit_time,
                    "is_active": u.is_active,
                    "is_confirmed": u.is_confirmed,
                    "is_checked": u.is_checked,
                    "email_sha256_lc_hem": u.email_sha256_lc_hem,
                    "email_md5_lc_hem": u.email_md5_lc_hem,
                    "updated_at": u.updated_at,
                }
            )
        return payload

    async def insert_async(self, users: list[LeadUser]):
        if not users:
            return
        payload = self._build_payload(users)
        await self.ch.insert_dicts(
            "allsource_prod.leads_users",
            payload,
        )

    async def check_exists_leads_user(
        self,
        users: list[LeadUser],
    ) -> int:
        if not users:
            return 0

        keys: set[tuple[str, str]] = {
            (str(u.pixel_id), u.profile_pid_all) for u in users
        }

        values_sql = ", ".join(
            f"('{pixel_id}', '{profile_pid_all}')"
            for pixel_id, profile_pid_all in keys
        )

        query = f"""
            SELECT
                toString(pixel_id) AS pixel_id,
                profile_pid_all
            FROM allsource_prod.leads_users
            WHERE (pixel_id, profile_pid_all) IN ({values_sql})
        """

        rows = await self.ch.query(query)

        existing: set[tuple[str, str]] = {
            (row["pixel_id"], row["profile_pid_all"]) for row in rows
        }

        new_users = [
            u
            for u in users
            if (str(u.pixel_id), u.profile_pid_all) not in existing
        ]

        return len(new_users)
