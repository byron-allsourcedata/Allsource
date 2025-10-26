from typing import List, Any, Dict
import logging
import snowflake.connector
from config.util import getenv
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class SnowflakePersistence:
    def __init__(self, clickhouse_persistence):
        self.user = getenv("SNOWFLAKE_USER")
        self.password = getenv("SNOWFLAKE_PASSWORD")
        self.account = getenv("SNOWFLAKE_ACCOUNT")
        self.database = getenv("SNOWFLAKE_DATABASE")
        self.schema = getenv("SNOWFLAKE_SCHEMA")
        self.table = getenv("SNOWFLAKE_TABLE")
        self.warehouse = getenv("SNOWFLAKE_WAREHOUSE")
        self.role = getenv("SNOWFLAKE_ROLE")
        self.clickhouse_persistence = clickhouse_persistence

    def get_connection(self):
        return snowflake.connector.connect(
            user=self.user,
            password=self.password,
            account=self.account,
            database=self.database,
            schema=self.schema,
            warehouse=self.warehouse,
            role=self.role,
            authenticator="snowflake",
            application="LiveRamp_Data_Processor",
            session_parameters={
                "QUERY_TAG": "LiveRamp_Weekly_Report",
            },
        )

    async def get_snowflake_data(self) -> List[Dict[str, Any]]:
        try:
            logger.info(f"Fetching Snowflake data from table: {self.table}")

            raw_data = self._fetch_snowflake_data()
            if not raw_data:
                logger.info("No data found in Snowflake")
                return []

            asids = [row["ASID"] for row in raw_data if row.get("ASID")]
            logger.info(f"Found {len(asids)} unique ASIDs in Snowflake data")

            enriched_data = self._enrich_with_clickhouse_data(asids, raw_data)

            logger.info(
                f"Successfully processed {len(enriched_data)} Snowflake records"
            )
            return enriched_data

        except Exception as e:
            logger.error(f"Error fetching Snowflake data: {e}")
            return []

    def _fetch_snowflake_data(self) -> List[Dict[str, Any]]:
        try:
            query = f"""
                SELECT 
                    ASID,
                    FREQUENCY,
                    PURCHASEAMOUNT,
                    SEGMENT,
                    SEGMENT_GROUP
                FROM "{self.database}"."{self.schema}"."{self.table}"
                WHERE SEGMENT = 'BEAUTY_ENTHUSIASTS'
            """

            conn = self.get_connection()
            cur = conn.cursor()

            logger.info(f"Executing Snowflake query")
            cur.execute(query)

            columns = [col[0] for col in cur.description]
            rows = cur.fetchall()

            result = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                result.append(row_dict)

            cur.close()
            conn.close()

            logger.info(f"Retrieved {len(result)} rows from Snowflake")
            return result

        except Exception as e:
            logger.error(f"Error executing Snowflake query: {e}")
            return []

    def _enrich_with_clickhouse_data(
        self, asids: List[str], snowflake_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        try:
            if not self.clickhouse_persistence:
                logger.error("ClickHouse persistence not available")
                return []

            if not asids:
                return []

            batch_size = 5000
            clickhouse_data_all = []

            for i in range(0, len(asids), batch_size):
                batch = asids[i : i + batch_size]
                logger.info(
                    f"Fetching ClickHouse data for batch {i // batch_size + 1} ({len(batch)} ASIDs)..."
                )

                batch_data = self.clickhouse_persistence.get_user_data_by_asids(
                    batch
                )
                clickhouse_data_all.extend(batch_data)

            if not clickhouse_data_all:
                logger.warning("No ClickHouse data found for Snowflake ASIDs")
                return []

            clickhouse_map = {
                data["ASID"].strip().lower(): data
                for data in clickhouse_data_all
                if data.get("ASID")
            }

            enriched_data = []
            for snowflake_row in snowflake_data:
                asid = snowflake_row.get("ASID")
                if asid and asid.strip().lower() in clickhouse_map:
                    enriched_record = self._merge_snowflake_clickhouse_data(
                        snowflake_row, clickhouse_map[asid.strip().lower()]
                    )
                    enriched_data.append(enriched_record)

            logger.info(
                f"Matched {len(enriched_data)}/{len(snowflake_data)} Snowflake records with ClickHouse data"
            )
            return enriched_data

        except Exception as e:
            logger.error(f"Error enriching Snowflake data with ClickHouse: {e}")
            return []

    def _merge_snowflake_clickhouse_data(
        self, snowflake_row: Dict[str, Any], clickhouse_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        purchase_amount = snowflake_row.get("PURCHASEAMOUNT", 0)
        spend = self._calculate_spend(purchase_amount)

        merged_data = {
            "ASID": clickhouse_data.get("ASID", ""),
            "FirstName": clickhouse_data.get("FirstName", ""),
            "LastName": clickhouse_data.get("LastName", ""),
            "BUSINESS_EMAIL": clickhouse_data.get("BUSINESS_EMAIL", ""),
            "PERSONAL_EMAIL": clickhouse_data.get("PERSONAL_EMAIL", ""),
            "PhoneMobile1": clickhouse_data.get("PhoneMobile1", ""),
            "HomeCity": clickhouse_data.get("HomeCity", ""),
            "HomeState": clickhouse_data.get("HomeState", ""),
            "Gender": clickhouse_data.get("Gender", ""),
            "Age": clickhouse_data.get("Age", ""),
            "MaritalStatus": clickhouse_data.get("MaritalStatus", ""),
            "Pets": clickhouse_data.get("Pets", 0),
            "ChildrenPresent": clickhouse_data.get("ChildrenPresent", ""),
            "Spend": spend,
        }

        return merged_data

    def _calculate_spend(self, purchase_amount: Any) -> str:
        try:
            if purchase_amount is None:
                return "Medium"

            amount = float(purchase_amount)

            if amount >= 100:
                return "High"
            else:
                return "Medium"

        except (ValueError, TypeError):
            logger.warning(f"Invalid purchase amount: {purchase_amount}")
            return "Medium"
