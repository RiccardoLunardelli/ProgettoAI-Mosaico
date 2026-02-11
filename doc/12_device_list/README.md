# 12. Device List Enrichment

## Scopo
Arricchire la `device_list` del supervisore con campi derivati:
- `device_role_generated`
- `type_fam_generated`
- `enum_generated`

---

## Input
- `device_list.json`

---

## Output
- `device_list_context_v0.x.json` (versionato)

---

## Regole esterne
Le regole non sono nel codice ma in:
- `config/device_list_rules.yml`

Contiene:
- `roles` (keyword → ruolo)
- `type_fam` (keyword → TN / BT / TN/BT)
- `enum_map` (role + type_fam → enum)
- `enum` (label ufficiali)

---

## Logica di derivazione
1. **Ruolo**
   - `cella/vasca` solo se esplicite in descrizione
   - se non esplicito ma c’è TN/BT → ruolo `banco`
2. **Famiglia**
   - TN / BT / TN-BT / other
3. **Enum**
   - da `enum_map`
   - fallback `99` se non mappabile
4. **Controlli**
   - warning se `TemplateGUID` mancante
   - segnalazione manuale per `centrale`

---

## Script coinvolto
**File:** `mcp_server/tools/device_list_tool.py`

Dati tecnici del codice: `/doc/07_mcp_server/DeviceList`
