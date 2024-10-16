from sqlalchemy import Column, event, Integer, BOOLEAN, TIMESTAMP, TEXT
from .base import Base, create_timestamps


class SuppressionRule(Base):
    __tablename__ = "suppressions_rules"

    id = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(TIMESTAMP, nullable=True)
    is_stop_collecting_contacts = Column(BOOLEAN, nullable=False, default=False)
    is_url_certain_activation = Column(BOOLEAN, nullable=False, default=False)
    activate_certain_urls = Column(TEXT, nullable=True)
    is_based_activation = Column(BOOLEAN, nullable=False, default=False)
    activate_based_urls = Column(TEXT, nullable=True)
    domain_id = Column(Integer, nullable=False)
    actual_contect_days = Column(Integer, nullable=False)
    page_views_limit = Column(Integer, nullable=True)
    collection_timeout = Column(Integer, nullable=True)
    suppressions_multiple_emails = Column(TEXT, nullable=True)
    
    def to_dict(self):
            return {
                "is_stop_collecting_contacts": self.is_stop_collecting_contacts,
                "is_url_certain_activation": self.is_url_certain_activation,
                "activate_certain_urls": self.activate_certain_urls,
                "is_based_activation": self.is_based_activation,
                "activate_based_urls": self.activate_based_urls,
                "page_views_limit": self.page_views_limit,
                "collection_timeout": self.collection_timeout,
                "suppressions_multiple_emails": self.suppressions_multiple_emails
            }

event.listen(SuppressionRule, "before_insert", create_timestamps)
