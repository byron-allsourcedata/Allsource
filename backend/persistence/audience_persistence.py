import math
from datetime import datetime

from sqlalchemy import desc, asc
from sqlalchemy import func
from sqlalchemy.orm import Session

from enums import AudienceInfoEnum
from models.audience import Audience
from models.audience_leads import AudienceLeads
from models.leads_users import LeadUser


class AudiencePersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_audience_list(self, user_id):
        audience_counts = (
            self.db.query(
                Audience.id,
                Audience.name,
                func.count(AudienceLeads.id).label('leads_count')
            )
            .outerjoin(AudienceLeads, AudienceLeads.audience_id == Audience.id)
            .filter(Audience.user_id == user_id)
            .group_by(Audience.id)
            .all()
        )
        audience_list = [
            {
                'audience_id': audience.id,
                'audience_name': audience.name,
                'leads_count': audience.leads_count
            }
            for audience in audience_counts
        ]

        return audience_list

    def create_domain_audience(self, domain_id, data_source, audience_type, audience_threshold):
        audience = Audience(domain_id=domain_id, data_source=data_source, audience_type=audience_type, audience_threshold=audience_threshold)
        self.db.add(audience)
        self.db.commit()
        return {'status': AudienceInfoEnum.SUCCESS}


    def delete_user_audience(self, user_id, audience_id):
        audience = self.db.query(Audience).filter(Audience.user_id == user_id, Audience.id == audience_id).first()
        if audience:
            self.db.delete(audience)
            self.db.commit()
            return AudienceInfoEnum.SUCCESS
        return AudienceInfoEnum.NOT_FOUND