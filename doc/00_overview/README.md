# 0. Visione Generale

## Sintesi
Semantic AI Mapper è un sistema che normalizza e arricchisce template reali di supervisori di refrigerazione,
riconducendo variabili eterogenee a un modello semantico stabile, auditabile e versionato.

---

## Problema
I template reali descrivono gli stessi concetti con nomenclature diverse (vendor, abbreviations, codici locali).
Senza un layer semantico è impossibile standardizzare e automatizzare in modo affidabile.

---

## Soluzione
Il sistema introduce:
- **Template Base**: concetti canonici e categorie
- **Dizionario**: sinonimi/abbr/pattern → concetto
- **Knowledge Base**: contesto operativo e regole di priorità

---

## Principi chiave
- **Schema‑first**
- **Deterministic‑first**
- **Patch‑based**
- **Audit‑first**
- **Dry‑run obbligatorio**
- **LLM propose‑only**

---

## Valore
- Riduce lavoro manuale ripetitivo
- Aumenta coerenza cross-impianto e cross-vendor
- Abilita analytics e AI downstream affidabili
- Mantiene controllo umano e auditabilità

---

## Architettura in breve..
- **Orchestratore** (`orchestrator.py`): flusso, policy, report
- **MCP Server**: validazione, patch, guardrail
- **Matching Engine**: deterministico + fuzzy
- **LLM Proposer**: solo su ambigui, senza auto‑commit

---

## Backend & Grafana
- **Backend API (FastAPI)**: espone autenticazione, artifacts e runs.
- **Grafana**: la fonte unica è `runs.report` (JSONB) nel DB; nessuna tabella aggiuntiva.

---

## Database
- **Salvataggio e recupero file**: tutti i file sono memorizzati in un database PostgreSQL
