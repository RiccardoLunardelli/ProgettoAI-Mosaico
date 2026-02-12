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
```json
{
  "patch_actions_version": "v0.1",
  "generated_at": "2026-02-12T10:00:00+01:00",
  "actions": [
    {
      "type": "map_variable",
      "section": "ContinuosReads",
      "source_key": "Read302",
      "target": {
        "concept_id": "temp_delivery",
        "category": "measurement",
        "semantic_category": "temperature",
        "labels": {
          "it": "Temperatura mandata",
          "en": "Delivery temperature"
        }
      },
      "patch": {
        "set_fields": {
          "ConceptId_Patch": "temp_delivery",
          "Category_Patch": "measurement",
          "SemanticCategory_Patch": "temperature"
        }
      },
      "confidence": 0.92,
      "reason": "clear_match",
      "evidence": {
        "normalized_text": "temp mandata sm",
        "selected_candidate": "temp_delivery",
        "score": 0.92
      }
    }
  ]
}

```

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
