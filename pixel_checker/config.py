from dotenv import load_dotenv
from utils import get_env

load_dotenv()

APP_BASE_URL = get_env("APP_BASE_URL")
API_BASE_URL = get_env("API_BASE_URL")
