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

    def get_run_template(self, user_id: str | None) -> List[str]:
        # ritorna tutte le id di uno user specifico dove artefatto è template

        if user_id is not None:
            sql = """
                SELECT
                    r.run_id,
                    a.name AS template_name
                FROM runs r
                LEFT JOIN artifacts a ON a.id = r.artifact_id
                WHERE r.user_id = %s
                AND r.report #>> '{target,artifact_type}' = 'template'
                ORDER BY r.created_at DESC
            """
            params = (str(user_id),)
        else:
            sql = """
                SELECT
                    r.run_id,
                    a.name AS template_name
                FROM runs r
                LEFT JOIN artifacts a ON a.id = r.artifact_id
                WHERE r.report #>> '{target,artifact_type}' = 'template'
                ORDER BY r.created_at DESC
            """
            params = ()

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()

        return [
            {
                "id": r[0],
                "template": r[1],
            }
            for r in rows
        ]

    def get_run_id_by_user_id(self, user_id: str) -> List[str]:
        # ritorna tutte le run di uno user

        sql =  "SELECT r.run_id, COALESCE(r.report #>> '{target,artifact_type}', 'unknown') AS artifact_type, u.email FROM runs r JOIN users u ON u.id = r.user_id WHERE r.user_id = %s ORDER BY r.created_at DESC"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id,))
                row = cur.fetchall()
            return [{"run_id": r[0], "type": r[1], "email": r[2]} for r in row]

    def get_all_run(self) -> List[dict]:
        # ritorna tutte le run

        sql =  "SELECT r.run_id, COALESCE(r.report #>> '{target,artifact_type}', 'unknown') AS artifact_type, u.email FROM runs r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                row = cur.fetchall()
            return [{"run_id": r[0], "type": r[1], "email": r[2]} for r in row]

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

    def get_dictionary_templates_scores(self, dictionary_version: str, id: str | None) -> dict:
        # ritorna info dizionario per template a cui è stato applicato
        sql = """
        SELECT
            r.run_id,
            r.created_at,
            r.report #>> '{source_files,template_path}' AS template_path,
            (r.report #>> '{metrics,dictionary_score}')::float AS dictionary_score
        FROM runs r
        WHERE r.report #>> '{target,artifact_type}' = 'template'
        AND r.report #>> '{source_files,dictionary_version}' = %s
        AND (r.report #>> '{metrics,dictionary_score}') IS NOT NULL
        AND (%s IS NULL OR r.user_id = %s)
        ORDER BY r.created_at DESC
        """

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (dictionary_version, id, id))
                rows = [dict(r) for r in cur.fetchall()]

        # tieni solo l'ultima run per ogni template
        by_template = {}
        for r in rows:
            template_path = r.get("template_path")
            if not template_path:
                continue
            template_name = template_path.split("/")[-1]
            if template_name not in by_template:
                by_template[template_name] = {
                    "run_id": r.get("run_id"),
                    "template": template_name,
                    "template_path": template_path,
                    "score": float(r.get("dictionary_score") or 0.0),
                    "created_at": r.get("created_at"),
                }

        templates = list(by_template.values())
        if templates:
            avg_score = round(sum(t["score"] for t in templates) / len(templates), 4)
        else:
            avg_score = 0.0

        return {
            "dictionary_version": dictionary_version,
            "templates": templates,
            "avg_score": avg_score,
            "templates_count": len(templates),
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
                return dict(row) if row else {}

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

    def update_user(self, user_id: UUID, email: Optional[str] = None, name: Optional[str] = None, password: Optional[str] = None, role: Optional[int] = None) -> None:
        sets = []
        params = []

        if email is not None:
            sets.append("email = %s")
            params.append(email)

        if name is not None:
            sets.append("name = %s")
            params.append(name)

        if password is not None:
            sets.append("password = crypt(%s, gen_salt('bf'))")
            params.append(password)
        
        if role is not None:
            sets.append("role = %s")
            params.append(role)

        if not sets:
            raise ValueError("no fields to update")

        sql = f"""
            UPDATE users
            SET {", ".join(sets)}
            WHERE id = %s
        """
        params.append(str(user_id))

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(params))
                if cur.rowcount == 0:
                    raise KeyError(f"user_id not found: {user_id}")

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

    def upsert_artifact(self, artifact_type: str, name: str, version: Optional[str], content: Dict[str, Any] | str, schema_id: str | None = None) -> str:
        select_sql = "SELECT id FROM artifacts WHERE type = %s AND name = %s AND COALESCE(version, '') = COALESCE(%s, '') LIMIT 1"
        insert_sql = """
        INSERT INTO artifacts (id, type, name, version, content, schema_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(select_sql, (artifact_type, name, version))
                row = cur.fetchone()
                if row:
                    return str(row[0])

                artifact_id = str(uuid4())
                cur.execute(insert_sql, (artifact_id, artifact_type, name, version, psycopg2.extras.Json(content), schema_id,),)
                return artifact_id

    def list_artifact(self, artifact_type) -> List[str]:
        # torna i nomi dei file

        sql = "SELECT id, name, version FROM artifacts WHERE type = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (artifact_type,))
                rows = cur.fetchall()

        return [{"id": r[0], "name": r[1], "version": r[2]} for r in rows]

    def get_artifact_content(self, artifact_id: str, type: str) -> Dict:
        # ritorna json artefatto
    
        if type not in ["device_list", "device_list_context"]:
            sql = "SELECT content FROM artifacts WHERE id = %s"
        else:
            sql = "SELECT content FROM artifacts WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=json.loads)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (artifact_id,))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"{artifact_id} not found")
                return row["content"]

    def get_artifacts(self) -> List[str]:    
        # ritorna tutti i file

        sql = """
            SELECT
                a.id,
                a.type,
                a.name,
                a.version,
                a.schema_id,
                ts.name AS schema_name,
                ts.version AS schema_version
            FROM artifacts a
            LEFT JOIN template_schemas ts ON ts.id = a.schema_id
            ORDER BY a.type, a.name, a.version
            """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [{
            "id": r[0],
            "type": r[1],
            "name": r[2],
            "version": r[3],
            "schema_id": r[4],
            "schema_name": r[5],
            "schema_version": r[6]
        }for r in rows]

    def get_artifact_name_by_id(self, id: str) -> str:
        # ritorna il nome dell artefatto dall id

        sql = "SELECT name FROM artifacts WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (id,))
                row = cur.fetchone()
        return row[0]

    def get_artifacts_by_ids_or_name(self, id: str | None, ids: list[str] | None, name: str | None) -> list[dict]:
        # cerca artifacts per lista ids oppure per name (uno dei due)

        sql_base = "SELECT id, type, name, version FROM artifacts"
        params = ()

        if id:
            sql = sql_base + " WHERE id = %s"
            params = (str(id),)
        elif ids:
            id_list = [str(x) for x in ids]
            sql = sql_base + " WHERE id = ANY(%s::uuid[])"
            params = (id_list,)
        elif name:
            sql = sql_base + " WHERE name = %s"
            params = (name,)
        else:
            raise ValueError("provide id or ids or name")

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()

        return [
            {"id": str(r[0]), "type": r[1], "name": r[2], "version": r[3]}
            for r in rows
        ]

    def get_artifact_by_type_and_version(self, artifact_type: str, version: str) -> dict | None:
        sql = """
        SELECT id, type, name, version, content
        FROM artifacts
        WHERE type = %s AND version = %s
        ORDER BY name
        LIMIT 1
        """
        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=json.loads)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (artifact_type, version))
                row = cur.fetchone()
                return dict(row) if row else None

    def get_last_version_of_artifact(self, artifact_type: str) -> dict | None:
        # prende l ultima versione dell artefatto dal db

        sql = """
        SELECT id, type, name, version, content
        FROM artifacts
        WHERE type = %s
        ORDER BY
        COALESCE(NULLIF(split_part(version, '.', 1), ''), '0')::int DESC,
        COALESCE(NULLIF(split_part(version, '.', 2), ''), '0')::int DESC,
            id DESC
        LIMIT 1
        """
        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=json.loads)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (artifact_type,))
                row = cur.fetchone()
                return dict(row) if row else None

    def get_last_template_base_id(self) -> str:
    # ritorna id dell'ultima versione di template_base

        sql = """
        SELECT id
        FROM artifacts
        WHERE type = 'template_base'
        ORDER BY
        COALESCE(NULLIF(split_part(version, '.', 1), ''), '0')::int DESC,
        COALESCE(NULLIF(split_part(version, '.', 2), ''), '0')::int DESC,
        id DESC
        LIMIT 1
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                row = cur.fetchone()

        if not row:
            raise KeyError("template_base not found")

        return str(row[0])

    def get_last_device_context_version_by_store(self, store: str) -> str | None:
        # recupera l'ultima versione di device_list_context dello store

        sql = """
        SELECT version
        FROM artifacts
        WHERE type = 'device_list_context'
        AND name LIKE %s
        ORDER BY
        COALESCE(NULLIF(split_part(version, '.', 1), ''), '0')::int DESC,
        COALESCE(NULLIF(split_part(version, '.', 2), ''), '0')::int DESC
        LIMIT 1
        """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (f"{store}/device_list_context_v%.json",))
                row = cur.fetchone()
                return row[0] if row else None

    def get_artifact_version_by_id(self, id: str) -> str:
        # prende la versione dell'artefatto

        sql = "SELECT version FROM artifacts WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (id,))
                row = cur.fetchone()
        return row[0]

    def get_artifact_schema_id(self, artifact_id: str) -> str | None:

        sql = "SELECT schema_id FROM artifacts WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (artifact_id,))
                row = cur.fetchone()
                if not row:
                    raise KeyError(f"artifact not found: {artifact_id}")
                return str(row[0]) if row[0] is not None else None

    def insert_schema_id(self, artifact_id: str, schema_id: str) -> None:

        sql = "UPDATE artifacts SET schema_id = %s WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (schema_id, artifact_id))
                if cur.rowcount == 0:
                    raise KeyError(f"artifact_id not found: {artifact_id}")

    def drop_artifact(self, ids) -> Dict[str, Any]:
        # elimina file da db

        id_list = [str(x) for x in ids]
        if not id_list:
            return {"deleted": [], "runs_deleted": 0, "devices_unlinked": 0}

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:

                # 1) elimina runs collegate
                cur.execute("DELETE FROM runs WHERE artifact_id = ANY(%s::uuid[])", (id_list,),)
                runs_deleted = cur.rowcount

                # 2) scollega devices che puntano quei template
                cur.execute("UPDATE devices SET id_template = NULL WHERE id_template = ANY(%s::uuid[])",(id_list,),)
                devices_unlinked = cur.rowcount

                # 3) elimina artifacts richiesti
                cur.execute("DELETE FROM artifacts WHERE id = ANY(%s::uuid[]) RETURNING id",(id_list,),)
                deleted = [str(r[0]) for r in cur.fetchall()]

        return {
            "deleted": deleted,
            "runs_deleted": runs_deleted,
            "devices_unlinked": devices_unlinked,
        }

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

class Clients():
    # classe per clienti

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def list_clients(self) -> list[str]:
        # ritorna tutti i clienti

        sql = "SELECT * FROM clients"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [
            {
              "id": r[0],
              "name": r[1]  
            } for r in rows
        ]

    def upsert_client(self, name) -> str:
        # inserisce clienti

        sql = "INSERT INTO clients (id, name) VALUES (%s, %s)"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                id = str(uuid4())
                cur.execute(sql, (id, name))
        return {"insert client": name}
    
    def client_exists(self, name) -> Dict[str, Any]:
        # controllo se esiste gia cliente

        sql = "SELECT * FROM clients WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (name,))
                row = cur.fetchone()
        return row if row else {}

    def delete_client(self, name: str):
        # elimina cliente dal db

        sql = "DELETE FROM clients WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (name, ))
        return {"deleted": name}

    def update_name(self, new_name: str, name: str):
        # aggiorna nome di un cliente
        
        sql = "UPDATE clients SET name = %s WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (new_name, name))
        return {"updated client": name}

class Stores():
    # classe per i pt vendita

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def _resolve_template_id_from_guid(self, cur, template_guid: str | None) -> str | None:
        
        if not template_guid:
            return None

        # mapping: artifacts.type='template' e name='<TemplateGUID>.json'
        cur.execute("SELECT id FROM artifacts WHERE type = 'template' AND name = %s LIMIT 1",(f"{template_guid}.json",),)
        row = cur.fetchone()
        if not row:
            return None

        # compatibile sia tuple cursor sia RealDictCursor
        if isinstance(row, dict):
            return str(row.get("id"))
        return str(row[0])
    
    def _device_exists(self, cur, store_id: str, description: str) -> bool:
        # controlla se esiste gia device

        cur.execute("SELECT 1 FROM devices WHERE store_id = %s AND description = %s LIMIT 1",(store_id, description),)
        return cur.fetchone() is not None

    def insert_device_from_content(self, cur, store_id: str, store_name: str, content) -> dict:
    # inserisce device nel db partendo dal content dello store

        if not isinstance(content, list):
            return {"devices_inserted": 0, "devices_skipped": 0}

        inserted = 0
        skipped = 0

        for idx, item in enumerate(content, start=1):
            description = (item.get("Description") or "").strip()
            if not description:
                skipped += 1
                continue

            if self._device_exists(cur, store_id, description):
                skipped += 1
                continue

            template_guid = item.get("TemplateGUID")
            id_template = self._resolve_template_id_from_guid(cur, template_guid)

            # hd_plc placeholder inventato
            idptd = item.get("IDPTD") or f"D{idx:04d}"
            hd_plc = f"PLC_FAKE.{store_name}.{idptd}"

            cur.execute(
                """
                INSERT INTO devices (id, store_id, description, hd_plc, id_template)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (str(uuid4()), store_id, description, hd_plc, id_template),
            )
            inserted += 1

        return {"devices_inserted": inserted, "devices_skipped": skipped}

    def upsert_store(self, client_id: UUID | str, store_name: str, content: Dict[str, Any] | list[dict]) -> Dict[str, Any]:
        # inserisce store

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                store_id = str(uuid4())
                cur.execute("INSERT INTO stores (id, client_id, name, content) VALUES (%s, %s, %s, %s)",(store_id, str(client_id), store_name, psycopg2.extras.Json(content)),)
                # qua ci va inserimento device in devices nel db da content
                device_stats = self.insert_device_from_content(cur, store_id, store_name, content)
                return {"id": store_id, "client_id": str(client_id), "name": store_name, "action": "inserted", **device_stats}

    def update_store(self, id: UUID, client_id: UUID | None, new_name: str | None):
        # aggiorna store

        sets = []
        params = []

        if client_id is not None:
            sets.append("client_id = %s")
            params.append(str(client_id))

        if new_name is not None:
            sets.append("name = %s")
            params.append(new_name)

        if not sets:
            raise ValueError("no fields to update")

        sql = f"""
            UPDATE stores
            SET {", ".join(sets)}
            WHERE id = %s
        """
        params.append(str(id))

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(params))
                if cur.rowcount == 0:
                    raise KeyError(f"store_id not found: {id}")

    def list_store(self) -> list[str]:
        # ritorna lista store

        sql = "SELECT * FROM stores"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [
            {
                "id": r[0],
                "client_id": r[1],
                "name": r[2],
                "content": r[3]
            } for r in rows
        ]

    def store_exists(self, name: str) -> Dict[str, Any]:
        # controlla se uno store esiste gia

        sql = "SELECT * FROM stores WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql , (name,))
                row = cur.fetchone()
        return row if row else {}

    def delete_store(self, name):
        # elimina store

        sql = "DELETE FROM stores WHERE name = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (name,))
        return {"deleted": name}

class Devices():
    # classe per devices

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def list_devices(self) -> list[str]:
        # restituisce i device

        sql = """
            SELECT
                d.id,
                d.store_id,
                s.name AS store_name,
                d.description,
                d.hd_plc,
                d.id_template
            FROM devices d
            LEFT JOIN stores s ON s.id = d.store_id
            ORDER BY s.name, d.description
            """
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [
            {
                "id": r[0],
                "store_id": r[1],
                "store_name": r[2],
                "description": r[3],
                "hd_plc": r[4],
                "id_template": r[5]
            } for r in rows
        ]

    def insert_device(self, store_id: UUID, description: str, hd_plc: str, id_template: UUID | None):
        # inserimento device

        sql = "INSERT INTO devices (id, store_id, description, hd_plc, id_template) VALUES (%s, %s, %s, %s, %s)"
        device_id = uuid4()
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    sql,
                    (str(device_id), str(store_id), description, hd_plc, str(id_template) if id_template else None),
                )
        return str(device_id)

    def update_device(self, id: UUID, store_id: UUID | None, description: str | None, hd_plc: str | None, id_template: UUID | None):
        # aggiorna device nel db

        sets = []
        params = []

        if store_id is not None:
            sets.append("store_id = %s")
            params.append(str(store_id))

        if description is not None:
            sets.append("description = %s")
            params.append(description)
        
        if hd_plc is not None:
            sets.append("hd_plc = %s")
            params.append(hd_plc)
        
        if id_template is not None:
            sets.append("id_template = %s")
            params.append(str(id_template))
        
        if not sets:
            raise ValueError("no field to update")
    
        sql = f"""
            UPDATE devices
            SET {", ".join(sets)}
            WHERE id = %s
        """
        params.append(str(id))

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(params))
                if cur.rowcount == 0:
                    raise KeyError(f"device_id not found: {id}")

    def delete_device(self, id: UUID):
        # delete di un device dal db

        sql = "DELETE FROM devices WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(id),))
        return {"deleted": id}

    def device_exist(self, id):
        # check device in db

        sql = "SELECT * FROM devices WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(id),))
                row = cur.fetchone()
        return {
                "id": row[0],
                "store_id": row[1],
                "description": row[2],
                "hd_plc": row[3],
                "id_template": row[4]
                } if row else {}

class Template():

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def get_template_usage(self, id: str) -> list[str]:
        # ritorna i dispositivi e store che usano template

        sql = """
        SELECT
            a.id          AS template_id,
            a.name        AS template_name,
            a.version     AS template_version,
            c.id          AS client_id,
            c.name        AS client_name,
            s.id          AS store_id,
            s.name        AS store_name,
            d.id          AS device_id,
            d.description AS device_description,
            d.hd_plc      AS device_hd_plc
        FROM artifacts a
        LEFT JOIN devices d ON d.id_template = a.id
        LEFT JOIN stores s  ON s.id = d.store_id
        LEFT JOIN clients c ON c.id = s.client_id
        WHERE a.type = 'template' AND a.id = %s
        ORDER BY a.name, c.name, s.name, d.description
        """

        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (str(id),))
                rows = cur.fetchall()
                return [dict(r) for r in rows]

    def insert_templates_metadata(self, artifact_id: str, author: str | None = None, category: str | None = None, name: str | None = None, product: str | None = None) -> None: 
        # inserisce metadati in templates 

        sql = "INSERT INTO templates (id, author, category, name, product) VALUES (%s, %s, %s, %s, %s)"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (artifact_id, author, category, name, product))

class Schema():

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
    
    def insert_schema(self, name: str, version: str, content: dict) -> str:
        # inserisce schema nel db

        sql = "INSERT INTO template_schemas (id, name, version, content) VALUES (%s, %s, %s, %s)"
        schema_id = str(uuid4())
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (schema_id, name, version, psycopg2.extras.Json(content)),)

        return schema_id
    
    def get_schema_by_id(self, schema_id: str) -> dict:
        # ritorna lo schema dall id

        sql = "SELECT content FROM template_schemas WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            psycopg2.extras.register_default_jsonb(conn, loads=json.loads)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, (schema_id,))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"template_schema not found: {schema_id}")
                return row["content"]

    def get_schema_name_by_id(self, schema_id: str) -> str:
        # ritorna nome dello schema dall'id 

        sql = "SELECT name FROM template_schemas WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (schema_id,))
                row = cur.fetchone()
                if row is None:
                    raise KeyError(f"template_schema not found: {schema_id}")
                return row[0]

    def list_schemas(self) -> List[Dict[str, Any]]:
        # ritorna tutti gli schemi presenti nel db 

        sql = "SELECT id, name, version FROM template_schemas ORDER BY name, version"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return [{"id": str(r[0]), "name": r[1], "version": r[2]} for r in rows]

    def drop_schema(self, schema_id: UUID) -> None:
        # elimina schema dal db

        sql = "DELETE FROM template_schemas WHERE id = %s"
        with psycopg2.connect(self._dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(schema_id),))

