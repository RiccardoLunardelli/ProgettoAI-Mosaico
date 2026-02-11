# Knowledge Base Tool

## Scopo

Aggiungere/Aggiornare una o più regole della knowledge base.

---

### Funzioni

- **`kb_load(ctx, path)`**  
  Lettura KB.

- **`kb_save(ctx, path, versioned)`**  
  Salvataggio KB: richiede che il payload sia stato validato (`require_validated`).

- **`kb_upsert_mapping(ctx, path, patch, dry_run)`**  
  Patch versionata per regole KB (mappings):
  - valida KB e patch
  - crea preview
  - applica operazioni
  - dry-run / commit in nuova versione

Operazioni supportate:
- `add_kb_rule`
- `update_kb_rule`