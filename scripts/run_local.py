from mcp_server.server import template_apply_patch, template_save
from mcp_server.server import dictionary_search
from mcp_server.server import schema_validate
from mcp_server.tools.template_tool import apply_dictionary_patch
from src.parser.normalizer import load_json

import json
import re
from pathlib import Path


def next_dictionary_version(path: str) -> str:
    # data/dictionary_v0.1.json -> data/dictionary/dictionary_v0.2.json

    p = Path(path)
    m = re.search(r"_v(\d+)\.(\d+)\.json$", p.name)
    if not m:
        raise ValueError(f"Invalid versioned filename: {p.name}")

    major, minor = int(m.group(1)), int(m.group(2))
    next_name = p.name.replace(
        f"_v{major}.{minor}.json",
        f"_v{major}.{minor+1}.json"
    )
    return str(p.with_name(next_name))


input_path = "data/dictionary_v0.1.json"
output_path = next_dictionary_version(input_path)
patch_path = "mcp_server/runs/manual_patch_001.json"

with open(patch_path, "r", encoding="utf-8") as f:
    patch = json.load(f)

with open(input_path, "r", encoding="utf-8") as f:
    dictionary = json.load(f)

# 2. valida schema (se previsto)
schema_validate("dictionary", dictionary)

# 3. dry-run
result = template_apply_patch(
    input_path,
    patch,
    dry_run=True
)
print("DRY RUN RESULT:", result)

# 2. COMMIT: scrivo su NUOVO FILE
preview = apply_dictionary_patch(dictionary, patch)

schema_validate("dictionary", preview)

template_save(
    output_path,
    preview
)

print(f"NEW DICTIONARY VERSION SAVED: {output_path}")