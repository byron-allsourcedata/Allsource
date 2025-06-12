from sqlalchemy import select

from db_dependencies import Db
from models import EnrichmentEmails, EnrichmentUser, EnrichmentUsersEmails
from resolver import injectable


@injectable
class EnrichmentUsersPersistence:
    def __init__(self, db: Db):
        self.db = db

    def fetch_user_emails(self, emails: list[str]):
        return self.db.execite(
            select(EnrichmentEmails.email, EnrichmentUser.id)
            .join(
                EnrichmentUsersEmails,
                EnrichmentEmails.id == EnrichmentUsersEmails.email_id,
            )
            .join(
                EnrichmentUser,
                EnrichmentUsersEmails.enrichment_user_id == EnrichmentUser.id,
            )
            .filter(EnrichmentEmails.email.in_(emails))
        ).all()
