# 14. Governance & Versioning

## Scopo
Definire come vengono gestiti e promossi i cambiamenti su:
- Dizionario
- Knowledge Base
- Template Base

---

## Principi
- Versioning esplicito
- Audit completo per ogni modifica
- Nessuna modifica in‑place
- Aggiornamenti solo tramite patch validate
- Aggiornamento del campo `*_version` nel JSON al momento del salvataggio

---

## Flusso suggerito
1. Una run genera `unmapped_terms` o `ambiguous_matches`
2. Si propone una patch (dizionario/KB/template_base)
3. Si valida lo schema e la coerenza canonica
4. Dry‑run + diff
5. Commit in nuova versione
6. Log nel `run_report.json`

---

## Obiettivo
Mantenere coerenza semantica nel tempo ed evitare drift del dizionario.
