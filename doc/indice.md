# Indice Documentazione — Semantic AI Mapper

---

## 0. Visione Generale
- `/doc/00_overview/README.md` 
- Sintesi del progetto: problema, soluzione e principi.

## 1. Normalizzazione
- `/doc/01_normalizzazione/README.md`
- Come si pulisce e stabilizza il testo del template reale prima del matching.

## 2. Template Base
- `/doc/02_template_base/README.md`
- Modello canonico: concetti, categorie e metadati standard.

## 3. Dizionario
- `/doc/03_dizionario/README.md`
- Sinonimi, abbreviazioni e pattern che mappano i testi reali ai concetti.

## 4. Knowledge Base
- `/doc/04_knowledge_base/README.md`
- Contesto operativo: scope, mapping prioritarie, blacklist.

## 5. Schemi (Schema-first)
- `/doc/05_schemi/README.md`
- Modelli Pydantic e JSON Schema usati per validare ogni payload.

## 6. Matching Engine
- `/doc/06_matching/README.md`
- Matching deterministico + fuzzy, scoring, ambiguità e regole.

## 7. MCP Server
- `/doc/07_mcp_server/README.md`
- Gatekeeper: tool, validazioni, dry‑run, patch applicate in sicurezza.

## 8. Patch Actions & Patch Engine
- `/doc/08_patch_engine/README.md`
- Azioni atomiche → validazione → dry‑run → commit versionato.

## 9. Flusso End-to-End
- `/doc/09_end_to_end/README.md`
- Pipeline completa con input, output e sequenza operativa.

## 10. Run Report & Audit
- `/doc/10_run_report/README.md`
- Struttura dei report, metriche, evidenze e diff.

## 11. Ruolo dell’LLM
- `/doc/11_llm_role/README.md`
- LLM solo proposer su ambigui, con guardrail e no auto‑commit.

## 12. Device List Enrichment
- `/doc/12_device_list/README.md`
- Arricchimento device_list: ruolo, famiglia, enum .

## 13. Configurazione & Esecuzione
- `/doc/13_run_config/README.md`
- Config file, run script, parametri principali.

## 14. Governance & Versioning
- `/doc/14_governance/README.md`
- Regole di aggiornamento per dizionario/KB/template base.

## 15. Architettura
- `/doc/15_architettura/README.md`
- Architettura completa del progetto.

## 16. Framework 
- `/doc/16_framework/README.md`
- Librerie utilizzate con relative versioni

## 17. Docker
- `/doc/17_docker/README.md`
- Avvio servizi infrastrutturali (PostgreSQL + Grafana) con Docker Compose.

## 18. Backend API
- `/doc/18_backend_api/README.md`
- Endpoints FastAPI
