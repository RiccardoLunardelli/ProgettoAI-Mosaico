from backend_api.schemas.admin import CreateTemplateAdmin
from typing import Any, get_args, get_origin, Union

# Mappa: tipo Python → stringa per "Properties"
FIELD_TYPE_MAP = {
    str: "TextReadOnly",
    int: "Numeric",
    bool: "Boolean",
    float: "Numeric",
}

def _unwrap_type(annotation: Any) -> Any:
    origin = get_origin(annotation)
    if origin is Union:
        args = [a for a in get_args(annotation) if a is not type(None)]
        if len(args) == 1:
            return args[0]
    return annotation

def get_property_type(field_type: Any) -> str:
    base = _unwrap_type(field_type)
    return FIELD_TYPE_MAP.get(base, "Object")

def build_single_item(item) -> dict:

     # serializza senza campi null
    return item.model_dump(exclude_unset=True, exclude_none=True)

def build_properties(item) -> dict:
    """Inferisce Properties dai tipi dei campi del modello."""

    props = {}
    for field_name, field_info in item.__class__.model_fields.items():
        props[field_name] = get_property_type(field_info.annotation)
    return props

def builder_section(payload: CreateTemplateAdmin) -> dict:

    result = {}

    payload_dict = payload.model_dump(exclude_unset=True)
    for section_name, section_value in payload_dict.items():
        # sezione oggetto singolo (TemplateInfo)
        if isinstance(section_value, dict):
            result[section_name] = {
                "Properties": {},
                "Values": section_value,
            }
            continue

        # sezione lista vuota/non valida
        if not isinstance(section_value, list) or not section_value:
            result[section_name] = {"Properties": {}, "Values": {}}
            continue

        # Properties inferite dal primo elemento Pydantic reale
        model_list = getattr(payload, section_name, [])
        if model_list:
            properties = build_properties(model_list[0])
        else:
            properties = {}

        values = {}
        for item in model_list:
            key = getattr(item, "name", None) or getattr(item, "Name", None)
            if not key or not str(key).strip():
                continue
            values[str(key).strip()] = build_single_item(item)

        result[section_name] = {
            "Properties": properties,
            "Values": values,
        }

    return result