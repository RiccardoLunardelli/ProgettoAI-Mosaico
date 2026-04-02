# 3. Dizionario

## Scopo
Il **Dizionario** collega il linguaggio reale e rumoroso dei template(sinonimi, abbreviazioni, varianti linguistiche, pattern)
ai **concetti canonici** del Template Base.

Serve a rispondere alla domanda:
> “Quando nel template compare questo testo, a quale concetto stiamo probabilmente facendo riferimento?”

Il dizionario è il **cuore del matching deterministico**.

---

## Principi chiave
- Il dizionario **non è generato automaticamente**
- È **arricchito nel tempo**
- È **versionato e auditabile**
- È indipendente dal template reale

---

## Input
- Template Base
- Template reali normalizzati

---

## Output
**File:** `dictionary.json` (versionato)

---

## Struttura concettuale
Il dizionario è una lista di **entry**, ognuna legata a un `concept_id` presente nel template base.

Ogni entry descrive **come un concetto può apparire** nei template reali.

---

## Campi principali di una entry
- `concept_id`: Riferimento al concetto canonico del Template Base.
- `category`: Categoria (coerente con il Template Base).
- `semantic_category`: Categoria semantica (coerente con il Template Base).
- `synonyms`: Sinonimi testuali espliciti, divisi per lingua.
- `abbreviations`

---

## Regole
- Update manuale o tramite patch controllate
- Nessuna auto‑sovrascrittura
- Ogni modifica deve passare validazione schema
