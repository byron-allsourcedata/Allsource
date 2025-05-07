import os
import csv
import pandas as pd
from fastapi import UploadFile
from io import StringIO
from fastapi.responses import StreamingResponse
from enums import SuppressionStatus
from persistence.suppression_persistence import SuppressionPersistence


class SuppressionService:

    def __init__(self, suppression_persistence: SuppressionPersistence):
        self.suppression_persistence = suppression_persistence
        
    def get_sample_suppression_list(self):
        return os.path.join(os.getcwd(), "data/sample-suppression-list.csv")
    
    def process_actual_contect_days(self, domain_id, days):
        is_url_certain_activation = self.suppression_persistence.process_actual_contect_days(domain_id=domain_id, days=days)
        return {'status': SuppressionStatus.SUCCESS,
                'is_url_certain_activation': is_url_certain_activation
                }
    
    def process_suppression_list(self, file: UploadFile, domain_id):
        file_name = file.filename
        if not file_name.lower().endswith('.csv'):
            return SuppressionStatus.INCOMPLETE
        file_name = file_name.replace('.csv', '')
        contents = file.file.read().decode('utf-8')
        df = pd.read_csv(StringIO(contents))
        email_list = []
        
        for index, row in df.iterrows():
            email = row.get('email')
            if email and (email is not None):
                email_list.append(email)
        if len(email) <= 0:
            return SuppressionStatus.NO_EMAILS_FOUND
        self.suppression_persistence.save_suppressions_list(email_list=email_list, list_name=file_name, domain_id=domain_id)
            
        return SuppressionStatus.SUCCESS
    
    def get_suppression_list(self, page, per_page, domain_id):
        suppression_list, total_count, max_page = self.suppression_persistence.get_suppression_list(page=page, per_page=per_page, domain_id=domain_id)
        return {
            'suppression_list': suppression_list,
            'total_count': total_count,
            'max_page': max_page
        }
    
    def delete_suppression_list(self, suppression_list_id, domain_id):
        if suppression_list_id:
            self.suppression_persistence.delete_suppression_list(suppression_list_id=suppression_list_id, domain_id=domain_id)
            return SuppressionStatus.SUCCESS
        return SuppressionStatus.INCOMPLETE
    
    def download_suppression_list(self, suppression_list_id, domain_id):
        if suppression_list_id:
            suppression_lists = []
            suppression_list = self.suppression_persistence.get_suppression_list_by_id(suppression_list_id=suppression_list_id, domain_id=domain_id)
            if suppression_list:
                suppression_lists.append(suppression_list)

            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['List Name', 'Created At', 'Total Emails', 'Status'])
            for suppression in suppression_lists:
                writer.writerow([
                    suppression.list_name,
                    suppression.created_at,
                    suppression.total_emails,
                    suppression.status
                ])

            output.seek(0)
            return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=suppression_list.csv"})
        return False
    
    def process_suppression_multiple_emails(self, emails, domain_id):
        self.suppression_persistence.save_rules_multiple_emails(emails=emails, domain_id=domain_id)
        return SuppressionStatus.SUCCESS
        
    def get_rules(self, domain_id):
        rules = self.suppression_persistence.get_rules(domain_id)
        if rules:
            return rules.to_dict()
        return None
    
    def process_collecting_contacts(self, domain_id):
        is_stop_collecting_contacts = self.suppression_persistence.process_collecting_contacts(domain_id=domain_id)
        return {'status': SuppressionStatus.SUCCESS,
                'is_stop_collecting_contacts': is_stop_collecting_contacts
                }
        
    def process_certain_activation(self, domain_id):
        is_url_certain_activation = self.suppression_persistence.process_certain_activation(domain_id=domain_id)
        return {'status': SuppressionStatus.SUCCESS,
                'is_url_certain_activation': is_url_certain_activation
                }
        
    def process_certain_urls(self, urls, domain_id):
        self.suppression_persistence.process_certain_urls(url_list=urls, domain_id=domain_id)
        return SuppressionStatus.SUCCESS
        
    def process_based_activation(self, domain_id):
        is_based_activation = self.suppression_persistence.process_based_activation(domain_id=domain_id)
        return {'status': SuppressionStatus.SUCCESS,
                'is_based_activation': is_based_activation
                }
        
    def process_based_urls(self, identifiers, domain_id):
        self.suppression_persistence.process_based_urls(identifiers=identifiers, domain_id=domain_id)
        return SuppressionStatus.SUCCESS
    
    def save_suppress_contact_days(self, days, domain_id):
        self.suppression_persistence.save_suppress_contact_days(domain_id=domain_id, days=days)
        return SuppressionStatus.SUCCESS
        
    def process_page_views_limit(self, page_views: int, seconds: int, domain_id):
        self.suppression_persistence.process_page_views_limit(page_views=page_views, seconds=seconds, domain_id=domain_id)
        return SuppressionStatus.SUCCESS
