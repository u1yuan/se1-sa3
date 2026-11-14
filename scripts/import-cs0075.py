#!/usr/bin/env python3
"""Import the SA 3 reviewer HTML without changing source content or answer keys.

Usage: python scripts/import-cs0075.py path/to/cs0075-sa3-reviewer.html [--bank-id ID] [--check]
--bank-id selects the bank ID and destination filename (defaults to Set A's ID).
--check compares the entire converted bank with the committed assessment.
The source's shuffle settings are intentionally replaced by the hub's fixed order.
"""
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BANK_ID = "cs0075-sa3-mock-exam"
TYPES = {"true_false": "truefalse", "mcq": "single", "blank": "fill"}
FILL_INSTRUCTIONS = (
    "Blanks ignore case and normalize surrounding/repeated whitespace. "
    "Correct spelling, underscores, hyphens and punctuation are required. "
    "Enter only the requested identifier or term."
)


def convert(source: Path, bank_id: str = DEFAULT_BANK_ID) -> dict:
    html = source.read_text(encoding="utf-8")
    match = re.search(r'<script\b[^>]*\bid=[\"\']reviewer-data[\"\'][^>]*>(.*?)</script>', html, re.S)
    if not match:
        raise ValueError("reviewer-data script not found")
    bank = json.loads(match[1])["bank"]
    questions = bank["questions"]
    if not questions or len({q["id"] for q in questions}) != len(questions):
        raise ValueError("Expected non-empty questions with unique IDs")

    out = []
    for q in questions:
        # In this export, code follows the prose after one empty line. Splitting
        # only once preserves all remaining line breaks and indentation exactly.
        prose, separator, code = q["prompt"].partition("\n\n")
        item = {
            "id": q["id"],
            "type": TYPES[q["type"]],
            "prompt": prose,
            "instruction": bank.get("instructions", FILL_INSTRUCTIONS) if q["type"] == "blank" else "Select one answer.",
            "explanation": q["explanation"] + "\n\nSources:\n" + "\n".join(q["sources"]),
        }
        if separator:
            item["code"] = code.split("\n")
        if q["type"] == "blank":
            if not isinstance(q["answer"], list) or not q["answer"] or not all(isinstance(a, str) and a for a in q["answer"]):
                raise ValueError(f"Invalid accepted answers: {q['id']}")
            item["acceptedAnswers"] = q["answer"]
        else:
            choices = q["choices"]
            ids = [c["id"] for c in choices]
            if len(set(ids)) != len(ids) or ids.count(q["answer"]) != 1:
                raise ValueError(f"Invalid choice IDs or answer key: {q['id']}")
            item["choices"] = [dict(c, correct=c["id"] == q["answer"]) for c in choices]
        out.append(item)
    return {"id": bank_id, "questions": out}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--bank-id", default=DEFAULT_BANK_ID)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.bank_id):
        parser.error("--bank-id must be a lowercase alphanumeric slug separated by hyphens")
    dest = ROOT / "data/assessments" / f"{args.bank_id}.json"
    converted = convert(args.source, args.bank_id)
    if args.check:
        if json.loads(dest.read_text(encoding="utf-8")) != converted:
            raise SystemExit("Assessment differs from source; re-run the importer without --check")
        print(f"All {len(converted['questions'])} questions match source content, order, keys, explanations, references, and code.")
    else:
        dest.write_text(json.dumps(converted, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Imported {len(converted['questions'])} questions to {dest}")
