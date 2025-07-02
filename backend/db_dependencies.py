from typing import Annotated

import clickhouse_connect
from clickhouse_connect.driver import Client

from sqlalchemy.orm import Session
from fastapi import Depends

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


def get_clickhouse_inserter_db():
    ch = ClickhouseConfig.get_client()

    try:
        yield ch
    finally:
        ch.close()


Clickhouse = Annotated[Client, Depends(get_clickhouse_db)]

ClickhouseInserter = Annotated[Client, Depends(get_clickhouse_inserter_db)]
