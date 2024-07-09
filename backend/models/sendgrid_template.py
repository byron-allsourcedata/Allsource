from sqlalchemy import Column, ForeignKey, event
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class SendGridTemplate(Base):
    __tablename__ = "sendgrid_templates"

    id = Column(BIGINT, primary_key=True, nullable=False)
    alias = Column(VARCHAR(32))
    template_id = Column(VARCHAR(64))
    subject = Column(VARCHAR(256))
    description = Column(VARCHAR)
    created_at = Column(TIMESTAMP(precision=7), nullable=False)
    updated_at = Column(TIMESTAMP(precision=7), nullable=False)


event.listen(SendGridTemplate, "before_insert", create_timestamps)
event.listen(SendGridTemplate, "before_update", update_timestamps)
