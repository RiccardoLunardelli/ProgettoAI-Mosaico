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
def template_apply_path(path: str, patch: dict, dry_run: bool) -> dict:
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
def dictionary_search(text: str, lang: str) -> dict:
    return dictionary_tool.dictionary_search(ctx, text, lang)

@mcp.tool()
def dictionary_upsert(entry: dict) -> dict:
    return dictionary_tool.dictionary_upsert(ctx, entry)

@mcp.tool()
def dictionary_bulk_suggest(terms: list) -> dict:
    return dictionary_tool.dictionary_bulk_suggest(ctx, terms)

# -------------KNOWLEDGE BASE------------------------
@mcp.tool()
def kb_load() -> dict:
    return kb_tool.kb_load(ctx)

@mcp.tool()
def kb_save(versioned: dict) -> dict:
    return kb_tool.kb_save(ctx, versioned)

@mcp.tool()
def kb_upsert_mapping(mapping: dict) -> dict:
    return kb_tool.kb_upsert_mapping(ctx, mapping)

# ----------------DEVICE-------------------------
@mcp.tool()
def device_list_enrich(path: str) -> dict:
    return device_list_tool.device_list_enrich(ctx, path)