from pydantic import BaseModel, UUID4

class RunTemplateRequest(BaseModel):
    template_name: str
    validate_only: bool = True

class RunTemplateStartRequest(BaseModel):
    template_name: str

class RunTemplateLlmRequest(BaseModel):
    run_id: str
    llm_model: str | None = None

class RunTemplateFinishRequest(BaseModel):
    run_id: str
    template_name: str
    validate_only: bool = True
    apply_llm: bool = False
    llm_patch_actions: dict | None = None

class RunDictionaryRequest(BaseModel):
    dictionary_name: str
    validate_only: bool = True
    mode: str
    run_id: str | None = None
    manual_mode: str | None = None
    patch_json: dict | None = None

class RunKbRequest(BaseModel):
    kb_name: str
    validate_only: bool = True
    patch_json: dict

class RunTemplateBaseRequest(BaseModel):
    template_base_name: str
    validate_only: bool = True
    patch_json: dict

class RunDeviceListRequest(BaseModel):
    store: str
    device_list_name: str
    validate_only: bool = True
