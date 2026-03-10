from datetime import datetime, timezone, timedelta
import requests
import json

from src.metrics_calculation.llm_calculate_metrics import compute_time_metrics, compute_efficiency_metrics, compute_effectiveness_metrics, aggregate_ollama_metrics, compute_quality_metrics, compute_metrics

TIMEZONE = timezone(timedelta(hours=1))
llm_progress = {}

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

def ollama_generate_json(run_id: str, model: str, prompt: str) -> dict:
    # genera json con ollama
    
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
    data = r.json()
    metrics = {
        "total_duration": data.get("total_duration"),   # tempo totale (nanosecondi)
        "load_duration": data.get("load_duration"),     # tempo caricamente modello (nanosecondi)
        "prompt_eval_count": data.get("prompt_eval_count"),  # token del prompt
        "prompt_eval_duration": data.get("prompt_eval_duration"), # tempo per processare il prompt (nanosecondi)
        "eval_count": data.get("eval_count"),   # token generati da LLM
        "eval_duration": data.get("eval_duration")  # tempo generazione risposta LLM (nanosecondi)
    }
    raw = r.json().get("response", "").strip()
    try: 
        llm_progress[run_id]["done_calls"] += 1
        print(f"chiamata LLM {llm_progress[run_id]["done_calls"]}")
        return json.loads(raw), metrics
    except Exception:
        return {"patch_actions_version": "v0.1", "generated_at": datetime.now(timezone.utc).isoformat(), "actions": []}, {}
    
def chunk_list(items: list, size: int) -> list[list]:
    # suddivide una lista in chunk di dimensione size

    return [items[i:i + size] for i in range(0, len(items), size)]

def llm_propose_actions(run_id: str, model: str, mr: dict, batch_size: int = 3) -> dict:
    # genera proposte actions con LLM e metriche LLM. Produce patch actions + info 

    global llm_progress
    llm_contexts = extract_llm_contexts(mr)
    if not llm_contexts:
        return {"patch_actions_version": "v0.1","generated_at": datetime.now(timezone(timedelta(hours=1))).isoformat(), "actions": []}, {"target":"dictionary","operations":[]}, {"note":"skipped_no_ambiguous"}
    batches = chunk_list(llm_contexts, batch_size)
    llm_progress[run_id] = {
        "total_calls": len(batches),
        "done_calls": 0
    }

    all_actions = []
    all_dict_ops = []
    attempts = []
    call_metrics_list = []

    for idx, batch in enumerate(batches):
        prompt = build_llm_prompt(batch)
        output, call_metrics = ollama_generate_json(run_id, model, prompt)
        call_metrics_list.append(call_metrics or {})
        
        if isinstance(output, dict):
            pa = parse_llm_output(output)
            if isinstance(pa, dict) and isinstance(pa.get("actions"), list):
                all_actions.extend(pa["actions"])
            
        attempts.append({
            "batch_index": idx,
            "batch_size": len(batch),
        })
    
    # ----TEMPO--------
    totals = aggregate_ollama_metrics(call_metrics_list) # ritorna total_duration_sec, prompt_eval_duration_sec, eval_duration_sec, load_duration_sec
    time_metrics = compute_time_metrics(len(attempts), totals) # ritorna llm_total_sec, llm_avg_sec, llm_calls, llm_load_sec

    # ----EFFICIENZA------
    efficiency_metrics = compute_efficiency_metrics(totals) # ritorna llm_prompt_total_tokens, llm_generate_total_tokens, llm_total_tokens, llm_prompt_time_total_sec, llm_generate_time_total_sec, llm_generate_tokens_per_sec, llm_prompt_tokens_per_sec, llm_sec_per_1k_tokens
    
    llm_attempt = {
        "model": model,
        "contexts_count": len(llm_contexts),
        "batch_size": batch_size,
        "batches": len(batches),
        "attempts": attempts,
        **time_metrics,
        **efficiency_metrics,
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

def merge_actions_dedup(primary: dict, secondary: dict) -> dict:
    # tiene le azioni di primary, aggiunge solo quelle di secondary che non duplicano (section, source_key)

    if not primary:
        return secondary or {"patch_actions_version": "v0.1", "generated_at": datetime.now(TIMEZONE).isoformat(), "actions": []}
    if not secondary:
        return primary

    out = {
        "patch_actions_version": primary.get("patch_actions_version", "v0.1"),
        "generated_at": primary.get("generated_at", datetime.now(TIMEZONE).isoformat()),
        "actions": []
    }

    seen = set()
    for a in primary.get("actions", []):
        key = (a.get("section"), a.get("source_key"))
        seen.add(key)
        out["actions"].append(a)

    for a in secondary.get("actions", []):
        key = (a.get("section"), a.get("source_key"))
        if key in seen:
            continue
        out["actions"].append(a)

    return out

def count_llm_applied(actions_payload: dict, llm_actions: dict) -> int:
    # conta le azioni applicate

    if not actions_payload or not llm_actions:
        return 0
    llm_keys = {(a.get("section"), a.get("source_key")) for a in llm_actions.get("actions", [])}
    applied_keys = {(a.get("section"), a.get("source_key")) for a in actions_payload.get("actions", [])}
    return len(llm_keys & applied_keys)

def llm_percentual(run_id: str) -> int:
    # calcola la percentuale di progresso chiamate del modello

    data = llm_progress.get(run_id)

    if not data:
        return 0

    done = data["done_calls"]
    total = data["total_calls"]

    return int((done / max(total, 1)) * 100)