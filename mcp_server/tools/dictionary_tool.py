from typing import Any, Dict, List
from ..core import MCPContext
import copy
import re
from pathlib import Path

def dictionary_search(ctx: MCPContext, path: str, text: str | None, lang: str | None, concept_id: str | None) -> Dict[str, Any]:
    # ricerca nel dizionario

    p = ctx.ensure_within_root(path)
    dictionary = ctx.read_json(p)
    results = []

    # ricerca diretta per concept_id
    if concept_id:
        for entry in dictionary.get("entries", []):
            if entry.get("concept_id") == concept_id:
                results.append(entry)
                break
        return {"results": results}

    # ricerca per testo + lang (sinonimi)
    if text and lang:
        for entry in dictionary.get("entries", []):
            for syn in entry.get("synonyms", {}).get(lang, []):
                if syn in text:
                    results.append({
                        "concept_id": entry.get("concept_id"),
                        "category": entry.get("category"),
                        "matched_synonym": syn,
                    })
        return {"results": results}

    raise ValueError("invalid_search_params: provide concept_id OR (text and lang)")

def _next_versioned_path(path: Path) -> Path:
    # data/filename_v0.1.json -> data/filename_v0.2.json

    m = re.search(r"_v(\d+)\.(\d+)\.json$", path.name)
    if not m:
        return path.with_name(path.stem + "_v0.1.json")
    major, minor = int(m.group(1)), int(m.group(2)) # 0.1 --> major = 0, minor= 1
    return path.with_name(path.name.replace(f"_v{major}.{minor}.json", f"_v{major}.{minor+1}.json"))

def dictionary_upsert(ctx: MCPContext, path: str, patch: Dict, dry_run: bool) -> Dict:
    # Inserisce/aggiorna una entry nel dizionario

    p = ctx.ensure_within_root(path)
    dictionary = ctx.read_json(p)

    ctx.schema_validate("dictionary", dictionary)
    ctx.schema_validate("dictionary_patch", patch)

    new_dict = copy.deepcopy(dictionary) # preview
    entries = new_dict.setdefault("entries", [])

    for op in patch.get("operations", []):
        # -----ADD SYNONYM-------
        if op["op"] == "add_synonym":
            concept_id = op["concept_id"]
            lang = op["lang"]
            value = op["value"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if not search_result["results"]:
                raise ValueError(f"Concept {concept_id} not found")

            for entry in entries:
                if entry["concept_id"] == concept_id:
                    synonyms = entry.setdefault("synonyms", {})
                    synonyms.setdefault(lang, [])
                    if value not in synonyms[lang]:
                        synonyms[lang].append(value)    # aggiunge sinonimo a concetto
                    break
        
        # ----------ADD CONCEPT-------------------
        elif op["op"] == "add_concept":
            concept_id = op["concept_id"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if search_result["results"]:
                raise ValueError(f"Concept {concept_id} already exists")

            new_entry = {
                "concept_id": concept_id,
                "category": op["category"],
                "semantic_category": op["semantic_category"],
                "synonyms": op.get("synonyms", {}),
                "abbreviations": op.get("abbreviations", []),
                "patterns": op.get("patterns", []),
            }
            entries.append(new_entry)   # aggiunge nuovo concetto a dizionario

        # ---------UPDATE SYNONYM-------------
        elif op["op"] == "update_synonym":
            concept_id = op["concept_id"]
            lang = op["lang"]
            old_value = op["old_value"]
            new_value = op["new_value"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if not search_result["results"]:
                raise ValueError(f"Concept {concept_id} not found")
            
            for entry in entries:
                if entry["concept_id"] == concept_id:
                    synonyms = entry.setdefault("synonyms", {})
                    synonyms.setdefault(lang, [])
                    if old_value not in synonyms[lang]:
                        raise ValueError(f"Old synonym not found: {old_value}")
                    if new_value not in synonyms[lang]:
                        synonyms[lang].append(new_value)    # aggiunge nuovo sinonimo
                    synonyms[lang] = [v for v in synonyms[lang] if v != old_value]
                    break
            
        #-------ADD ABBREVIATION-------------------
        elif op["op"] == "add_abbreviation":
            concept_id = op["concept_id"]
            value = op["value"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if not search_result["results"]:
                raise ValueError(f" Concept {concept_id} not found")
            
            for entry in entries:
                if entry["concept_id"] == concept_id:
                    abbreviations = entry.setdefault("abbreviations", [])
                    if value not in abbreviations:
                        abbreviations.append(value)
                    break
        
        #-------ADD PATTERN---------------------
        elif op["op"] == "add_pattern":
            concept_id = op["concept_id"]
            regex = op["regex"]
            description = op["description"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if not search_result["results"]:
                raise ValueError(f"Concept {concept_id} not found")

            for entry in entries:
                if entry["concept_id"] == concept_id:
                    patterns = entry.setdefault("patterns", [])
                    patterns.append({"regex": regex, "description": description})
                    break
        
        #-------UPDATE CATEGORY------------------------
        elif op["op"] == "update_category":
            concept_id = op["concept_id"]
            category = op["category"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if not search_result["results"]:
                raise ValueError(f"Concept {concept_id} not found")
            
            for entry in entries:
                if entry["concept_id"] == concept_id:
                    entry["category"] = category
                    break
        
        #-------UPDATE SEMANTIC CATEGORY---------------
        elif op["op"] == "update_semantic_category":
            concept_id = op["concept_id"]
            semantic_category = op["semantic_category"]

            search_result = dictionary_search(ctx, str(p), None, None, concept_id)
            if not search_result["results"]:
                raise ValueError(f"Concept {concept_id} not found")
            
            for entry in entries:
                if entry["concept_id"] == concept_id:
                    entry["semantic_category"] = semantic_category
                    break

        else:
            raise ValueError(f"Unsupported operation: {op['op']}")

    if dry_run:
        ctx.mark_dry_run(patch)
        return {"status": "dry_run_ok", "preview": new_dict}

    ctx.require_dry_run(patch)
    ctx.schema_validate("dictionary", new_dict)

    output_path = _next_versioned_path(p)
    ctx.write_json(output_path, new_dict)

    return {"status": "committed", "output_path": str(output_path)}

def dictionary_bulk_suggest(ctx: MCPContext, terms: List[str], path: str | None = None, expected_category: str | None = None) -> Dict[str, Any]:
    # suggerimento
    
    if not terms: 
        return {"suggestions": []}
    
    dictionary_path = path or "data/dictionary_v0.1.json"
    p = ctx.ensure_within_root(dictionary_path)
    dictionary = ctx.read_json(p)

    suggestions = []
    entries = dictionary.get("entries", [])

    for term in terms:
        t = (term or "").strip().lower()
        if not t:
            continue 

        hits = []
        for e in entries:
            cid = e.get("concept_id")
            cat = e.get("category")

            if expected_category and cat != expected_category:
                continue

            #synonyms
            for lang, syns in (e.get("synonyms") or {}).items():
                for syn in syns:
                    if syn and syn in t:
                        hits.append({
                            "concept_id": cid,
                            "match_type": "synonym",
                            "matched_value": syn,
                            "confidence": 0.7  
                        })
                        
            # abbreviations
            for abbr in e.get("abbreviations") or []:
                if abbr and abbr in t:
                    hits.append({
                        "concept_id": cid,
                        "match_type": "abbreviation",
                        "matched_value": abbr,
                        "confidence": 0.6
                    })

            # patterns
            for ptn in e.get("patterns") or []:
                regex = ptn.get("regex")
                if regex:
                    try:
                        if re.search(regex, t):
                            hits.append({
                                "concept_id": cid,
                                "match_type": "pattern",
                                "matched_value": regex,
                                "confidence": 0.5
                            })
                    except re.error:
                        pass

        suggestions.append({"term": term, "candidates": hits})

    return {"suggestions": suggestions}
    
    

