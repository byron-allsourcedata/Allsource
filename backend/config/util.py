import os


class EnvVarError(Exception):
    def __init__(self, var_name: str):
        self.var_name = var_name

    def __str__(self):
        return f"Environment variable {self.var_name} is not set"


def getenv(var: str, optional: bool = False) -> str:
    value = os.getenv(var)
    if not optional and value is None:
        raise EnvVarError(var)

    return value


def get_int_env(var: str, optional: bool = False) -> int:
    value = os.getenv(var)
    if not optional and value is None:
        raise ValueError(f"Environment variable {var} is not set")

    try:
        return int(value)
    except ValueError:
        raise ValueError(f"Environment variable {var} is not an integer")
