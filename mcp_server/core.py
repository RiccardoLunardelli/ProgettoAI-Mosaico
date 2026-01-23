import json
import hashlib
from pathlib import Path
from typing import Any, Dict

try:
    import jsonschema
except ImportError:
    jsonschema = None

class MCPError(RuntimeError):
    pass

class MCPContext:
    def __init__(self, repo_root: str):
        self.repo_root = Path(repo_root).resolve()
        self.schemas_root = self.repo_root/"schemas"  
        self._validated_hashes: Dict[str, str] = {}
        self._dry_run_hashes: Dict[str, bool] = {}

        self.schema_map = {
            "patch_actions": "patch_actions_v1.schema.json",
            "maching_report": "matching_report_v1.schema.json",
            "template_base": "template_base_v1.schema.json",
            "dictionary": "dictionary_v0.1.schema.json",
            "kb": "kb_v0.1.schema.json",
            "dictionary_patch": "dictionary_patch_v1.schema.json",
        }
    
    def ensure_within_root(self, path: str) -> Path:
        # allowlist path

        p = Path(path).resolve()
        if self.repo_root not in p.parents and p != self.repo_root:
            raise MCPError(f"path_not_allowed: {p}")
        return p
    
    def read_json(self, path: Path) -> Any:
        # lettura file json

        return json.loads(path.read_text(encoding="utf-8"))

    def write_json(self, path: Path, payload: Any) -> None:
        # scrittura file json

        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def hash_payload(self, payload: Any) -> str:
        # hash per validazione

        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(raw).hexdigest()
    
    def schema_get(self, schema_id: str) -> Dict[str, Any]:
        # lettura di uno dei file json in schema_map

        if schema_id not in self.schema_map:
            raise MCPError(f"schema_not_found: {schema_id}")
        return self.read_json(self.schemas_root/self.schema_map[schema_id])

    def schema_validate(self, schema_id: str, payload: Any) -> Dict[str, Any]:
        # validazione payload con schema json

        if jsonschema is None:
            raise MCPError("jsonschema_missing")
        schema = self.schema_get(schema_id) 
        jsonschema.validate(instance=payload, schema=schema)
        payload_hash = self.hash_payload(payload)
        self._validated_hashes[payload_hash] = schema_id
        return {"status": "ok", "schema_id": schema_id}

    def mark_dry_run(self, patch_actions: Dict[str, Any]) -> None:
        # calcola hash del payload (patc_actions) e registra quell'hash in _dry_run_hashes

        self._dry_run_hashes[self.hash_payload(patch_actions)] = True

    def require_dry_run(self, patch_actions: Dict[str, Any]) -> None:
        # ricalcola l'hash e controlla se è stato marcato con mark_dy_run

        if self.hash_payload(patch_actions) not in self._dry_run_hashes:
            raise MCPError("commit_without_dry_run")

    def require_validated(self, payload: Any) -> None:
        # verifica che il payload sia stato validato contro uno schema
        
        if self.hash_payload(payload) not in self._validated_hashes:
            raise MCPError("save_without_validation")

    def diff_json(self, a: Any, b: Any, prefix: str = "") -> list:
        # Controlla due strutture JSON

        diffs = []
        if isinstance(a, dict) and isinstance(b, dict):
            keys = set(a.keys()) | set(b.keys())
            for k in sorted(keys):
                if k not in a:
                    diffs.append(f"{prefix}/{k} added")
                elif k not in b:
                    diffs.append(f"{prefix}/{k} removed")
                else:
                    diffs.extend(self.diff_json(a[k], b[k], prefix + "/" + k))
        elif a != b:
            diffs.append(f"{prefix} changed")
        return diffs