from clickhouse_connect.driver import Client
from db_dependencies import Clickhouse
from persistence.enrichment_users import EnrichmentUsersPersistence
from resolver import injectable
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


@injectable
class ClickHousePersistence:
    def __init__(
        self,
        enrichment_users: EnrichmentUsersPersistence,
        clickhouse: Client = Clickhouse,
    ):
        self.clickhouse = clickhouse
        self.enrichment_users = enrichment_users

    STATE_MAP = {
        "AL": "Alabama",
        "AK": "Alaska",
        "AZ": "Arizona",
        "AR": "Arkansas",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "DE": "Delaware",
        "FL": "Florida",
        "GA": "Georgia",
        "HI": "Hawaii",
        "ID": "Idaho",
        "IL": "Illinois",
        "IN": "Indiana",
        "IA": "Iowa",
        "KS": "Kansas",
        "KY": "Kentucky",
        "LA": "Louisiana",
        "ME": "Maine",
        "MD": "Maryland",
        "MA": "Massachusetts",
        "MI": "Michigan",
        "MN": "Minnesota",
        "MS": "Mississippi",
        "MO": "Missouri",
        "MT": "Montana",
        "NE": "Nebraska",
        "NV": "Nevada",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NM": "New Mexico",
        "NY": "New York",
        "NC": "North Carolina",
        "ND": "North Dakota",
        "OH": "Ohio",
        "OK": "Oklahoma",
        "OR": "Oregon",
        "PA": "Pennsylvania",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "SD": "South Dakota",
        "TN": "Tennessee",
        "TX": "Texas",
        "UT": "Utah",
        "VT": "Vermont",
        "VA": "Virginia",
        "WA": "Washington",
        "WV": "West Virginia",
        "WI": "Wisconsin",
        "WY": "Wyoming",
    }

    def match_leads_with_users(self, emails: List[str]) -> List[Dict[str, Any]]:
        if not emails:
            return []

        try:
            batch_size = 5000
            all_matched_users = []
            total = len(emails)

            logger.info(
                f"Starting email matching for {total} emails (batch size={batch_size})"
            )

            for i in range(0, total, batch_size):
                batch = emails[i : i + batch_size]
                logger.info(
                    f"Processing email batch {i // batch_size + 1}/{(total - 1) // batch_size + 1} ({len(batch)} emails)"
                )

                try:
                    matched_users = (
                        self.enrichment_users.get_user_ids_by_emails(batch)
                    )
                    all_matched_users.extend(matched_users)
                    logger.info(
                        f"  Batch {i // batch_size + 1}: matched {len(matched_users)} users"
                    )
                except Exception as e:
                    logger.error(
                        f"  Error matching batch {i // batch_size + 1}: {e}"
                    )
                    continue

            if not all_matched_users:
                logger.info(
                    f"No users matched for {len(emails)} emails in total"
                )
                return []

            asids = [user.asid for user in all_matched_users if user.asid]
            if not asids:
                logger.info(
                    f"No ASIDs found for {len(all_matched_users)} matched users"
                )
                return []

            logger.info(
                f"Found {len(asids)} ASIDs for {len(emails)} emails total"
            )

            batch_size_asids = 5000
            all_user_data = []

            for i in range(0, len(asids), batch_size_asids):
                batch = asids[i : i + batch_size_asids]
                logger.info(
                    f"Fetching enrichment data batch {i // batch_size_asids + 1} ({len(batch)} ASIDs)"
                )

                user_data = self._get_enrichment_user_data_by_asids(batch)
                all_user_data.extend(user_data)

            formatted_data = self._format_user_data(all_user_data)
            logger.info(f"Formatted {len(formatted_data)} user records")

            return formatted_data

        except Exception as e:
            logger.error(f"Error in match_leads_with_users: {e}")
            return []

    def _get_enrichment_user_data_by_asids(
        self, asids: List[str]
    ) -> List[Dict[str, Any]]:
        if not asids:
            return []

        try:
            batch_size = 5000
            all_user_data = []

            for i in range(0, len(asids), batch_size):
                batch_asids = asids[i : i + batch_size]
                asid_str = ", ".join([f"'{asid}'" for asid in batch_asids])

                query = f"""
                SELECT 
                    asid,
                    first_name,
                    last_name,
                    business_email,
                    personal_email,
                    phone_mobile1,
                    home_city,
                    home_state,
                    gender,
                    age,
                    marital_status,
                    pets,
                    number_of_children
                FROM enrichment_users 
                WHERE asid IN ({asid_str})
                """

                logger.info(
                    f"Executing enrichment data query for batch {i // batch_size + 1}/{(len(asids) - 1) // batch_size + 1} with {len(batch_asids)} ASIDs"
                )

                result = self.clickhouse.query(query)
                logger.info(
                    f"Batch query returned {len(result.result_rows)} rows"
                )

                for row in result.result_rows:
                    try:
                        if isinstance(row, dict):
                            user_record = {
                                "asid": row["asid"],
                                "first_name": row["first_name"],
                                "last_name": row["last_name"],
                                "business_email": row["business_email"],
                                "personal_email": row["personal_email"],
                                "phone_mobile1": row["phone_mobile1"],
                                "home_city": row["home_city"],
                                "home_state": row["home_state"],
                                "gender": row["gender"],
                                "age": row["age"],
                                "marital_status": row["marital_status"],
                                "pets": row["pets"],
                                "number_of_children": row["number_of_children"],
                            }
                        else:
                            user_record = {
                                "asid": row[0],
                                "first_name": row[1],
                                "last_name": row[2],
                                "business_email": row[3],
                                "personal_email": row[4],
                                "phone_mobile1": row[5],
                                "home_city": row[6],
                                "home_state": row[7],
                                "gender": row[8],
                                "age": row[9],
                                "marital_status": row[10],
                                "pets": row[11],
                                "number_of_children": row[12],
                            }

                        all_user_data.append(user_record)

                    except Exception as e:
                        logger.error(f"Error processing row {row}: {e}")
                        continue

            logger.info(
                f"Successfully processed {len(all_user_data)} user records from {len(asids)} ASIDs"
            )
            return all_user_data

        except Exception as e:
            logger.error(f"Error getting enrichment user data by asids: {e}")
            import traceback

            logger.error(traceback.format_exc())
            return []

    def _format_user_data(
        self, user_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        formatted_data = []

        for user in user_data:
            marital_status = self._convert_marital_status(
                user.get("marital_status")
            )

            pets = self._convert_boolean_to_int(user.get("pets"))

            children_present = self._convert_children_present(
                user.get("number_of_children")
            )

            gender = user.get("gender")
            if gender and isinstance(gender, str):
                gender = gender.capitalize()
            else:
                gender = None

            age = self._convert_age(user.get("age"))
            state_full = self._convert_state(user.get("home_state"))

            formatted_user = {
                "ASID": str(user["asid"]),
                "FirstName": user["first_name"],
                "LastName": user["last_name"],
                "BUSINESS_EMAIL": user["business_email"],
                "PERSONAL_EMAIL": user["personal_email"],
                "PhoneMobile1": user["phone_mobile1"],
                "SKINCARE_HOMECITY": user["home_city"],
                "SKINCARE_HOMESTATE": state_full,
                "SKINCARE_GENDER": gender,
                "SKINCARE_AGE": age,
                "SKINCARE_MARITALSTATUS": marital_status,
                "SKINCARE_PETS": pets,
                "SKINCARE_CHILDRENPRESENT": children_present,
                "SKINCARE_SPEND": "Medium",
            }
            formatted_data.append(formatted_user)

        return formatted_data

    def _convert_marital_status(self, status: Optional[str]) -> Optional[str]:
        if not status:
            return None

        status_lower = status.lower().strip()
        if status_lower == "married":
            return "M"
        elif status_lower == "single":
            return "S"
        elif status_lower == "unknown":
            return "U"
        else:
            return status[0].upper() if status else None

    def _convert_boolean_to_int(self, value: Optional[bool]) -> int:
        return 1 if value is True else 0

    def _convert_state(self, state_code: Optional[str]) -> Optional[str]:
        if not state_code:
            return None

        state_code = state_code.strip().upper()
        return self.STATE_MAP.get(state_code, state_code.capitalize())

    def _convert_age(self, age_raw: Any) -> Optional[float]:
        if age_raw is None:
            return None

        if isinstance(age_raw, str):
            age_raw = age_raw.strip()
            if age_raw.lower() == "unknown" or not age_raw:
                return None

            if "-" in age_raw:
                parts = age_raw.split("-")
                try:
                    nums = [int(p) for p in parts if p.strip().isdigit()]
                    if len(nums) == 2:
                        return sum(nums) / 2
                except ValueError:
                    return None

            try:
                return int(age_raw)
            except ValueError:
                return None

        elif isinstance(age_raw, (int, float)):
            return age_raw

        return None

    def _convert_children_present(
        self, number_of_children: Optional[int]
    ) -> int:
        """Преобразует number_of_children в флаг наличия детей (1/0)"""
        return 1 if number_of_children and number_of_children > 0 else 0

    def get_enriched_leads_data(
        self, leads_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        all_emails = set()
        for lead in leads_data:
            for email_data in lead.get("emails", []):
                email = email_data["email"]
                if email and email.strip():
                    all_emails.add(email.strip().lower())

        if not all_emails:
            logger.warning("No emails found in leads data")
            return []

        enriched_data = self.match_leads_with_users(list(all_emails))

        return enriched_data

    def get_user_data_by_asids(self, asids: List[str]) -> List[Dict[str, Any]]:
        if not asids:
            return []

        try:
            user_data = self._get_enrichment_user_data_by_asids(asids)
            formatted_data = self._format_user_data(user_data)
            return formatted_data
        except Exception as e:
            logger.error(f"Error getting user data by ASIDs: {e}")
            return []
