# 17. Backend API (FastAPI)

## Scopo
Esporre un layer HTTP per UI e integrazioni, con autenticazione, accesso agli artefatti e gestione delle run.

---

## Struttura
```
backend_api/
  main.py
  routes/
    auth.py
    artifacts.py
    runs.py
  schemas/
    auth.py
    runs.py
    artifacts.py
```

---

## Auth
- `POST /signup`
- `POST /login`

Note:
- Nessuna password per ora: login via email.

---

## Artifacts
- `GET /templates`
- `GET /templates/{name}`
- `GET /dictionaries`
- `GET /dictionaries/{name}`
- `GET /kb`
- `GET /kb/{name}`
- `GET /template_base`
- `GET /template_base/{name}`
- `GET /device_list`
- `GET /device_list/{store}/{dl}`
- `POST /dictionary/edit`
- `POST /kb/edit`
- `POST /template_base/edit`

Dettagli:
- Le preview restituiscono JSON strutturato, non stringa.
- `device_list` restituisce una lista di store con `device_list.json`.
- Gli endpoint `/dictionary|kb|template_base/edit` non sovrascrivono il file originale.
- Gli endpoint `/dictionary|kb|template_base/edit` creano una nuova versione con `_next_versioned_path`.
- Gli endpoint `/dictionary|kb|template_base/edit` aggiornano automaticamente la `*_version` nel JSON salvato.
- Gli endpoint `/dictionary|kb|template_base/edit` validano lo schema; in caso di errore rispondono `400` con dettaglio.

---

## Runs
- `GET /runs/ids`
- `GET /run_id/{run_id}`
- `POST /run/template/start`
- `POST /run/template/llm`
- `POST /run/template/finish`
- `POST /run/dictionary` (mode `run_report` o `manual patch`)
- `POST /run/kb`
- `POST /run/template_base`
- `POST /run/device_list`

Dettagli:
- Ogni run viene salvata in DB (`runs`).
- Tutte le run supportano `validate_only`.

### Template (3‑step)
1. **`/run/template/start`**: normalizza il template (`normalization()`), esegue matching deterministico e scrive in `runs/<run_id>/` i file `normalized_template_v0.1.json` e `matching_report_v0.1.json`. Ritorna `run_id`, info matching e flag `has_ambiguous`.
2. **`/run/template/llm`**: usa il `run_id` per proporre patch LLM (solo ambiguità) e scrive in `runs/<run_id>/` `llm_patch_actions.json` e `llm_attempt.json`.
3. **`/run/template/finish`**: applica patch deterministiche + opzionali LLM. Se `apply_llm=true` usa le azioni di `llm_patch_actions.json` oppure un override. Genera `run_report.json` e metriche LLM.

### Dictionary
- `mode = run_report`: richiede `run_id`, genera `dictionary_patch.json` e `dictionary_suggestions.json`, restituisce anche `patch` e `suggestions` in response.
- `mode = manual` con `manual_mode = patch`: applica `patch_json` direttamente.

### KB / Template Base
- Endpoint basati su `patch_json`.
- Validazione schema obbligatoria.
- Output versionato con update automatico di `kb_version` / `template_base_version`.

### Device List
- Enrichment e run dedicata.
- Warning propagati dal tool (`centrale`, `TemplateGUID` mancante).
- L’API restituisce `warning` in risposta.

---

## Note operative
- `device_list_enrich` restituisce warning anche in `dry_run` e l’API li propaga nel response.
- `/run/dictionary` restituisce anche `patch` + `suggestions`.
- Il flow template è spezzato in 3 step (`start` → `llm` → `finish`).
