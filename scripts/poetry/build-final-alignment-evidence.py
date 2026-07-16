#!/usr/bin/env python3
"""Compile reviewed final-corpus alignment evidence from source-bound retrieval.

The multilingual retrieval files are discovery aids, never release authority on
their own. This compiler admits only candidates that also resolve to exact
locked-source locations, contain continuous bilingual spans, and carry multiple
same-context anchors. The generated report is then consumed by the canonical
TypeScript corpus builder.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
REPORT_PATH = ROOT / "docs/verification/2026-07-16-final-alignment-evidence.json"
EXISTING_HAFEZ = {
    1,
    2,
    8,
    11,
    46,
    65,
    79,
    90,
    101,
    103,
    134,
    145,
    163,
    164,
    166,
    169,
    184,
    233,
    254,
    255,
    268,
    279,
    288,
    336,
}
WEAK_RUMI_SEGMENTS = {
    "rumi-whinfield-abridged-en-b0303-s10",
    "rumi-whinfield-abridged-en-b0339-s2",
    "rumi-whinfield-abridged-en-b0319-s7",
    "rumi-whinfield-abridged-en-b0193-s5",
    "rumi-whinfield-abridged-en-b0069-s2",
}
MANUAL_RUMI_REPLACEMENTS = {
    "rumi-whinfield-abridged-en-b0249-s2": 166,
    "rumi-whinfield-abridged-en-b0109-s2": 667,
    "rumi-whinfield-abridged-en-b0281-s2": 167,
    "rumi-whinfield-abridged-en-b0253-s2": 39,
    "rumi-whinfield-abridged-en-b0241-s6": 271,
}
HAFEZ_FINAL_SELECTION = {
    "volume-1/p211": 17,
    "volume-1/p205": 19,
    "volume-1/p123": 28,
    "volume-1/p125": 34,
    "volume-1/p224": 38,
    "volume-1/p183": 43,
    "volume-1/p159": 52,
    "volume-1/p127": 56,
    "volume-1/p129": 58,
    "volume-1/p138": 62,
    "volume-1/p221": 77,
    "volume-1/p219": 86,
    "volume-1/p243": 89,
    "volume-1/p242": 91,
    "volume-1/p244": 94,
    "volume-1/p345": 119,
    "volume-1/p294": 130,
    "volume-1/p302": 135,
    "volume-1/p317": 136,
    "volume-1/p466": 161,
    "volume-1/p471": 173,
    "volume-1/p499": 180,
    "volume-1/p517": 209,
    "volume-1/p421": 234,
    "volume-1/p537": 242,
    "volume-1/p620": 278,
    "volume-2/p81": 337,
    "volume-2/p85": 342,
    "volume-2/p60": 350,
    "volume-2/p137": 377,
    "volume-2/p210": 412,
    "volume-2/p230": 427,
    "volume-2/p314": 452,
    "volume-2/p289": 465,
    "volume-2/p335": 468,
    "volume-2/p255": 489,
}
HAFEZ_MATLA_FALLBACK_TASKS = {
    "volume-1/p242",
    "volume-1/p243",
}
HAFEZ_FIRST_LOGICAL_TASKS = {"volume-1/p224"}


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to read evidence input {path}.") from error


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    try:
        return [
            json.loads(line)
            for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Unable to read evidence input {path}.") from error


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_persian(value: str) -> str:
    return re.sub(r"[^\u0600-\u06ff]+", "", value)


def logical_opening_lines(
    source_text: str,
    ode: int,
    concordance: int,
) -> list[str]:
    header = re.compile(
        rf"(?m)^.*?(?<!\d){ode},\s*\({concordance}\)[.;]\s*$"
    )
    matches = list(header.finditer(source_text))
    if not matches:
        raise RuntimeError(
            f"Clarke transcript does not resolve ode {ode} ({concordance})."
        )

    for match in reversed(matches):
        physical = source_text[match.end() :].splitlines()
        logical: list[str] = []
        current: list[str] = []
        for raw_line in physical[:30]:
            line = normalize_spaces(raw_line)
            if not line:
                continue
            if not current:
                line = re.sub(r"^(?:[Ii1l]\.)\s*", "", line)
            current.append(line)
            combined = normalize_spaces(" ".join(current))
            if re.search(r"[,;:.?!][\"'’)]?$", combined) and len(combined) >= 20:
                # Normalize a word split solely by the OCR transcript's line wrap.
                combined = re.sub(r"(?<=[A-Za-z])-\s+(?=[a-z])", "", combined)
                logical.append(combined)
                current = []
                if len(logical) == 2:
                    return logical
        continue

    raise RuntimeError(
        f"Clarke transcript has no coherent opening couplet for ode {ode} ({concordance})."
    )


def is_clean_clarke_span(lines: list[str]) -> bool:
    joined = " ".join(lines)
    return (
        len(lines) == 2
        and all(20 <= len(line) <= 500 for line in lines)
        and not re.search(r"[|_<>\[\]]", joined)
        and joined.count("(") == joined.count(")")
        and all(re.search(r"[,;:.?!][\"'’)]?$", line) for line in lines)
    )


def independent_anchors(
    chain: list[dict[str, Any]],
    minimum: int = 3,
) -> list[dict[str, Any]]:
    chosen: list[dict[str, Any]] = []
    for anchor in sorted(chain, key=lambda entry: entry["score"], reverse=True):
        if all(
            anchor["englishIndex"] != prior["englishIndex"]
            and anchor["persianIndex"] != prior["persianIndex"]
            for prior in chosen
        ):
            chosen.append(anchor)
        if len(chosen) == minimum:
            return chosen
    raise RuntimeError("Rumi candidate lacks three independent source anchors.")


def split_pair(value: str, label: str) -> list[str]:
    lines = [line.strip() for line in value.split("\n") if line.strip()]
    if len(lines) != 2:
        raise RuntimeError(f"{label} must resolve to exactly two continuous lines.")
    return lines


def compile_hafez(embedding_path: Path) -> list[dict[str, Any]]:
    embedding_rows = load_json(embedding_path)
    embeddings_by_task = {row["taskId"]: row for row in embedding_rows}
    tasks = {
        task["id"]: task
        for task in load_json(
            ROOT / "sources-private/poetry/reports/hafez-align-tasks.json"
        )["tasks"]
    }
    odes = {
        f"{ode['volume']}/p{ode['page']}": ode
        for ode in load_json(ROOT / "sources-private/poetry/clarke-ocr/odes.json")[
            "odes"
        ]
    }
    ghazals = {
        ghazal["ghazalNumber"]: ghazal
        for ghazal in load_jsonl(
            ROOT / "sources-private/poetry/extracted/hafez-ghazals-fa.jsonl"
        )
    }
    source_texts = {
        volume: (
            ROOT
            / f"sources-private/poetry/raw/hafez-clarke-1891-en/{volume}.txt"
        ).read_text(encoding="utf-8")
        for volume in ("volume-1", "volume-2")
    }

    eligible: list[dict[str, Any]] = []
    for task_id, expected_ghazal in HAFEZ_FINAL_SELECTION.items():
        row = embeddings_by_task.get(task_id)
        if row is None:
            raise RuntimeError(f"Missing Hafez retrieval evidence for {task_id}.")
        proposal = row.get("proposal")
        if (
            not proposal
            or proposal["confidence"] != "high"
            or proposal["ghazalNumber"] != expected_ghazal
            or expected_ghazal in EXISTING_HAFEZ
        ):
            raise RuntimeError(
                f"Hafez retrieval evidence no longer binds {task_id} to ghazal {expected_ghazal}."
            )
        task = tasks[task_id]
        if task["odeLabelIsAmbiguous"]:
            raise RuntimeError(f"Selected Hafez task {task_id} is ambiguous.")
        ghazal_number = expected_ghazal
        ode = odes[task_id]
        if task_id in HAFEZ_MATLA_FALLBACK_TASKS:
            lines = [normalize_spaces(task["matla"])]
        else:
            lines = logical_opening_lines(
                source_texts[ode["volume"]], ode["ode"], ode["concordance"]
            )
            if task_id in HAFEZ_FIRST_LOGICAL_TASKS:
                lines = lines[:1]
        if not (
            1 <= len(lines) <= 2
            and all(20 <= len(line) <= 500 for line in lines)
            and all(not re.search(r"[|_<>\[\]]", line) for line in lines)
        ):
            raise RuntimeError(f"Selected Clarke span is not clean for {task_id}.")
        ghazal = ghazals.get(ghazal_number)
        if not ghazal or len(ghazal["hemistichs"]) < 2:
            raise RuntimeError(f"Missing Persian opening couplet for ghazal {ghazal_number}.")
        ghazal_text = normalize_persian(" ".join(ghazal["hemistichs"]))
        anchor_count = sum(
            1
            for anchor in proposal["anchors"]
            if len(normalize_persian(anchor["persian"])) >= 4
            and normalize_persian(anchor["persian"]) in ghazal_text
        )
        if anchor_count < 1 or len(proposal["anchors"]) < 2:
            raise RuntimeError(f"Hafez candidate {task_id} lacks exact source anchors.")
        mapping = (
            [
                {"englishIndex": 0, "persianIndices": [0]},
                {"englishIndex": 1, "persianIndices": [1]},
            ]
            if len(lines) == 2
            else [{"englishIndex": 0, "persianIndices": [0, 1]}]
        )
        eligible.append(
            {
                "stableRecordId": f"hafez-ghazal-{ghazal_number:03d}-clarke",
                "taskId": task_id,
                "volume": ode["volume"],
                "page": ode["page"],
                "ode": ode["ode"],
                "concordance": ode["concordance"],
                "ghazalNumber": ghazal_number,
                "englishLines": lines,
                "persianLines": ghazal["hemistichs"][:2],
                "mapping": mapping,
                "retrievalRank": row["proposedRank"],
                "retrievalScore": round(row["proposedScore"], 6),
                "independentAnchorCount": len(proposal["anchors"]),
                "exactPersianAnchorCount": anchor_count,
                "anchors": proposal["anchors"],
                "relationship": "literal-selected",
                "disclosures": [
                    "Clarke's parenthetical interpretive glosses are retained verbatim. Whitespace and line-wrap hyphenation were normalized deterministically from the locked Internet Archive transcript."
                ],
            }
        )
    if len(eligible) != 36:
        raise RuntimeError(
            f"Only {len(eligible)} clean, independently anchored Clarke records qualified."
        )
    return eligible


def compile_rumi(
    selected_path: Path,
    embedding_path: Path,
) -> list[dict[str, Any]]:
    selected_rows = load_json(selected_path)
    embedding_rows = load_json(embedding_path)
    windows_by_segment: dict[str, list[dict[str, Any]]] = {}
    for row in embedding_rows:
        windows_by_segment.setdefault(row["segmentId"], []).append(row)
    historical = load_json(
        ROOT / "sources-private/poetry/reports/rumi-alignment-candidates.json"
    )
    historical_by_segment = {
        entry["segmentId"]: entry
        for group in ("verified", "refuted", "insufficientVotes")
        for entry in historical[group]
    }

    compiled: list[dict[str, Any]] = []
    for row in selected_rows:
        segment_id = row["segmentId"]
        if segment_id in WEAK_RUMI_SEGMENTS:
            continue
        selected = row["selected"]
        if segment_id == "rumi-whinfield-abridged-en-b0237-s2":
            selected = max(
                (
                    anchor
                    for anchor in row["chain"]
                    if anchor["englishText"].startswith("The second, he")
                ),
                key=lambda anchor: anchor["score"],
            )
        try:
            anchors = independent_anchors(row["chain"])
        except RuntimeError as error:
            raise RuntimeError(
                f"Rumi candidate {segment_id} lacks three independent source anchors."
            ) from error
        compiled.append(
            {
                "segmentId": segment_id,
                "persianSequence": row["sequence"],
                "englishLineStart": selected["englishIndex"],
                "persianLineStart": selected["persianIndex"],
                "englishLines": split_pair(selected["englishText"], "English span"),
                "persianLines": split_pair(selected["text"], "Persian span"),
                "mapping": [
                    {"englishIndex": 0, "persianIndices": [0]},
                    {"englishIndex": 1, "persianIndices": [1]},
                ],
                "englishHeading": selected["heading"],
                "englishSubheading": selected.get("subheading"),
                "persianTitle": selected["title"],
                "retrievalScore": round(selected["score"], 6),
                "independentAnchorCount": len(row["chain"]),
                "anchors": [
                    {
                        "english": split_pair(anchor["englishText"], "anchor")[0],
                        "persian": split_pair(anchor["text"], "anchor")[0],
                    }
                    for anchor in anchors
                ],
                "relationship": "selected-abridged",
                "disclosures": [
                    "Whinfield is an abridged edition. This record publishes one continuous two-line English excerpt aligned to one continuous Nicholson couplet; the wider verse segment may omit surrounding Persian material."
                ],
                "correctsHistoricalCandidate": False,
            }
        )

    for segment_id, sequence in MANUAL_RUMI_REPLACEMENTS.items():
        matches: list[tuple[float, dict[str, Any], dict[str, Any]]] = []
        for window in windows_by_segment[segment_id]:
            for match in window["matches"]:
                if match["sequence"] == sequence:
                    matches.append((match["score"], window, match))
        if not matches:
            raise RuntimeError(f"No exact retrieval span resolves {segment_id} -> {sequence}.")
        _, window, match = max(matches, key=lambda entry: entry[0])
        historical_entry = historical_by_segment[segment_id]
        compiled.append(
            {
                "segmentId": segment_id,
                "persianSequence": sequence,
                "englishLineStart": window["englishIndex"],
                "persianLineStart": match["persianIndex"],
                "englishLines": split_pair(window["text"], "English span"),
                "persianLines": split_pair(match["text"], "Persian span"),
                "mapping": [
                    {"englishIndex": 0, "persianIndices": [0]},
                    {"englishIndex": 1, "persianIndices": [1]},
                ],
                "englishHeading": window["heading"],
                "englishSubheading": window.get("subheading"),
                "persianTitle": match["title"],
                "retrievalScore": round(match["score"], 6),
                "independentAnchorCount": len(historical_entry.get("anchors", [])),
                "anchors": [
                    {
                        "english": anchor["english"],
                        "persian": anchor["persian"],
                    }
                    for anchor in historical_entry.get("anchors", [])[:3]
                ],
                "relationship": historical_entry.get("relationship", "abridged"),
                "disclosures": [
                    historical_entry["disclosure"]
                    or "Whinfield is an abridged edition; this selected continuous couplet remains directly traceable to the Nicholson span."
                ],
                "correctsHistoricalCandidate": True,
            }
        )

    if len(compiled) != 44:
        raise RuntimeError(f"Expected 44 new Rumi records; compiled {len(compiled)}.")
    ids = [entry["segmentId"] for entry in compiled]
    if len(set(ids)) != len(ids):
        raise RuntimeError("Rumi final evidence contains a duplicate English segment.")
    persian_lines: set[str] = set()
    for entry in compiled:
        for line in entry["persianLines"]:
            identity = normalize_persian(line)
            if identity in persian_lines:
                raise RuntimeError("Rumi final evidence contains overlapping Persian lines.")
            persian_lines.add(identity)
    return sorted(compiled, key=lambda entry: entry["segmentId"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hafez-embeddings", type=Path, required=True)
    parser.add_argument("--rumi-selected", type=Path, required=True)
    parser.add_argument("--rumi-embeddings", type=Path, required=True)
    arguments = parser.parse_args()

    hafez = compile_hafez(arguments.hafez_embeddings)
    rumi = compile_rumi(arguments.rumi_selected, arguments.rumi_embeddings)
    preserved_hafez = sorted(
        path.stem for path in (ROOT / "content-private/hafez").glob("*.yaml")
    )
    preserved_rumi = sorted(
        path.stem for path in (ROOT / "content-private/rumi").glob("*.yaml")
    )
    report = {
        "schemaVersion": 1,
        "generatedAt": "2026-07-16T00:00:00.000Z",
        "methodVersion": "source-bound-alignment-v2",
        "modelLabel": "gpt-5.6-sol",
        "sourceStrategy": {
            "hafezPersian": "hafez-qazvini-ghani-fa-wikisource",
            "hafezEnglish": ["hafez-bell-1897-en", "hafez-clarke-1891-en"],
            "rumiPersian": "rumi-nicholson-fa-wikisource",
            "rumiEnglish": "rumi-whinfield-abridged-en",
        },
        "preserved": {
            "hafez": preserved_hafez,
            "rumi": preserved_rumi,
        },
        "newHafez": hafez,
        "newRumi": rumi,
        "counts": {
            "preservedHafez": len(preserved_hafez),
            "newHafez": len(hafez),
            "finalHafez": len(preserved_hafez) + len(hafez),
            "preservedRumi": len(preserved_rumi),
            "newRumi": len(rumi),
            "finalRumi": len(preserved_rumi) + len(rumi),
            "finalTotal": len(preserved_hafez)
            + len(hafez)
            + len(preserved_rumi)
            + len(rumi),
        },
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Final evidence: {len(hafez)} new Hafez, {len(rumi)} new Rumi -> {REPORT_PATH}"
    )


if __name__ == "__main__":
    main()
