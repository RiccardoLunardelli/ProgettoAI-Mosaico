from typing import Any, Dict
from ..core import MCPContext
import json 
from pathlib import Path 
from .dictionary_tool import _next_versioned_path
import re
import yaml

RULES_PATH = "config/device_list_rules.yml"

def load_rules(path: str) -> dict:
    # apre file yml

    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def _match_any(desc_upper: str, keywords: list[str]) -> bool:
    # ritorna True se la keywords che gli viene passata è contenuta nella descrizione

    return any(k in desc_upper for k in keywords or [])

def derive_device_role(desc: str, rules: dict):
    # assegna ruolo device_role_generated
    
    if not desc:
        return None
    d = desc.upper()

    roles = rules.get("roles", {})
    if _match_any(d, roles.get("no_matching_terms", [])):
        return "other"
    if _match_any(d, roles.get("centrale", [])):
        return "centrale"
    if _match_any(d, roles.get("cella", [])):
        return "cella"
    if _match_any(d, roles.get("vasca", [])):
        return "vasca"
    if _match_any(d, roles.get("banco", [])):
        return "banco"
    if _match_any(d, roles.get("sonda_umidita_temperatura", [])):
        return "sonda umidita e temperatura ambiente"
    if _match_any(d, roles.get("rilevatore_co2", [])):
        return "rilevatore co2 gas refrigerante"
    
    tf = derive_type_fam(desc, rules)
    if tf in {"TN", "BT"}:
        return "banco"

    return "other"

def derive_type_fam(desc: str, rules: dict):
    # assegna famiglia TN / BT / null a type_fam_generated

    if not desc:
        return None
    d = desc.upper()

    tf = rules.get("type_fam", {})
    if _match_any(d, tf.get("TN/BT", [])):
        return "TN/BT"
    if _match_any(d, tf.get("BT/TN", [])):
        return "TN/BT"
    if _match_any(d, tf.get("TN", [])):
        return "TN"
    if _match_any(d, tf.get("BT", [])):
        return "BT"

    return "other"

def derive_enum(role: str, type_fam: str, rules: dict, desc: str = ""):
    # manca da definire la regola enum

    d = (desc or "").upper()

    roles = rules.get("roles", {})
    if _match_any(d, roles.get("sonda_umidita_temperatura", [])):
        return "7"
    if _match_any(d, roles.get("rilevatore_co2", [])):
        return "8"

    enum_map = rules.get("enum_map", {})
    if not role:
        return "99"

    role_map = enum_map.get(role, {})
    if "any" in role_map:
        return role_map["any"]

    return role_map.get(type_fam, "99")

def device_list_enrich(ctx: MCPContext, path: str, dry_run: bool) -> Dict[str, Any]:
    # validazione path e arricchimento device list

    p = ctx.ensure_within_root(path)
    device_list = ctx.read_json(p)
    ctx.schema_validate("device_list", device_list)

    rules = load_rules(RULES_PATH)
    centrale = set()
    template_guid = False

    enriched = []
    for item in device_list:
        desc = item.get("Description") or ""
        device_role = derive_device_role(desc, rules)
        # controllo per dispositivo 'centrale'
        if device_role == "centrale":
            centrale.add(desc)
        # controllo templateGuid
        if not item.get("TemplateGUID"):
            template_guid = True
        # controllo per dispositivo 'other
        if device_role != "other":
            type_fam = derive_type_fam(desc, rules)
        else:
            type_fam = "other"
        enum = derive_enum(device_role, type_fam, rules, desc)

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

    warnings = []

    if dry_run:
        ctx.mark_dry_run(enriched)
        if centrale:
            for desc in centrale:
                warning = f"Richiesta revisione umana per dispositivo 'centrale': {desc}"
                warnings.append(warning)
                print(warning)

        if template_guid:
            print("WARNING: TemplateGUID mancante!")
        return {"status": "dry_run_ok", "preview": enriched, "output_path": str(out_path),"warning": warnings if warnings else None}

    ctx.require_dry_run(enriched)
    ctx.write_json(out_path, enriched)
    return {
        "status": "dry_run_ok",
        "preview": enriched,
        "output_path": str(out_path),
        "warning": warnings if warnings else None
    }