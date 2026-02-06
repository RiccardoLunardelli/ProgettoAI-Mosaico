from mcp_server.server import dictionary_upsert, kb_upsert_mapping, template_apply_patch, device_list_enrich, dictionary_bulk_suggest
from mcp_server.core import MCPContext
from src.validator.validator import validate_before_commit_template, validate_before_commit_generic, canonical_map, load_json

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
import re
import time 
import requests

TIMEZONE = timezone(timedelta(hours=1))
PATCH_ROOT = Path("mcp_server/patch")
RUNS_ROOT = Path("runs")
ollama_call_count = 0

ARTIFACTS = {
    "dictionary": {
        "input_path": "",
        "patch_path":"/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/mcp_server/patch/dictionary/manual_patch_addabr.json",
        "matching_path": "output_dir/matching_report_v0.1.json",
        "input_version": "v0.1",
        "template_base_path": "data/template_base_v0.1.json",
    },
    "kb": {
        "input_path": "",
        "patch_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/mcp_server/patch/kb/patch_manual_addkbrule.json",
        "input_version": "v0.1",
        "matching_path": "output_dir/matching_report_v0.1.json",
    },
    "template_base": {
        "input_path": "",
        "patch_path": "",
        "input_version": "v0.1",
        "template_base_path": "data/template_base_v0.1.json",
        "matching_path": "output_dir/matching_report_v0.1.json",
    },
    "template": {
        "input_path": "",
        "matching_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/matching_report_v0.1.json",
        "actions_path": "mcp_server/patch/template_real/manual_actions.json",
        "template_base_path": "data/template_base_v0.1.json",
    },
    "device_list": {
        "input_path": "",
    },
}


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
    except Exception:
        pass

    # 2) da matching_report
    if mr and mr.get("template_guid"):
        return mr["template_guid"]
    
    if artifact_type == "device_list":
        return None
       
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

#----------LLM-----------------

#-----TEMPLATE-----
def extract_llm_contexts(mr: dict) -> list[dict]:
    # estrae i contesti LLM dal matching report che richiedono llm ( ambiguous , unmapped )

    out = []
    for item in mr.get("items", []):
        if item.get("status") == "ambiguous" and item.get("llm_context"):
            out.append(item["llm_context"])
    return out

def build_llm_prompt(llm_contexts: list[dict]) -> str:
    # costruisce il prompt per llm

    return (
        "SYSTEM: You are a strict JSON generator.\n"
        "You must resolve ONLY ambiguous items using evidence. No guesses.\n"
        "Output JSON only, no extra text.\n\n"
                            
        "DECISION RULES:\n"
        "1) You may create an action ONLY for the top_candidate in llm_contexts.\n"
        "2) Do not invent new concepts. If top_candidate is not semantically compatible, SKIP.\n"
        "3) Require explicit semantic compatibility, not generic similarity.\n"
        "4) If wording could map to multiple concepts, SKIP.\n"
        "5) If unsure, actions: [].\n\n"

        "CONFIDENCE RULES:\n"
        "- Start from top_candidate.score as the base.\n"
        "- You may increase confidence above 0.90 ONLY if meaning is clearly compatible.\n"
        "- If meaning is not clearly compatible or generic, keep confidence equal to top_candidate.score or lower.\n"
        "- Never set confidence to 1.0 unless the text is explicit and unambiguous.\n\n"

        "TEXT LENGTH RULE:\n"
        "- If normalized_text has fewer than 2 tokens, you MUST NOT set confidence to 1.0.\n"
        "- If normalized_text has fewer than 3 tokens, confidence MUST be <= 0.95.\n\n"

        "OUTPUT FORMAT (strict):\n"
        "{\n"
        "  \"patch_actions_version\": \"v0.1\",\n"
        "  \"generated_at\": \"<ISO-8601>\",\n"
        "  \"actions\": [\n"
        "    {\n"
        "      \"type\": \"map_variable\",\n"
        "      \"section\": \"<section>\",\n"
        "      \"source_key\": \"<source_key>\",\n"
        "      \"target\": {\n"
        "        \"concept_id\": \"<concept_id>\",\n"
        "        \"category\": \"<category>\",\n"
        "        \"semantic_category\": \"<semantic_category>\",\n"
        "        \"labels\": {\"it\": \"<label_it>\", \"en\": \"<label_en>\"}\n"
        "      },\n"
        "      \"patch\": {\n"
        "        \"set_fields\": {\n"
        "          \"ConceptId_Patch\": \"<concept_id>\",\n"
        "          \"Category_Patch\": \"<category>\",\n"
        "          \"SemanticCategory_Patch\": \"<semantic_category>\"\n"
        "        }\n"
        "      },\n"
        "      \"confidence\": 0.0,\n"
        "      \"reason\": \"clear_match\",\n"
        "      \"evidence\": {\n"
        "        \"normalized_text\": \"<normalized_text>\",\n"
        "        \"selected_candidate\": \"<concept_id>\",\n"
        "        \"score\": 0.0\n"
        "      }\n"
        "    }\n"
        "  ]\n"
        "}\n\n"

        "IMPORTANT:\n"
        "- If you are unsure, output actions: [].\n"
        "- Only create actions when the text meaning clearly matches the candidate.\n\n"

        "INPUT llm_contexts:\n"
        f"{json.dumps(llm_contexts, ensure_ascii=False)}\n"
    )

def filter_low_confidence(actions_payload: dict, threshold: float = 0.9) -> dict:
    # filtra le azioni con confidence bassa

    actions = actions_payload.get("actions", [])
    filtered = []
    for a in actions:
        confidence = a.get("confidence")
        if isinstance(confidence, (int, float)) and confidence >= threshold:
            filtered.append(a)
    actions_payload["actions"] = filtered
    return actions_payload

def filter_by_candidate_gap(actions_payload: dict, llm_contexts: list[dict], min_gap: float = 0.10) -> dict:
    # filtra le azioni con gap troppo basso tra i top candidates

    context_map = {}
    for ctx in llm_contexts or []:
        key = (ctx.get("section"), ctx.get("source_key"))
        context_map[key] = ctx.get("top_candidates", [])

    actions = actions_payload.get("actions", [])
    filtered = []
    for a in actions:
        key = (a.get("section"), a.get("source_key"))
        candidates = context_map.get(key, [])
        if not candidates:
            continue

        top = candidates[0] if candidates else {}
        top_id = top.get("concept_id")
        if top_id and a.get("target", {}).get("concept_id") != top_id:
            continue

        if len(candidates) >= 2:
            top_score = candidates[0].get("score")
            second_score = candidates[1].get("score")
            if not isinstance(top_score, (int, float)) or not isinstance(second_score, (int, float)):
                continue
            if (top_score - second_score) < min_gap:
                continue

        filtered.append(a)

    actions_payload["actions"] = filtered
    return actions_payload

def ollama_generate_json(model: str, prompt: str) -> dict:
    # genera json con ollama

    global ollama_call_count 
    ollama_call_count += 1

    url = "http://127.0.0.1:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {"temperature": 0, "top_p": 0.1}
    }
    r = requests.post(url, json=payload, timeout=200)
    r.raise_for_status()
    raw = r.json().get("response", "").strip()
    try: 
        print(f"chiamata LLM {ollama_call_count}")
        return json.loads(raw)
    except Exception:
        return {"patch_actions_version": "v0.1", "generated_at": datetime.now(timezone.utc).isoformat(), "actions": []}
    
def chunk_list(items: list, size: int) -> list[list]:
    # suddivide una lista in chunk di dimensione size

    return [items[i:i + size] for i in range(0, len(items), size)]

def llm_propose_actions(model: str, mr: dict, batch_size: int = 3) -> dict:
    # genera proposte actions con llm. Produce patch actions + info 

    llm_contexts = extract_llm_contexts(mr)
    if not llm_contexts:
        return {"patch_actions_version": "v0.1","generated_at": datetime.now(timezone(timedelta(hours=1))).isoformat(), "actions": []}, {"target":"dictionary","operations":[]}, {"note":"skipped_no_ambiguous"}
    batches = chunk_list(llm_contexts, batch_size)

    all_actions = []
    all_dict_ops = []
    attempts = []
    total_latency = 0.0

    for idx, batch in enumerate(batches):
        prompt = build_llm_prompt(batch)
        start = time.time()
        output = ollama_generate_json(model, prompt)
        latency = round(time.time() - start, 3)
        total_latency += latency

        if isinstance(output, dict):
            pa = parse_llm_output(output)
            if isinstance(pa, dict) and isinstance(pa.get("actions"), list):
                all_actions.extend(pa["actions"])
            
        attempts.append({
            "batch_index": idx,
            "batch_size": len(batch),
            "latency_sec": latency
        })

    llm_attempt = {
        "model": model,
        "latency_sec": round(total_latency, 3),
        "contexts_count": len(llm_contexts),
        "batch_size": batch_size,
        "batches": len(batches),
        "attempts": attempts
    }
    
    patch_actions = {"patch_actions_version": "v0.1","generated_at": datetime.now(timezone(timedelta(hours=1))).isoformat(), "actions": all_actions}
    dictionary_patch = {"target": "dictionary", "operations": all_dict_ops}
    print(f"LLM OUTPUT: {patch_actions}")

    return patch_actions, dictionary_patch, llm_attempt

def parse_llm_output(output: dict) -> dict:
    
    if not isinstance(output, dict):
        return {"patch_actions_version": "v0.1", "generated_at": datetime.now(timezone.utc).isoformat(), "actions": []}

    allowed = {"patch_actions_version", "generated_at", "actions"}
    if set(output.keys()) != allowed:
        return {"patch_actions_version": "v0.1", "generated_at": datetime.now(timezone.utc).isoformat(), "actions": []}

    if not isinstance(output.get("actions"), list):
        return {"patch_actions_version": "v0.1", "generated_at": datetime.now(timezone.utc).isoformat(), "actions": []}

    output.setdefault("patch_actions_version", "v0.1")
    output.setdefault("generated_at", datetime.now(timezone.utc).isoformat())
    return output

def ensure_labels(actions_payload: dict) -> dict:
    actions = actions_payload.get("actions", [])
    for a in actions:
        tgt = a.get("target", {})
        if "labels" not in tgt or not isinstance(tgt.get("labels"), dict):
            text = a.get("evidence", {}).get("normalized_text", "") or ""
            tgt["labels"] = {"it": text, "en": text}
            a["target"] = tgt
    return actions_payload

#-----DICTIONARY-----
def build_llm_dictionary_prompt(analysis: dict) -> str:
    # -- da usare nel caso proposer anche poer dictionary --
    return (
        "SYSTEM: You are a strict JSON generator.\n"
        "You propose ONLY dictionary patch operations.\n"
        "Use ONLY ambiguous_matches and unmapped_terms.\n"
        "No guesses. If unsure, operations: [].\n\n"
        "OUTPUT FORMAT (strict):\n"
        "{\n"
        "  \"target\": \"dictionary\",\n"
        "  \"operations\": [\n"
        "    {\"op\": \"add_synonym\", \"concept_id\": \"...\", \"lang\": \"it\", \"value\": \"...\"}\n"
        "  ]\n"
        "}\n\n"
        "INPUT:\n"
        f"{json.dumps(analysis, ensure_ascii=False)}\n"
    )

#---------DIFF-----------------
def summarize_device_list_diff(before:dict, after: dict) -> list[str]:
    if not isinstance(before, list) or not isinstance(after, list):
        return []

    def _key(item: dict, idx: int) -> str:
        if not isinstance(item, dict):
            return f"idx_{idx}"
        return item.get("IDPTD") or item.get("ID") or f"idx_{idx}"

    before_map = {_key(item, i): item for i, item in enumerate(before)}
    after_map = {_key(item, i): item for i, item in enumerate(after)}

    summary = []

    added_keys = sorted(set(after_map) - set(before_map))
    removed_keys = sorted(set(before_map) - set(after_map))
    if added_keys:
        summary.append(f"add_device: {', '.join(added_keys)}")
    if removed_keys:
        summary.append(f"remove_device: {', '.join(removed_keys)}")

    common_keys = [k for k in after_map if k in before_map]
    if not common_keys:
        return summary

    uniform_added_fields = None
    uniform_only_added = True
    per_item_updates = []

    for k in common_keys:
        b = before_map.get(k, {})
        a = after_map.get(k, {})
        if not isinstance(a, dict) or not isinstance(b, dict):
            continue

        b_keys = set(b.keys())
        a_keys = set(a.keys())

        added_fields = sorted(a_keys - b_keys)
        removed_fields = sorted(b_keys - a_keys)
        updated_fields = sorted([f for f in a_keys & b_keys if a.get(f) != b.get(f)])

        if removed_fields or updated_fields:
            uniform_only_added = False
        if uniform_added_fields is None:
            uniform_added_fields = added_fields
        elif uniform_added_fields != added_fields:
            uniform_only_added = False

        if removed_fields:
            per_item_updates.append(f"remove_fields: {k} -> {', '.join(removed_fields)}")
        if updated_fields:
            per_item_updates.append(f"update_fields: {k} -> {', '.join(updated_fields)}")
        if added_fields and not uniform_only_added:
            per_item_updates.append(f"add_fields: {k} -> {', '.join(added_fields)}")

    if uniform_only_added and uniform_added_fields:
        summary.append(f"add_fields_all: {', '.join(sorted(uniform_added_fields))}")
        return summary

    summary.extend(per_item_updates)
    return summary

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

def compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn):
    # genera diff (dry-run se non validato)

    artifact = load_json(input_path)

    if validated_preview is not None and validated_diff is not None:
        return artifact, validated_preview, validated_diff

    dry_run_result = upsert_fn(path=input_path, patch=template_patch, dry_run=True)
    preview = dry_run_result.get("preview")
    diff = diff_fn(artifact, preview)

    return artifact, preview, diff

#-------REPORT--------
def build_run_report(cfg: dict, run_id: str, artifact_type: str, input_path: str, output_path: str, diff: list[str], 
    schema_versions: dict, committed: bool, status: str, validation_block: dict | None, mr: dict | None,
    dictionary_payload: dict | None,kb_payload: dict | None, template_base_path: str | None, template_base_version: str | None,
    llm_attempt: dict | None, actions_payload: dict | None) -> dict:
    # raccoglie tutto, nornalizza e ritorna il report della run

    if artifact_type == "template":
        return {
            "schema_versions": schema_versions,
            "run_id": run_id,
            "timestamp": datetime.now(TIMEZONE).isoformat(),
            "template_guid": get_template_guid(input_path, mr, artifact_type),
            "source_files": {
                "template_path": input_path if artifact_type == "template" else None,
                "dictionary_path": ARTIFACTS["dictionary"]["input_path"],
                "dictionary_version": dictionary_payload.get("dictionary_version") if dictionary_payload else None,
                "kb_path": ARTIFACTS["kb"]["input_path"],
                "kb_version": kb_payload.get("kb_version") if kb_payload else None,
                "template_base_path": template_base_path,
                "template_base_version": template_base_version,
            },
            "metrics": {
                "matched_count": compute_metrics(mr, actions_payload).get("matched_count"),
                "ambiguous_count": compute_metrics(mr, actions_payload).get("ambiguous_count"),
                "unmapped_count": compute_metrics(mr, actions_payload).get("unmapped_count"),
                "llm_calls": ollama_call_count,
                "warnings_count": len(validation_block.get("warnings", [])) if validation_block else 0,
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
    elif artifact_type == "dictionary":
        return {
            "schema_versions": build_schema_versions(MCPContext(repo_root="."), ["dictionary", "dictionary_patch"]),
            "run_id": run_id,
            "timestamp": datetime.now(TIMEZONE).isoformat(),
            "template_guid": None,
            "source_files": {
                "dictionary_path": input_path,
                "dictionary_version": dictionary_payload.get("dictionary_version") if dictionary_payload else None,
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
    elif artifact_type == "kb":
        return {
        "schema_versions": build_schema_versions(MCPContext(repo_root="."), ["kb", "kb_patch"]),
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": None,
        "source_files": {
           "kb_path": input_path,
            "kb_version": kb_payload.get("kb_version") if kb_payload else None,
        },
        "target": {
            "artifact_type":artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": {"status": "ok", "errors": [], "warnings": []},
        "diff_summary": {"changed_paths": diff},
    }
    elif artifact_type == "template_base":
        return {
        "schema_versions": build_schema_versions(MCPContext(repo_root="."), ["template_base", "template_base_patch"]),
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": None,
        "source_files": {
           "template_base_path": input_path,
            "template_base_version": template_base_version,
        },
        "target": {
            "artifact_type":artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": {"status": "ok", "errors": [], "warnings": []},
        "diff_summary": {"changed_paths": diff},
    }
    elif artifact_type == "device_list":
         return {
        "schema_versions": build_schema_versions(MCPContext(repo_root="."), ["device_list", "device_list_context"]),
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": None,
        "source_files": {
            "device_list_path": input_path,
        },
        "target": {
            "artifact_type":artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": {"status": "ok", "errors": [], "warnings": []},
        "diff_summary": {"changed_paths": diff},
    }

def compute_metrics(mr: dict | None, actions_payload: dict | None) -> dict:
    # calcola metriche base

    actions = actions_payload.get("actions", []) if actions_payload else []

    matched_from_mr = 0
    matched_keys_from_mr = set()
    if mr:
        for item in mr.get("items", []):
            if item.get("status") == "matched":
                matched_from_mr += 1
                matched_keys_from_mr.add((item.get("section"), item.get("source_key")))

    manual_keys = {
        (a.get("section"), a.get("source_key")) for a in actions
    }

    extra_manual = len([k for k in manual_keys if k not in matched_keys_from_mr])

    ambiguous = 0
    unmapped = 0
    if mr:
        for item in mr.get("items", []):
            key = (item.get("section"), item.get("source_key"))
            if key in manual_keys:
                continue
            if item.get("status") == "ambiguous":
                ambiguous += 1
            elif item.get("status") == "unmapped":
                unmapped += 1
    return {
        "matched_count": matched_from_mr + extra_manual,
        "ambiguous_count": ambiguous,
        "unmapped_count": unmapped,
    }

#------BUILD PATCH ACTIONS------------
#-----TEMPLATE-------
def build_patch_actions_from_matching(mr: dict, output_path: str) -> dict:
    # costruisce le patch dal matching report

    actions = []
    for item in mr.get("items", []):
        status = item.get("status")
        source_key = item.get("source_key")
        section = item.get("section")
        evidence = item.get("evidence", {})
        confidence = item.get("confidence")
        normalized_text = evidence.get("normalized_text")

        if status != "matched":
            continue

        if status == "matched" and confidence > 0.9:
            actions.append({
                "type": "map_variable",
                "section": section,
                "source_key": source_key,
                "target": {
                    "concept_id": item.get("concept_id"),
                    "category": evidence.get("category"),
                    "semantic_category": evidence.get("semantic_category"),
                    "labels": {"it": normalized_text or "", "en": normalized_text or ""}
                },
                "patch": {
                    "set_fields": {
                        "ConceptId_Patch": item.get("concept_id"),
                        "Category_Patch": evidence.get("category"),
                        "SemanticCategory_Patch": evidence.get("semantic_category")
                    }
                },
                "confidence": item.get("confidence") or 0.0,
                "reason": item.get("technical_reason") or "matching_deterministico",
                "evidence": {"normalized_text": normalized_text}
            })

        elif status == "ambiguous":
            # fallback LLM
            continue

        elif status == "unmapped":
            # non mappare: possibile proposta dizionario
            continue

    patch_actions = {
        "patch_actions_version": "v0.1",
        "generated_at": datetime.now(TIMEZONE).isoformat(),
        "actions": actions
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(patch_actions, f, ensure_ascii=False, indent=2)

    return patch_actions

#-----DICTIONARY------
def build_dictionary_patch_from_run_report(run_report_path: list[str], dictionary_path: str) -> dict:
    # costruisce patch per dizionario da run report

    reports = []
    for p in run_report_path:
        r = load_json(p)
        reports.append(r)
    
    # usa solo UNMAPPED, AMBIGUOUS
    ambiguous = []
    for r in reports:
        analysis = r.get("analysis", {})
        ambiguous.extend(analysis.get("ambiguous_matches", []))

    dictionary = load_json(dictionary_path)
    existing_synonyms = {}
    exisisting_abbr = {}
    for e in dictionary.get("entries", []):
        cid = e.get("concept_id")
        existing_synonyms[cid] = e.get("synonyms", {})
        exisisting_abbr[cid] = set(e.get("abbreviations", []))
    
    operations= []
    seen_concepts = set()

    def _add(op):
        key = tuple(sorted(op.items()))
        if key not in seen_concepts:
            operations.append(op)
            seen_concepts.add(key)

    #----AMBIGUOUS----
    for item in ambiguous:
        candidates = item.get("candidates", [])
        if len(candidates) != 1:
            continue

        concept_id = candidates[0].get("concept_id")
        text = (item.get("evidence", {}).get("normalized_text")or "").strip()
        if not concept_id or not text:
            continue 
        
        # ADD ABBR 
        tokens = [t for t in text.split() if t]
        if len(tokens) < 2:
            # troppo corto per essere un sinonimo valido
            if 2 <= len(text) <= 3:
                if text not in exisisting_abbr.get(concept_id, set()):
                    _add({"op": "add_abbreviation", "concept_id": concept_id, "value": text})
            continue
        
        # ADD SYN
        _add({"op": "add_synonym", "concept_id": concept_id, "lang": "it", "value": text})

    return {"target": "dictionary", "operations": operations}

def build_dictionary_suggestions_from_run_report(run_report_paths: list[str], dictionary_path: str) -> dict:
    reports = [load_json(p) for p in run_report_paths]

    unmapped = []
    for r in reports:
        analysis = r.get("analysis", {})
        unmapped.extend(analysis.get("unmapped_terms", []))

    # raggruppa per categoria
    terms_by_category = {}
    for item in unmapped:
        text = (item.get("evidence", {}).get("normalized_text") or "").strip()
        category = item.get("evidence", {}).get("category")
        if not text or not category:
            continue
        terms_by_category.setdefault(category, []).append(text)


    suggestions = []
    for category, terms in terms_by_category.items():
        result = dictionary_bulk_suggest(terms=terms, path=dictionary_path, expected_category=category)
        suggestions.append({
            "category": category,
            "suggestions": result.get("suggestions", [])
        })

    return suggestions

#----TEMPLATE BASE------
def build_template_base_patch_from_suggestion(suggestions_path: str, output_path: str) -> dict:
    pass

#-------MATCHING REPORT + ANALYSIS-----------------
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

def run_patch(cfg: dict, artifact_type: str, upsert_fn, diff_fn, validate) -> None:
    run_id = generate_run_id()
    run_dir = RUNS_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

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
            return

        artifact, preview, diff = compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn)

        if not validate_only:
            approve_commit = True
        else:
            approve_commit = False

        if not approve_commit:
            validate_only = True

        output_path, committed, status, _ = apply_commit(input_path, template_patch, diff, validate_only, upsert_fn)
        schema_versions, dict_payload, kb_payload, tb_version = build_report_context(artifact_type, None, template_base_path)

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
            json.dump(run_report, f, indent=2, ensure_ascii=False)
        return

    # ---- TEMPLATE FLOW ----
    mr, analysis = load_matching(matching_path)

    actions_out = "output_dir/patch_actions_v0.1.json"
    if not cfg.get("manual_actions_path"):
        build_patch_actions_from_matching(mr, actions_out)
        cfg["actions_path"] = actions_out
    else:
        cfg["actions_path"] = cfg.get("manual_actions_path")

    manual_mode = bool(cfg.get("manual_actions_path"))

    has_ambiguous = any(i.get("status") == "ambiguous" for i in mr.get("items", [])) if mr else False
    llm_actions = None
    llm_model = cfg.get("llm_model", "llama3.1:8b")
    llm_attempt = None

    if has_ambiguous and not manual_mode:
        use_llm = input("Sono presenti ambiguità. Usare LLM? (y/n): ").strip().lower() == "y"
        if use_llm:
            print("Generating LLM proposed actions...")
            llm_actions, _, llm_attempt = llm_propose_actions(llm_model, mr)
            llm_actions = ensure_labels(llm_actions)
            llm_actions = filter_low_confidence(llm_actions, threshold=0.9)
            llm_contexts = extract_llm_contexts(mr)
            llm_actions = filter_by_candidate_gap(llm_actions, llm_contexts, min_gap=0.10)

            llm_actions_path = run_dir / "llm_patch_actions.json"
            with open(llm_actions_path, "w", encoding="utf-8") as f:
                json.dump(llm_actions, f, indent=2, ensure_ascii=False)
    elif manual_mode:
        print("Manual mode: skipping LLM proposed actions.")

    template_patch, validation_block, validated_preview, validated_diff, actions_payload, validation_error = \
        build_patch_and_validation(cfg, artifact_type, upsert_fn, diff_fn)

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

    if llm_attempt:
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

def run_device_list(cfg: dict, validate) -> None:
    # run per device_list

    run_id = generate_run_id()
    run_dir = RUNS_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    input_path = cfg["input_path"]
    validate_only = validate

    # dry-run
    dry = device_list_enrich(path=input_path, dry_run=True)
    preview = dry.get("preview")
    output_path = dry.get("output_path")
    diff = summarize_device_list_diff(load_json(input_path), preview)
    output_path, committed, status, no_change = apply_commit(
        input_path=input_path,
        template_patch=None,
        diff=diff,
        validate_only=validate_only,
        upsert_fn=lambda path, patch, dry_run: device_list_enrich(path=path, dry_run=dry_run)
    )

    if validate_only:
        committed = False
        status = "validate_only"
    elif no_change:
        committed = False 
        status = "no_change"
    else:
        commit = device_list_enrich(path=input_path, dry_run=False)
        output_path = commit.get("output_path")
        committed = True
        status = "success"
    
    run_report = build_run_report(
        cfg=cfg,
        run_id=run_id,
        artifact_type="device_list",
        input_path=input_path,
        output_path=output_path,
        diff=diff, 
        schema_versions=build_schema_versions(MCPContext(repo_root="."), ["device_list", "device_list_context"]),
        committed=committed,
        status=status,
        validation_block={"status": "ok", "errors": [], "warnings": []},
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
        json.dump(run_report, f, indent=2, ensure_ascii=False)


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
