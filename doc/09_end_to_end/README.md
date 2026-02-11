# 9. Flusso End-to-End

## Scopo
Descrivere la pipeline completa, dall’input reale fino al report finale.

---

## Flusso operativo

1. **Normalizzazione**
   - Input: template reale + schema
   - Output: `normalized_template.json`

2. **Matching**
   - Input: normalized + template_base + dictionary + KB + device_context
   - Output: `matching_report.json`

3. **PatchActions deterministiche**
   - Da matching con confidence alta
   - Output: `patch_actions.json`

4. **LLM proposer**
   - Solo su ambigui
   - Output: `llm_patch_actions.json` (non applicato)

5. **Validazione**
   - Schema-first
   - Coerenza canonica

6. **Dry‑run + diff**
   - Preview patch
   - Diff strutturato

7. **Commit (opzionale)**
   - Solo se validato e autorizzato

8. **Run report**
   - `run_report.json` con metriche e audit

---

## Output finali
- `normalized_template.json`
- `matching_report.json`
- `patch_actions.json`
- `run_report.json`
