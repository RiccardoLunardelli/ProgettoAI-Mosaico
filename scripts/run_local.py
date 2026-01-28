from mcp_server.server import dictionary_upsert, kb_upsert_mapping, template_apply_patch
from mcp_server.core import MCPContext
from src.validator.validator import validate_before_commit_template, validate_before_commit_generic, canonical_map, load_json

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
import re

TIMEZONE = timezone(timedelta(hours=1))
PATCH_ROOT = Path("mcp_server/patch")
RUNS_ROOT = Path("runs")

ARTIFACTS = {
    "dictionary": {
        "input_path": "data/dictionary_v0.1.json",
        "patch_path": str(PATCH_ROOT / "dictionary" / "manual_patch_upsemcat.json"),
        "matching_path": "output_dir/matching_report_v0.1.json",
        "input_version": "v0.1",
        "template_base_path": "data/template_base_v0.1.json",
    },
    "kb": {
        "input_path": "data/kb_v0.1.json",
        "patch_path": str(PATCH_ROOT / "kb" / "patch_manual_addkbrule.json"),
        "input_version": "v0.1",
        "matching_path": "output_dir/matching_report_v0.1.json",
    },
    "template_base": {
        "input_path": "data/template_base_v0.1.json",
        "patch_path": str(PATCH_ROOT / "template" / "manual_patch_addbaseconc.json"),
        "input_version": "v0.1",
        "template_base_path": "data/template_base_v0.1.json",
        "matching_path": "output_dir/matching_report_v0.1.json",
    },
    "template": {
        "input_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates/028d14de-71dc-6e64-9587-c7111a39793e.json",
        "matching_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/matching_report_v0.1.json",
        "actions_path": "mcp_server/patch/template_real/manual_actions.json",
        "template_base_path": "data/template_base_v0.1.json",
        "validate_only": True, # true --> test; false --> scrive
    }
}


def get_template_guid(input_path: str, mr: dict | None) -> str:
    # 1) da template reale
    try:
        with open(input_path, "r", encoding="utf-8") as f:
            tpl = json.load(f)
        if "TemplateGuid" in tpl:
            return tpl["TemplateGuid"]
        if "TemplateGUID" in tpl:
            return tpl["TemplateGUID"]
    except Exception:
        pass

    # 2) da matching_report
    if mr and mr.get("template_guid"):
        return mr["template_guid"]   
       
    raise ValueError("template_guid_missing")

def generate_run_id() -> str:
    # genera id della run

    ts = datetime.now(TIMEZONE).strftime("%Y%m%d_%H%M%S")
    return f"run{ts}"

def schema_version_from_path(schema_path: str) -> str:
    # restituisce la versione dello schema

    m = re.search(r"_v(\d+\.\d+)\.schema\.json$", schema_path)
    return f"v{m.group(1)}" if m else None

def build_schema_versions(ctx: MCPContext, used_schema_ids: list[str]) -> dict:
    # ritorna le versioni di tutti gli schemi

    out = {}
    for sid in used_schema_ids:
        path = ctx.schema_map.get(sid)
        if path:
            out[sid] = schema_version_from_path(path)
    return out

def extract_present_concepts(mr: dict | None, actions_payload: dict | None) -> set[str]:
    # estrae i concetti che sono presenti

    present = set()
    if mr:
        for item in mr.get("items", []):
            if item.get("status") == "matched" and item.get("concept_id"):
                present.add(item.get("concept_id"))
    if actions_payload:
        for a in actions_payload.get("actions", []):
            target = a.get("target", {})
            if target.get("concept_id"):
                present.add(target.get("concept_id"))
    return present

def build_absent_concepts(template_base_path: str, mr: dict | None, actions_payload: dict | None) -> list[dict]:
    # ritorna tutti i concetti che sono nel template base ma che non ci sono nel template di riferimento

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

def extract_analysis_from_matching_report(mr: dict) -> dict:
    # aggiunge nel report tutte le variabili che si riferiscono ad un concetto non ancora mappato

    ambiguous = []
    unmapped = []

    for item in  mr.get("items", []):
        status = item.get("status")
        source_key = item.get("source_key")
        section = item.get("section")
        confidence = item.get("confidence")
        candidates = item.get("candidates", [])
        evidence = item.get("evidence", {})

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
                "suggested_action": "dictionary.add_concept",
                "proposal_type": "candidate_only",
                "requires_human_review": True
            })
    
    return {
        "matching_version": mr.get("matching_version"),
        "ambiguous_matches": ambiguous,
        "unmapped_terms": unmapped,
    }

def summarize_template_real_diff(before: dict, after: dict) -> list[str]:
    summary = []
    for section, a_section in after.items():
        if not isinstance(a_section, dict):
            continue
        a_values = a_section.get("Values")
        b_values = before.get(section, {}).get("Values") if isinstance(before.get(section), dict) else None
        if not isinstance(a_values, dict) or not isinstance(b_values, dict):
            continue

        for source_key, a_entry in a_values.items():
            b_entry = b_values.get(source_key, {})
            if not isinstance(a_entry, dict) or not isinstance(b_entry, dict):
                continue

            changed_fields = []
            for k, v in a_entry.items():
                if k not in b_entry or b_entry.get(k) != v:
                    changed_fields.append(k)

            if changed_fields:
                summary.append(f"set_fields: {section}/{source_key} -> {', '.join(sorted(changed_fields))}")

    return summary

def summarize_dictionary_diff(before: dict, after: dict) -> list[str]:
    before_entries = {e["concept_id"]: e for e in before.get("entries", [])}
    after_entries = {e["concept_id"]: e for e in after.get("entries", [])}
    summary = []

    # nuovi concetti
    for concept_id in sorted(set(after_entries) - set(before_entries)):
        summary.append(f"add_concept: {concept_id}")

    # concetti comuni
    for concept_id in sorted(set(after_entries) & set(before_entries)):
        b_entry = before_entries[concept_id]
        a_entry = after_entries[concept_id]

        # update_category
        if b_entry.get("category") != a_entry.get("category"):
            summary.append(f"update_category: {concept_id} -> {a_entry.get('category')}")

        # semantic_category diff
        if b_entry.get("semantic_category") != a_entry.get("semantic_category"):
            summary.append(
                f"update_semantic_category: {concept_id} -> {a_entry.get('semantic_category')}"
            )

        # synonyms diff
        b_syn = b_entry.get("synonyms", {})
        a_syn = a_entry.get("synonyms", {})
        for lang in sorted(set(a_syn) | set(b_syn)):
            b_vals = set(b_syn.get(lang, []))
            a_vals = set(a_syn.get(lang, []))
            for val in sorted(a_vals - b_vals):
                summary.append(f"add_synonym: {concept_id} [{lang}] '{val}'")
            for val in sorted(b_vals - a_vals):
                summary.append(f"remove_synonym: {concept_id} [{lang}] '{val}'")

        # abbreviations diff
        b_abbr = set(b_entry.get("abbreviations", []))
        a_abbr = set(a_entry.get("abbreviations", []))
        for val in sorted(a_abbr - b_abbr):
            summary.append(f"add_abbreviation: {concept_id} '{val}'")
        for val in sorted(b_abbr - a_abbr):
            summary.append(f"remove_abbreviation: {concept_id} '{val}'")

        # patterns diff (by regex+description)
        b_pat = {(p.get("regex"), p.get("description")) for p in b_entry.get("patterns", [])}
        a_pat = {(p.get("regex"), p.get("description")) for p in a_entry.get("patterns", [])}
        for regex, desc in sorted(a_pat - b_pat):
            summary.append(f"add_pattern: {concept_id} /{regex}/ ({desc})")
        for regex, desc in sorted(b_pat - a_pat):
            summary.append(f"remove_pattern: {concept_id} /{regex}/ ({desc})")

    return summary

def summarize_kb_diff(before: dict, after: dict) -> list[str]:
    summary = []
    b_map = {(m["scope_id"], m["source_type"], m["source_key"]): m for m in before.get("mappings", [])}
    a_map = {(m["scope_id"], m["source_type"], m["source_key"]): m for m in after.get("mappings", [])}

    for key in sorted(set(a_map) - set(b_map)):
        m = a_map[key]
        summary.append(f"add_kb_rule: {m['scope_id']} {m['source_type']} {m['source_key']} -> {m['concept_id']}")

    for key in sorted(set(a_map) & set(b_map)):
        b = b_map[key]
        a = a_map[key]
        if b.get("concept_id") != a.get("concept_id") or b.get("reason") != a.get("reason") or b.get("evidence") != a.get("evidence"):
            summary.append(f"update_kb_rule: {a['scope_id']} {a['source_type']} {a['source_key']}")

    return summary

def summarize_template_base_diff(before: dict, after: dict) -> list[str]:
    summary = []

    def flat_map(tb):
        out = {}
        for cat in tb.get("categories", []):
            for c in cat.get("concepts", []):
                out[c["concept_id"]] = (cat.get("id"), c)
        return out

    b = flat_map(before)
    a = flat_map(after)

    for concept_id in sorted(set(a) - set(b)):
        summary.append(f"add_base_concept: {concept_id} -> {a[concept_id][0]}")

    for concept_id in sorted(set(b) - set(a)):
        summary.append(f"remove_base_concept: {concept_id}")

    for concept_id in sorted(set(a) & set(b)):
        b_cat, b_c = b[concept_id]
        a_cat, a_c = a[concept_id]
        if b_cat != a_cat:
            summary.append(f"update_base_category: {concept_id} {b_cat} -> {a_cat}")
        if b_c.get("label") != a_c.get("label"):
            summary.append(f"update_base_label: {concept_id}")
        if b_c.get("description") != a_c.get("description"):
            summary.append(f"update_base_description: {concept_id}")

    return summary

def build_run_report(cfg: dict, run_id: str, artifact_type: str, input_path: str, output_path: str, diff: list[str], 
    schema_versions: dict, committed: bool, status: str, validation_block: dict | None, mr: dict | None,
    dictionary_payload: dict | None,kb_payload: dict | None, template_base_path: str | None, template_base_version: str | None) -> dict:

    return {
        "schema_versions": schema_versions,
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": get_template_guid(input_path, mr),
        "source_files": {
            "template_path": input_path if artifact_type == "template" else None,
            "dictionary_path": ARTIFACTS["dictionary"]["input_path"],
            "dictionary_version": dictionary_payload.get("dictionary_version") if dictionary_payload else None,
            "kb_path": ARTIFACTS["kb"]["input_path"],
            "kb_version": kb_payload.get("kb_version") if kb_payload else None,
            "template_base_path": template_base_path,
            "template_base_version": template_base_version,
        },
        "target": {
            "artifact_type": artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": validation_block,
        "diff_summary": {"changed_paths": diff},
    }

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

def build_patch_and_validation(cfg: dict, artifact_type: str, upsert_fn, diff_fn):
    # costruisce la patch 

    input_path = cfg["input_path"]
    patch_path = cfg.get("patch_path")  # patch manuali
    actions_path = cfg.get("actions_path")  # patch per template reale
    template_base_path = cfg.get("template_base_path") # template base

    file_patch = None
    if patch_path:
        file_patch = load_json(patch_path)
    
    template_patch = None 
    validated_preview = None
    validated_diff = None
    validation_block = None
    actions_payload = None

    # template actions
    if artifact_type == "template" and actions_path:
        actions_payload = load_json(actions_path)

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

def compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn):
    # genera diff

    artifact = load_json(input_path)

    if validated_preview is not None and validated_diff is not None:
        return artifact, validated_preview, validated_diff

    dry_run_result = upsert_fn(path=input_path, patch=template_patch, dry_run=True)
    preview = dry_run_result.get("preview")
    diff = diff_fn(artifact, preview)

    return artifact, preview, diff

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

def build_report_context(artifact_type, matching_path, template_base_path):
    # salva le versioni degli schemi, dizionario / kb e la versione del template_base

    ctx = MCPContext(repo_root=".")
    used = []
    if matching_path:
        used.append("matching_report")
    if artifact_type == "template":
        used += ["patch_actions_template", "template_patch"]
    if artifact_type == "dictionary":
        used.append("dictionary_patch")
    if artifact_type == "kb":
        used.append("kb_patch")
    if artifact_type == "template_base":
        used.append("template_base_patch")

    schema_versions = build_schema_versions(ctx, used)

    dict_payload = None 
    kb_payload = None 
    if "dictionary" in ARTIFACTS and ARTIFACTS["dictionary"].get("input_path"):
        dict_payload = load_json(ARTIFACTS["dictionary"]["input_path"])
    if "kb" in ARTIFACTS and ARTIFACTS["kb"].get("input_path"):
        kb_payload = load_json(ARTIFACTS["kb"]["input_path"])

    tb_version = None 
    if template_base_path:
        tb_version = load_json(template_base_path).get("template_base_version")

    return schema_versions, dict_payload, kb_payload, tb_version

def run_patch(cfg: dict, artifact_type: str, upsert_fn, diff_fn) -> None:
    # orchestrator
    
    run_id = generate_run_id()
    run_dir = RUNS_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    input_path = cfg["input_path"]
    matching_path = cfg.get("matching_path") # matchign report
    actions_path = cfg.get("actions_path")  # patch per template reale
    template_base_path = cfg.get("template_base_path") # template base
    validate_only = cfg.get("validate_only", False)

    if artifact_type == "template" and not actions_path:
        raise ValueError("actions_path_required_for_template")
    
    mr, analysis = load_matching(matching_path)

    template_patch, validation_block, validated_preview, validated_diff, actions_payload, validation_error = build_patch_and_validation(cfg, artifact_type, upsert_fn, diff_fn)

    if validation_error:
        run_report = build_run_report(
            cfg=cfg,
            run_id=run_id,
            artifact_type=artifact_type,
            input_path=input_path,
            output_path=input_path,
            diff=validation_error.get("diff", []),
            schema_versions={},
            committed=False,
            status="validation_error",
            validation_block={
                "status": "error",
                "errors": validation_error.get("errors", []),
                "warnings": validation_error.get("warnings", []),
                "stage": validation_error.get("stage"),
            },
            mr=mr,
            dictionary_payload=None,
            kb_payload=None,
            template_base_path=template_base_path,
            template_base_version=load_json(template_base_path).get("template_base_version") if template_base_path else None,
        )
        report_path = run_dir / "run_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(run_report, f, indent=2, ensure_ascii=False)
        return
    
    artifact, preview, diff = compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn)

    approve_commit = False 
    print("\n--- DRY-RUN DIFF ---")
    for d in diff:
        print("-", d)

    if actions_payload:
        print("\n--- ACTIONS ---")
        for a in actions_payload.get("actions", []):
            print(f"- {a.get('type')} {a.get('section')}/{a.get('source_key')} -> {a.get('target', {}).get('concept_id')}")

    response = input("Commit? (y/n): ").strip().lower()
    approve_commit = (response == "y")

    if not approve_commit:
        validate_only = True

    output_path, committed, status, _ = apply_commit(input_path, template_patch, diff, validate_only, upsert_fn)

    schema_versions, dict_payload, kb_payload, tb_version = build_report_context(artifact_type, matching_path, template_base_path)

    run_report = build_run_report(
        cfg=cfg,
        run_id=run_id,
        artifact_type=artifact_type,
        input_path=input_path,
        output_path=output_path,
        diff=diff,
        schema_versions=schema_versions,
        committed=committed,
        status=status,
        validation_block=validation_block,
        mr=mr,
        dictionary_payload=dict_payload,
        kb_payload=kb_payload,
        template_base_path=template_base_path,
        template_base_version=tb_version,
    )

    if status == "validation_error":
        policy_outcome = "rejected"
    elif status == "validated_only":
        policy_outcome = "needs_review"
    elif status == "no_change":
        policy_outcome = "no_change"
    else:
        policy_outcome = "approved"

    run_report["policy_outcome"] = policy_outcome
        
    if analysis:
        run_report["analysis"] = analysis
        run_report["analysis"]["matching_path"] = matching_path
    if mr:
        run_report["matched_variables"] = extract_matched_variables_from_matching_report(mr)
    if actions_payload:
        run_report["actions"] = actions_payload.get("actions", [])
        run_report["actions_path"] = actions_path
    if template_base_path:
        run_report["absent_concepts"] = build_absent_concepts(
            template_base_path=template_base_path,
            mr=mr,
            actions_payload=actions_payload,
        )

    report_path = run_dir / "run_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(run_report, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    choose = int(input("1--> diz. 2--> kb. 3--> template. 4--> template_base: "))
    if choose == 1:
        run_patch(ARTIFACTS["dictionary"], "dictionary", dictionary_upsert, summarize_dictionary_diff)
    elif choose == 2:   
        run_patch(ARTIFACTS["kb"],  "kb", kb_upsert_mapping, summarize_kb_diff)
    elif choose == 3:
        run_patch(ARTIFACTS["template"], "template", template_apply_patch, summarize_template_real_diff)
    elif choose == 4:
        run_patch(ARTIFACTS["template_base"], "template_base", template_apply_patch, summarize_template_base_diff)  