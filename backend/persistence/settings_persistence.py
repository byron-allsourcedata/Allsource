from models.users import User
from models.api_keys import ApiKeys
from sqlalchemy.orm import Session
from sqlalchemy import update, or_
from sqlalchemy.orm import aliased
from datetime import datetime
from models.users import Users
from fastapi import HTTPException, status
from models.teams_invitations import TeamInvitation
from enums import TeamsInvitationStatus, TeamAccessLevel, SettingStatus


class SettingsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_account_details(self, owner_id, member_id):
        if member_id:
            OwnerAlias = aliased(User)
            MemberAlias = aliased(User)
            return (
                self.db.query(
                    MemberAlias.full_name,
                    MemberAlias.email,
                    MemberAlias.reset_password_sent_at,
                    MemberAlias.is_email_confirmed,
                    MemberAlias.password,
                    OwnerAlias.company_name,
                    OwnerAlias.company_website,
                    OwnerAlias.company_website_visits
                )
                    .join(MemberAlias, MemberAlias.team_owner_id == OwnerAlias.id)
                    .filter(MemberAlias.id == member_id)
                    .first()
            )
        return self.db.query(User.full_name, User.email, User.reset_password_sent_at, User.company_name,
                             User.company_website, User.password,
                             User.company_website_visits, User.is_email_confirmed).filter(User.id == owner_id).first()

    def change_columns_data_by_userid(self, changes: dict, user_id: int):
        stmt = update(User).where(User.id == user_id).values(changes)
        self.db.execute(stmt)
        self.db.commit()

    def billing_overage(self, user_id):
        is_leads_auto_charging = False
        user = self.db.query(Users).filter(Users.id == user_id).first()
        if user.is_leads_auto_charging == True:
            user.is_leads_auto_charging = is_leads_auto_charging
        else:
            is_leads_auto_charging = True
            user.is_leads_auto_charging = is_leads_auto_charging
        self.db.commit()
        return is_leads_auto_charging

    def change_user_role(self, email, access_level):
        user = self.db.query(Users).filter(Users.email == email).first()
        if user:
            if user.team_access_level == TeamAccessLevel.OWNER:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                    detail={'error': SettingStatus.OWNER_ROLE_CHANGE_NOT_ALLOWED.value})
            user.team_access_level = access_level
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
        return self.db.query(TeamInvitation).filter(TeamInvitation.team_owner_id == user_id).all()

    def exists_team_member(self, user_id, user_mail):
        pending_invitations = (
            self.db.query(TeamInvitation)
                .filter(
                TeamInvitation.mail == user_mail,
                TeamInvitation.team_owner_id == user_id
            )
                .first()
        )

        if pending_invitations:
            return True

        user_id = self.db.query(User).filter(User.email == user_mail).first()

        if user_id:
            return True

        return False

    def save_pending_invations_by_userid(self, team_owner_id, user_mail, access_level, md5_hash, invited_by_id):
        teams_invitation = TeamInvitation(mail=user_mail, access_level=access_level,
                                          status=TeamsInvitationStatus.PENDING.value, invited_by_id=invited_by_id,
                                          date_invited_at=datetime.now(), team_owner_id=team_owner_id,
                                          token=md5_hash)
        self.db.add(teams_invitation)
        self.db.commit()

    def pending_invitation_revoke(self, user_id, mail):
        self.db.query(TeamInvitation).filter(
            TeamInvitation.mail == mail,
            TeamInvitation.team_owner_id == user_id
        ).delete()
        self.db.commit()

    def team_members_remove(self, user_id, mail_remove_user, mail):
        result = {
            'success': False
        }
        user_to_update = self.db.query(Users).filter(Users.email == mail_remove_user).first()

        if user_to_update and user_to_update.id == user_id:
            result['error'] = "CANNOT_REMOVE_TEAM_OWNER"
            return result
        if mail_remove_user == mail:
            result['error'] = "CANNOT_REMOVE_YOURSELF_FROM_TEAM"
            return result

        self.db.query(Users).filter(
            Users.email == mail_remove_user,
            Users.team_owner_id == user_id
        ).delete()
        self.db.commit()

        result['success'] = True
        return result
