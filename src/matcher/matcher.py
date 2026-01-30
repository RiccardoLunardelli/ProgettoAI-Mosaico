import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import argparse
from rapidfuzz import fuzz
from pathlib import Path

FUZZY_T_HIGH = 0.90
FUZZY_T_LOW = 0.80
MIN_LEN_FOR_PARTIAL = 6

SECTION_TO_CATEGORY = {
    "ContinuosReads": "measurement",
    "Parameters": "parameter",
    "Alarms": "alarm",
    "Warnings": "warning",
    "Commands": "command",
    "VirtualVariables": "virtual_variable",
    "DataloggerPen": "dataloggerpen"
}

# -----INPUT / OUTPUT / CACHE ---------
def write_report(output_path: str, report: dict, cache_path: str, cache: dict) -> None:
    # scrive report sul file 

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    save_cache(cache_path, cache)

def load_json(path: str) -> Any:
    # carica il file json

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_inputs(normalized_path: str, template_base_path: str, dictionary_path: str, kb_path: str) -> dict: 
    # carica tutti gli input

    return {
        "normalized": load_json(normalized_path),
        "template_base": load_json(template_base_path),
        "dictionary": load_json(dictionary_path),
        "kb": load_json(kb_path),
    }

def build_versions(dictionary: dict, kb: dict, template_base: dict) -> dict:
    # artefatti con relativa versione

    return {
        "dictionary_version": dictionary.get("dictionary_version"),
        "kb_version": kb.get("kb_version"),
        "template_base_version": template_base.get("template_base_version")
    }

def build_metrics(items: list) -> dict:
    # calcola metriche, KPI sul matching

    matched = [i for i in items if i.get("status") == "matched" and i.get("confidence") is not None]
    avg_conf = round(sum(i["confidence"] for i in matched) / len(matched), 4) if matched else None

    return {
        "mapped_count": len([i for i in items if i.get("status") == "matched"]),
        "ambiguous_count": len([i for i in items if i.get("status") == "ambiguous"]),
        "unmapped_count": len([i for i in items if i.get("status") == "unmapped"]),
        "avg_confidence": avg_conf,
        "llm_calls": 0,
        "warnings_count": 0
    }

def load_cache(path: str) -> dict:
    # carica la cache (crea cartella/file se mancano)

    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    try:
        return load_json(path)
    except Exception:
        cache = {"matching_cache": {}, "normalized_cache": {}}
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        return cache

def save_cache(path: str, cache: dict) -> None:
    # scrive la cache 

    with open(path, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def build_cache_key(normalized_text: str, expected_category: str, template_guid: str, device_ctx: dict, versions: dict) -> str:
    # costruzione chiave cache

    parts= [
        normalized_text or "",
        expected_category or "",
        template_guid or "",
        device_ctx.get("type_fam") or "",
        device_ctx.get("device_role") or "",
        device_ctx.get("enum") or "",
        device_ctx.get("device_id") or "",
        versions.get("dictionary_version") or "",
        versions.get("kb_version") or "",
        versions.get("template_base_version") or ""
    ]
    return "|".join(parts)

def emit_result(items: list, cache: dict, cache_key: str, result: dict) -> None:
    # aggiunge risultato a items e cache

    items.append(result)
    if cache_key:
        cache["matching_cache"][cache_key] = result

#--------FUZZY--------
def fuzzy_score(text:str, cand:str) -> float:
    # ritorna score con fuzzy

    if not text or not cand:
        return 0.0 
    r1 = fuzz.token_set_ratio(text, cand) / 100.0
    r2 = fuzz.ratio(text, cand) / 100.0
    if len(text) >= MIN_LEN_FOR_PARTIAL and len(cand) >= MIN_LEN_FOR_PARTIAL:
        r3 = fuzz.partial_ratio(text, cand) / 100.0 # solo su stringhe lunghe
        return max(r1, r2, r3)
    return max(r1, r2)

def iter_candidate_texts(entry: dict, template_base_index: dict, concept_id: str):
    # ritorna tuple (candidate_text, source_type)

    for lang in ["it", "en"]:
        for syn in entry.get("synonyms", {}).get(lang, []):
            s = normalize_str(syn)
            if s:
                yield s, f"synonym_{lang}"

    base = template_base_index.get(concept_id, {})
    label = base.get("label")
    if isinstance(label, dict):
        for lang in ["it", "en"]:
            s = normalize_str(label.get(lang))
            if s:
                yield s, f"template_base_label_{lang}"
    else:
        s = normalize_str(label)
        if s:
            yield s, "template_base_label"

    desc = normalize_str(base.get("description"))
    if desc:
        yield desc, "template_base_description"
#--------FUNZIONI LINGUISTICHE PER MATCH-------
def normalize_str(s: Optional[str]) -> Optional[str]:
    # normalizzazione togliendo spazi e mettendo tutto in minuscolo

    if s is None:
        return None
    if not isinstance(s, str):
        return None
    return s.strip().lower()

def tokenize(s: str) -> List[str]:
    # spezza la stringa in parole (ex: ciao mondo --> ['ciao', 'mondo'])

    return [t for t in s.split() if t]

def match_score(text: str, synonym: str) -> Optional[float]:
    # DETERMINISTICO--> ritorna lo score

    if text == synonym: # uguali
        return 1.0
    if synonym in text: # synonym è presente in text
        return 0.7
    syn_tokens = tokenize(synonym) # match per token
    text_tokens = set(tokenize(text))
    if syn_tokens and all(tok in text_tokens for tok in syn_tokens): # tutti i token del sinonimo sono presenti in text.
        return 0.6                                             # ex: text = "learning automatico e machine vision", synonym = "machine learning"
    return None

def build_concept_index(template_base: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    # costruisce un dizionario con chiave = concept id e valore = category, semantic_category,  label, description

    index = {}
    for cat in template_base.get("categories", []):     # cat --> categoria
        cat_id = cat.get("id")
        for c in cat.get("concepts", []):
            index[c["concept_id"]] = {
                "category": cat_id,
                "semantic_category": c.get("semantic_category"),
                "label": c.get("label"),
                "description": c.get("description"),
            }
    return index

#-------LLM----------
def build_llm_context(section: str, source_key: str, text: str, expected_category: str, candidates: list,
                      device_ctx: dict, versions: dict, template_guid: str, top_k: int = 5) -> dict:
    # costruisce paylaod per llm

    return {
        "section": section,
        "source_key": source_key,
        "normalized_text": text,
        "expected_category": expected_category,
        "top_candidates": [
            {
                "concept_id": c.get("concept_id"),
                "score": c.get("score"),
                "match_source": c.get("match_source"),
                "category": c.get("category"),
                "semantic_category": c.get("semantic_category"),
            }
            for c in (candidates[:top_k] if candidates else [])
        ],
        "device_ctx": {
            "template_guid": template_guid,
            "type_fam": device_ctx.get("type_fam"),
            "device_role": device_ctx.get("device_role"),
            "enum": device_ctx.get("enum")
        },
        "versions": {
            "dictionary_version": versions.get("dictionary_version"),
            "kb_version": versions.get("kb_version"),
            "template_base_version": versions.get("template_base_version")
        }
    }

# ------DEVICE CONTEXT E KB SCOPE-------
def extract_device_context(device_context_path: str, template_guid: str) -> Dict[str, Any]:
    # estrae campi device_list_context

    ctx = load_json(device_context_path)
    for item in ctx:
        if item.get("TemplateGUID") == template_guid:
            return {
                "template_guid": template_guid,
                "device_id": item.get("IDPTD"),
                "type_fam": item.get("type_fam_generated"),
                "device_role": item.get("device_role_generated"),
                "enum": item.get("enum_generated"),  
            }
    return {"template_guid": template_guid}

def resolve_scope_ids(kb: dict, template_guid: str, device_ctx: dict) -> set:
    # ritorna scope_ids validi per il device

    scope_ids = set()
    for scope in kb.get("scopes", []):
        match = scope.get("match", {})
        if match.get("template_guid") == template_guid:
            ok = True 
            for k in ["type_fam", "device_role", "enum", "device_id"]:
                if match.get(k) is not None and match.get(k) != device_ctx.get(k):
                    ok = False
                    break
                if ok:
                    scope_ids.add(scope.get("scope_id"))

    return scope_ids

#------CORE-------
def match_variable(var: dict, template_guid: str, device_ctx: dict, versions: dict, concept_category: dict,dictionary: dict, scope_ids: set, blacklist: list, cache: dict) -> dict:
    # esegue il matching per una variabile

    section = var.get("section")
    source_key = var.get("source_key")
    enabled = var.get("enabled", True)
    text = normalize_str(var.get("normalized_text"))
    expected_category = SECTION_TO_CATEGORY.get(section)

    cache_key = build_cache_key(text, expected_category, template_guid, device_ctx, versions)
    cached = cache.get("matching_cache", {}).get(cache_key)
    if cached:
        return cached

    # ENABLE FALSE
    if enabled is False:
        return {
            "source_key": source_key,
            "section": section,
            "status": "skipped_disabled",
            "technical_reason": "disabled_variable",
            "concept_id": None,
            "confidence": None,
            "evidence": {
                "normalized_text": text,
                "matched_synonym": None,
                "dictionary_entry_id": None,
                "category": None,
                "semantic_category": None
            }
        }

    # TESTO MANCANTE
    if not text:
        return {
            "source_key": source_key,
            "section": section,
            "status": "skipped_invalid",
            "technical_reason": "missing_normalized_text",
            "concept_id": None,
            "confidence": None,
            "evidence": {
                "normalized_text": text,
                "matched_synonym": None,
                "dictionary_entry_id": None,
                "category": None,
                "semantic_category": None
            }
        }

    # CATEGORIA MANCANTE
    if expected_category is None:
        return {
            "source_key": source_key,
            "section": section,
            "status": "unmapped",
            "technical_reason": "unknown_section",
            "concept_id": None,
            "confidence": None,
            "evidence": {
                "normalized_text": text,
                "matched_synonym": None,
                "dictionary_entry_id": None,
                "category": None,
                "semantic_category": None
            }
        }

    # deterministico su sinonimi
    candidates = []
    for entry in dictionary.get("entries", []):
        concept_id = entry.get("concept_id")
        if concept_id not in concept_category:
            continue
        if entry.get("category") != expected_category:
            continue
        concept_info = concept_category.get(concept_id)
        if not concept_info or concept_info.get("category") != expected_category:
            continue

        is_blacklisted = any(bl.get("scope_id") in scope_ids and bl.get("concept_id") == concept_id for bl in blacklist)
        if is_blacklisted:
            continue

        for lang in ["it", "en"]:
            for syn in entry.get("synonyms", {}).get(lang, []):
                syn_norm = normalize_str(syn)
                if not syn_norm:
                    continue
                score = match_score(text, syn_norm) # deterministico
                if score is not None:
                    candidates.append({
                        "concept_id": concept_id,
                        "score": score,
                        "matched_synonym": syn_norm,
                        "dictionary_entry_id": concept_id,
                        "category": expected_category,
                        "semantic_category": concept_info.get("semantic_category"),
                    })

    if not candidates:
        # FALLBACK FUZZY
        fuzzy_candidates = []
        for entry in dictionary.get("entries", []):
            concept_id = entry.get("concept_id")
            if concept_id not in concept_category:
                continue
            if entry.get("category") != expected_category:
                continue
            concept_info = concept_category.get(concept_id)
            if not concept_info or concept_info.get("category") != expected_category:
                continue

            is_blacklisted = any(bl.get("scope_id") in scope_ids and bl.get("concept_id") == concept_id for bl in blacklist)
            if is_blacklisted:
                continue

            best_score = 0.0
            best_text = None
            best_source = None
            for cand_text, src_type in iter_candidate_texts(entry, concept_category, concept_id):
                score = fuzzy_score(text, cand_text)
                if score > best_score:
                    best_score = score
                    best_text = cand_text
                    best_source = src_type

            if best_score > 0:
                fuzzy_candidates.append({
                    "concept_id": concept_id,
                    "score": best_score,
                    "matched_synonym": best_text,
                    "dictionary_entry_id": concept_id,
                    "category": expected_category,
                    "semantic_category": concept_info.get("semantic_category"),
                    "match_source": best_source
                })

        if not fuzzy_candidates:
            return {
                "source_key": source_key,
                "section": section,
                "status": "unmapped",
                "technical_reason": "no_dictionary_match",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": expected_category,
                    "semantic_category": None
                },
                "llm_context": build_llm_context(section=section, source_key=source_key, text=text, expected_category=expected_category,
                                                 candidates=fuzzy_candidates, device_ctx=device_ctx, versions=versions, template_guid=template_guid, top_k=5)
            }

        fuzzy_candidates.sort(key=lambda c: (-c["score"], c["concept_id"]))
        top = fuzzy_candidates[0]
        second = fuzzy_candidates[1] if len(fuzzy_candidates) > 1 else None
        gap = (top["score"] - second["score"]) if second is not None else None

        if top["score"] >= FUZZY_T_HIGH and (second is None or (gap >= 0.10)):
            return {
                "source_key": source_key,
                "section": section,
                "status": "matched",
                "technical_reason": "fuzzy_match",
                "concept_id": top["concept_id"],
                "confidence": top["score"],
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": top["matched_synonym"],
                    "dictionary_entry_id": top["dictionary_entry_id"],
                    "category": top["category"],
                    "semantic_category": top["semantic_category"],
                    "match_source": top.get("match_source"),
                    "gap_top2": gap
                }
            }
        elif top["score"] >= FUZZY_T_LOW:
            return {
                "source_key": source_key,
                "section": section,
                "status": "ambiguous",
                "technical_reason": "fuzzy_ambiguous",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": expected_category,
                    "semantic_category": None,
                    "gap_top2": gap
                },
                "candidates": [
                    {"concept_id": c["concept_id"], "score": c["score"]}
                    for c in fuzzy_candidates[:5]
                ],
                "llm_context": build_llm_context(section=section, source_key=source_key, text=text, expected_category=expected_category,
                                                 candidates=fuzzy_candidates, device_ctx=device_ctx, versions=versions, template_guid=template_guid, top_k=5)
            }
        else:
            return {
                "source_key": source_key,
                "section": section,
                "status": "unmapped",
                "technical_reason": "fuzzy_below_threshold",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": expected_category,
                    "semantic_category": None,
                    "gap_top2": gap
                },
                "llm_context": build_llm_context(section=section, source_key=source_key, text=text, expected_category=expected_category,
                                                 candidates=fuzzy_candidates, device_ctx=device_ctx, versions=versions, template_guid=template_guid, top_k=5)
            }

    # deterministico: scegli top candidate
    best_by_concept = {}
    for cand in candidates:
        cid = cand["concept_id"]
        prev = best_by_concept.get(cid)
        if prev is None or cand["score"] > prev["score"] or (
            cand["score"] == prev["score"] and cand["matched_synonym"] < prev["matched_synonym"]
        ):
            best_by_concept[cid] = cand
    candidates = list(best_by_concept.values())
    candidates.sort(key=lambda c: (-c["score"], c["concept_id"], c["matched_synonym"]))

    top = candidates[0]
    if len(candidates) == 1:
        if top["score"] >= 0.9:
            return {
                "source_key": source_key,
                "section": section,
                "status": "matched",
                "technical_reason": "exact_match",
                "concept_id": top["concept_id"],
                "confidence": top["score"],
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": top["matched_synonym"],
                    "dictionary_entry_id": top["dictionary_entry_id"],
                    "category": top["category"],
                    "semantic_category": top["semantic_category"]
                }
            }

        # ambiguous se sotto soglia o fuzzy non risolve
        return {
            "source_key": source_key,
            "section": section,
            "status": "ambiguous",
            "technical_reason": "low_confidence_single_candidate",
            "concept_id": None,
            "confidence": None,
            "evidence": {
                "normalized_text": text,
                "matched_synonym": None,
                "dictionary_entry_id": None,
                "category": expected_category,
                "semantic_category": None
            },
            "candidates": [
                {"concept_id": top["concept_id"], "score": top["score"]}
            ],
            "llm_context": build_llm_context(
                section=section,
                source_key=source_key,
                text=text,
                expected_category=expected_category,
                candidates=candidates,
                device_ctx=device_ctx,
                versions=versions,
                template_guid=template_guid,
                top_k=5
            )
        }
    second = candidates[1]
    if top["score"] >= 0.9 and (top["score"] - second["score"]) >= 0.15:
        return {
            "source_key": source_key,
            "section": section,
            "status": "matched",
            "technical_reason": "top_score_dominant",
            "concept_id": top["concept_id"],
            "confidence": top["score"],
            "evidence": {
                "normalized_text": text,
                "matched_synonym": top["matched_synonym"],
                "dictionary_entry_id": top["dictionary_entry_id"],
                "category": top["category"],
                "semantic_category": top["semantic_category"]
            }
        }


    return {
        "source_key": source_key,
        "section": section,
        "status": "ambiguous",
        "technical_reason": "multiple_candidates_no_dominance",
        "concept_id": None,
        "confidence": None,
        "evidence": {
            "normalized_text": text,
            "matched_synonym": None,
            "dictionary_entry_id": None,
            "category": expected_category,
            "semantic_category": None
        },
        "candidates": [
            {"concept_id": c["concept_id"], "score": c["score"]}
            for c in candidates
        ],
        "llm_context": build_llm_context(
            section=section,
            source_key=source_key,
            text=text,
            expected_category=expected_category,
            candidates=candidates,
            device_ctx=device_ctx,
            versions=versions,
            template_guid=template_guid,
            top_k=5
        )
    }

def run_matching(normalized_path: str, template_base_path: str, dictionary_path: str, kb_path: str, device_context_path: str, output_path: str) -> None:
    # orchestratore del matching
    
    inputs = load_inputs(normalized_path, template_base_path, dictionary_path, kb_path)
    normalized = inputs["normalized"]
    template_base = inputs["template_base"]
    dictionary = inputs["dictionary"]
    kb = inputs["kb"]

    cache_path = "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/cache/matching_cache_v0.1.json"
    cache = load_cache(cache_path)

    versions = build_versions(dictionary, kb, template_base)
    concept_category = build_concept_index(template_base)

    template_guid = normalized.get("template_guid")
    device_ctx = extract_device_context(device_context_path, template_guid)
    scope_ids = resolve_scope_ids(kb, template_guid, device_ctx)

    blacklist = kb.get("exceptions", {}).get("blacklist", [])

    items = []
    for var in normalized.get("variables", []):
        result = match_variable(
            var=var,
            template_guid=template_guid,
            device_ctx=device_ctx,
            versions=versions,
            concept_category=concept_category,
            dictionary=dictionary,
            scope_ids=scope_ids,
            blacklist=blacklist,
            cache=cache
        )
        cache_key = build_cache_key(
            normalize_str(var.get("normalized_text")),
            SECTION_TO_CATEGORY.get(var.get("section")),
            template_guid,
            device_ctx,
            versions
        )
        emit_result(items, cache, cache_key, result)

    metrics = build_metrics(items)
    report = {
        "matching_version": "v0.1",
        "template_guid": template_guid,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "items": items
    }

    write_report(output_path, report, cache_path, cache)


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("--normalized", required=True)
    parser.add_argument("--template_base", required=True)
    parser.add_argument("--dictionary", required=True)
    parser.add_argument("--kb", required=True)
    parser.add_argument("--device_context", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    run_matching(
        normalized_path=args.normalized,
        template_base_path=args.template_base,
        dictionary_path=args.dictionary,
        kb_path=args.kb,
        device_context_path=args.device_context,
        output_path=args.output,
    )