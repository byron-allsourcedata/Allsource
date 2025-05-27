import uuid

from sqlalchemy import UniqueConstraint, text, ForeignKey, SmallInteger, String, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class EnrichmentPersonalProfiles(Base):
    __tablename__ = "enrichment_personal_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    asid: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "enrichment_users.asid",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )
    age: Mapped[str] = mapped_column(
        String(16),
        nullable=False
    )
    gender: Mapped[str] = mapped_column(
        String(16),
        nullable=False
    )
    homeowner: Mapped[str] = mapped_column(
        String(16),
        nullable=False
    )
    length_of_residence_years: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=True
    )
    marital_status: Mapped[str] = mapped_column(
        String(16),
        nullable=True
    )
    business_owner: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=True
    )
    birth_day: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=True
    )
    birth_month: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=True
    )
    birth_year: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=True
    )
    has_children: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False
    )
    number_of_children: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=True
    )
    religion: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )
    ethnicity: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )
    language_code: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )
    state_abbr: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )
    zip_code5: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )
    
    __table_args__ = (
        Index("ix_enrichment_personal_profiles_asid", asid, unique=True),
    )

from models.enrichment.enrichment_users import EnrichmentUser

EnrichmentPersonalProfiles.enrichment_user = relationship(
    EnrichmentUser,
    back_populates="personal_profiles",
    foreign_keys=[EnrichmentPersonalProfiles.asid]
)