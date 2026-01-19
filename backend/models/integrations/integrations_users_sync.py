from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    VARCHAR,
    TIMESTAMP,
    Boolean,
    JSON,
    UUID,
    ForeignKey,
    Index,
    BigInteger,
    text,
    String,
    Sequence,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from models.base import Base
from models.enrichment.enrichment_users import EnrichmentUser

data_sync_type = ENUM(
    "audience", "contact", name="data_sync_type", create_type=True
)


class IntegrationUserSync(Base):
    __tablename__ = "integrations_users_sync"

    id = Column(
        BigInteger,
        Sequence("integrations_users_sync_id_seq", metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    integration_id = Column(
        BigInteger,
        ForeignKey("users_domains_integrations.id", ondelete="CASCADE"),
        nullable=False,
    )
    sync_type = Column(
        data_sync_type,
        nullable=False,
        server_default=text("'contact'::data_sync_type"),
    )
    is_active = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(
        TIMESTAMP(timezone=False),
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    last_sync_date = Column(TIMESTAMP, nullable=True)
    list_id = Column(VARCHAR, nullable=True)
    list_name = Column(VARCHAR, nullable=True)
    domain_id = Column(
        BigInteger,
        ForeignKey("users_domains.id", ondelete="CASCADE"),
        nullable=True,
    )
    data_map = Column(JSON, nullable=True)
    leads_type = Column(VARCHAR, nullable=True)
    platform_user_id = Column(BigInteger, nullable=True)
    sync_status = Column(Boolean, nullable=False, server_default=text("true"))
    no_of_contacts = Column(Integer, nullable=False, server_default=text("0"))
    created_by = Column(String(256), nullable=True)
    hook_url = Column(VARCHAR, nullable=True)
    last_sent_lead_id = Column(
        BigInteger,
        ForeignKey("leads_users.id", ondelete="CASCADE"),
        nullable=True,
    )
    # ClickHouse progress pointer (UUID v1 from allsource_prod.leads_users.id)
    last_sent_ch_lead_id = Column(PG_UUID(as_uuid=True), nullable=True)
    method = Column(String(8), nullable=True)
    customer_id = Column(VARCHAR, nullable=True)
    result_file_url = Column(String(256), nullable=True)
    sent_contacts = Column(BigInteger, nullable=False, server_default=text("0"))
    smart_audience_id = Column(
        UUID(as_uuid=True),
        ForeignKey("audience_smarts.id", ondelete="CASCADE"),
        nullable=True,
    )
    campaign_id = Column(VARCHAR, nullable=True)
    campaign_name = Column(VARCHAR, nullable=True)

    __table_args__ = (
        Index("integrations_users_sync_created_at_idx", created_at),
        Index("integrations_users_sync_domain_id_idx", domain_id),
        Index("integrations_users_sync_leads_type_idx", sync_type),
        Index(
            "integrations_users_sync_smart_audience_id_idx", smart_audience_id
        ),
        Index(
            "integrations_users_sync_created_at_sync_type_idx",
            created_at,
            sync_type,
        ),
        Index(
            "integrations_users_sync_last_sent_ch_lead_id_idx",
            last_sent_ch_lead_id,
        ),
    )
