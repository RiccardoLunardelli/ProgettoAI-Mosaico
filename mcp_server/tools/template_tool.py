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
        pass

    ctx.write_json(p, template)
    return {"status": "ok", "path": str(p)}

def template_apply_patch(ctx: MCPContext, path: str, patch: Dict[str, Any], dry_run: bool) -> Dict[str, Any]:
    # Protegge l’accesso al filesystem, Legge un template JSON, Prevede un meccanismo di preview e diff

    template = template_load(ctx, path)

    #------template base--------
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
                    "semantic_category": op["semantic_category"],
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
                
                if op.get("semantic_category") is not None:
                    concept["semantic_category"] = op["semantic_category"]

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

    #-------template reale----------
    if patch.get("target") == "template":
        ctx.schema_validate("template_patch", patch)

        new_template = copy.deepcopy(template)

        for op in patch.get("operations", []):
            section = op["section"]
            source_key = op["source_key"]
            fields = op.get("fields")

            section_values = new_template.get(section, {}).get("Values")
            if section_values is None:
                raise ValueError(f"Section not found or missing Value: {section}")
            
            if source_key not in section_values:
                raise ValueError(f"Source key not found: {source_key} in {section}")
            
            # set fields
            for k, v in fields.items():
                section_values[source_key][k] = v

        if dry_run:
            ctx.mark_dry_run(patch)
            return {"status": "dry_run_ok", "preview": new_template}

        ctx.require_dry_run(patch)

        output_path = _next_versioned_path(Path(path))
        template_save(ctx, str(output_path), new_template)
        return {"status": "committed", "output_path": str(output_path)}
    
    raise ValueError("unsupported_patch_target")

