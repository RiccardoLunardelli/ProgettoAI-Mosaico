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
    # data/dictionary_v0.1.json -> data/dictionary_v0.2.json

    m = re.search(r"_v(\d+)\.(\d+)\.json$", path.name)
    if not m:
        raise ValueError(f"Invalid versioned filename: {path.name}")
    major, minor = int(m.group(1)), int(m.group(2))
    return path.with_name(path.name.replace(f"_v{major}.{minor}.json", f"_v{major}.{minor+1}.json"))

def dictionary_upsert(ctx: MCPContext, path: str, patch: Dict, dry_run: bool) -> Dict:
    # Inserisce/aggiorna una entry nel dizionario

    p = ctx.ensure_within_root(path)
    dictionary = ctx.read_json(p)

    ctx.schema_validate("dictionary", dictionary)

    new_dict = copy.deepcopy(dictionary)
    entries = new_dict.setdefault("entries", [])

    for op in patch.get("operations", []):
        # -----ADD SYNONYM-------
        if op["op"] == "add_synonym":
            concept_id = op["concept_id"]
            lang = op["lang"]
            value = op["value"]

            search_result = dictionary_search(
                ctx=ctx,
                path=str(p),
                text=None,
                lang=None,
                concept_id=concept_id,
            )
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

            search_result = dictionary_search(
                ctx=ctx,
                path=str(p),
                text=None,
                lang=None,
                concept_id=concept_id,
            )
            if search_result["results"]:
                raise ValueError(f"Concept {concept_id} already exists")

            new_entry = {
                "concept_id": concept_id,
                "category": op["category"],
                "synonyms": op.get("synonyms", {}),
                "abbreviations": op.get("abbreviations", []),
                "patterns": op.get("patterns", []),
            }
            entries.append(new_entry)   # aggiunge nuovo concetto a dizionario
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

def dictionary_bulk_suggest(ctx: MCPContext, terms: List[str]) -> Dict[str, Any]:
    # suggerimento
    return {"suggestions": []}
