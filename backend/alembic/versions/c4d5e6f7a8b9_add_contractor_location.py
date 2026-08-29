"""add contractor location fields

Revision ID: c4d5e6f7a8b9
Revises: a1b2c3d4e5f6
Create Date: 2026-08-28
"""
from alembic import op
import sqlalchemy as sa

revision = 'c4d5e6f7a8b9'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('contractors', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('contractors', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('contractors', sa.Column('location_verified', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('contractors', 'location_verified')
    op.drop_column('contractors', 'longitude')
    op.drop_column('contractors', 'latitude')
