from resolver import injectable

from db_dependencies import Db
from models.sendgrid_template import SendgridTemplate


@injectable
class SendgridPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_template_by_alias(self, alias: str):
        template = (
            self.db.query(SendgridTemplate)
            .where(SendgridTemplate.alias == alias)
            .first()
        )
        if template:
            return template.template_id
