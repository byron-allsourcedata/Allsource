from domains.teams.invitations.service import TeamsInvitationsService
from persistence.user_persistence import UserDict
from resolver import injectable


@injectable
class TeamsService:
    def __init__(self, invitations: TeamsInvitationsService) -> None:
        self.invitations = invitations
