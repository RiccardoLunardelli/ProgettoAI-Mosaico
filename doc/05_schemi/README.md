# 5. Schemi (Schema-first)

## Scopo
Definire e generare **tutti gli schemi JSON ufficiali** del progetto,
usati per validare in modo rigoroso:
- input
- output
- patch
- report
- artefatti versionati

Nessun payload può essere salvato o applicato se **non valida contro uno schema**.

---

## Principi
- Schema-first design
- Validazione obbligatoria prima di ogni commit
- Contratti stabili e versionati
- Unico punto di verità strutturale

---

## Flusso
1. Definizione degli schemi tramite Pydantic 
2. Generazione automatica JSON Schema  
3. Salvataggio in `schemas/`  
4. Utilizzo degli schemi da parte del MCP Server per la validazione

---

## Output
Directory `schemas/` contenente gli schemi versionati.

---

## Schemi principali
- **Template Reale Patch:** schema che definisce target e operazioni che verranno fatte al template reale.
- **Template Base:** schema che definisce la struttura del template base.
- **Template Base Patch:** schema che definisce struttura delle Patch applicate a Template base.
- **Dizionario:** schema che definisce la struttura del dizionario.  
- **Dizionario Patch:** schema che definisce struttura delle Patch applicate al Dizionario.
- **Knowledge Base:** schema che definisce la struttura della Knowledge Base.   
- **Knowledge Base Patch:** schema che definisce struttura delle Patch applicate a Knwoledge Base.  
- **Matching Report:** schema che definisce la struttura del matching report.  
- **PatchActionsTemplate:** schema che definisce la struttura delle Patch da applicare al template reale.
- **Patch Actions:** schema che definisce la struttura delle Patch nel report.
- **Device List:** schema che definisce struttura e campi principali che deve contenere Device List.
- **Device List Context:** schema che definisce la struttura del Device List arricchito.  

---

## Codice
**File:** `schema_generate.py`

---

## Regole
- Ogni payload persistito deve essere validato
- Nessun commit senza validazione
- Nessun uso di schema impliciti
