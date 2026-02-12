# 1. Normalizzazione

## Scopo
La normalizzazione serve a trasformare il testo “rumoroso” dei template reali (abbreviazioni, encoding errato, punti, underscore, maiuscole/minuscole, nomi vendor-specific) in una forma **stabile, confrontabile e riproducibile**, prima di qualsiasi tentativo di matching semantico.

Questa fase:
- non interpreta il significato  
- non assegna concept  
- non modifica il template originale  
- prepara esclusivamente dati “puliti” per le fasi successive di matching deterministico / LLM  

---

## Flusso
1. Lettura template reale e schema  
2. Estrazione guidata dai path JSON  
3. Normalizzazione dei campi testuali  
4. Produzione di un output strutturato e versionato  

---

## Input
- **Template reale del supervisore**  
  Sezioni tipiche: `ContinuousReads / Parameters / Alarms / Warnings / Commands / VirtualVariables / DataLoggerPen`
- **Schema di normalizzazione (schema-driven)**  
  Definisce sezioni e campi da estrarre

---

## Output
**File:** `normalized_template.json`
    Template normalizzato

---

## Esempio normalizzazione

Per vedere un esempio di una normalizzazione: `test/README.md`

---

## Codice
**File:** `normalizer.py`

### Funzioni

- **`load_json(path)`**  
  Carica un file JSON.

- **`resolve_path(data, path)`**  
  Risolve path JSON (es. `$.ContinuosRead.Values`).

- **`cleanup_text(value)`**  
  Normalizza unità di misura e testo (es. `"Â°C"` → `"°C"`).

- **`extract_device_id_from_name(name)`**  
  Estrae ID logico dal nome (es. `Read0_P02T04D01` → `P02T04D01`).

- **`empty_to_none(value)`**
  Converte stringhe vuote a None

- **`normalize_text(text)`**  
  Cuore della normalizzazione testuale:
  - correzione encoding errato (`Â°`, `Ãà`, ecc.)
  - conversione in lowercase
  - rimozione punteggiatura non informativa
  - `_` → spazio
  - collapse spazi multipli  

   **Esempio:**  
  `"Temp.mandata_Sm"` → `"temp mandata sm"`

- **`parse_json_field(value)`** 
  Prova a convertire una stringa JSON. (es. parse_json_field('{"a": 1, "b": 2}') --> {'a': 1, 'b': 2})

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