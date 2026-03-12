"""Create table pvs and artifacts

Revision ID: 8b8914fe6aa1
Revises: 55a81f9398df
Create Date: 2026-03-12 09:43:04.908306

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b8914fe6aa1'
down_revision: Union[str, Sequence[str], None] = '55a81f9398df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        -- =========================
        -- NEW TABLES
        -- =========================
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY,
          type TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stores (
          id UUID PRIMARY KEY,
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          name TEXT NOT NULL,
          content JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS artifacts (
          id UUID PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          version TEXT NULL,
          content JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS devices (
          id UUID PRIMARY KEY,
          store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
          description TEXT NOT NULL,
          hd_plc TEXT NULL,
          id_template UUID NULL REFERENCES artifacts(id) ON DELETE SET NULL
        );

        -- =========================
        -- USERS
        -- =========================
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS role INTEGER;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'users_role_fkey'
          ) THEN
            ALTER TABLE users
              ADD CONSTRAINT users_role_fkey
              FOREIGN KEY (role) REFERENCES roles(id) ON DELETE RESTRICT;
          END IF;
        END $$;

        -- richiesta esplicita (anche se email UNIQUE ha gia' indice implicito)
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- =========================
        -- RUNS
        -- =========================
        ALTER TABLE runs
          ADD COLUMN IF NOT EXISTS artifact_id UUID;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'runs_artifact_id_fkey'
          ) THEN
            ALTER TABLE runs
              ADD CONSTRAINT runs_artifact_id_fkey
              FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE RESTRICT;
          END IF;
        END $$;

        -- attenzione: fallisce se hai righe runs con artifact_id NULL
        ALTER TABLE runs
          ALTER COLUMN artifact_id SET NOT NULL;

        -- =========================
        -- INDEXES
        -- =========================
        CREATE INDEX IF NOT EXISTS idx_stores_client ON stores(client_id);

        CREATE INDEX IF NOT EXISTS idx_devices_store ON devices(store_id);
        CREATE INDEX IF NOT EXISTS idx_devices_template ON devices(id_template);

        CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
        CREATE INDEX IF NOT EXISTS idx_artifacts_type_version ON artifacts(type, version);
        CREATE INDEX IF NOT EXISTS idx_artifacts_content_gin ON artifacts USING GIN (content);

        CREATE INDEX IF NOT EXISTS idx_runs_user_created ON runs(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_runs_artifact ON runs(artifact_id);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        -- =========================
        -- DROP INDEXES
        -- =========================
        DROP INDEX IF EXISTS idx_runs_artifact;
        DROP INDEX IF EXISTS idx_runs_user_created;

        DROP INDEX IF EXISTS idx_artifacts_content_gin;
        DROP INDEX IF EXISTS idx_artifacts_type_version;
        DROP INDEX IF EXISTS idx_artifacts_type;

        DROP INDEX IF EXISTS idx_devices_template;
        DROP INDEX IF EXISTS idx_devices_store;

        DROP INDEX IF EXISTS idx_stores_client;

        DROP INDEX IF EXISTS idx_users_email;

        -- =========================
        -- RUNS
        -- =========================
        ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_artifact_id_fkey;
        ALTER TABLE runs DROP COLUMN IF EXISTS artifact_id;

        -- =========================
        -- USERS
        -- =========================
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_fkey;
        ALTER TABLE users DROP COLUMN IF EXISTS role;

        -- =========================
        -- DROP TABLES
        -- =========================
        DROP TABLE IF EXISTS devices;
        DROP TABLE IF EXISTS artifacts;
        DROP TABLE IF EXISTS stores;
        DROP TABLE IF EXISTS clients;
        DROP TABLE IF EXISTS roles;
        """
    )