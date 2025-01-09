from sqlalchemy import Column, event, Integer, TIMESTAMP, TEXT, VARCHAR
from .base import Base, create_timestamps, update_timestamps


class PartnersAsset(Base):
    __tablename__ = "partners_assets"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(VARCHAR(32), nullable=False)
    preview_url = Column(TEXT, nullable=True)
    file_url = Column(TEXT, nullable=False)
    type = Column(VARCHAR(16), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    
    def to_dict(self):
            return {
                "title": self.title,
                "preview_url": self.preview_url,
                "file_url": self.file_url,
                "type": self.type,
            }

event.listen(PartnersAsset, "before_insert", create_timestamps)
event.listen(PartnersAsset, "before_update", update_timestamps)