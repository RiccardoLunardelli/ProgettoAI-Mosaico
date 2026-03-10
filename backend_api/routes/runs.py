from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import json
from typing import Any

from backend_api.schemas.runs import (
    RunTemplateStartRequest, RunTemplateLlmRequest, RunTemplateFinishRequest,
    RunDictionaryRequest, RunKbRequest, RunTemplateBaseRequest, RunDeviceListRequest
)

from backend_api.utils.deps import get_current_user

from src.intermediateLayer.postgres_repository import RunRepository

from scripts.orchestrator import (
    start_template_run, llm_propose_for_run, template_run,
    run_patch, ARTIFACTS,
    summarize_dictionary_diff, summarize_kb_diff, summarize_template_base_diff,
    dictionary_upsert, kb_upsert_mapping, template_apply_patch, run_device_list,
    build_dictionary_suggestions_from_run_report, build_dictionary_patch_from_run_report,
    load_json, llm_percentual, llm_progress
)

router = APIRouter()

dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"
runClass = RunRepository(dsn)

TEMPLATE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/templates")
DICTIONARIES_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/dictionaries")
KB_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/kb")
TEMPLATE_BASE_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/data/template_base")
PVS_DIR = Path("/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/pv_datas/pvs")

def apply_patch(user_id: str, input_path: str | None, file_name: str | None, patch_json: dict | None, upsert: Any | None, summarize: Any | None, artifact: str, patch_file_name: str | None, validate_only: bool, run_id: str | None, mode: str | None, manual_mode: str | None):
    # applica le patch, genera report e salva nel db

    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"{file_name} file not exists!")
        
    if not user_id:
        raise HTTPException(status_code=404, detail="user_id not exists!")
        
    cfg = dict(ARTIFACTS[artifact])
    cfg["input_path"] = str(input_path)
    
    # artifact = template_base || kb || dictionary
    if artifact != "device_list" and artifact != "template":
        out_dir = Path("output_dir")
        out_dir.mkdir(parents=True, exist_ok=True)

        if artifact == "dictionary":
            # modalità run_report
            if mode == "run_report":
                if not run_id:
                    raise HTTPException(status_code=400, detail="run_id required for run_report mode")
                run_report = get_run(run_id)

                # salva report temporaneo
                rr_path = out_dir / "run_report_tmp.json"
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

                report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only)
                report = load_json(str(report_path))
                
                # salvataggio nel db
                runClass.save_run(report, user_id) # run

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

                report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only)
                report = load_json(str(report_path))

                runClass.save_run(report, user_id)

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

        report_path = run_patch(cfg, artifact, upsert, summarize, validate_only)
        report = load_json(str(report_path))

        # salvataggio nel db
        runClass.save_run(report, user_id)

        return {"status": "ok", "run_id": report.get("run_id"), "report_path": str(report_path)}

    # artifact = device_list
    else:
        report_path, enriched_file = run_device_list(cfg, validate_only)
        report = load_json(str(report_path))

        # salvataggio nel db
        runClass.save_run(report, user_id)

        return {"status": "ok", "run_id": report.get("run_id"), "report_path": str(report_path), "warning": report.get("validation", {}).get("warnings"), "enriched_file": enriched_file}

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
    input_path = TEMPLATE_DIR / payload.template_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="template not found")

    result = start_template_run(template_path=str(input_path))
    return result

@router.post("/run/template/llm")
def run_template_llm(payload: RunTemplateLlmRequest, user = Depends(get_current_user)):
    response = llm_propose_for_run(run_id=payload.run_id, llm_model=payload.llm_model)
    return response["llm_patch_actions"]

@router.post("/run/template/finish")
def run_template_finish(payload: RunTemplateFinishRequest, user = Depends(get_current_user)):
    input_path = TEMPLATE_DIR / payload.template_name
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="template not found")

    result = template_run(
        run_id=payload.run_id,
        template_path=str(input_path),
        validate_only=payload.validate_only,
        apply_llm=payload.apply_llm,
        llm_actions_override=payload.llm_patch_actions
    )

    # salva nel DB
    report = load_json(result["report_path"])
    runClass.save_run(report, user["sub"])
    llm_progress.pop(payload.run_id, None)

    return result

#----DICTIONARY----
@router.post("/run/dictionary")
def run_dictionary(payload: RunDictionaryRequest, user = Depends(get_current_user)):
    input_path = DICTIONARIES_DIR / payload.dictionary_name
    return apply_patch(user["sub"], input_path, payload.dictionary_name, payload.patch_json, dictionary_upsert, summarize_dictionary_diff, "dictionary", "dictionary_patch.json", payload.validate_only, payload.run_id, payload.mode, payload.manual_mode) 

#----KB----
@router.post("/run/kb")
def run_kb(payload: RunKbRequest, user = Depends(get_current_user)):
    input_path = KB_DIR / payload.kb_name
    return  apply_patch(user["sub"], input_path, payload.kb_name, payload.patch_json, kb_upsert_mapping, summarize_kb_diff, "kb", "kb_patch.json", payload.validate_only, None, None, None)

#----TEMPLATE BASE----
@router.post("/run/template_base")
def run_template_base(payload: RunTemplateBaseRequest, user = Depends(get_current_user)):
    input_path = TEMPLATE_BASE_DIR / payload.template_base_name
    return apply_patch(user["sub"], input_path, payload.template_base_name, payload.patch_json, template_apply_patch, summarize_template_base_diff, "template_base", "template_base_patch.json", payload.validate_only, None, None, None)

 # ---- DEVICE LIST ----

@router.post("/run/device_list")
def run_device_list_api(payload: RunDeviceListRequest, user = Depends(get_current_user)):
    input_path = PVS_DIR / payload.store / payload.device_list_name
    return apply_patch(user["sub"], input_path, payload.device_list_name, None, None, None, "device_list", None, payload.validate_only, None, None, None)
