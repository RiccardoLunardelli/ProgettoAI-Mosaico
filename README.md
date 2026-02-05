# STEP 1: NORMALIZZAZIONE 

### Scopo
La normalizzazione serve a trasformare il testo “rumoroso” dei template reali (abbreviazioni, encoding errato, punti, underscore, maiuscole/minuscole, nomi vendor-specific) in una forma stabile, confrontabile e riproducibile, prima di qualsiasi tentativo di matching semantico.
Questa fase:
non interpreta il significato
non assegna concept
non modifica il template originale
prepara esclusivamente dati “puliti” per le fasi successive di matching deterministico / LLM.

### Flusso
Lettura template e schema
Estrazione guidata dai path JSON
Normalizzazione dei campi testuali
Produzione di un output strutturato e versionato

### Input
Template reale del supervisore (quello configurato dal frigorista sul PLC), con sezioni tipo: Read / Parameters / Alarms / Warnings / Commands / VirtualVariables / DataLoggerPen ecc.
Schema di normalizzazione (schema-driven) che definisce:
sezioni
campi da estrarre

### Codice
normalizer.py
#### Funzioni
load_json(path) --> Carica un file JSON da disco.

resolve_path(data, path)--> Risoluzione di path JSON stile: $.ContinuosRead.Values

normalize_text(text)--> È il cuore della normalizzazione testuale: corregge encoding errato (Â°, Ãà, ecc.), lowercase, rimozione punteggiatura non informativa, underscore → spazio, collapse spazi multipli Output: "Temp.mandata_Sm" → "temp mandata sm"

cleanup_measurement(value)--> Normalizza unità di misura errate: "Â°C" → "°C", "Â°F" → "°F"

extract_device_id_from_name(name)--> Estrae ID logico del device da pattern noti: Read0_P02T04D01 → P02T04D01 

apply_normalizations(extracted, normalizations)--> Applica normalizzazioni dichiarate nello schema

build_variable(section, source_key, extracted)--> Costruisce una VariableNormalized: separa raw vs normalized, raccoglie evidenze, calcola enabled, arricchisce con device_id

normalize_template(raw_template, schema)--> Funzione orchestratrice: itera sulle sezioni dello schema, distingue core vs support_only, costruisce l’output finale NormalizedTemplate

### Regole 
Nessuna inferenza semantica
Nessun matching
Nessuna modifica del template originale
Normalizzazione idempotente
Stesso input → stesso output
Ogni trasformazione è spiegabile

### Output atteso
normalized_template.json

# STEP 2: CREAZIONE TEMPLATE BASE
