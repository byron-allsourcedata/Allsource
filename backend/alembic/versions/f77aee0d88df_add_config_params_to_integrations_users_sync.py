"""add config_params to integrations_users_sync

Revision ID: f77aee0d88df
Revises: 62e7fe69f5c6
Create Date: 2025-01-13 23:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f77aee0d88df'
down_revision: Union[str, None] = '62e7fe69f5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'integrations_users_sync',
        sa.Column('config_params', postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('integrations_users_sync', 'config_params')

