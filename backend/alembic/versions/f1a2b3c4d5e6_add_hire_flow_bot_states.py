"""add hire flow bot states

Revision ID: f1a2b3c4d5e6
Revises: d5e6f7a8b9c0
Create Date: 2026-09-14
"""
from alembic import op

revision = 'f1a2b3c4d5e6'
down_revision = 'd5e6f7a8b9c0'
branch_labels = None
depends_on = None

NEW_VALUES = [
    'hire_title', 'hire_skill', 'hire_date', 'hire_location',
    'hire_city', 'hire_rate', 'hire_confirm',
]


def upgrade() -> None:
    for value in NEW_VALUES:
        op.execute(f"ALTER TYPE botstate ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # Postgres does not support removing values from an enum type; no-op.
    pass
