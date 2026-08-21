"""worker skill to skills json

Revision ID: 4d2e0aa5cf1c
Revises:
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa

revision = '4d2e0aa5cf1c'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add new skills JSON column (default empty array)
    op.add_column('workers', sa.Column('skills', sa.JSON(), nullable=True))

    # Copy existing single skill into a JSON array
    op.execute("UPDATE workers SET skills = json_build_array(skill::text) WHERE skill IS NOT NULL")
    op.execute("UPDATE workers SET skills = '[]'::json WHERE skill IS NULL")

    # Make not-nullable now that all rows are populated
    op.alter_column('workers', 'skills', nullable=False)

    # Drop the old enum column
    op.drop_column('workers', 'skill')


def downgrade():
    skillenum = sa.Enum(
        'painter', 'mason', 'electrician', 'plumber', 'carpenter',
        'welder', 'tiles_worker', 'helper', 'construction_laborer',
        name='skillenum',
    )
    op.add_column('workers', sa.Column('skill', skillenum, nullable=True))
    op.execute("UPDATE workers SET skill = (skills->>0)::skillenum WHERE jsonb_array_length(skills::jsonb) > 0")
    op.drop_column('workers', 'skills')
