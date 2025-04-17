import os

from dotenv import load_dotenv

from .util import getenv

load_dotenv()

class FoldersConfig:
    data = getenv('DATA_FOLDER')


class Folders:
    @staticmethod
    def data(path: str) -> str:
        return os.path.join(FoldersConfig.data, path)