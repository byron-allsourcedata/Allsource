import os


def getenv(var: str):
    value = os.getenv(var)
    if value is None:
        raise ValueError(f"Environment variable {var} is not set")
    return value