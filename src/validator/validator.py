import json 
from typing import Any, Dict 

from mcp_server.core import MCPContext

def load_template_base(path: str) -> dict:
    # caricamento template base

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
    
def validate_actions_against_template_base(actions_payload: dict, template_base_path: str) -> list[str]:
    # valida category + semantic_category contro il template base

    tb = load_template_base(template_base_path)
    canon = {}  # contiene tutti i concetti con categoria e categoria semantica del template base
    for cat in tb.get("categories", []):
        cat_id = cat.get("id")
        for c in cat.get("concepts", []):
            canon[c.get("concept_id")] = {
                "category": cat_id,
                "semantic_category": c.get("semantic_category"),
            }
    
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
            set_fields["ConceptId"] = target["concept_id"]
        if target.get("category"):
            set_fields["Category"] = target["category"]
        if target.get("semantic_category"):
            set_fields["SemanticCategory"] = target["semantic_category"]

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
    # VALIDATOR --> valida schema, coerenza, esegue dry run

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