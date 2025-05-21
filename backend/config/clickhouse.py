import clickhouse_connect

from config.util import getenv, get_int_env


class ClickhouseConfig:
    host = getenv("CLICKHOUSE_HOST")
    port = get_int_env("CLICKHOUSE_PORT")
    user = getenv("CLICKHOUSE_USER")
    password = getenv("CLICKHOUSE_PASSWORD")
    database = getenv("CLICKHOUSE_DATABASE")

    @classmethod
    def get_client(cls):
        return clickhouse_connect.get_client(
            host=cls.host,
            port=cls.port,
            user=cls.user,
            password=cls.password,
            database=cls.database
        )


    @classmethod
    def users_table(cls):
        return f"{cls.database}.enrichment_users"
