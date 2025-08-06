class Claim:
    id: int
    role: str | None = None
    team_member_id: int | None = None

    def __init__(self, id: int, team_member_id: int | None = None) -> None:
        self.id = id
        self.team_member_id = team_member_id

    def get_dict(self):
        claim_dict = {
            "id": self.id,
            "role": self.role,
            "team_member_id": self.team_member_id,
        }

        return {k: v for k, v in claim_dict.items() if v is not None}

    def is_team_member(self) -> bool:
        return self.team_member_id is not None
