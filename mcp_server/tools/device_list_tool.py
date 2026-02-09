from typing import Any, Dict
from ..core import MCPContext
import json 
from pathlib import Path 
from .dictionary_tool import _next_versioned_path
import re

def derive_device_role(desc: str):
    # assegna ruolo device_role_generated
    
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
    # assegna famiglia TN / BT / null a type_fam_generated

    if not desc:
        return None
    d = desc.upper()

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

    return "other"

def derive_enum(desc: str, type_fam: str):
    # manca da definire la regola enum

    return None

def device_list_enrich(ctx: MCPContext, path: str, dry_run: bool) -> Dict[str, Any]:
    # validazione path e arricchimento device list

    p = ctx.ensure_within_root(path)
    device_list = ctx.read_json(p)
    ctx.schema_validate("device_list", device_list)

    enriched = []
    for item in device_list:
        desc = item.get("Description") or ""
        type_fam = derive_type_fam(desc)
        device_role = derive_device_role(desc)
        enum = derive_enum(desc, type_fam)

        out = dict(item)
        out["type_fam_generated"] = type_fam
        out["enum_generated"] = enum 
        out["device_role_generated"] = device_role
        enriched.append(out)
    
    ctx.schema_validate("device_list_context", enriched)

    if p.name.endswith("device_list.json"):
        out_path = p.with_name("device_list_context_v0.1.json")
    else:
        out_path = _next_versioned_path(p)

    if dry_run:
        ctx.mark_dry_run(enriched)
        return {"status": "dry_run_ok", "preview": enriched, "output_path": str(out_path)}

    ctx.require_dry_run(enriched)
    ctx.write_json(out_path, enriched)
    return {"status": "committed", "output_path": str(out_path)}