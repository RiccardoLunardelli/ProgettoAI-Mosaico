import json 
from typing import Any, Dict 
from src.parser.normalizer import load_json

from mcp_server.core import MCPContext

# -----VALIDATOR PER KB | TAMPLATE BASE | DICTIONARY---------------
def validate_before_commit_generic(ctx: MCPContext, schema_id: str, patch_payload: dict, input_path: str, upsert_fn, diff_fn, artifact_type: str, template_base_path: str | None) -> dict:
    # valida lo schema, controlli su dizionario(concetti) e template base(categoria semantica) e genera diff

    ctx.schema_validate(schema_id, patch_payload)

    with open(input_path, "r", encoding="utf-8") as f:
        artifact = json.load(f)

    if template_base_path:
        if artifact_type == "dictionary":
            # valida entry del dizionario contro template base
            errors = validate_dictionary_canonical(artifact, template_base_path)
        
        if artifact_type == "template_base":
            # auto-coerenza
            errors = validate_template_base_semantic(artifact)

        if errors:
            return {"ok": False, "stage": "canonical_validation", "errors": errors, "warnings": []}

    dry_run_result = upsert_fn(path=input_path, patch=patch_payload, dry_run=True)
    preview = dry_run_result.get("preview")
    diff = diff_fn(artifact, preview)

    warnings = []
    if len(diff) == 0:
        warnings.append("no_change_after_dry_run")

    return {"ok": True, "stage": "validated", "errors": [], "warnings": warnings, "patch": patch_payload, "diff": diff, "preview": preview}

#-------TEMPLATE---------
def canonical_map(template_base_path: str) -> dict:
    # ritorna cateogia e categoria semantica di ogni concetto del template base

    tb = load_json(template_base_path)
    out = {}
    for cat in tb.get("categories", []):
        cat_id = cat.get("id")
        for c in cat.get("concepts", []):
            out[c.get("concept_id")] = {
                "category": cat_id,
                "semantic_category": c.get("semantic_category"),
            }
    return out

def validate_actions_against_template_base(actions_payload: dict, template_base_path: str) -> list[str]:
    # valida category + semantic_category contro il template base

    canon = canonical_map(template_base_path)
    
    errors = [] # contiene tutti i concetti, cateogira, categorie semantiche che non sono nel template base
    for a in actions_payload.get("actions", []):
        tgt = a.get("target", {})
        cid = tgt.get("concept_id")
        cat = tgt.get("category")
        sem = tgt.get("semantic_category")

        info = canon.get(cid)
        if not info:
            errors.append(f"unknown_concept_id: {cid}")
            continue

        if cat != info.get("category"):
            errors.append(f"category_mismatch: {cid} action={cat} canon={info.get('category')}")
        if sem != info.get("semantic_category"):
            errors.append(f"semantic_category_mismatch: {cid} action={sem} canon={info.get('semantic_category')}")

    return errors

def actions_to_template_patch(actions_payload: dict) -> dict:
    # estrae actions da patch_actions e la trasforma nel formato giusto

    ops = []
    for a in actions_payload.get("actions", []):
        set_fields = dict(a["patch"]["set_fields"])
        target = a.get("target", {})

        if target.get("concept_id"):
            set_fields["ConceptId_Patch"] = target["concept_id"]
        if target.get("category"):
            set_fields["Category_Patch"] = target["category"]
        if target.get("semantic_category"):
            set_fields["SemanticCategory_Patch"] = target["semantic_category"]
            
        ops.append({
            "op": "set_fields",
            "section": a["section"],
            "source_key": a["source_key"],
            "fields": set_fields,
            "meta": {
                "confidence": a.get("confidence"),
                "reason": a.get("reason"),
                "evidence": a.get("evidence"),
            }
        })
    return {"target": "template", "operations": ops}

def validate_before_commit_template(ctx: MCPContext, actions_payload: dict, template_base_path: str, input_path: str, upsert_fn, diff_fn) -> dict:
    # VALIDATOR PER TEMPALTE --> valida schema, coerenza, esegue dry run

    # schema-first
    ctx.schema_validate("patch_actions_template", actions_payload)

    # coerenza con template base
    errors = validate_actions_against_template_base(actions_payload, template_base_path)
    if errors:
        return {"ok": False, "stage": "canonical_validation", "errors": errors, "warnings": []}
    
    # conversione patch
    template_patch = actions_to_template_patch(actions_payload)

    with open(input_path, "r", encoding="utf-8") as f:
        artifact = json.load(f)

    # dry-run
    dry_run_result = upsert_fn(path=input_path, patch=template_patch, dry_run=True)
    preview = dry_run_result.get("preview")
    diff = diff_fn(artifact, preview)

    warnings = []
    if len(diff) == 0:
        warnings.append("no_change_after_dry_run")

    return {"ok": True, "stage": "validated", "errors": [], "warnings": warnings, "patch": template_patch, "diff": diff, "preview": preview}

#-----VALIDAZIONE CANONICA DIZIONARIO----------
def validate_dictionary_canonical(dictionary_payload: dict, template_base_path: str) -> list[str]:
    # valida concetti/cateforie del dizionario con quelle del template base per avere coerenza

    canon = canonical_map(template_base_path)
    errors = []
    for e in dictionary_payload.get("entries", []):
        cid = e.get("concept_id")
        if cid not in canon:
            errors.append(f"dictionary_unknown_concept_id: {cid}")
            continue 
        if e.get("category") != canon[cid]["category"]:
            errors.append(f"dictionary_category_mismatch: {cid}")
        if e.get("semantic_category") != canon[cid]["semantic_category"]:
            errors.append(f"dictionary_semantic_category_mismatch: {cid}")
    return errors

#------VALIDAZIONE TEMPLATE BASE--------------
def validate_template_base_semantic(tb: dict) -> list[str]:
    # auto-coerenza--> ogni concetto deve avere categoria semantica

    errors = []
    for cat in tb.get("categories", []):
        for c in cat.get("concepts", []):
            if not c.get("semantic_category"):
                errors.append(f"missing_semantic_category: {c.get('concept_id')}")
    return errors
