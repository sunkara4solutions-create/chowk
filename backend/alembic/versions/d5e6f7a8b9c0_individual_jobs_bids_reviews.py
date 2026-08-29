"""individual jobs, bids, reviews

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-08-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'd5e6f7a8b9c0'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make contractor_id nullable on jobs (individual jobs have no contractor)
    op.alter_column('jobs', 'contractor_id', nullable=True)

    # Add individual job fields to jobs table
    op.add_column('jobs', sa.Column('job_type', sa.String(20), nullable=False, server_default='contractor'))
    op.add_column('jobs', sa.Column('poster_phone', sa.String(15), nullable=True))
    op.add_column('jobs', sa.Column('poster_name', sa.String(100), nullable=True))
    op.add_column('jobs', sa.Column('title', sa.String(200), nullable=True))

    # Add rating fields to workers
    op.add_column('workers', sa.Column('average_rating', sa.Float(), nullable=True))
    op.add_column('workers', sa.Column('review_count', sa.Integer(), nullable=True, server_default='0'))

    # Create bids table
    op.create_table(
        'bids',
        sa.Column('bid_id', UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', UUID(as_uuid=True), sa.ForeignKey('jobs.job_id'), nullable=False),
        sa.Column('worker_id', UUID(as_uuid=True), sa.ForeignKey('workers.worker_id'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_bids_job_id', 'bids', ['job_id'])
    op.create_index('ix_bids_worker_id', 'bids', ['worker_id'])

    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('review_id', UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', UUID(as_uuid=True), sa.ForeignKey('jobs.job_id'), nullable=False),
        sa.Column('worker_id', UUID(as_uuid=True), sa.ForeignKey('workers.worker_id'), nullable=False),
        sa.Column('reviewer_phone', sa.String(15), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_reviews_worker_id', 'reviews', ['worker_id'])


def downgrade() -> None:
    op.drop_table('reviews')
    op.drop_table('bids')
    op.drop_column('workers', 'review_count')
    op.drop_column('workers', 'average_rating')
    op.drop_column('jobs', 'title')
    op.drop_column('jobs', 'poster_name')
    op.drop_column('jobs', 'poster_phone')
    op.drop_column('jobs', 'job_type')
    op.alter_column('jobs', 'contractor_id', nullable=False)
