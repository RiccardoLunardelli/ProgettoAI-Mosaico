import json
from datetime import datetime, timezone, timedelta
from typing import Any, Dict
import argparse

SECTION_TO_CATEGORY = {
    "ContinuosReads": "measurement",
    "ContinuousReads": "measurement",
    "Parameters": "parameter",
    "Alarms": "alarm",
    "Warnings": "warning",
    "Commands": "command",
    "VirtualVariables": "virtual_variable",
}

def load_json(path:str) -> Any:
    # caricamento file json

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_patch_actions(matching_path: str, output_path: str) -> None:
    # produce la patch actions

    matching = load_json(matching_path)

    actions = []
    for item in matching.get("items", []):
        source_key = item.get("source_key")
        section = item.get("section")
        status = item.get("status")
        confidence = item.get("confidence")
        normalized_text = item.get("evidence", {}).get("normalized_text")

        evidence_ref = f"{matching_path}#{source_key}"

        # CASI MATCHED CON CONDIFEDENCE > 0.9
        if status == "matched" and confidence >= 0.9:
            actions.append({
                "action_type": "NO_OP",
                "source_key": source_key,
                "section": section,
                "normalized_text": normalized_text,
                "concept_id": item.get("concept_id"),
                "confidence": confidence,
                "reason": "matching_deterministico",
                "evidence_ref": evidence_ref      
            })
        # CASI MATCHED CON SOGLIA < 0.9
        elif status == "matched":
            actions.append({
                "action_type": "REQUIRE_REVIEW",
                "source_key": source_key,
                "section": section,
                "normalized_text": normalized_text,
                "concept_id": item.get("concept_id"),
                "confidence": confidence,
                "reason": "ambiguita_confidenza_minore_soglia",
                "evidence_ref": evidence_ref
            })
            continue

    
        # CASI AMBIGUOS
        if status == "ambiguous":
            candidates = [c.get("concept_id") for c in item.get("candidates", [])]
            actions.append({
                "action_type": "REQUIRE_REVIEW",
                "source_key": source_key,
                "section": section,
                "normalized_text": normalized_text,
                "candidate_concepts": candidates,
                "confidence": confidence,
                "reason": "ambiguita_presenza_di_piu_candidati",
                "evidence_ref": evidence_ref
            })
            continue

        # CASI UNMPAPPED
        if status == "unmapped":
            suggested_category = SECTION_TO_CATEGORY.get(section)
            actions.append({
                "action_type": "PROPOSE_CONCEPT",
                "source_key": source_key,
                "section": section,
                "normalized_text": normalized_text,
                "suggested_category": suggested_category,
                "confidence": 0.0,
                "reason": "non_mappata_nessun_match_con_dizionario",
                "evidence_ref": evidence_ref
            })
            continue
        
        # CASI SKIPPED
        if status and status.startswith("skipped"):
            actions.append({
                "action_type": "NO_OP",
                "source_key": source_key,
                "section": section,
                "reason": "salta_questa_variabile_disabilitata",
                "evidence_ref": evidence_ref
            })
            continue

    report = {
        "patch_actions_version": "v0.1",
        "generated_at": datetime.now(timezone(timedelta(hours=1))).isoformat(),
        "source_matching_version": matching.get("matching_version"),
        "actions": actions
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--matching", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    run_patch_actions(
        matching_path=args.matching,
        output_path=args.output
    )
