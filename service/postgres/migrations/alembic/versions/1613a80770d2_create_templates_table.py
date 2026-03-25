"""create templates table

Revision ID: 1613a80770d2
Revises: f7961ac7bd99
Create Date: 2026-03-25 08:49:13.735960

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1613a80770d2'
down_revision: Union[str, Sequence[str], None] = 'f7961ac7bd99'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS templates (
            id UUID PRIMARY KEY,
            author TEXT NOT NULL,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            product TEXT NOT NULL,
            version TEXT NOT NULL,
            content JSONB NOT NULL,
            FOREIGN KEY (id) REFERENCES artifacts(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_templates_author ON templates(author);
        CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
        CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
        CREATE INDEX IF NOT EXISTS idx_templates_version ON templates(version);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS idx_templates_version;
        DROP INDEX IF EXISTS idx_templates_name;
        DROP INDEX IF EXISTS idx_templates_category;
        DROP INDEX IF EXISTS idx_templates_author;
        DROP TABLE IF EXISTS templates;
        """
    )
