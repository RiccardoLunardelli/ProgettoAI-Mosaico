"""Remove batches table and batch_id from runs

Revision ID: 20260304_094410
Revises: 5b236e8bfa30
Create Date: 2026-03-04 09:44:10
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20260304_094410"
down_revision: Union[str, Sequence[str], None] = "5b236e8bfa30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS idx_runs_batch_id;
        ALTER TABLE runs DROP COLUMN IF EXISTS batch_id;

        DROP TABLE IF EXISTS batches;
        """
    )


def downgrade() -> None:
    op.execute(
        """
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

        ALTER TABLE runs ADD COLUMN IF NOT EXISTS batch_id UUID NOT NULL;
        ALTER TABLE runs
            ADD CONSTRAINT runs_batch_id_fkey
            FOREIGN KEY ("batch_id")
            REFERENCES "batches"("id")
            ON DELETE RESTRICT;

        CREATE INDEX idx_runs_batch_id ON "runs"("batch_id");
        CREATE INDEX idx_batches_user_id ON "batches"("user_id");
        CREATE INDEX idx_batches_created_at ON "batches"("created_at");
        """
    )
