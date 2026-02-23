from __future__ import annotations
from typing import Any, Dict, List


def aggregate_ollama_metrics(call_metrics_list: List[dict]) -> dict:
    # calcola il totale delle metriche date dall'API di ollama

    totals = {
        "total_duration": 0,
        "load_duration": 0,
        "prompt_eval_count": 0,
        "prompt_eval_duration": 0,
        "eval_count": 0,
        "eval_duration": 0,
    }
    for m in call_metrics_list:
        if not m:
            continue
        for k in totals:
            v = m.get(k)
            if isinstance(v, (int, float)):
                totals[k] += v

    # normalizzazione ns -> s
    totals["total_duration_sec"] = totals["total_duration"] / 1e9 if totals["total_duration"] else 0.0
    totals["prompt_eval_duration_sec"] = totals["prompt_eval_duration"] / 1e9 if totals["prompt_eval_duration"] else 0.0
    totals["eval_duration_sec"] = totals["eval_duration"] / 1e9 if totals["eval_duration"] else 0.0
    totals["load_duration_sec"] = totals["load_duration"] / 1e9 if totals["load_duration"] else 0.0

    return totals

def compute_time_metrics(llm_calls: int, totals: dict) -> dict:
    # calcola le metriche utili per il tempo

    llm_total_sec = totals.get("total_duration_sec", 0.0) # tempo totale utilizzo dell LLM
    llm_avg_sec = llm_total_sec / llm_calls if llm_calls else 0.0   # tempo medio di ogni chiamata
    return {
        "llm_total_sec": round(llm_total_sec, 3),
        "llm_avg_sec": round(llm_avg_sec, 3),
        "llm_calls": llm_calls,
        "llm_load_sec": round(totals.get("load_duration_sec", 0.0), 3)
    }
    
def compute_efficiency_metrics(totals: dict) -> dict:
    # calcola le metriche utili per l'efficienza

    llm_prompt_total_tokens = totals.get("prompt_eval_count", 0) # token totali dei prompt
    llm_generate_total_tokens = totals.get("eval_count", 0) # token totali generati dal modello
    llm_total_tokens = llm_prompt_total_tokens + llm_generate_total_tokens  # token totalis

    llm_prompt_time_total_sec = totals.get("prompt_eval_duration_sec", 0.0) # tempo totale per processare prompt
    llm_generate_time_total_sec = totals.get("eval_duration_sec", 0.0)  # tempo totale generazione risposte

    # velocita generazionale (tokens/sec)
    llm_generate_tokens_per_sec = llm_generate_total_tokens / llm_generate_time_total_sec if llm_generate_time_total_sec else 0.0
    # velcoita valutazione prompt (token/sec)
    llm_prompt_tokens_per_sec = llm_prompt_total_tokens / llm_prompt_time_total_sec if llm_prompt_time_total_sec else 0.0
    # costo computazionale: secondi per processare 1k tokens (sec/1k_token)
    llm_sec_per_1k_tokens = totals.get("total_duration_sec", 0.0) / (llm_total_tokens/1000) if llm_total_tokens else 0.0

    return {
        "llm_prompt_total_tokens": llm_prompt_total_tokens,
        "llm_generate_total_tokens": llm_generate_total_tokens,
        "llm_total_tokens": llm_total_tokens,
        "llm_prompt_time_total_sec": round(llm_prompt_time_total_sec, 3),
        "llm_generate_time_total_sec": round(llm_generate_time_total_sec, 3),
        "llm_generate_tokens_per_sec": round(llm_generate_tokens_per_sec, 3), 
        "llm_prompt_tokens_per_sec": round(llm_prompt_tokens_per_sec, 3),
        "llm_sec_per_1k_tokens": round(llm_sec_per_1k_tokens, 3),
    }   
    
def compute_effectiveness_metrics(mr, actions_payload, llm_total_tokens: int) -> dict:
    # calcola le metriche utile per l'efficacia

    pre = compute_metrics(mr, None) # matching report
    post = compute_metrics(mr, actions_payload) # patch LLM applicate

    ambiguous_pre = pre.get("ambiguous_count", 0)
    ambiguous_post = post.get("ambiguous_count", 0)
    matched_pre = pre.get("matched_count", 0)
    matched_post = post.get("matched_count", 0)

    ambiguous_resolved = ambiguous_pre - ambiguous_post
    matched_gain = matched_post - matched_pre
    ambiguity_resolution_rate = ambiguous_resolved / ambiguous_pre if ambiguous_pre else 0.0 # utilità LLM

    resolved_per_1k_tokens = ambiguous_resolved / (llm_total_tokens/1000) if llm_total_tokens else 0.0

    return {
        "matched_count_matching_report": matched_pre,
        "ambiguous_count_matching_report": ambiguous_pre,
        "unmapped_count_matching_report": compute_metrics(mr, None).get("unmapped_count"),
        "matched_count": matched_post,
        "ambiguous_count": ambiguous_post,
        "unmapped_count": compute_metrics(mr, actions_payload).get("unmapped_count"),
        "ambiguous_resolved": ambiguous_resolved,
        "matched_gain": matched_gain,
        "ambiguity_resolution_rate": round(ambiguity_resolution_rate, 3),
        "resolved_per_1k_tokens": round(resolved_per_1k_tokens, 3),
    }

def compute_quality_metrics(llm_proposed_count: int, llm_applied_count: int) -> dict:
    # calcola le metriche utili per la qualità delle risposte del modello

    llm_quality = llm_applied_count / llm_proposed_count if llm_proposed_count else 0
    return {
        "llm_patch_proposed": llm_proposed_count,
        "llm_patch_applied": llm_applied_count,
        "llm_quality": round(llm_quality, 2),
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