# Orchestratore 

**File:** `scripts/orchestrator.py`  
Scopo: orchestrare patch, validazione, dry‑run, commit e generare `run_report.json`.

---

## Flusso Template (UI)
Il flusso Template è diviso in 3 fasi per la UI:

### `start_template_run(...)`
- esegue `normalization()` e matching
- salva `matching_report` in `runs/<user_id>/<run_id>/`
- ritorna: `run_id`, `matching_path`, `has_ambiguous`, `ambiguous_count`

### `llm_propose_for_run(...)`
- legge `matching_report`
- genera patch LLM (`llm_patch_actions.json`)
- salva `llm_attempt.json`
- ritorna patch e metriche

### `finish_template_run(...)`
- genera patch deterministiche
- se LLM attivo: merge patch LLM (modificate o originali)
- calcola `llm_patch_proposed` vs `llm_patch_applied`
- salva report finale nella stessa run

Nota: `run_template_pipeline` è stato rimosso (non più usato).

---

### Funzioni

### `get_template_guid(input_path, mr, artifact_type)`
Ricava `template_guid` a partire dal template reale o dal matching report.

### `generate_run_id()`
Genera l’ID univoco della run.

### `schema_version_from_path(schema_path)`
Estrae la versione dallo schema a partire dal nome del file.

### `build_schema_versions(ctx, used_schema_ids)`
Costruisce la mappa `schema_id → versione` usata nella run.

### `extract_present_concepts(mr, actions_payload)`
Elenca i concept presenti (derivati da matching e patch actions).

### `build_absent_concepts(template_base_path, mr, actions_payload)`
Ritorna i concetti del Template Base assenti nel matching e/o nelle patch actions.

### `extract_matched_variables_from_matching_report(mr)`
Estrae solo le variabili con stato `matched` dal matching report.

### `extract_analysis_from_matching_report(mr)`
Costruisce la sezione di analisi per il report (`ambiguous` + `unmapped`) dal matching report.

## LLM (proposer)

### `extract_llm_contexts(mr)`
Raccoglie i contesti LLM dagli item ambigui nel matching report.

### `build_llm_prompt(llm_contexts)`
Genera il prompt **JSON-only** per l’LLM.

### `filter_low_confidence(actions_payload, threshold=0.9)`
Filtra le azioni LLM con confidence maggiore alla soglia.

### `filter_by_candidate_gap(actions_payload, llm_contexts, min_gap=0.10)`
Filtra le azioni LLM con gap top/second insufficiente.

### `ollama_generate_json(model, prompt)`
Chiama Ollama e parsea l’output JSON.

### `chunk_list(items, size)`
Divide una lista in batch.

### `llm_propose_actions(model, mr, batch_size=3)`
Genera proposte LLM, tracciando tentativi e latenza.

### `parse_llm_output(output)`
Valida la struttura JSON prodotta dall’LLM (chiavi consentite).

### `ensure_labels(actions_payload)`
Garantisce la presenza delle label `it/en` nei target LLM.


## Diff helpers

### `summarize_device_list_diff(before, after)`
Diff compatto per `device_list`.

### `summarize_template_real_diff(before, after)`
Diff compatto per template reale (`set_fields`).

### `summarize_dictionary_diff(before, after)`
Diff compatto per dizionario.

### `summarize_kb_diff(before, after)`
Diff compatto per KB mappings.

### `summarize_template_base_diff(before, after)`
Diff compatto per Template Base.

### `compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn)`
Esegue il dry-run (se necessario) e calcola il diff.


## Run report

### `build_run_report(...)`
Costruisce il `run_report.json` per ogni artifact.

### `compute_metrics(mr, actions_payload)`
Calcola metriche base:
- matched
- ambiguous
- unmapped


## Patch actions

### `build_patch_actions_from_matching(mr, output_path)`
Converte i match deterministici in PatchActions e salva il JSON.

## Dictionary helper

### `build_dictionary_patch_from_run_report(run_report_path, dictionary_path)`
Genera patch dizionario dagli `ambiguous` del run report con singolo candidato.

### `build_dictionary_suggestions_from_run_report(run_report_paths, dictionary_path)`
Genera suggestions a partire dagli `unmapped_terms`.


## Matching / Analysis load

### `load_matching(matching_path)`
Carica e valida il matching report, producendo la sezione di analysis.


## Validazione & patch build

### `build_patch_and_validation(cfg, artifact_type, upsert_fn, diff_fn, actions_payload_override=None)`
Valida il payload, genera la patch, il preview e il blocco di validazione.

### `apply_commit(input_path, template_patch, diff, validate_only, upsert_fn)`
Esegue il commit se consentito, altrimenti resta in modalità validate-only.

### `build_report_context(artifact_type, matching_path, template_base_path)`
Raccoglie versioni schema e payload degli artefatti coinvolti nella run.

## Runner principali

### `run_patch(cfg, artifact_type, upsert_fn, diff_fn, validate)`
Orchestratore per:
- template
- dizionario
- knowledge base
- template base

### `run_device_list(cfg, validate)`
Orchestratore per `device_list` con supporto dry-run / commit.
