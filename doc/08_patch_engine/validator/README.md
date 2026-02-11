# Validator

**File:** `src/validator/validator.py`
Scopo: validare schema e coerenza canonica, creare patch eseguibili e preview.

---

### Funzioni 

- **`validate_before_commit_generic(...)`**  
  Valida patch generiche (dizionario/KB/template_base):
  - schema specifico
  - preview e diff

- **`canonical_map(template_base_path)`**  
  Costruisce mappa canonica dei concetti del Template Base. Restituisce cateogira e cateogira semantica per ogni concetto
  ```text
  concept_id → { category, semantic_category}

- **`validate_action_against_template_base(...)`**  
  Verifica `concept_id`, `category`, `semantic_category` di una patch contro template base.

- `actions_to_template_patch(...)`  
  Converte PatchActions → patch eseguibile (`set_fields`).

- **`validate_before_commit_template(...)`**  
  Valida PatchActions per template reale:
  - schema `patch_actions_template`
  - coerenza con Template Base
  - genera patch eseguibile e preview

- `validate_dictionary_canonical(...)`  
  Controlla coerenza dizionario contro Template Base confrontanto `concept_id`, `category`, `semantic_category`

- `validate_template_base_semantic(...)`  
  Verifica che ogni concetto abbia `semantic_category` in template base (Autocoerenza).
