from models.whitelabel_settings import WhitelabelSettings
from resolver import injectable
from db_dependencies import Db


@injectable
class WhitelabelSettingsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_whitelabel_settings(
        self, user_id: int
    ) -> WhitelabelSettings | None:
        return (
            self.db.query(WhitelabelSettings)
            .where(WhitelabelSettings.user_id == user_id)
            .first()
        )

    def update_whitelabel_settings(
        self,
        user_id: int,
        brand_name: str,
        brand_logo_url: str,
        brand_icon_url: str,
    ):
        return (
            self.db.query(WhitelabelSettings)
            .where(WhitelabelSettings.user_id == user_id)
            .update(
                {
                    "brand_name": brand_name,
                    "brand_logo_url": brand_logo_url,
                    "brand_icon_url": brand_icon_url,
                }
            )
        )
