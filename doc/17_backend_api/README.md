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

- `POST /signup`: crea un nuovo utente e restituisce token JWT.
- `POST /login`: autentica l’utente e restituisce token JWT.
- `POST /logout`: invalida sessione client rimuovendo il cookie token.
- `GET /checkauth`: verifica token e ritorna utente autenticato.

**Note**
- Signup/login usano email+password.
- Logout rimuove il cookie token.
- Checkauth controlla il token d'accesso.

---

## Router Artifacts (`/api`)

### Lettura artifact
- `GET /templates`: lista template disponibili (artifact type `template`).
- `GET /templates/{id}`: ritorna contenuto completo del template selezionato.
- `GET /template_usage/{id}`: mostra store/client/device che usano il template.
- `GET /dictionaries`: lista dizionari disponibili.
- `GET /dictionaries/{id}`: ritorna contenuto del dizionario selezionato.
- `GET /dictionary/{version}/score`: ritorna score template per una versione dizionario.
- `GET /kb`: lista knowledge base disponibili.
- `GET /kb/{id}`: ritorna contenuto KB selezionata.
- `GET /template_base`: lista template base disponibili.
- `GET /template_base/{id}`: ritorna contenuto template base selezionato.
- `GET /last_version/template_base`: ritorna id dell’ultima versione template base.
- `GET /device_list`: lista device list per store.
- `GET /device_list/{store}/{dl}`: ritorna una device list specifica.
- `GET /enrich_device_list`: lista device list arricchite (`device_list_context`).
- `GET /enrich/device_list/{store}/{dl}`: ritorna una device list arricchita specifica.
- `GET /config/device_list`: lista configurazioni enrichment disponibili.
- `GET /config/content/{id}`: ritorna contenuto della config selezionata.

### Edit inline (versionati)
- `POST /dictionary/edit`: modifica inline dizionario creando nuova versione.
- `POST /kb/edit`: modifica inline KB creando nuova versione.
- `POST /template_base/edit`: modifica inline template base creando nuova versione.

**Comportamento**
- carica artifact dal DB,
- valida schema,
- genera nuova versione (`_next_versioned_path`),
- salva run report,
- salva artifact versionato nel DB.

---

## Router Runs (`/api`)

### Lista e monitoraggio
- `GET /cronology`: ritorna cronologia diff delle run utente.
- `GET /llm/percentual`: ritorna avanzamento percentuale job LLM della run.
- `GET /runs/ids`: lista run id visibili all’utente (o tutte se admin).
- `GET /run_id/{run_id}`: ritorna dettaglio completo di una run.
- `GET /runid_template`: lista run template con info template associata.

### Template pipeline (3 step)
- `POST /run/template/start`: avvia normalizzazione+matching e crea run template.
- `POST /run/template/llm`: avvia proposta patch LLM in background.
- `GET /run/template/llm/result/{run_id}`: recupera risultato patch LLM della run.
- `POST /run/template/finish`: applica patch finali template e chiude run.

### Run patch artifact
- `POST /run/dictionary`: esegue patch dizionario (manuale o da run report).
- `POST /run/kb`: esegue patch KB con validazione e report.
- `POST /run/template_base`: esegue patch template base con validazione e report.
- `POST /run/device_list`: esegue enrichment device list con config scelta.

### Utility run
- `GET /enum/{config_id}`: ritorna mapping enum dalla config enrichment.
- `POST /run/preview`: genera preview validate-only per dictionary/kb/template_base.

**Comportamento generale run**
- input sempre da DB (snapshot in cartella run utente),
- report sempre prodotto,
- salvataggio su tabella `runs`.

---

## Router Admin (`/api`, admin-only)

### Users
- `GET /users`: lista completa utenti.
- `POST /delete_user`: elimina utente (con cascata sulle run collegate).
- `POST /update_user`: aggiorna email/nome/password/ruolo utente.

### Artifacts
- `GET /artifacts`: lista completa artifact a sistema.
- `POST /drop_artifact`: elimina uno o più artifact (con gestione vincoli).
- `GET /artifact_content/{id}`: ritorna contenuto completo artifact.
- `POST /insert_artifact`: inserisce manualmente un nuovo artifact.

### Clients / Stores / Devices
- `GET /clients`: lista clienti.
- `POST /insert_client`: crea cliente.
- `POST /update_client`: rinomina cliente.
- `POST /delete_client`: elimina cliente.

- `GET /list_store`: lista store.
- `POST /upsert_store`: inserisce store e relativi device dal content.
- `POST /update_store`: aggiorna dati store.
- `POST /delete_store`: elimina store (con cascata device).

- `GET /devices`: lista dispositivi.
- `POST /insert_device`: inserisce dispositivo.
- `POST /update_device`: aggiorna dispositivo.
- `POST /delete_device`: elimina dispositivo.

### Config / Template authoring
- `POST /edit/config`: modifica config YAML creando nuova versione.
- `POST /create_template`: crea template da payload strutturato e lo salva.
- `GET /get_schema_template`: ritorna schema condiviso per creazione template.
- `GET /list_schemas`: lista schemi normalizer disponibili.

### Run management
- `POST /delete_run`: elimina una o più run (`run_ids`).

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