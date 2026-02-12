# 16. Framework & Librerie

Elenco delle librerie utilizzate nel progetto (con versione).

---

## Core

![Python](https://img.shields.io/badge/python-3.12+-blue?logo=python)

- **Python** `>= 3.12`

Il progetto è sviluppato e testato su Python 3.12.s

## Validazione & Schema
- `pydantic`: `2.12.5` --> Definizione modelli fortemente tipizzati e generazione JSON Schema
- `jsonschema` --> Validazione runtime degli artefatti e delle patch

## Matching & Fuzzy
- `rapidfuzz`: `3.14.3` --> Fallback Fuzzy

## MPC Server
- `FastMCP`--> Esposizione tool MCP e boundary di sicurezza

## Chiamata ad Ollama
- `requests`: `2.32.5` --> Chiamata HTTP verso runtime Ollama

### Endpoint utilizzato
http://127.0.0.1:11434/api/generate

## Parsing configurazioni YAML
- `pyyaml`: `6.0.3`

---

## Note
Le versioni devono riflettere l’ambiente reale (`uv`/`pyproject`).
