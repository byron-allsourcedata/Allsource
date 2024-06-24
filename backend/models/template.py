from sqlalchemy import Column, ForeignKey, event
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class Template(Base):
    __tablename__ = "template"

    id = Column(BIGINT, primary_key=True, nullable=False)
    alias = Column(VARCHAR(32))
    template_id = Column(VARCHAR(64))
    subject = Column(VARCHAR(256))
    description = Column(VARCHAR)
    created_at = Column(TIMESTAMP(precision=7), nullable=False)
    updated_at = Column(TIMESTAMP(precision=7), nullable=False)


event.listen(Template, "before_insert", create_timestamps)
event.listen(Template, "before_update", update_timestamps)
