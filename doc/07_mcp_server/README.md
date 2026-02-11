# 7. MCP Server

## Scopo
L’MCP Server è il **gatekeeper** del progetto:
espone tool controllati per leggere/scrivere file, validare payload
e applicare patch in modo **sicuro**, **auditabile** e **versionato**.

---

## Componenti principali
- `core.py`:  `Core/README.md`
- `server.py`
- `tools/template_tool.py`: `Template/README.md`
- `tools/schema_tool.py`: `Schema/README.md`
- `tools/dictionary_tool.py`: `Dizionario/README.md`
- `tools/kb_tool.py`: `Kb/README.md`
- `tools/device_list_tool.py`: `DeviceList/README.md`

---

## Concetti chiave

### MCPContext (core del server)
Classe centrale che implementa:
- guardrail filesystem (allowlist repo_root)
- read/write JSON
- schema validation (jsonschema)
- meccanismo dry-run → commit
- diff JSON per audit/debug
- mappa schema_id → file schema

---

## Tool esposti
- `template_load`
- `template_save`
- `template_apply_patch`
- `schema_get`
- `schema_validate`
- `dictionary_search`
- `dictionary_upsert`
- `dictionary_bulk_suggest`
- `kb_load`
- `kb_save`
- `kb_upsert_mapping`
- `device_list_enrich`

---

## Regole
- Nessuna scrittura fuori workspace
- Nessun commit senza dry‑run
- Nessun payload non validato
