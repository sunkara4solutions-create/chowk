"""add worker location and device tokens

Revision ID: a1b2c3d4e5f6
Revises: 5e3b1f90c2d7
Create Date: 2026-07-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'a1b2c3d4e5f6'
down_revision = '5e3b1f90c2d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('workers', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('workers', sa.Column('longitude', sa.Float(), nullable=True))

    op.create_table(
        'device_tokens',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('phone', sa.String(15), nullable=False, index=True),
        sa.Column('token', sa.String(500), nullable=False),
        sa.Column('platform', sa.String(10), server_default='android'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('phone', 'token', name='uq_phone_token'),
    )


def downgrade() -> None:
    op.drop_table('device_tokens')
    op.drop_column('workers', 'longitude')
    op.drop_column('workers', 'latitude')
