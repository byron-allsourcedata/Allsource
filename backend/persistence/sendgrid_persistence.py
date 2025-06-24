from models.sendgrid_template import SendgridTemplate

from resolver import injectable
from db_dependencies import Db


@injectable
class SendgridPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_template_by_alias(self, alias):
        template = (
            self.db.query(SendgridTemplate)
            .filter(SendgridTemplate.alias == alias)
            .first()
        )
        if template:
            return template.template_id
