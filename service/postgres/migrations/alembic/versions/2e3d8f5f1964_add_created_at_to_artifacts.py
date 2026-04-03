"""add created_at to artifacts

Revision ID: 2e3d8f5f1964
Revises: 960aab002237
Create Date: 2026-04-03 08:48:22.069635

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2e3d8f5f1964'
down_revision: Union[str, Sequence[str], None] = '960aab002237'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE artifacts
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

        UPDATE artifacts
        SET created_at = NOW()
        WHERE created_at IS NULL;

        ALTER TABLE artifacts
        ALTER COLUMN created_at SET DEFAULT NOW();

        ALTER TABLE artifacts
        ALTER COLUMN created_at SET NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_artifacts_created_at
          ON artifacts(created_at DESC);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS idx_artifacts_created_at;
        ALTER TABLE artifacts DROP COLUMN IF EXISTS created_at;
        """
    )
