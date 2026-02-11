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
- `template_load`: Legge Template da disco.
- `template_save`: Salva Template nel disco
- `template_apply_patch`: Applica patch a Template / Template Base.
- `schema_get`: Restituisce lo schema JSON associato.
- `schema_validate`: Valida payload contro lo schema JSON.
- `dictionary_search`: Cerca nel dizionario per id concetto e testo nei sinonimi.
- `dictionary_upsert`: Inserisce/aggiorna i concetti del dizionario.
- `dictionary_bulk_suggest`: Genera suggerimenti di nuovi concetti.
- `kb_load`: Legge Knowledge Base da disco.
- `kb_save`: Salva Knowledge Base nel disco.
- `kb_upsert_mapping`: Aggiunge/Aggiorna una regola alla Knowledge Base.
- `device_list_enrich`: Arricchisce la device list con campi derivati.

---

## Regole
- Nessuna scrittura fuori workspace
- Nessun commit senza dry‑run
- Nessun payload non validato
