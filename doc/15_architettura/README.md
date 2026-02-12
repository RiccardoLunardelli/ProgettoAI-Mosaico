# 15. Architettura

## Scopo

Rappresentazione del flusso completo del sistema ad alto livello attraverso uno schema grafico

## Schema ad alto livello
```mermaid
flowchart TD
  A[INPUTS<br/>• Template Reale (PLC JSON)<br/>• Device List<br/>• Template Base (canonico)<br/>• Dizionario (versionato)<br/>• Knowledge Base (versionata)<br/>• config.yml + device_list_rules.yml]
  B[NORMALIZATION LAYER<br/>parser/normalizer.py → NormalizedTemplate<br/>(schema-driven extraction + cleanup testo/misure)]
  C[MATCHING ENGINE (matcher.py)<br/>1) KB override (scope-aware)<br/>2) Cache<br/>3) Deterministic dictionary match<br/>4) Fuzzy fallback (threshold + gap)<br/>5) Ambiguous → llm_context<br/><br/>OUTPUT: matching_report_v0.1.json]
  D[MCP SERVER<br/>(server_mcp.py)]
  E[ORCHESTRATOR<br/>(run_local.py)<br/>• load + validate MR<br/>• build deterministic PatchActions<br/>• optional LLM propose<br/>• filter confidence/gap<br/>• commit decision]
  F[LLM Proposer]
  G[VALIDATOR<br/>(validator.py)<br/>• schema-first<br/>• canonical validation<br/>• dry-run + diff<br/>• enforce governance]
  H[OUTPUTS<br/>• Artefatto versionato (_v0.1 → _v0.2)<br/>• run_report.json:<br/>- schema_versions<br/>- metrics (matched/ambiguous/unmapped, llm_calls, warnings)<br/>- diff_summary<br/>- policy_outcome (approved / needs_review / no_change / rejected)<br/>- matched_variables, actions, absent_concepts, ecc.]

  A --> B --> C --> E
  C -->|matching_report_v0.1.json| E
  E <--> D
  E <--> F
  E --> G --> H




## Note
- L’LLM non applica patch: è solo proposer.
- Tutte le scritture passano dal MCP Server (schema‑first + dry‑run).
