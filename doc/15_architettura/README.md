# 15. Architettura

## Scopo

Rappresentazione del flusso completo del sistema ad alto livello attraverso uno schema grafico

## Schema ad alto livello
```mermaid
flowchart TD
  A["INPUTS\nTemplate Reale (PLC JSON)\nDevice List\nTemplate Base (canonico)\nDizionario (versionato)\nKnowledge Base (versionata)\nconfig.yml + device_list_rules.yml"]
  B["NORMALIZATION LAYER\nparser/normalizer.py -> NormalizedTemplate\n(schema-driven extraction + cleanup testo/misure)"]
  C["MATCHING ENGINE (matcher.py)\n1) KB override (scope-aware)\n2) Cache\n3) Deterministic dictionary match\n4) Fuzzy fallback (threshold + gap)\n5) Ambiguous -> llm_context\nOUTPUT: matching_report_v0.1.json"]
  D["MCP SERVER\n(server_mcp.py)"]
  E["ORCHESTRATOR\n(run_local.py)\nload + validate MR\nbuild deterministic PatchActions\noptional LLM propose\nfilter confidence/gap\ncommit decision"]
  F["LLM Proposer"]
  G["VALIDATOR\n(validator.py)\nschema-first\ncanonical validation\ndry-run + diff\nenforce governance"]
  H["OUTPUTS\nArtefatto versionato (_v0.1 -> _v0.2)\nrun_report.json includes:\nschema_versions\nmetrics (matched/ambiguous/unmapped, llm_calls, warnings)\ndiff_summary\npolicy_outcome (approved / needs_review / no_change / rejected)\nmatched_variables, actions, absent_concepts"]

  A --> B --> C --> E
  C -->|matching_report_v0.1.json| E
  E <--> D
  E <--> F
  E --> G --> H
 ```

## Note
- L’LLM non applica patch: è solo proposer.
- Tutte le scritture passano dal MCP Server (schema‑first + dry‑run).
