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
            password=cls.password
        )


    @classmethod
    def test(cls):
        client = cls.get_client()

        result = client.query(f"SELECT COUNT(*) FROM {cls.database}.enrichment_users")
        print(result.result_rows)