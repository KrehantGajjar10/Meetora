"""add_is_organizer_to_users

Revision ID: 6b5b40622ab1
Revises: fa65bcf4618e
Create Date: 2026-09-20 03:05:08.029231

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b5b40622ab1'
down_revision: Union[str, Sequence[str], None] = 'fa65bcf4618e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('is_organizer', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_organizer')

