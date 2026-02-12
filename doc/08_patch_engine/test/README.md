# Esempio produzione e applicazione Patch Actions

## Flusso

1. **Avvio orchestratore**
   - `python3 -m scripts.run_local`

2. **Scelta operazione**
   - `1--> diz. 2--> kb. 3--> template. 4--> template_base. 5--> device_list:`

---

## Caso 1 — Dizionario
- Inserire percorso dizionario:  
  `Percorso file input: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionary_v0.1.json`
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali o da run report:  
  `Patch manuale o da run report? (m/r):`
  - **Manuale**: inserire path patch
  - **Run report**: inserire path report  
    `Run report path: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/runs/run20260212_113453/run_report.json`
- Output:
  - `output_dir/dictionary_patch.json`
  - `output_dir/dictionary_suggestions.json`
  - `run_report.json`

---

## Caso 2 — Knowledge Base
- Inserire percorso KB:  
  `Percorso file input: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb_v0.1.json`
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali:  
  `Usare patch manuali? (y/n):`
- Output:
  - patch applicate (se valide)
  - `run_report.json`

---

## Caso 3 — Template
- Inserire percorso template:  
  `Percorso file input: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates/1e14c88b-12d9-523c-c481-0d0fdba8b193.json`
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
- Inserire percorso Template Base:  
  `Percorso file input: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base_v0.1.json`
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Patch manuali:  
  `Usare patch manuali? (y/n):`
- Output:
  - patch applicate (se valide)
  - `run_report.json`

---

## Caso 5 — Device List
- Inserire percorso device_list:  
  `Percorso file input: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs/101096_FABRIC/device_list.json`
- Scegliere modalità:  
  `Validate only? (y --> ONLY report /n --> Commit):`
- Output:
  - device_list_context generato
  - eventuali warning, es.:  
    `Richiesta revisione umana per dispositivo 'centrale': CENTRALE TN MAT: 0VCD345201 ADR: 1.005`
  - `run_report.json`
