import asyncio
import io

import aioboto3
import pandas as pd
from resolver import injectable
from config.util import getenv
from datetime import datetime, timedelta, timezone


@injectable
class DelivrPersistence:
    def __init__(self):
        self.bucket = getenv("DELIVR_BUCKET_NAME")
        self.aws_access_key = getenv("DELIVR_AWS_ACCESS_KEY_ID")
        self.aws_secret_key = getenv("DELIVR_AWS_SECRET_ACCESS_KEY")
        self.region = getenv("DELIVR_AWS_REGION")

    async def fetch_weekly_parquet(
        self, end_date: datetime | None = None, days: int = 7
    ) -> pd.DataFrame:
        end_date = end_date or datetime.now(timezone.utc)
        result = []

        session = aioboto3.Session()
        async with session.client(
            "s3",
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.region,
        ) as s3:
            tasks = []
            for i in range(days):
                day = (end_date - timedelta(days=i)).strftime("%Y%m%d")
                prefix = f"day={day}/"
                tasks.append(self._fetch_day_parquets(s3, prefix))

            all_results = await asyncio.gather(*tasks)
            for day_dfs in all_results:
                result.extend(day_dfs)

        if result:
            return pd.concat(result, ignore_index=True)
        return pd.DataFrame()

    async def _fetch_day_parquets(self, s3, prefix: str):
        dfs = []
        response = await s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        for obj in response.get("Contents", []):
            key = obj["Key"]
            file_obj = await s3.get_object(Bucket=self.bucket, Key=key)
            body = await file_obj["Body"].read()
            df = pd.read_parquet(io.BytesIO(body))
            dfs.append(df)
        return dfs
