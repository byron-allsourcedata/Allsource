import clickhouse_connect

from config.util import getenv, get_int_env


class ClickhouseInsertConfig:
    host = getenv("CLICKHOUSE_INSERT_HOST")
    port = get_int_env("CLICKHOUSE_INSERT_PORT")
    user = getenv("CLICKHOUSE_INSERT_USER")
    password = getenv("CLICKHOUSE_INSERT_PASSWORD")
    database = getenv("CLICKHOUSE_INSERT_DATABASE")

    @classmethod
    def get_client(cls):
        return clickhouse_connect.get_client(
            host=cls.host,
            port=cls.port,
            user=cls.user,
            password=cls.password,
            database=cls.database,
        )

    @classmethod
    async def get_async_client(cls):
        return await clickhouse_connect.get_async_client(
            host=cls.host,
            port=cls.port,
            username=cls.user,
            password=cls.password,
            database=cls.database,
        )

    @classmethod
    def users_table(cls):
        return f"{cls.database}.enrichment_users"
