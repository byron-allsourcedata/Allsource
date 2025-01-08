from models.partners import Partners
from models.partners_invitations import ParntersInvitations
from sqlalchemy.orm import Session
from typing import Optional


class ParntersInvitationsPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_accounts(self):
        return self.db.query(ParntersInvitations).all()
    

    def get_accounts_by_partner_id(self, partner_id):
        return self.db.query(ParntersInvitations).filter(ParntersInvitations.partner_id == partner_id).all()
    

    

    