# Test del matching delle variabili

## Flusso

1) Avviare una run template da API (`POST /run/template/start`) con artifact DB (`template`, `dictionary`, `kb`, `template_base`, `device_list_context`).  
2) Il matcher usa gli snapshot della run corrente.  
3) Il report viene salvato in `runs/<user_id>/<run_id>/matching_report_v0.1.json`.

## Esempio matching report

Esempio di una variabile matchata, una ambiguous e una unmapped

```json
{
  "matching_version": "v0.1",
  "template_guid": "1e14c88b-12d9-523c-c481-0d0fdba8b193",
  "generated_at": "2026-02-12T10:19:10.091754+01:00",
  "metrics": {
    "mapped_count": 595,
    "ambiguous_count": 355,
    "unmapped_count": 830,
    "avg_confidence": 0.9348,
    "warnings_count": 0
  },
  "items": [
    {
      "source_key": "Read302",
      "section": "ContinuosReads",
      "status": "matched",
      "technical_reason": "fuzzy_match",
      "concept_id": "state_compressor",
      "confidence": 1.0,
      "evidence": {
        "normalized_text": "stato compressore parallelo",
        "matched_synonym": "stato compressore",
        "dictionary_entry_id": "state_compressor",
        "category": "measurement",
        "semantic_category": "state",
        "match_source": "template_base_label_it",
        "gap_top2": 0.375
      }
    },
    {
      "source_key": "Read38",
      "section": "ContinuosReads",
      "status": "ambiguous",
      "technical_reason": "low_confidence_single_candidate",
      "concept_id": null,
      "confidence": null,
      "evidence": {
        "normalized_text": "l2 allarme sovraccarico comune ventilatori",
        "matched_synonym": null,
        "dictionary_entry_id": null,
        "category": "measurement",
        "semantic_category": null
      },
      "candidates": [
        {
          "concept_id": "state_fan",
          "score": 0.7
        }
      ],
      "llm_context": {
        "section": "ContinuosReads",
        "source_key": "Read38",
        "normalized_text": "l2 allarme sovraccarico comune ventilatori",
        "expected_category": "measurement",
        "top_candidates": [
          {
            "concept_id": "state_fan",
            "score": 0.7,
            "match_source": null,
            "category": "measurement",
            "semantic_category": "state"
          }
        ],
        "device_ctx": {
          "template_guid": "1e14c88b-12d9-523c-c481-0d0fdba8b193",
          "type_fam": null,
          "device_role": null,
          "enum": null
        },
        "versions": {
          "dictionary_version": "0.1",
          "kb_version": "0.1",
          "template_base_version": "v0.1"
        }
      }
    },
    {
      "source_key": "Read575",
      "section": "ContinuosReads",
      "status": "unmapped",
      "technical_reason": "fuzzy_below_threshold",
      "concept_id": null,
      "confidence": null,
      "evidence": {
        "normalized_text": "utilizza sonda di aspirazione l1 come sonda di condesazione l2",
        "matched_synonym": null,
        "dictionary_entry_id": null,
        "category": "measurement",
        "semantic_category": null
      },
      "suggested_action": "dictionary.suggest_or_upsert"
    },
    ...
  ]
}
```
