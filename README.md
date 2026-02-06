# STEP 1: NORMALIZZAZIONE

## Scopo
La normalizzazione serve a trasformare il testo “rumoroso” dei template reali (abbreviazioni, encoding errato, punti, underscore, maiuscole/minuscole, nomi vendor-specific) in una forma **stabile, confrontabile e riproducibile**, prima di qualsiasi tentativo di matching semantico.

Questa fase:
- non interpreta il significato  
- non assegna concept  
- non modifica il template originale  
- prepara esclusivamente dati “puliti” per le fasi successive di matching deterministico / LLM  

---

## Flusso
1. Lettura template e schema  
2. Estrazione guidata dai path JSON  
3. Normalizzazione dei campi testuali  
4. Produzione di un output strutturato e versionato  

---

## Input
- **Template reale del supervisore** (configurato dal frigorista sul PLC), con sezioni tipo:  
  `Read / Parameters / Alarms / Warnings / Commands / VirtualVariables / DataLoggerPen`
- **Schema di normalizzazione (schema-driven)** che definisce:
  - sezioni
  - campi da estrarre

---

## Codice
**File:** `normalizer.py`

### Funzioni

- **`load_json(path)`**  
  Carica un file JSON da disco.

- **`resolve_path(data, path)`**  
  Risoluzione di path JSON stile:  
  `$.ContinuosRead.Values`

- **`normalize_text(text)`**  
  Cuore della normalizzazione testuale:
  - correzione encoding errato (`Â°`, `Ãà`, ecc.)
  - conversione in lowercase
  - rimozione punteggiatura non informativa
  - `_` → spazio
  - collapse spazi multipli  

  **Esempio:**  
  `"Temp.mandata_Sm"` → `"temp mandata sm"`

- **`cleanup_measurement(value)`**  
  Normalizza unità di misura errate:  
  `"Â°C"` → `"°C"`, `"Â°F"` → `"°F"`

- **`extract_device_id_from_name(name)`**  
  Estrae l’ID logico del device da pattern noti:  
  `Read0_P02T04D01` → `P02T04D01`

- **`apply_normalizations(extracted, normalizations)`**  
  Applica le normalizzazioni dichiarate nello schema.

- **`build_variable(section, source_key, extracted)`**  
  Costruisce una `VariableNormalized`:
  - separa raw vs normalized
  - raccoglie evidenze
  - calcola `enabled`
  - arricchisce con `device_id`

- **`normalize_template(raw_template, schema)`**  
  Funzione orchestratrice:
  - itera sulle sezioni dello schema
  - distingue `core` vs `support_only`
  - costruisce l’output finale `NormalizedTemplate`

---

## Regole
- Nessuna inferenza semantica  
- Nessun matching  
- Nessuna modifica del template originale  
- Normalizzazione idempotente  
- Stesso input → stesso output  
- Ogni trasformazione è spiegabile  

---

## Output atteso
**File:** `normalized_template.json`

---

# STEP 2: CREAZIONE TEMPLATE BASE
## Scopo
Il **Template Base** rappresenta il riferimento **canonico e stabile** del dominio.
Non è un template operativo da caricare sui supervisori, ma un **modello semantico di riferimento** che definisce:
- quali concetti esistono
- come sono categorizzati
- quali metadati standard devono avere

Serve come **ancora semantica** per:
- il matching delle variabili dei template reali
- la validazione delle decisioni
- la coerenza nel tempo del sistema

---

## Principi chiave
- Il Template Base **non viene generato automaticamente**
- È **costruito e curato manualmente**
- Evoluzione **controllata e versionata**
- Deve essere **stabile** rispetto ai template reali
- Non contiene riferimenti a ReadX / ParamX / registri PLC

---

## Input
- Analisi dei template reali osservati
- Categorie semantiche definite a priori

---

## Output
**File:** `template_base.json`

Artefatto versionato e immutabile per ogni release.

---

## Struttura concettuale

Il Template Base è organizzato in:
- **Categorie**
- **Concetti**

### Categoria
Una categoria rappresenta un grande gruppo semantico.

Esempi:
- `measurement`
- `parameter`
- `alarm`
- `warning`
- `command`
- `virtual_variable`

---

### Concetto
Un concetto rappresenta **univocamente un significato fisico o logico**, indipendente da:
- vendor
- lingua
- abbreviazioni
- implementazione PLC

Ogni concetto deve essere:
- semanticamente atomico
- riconoscibile nel mondo reale
- stabile nel tempo

---


## Campi principali di un concetto

Ogni concetto del Template Base include tipicamente:

- `concept_id`  
  Identificatore canonico univoco (snake_case)

- `category`  
  Categoria di appartenenza

- `label`  
  Etichette leggibili (multilingua)

- `description`  
  Descrizione funzionale del concetto

---

# STEP 3: CREAZIONE DIZIONARIO
## Scopo
Il **Dizionario** è il componente che collega il linguaggio reale, rumoroso e non standardizzato dei template
(sinonimi, abbreviazioni, varianti linguistiche, pattern testuali) ai **concetti canonici** definiti nel Template Base.

Serve a rispondere alla domanda:
> “Quando nei template compare questo testo, a quale concetto stiamo probabilmente facendo riferimento?”

Il dizionario è il **cuore del matching deterministico**.

---

## Principi chiave
- Il dizionario **non è generato automaticamente**
- È **arricchito nel tempo**, run dopo run
- È **versionato e auditabile**
- È indipendente dai template reali
- È indipendente dal matching engine (niente logica procedurale)

---

## Input
- Template Base (Step 2)
- Analisi dei template reali normalizzati (Step 1)
- Output dei run precedenti:
  - `unmapped_terms`
  - `ambiguous_matches`
- Conoscenza di dominio

---

## Output
**File:** `dictionary.json`  
Artefatto versionato (`dictionary_vX.Y.json`).

---

## Ruolo del dizionario
- Riceve testo **normalizzato**
- Fornisce:
  - candidati di concept
  - segnali deterministici forti
- Riduce:
  - ambiguità
  - chiamate LLM
  - variabilità nel tempo

---

## Struttura concettuale

Il dizionario è una **lista di entry**, ognuna collegata a un `concept_id`
(definito nel Template Base).

Ogni entry descrive **come un concetto può apparire nei template reali**.

---


## Campi principali di una entry

### `concept_id`
Riferimento al concetto canonico del Template Base.

---

### `category`
Categoria (coerente con il Template Base).

---

### `semantic_category`
Categoria semantica (coerente con il Template Base).

---

### `synonyms`
Sinonimi testuali espliciti, divisi per lingua.

---

### `abbreviations`
Abbreviazioni.

---

### `patterns`

---

# STEP 4: CREAZIONE KNOWLEDGE BASE
## Scopo
La **Knowledge Base (KB)** fornisce **contesto operativo e memoria storica** al sistema.
Non descrive *cosa* è un concetto (Template Base) né *come* viene espresso (Dizionario), ma
**in quali condizioni un concetto è più probabile, meno probabile o prioritario**.

Serve a ridurre ambiguità, aumentare determinismo e migliorare la qualità del matching nel tempo.

---

## Input 
- Device list del supervisore
- Conoscenza regole esplicitate dal punto vendita

---

## Output
**File:** `kb.json`  

---

## Ruolo della Knowledge Base
Fornire il **contesto lavorativo** in cui stiamo lavorando, conoscendo **se esplicitato** dal punto vendita, le variabili a cosa corrispondono

---

# STEP 5: MATCHING 
## Scopo
Il **Matching** è la fase in cui le variabili normalizzate vengono **messe in relazione** con i concetti del Template Base,
utilizzando in modo ordinato e controllato:
- Dizionario
- Knowledge Base
- Regole deterministiche
- Fuzzy matching

L’obiettivo non è “indovinare”, ma **produrre candidati motivati**, con confidenza ed evidenza esplicita.

---

## Principi chiave
- **Deterministic-first**
- **Fuzzy** nel caso di fallback
- Matching **non distruttivo**
- Ogni decisione deve essere **spiegabile**
- Nessuna modifica diretta ai template

---

## Input
- `normalized_template.json` (Step 1)
- `template_base.json` (Step 2)
- `dictionary.json` (Step 3)
- `knowledge_base.json` (Step 4)
- `device_context.json` (device_list arricchita)

---

## Output
**File:** `matching_result.json`

Artefatto intermedio, non eseguibile, che contiene:
- match sicuri
- match ambigui
- termini non riconosciuti

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
  Carica un file JSON da disco.

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

  **Ordine delle operazioni:**
  1. Override da KB mapping (match deterministico forte)
  2. Cache lookup
  3. Skip variabili disabilitate o invalide
  4. Matching deterministico su sinonimi
  5. Fallback fuzzy

  **Classificazione risultato:**
  - `matched`
  - `ambiguous`
  - `unmapped`
  - `skipped_`

  **Ogni risultato include:**
  - `technical_reason`
  - `confidence` (se applicabile)
  - `evidence`
  - `llm_context` (solo se ambiguo)
---

## MCP Server
