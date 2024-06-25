import os
from logging.config import fileConfig

from dotenv import find_dotenv, load_dotenv


class Base:
    env = os.getenv("ENV", "dev")
    port = int(os.getenv("PORT", 8000))
    host = str(os.getenv("HOST", "localhost"))
    allowed_origins = [
        f"http://{host}:{port}",
        f"https://{host}:{port}",
    ]


load_dotenv(find_dotenv(f"{Base.env}.envrc"))
