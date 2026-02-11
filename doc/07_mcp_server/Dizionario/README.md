# Dizionario Tool

## Scopo

Inserire/aggiornare concetti nel dizionario e generare suggerimenti di nuovi concetti per aggiornare il dizionario.

---
### Funzioni

- **`dictionary_search(ctx, path, text, lang, concept_id)`**  
  Ricerca:
  - per `concept_id` (diretta)
  - oppure per `text + lang` dentro i sinonimi

- **`_next_versioned_path(path)`**  
  Incrementa versioni del file: `_v0.1.json` → `_v0.2.json`.

- **`dictionary_upsert(ctx, path, patch, dry_run)`**  
  Applica patch al dizionario in modo versionato:
  - valida dizionario e patch
  - crea preview
  - dry-run / commit con `_next_versioned_path`

Operazioni supportate:
- `add_synonym`
- `add_concept`
- `update_synonym`
- `add_abbreviation`
- `add_pattern`
- `update_category`
- `update_semantic_category`

- **`dictionary_bulk_suggest(ctx, terms, path=None, expected_category=None)`**  
  Dato un set di termini, produce candidati basati su:
  - contains su synonyms
  - contains su abbreviations