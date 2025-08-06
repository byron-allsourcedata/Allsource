from models.users import Users
from persistence.user_persistence import UserDict
from resolver import injectable
from services.auth.claim import Claim
from services.jwt_service import create_access_token


@injectable
class JwtService:
    def __init__(self) -> None:
        pass

    def prepare_claim(self, user_obj: Users) -> Claim:
        user = user_obj.__dict__
        user_id = user["id"]
        team_owner_id = user["team_owner_id"]

        if team_owner_id:
            claim = Claim(id=team_owner_id, team_member_id=user_id)
        else:
            claim = Claim(user_id)

        if "admin" in user["role"]:
            claim.role = "admin"

        return claim

    def encode_claim(self, claim: Claim) -> str:
        return create_access_token(claim.get_dict())

    def generate_token(self, user: UserDict) -> str:
        claim = self.prepare_claim(user)
        return self.encode_claim(claim)
