from typing import Dict
from ..core import MCPContext

def kb_load(ctx: MCPContext) -> Dict:
    # lettura file json della Knowledge Base

    return ctx.read_json(ctx.repo_root/"data"/"kb_v0.1.json")

def kb_save(ctx: MCPContext, versioned: Dict) -> Dict:
    # scrive json

    path = ctx.repo_root/"data"/"kb_v0.1.json"
    ctx.write_json(path, versioned)
    return {"status": "ok"}

def kb_upsert_mapping(ctx: MCPContext, mapping: Dict) -> Dict:
    # Aggiunge / aggiorna KB

    path = ctx.repo_root/"data"/"kb_v0.1.json"
    kb = ctx.read_json(path)
    kb.setdefault("mapping", []).append(mapping)
    ctx.write_json(path, kb)
    return {"status": "ok"}
