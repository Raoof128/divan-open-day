#!/usr/bin/env bash
#
# Local OCR of the Clarke 1891 Divan scans.
#
# Why this exists: the Internet Archive's OCR of Clarke is too degraded to carry
# an alignment anchor. Verse extraction from `*_djvu.txt` recovers a mean of ~1.5
# numbered couplets per ode where a ghazal runs 5-15, because the couplet numerals
# are mangled. Anchors drawn from that text land in Clarke's commentary rather
# than his translation (the seq-757 defect class).
#
# This renders each page locally and OCRs it locally. No page text is ever routed
# through a model: bulk verbatim transcription of scanned pages trips the output
# filter, and it is not needed. Two independent readings (Archive ABBYY + local
# Tesseract) corroborate each other; disagreements are flagged, never guessed.
#
# Output (git-ignored, never shipped): sources-private/poetry/clarke-ocr/text/
#
# Each page is rendered, OCR'd, and its PNG deleted immediately: holding 400dpi
# PNGs of all 1,078 pages at once would need ~8GB. Pages are independent, so they
# run across cores (JOBS); sequentially this takes ~4.5h, which is why it is
# parallel. Each worker uses its own PNG path — a shared one would race.
#
# Resumable: a page whose .txt already exists is skipped, so an interrupted run
# can simply be re-invoked.
#
# Usage: scripts/poetry/ocr-clarke.sh [volume-1|volume-2] [first-page] [last-page]
#   JOBS=6 scripts/poetry/ocr-clarke.sh volume-1      # override worker count
set -euo pipefail

RAW="sources-private/poetry/raw/hafez-clarke-1891-en"
OUT="sources-private/poetry/clarke-ocr"
DPI=400
# Leave headroom: tesseract+pdftoppm are memory-hungry at 400dpi.
JOBS="${JOBS:-$(( $(sysctl -n hw.ncpu 2>/dev/null || echo 4) - 2 ))}"
(( JOBS < 1 )) && JOBS=1

vol="${1:-volume-1}"
pdf="${RAW}/${vol}.pdf"
[ -f "$pdf" ] || { echo "missing $pdf — run 'pnpm poetry:fetch' first" >&2; exit 1; }

total=$(pdfinfo "$pdf" | awk '/^Pages:/{print $2}')
first="${2:-1}"
last="${3:-$total}"

mkdir -p "${OUT}/text/${vol}" "${OUT}/tmp"
echo "OCR ${vol}: pages ${first}..${last} of ${total} at ${DPI}dpi, ${JOBS} workers"

ocr_page() {
  local p="$1" vol="$2" pdf="$3" out png
  out="${OUT}/text/${vol}/p-$(printf '%04d' "$p")"
  [ -f "${out}.hocr" ] && return 0           # resumable
  png="${OUT}/tmp/${vol}-p${p}"              # per-page path: workers must not race
  pdftoppm -r "$DPI" -f "$p" -l "$p" -png -singlefile "$pdf" "$png" 2>/dev/null || return 0
  # hocr carries x_size (font size) per line. Clarke sets his commentary in
  # smaller type than his verse (notes cluster at x_size<=52, verse at >=56, with
  # a clear valley between). That is a typographic fact about the page, not a
  # guess about the words, and it is the only reliable verse/notes boundary here:
  # Clarke interleaves glosses down the page and numbers them with the same "N."
  # form as his couplets, so keyword and numbering rules both misread glosses as
  # verse. Text is emitted too — the two are read together.
  tesseract "${png}.png" "$out" --psm 6 -l eng txt hocr >/dev/null 2>&1 || true
  rm -f "${png}.png"
}
export -f ocr_page
export OUT DPI

seq "$first" "$last" | xargs -P "$JOBS" -I{} bash -c 'ocr_page "$@"' _ {} "$vol" "$pdf"

rmdir "${OUT}/tmp" 2>/dev/null || true
echo "done ${vol}: $(find "${OUT}/text/${vol}" -name '*.txt' | wc -l | tr -d ' ') pages"
