from sqlalchemy import Column, event, Integer, ForeignKey, TEXT
from sqlalchemy.dialects.postgresql import TIMESTAMP, VARCHAR
from sqlalchemy.orm import relationship
from .base import Base, create_timestamps


class SuppressionList(Base):
    __tablename__ = "suppressions_lists"

    id = Column(Integer, primary_key=True, nullable=False)
    list_name = Column(VARCHAR, nullable=False)
    created_at = Column(TIMESTAMP(precision=7), nullable=False)
    total_emails = Column(TEXT, nullable=False)
    status = Column(VARCHAR, nullable=False, default='incomplete')
    domain_id = Column(Integer, nullable=False)


    def to_dict(self):
            return {
                "id": self.id,
                "list_name": self.list_name,
                "created_at": self.created_at,
                "total_emails": self.total_emails,
                "status": self.status
            }

event.listen(SuppressionList, "before_insert", create_timestamps)
