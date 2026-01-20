import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import argparse

SECTION_TO_CATEGORY = {
    "ContinuosReads": "measurement",
    "ContinuousReads": "measurement",
    "Parameters": "parameter",
    "Alarms": "alarm",
    "Warnings": "warning",
    "Commands": "command",
    "VirtualVariables": "virtual_variable",
}

def load_json(path: str) -> Any:
    # carica il file json

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
    
def normalize_str(s: Optional[str]) -> Optional[str]:
    # normalizzazione togliendo spazi e mettendo tutto in minuscolo

    if s is None:
        return None
    return s.strip().lower()

def tokenize(s: str) -> List[str]:
    # spezza la stringa in parole (ex: ciao mondo --> ['ciao', 'mondo'])

    return [t for t in s.split() if t]

def match_score(text: str, synonym: str) -> Optional[float]:
    # ritorna lo score

    if text == synonym: # uguali
        return 1.0
    if synonym in text: # synonym è presente in text
        return 0.9
    syn_tokens = tokenize(synonym) # match per token
    text_tokens = set(tokenize(text))
    if syn_tokens and all(tok in text_tokens for tok in syn_tokens): # tutti i token del sinonimo sono presenti in text.
        return 0.8                                             # ex: text = "learning automatico e machine vision", synonym = "machine learning"
    return None

def build_concept_index(template_base: Dict[str, Any]) -> Dict[str, str]:
    # costruisce un dizionario con chiave = concept id e valore = category

    index = {}
    for cat in template_base.get("categories", []):     # cat --> categoria
        for c in cat.get("concepts", []):   # c --> concepts
            index[c["concept_id"]] = c["category"] # salva sul dizionario ( concept_id : category)
    return index

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

def run_matching(normalized_path: str, template_base_path: str, dictionary_path: str, kb_path: str, device_context_path: str, output_path: str) -> None:
    #

    normalized = load_json(normalized_path)
    template_base = load_json(template_base_path)
    dictionary = load_json(dictionary_path)
    kb = load_json(kb_path)

    concept_category = build_concept_index(template_base)

    template_guid  = normalized.get("template_guid")
    device_ctx = extract_device_context(device_context_path, template_guid)

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

    # Blacklist (opzionale)
    blacklist = kb.get("exceptions", {}).get("blacklist", [])

    items = []
    for var in normalized.get("variables", []):
        section = var.get("section")
        source_key = var.get("source_key")
        enabled = var.get("enabled", True)
        text = normalize_str(var.get("normalized_text"))

        if enabled is False:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "skipped_disabled",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": None
                }
            })
            continue

        if not text:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "skipped_invalid",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": None
                }
            })
            continue

        expected_category = SECTION_TO_CATEGORY.get(section)
        if expected_category is None:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "unmapped",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": None
                }
            })
            continue

        candidates = []
        for entry in dictionary.get("entries", []):
            concept_id = entry.get("concept_id")
            if concept_id not in concept_category:
                continue
            if entry.get("category") != expected_category:
                continue
            if concept_category.get(concept_id) != expected_category:
                continue

            # blacklist per scope (se presente)
            is_blacklisted = any(
                bl.get("scope_id") in scope_ids and bl.get("concept_id") == concept_id for bl in blacklist
            )
            if is_blacklisted:
                continue

            for lang in ["it", "en"]:
                for syn in entry.get("synonyms", {}).get(lang, []):
                    syn_norm = normalize_str(syn)
                    if not syn_norm:
                        continue
                    score = match_score(text, syn_norm)
                    if score is not None:
                        candidates.append({
                            "concept_id": concept_id,
                            "score": score,
                            "matched_synonym": syn_norm,
                            "dictionary_entry_id": concept_id,
                            "category": expected_category
                        })

        if not candidates:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "unmapped",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": expected_category
                }
            })
            continue

        best_by_concept = {}
        for cand in candidates:
            cid = cand["concept_id"]
            prev = best_by_concept.get(cid)
            if prev is None or cand["score"] > prev["score"] or (
                cand["score"] == prev["score"] and cand["matched_synonym"] < prev["matched_synonym"]
            ):
                best_by_concept[cid] = cand
        candidates = list(best_by_concept.values())
        # determinismo: ordina per score desc, poi concept_id, poi matched_synonym
        candidates.sort(key=lambda c: (-c["score"], c["concept_id"], c["matched_synonym"]))

        top = candidates[0]
        if len(candidates) == 1:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "matched",
                "concept_id": top["concept_id"],
                "confidence": top["score"],
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": top["matched_synonym"],
                    "dictionary_entry_id": top["dictionary_entry_id"],
                    "category": top["category"]
                }
            })
            continue

        second = candidates[1]
        if top["score"] >= 0.9 and (top["score"] - second["score"]) >= 0.15:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "matched_auto",
                "concept_id": top["concept_id"],
                "confidence": top["score"],
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": top["matched_synonym"],
                    "dictionary_entry_id": top["dictionary_entry_id"],
                    "category": top["category"]
                }
            })
        else:
            items.append({
                "source_key": source_key,
                "section": section,
                "status": "ambiguous",
                "concept_id": None,
                "confidence": None,
                "evidence": {
                    "normalized_text": text,
                    "matched_synonym": None,
                    "dictionary_entry_id": None,
                    "category": expected_category
                },
                "candidates": [
                    {"concept_id": c["concept_id"], "score": c["score"]}
                    for c in candidates
                ]
            })

    report = {
        "schema_version": "v1",
        "template_guid": template_guid,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": items
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

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