from src.validator.validator import canonical_map
from mcp_server.core import MCPContext
import json
from src.parser.normalizer import load_json

def load_matching(matching_path: str | None) -> tuple[dict | None, dict]:
    # carica e valida matching report + genera analysis

    mr = None 
    analysis = {}
    if matching_path:
        mr = load_json(matching_path)
        ctx = MCPContext(repo_root=".")
        ctx.schema_validate("matching_report", mr)
        analysis = extract_analysis_from_matching_report(mr)
    return mr, analysis

def extract_analysis_from_matching_report(mr: dict) -> dict:
    # aggiunge nel report tutte le variabili che si riferiscono ad un concetto non ancora mappato o ambiguo
 
    ambiguous = []
    unmapped = []

    for item in  mr.get("items", []):
        status = item.get("status")
        source_key = item.get("source_key")
        section = item.get("section")
        confidence = item.get("confidence")
        candidates = item.get("candidates", [])
        evidence = item.get("evidence", {})
        suggested_action = item.get("suggested_action")

        # -------AMBIGUI-----------
        if status == "ambiguous":
            ambiguous.append({
                "section": section,
                "source_key": source_key, 
                "candidates": candidates,
                "confidence": confidence,
                "evidence": evidence,
            })
        
        # ---------UNMAPPED-------------
        if status == "unmapped":
            unmapped.append({
                "section": section,
                "source_key": source_key,
                "evidence": evidence,
                "suggested_action": suggested_action
            })
    
    return {
        "matching_version": mr.get("matching_version"),
        "ambiguous_matches": ambiguous,
        "unmapped_terms": unmapped,
    }

def extract_matched_variables_from_matching_report(mr: dict) -> list[dict]:
    # estrae variabili matched

    out = []
    for item in mr.get("items", []):
        if item.get("status") == "matched":
            out.append({
                "section": item.get("section"),
                "source_key": item.get("source_key"),
                "concept_id": item.get("concept_id"),
                "semantic_category": item.get("evidence", {}).get("semantic_category"),
                "confidence": item.get("confidence"),
                "normalized_text": item.get("evidence", {}).get("normalized_text"),
                "reason": item.get("technical_reason"),
            })
    return out

def build_absent_concepts(template_base_path: str, mr: dict | None, actions_payload: dict | None) -> list[dict]:
    # ritorna tutti i concetti che sono nel template base ma che non ci sono nelle patch e/o nel matching

    canon = canonical_map(template_base_path)
    present = extract_present_concepts(mr, actions_payload)

    absent = []
    for concept_id, info in canon.items():
        if concept_id not in present:
            absent.append({
                "concept_id": concept_id,
                "category": info.get("category"),
                "semantic_category": info.get("semantic_category"),
                "reason": "Nessuna read presente con descrizione compatibile",
            })
    return absent

def extract_present_concepts(mr: dict | None, actions_payload: dict | None) -> set[str]:
    # estrae i concetti che sono presenti

    present = set()
    # dal match 
    if mr:
        for item in mr.get("items", []):
            if item.get("status") == "matched" and item.get("concept_id"):
                present.add(item.get("concept_id"))
    # dalle actions
    if actions_payload:
        for a in actions_payload.get("actions", []):
            target = a.get("target", {})
            if target.get("concept_id"):
                present.add(target.get("concept_id"))
    return present

def get_template_guid(input_path: str, mr: dict | None, artifact_type) -> str:
    # trova template guid

    # 1) da template reale
    try:
        with open(input_path, "r", encoding="utf-8") as f:
            tpl = json.load(f)

        if "TemplateGuid" in tpl:
            return tpl["TemplateGuid"]
        if "TemplateGUID" in tpl:
            return tpl["TemplateGUID"]
        
        # formato nuovo
        ti = tpl.get("TemplateInfo")
        tiv = ti.get("Values")
        if isinstance(tiv, dict):
            if tiv.get("TemplateName"):
                return tiv["TemplateName"]
            if tiv.get("Name"):
                return tiv["Name"]
        
    except Exception:
        pass

    # 2) da matching_report
    if mr and mr.get("template_guid"):
        return mr["template_guid"]
    
    if artifact_type == "device_list":
        return None
       
    raise ValueError("template_guid_missing")
