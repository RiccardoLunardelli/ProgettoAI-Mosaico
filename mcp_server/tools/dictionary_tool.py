from typing import Any, Dict, List
from ..core import MCPContext

def dictionary_search(ctx: MCPContext, text: str, lang: str) -> Dict[str, Any]:
    # ricerca nel dizionario

    dictionary = ctx.read_json(ctx.repo_root/"data"/"dictionary_v0.1.json")
    results = []
    for entry in dictionary.get("entries", []):
        for syn in entry.get("synonyms", {}).get(lang, []):
            if syn in text:
                results.append({
                    "concept_id": entry.get("concept_id"),
                    "category": entry.get("category"),
                    "matched_synonym": syn,
                })
    return {"results": results}

def dictionary_upsert(ctx: MCPContext, entry: Dict) -> Dict:
    # Inserisce/aggiorna una entry nel dizionario

    path = ctx.read_json(ctx.repo_root/"data"/"dictionary_v0.1.json")
    dictionary = ctx.read_json(path)
    dictionary.setdefault("entries", []).append(entry)
    ctx.write_json(path, dictionary)
    return {"status": "ok"}

def dictionary_bulk_suggest(ctx: MCPContext, terms: List[str]) -> Dict[str, Any]:
    # suggerimento

    return {"suggestions": []}