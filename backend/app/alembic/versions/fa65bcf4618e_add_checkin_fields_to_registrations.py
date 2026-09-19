"""add_checkin_fields_to_registrations

Revision ID: fa65bcf4618e
Revises: 32d22e531b8d
Create Date: 2026-09-20 01:21:27.973523

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa65bcf4618e'
down_revision: Union[str, Sequence[str], None] = '32d22e531b8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('registrations', sa.Column('is_checked_in', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('registrations', sa.Column('checked_in_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('registrations', 'checked_in_at')
    op.drop_column('registrations', 'is_checked_in')

