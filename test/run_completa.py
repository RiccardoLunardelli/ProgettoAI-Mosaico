import argparse
import json
from pathlib import Path
import yaml
from uuid import uuid4, UUID
from datetime import datetime, timezone, timedelta
import sys

from src.parser.normalizer import load_json, normalize_template, model_dump
from src.matcher.matcher import run_matching
from scripts.run_local import run_patch
from mcp_server.server import template_apply_patch, dictionary_upsert, kb_upsert_mapping
from scripts.run_local import summarize_template_real_diff, summarize_dictionary_diff,summarize_kb_diff,summarize_template_base_diff, run_device_list, \
                                ARTIFACTS, build_dictionary_patch_from_run_report, build_dictionary_suggestions_from_run_report
from src.intermediateLayer.postgres_repository import RunRepository, UsersRepository, BatchesRepository

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

def load_config(path: str) -> dict:
    # apre file yml

    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

def run_pipeline(template_path: str, dictionary_path: str, kb_path: str, template_base_path: str, device_context_path: str, schema_tipo_path: str, output_dir: str, llm_model: str | None, user_class: UsersRepository, batch_class: BatchesRepository, run_class: RunRepository, user_id: UUID, batch_id: UUID) -> None:
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1) Normalize
    raw_template = load_json(template_path)
    print("caricato template")
    schema = load_json(schema_tipo_path)
    print("caricato schema per normalizzare ")
    normalized = normalize_template(raw_template, schema)
    normalized_payload = model_dump(normalized)
    print("template normalizzato creato")

    normalized_path = out_dir / "normalized_template_v0.1.json"
    write_json(normalized_path, normalized_payload)
    print(f"template normalizzato creato. Path: {normalized_path}")

    # 2) Matching
    matching_path = out_dir / "matching_report_v0.1.json"
    run_matching(
        normalized_path=str(normalized_path),
        template_base_path=template_base_path,
        dictionary_path=dictionary_path,
        kb_path=kb_path,
        device_context_path=device_context_path,
        output_path=str(matching_path),
    )
    print(f"Matching effettuato. Path: {matching_path}")

    # dopo run_matching(...)
    decide_and_run_patch(
        template_base_path=template_base_path,
        matching_path=str(matching_path),
        llm_model=llm_model or "llama3.1:8b",
        user_class=user_class,
        batch_class=batch_class,
        run_class=run_class,
        user_id=user_id,
        batch_id=batch_id
    )

def decide_and_run_patch(template_base_path: str, matching_path: str, llm_model: str, user_class: UsersRepository, batch_class: BatchesRepository, run_class: RunRepository, user_id: UUID, batch_id: UUID):
    while True:
        choice = input("1--> diz. 2--> kb. 3--> template. 4--> template_base. 5--> device_list. exit: ").strip().lower()
        if choice == "exit":
            break 
        if choice not in {"1","2","3","4","5"}:
            print("scelta non valida")
            continue

        validate_only = input("Validate only? (y/n): ").strip().lower() == "y"
        input_file = input("Percorso file input: ").strip()

        choose = int(choice)
        if choose == 1:
            manual = input("Patch manuale o da run report? (m/r): ").strip().lower()
            cfg = dict(ARTIFACTS["dictionary"])
            cfg["input_path"] = input_file

            if manual == "m":
                patch_path = input("Percorso patch manuale (json): ").strip()
                cfg["patch_path"] = patch_path
            else:
                run_report_input = input("Run report path: ").strip()
                run_report_paths = [p.strip() for p in run_report_input.split(",") if p.strip()]
                patch = build_dictionary_patch_from_run_report(run_report_paths, input_file)
                out_path = "output_dir/dictionary_patch.json"
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(patch, f, ensure_ascii=False, indent=2)
                cfg["patch_path"] = out_path
                print("Patch dizionario salvata in:", out_path)

                suggestions = build_dictionary_suggestions_from_run_report(run_report_paths, input_file)
                out_path = "output_dir/dictionary_suggestions.json"
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(suggestions, f, indent=2, ensure_ascii=False)
                print(f"Suggestions saved: {out_path}")

            report_path = run_patch(cfg, "dictionary", dictionary_upsert, summarize_dictionary_diff, validate_only)
            if report_path:
                run_report = load_json(str(report_path))
                run_class.save_run(run_report=run_report, user_id=user_id, batch_id=batch_id)
                batch_class.increment_completed_runs(batch_id=batch_id)

        elif choose == 2:
            cfg = dict(ARTIFACTS["kb"])
            cfg["input_path"] = input_file
            manual = input("Usare patch manuali? (y/n): ").strip().lower() == "y"
            if manual:
                manual_actions_path = input("Percorso patch manuali: ").strip()
                cfg["patch_path"] = manual_actions_path
            report_path = run_patch(cfg, "kb", kb_upsert_mapping, summarize_kb_diff, validate_only)
            if report_path:
                run_report = load_json(str(report_path))
                run_class.save_run(run_report=run_report, user_id=user_id, batch_id=batch_id)
                batch_class.increment_completed_runs(batch_id=batch_id)

        elif choose == 3:
            cfg = dict(ARTIFACTS["template"])
            cfg["input_path"] = input_file
            cfg["matching_path"] = matching_path
            cfg["template_base_path"] = template_base_path
            cfg["llm_model"] = llm_model
            manual = input("Usare patch manuali? (y/n): ").strip().lower() == "y"
            if manual:
                manual_actions_path = input("Percorso patch manuali: ").strip()
                cfg["manual_actions_path"] = manual_actions_path
            report_path = run_patch(cfg, "template", template_apply_patch, summarize_template_real_diff, validate_only)
            if report_path:
                run_report = load_json(str(report_path))
                run_class.save_run(run_report=run_report, user_id=user_id, batch_id=batch_id)
                batch_class.increment_completed_runs(batch_id=batch_id)

        elif choose == 4:
            cfg = dict(ARTIFACTS["template_base"])
            cfg["input_path"] = input_file
            manual = input("Usare patch manuali? (y/n): ").strip().lower() == "y"
            if not manual:
                print("Template base: serve patch manuale. Skip.")
                continue  # oppure return
            manual_actions_path = input("Percorso patch manuali: ").strip()
            cfg["patch_path"] = manual_actions_path
            report_path = run_patch(cfg, "template_base", template_apply_patch, summarize_template_base_diff, validate_only)
            if report_path:
                run_report = load_json(str(report_path))
                run_class.save_run(run_report=run_report, user_id=user_id, batch_id=batch_id)
                batch_class.increment_completed_runs(batch_id=batch_id)

        elif choose == 5:
            cfg = dict(ARTIFACTS["device_list"])
            cfg["input_path"] = input_file
            report_path = run_device_list(cfg, validate_only)
            if report_path:
                run_report = load_json(str(report_path))
                run_class.save_run(run_report=run_report, user_id=user_id, batch_id=batch_id)
                batch_class.increment_completed_runs(batch_id=batch_id)

def main() -> None:
    print("-----WELCOME------")
    username = input("Insert your name: ") # parametro name per user
    email= input("Insert your mail: ") # parametro mail per user
    
    dsn = "dbname=semantic_ai_mapper user=semantic_user password=semantic_password host=localhost port=5432"

    run = RunRepository(dsn)
    user = UsersRepository(dsn)
    batch = BatchesRepository(dsn)

    user_id = uuid4()
    created_at_user = datetime.now(timezone(timedelta(hours=1))).isoformat()
    user.create_user(user_id=user_id, email=email, name=username, created_at=created_at_user)

    total_runs = int(input("Run totali da eseguire: "))
    batch_id = uuid4()
    created_at_batch = datetime.now(timezone(timedelta(hours=1))).isoformat()
    status = batch._validate_and_status(total_runs=total_runs, completed_runs=0)
    batch.create_batch(batch_id=batch_id, user_id=user_id, created_at=created_at_batch, status=status, total_runs=total_runs, completed_runs=0)

    cfg_path = input("Path file di configurazione[config.yml]: ").strip() or "/home/ricky-lu/rickylu-workspace/ProgettiAI/Progetto-MCP/config/config.yml"
    cfg = load_config(cfg_path)

    paths = cfg.get("paths", {})
    llm = cfg.get("llm", {})

    template_path = input("Template path[inserisci quello da arricchire se non è presente]: ").strip() or paths.get("template")
    dictionary_path = input("Dictionary path: ").strip() or paths.get("dictionary")
    kb_path = input("KB path: ").strip() or paths.get("kb")
    template_base_path = input("Template base path: ").strip() or paths.get("template_base")
    ask_for_device_list = input("Device list path[inserisci quello da arricchire se non è presente]: ").strip()

    if ask_for_device_list:
        cfg = dict(ARTIFACTS["device_list"])
        cfg["input_path"] = ask_for_device_list
        validate_only = False
        run_device_list(cfg, validate_only)
        print("Device list arricchito generato")
        device_context_path = input("Device list Path: ").strip()
    else:
        device_context_path = paths.get("device_context")
    schema_tipo_path = input("Schema tipo path [schemas/schema_tipo_v0.1.json]: ").strip() or paths.get("schema_tipo") or "schemas/schema_tipo_v0.1.json"
    output_dir = input("Output dir [output_dir]: ").strip() or paths.get("output_dir") or "output_dir"
    llm_model = input("LLM model [llama3.1:8b]: ").strip() or llm.get("model") or "llama3.1:8b"

    run_pipeline(
        template_path=template_path,
        dictionary_path=dictionary_path,
        kb_path=kb_path,
        template_base_path=template_base_path,
        device_context_path=device_context_path,
        schema_tipo_path=schema_tipo_path,
        output_dir=output_dir,
        llm_model=llm_model,
        user_class=user,
        batch_class=batch,
        run_class=run,
        user_id=user_id,
        batch_id=batch_id
    )


if __name__ == "__main__":
    main()
