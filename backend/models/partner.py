from sqlalchemy import Column, event, Integer, TIMESTAMP, BOOLEAN, VARCHAR, Index, text, ForeignKey, Boolean, inspect
from sqlalchemy.orm import relationship

from .base import Base, create_timestamps, update_timestamps
from models.users import Users


class Partner(Base):
    __tablename__ = "partners"
    __table_args__ = (
        Index('partners_email_idx', 'email', unique=True),
        Index('partners_user_id_idx', 'user_id', unique=True),
        Index('partners_is_master_idx', 'is_master'),
        Index('partners_master_id_idx', 'master_id'),
    )

    id = Column(
        Integer,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('partners_id_seq'::regclass)")
    )
    user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    master_id = Column(
        Integer,
        ForeignKey('partners.id'),
        nullable=True
    )
    commission = Column(
        Integer,
        nullable=True
    )
    email = Column(
        VARCHAR(64),
        nullable=False
    )
    name = Column(
        VARCHAR(64),
        nullable=False
    )
    company_name = Column(
        VARCHAR(64),
        nullable=True
    )
    join_date = Column(
        TIMESTAMP,
        nullable=True
    )
    token = Column(
        VARCHAR(256),
        nullable=True
    )
    status = Column(
        VARCHAR(16),
        nullable=False,
        server_default=text("'Invite sent'::character varying")
    )
    is_master = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    is_active = Column(
        Boolean,
        nullable=False,
        server_default=text('true')
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text('now()')
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text('now()')
    )

    parent = relationship(
        'Partner',
        remote_side=lambda: [Partner.id],
        backref='children'
    )
    users = relationship('Users', backref='partners')

    def to_dict(self) -> dict:
        return {
            c.key: getattr(self, c.key)
            for c in inspect(self).mapper.column_attrs
        }


event.listen(Partner, "before_insert", create_timestamps)
event.listen(Partner, "before_update", update_timestamps)
