from mcp.server.fastmcp import FastMCP
from .tools import template_tool, schema_tool, kb_tool, dictionary_tool, device_list_tool

mcp = FastMCP("MCP-Server")

# ----------------TEMPLATE-----------------------
@mcp.tool()
def template_load(path: str) -> dict:
    pass

@mcp.tool()
def template_save(path: str, template: dict) -> dict:
    pass

@mcp.tool()
def template_apply_path(path: str, patch: dict, dru_run: bool) -> dict:
    pass

# ----------------SCHEMA------------------------
@mcp.tool()
def schema_validate(schema_id: str, payload: dict) -> dict:
    pass

@mcp.tool()
def schema_get(schema_id: str) -> dict:
    pass

# ---------------DIZIONARIO-------------------------
@mcp.tool()
def dictionary_search(text: str, lang: str) -> dict:
    pass

@mcp.tool()
def dictionary_upsearch(entry: dict) -> dict:
    pass

@mcp.tool()
def dictionary_bulk_suggest(terms: list) -> dict:
    pass

#-------------KNOWLEDGE BASE------------------------
@mcp.tool()
def kb_load() -> dict:
    pass

@mcp.tool()
def kb_save(versioned: dict) -> dict:
    pass

@mcp.tool()
def kb_upsert_mapping(mapping: dict) -> dict:
    pass

# ----------------DEVICE-------------------------
@mcp.tool()
def device_list_enrich(path: str) -> dict:
    pass