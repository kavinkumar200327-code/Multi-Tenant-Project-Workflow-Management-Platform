"""Add organization_id to notifications

Revision ID: 2b894c3d1f0a
Revises: 1e975a2b6aea
Create Date: 2026-10-13 12:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2b894c3d1f0a'
down_revision: Union[str, Sequence[str], None] = '1e975a2b6aea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'notifications',
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True)
    )
    op.create_index(
        'ix_notifications_organization_id',
        'notifications',
        ['organization_id'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_notifications_organization_id', table_name='notifications')
    op.drop_column('notifications', 'organization_id')
