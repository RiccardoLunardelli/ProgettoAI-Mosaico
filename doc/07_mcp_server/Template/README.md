# Template Tool

---

### Funzioni

- **`template_load(ctx, path)`**  
  Legge un template JSON in modo sicuro (guardrail path).

- **`template_save(ctx, path, template)`**  
  Scrive un template JSON. Se è un template base, valida prima contro schema `template_base`.

- **`template_apply_patch(ctx, path, patch, dry_run)`**  
  Applica patch con due target:
  - `target="template_base"` → operazioni su Template Base
  - `target="template"` → operazioni su template reale (`set_fields`)

    Comportamento:
  - valida template e patch con JSON schema
  - costruisce `preview` (deepcopy)
  - se `dry_run=True`: marca dry-run e ritorna preview
  - se commit: richiede dry-run precedente, valida output, salva in versione incrementata (`_v0.x`)

  Operazioni Template Base supportate:
    - `add_base_concept`
    - `remove_base_concept`
    - `update_base_metadata`

    Operazioni Template reale supportate:
    - patch per variabile: `(section, source_key) -> fields` (set_fields)