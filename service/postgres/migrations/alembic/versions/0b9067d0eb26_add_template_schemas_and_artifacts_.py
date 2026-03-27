"""add template_schemas and artifacts.schema_id

Revision ID: 0b9067d0eb26
Revises: 1613a80770d2
Create Date: 2026-03-27 11:14:06.496358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b9067d0eb26'
down_revision: Union[str, Sequence[str], None] = '1613a80770d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
 op.execute(
        """
        CREATE TABLE IF NOT EXISTS template_schemas (
            id UUID PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            content JSONB NOT NULL,
            UNIQUE (name, version)
        );

        ALTER TABLE artifacts
        ADD COLUMN IF NOT EXISTS schema_id UUID NULL;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'artifacts_schema_id_fkey'
          ) THEN
            ALTER TABLE artifacts
              ADD CONSTRAINT artifacts_schema_id_fkey
              FOREIGN KEY (schema_id)
              REFERENCES template_schemas(id)
              ON DELETE SET NULL;
          END IF;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_template_schemas_name_version
          ON template_schemas(name, version);

        CREATE INDEX IF NOT EXISTS idx_artifacts_schema_id
          ON artifacts(schema_id);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS idx_artifacts_schema_id;
        DROP INDEX IF EXISTS idx_template_schemas_name_version;

        ALTER TABLE artifacts
          DROP CONSTRAINT IF EXISTS artifacts_schema_id_fkey;

        ALTER TABLE artifacts
          DROP COLUMN IF EXISTS schema_id;

        DROP TABLE IF EXISTS template_schemas;
        """
    )
