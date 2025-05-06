from sqlalchemy import String, Integer, Float, Boolean, Text, CHAR
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UsaZipCode(Base):
    __tablename__ = "usa_zip_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    zip: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    city: Mapped[str | None] = mapped_column(String(100))
    state_id: Mapped[str | None] = mapped_column(CHAR(2))
    state_name: Mapped[str | None] = mapped_column(String(100))
    zcta: Mapped[str | None] = mapped_column(String(5))
    parent_zcta: Mapped[str | None] = mapped_column(String(5))
    population: Mapped[int | None] = mapped_column(Integer)
    density: Mapped[float | None] = mapped_column(Float)
    county_fips: Mapped[str | None] = mapped_column(CHAR(5))
    county_name: Mapped[str | None] = mapped_column(String(100))
    county_weights: Mapped[str | None] = mapped_column(Text)
    county_names_all: Mapped[str | None] = mapped_column(Text)
    county_fips_all: Mapped[str | None] = mapped_column(Text)
    imprecise: Mapped[bool | None] = mapped_column(Boolean)
    military: Mapped[bool | None] = mapped_column(Boolean)
    timezone: Mapped[str | None] = mapped_column(String(50))
