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
- Conoscenza di dominio

---

## Output
**File:** `template_base.json` (versionato)

---

## Struttura concettuale

Il Template Base è organizzato in:
- **Categorie**
- **Concetti**

### Categorie
Gruppi semantici di alto livello.  
Esempi: `measurement`, `parameter`, `alarm`, `warning`, `command`, `virtual_variable`.

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

- `semantic_category`  
  Categoria semantica

- `label`  
  Etichette leggibili (multilingua)

- `description`  
  Descrizione funzionale del concetto

---

## Regole
- Nessuna generazione automatica
- Aggiornamenti solo manuali
- Ogni versione deve essere tracciabile