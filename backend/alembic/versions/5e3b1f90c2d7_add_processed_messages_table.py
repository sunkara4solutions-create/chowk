"""add processed_messages table

Revision ID: 5e3b1f90c2d7
Revises: 4d2e0aa5cf1c
Create Date: 2026-06-13 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "5e3b1f90c2d7"
down_revision: Union[str, None] = "4d2e0aa5cf1c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "processed_messages",
        sa.Column("message_id", sa.String(200), primary_key=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("processed_messages")
