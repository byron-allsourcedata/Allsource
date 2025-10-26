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

    def match_leads_with_users(self, emails: List[str]) -> List[Dict[str, Any]]:
        if not emails:
            return []

        try:
            matched_users = self.enrichment_users.get_user_ids_by_emails(emails)
            asids = [user.asid for user in matched_users if user.asid]

            if not asids:
                logger.info(f"No ASIDs found for {len(emails)} emails")
                return []

            logger.info(f"Found {len(asids)} ASIDs for {len(emails)} emails")

            user_data = self._get_enrichment_user_data_by_asids(asids)

            formatted_data = self._format_user_data(user_data)
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
            asid_str = ", ".join([f"'{asid}'" for asid in asids])

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
                f"Executing enrichment data query for {len(asids)} ASIDs"
            )

            result = self.clickhouse.query(query)
            logger.info(
                f"Enrichment data query returned {len(result.result_rows)} rows"
            )

            user_data = []
            for i, row in enumerate(result.result_rows):
                try:
                    logger.debug(f"Processing row {i}: {row}")

                    if isinstance(row, dict):
                        # If this dict - by key
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
                        # If this tuple - by index(need rewrite)
                        user_record = {
                            "asid": row[0],  # asid
                            "first_name": row[1],  # first_name
                            "last_name": row[2],  # last_name
                            "business_email": row[3],  # business_email
                            "personal_email": row[4],  # personal_email
                            "phone_mobile1": row[5],  # phone_mobile1
                            "home_city": row[6],  # home_city
                            "home_state": row[7],  # home_state
                            "gender": row[8],  # gender
                            "age": row[9],  # age
                            "marital_status": row[10],  # marital_status
                            "pets": row[11],  # pets
                            "number_of_children": row[12],  # number_of_children
                        }

                    user_data.append(user_record)
                    logger.debug(f"Successfully processed row {i}")

                except Exception as e:
                    logger.error(f"Error processing row {i} ({row}): {e}")
                    continue

            logger.info(f"Successfully processed {len(user_data)} user records")
            return user_data

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

            formatted_user = {
                "ASID": str(user["asid"]),
                "FirstName": user["first_name"],
                "LastName": user["last_name"],
                "BUSINESS_EMAIL": user["business_email"],
                "PERSONAL_EMAIL": user["personal_email"],
                "PhoneMobile1": user["phone_mobile1"],
                "HomeCity": user["home_city"],
                "HomeState": user["home_state"],
                "Gender": gender,
                "Age": user["age"],
                "MaritalStatus": marital_status,
                "Pets": pets,
                "ChildrenPresent": children_present,
                "Spend": "Medium",
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
