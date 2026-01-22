from mcp_server.server import template_apply_patch, template_save, schema_validate
from mcp_server.tools.template_tool import apply_dictionary_patch

import json
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta

def generate_run_id() -> str:
    ts = datetime.now(TIMEZONE).strftime("%Y%m%d_%H%M%S")
    return f"run{ts}"

def next_versioned_path(path: str) -> str:
    # data/foo_v0.1.json -> data/foo_v0.2.json
    p = Path(path)
    m = re.search(r"_v(\d+)\.(\d+)\.json$", p.name)
    if not m:
        raise ValueError(f"Invalid versioned filename: {p.name}")

    major, minor = int(m.group(1)), int(m.group(2))
    return str(p.with_name(p.name.replace(f"_v{major}.{minor}.json", f"_v{major}.{minor+1}.json")))

# CONFIG (scalable per artefatti)
ARTIFACTS = {
    "dictionary": {
        "schema_id": "dictionary",
        "input_path": "data/dictionary_v0.1.json",
        "patch_path": "mcp_server/runs/manual_patch_001.json",
        "input_version": "v0.1",
        "output_version": "v0.2",
    }
}

ARTIFACT = "dictionary"
TIMEZONE = timezone(timedelta(hours=1))
RUNS_ROOT = Path("mcp_server/runs")

# LOAD CONFIG
cfg = ARTIFACTS[ARTIFACT]
input_path = cfg["input_path"]
output_path = next_versioned_path(input_path)
patch_path = cfg["patch_path"]
schema_id = cfg["schema_id"]

run_id = generate_run_id()
timestamp = datetime.now(TIMEZONE).isoformat()
run_dir = RUNS_ROOT / run_id
run_dir.mkdir(parents=True, exist_ok=True)

# LOAD INPUTS
with open(patch_path, "r", encoding="utf-8") as f:
    patch = json.load(f)

with open(input_path, "r", encoding="utf-8") as f:
    artifact = json.load(f)

# VALIDATE + DRY RUN
schema_validate(schema_id, artifact)

dry_run_result = template_apply_patch(
    input_path,
    patch,
    dry_run=True
)
print("DRY RUN ESEGUITO")

# COMMIT (nuova versione)
preview = apply_dictionary_patch(artifact, patch)
schema_validate(schema_id, preview)
template_save(output_path, preview)
print(f"NUOVA VERSIONE DEL {ARTIFACT.upper()} SALVATA: {output_path}")

# RUN REPORT
run_report = {
    "run_id": run_id,
    "timestamp": timestamp,
    "target": {
        "artifact_type": ARTIFACT,
        "input_path": input_path,
        "output_path": output_path,
        "input_version": cfg["input_version"],
        "output_version": cfg["output_version"],
    },
    "patch": {
        "patch_path": patch_path,
        "patch_type": "manual_approved",
        "operations_count": len(patch.get("operations", [])),
    },
    "execution": {
        "dry_run": True,
        "committed": True,
        "status": "success",
    },
    "diff_summary": {
        "changed_paths": dry_run_result.get("diff", []),
        "operations_applied": patch.get("operations", []),
    },
    "checks": {
        "schema_validated": True,
        "dry_run_required": True,
        "dry_run_performed": True,
    },
}

report_path = run_dir / "run_report.json"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(run_report, f, indent=2, ensure_ascii=False)

print(f"RUN REPORT SALVATO: {report_path}")
