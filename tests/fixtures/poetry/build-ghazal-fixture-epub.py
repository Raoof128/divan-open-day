#!/usr/bin/env python3
"""Build a synthetic EPUB shaped like the Qazvini-Ghani Hafez edition.

The real edition lays each ghazal out as a centred table: the ghazal's own
number in a left-aligned cell, the printed page number in a right-aligned cell,
and each hemistich in `<span class="beyt">`. This fixture reproduces that shape
— and the three defects the real source actually contains — without copying any
poetry. Every Persian string here is a TEST ONLY sentinel, NOT POETRY.

Usage:
    python3 tests/fixtures/poetry/build-ghazal-fixture-epub.py <output.epub>
"""
from __future__ import annotations

import sys
import zipfile

CONTAINER = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OPS/content.opf"
    media-type="application/oebps-package+xml"/></rootfiles>
</container>
"""


def ghazal_document(title: str, number: str, page: str, hemistichs: list[str]) -> str:
    rows = []
    for index in range(0, len(hemistichs), 2):
        # The number cell is left-aligned and only carries a value on row one;
        # the page-number cell is right-aligned. Both use the same small font,
        # which is exactly why position, not styling alone, decides meaning.
        number_cell = number if index == 0 else ""
        rows.append(
            f'<tr style="text-align:center;">'
            f'<td style="text-align:left;">'
            f'<span style="font-size:58%;">{number_cell}</span></td>'
            f'<td colspan="2" class="b">'
            f'<span class="beyt">{hemistichs[index]}</span></td>'
            f'<td colspan="2" class="b">'
            f'<span class="beyt">{hemistichs[index + 1]}</span></td>'
            f'<td style="text-align:right;">'
            f'<span style="font-size:58%;">{page if index == 0 else ""}</span></td>'
            f"</tr>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fa" dir="rtl">'
        f"<head><title>{title}</title></head><body>"
        '<span class="poem"><table><tbody>'
        + "".join(rows)
        + "</tbody></table></span>"
        # Footnote apparatus lives in <p>. The original block extractor captured
        # only this and dropped every poem; the ghazal reader must ignore it.
        "<p>↑ TEST ONLY EDITORIAL FOOTNOTE — NOT POETRY</p>"
        "</body></html>"
    )


# A numbered ghazal, three couplets.
GHAZAL_ONE = ghazal_document(
    "آزمایش یکم — TEST ONLY",
    "۱",
    "۱۰",
    [
        "سطر آزمایشی یکم NOT POETRY",
        "سطر آزمایشی دوم NOT POETRY",
        "سطر آزمایشی سوم NOT POETRY",
        "سطر آزمایشی چهارم NOT POETRY",
        "سطر آزمایشی پنجم NOT POETRY",
        "سطر آزمایشی ششم NOT POETRY",
    ],
)

# A second numbered ghazal. ZWNJ and Arabic Yeh are present on purpose: rawText
# must preserve both, searchText must fold them.
GHAZAL_TWO = ghazal_document(
    "آزمایش دوم — TEST ONLY",
    "۲",
    "۱۲",
    [
        "می‌آزماید يک NOT POETRY",
        "می‌آزماید دو NOT POETRY",
    ],
)

# Defect 1: the source numbers two different ghazals ۲. Both must be flagged
# numberAmbiguous rather than silently mis-cited or renumbered.
GHAZAL_COLLIDES = ghazal_document(
    "آزمایش سوم — TEST ONLY",
    "۲",
    "۱۴",
    [
        "سطر آزمایشی هفتم NOT POETRY",
        "سطر آزمایشی هشتم NOT POETRY",
    ],
)

# Defect 2: an unnumbered poem section (qasida/masnavi). Real verse, but it
# carries no ghazal number, so it cannot be cited and must be skipped.
UNNUMBERED = ghazal_document(
    "آزمایش بی‌شماره — TEST ONLY",
    "",
    "",
    [
        "سطر آزمایشی نهم NOT POETRY",
        "سطر آزمایشی دهم NOT POETRY",
    ],
)

# Defect 4: a Wikisource footnote reference sits mid-hemistich. The bracket
# glyphs are their own nested <span class="cite-bracket"> elements inside
# <sup class="mw-ref"> — the shape that truncated the real ghazal 65 to
# `…باغ[`. The whole apparatus must be suppressed and the hemistich must come
# through complete.
FOOTNOTE_REF = (
    '<sup about="#t1" class="mw-ref reference" id="c1" rel="dc:references"'
    ' typeof="mw:Extension/ref"><a href="#n1" epub:type="noteref">'
    '<span class="cite-bracket">[</span>۱'
    '<span class="cite-bracket">]</span></a></sup>'
)
GHAZAL_FOOTNOTED = ghazal_document(
    "آزمایش پانوشت — TEST ONLY",
    "۵",
    "۱۶",
    [
        f"سطر آزمایشی یازدهم{FOOTNOTE_REF} دنباله NOT POETRY",
        "سطر آزمایشی دوازدهم NOT POETRY",
    ],
)

DOCUMENTS = {
    "OPS/g1.xhtml": GHAZAL_ONE,
    "OPS/g2.xhtml": GHAZAL_TWO,
    "OPS/g3.xhtml": GHAZAL_COLLIDES,
    "OPS/g4.xhtml": UNNUMBERED,
    "OPS/g5.xhtml": GHAZAL_FOOTNOTED,
}

# Defect 3: this EPUB's spine lists g1 twice. Reading per spine entry would emit
# duplicate records under one ghazal number.
SPINE = ["g1", "g2", "g1", "g3", "g4", "g5"]

OPF = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">'
    '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
    "<dc:identifier id=\"uid\">divan-ghazal-fixture</dc:identifier>"
    "<dc:title>TEST ONLY GHAZAL FIXTURE</dc:title></metadata>"
    "<manifest>"
    + "".join(
        f'<item id="{name}" href="{name}.xhtml" media-type="application/xhtml+xml"/>'
        for name in ["g1", "g2", "g3", "g4", "g5"]
    )
    + "</manifest><spine>"
    + "".join(f'<itemref idref="{ref}"/>' for ref in SPINE)
    + "</spine></package>"
)


def build(output: str) -> None:
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as epub:
        epub.writestr("mimetype", "application/epub+zip")
        epub.writestr("META-INF/container.xml", CONTAINER)
        epub.writestr("OPS/content.opf", OPF)
        for path, body in DOCUMENTS.items():
            epub.writestr(path, body)


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        sys.stderr.write("usage: build-ghazal-fixture-epub.py <output.epub>\n")
        return 2
    build(argv[0])
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
