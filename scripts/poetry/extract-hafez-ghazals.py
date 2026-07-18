#!/usr/bin/env python3
"""Deterministic Hafez ghazal extraction from the Qazvini-Ghani EPUB.

`extract-epub.py` harvests block-level tags (`p`, `h1`-`h6`, `li`,
`blockquote`). The Wikisource Qazvini-Ghani edition lays every ghazal out as a
centred table, one couplet per `<tr>`, each hemistich in
`<td class="b"><span class="beyt">`. None of those are block tags, so the entire
Divan was silently discarded and only the footnote apparatus — which *is* in
`<p>` — reached staging. That is why Hafez produced zero candidates: not a
ranking failure, a missing-text failure.

Widening BLOCK_TAGS globally would change the Rumi extraction and invalidate its
section digests, so this reads the ghazal structure directly instead.

Each ghazal carries its own edition number in the markup, so the reference is
read from the source rather than inferred from file order.

Standard library only. No network. `rawText` is preserved verbatim; `searchText`
is a normalised derivative for matching only and is NEVER published.

Usage:
    python3 scripts/poetry/extract-hafez-ghazals.py \
        --source-id <id> --input <source.epub> --output <ghazals.jsonl>

Emits one JSON object per ghazal, in spine order:
    {sourceId, documentPath, sequence, ghazalNumber, title, hemistichs,
     coupletCount, rawText, searchText, rawTextSha256}
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import unicodedata
import zipfile
from html.parser import HTMLParser
from pathlib import PurePosixPath
from xml.etree import ElementTree

CONTAINER_PATH = "META-INF/container.xml"

PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
PERSIAN_TO_ASCII = {ord(d): str(i) for i, d in enumerate(PERSIAN_DIGITS)}

ZERO_WIDTH = {"​", "‌", "‍", "﻿"}
SEARCH_FOLD = {
    "ي": "ی",  # Arabic Yeh -> Persian Yeh
    "ك": "ک",  # Arabic Kaf -> Persian Keheh
    "ى": "ی",  # Alef Maksura -> Persian Yeh
}


class GhazalExtractor(HTMLParser):
    """Collects `span.beyt` hemistichs and the ghazal's own edition number.

    The number appears in the first small-font span of the opening row. Only the
    first is taken: later small-font spans are page numbers from the printed
    edition, not the ghazal reference.
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hemistichs: list[str] = []
        self.title: str | None = None
        self.ghazal_number: int | None = None
        self._in_beyt = False
        self._in_small = False
        self._in_title = False
        # Wikisource renders a footnote reference as nested elements inside the
        # hemistich: <sup class="mw-ref"><a><span class="cite-bracket">[</span>
        # ۱<span class="cite-bracket">]</span></a></sup>. Closing the hemistich
        # at the first nested </span> truncated ghazal 65 to `…باغ[` in
        # production. Track span depth so only the beyt's own </span> closes it,
        # and suppress everything inside the reference apparatus.
        self._beyt_span_depth = 0
        self._ref_depth = 0
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:  # noqa: ANN001
        attributes = dict(attrs)
        if tag == "title":
            self._in_title = True
            self._buffer = []
            return
        if tag == "sup":
            classes = (attributes.get("class") or "").split()
            if self._ref_depth > 0 or "mw-ref" in classes:
                self._ref_depth += 1
            return
        if tag == "span":
            if self._in_beyt:
                self._beyt_span_depth += 1
                return
            classes = (attributes.get("class") or "").split()
            if "beyt" in classes:
                self._in_beyt = True
                self._beyt_span_depth = 0
                self._buffer = []
                return
            # The edition number is styled, not classed; match the style the
            # source actually uses rather than guessing at position.
            if "font-size:58%" in (attributes.get("style") or "").replace(" ", ""):
                self._in_small = True
                self._buffer = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._in_title:
            self.title = "".join(self._buffer).strip() or None
            self._in_title = False
            self._buffer = []
            return
        if tag == "sup":
            if self._ref_depth > 0:
                self._ref_depth -= 1
            return
        if tag != "span":
            return
        if self._in_beyt:
            if self._beyt_span_depth > 0:
                self._beyt_span_depth -= 1
                return
            text = " ".join("".join(self._buffer).split())
            if text:
                self.hemistichs.append(text)
            self._in_beyt = False
            self._buffer = []
            return
        if self._in_small:
            text = "".join(self._buffer).strip()
            if self.ghazal_number is None and text:
                digits = text.translate(PERSIAN_TO_ASCII)
                if digits.isdigit():
                    self.ghazal_number = int(digits)
            self._in_small = False
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if self._ref_depth > 0:
            return
        if self._in_beyt or self._in_small or self._in_title:
            self._buffer.append(data)


def make_search_text(raw: str) -> str:
    normalised = unicodedata.normalize("NFC", raw)
    folded = []
    for char in normalised:
        if char in ZERO_WIDTH:
            continue
        folded.append(SEARCH_FOLD.get(char, char))
    return " ".join("".join(folded).split()).lower()


def parse_xml_safely(data: bytes) -> ElementTree.Element:
    """Reject DOCTYPE/ENTITY to close XXE and billion-laughs with stdlib only."""
    head = data[:4096].lower()
    if b"<!doctype" in head or b"<!entity" in data.lower():
        raise ValueError("Refusing EPUB XML with a DOCTYPE/ENTITY declaration.")
    return ElementTree.fromstring(data)


def opf_path(epub: zipfile.ZipFile) -> str:
    root = parse_xml_safely(epub.read(CONTAINER_PATH))
    ns = {"c": "urn:oasis:names:tc:opendocument:xmlns:container"}
    rootfile = root.find("./c:rootfiles/c:rootfile", ns)
    if rootfile is None or rootfile.get("full-path") is None:
        raise ValueError("EPUB container.xml has no rootfile full-path")
    return rootfile.get("full-path")


def spine_documents(epub: zipfile.ZipFile, opf: str) -> list[str]:
    opf_dir = PurePosixPath(opf).parent
    root = parse_xml_safely(epub.read(opf))
    ns = {"opf": "http://www.idpf.org/2007/opf"}
    manifest: dict[str, str] = {}
    for item in root.findall("./opf:manifest/opf:item", ns):
        item_id = item.get("id")
        href = item.get("href")
        if item_id is not None and href is not None:
            manifest[item_id] = str(opf_dir / href) if str(opf_dir) != "." else href
    documents: list[str] = []
    for itemref in root.findall("./opf:spine/opf:itemref", ns):
        idref = itemref.get("idref")
        if idref is not None and idref in manifest:
            documents.append(manifest[idref])
    return documents


def extract(source_id: str, input_path: str, output_path: str) -> tuple[int, int, int]:
    records: list[dict[str, object]] = []
    sequence = 0
    skipped_unnumbered = 0
    with zipfile.ZipFile(input_path) as epub:
        names = set(epub.namelist())
        # This EPUB's spine lists several ghazal documents twice. Extracting per
        # spine entry would emit byte-identical duplicate records under one
        # ghazal number, so read each document once, in first-listed order.
        seen_documents: set[str] = set()
        for document in spine_documents(epub, opf_path(epub)):
            if document not in names or document in seen_documents:
                continue
            seen_documents.add(document)
            parser = GhazalExtractor()
            parser.feed(epub.read(document).decode("utf-8"))
            parser.close()

            hemistichs = parser.hemistichs
            if not hemistichs:
                continue
            # A ghazal is couplets: an odd hemistich count means the row
            # structure was not what this reader assumes. Fail loudly rather
            # than publish a half-couplet.
            if len(hemistichs) % 2 != 0:
                raise ValueError(
                    f"{document}: odd hemistich count {len(hemistichs)}; "
                    "couplet structure not as expected"
                )
            # Unnumbered poem tables are qasidas/quatrains/masnavis and other
            # sections, not numbered ghazals. They are real verse but cannot be
            # cited by ghazal number, so they are not emitted here.
            if parser.ghazal_number is None:
                skipped_unnumbered += 1
                continue

            raw_text = "\n".join(hemistichs)
            records.append(
                {
                    "sourceId": source_id,
                    "documentPath": document,
                    "sequence": sequence,
                    "ghazalNumber": parser.ghazal_number,
                    "title": parser.title,
                    "hemistichs": hemistichs,
                    "coupletCount": len(hemistichs) // 2,
                    "rawText": raw_text,
                    "searchText": make_search_text(raw_text),
                    "rawTextSha256": hashlib.sha256(
                        raw_text.encode("utf-8")
                    ).hexdigest(),
                }
            )
            sequence += 1

    # Four ghazals carry a number that another ghazal also carries: the source
    # transcription itself prints the same number on two different poems (e.g.
    # c127 and c128 are both numbered ۱۲۳). File order hints at what the second
    # one "should" be, and the hinted numbers are exactly the ones otherwise
    # absent — but acting on that hint would mean inventing a poem number
    # against the source. Flag both sides instead; a ghazal whose reference is
    # ambiguous cannot be cited, and 490 unambiguous ghazals remain.
    counts: dict[int, int] = {}
    for record in records:
        number = record["ghazalNumber"]
        assert isinstance(number, int)
        counts[number] = counts.get(number, 0) + 1
    for record in records:
        number = record["ghazalNumber"]
        assert isinstance(number, int)
        record["numberAmbiguous"] = counts[number] > 1

    with open(output_path, "w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
    ambiguous = sum(1 for r in records if r["numberAmbiguous"])
    return len(records), skipped_unnumbered, ambiguous


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Extract Hafez ghazals from an EPUB.")
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)
    count, skipped, ambiguous = extract(args.source_id, args.input, args.output)
    sys.stderr.write(
        f"Extracted {count} numbered ghazals from {args.source_id} "
        f"({skipped} unnumbered poem sections skipped, "
        f"{ambiguous} flagged numberAmbiguous and not citable).\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
