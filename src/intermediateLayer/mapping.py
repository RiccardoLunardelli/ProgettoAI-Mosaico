from __future__ import annotations 

from typing import Any, Dict 

def _get_nested(d: Dict[str, Any], path: list[str]) -> Any:
    # ritorna valori annidati (ex target.artifact_type)

    cur: Any = d
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None 
        cur = cur[key]
    return cur

def extract_run_row(report: Dict[str, Any], artifact_id: str) -> Dict[str, Any]:
    # estrae e ritorna valori dal run report

    run_id = report.get("run_id")
    created_at = report.get("timestamp")
    execution_status = _get_nested(report, ["execution", "status"])
    committed = _get_nested(report, ["execution", "committed"])
    dry_run = _get_nested(report, ["execution", "dry_run_performed"])

    metrics = report.get("metrics") or {}
    mapped_count = metrics.get("matched_count")
    ambiguous_count = metrics.get("ambiguous_count")
    unmapped_count = metrics.get("unmapped_count")
    llm_calls = metrics.get("llm_calls")

    if not run_id:
        raise ValueError("run_report missing run_id")
    if not created_at:
        raise ValueError("run_report missing timestamp")
    if not artifact_id:
        raise ValueError("run_report missing artifact_type in target")
    
    return {
        "run_id": run_id,
        "created_at": created_at,
        "artifact_id": artifact_id,
        "status": execution_status,
        "committed": committed,
        "dry_run_performed": dry_run,
        "mapped_count": mapped_count,
        "ambiguous_count": ambiguous_count,
        "unmapped_count": unmapped_count,
        "llm_calls": llm_calls,
        "report": report,
    }