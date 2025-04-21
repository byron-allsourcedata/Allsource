from sqlalchemy import Column, event, text
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class SendgridTemplate(Base):
    __tablename__ = 'sendgrid_templates'

    id = Column(
        BIGINT,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('send_grid_templates_id_seq'::regclass)")
    )
    alias = Column(
        VARCHAR,
        nullable=True
    )
    template_id = Column(
        VARCHAR,
        nullable=True
    )
    subject = Column(
        VARCHAR,
        nullable=True
    )
    description = Column(
        VARCHAR,
        nullable=True
    )
    created_at = Column(
        TIMESTAMP(precision=7),
        nullable=False
    )
    updated_at = Column(
        TIMESTAMP(precision=7),
        nullable=False
    )


event.listen(SendgridTemplate, "before_insert", create_timestamps)
event.listen(SendgridTemplate, "before_update", update_timestamps)
