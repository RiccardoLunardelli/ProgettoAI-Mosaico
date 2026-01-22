from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from pathlib import Path

#-------------PATCH ACTIONS-------------------
class PatchAction(BaseModel):
    action_type: str
    source_key: str
    section: str 
    normalized_text: Optional[str] = None
    concept_id: Optional[str] = None
    condifence: Optional[float] = None 
    reason: str
    evidence_ref: str 
    candidate_concepts: Optional[List[str]] = None
    suggested_category: Optional[str] = None

class PatchActionsReport(BaseModel):
    patch_actions_version: str
    generated_at: str
    source_matching_version: Optional[str] = None
    actions: List[PatchAction]


# ------------MATCHING REPORT--------------------
class MatchingCandidate(BaseModel):
    concept_id: str
    score: float 

class MatchingItem(BaseModel):
    source_key: str
    section: str
    status: str
    technical_reason: Optional[str] = None
    concept_id: Optional[str] = None
    confidence: Optional[float] = None
    evidence: Dict[str, Any]
    candidates: Optional[List[MatchingCandidate]] = None

class MatchingReport(BaseModel):
    matching_version: str
    template_guid: Optional[str] = None
    generated_at: str
    items: List[MatchingItem]

# -----------TEMPLATE BASE -------------------
class ConceptLabel(BaseModel):
    it: str
    en: str

class Concept(BaseModel):
    concept_id: str
    category: str
    label: ConceptLabel
    description: str

class TemplateBaseCategory(BaseModel):
    id: str
    description: str
    concepts: List[Concept]

class TemplateBase(BaseModel):
    template_base_version: str
    categories: List[TemplateBaseCategory]

# ---------DIZIONARIO-----------------------
class DictionaryPatterns(BaseModel):
    regex: str
    description: str

class DictionaryEntry(BaseModel):
    concept_id: str
    category: str
    synonyms: Dict[str, List[str]]
    abbreviations: List[str]
    patterns: List[DictionaryPatterns]

class Dictionary(BaseModel):
    dictionary_version: str
    language: List[str]
    entries: List[DictionaryEntry]

# -------------KB-------------------------
class KBScopeMatch(BaseModel):
    template_guid: str
    type_fam: Optional[str] = None
    device_role: Optional[str] = None
    enum: Optional[str] = None
    device_id: Optional[str] = None

class KBScope(BaseModel):
    scope_id: str
    match: KBScopeMatch
    source: Optional[Dict[str, Any]] = None

class KBMapping(BaseModel):
    scope_id: str
    source_type: str
    source_key: str
    concept_id: str
    reason: str
    evidence: str

class KBExceptions(BaseModel):
    blacklist: List[Dict[str, Any]]

class KBAudit(BaseModel):
    notes: List[str]

class KB(BaseModel):
    kb_version: str
    generated_at: str
    template_base_version: str
    dictionary_version: str
    scopes: List[KBScope]
    mappings: List[KBMapping]
    exceptions: KBExceptions
    audit: KBAudit

# GENERAZIONI
SCHEMA_OUT = {
    "patch_actions_v1.schema.json": PatchActionsReport,
    "matching_report_v1.schema.json": MatchingReport,
    "template_base_v1.schema.json": TemplateBase,
    "dictionary_v0.1.schema.json": Dictionary,
    "kb_v0.1.schema.json": KB,
}

def write_schema(name: str, model: BaseModel, out_dir: Path) -> None:
    schema = model.model_json_schema()
    out_path = out_dir/name
    out_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote: {out_path}")

if __name__ == "__main__":
    schema = PatchActionsReport.model_json_schema()
    out_dir = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/schemas")
    for filename, model in SCHEMA_OUT.items():
        write_schema(filename, model, out_dir)