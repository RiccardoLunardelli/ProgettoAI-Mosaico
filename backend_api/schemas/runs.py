from pydantic import BaseModel, UUID4

from pydantic import BaseModel, UUID4
from typing import Literal, Dict, Any


class RunTemplateRequest(BaseModel):
    template_name: str
    validate_only: bool = True

class RunTemplateStartRequest(BaseModel):
    id: str
    dictionary_id: str 
    kb_id: str 
    template_base_id: str 
    device_context_id: str 


class RunTemplateLlmRequest(BaseModel):
    run_id: str
    llm_model: str | None = None

class RunTemplateFinishRequest(BaseModel):
    run_id: str
    validate_only: bool = True
    apply_llm: bool = False
    llm_patch_actions: dict | None = None

class RunDictionaryRequest(BaseModel):
    id: str
    validate_only: bool = True
    mode: str
    run_id: str | None = None
    manual_mode: str | None = None
    patch_json: dict | None = None

class RunKbRequest(BaseModel):
    id: str
    validate_only: bool = True
    patch_json: dict

class RunTemplateBaseRequest(BaseModel):
    id: str
    validate_only: bool = True
    patch_json: dict

class RunDeviceListRequest(BaseModel):
    id: str
    store: str
    device_list_name: str
    validate_only: bool = True
    config_id: str | None = None

class RunPatchPreviewRequest(BaseModel):
    id: UUID4
    artifact_type: Literal["dictionary", "kb", "template_base"]
    patch_json: Dict[str, Any]
