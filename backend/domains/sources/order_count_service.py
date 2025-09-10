from resolver import injectable
from schemas.scripts.audience_source import PersonRow


@injectable
class SourcesOrderCountService:
    def __init__(self) -> None:
        pass

    def parse_order_count(self, raw_order_count: str | None) -> int | None:
        if raw_order_count is None:
            return None
        try:
            return int(raw_order_count)
        except ValueError:
            return None

    def split_amount(self, amount: float, count: int) -> float | None:
        if count <= 0:
            return None
        return amount / count

    def get_duplicated_person_rows(
        self,
        email: str,
        date: str | None,
        order_amount: float,
        order_count: int,
    ) -> list[PersonRow]:
        splitted_amount = self.split_amount(order_amount, order_count)

        if splitted_amount is None:
            return []

        return [
            PersonRow(
                email=email,
                date=date,
                sale_amount=str(splitted_amount),
            )
            for _ in range(order_count)
        ]
