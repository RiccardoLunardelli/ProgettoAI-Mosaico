from typing import Dict
import copy 
import re
from pathlib import Path
from ..core import MCPContext
from .dictionary_tool import _next_versioned_path, _extract_version_from_path

def kb_load(ctx: MCPContext, path: str) -> Dict:
    # lettura file json della Knowledge Base

    p = ctx.ensure_within_root(path)
    return ctx.read_json(p)

def kb_save(ctx: MCPContext, path: str, versioned: Dict) -> Dict:
    # Salva la nuova versione della kb

    p = ctx.ensure_within_root(path)
    ctx.require_validated(versioned)
    ctx.write_json(p, versioned)
    return {"status": "ok", "path": str(p)}

def kb_upsert_mapping(ctx: MCPContext, path: str, patch: Dict, dry_run: bool) -> Dict:
    # Aggiunge / aggiorna regole del mapping della KB

    p = ctx.ensure_within_root(path)
    kb = kb_load(ctx, str(p))

    ctx.schema_validate("kb", kb)
    ctx.schema_validate("kb_patch", patch)

    new_kb = copy.deepcopy(kb) # preview
    mappings = new_kb.setdefault("mappings", [])
    scopes = new_kb.setdefault("scopes", [])

    for op in patch.get("operations", []):
        #-----ADD KB RULE-------
        if op["op"] == "add_kb_rule":
            mappings.append({
                "scope_id": op["scope_id"],
                "source_type": op["source_type"],
                "source_key": op["source_key"],
                "concept_id": op["concept_id"],
                "reason": op["reason"],
                "evidence": op["evidence"],
                "semantic_category": op["semantic_category"]
            })
        
        # -------UPDATE KB RULE------------
        elif op["op"] == "update_kb_rule":
            scope_id = op["scope_id"]
            source_type = op["source_type"]
            source_key = op["source_key"]

            updated = False
            for m in mappings:
                if m["scope_id"] == scope_id and m["source_type"] == source_type and m["source_key"] == source_key:
                    if op.get("concept_id") is not None:
                        m["concept_id"] = op["concept_id"]
                    if op.get("reason") is not None:
                        m["reason"] = op["reason"]
                    if op.get("evidence") is not None:
                        m["evidence"] = op["evidence"]
                    if op.get("semantic_category") is not None:
                        m["semantic_category"] = op["semantic_category"]

                    updated = True
                    break 
            if not updated:
                raise ValueError(f"KB rule not found for scope_id={scope_id}, source_type={source_type}, source_key={source_key}")
        #---------ADD SCOPE----------
        elif op["op"] == "add_scope":
            scope = op.get("scope")
            if not isinstance(scope, dict):
                raise ValueError("add_scope richiede 'scope' (object)")

            match = scope.get("match")
            source = scope.get("source")
            scope_id = scope.get("scope_id")

            if not isinstance(match, dict):
                raise ValueError("add_scope.scope.match deve essere un object")
            if not isinstance(source, dict):
                raise ValueError("add_scope.scope.source deve essere un object")
            if not scope_id or not isinstance(scope_id, str):
                raise ValueError("add_scope.scope.scope_id mancante o non valido")

            # evita duplicati
            if any(s.get("scope_id") == scope_id for s in scopes):
                raise ValueError(f"scope_id già presente: {scope_id}")

            scopes.append({
                "scope_id": scope_id,
                "match": {
                    "template_guid": match.get("template_guid"),
                    "device_id": match.get("device_id"),
                    "device_role": match.get("device_role"),
                    "type_fam": match.get("type_fam"),
                    "enum": match.get("enum"),
                },
                "source": {
                    "evidence": source.get("evidence")
                }
            })


        else:
            raise ValueError(f"Unsupported operation: {op['op']}")
        
    if dry_run:
        ctx.mark_dry_run(patch)
        return {"status": "dry_run_ok", "preview": new_kb}

    ctx.require_dry_run(patch)

    output_path = _next_versioned_path(p)
    new_kb["kb_version"] = _extract_version_from_path(output_path)
    
    ctx.schema_validate("kb", new_kb)
    kb_save(ctx, str(output_path), new_kb)
    return {"status": "committed", "output_path": str(output_path)}
