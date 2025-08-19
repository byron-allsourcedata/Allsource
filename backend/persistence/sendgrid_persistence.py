from resolver import injectable

from db_dependencies import Db
from models.sendgrid_template import SendgridTemplate


class TemplateNotFound(Exception):
    pass


@injectable
class SendgridPersistence:
    def __init__(self, db: Db):
        self.db = db

    def unwrap_template_by_alias(self, alias: str) -> str:
        """
        Raises TemplateNotFound
        """
        template_id = self.get_template_by_alias(alias)
        if template_id is None:
            raise TemplateNotFound(template_id)
        return template_id

    def get_template_by_alias(self, alias: str):
        template = (
            self.db.query(SendgridTemplate)
            .where(SendgridTemplate.alias == alias)
            .first()
        )
        if template:
            return template.template_id
