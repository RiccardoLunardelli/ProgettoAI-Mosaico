# 6. Matching Engine

## Scopo
Il matching mette in relazione le variabili normalizzate con i concetti del Template Base,
usando:
- Dizionario
- Knowledge Base
- Regole deterministiche
- Fuzzy matching (come fallback)

L’obiettivo non è “indovinare”, ma **produrre candidati motivati**  con confidenza ed evidenza.

---

## Principi chiave
- Deterministic-first
- Fuzzy solo come fallback
- Nessuna modifica diretta ai template
- Decisioni sempre spiegabili

---

## Input
- `normalized_template.json`
- `template_base.json`
- `dictionary.json`
- `knowledge_base.json`
- `device_context.json`

---

## Output
**File:** `matching_report.json`

Contiene:
- **matched:** variabili matchate correttamente con confidence più alta della soglia (0.9) oppure che differenza tra candidati è maggiore di 0.15. 
- **ambiguous:** variabili che non sono state matchate ma che hanno un candidato con confidence minore di 0.9 oppure piu candidati ma la differenza di confidence tra i due è minore di 0.15.
- **unmapped:** variabili che non sono state matchate per assenza di candidati trovati nel dizionario.

## Esempio

Esempio di un matching report: `test/README.md`

---

## Codice
**File:** `matcher.py`

### Costanti principali
- `FUZZY_T_HIGH` → soglia match sicuro fuzzy
- `FUZZY_T_LOW` → soglia match ambiguo fuzzy
- `MIN_LEN_FOR_PARTIAL` → lunghezza minima per `partial_ratio`
- `SECTION_TO_CATEGORY` → mapping sezione → categoria semantica attesa

### Funzioni I/O e orchestrazione

- **`load_json(path)`**  
  **Importata da Normalizer:** Carica un file JSON da disco.

- **`load_inputs(...)`**  
  Carica tutti gli input necessari al matching.

- **`write_report(output_path, report, cache_path, cache)`**  
  Scrive il report finale e aggiorna la cache.

- **`run_matching(...)`**  
  Orchestratore principale:
  - prepara contesto
  - itera sulle variabili
  - raccoglie risultati
  - calcola metriche
  - genera output finale

### Cache

- **`load_cache(path)` / `save_cache(path, cache)`**  
  Gestione cache persistente dei risultati di matching.

- **`build_cache_key(...)`**  
  Costruisce una chiave deterministica basata su:
  - testo normalizzato
  - categoria attesa
  - template_guid
  - contesto device
  - versioni di dizionario / KB / template base

- **`emit_result(items, cache, cache_key, result)`**  
  Aggiunge il risultato sia alla lista che alla cache.

### Funzioni linguistiche
- **`normalize_str(s)`**  
  Normalizzazione leggera: rimozione spazi + lowercase.

- **`tokenize(s)`**  
  Tokenizzazione semplice basata su spazi.

### Template Base indexing
- **`build_concept_index(template_base)`**  
  Costruisce un indice:
  ```text
  concept_id → { category, semantic_category, label, description }

- **`match_score(text, synonym)`**  
  Matching deterministico:
  - match esatto → `1.0`
  - sinonimo contenuto → `0.7`
  - match per token → `0.6`
  - altrimenti `None`

### Fuzzy matching
- **`fuzzy_score(text, cand)`**  
  Calcola score fuzzy usando `rapidfuzz`:
  - `token_set_ratio`
  - `ratio`
  - `partial_ratio` (solo per stringhe sufficientemente lunghe)

- **`iter_candidate_texts(entry, template_base_index, concept_id)`**  
  Genera i testi candidati per il fuzzy matching:
  - sinonimi del dizionario
  - label del template base
  - descrizione del template base

### Knowledge Base e contesto device
- **`extract_device_context(device_context_path, template_guid, device_id)`**
  Estrae il contesto del device (vendor/famiglia/ruolo).

- **`resolve_scope_ids(kb, template_guid, device_ctx)`**
  Determina gli scope KB validi per il device corrente.

### LLM context
- **`build_llm_context(...)`**
  Costruisce un payload strutturato per l’LLM contenente:
  - variabile
  - testo normalizzato
  - candidati principali
  - contesto device
  - versioni degli artefatti

⚠️ L’LLM non viene invocato qui, ma solo preparato come contesto.

### Core Matching

- **`match_variable(...)`**  
Funzione centrale che esegue il matching di una singola variabile.

### Ordine di matching
1. Override KB mapping  
2. Cache lookup  
3. Skip variabili disabilitate  
4. Matching deterministico su sinonimi  
5. Fallback fuzzy  

### Classi di risultato
- `matched`
- `ambiguous`
- `unmapped`
- `skipped`

---

## Evidenze prodotte
- `technical_reason`
- `confidence`
- `evidence`
- `llm_context` (solo se ambiguo)
