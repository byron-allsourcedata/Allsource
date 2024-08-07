import math
from datetime import datetime

from sqlalchemy import desc, asc, Integer
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from enums import AudienceInfoEnum
from models.audience import Audience
from models.audience_leads import AudienceLeads
from models.leads import Lead
from models.leads_locations import LeadsLocations
from models.leads_users import LeadUser
from models.locations import Locations
from typing import List


class AudiencePersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_filter_user_audience(self, user_id: int, page: int, per_page: int, sort_by, sort_order):
        query = (
            self.db.query(Audience, func.count(AudienceLeads.id).label('leads_count'))
            .outerjoin(AudienceLeads, AudienceLeads.audience_id == Audience.id)
            .filter(Audience.user_id == user_id)
            .group_by(Audience.id)
        )

        sort_options = {
            'list_name': Audience.name,
            'no_of_leads': 'leads_count',
            'created_by': Audience.type,
            'created_date': Audience.created_at,
            'status': Audience.status,
            'exported_on': Audience.exported_on,
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(desc(Audience.created_at))

        offset = (page - 1) * per_page
        audience_data = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page) if per_page > 0 else 1

        return audience_data, count, max_page

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

    def create_user_audience(self, user_id, leads_ids, audience_name):
        lead_users = (
            self.db.query(LeadUser)
            .filter(LeadUser.user_id == user_id, LeadUser.lead_id.in_(leads_ids))
            .all()
        )
        if not audience_name or not audience_name.strip():
            return {'status': AudienceInfoEnum.NOT_VALID_NAME}
        audience_name = audience_name.strip()
        if not lead_users:
            return {'status': AudienceInfoEnum.NOT_FOUND}
        start_date = datetime.utcnow()
        start_date_str = start_date.isoformat() + "Z"
        audience = Audience(name=audience_name, user_id=user_id, type='Leads', created_at=start_date_str)
        self.db.add(audience)
        self.db.commit()
        for lead_user in lead_users:
            audience_lead = AudienceLeads(audience_id=audience.id, lead_id=lead_user.lead_id)
            self.db.add(audience_lead)

        self.db.commit()
        return {'id': audience.id, 'status': AudienceInfoEnum.SUCCESS}

    def change_user_audience(self, user_id, leads_ids, remove_ids, audience_id, new_audience_name):
        if audience_id:
            audience = self.db.query(Audience).filter(Audience.user_id == user_id, Audience.id == audience_id).first()
            if audience:
                if leads_ids:
                    lead_users = self.db.query(LeadUser).filter(LeadUser.user_id == user_id,
                                                                LeadUser.lead_id.in_(leads_ids)).all()
                    lead_ids_set = {lead_user.lead_id for lead_user in lead_users}

                    audience_leads = self.db.query(AudienceLeads).filter(AudienceLeads.audience_id == audience.id).all()
                    audience_lead_ids_set = {audience_lead.lead_id for audience_lead in audience_leads}
                    new_leads = lead_ids_set - audience_lead_ids_set
                    for lead_id in new_leads:
                        audience_lead = AudienceLeads(audience_id=audience.id, lead_id=lead_id)
                        self.db.add(audience_lead)

                if remove_ids:
                    leads_to_remove = self.db.query(LeadUser).filter(LeadUser.user_id == user_id,
                                                                     LeadUser.lead_id.in_(remove_ids)).all()
                    leads_to_remove_ids = {lead_user.lead_id for lead_user in leads_to_remove}

                    audience_leads_to_delete = self.db.query(AudienceLeads).filter(
                        AudienceLeads.audience_id == audience.id,
                        AudienceLeads.lead_id.in_(
                            leads_to_remove_ids)).all()
                    for audience_lead in audience_leads_to_delete:
                        self.db.delete(audience_lead)

                if new_audience_name:
                    audience.name = new_audience_name

                self.db.commit()
                return AudienceInfoEnum.SUCCESS
        return AudienceInfoEnum.NOT_FOUND

    def delete_user_audience(self, user_id, audience_id):
        audience = self.db.query(Audience).filter(Audience.user_id == user_id, Audience.id == audience_id).first()
        if audience:
            self.db.delete(audience)
            self.db.commit()
            return AudienceInfoEnum.SUCCESS
        return AudienceInfoEnum.NOT_FOUND

    def parse_age_filters(self, age_str: str):
        filters = []
        for part in age_str.split(','):
            if '-' in part:
                start, end = map(int, part.split('-'))
                filters.append(and_(Lead.age_min <= end, Lead.age_max >= start))
            else:
                age = int(part)
                filters.append(and_(Lead.age_min <= age, Lead.age_max >= age))
        return filters

    def parse_net_worth_filters(self, net_worth_str: str):
        filters = []
        for part in net_worth_str.split(','):
            part = part.strip()
            if '-' in part:
                if '$' in part:
                    part = part.replace('$', '').replace(',', '')
                start, end = map(int, part.split('-'))
                filters.append(and_(
                    func.regexp_replace(Lead.net_worth, '[\$,]', '', 'g').cast(Integer) >= start,
                    func.regexp_replace(Lead.net_worth, '[\$,]', '', 'g').cast(Integer) <= end
                ))
            else:
                if '$' in part:
                    part = part.replace('$', '').replace(',', '')
                value = int(part)
                filters.append(and_(
                    func.regexp_replace(Lead.net_worth, '[\$,]', '', 'g').cast(Integer) >= value,
                    func.regexp_replace(Lead.net_worth, '[\$,]', '', 'g').cast(Integer) <= value
                ))
        return filters

    def normalize_profession(self, profession: str) -> str:
        return profession.lower().replace(" ", "-")

    def get_filter_user_leads(self, user_id: int, regions: List[str], professions: List[str],
                              ages: str, genders: List[str], net_worths: List[int],
                              interest_list: List[str], not_in_existing_lists: List[str]):
        query = (
            self.db.query(Lead)
            .join(LeadUser, LeadUser.lead_id == Lead.id)
            .join(LeadsLocations, LeadsLocations.lead_id == Lead.id)
            .join(Locations, LeadsLocations.location_id == Locations.id)
            .filter(LeadUser.user_id == user_id)
        )

        if not_in_existing_lists:
            audience_subquery = (
                self.db.query(Audience.lead_id)
                .filter(Audience.name.in_(not_in_existing_lists))
            )
            query = query.filter(Lead.id.notin_(audience_subquery))
        if regions:
            query = query.filter(Locations.city.in_(regions))
        if professions:
            normalized_professions = [self.normalize_profession(p) for p in professions]
            profession_filters = []
            for profession in normalized_professions:
                profession_filters.append(Lead.job_title.ilike(f"%{profession.replace('-', ' ')}%"))

            query = query.filter(or_(*profession_filters))
        if ages:
            age_filters = self.parse_age_filters(ages)
            query = query.filter(or_(*age_filters))
        if genders:
            query = query.filter(Lead.gender.in_(genders))
        if net_worths:
            net_worth_filters = self.parse_net_worth_filters(net_worths)
            query = query.filter(or_(*net_worth_filters))

        audience_data = query.all()
        return audience_data
