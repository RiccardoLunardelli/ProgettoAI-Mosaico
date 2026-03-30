"""store devices fk on delete cascade

Revision ID: 960aab002237
Revises: 4beda523ab5a
Create Date: 2026-03-30 13:58:41.169534

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '960aab002237'
down_revision: Union[str, Sequence[str], None] = '4beda523ab5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("devices_store_id_fkey", "devices", type_="foreignkey")
    op.create_foreign_key(
        "devices_store_id_fkey",
        "devices",
        "stores",
        ["store_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("devices_store_id_fkey", "devices", type_="foreignkey")
    op.create_foreign_key(
        "devices_store_id_fkey",
        "devices",
        "stores",
        ["store_id"],
        ["id"],
    )
