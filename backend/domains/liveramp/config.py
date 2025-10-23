# domains/liveramp/config.py

from pydantic import BaseSettings, Field
from typing import Optional


class Settings(BaseSettings):
    # Postgres
    PG_DSN: Optional[str] = Field(None, env="PG_DSN")
    # ClickHouse
    CH_HOST: Optional[str] = Field(None, env="CH_HOST")
    CH_PORT: int = Field(9000, env="CH_PORT")
    CH_USER: Optional[str] = Field(None, env="CH_USER")
    CH_PASSWORD: Optional[str] = Field(None, env="CH_PASSWORD")
    CH_DB: Optional[str] = Field(None, env="CH_DB")

    # Snowflake
    SF_USER: Optional[str] = Field(None, env="SF_USER")
    SF_PASSWORD: Optional[str] = Field(None, env="SF_PASSWORD")
    SF_ACCOUNT: Optional[str] = Field(None, env="SF_ACCOUNT")
    SF_WAREHOUSE: Optional[str] = Field(None, env="SF_WAREHOUSE")
    SF_DATABASE: Optional[str] = Field(None, env="SF_DATABASE")
    SF_SCHEMA: Optional[str] = Field(None, env="SF_SCHEMA")
    SF_ROLE: Optional[str] = Field(None, env="SF_ROLE")

    # S3 / delivr
    AWS_PROFILE: Optional[str] = Field(None, env="AWS_PROFILE")
    DELIVR_BUCKET: str = Field("delivr-allsource-export", env="DELIVR_BUCKET")
    DELIVR_PREFIX_TEMPLATE: str = Field(
        "day={date}", env="DELIVR_PREFIX_TEMPLATE"
    )

    # LiveRamp SFTP
    SFTP_HOST: str = Field("files.liveramp.com", env="SFTP_HOST")
    SFTP_PORT: int = Field(22, env="SFTP_PORT")
    SFTP_USER: Optional[str] = Field(None, env="SFTP_USER")
    SFTP_PASSWORD: Optional[str] = Field(None, env="SFTP_PASSWORD")
    SFTP_KEY_PATH: Optional[str] = Field(None, env="SFTP_KEY_PATH")
    SFTP_UPLOAD_DIR: str = Field("/uploads", env="SFTP_UPLOAD_DIR")

    # Output
    OUTPUT_DIR: str = Field("/tmp", env="OUTPUT_DIR")
    AUDIENCE_NAME: str = Field("default_audience", env="AUDIENCE_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
