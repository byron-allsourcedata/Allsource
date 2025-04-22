import uuid

from sqlalchemy import UniqueConstraint, text, ForeignKey, SmallInteger, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, INT4RANGE

from models.base import Base


class EnrichmentPersonalProfiles(Base):
    __tablename__ = "enrichment_personal_profiles"
    __table_args__ = (
        UniqueConstraint("asid", name="enrichment_personal_profiles_asid_key"),
    )

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
    age: Mapped[range] = mapped_column(INT4RANGE, nullable=False)
    gender: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    homeowner: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    length_of_residence_years: Mapped[int] = mapped_column(SmallInteger)
    marital_status: Mapped[int] = mapped_column(SmallInteger)
    business_owner: Mapped[int] = mapped_column(SmallInteger)
    birth_day: Mapped[int] = mapped_column(SmallInteger)
    birth_month: Mapped[int] = mapped_column(SmallInteger)
    birth_year: Mapped[int] = mapped_column(SmallInteger)
    has_children: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    number_of_children: Mapped[int] = mapped_column(SmallInteger)
    religion: Mapped[str] = mapped_column(String(10))
    ethnicity: Mapped[str] = mapped_column(String(10))
    language_code: Mapped[str] = mapped_column(String(10))
    state_abbr: Mapped[str] = mapped_column(String(10))
    zip_code5: Mapped[int] = mapped_column(Integer)

    user: Mapped["EnrichmentUsers"] = relationship(
        "EnrichmentUsers",
        back_populates="personal_profiles"
    )