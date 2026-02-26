# Semantic AI Mapper

Sistema locale per **normalizzare, interpretare e arricchire** template reali di supervisori di refrigerazione,
trasformando variabili rumorose in concetti canonici **auditabili** e **versionati**.

---

## Perché esiste
Nei PLC reali gli stessi concetti (es. temperatura mandata) sono scritti in decine di modi diversi.
Questo progetto crea un livello semantico stabile, basato su:
- Template Base canonico
- Dizionario sinonimi/abbreviazioni
- Knowledge Base contestuale

---

## Principi non negoziabili
- **Schema‑first**
- **Deterministic‑first**
- **Patch‑based**
- **Audit‑first**
- **Dry‑run obbligatorio**
- **LLM propose‑only**

---

## Architettura (in breve)
- `orchestrator.py`: orchestratore del flusso
- `mcp_server`: gatekeeper per validazioni, patch, I/O sicuro
- `matcher.py`: matching deterministico + fuzzy
- LLM: solo fallback per ambiguità (mai commit automatico)

---

## Pipeline operativa (high‑level)
1. Normalizzazione
2. Matching deterministico + fuzzy
3. PatchActions
4. Validazione
5. Dry‑run + diff
6. Commit versionato (se approvato)
7. Run report auditabile

---

## Documentazione completa
Vedi `doc/indice.md` per l’indice dettagliato.