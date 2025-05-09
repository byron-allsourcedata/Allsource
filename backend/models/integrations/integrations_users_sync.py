from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean, JSON, UUID, ForeignKey, Index, BigInteger, text, \
    String, DateTime
from sqlalchemy.dialects.postgresql import ENUM
from datetime import datetime, timezone
from models.enrichment.enrichment_users import EnrichmentUser
from models.base import Base

data_sync_type = ENUM('pixel', 'audience', name='data_sync_type', create_type=True)


class IntegrationUserSync(Base):
    __tablename__ = 'integrations_users_sync'
    __table_args__ = (
        Index('integrations_users_sync_created_at_idx', 'created_at'),
        Index('integrations_users_sync_domain_id_idx', 'domain_id'),
        Index('integrations_users_sync_leads_type_idx', 'sync_type'),
        Index('integrations_users_sync_smart_audience_id_idx', 'smart_audience_id'),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('integrations_users_sync_id_seq'::regclass)")
    )
    integration_id = Column(
        BigInteger,
        ForeignKey('users_domains_integrations.id', ondelete='CASCADE'),
        nullable=False
    )
    sync_type = Column(
        data_sync_type,
        nullable=False,
        server_default=text("'pixel'::data_sync_type")
    )
    is_active = Column(Boolean, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=False),
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    last_sync_date = Column(TIMESTAMP, nullable=True)
    list_id = Column(VARCHAR, nullable=True)
    list_name = Column(VARCHAR, nullable=True)
    domain_id = Column(
        BigInteger,
        ForeignKey('users_domains.id', ondelete='CASCADE'),
        nullable=True
    )
    data_map = Column(JSON, nullable=True)
    leads_type = Column(VARCHAR, nullable=True)
    platform_user_id = Column(BigInteger, nullable=True)
    sync_status = Column(Boolean, nullable=True)
    no_of_contacts = Column(
        Integer,
        nullable=True,
        server_default=text('0')
    )
    created_by = Column(String(256), nullable=True)
    last_lead_sync_id = Column(
        BigInteger,
        ForeignKey('leads_users.id'),
        nullable=True
    )
    hook_url = Column(VARCHAR, nullable=True)
    last_sent_lead_id = Column(
        BigInteger,
        ForeignKey('leads_users.id'),
        nullable=True
    )
    method = Column(String(8), nullable=True)
    customer_id = Column(VARCHAR, nullable=True)
    result_file_url = Column(String(256), nullable=True)
    sent_contacts = Column(
        BigInteger,
        nullable=False,
        server_default=text('0')
    )
    smart_audience_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_smarts.id', ondelete='CASCADE'),
        nullable=True
    )
    campaign_id = Column(VARCHAR, nullable=True)
    campaign_name = Column(VARCHAR, nullable=True)
    last_sent_enrichment_id = Column(
        UUID(as_uuid=True),
        ForeignKey(EnrichmentUser.id, ondelete='SET NULL'),
        nullable=True
    )
