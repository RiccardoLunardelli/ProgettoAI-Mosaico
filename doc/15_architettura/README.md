# 15. Architettura

## Scopo

Rappresentazione del flusso completo del sistema ad alto livello attraverso uno schema grafico

## Schema ad alto livello
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  INPUTS                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Template Reale (PLC JSON)                                                 │
│  • Device List                                                               │
│  • Template Base (canonico)                                                  │
│  • Dizionario (versionato)                                                   │
│  • Knowledge Base (versionata)                                               │
│  • config.yml + device_list_rules.yml                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             NORMALIZATION LAYER                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  parser/normalizer.py  →  NormalizedTemplate                                 │
│  (schema-driven extraction + cleanup testo/misure)                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          MATCHING ENGINE (matcher.py)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  1) KB override (scope-aware)                                                |
|  2) Cache                                                                    │
│  3) Deterministic dictionary match                                           │
│  4) Fuzzy fallback (threshold + gap)                                         │
│  5) Ambiguous → llm_context                                                  │
│                                                                              │
│                                                                              │
│  OUTPUT: matching_report_v0.1.json                                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                │  (file: matching_report_v0.1.json)
                                                ▼
        ┌──────────────────┐   <---->    ┌──────────────────────────┐   <---->    ┌──────────────┐
        │    MCP SERVER    │             │     ORCHESTRATOR         │             │     LLM      │
        │  (server_mcp.py) │             │     (run_local.py)       │             │  Proposer    │
        └──────────────────┘             │                          │             └──────────────┘
               ▲     ▲                   │  • load + validate MR    │                     ▲
               │     │                   │  • build deterministic   │                     │
               │     │                   │    PatchActions          │                     │
               │     │                   │  • optional LLM propose  │                     │
               │     │                   │  • filter confidence/gap │                     │
               │     │                   │  • commit decision       │                     │
               │     │                   │                          │                     │
               │     │                   └──────────────┬───────────┘                     │
               │     │                                  │                                 │
               │     │                                  │                                 │
               │     └──────────────────────────────────┼─────────────────────────────────┘
               │                                        │
               │                                        ▼
               │                              ┌──────────────────────────┐
               │                              │        VALIDATOR         │
               │                              │      (validator.py)      │
               │                              ├──────────────────────────┤
               │                              │ • schema-first           │
               │                              │ • canonical validation   │
               │                              │ • dry-run + diff         │
               │                              │ • enforce governance     │
               │                              └──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   OUTPUTS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Artefatto versionato (_v0.1 → _v0.2)                                      │
│  • run_report.json:                                                          │
│      - schema_versions                                                       │
│      - metrics (matched/ambiguous/unmapped, llm_calls, warnings)             │
│      - diff_summary                                                          │
│      - policy_outcome (approved / needs_review / no_change / rejected)       │
│      - matched_variables, actions, absent_concepts, ecc.                     │
└──────────────────────────────────────────────────────────────────────────────┘



## Note
- L’LLM non applica patch: è solo proposer.
- Tutte le scritture passano dal MCP Server (schema‑first + dry‑run).
