# 4. Knowledge Base

## Scopo
La **Knowledge Base (KB)** fornisce **contesto operativo e memoria storica** al sistema.
Serve a ridurre ambiguità e aumentare determinismo nel tempo.

---

## Input
- Device list del supervisore
- Regole esplicite del punto vendita

---

## Output
**File:** `kb.json` (versionato)

---

## Ruolo della KB
- Fornisce **scope** compatibili con device e template
- Gestisce **priorità** e **override** di mapping
- Include **blacklist** per evitare falsi positivi

---

## Regole
- Aggiornamenti versionati
- Patch controllate (`add_kb_rule`, `update_kb_rule`)
