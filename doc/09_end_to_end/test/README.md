# Funzionamento completo del sistema (run_completa.py)

## Avvio
1. Avvio sistema:  
   `PYTHONPATH=. python3 test/run_completa.py`

2. Configurazione opzionale runtime (es. modello LLM):  
   `config.yml` (non usato come sorgente primaria degli input artifact).

---

## Inserimento input principali
Nel flusso corrente gli input principali sono selezionati da DB (artifact ID) e salvati come snapshot per-run.

- **Template reale**  
  selezionato da artifact `template`

- **Dizionario**  
  selezionato da artifact `dictionary`

- **Knowledge Base**  
  selezionata da artifact `kb`

- **Template Base**  
  selezionato da artifact `template_base`

- **Device List**  
  selezionato da artifact `device_list` / `device_list_context`

- **Schema normalizzazione**  
  recuperato da schema associato al template selezionato

- **Output folder**  
  output salvato in `runs/<user_id>/<run_id>/`

- **Modello LLM**  
  `LLM model [llama3.1:8b]:`

---

## Esecuzione pipeline
3. Il sistema normalizza il template ed esegue il matching.

4. Al termine viene chiesto cosa fare:  
   `1--> diz. 2--> kb. 3--> template. 4--> template_base. 5--> device_list. exit:`

   (Questa fase è descritta nel punto `08_patch_engine` della documentazione.)
