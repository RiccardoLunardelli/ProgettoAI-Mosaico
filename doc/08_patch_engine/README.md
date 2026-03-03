# 8. Patch Actions & Patch Engine

## Scopo
Descrive come una decisione di matching diventa una modifica reale,
in modo **controllato**, **validato** e **auditabile**.

Il sistema non riscrive mai direttamente i file:
produce **PatchActions**, le valida, le simula (dry‑run) e solo dopo,
se approvate, le applica creando nuove versioni.

---

## PatchActions
Le PatchActions rappresentano **decisioni atomiche**, non esecuzioni.

Ogni azione è:
- esplicita
- spiegabile
- validabile
- reversibile

---

## Tipologie

### PatchActionsTemplate (eseguibile)
Formato ufficiale prodotto da matching / LLM proposer.
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
        "labels": { "it": "Temperatura mandata", "en": "Delivery temperature" }
      },
      "patch": {
        "set_fields": {
          "ConceptId_Patch": "temp_delivery",
          "Category_Patch": "measurement",
          "SemanticCategory_Patch": "temperature"
        }
      },
      "confidence": 0.92,
      "reason": "matching_deterministico",
      "evidence": { "normalized_text": "temp mandata sm" }
    }
  ]
}
```

Formato Patch eseguibile dal server:
```json
{
  "target": "template",
  "operations": [
    {
      "op": "set_fields",
      "section": "ContinuosReads",
      "source_key": "Read302",
      "fields": {
        "ConceptId_Patch": "temp_delivery",
        "Category_Patch": "measurement",
        "SemanticCategory_Patch": "temperature"
      },
      "meta": {
        "confidence": 0.92,
        "reason": "matching_deterministico",
        "evidence": { "normalized_text": "temp mandata sm" }
      }
    }
  ]
}

```

Caratteristiche:
- target semantico (`concept_id`, `category`, `semantic_category`)
- patch dichiarativa (`set_fields`)
- `confidence`, `reason`, `evidence`

### Patch Dizionario (dictionary_patch) - Manuali
Formato patch per aggiornare il dizionario.
```json
{
  "target": "dictionary",
  "operations": [
    { "op": "add_synonym", "concept_id": "temp_delivery", "lang": "it", "value": "mandata" },
    { "op": "add_abbreviation", "concept_id": "temp_delivery", "value": "sm" }
  ]
}

```

Operazioni:
- `add_concept`
- `add_synonym`
- `update_synonym`
- `add_abbreviation`
- `add_pattern`
- `update_category`
- `update_semantic_category`

---

### Patch Knowledge Base (kb_patch) - Manuali
Formato patch per aggiornare mapping e regole KB.

```json
{
  "target": "kb",
  "operations": [
    {
      "op": "add_kb_rule",
      "scope_id": "P02T01D01__template_guid",
      "source_type": "ContinuosReads",
      "source_key": "Read302",
      "concept_id": "temp_delivery",
      "reason": "override_vendor",
      "evidence": { "note": "mapping confermato" },
      "semantic_category": "temperature",
    }
  ]
}


```

Operazioni:
- `add_kb_rule`
- `update_kb_rule`

---

### Patch Template Base (template_base_patch) - Manuali
Formato patch per aggiornare il Template Base.

```json
{
  "target": "template_base",
  "operations": [
    {
      "op": "add_base_concept",
      "category_id": "measurement",
      "concept_id": "temp_delivery",
      "semantic_category": "temperature",
      "label": { "it": "Temperatura mandata", "en": "Delivery temperature" },
      "description": "Temperatura di mandata"
    }
  ]
}

```

Operazioni:
- `add_base_concept`
- `remove_base_concept`
- `update_base_metadata`
---

## Flusso Patch Engine
1. Raccolta PatchActions  
2. Validazione schema  
3. Validazione canonica con Template Base 
4. Conversione in patch eseguibile  
5. Dry‑run  
6. Diff  
7. Commit (opzionale)  
8. Run report  

---
## Origine delle PatchActions

Le PatchActions possono provenire da:
- matching deterministico (confidence alta)
- LLM (solo come proposer)
- patch manuali (operatore umano)

In tutti i casi:
- **nessuna PatchAction viene applicata senza validazione**

---

## Note LLM
- Le proposte LLM vengono salvate come `llm_patch_actions.json`.
- I tentativi LLM (prompt/risposta/tempi) vengono tracciati in `llm_attempt.json` nella directory di run.
- Le metriche LLM del `run_report.json` sono corrette solo se `llm_attempt.json` è caricato e passato al `build_run_report`.

---

## Script coinvolti

### Orchestratore
**File:** `scripts/orchestrator.py`  
Scopo: orchestrarе l’intero flusso di validazione, dry‑run e commit, generare il `run_report.json`
e applicare le policy (dry‑run obbligatorio, schema‑first, patch‑based).
Documentazione in `orchestratore/README.md` 

### Validazione
**File:** `src/validator/validator.py`  
Scopo: validare PatchActions e patch generiche contro schema e Template Base, costruire
patch eseguibili e preview per dry‑run.
Documentazione in `validator/README.md` 

## Esempio

Esempio applicazione patch: `test/README.md`
