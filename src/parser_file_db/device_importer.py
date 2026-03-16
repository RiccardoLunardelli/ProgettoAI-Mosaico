import json
from pathlib import Path

from backend_api.routes.runs import PVS_DIR, dsn
from src.intermediateLayer.postgres_repository import Stores, ArtifactRepository, Devices

storeClass = Stores(dsn)
artifactClass = ArtifactRepository(dsn)
deviceClass = Devices(dsn)


def resolve_store_id(store_name: str) -> str | None:
    stores = storeClass.store_exists(store_name)  # tua funzione esistente
    if not stores:
        return None

    first = stores[0]

    # caso 1: lista dict
    if isinstance(first, dict):
        return str(first.get("id")) if first.get("id") else None

    # caso 2: lista string/UUID
    return str(first)

def resolve_template_id(template_guid: str | None) -> str | None:
    if not template_guid:
        return None

    artifact_name = f"{template_guid}.json"
    rows = artifactClass.get_artifacts_by_ids_or_name(ids=None, name=artifact_name)

    # tiene solo artifact template
    rows = [r for r in rows if r.get("type") == "template"]
    if not rows:
        return None

    # se hai più versioni, prendi la prima o ordina come preferisci
    return str(rows[0]["id"])

def build_hd_plc(store_name: str, idx: int, item: dict) -> str:
    # placeholder inventato, ma stabile
    idptd = item.get("IDPTD") or f"D{idx:04d}"
    return f"PLC_FAKE.{store_name}.{idptd}"


def run():
    inserted = 0
    skipped = 0

    for store_dir in sorted(PVS_DIR.iterdir()):
        if not store_dir.is_dir():
            continue

        store_name = store_dir.name
        dl_path = store_dir / "device_list.json"
        if not dl_path.exists():
            continue

        store_id = resolve_store_id(store_name)
        if not store_id:
            print(f"[SKIP] store non trovato in DB: {store_name}")
            continue

        with open(dl_path, "r", encoding="utf-8") as f:
            items = json.load(f)

        for idx, item in enumerate(items, start=1):
            description = (item.get("Description") or "").strip()
            if not description:
                skipped += 1
                continue

            template_guid = item.get("TemplateGUID")
            id_template = resolve_template_id(template_guid)

            hd_plc = build_hd_plc(store_name, idx, item)

            deviceClass.insert_device(
                store_id=store_id,
                description=description,
                hd_plc=hd_plc,
                id_template=id_template,
            )
            inserted += 1

        print(f"[OK] {store_name} completato")

    print(f"Done: inserted={inserted}, skipped={skipped}")


if __name__ == "__main__":
    run()
