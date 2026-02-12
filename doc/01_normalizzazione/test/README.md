# Test della normalizzazione di un template reale

## Flusso

1) Avviare normalizer: `python3 src/parser/normalizer.py`
2) Scegliere Template da normalizzare: `Template path: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates/1e14c88b-12d9-523c-c481-0d0fdba8b193.json`
3) Scegliere lo schema su cui si basa il normalizzatore: Schema path: `/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/schemas/schema_tipo_v0.1.json`
4) Scegliere la Folder in cui si vuole l'output (template normalizzato): `Output dir: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir`
5) Template viene normalizzato: `Normalized template saved: /home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/normalized_template_v0.1.json`

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
-
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