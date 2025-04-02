import logging
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson

logger = logging.getLogger(__name__)

class AudienceSourcesMatchedPersonsPersistence:    
    def __init__(self, db: Session):
        self.db = db

    def get_audience_sources_matched_persons_by_source_id(self, *, audience_source_id: UUID) -> List[AudienceSourcesMatchedPerson]:
        return self.db.query(AudienceSourcesMatchedPerson).filter(AudienceSourcesMatchedPerson.source_id == audience_source_id).all()
    
    def get_audience_sources_matched_persons_for_download_by_source_id(*, self, audience_source_id: UUID) -> List[AudienceSourcesMatchedPerson]:
        return self.db.query(FiveXFiveUser.first_name, FiveXFiveUser.last_name, AudienceSourcesMatchedPerson.email, AudienceSourcesMatchedPerson.orders_amount_normalized, AudienceSourcesMatchedPerson.orders_count_normalized, AudienceSourcesMatchedPerson.orders_date)\
            .join(FiveXFiveUser, FiveXFiveUser.id == AudienceSourcesMatchedPerson.five_x_five_user_id)\
            .filter(AudienceSourcesMatchedPerson.source_id == audience_source_id).all()
    