import json
from pathlib import Path

from backend_api.routes.runs import dsn, TEMPLATE_DIR, KB_DIR, DICTIONARIES_DIR, PVS_DIR, TEMPLATE_BASE_DIR
from mcp_server.tools.dictionary_tool import _extract_version_from_path
from src.intermediateLayer.postgres_repository import ArtifactRepository

repo = ArtifactRepository(dsn)

def collect_files() -> list[tuple[str, Path, str]]:
    """
    return: (artifact_type, file_path, artifact_name)
    artifact_name deve essere univoco almeno per type+version.
    """
    out: list[tuple[str, Path, str]] = []

    # template / dictionary / kb / template_base
    out += [("template", p, p.name) for p in sorted(TEMPLATE_DIR.glob("*.json"))]
    out += [("dictionary", p, p.name) for p in sorted(DICTIONARIES_DIR.glob("*.json"))]
    out += [("kb", p, p.name) for p in sorted(KB_DIR.glob("*.json"))]
    out += [("template_base", p, p.name) for p in sorted(TEMPLATE_BASE_DIR.glob("*.json"))]

    # device_list + enriched (store-aware)
    for store_dir in sorted(PVS_DIR.iterdir()):
        if not store_dir.is_dir():
            continue

        raw_dl = store_dir / "device_list.json"
        if raw_dl.exists():
            # name store/file per evitare collisioni tra store diversi
            out.append(("device_list", raw_dl, f"{store_dir.name}/{raw_dl.name}"))

        for ctx_dl in sorted(store_dir.glob("device_list_context_*.json")):
            out.append(("device_list_context", ctx_dl, f"{store_dir.name}/{ctx_dl.name}"))

    return out

def save_file():
    files = collect_files()
    if not files:
        print("Nessun file trovato.")
        return

    for artifact_type, file_path, artifact_name in files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = json.load(f)

            version = _extract_version_from_path(file_path)

            artifact_id = repo.upsert_artifact(
                artifact_type=artifact_type,
                name=artifact_name,
                version=version,
                content=content,
            )

            print(f"[OK] {artifact_type} | {artifact_name} | v={version} | id={artifact_id}")
        except Exception as e:
            print(f"[ERR] {file_path}: {e}")


if __name__ == "__main__":
    save_file()