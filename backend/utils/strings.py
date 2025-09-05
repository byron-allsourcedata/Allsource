import re


def to_snake_case(name: str) -> str:
    # Strip leading/trailing spaces
    name = name.strip()

    # Remove non-latin letters, keep a-z, A-Z, 0-9, and spaces
    name = re.sub(r"[^a-zA-Z0-9 ]+", "", name)

    if not name:
        return "_"

    name = re.sub(r"\s+", "_", name)

    return name.lower()
