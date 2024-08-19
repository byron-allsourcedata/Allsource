from sqlalchemy import Column, event
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class SendgridTemplate(Base):
    __tablename__ = "sendgrid_templates"

    id = Column(BIGINT, primary_key=True, nullable=False)
    alias = Column(VARCHAR(32), nullable=True)
    template_id = Column(VARCHAR(64), nullable=True)
    subject = Column(VARCHAR(256), nullable=True)
    description = Column(VARCHAR, nullable=True)
    created_at = Column(TIMESTAMP(precision=7), nullable=False)
    updated_at = Column(TIMESTAMP(precision=7), nullable=False)


event.listen(SendgridTemplate, "before_insert", create_timestamps)
event.listen(SendgridTemplate, "before_update", update_timestamps)
