# 13. Configurazione & Esecuzione

## Scopo
Descrivere come eseguire il progetto e quali parametri configurare nel flusso DB-first.

---

## Script principali
- **`test/run_completa.py`** → pipeline completa interattiva  
- **`scripts/orchestrator.py`** → orchestratore patch e validazioni  
- **`src/matcher/matcher.py`** → matching engine  
- **`src/parser/normalizer.py`** → normalizzazione  

---

## Flusso Template (UI)
L’orchestratore espone tre step separati:
- `start_template_run` → normalizzazione + matching
- `llm_propose_for_run` → proposta LLM + `llm_attempt.json`
- `finish_template_run` → patch deterministiche, merge LLM (se attivo), report finale

---

## Configurazione
Il flusso operativo usa artifact selezionati da DB (ID artifact) e crea snapshot runtime in `runs/<user_id>/<run_id>/`.

`config.yml` resta opzionale per parametri generali (es. modello LLM), non come sorgente primaria degli input.

---

## Modalità validate‑only
Ogni esecuzione può essere:
- **validate‑only** (solo report + dry‑run)
- **commit** (se approvato)

---

## Output
- `runs/<user_id>/<run_id>/` con snapshot input, file intermedi e `run_report.json`
- eventuali output versionati committati vengono registrati nel DB (`artifacts`) e tracciati in `runs.report`
