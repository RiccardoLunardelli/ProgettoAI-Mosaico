# 15. Architettura

## Scopo

Rappresentazione del flusso completo del sistema ad alto livello attraverso uno schema grafico

## Schema ad alto livello
```mermaid
flowchart TD
  classDef plain fill:#ffffff,stroke:#000000,color:#000000,stroke-width:1px;

  A["**INPUTS**<br/>Template Reale (PLC JSON)<br/>Device List<br/>Template Base (canonico)<br/>Dizionario (versionato)<br/>Knowledge Base (versionata)<br/>config.yml + device_list_rules.yml"]
  B["**NORMALIZATION LAYER**<br/>parser/normalizer.py -> NormalizedTemplate<br/>(schema-driven extraction + cleanup testo/misure)"]
  C["**MATCHING ENGINE (matcher.py)**<br/>1) KB override (scope-aware)<br/>2) Cache<br/>3) Deterministic dictionary match<br/>4) Fuzzy fallback (threshold + gap)<br/>5) Ambiguous -> llm_context<br/>OUTPUT: matching_report_v0.1.json"]
  D["**MCP SERVER**<br/>(server_mcp.py)"]
  E["**ORCHESTRATOR**<br/>(run_local.py)<br/>load + validate MR<br/>build deterministic PatchActions<br/>optional LLM propose<br/>filter confidence/gap<br/>commit decision"]
  F["**LLM PROPOSER**<br/>(llama3.1:8b)"]
  G["**VALIDATOR**<br/>(validator.py)<br/>schema-first<br/>canonical validation<br/>dry-run + diff<br/>enforce governance"]
  H["**RUN REPORT**<br/>(run_report.json)<br/>schema_versions<br/>metrics<br/>diff_summary<br/>policy_outcome<br/>matched_variables, actions, absent_concepts"]
  I["**VERSIONED OUTPUTS**<br/>(template/dict/kb/etc.)<br/>_v0.1 → _v0.2"]

  A --> B --> C --> E
  C -->|matching_report_v0.1.json| E
  E <--> D
  E <--> F
  E --> G
  E --> H
  E --> I

  class A,B,C,D,E,F,G,H,I plain
 ```

## Note
- L’LLM non applica patch: è solo proposer.
- Tutte le scritture passano dal MCP Server (schema‑first + dry‑run).
