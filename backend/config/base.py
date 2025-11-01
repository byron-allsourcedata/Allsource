import os
from logging.config import fileConfig
from sqlalchemy import MetaData
from dotenv import find_dotenv, load_dotenv

load_dotenv()


class Base:
    env = os.getenv("ENV", "dev")
    port = int(os.getenv("PORT", 8000))
    domain = str(os.getenv("DOMAIN"))

    raw_domains = os.getenv("ALLOWED_DOMAINS", "")
    domains = [d.strip() for d in raw_domains.split(",") if d.strip()]

    allowed_origins = []
    for d in domains:
        allowed_origins.append(f"http://{d}")
        allowed_origins.append(f"https://{d}")


load_dotenv(find_dotenv(f"{Base.env}.envrc"))
