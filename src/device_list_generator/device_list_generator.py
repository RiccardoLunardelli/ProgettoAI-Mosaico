import json
import re
from pathlib import Path

# percorso file device_list
ROOT = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs/262174_VIGODA_ALI/")

def derive_device_role(desc: str):
    # assegna ruolo device_role_AI
    
    if not desc:
        return None
    d = desc.upper()

    if "CENTRALE" in d or "BOOSTER" in d:
        return "central_unit"
    if "CELLA" in d:
        return "cold_room"
    if "VASCA" in d:
        return "basin"
    if "ISOLA" in d:
        return "island"
    if "BANCO" in d or "RETROBANCO" in d:
        return "counter"
    if "MURALE" in d or "VETRINA" in d:
        return "display_case"
    return None

def derive_type_fam(desc: str):
    # assegna famiglia TN / BT / null a type_fam_AI

    if not desc:
        return None
    d = desc.upper()

    if "INVERTER" in d:
        return "other"

    # TN/BT esplicito in qualunque ordine
    if "TN/BT" in d or "BT/TN" in d:
        return "TN/BT"

    # cattura TN o BT ovunque, anche in 02TNS2 / 29BTM / BT43
    has_tn = bool(re.search(r"TN", d))
    has_bt = bool(re.search(r"BT", d))

    if has_tn and has_bt:
        return "TN/BT"
    if has_tn:
        return "TN"
    if has_bt:
        return "BT"

    if any(k in d for k in ["MURALE","CELLA","ANTICELLA","BANCO","VASCA","RETROBANCO"]):
        return "TN"

    return None

def derive_enum(desc: str, type_fam: str):
    # manca da definire la regola enum

    return None

for path in ROOT.rglob("device_list.json"):
    data = json.loads(path.read_text(encoding="utf-8"))
    out = []

    for item in data:
        desc = item.get("Description") or ""
        type_fam = derive_type_fam(desc)
        device_role = derive_device_role(desc)
        enum = derive_enum(desc, type_fam)

        enriched = dict(item)
        enriched["type_fam_generated"] = type_fam
        enriched["enum_generated"] = enum
        enriched["device_role_generated"] = device_role
        out.append(enriched)

    out_path = path.with_name("device_list_context.json")
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
