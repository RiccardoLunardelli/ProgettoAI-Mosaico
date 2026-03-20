from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import json
from typing import Any

from backend_api.schemas.runs import (
    RunTemplateStartRequest, RunTemplateLlmRequest, RunTemplateFinishRequest,
    RunDictionaryRequest, RunKbRequest, RunTemplateBaseRequest, RunDeviceListRequest
)

from backend_api.utils.deps import get_current_user
from scripts.config.config import RUNS_ROOT, generate_run_id
from src.intermediateLayer.postgres_repository import RunRepository, ArtifactRepository

from scripts.orchestrator import (
    start_template_run, llm_propose_for_run, template_run,
    run_patch, ARTIFACTS,
    summarize_dictionary_diff, summarize_kb_diff, summarize_template_base_diff,
    dictionary_upsert, kb_upsert_mapping, template_apply_patch, run_device_list,
    build_dictionary_suggestions_from_run_report, build_dictionary_patch_from_run_report,
    load_json, llm_percentual, llm_progress
)

from mcp_server.tools.dictionary_tool import _extract_version_from_path
from mcp_server.tools.device_list_tool import load_rules


router = APIRouter(prefix="/api")

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
runClass = RunRepository(dsn)
artifactRepo = ArtifactRepository(dsn)

TEMPLATE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates")
DICTIONARIES_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionaries")
KB_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb")
TEMPLATE_BASE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base")
PVS_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs")
CONFIG_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/config")

def apply_patch(user_id: str, input_path: str | None, file_name: str | None, patch_json: dict | None, upsert: Any | None, summarize: Any | None, artifact: str, patch_file_name: str | None, validate_only: bool, run_id: str | None, mode: str | None, manual_mode: str | None, run_dir: Path, source_artifact_name: str | None = None):
    # applica le patch, genera report e salva nel db

    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"{file_name} file not exists!")
        
    if not user_id:
        raise HTTPException(status_code=404, detail="user_id not exists!")
        
    cfg = dict(ARTIFACTS[artifact])
    cfg["input_path"] = str(input_path)

    if artifact == "dictionary":
        # forza validazione canonica su template_base da DB, non da path locale di config
        out_dir = run_dir / user_id
        out_dir.mkdir(parents=True, exist_ok=True)
        tb_path = _resolve_template_base_snapshot_for_dictionary(out_dir)
        cfg["template_base_path"] = str(tb_path)
    
    # artifact = template_base || kb || dictionary
    if artifact != "device_list" and artifact != "template":
        out_dir = run_dir / user_id
        out_dir.mkdir(parents=True, exist_ok=True)

        if artifact == "dictionary":
            # modalità run_report
            if mode == "run_report":
                if not run_id:
                    raise HTTPException(status_code=400, detail="run_id required for run_report mode")
                run_report = get_run(run_id)

                # salva report temporaneo
                rr_path = out_dir /"run_report_tmp.json"
                rr_path.write_text(json.dumps(run_report, ensure_ascii=False, indent=2), encoding="utf-8")

                # crea patch per dizionario da run report
                patch = build_dictionary_patch_from_run_report([str(rr_path)], str(input_path))
                patch_path = out_dir / "dictionary_patch.json"
                patch_path.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
                cfg["patch_path"] = str(patch_path)

                # crea suggerimenti concetti per run report
                suggestions = build_dictionary_suggestions_from_run_report([str(rr_path)], str(input_path))
                suggestions_path = out_dir / "dictionary_suggestions.json"
                suggestions_path.write_text(json.dumps(suggestions, ensure_ascii=False, indent=2), encoding="utf-8")

                report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only, input_path)
                report = load_json(str(report_path))
                
                # salvataggio nel db
                artifact_type = report.get("target", {}).get("artifact_type", artifact)
                artifact_output = report.get("target", {}).get("output_path") or str(input_path)
                artifact_id = _register_artifact_from_path(artifact_output, artifact_type)
                runClass.save_run(report, user_id, artifact_id)

                return {
                    "status": "ok",
                    "run_id": run_report.get("run_id"),
                    "report_path": str(report_path),
                    "patch": patch,
                    "patch_path": patch_path,
                    "suggestions": suggestions,
                    "suggestions_path": str(suggestions_path)
                }

            elif mode == "manual": 
                if manual_mode != "patch":
                    raise HTTPException(status_code=400, detail="manual mode must be patch")
                if not patch_json:
                    raise HTTPException(status_code=400, detail="patch json required")
                
                patch_path = out_dir / "dictionary_patch.json"
                patch_path.write_text(json.dumps(patch_json, ensure_ascii=False, indent=2), encoding="utf-8")
                cfg["patch_path"] = str(patch_path)

                report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only, input_path)
                report = load_json(str(report_path))

                artifact_type = report.get("target", {}).get("artifact_type", artifact)
                artifact_output = report.get("target", {}).get("output_path") or str(input_path)
                artifact_id = _register_artifact_from_path(artifact_output, artifact_type)
                runClass.save_run(report, user_id, artifact_id)


                return {
                    "status": "ok",
                    "report_path": str(report_path),
                    "run_id": report.get("run_id")
                }

            else:
                raise HTTPException(status_code=400, detail="mode must be run_report or manual")


        # scrive patch file
        patch_path = out_dir / patch_file_name
        patch_path.write_text(json.dumps(patch_json, ensure_ascii=False, indent=2), encoding="utf-8")
        cfg["patch_path"] = str(patch_path)

        report_path = run_patch(cfg, artifact, upsert, summarize, validate_only, input_path)
        report = load_json(str(report_path))

        # salvataggio nel db
        artifact_type = report.get("target", {}).get("artifact_type", artifact)
        artifact_output = report.get("target", {}).get("output_path") or str(input_path)
        artifact_id = _register_artifact_from_path(artifact_output, artifact_type)
        runClass.save_run(report, user_id, artifact_id)


        return {"status": "ok", "run_id": report.get("run_id"), "report_path": str(report_path)}

    # artifact = device_list
    else:
        report_path, enriched_file = run_device_list(cfg, validate_only, user_id)
        report = load_json(str(report_path))

        # salvataggio nel db
        artifact_type = report.get("target", {}).get("artifact_type", artifact)
        artifact_output = report.get("target", {}).get("output_path") or str(input_path)
        artifact_name_override = None
        if source_artifact_name and "/" in source_artifact_name:
            store = source_artifact_name.split("/", 1)[0]
            artifact_name_override = f"{store}/{Path(artifact_output).name}"

        artifact_type_to_save = "device_list_context"

        artifact_id = _register_artifact_from_path(artifact_output, artifact_type_to_save, artifact_name=artifact_name_override)
        runClass.save_run(report, user_id, artifact_id)


        return {"status": "ok", "run_id": report.get("run_id"), "report_path": str(report_path), "warning": report.get("validation", {}).get("warnings"), "enriched_file": enriched_file}

def _register_artifact_from_path(path: str, artifact_type: str, artifact_name: str | None = None) -> str:
    # salva artifact nel db

    p = Path(path)

    if not p.exists():
        raise HTTPException(status_code=404, detail=f"{artifact_type} output not found: {path}")
    
    with open(p, "r", encoding="utf-8") as f:
        content = json.load(f)
        
    return artifactRepo.upsert_artifact(
        artifact_type=artifact_type,
        name=p.name if artifact_name is None else artifact_name,
        version=_extract_version_from_path(p),
        content=content,
    )

def initialize(artifact_id: str, artifact_type: str, user_id: str) -> tuple[Path, Path, str]:
    name = artifactRepo.get_artifact_name_by_id(artifact_id)

    if artifact_type == "device_list":
        payload = artifactRepo.get_artifact_content(name, artifact_type)
    else:
        payload = artifactRepo.get_artifact_content(artifact_id, artifact_type)

    run_id = generate_run_id()
    run_dir = RUNS_ROOT / str(user_id) / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    input_path = run_dir / name
    input_path.parent.mkdir(parents=True, exist_ok=True)
    input_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    return input_path, run_dir, run_id

def _resolve_template_base_snapshot_for_dictionary(run_dir: Path) -> Path:
    # ricava l ultima versione di template base

    tb_art = artifactRepo.get_last_version_of_artifact("template_base")
    if not tb_art:
        raise HTTPException(status_code=404, detail="template_base not found in DB")

    name = tb_art.get("name")
    content = tb_art.get("content")
    if not name or content is None:
        raise HTTPException(status_code=500, detail="invalid template_base artifact payload")

    tb_path = run_dir / name
    tb_path.write_text(json.dumps(content, ensure_ascii=False, indent=2),encoding="utf-8")
    return tb_path


#----CRONOLOGIA DIFF-----
@router.get("/cronology")
def get_cronology(user = Depends(get_current_user)):
    return runClass.get_diff_report_by_user_id(user["sub"])

#-----LLM %-------
@router.get("/llm/percentual")
def get_llm_percentual(run_id: str, user = Depends(get_current_user)):
    return {"percent": llm_percentual(run_id)}

#-----RUNS LIST----
@router.get("/runs/ids")
def get_run_ids(user = Depends(get_current_user)):
    return {"run_ids": runClass.get_run_id_by_user_id(user["sub"])}

@router.get("/run_id/{run_id}")
def get_run(run_id: str, user = Depends(get_current_user)):
    try:
        return runClass.get_run(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="run not found!")

@router.get("/runid_template")
def get_run_template(user = Depends(get_current_user)):
    return runClass.get_run_template(user["sub"])

#-----TEMPLATE-----
@router.post("/run/template/start")
def run_template_start(payload: RunTemplateStartRequest, user = Depends(get_current_user)):
    template_name = artifactRepo.get_artifact_name_by_id(payload.id)
    dictionary_name = artifactRepo.get_artifact_name_by_id(payload.dictionary_id)
    kb_name = artifactRepo.get_artifact_name_by_id(payload.kb_id)
    template_base_name = artifactRepo.get_artifact_name_by_id(payload.template_base_id)
    device_context_name = artifactRepo.get_artifact_name_by_id(payload.device_context_id)
    template_payload = artifactRepo.get_artifact_content(payload.id, "template")
    dictionary_payload = artifactRepo.get_artifact_content(payload.dictionary_id, "dictionary")
    kb_payload = artifactRepo.get_artifact_content(payload.kb_id, "kb")
    template_base_payload = artifactRepo.get_artifact_content(payload.template_base_id, "template_base")
    device_context_payload = artifactRepo.get_artifact_content(payload.device_context_id, "dlc")

    result = start_template_run(
        template_name=template_name,
        dictionary_name=dictionary_name,
        kb_name=kb_name,
        template_base_name=template_base_name,
        device_context_name="device_list_context_v0.1.json",
        template_id=payload.id,
        dictionary_id=payload.dictionary_id,
        kb_id=payload.kb_id,
        template_base_id=payload.template_base_id,
        device_context_id=payload.device_context_id,
        template_payload=template_payload,
        dictionary_payload=dictionary_payload,
        kb_payload=kb_payload,
        template_base_payload=template_base_payload,
        device_context_payload=device_context_payload,
    )
    return result

@router.post("/run/template/llm")
def run_template_llm(payload: RunTemplateLlmRequest, user = Depends(get_current_user)):
    response = llm_propose_for_run(run_id=payload.run_id, llm_model=payload.llm_model)
    return response["llm_patch_actions"]

@router.post("/run/template/finish")
def run_template_finish(payload: RunTemplateFinishRequest, user = Depends(get_current_user)):
    result = template_run(run_id=payload.run_id, validate_only=payload.validate_only, apply_llm=payload.apply_llm, llm_actions_override=payload.llm_patch_actions)

    # salva nel DB
    report = load_json(result["report_path"])
    artifact_type = report.get("target", {}).get("artifact_type", "template")
    artifact_input = report.get("target", {}).get("input_path")
    artifact_output = report.get("target", {}).get("output_path")
    _register_artifact_from_path(artifact_output, artifact_type)
    artifact_id_input = _register_artifact_from_path(artifact_input, artifact_type)
    runClass.save_run(report, user["sub"], artifact_id_input)


    llm_progress.pop(payload.run_id, None)

    return result

#----DICTIONARY----
@router.post("/run/dictionary")
def run_dictionary(payload: RunDictionaryRequest, user = Depends(get_current_user)):
    input_path, run_dir, _ = initialize(payload.id,  "dictionary", user["sub"])
    return apply_patch(user["sub"], input_path, input_path.name, payload.patch_json, dictionary_upsert, summarize_dictionary_diff, "dictionary", "dictionary_patch.json", payload.validate_only, payload.run_id, payload.mode, payload.manual_mode, run_dir) 

#----KB----
@router.post("/run/kb")
def run_kb(payload: RunKbRequest, user = Depends(get_current_user)):
    input_path, run_dir, _ = initialize(payload.id, "kb", user["sub"])
    return  apply_patch(user["sub"], input_path, input_path.name, payload.patch_json, kb_upsert_mapping, summarize_kb_diff, "kb", "kb_patch.json", payload.validate_only, None, None, None, run_dir)

#----TEMPLATE BASE----
@router.post("/run/template_base")
def run_template_base(payload: RunTemplateBaseRequest, user = Depends(get_current_user)):
    input_path, run_dir, _ = initialize(payload.id, "template_base", user["sub"])
    return apply_patch(user["sub"], input_path, input_path.name, payload.patch_json, template_apply_patch, summarize_template_base_diff, "template_base", "template_base_patch.json", payload.validate_only, None, None, None, run_dir)

 # ---- DEVICE LIST ----

#---DEVICE LIST-----
@router.post("/run/device_list")
def run_device_list_api(payload: RunDeviceListRequest, user = Depends(get_current_user)):
    source_artifact_name = artifactRepo.get_artifact_name_by_id(payload.id)
    input_path, run_dir, _ = initialize(payload.id, "device_list", user["sub"])
    return apply_patch(user["sub"], input_path, input_path.name, None, None, None, "device_list", None, payload.validate_only, None, None, None, run_dir, source_artifact_name=source_artifact_name)
    #input_path = PVS_DIR / payload.store / payload.device_list_name
    #return apply_patch(user["sub"], input_path, payload.device_list_name, None, None, None, "device_list", None, payload.validate_only, None, None, None)

@router.get("/enum")
def get_base_update_device_list(user = Depends(get_current_user)):
    file_config = "device_list_rules.yml"
    path = CONFIG_DIR / file_config
    rules = load_rules(str(path))
    return rules.get("enum", {})
