"""runs user fk on delete cascade

Revision ID: 4beda523ab5a
Revises: 01b9aa08f78c
Create Date: 2026-03-30 13:31:54.483471

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4beda523ab5a'
down_revision: Union[str, Sequence[str], None] = '01b9aa08f78c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("runs_user_id_fkey", "runs", type_="foreignkey")
    op.create_foreign_key(
        "runs_user_id_fkey",
        "runs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("runs_user_id_fkey", "runs", type_="foreignkey")
    op.create_foreign_key(
        "runs_user_id_fkey",
        "runs",
        "users",
        ["user_id"],
        ["id"],
    )
