import logging
import os
import csv
import pandas as pd

from fastapi import UploadFile
from io import StringIO
from fastapi.responses import StreamingResponse
from persistence.suppression_persistence import SuppressionPersistence


class SuppressionService:

    def __init__(self, suppression_persistence: SuppressionPersistence):
        self.suppression_persistence = suppression_persistence
        
    def get_sample_suppression_list(self):
        return os.path.join(os.getcwd(), "sample-suppression-list.csv")
    
    def process_suppression_list(self, user: dict, file: UploadFile):
        file_name = file.filename
        if not file_name.lower().endswith('.csv'):
            return False
        contents = file.file.read().decode('utf-8')
        df = pd.read_csv(StringIO(contents))
        email_list = []
        
        for index, row in df.iterrows():
            email = row.get('email')
            if email and (email is not None):
                email_list.append(email)
        if len(email) > 0:
            self.suppression_persistence.save_suppressions_list(user_id=user.get('id'), email_list=email_list, list_name=file_name)
        else:
            self.suppression_persistence.save_suppressions_list(user_id=user.get('id'), email_list=email_list, list_name=file_name, bad_emails=True)
            
        return True
    
    def get_suppression_list(self, user: dict, page, per_page):
        suppression_list, total_count, max_page = self.suppression_persistence.get_suppression_list(user_id=user.get('id'), page=page, per_page=per_page)
        return {
            'suppression_list': suppression_list,
            'total_count': total_count,
            'max_page': max_page
        }
    
    def delete_suppression_list(self, user: dict, suppression_list_id):
        if suppression_list_id:
            self.suppression_persistence.delete_suppression_list(user_id=user.get('id'), suppression_list_id=suppression_list_id)
            return True
        return False
    
    def download_suppression_list(self, user: dict, suppression_list_id):
        if suppression_list_id:
            suppression_lists = []
            suppression_list = self.suppression_persistence.get_suppression_list_by_id(user_id=user.get('id'), suppression_list_id=suppression_list_id)
            if suppression_list:
                suppression_lists.append(suppression_list)

            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'List Name', 'Created At', 'Total Emails', 'Status'])
            for suppression in suppression_lists:
                writer.writerow([
                    suppression.id,
                    suppression.list_name,
                    suppression.created_at,
                    suppression.total_emails,
                    suppression.status
                ])

            output.seek(0)
            return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=suppression_list.csv"})
        return False
    
    def process_suppression_multiple_emails(self, user: dict, emails):
        self.suppression_persistence.save_rules_multiple_emails(user_id=user.get('id'), emails=emails)
        
    def get_rules(self, user: dict):
        rules = self.suppression_persistence.get_rules(user.get('id'))
        if rules:
            return rules.to_dict
        return None
    
    def process_collecting_contacts(self, user: dict):
        self.suppression_persistence.process_collecting_contacts(user_id=user.get('id'))
        
    def process_certain_activation(self, user: dict):
        self.suppression_persistence.process_certain_activation(user_id=user.get('id'))
        
    def process_certain_urls(self, user: dict, urls):
        self.suppression_persistence.process_certain_urls(user_id=user.get('id'), url_list=urls)
        
    def process_based_activation(self, user: dict):
        self.suppression_persistence.process_based_activation(user_id=user.get('id'))
        
    def process_based_urls(self, user: dict, identifiers):
        self.suppression_persistence.process_based_urls(user_id=user.get('id'), identifiers=identifiers)
        
    def process_page_views_limit(self, user: dict, page_views: int, seconds: int):
        self.suppression_persistence.process_page_views_limit(user_id=user.get('id'), page_views=page_views, seconds=seconds)
