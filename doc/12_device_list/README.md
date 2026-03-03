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

# Enum
- 0 : CELLA_TN
- 1 : CELLA_BT
- 2 : BANCO_TN
- 3 : BANCO_BT	
- 4 : CENTRALE
- 5 : VASCA_TN
- 6 : VASCA_BT
- 7 : SONDA UMIDITA E TEMPERATURA AMBIENTE
- 8 : RILEVATORE CO2 GAS REFRIGERANTE
- 99 : ALTRO

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

---

## Warnings
- `device_list_enrich` restituisce warning anche in `dry_run`.
- Le API backend ritornano i warning del report (per UI).
