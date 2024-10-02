from datetime import datetime

import math

from models.suppressions_list import SuppressionList
from sqlalchemy.orm import Session
from enums import SuppressionStatus
from sqlalchemy.dialects.postgresql import insert
from models.suppression_rule import SuppressionRule
from models.users_domains import UserDomains


class SuppressionPersistence:

    def __init__(self, db: Session):
        self.db = db
    
    
    def save_suppressions_list(self, email_list, list_name, domain_id):
        suppression_list = SuppressionList(
            list_name=list_name,
            created_at=datetime.now(),
            total_emails= ', '.join(email_list),
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
        suppression_lists = self.db.query(SuppressionList).filter(SuppressionList.domain_id == domain_id, SuppressionList.id == suppression_list_id).first()
        return suppression_lists
    
    def get_rules(self, domain_id):
        rules = self.db.query(SuppressionRule).filter(SuppressionRule.domain_id == domain_id).first()
        return rules
    
    def save_rules_multiple_emails(self, domain_id, emails):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id)
        rules.suppressions_multiple_emails = ', '.join(emails)
        self.db.add(rules)
        self.db.commit()

        
    def process_collecting_contacts(self, domain_id):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id, is_stop_collecting_contacts = False)
        is_stop_collecting_contacts = False
        if rules.is_stop_collecting_contacts == False:
            is_stop_collecting_contacts = True
            rules.is_stop_collecting_contacts = is_stop_collecting_contacts
        else:
            rules.is_stop_collecting_contacts = is_stop_collecting_contacts
        self.db.add(rules)
        self.db.commit()
        return is_stop_collecting_contacts
        
    def process_certain_activation(self, domain_id):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id, is_url_certain_activation = False)
        is_url_certain_activation = False
        if rules.is_url_certain_activation == False:
            is_url_certain_activation = True
            rules.is_url_certain_activation = is_url_certain_activation
        else:
            rules.is_url_certain_activation = is_url_certain_activation
        self.db.add(rules)
        self.db.commit()
        return is_url_certain_activation
    
    def process_certain_urls(self, domain_id, url_list):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id)
        
        cleaned_urls = [url.replace("/", "").replace(" ", "") for url in url_list if url]
        
        if not cleaned_urls:
            rules.activate_certain_urls = None
        
        rules.activate_certain_urls = ', '.join(cleaned_urls)
        self.db.add(rules)
        self.db.commit()

    def process_based_activation(self, domain_id):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id, is_based_activation = False)
        is_based_activation = False
        if rules.is_based_activation == False:
            is_based_activation = True
            rules.is_based_activation = is_based_activation
        else:
            rules.is_based_activation = is_based_activation
        self.db.add(rules)
        self.db.commit()
        return is_based_activation
        
    def process_based_urls(self, domain_id, identifiers):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id)
        cleaned_identifiers = [identifier.replace("utm_source", "").replace("=", "").replace(" ", "") for identifier in identifiers if identifier]
        
        if not cleaned_identifiers:
            rules.activate_based_urls = None
        
        rules.activate_based_urls = ', '.join(cleaned_identifiers)
        self.db.add(rules)
        self.db.commit()
        
    def process_page_views_limit(self, domain_id, page_views, seconds):
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id)
        if not seconds:
            rules.collection_timeout = None
        if not page_views:
            rules.page_views_limit = None
        else:
            rules.page_views_limit = page_views
            rules.collection_timeout = seconds
        self.db.add(rules)
        self.db.commit()
        