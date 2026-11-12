#!/usr/bin/env python3
"""One-off importer for the DevNet Associate (v1.0) QuizFetch-style HTML export.

Usage: python3 scripts/import-devnet.py path/to/export.html

Reads <script id="bank" type="application/json">, keeps every key exactly as
marked in the source, extracts base64 exhibits to public/exhibits/, and writes:
  data/pools/devnet.json              46 unique questions, source order
  data/assessments/devnet-<sec>.json  question-id lists per assessment
Questions shared by Module 6 and FA 6 live once in the pool.
"""
import base64, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NUM = {2: "two", 3: "three", 4: "four"}
ALT = {
    "m5_q9": "Topology: PC 10.130.5.76/24 behind router R1 (LAN 10.130.5.1/24). R1 S0/0/0 192.0.2.1/30 links to a second router S0/0/1 192.0.2.2/30, whose LAN 203.0.113.14/28 reaches the Server at 203.0.113.5/28.",
    "m5_q12": "Topology: Host A 192.168.1.10 on R2 G0/0 (192.168.1.1). R2 (.253) and the NAT router (.254) share 192.168.2.0; the NAT router's .129 interface on 209.165.202.128 connects to the ISP, which reaches HQ (.2 on 203.0.113.0) and a Server at 10.0.0.253.",
    "m5_q16": "Windows IPv4 properties: IP address 192.168.44.150, subnet mask 255.255.255.224, default gateway 192.168.44.161, preferred DNS 64.102.255.44, alternate DNS 128.107.241.185.",
}
# Notes kept in data only (never rendered to students).
NOTES = {
    "m5_q12": "Source marks 209.165.202.129 as correct; its explanation lists Inside global as 209.165.202.128. Marked answer kept, as in the source.",
}


def main(src: str) -> None:
    html = Path(src).read_text(encoding="utf-8")
    m = re.search(r'<script id="bank" type="application/json">(.*?)</script>', html, re.S)
    if not m:
        sys.exit("bank script not found")
    raw = json.loads(m.group(1))
    out = []
    (ROOT / "public/exhibits").mkdir(parents=True, exist_ok=True)
    for q in raw:
        qid = q["id"]
        item = {"id": qid, "type": q["type"], "prompt": q["text"].replace("\u200b", "").strip()}
        if q["type"] == "matching":
            item["instruction"] = "Choose a match for every item."
            options = list(q["options"])
            assert len(set(options)) == len(options), qid
            item["prompts"] = []
            for i, p in enumerate(q["prompts"]):
                assert p["answer"] in options, qid
                item["prompts"].append({"id": f"{qid}-p{i + 1}", "text": p["text"], "answer": p["answer"]})
            item["options"] = options
        else:
            choose = q.get("choose") or 1
            if q["type"] == "multi":
                item["choose"] = choose
                item["instruction"] = f"Select all that apply · choose {NUM.get(choose, choose)}."
            else:
                item["instruction"] = "Select one answer."
            correct = set(q["correct"])
            assert correct <= set(q["choices"]), qid
            item["choices"] = [
                {"id": f"{qid}-{chr(97 + i)}", "text": c, "correct": c in correct}
                for i, c in enumerate(q["choices"])
            ]
        if q.get("code"):
            item["code"] = q["code"]
        exhibits = []
        for i, img in enumerate(q.get("images") or []):
            head, b64 = img.split(",", 1)
            assert "image/jpeg" in head, qid
            name = f"devnet-{qid.replace('_', '-')}{'' if i == 0 else f'-{i + 1}'}.jpg"
            data = base64.b64decode(b64)
            (ROOT / "public/exhibits" / name).write_bytes(data)
            w, h = jpeg_size(data)
            exhibits.append({"src": f"/exhibits/{name}", "alt": ALT.get(qid, "Exhibit"), "width": w, "height": h})
        if exhibits:
            item["exhibits"] = exhibits
        item["explanation"] = q["explanation"]
        item["sections"] = q["sections"]
        if q.get("mergedFrom"):
            item["mergedFrom"] = q["mergedFrom"]
        note = NOTES.get(qid) or q.get("flag")
        if note:
            item["note"] = note
        out.append(item)

    pool = {"id": "devnet", "title": "DevNet Associate (v1.0) — Modules 5–6 & FA 6", "questions": out}
    write(ROOT / "data/pools/devnet.json", pool)
    for sec in ["m5", "m6", "fa6", "all"]:
        ids = [q["id"] for q in out if sec == "all" or sec in q["sections"]]
        write(ROOT / f"data/assessments/devnet-{sec}.json", {"id": f"devnet-{sec}", "pool": "devnet", "questionIds": ids})
        print(sec, len(ids))


def jpeg_size(data: bytes) -> tuple[int, int]:
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        length = int.from_bytes(data[i + 2:i + 4], "big")
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            h = int.from_bytes(data[i + 5:i + 7], "big")
            w = int.from_bytes(data[i + 7:i + 9], "big")
            return w, h
        i += 2 + length
    raise ValueError("no SOF marker")


def write(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1])
