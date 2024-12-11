from sqlalchemy import Column, event, Integer, TIMESTAMP, TEXT
from .base import Base, create_timestamps


class PartnersAsset(Base):
    __tablename__ = "partners_assets"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(TEXT, nullable=False)
    preview_url = Column(TEXT, nullable=False)
    file_url = Column(TEXT, nullable=False)
    type = Column(TEXT, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    
    def to_dict(self):
            return {
                "title": self.title,
                "preview_url": self.preview_url,
                "file_url": self.file_url,
                "type": self.type,
            }

event.listen(PartnersAsset, "before_insert", create_timestamps)
