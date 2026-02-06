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

# STEP 5: CREAZIONE DEGLI SCHEMI (SCHEMA-FIRST)

## Scopo
Questo step definisce e genera **tutti gli schemi JSON ufficiali** del progetto, utilizzati per la validazione
rigorosa di:
- input
- output
- patch
- report
- artefatti versionati

Gli schemi rappresentano il **contratto formale** tra:
- pipeline deterministica
- MCP Server
- eventuale LLM (proposer)

Nessun payload può essere salvato o applicato se **non valida contro uno schema**.

---

## Principi
- Schema-first design
- Validazione obbligatoria prima di ogni commit
- Contratti stabili e versionati
- Unico punto di verità strutturale
- Nessuna ambiguità di formato

---

## Flusso
1. Definizione dei modelli dati tramite Pydantic
2. Generazione automatica degli JSON Schema
3. Salvataggio degli schemi nel repository
4. Utilizzo degli schemi da parte del MCP Server per la validazione

---

## Input
- Modelli Pydantic che rappresentano:
  - Template Base
  - Dizionario
  - Knowledge Base
  - Matching Report
  - Patch
  - PatchActions
  - Device List

---

## Output
Directory `schemas/` contenente gli schemi JSON versionati

---

## Codice
**File:** `schema_generate.py`



### Template reale Patch 
  - target `template`
  - operazioni `set_fields`
  - sezione e `source_key`
  - campi da aggiornare


### Template Base
Definisce:
- categorie
- concetti
- label multilingua
- descrizioni
- semantic_category

### Template Base Patch
Definisce le operazioni consentite sul Template Base:
  - `add_base_concept`
  - `remove_base_concept`
  - `update_base_metadata`  

### Dizionario
Definisce:
- concept_id
- category
- semantic_category
- synonyms
- abbreviations
- patterns

### Dizionario Patch
Definisce le operazioni consentite sul dizionario:
  - `add_concept`
  - `add_synonym`
  - `update_synonym`
  - `add_abbreviation`
  - `add_pattern`
  - `update_category`
  - `update_semantic_category`

### Knowledge Base
Definisce:
- scopes
- mapping contestuali
- blacklist
- audit
- riferimenti a versioni di dizionario e template base

### Knowledge Base Patch
Definisce le operazioni consentite sulla Knowledge Base:
  - `add_kb_rule`
  - `update_kb_rule`

### Matching Report
Definisce:
- risultati per variabile
- stato (`matched / ambiguous / unmapped / skipped`)
- confidence
- technical_reason
- evidence
- contesto LLM (se presente)
- metriche aggregate

### PatchActionsTemplate
Schema utilizzato come **output ufficiale dell’LLM proposer**:
- azioni atomiche
- target semantico
- patch da applicare
- confidence, reason, evidence obbligatorie

### `write_schema(name, model, out_dir)`
- Converte un modello Pydantic in JSON Schema
- Crea directory se assente
- Scrive schema formattato e leggibile

---

## Regole
- Ogni payload persistito deve essere validato contro uno schema
- Nessun commit senza validazione
- Nessun uso di schema “impliciti”
- Gli schemi sono parte integrante della governance del sistema

---

# STEP 6: MATCHING 
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

# STEP 7: MCP Server
## Scopo
L’**MCP Server** è il *gatekeeper* del progetto: espone tool controllati per leggere/scrivere file, validare payload
contro JSON Schema e applicare patch in modo **sicuro**, **auditabile** e **versionato**.

Il server rende l’integrazione con un agente (LLM o orchestratore) possibile senza permettere:
- scritture arbitrarie su filesystem
- commit senza dry-run
- salvataggi di payload non validati
- modifiche in-place (versioning non distruttivo)

---

## Codice
- `core.py`
- `server.py`
- `tools/template_tool.py`
- `tools/schema_tool.py`
- `tools/dictionary_tool.py`
- `tools/kb_tool.py`
- `tools/device_list_tool.py`

---

## Concetti chiave

### MCPContext (core del server)
Classe centrale che implementa:
- guardrail filesystem (allowlist repo_root)
- read/write JSON
- schema validation (jsonschema)
- meccanismo dry-run → commit
- diff JSON per audit/debug
- mappa schema_id → file schema

---

## File: core.py

### Classi
- **`MCPError`**  
  Eccezione custom usata per errori controllati del server.

- **`MCPContext(repo_root)`**  
  Contesto di esecuzione che gestisce sicurezza e invarianti.

### Funzioni / metodi principali

- **`ensure_within_root(path)`**  
  Impone una allowlist sul filesystem: il server può operare solo dentro `repo_root`.

- **`read_json(path)`**  
  Lettura JSON da file.

- **`write_json(path, payload)`**  
  Scrittura JSON su file.

- **`hash_payload(payload)`**  
  Calcola SHA-256 del payload (json canonicalizzato) per tracking di validazione/dry-run.

- **`schema_get(schema_id)`**  
  Carica lo schema JSON associato a `schema_id` tramite `schema_map`.

- **`schema_validate(schema_id, payload)`**  
  Valida un payload contro lo schema JSON; registra l’hash in `_validated_hashes`.

- **`mark_dry_run(patch_actions)`**  
  Registra l’hash di un payload come “dry-run eseguito”.

- **`require_dry_run(patch_actions)`**  
  Impedisce commit se il payload non è stato marcato in precedenza con `mark_dry_run`.

- **`require_validated(payload)`**  
  Impedisce salvataggio se il payload non è stato validato contro uno schema.

- **`diff_json(a, b, prefix="")`**  
  Produce una lista di differenze “leggibili” tra due strutture JSON.

---

## File: server.py

### Definizione server MCP
Il server usa `FastMCP` e registra tool che delegano ai moduli in `tools/*`.

Tool esposti:
- `template_load`
- `template_save`
- `template_apply_patch`
- `schema_get`
- `schema_validate`
- `dictionary_search`
- `dictionary_upsert`
- `dictionary_bulk_suggest`
- `kb_load`
- `kb_save`
- `kb_upsert_mapping`
- `device_list_enrich`

---

## Tool: template_tool.py

### Funzioni
- **`template_load(ctx, path)`**  
  Legge un template JSON in modo sicuro (guardrail path).

- **`template_save(ctx, path, template)`**  
  Scrive un template JSON.  
  Se è un template base, valida prima contro schema `template_base`.

- **`template_apply_patch(ctx, path, patch, dry_run)`**  
  Applica patch con due target:
  - `target="template_base"` → operazioni su Template Base
  - `target="template"` → operazioni su template reale (`set_fields`)

  Comportamento:
  - valida template e patch con JSON schema
  - costruisce `preview` (deepcopy)
  - se `dry_run=True`: marca dry-run e ritorna preview
  - se commit: richiede dry-run precedente, valida output, salva in versione incrementata (`_v0.x`)

Operazioni Template Base supportate:
- `add_base_concept`
- `remove_base_concept`
- `update_base_metadata`

Operazioni Template reale supportate:
- patch per variabile: `(section, source_key) -> fields` (set_fields)

---

## Tool: schema_tool.py

- **`schema_get(ctx, schema_id)`**  
  Ritorna lo schema JSON associato.

- **`schema_validate(ctx, schema_id, payload)`**  
  Valida payload contro schema JSON.

---

## Tool: dictionary_tool.py

- **`dictionary_search(ctx, path, text, lang, concept_id)`**  
  Ricerca:
  - per `concept_id` (diretta)
  - oppure per `text + lang` dentro i sinonimi

- **`dictionary_upsert(ctx, path, patch, dry_run)`**  
  Applica patch al dizionario in modo versionato:
  - valida dizionario e patch
  - crea preview
  - dry-run / commit con `_next_versioned_path`

Operazioni supportate:
- `add_synonym`
- `add_concept`
- `update_synonym`
- `add_abbreviation`
- `add_pattern`
- `update_category`
- `update_semantic_category`

- **`dictionary_bulk_suggest(ctx, terms, path=None, expected_category=None)`**  
  Dato un set di termini, produce candidati basati su:
  - contains su synonyms
  - contains su abbreviations
  - match su patterns (regex)

- **`_next_versioned_path(path)`**  
  Incrementa versioni del file: `_v0.1.json` → `_v0.2.json`.

---

## Tool: kb_tool.py

### Funzioni
- **`kb_load(ctx, path)`**  
  Lettura KB.

- **`kb_save(ctx, path, versioned)`**  
  Salvataggio KB: richiede che il payload sia stato validato (`require_validated`).

- **`kb_upsert_mapping(ctx, path, patch, dry_run)`**  
  Patch versionata per regole KB (mappings):
  - valida KB e patch
  - crea preview
  - applica operazioni
  - dry-run / commit in nuova versione

Operazioni supportate:
- `add_kb_rule`
- `update_kb_rule`

---


## Tool: device_list_tool.py

### Scopo
Arricchisce la device_list del supervisore producendo un `device_list_context` con campi derivati.

### Funzioni
- **`derive_device_role(desc)`**  
  Deriva `device_role_generated` da parole chiave (CENTRALE, CELLA, BANCO, ecc.).

- **`derive_type_fam(desc)`**  
  Deriva `type_fam_generated` (TN/BT/TN-BT/other) tramite regole e regex.

- **`derive_enum(desc, type_fam)`**  
  Placeholder: regola non ancora definita.

- **`device_list_enrich(ctx, path, dry_run)`**  
  - valida input `device_list`
  - arricchisce ogni item con `*_generated`
  - valida output contro schema `device_list_context`
  - salva versionato (o crea `device_list_context_v0.1.json` se input è `device_list.json`)
  - dry-run / commit con guardrail

---

# STEP 8: 