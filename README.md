# FASE 1 — Analisi template e perimetro dati

### Scopo
Capire quali parti dei template servono davvero.

### Input
Template reali (JSON grezzi)
Documentazione tecnica (se disponibile)

### Attività
Studiare template reali
Identificare sezioni utili
Decidere campi utili vs rumorosi

### Output
Decisioni di perimetro (documento/notes)
Lista sezioni e campi da includere

# FASE 2 — Creazione schema_tipo (schema-first)

### Scopo
Definire uno schema dichiarativo che governa l’estrazione dei dati.

### Input
Output FASE 1 (sezioni e campi ammessi)

### Attività
Definizione sezioni incluse
Definizione campi da estrarre
Filtri (type ammessi, pattern esclusi)
Regole di parsing

### Output
schema_tipo_v0.1.json

# FASE 3 — Creazione normalizzatore

### Scopo
Trasformare template grezzi in un formato uniforme e auditabile.

### Input
Template reale (JSON)
schema_tipo_v0.1.json

### Attività
Parsing template JSON
Applicazione schema_tipo
Normalizzazione testo (encoding, lower, multilanguage)

### Output
normalized_template_v0.1.json

### PER ESEGUIRE NORMALIZER
uv run python src/parser/normalizer.py   --template pv_datas/templates/028d14de-71dc-6e64-9587-c7111a39793e.json   --schema schemas/schema_tipo_v0.1.json   --output output_dir/normalized_template_v0.1.json

# FASE 4 — Creazione Template Base (concetti canonici)

### Scopo
Definire il linguaggio standard del dominio.

### Input
Output FASE 1 (analisi dominio)

### Attività
Identificazione concetti chiave
Definizione categorie
Etichette multilingua

### Output
template_base_v0.1.json

# FASE 5 — Creazione Dizionario

### Scopo
Collegare il linguaggio reale dei templat (normalizzato)e ai concetti canonici.

### Input
template_normalized_v0.1.json
template_base_v0.1.json

### Attività
Raccolta sinonimi da testo normalizzato
Pattern e abbreviazioni
Versioning

### Output
dictionary_v0.1.json

# FASE 6 - Creazione Knowledge Base

### Scopo
Gestire il contesto (vendor, device, storico).

### Input
device_list_context.json
template_normalized_v0.1.json
template_base_v0.1.json
dictionary_v0.1.json

### Attività
Generazione device_list_context.json
enrichment automatico:
type_fam_generated
enum_generated
device_role_generated
Definizione struttura KB
Definizione scope (template_guid, type_fam, device_role)

### Output
device_list_context.json
kb_v0.1.json

# FASE 7 - Matching Deterministico / Matching Engine

### Scopo
Associare in modo deterministico ogni variabile attiva a un concept canonico.

### Input
template_normalized_v0.1.json
dictionary_v0.1.json
template_base_v0.1.json
device_context_v0.1.json
kb_v0.1.json

### Attività
Creazione matcher.py

###  PER ESEGUIRE MATCHER
python3 matcher.py --normalized /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/normalized_template_v0.1.json --template_base /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base_v0.1.json --dictionary /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionary_v0.1.json --kb /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb_v0.1.json --device_context /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs/262174_VIGODA_ALI/device_list_context_v0.1.json --output /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/matching_report_v0.1.json

### Output
matching_report_v0.1.json

# FASE 8

### Scopo
Trasformare l'output del matching in azioni dichiarative, senza decidere nulla

### Input
matching_report_vx.json

### Attività
Creazione script che produce path Actions. 

### ESEGUIRE PATCHER
python3 patcher.py --matching /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/matching_report_v0.1.json --output /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/patch_actions_v0.1.json

### Output
patch_actions_vx.json

# FASE 9 - MCP Server

### Scopo

### Attività

### Output

# FASE 10 - Applicare Patch e Tool a dizionario

### Scopo
Testare che tool dictionary siano funzionanti. Test con patch manuali.

### Attività
Aggiornato schema_generate per validare schema correttamente
Creazione patch manuali

### Output
Tool dictionary funzionanti.

# FASE 11 - Applicare Patch e Tool a KB
### Scopo
Testare che tool kb siano funzionanti. Test con patch manuali.

### Attività
Aggiornato schema_generate per validare schema correttamente
Creazione patch manuali

### Output
Tool kb funzionanti.