"""add_knowledge_settings_to_persona_template

Revision ID: be02e9641d7a
Revises: 20260325_spiritual
Create Date: 2026-03-28 00:59:10.712005

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'be02e9641d7a'
down_revision: Union[str, Sequence[str], None] = '20260325_spiritual'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add column
    op.add_column('persona_templates', sa.Column('knowledge_settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # 2. Set default for existing rows
    default_settings = '{"spiritual": true, "mindfulness": true, "empathy": true, "reframing": true, "style": true, "experience": true}'
    op.execute(f"UPDATE persona_templates SET knowledge_settings = '{default_settings}'")

def downgrade() -> None:
    op.drop_column('persona_templates', 'knowledge_settings')
