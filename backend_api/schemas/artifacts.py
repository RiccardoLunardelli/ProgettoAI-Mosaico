from pydantic import BaseModel

class DictionaryEditRequest(BaseModel):
    id: str 
    dictionary_json: dict

class KbEditRequest(BaseModel):
    id: str
    kb_json: dict

class TemplateBaseEditRequest(BaseModel):
    id: str 
    template_base_json: dict
