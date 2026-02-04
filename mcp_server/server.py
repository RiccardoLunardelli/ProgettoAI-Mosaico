from mcp.server.fastmcp import FastMCP
from .core import MCPContext
from .tools import template_tool, schema_tool, kb_tool, dictionary_tool, device_list_tool

mcp = FastMCP("MCP-Server")
ctx = MCPContext(repo_root=".")

# ----------------TEMPLATE-----------------------
@mcp.tool() 
def template_load(path: str) -> dict:
    return template_tool.template_load(ctx, path)

@mcp.tool()
def template_save(path: str, template: dict) -> dict:
    return template_tool.template_save(ctx, path, template)

@mcp.tool()
def template_apply_patch(path: str, patch: dict, dry_run: bool) -> dict:
    return template_tool.template_apply_patch(ctx, path, patch, dry_run)

# ----------------SCHEMA------------------------
@mcp.tool()
def schema_get(schema_id: str) -> dict:
    return schema_tool.schema_get(ctx, schema_id)

@mcp.tool()
def schema_validate(schema_id: str, payload: dict) -> dict:
    return schema_tool.schema_validate(ctx, schema_id, payload)

# ---------------DIZIONARIO-------------------------
@mcp.tool()
def dictionary_search(path: str, text: str | None, lang: str | None, concept_id: str | None) -> dict:
    return dictionary_tool.dictionary_search(ctx, path, text, lang)

@mcp.tool()
def dictionary_upsert(path: str, patch: dict, dry_run: bool) -> dict:
    return dictionary_tool.dictionary_upsert(ctx, path, patch, dry_run)

@mcp.tool()
def dictionary_bulk_suggest(terms: list, path: str | None = None, expected_category: str | None = None) -> dict:
    return dictionary_tool.dictionary_bulk_suggest(ctx, terms, path, expected_category)

# -------------KNOWLEDGE BASE------------------------
@mcp.tool()
def kb_load(path:str) -> dict:
    return kb_tool.kb_load(ctx, path)

@mcp.tool()
def kb_save(path: str, versioned: dict) -> dict:
    return kb_tool.kb_save(ctx, path, versioned)

@mcp.tool()
def kb_upsert_mapping(path: str, patch: dict, dry_run: bool) -> dict:
    return kb_tool.kb_upsert_mapping(ctx, path, patch, dry_run)

# ----------------DEVICE-------------------------
@mcp.tool()
def device_list_enrich(path: str, dry_run: bool) -> dict:
    return device_list_tool.device_list_enrich(ctx, path, dry_run)