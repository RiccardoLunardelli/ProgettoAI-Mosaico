from pydantic import BaseModel

class DictionaryEditRequest(BaseModel):
    dictionary_name: str 
    dictionary_json: dict

class KbEditRequest(BaseModel):
    kb_name: str
    kb_json: dict

class TemplateBaseEditRequest(BaseModel):
    template_base_name: str 
    template_base_json: dict
