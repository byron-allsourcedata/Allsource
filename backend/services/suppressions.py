import logging

from persistence.settings_persistence import SettingsPersistence
logger = logging.getLogger(__name__)


class SuppressionService:

    def __init__(self, settings_persistence: SettingsPersistence):
        self.settings_persistence = settings_persistence
