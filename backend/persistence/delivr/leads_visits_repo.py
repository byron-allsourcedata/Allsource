from domains.leads.entities import Visit


class LeadsVisitsRepository:
    def __init__(self, ch_client):
        self.ch = ch_client

    def _build_payload(self, visits: list[Visit]) -> list[dict]:
        payload: list[dict] = []
        for v in visits:
            payload.append(
                {
                    "profile_pid_all": v.profile_pid_all,
                    "pixel_id": v.pixel_id,
                    "visit_id": v.visit_id,
                    "page": v.page,
                    "page_parameters": v.page_parameters,
                    "requested_at": v.requested_at,
                    "spent_time_sec": v.spent_time_sec,
                    "visit_start": v.visit_start,
                    "visit_end": v.visit_end,
                    "behavior_type": v.behavior_type,
                    "ip": v.ip,
                    "pages_count": v.pages_count,
                    "average_time_sec": v.average_time_sec,
                    "full_time_sec": v.full_time_sec,
                    "version": int(v.visit_end.timestamp()),
                }
            )
        return payload

    async def insert_async(self, visits: list[Visit]):
        """
        Insert visits without prior delete. We rely on scheduling (runs at :10 and :40 UTC)
        and slot-based filtering (visit_start within last closed 30-min slot) to avoid duplicates.
        """
        if not visits:
            return
        payload = self._build_payload(visits)
        await self.ch.insert_dicts(
            "allsource_prod.leads_visits",
            payload,
        )
