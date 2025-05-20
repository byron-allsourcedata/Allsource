from dependencies import Clickhouse
from resolver import injectable


@injectable
class ClickhousePersistence:
    def __init__(self, client: Clickhouse):
        self.client = client

