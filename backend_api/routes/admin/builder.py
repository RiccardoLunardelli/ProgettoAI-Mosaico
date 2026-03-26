from backend_api.schemas.admin import CreateTemplateAdmin
import types
from typing import Any, get_args, get_origin, Union

FIELD_TYPE_MAP = {
    str: "TextReadOnly",
    int: "Numeric",
    bool: "Boolean",
    float: "Numeric",
}

def resolve_type(annotation: Any) -> str:
    # estrae il tipo della variabile escludendo None (str | None --> str)

    origin = get_origin(annotation)
    
    # gestisce sia Optional[str] (typing.Union) che str | None (types.UnionType)
    if origin is Union or isinstance(annotation, types.UnionType):
        inner = [a for a in get_args(annotation) if a is not type(None)]
        if inner:
            annotation = inner[0]
    
    return FIELD_TYPE_MAP.get(annotation, "Object")

def build_properties(pydantic_instance) -> dict:
    # Produce Properties. Legge i model_fields (campi della classe) dell'istanza e mappa ogni campo al suo tipo. 

    return {
        field_name: resolve_type(field_info.annotation) for field_name, field_info in pydantic_instance.__class__.model_fields.items()
    }

def builder_section(payload: CreateTemplateAdmin) -> dict:
    result = {}

    for section_name, section_value in payload:

        # oggetto singolo (es. TemplateInfo)
        if hasattr(section_value, "model_fields"):
            result[section_name] = {
                "Properties": build_properties(section_value),
                "Values": section_value.model_dump(exclude_unset=True),
            }
            continue

        # lista vuota o None
        if not isinstance(section_value, list) or not section_value:
            result[section_name] = {"Properties": {}, "Values": {}}
            continue

        # lista di oggetti (ContinuosReads, Parameters)
        properties = build_properties(section_value[0])
        values = {}
        for item in section_value:
            key = getattr(item, "name", None) or getattr(item, "Name", None)
            if not key or not str(key).strip():
                continue
            values[str(key).strip()] = item.model_dump(exclude_unset=True, exclude_none=True)

        result[section_name] = {
            "Properties": properties,
            "Values": values,
        }

    return result