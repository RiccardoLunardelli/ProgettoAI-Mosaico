from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal, Union
import json
from pathlib import Path

#---------TEMPLATE REALE PATCH----------------------
class TemplatePatchSetFields(BaseModel):
    op: Literal["set_fields"]
    section: str 
    source_key: str 
    fields: Dict[str, Any]
    meta: Optional[Dict[str, Any]] = None

class TemplatePatch(BaseModel):
    target: Literal["template"]
    operations: List[TemplatePatchSetFields]

# --------PATCH ACTIONS TEMPLATE------------------
class PatchActionLabelPair(BaseModel):
    it: str
    en: str

class PatchActionTarget(BaseModel):
    concept_id: str
    category: str
    semantic_category: str
    labels: PatchActionLabelPair

class PatchActionPatch(BaseModel):
    set_fields: Dict[str, Any]

class PatchActionMapVariable(BaseModel):
    type: Literal["map_variable"]
    section: str
    source_key: str
    target: PatchActionTarget
    patch: PatchActionPatch
    confidence: float
    reason: str
    evidence: Dict[str, Any]

class PatchActionsTemplate(BaseModel):
    patch_actions_version: str
    generated_at: str
    actions: List[PatchActionMapVariable]

#-------------PATCH ACTIONS-------------------
class PatchAction(BaseModel): 
    action_type: str
    source_key: str
    section: str 
    semantic_category: Optional[str] = None
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

class MatchingEvidence(BaseModel):
    normalized_text: Optional[str] = None
    matched_synonym: Optional[str] = None
    dictionary_entry_id: Optional[str] = None
    category: Optional[str] = None
    semantic_category: Optional[str] = None

class MatchingItem(BaseModel):
    source_key: str
    section: str
    status: str
    technical_reason: Optional[str] = None
    concept_id: Optional[str] = None
    confidence: Optional[float] = None
    evidence: MatchingEvidence
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
    semantic_category: str
    label: ConceptLabel
    description: str

class TemplateBaseCategory(BaseModel):
    id: str
    description: str
    concepts: List[Concept]

class TemplateBase(BaseModel):
    template_base_version: str
    categories: List[TemplateBaseCategory]

#----------TEMPLATE PATCH--------------------
class TemplateBasePatchAddConcept(BaseModel):
    op: Literal["add_base_concept"]
    category_id: str 
    semantic_category: str
    concept_id: str 
    label: ConceptLabel
    description: str 

class TemplateBasePatchRemoveConcept(BaseModel):
    op: Literal["remove_base_concept"]
    concept_id: str 

class TemplateBasePatchUpdateMetadata(BaseModel):
    op: Literal["update_base_metadata"]
    concept_id: str 
    label: Optional[ConceptLabel] = None 
    description: Optional[str] = None 
    category: Optional[str] = None 
    semantic_category: Optional[str] = None

class TemplateBasePatch(BaseModel):
    target: Literal["template_base"]
    operations: List[Union[
        TemplateBasePatchAddConcept,
        TemplateBasePatchRemoveConcept,
        TemplateBasePatchUpdateMetadata
    ]]

# ---------DIZIONARIO-----------------------
class DictionaryPatterns(BaseModel):
    regex: str
    description: str

class DictionaryEntry(BaseModel):
    concept_id: str
    category: str
    semantic_category: str
    synonyms: Dict[str, List[str]]
    abbreviations: List[str]
    patterns: List[DictionaryPatterns]

class Dictionary(BaseModel):
    dictionary_version: str
    language: List[str]
    entries: List[DictionaryEntry]

#-----------DICTIONARY PATCH----------------
class DictionaryPatchAddSynonym(BaseModel):
    op: Literal["add_synonym"]
    concept_id: str
    lang: str
    value: str 

class DictionaryPatchUpdateSynonym(BaseModel):
    op: Literal["update_synonym"]
    concept_id: str 
    lang: str 
    old_value: str 
    new_value: str

class DictionaryPatchAddAbbreviation(BaseModel):
    op: Literal["add_abbreviation"]
    concept_id: str 
    value: str 

class DictionaryPatchAddPattern(BaseModel):
    op: Literal["add_pattern"]
    concept_id: str 
    regex: str 
    description: str

class DictionaryPatchUpdateCategory(BaseModel):
    op: Literal["update_category"]
    concept_id: str
    category: str

class DictionaryPatchAddConcept(BaseModel):
    op: Literal["add_concept"]
    concept_id: str 
    category: str
    semantic_category: str 
    synonyms: Dict[str, List[str]] = Field(default_factory=dict)
    abbreviations: List[str] = Field(default_factory=list)
    patterns: List[DictionaryPatterns] = Field(default_factory=list)

class DictionaryPatchUpdateSemanticCategory(BaseModel):
    op: Literal["update_semantic_category"]
    concept_id: str 
    semantic_category: str

class DictionaryPatch(BaseModel):
    target: Literal["dictionary"]
    operations: List[
        Union[
            DictionaryPatchAddSynonym, 
            DictionaryPatchAddConcept,
            DictionaryPatchUpdateSynonym,
            DictionaryPatchAddAbbreviation,
            DictionaryPatchAddPattern,
            DictionaryPatchUpdateCategory,
            DictionaryPatchUpdateSemanticCategory,
        ]
    ]

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

#-----------KB PATCH----------------------
class KBPatchAddRule(BaseModel):
    op: Literal["add_kb_rule"]
    scope_id: str 
    source_type: str 
    source_key: str 
    concept_id: str 
    reason: str 
    evidence: str

class KBPatchUpdateRule(BaseModel):
    op: Literal["update_kb_rule"]
    scope_id: str 
    source_type: str 
    source_key: str 
    concept_id: Optional[str] = None
    reason: Optional[str] = None 
    evidence: Optional[str] = None

class KBPatch(BaseModel):
    target: Literal["kb"]
    operations: List[Union[KBPatchAddRule, KBPatchUpdateRule]]

# GENERAZIONI
SCHEMA_OUT = {
    "template/template_patch_v0.1.schema.json": TemplatePatch,
    "patch_actions/patch_actions_v0.1.schema.json": PatchActionsReport,
    "matching/matching_report_v0.1.schema.json": MatchingReport,
    "template_base/template_base_v0.1.schema.json": TemplateBase,
    "template_base/template_base_patch_v0.1.schema.json": TemplateBasePatch,
    "dictionary/dictionary_v0.1.schema.json": Dictionary,
    "dictionary/dictionary_patch_v0.1.schema.json": DictionaryPatch,
    "kb/kb_v0.1.schema.json": KB,
    "kb/kb_patch_v0.1.schema.json": KBPatch,
    "patch_actions/patch_actions_template_v0.1.schema.json": PatchActionsTemplate,
}

def write_schema(name: str, model: BaseModel, out_dir: Path) -> None:
    schema = model.model_json_schema()
    out_path = out_dir/name
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote: {out_path}")

if __name__ == "__main__":
    schema = PatchActionsReport.model_json_schema()
    out_dir = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/schemas")
    for filename, model in SCHEMA_OUT.items():
        write_schema(filename, model, out_dir)