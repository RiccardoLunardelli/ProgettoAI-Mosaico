"""Add password hash

Revision ID: 55a81f9398df
Revises: 20260304_094410
Create Date: 2026-03-04 10:00:05.632590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '55a81f9398df'
down_revision: Union[str, Sequence[str], None] = '20260304_094410'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
        """
    )


def downgrade() -> None:
   op.execute(
        """
        ALTER TABLE users DROP COLUMN IF EXISTS password;
        """
    )