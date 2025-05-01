from sqlalchemy import Column, Integer, TIMESTAMP, VARCHAR, ForeignKey, JSON, UUID, Index, text, String
from .base import Base
from models.audience_sources import AudienceSource
from models.users import Users


class AudienceLookalikes(Base):
    __tablename__ = 'audience_lookalikes'
    __table_args__ = (
        Index('audience_lookalikes_user_id_created_date_idx', 'user_id', 'created_date'),
        Index('audience_lookalikes_user_id_idx', 'user_id'),
        Index('audience_lookalikes_created_date_idx', 'created_date'),
        Index('audience_lookalikes_name_idx', 'name'),
        Index('audience_lookalikes_user_id_uuid_idx', 'user_id', 'id'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    name = Column(String(128), nullable=False)
    lookalike_size = Column(String(32), nullable=False)
    created_date = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP'),
        nullable=False
    )
    user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='CASCADE', onupdate='SET NULL'),
        nullable=False
    )
    created_by_user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL', onupdate='SET NULL'),
        nullable=False
    )
    processed_size = Column(Integer, server_default='0', nullable=False)
    size = Column(Integer, server_default='0', nullable=False)
    source_uuid = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_sources.id', ondelete='CASCADE'),
        nullable=False
    )
    significant_fields = Column(JSON, nullable=True)
    similarity_score = Column(JSON, nullable=True)
    insights = Column(JSON, nullable=True)
    processed_train_model_size = Column(Integer, server_default='0', nullable=False)
    train_model_size = Column(Integer, server_default='0', nullable=False)
