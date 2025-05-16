import os

def getenv(var: str, optional: bool = False) -> str:
    value = os.getenv(var)
    if not optional and value is None:
        raise ValueError(f"Environment variable {var} is not set")
    
    return value