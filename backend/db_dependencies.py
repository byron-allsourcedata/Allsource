from typing import Annotated

import clickhouse_connect
from fastapi import Depends
from sqlalchemy.orm import Session

from config import ClickhouseConfig
from config.database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Db = Annotated[Session, Depends(get_db)]

def get_clickhouse_db():
    ch = ClickhouseConfig.get_client()
    try:
        yield ch
    finally:
        ch.close()

Clickhouse = Annotated[clickhouse_connect.driver.Client, Depends(get_clickhouse_db)]