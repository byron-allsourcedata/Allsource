import os
from logging.config import fileConfig
from sqlalchemy import MetaData
from dotenv import find_dotenv, load_dotenv

load_dotenv()

class Base:
    env = os.getenv("ENV", "dev")
    port = int(os.getenv("PORT", 8000))
    domain = str(os.getenv("DOMAIN"))
    allowed_origins = [
        "http://localhost:3000",
        f"http://{domain}",
        f"https://{domain}",
    ]

load_dotenv(find_dotenv(f"{Base.env}.envrc"))
