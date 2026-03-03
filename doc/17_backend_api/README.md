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

---

## Note operative
- `device_list_enrich` restituisce warning anche in `dry_run` e l’API li propaga nel response.
- `/run/dictionary` restituisce anche `patch` + `suggestions`.
- Il flow template è spezzato in 3 step (`start` → `llm` → `finish`).
