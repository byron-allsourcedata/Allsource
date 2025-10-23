from typing import Annotated, TypeAlias

from aio_pika.abc import AbstractChannel, AbstractConnection
import clickhouse_connect
from clickhouse_connect.driver import Client

from sqlalchemy.orm import Session
from fastapi import Depends

from config import ClickhouseConfig
from config import ClickhouseInsertConfig
from config.database import SessionLocal
from config.rmq_connection import RabbitMQConnection


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


Db: TypeAlias = Annotated[Session, Depends(get_db)]


def get_clickhouse_db():
    ch = ClickhouseConfig.get_client()

    try:
        yield ch
    finally:
        ch.close()


def get_clickhouse_inserter_db():
    ch = ClickhouseInsertConfig.get_client()

    try:
        yield ch
    finally:
        ch.close()


Clickhouse = Annotated[Client, Depends(get_clickhouse_db)]

ClickhouseInserter = Annotated[Client, Depends(get_clickhouse_inserter_db)]


async def get_rmq_connection():
    rmq_connection = RabbitMQConnection()
    connection = await rmq_connection.connect()
    channel = await connection.channel()
    _ = await channel.set_qos(prefetch_count=1)

    yield connection, channel

    try:
        await channel.close()
        await connection.close()
    except:
        pass


Rmq = Annotated[
    tuple[AbstractConnection, AbstractChannel],
    Depends(get_rmq_connection),
]
