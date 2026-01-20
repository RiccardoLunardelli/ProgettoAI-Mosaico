# FASE 1 — Analisi template e perimetro dati
### Scopo
Capire quali parti dei template servono davvero.

### Attività
Studiare template reali
Identificare sezioni prioritarie
Decidere campi utili vs rumorosi

### Output
Decisioni di perimetro (documento/notes)
Lista sezioni e campi da includere

# FASE 2 — Creazione schema_tipo (schema-first)
### Scopo
Definire uno schema dichiarativo che governa l’estrazione dei dati.

### Attività
Definizione sezioni incluse
Definizione campi da estrarre
Filtri (type ammessi, pattern esclusi)

### Output
schema_tipo_v1.json


# FASE 3 — Creazione normalizzatore
### Scopo
Trasformare template grezzi in un formato uniforme.

### Attività
Parsing template JSON
Applicazione schema_tipo
Normalizzazione testo (encoding, lower, multilanguage)

### Output
normalized_template_v1.json

### PER ESEGUIRE NORMALIZER
uv run python src/parser/normalizer.py   --template pv_datas/templates/028d14de-71dc-6e64-9587-c7111a39793e.json   --schema schemas/schema_tipo_v1.json   --output output_dir/normalized_template_v1.json

# FASE 4 — Creazione Template Base (concetti canonici)
### Scopo
Definire il linguaggio standard del dominio.

### Attività
Identificazione concetti chiave
Definizione categorie
Etichette multilingua

### Output
template_base_v1.json

# FASE 5 — Creazione Dizionario

### Scopo
Collegare il linguaggio reale dei templat (normalizzato)e ai concetti canonici.

### Attività
Raccolta sinonimi
Pattern e abbreviazioni
Versioning

### Output
dictionary_v0.1.json

# FASE 6 - Creazione Knowledge Base

### Scopo
Gestire il contesto (vendor, device, storico).

### Attività
Creazione generatore(device_list_generator.py) device_list_context.json che aggiunge automaticamente type_fam_generated, enum_generated, device_role_generated
Definizione struttura KB

### Output
kb_v0.1.json
