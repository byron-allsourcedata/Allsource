import os
from logging.config import fileConfig

from dotenv import find_dotenv, load_dotenv


class Base:
    env = os.getenv("ENV", "dev")
    port = int(os.getenv("PORT", 47734))
    allowed_origins = [
        "http://localhost:3000",
    ]


load_dotenv(find_dotenv(f"{Base.env}.envrc"))
