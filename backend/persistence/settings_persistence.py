from models.users import User
from models.api_keys import ApiKeys
from sqlalchemy.orm import Session
from sqlalchemy import update, or_
from sqlalchemy.orm import aliased
from datetime import datetime
from models.users import Users
from models.teams_invitations import TeamInvitation
from enums import TeamsInvitationStatus

class SettingsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_account_details(self, user_id):
        return self.db.query(User).filter(User.id == user_id).first()
    
    def change_columns_data_by_userid(self, changes: dict, user_id: int):
        stmt = update(User).where(User.id == user_id).values(changes)
        self.db.execute(stmt)
        self.db.commit()
        
    def set_reset_email_sent_now(self, user_id):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.change_email_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()
    
    def set_reset_password_sent_now(self, user_id):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.reset_password_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()
        
    def get_api_details(self, user_id):
        return self.db.query(
            ApiKeys.api_key,
            ApiKeys.description,
            ApiKeys.created_date,
            ApiKeys.name,
            ApiKeys.id,
            ApiKeys.api_id,
            ApiKeys.last_used_at
        ).filter(ApiKeys.user_id == user_id).all()
    
    def change_columns_data_api_details(self, changes, user_id, api_keys_id):
        stmt = update(ApiKeys).where(
            (ApiKeys.user_id == user_id) & (ApiKeys.id == api_keys_id)
        ).values(changes)

        self.db.execute(stmt)
        self.db.commit()
        
    def delete_data_api_details(self, user_id, api_keys_id):
        self.db.query(ApiKeys).filter(
            ApiKeys.user_id == user_id,
            ApiKeys.id == api_keys_id
        ).delete()
        self.db.commit()
        
    def insert_data_api_details(self, user_id, api_keys_request):
        new_api_key = ApiKeys(
            user_id=user_id,
            api_key=api_keys_request.api_key,
            api_id=api_keys_request.api_id,
            name=api_keys_request.name,
            description=api_keys_request.description,
            created_date=datetime.now()
        )
        self.db.add(new_api_key)
        self.db.commit()
        
    def get_team_members_by_userid(self, user_id):
        inviter = aliased(User)
        invited = aliased(User)
        return self.db.query(invited, inviter.email) \
            .outerjoin(inviter, invited.invited_by_id == inviter.id) \
            .filter(or_(invited.team_owner_id == user_id, invited.id == user_id)) \
            .order_by(inviter.email) \
            .all()
    
    def get_pending_invations_by_userid(self, user_id):
        return self.db.query(TeamInvitation).filter(TeamInvitation.teams_owner_id == user_id).all()
    
    def exists_team_member(self, user_id, user_mail):
        pending_invitations = (
            self.db.query(TeamInvitation)
            .filter(
                TeamInvitation.mail == user_mail,
                TeamInvitation.teams_owner_id == user_id
            )
            .first()
        )
        
        if pending_invitations:
            return True

        user_id = self.db.query(User.id).filter(User.email == user_mail).scalar()
        
        if user_id:
            user_team_member = self.db.query(User).filter(User.team_owner_id == user_id).first()
            if user_team_member:
                return True
            
        return False

    
    def save_pending_invations_by_userid(self, user_id, user_mail, access_level, md5_hash):
        teams_invitation = TeamInvitation(mail=user_mail, access_level=access_level, status=TeamsInvitationStatus.PENDING, date_invited_by = datetime.now(), teams_owner_id = user_id,
                                          md5_hash=md5_hash)
        self.db.add(teams_invitation)
        self.db.commit()
        
    def pending_invitation_revoke(self, user_id, mail):
        self.db.query(TeamInvitation).filter(
            TeamInvitation.mail == mail,
            TeamInvitation.teams_owner_id == user_id
        ).delete()
        self.db.commit()
        
    def team_members_remove(self, user_id, mail):
        result = {
            'success': False
        }
        user_to_update = self.db.query(Users).filter(Users.email == mail).first()
        
        if user_to_update and user_to_update.id == user_id:
            result['error'] = True
            result['status'] = "Cannot remove team owner!"
        
        self.db.query(Users).filter(Users.email == mail, Users.team_owner_id == user_id).update(
            {Users.team_owner_id: None},
            synchronize_session=False
        )
        self.db.commit()
        result['success'] = True
        
        return result