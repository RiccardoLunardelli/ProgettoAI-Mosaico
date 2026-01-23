from typing import Dict
import copy 
import re
from pathlib import Path
from ..core import MCPContext
from .dictionary_tool import _next_versioned_path

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

    new_kb = copy.deepcopy(kb)
    mappings = new_kb.setdefault("mappings", [])

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
                    updated = True
                    break 
            if not updated:
                raise ValueError(f"KB rule not found for scope_id={scope_id}, source_type={source_type}, source_key={source_key}")
        else:
            raise ValueError(f"Unsupported operation: {op['op']}")
        
    if dry_run:
        ctx.mark_dry_run(patch)
        return {"status": "dry_run_ok", "preview": new_kb}

    ctx.require_dry_run(patch)
    ctx.schema_validate("kb", new_kb)

    output_path = _next_versioned_path(p)
    kb_save(ctx, str(output_path), new_kb)
    return {"status": "committed", "output_path": str(output_path)}
