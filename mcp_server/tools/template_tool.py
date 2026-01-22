from typing import Any, Dict
from ..core import MCPContext
import copy

def template_load(ctx: MCPContext, path: str) -> Dict:
    # caricamento e lettura template

    p = ctx.ensure_within_root(path)
    return ctx.read_json(p)

def template_save(ctx: MCPContext, path: str, template: Dict[str, Any]) -> Dict[str, Any]:
    # salvataggio template

    ctx.require_validated(template)
    p = ctx.ensure_within_root(path)
    ctx.write_json(p, template)
    return {"status": "ok", "path": str(p)}

def template_apply_patch(ctx: MCPContext, path: str, patch_actions: Dict[str, Any], dry_run: bool) -> Dict[str, Any]:
    # Protegge l’accesso al filesystem, Legge un template JSON, Prevede un meccanismo di preview e diff

    p = ctx.ensure_within_root(path)
    template = ctx.read_json(p)

    # applicazione patch
    preview = template  # template modificato

    diff = ctx.diff_json(template, preview)

    # dry_run --> true = simula, False = scrive nel file
    if dry_run:
        # registra che queste patch_actions sono state eseguite in dry_run
        ctx.mark_dry_run(patch_actions)
        return {"status": "dry_run_ok", "diff": diff, "preview": preview}
    
    ctx.require_dry_run(patch_actions)
    ctx.write_json(p, preview)  # scrive contenuto finale sul file
    return {"status": "committed", "diff": diff}
