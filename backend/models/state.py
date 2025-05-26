from sqlalchemy import Column, Index, BigInteger, Sequence
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base


class States(Base):
    __tablename__ = 'states'
    __table_args__ = (
        Index('state_state_code_idx', 'state_code', unique=True),
        Index('state_state_name_idx', 'state_name', unique=True),
    )

    id = Column(
        BigInteger,
        Sequence('state_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    state_code = Column(
        VARCHAR(16),
        nullable=False
    )
    state_name = Column(
        VARCHAR(64),
        nullable=True
    )
