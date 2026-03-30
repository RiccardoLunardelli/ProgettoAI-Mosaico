"""drop content and version from templates

Revision ID: 01b9aa08f78c
Revises: 0b9067d0eb26
Create Date: 2026-03-30 11:55:55.302096

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01b9aa08f78c'
down_revision: Union[str, Sequence[str], None] = '0b9067d0eb26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("templates", "content")
    op.drop_column("templates", "version")

def downgrade() -> None:
    op.add_column("templates", sa.Column("version", sa.Integer(), nullable=True))
    op.add_column("templates", sa.Column("content", sa.JSON(), nullable=True))
