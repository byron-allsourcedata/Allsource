from typing import List, Any, Dict
import logging
import snowflake.connector
from config.util import getenv

logger = logging.getLogger(__name__)


class SnowflakePersistence:
    # def __init__(self):
    #     self.user = getenv("SNOWFLAKE_USER")
    #     self.password = getenv("SNOWFLAKE_PASSWORD")
    #     self.account = getenv("SNOWFLAKE_ACCOUNT")
    #     self.database = getenv("SNOWFLAKE_DATABASE")
    #     self.schema = getenv("SNOWFLAKE_SCHEMA")
    #     self.warehouse = getenv("SNOWFLAKE_WAREHOUSE")
    #
    # def get_connection(self):
    #     return snowflake.connector.connect(
    #         user=self.user,
    #         password=self.password,
    #         account=self.account,
    #         warehouse=self.warehouse,
    #         database=self.database,
    #         schema=self.schema,
    #     )

    # def fetch_segment(self, segment: str):
    #     table = "SIL_ALLFORCE_MERCHANT_SHARE_20251013_SV"
    #     query = f"""
    #         SELECT *
    #         FROM "{self.database}"."{self.schema}"."{table}"
    #         WHERE SEGMENT = %s
    #     """
    #     conn = self.get_connection()
    #     cur = conn.cursor()
    #     cur.execute(query, (segment,))
    #     result = cur.fetchall()
    #     cur.close()
    #     conn.close()
    #     return result

    async def fetch_weekly_data(self, days: int = 7) -> List[Dict[str, Any]]:
        """Получаем данные из Snowflake за указанное количество дней"""
        # TODO: Реализовать получение данных из Snowflake
        logger.info(f"Fetching Snowflake data for last {days} days")

        # Заглушка - возвращаем пустой список
        # В реальности здесь будет запрос к Snowflake
        return []
