# Fase 1 - Analisi template e perimetro dati (consolidata)

## Input analizzati
- Directory: pv_datas/templates
- Esclusi dal perimetro di analisi: file con suffisso `.updated.json` (output derivati)

## Sezioni osservate (47 template base)
- TemplateGuid (47/47)
- ContinuosReads (47/47)
- Parameters (47/47)
- Alarms (47/47)
- Warnings (47/47, ma 4 non vuoti)
- Commands (47/47, 32 non vuoti)
- VirtualVariables (47/47, 3 non vuoti)
- DataloggerPen (47/47, 46 non vuoti)
- AIVariables (4/47 presenti, 2 non vuoti) [solo in .updated.json, fuori perimetro]

## Decisioni consolidate di perimetro
### Sezioni core (normalizzazione + matching deterministico)
- ContinuosReads
- Parameters
- Alarms
- Warnings
- Commands
- VirtualVariables

### Sezioni support_only (no matching diretto)
- DataloggerPen (evidence e link Pen -> ReadX)
- TemplateGuid (id del template)

## Regole di normalizzazione confermate
- MultiLanguageDescription: stringa JSON -> oggetto.
- Measurement: cleanup encoding (es. "Â°C" -> "°C", "Â°F" -> "°F").
- Usare la grafia osservata: ContinuosReads, DataloggerPen.
- Campo Name: sempre estratto come evidence, mai per matching primario.
- Campo Enable: se false, non matchare ma includere comunque nel normalized_template.
- Ogni variabile normalizzata deve includere: section, source_key, raw_text, normalized_text, enabled.

## Campi da estrarre (definitivi, senza aggiunte)
### Core (ContinuosReads / Parameters / Alarms / Warnings / Commands / VirtualVariables)
Campi comuni:
- source_key
- Description
- MultiLanguageDescription
- Measurement
- Type
- Alias (quando presente)
- Name (solo evidence)
- Enable (da normalizzare in "enabled")

Campi specifici Parameters:
- Label
- Category

Campi specifici Alarms:
- Priority

Campi esclusi (rumorosi o UI):
- HTMLViewEnable, HTMLViewCategory, HTMLViewIndexPosition, HTMLMaskValue
- ShowIndexPage
- TroubleSettings
- AccessLevel, AccessWriteLevel
- Visibility
- Default
- ValueCommand
- AlwaysValidValue

### DataloggerPen (support_only)
Campi:
- Pen
- Labels
- Measurement
- Name
- Type

Campi esclusi:
- Hidden
- IsDefault

### TemplateGuid (support_only)
Campi:
- TemplateGuid

## Esempio di variabile normalizzata (core)
```json
{
  "section": "ContinuosReads",
  "source_key": "Read0",
  "raw_text": "Temperatura di Mandata",
  "normalized_text": "temperatura di mandata",
  "measurement": "°C",
  "type": 3,
  "enabled": true,
  "evidence_fields": {
    "Name": "Read0_P01T04D01",
    "Alias": "Read0",
    "MultiLanguageDescription": {
      "it": "Temperatura di Mandata",
      "en": "Air off Temperature"
    }
  }
}
```

## Implicazioni per schema_tipo_v1.json
- Sezioni core con allowlist di campi e filtro su Type/Enable.
- Sezioni support_only estratte solo per evidence/audit.
