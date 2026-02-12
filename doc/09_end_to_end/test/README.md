# Funzionamento completo del sistema (run_completa.py)

## Avvio
1. Avvio sistema:  
   `PYTHONPATH=. python3 test/run_completa.py`

2. Inserire file di configurazione:  
   `Path file di configurazione[config.yml]:`

---

## Inserimento input principali
Il sistema richiede i path degli input:

- **Template reale**  
  `Template path[inserisci quello da arricchire se non è presente]:`

- **Dizionario**  
  `Dictionary path:`

- **Knowledge Base**  
  `KB path:`

- **Template Base**  
  `Template base path:`

- **Device List**  
  `Device list path[inserisci quello da arricchire se non è presente]:`

  Se il device list non è ancora arricchito:
  - inserire path del device list grezzo, es.:  
    `/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs/101096_FABRIC/device_list.json`
  - il sistema lo arricchisce e può produrre avvisi, es.:  
    `Richiesta revisione umana per dispositivo 'centrale': CENTRALE TN MAT: 0VCD345201 ADR: 1.005`
  - viene richiesto il path del device list arricchito:  
    `Device list Path: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs/101096_FABRIC/device_list_context_v0.1.json`

- **Schema normalizzazione**  
  `Schema tipo path [schemas/schema_tipo_v0.1.json]:`

- **Output folder**  
  `Output dir [output_dir]:`

- **Modello LLM**  
  `LLM model [llama3.1:8b]:`

---

## Esecuzione pipeline
3. Il sistema normalizza il template ed esegue il matching.

4. Al termine viene chiesto cosa fare:  
   `1--> diz. 2--> kb. 3--> template. 4--> template_base. 5--> device_list. exit:`

   (Questa fase è descritta nel punto `08_patch_engine` della documentazione.)
