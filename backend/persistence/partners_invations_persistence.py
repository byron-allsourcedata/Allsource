from models.partners import Partners
from models.partners_users_invitation import ParntersUsersInvitation
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta


class ParntersInvitationsPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_accounts(self):
        return self.db.query(ParntersUsersInvitation).all()


    def get_accounts(self, partner_id, search_term=None, start_date=None, end_date=None, offset=0, limit=10):
        query = self.db.query(ParntersUsersInvitation).filter(ParntersUsersInvitation.partner_id == partner_id)

        if search_term:
            search_term = f"%{search_term}%"
            query = query.filter(
                (ParntersUsersInvitation.name.ilike(search_term)) | 
                (ParntersUsersInvitation.email.ilike(search_term))
            )

        if start_date:
            start_date = self._parse_date(start_date)
            query = query.filter(ParntersUsersInvitation.join_date >= start_date)

        if end_date:
            end_date = self._parse_date(end_date, end_of_day=True)
            query = query.filter(ParntersUsersInvitation.join_date <= end_date)

        return query.offset(offset).limit(limit).all()

    def get_total_count(self, partner_id, search_term=None):
        query = self.db.query(ParntersUsersInvitation).filter(ParntersUsersInvitation.partner_id == partner_id)

        if search_term:
            search_term = f"%{search_term}%"
            query = query.filter(
                (ParntersUsersInvitation.name.ilike(search_term)) | 
                (ParntersUsersInvitation.email.ilike(search_term))
            )

        return query.count()

    def _parse_date(self, date_str, end_of_day=False):
        if isinstance(date_str, str):
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        else:
            date_obj = date_str

        if end_of_day:
            return datetime.combine(date_obj, datetime.max.time())
        return date_obj
