# Test della normalizzazione di un template reale

## Flusso

1) Avviare una run template da API (`POST /run/template/start`) selezionando artifact da DB.  
2) La normalizzazione usa il contenuto del template selezionato e lo schema associato.  
3) L'output viene salvato nello snapshot run: `runs/<user_id>/<run_id>/normalized_template_v0.1.json`.

## Esempio Template reale input

Esempio per una variabile:
```json
"Read302": {
  "Enable": true,
  "MultiLanguageDescription": "{\"it\":\"Stato compressore parallelo\"}",
  "TroubleSettings": "[]",
  "Name": "Read302_P02T01D01",
  "Alias": "Read302",
  "Description": "Stato compressore parallelo",
  "Type": 0,
  "Measurement": "",
  "ShowIndexPage": false,
  "HTMLViewEnable": 1,
  "HTMLViewCategory": "{\"it\":\"Compressore Parallelo\",\"en\":\"Parallel Compressor\"}",
  "HTMLViewIndexPosition": 200,
  "HTMLMaskValue": ""
}
```

## Esempio Template normalizzato

Esempio per una variabile:
```json
{
      "section": "ContinuosReads",
      "source_key": "Read302",
      "raw_text": "Stato compressore parallelo",
      "normalized_text": "stato compressore parallelo",
      "measurement": null,
      "type": 0,
      "enabled": true,
      "evidence_fields": {
        "Name": "Read302_P02T01D01",
        "Alias": "Read302",
        "MultiLanguageDescription": {
          "it": "Stato compressore parallelo"
        },
        "Label": null,
        "Category": null,
        "Priority": null
      },
      "device_id": "P02T01D01"
    },
```
