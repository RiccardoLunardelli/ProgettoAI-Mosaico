from mcp_server.server import dictionary_upsert, kb_upsert_mapping, template_apply_patch
from mcp_server.core import MCPContext

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

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
    },
    "template_base": {
        "input_path": "data/template_base_v0.1.json",
        "patch_path": str(PATCH_ROOT / "template" / "manual_patch_addbaseconc.json"),
        "input_version": "v0.1",
        "template_base_path": "data/template_base_v0.1.json",
    },
    "template": {
        "input_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates/028d14de-71dc-6e64-9587-c7111a39793e.json",
        "matching_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/matching_report_v0.1.json",
        "actions_path": "mcp_server/patch/template_real/manual_actions.json",
        "template_base_path": "data/template_base_v0.1.json",
        "validate_only": True,
    }
}

def generate_run_id() -> str:
    # genera id della run

    ts = datetime.now(TIMEZONE).strftime("%Y%m%d_%H%M%S")
    return f"run{ts}"

def load_template_base(path: str) -> dict:
    # caricamento template base

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_concepts_from_template_base(tb: dict) -> dict:
    # estrae concetti da template base {concept_id : category}

    out = {}
    for cat in tb.get("categories", []):
        cat_id = cat.get("id")
        for c in cat.get("concepts", []):
            out[c.get("concept_id")] = cat_id
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
    # ritorna tutti i concetti che sono nel tb ma che non ci sono nel template di riferimento

    tb = load_template_base(template_base_path)
    expected = extract_concepts_from_template_base(tb)
    present = extract_present_concepts(mr, actions_payload)

    absent = []
    for concept_id, category in expected.items():
        if concept_id not in present:
            absent.append({
                "concept_id": concept_id,
                "category": category,
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
    # estrae actions da patch_actions

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

def build_run_report(run_id: str, input_path: str, output_path: str, patch_path: str, diff: list[str], artifact_type: str) -> dict:
    # costruzione del report

    ops_count = None
    if patch_path:
        ops_count = len(json.load(open(patch_path, "r", encoding="utf-8")).get("operations", []))
        
    return {
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "target": {
            "artifact_type": artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "patch": {
            "patch_path": patch_path,
            "operations_count": ops_count,
        },
        "execution": {
            "dry_run": True,
            "committed": True,
            "status": "success",
        },
        "diff_summary": {
            "changed_paths": diff,
        },
    }

def validate_before_commit_template(ctx: MCPContext, actions_payload: dict, template_base_path: str, input_path: str, upsert_fn, diff_fn) -> dict:
    # VALIDATOR --> valida schema, coerenza, esegue dry run

    # schema-first
    ctx.schema_validate("patch_actions_template", actions_payload)

    # coerenza con template base
    errors = validate_actions_against_template_base(actions_payload, template_base_path)
    if errors:
        return {"ok": False, "stage": "canonical_validation", "errors": errors}
    
    # conversione patch
    template_patch = actions_to_template_patch(actions_payload)

    with open(input_path, "r", encoding="utf-8") as f:
        artifact = json.load(f)

    # dry-run
    dry_run_result = upsert_fn(path=input_path, patch=template_patch, dry_run=True)
    preview = dry_run_result.get("preview")
    diff = diff_fn(artifact, preview)

    return {"ok": True, "stage": "validated", "errors": [], "patch": template_patch, "diff": diff, "preview": preview}

def run_patch(cfg: dict, artifact_type: str, upsert_fn, diff_fn) -> None:
    # --- setup run ---
    run_id = generate_run_id()
    run_dir = RUNS_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    input_path = cfg["input_path"]
    patch_path = cfg.get("patch_path")  # patch manuali
    matching_path = cfg.get("matching_path") # matchign report
    actions_path = cfg.get("actions_path")  # patch per template reale
    template_base_path = cfg.get("template_base_path") # template base
    validate_only = cfg.get("validate_only", False) # true --> scrive solo report

    analysis = {}
    actions_payload = None
    mr = None

    # Sovrascritti da validator
    validated_preview = None
    validated_diff = None

    # carica e valida matching report
    if matching_path:
        with open(matching_path, "r", encoding="utf-8") as f: 
            mr = json.load(f)
        ctx = MCPContext(repo_root=".")
        ctx.schema_validate("matching_report", mr)
        analysis = extract_analysis_from_matching_report(mr)

    # patch da applicare
    template_patch = None

    # chiamata a validator per template reale
    if artifact_type == "template" and actions_path:
        with open(actions_path, "r", encoding="utf-8") as f:
            actions_payload = json.load(f)

        if not template_base_path:
            raise ValueError("template_base_missing")

        ctx = MCPContext(repo_root=".")
        v = validate_before_commit_template(
            ctx=ctx,
            actions_payload=actions_payload,
            template_base_path=template_base_path,
            input_path=input_path,
            upsert_fn=upsert_fn,
            diff_fn=diff_fn,
        )
        if not v["ok"]:
            raise ValueError("; ".join(v.get("errors", [])))

        template_patch = v["patch"]
        validated_preview = v.get("preview")
        validated_diff = v.get("diff")

    if template_patch is None and patch_path:
        with open(patch_path, "r", encoding="utf-8") as f:
            template_patch = json.load(f)

    if template_patch is None:
        raise ValueError("template_patch_missing: provide actions_path or patch_path")

    # load del file in input
    with open(input_path, "r", encoding="utf-8") as f:
        artifact = json.load(f)

    # True --> no commit ; False --> si commit
    dry_run_only = False

    # dry run True --> no commit ; False --> si commit
    if validated_preview is not None and validated_diff is not None:
        preview = validated_preview
        diff = validated_diff
    else:
        dry_run_result = upsert_fn(
            path=input_path,
            patch=template_patch,
            dry_run=True,
        )
        preview = dry_run_result.get("preview")
        diff = diff_fn(artifact, preview)

    no_change = (len(diff) == 0)

    # validate_only = True --> produce report senza commit 
    if validate_only:
        output_path = input_path

        run_report = build_run_report(
            run_id=run_id,
            input_path=input_path,
            output_path=output_path,
            patch_path=patch_path if patch_path else "",
            diff=diff,
            artifact_type=artifact_type,
        )
        run_report["execution"]["committed"] = False
        run_report["execution"]["status"] = "validate_only"

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
            run_report["template_base_path"] = template_base_path

        report_path = run_dir / "run_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(run_report, f, indent=2, ensure_ascii=False)
        return
    
    # validate_only = false --> produce report + esegue commit 
    else:
        # commit file con patch
        if not no_change and not dry_run_only:
            commit_result = upsert_fn(
                path=input_path,
                patch=template_patch,
                dry_run=False,
            )
            output_path = commit_result.get("output_path")
        else:
            output_path = input_path

        # run report
        run_report = build_run_report(
            run_id=run_id,
            input_path=input_path,
            output_path=output_path,
            patch_path=patch_path if patch_path else "",
            diff=diff,
            artifact_type=artifact_type,
        )

        run_report["execution"]["committed"] = (not no_change and not dry_run_only)
        run_report["execution"]["status"] = (
            "success" if (not dry_run_only and not no_change)
            else ("no_change" if no_change else "dry_run_only")
        )

        # Analysis da matching report
        if analysis:
            run_report["analysis"] = analysis
            run_report["analysis"]["matching_path"] = matching_path

        # estrae Matched variables da matching report
        if mr:
            run_report["matched_variables"] = extract_matched_variables_from_matching_report(mr)

        # Actions
        if actions_payload:
            run_report["actions"] = actions_payload.get("actions", [])
            run_report["actions_path"] = actions_path

        # Absent concepts da template base
        if template_base_path:
            run_report["absent_concepts"] = build_absent_concepts(
                template_base_path=template_base_path,
                mr=mr,
                actions_payload=actions_payload,
            )
            run_report["template_base_path"] = template_base_path

        # scrittura run report
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