"""Create table

Revision ID: 5b236e8bfa30
Revises: 
Create Date: 2026-02-16 09:36:08.323023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b236e8bfa30'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE "users"(
        "id" UUID PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE "batches"(
            "id" UUID PRIMARY KEY,
            "user_id" UUID NOT NULL,
            "created_at" TIMESTAMPTZ NOT NULL,
            "status" TEXT NOT NULL,
            "total_runs" INTEGER NOT NULL,
            "completed_runs" INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY ("user_id")
                REFERENCES "users"("id")
                ON DELETE RESTRICT
        );

        CREATE TABLE "runs"(
            "run_id" TEXT PRIMARY KEY,
            "batch_id" UUID NOT NULL,
            "user_id" UUID NOT NULL,
            "created_at" TIMESTAMPTZ NOT NULL,
            "artifact_type" TEXT NOT NULL,

            "status" TEXT,
            "committed" BOOLEAN,
            "dry_run_performed" BOOLEAN,

            "dictionary_version" TEXT,
            "kb_version" TEXT,
            "template_base_version" TEXT,
            "device_list_version" TEXT,

            "mapped_count" INTEGER,
            "ambiguous_count" INTEGER,
            "unmapped_count" INTEGER,
            "llm_calls" INTEGER,

            "report" JSONB NOT NULL,

            FOREIGN KEY ("batch_id")
                REFERENCES "batches"("id")
                ON DELETE RESTRICT,

            FOREIGN KEY ("user_id")
                REFERENCES "users"("id")
                ON DELETE RESTRICT
        );

        CREATE INDEX idx_runs_user_id ON "runs"("user_id");
        CREATE INDEX idx_runs_batch_id ON "runs"("batch_id");
        CREATE INDEX idx_runs_created_at ON "runs"("created_at");
        CREATE INDEX idx_runs_artifact_type ON "runs"("artifact_type");
        CREATE INDEX idx_runs_dictionary_version ON "runs"("dictionary_version");

        CREATE INDEX idx_batches_user_id ON "batches"("user_id");
        CREATE INDEX idx_batches_created_at ON "batches"("created_at");

        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP TABLE IF EXISTS runs;
        DROP TABLE IF EXISTS batches;
        DROP TABLE IF EXISTS users;
        """
    )
