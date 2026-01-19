from __future__ import annotations
import sys
from dataclasses import dataclass
import json
import re
from typing import Any, Dict, Iterable, List, Optional, Tuple
from pathlib import Path

from pydantic import BaseModel

class NormalizedVariable(BaseModel):
    id: str    # Id della variabile (ad ex. ContinuosReads:Read12)
    source_section:  str   # Sezione del template (ex: ContinuosReads)
    raw_key: str   # Chiave della variabile dentro Values (Read0)
    raw_fields: Dict[str, Any]  # dump dei campi della variabile
    text_sources: dict[str, Any]    # sotto-dizionario con testo potenzialmente utile
    tokens: List[str]   # testo utile trasformato in forma confrontabile
    unit: Optional[str] # Unita di misura pulita
    var_type: Optional[int | str]   # il valore type nel template
    parse_warnings: List[str]   # problemi non bloccanti trovati durante il parsing

def load_template(path: str) -> dict:
    """ lettura del file json """

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}

def _clean_text(value: str) -> str:
    """ pulizia per campi derivati """

    value = (
        value
        .replace("Â°C", "°C")
        .replace("\\u0027", "'")
        .replace("Â°F", "F")
    )
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    return value

def _parse_multilanguage(raw: Any, warnings: List[str]) -> Optional[Dict[str, str]]:
    """  """
    if not isinstance(raw, str):
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        warnings.append("multilanguage_invalid_json")
        return None
    if not isinstance(parsed, dict):
        warnings.append("multilanguage_not_dict")
        return None
    out: Dict[str, str] = {}
    for k, v in parsed.items():
        if isinstance(v, str):
            out[k] = _clean_text(v)
    return out or None

def _tokenize(texts: List[str]) -> List[str]:
    """  prende lista di stringhe gia pulite e le normalizza"""

    combined = " ".join(t for t in texts if t)
    combined = combined.lower() # lowercase
    combined = combined.replace("_", " ").replace("-", " ") # underscore e trattini -> spazio
    combined = re.sub(r"[^\w\s]", " ", combined) 
    combined = re.sub(r"\s+", " ", combined).strip()
    if not combined:
        return []
    tokens = combined.split(" ")
    seen = set()
    deduped: List[str] = []
    for tok in tokens:
        seen.add(tok)
        deduped.append(tok)
    return deduped

def _iter_sections(obj: Any, path: str = "root") -> Iterable[Tuple[str, dict]]:
    """ scansiona il template """

    if isinstance(obj, dict):
        values = obj.get("Values")  # trova dict con chiave Values
        if isinstance(values, dict):    
            yield path, obj # path serve a creare source_section utile (es. root/ContinuosReads)
        for k, v in obj.items():
            if isinstance(k, str):
                child_path = f"{path}/{k}"
            else:
                child_path = f"{path}/<key>"
            yield from _iter_sections(v, child_path)
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            yield from _iter_sections(item, f"{path}[{idx}]")

def extract_normalized_variables(template: dict) -> List[NormalizedVariable]:
    """ funzione principale """

    results: List[NormalizedVariable] = []
    if not isinstance(template, dict):
        return results

    #per ogni sezione con Values crea un NormalizedVariable
    for section_path, section_obj in _iter_sections(template):
        values = section_obj.get("Values")
        if not isinstance(values, dict):
            continue

        for raw_key, raw_fields in values.items():  # raw_key = chiave della variabile || raw_fields = dict
            if not isinstance(raw_fields, dict):
                continue

            warnings: List[str] = []

            name = raw_fields.get("Name")
            alias = raw_fields.get("Alias")
            label = raw_fields.get("Label")
            description = raw_fields.get("Description")
            mld_raw = raw_fields.get("MultiLanguageDescription")

            #pulizia campi testuali
            text_sources: Dict[str, Any] = {}
            if isinstance(name, str):
                text_sources["name"] = _clean_text(name)
            if isinstance(alias, str):
                text_sources["alias"] = _clean_text(alias)
            if isinstance(label, str):
                text_sources["label"] = _clean_text(label)
            if isinstance(description, str):
                text_sources["description"] = _clean_text(description)

            # parse Multilanguage
            multilanguage = _parse_multilanguage(mld_raw, warnings)
            if multilanguage:
                text_sources["multilanguage"] = multilanguage

            # costruisce tokens
            token_inputs: List[str] = []
            for key in ("label", "description", "name", "alias"):
                v = text_sources.get(key)
                if isinstance(v, str):
                    token_inputs.append(v)
            if isinstance(multilanguage, dict):
                token_inputs.append(multilanguage.get("it", ""))
                token_inputs.append(multilanguage.get("en", ""))
            tokens = _tokenize(token_inputs)

            # ricava unit da Measurement
            measurement = raw_fields.get("Measurement")
            unit = _clean_text(measurement) if isinstance(measurement, str) else None

            # var_type prende Type se è int o str
            var_type = raw_fields.get("Type")
            if not isinstance(var_type, (int, str)):
                var_type = None

            source_section = section_path
            raw_key_str = str(raw_key)
            var_id = f"{source_section}:{raw_key_str}"

            results.append(
                NormalizedVariable(
                    id=var_id,
                    source_section=source_section,
                    raw_key=raw_key_str,
                    raw_fields=raw_fields,
                    text_sources=text_sources,
                    tokens=tokens,
                    unit=unit,
                    var_type=var_type,
                    parse_warnings=warnings,
                )
            )

    # ordina il risultato per output
    results.sort(key=lambda v: (v.source_section, v.raw_key))
    return results        

def _cli():
    """ python -m scripts.template_parser <file.json>""" 
    if len(sys.argv) != 2:
        print("usage: python -m scripts.template_parser <path.json>")
        raise SystemExit(1)

    path = sys.argv[1]
    template = load_template(path)
    vars_ = extract_normalized_variables(template)

    print(f"count={len(vars_)}")

    out_dir =  Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir")
    out_path = out_dir / (Path(path).name + ".normalized.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump([v.model_dump() for v in vars_], f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    _cli()
