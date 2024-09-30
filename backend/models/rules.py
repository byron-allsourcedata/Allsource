from sqlalchemy import Column, event, Integer, BOOLEAN, ForeignKey, TIMESTAMP, VARCHAR
from sqlalchemy.orm import relationship
from .base import Base, create_timestamps


class Rules(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(TIMESTAMP, nullable=True)
    is_stop_collecting_contacts = Column(BOOLEAN, nullable=False, default=False)
    is_url_certain_activation = Column(BOOLEAN, nullable=False, default=False)
    activate_certain_urls = Column(VARCHAR, nullable=True)
    is_based_activation = Column(BOOLEAN, nullable=False, default=False)
    activate_based_urls = Column(VARCHAR, nullable=True)
    user_id = Column(Integer, nullable=False)
    page_views_limit = Column(VARCHAR, nullable=True)
    collection_timeout = Column(VARCHAR, nullable=True)
    suppressions_multiple_emails = Column(Integer, ForeignKey('suppression_emails.id'), nullable=True)
    
    suppression_emails = relationship("SuppressionEmails", back_populates="rules")
    
    def to_dict(self):
            return {
                "is_stop_collecting_contacts": self.is_stop_collecting_contacts,
                "is_url_certain_activation": self.is_url_certain_activation,
                "activate_certain_urls": self.activate_certain_urls,
                "is_based_activation": self.is_based_activation,
                "page_views_limit": self.page_views_limit,
                "collection_timeout": self.collection_timeout,
                "suppressions_multiple_emails": self.suppressions_multiple_emails
            }

event.listen(Rules, "before_insert", create_timestamps)
