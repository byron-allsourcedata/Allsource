from models.sendgrid_template import SendGridTemplate
from sqlalchemy.orm import Session


class SendGridPersistenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_template_by_alias(self, alias):
        template = self.db.query(SendGridTemplate).filter(SendGridTemplate.alias == alias).first()
        if template:
            return template.template_id
