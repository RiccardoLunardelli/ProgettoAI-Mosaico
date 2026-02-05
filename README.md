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