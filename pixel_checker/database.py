import psycopg
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = (f'postgresql://{os.getenv("DB_USERNAME")}:'
                f'{os.getenv("DB_PASSWORD")}@{os.getenv("DB_HOST")}:'
                f'{os.getenv("DB_PORT")}/{os.getenv("DB_NAME")}')

def get_connection():
    return psycopg.connect(DATABASE_URL)

def get_domains_with_pixel_installed():
    query = """
    SELECT domain
    FROM public.users_domains
    WHERE is_pixel_installed = true
    GROUP BY domain;
    """
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(query)
        domains = cur.fetchall()
    conn.close()
    return [domain[0] for domain in domains]
