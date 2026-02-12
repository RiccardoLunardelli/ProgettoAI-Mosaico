# 15. Architettura

## Scopo

Rappresentazione del flusso completo del sistema ad alto livello attraverso uno schema grafico

## Schema ad alto livello
```mermaid
flowchart LR
  classDef core fill:#f6f8fa,stroke:#333,stroke-width:1px;
  classDef flow fill:#e8f1ff,stroke:#1f4e79,stroke-width:1px;
  classDef gate fill:#fff4e6,stroke:#a35a00,stroke-width:1px;
  classDef llm fill:#f0fff4,stroke:#2f855a,stroke-width:1px;
  classDef out fill:#fefcbf,stroke:#975a16,stroke-width:1px;

  subgraph INPUTS
    A["Template Reale (PLC JSON)<br/>Device List<br/>Template Base (canonico)<br/>Dizionario (versionato)<br/>Knowledge Base (versionata)<br/>config.yml + device_list_rules.yml"]
  end

  subgraph PIPELINE
    B["NORMALIZATION LAYER<br/>parser/normalizer.py -> NormalizedTemplate"]
    C["MATCHING ENGINE<br/>matcher.py<br/>KB override • Cache • Deterministic • Fuzzy • Ambiguous→llm_context<br/>OUTPUT: matching_report_v0.1.json"]
    E["ORCHESTRATOR<br/>run_local.py<br/>load+validate MR • build PatchActions • filter confidence/gap • commit decision"]
  end

  subgraph SERVICES
    D["MCP SERVER<br/>schema • patch • guardrail"]
    G["VALIDATOR<br/>schema-first • canonical validation • dry-run + diff"]
    F["LLM PROPOSER<br/>llama3.1:8b"]
  end

  subgraph OUTPUTS
    H["Versioned Outputs<br/>template/dict/kb/etc."]
    I["run_report.json<br/>schema_versions • metrics • diff_summary • policy_outcome"]
  end

  A --> B --> C --> E
  E <--> D
  E <--> F
  E --> G
  G --> H
  G --> I

  class A core
  class B,C,E flow
  class D,G gate
  class F llm
  class H,I out
 ```

## Note
- L’LLM non applica patch: è solo proposer.
- Tutte le scritture passano dal MCP Server (schema‑first + dry‑run).
