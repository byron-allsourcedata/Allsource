from sqlalchemy.dialects.postgresql import insert
from models.referral_users import ReferralUser
from models.users import Users
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
        user = self.db.query(Users).where(Users.id == user_id).first()
        if user is None:
            return None
        referal_user = (
            self.db.query(ReferralUser)
            .where(ReferralUser.user_id == user_id)
            .first()
        )

        if referal_user is not None:
            check_setttings_for_user_id = referal_user.parent_user_id
        else:
            check_setttings_for_user_id = user_id

        return (
            self.db.query(WhitelabelSettings)
            .where(WhitelabelSettings.user_id == check_setttings_for_user_id)
            .first()
        )

    def update_whitelabel_settings(
        self,
        user_id: int,
        brand_name: str,
        brand_logo_url: str | None,
        brand_icon_url: str | None,
    ):
        query = (
            insert(WhitelabelSettings)
            .values(
                user_id=user_id,
                brand_name=brand_name,
                brand_logo_url=brand_logo_url,
                brand_icon_url=brand_icon_url,
            )
            .on_conflict_do_update(
                index_elements=["user_id"],
                set_={
                    "brand_name": brand_name,
                    "brand_logo_url": brand_logo_url,
                    "brand_icon_url": brand_icon_url,
                },
            )
        )

        return self.db.execute(query)
