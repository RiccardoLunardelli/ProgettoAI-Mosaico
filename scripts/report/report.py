from src.metrics_calculation.llm_calculate_metrics import compute_time_metrics, compute_efficiency_metrics, compute_effectiveness_metrics, aggregate_ollama_metrics, compute_quality_metrics, compute_metrics
from scripts.config.config import TIMEZONE, ARTIFACTS
from scripts.matching.matching import get_template_guid
from datetime import datetime
from mcp_server.core import MCPContext
import re
from pathlib import Path
from src.parser.normalizer import load_json
from src.intermediateLayer.postgres_repository import ArtifactRepository

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
artifactRepo = ArtifactRepository(dsn)

def build_run_report(cfg: dict, run_id: str, artifact_type: str, input_path: str, output_path: str, diff: list[str], 
    schema_versions: dict, committed: bool, status: str, validation_block: dict | None, mr: dict | None,
    dictionary_payload: dict | None,kb_payload: dict | None, template_base_path: str | None, template_base_version: str | None,
    llm_attempt: dict | None, actions_payload: dict | None) -> dict:
    # raccoglie tutto, normalizza e ritorna il report della run

    if artifact_type == "template":
        # --EFFICACIA-----
        quality_metrics = compute_quality_metrics(llm_attempt.get("llm_patch_proposed", 0) if llm_attempt else 0, llm_attempt.get("llm_patch_applied", 0) if llm_attempt else 0)
        effectiveness_metrics = compute_effectiveness_metrics(mr, actions_payload, llm_attempt.get("llm_total_tokens", 0) if llm_attempt else 0)
        return {
            "schema_versions": schema_versions,
            "run_id": run_id,
            "timestamp": datetime.now(TIMEZONE).isoformat(),
            "template_guid": get_template_guid(input_path, mr, artifact_type),
            "source_files": {
                "template_path": input_path if artifact_type == "template" else None,
                "dictionary_path": ARTIFACTS["dictionary"]["input_path"],
                "dictionary_version": dictionary_payload.get("dictionary_version") if dictionary_payload else None,
                "kb_path": ARTIFACTS["kb"]["input_path"],
                "kb_version": kb_payload.get("kb_version") if kb_payload else None,
                "template_base_path": template_base_path,
                "template_base_version": template_base_version,
            },
            "metrics": {
                **effectiveness_metrics,

                "llm_calls": llm_attempt.get("llm_calls"),
                "llm_total_sec": llm_attempt.get("llm_total_sec") if llm_attempt else 0.0,
                "llm_avg_sec": llm_attempt.get("llm_avg_sec") if llm_attempt else 0.0,

                "llm_prompt_total_tokens": llm_attempt.get("llm_prompt_total_tokens") if llm_attempt else 0,
                "llm_generate_total_tokens": llm_attempt.get("llm_generate_total_tokens") if llm_attempt else 0,
                "llm_total_tokens": llm_attempt.get("llm_total_tokens") if llm_attempt else 0,
                
                "llm_prompt_time_total_sec": llm_attempt.get("llm_prompt_time_total_sec") if llm_attempt else 0.0,
                "llm_generate_time_total_sec": llm_attempt.get("llm_generate_time_total_sec") if llm_attempt else 0.0,
                
                "llm_generate_tokens_per_sec": llm_attempt.get("llm_generate_tokens_per_sec") if llm_attempt else 0.0,
                "llm_prompt_tokens_per_sec": llm_attempt.get("llm_prompt_tokens_per_sec") if llm_attempt else 0.0,
                "llm_sec_per_1k_tokens": llm_attempt.get("llm_sec_per_1k_tokens") if llm_attempt else 0.0,

                **quality_metrics,

                "warnings_count": len(validation_block.get("warnings", [])) if validation_block else 0,
            },
            "target": {
                "artifact_type": artifact_type,
                "input_path": input_path,
                "output_path": output_path,
            },
            "execution": {
                "dry_run_performed": True,
                "committed": committed,
                "status": status,
            },
            "validation": validation_block,
            "diff_summary": {"changed_paths": diff},
        }
    elif artifact_type == "dictionary":
        return {
            "schema_versions":schema_versions,
            "run_id": run_id,
            "timestamp": datetime.now(TIMEZONE).isoformat(),
            "template_guid": None,
            "source_files": {
                "dictionary_path": input_path,
                "dictionary_version": dictionary_payload.get("dictionary_version") if dictionary_payload else None,
            },
            "target": {
                "artifact_type": artifact_type,
                "input_path": input_path,
                "output_path": output_path,
            },
            "execution": {
                "dry_run_performed": True,
                "committed": committed,
                "status": status,
            },
            "validation": validation_block,
            "diff_summary": {"changed_paths": diff},
        }
    elif artifact_type == "kb":
        return {
        "schema_versions": schema_versions,
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": None,
        "source_files": {
           "kb_path": input_path,
            "kb_version": kb_payload.get("kb_version") if kb_payload else None,
        },
        "target": {
            "artifact_type":artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": validation_block,
        "diff_summary": {"changed_paths": diff},
    }
    elif artifact_type == "template_base":
        return {
        "schema_versions": schema_versions,
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": None,
        "source_files": {
           "template_base_path": input_path,
            "template_base_version": template_base_version,
        },
        "target": {
            "artifact_type":artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": validation_block,
        "diff_summary": {"changed_paths": diff},
    }
    elif artifact_type == "device_list":
         return {
        "schema_versions": schema_versions,
        "run_id": run_id,
        "timestamp": datetime.now(TIMEZONE).isoformat(),
        "template_guid": None,
        "source_files": {
            "device_list_path": input_path,
        },
        "target": {
            "artifact_type":artifact_type,
            "input_path": input_path,
            "output_path": output_path,
        },
        "execution": {
            "dry_run_performed": True,
            "committed": committed,
            "status": status,
        },
        "validation": validation_block,
        "diff_summary": {"changed_paths": diff},
    }

def build_schema_versions(ctx: MCPContext, used_schema_ids: list[str]) -> dict:
    # ritorna le versioni di tutti gli schemi

    out = {}
    for sid in used_schema_ids:
        path = ctx.schema_map.get(sid)
        if path:
            out[sid] = schema_version_from_path(path)
    return out

def schema_version_from_path(schema_path: str) -> str:
    # restituisce la versione dello schema

    m = re.search(r"_v(\d+\.\d+)\.schema\.json$", schema_path)
    return f"v{m.group(1)}" if m else None

def extract_device_list_version(path: str) -> str:
    # estrae versione device list dal nome del file 

    name = Path(path).name

    if name == "device_list.json":
        return "0.0"
    
    m = re.search(r"device_list_context_v(\d+\.\d+)\.json$", name)
    if m:
        return m.group(1)
    return None

def build_report_context(artifact_type, matching_path, template_base_path):
    # salva le versioni degli schemi, dizionario / kb e la versione del template_base

    ctx = MCPContext(repo_root=".")
    used = []
    if matching_path:
        used.append("matching_report")
    if artifact_type == "template":
        used += ["patch_actions_template", "template_patch"]
    if artifact_type == "dictionary":
        used.append("dictionary_patch")
    if artifact_type == "kb":
        used.append("kb_patch")
    if artifact_type == "template_base":
        used.append("template_base_patch")

    schema_versions = build_schema_versions(ctx, used)

    last_dict = artifactRepo.get_last_version_of_artifact("dictionary")
    last_kb = artifactRepo.get_last_version_of_artifact("kb")
    last_tb = artifactRepo.get_last_version_of_artifact("template_base")

    dict_payload = last_dict.get("content") if last_dict else None
    kb_payload = last_kb.get("content") if last_kb else None

    # priorità: versione da DB
    tb_version = None
    if last_tb:
        tb_version = last_tb.get("version") or (last_tb.get("content") or {}).get("template_base_version")


    return schema_versions, dict_payload, kb_payload, tb_version

def build_artifact_versions(artifact_type: str, dict_payload: dict | None, kb_payload: dict | None, template_base_version: str | None, device_list_payload: dict | list | None = None) -> dict:
    # costuisce versioni artefatti per schema versions

    dict_v = dict_payload.get("dictionary_version") if dict_payload else None
    kb_v = kb_payload.get("kb_version") if kb_payload else None
    tb_v = template_base_version
    
    dl_v = None
    if isinstance(device_list_payload, dict):
        dl_v = device_list_payload.get("device_list_version")

    if artifact_type == "template":
        return {
            "dictionary_version": dict_v,
            "kb_version": kb_v,
            "template_base_version": tb_v
        }
    if artifact_type == "dictionary":
        return {"dictionary_version": dict_v}
    if artifact_type == "kb":
        return {"kb_version": kb_v}
    if artifact_type == "template_base":
        return {"template_base_version": tb_v}
    if artifact_type == "device_list":
        return {"device_list_version": dl_v}
    return {}

