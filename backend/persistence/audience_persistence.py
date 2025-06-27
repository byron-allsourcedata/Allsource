from sqlalchemy import desc

from db_dependencies import Db
from enums import AudienceInfoEnum
from models.audience import Audience
from resolver import injectable


@injectable
class AudiencePersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_user_audience_list(self, domain_id):
        return (
            self.db.query(Audience.id)
            .filter(Audience.domain_id == domain_id)
            .order_by(desc(Audience.id))
            .all()
        )

    def create_domain_audience(
        self, domain_id, data_source, audience_type, audience_threshold
    ):
        audience = Audience(
            domain_id=domain_id,
            data_source=data_source,
            audience_type=audience_type,
            audience_threshold=audience_threshold,
        )
        self.db.add(audience)
        self.db.commit()
        return audience

    def delete_user_audience(self, user_id, audience_id):
        audience = (
            self.db.query(Audience)
            .filter(Audience.user_id == user_id, Audience.id == audience_id)
            .first()
        )
        if audience:
            self.db.delete(audience)
            self.db.commit()
            return AudienceInfoEnum.SUCCESS
        return AudienceInfoEnum.NOT_FOUND
