# 17. Backend API (FastAPI)

## Scopo
Esporre un layer HTTP per frontend e integrazioni, con:
- autenticazione utente,
- accesso agli artifact (DB-first),
- esecuzione run (template/dictionary/kb/template_base/device_list),
- funzioni admin di governance e gestione dati.

---

## Architettura API

```text
backend_api/
  main.py
  routes/
    auth.py
    artifacts.py
    runs.py
    admin/
      admin.py
      builder.py
      template_builder.py
  schemas/
    auth.py
    artifacts.py
    runs.py
    admin.py
    template_properties.py
  utils/
    deps.py
    jwt_utils.py
```

`main.py` registra i router:
- `auth_router`
- `artifacts_router`
- `runs_router`
- `admin_router`

e abilita CORS per frontend locale/LAN.

---

## Sicurezza e autorizzazione

- Auth via JWT in cookie (`token`).
- `get_current_user` valida token e payload utente.
- `require_admin` blocca accesso ai soli admin (`role == 1`).
- Tutto il router admin è protetto con `Depends(require_admin)`.

---

## Router Auth (`/api`)

- `POST /signup`
- `POST /login`
- `POST /logout`
- `GET /checkauth`

**Note**
- Signup/login usano email+password.
- Logout rimuove il cookie token.

---

## Router Artifacts (`/api`)

### Lettura artifact
- `GET /templates`
- `GET /templates/{id}`
- `GET /template_usage/{id}`

- `GET /dictionaries`
- `GET /dictionaries/{id}`
- `GET /dictionary/{version}/score`

- `GET /kb`
- `GET /kb/{id}`

- `GET /template_base`
- `GET /template_base/{id}`
- `GET /last_version/template_base`

- `GET /device_list`
- `GET /device_list/{store}/{dl}`

- `GET /enrich_device_list`
- `GET /enrich/device_list/{store}/{dl}`

- `GET /config/device_list`
- `GET /config/content/{id}`

### Edit inline (versionati)
- `POST /dictionary/edit`
- `POST /kb/edit`
- `POST /template_base/edit`

**Comportamento**
- carica artifact dal DB,
- valida schema,
- genera nuova versione (`_next_versioned_path`),
- salva run report,
- salva artifact versionato nel DB.

---

## Router Runs (`/api`)

### Lista e monitoraggio
- `GET /cronology`
- `GET /llm/percentual?run_id=...`
- `GET /runs/ids`
- `GET /run_id/{run_id}`
- `GET /runid_template`

### Template pipeline (3 step)
1. `POST /run/template/start`
   - normalizzazione + matching
   - snapshot input in `runs/<user_id>/<run_id>/`
   - output: `normalized_template_v0.1.json`, `matching_report_v0.1.json`
2. `POST /run/template/llm`
   - job background per proposte LLM
3. `GET /run/template/llm/result/{run_id}`
   - polling risultato LLM
4. `POST /run/template/finish`
   - applica patch deterministiche + opzionali LLM
   - genera `run_report.json`
   - registra output su DB

### Run patch artifact
- `POST /run/dictionary`
  - `mode=run_report` oppure `mode=manual` (`manual_mode=patch`)
- `POST /run/kb`
- `POST /run/template_base`
- `POST /run/device_list`

### Utility run
- `GET /enum/{config_id}` (enum da config device list)
- `POST /run/preview`
  - preview validate-only per `dictionary|kb|template_base`
  - ritorna direttamente il `preview_payload`

**Comportamento generale run**
- input sempre da DB (snapshot in cartella run utente),
- report sempre prodotto,
- salvataggio su tabella `runs`.

---

## Router Admin (`/api`, admin-only)

### Users
- `GET /users`
- `POST /delete_user`
- `POST /update_user`

### Artifacts
- `GET /artifacts`
- `POST /drop_artifact`
- `GET /artifact_content/{id}`
- `POST /insert_artifact`

### Clients / Stores / Devices
- `GET /clients`
- `POST /insert_client`
- `POST /update_client`
- `POST /delete_client`

- `GET /list_store`
- `POST /upsert_store`
- `POST /update_store`
- `POST /delete_store`

- `GET /devices`
- `POST /insert_device`
- `POST /update_device`
- `POST /delete_device`

### Config / Template authoring
- `POST /edit/config`
- `POST /create_template`
- `GET /get_schema_template`
- `GET /list_schemas`

### Run management
- `POST /delete_run` (bulk `run_ids`)

---

## Convenzioni di progetto

- **DB-first**: artifact e contenuti vengono gestiti da DB; il filesystem locale è usato come snapshot runtime.
- **Versioning**: dictionary/kb/template_base/config/device_list_context sono versionati.
- **Auditability**: ogni run produce `run_report.json` con execution, validation, diff, metriche.
- **Validate-only**: supportato sui flussi run; commit separabile lato frontend.

---

## Note operative finali

- Le API `templates/{id}`, `dictionaries/{id}`, `kb/{id}`, `template_base/{id}` lavorano con ID artifact.
- Device list enriched è esposta come `device_list_context`.
- I warning del device enrichment sono propagati in response/report.
- Le metriche Grafana leggono dalla colonna `runs.report` (JSONB).