from config.folders import Folders
from pandas import DataFrame
import pandas as pd


def get_states_dataframe() -> DataFrame:
        path = Folders.data('uszips.csv')
        dataframe = pd.read_csv(path, usecols=["zip", "city", "state_name"], dtype={"zip": str})
        return dataframe