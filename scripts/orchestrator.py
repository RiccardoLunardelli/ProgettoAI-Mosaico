from mcp_server.server import dictionary_upsert, kb_upsert_mapping, template_apply_patch, device_list_enrich
from mcp_server.core import MCPContext
from src.validator.validator import load_json
from src.matcher.matcher import run_matching
from src.parser.normalizer import normalization,normalize_template, model_dump
from scripts.llm_proposer.llm_proposer import (
    llm_propose_actions, ensure_labels, filter_by_candidate_gap,
    filter_low_confidence, extract_llm_contexts, merge_actions_dedup,
    count_llm_applied, llm_percentual, llm_progress
)
from scripts.summarize_diff.diff import summarize_device_list_diff, summarize_template_real_diff, compute_diff, summarize_dictionary_diff, summarize_kb_diff, summarize_template_base_diff
from scripts.build_patch.builder import (
    build_dictionary_patch_from_run_report,
    build_dictionary_suggestions_from_run_report,
    build_patch_actions_from_matching
)
from scripts.config.config import ARTIFACTS, RUNS_ROOT, load_config, generate_run_id
from scripts.matching.matching import (
    load_matching,
    extract_analysis_from_matching_report,
    extract_matched_variables_from_matching_report,
    build_absent_concepts
)
from scripts.report.report import build_run_report, build_schema_versions, extract_device_list_version, schema_version_from_path, build_artifact_versions, build_report_context
from scripts.validation.validation import build_patch_and_validation, apply_commit

import json
from pathlib import Path


def start_template_run(user_id, template_name: str, dictionary_name: str, kb_name: str, template_base_name: str, device_context_name: str,
                       template_id: str, dictionary_id: str, kb_id: str, template_base_id: str, device_context_id: str, template_payload: dict,  dictionary_payload: dict,
                        kb_payload: dict, template_base_payload: dict, device_context_payload: list | dict, config_path: str="config/config.yml") -> dict:
    # normalizzazione e matching

    cfg = load_config(config_path)
    paths = cfg.get("paths", {})
    schema_tipo_path = paths.get("schema_tipo")

    run_id = generate_run_id()
    run_dir = RUNS_ROOT / user_id / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # input DB -> file tecnici run
    template_input_path = run_dir / f"{template_name}"
    dictionary_input_path = run_dir / f"{dictionary_name}"
    kb_input_path = run_dir / f"{kb_name}"
    template_base_input_path = run_dir / f"{template_base_name}"
    device_context_input_path = run_dir / f"{device_context_name}"

    template_input_path.write_text(json.dumps(template_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    dictionary_input_path.write_text(json.dumps(dictionary_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    kb_input_path.write_text(json.dumps(kb_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    template_base_input_path.write_text(json.dumps(template_base_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    device_context_input_path.write_text(json.dumps(device_context_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # context persistente della run
    run_context = {
        "template_id": template_id,
        "dictionary_id": dictionary_id,
        "kb_id": kb_id,
        "template_base_id": template_base_id,
        "device_context_id": device_context_id,
        "template_input_path": str(template_input_path),
        "dictionary_input_path": str(dictionary_input_path),
        "kb_input_path": str(kb_input_path),
        "template_base_input_path": str(template_base_input_path),
        "device_context_input_path": str(device_context_input_path),
    }
    (run_dir / "run_context.json").write_text(json.dumps(run_context, ensure_ascii=False, indent=2), encoding="utf-8")

    # normalizzazione (usa snapshot template)
    normalized_payload = normalization(str(template_input_path), schema_tipo_path)
    normalized_path = run_dir / "normalized_template_v0.1.json"
    normalized_path.write_text(json.dumps(normalized_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # matching (usa snapshot input DB)
    matching_path = run_dir / "matching_report_v0.1.json"
    run_matching(
        normalized_path=str(normalized_path),
        template_base_path=str(template_base_input_path),
        dictionary_path=str(dictionary_input_path),
        kb_path=str(kb_input_path),
        device_context_path=str(device_context_input_path),
        output_path=str(matching_path),
    )

    mr = load_json(str(matching_path))
    has_ambiguous = any(i.get("status") == "ambiguous" for i in mr.get("items", []))
    ambiguous_count = sum(1 for i in mr.get("items", []) if i.get("status") == "ambiguous")

    return {
        "run_id": run_id,
        "matching_path": str(matching_path),
        "has_ambiguous": has_ambiguous,
        "ambiguous_count": ambiguous_count,
    }

#------------LLM---------------------------
def llm_propose_for_run(run_id: str, llm_model: str | None = None,) -> dict:
    #  genera LLM patch (come proposta)

    run_dir = RUNS_ROOT / run_id
    matching_path = run_dir / "matching_report_v0.1.json"

    if not matching_path.exists():
        raise FileNotFoundError("matching report not found for run_id")
    
    mr = load_json(str(matching_path))
    model = llm_model or "llama3.1:8b"

    llm_actions, _, llm_attempt = llm_propose_actions(run_id, model, mr)

    llm_actions = ensure_labels(llm_actions)
    llm_actions = filter_low_confidence(llm_actions)
    llm_contexts = extract_llm_contexts(mr)
    llm_actions = filter_by_candidate_gap(llm_actions, llm_contexts, min_gap=0.10)

    llm_attempt_path = run_dir / "llm_attempt.json"
    llm_attempt_path.write_text(json.dumps(llm_attempt, ensure_ascii=False, indent=2),encoding="utf-8")

    llm_actions_path = run_dir / "llm_patch_actions.json"
    llm_actions_path.write_text(json.dumps(llm_actions, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "run_id": run_id,
        "llm_patch_actions": llm_actions,
        "llm_patch_path": str(llm_actions_path),
        "llm_attempt": llm_attempt
    }

#--------------RUN-----------------------
def run_patch(cfg: dict, artifact_type: str, upsert_fn, diff_fn, validate, input_path, user_id) -> None:
    run_id = generate_run_id()
    run_dir = RUNS_ROOT / user_id / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    
    cfg["input_path"] = str(input_path)
    input_path = cfg["input_path"]
    matching_path = cfg.get("matching_path")
    actions_path = cfg.get("actions_path")
    template_base_path = cfg.get("template_base_path")
    validate_only = validate

    # ---- GENERIC FLOW (dictionary / kb / template_base) ----
    if artifact_type in {"dictionary", "kb", "template_base"}:
        template_patch, validation_block, validated_preview, validated_diff, actions_payload, validation_error = build_patch_and_validation(cfg, artifact_type, upsert_fn, diff_fn)

        if validation_error:
            run_report = build_run_report(
                cfg=cfg, run_id=run_id, artifact_type=artifact_type,
                input_path=input_path, output_path=input_path,
                diff=validation_error.get("diff", []),
                schema_versions={}, committed=False, status="validation_error",
                validation_block={
                    "status": "error",
                    "errors": validation_error.get("errors", []),
                    "warnings": validation_error.get("warnings", []),
                    "stage": validation_error.get("stage"),
                },
                mr=None, dictionary_payload=None, kb_payload=None,
                template_base_path=template_base_path,
                template_base_version=load_json(template_base_path).get("template_base_version") if template_base_path else None,
                llm_attempt=None, actions_payload=actions_payload
            )
            report_path = run_dir / "run_report.json"
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(run_report, f, indent=2, ensure_ascii=False)
            return report_path

        artifact, preview, diff = compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn)

        if not validate_only:
            approve_commit = True
        else:
            approve_commit = False

        if not approve_commit:
            validate_only = True

        output_path, committed, status, _ = apply_commit(input_path, template_patch, diff, validate_only, upsert_fn)
        if artifact_type == "dictionary":
            ARTIFACTS["dictionary"]["input_path"] = output_path
        elif artifact_type == "kb":
            ARTIFACTS["kb"]["input_path"] = output_path
        elif artifact_type == "template_base":
            template_base_path = output_path
            ARTIFACTS["template_base"]["input_path"] = output_path

        schema_versions, dict_payload, kb_payload, tb_version = build_report_context(artifact_type, None, template_base_path)
        schema_versions = build_artifact_versions(artifact_type, dict_payload=dict_payload, kb_payload=kb_payload, template_base_version=tb_version)

        run_report = build_run_report(
            cfg=cfg, run_id=run_id, artifact_type=artifact_type,
            input_path=input_path, output_path=output_path, diff=diff,
            schema_versions=schema_versions, committed=committed, status=status,
            validation_block=validation_block, mr=None,
            dictionary_payload=dict_payload, kb_payload=kb_payload,
            template_base_path=template_base_path, template_base_version=tb_version,
            llm_attempt=None, actions_payload=actions_payload
        )
        report_path = run_dir / "run_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(run_report, f, indent=2, ensure_ascii=False, default=str)
        return report_path

    '''
    # ---- TEMPLATE FLOW ----
    mr, analysis = load_matching(matching_path)

    actions_out = "output_dir/patch_actions_v0.1.json"
    if not cfg.get("manual_actions_path"):
        build_patch_actions_from_matching(mr, actions_out)
        cfg["actions_path"] = actions_out
    else:
        cfg["actions_path"] = cfg.get("manual_actions_path")
    
    actions_payload = load_json(cfg["actions_path"])

    manual_mode = bool(cfg.get("manual_actions_path"))

    has_ambiguous = any(i.get("status") == "ambiguous" for i in mr.get("items", [])) if mr else False
    llm_actions = None
    llm_model = cfg.get("llm_model", "llama3.1:8b")
    llm_attempt = None
    llm_actions_path = None
    llm_apply_actions = None
    llm_proposed_count = 0
    llm_applied_count = 0


    if has_ambiguous and not manual_mode:
        use_llm = cfg.get("use_llm", False)
        if use_llm:
            print("Generating LLM proposed actions...")
            llm_actions, _, llm_attempt = llm_propose_actions(llm_model, mr)
            llm_actions = ensure_labels(llm_actions)
            llm_actions = filter_low_confidence(llm_actions, threshold=0.9)
            llm_contexts = extract_llm_contexts(mr)
            llm_actions = filter_by_candidate_gap(llm_actions, llm_contexts, min_gap=0.10)
            llm_proposed_count = len(llm_actions.get("actions", []))

            llm_actions_path = run_dir / "llm_patch_actions.json"
            with open(llm_actions_path, "w", encoding="utf-8") as f:
                json.dump(llm_actions, f, indent=2, ensure_ascii=False)

            apply_llm = input("Generate patch LLM: applicarle? (y/n): ").strip().lower() == "y"
            if apply_llm:
                llm_path = input("Percorso patch LLM (default: appena generate): ").strip()
                if not llm_path:
                    llm_path = str(llm_actions_path)
                llm_apply_actions = load_json(llm_path)
    elif manual_mode:
        print("Manual mode: skipping LLM proposed actions.")

    if llm_apply_actions:
        actions_payload = merge_actions_dedup(actions_payload, llm_apply_actions)
        llm_applied_count = count_llm_applied(actions_payload, llm_actions)

    if llm_attempt is None:
        llm_attempt = {}

    llm_attempt["llm_patch_proposed"] = llm_proposed_count
    llm_attempt["llm_patch_applied"] = llm_applied_count
   
    template_patch, validation_block, validated_preview, validated_diff, actions_payload, validation_error = \
        build_patch_and_validation(cfg, artifact_type, upsert_fn, diff_fn, actions_payload_override=actions_payload)

    if validation_error:
        run_report = build_run_report(
            cfg=cfg, run_id=run_id, artifact_type=artifact_type,
            input_path=input_path, output_path=input_path,
            diff=validation_error.get("diff", []),
            schema_versions={}, committed=False, status="validation_error",
            validation_block={
                "status": "error",
                "errors": validation_error.get("errors", []),
                "warnings": validation_error.get("warnings", []),
                "stage": validation_error.get("stage"),
            },
            mr=mr, dictionary_payload=None, kb_payload=None,
            template_base_path=template_base_path,
            template_base_version=load_json(template_base_path).get("template_base_version") if template_base_path else None,
            llm_attempt=llm_attempt, actions_payload=actions_payload
        )
        report_path = run_dir / "run_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(run_report, f, indent=2, ensure_ascii=False)
        return

    artifact, preview, diff = compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn)

    print("\n------ MATCH DETERMINISTICO ----------")
    print("\n--- DRY-RUN DIFF ---")
    for d in diff:
        print("-", d)

    if actions_payload:
        print("\n--- ACTIONS (DETERMINISTICHE) ---")
        for a in actions_payload.get("actions", []):
            print(f"- {a.get('type')} {a.get('section')}/{a.get('source_key')} -> {a.get('target', {}).get('concept_id')}")

    if llm_attempt and llm_actions:
        print("\n----------------LLM PROPOSED ACTIONS----------------")
        for a in llm_actions.get("actions", []):
            print(f"- {a.get('type')} {a.get('section')}/{a.get('source_key')}/{a.get('evidence').get('normalized_text')} -> {a.get('target', {}).get('concept_id')} | Confidence: {a.get('confidence')}")
        print(f"Patch LLM file: {llm_actions_path}")

    # auto-commit se validate_only False
    if not validate_only:
        approve_commit = True
    else:
        approve_commit = False

    if not approve_commit:
        validate_only = True

    output_path, committed, status, _ = apply_commit(input_path, template_patch, diff, validate_only, upsert_fn)

    schema_versions, dict_payload, kb_payload, tb_version = build_report_context(artifact_type, matching_path, template_base_path)
    schema_versions = build_artifact_versions(artifact_type, dict_payload=dict_payload, kb_payload=kb_payload, template_base_version=tb_version)

    run_report = build_run_report(
        cfg=cfg, run_id=run_id, artifact_type=artifact_type,
        input_path=input_path, output_path=output_path, diff=diff,
        schema_versions=schema_versions, committed=committed, status=status,
        validation_block=validation_block, mr=mr,
        dictionary_payload=dict_payload, kb_payload=kb_payload,
        template_base_path=template_base_path, template_base_version=tb_version,
        llm_attempt=llm_attempt, actions_payload=actions_payload
    )

    if llm_attempt:
        run_report["llm_patch_actions"] = llm_actions
        run_report["llm_patch_actions_path"] = str(llm_actions_path) if llm_actions_path else None

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
    return report_path
    '''

def run_device_list(cfg: dict, validate, version, run_dir, run_id, forced_context_version: str | None = None) -> None:
    # run per device_list

    run_dir.mkdir(parents=True, exist_ok=True)

    input_path = cfg["input_path"]
    validate_only = validate

    commit = None
    rules_payload = cfg.get("device_rules")

    # dry-run
    dry = device_list_enrich(path=input_path, dry_run=True, rules_payload=rules_payload)
    preview = dry.get("preview")
    # versione output
    if forced_context_version:
        output_path = str(Path(input_path).with_name(f"device_list_context_v{forced_context_version}.json"))
    else:
        output_path = dry.get("output_path")
    # diff device list
    diff = summarize_device_list_diff(load_json(input_path), preview)
    # commit
    output_path, committed, status, no_change = apply_commit(
        input_path=input_path,
        template_patch=None,
        diff=diff,
        validate_only=validate_only,
        upsert_fn=lambda path, patch, dry_run: device_list_enrich(path=path, dry_run=dry_run, rules_payload=rules_payload)
    )

    if validate_only:
        committed = False
        status = "validate_only"

    elif no_change:
        committed = False
        status = "no_change"

    else:
        commit = device_list_enrich(path=input_path, dry_run=False, rules_payload=rules_payload)

        if forced_context_version:
            generated = Path(commit.get("output_path"))
            forced = Path(input_path).with_name(f"device_list_context_v{forced_context_version}.json")

            if generated != forced:
                generated.parent.mkdir(parents=True, exist_ok=True)
                generated.replace(forced)

            output_path = str(forced)
        else:
            output_path = commit.get("output_path")

    committed = True
    status = "success"
    
    device_list_version = forced_context_version or extract_device_list_version(output_path or input_path)
    
    schema_versions = {
        "device_list_version": device_list_version,
        "config_device_list_version": version
    }

    #enriched_file = commit.get("preview")
    warnings = None
    if commit and commit.get("warning"):
        warnings = commit.get("warning")
    elif dry and dry.get("warning"):
        warnings = dry.get("warning")

    run_report = build_run_report(
        cfg=cfg,
        run_id=run_id,
        artifact_type="device_list",
        input_path=input_path,
        output_path=output_path,
        diff=diff, 
        schema_versions=schema_versions,
        committed=committed,
        status=status,
        validation_block = {"status": "ok", "errors": [], "warnings": warnings},
        mr=None,
        dictionary_payload=None,
        kb_payload=None,
        template_base_path=None,
        template_base_version=None,
        llm_attempt=None,
        actions_payload=None
    )

    report_path = run_dir / "run_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(run_report, f, indent=2, ensure_ascii=False, default=str)
    return report_path, preview

def template_run(user_id, run_id: str, validate_only: bool, apply_llm: bool, llm_actions_override: dict | None = None, manual_actions_path: str | None = None, config_path: str = "config/config.yml") -> dict:
    # run completa per template

    cfg = load_config(config_path)
    llm_cfg = cfg.get("llm", {})
    llm_attempt = None

    run_dir = RUNS_ROOT / user_id / run_id
    run_context_path = run_dir / "run_context.json"
    if not run_context_path.exists():
        raise FileNotFoundError("run_context not found for run_id")

    run_ctx = load_json(str(run_context_path))
    template_path = run_ctx.get("template_input_path")
    dictionary_path = run_ctx.get("dictionary_input_path")
    kb_path = run_ctx.get("kb_input_path")
    template_base_path = run_ctx.get("template_base_input_path")

    if not template_path or not Path(template_path).exists():
        raise FileNotFoundError("template_input_path missing/not found in run_context")
    if not dictionary_path or not Path(dictionary_path).exists():
        raise FileNotFoundError("dictionary_input_path missing/not found in run_context")
    if not kb_path or not Path(kb_path).exists():
        raise FileNotFoundError("kb_input_path missing/not found in run_context")
    if not template_base_path or not Path(template_base_path).exists():
        raise FileNotFoundError("template_base_input_path missing/not found in run_context")

    ARTIFACTS["dictionary"]["input_path"] = dictionary_path
    ARTIFACTS["kb"]["input_path"] = kb_path
    ARTIFACTS["template_base"]["input_path"] = template_base_path

    matching_path = run_dir / "matching_report_v0.1.json"
    llm_attempt_path = run_dir / "llm_attempt.json"

    if not matching_path.exists():
        raise FileNotFoundError("matching_report not found for run_id")

    if llm_attempt_path.exists():
        llm_attempt = load_json(str(llm_attempt_path))

    mr, analysis = load_matching(str(matching_path))

    actions_out = run_dir / "patch_actions_v0.1.json"
    if manual_actions_path:
        actions_payload = load_json(manual_actions_path)
    else:
        actions_payload = build_patch_actions_from_matching(mr, str(actions_out))

    llm_actions = None
    llm_proposed_actions = None

    if apply_llm:
        llm_path = run_dir / "llm_patch_actions.json"
        if llm_path.exists():
            llm_proposed_actions = load_json(str(llm_path))
        llm_actions = llm_actions_override
        if llm_actions is not None:
            actions_payload = merge_actions_dedup(actions_payload, llm_actions)

    llm_proposed_count = len(llm_proposed_actions.get("actions", [])) if llm_proposed_actions else 0
    llm_applied_count = count_llm_applied(actions_payload, llm_proposed_actions) if llm_proposed_actions else 0

    if llm_attempt is None:
        llm_attempt = {}
    llm_attempt["llm_patch_proposed"] = llm_proposed_count
    llm_attempt["llm_patch_applied"] = llm_applied_count

    cfg_art = dict(ARTIFACTS["template"])
    cfg_art["input_path"] = template_path
    cfg_art["matching_path"] = str(matching_path)
    cfg_art["template_base_path"] = template_base_path
    cfg_art["llm_model"] = llm_cfg.get("model", "llama3.1:8b")

    template_patch, validation_block, validated_preview, validated_diff, actions_payload, validation_error = build_patch_and_validation(cfg_art, "template", template_apply_patch, summarize_template_real_diff,actions_payload_override=actions_payload)

    if validation_error:
        run_report = build_run_report(
            cfg=cfg_art, run_id=run_id, artifact_type="template",
            input_path=template_path, output_path=template_path,
            diff=validation_error.get("diff", []),
            schema_versions={}, committed=False, status="validation_error",
            validation_block={
                "status": "error",
                "errors": validation_error.get("errors", []),
                "warnings": validation_error.get("warnings", []),
                "stage": validation_error.get("stage"),
            },
            mr=mr, dictionary_payload=None, kb_payload=None,
            template_base_path=template_base_path,
            template_base_version=load_json(template_base_path).get("template_base_version") if template_base_path else None,
            llm_attempt=llm_attempt, actions_payload=actions_payload
        )
        report_path = run_dir / "run_report.json"
        report_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")
        return {"run_id": run_id, "report_path": str(report_path), "status": "validation_error"}

    artifact, preview, diff = compute_diff(template_path, template_patch, validated_preview, validated_diff, template_apply_patch, summarize_template_real_diff)

    output_path, committed, status, _ = apply_commit(template_path, template_patch, diff, validate_only, template_apply_patch)

    # versioni coerenti con la selezione fatta in run_start (run_context)
    dict_payload = load_json(dictionary_path) if dictionary_path else None
    kb_payload = load_json(kb_path) if kb_path else None
    tb_payload = load_json(template_base_path) if template_base_path else None
    tb_version = tb_payload.get("template_base_version") if tb_payload else None

    ctx = MCPContext(repo_root=".")
    schema_versions = build_schema_versions(ctx, ["matching_report", "patch_actions_template", "template_patch"])
    schema_versions = build_artifact_versions("template", dict_payload=dict_payload, kb_payload=kb_payload, template_base_version=tb_version)

    run_report = build_run_report(
        cfg=cfg_art, run_id=run_id, artifact_type="template",
        input_path=template_path, output_path=output_path, diff=diff,
        schema_versions=schema_versions, committed=committed, status=status,
        validation_block=validation_block, mr=mr,
        dictionary_payload=dict_payload, kb_payload=kb_payload,
        template_base_path=template_base_path, template_base_version=tb_version,
        llm_attempt=llm_attempt, actions_payload=actions_payload
    )

    if analysis:
        run_report["analysis"] = analysis
        run_report["analysis"]["matching_path"] = str(matching_path)
    if mr:
        run_report["matched_variables"] = extract_matched_variables_from_matching_report(mr)
    if actions_payload:
        run_report["actions"] = actions_payload.get("actions", [])
        run_report["actions_path"] = str(actions_out)
    if template_base_path:
        run_report["absent_concepts"] = build_absent_concepts(
            template_base_path=template_base_path,
            mr=mr,
            actions_payload=actions_payload,
        )

    report_path = run_dir / "run_report.json"
    report_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"run_id": run_id, "report_path": str(report_path), "status": status}

"""
def run_template_pipeline(template_path: str, validate_only: bool, use_llm: bool, config_path: str="config/config.yml"):
    # run template completa

    cfg = load_config(config_path)  # config.yml
    paths = cfg.get("paths", {})
    llm_cfg = cfg.get("llm", {})

    dictionary_path = paths.get("dictionary")
    kb_path = paths.get("kb")
    template_base_path = paths.get("template_base")
    device_context_path = paths.get("device_context")
    schema_tipo_path = paths.get("schema_tipo")
    output_dir = paths.get("output_dir", "output_dir")
    llm_model = llm_cfg.get("model", "llama3.1:8b")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Normalizzazione
    normalized_payload = normalization(template_path, schema_tipo_path)

    normalized_path = out_dir / "normalized_template_v0.1.json"
    normalized_path.write_text(json.dumps(normalized_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    
    # Matching
    matching_path = out_dir / "matching_report_v0.1.json"
    run_matching(
        normalized_path=str(normalized_path),
        template_base_path=template_base_path,
        dictionary_path=dictionary_path,
        kb_path=kb_path,
        device_context_path=device_context_path,
        output_path=str(matching_path),
    )

    # Run patch
    cfg_art = dict(ARTIFACTS["template"])
    cfg_art["input_path"] = template_path
    cfg_art["matching_path"] = str(matching_path)
    cfg_art["template_base_path"] = template_base_path
    cfg_art["llm_model"] = llm_model
    cfg_art["use_llm"] = use_llm

    ARTIFACTS["dictionary"]["input_path"] = dictionary_path
    ARTIFACTS["kb"]["input_path"] = kb_path

    report_path = run_patch(cfg_art, "template", template_apply_patch, summarize_template_real_diff, validate_only)

    return report_path
"""

"""
if __name__ == "__main__":
    choose = int(input("1--> diz. 2--> kb. 3--> template. 4--> template_base. 5--> device_list: "))
    input_file = input("Percorso file input: ").strip()
    validate = input("Validate only? (y --> ONLY report /n --> Commit): ")
    if validate == "y":
        validate_only = True
    else:
        validate_only = False
    # dizionario  
    if choose == 1: 
        ARTIFACTS["dictionary"]["input_path"] = input_file
        # run report lettura
        manual = input("Patch manuale o da run report? (m/r): ").strip().lower()
        if manual == "m":
            patch_path = input("Percorso patch manuale (json): ").strip()
            ARTIFACTS["dictionary"]["patch_path"] = patch_path
        else:
            run_report_input = input("Run report path: ").strip()
            run_report_paths = [p.strip() for p in run_report_input.split(",") if p.strip()]

            # build patch del dizionario
            patch = build_dictionary_patch_from_run_report(run_report_paths, input_file) 
            out_path = "output_dir/dictionary_patch.json"
            ARTIFACTS["dictionary"]["patch_path"] = out_path
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(patch, f, ensure_ascii=False, indent=2)
            ARTIFACTS["dictionary"]["patch_path"] = out_path
            print("Patch dizionario salvata in:", out_path)

            suggestions = build_dictionary_suggestions_from_run_report(run_report_paths, input_file)
            out_path = "output_dir/dictionary_suggestions.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(suggestions, f, indent=2, ensure_ascii=False)
            print(f"Suggestions saved: {out_path}")

        run_patch(ARTIFACTS["dictionary"], "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only)
    # kb
    elif choose == 2: 
        ARTIFACTS["kb"]["input_path"] = input_file
        manual = input("Usare patch manuali? (y/n): ").strip().lower() == "y"
        if manual:
            manual_actions_path = input("Percorso patch manuali: ").strip()
            ARTIFACTS["kb"]["patch_path"] = manual_actions_path
        run_patch(ARTIFACTS["kb"],  "kb", kb_upsert_mapping, summarize_kb_diff, validate_only)
    # template
    elif choose == 3:
        ARTIFACTS["template"]["input_path"] = input_file
        manual = input("Usare patch manuali? (y/n): ").strip().lower() == "y"
        if manual:
            manual_actions_path = input("Percorso patch manuali: ").strip()
            ARTIFACTS["template"]["manual_actions_path"] = manual_actions_path
        run_patch(ARTIFACTS["template"], "template", template_apply_patch, summarize_template_real_diff, validate_only)
    # template base
    elif choose == 4:
        ARTIFACTS["template_base"]["input_path"] = input_file
        manual = input("Usare patch manuali? (y/n): ").strip().lower() == "y"
        if manual:
            manual_actions_path = input("Percorso patch manuali: ").strip()
            ARTIFACTS["template_base"]["patch_path"] = manual_actions_path
        run_patch(ARTIFACTS["template_base"], "template_base", template_apply_patch, summarize_template_base_diff, validate_only)  
    # device list
    elif choose == 5:
        ARTIFACTS["device_list"]["input_path"] = input_file
        run_device_list(ARTIFACTS["device_list"], validate_only)
"""