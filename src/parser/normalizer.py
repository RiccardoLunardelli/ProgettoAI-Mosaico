import argparse
import json
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

EVIDENCE_KEYS = {"Name", "Alias", "MultiLanguageDescription", "Label", "Category", "Priority"}

class EvidenceFields(BaseModel):
    # Campi di evidenza (non usati per matching, ma utili per audit/debug)
    Name: Optional[str] = None
    Alias: Optional[str] = None
    MultiLanguageDescription: Optional[Any] = None
    Label: Optional[str] = None
    Category: Optional[str] = None
    Priority: Optional[int] = None

class VariableNormalized(BaseModel):   
    # variabili normalizzate (Core)
    section: str
    source_key: str
    raw_text: Optional[str] = None
    normalized_text: Optional[str] = None
    measurement: Optional[str] = None
    type: Optional[int] = None
    enabled: bool
    evidence_fields: EvidenceFields
    device_id: Optional[str] = None

class DataloggerPenEntry(BaseModel):
    # Supporto per DatallogerPen (non usata per matching, solo evidenza)
    Pen: Optional[str] = None
    Labels: Optional[List[Dict[str, Any]]] = None
    Measurement: Optional[str] = None
    Name: Optional[str] = None
    Type: Optional[int] = None

class SupportOnly(BaseModel):   
    # Seziondi di supporto estratte dal template
    DataloggerPen: List[DataloggerPenEntry] = Field(default_factory=list)
    TemplateGuid: Optional[str] = None

class NormalizedTemplate(BaseModel):
    # Output finale del normalizzatore
    template_guid: Optional[str] = None
    schema_tipo_version: str
    generated_at: str
    variables: List[VariableNormalized]
    support_only: SupportOnly

def model_dump(model: BaseModel) -> Dict[str, Any]:
    # Serializza modelli Pydantic in modo compatibile tra v1/v2.

    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()

def load_json(path: str) -> Any:
    # caricamento file json

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def resolve_path(data: Any, path: str) -> Any:
    # risolve JSON path tipo $.A.B.C

    if not path.startswith("$."):
        return None
    parts = path[2:].split(".")
    cur = data
    for part in parts:
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur

def cleanup_measurement(value: Optional[str]) -> Optional[str]:
    # Normalizzazione misure errate (es. "Â°C" -> "°C").

    if not isinstance(value, str):
        return value
    value = value.replace("Â°C", "°C")
    value = value.replace("Â°F", "°F")
    value = value.replace("Â°", "°")
    value = value.replace("Â", "")
    return value

def extract_device_id_from_name(name: Optional[str]) -> Optional[str]:
    # es: "Read0_P02T04D01" -> "P02T04D01"

    if not isinstance(name, str):
        return None
    m = re.search(r"_([A-Z]\d{2}T\d{2}D\d{2})$", name)
    return m.group(1) if m else None

def empty_to_none(value: Optional[str]) -> Optional[str]:
    # converte stringhe vuote a None

    if isinstance(value, str) and value.strip() == "":
        return None
    return value

def cleanup_text_encoding(value: Optional[str]) -> Optional[str]:
    # corregge encoding errati prima della normalizzazione

    if not isinstance(value, str):
        return value
    value = value.replace("Â°", "°")
    value = value.replace("Ã ", "à")
    value = value.replace("Ã¨", "è")
    value = value.replace("Ã¹", "ù")
    return value

def normalize_text(text: Optional[str]) -> Optional[str]:
    # Normalizzazione testo

    if text is None:
        return None
    text = cleanup_text_encoding(text)
    txt = text.lower().strip()
    txt = re.sub(r"[^\w\s%=/]", " ", txt, flags=re.UNICODE)
    txt = txt.replace("_", " ")
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt

def parse_json_field(value: Any) -> Any:
    # parse json in stringa
 
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value

def apply_normalizations(extracted: Dict[str, Any], normalizations: Dict[str, Any]) -> Dict[str, Any]:
    # applica la normalizzazione guidata dallo schema

    parsed_fields = normalizations.get("parse_json_fields", [])
    for field in parsed_fields:
        if field in extracted:
            extracted[field] = parse_json_field(extracted[field])
    if normalizations.get("measurement_cleanup"):
        if "Measurement" in extracted:
            extracted["Measurement"] = cleanup_measurement(extracted["Measurement"])
            extracted["Measurement"] = empty_to_none(extracted["Measurement"])
    return extracted

def build_variable(section_name: str, source_key: str, extracted: Dict[str, Any]) -> VariableNormalized:
    # costruisce una variabile normalizzata dai campi estratti

    raw_text = extracted.get("Description")
    enabled = True
    if "Enable" in extracted and extracted["Enable"] is False:
        enabled = False

    evidence = {}
    for key in EVIDENCE_KEYS:
        if key in extracted and extracted[key] is not None:
            evidence[key] = extracted[key]
    
    device_id = extract_device_id_from_name(extracted.get("Name"))

    return VariableNormalized(
        section=section_name,
        source_key=source_key,
        raw_text=raw_text,
        normalized_text=normalize_text(raw_text),
        measurement=extracted.get("Measurement"),
        type=extracted.get("Type"),
        enabled=enabled,
        evidence_fields=EvidenceFields(**evidence),
        device_id=device_id
    )

def normalize_template(raw_template: Dict[str, Any], schema: Dict[str, Any]) -> NormalizedTemplate:
    # crea il template normalizzato seguendo le regole dello schema

    schema_version = schema["schema_tipo_version"]
    variables: List[VariableNormalized] = []

    support = SupportOnly()
    template_guid: Optional[str] = None

    for section in schema.get("sections", []):
        name = section["name"]  # ContinuosRead | Parameter etc..
        role = section["role"]  # support_only | core
        path = section["path"]  # $.ContinuosRead.Values | $.Parameters.Values etc..
        value_type = section["value_type"]  # scalar | keyed_map 

        data = resolve_path(raw_template, path)     # risolve path tipo $.

        if value_type == "scalar": # per template guid
            if name == "TemplateGuid":
                template_guid = data
                support.TemplateGuid = data
            continue

        if value_type == "keyed_map": # per le variabili
            if not isinstance(data, dict):
                data = {}

            extract_fields = section.get("extract_fields", [])
            normalizations = section.get("normalizations", {})

            for map_key, entry in data.items():
                if not isinstance(entry, dict):
                    continue

                extracted = {k: entry[k] for k in extract_fields if k in entry}
                extracted = apply_normalizations(extracted, normalizations)

                if role == "core":
                    variables.append(build_variable(name, map_key, extracted))
                elif role == "support_only":
                    if name == "DataloggerPen":
                        support.DataloggerPen.append(DataloggerPenEntry(**extracted))

    return NormalizedTemplate(
        template_guid=template_guid,
        schema_tipo_version=schema_version,
        generated_at=datetime.now(timezone(timedelta(hours=1))).isoformat(),
        variables=variables,
        support_only=support,
    )

def main() -> None:
    # Entry point --> carica input, normalizza e screive output

    parser = argparse.ArgumentParser()
    parser.add_argument("--template", required=True)
    parser.add_argument("--schema", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    raw_template = load_json(args.template)
    schema = load_json(args.schema)

    normalized = normalize_template(raw_template, schema)
    payload = model_dump(normalized)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()