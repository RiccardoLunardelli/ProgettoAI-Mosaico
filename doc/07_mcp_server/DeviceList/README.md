# Tool: device_list_tool.py

## Scopo
Arricchisce la `device_list` del supervisore producendo un `device_list_context`
con campi derivati e regole esterne configurabili.

---

## Configurazione
Le regole non sono hard‑coded: vengono lette da **`config/device_list_rules.yml`**.
Questo file definisce:
- keyword per ruolo (`roles`)
- keyword per famiglia (`type_fam`)
- mapping enum (`enum_map`)
- label enum ufficiali (`enum`)

---

## Funzioni

- **`load_rules(path)`**  
  Carica il file YAML di regole.

- **`derive_device_role(desc, rules)`**  
  Deriva `device_role_generated` tramite keyword dal file YAML.  
  Regola speciale: se **nessun ruolo esplicito** ma è presente TN/BT → ruolo `banco`.

- **`derive_type_fam(desc, rules)`**  
  Deriva `type_fam_generated` (`TN`, `BT`, `TN/BT`, `other`) usando le keyword YAML.

- **`derive_enum(role, type_fam, rules, desc)`**  
  Calcola `enum_generated` in base a:
  - keywords (enum 7/8)
  - `enum_map` in YAML  
  Se non c’è mapping valido → `99`.

- **`device_list_enrich(ctx, path, dry_run)`**  
  Flusso completo:
  1. Valida input `device_list`
  2. Applica derivazioni `role`, `type_fam`, `enum`
  3. Valida output `device_list_context`
  4. Dry‑run o commit versionato  
  Produce `device_list_context_v0.1.json` se input è `device_list.json`.

---

## Note operative
- Se `TemplateGUID` manca, viene emesso un warning.
- I dispositivi con ruolo `centrale` sono segnalati per revisione manuale.
- I warning vengono restituiti anche in `dry_run` e propagati fino alle API.
