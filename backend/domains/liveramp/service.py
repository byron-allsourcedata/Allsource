import os
from datetime import datetime, timedelta
import pandas as pd
from .persistence import PostgresRepo, ClickhouseRepo, S3Repo, SnowflakeRepo
from .file_builder import build_rows_from_dataframe, write_tsv
from .uploader import upload_file
from . import config, utils
from .exceptions import LiverampError


class LiverampService:
    def __init__(
        self,
        pg_repo: PostgresRepo | None = None,
        ch_repo: ClickhouseRepo | None = None,
        s3_repo: S3Repo | None = None,
        sf_repo: SnowflakeRepo | None = None,
    ):
        self.pg = pg_repo or PostgresRepo()
        self.ch = ch_repo or ClickhouseRepo()
        self.s3 = s3_repo or S3Repo()
        self.sf = sf_repo or SnowflakeRepo()

    def run_export_and_upload(
        self,
        start_dt: datetime | None = None,
        end_dt: datetime | None = None,
        audience: str | None = None,
    ):
        # default last 7 days
        end_dt = end_dt or datetime.utcnow()
        start_dt = start_dt or (end_dt - timedelta(days=7))
        audience = audience or config.AUDIENCE_NAME

        # 1) fetch leads from Postgres
        leads_df = self.pg.fetch_leads(start_dt, end_dt)
        print(f"Leads fetched: {len(leads_df)} rows")

        # 2) fetch enrichment from ClickHouse (for that week)
        enrichment_df = self.ch.fetch_enrichment(start_dt, end_dt)
        print(f"Enrichment fetched: {len(enrichment_df)} rows")

        # 3) merge leads and enrichment — priority join by asid
        # normalize columns
        leads_df = leads_df.rename(
            columns={c: c.lower() for c in leads_df.columns}
        )
        enrichment_df = enrichment_df.rename(
            columns={c: c.lower() for c in enrichment_df.columns}
        )

        merged = leads_df.merge(enrichment_df, how="left", on="asid")
        print(f"Merged by ASID: {len(merged)} rows")

        # 4) fetch delivr parquet(s) for the dates in the range (iterate days)
        s3_dfs = []
        cur = start_dt
        while cur.date() <= end_dt.date():
            date_str = cur.strftime("%Y%m%d")
            keys = self.s3.list_objects_for_date(date_str)
            for key in keys:
                try:
                    df = self.s3.read_parquet_to_df(key)
                    df = df.rename(columns={c: c.lower() for c in df.columns})
                    s3_dfs.append(df)
                except Exception as e:
                    print(f"Warning: failed to read {key}: {e}")
            cur += timedelta(days=1)
        if s3_dfs:
            s3_all = pd.concat(s3_dfs, ignore_index=True)
            # merge on asid if available, else on email
            if "asid" in s3_all.columns:
                merged = merged.merge(s3_all, how="left", on="asid")
            else:
                merged = merged.merge(
                    s3_all,
                    how="left",
                    left_on="business_email",
                    right_on="business_emails",
                )
            print(f"After merging S3: {len(merged)} rows")
        else:
            print("No delivr parquet files found for date range")

        # 5) fetch snowflake data — example query, adjust as required
        sf_sql = "SELECT * FROM SPORTS_INNOVATION_LAB__ALLFORCE_PRIVATE_SHARE.SC_ALLFORCE.SIL_ALLFORCE_MERCHANT_SHARE_20251013_SV WHERE segment='BEAUTY_ENTHUSIASTS'"
        try:
            sf_df = self.sf.query_to_df(sf_sql)
            sf_df = sf_df.rename(columns={c: c.lower() for c in sf_df.columns})
            if "asid" in sf_df.columns:
                merged = merged.merge(sf_df, how="left", on="asid")
            print(f"After merging Snowflake: {len(merged)} rows")
        except Exception as e:
            print(f"Snowflake fetch warning: {e}")

        # 6) prepare final DataFrame for file builder
        # ensure an ASID exists — otherwise skip
        merged = merged[merged["asid"].notna()]

        # normalize phone
        merged["phone"] = (
            merged.get("phone").apply(
                lambda x: utils.normalize_phone(x) if pd.notna(x) else None
            )
            if "phone" in merged.columns
            else None
        )

        # 7) build rows and write TSV
        ts = datetime.utcnow()
        fname = utils.filename_for_audience(audience, ts)
        out_path = os.path.join(config.OUTPUT_DIR, fname)
        rows_iter = build_rows_from_dataframe(merged)
        write_tsv(out_path, rows_iter)
        print(f"File written: {out_path}")

        # 8) upload to LiveRamp
        remote_subdir = audience
        remote_path = upload_file(out_path, remote_subdir=remote_subdir)
        print(f"Uploaded to: {remote_path}")

        return out_path, remote_path
