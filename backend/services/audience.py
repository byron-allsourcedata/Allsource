import logging

from enums import AudienceInfoEnum
from models.users import Users
from persistence.audience_persistence import AudiencePersistence

logger = logging.getLogger(__name__)


class AudienceService:
    def __init__(self, user: Users, audience_persistence_service: AudiencePersistence):
        self.user = user
        self.audience_persistence_service = audience_persistence_service

    def get_audience(self, page, per_page, sort_by, sort_order):
        audience_data, count, max_page = self.audience_persistence_service.get_filter_user_audience(self.user.id,
                                                                                                    page=page,
                                                                                                    per_page=per_page,
                                                                                                    sort_by=sort_by,
                                                                                                    sort_order=sort_order)
        audience_list = [
            {
                "id": audience.id,
                "name": audience.name,
                'type': audience.type,
                'status': audience.status,
                'created_at': audience.created_at.strftime('%d.%m.%Y %H:%M:%S'),
                "leads_count": leads_count
            }
            for audience, leads_count in audience_data
        ]
        return audience_list, count, max_page

    def get_user_audience_list(self):
        return self.audience_persistence_service.get_user_audience_list(self.user.id)

    def post_audience(self, leads_ids, audience_name):
        return self.audience_persistence_service.create_user_audience(self.user.id, leads_ids, audience_name)

    def put_audience(self, leads_ids, remove_leads_ids, audience_ids, new_audience_name):
        for audience_id in audience_ids:
            self.audience_persistence_service.change_user_audience(self.user.id, leads_ids, remove_leads_ids,
                                                                   audience_id, new_audience_name)
        return AudienceInfoEnum.SUCCESS

    def delete_audience(self, audience_ids):
        for audience_id in audience_ids:
            self.audience_persistence_service.delete_user_audience(self.user.id, audience_id)
        return AudienceInfoEnum.SUCCESS

    def get_leads_for_build_an_audience(self, regions, professions, ages, genders, net_worths,
                                        interest_list, not_in_existing_lists, page, per_page):
        leads_data, count_leads, max_page = self.audience_persistence_service.get_filter_user_leads(
            page=page, per_page=per_page,
            regions=regions,
            professions=professions,
            ages=ages,
            genders=genders,
            net_worths=net_worths,
            interest_list=interest_list,
            not_in_existing_lists=not_in_existing_lists
        )
        leads_list = [
            {
                'id': id,
                'name': f"{first_name} {last_name}",
                'email': business_email,
                'gender': gender,
                'age': f"{age_min} - {age_max}" if age_min is not None and age_max is not None else None,
                'occupation': job_title,
                'city': city,
                'state': state
            }
            for id, first_name, last_name, business_email, gender, age_min, age_max, job_title, city, state in
            leads_data
        ]
        return {
            'leads_list': leads_list,
            'count_leads': count_leads,
            'max_page': max_page,
        }
