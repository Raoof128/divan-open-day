#!/usr/bin/env python3
"""Builds a tiny deterministic EPUB used by the extraction tests.

Not production content. The "Persian" and "English" text are conspicuous test
strings, not poetry. Usage: python3 build-fixture-epub.py <output.epub>
"""
import sys
import zipfile

CONTAINER = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""

OPF = """<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">divan-fixture</dc:identifier>
    <dc:title>DIVAN extraction fixture (TEST ONLY)</dc:title>
    <dc:language>fa</dc:language>
  </metadata>
  <manifest>
    <item id="chap1" href="chap1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap2" href="chap2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chap1"/>
    <itemref idref="chap2"/>
  </spine>
</package>
"""

# ZWNJ (‌) is meaningful in Persian and must survive in rawText. Arabic Yeh
# (ي) and Kaf (ك) are folded only in searchText.
CHAP1 = """<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head>
<style>body { font-family: serif; }</style></head>
<body>
  <h1>Book One</h1>
  <p>تست‌می درياک</p>
  <p>NOT POETRY line two</p>
</body></html>
"""

CHAP2 = """<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head></head>
<body>
  <h1>Book Two</h1>
  <h2>A Section</h2>
  <script>console.log('should be excluded');</script>
  <p>TEST ONLY English block<br/>second visual line</p>
</body></html>
"""


# A container.xml carrying a DOCTYPE + internal ENTITY — the shape an XXE /
# billion-laughs payload would take. The extractor must refuse it.
MALICIOUS_CONTAINER = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE container [ <!ENTITY lol "lol"> ]>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""


def build(output_path: str, malicious: bool = False) -> None:
    with zipfile.ZipFile(output_path, "w") as epub:
        # EPUB requires an uncompressed mimetype entry first.
        epub.writestr("mimetype", "application/epub+zip", zipfile.ZIP_STORED)
        epub.writestr(
            "META-INF/container.xml",
            MALICIOUS_CONTAINER if malicious else CONTAINER,
        )
        epub.writestr("OEBPS/content.opf", OPF)
        epub.writestr("OEBPS/chap1.xhtml", CHAP1)
        epub.writestr("OEBPS/chap2.xhtml", CHAP2)


if __name__ == "__main__":
    build(sys.argv[1], malicious="--malicious" in sys.argv[2:])
