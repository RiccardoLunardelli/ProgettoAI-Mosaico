# 10. Run Report & Audit

## Scopo
Il `run_report.json` è il **registro auditabile** di ogni run:
spiega cosa è stato deciso, cosa è stato applicato e con quali evidenze.

---

## Contenuti principali

### Identità e versioni
- `run_id`
- `timestamp`
- `schema_versions` 

### Sorgenti 
- `template_path`
- `dictionary_path`
- `kb_path`
- `template_base_path`
- relative versioni

### Target
- `artifact_type`
- `input_path`
- `output_path`

### Metriche e KPI
- `matched_count`
- `ambiguous_count`
- `unmapped_count`
- `llm_calls`
- `warnings_count`
 - `llm_patch_proposed`
 - `llm_patch_applied`

### Execution
- `dry_run_performed`
- `committed`
- `status`

### Diff summary
- `diff_summary.changed_paths`

## Sezioni analitiche (template)
- `llm_patch_actions` (solo proposta)
- `analysis`  
  - `ambiguous_matches`
  - `unmapped_terms`
- `matched_variables`
- `actions` (deterministiche)
- `absent_concepts`

---

## Regole
- Report scritto **sempre**, anche in caso di errore
- Nessuna azione applicata senza essere tracciata

---

## Grafana & DB
- La fonte unica per Grafana è `runs.report` (JSONB).
- Nessuna modifica schema DB; nessuna nuova tabella.
- Il filtro per sezione usa regex: `~ '${section:regex}'`.

---

## Metriche LLM
- Le metriche LLM sono calcolate in `src/metrics_calculation/llm_calculate_metrics.py`.
- Sono corrette solo se `llm_attempt.json` viene caricato e passato al `build_run_report`.
