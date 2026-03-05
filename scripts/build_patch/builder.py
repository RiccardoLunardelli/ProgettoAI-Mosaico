from datetime import datetime, timezone, timedelta
import json

from src.parser.normalizer import load_json
from mcp_server.server import dictionary_bulk_suggest

TIMEZONE = timezone(timedelta(hours=1))

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
