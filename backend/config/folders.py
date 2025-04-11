import os

from .util import getenv


class FoldersConfig:
    data = getenv('DATA_FOLDER')


class Folders:
    @staticmethod
    def data(path: str) -> str:
        return os.path.join(FoldersConfig.data, path)