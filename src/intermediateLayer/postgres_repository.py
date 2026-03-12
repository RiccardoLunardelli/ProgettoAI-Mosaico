from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import psycopg2
import psycopg2.extras 
import json
from datetime import datetime

from .mapping import extract_run_row

class RunRepository():
    # classe per run

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def save_run(self, run_report: Dict[str, Any], user_id: UUID | str, artifact_id: UUID | str) -> None:
        # salva run report

        row = extract_run_row(run_report, artifact_id)
        sql = """
        INSERT INTO runs (
            run_id, user_id, artifact_id, created_at, status,
            committed, dry_run_performed,
            mapped_count, ambiguous_count, unmapped_count, llm_calls,
            report
        )
        VALUES (
            %(run_id)s, %(user_id)s, %(artifact_id)s, %(created_at)s, %(status)s,
            %(committed)s, %(dry_run_performed)s,
            %(mapped_count)s, %(ambiguous_count)s, %(unmapped_count)s, %(llm_calls)s,
            %(report)s
        )
        """
        params = {
            **row,
            "user_id": str(user_id),
            "artifact_id": str(artifact_id),
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

    def get_run_template(self, user_id: str) -> List[str]:
        # ritorna tutte le id di uno user specifico dove artefatto è template

        sql = "SELECT run_id FROM runs WHERE user_id = %s AND report #>> '{target,artifact_type}' = 'template' ORDER BY created_at DESC"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id,))
                rows = cur.fetchall()
        return [r[0] for r in rows]

    def get_run_id_by_user_id(self, user_id: str) -> List[str]:
        # ritorna tutte le run di uno user

        sql =  "SELECT run_id, COALESCE(report #>> '{target,artifact_type}', 'unknown') AS artifact_type FROM runs WHERE user_id = %s ORDER BY created_at DESC"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id,))
                row = cur.fetchall()
            return [{"run_id": r[0], "type": r[1]} for r in row]

    def get_diff_report_by_user_id(self, user_id: str) -> Dict[str, Any]:
        # recupera report di user id

        sql = """
                SELECT 
                    run_id,
                    report #> '{diff_summary,changed_paths}' AS changed_paths
                FROM runs
                WHERE user_id = %s
                ORDER BY created_at DESC
            """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id,))
                rows = cur.fetchall()
        return [{"run_id": r[0], "diff": r[1]} for r in rows]

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
    
    def create_user(self, user_id: UUID, email: str, name: Optional[str], password: str, created_at: datetime, role: int) -> None:
        sql = """
        INSERT INTO users (id, email, name, role, password, created_at)
        VALUES (%s, %s, %s, %s, crypt(%s, gen_salt('bf')), %s)
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(user_id), email, name, role, password, created_at))

    def verify_user_password(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        sql = """
        SELECT id, email, name, created_at, role
        FROM users
        WHERE email = %s AND password = crypt(%s, password)
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (email, password))
                row = cur.fetchone()
                return dict(row) if row else None

    def get_user_by_id(self, user_id: UUID) -> Dict[str, Any]:
        # ritorna user con certo id

        sql = "SELECT id, email, name, created_at, role FROM users WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (str(user_id),))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"user_id not found: {user_id}")
                return dict(row)

    def get_user_by_email(self, email: str) -> Dict[str, Any]:
        # ritorna user con certa mail

        sql = "SELECT id, email, name, created_at, role FROM users WHERE email = %s"
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

    def update_user_role(self, role: int, user_id: str) -> Dict[str, Any]:
        # aggiorna il ruolo di un utente

        sql = "UPDATE users SET role = %s WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (role, str(user_id)))
        return {"user_id": user_id, "new_role": role}

    def delete_user(self, user_id: UUID) -> Dict[str, Any]:
        # elimina user da tabella

        sql = "DELETE FROM users WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(user_id),))
        return {"deleted": user_id}

    def get_users(self) -> List[str]:
        # ritorna tutti gli users

        sql = "SELECT id, email, name, created_at, password, role FROM users"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [{
            "id": r[0],
            "email": r[1],
            "name": r[2],
            "created_at": r[3],
            "password": r[4],
            "role": r[5]
        }for r in rows]

    def truncate_users(self) -> None:
        # tronca la tabella degli users

        sql = "TRUNCATE TABLE users CASCADE"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)

class ArtifactRepository():
    # classe per artefatti

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def upsert_artifact(self, artifact_type: str, name: str, version: Optional[str], content: Dict[str, Any]) -> str:
        select_sql = "SELECT id FROM artifacts WHERE type = %s AND name = %s AND COALESCE(version, '') = COALESCE(%s, '') LIMIT 1"
        insert_sql = """
        INSERT INTO artifacts (id, type, name, version, content)
        VALUES (%s, %s, %s, %s, %s)
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(select_sql, (artifact_type, name, version))
                row = cur.fetchone()
                if row:
                    return str(row[0])

                artifact_id = str(uuid4())
                cur.execute(insert_sql, (artifact_id, artifact_type, name, version, psycopg2.extras.Json(content)))
                return artifact_id

    def list_artifact(self, artifact_type) -> List[str]:
        # torna i nomi dei file

        sql = "SELECT name FROM artifacts WHERE type = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (artifact_type,))
                rows = cur.fetchall()
        return [r[0] for r in rows]

    def get_artifact_content(self, artifact_name) -> Dict:
        # ritorna json artefatto

        sql = "SELECT content FROM artifacts WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=json.loads)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (artifact_name,))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"{artifact_name} not found")
                return row["content"]

    def get_artifacts(self) -> List[str]:    
        # ritorna tutti i file

        sql = "SELECT * FROM artifacts"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [{
            "id": r[0],
            "type": r[1],
            "name": r[2],
            "version": r[3]
        }for r in rows]     

    def drop_artifact(self, id) -> Dict[str, Any]:
        # elimina file da db

        sql = "DELETE FROM artifacts WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(id),))
        return {"deleted": id}

class Roles():
    # classe per ruoli

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def upsert_role(self):
        # aggiunge ruoli al db

        sql = """
            INSERT INTO roles (id, type) VALUES
            (1, 'admin'),
            (2, 'user')
            ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type;
            """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)

    def role_exists(self, role_id: int) -> bool:
        # comntrollo se esiste ruolo

        sql = "SELECT 1 FROM roles WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (role_id,))
                return cur.fetchone() is not None
