from sqlalchemy import Column, Integer, VARCHAR, Index, BigInteger, Sequence, String

from .base import Base


class FiveXFiveNames(Base):
    __tablename__ = '5x5_names'
    __table_args__ = (
        Index('5x5_names_name_idx', 'name', unique=True),
        Index(
            'idx_5x5_users_up_id',
            'name',
            postgresql_ops={'name': 'varchar_pattern_ops'}
        ),
    )

    id = Column(
        BigInteger,
        Sequence('5x5_names_id_seq'),
        primary_key=True,
        nullable=False
    )
    name = Column(String(64), nullable=True)
