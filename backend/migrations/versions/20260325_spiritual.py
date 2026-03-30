"""replace astrology with spiritual

Revision ID: 20260325_spiritual
Revises: bbd1e315688c
Create Date: 2026-03-25 23:45:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import pgvector
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260325_spiritual'
down_revision: Union[str, Sequence[str], None] = 'bbd1e315688c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create knowledge_spiritual table
    op.create_table('knowledge_spiritual',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('vision_text', sa.Text(), nullable=True),
        sa.Column('aura_color', sa.String(), nullable=True),
        sa.Column('energy_color', sa.String(), nullable=True),
        sa.Column('energy_sensation', sa.String(), nullable=True),
        sa.Column('guardian_spirit', sa.String(), nullable=True),
        sa.Column('guardian_spirit_feature', sa.Text(), nullable=True),
        sa.Column('past_life_context', sa.Text(), nullable=True),
        sa.Column('atmosphere_vibe', sa.String(), nullable=True),
        sa.Column('spiritual_symbol', sa.String(), nullable=True),
        sa.Column('synchronicity_sign', sa.String(), nullable=True),
        sa.Column('spiritual_message', sa.Text(), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Create persona_templates table
    op.create_table('persona_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Update articles table
    # Rename columns if they exist with old names
    op.alter_column('articles', 'likes', new_column_name='likes_count')
    op.alter_column('articles', 'comments', new_column_name='comments_count')
    op.alter_column('articles', 'score', new_column_name='total_score')
    
    # Add new columns
    op.add_column('articles', sa.Column('used_persona_id', sa.UUID(), nullable=True))
    op.add_column('articles', sa.Column('used_theme_id', sa.UUID(), nullable=True))

    # 4. Drop knowledge_astrology
    op.drop_table('knowledge_astrology')


def downgrade() -> None:
    op.create_table('knowledge_astrology',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('astrology_type', sa.String(), nullable=True),
        sa.Column('theme_or_symbol', sa.String(), nullable=True),
        sa.Column('fatalistic_meaning', sa.Text(), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=1536), nullable=True),
        sa.Column('is_seasonal', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('valid_from', sa.String(), nullable=True),
        sa.Column('valid_until', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.drop_column('articles', 'used_theme_id')
    op.drop_column('articles', 'used_persona_id')
    op.alter_column('articles', 'total_score', new_column_name='score')
    op.alter_column('articles', 'comments_count', new_column_name='comments')
    op.alter_column('articles', 'likes_count', new_column_name='likes')
    op.drop_table('persona_templates')
    op.drop_table('knowledge_spiritual')
