"""drop fields from runs

Revision ID: f7961ac7bd99
Revises: 8b8914fe6aa1
Create Date: 2026-03-12 15:05:24.830604

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7961ac7bd99'
down_revision: Union[str, Sequence[str], None] = '8b8914fe6aa1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE runs DROP COLUMN IF EXISTS artifact_type;
        ALTER TABLE runs DROP COLUMN IF EXISTS dictionary_version;
        ALTER TABLE runs DROP COLUMN IF EXISTS kb_version;
        ALTER TABLE runs DROP COLUMN IF EXISTS template_base_version;
        ALTER TABLE runs DROP COLUMN IF EXISTS device_list_version;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE runs ADD COLUMN IF NOT EXISTS artifact_type TEXT;
        ALTER TABLE runs ADD COLUMN IF NOT EXISTS dictionary_version TEXT;
        ALTER TABLE runs ADD COLUMN IF NOT EXISTS kb_version TEXT;
        ALTER TABLE runs ADD COLUMN IF NOT EXISTS template_base_version TEXT;
        ALTER TABLE runs ADD COLUMN IF NOT EXISTS device_list_version TEXT;
        """
    )
