from mcp_server.server import dictionary_upsert
from mcp_server.core import MCPContext

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

def generate_run_id() -> str:
    ts = datetime.now(TIMEZONE).strftime("%Y%m%d_%H%M%S")
    return f"run{ts}"

def summarize_dictionary_diff(before: dict, after: dict) -> list[str]:
    before_entries = {e["concept_id"]: e for e in before.get("entries", [])}
    after_entries = {e["concept_id"]: e for e in after.get("entries", [])}
    summary = []

    # nuovi concetti
    for concept_id in sorted(set(after_entries) - set(before_entries)):
        summary.append(f"add_concept: {concept_id}")

    # sinonimi aggiunti
    for concept_id in sorted(set(after_entries) & set(before_entries)):
        b_syn = before_entries[concept_id].get("synonyms", {})
        a_syn = after_entries[concept_id].get("synonyms", {})
        for lang in sorted(set(a_syn) | set(b_syn)):
            b_vals = set(b_syn.get(lang, []))
            a_vals = set(a_syn.get(lang, []))
            for val in sorted(a_vals - b_vals):
                summary.append(f"add_synonym: {concept_id} [{lang}] '{val}'")

    return summary


ARTIFACTS = {
    "dictionary": {
        "input_path": "data/dictionary_v0.1.json",
        "patch_path": "mcp_server/runs/manual_patch_001.json",
        "input_version": "v0.1",
    }
}

ARTIFACT = "dictionary"
TIMEZONE = timezone(timedelta(hours=1))
RUNS_ROOT = Path("mcp_server/runs")

cfg = ARTIFACTS[ARTIFACT]
input_path = cfg["input_path"]
patch_path = cfg["patch_path"]

run_id = generate_run_id()
timestamp = datetime.now(TIMEZONE).isoformat()
run_dir = RUNS_ROOT / run_id
run_dir.mkdir(parents=True, exist_ok=True)

with open(patch_path, "r", encoding="utf-8") as f:
    patch = json.load(f)

with open(input_path, "r", encoding="utf-8") as f:
    artifact = json.load(f)

# DRY RUN
dry_run_result = dictionary_upsert(
    path=input_path,
    patch=patch,
    dry_run=True,
)
preview = dry_run_result.get("preview")

# COMMIT
commit_result = dictionary_upsert(
    path=input_path,
    patch=patch,
    dry_run=False,
)
output_path = commit_result.get("output_path")

# DIFF (computed by run)
ctx = MCPContext(repo_root=".")
diff = summarize_dictionary_diff(artifact, preview)

run_report = {
    "run_id": run_id,
    "timestamp": timestamp,
    "target": {
        "artifact_type": ARTIFACT,
        "input_path": input_path,
        "output_path": output_path,
        "input_version": cfg["input_version"],
    },
    "patch": {
        "patch_path": patch_path,
        "operations_count": len(patch.get("operations", [])),
    },
    "execution": {
        "dry_run": True,
        "committed": True,
        "status": "success",
    },
    "diff_summary": {
        "diff": diff,
    },
}

report_path = run_dir / "run_report.json"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(run_report, f, indent=2, ensure_ascii=False)
print("run eseguito con successo. Run salvato")
