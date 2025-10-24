import logging
import time
from typing import Iterable, List
from uuid import UUID


from db_dependencies import Clickhouse
from resolver import injectable
from pydantic import BaseModel, EmailStr


class EmailAsid(BaseModel):
    email: EmailStr | None
    asid: str


logger = logging.getLogger(__name__)


@injectable
class EnrichmentUsersPersistence:
    def __init__(self, clickhouse: Clickhouse):
        self.clickhouse = clickhouse

    def _run_query(
        self,
        sql: str,
        params: dict | None = None,
    ):
        result = self.clickhouse.query(sql, params)
        return result.result_rows if hasattr(result, "result_rows") else result

    def count(self):
        result = self.clickhouse.query("SELECT count() FROM enrichment_users")
        (count,) = result.first_row
        return count

    def __normalize_and_filter_asids(self, asids: Iterable) -> List[str]:
        seen = set()
        out = []
        for a in asids:
            if a is None:
                continue
            s = str(a).strip("{}").strip().lower()
            if not s:
                continue
            try:
                u = UUID(s)
                canon = str(u)
            except (ValueError, TypeError):
                continue

            if canon not in seen:
                seen.add(canon)
                out.append(canon)
        return out

    def fetch_enrichment_user_ids(self, asids: List[UUID]) -> List[UUID]:
        if not asids:
            return []

        sql = "SELECT asid FROM enrichment_users WHERE asid IN %(ids)s"

        self.clickhouse.command("SET max_query_size = 104857600")
        result = self.clickhouse.query(sql, {"ids": [str(a) for a in asids]})

        found = [row[0] for row in result.result_rows]
        logger.info(f"enrichment user ids rows: {len(found)}")
        return found

    def get_user_ids_by_asids(self, asids: list[str]) -> List[EmailAsid]:
        asids_clean = self.__normalize_and_filter_asids(asids)
        if not asids_clean:
            logger.debug("get_user_ids_by_asids: empty input")
            return []

        matched: dict[str, EmailAsid] = {}
        start_time = time.perf_counter()

        sql = """
            SELECT asid, business_email, personal_email, other_emails
            FROM enrichment_users
            WHERE asid IN %(ids)s
        """
        rows = self._run_query(sql, {"ids": asids_clean})
        elapsed = time.perf_counter() - start_time
        logger.info(
            "ASID query returned %d rows in %.4f seconds", len(rows), elapsed
        )

        for row in rows:
            if isinstance(row, dict):
                asid = row.get("asid")
                biz = row.get("business_email")
                pers = row.get("personal_email")
                other = row.get("other_emails")
            else:
                asid, biz, pers, other = row

            if asid is None:
                continue
            asid_s = str(asid)

            preferred = None
            for candidate in (biz, pers):
                if (
                    candidate
                    and isinstance(candidate, str)
                    and "@" in candidate
                ):
                    preferred = candidate.strip().lower()
                    break

            if not preferred and other:
                if isinstance(other, (list, tuple)) and len(other) > 0:
                    c = other[0]
                    if c and isinstance(c, str) and "@" in c:
                        preferred = c.strip().lower()
                else:
                    if isinstance(other, str) and "@" in other:
                        preferred = other.strip().lower()

            try:
                matched[asid_s] = EmailAsid(email=preferred, asid=asid_s)
            except Exception as e:
                logger.error(
                    "Error creating EmailAsid for asid %s: %s", asid_s, e
                )
                matched[asid_s] = EmailAsid(email=None, asid=asid_s)
        result = list(matched.values())
        logger.info(
            "Finished ASID matching: %d matches (from %d input).",
            len(result),
            len(asids_clean),
        )
        return result

    def get_user_ids_by_emails(
        self,
        emails: list[str],
    ) -> List[EmailAsid]:
        logger.info(f"=== START get_user_ids_by_emails ===")
        logger.info(f"Input emails count: {len(emails)}")
        logger.info(f"Input emails (first 10): {emails[:10]}")

        emails_clean: List[str] = [
            e.strip().lower() for e in emails if e and "@" in e
        ]
        logger.info(f"Cleaned emails count: {len(emails_clean)}")
        logger.info(f"Cleaned emails (first 10): {emails_clean[:10]}")

        if not emails_clean:
            logger.debug("get_user_ids_by_emails: empty input")
            return []

        matched: dict[str, EmailAsid] = {}

        count_business = 0
        count_personal = 0
        count_other = 0

        # --- Business email
        logger.info("--- Business Email Query ---")
        sql_business = """
            SELECT business_email, asid
            FROM enrichment_users
            WHERE business_email IN %(ids)s
        """
        logger.info(f"Business SQL: {sql_business}")
        logger.info(f"Business params: {emails_clean[:5]}...")  # первые 5 email

        start_time = time.perf_counter()
        try:
            rows = self._run_query(sql_business, {"ids": emails_clean})
            logger.info(f"Business query raw result type: {type(rows)}")
            logger.info(f"Business query raw result: {rows}")
        except Exception as e:
            logger.error(f"Business query error: {e}")
            rows = []

        elapsed = time.perf_counter() - start_time
        logger.info(
            "Business email query returned %d rows in %.4f seconds",
            len(rows),
            elapsed,
        )

        for i, row in enumerate(rows):
            logger.info(f"Business row {i}: {row}")
            if isinstance(row, dict):
                email = row.get("business_email")
                asid = row.get("asid")
            else:
                email, asid = row

            logger.info(f"  Processing: email='{email}', asid='{asid}'")

            if not email or not isinstance(email, str):
                logger.info(f"  Skipping - invalid email: {email}")
                continue

            email_l = email.strip().lower()
            logger.info(f"  Normalized email: '{email_l}'")

            if email_l not in matched:
                try:
                    matched[email_l] = EmailAsid(email=email_l, asid=str(asid))
                    count_business += 1
                    logger.info(f"  ✓ Added to matched: {email_l}")
                except Exception as e:
                    logger.error(
                        f"  Error validating EmailAsid for {email}: {e}"
                    )
                    continue
            else:
                logger.info(f"  Already matched: {email_l}")

        logger.info(
            f"After business query - matched: {len(matched)}, remaining: {len(emails_clean) - len(matched)}"
        )
        remaining = [e for e in emails_clean if e not in matched]
        logger.info(f"Remaining emails (first 5): {remaining[:5]}")

        # --- Personal email
        if remaining:
            logger.info("--- Personal Email Query ---")
            sql_personal = """
                SELECT personal_email, asid
                FROM enrichment_users
                WHERE personal_email IN %(ids)s
            """
            logger.info(f"Personal SQL: {sql_personal}")
            logger.info(f"Personal params: {remaining[:5]}...")

            start_time = time.perf_counter()
            try:
                rows = self._run_query(sql_personal, {"ids": remaining})
                logger.info(f"Personal query raw result type: {type(rows)}")
                logger.info(f"Personal query raw result: {rows}")
            except Exception as e:
                logger.error(f"Personal query error: {e}")
                rows = []

            elapsed = time.perf_counter() - start_time
            logger.info(
                "Personal email query returned %d rows in %.4f seconds",
                len(rows),
                elapsed,
            )

            for i, row in enumerate(rows):
                logger.info(f"Personal row {i}: {row}")
                if isinstance(row, dict):
                    email = row.get("personal_email")
                    asid = row.get("asid")
                else:
                    email, asid = row

                logger.info(f"  Processing: email='{email}', asid='{asid}'")

                if not email or not isinstance(email, str):
                    logger.info(f"  Skipping - invalid email: {email}")
                    continue

                email_l = email.strip().lower()
                logger.info(f"  Normalized email: '{email_l}'")

                if email_l not in matched:
                    try:
                        email_asid_pair = EmailAsid(
                            email=email_l, asid=str(asid)
                        )
                        matched[email_l] = email_asid_pair
                        count_personal += 1
                        logger.info(f"  ✓ Added to matched: {email_l}")
                    except Exception as e:
                        logger.error(
                            f"Error creating EmailAsid object for {email}: {e}",
                        )
                        continue
                else:
                    logger.info(f"  Already matched: {email_l}")

            logger.info(
                f"After personal query - matched: {len(matched)}, remaining: {len(remaining) - (count_personal)}"
            )
            remaining = [e for e in remaining if e not in matched]
            logger.info(f"Remaining emails (first 5): {remaining[:5]}")

        # --- Other emails (array)
        if remaining:
            logger.info("--- Other Emails Query ---")
            sql_other = """
                SELECT other_email, asid
                FROM (
                    SELECT arrayJoin(other_emails) AS other_email, asid
                    FROM enrichment_users
                )
                WHERE other_email IN %(ids)s
            """
            logger.info(f"Other SQL: {sql_other}")
            logger.info(f"Other params: {remaining[:5]}...")

            start_time = time.perf_counter()
            try:
                rows = self._run_query(sql_other, {"ids": remaining})
                logger.info(f"Other query raw result type: {type(rows)}")
                logger.info(f"Other query raw result: {rows}")
            except Exception as e:
                logger.error(f"Other query error: {e}")
                rows = []

            elapsed = time.perf_counter() - start_time
            logger.info(
                "Other email query returned %d rows in %.4f seconds",
                len(rows),
                elapsed,
            )

            for i, row in enumerate(rows):
                logger.info(f"Other row {i}: {row}")
                if isinstance(row, dict):
                    email = row.get("other_email")
                    asid = row.get("asid")
                else:
                    email, asid = row

                logger.info(f"  Processing: email='{email}', asid='{asid}'")

                if not email or not isinstance(email, str):
                    logger.info(f"  Skipping - invalid email: {email}")
                    continue

                email_l = email.strip().lower()
                logger.info(f"  Normalized email: '{email_l}'")

                if email_l not in matched:
                    try:
                        email_asid_pair = EmailAsid(
                            email=email_l, asid=str(asid)
                        )
                        matched[email_l] = email_asid_pair
                        count_other += 1
                        logger.info(f"  ✓ Added to matched: {email_l}")
                    except Exception as e:
                        logger.error(
                            f"Error creating EmailAsid object for {email}: {e}",
                        )
                        continue
                else:
                    logger.info(f"  Already matched: {email_l}")

        result = list(matched.values())

        logger.info("=== FINISHED email matching ===")
        logger.info(
            "Total matches: %d (from %d input emails)",
            len(result),
            len(emails_clean),
        )
        logger.info(
            "Breakdown - Business: %d, Personal: %d, Other: %d",
            count_business,
            count_personal,
            count_other,
        )
        logger.info(
            f"Matched emails (first 10): {[r.email for r in result[:10]]}"
        )
        logger.info("=== END get_user_ids_by_emails ===")

        return result

    def delete_asids_by_emails(self, emails: list[str]) -> None:
        emails = [
            email.strip().lower() for email in emails if email and "@" in email
        ]
        if not emails:
            logger.warning("No valid emails provided for deletion")
            return

        result = self.get_user_ids_by_emails(emails=emails)
        if not result:
            logger.info(
                f"No enrichment_users records found for emails: {emails}"
            )
            return

        asids = [res.asid for res in result]
        logger.info(
            f"Deleting {len(asids)} enrichment_users records for emails: {emails}"
        )

        sql_delete = """
            ALTER TABLE enrichment_users
            DELETE WHERE asid IN %(asids)s
        """

        self._run_query(sql_delete, {"asids": asids})
        logger.info(f"Deleted enrichment_users records for emails: {emails}")

    def get_emails_by_asids(self, asids: list[str]) -> dict[str, str | None]:
        """
        Returns a dict { asid: email | None } with priority:
        personal_email > business_email > any(other_emails)
        """
        if not asids:
            return {}

        query = """
            SELECT
                asid,
                coalesce(
                    personal_email,
                    business_email,
                    arrayElement(other_emails, 1)
                ) AS email
            FROM enrichment_users
            WHERE asid IN %(asids)s
        """
        rows = self._run_query(query, {"asids": asids})
        return {r[0]: (r[1] if r[1] is not None else None) for r in rows}
