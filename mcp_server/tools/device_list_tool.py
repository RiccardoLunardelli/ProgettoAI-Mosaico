from typing import Any, Dict
from ..core import MCPContext

def device_list_enrich(ctx: MCPContext, path: str) -> Dict:
    # validazione path

    p = ctx.ensure_within_root(path)
    return {"status": "ok", "path": str(p)}