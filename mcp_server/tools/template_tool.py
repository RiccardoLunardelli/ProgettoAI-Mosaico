from typing import Any, Dict
from ..core import MCPContext
import copy
from .dictionary_tool import _next_versioned_path
from pathlib import Path

def template_load(ctx: MCPContext, path: str) -> Dict:
    # caricamento e lettura template

    p = ctx.ensure_within_root(path)
    return ctx.read_json(p)

def template_save(ctx: MCPContext, path: str, template: Dict[str, Any]) -> Dict[str, Any]:
    # salvataggio template

    p = ctx.ensure_within_root(path)

    if "template_base" in p.name:
        ctx.schema_validate("template_base", template)
    else:
        ctx.require_validated(template)

    ctx.write_json(p, template)
    return {"status": "ok", "path": str(p)}

def template_apply_patch(ctx: MCPContext, path: str, patch: Dict[str, Any], dry_run: bool) -> Dict[str, Any]:
    # Protegge l’accesso al filesystem, Legge un template JSON, Prevede un meccanismo di preview e diff

    template = template_load(ctx, path)

    if patch.get("target") == "template_base":
        ctx.schema_validate("template_base", template)
        ctx.schema_validate("template_base_patch", patch)

        new_base = copy.deepcopy(template)
        categories = new_base.setdefault("categories", [])

        def find_concept(concept_id: str):
            # cerca un concetto nel template

            for cat in categories:
                for concept in cat.get("concepts", []):
                    if concept.get("concept_id") == concept_id:
                        return cat, concept
            return None, None
        
        for op in patch.get("operations", []):
            #---------ADD BASE CONCEPT--------------
            if op["op"] == "add_base_concept":
                category_id = op["category_id"]
                concept_id = op["concept_id"]

                _, existing = find_concept(concept_id) # _ = cat / None ; existing = concept / None
                if existing:
                    raise ValueError(f"Concept {concept_id} already exists")
                
                target_cat = None 
                for cat in categories:
                    if cat.get("id") == category_id:
                        target_cat = cat 
                        break
                if target_cat is None:
                    raise ValueError(f"Category {category_id} not found")
                
                target_cat.setdefault("concepts", []).append({
                    "concept_id": concept_id,
                    "category": category_id,
                    "label": op["label"],
                    "description": op["description"],
                })
            #------------REMOVE BASE CONCEPT--------------
            elif op["op"] == "remove_base_concept":
                concept_id = op["concept_id"]
                cat, concept = find_concept(concept_id)
                if not concept:
                    raise ValueError(f" Concept {concept_id} not found")
                cat["concepts"] = [c for c in cat.get("concepts", []) if c.get("concept_id") != concept_id]

            #--------------UPDATE BASE METADATA---------------
            elif op["op"] == "update_base_metadata":
                concept_id = op["concept_id"]
                cat, concept = find_concept(concept_id)
                if not concept:
                    raise ValueError(f" Concept {concept_id} not found")
                
                if op.get("label") is not None:
                    concept["label"] = op["label"]
                if op.get("description") is not None:
                    concept["description"] = op["description"]

                if op.get("category") is not None and op["category"] != cat.get("id"):
                    target_cat = None
                    for c in categories:
                        if c.get("id") == op["category"]:
                            target_cat = c
                            break 
                    if target_cat is None:
                        raise ValueError(f"Category {op['category']} not found")

                    cat["concepts"] = [c for c in cat.get("concepts", []) if c.get("concept_id") != concept_id]
                    concept["category"] = op["category"]
                    target_cat.setdefault("concepts", []).append(concept)
            
            else:
                raise ValueError(f"Unsupported operation: {op['op']}")
            
        if dry_run:
            ctx.mark_dry_run(patch)
            return {"status": "dry_run_ok", "preview": new_base}

        ctx.require_dry_run(patch)
        ctx.schema_validate("template_base", new_base)

        output_path = _next_versioned_path(Path(path))
        template_save(ctx,str(output_path), new_base)
        return {"status": "committed", "output_path": str(output_path)}

    raise ValueError("unsupported_patch_target")

