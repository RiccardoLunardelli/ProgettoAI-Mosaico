# Core.py
---

Questo file è il cuore del server in quanto si occupa di tutti i controlli necessari per garantire sicurezza al sistema.

---
### Classi
- **`MCPError`**  
  Eccezione custom usata per errori controllati del server.

- **`MCPContext(repo_root)`**  
  Contesto di esecuzione che gestisce sicurezza e invarianti.

### Metodi MCPContext

- **`ensure_within_root(path)`**  
  Impone una allowlist sul filesystem: il server può operare solo dentro `repo_root`.

- **`read_json(path)`**  
  Lettura JSON da file.

- **`write_json(path, payload)`**  
  Scrittura JSON su file.

- **`hash_payload(payload)`**  
  Calcola SHA-256 del payload (json canonicalizzato) per tracking di validazione/dry-run.

- **`schema_get(schema_id)`**  
  Carica lo schema JSON associato a `schema_id` tramite `schema_map`.

- **`schema_validate(schema_id, payload)`**  
  Valida un payload contro lo schema JSON; registra l’hash in `_validated_hashes`.

- **`mark_dry_run(patch_actions)`**  
  Registra l’hash di un payload come “dry-run eseguito”.

- **`require_dry_run(patch_actions)`**  
  Impedisce commit se il payload non è stato marcato in precedenza con `mark_dry_run`.

- **`require_validated(payload)`**  
  Impedisce salvataggio se il payload non è stato validato contro uno schema.

- **`diff_json(a, b, prefix="")`**  
  Produce una lista di differenze “leggibili” tra due strutture JSON.



