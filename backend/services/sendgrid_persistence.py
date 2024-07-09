from models.sendgrid_template import SendgridTemplate
from sqlalchemy.orm import Session


class SendgridPersistenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_template_by_alias(self, alias):
        template = self.db.query(SendgridTemplate).filter(SendgridTemplate.alias == alias).first()
        if template:
            return template.template_id
