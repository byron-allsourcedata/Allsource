from decimal import Decimal


class AudienceSourceMath:
    @staticmethod
    def normalize_float(
        value: float, min_val: float, max_val: float, coefficient=1.0
    ) -> float:
        return coefficient * (
            (value - min_val) / (max_val - min_val)
            if max_val > min_val
            else 0.0
        )

    @staticmethod
    def normalize_decimal(
        value: Decimal,
        min_val: Decimal,
        max_val: Decimal,
        coefficient=Decimal("1.0"),
    ) -> Decimal:
        return coefficient * (
            (value - min_val) / (max_val - min_val)
            if max_val > min_val
            else Decimal("0.0")
        )

    @staticmethod
    def inverted_float(value: float) -> float:
        return 1 / (value + 1) if value != -1 else float("inf")

    @staticmethod
    def inverted_decimal(value: Decimal) -> Decimal:
        return (
            Decimal("1.0") / (value + Decimal("1.0"))
            if value != Decimal("-1.0")
            else Decimal("Infinity")
        )

    @staticmethod
    def weighted_score(
        first_data: Decimal,
        second_data: Decimal,
        third_data: Decimal,
        w1: Decimal,
        w2: Decimal,
        w3: Decimal,
        correction: Decimal = Decimal("1.0"),
    ) -> Decimal:
        return w1 * first_data + w2 * second_data - w3 * third_data + correction
