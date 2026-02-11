# 13. Configurazione & Esecuzione

## Scopo
Descrivere come eseguire il progetto in locale e quali parametri configurare.

---

## Script principali
- **`test/run_completa.py`** → pipeline completa interattiva  
- **`scripts/run_local.py`** → orchestratore patch e validazioni  
- **`src/matcher/matcher.py`** → matching engine  
- **`src/parser/normalizer.py`** → normalizzazione  

---

## Configurazione
È possibile usare un file `config.yml` (presente in `config/config.yml`) per pre‑compilare i path:

- `template`
- `dictionary`
- `kb`
- `template_base`
- `device_context`
- `schema_tipo`
- `output_dir`
- `llm_model`

Se un input è vuoto, viene usato il valore dal config.

---

## Modalità validate‑only
Ogni esecuzione può essere:
- **validate‑only** (solo report + dry‑run)
- **commit** (se approvato)

---

## Output
- `output_dir/` con artefatti intermedi
- `runs/<run_id>/run_report.json`
