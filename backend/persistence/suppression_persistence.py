import datetime
import math

from models.suppression_email import SuppressionEmail
from models.suppressions_list import SuppressionList
from sqlalchemy.orm import Session
from enums import SuppressionStatus
from sqlalchemy.dialects.postgresql import insert
from models.suppression_rule import SuppressionRule
from models.users_domains import UserDomains


class SuppressionPersistence:

    def __init__(self, db: Session):
        self.db = db
        
    def get_domain_id(self, user_id):
        return self.db.query(UserDomains.id).filter(UserDomains.user_id == user_id).scalar()
    
    
    def save_suppressions_list(self, user_id, email_list, list_name, bad_emails=False):
        domain_id = self.get_domain_id(user_id)
        suppression_list = SuppressionList(
            list_name=list_name,
            created_at=datetime.now(),
            total_emails=None,
            status=SuppressionStatus.INCOMPLETE.value.lower(),
            domain_id=domain_id
        )

        if bad_emails:
            self.db.add(suppression_list)
            self.db.commit()

        email_list_ids = self.save_suppression_emails(email_list)

        if email_list_ids:
            suppression_list.total_emails = email_list_ids
            suppression_list.status = SuppressionStatus.COMPLETED.value.lower()

        self.db.add(suppression_list)
        self.db.commit()

        
    def save_suppression_emails(self, email_list):
        email_list_ids = []
        for email in email_list:
            suppression_emails = insert(SuppressionEmail).values(
                email=email,
            ).on_conflict_do_nothing().returning(SuppressionEmail.id)
            
            result = self.db.execute(suppression_emails)
            self.db.flush()
            
            for row in result:
                email_list_ids.append(row.id)
        
        return email_list_ids

    
    def get_suppression_list(self, user_id, page, per_page):
        domain_id = self.get_domain_id(user_id)
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
            total_count = len(suppression.suppression_emails)
            suppression.total_emails = total_count
            result.append(suppression.to_dict())

        total_count = self.db.query(SuppressionList).filter(SuppressionList.domain_id == domain_id).count()
        max_page = math.ceil(total_count / per_page)

        return result, total_count, max_page

    
    def delete_suppression_list(self, user_id, suppression_list_id):
        domain_id = self.get_domain_id(user_id)
        self.db.query(SuppressionList).filter(
            SuppressionList.domain_id == domain_id,
            SuppressionList.id == suppression_list_id
        ).delete()
        self.db.commit()
        
    def get_suppression_list_by_id(self, user_id, suppression_list_id):
        domain_id = self.get_domain_id(user_id)
        suppression_lists = self.db.query(SuppressionList).filter(SuppressionList.domain_id == domain_id, SuppressionList.id == suppression_list_id).first()
        return suppression_lists
    
    def get_rules(self, domain_id):
        rules = self.db.query(SuppressionRule).filter(SuppressionRule.domain_id == domain_id).first()
        return rules
    
    def save_rules_multiple_emails(self, user_id, emails):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id)

        email_list_ids = self.save_suppression_emails(emails)

        if email_list_ids:
            rules.suppressions_multiple_emails = email_list_ids

        self.db.add(rules)
        self.db.commit()
        
    def process_collecting_contacts(self, user_id):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id, is_stop_collecting_contacts = False)
        if rules.is_stop_collecting_contacts == False:
            rules.is_stop_collecting_contacts = True
        else:
            rules.is_stop_collecting_contacts = False
        self.db.add(rules)
        self.db.commit()
        
    def process_certain_activation(self, user_id):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id, is_url_certain_activation = False)
        if rules.is_url_certain_activation == False:
            rules.is_url_certain_activation = True
        else:
            rules.is_url_certain_activation = False
        self.db.add(rules)
        self.db.commit()
    
    def process_certain_urls(self, user_id, url_list):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id)
        
        cleaned_urls = [url.replace("/", "").replace(" ", "") for url in url_list if url]
        
        if not cleaned_urls:
            rules.activate_certain_urls = None
        
        rules.activate_certain_urls = ', '.join(cleaned_urls)
        self.db.add(rules)
        self.db.commit()

    def process_based_activation(self, user_id):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), domain_id=domain_id, is_based_activation = False)
        if rules.is_based_activation == False:
            rules.is_based_activation = True
        else:
            rules.is_based_activation = False
        self.db.add(rules)
        self.db.commit()
        
    def process_based_urls(self, user_id, identifiers):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), user_id=user_id)
        cleaned_identifiers = [identifier.replace("utm_source", "").replace("=", "").replace(" ", "") for identifier in identifiers if identifier]
        
        if not cleaned_identifiers:
            rules.activate_based_urls = None
        
        rules.activate_based_urls = ', '.join(cleaned_identifiers)
        self.db.add(rules)
        self.db.commit()
        
    def process_page_views_limit(self, user_id, page_views, seconds):
        domain_id = self.get_domain_id(user_id)
        rules = self.get_rules(domain_id=domain_id) or SuppressionRule(created_at=datetime.now(), user_id=user_id)
        if not seconds:
            rules.collection_timeout = None
        if not page_views:
            rules.page_views_limit = None
        else:
            rules.page_views_limit = page_views
            rules.collection_timeout = seconds
        self.db.add(rules)
        self.db.commit()
        