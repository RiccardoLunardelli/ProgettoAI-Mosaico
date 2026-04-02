# Esempio produzione e applicazione Patch Actions

## Flusso

1. **Avvio orchestratore**
   - `python3 -m scripts.orchestrator`

2. **Scelta operazione**
   - `1--> diz. 2--> kb. 3--> template. 4--> template_base. 5--> device_list:`

---

## Caso 1 — Dizionario
- Selezionare dizionario da DB (artifact `dictionary`) e lavorare sullo snapshot run.
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali o da run report:  
  `Patch manuale o da run report? (m/r):`
  - **Manuale**: inserire path patch
  - **Run report**: usare `run_id`/report della run già salvata
- Output:
  - `runs/<user_id>/<run_id>/dictionary_patch.json`
  - `runs/<user_id>/<run_id>/dictionary_suggestions.json`
  - `run_report.json`

---

## Caso 2 — Knowledge Base
- Selezionare KB da DB (artifact `kb`) e lavorare sullo snapshot run.
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali:  
  `Usare patch manuali? (y/n):`
- Output:
  - patch applicate (se valide)
  - `run_report.json`

---

## Caso 3 — Template
- Selezionare template da DB (artifact `template`) e lavorare sullo snapshot run.
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali o automatiche:  
  `Usare patch manuali? (y/n):`
  - Se **manuali**: inserire path patch
  - Se **no**: entra in gioco l’LLM proposer (solo su ambigui)  
    `Sono presenti ambiguità. Usare LLM? (y/n):`
- Output:
  - patch deterministiche applicate
  - patch LLM proposte (se attivate)
  - `run_report.json`

---

## Caso 4 — Template Base
- Selezionare template base da DB (artifact `template_base`) e lavorare sullo snapshot run.
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali:  
  `Usare patch manuali? (y/n):`
- Output:
  - patch applicate (se valide)
  - `run_report.json`

---

## Caso 5 — Device List
- Selezionare device list da DB (artifact `device_list`) e lavorare sullo snapshot run.
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Output:
  - device_list_context generato
  - eventuali warning, es.:  
    `Richiesta revisione umana per dispositivo 'centrale': CENTRALE TN MAT: 0VCD345201 ADR: 1.005`
  - `run_report.json`
