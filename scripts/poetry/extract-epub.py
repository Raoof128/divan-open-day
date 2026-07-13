#!/usr/bin/env python3
"""Deterministic EPUB -> staging JSONL extraction for DIVAN source archival.

Standard library only. No network. Preserves the raw source transcription
(`rawText`) verbatim and derives a separate `searchText` that may be normalised
for matching only. The public poem is NEVER generated from `searchText`.

Usage:
    python3 scripts/poetry/extract-epub.py \
        --source-id <id> --input <source.epub> --output <staging.jsonl>

Emits one JSON object per text block, in spine then document order:
    {sourceId, documentPath, sequence, headingPath, rawText, searchText,
     rawTextSha256}
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

# Block-level elements whose text content becomes one extracted block.
BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"}
HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
SKIP_TAGS = {"script", "style"}

# Zero-width characters stripped for SEARCH text only (ZWNJ is meaningful in
# Persian and is preserved in rawText; here it is removed purely to make search
# matching robust).
ZERO_WIDTH = {"​", "‌", "‍", "﻿"}
# Arabic -> Persian letter folding for SEARCH text only.
SEARCH_FOLD = {
    "ي": "ی",  # Arabic Yeh -> Persian Yeh
    "ك": "ک",  # Arabic Kaf -> Persian Keheh
    "ى": "ی",  # Alef Maksura -> Persian Yeh
}


class BlockExtractor(HTMLParser):
    """Collects block-level text, tracking heading context; skips script/style."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[tuple[list[str], str]] = []
        self._headings: dict[int, str] = {}
        self._skip_depth = 0
        self._block_tag: str | None = None
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:  # noqa: ANN001
        if tag in SKIP_TAGS:
            self._skip_depth += 1
            return
        if tag == "br" and self._block_tag is not None:
            self._buffer.append("\n")
            return
        if tag in BLOCK_TAGS:
            # A new block boundary; flush any pending buffer first.
            self._flush()
            self._block_tag = tag
            self._buffer = []

    def handle_endtag(self, tag: str) -> None:
        if tag in SKIP_TAGS:
            if self._skip_depth > 0:
                self._skip_depth -= 1
            return
        if tag in BLOCK_TAGS and self._block_tag == tag:
            text = self._current_text()
            if tag in HEADING_TAGS and text:
                level = int(tag[1])
                self._headings[level] = text
                for deeper in [k for k in self._headings if k > level]:
                    del self._headings[deeper]
            if text:
                self.blocks.append((self._heading_path(), text))
            self._block_tag = None
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if self._skip_depth > 0 or self._block_tag is None:
            return
        self._buffer.append(data)

    def _current_text(self) -> str:
        # Preserve internal text faithfully; only trim the outer indentation
        # whitespace introduced by HTML source formatting.
        return "".join(self._buffer).strip()

    def _heading_path(self) -> list[str]:
        return [self._headings[level] for level in sorted(self._headings)]

    def _flush(self) -> None:
        self._block_tag = None
        self._buffer = []


def make_search_text(raw: str) -> str:
    normalised = unicodedata.normalize("NFC", raw)
    folded_chars = []
    for char in normalised:
        if char in ZERO_WIDTH:
            continue
        folded_chars.append(SEARCH_FOLD.get(char, char))
    collapsed = " ".join("".join(folded_chars).split())
    return collapsed.lower()


def parse_xml_safely(data: bytes) -> ElementTree.Element:
    """Parse trusted-but-verified EPUB XML without entity/DTD processing.

    The stdlib XML parser is vulnerable to XXE and billion-laughs via DTD entity
    expansion. `defusedxml` is not a standard-library module, so instead we reject
    any document declaring a DOCTYPE or ENTITY (legitimate EPUB container.xml and
    content.opf never do), closing both attack classes with the stdlib only.
    """
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


def extract(source_id: str, input_path: str, output_path: str) -> int:
    records: list[dict[str, object]] = []
    sequence = 0
    with zipfile.ZipFile(input_path) as epub:
        names = set(epub.namelist())
        for document in spine_documents(epub, opf_path(epub)):
            if document not in names:
                continue
            parser = BlockExtractor()
            parser.feed(epub.read(document).decode("utf-8"))
            parser.close()
            for heading_path, raw_text in parser.blocks:
                records.append(
                    {
                        "sourceId": source_id,
                        "documentPath": document,
                        "sequence": sequence,
                        "headingPath": heading_path,
                        "rawText": raw_text,
                        "searchText": make_search_text(raw_text),
                        "rawTextSha256": hashlib.sha256(
                            raw_text.encode("utf-8")
                        ).hexdigest(),
                    }
                )
                sequence += 1

    with open(output_path, "w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(
                json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n"
            )
    return len(records)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Extract an EPUB into staging JSONL.")
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)
    count = extract(args.source_id, args.input, args.output)
    sys.stderr.write(f"Extracted {count} blocks from {args.source_id}.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
