# 11. Ruolo dell’LLM

## Scopo
L’LLM è **solo un proposer**: interviene solo su ambiguità e non applica mai patch in automatico.

---

## Quando viene chiamato
- Solo se esistono item `ambiguous`
- Solo se l’utente lo autorizza
- Mai su match deterministici

---

## Output richiesto
Formato **schema‑first** (`patch_actions_template`), solo JSON.

Regole principali:
- No inventare concetti
- Solo top candidate
- Se incerto → `actions: []`

---

## Guardrail post‑LLM
Le proposte vengono filtrate da policy deterministiche:
- `confidence >= 0.90`
- `gap top/second >= 0.10`

---

## Risultato
- Output salvato come `llm_patch_actions.json`
- Inserito nel `run_report.json`
- **Mai applicato automaticamente**
