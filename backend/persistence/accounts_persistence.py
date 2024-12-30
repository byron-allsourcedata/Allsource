from models.partners import Partners
from models.accounts import Accounts
from sqlalchemy.orm import Session
from typing import Optional


class AccountsPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_accounts(self):
        return self.db.query(Accounts).all()
    

    def get_accounts_by_partner_id(self, partner_id):
        return self.db.query(Accounts).filter(Accounts.partner_id == partner_id).all()
    

    

    