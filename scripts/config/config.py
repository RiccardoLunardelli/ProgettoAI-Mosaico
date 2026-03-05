from datetime import timezone, timedelta, datetime
from pathlib import Path
import yaml

ARTIFACTS = {
    "dictionary": {
        "input_path": "",
        "patch_path":"/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/mcp_server/patch/dictionary/manual_patch_addabr.json",
        "matching_path": "output_dir/matching_report_v0.1.json",
        "template_base_path": "data//template_base/template_base_v0.1.json",
    },
    "kb": {
        "input_path": "",
        "patch_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/mcp_server/patch/kb/patch_manual_addkbrule.json",
        "matching_path": "output_dir/matching_report_v0.1.json",
    },
    "template_base": {
        "input_path": "",
        "patch_path": "",
        "template_base_path": "data//template_base/template_base_v0.1.json",
        "matching_path": "output_dir/matching_report_v0.1.json",
    },
    "template": {
        "input_path": "",
        "matching_path": "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/output_dir/matching_report_v0.1.json",
        "actions_path": "mcp_server/patch/template_real/manual_actions.json",
        "template_base_path": "data//template_base/template_base_v0.1.json",
    },
    "device_list": {
        "input_path": "",
    },
}

RUNS_ROOT = Path("runs")
TIMEZONE = timezone(timedelta(hours=1))

def load_config(path: str) -> dict:
    # apre file yml

    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def generate_run_id() -> str:
    # genera id della run

    ts = datetime.now(TIMEZONE).strftime("%Y%m%d_%H%M%S")
    return f"run{ts}"
