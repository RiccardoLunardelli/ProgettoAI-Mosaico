from typing import Any, Dict
from ..core import MCPContext

def schema_get(ctx: MCPContext, schema_id: str) -> Dict[str, Any]:
    # lettura del json in base a schema_id [kb | dictionary | template_base | matching_report | patch_actions]

    return ctx.schema_get(schema_id)

def schema_validate(ctx: MCPContext, schema_id: str, payload: Any) -> Dict[str, Any]:
    # valida payload contro schema

    return ctx.schema_validate(schema_id, payload)
