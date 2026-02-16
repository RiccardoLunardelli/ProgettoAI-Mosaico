from __future__ import annotations

from typing import Any, Dict, List 
from uuid import UUID 

import psycopg2
import psycopg2.extras 
import json

from .mapping import extract_run_row

class PostgresRunRepository():
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
        
    def list_runs(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        # ritorna una lista di run report

        where = []
        params: List[Any] = []

        def add(clause: str, value: Any) -> None: 
            where.append(clause)
            params.append(value)
        
        if "user_id" in filters:
            add("user_id = %s", filters["user_id"])
        if "batch_id" in filters:
            add("batch_id = %s", filters["batch_id"])
        if "artifact_type" in filters:
            add("artifact_type = %s", filters["artifact_type"])
        if "status" in filters:
            add("status = %s", filters["status"])
        if "dictionary_version" in filters:
            add("dictionary_version = %s", filters["dictionary_version"])
        if "kb_version" in filters:
            add("kb_version = %s", filters["kb_version"])
        if "template_base_version" in filters:
            add("template_base_version = %s", filters["template_base_version"])
        if "device_list_version" in filters:
            add("device_list_version = %s", filters["device_list_version"])
        if "committed" in filters:
            add("committed = %s", filters["committed"])
        if "dry_run_performed" in filters:
            add("dry_run_performed = %s", filters["dry_run_performed"])
        if "created_from" in filters:
            add("created_at >= %s", filters["created_from"])
        if "created_to" in filters:
            add("created_at <= %s", filters["created_to"])

        sql = "SELECT report FROM runs"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY created_at DESC"

        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=lambda x: x)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()
                return [row["report"] for row in rows]
            
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
