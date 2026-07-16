---
name: divan-accessibility-qa
description: Audit and repair DIVAN for WCAG 2.2 AA, bilingual Persian and English semantics, keyboard use, focus, reduced motion, reduced data, reflow, zoom, and accessible media fallbacks.
---

# DIVAN Accessibility QA

## Standard

Target WCAG 2.2 AA plus the project requirements below.

## Mandatory checks

- semantic landmarks and heading order;
- a working skip link;
- visible focus that is not obscured;
- keyboard-only completion of entrance, poet choice, reveal, redraw, and secondary pages;
- no keyboard trap inside cinematic controls;
- result announcement that does not reread the entire page;
- English first and Persian directly beneath;
- Persian `lang="fa" dir="rtl"`;
- correct text shaping and reading order;
- 320 CSS px reflow and 200 percent zoom;
- accessible control target size consistent with the project design;
- reduced-motion and failed-video equivalents;
- user-initiated audio with transcript when audio exists;
- decorative SVG/effects hidden from assistive technology;
- no colour-only state;
- no information dependent on animation, hover, or pointer precision;
- pause/skip control for nonessential motion.

## Manual matrix

Test current Safari on iPhone, Chrome on Android or emulation, Safari or Chrome on macOS, keyboard-only navigation, VoiceOver where available, reduced motion, increased text size, and landscape orientation.

## Defect format

For each defect record:

- severity;
- exact reproduction;
- relevant WCAG criterion;
- affected component;
- recommended repair;
- verification evidence.
