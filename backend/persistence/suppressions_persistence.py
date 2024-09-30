import datetime

from models.suppression_emails import SuppressionEmails
from models.suppressions_list import SuppressionList
from sqlalchemy.orm import Session
from enums import SuppressionStatus
from sqlalchemy.dialects.postgresql import insert
from models.rules import Rules


class SuppressionPersistence:

    def __init__(self, db: Session):
        self.db = db
        
    
    def save_suppressions_list(self, user_id, email_list, list_name, bad_emails=False):
        suppression_list = SuppressionList(
            list_name=list_name,
            created_at=datetime.now(),
            total_emails=None,
            status='incomplete',
            user_id=user_id
        )

        if bad_emails:
            self.db.add(suppression_list)
            self.db.commit()

        email_list_ids = self.save_suppression_emails(email_list)

        if email_list_ids:
            suppression_list.total_emails = email_list_ids
            suppression_list.status = SuppressionStatus.COMPLETED

        self.db.add(suppression_list)
        self.db.commit()

        
    def save_suppression_emails(self, email_list):
        email_list_ids = []
        for email in email_list:
            suppression_emails = insert(SuppressionEmails).values(
                email=email,
            ).on_conflict_do_nothing().returning(SuppressionEmails.id)
            
            result = self.db.execute(suppression_emails)
            self.db.flush()
            
            for row in result:
                email_list_ids.append(row.id)
        
        return email_list_ids

    
    def get_suppression_list(self, user_id):
        suppression_lists = self.db.query(SuppressionList).filter(SuppressionList.user_id == user_id).all()
        
        result = []
        for suppression in suppression_lists:
            total_count = len(suppression.suppression_emails)
            suppression.total_emails = total_count
            result.append(suppression.to_dict())
        
        return result
    
    def delete_suppression_list(self, user_id, suppression_list_id):
        self.db.query(SuppressionList).filter(
            SuppressionList.user_id == user_id,
            SuppressionList.id == suppression_list_id
        ).delete()
        self.db.commit()
        
    def get_suppression_list_by_id(self, user_id, suppression_list_id):
        suppression_lists = self.db.query(SuppressionList).filter(SuppressionList.user_id == user_id, SuppressionList.id == suppression_list_id).first()
        return suppression_lists
    
    def get_rules(self, user_id):
        rules = self.db.query(Rules).filter(Rules.user_id == user_id).first()
        return rules
    
    def save_rules_multiple_emails(self, user_id, emails):
        rules = self.get_rules(user_id=user_id)
        if rules is None:
            rules = Rules(
                created_at = datetime.now(),
                suppressions_multiple_emails = None,
                user_id = user_id
            )

        email_list_ids = self.save_suppression_emails(emails)

        if email_list_ids:
            rules.suppressions_multiple_emails = email_list_ids

        self.db.add(rules)
        self.db.commit()
        
    def process_collecting_contacts(self, user_id):
        rules = self.get_rules(user_id=user_id)
        if rules is None:
            rules = Rules(
                created_at = datetime.now(),
                is_stop_collecting_contacts = False,
                user_id = user_id
            )
        if rules.is_stop_collecting_contacts == False:
            rules.is_stop_collecting_contacts = True
        else:
            rules.is_stop_collecting_contacts = False
        self.db.add(rules)
        self.db.commit()
        
    def process_certain_activation(self, user_id):
        rules = self.get_rules(user_id=user_id)
        if rules is None:
            rules = Rules(
                created_at = datetime.now(),
                activate_certain_urls = False,
                user_id = user_id
            )
        if rules.activate_certain_urls == False:
            rules.activate_certain_urls = True
        else:
            rules.activate_certain_urls = False
        self.db.add(rules)
        self.db.commit()
    
    def process_certain_urls(self, user_id, url_list):
        rules = self.get_rules(user_id=user_id) or Rules(created_at=datetime.now(), user_id=user_id)
        
        cleaned_urls = [url.replace("/", "").replace(" ", "") for url in url_list if url]
        
        if not cleaned_urls:
            return
        
        rules.activate_certain_urls = ''.join(cleaned_urls)
        self.db.add(rules)
        self.db.commit()
