# 17. Docker

## Scopo
Documentare l'avvio locale dei servizi infrastrutturali tramite Docker Compose.

---

## Servizi
- `semantic_pg` (PostgreSQL): database applicativo.
- `semantic_grafana` (Grafana): dashboard metriche lette da `runs.report` (JSONB).

---

## Prerequisiti
- Docker installato.
- Docker Compose v2 disponibile (`docker compose`).
- File `docker-compose.yml` presente nella root progetto.

---

## Avvio
Dalla root del progetto:

```bash
docker compose up -d
```

Verifica stato:

```bash
docker compose ps
```

---

## Accesso servizi
- PostgreSQL: `localhost:5432`
- Grafana: `http://localhost:3001`
  - user: `admin`
  - password: `admin`

---

## Arresto
```bash
docker compose down
```

---

## Reset completo (volumi inclusi)
```bash
docker compose down -v
```

> Questa operazione elimina i dati persistiti nei volumi Docker.

---

## Note operative
- Grafana è configurato per embedding e accesso anonimo in sola lettura (Viewer).
- La fonte dati dashboard è il DB Postgres dell'applicazione.
- In ambiente multiutente, i report run restano tracciati nel DB (`runs`).
