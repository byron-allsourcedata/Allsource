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
    
    