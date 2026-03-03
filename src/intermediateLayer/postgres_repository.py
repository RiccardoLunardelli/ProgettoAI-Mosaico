from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID 

import psycopg2
import psycopg2.extras 
import json
from datetime import datetime

from sqlalchemy import create_engine, String, Integer

from .mapping import extract_run_row

class RunRepository():
    # classe per run

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def save_run(self, run_report: Dict[str, Any], user_id: UUID, batch_id: UUID) -> None:
        # salva run report

        row = extract_run_row(run_report)
        sql = """
        INSERT INTO runs (
            run_id, batch_id, user_id, created_at, artifact_type, status,
            committed, dry_run_performed,
            dictionary_version, kb_version, template_base_version, device_list_version,
            mapped_count, ambiguous_count, unmapped_count, llm_calls,
            report
        )
        VALUES (
            %(run_id)s, %(batch_id)s, %(user_id)s, %(created_at)s, %(artifact_type)s, %(status)s,
            %(committed)s, %(dry_run_performed)s,
            %(dictionary_version)s, %(kb_version)s, %(template_base_version)s, %(device_list_version)s,
            %(mapped_count)s, %(ambiguous_count)s, %(unmapped_count)s, %(llm_calls)s,
            %(report)s
        )
        """
        params = {
            **row,
            "user_id": str(user_id),
            "batch_id": str(batch_id),
            "report": psycopg2.extras.Json(run_report),
        }

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
    
    def get_all_run_ids(self) -> List[str]:
        # ritorna tutti i run_id presenti nel db

        sql = "SELECT run_id FROM runs ORDER BY created_at DESC"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [r[0] for r in rows]

    def get_run(self, run_id: str) -> Dict[str, Any]:
        # ritorna il run report dal run_id

        sql = "SELECT report FROM runs WHERE run_id = %s"
        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=json.loads)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (run_id,))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"run_id not found: {run_id}")
                return row["report"]

    def get_run_id_by_user_id(self, user_id: str) -> List[str]:
        # ritorna tutte le run di uno user

        sql =  "SELECT run_id FROM runs WHERE user_id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id,))
                row = cur.fetchall()
            return [r[0] for r in row]

    def compare_run(self, run_id_a: str, run_id_b: str) -> Dict[str, Any]:
        # confronta due run 

        report_a = self.get_run(run_id_a)
        report_b = self.get_run(run_id_b)

        row_a = extract_run_row(report_a)
        row_b = extract_run_row(report_b)

        metrics_diff = {
            "mapped_count": (row_a["mapped_count"], row_b["mapped_count"]),
            "ambiguous_count": (row_a["ambiguous_count"], row_b["ambiguous_count"]),
            "unmapped_count": (row_a["unmapped_count"], row_b("unmapped_count")),
            "llm_calls": (row_a["llm_calls"], row_b["llm_calls"]),
        }

        return {
            "run_a": report_a,
            "run_b": report_b, 
            "metrics_diff": metrics_diff
        }

    def delete_run(self, run_id: str) -> None:
        # delete di una run da runs

        sql = "DELETE FROM runs WHERE run_id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (run_id,))

    def truncate_runs(self) -> None:
        # tronca la tabella delle runs

        sql = "TRUNCATE table runs CASCADE"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)

class UsersRepository():
    # classe per users

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
    
    def create_user(self, user_id: UUID, email: str, name: Optional[str], created_at: datetime) -> None:
        # creazione user

        sql = """
        INSERT INTO users (id, email, name, created_at)
        VALUES (%s, %s, %s, %s)
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(user_id), email, name, created_at))

    def get_user(self, user_id: UUID) -> Dict[str, Any]:
        # ritorna user con certo id

        sql = "SELECT id, email, name, created_at FROM users WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (str(user_id),))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"user_id not found: {user_id}")
                return dict(row)

    def get_user_by_email(self, email: str) -> Dict[str, Any]:
        # ritorna user con certa mail

        sql = "SELECT id, email, name, created_at FROM users WHERE email = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (email, ))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"email not found: {email}")
                return dict(row)

    def update_user_name(self, user_id: UUID, name: Optional[str]) -> None:
        # aggiorna nome di un user   

        sql = "UPDATE users SET name = %s WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (name, str(user_id)))

    def delete_user(self, user_id: UUID) -> None:
        # elimina user da tabella

        sql = "DELETE FROM users WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(user_id),))

    def truncate_users(self) -> None:
        # tronca la tabella degli users

        sql = "TRUNCATE TABLE users CASCADE"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)

class BatchesRepository():
    # classe per batches 

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
    
    def _validate_and_status(self, total_runs: int, completed_runs: int) -> str:
        # valida stato rispetto a confronto tra total_runs e completed_runs

        if completed_runs > total_runs:
            raise ValueError("completed runs cannot be greater than total runs")
        if completed_runs == total_runs:
            return "completed"
        return "running"

    def create_batch(self, batch_id: UUID, user_id: UUID, created_at: datetime, status: str, total_runs: int, completed_runs: int) -> None:
        # crea batch
        
        sql = """
        INSERT INTO batches (id, user_id, created_at, status, total_runs, completed_runs)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (str(batch_id), str(user_id), created_at, status, total_runs, completed_runs)

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)

    def get_batch(self, batch_id: UUID) -> Dict[str, Any]:
        # ritorna batch di un certo id

        sql = "SELECT id, user_id, created_at, status, total_runs, completed_runs FROM batches WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (str(batch_id),))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"batch_id not found: {batch_id}")
                return dict(row)
    
    def update_batch_status(self, batch_id: UUID, status: Optional[str]) -> None:
        # aggiorna lo stato del batch

        sql = "UPDATE batches SET status = %s WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (status, str(batch_id)))
    
    def increment_completed_runs(self, batch_id: UUID, delta: int = 1) -> None:
        # incrementa run completate 

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT total_runs, completed_runs FROM batches WHERE id = %s", (str(batch_id),))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"batch_id not found: {batch_id}")

                total_runs, completed_runs = row
                new_completed = completed_runs + delta 
                new_status = self._validate_and_status(total_runs, new_completed)

                cur.execute(
                    "UPDATE batches SET completed_runs = %s, status = %s WHERE id = %s",
                    (new_completed, new_status, str(batch_id)),
                )

    def delete_batch(self, batch_id: UUID) -> None:
        # elimina batch da tabella

        sql = "DELETE FROM batches WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(batch_id),))

    def truncate_batches(self) -> None:
        # tronca la tabelle batches

        sql = "TRUNCATE TABLE batches CASCADE"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
