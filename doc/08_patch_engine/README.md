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

Caratteristiche:
- target semantico (`concept_id`, `category`, `semantic_category`)
- patch dichiarativa (`set_fields`)
- `confidence`, `reason`, `evidence`

---

## Flusso Patch Engine
1. Raccolta PatchActions  
2. Validazione schema  
3. Validazione canonica (Template Base)  
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

## Script coinvolti

### Orchestratore
**File:** `scripts/run_local.py`  
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