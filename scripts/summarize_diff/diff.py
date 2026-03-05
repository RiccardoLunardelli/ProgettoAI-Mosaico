from src.parser.normalizer import load_json

#---------DIFF-----------------
def summarize_device_list_diff(before:dict, after: dict) -> list[str]:
    if not isinstance(before, list) or not isinstance(after, list):
        return []

    def _key(item: dict, idx: int) -> str:
        if not isinstance(item, dict):
            return f"idx_{idx}"
        return item.get("IDPTD") or item.get("ID") or f"idx_{idx}"

    before_map = {_key(item, i): item for i, item in enumerate(before)}
    after_map = {_key(item, i): item for i, item in enumerate(after)}

    summary = []

    added_keys = sorted(set(after_map) - set(before_map))
    removed_keys = sorted(set(before_map) - set(after_map))
    if added_keys:
        summary.append(f"add_device: {', '.join(added_keys)}")
    if removed_keys:
        summary.append(f"remove_device: {', '.join(removed_keys)}")

    common_keys = [k for k in after_map if k in before_map]
    if not common_keys:
        return summary

    uniform_added_fields = None
    uniform_only_added = True
    per_item_updates = []

    for k in common_keys:
        b = before_map.get(k, {})
        a = after_map.get(k, {})
        if not isinstance(a, dict) or not isinstance(b, dict):
            continue

        b_keys = set(b.keys())
        a_keys = set(a.keys())

        added_fields = sorted(a_keys - b_keys)
        removed_fields = sorted(b_keys - a_keys)
        updated_fields = sorted([f for f in a_keys & b_keys if a.get(f) != b.get(f)])

        if removed_fields or updated_fields:
            uniform_only_added = False
        if uniform_added_fields is None:
            uniform_added_fields = added_fields
        elif uniform_added_fields != added_fields:
            uniform_only_added = False

        if removed_fields:
            per_item_updates.append(f"remove_fields: {k} -> {', '.join(removed_fields)}")
        if updated_fields:
            per_item_updates.append(f"update_fields: {k} -> {', '.join(updated_fields)}")
        if added_fields and not uniform_only_added:
            per_item_updates.append(f"add_fields: {k} -> {', '.join(added_fields)}")

    if uniform_only_added and uniform_added_fields:
        summary.append(f"add_fields_all: {', '.join(sorted(uniform_added_fields))}")
        return summary

    summary.extend(per_item_updates)
    return summary

def summarize_template_real_diff(before: dict, after: dict) -> list[str]:
    summary = []
    for section, a_section in after.items():
        if not isinstance(a_section, dict):
            continue
        a_values = a_section.get("Values")
        b_values = before.get(section, {}).get("Values") if isinstance(before.get(section), dict) else None
        if not isinstance(a_values, dict) or not isinstance(b_values, dict):
            continue

        for source_key, a_entry in a_values.items():
            b_entry = b_values.get(source_key, {})
            if not isinstance(a_entry, dict) or not isinstance(b_entry, dict):
                continue

            changed_fields = []
            for k, v in a_entry.items():
                if k not in b_entry or b_entry.get(k) != v:
                    changed_fields.append(k)

            if changed_fields:
                summary.append(f"set_fields: {section}/{source_key} -> {', '.join(sorted(changed_fields))}")

    return summary

def summarize_dictionary_diff(before: dict, after: dict) -> list[str]:
    before_entries = {e["concept_id"]: e for e in before.get("entries", [])}
    after_entries = {e["concept_id"]: e for e in after.get("entries", [])}
    summary = []

    # nuovi concetti
    for concept_id in sorted(set(after_entries) - set(before_entries)):
        summary.append(f"add_concept: {concept_id}")

    # concetti comuni
    for concept_id in sorted(set(after_entries) & set(before_entries)):
        b_entry = before_entries[concept_id]
        a_entry = after_entries[concept_id]

        # update_category
        if b_entry.get("category") != a_entry.get("category"):
            summary.append(f"update_category: {concept_id} -> {a_entry.get('category')}")

        # semantic_category diff
        if b_entry.get("semantic_category") != a_entry.get("semantic_category"):
            summary.append(
                f"update_semantic_category: {concept_id} -> {a_entry.get('semantic_category')}"
            )

        # synonyms diff
        b_syn = b_entry.get("synonyms", {})
        a_syn = a_entry.get("synonyms", {})
        for lang in sorted(set(a_syn) | set(b_syn)):
            b_vals = set(b_syn.get(lang, []))
            a_vals = set(a_syn.get(lang, []))
            for val in sorted(a_vals - b_vals):
                summary.append(f"add_synonym: {concept_id} [{lang}] '{val}'")
            for val in sorted(b_vals - a_vals):
                summary.append(f"remove_synonym: {concept_id} [{lang}] '{val}'")

        # abbreviations diff
        b_abbr = set(b_entry.get("abbreviations", []))
        a_abbr = set(a_entry.get("abbreviations", []))
        for val in sorted(a_abbr - b_abbr):
            summary.append(f"add_abbreviation: {concept_id} '{val}'")
        for val in sorted(b_abbr - a_abbr):
            summary.append(f"remove_abbreviation: {concept_id} '{val}'")

        # patterns diff (by regex+description)
        b_pat = {(p.get("regex"), p.get("description")) for p in b_entry.get("patterns", [])}
        a_pat = {(p.get("regex"), p.get("description")) for p in a_entry.get("patterns", [])}
        for regex, desc in sorted(a_pat - b_pat):
            summary.append(f"add_pattern: {concept_id} /{regex}/ ({desc})")
        for regex, desc in sorted(b_pat - a_pat):
            summary.append(f"remove_pattern: {concept_id} /{regex}/ ({desc})")

    return summary

def summarize_kb_diff(before: dict, after: dict) -> list[str]:
    summary = []
    b_map = {(m["scope_id"], m["source_type"], m["source_key"]): m for m in before.get("mappings", [])}
    a_map = {(m["scope_id"], m["source_type"], m["source_key"]): m for m in after.get("mappings", [])}

    for key in sorted(set(a_map) - set(b_map)):
        m = a_map[key]
        summary.append(f"add_kb_rule: {m['scope_id']} {m['source_type']} {m['source_key']} -> {m['concept_id']}")

    for key in sorted(set(a_map) & set(b_map)):
        b = b_map[key]
        a = a_map[key]
        if b.get("concept_id") != a.get("concept_id") or b.get("reason") != a.get("reason") or b.get("evidence") != a.get("evidence"):
            summary.append(f"update_kb_rule: {a['scope_id']} {a['source_type']} {a['source_key']}")

    return summary

def summarize_template_base_diff(before: dict, after: dict) -> list[str]:
    summary = []

    def flat_map(tb):
        out = {}
        for cat in tb.get("categories", []):
            for c in cat.get("concepts", []):
                out[c["concept_id"]] = (cat.get("id"), c)
        return out

    b = flat_map(before)
    a = flat_map(after)

    for concept_id in sorted(set(a) - set(b)):
        summary.append(f"add_base_concept: {concept_id} -> {a[concept_id][0]}")

    for concept_id in sorted(set(b) - set(a)):
        summary.append(f"remove_base_concept: {concept_id}")

    for concept_id in sorted(set(a) & set(b)):
        b_cat, b_c = b[concept_id]
        a_cat, a_c = a[concept_id]
        if b_cat != a_cat:
            summary.append(f"update_base_category: {concept_id} {b_cat} -> {a_cat}")
        if b_c.get("label") != a_c.get("label"):
            summary.append(f"update_base_label: {concept_id}")
        if b_c.get("description") != a_c.get("description"):
            summary.append(f"update_base_description: {concept_id}")

    return summary

def compute_diff(input_path, template_patch, validated_preview, validated_diff, upsert_fn, diff_fn):
    # genera diff (dry-run se non validato)

    artifact = load_json(input_path)

    if validated_preview is not None and validated_diff is not None:
        return artifact, validated_preview, validated_diff

    dry_run_result = upsert_fn(path=input_path, patch=template_patch, dry_run=True)
    preview = dry_run_result.get("preview")
    diff = diff_fn(artifact, preview)

    return artifact, preview, diff
