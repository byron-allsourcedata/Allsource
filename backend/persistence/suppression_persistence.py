from datetime import datetime

import math

from models.suppressions_list import SuppressionList
from sqlalchemy.orm import Session
from enums import SuppressionStatus
from fastapi import HTTPException, status
from models.suppression_rule import SuppressionRule
from sqlalchemy import func
from models.integrations.suppressed_contact import SuppressedContact

class SuppressionPersistence:

    def __init__(self, db: Session):
        self.db = db

    def save_suppressions_list(self, email_list, list_name, domain_id):
        suppression_list = self.db.query(SuppressionList).filter(SuppressionList.list_name == list_name).first()
        if suppression_list:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={'status': 'LIST_EXISTS'})
        suppression_list = SuppressionList(
            list_name=list_name,
            created_at=datetime.now(),
            total_emails=', '.join(email_list),
            status=SuppressionStatus.COMPLETED.value.lower(),
            domain_id=domain_id
        )
        self.db.add(suppression_list)
        self.db.commit()
        return

    def get_suppression_list(self, page, per_page, domain_id):
        offset = (page - 1) * per_page
        suppression_lists = (
            self.db.query(SuppressionList)
            .filter(SuppressionList.domain_id == domain_id)
            .limit(per_page)
            .offset(offset)
            .all()
        )

        result = []
        for suppression in suppression_lists:
            result.append(suppression.to_dict())

        total_count = self.db.query(SuppressionList).filter(SuppressionList.domain_id == domain_id).count()
        max_page = math.ceil(total_count / per_page)

        return result, total_count, max_page

    def delete_suppression_list(self, suppression_list_id, domain_id):
        self.db.query(SuppressionList).filter(
            SuppressionList.domain_id == domain_id,
            SuppressionList.id == suppression_list_id
        ).delete()
        self.db.commit()

    def get_suppression_list_by_id(self, suppression_list_id, domain_id):
        suppression_lists = self.db.query(SuppressionList).filter(SuppressionList.domain_id == domain_id,
                                                                  SuppressionList.id == suppression_list_id).first()
        return suppression_lists

    def get_rules(self, domain_id):
        rules = self.db.query(SuppressionRule).filter(SuppressionRule.domain_id == domain_id).first()
        return rules
    
    def create_suppression_rule(self, domain_id):
        rule = SuppressionRule(created_at=datetime.now(), domain_id=domain_id)
        self.db.add(rule)
        self.db.flush()
        return rule

    def save_rules_multiple_emails(self, domain_id, emails):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        if emails:
            rules.suppressions_multiple_emails = ', '.join(emails)
        else:
            rules.suppressions_multiple_emails = None
            
        self.db.commit()

    def process_collecting_contacts(self, domain_id):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        if rules.is_stop_collecting_contacts == False:
            rules.is_stop_collecting_contacts = True
        else:
            rules.is_stop_collecting_contacts = False
        self.db.commit()
        return rules.is_stop_collecting_contacts

    def process_certain_activation(self, domain_id):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        if rules.is_url_certain_activation == False:
            rules.is_url_certain_activation = True
        else:
            rules.is_url_certain_activation = False
        self.db.commit()
        return rules.is_url_certain_activation

    def process_certain_urls(self, domain_id, url_list):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        if not url_list:
            rules.activate_certain_urls = None
        rules.activate_certain_urls = ', '.join(url_list)
        self.db.commit()

    def process_based_activation(self, domain_id):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        if rules.is_based_activation == False:
            rules.is_based_activation = True
        else:
            rules.is_based_activation = False
        self.db.commit()
        return rules.is_based_activation
    
    def save_suppress_contact_days(self, domain_id, days):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = -1
        rules.actual_contect_days = days
        self.db.commit()
        return True

    def process_based_urls(self, domain_id, identifiers):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        cleaned_identifiers = [identifier.replace("utm_source", "").replace("=", "").replace(" ", "") for identifier in
                               identifiers if identifier]

        if not cleaned_identifiers:
            rules.activate_based_urls = None

        rules.activate_based_urls = ', '.join(cleaned_identifiers)
        self.db.commit()

    def process_page_views_limit(self, domain_id, page_views, seconds):
        rules = self.get_rules(domain_id=domain_id) or self.create_suppression_rule(domain_id=domain_id)
        if not seconds:
            rules.collection_timeout = None
        if not page_views:
            rules.page_views_limit = None
        else:
            rules.page_views_limit = page_views
            rules.collection_timeout = seconds
        self.db.commit()

    def get_contacts_count(self, domain_id: int) -> int:
        return (
            self.db.query(func.count(SuppressedContact.id))
            .filter(SuppressedContact.domain_id == domain_id)
            .scalar()
        )
