from scripts.summarize_diff.diff import compute_diff
from src.validator.validator import validate_before_commit_template, validate_before_commit_generic
from mcp_server.core import MCPContext
from src.parser.normalizer import load_json

def build_patch_and_validation(cfg: dict, artifact_type: str, upsert_fn, diff_fn, actions_payload_override: dict | None = None):
    # costruisce la patch. Decide se template_validation o generic_validation. Produce --> patch, preview, diff, validation_block

    input_path = cfg["input_path"]
    patch_path = cfg.get("patch_path")  # patch manuali
    actions_path = cfg.get("actions_path")  # patch per template reale
    template_base_path = cfg.get("template_base_path") # template base

    if actions_payload_override is not None:
        actions_payload = actions_payload_override
    elif artifact_type == "template" and actions_path:
        actions_payload = load_json(actions_path)
    else:
        actions_payload = None

    file_patch = None
    if patch_path:
        file_patch = load_json(patch_path)
    
    template_patch = None 
    validated_preview = None
    validated_diff = None
    validation_block = None

    # template actions
    if artifact_type == "template" and actions_payload is not None:
        if not template_base_path:
            raise ValueError("template_base_missing")
        
        ctx = MCPContext(repo_root=".")
        v = validate_before_commit_template(
            ctx=ctx, 
            actions_payload=actions_payload, 
            template_base_path=template_base_path, 
            input_path=input_path, 
            upsert_fn=upsert_fn, 
            diff_fn=diff_fn
        )

        if not v["ok"]:
            return None, None, None, None, actions_payload, v
        
        template_patch = v["patch"]
        validated_preview = v.get("preview")
        validated_diff = v.get("diff")
        validation_block = {
            "status": "ok",
            "errors": v.get("errors", []),
            "warnings": v.get("warnings", []),
            "stage": v.get("stage"),
        }

    GENERIC_VALIDATORS = {
        "dictionary": "dictionary_patch",
        "kb": "kb_patch",
        "template_base": "template_base_patch",
    }
    # generic
    if artifact_type in GENERIC_VALIDATORS:
        ctx = MCPContext(repo_root=".")
        v = validate_before_commit_generic(
            ctx=ctx,
            schema_id=GENERIC_VALIDATORS[artifact_type],
            patch_payload=file_patch,
            input_path=input_path,
            upsert_fn=upsert_fn,
            diff_fn=diff_fn,
            artifact_type=artifact_type,
            template_base_path=template_base_path,
        )
        if not v["ok"]:
            raise ValueError("; ".join(v.get("errors", [])))

        template_patch = v["patch"]
        validated_preview = v.get("preview")
        validated_diff = v.get("diff")
        validation_block = {
            "status": "ok" if v["ok"] else "error",
            "errors": v.get("errors", []),
            "warnings": v.get("warnings", []),
            "stage": v.get("stage"),
        }

    if template_patch is None and file_patch:
        template_patch = file_patch

    if template_patch is None:
        raise ValueError("template_patch_missing: provide actions_path or patch_path")

    return template_patch, validation_block, validated_preview, validated_diff, actions_payload, None

def apply_commit(input_path, template_patch, diff, validate_only, upsert_fn):
    # fa il commit nel caso che validate_only e no_change = False

    no_change = (len(diff) == 0)
    committed = False 
    status = "validated_only" if validate_only else ("no_change" if no_change else "success")

    if not validate_only and not no_change:
        commit_result = upsert_fn(path=input_path, patch=template_patch, dry_run=False)
        output_path = commit_result.get("output_path")
        committed = True
    else:
        output_path = input_path
    
    return output_path, committed, status, no_change
