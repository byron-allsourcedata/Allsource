from typing import TypeVar


T = TypeVar("T")


def or_default(value: T | None, default: T) -> T:
    if value is not None:
        return value
    return default
