# DIVAN
## Gauntlet-Audited Agent-Ready Design Specification
### Macquarie University Persian Society Open Day Poetry Experience

**Date:** 12 July 2026  
**Revision:** 2.0, gauntlet-audited  
**Document type:** Product, experience, visual, content, accessibility, security, deployment and verification specification  
**Prepared for:** Macquarie University Persian Society  
**Primary use:** University Open Day stall  
**Implementation status:** Ready for repository and Droplet discovery, followed by implementation planning  
**Public launch status:** Blocked until the governance, content-rights, cultural-review, accessibility and production launch gates pass  
**Working product name:** **DIVAN**  
**Public line:** **A verse is waiting for you.**  
**Persian line:** **بیتی در انتظار توست**

---

# 0. Authority, status and final architecture decision

This document is the design authority for release 1 of DIVAN.

Build a mobile-first, bilingual Persian poetry experience reached by scanning a QR code at the Persian Society Open Day stall. The visitor chooses one of two culturally distinct paths:

1. **Open the Divan — Hafez**  
   Persian label: **فال حافظ**  
   A respectful, tradition-inspired reading from Hafez.

2. **A Moment of Reflection — Rumi**  
   Persian label: **لحظه‌ای با مولانا**  
   A reflective encounter with Rumi that is not represented as traditional Fāl.

The visitor receives, in this mandatory order:

1. English translation;
2. original Persian;
3. a short reviewed reflection;
4. exact edition-specific provenance;
5. optional rights-cleared Persian recitation;
6. local save/share and another-draw actions.

## 0.1 Locked technical decision

Release 1 is a **static, offline-capable React application**. It has no visitor database, no dynamic public write API and no runtime application server.

The production path is:

```text
Visitor browser
    ↓
Cloudflare DNS, TLS and edge protection
    ↓
Cloudflare Tunnel
    ↓
cloudflared container
    ↓
private origin network
    ↓
unprivileged static web container
    ↓
versioned HTML, CSS, JavaScript, fonts, images, audio and compiled public corpus
```

The implementation stack is:

- Vite;
- React;
- TypeScript strict mode;
- a hand-controlled service worker;
- an unprivileged static web server container;
- Cloudflare Tunnel;
- Docker Compose on the existing DigitalOcean Droplet.

Node.js is required only for development, testing and building. It does not run in the production web container.

## 0.2 Why there is no dynamic backend

A dynamic backend would add no useful capability to release 1 because:

- the content is public and versioned;
- the draw happens privately in the browser;
- the site collects no visitor input;
- the site stores no visitor record;
- content publication occurs through reviewed Git changes;
- a database would create additional attack surface, backup obligations and privacy risk.

The release still has a controlled backend lifecycle: content compilation, validation, image building, deployment, Cloudflare delivery, health checks, release switching and rollback.

## 0.3 Non-negotiable public behaviour

DIVAN must:

- show English first and Persian directly underneath;
- render Persian as live text with correct language and direction markup;
- distinguish Hafez tradition from Rumi reflection;
- identify each source by edition and stable textual reference;
- collect no personal information;
- use no advertising, analytics, tracking pixels, fingerprinting or social SDKs;
- use no cookie or server session;
- continue working after first successful load if connectivity fails;
- remain isolated from the ballot and EOI systems;
- expose no Droplet application port to the public internet;
- use no unreviewed poem, translation, interpretation, recording, image or font.

---

# 1. Agent operating contract

The implementation agent must:

1. Read this document completely before editing code.
2. Inspect the target repository, Cloudflare configuration and Droplet before creating an implementation plan.
3. Resolve every discovery item in section 28, Phase 0, before coding.
4. Produce a separate task-by-task implementation plan with file paths, tests, commands and rollback points.
5. Work on a dedicated branch or isolated worktree.
6. Use small, reviewable commits.
7. Preserve existing ballot and EOI code, infrastructure, databases, volumes, routes and secrets unchanged.
8. Use only reviewed poetry, translations, audio, images, illustrations and fonts with documented rights.
9. Never invent, silently modernise or silently paraphrase text attributed to Hafez or Rumi.
10. Never publish AI-generated translation, source attribution or interpretation without accountable human review.
11. Never add accounts, forms, analytics, advertising, profiling, fingerprinting or third-party CAPTCHA.
12. Never expose the Droplet IP as an application origin, publish container ports or reveal credentials and private paths.
13. Never make a performance, privacy, accessibility, rights or security claim without recorded evidence.
14. Implement reduced motion as a complete visual experience.
15. Fail closed when content, rights, integrity, build or deployment validation fails.
16. Produce the evidence required by section 30 before claiming implementation completion.
17. Produce a launch-readiness decision against every criterion in section 31.

## 1.1 Mandatory stop conditions

The agent must stop before public launch if any condition below is true:

- official-event approval is missing where required;
- Society or University name/logo use lacks the required approval;
- the public domain and final hostname are not controlled by the Society or an authorised University owner;
- a modern translation lacks a written rights basis covering web publication and share-card reuse;
- an audio recording lacks performer consent and a sufficient licence;
- an image, illustration or font lacks a recorded licence;
- a Persian excerpt cannot be traced to an approved edition and stable reference;
- a Hafez reference relies only on a ghazal number without edition and opening-line identification;
- a poem has not passed Persian-source, Persian-literary, English and cultural review;
- the site asks for or persists personal information;
- the site emits analytics or tracking requests;
- the application or web server intentionally records IP addresses, user agents, referrers, poem selections or session identifiers;
- the Droplet origin is reachable outside the Cloudflare path;
- the application can connect to ballot or EOI data or networks;
- the service worker can mix assets or content from different releases;
- offline fallback, keyboard completion, screen-reader flow, contrast, reflow or reduced motion fails;
- the printed QR destination, quiet zone, physical size and device matrix are unverified;
- production rollback has not been rehearsed;
- serious or critical security findings remain open;
- the current release cannot be reproduced from the tagged source and lockfile.

## 1.2 No false “100%” claim

This document can be implementation-ready, but it cannot make unknown external facts magically complete. Public launch remains blocked until Macquarie approvals, actual Droplet facts, final content rights and human literary reviews are evidenced.

---

# 2. Research and policy basis

The design is grounded in current official or primary sources reviewed on 12 July 2026. Full references appear in section 35.

## 2.1 Macquarie governance

The current Macquarie University Student Groups Policy states that affiliated groups must be open to students with a genuine interest, may apply to use the University name or logo, must collect only personal information necessary for administration and must seek approval for official events. Macquarie’s current student-group management page identifies Student Engagement, Inclusion and Belonging as the relevant support area and publishes `studentgroups@mq.edu.au` for questions. [R1][R2]

Design consequences:

- the activity follows the required event-approval pathway;
- University name and logo use are explicit launch gates;
- the page does not imply University authorship, translation or endorsement;
- the product collects no visitor personal information because none is necessary;
- the experience welcomes all visitors with a genuine interest in Persian culture.

## 2.2 Accessibility

WCAG 2.2 is a W3C Recommendation. It covers keyboard access, focus visibility, focus not obscured, target size, reflow, contrast, language, motion and other requirements across desktop, mobile and kiosk contexts. [R3]

Design consequences:

- target WCAG 2.2 AA;
- use 44 by 44 CSS pixels as the project minimum target size for primary controls;
- preserve full functionality at 200% zoom and 320 CSS-pixel reflow;
- provide complete reduced-motion behaviour;
- test assistive technology manually;
- treat Persian `lang` and `dir` markup as semantics, not decoration.

## 2.3 Persian directionality

W3C internationalisation guidance requires direction to be expressed with HTML `dir`, not simulated only through CSS, and recommends logical CSS properties for bilingual layouts. [R10]

Design consequences:

- the document is `lang="en" dir="ltr"`;
- every Persian structural region is `lang="fa" dir="rtl"`;
- mixed inline identifiers use `<bdi>` where needed;
- CSS uses logical start/end properties.

## 2.4 Offline-first delivery

Service workers can intercept requests and serve cached assets over HTTPS, enabling offline-first behaviour, but install and activation must be versioned carefully. [R4]

Design consequences:

- cache only complete, validated releases;
- never activate a partially downloaded release;
- keep the previous complete release until the next release activates successfully;
- use a staff tablet pre-cached before the event.

## 2.5 Private random selection

`crypto.getRandomValues()` provides cryptographically strong random values and is broadly available. [R5]

Design consequences:

- perform each draw locally;
- use rejection sampling to avoid modulo bias;
- never use `Math.random()` as a production fallback;
- store only public content IDs in session storage.

## 2.6 Cloudflare origin isolation

Cloudflare Tunnel uses outbound-only connections from `cloudflared`, allowing an origin to serve traffic without a publicly routable application port. [R6]

Design consequences:

- `cloudflared` must have outbound network access;
- the origin container remains on a private Docker network;
- no host `ports:` mapping is allowed;
- the Compose design uses two networks so `cloudflared` can reach both the origin and Cloudflare.

## 2.7 Droplet hardening

DigitalOcean recommends SSH-key authentication, non-root administration, a Cloud Firewall, monitoring and backups for production Droplets. [R7]

Design consequences:

- use a non-root sudo administrator;
- disable root and password SSH login;
- attach a DigitalOcean Cloud Firewall;
- enable host monitoring and security updates;
- verify the Droplet region before making geographic-hosting claims.

## 2.8 Copyright and moral rights

Australian copyright protects literary, artistic and sound-recording material and recognises attribution, integrity and protection against false attribution as moral rights. Copyright duration and permission requirements depend on the material. [R9]

Design consequences:

- ancient Persian source text and modern translation rights are evaluated separately;
- “Society-prepared” does not itself transfer ownership to the Society;
- every translator, editor, illustrator, photographer and performer signs or grants a documented licence sufficient for the release;
- attribution and integrity requirements are preserved.

## 2.9 Museum images

The Metropolitan Museum of Art makes qualifying Open Access images available under CC0 when the object is marked accordingly. Per-object status must still be checked. [R8]

Design consequences:

- museum material is optional supporting material, not the primary visual system;
- per-object rights, accession and credit are recorded;
- core ornament is original.

## 2.10 QR production

DENSO WAVE specifies a four-module quiet zone and notes that larger modules improve scan stability. It identifies Level M as the usual error-correction choice and Level Q or H as useful in harsher or damaged environments. [R15][R16]

Design consequences:

- use the shortest stable URL possible;
- default to Level M for clean stall print;
- use Level Q only if print conditions or an approved overlay justify it and tests pass;
- size each physical QR for its intended scan distance rather than applying one arbitrary minimum.

---

# 3. Product goals and non-goals

## 3.1 Primary goals

- Deliver a memorable cultural interaction in approximately 45 to 90 seconds.
- Introduce Persian poetry without assuming prior knowledge.
- Welcome international, domestic, Persian-speaking and non-Persian-speaking visitors.
- Preserve original Persian text and literary provenance.
- Encourage an in-person conversation with Society volunteers.
- Be visually distinctive enough that a visitor wants to show the result to a friend.
- Operate reliably on ordinary phones and imperfect campus Wi-Fi.
- Avoid visitor-data collection entirely.

## 3.2 Success definition

Release 1 succeeds when:

- a visitor can scan, understand, choose, reveal and read without staff assistance;
- the welcome screen becomes usable quickly on a normal mobile connection;
- the reveal feels ceremonial without becoming slow or inaccessible;
- English appears before Persian on every result;
- all content has documented provenance, rights and human review;
- the experience continues after network loss following first successful load;
- the QR passes real print, distance, glare and device tests;
- no visitor record is created;
- ballot and EOI systems remain unchanged and healthy.

## 3.3 Release 1 non-goals

Do not build:

- login or accounts;
- membership registration;
- contact or feedback forms;
- email collection;
- public comments;
- server-side personalisation;
- AI-generated live poems, translations or interpretations;
- predictive, medical, legal, financial or religious advice;
- a public content-management dashboard;
- social-media SDKs;
- visitor counting based on identifiers;
- a leaderboard, reward wheel, streak or casino-style mechanic;
- autoplay audio;
- a complete scholarly digital archive;
- remote poetry APIs;
- a production database.

---

# 4. Cultural framing and content tone

## 4.1 Hafez mode

Public name:

> **Open the Divan**

Persian label:

> **فال حافظ**

Description:

> Inspired by the Iranian tradition of opening the Divan of Hafez for reflection. Hold a question or hope in your mind, then reveal a verse.

Mandatory disclaimer:

> This is a cultural reflection experience. It does not predict outcomes and is not medical, legal, financial, religious or professional advice.

Rules:

- describe the mode as tradition-inspired rather than claiming to reproduce every ritual practice;
- do not promise a prediction;
- do not assign one fixed authoritative meaning to a ghazal;
- preserve ambiguity and symbolism;
- include an edition-specific source reference.

## 4.2 Rumi mode

Public name:

> **A Moment of Reflection**

Persian label:

> **لحظه‌ای با مولانا**

Description:

> Take a quiet moment and receive a passage from Rumi for contemplation.

Rules:

- do not label it traditional Fāl-e Rumi;
- do not reduce Rumi to generic motivational copy;
- preserve Persian, historical, literary and relevant Islamic or Sufi context;
- reject quotations that cannot be traced to a primary work and approved edition;
- distinguish translation from adaptation and paraphrase.

## 4.3 Reflection rule

Every result includes:

> **A reflection, not a prediction**

Each reflection:

- is 45 to 90 words;
- acknowledges ambiguity;
- avoids certainty and commands;
- avoids diagnosing or advising on health, relationships, money, study, immigration or law;
- may explain one or two symbols;
- does not claim the poet directly addressed the visitor’s modern circumstances;
- does not erase religious or historical context to make the text more marketable;
- is reviewed and versioned like the translation.

## 4.4 Staff conduct

Stall staff must:

- never ask what private question a visitor held in mind;
- never claim a result is destiny;
- never offer medical, financial, legal or spiritual direction based on a result;
- explain that translations and reflections are reviewed interpretations;
- direct content concerns to the named content owner.

---

# 5. Experience architecture and browser state

## 5.1 Core flow

```text
SCAN QR
   ↓
WELCOME
   ↓
CHOOSE POET
   ↓
HOLD AN INTENTION
   ↓
REVEAL
   ↓
ENGLISH VERSE
   ↓
PERSIAN ORIGINAL
   ↓
REFLECTION + SOURCE
   ↓
LISTEN / SAVE / REVEAL ANOTHER / VISIT STALL
```

## 5.2 State machine

```text
BOOT
  → WELCOME
  → CHOOSE_POET
  → INTENTION
  → REVEALING
  → RESULT
  → RESULT_ACTION
```

Allowed transitions are explicit. Invalid transitions return to the nearest safe state.

## 5.3 Browser history model

Use `history.pushState()` for meaningful stages. History state contains only:

```text
stage
selected_poet
release_id
```

Do not place poem IDs, visitor intentions or session IDs in the URL.

Rules:

- Back from RESULT returns to INTENTION for the selected poet;
- Back from INTENTION returns to CHOOSE_POET;
- refresh may restore the selected poet and current public poem ID from `sessionStorage`;
- direct entry to an invalid stage returns to WELCOME;
- the active scene is mounted as the only primary content scene;
- only the active scene contains the page `h1`;
- result focus is applied with `tabindex="-1"` after content is ready;
- failed audio or share actions never remove the poem.

## 5.4 Session storage contract

Allowed keys:

```text
divan.releaseId
divan.selectedPoet
divan.shuffle.hafez
divan.shuffle.rumi
divan.currentPoemId
divan.motionPreference
```

Values contain public release or content identifiers only.

Do not use `localStorage` except for the optional motion preference. If the motion preference is stored there, document the key and never transmit it.

---

# 6. Visual design thesis

## 6.1 Creative direction

The interface evokes:

- an illuminated Persian manuscript opened in a night garden;
- gold leaf catching low light;
- ink, paper, lapis, pomegranate and cypress;
- Persian geometry interpreted through contemporary editorial restraint;
- tactile depth without visual clutter.

It must not become:

- generic “Middle Eastern” decoration;
- a carpet image behind text;
- a neon party flyer;
- a slot-machine reveal;
- a copied museum page;
- an orientalist fantasy;
- a religious oracle;
- an inaccessible animation showcase.

## 6.2 Scene language

### Hafez

Motifs:

- pomegranate;
- cypress;
- Shiraz garden;
- nightingale abstraction;
- manuscript red;
- warm gold;
- deep indigo.

### Rumi

Motifs:

- reed;
- circular geometry;
- lamp light;
- lapis;
- turquoise;
- constellation-like points;
- measured rotational rhythm.

Do not use a whirling figure as decorative shorthand unless the cultural reviewer approves the context and the artwork rights are documented.

## 6.3 Colour tokens

```css
--ink-night: #0B1026;
--ink-deep: #11182D;
--lapis: #174A7E;
--lapis-light: #2E6E9E;
--turquoise: #2C8C8A;
--pomegranate: #A6192E;
--bright-red: #D6001C;
--deep-red: #76232F;
--gold: #D4A64A;
--gold-light: #E7C777;
--parchment: #F2E6CF;
--paper: #FFF9EE;
--cypress: #204F40;
--charcoal: #2E302E;
--muted-ink: #6E675D;
--error: #B42318;
--focus: #78D6FF;
```

Rules:

- gold is ornament, never the only carrier of meaning;
- red is reserved for Society continuity, seals and primary actions;
- long text uses charcoal or deep ink on paper;
- focus remains visible on every background;
- selected, disabled, hover, focus and error states pass measured contrast checks;
- visual tokens are defined once and consumed through semantic component tokens.

## 6.4 Texture

Use original or rights-cleared:

- subtle paper grain;
- low-opacity ink bleed;
- restrained gold noise;
- compressed AVIF/WebP raster assets;
- SVG for geometry.

Do not:

- load a multi-megabyte manuscript scan in the initial viewport;
- place texture behind long text when it reduces readability;
- use external image hotlinks;
- rely on a texture to communicate state.

## 6.5 Original geometry system

Create an original SVG system using:

- eight-point stars;
- rosettes;
- interlocking polygons;
- manuscript corner frames;
- pomegranate and cypress abstractions.

Every decorative SVG:

- is `aria-hidden="true"`;
- has `focusable="false"` where relevant;
- contains no script, event handler or remote `<use>`;
- is sanitised during the build;
- is listed in the asset register;
- is not mistaken for source calligraphy.

---

# 7. Screen specifications

## 7.1 BOOT

Purpose: establish readiness without a generic spinner.

Visual:

- dark ink field;
- one thin gold geometric line;
- Society mark appears after critical assets are ready;
- full-motion duration no longer than 700 ms;
- reduced-motion mode uses a static mark and short fade.

Behaviour:

- read embedded release metadata;
- use the currently active, fully verified cached release when available;
- start a background update check after the welcome screen becomes usable;
- never delay the first usable control for decorative animation;
- show an understated offline badge only when offline status changes the experience.

Failure copy:

> The experience could not finish loading. Try again, or ask us at the Persian Society stall.

## 7.2 WELCOME

Heading:

> **A verse is waiting for you.**

Persian:

> **بیتی در انتظار توست**

Supporting copy:

> Step into a living tradition of Persian poetry. Choose a poet, hold a thought in your mind, and reveal a verse.

Primary action:

> **Begin**

Secondary links:

- About this experience
- Accessibility and motion
- Credits

Composition:

- central manuscript portal;
- low-contrast geometric lattice;
- pomegranate-red seal button;
- faint pointer-responsive light only on capable fine-pointer devices;
- no automatic audio.

The design should fit common phone viewports without unnecessary scrolling, but it must never suppress or trap scrolling. At large text, landscape orientation or 200% zoom, normal document scrolling is required.

## 7.3 CHOOSE POET

Heading:

> **Whose words will you open?**

### Hafez portal

> **Open the Divan**  
> A tradition-inspired reading from Hafez.  
> **فال حافظ**

### Rumi portal

> **A Moment of Reflection**  
> A passage from Rumi for contemplation.  
> **لحظه‌ای با مولانا**

Interaction rules:

- use real `<button type="button">` elements;
- provide visible focus;
- use a 44 by 44 CSS-pixel minimum target;
- communicate state with text/icon/border as well as colour;
- treat hover as optional enhancement;
- disable tilt and parallax under reduced motion or coarse pointer.

## 7.4 INTENTION

Hafez copy:

> Take a quiet moment. Hold a question or hope in your mind. When you are ready, open the Divan.

Rumi copy:

> Take one slow breath. Hold a thought you would like to carry differently. When you are ready, reveal a passage.

Primary control:

> **Press to reveal**

Rules:

- one activation only;
- no long press;
- no camera, microphone, motion sensor, gyroscope, geolocation or haptic permission;
- immediate pressed feedback;
- status announced through a polite live region;
- disclaimer visible in the same viewport where practical, and otherwise directly following the control.

## 7.5 REVEAL

Full-motion choreography:

1. Background lattice darkens slightly.
2. Manuscript cover rotates in shallow CSS perspective.
3. Inner paper layers separate.
4. Illuminated border resolves outward.
5. A non-text calligraphic ornamental stroke appears.
6. Result card rises through the centre.
7. Focus moves to the result heading only after the result is mounted.

Timing:

- target duration: 1.6 seconds;
- hard maximum: 2.4 seconds;
- Skip animation control is keyboard reachable and appears within 300 ms;
- reduced motion uses a 120 to 180 ms opacity transition;
- no flash, rapid zoom, simulated falling or continuous rotation;
- no essential information is conveyed only through animation.

## 7.6 RESULT

Mandatory order:

1. English translation
2. Persian original
3. Reflection
4. Source and translation credit
5. Optional audio
6. Actions

### English block

Heading:

> **Your verse**

Use a readable literary serif. Never use decorative script for body text.

### Persian block

Heading:

> **متن فارسی**

Required markup pattern:

```html
<section lang="fa" dir="rtl" aria-labelledby="persian-heading">
  <h2 id="persian-heading">متن فارسی</h2>
  <div class="poem-lines">...</div>
</section>
```

Persian is live text, not an image.

### Reflection block

Heading:

> **A reflection, not a prediction**

Length: 45 to 90 words.

### Provenance block

Show:

- poet;
- work;
- edition-specific reference;
- opening Persian hemistich or stable source key;
- source edition;
- translator or adaptation status;
- rights/credit statement;
- named public reviewer credit only where written permission exists.

Use `<bdi>` around mixed-direction identifiers and Latin references inside Persian contexts.

### Actions

Primary:

> **Reveal another**

Secondary:

- Listen in Persian
- Save this verse
- Learn about the poet
- Return to the stall

Rules:

- do not repeat within the current poet’s shuffle bag until exhaustion;
- do not promise global uniqueness;
- generate share content locally;
- use no social SDK;
- preserve the current result after audio/share failure;
- “Return to the stall” displays a simple invitation and stall identifier, not device location.

## 7.7 ABOUT

Include:

- concise explanation of Fāl-e Hafez;
- separate explanation of Rumi reflection mode;
- Persian literary and historical context;
- difference between source, translation, adaptation and reflection;
- note that translation is interpretive;
- Society invitation;
- no political advocacy;
- no ethnicity requirement;
- link to credits and privacy.

## 7.8 CREDITS

List:

- source editions;
- translators and their permission status;
- literary and cultural reviewers where public credit is approved;
- reciters and recording rights;
- image sources, accession numbers and licences;
- fonts and licences;
- design/development contributors;
- Society contact;
- release ID, date and content checksum.

Never publish a contributor’s personal contact details without written permission.

---

# 8. Typography and bilingual layout

## 8.1 Font strategy

Self-host all fonts.

Approved initial candidates, subject to licence and rendering tests:

- English display: Cormorant Garamond;
- English interface: Inter;
- Persian body/interface: Vazirmatn;
- Persian decorative heading: Noto Nastaliq Urdu for short display text only.

Rules:

- record the exact font version, source and licence;
- use WOFF2;
- subset only after testing Persian shaping and licence conditions;
- preload no more than the critical interface and Persian-body files;
- use `font-display: swap`;
- do not fetch Google Fonts at runtime;
- do not convert poem text to images or outlines;
- do not use Nastaliq for long result passages;
- retain a readable Persian system-font fallback.

## 8.2 Directionality

Root:

```html
<html lang="en" dir="ltr">
```

Persian regions:

```html
<section lang="fa" dir="rtl">
```

Use logical CSS:

```css
margin-inline;
padding-inline;
border-inline-start;
text-align: start;
inset-inline-start;
```

Do not use CSS `direction` as a substitute for semantic `dir` markup.

## 8.3 Persian source fidelity

- Preserve the approved display text byte-for-byte after review.
- Do not automatically replace Persian and Arabic character variants in published text.
- If validation requires a normalised representation, generate it separately and never render it.
- Preserve approved line breaks, punctuation, diacritics and half-spaces.
- Test joining and punctuation in Safari, Chromium and Firefox.
- Test mixed Persian/Latin source references with `<bdi>`.
- Do not use full justification on short Persian lines.

---

# 9. Motion system

## 9.1 Motion vocabulary

Motion represents:

- opening;
- breath;
- ink;
- paper;
- light;
- unfolding.

Motion does not represent:

- competition;
- reward;
- gambling;
- urgency;
- prediction certainty.

## 9.2 Performance rules

Animate primarily:

- `transform`;
- `opacity`.

Use only bounded, measured filter effects.

Avoid animating:

- width;
- height;
- top;
- left;
- large blur shadows;
- full-viewport SVG filters;
- properties that trigger repeated layout.

## 9.3 Reduced motion

Under `prefers-reduced-motion: reduce`:

- disable cover rotation;
- disable parallax;
- disable path drawing;
- disable particles and continuous movement;
- use a short opacity transition;
- preserve visual hierarchy, ornament and content.

Provide an in-app Motion setting with:

```text
System preference
Reduced
Full
```

The setting is local only and is not transmitted.

## 9.4 View Transitions

The View Transitions API may be used only as progressive enhancement.

Requirements:

- feature-detect;
- complete fallback without it;
- no navigation dependency;
- disable non-essential transitions under reduced motion;
- test Back/Forward behaviour in supporting and non-supporting browsers.

---

# 10. Audio

Audio is optional and user initiated.

Release 1 should use the native `<audio controls>` element unless a custom control passes equivalent keyboard, screen-reader, timing, seeking and state tests.

Requirements:

- no autoplay;
- human-recorded Persian recitation;
- written performer consent and licence;
- visible duration;
- poem text acts as transcript;
- `preload="metadata"` only;
- poem remains usable when audio fails;
- speech-optimised compressed files;
- no background music unless separately rights-cleared and approved;
- no third-party audio host;
- audio asset belongs to the same immutable release as its poem.

Recommended duration: 20 to 60 seconds.

Audio may be removed from release 1 without blocking launch if quality or rights are incomplete.

---

# 11. Corpus scope and editorial balance

## 11.1 Launch size

Preferred:

- 36 Hafez selections;
- 24 Rumi selections;
- 60 total.

Minimum:

- 24 Hafez selections;
- 16 Rumi selections;
- 40 total.

The build must fail below the approved minimum.

## 11.2 Excerpt size

Each item includes:

- 2 to 6 Persian poetic lines or approved equivalent excerpt unit;
- an English translation aligned by line or stanza as declared;
- a 45 to 90 word reflection;
- stable source provenance;
- optional 20 to 60 second recitation.

## 11.3 Curatorial balance

Represent varied themes:

- love;
- patience;
- friendship;
- hospitality;
- hope;
- uncertainty;
- self-knowledge;
- courage;
- wonder;
- learning;
- impermanence;
- joy.

Do not force every selection into a positive fortune. Preserve difficult, ambiguous and layered meanings with suitable context.

---

# 12. Content architecture and schemas

Release 1 has two schemas:

1. **private authoring schema**, retained in the repository and never shipped;
2. **public compiled schema**, included in the production release.

## 12.1 Private authoring file

One YAML file per selection:

```yaml
id: hafez-khanlari-ghazal-source-key
schema_version: 2
status: approved
poet: hafez
mode: open_the_divan

display:
  visual_variant: garden_night
  accent: pomegranate

source:
  work_en: Divan of Hafez
  work_fa: دیوان حافظ
  edition_id: khanlari-approved-edition-id
  edition_citation: full internal bibliographic citation
  reference_type: ghazal
  reference_value: edition-specific reference
  opening_hemistich_fa: reviewed opening hemistich
  page_reference: optional page reference
  source_language: fa

text:
  persian_lines:
    - exact reviewer-approved Persian line
  english_lines:
    - exact reviewer-approved English line
  alignment: line

translation:
  classification: society_translation
  translator_ids:
    - contributor-id
  rights_owner: named rights holder
  permission_record_id: permission-record-id
  public_credit: approved public credit
  permitted_uses:
    - website_display
    - downloadable_share_card
    - event_print
    - archival_hosting
  moral_rights_notes: internal note

reflection:
  english: reviewed reflection
  reviewer_ids:
    - cultural-reviewer-id
  disclaimer_profile: reflection_not_prediction

audio:
  enabled: false
  asset_path: null
  performer_id: null
  permission_record_id: null
  duration_seconds: null

review:
  source_editor_ids:
    - reviewer-id
  persian_literary_reviewer_ids:
    - reviewer-id
  english_editor_ids:
    - reviewer-id
  cultural_reviewer_ids:
    - reviewer-id
  rights_reviewer_ids:
    - reviewer-id
  approved_at: 2026-07-12
  approval_record_id: approval-id
```

Private fields such as reviewer IDs, internal citations, permission record IDs and notes must never enter the public build.

## 12.2 Public compiled item

```json
{
  "id": "hafez-khanlari-ghazal-source-key",
  "schemaVersion": 2,
  "poet": "hafez",
  "mode": "open_the_divan",
  "display": {
    "visualVariant": "garden_night",
    "accent": "pomegranate"
  },
  "source": {
    "workEn": "Divan of Hafez",
    "workFa": "دیوان حافظ",
    "editionPublicCredit": "approved public edition citation",
    "reference": "edition-specific reference",
    "openingHemistichFa": "reviewed opening hemistich"
  },
  "text": {
    "persianLines": ["reviewed Persian line"],
    "englishLines": ["reviewed English line"],
    "alignment": "line"
  },
  "translationCredit": "approved public credit",
  "reflection": "reviewed reflection",
  "audio": null,
  "contentHash": "sha256-of-canonical-public-item"
}
```

## 12.3 Allowlisted values

The compiler must allowlist:

- poet;
- mode;
- visual variant;
- accent;
- reference type;
- alignment type;
- translation classification;
- permitted use;
- disclaimer profile;
- audio MIME type.

## 12.4 Build rejection rules

Reject the release if:

- an ID is duplicated;
- an item is not `approved`;
- poet/mode pairing is invalid;
- edition or stable reference is missing;
- a Hafez item has no edition-specific reference and opening hemistich;
- Persian or English text is empty;
- line/stanza alignment is invalid;
- translation ownership or permission record is missing;
- required public uses are not licensed;
- required reviewers or approval record are missing;
- private fields appear in the public schema;
- a remote media URL exists;
- audio is enabled without performer permission;
- an asset path escapes the approved asset root;
- raw HTML or Markdown is present in a text field;
- a field exceeds its configured size;
- corpus minimum is not met;
- content IDs referenced by audio/assets do not exist;
- canonical public-item hashes fail;
- the final release checksum fails;
- a source YAML file or rights register would be copied into the runtime image.

## 12.5 Blocked content

Reject:

- quotations merely “attributed to Rumi”;
- unsourced social-media text;
- a modern paraphrase labelled translation;
- predictive certainty;
- health, death, marriage, immigration, financial or legal outcome claims;
- fabricated or edition-ambiguous references;
- machine-generated Persian presented as source;
- culture-stripped religious references that materially change meaning;
- exclusionary nationalism;
- copied commercial translation without permission;
- inaccessible line length or broken shaping.

---

# 13. Rights and content review workflow

## 13.1 Roles

- Persian source editor;
- Persian literary reviewer;
- English translation editor;
- cultural-context reviewer;
- rights reviewer;
- technical release owner.

No item may be approved only by its translator.

## 13.2 Rights records

A rights record must state:

- work/asset identifier;
- creator and rights holder;
- source;
- copyright/public-domain status;
- licence or permission text;
- permitted public uses;
- attribution wording;
- modification permission;
- expiry or territorial restriction;
- evidence file location;
- reviewer and review date.

For Society-created translations, recordings or artwork, obtain a written licence or assignment before publication. The licence must cover every actual use, including downloadable share cards and continued archival hosting.

## 13.3 Review workflow

```text
candidate source
  → edition and reference verified
  → Persian excerpt selected
  → English translation drafted
  → Persian literary review
  → English edit
  → reflection drafted
  → cultural review
  → rights review
  → audio/asset review where relevant
  → final approval recorded
  → public item compiled
  → canonical content hash generated
  → release manifest generated
```

## 13.4 AI rule

- AI may assist private drafting only if the Society allows it.
- AI output is never published directly.
- AI is not credited as translator or reviewer.
- Human reviewers accept responsibility for every published word.
- Source verification is performed against the approved edition.
- Invented quotation or provenance is a launch blocker.

---

# 14. Random draw model

## 14.1 Unbiased random integer helper

Use `crypto.getRandomValues()` with rejection sampling. Do not compute `randomUint32 % range` without rejecting the incomplete upper interval.

Pseudo-contract:

```text
secureRandomInt(maxExclusive):
  require integer 1..2^32
  limit = floor(2^32 / maxExclusive) * maxExclusive
  repeat:
    value = crypto.getRandomValues(Uint32Array(1))[0]
  until value < limit
  return value % maxExclusive
```

If `crypto.getRandomValues()` is unavailable, show an unsupported-browser fallback. Do not use `Math.random()`.

## 14.2 Shuffle bag

Run an in-place Fisher-Yates shuffle of approved IDs using `secureRandomInt()`.

Store the remaining public IDs in `sessionStorage` separately for Hafez and Rumi.

## 14.3 Privacy

- no cookie;
- no server session;
- no network request for each draw;
- no visitor identifier;
- no poem ID in URL;
- no visitor intention stored;
- no draw recorded by application logs.

## 14.4 Behaviour

- no repeat before the selected poet’s bag is exhausted;
- when exhausted, reshuffle and announce a new cycle;
- a new tab may create a separate sequence;
- two visitors may receive the same selection;
- no global uniqueness claim.

## 14.5 Tests

Prove:

- every approved ID is reachable;
- only approved IDs are returned;
- no repeat before exhaustion;
- disabled items are excluded;
- empty corpus fails closed;
- range boundaries are correct;
- rejection sampling covers non-power-of-two ranges;
- `Math.random()` is absent from production draw code;
- tests do not claim statistical proof from a tiny sample.

---

# 15. Save and share

Generate share content entirely in the browser.

## 15.1 Share card content

- short English excerpt;
- Persian excerpt;
- poet;
- edition-specific source reference;
- translation credit;
- Society identity;
- short site URL;
- original decorative frame.

## 15.2 Requirements

- do not include the visitor’s private intention;
- do not upload generated content;
- use no social login or SDK;
- use only assets licensed for redistribution in the card;
- use Web Share only after a direct user action;
- test `navigator.share` and `navigator.canShare` where applicable;
- provide PNG download and text-copy fallbacks;
- create and revoke Blob URLs correctly;
- do not retain generated cards after the tab closes;
- test Persian shaping on iOS Safari and Android Chrome.

If image generation cannot preserve Persian shaping in a browser, disable image export there and retain text copy and screenshot guidance.

---

# 16. Offline and release-coherence design

## 16.1 Release artefacts

Each build produces:

```text
index.html
assets/[content-hashed files]
manifest.webmanifest
service-worker.js
release.json
content/[manifest-sha256].json
offline.html
```

`release.json` contains:

```json
{
  "releaseId": "2026-open-day-r1",
  "schemaVersion": 2,
  "builtAt": "2026-07-12T00:00:00Z",
  "itemCount": 60,
  "hafezCount": 36,
  "rumiCount": 24,
  "contentPath": "/content/manifest-sha256.json",
  "contentSha256": "hex",
  "assetManifestSha256": "hex"
}
```

The checksums detect accidental mismatch and release incoherence. They do not replace HTTPS, trusted deployment or container integrity.

## 16.2 Cache policy

Cache after first successful load:

- application shell;
- hashed CSS and JavaScript;
- critical fonts;
- current `release.json` snapshot;
- current content-addressed corpus;
- core SVG ornament;
- required images;
- offline page.

Do not pre-cache all audio unless the final storage budget and rights review approve it.

## 16.3 Atomic service-worker update algorithm

1. Fetch `release.json` with cache bypass.
2. If the release ID equals the active release, stop.
3. Fetch the content-addressed corpus and required asset manifest into a staging cache named by release ID.
4. Verify response status, expected item counts and SHA-256 values using Web Crypto.
5. Verify every required asset is present.
6. If any step fails, delete the staging cache and keep the current release active.
7. Mark the staging cache ready only after complete verification.
8. Activate it on the next clean navigation or after explicit user refresh.
9. Switch the active-release pointer atomically.
10. Retain the immediately previous complete release until the next successful activation.
11. Delete older release caches after activation.

Never combine HTML or script from one release with corpus/audio from another.

## 16.4 Runtime strategies

- navigation: network first with short timeout, then active cached shell;
- hashed assets: cache first;
- content-addressed corpus: cache first after verification;
- `release.json`: network first/no-cache;
- service worker: no-cache;
- audio: network first, optional item cache after user action;
- health path: network only and not publicly routed.

## 16.5 Stall contingency

Prepare:

- one charged Society tablet with the complete release pre-cached;
- one printed sample poem;
- the short URL below every QR;
- power bank;
- backup QR print;
- launch-morning offline test;
- staff recovery card.

---

# 17. Production delivery architecture

## 17.1 Public files and routes

```text
/                  Main experience
/about             Cultural context
/credits           Sources and rights
/accessibility     Accessibility statement and motion controls
/privacy           Privacy notice
/offline            Offline recovery page
/release.json       Current release pointer
/content/<hash>.json Immutable approved public corpus
/manifest.webmanifest PWA metadata
```

The static server provides SPA fallback for public document routes. Asset and JSON paths must never fall back to `index.html`.

## 17.2 Internal-only health

The origin server provides:

```text
/healthz
```

Docker uses it for container health. Cloudflare Tunnel ingress or an edge rule must return 404 for public requests to `/healthz`.

Readiness means:

- static root exists;
- release file parses;
- content file exists;
- item counts meet minimums;
- release/content checksum relationship is valid.

## 17.3 No public write API

Release 1 exposes no:

- form;
- feedback endpoint;
- vote;
- upload;
- content mutation;
- visitor-count write;
- personalisation endpoint;
- public admin path.

---

# 18. Technology and build decision

## 18.1 Frontend

Use:

- Vite;
- React;
- TypeScript with `strict: true`;
- a small typed state reducer or explicit state machine;
- Zod for private-authoring and public-compiled schema validation;
- CSS custom properties and CSS Modules, or the existing repository’s equivalent if discovery proves it is already isolated and compatible;
- Vitest;
- Playwright;
- axe-core;
- a hand-controlled service worker.

Pin exact versions in the lockfile after implementation-time compatibility review.

## 18.2 Production web server

Use an unprivileged Caddy-based static image, or an equivalently reviewed unprivileged static server if the repository already has one.

Locked requirements:

- listen on container port 8080;
- run as a non-root UID;
- drop all Linux capabilities;
- read-only root filesystem;
- writable `tmpfs` only where the chosen server requires it;
- disable access logs;
- retain redacted error logs at warning/error level;
- serve exact security and cache headers;
- provide SPA fallback only for document routes;
- never expose directory listings;
- never expose source files, Git metadata, maps, authoring YAML or rights records.

## 18.3 Dependency policy

- prefer browser standards over heavy libraries;
- no WebGL engine in release 1;
- no remote font or script;
- no remote poetry API;
- no CDN JavaScript;
- no general-purpose visual component library that dictates the design;
- no production dependency without licence review;
- pin base images by digest in the release Compose file;
- generate an SBOM;
- scan dependencies and final image;
- disable production source maps by default.

## 18.4 Build-time configuration

Required non-secret build values:

```text
DIVAN_PUBLIC_ORIGIN
DIVAN_RELEASE_ID
DIVAN_MIN_HAFEZ_COUNT
DIVAN_MIN_RUMI_COUNT
DIVAN_BRANDING_MODE
```

`DIVAN_BRANDING_MODE` is allowlisted:

```text
society_only
university_approved
```

The build fails if University name/logo assets are enabled without the recorded approval identifier.

The static application has no runtime secret.

---

# 19. Repository structure

```text
src/
  app/
    App.tsx
    state.ts
    history.ts
  scenes/
    BootScene.tsx
    WelcomeScene.tsx
    PoetChoiceScene.tsx
    IntentionScene.tsx
    RevealScene.tsx
    ResultScene.tsx
  pages/
    AboutPage.tsx
    CreditsPage.tsx
    AccessibilityPage.tsx
    PrivacyPage.tsx
    OfflinePage.tsx
  components/
    ManuscriptPortal.tsx
    GeometricField.tsx
    IlluminatedFrame.tsx
    MotionControl.tsx
    LiveRegion.tsx
    SkipLink.tsx
    PoemResult.tsx
    SourceCredit.tsx
    ShareCard.tsx
  lib/
    content/
      authoringSchema.ts
      publicSchema.ts
      compile.ts
      release.ts
    draw/
      secureRandomInt.ts
      shuffleBag.ts
    storage/
      sessionState.ts
    accessibility/
      focus.ts
    share/
      renderShareCard.ts

content-private/
  hafez/
  rumi/
  editions.yaml
  reviewers.yaml
  rights-register.yaml
  permissions/

public-static/
  fonts/
  images/
  audio/
  icons/

scripts/
  validate-content.ts
  compile-content.ts
  verify-assets.ts
  verify-rights.ts
  build-release.ts
  verify-dist.ts

ops/
  Dockerfile
  Caddyfile
  compose.yaml
  cloudflared/
    config.yml.example
  scripts/
    deploy.sh
    verify-origin.sh
    rollback.sh

src-sw/
  service-worker.ts

tests/
  unit/
  content/
  accessibility/
  e2e/
  security/

docs/
  content-style-guide.md
  asset-register.md
  rights-register-public.md
  deployment-runbook.md
  rollback-runbook.md
  open-day-checklist.md
  verification-report.md
  decisions/
```

Rules:

- `content-private/` is copied only into the build stage;
- the final container receives only verified `dist/` output and server configuration;
- no single component owns state, animation, content compilation and storage;
- no production file imports from ballot or EOI packages;
- no shared environment file.

---

# 20. Accessibility specification

Target: WCAG 2.2 AA.

Required:

- one active `h1` at a time;
- semantic buttons and links;
- skip link;
- logical headings;
- keyboard completion;
- no keyboard trap;
- focus visible and not obscured;
- 44 by 44 project minimum for primary targets;
- no dragging requirement;
- no colour-only state;
- no hover-only content;
- correct page and passage language;
- correct structural direction;
- polite live-region announcement when result is ready;
- programmatic result focus without focus theft during animation;
- audio transcript via poem text;
- decorative art hidden from the accessibility tree;
- 200% zoom;
- 320 CSS-pixel reflow;
- portrait and landscape support;
- reduced motion;
- no time limit;
- no flashing content;
- measured contrast;
- plain-language errors;
- touch targets not obscured by browser chrome or sticky controls.

## 20.1 Expected screen-reader sequence

```text
A verse is waiting for you, heading level 1
Begin, button
Whose words will you open, heading level 1
Open the Divan, Hafez, button
A Moment of Reflection, Rumi, button
Take a quiet moment, heading level 1
Press to reveal, button
Your verse, heading level 1
English poem text
متن فارسی, heading level 2, Persian
Persian poem text, Persian
A reflection, not a prediction, heading level 2
Source and translation information
Reveal another, button
```

## 20.2 Manual matrix

Record actual model, OS, browser and assistive-technology versions for:

- VoiceOver on a current supported iPhone;
- VoiceOver on an older available iPhone;
- TalkBack on a current or mid-range Android device;
- VoiceOver on macOS;
- keyboard-only desktop;
- Safari;
- Chrome;
- Firefox;
- Edge.

Test Persian pronunciation switching rather than assuming support.

## 20.3 Automated testing limitation

Automated tools support but do not replace manual testing. Zero axe violations does not establish WCAG conformance.

---

# 21. Performance and browser budgets

## 21.1 Browser support policy

Support:

- current and previous two major stable versions of Safari, Chrome, Edge and Firefox at implementation time;
- current supported iOS Safari and one older available iPhone/iOS combination;
- current Chrome Android and one available mid-range Android combination.

Older capable browsers receive the fade-only experience. Browsers without `crypto.getRandomValues()` receive an unsupported-browser message and the staff fallback.

## 21.2 Performance targets

Controlled test targets:

- LCP no more than 2.5 seconds, project target 2.0 seconds;
- CLS no more than 0.1, project target 0.05;
- reveal press feedback within 100 ms;
- no long task over 200 ms during the reveal on the mid-range test device;
- smooth composited animation on target devices.

Because production analytics are prohibited, do not claim field INP. Use Lighthouse user flows, Chrome performance traces and Playwright interaction timing in controlled tests.

## 21.3 Initial compressed budgets

- HTML: 40 KB maximum;
- critical CSS: 45 KB maximum;
- initial JavaScript: 200 KB maximum;
- critical fonts combined: 180 KB maximum;
- initial images: 500 KB maximum;
- initial transfer: 1.2 MB maximum;
- initial audio preload: zero.

Offline release excluding audio:

- target: 5 MB;
- hard ceiling: 8 MB.

## 21.4 Image rules

- explicit dimensions;
- AVIF/WebP and tested fallback;
- responsive `srcset`/`sizes`;
- lazy-load non-critical imagery;
- no layout shift;
- no remote image;
- no oversized manuscript scan;
- strip unnecessary metadata unless attribution requires retention.

---

# 22. Security and HTTP delivery

## 22.1 Origin path

```text
Cloudflare edge
  → named Cloudflare Tunnel
  → cloudflared container
  → divan_origin internal network
  → divan-web:8080
```

The app has no host-published port.

## 22.2 Exact Docker network model

Use two networks:

```text
divan_origin: internal private network
divan_egress: ordinary bridge network for cloudflared outbound connectivity
```

Attachment:

```text
divan-web     → divan_origin only
cloudflared   → divan_origin + divan_egress
```

Do not attach `divan-web` to an egress-capable network unless implementation evidence proves a requirement. The static server does not need outbound internet.

## 22.3 Host and Cloud Firewall

DigitalOcean Cloud Firewall:

- deny all unsolicited inbound traffic except restricted SSH;
- no inbound HTTP/HTTPS to the Droplet;
- permit outbound connectivity required by updates, registry pulls, DNS and Cloudflare Tunnel;
- document any egress restriction and Cloudflare tunnel requirements.

Host firewall:

- default deny inbound;
- allow established connections;
- allow SSH only from approved administrator sources where operationally possible;
- do not add application ports;
- verify externally with port scan and direct-IP requests;
- account for Docker firewall behaviour.

## 22.4 Content Security Policy

The static build must contain no required inline script and no third-party resource.

Target CSP:

```text
default-src 'none';
base-uri 'none';
frame-ancestors 'none';
form-action 'none';
script-src 'self';
style-src 'self';
font-src 'self';
img-src 'self' data: blob:;
media-src 'self';
connect-src 'self';
worker-src 'self';
manifest-src 'self';
object-src 'none';
```

If a build introduces inline script/style, do not add blanket `unsafe-inline`. Remove the inline requirement or generate reviewed per-release hashes and test them.

## 22.5 Other headers

```text
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()
```

HSTS rollout:

1. enable HTTPS and verify all production paths;
2. start with a conservative `max-age`;
3. increase after successful monitoring;
4. add `includeSubDomains` only after every relevant subdomain is HTTPS-ready;
5. do not request browser preload without a separate domain-wide review.

## 22.6 Cache headers

```text
/index.html and document routes:
  Cache-Control: no-cache, must-revalidate

/service-worker.js and /release.json:
  Cache-Control: no-cache, must-revalidate

/content/<sha256>.json and hashed assets:
  Cache-Control: public, max-age=31536000, immutable

/manifest.webmanifest:
  Cache-Control: public, max-age=3600
```

Cloudflare rules must respect these semantics. Do not apply “Cache Everything” to HTML or the service worker.

## 22.7 Application and container hardening

- validate private content before build;
- validate public content after build;
- render text through React text nodes, never raw HTML;
- sanitise SVG;
- prevent path traversal in build scripts;
- production source maps disabled;
- no directory listing;
- no request-body logging;
- no visitor token;
- no dynamic user input;
- bounded static response sizes;
- image pinned by digest;
- non-root UID;
- `cap_drop: [ALL]`;
- `security_opt: [no-new-privileges:true]`;
- read-only filesystem;
- SBOM and vulnerability scan;
- no Docker socket mount;
- no host filesystem mount except read-only approved configuration/secrets;
- cloudflared credentials isolated from the web container.

## 22.8 Logging

Disable static web access logs.

Allowed application/origin error fields:

```text
timestamp
severity
release ID
error code
container-local correlation ID
```

Do not intentionally record:

```text
IP address
user agent
referer
visitor identifier
session identifier
selected poem
share-card content
precise event linked to a draw
```

Set `cloudflared` logging to the minimum operational level and verify whether request paths or client network information appear. Record Cloudflare and DigitalOcean provider-log behaviour, access and retention before launch.

---

# 23. Privacy specification

Public wording:

> This poetry experience does not ask for your name, email or student details. It uses no advertising, analytics or tracking cookies. Your poem selection is handled on your device and is not saved by the Society. Cloudflare and DigitalOcean may process limited technical network information needed to deliver and protect the website under their configured service settings.

Rules:

- no visitor database;
- no contact form;
- no membership funnel inside DIVAN;
- no export of session state;
- no poem ID in URL;
- Cache Storage contains public release files only;
- session storage contains public IDs only;
- local storage, if used, contains only motion preference;
- do not claim zero provider logging without evidence;
- external links inherit `Referrer-Policy: no-referrer` and use safe opener behaviour.

---

# 24. Droplet and Docker deployment

## 24.1 Host requirements

- supported Ubuntu LTS with active security support;
- non-root sudo administrator;
- SSH key authentication;
- root SSH login disabled;
- password SSH login disabled;
- DigitalOcean monitoring enabled;
- automated Droplet backups enabled if approved for the host;
- Cloud Firewall attached;
- automatic security updates configured and tested;
- disk and memory alerts;
- MFA on DigitalOcean, Cloudflare and GitHub;
- Droplet region recorded before geographic claims;
- deployment user and Docker privileges documented;
- remember that membership in the Docker group is effectively root-equivalent.

## 24.2 Isolation from EOI and ballot

If the Droplet hosts another Society service:

- separate deployment directory;
- separate Compose project name;
- separate Docker networks;
- separate Cloudflare tunnel or separately reviewed ingress configuration;
- separate credential file;
- separate logs;
- no EOI database network;
- no shared volume;
- no ballot or EOI secret;
- no code import;
- no common admin route;
- no reverse-proxy wildcard exposing another service.

## 24.3 Directory layout

```text
/opt/persian-society/divan/
  compose.yaml
  releases/
  current/
  cloudflared/
    config.yml
    credentials.json
  scripts/
  evidence/
```

Permissions:

- directory owned by the dedicated deployment identity;
- credentials file mode `0400` or stricter supported equivalent;
- no secret committed;
- no secret printed in CI;
- static release read-only;
- evidence writable only by authorised deployment user.

## 24.4 Corrected Compose model

Illustrative values must be replaced with the verified image digest, UID and health command during implementation planning.

```yaml
services:
  divan-web:
    image: ghcr.io/OWNER/IMAGE@sha256:VERIFIED_DIGEST
    restart: unless-stopped
    read_only: true
    user: "10001:10001"
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=16m
      - /data:rw,noexec,nosuid,size=8m
      - /config:rw,noexec,nosuid,size=8m
    expose:
      - "8080"
    networks:
      - divan_origin
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    mem_limit: 256m
    cpus: 0.50

  cloudflared:
    image: cloudflare/cloudflared@sha256:VERIFIED_DIGEST
    restart: unless-stopped
    command: tunnel --config /etc/cloudflared/config.yml run
    read_only: true
    user: "65532:65532"
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    volumes:
      - ./cloudflared/config.yml:/etc/cloudflared/config.yml:ro
      - ./cloudflared/credentials.json:/etc/cloudflared/credentials.json:ro
    networks:
      - divan_origin
      - divan_egress
    depends_on:
      divan-web:
        condition: service_healthy
    mem_limit: 128m
    cpus: 0.25

networks:
  divan_origin:
    internal: true
  divan_egress:
    driver: bridge
```

Rules:

- no `ports:` section;
- `expose` is documentation/internal metadata, not host publication;
- verify resource limits with `docker inspect` and runtime tests;
- verify the chosen container actually contains the healthcheck utility, or replace it with a known available command;
- add a final catch-all Cloudflare Tunnel ingress rule returning 404;
- block public `/healthz` at Tunnel ingress or edge.

## 24.5 Cloudflare Tunnel ingress

Conceptual configuration:

```yaml
tunnel: VERIFIED-TUNNEL-UUID
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: APPROVED_PUBLIC_HOSTNAME
    path: ^/healthz$
    service: http_status:404
  - hostname: APPROVED_PUBLIC_HOSTNAME
    service: http://divan-web:8080
  - service: http_status:404
```

Confirm exact path matching against the installed `cloudflared` version.

## 24.6 Deployment sequence

1. Build from a clean tagged checkout.
2. Install with frozen lockfile.
3. Validate private content and rights.
4. Compile public content.
5. Verify the distribution contains no private files.
6. Run unit, content, accessibility, browser and security tests.
7. Build the multi-stage static image.
8. Generate SBOM.
9. Scan dependencies and image.
10. Push immutable image to the approved registry.
11. Record image digest.
12. Pull candidate on Droplet.
13. Render and validate Compose config.
14. Start candidate release.
15. Verify container health and private-network path.
16. Verify no host port publication.
17. Switch the stable image digest and tunnel route.
18. Purge only required Cloudflare cache entries.
19. Run public smoke, offline and header tests.
20. Record evidence.
21. Keep previous digest and release for rollback.

## 24.7 Rollback

Rollback requires no rebuild:

```text
select previous verified image digest
restore previous compose release file
run docker compose config
run docker compose up -d
wait for healthy
verify internal release ID
verify public URL
verify service-worker release
verify offline draw
```

Rehearse rollback before public launch.

## 24.8 Recovery source of truth

Git tag, lockfile, content approvals, registry digest and verification report are the source of truth. A full Droplet backup is not a substitute for reproducible deployment.

---

# 25. QR and physical stall specification

## 25.1 Stable destination

The printed QR encodes a Society-controlled short HTTPS URL. It redirects to the production DIVAN URL.

Use a temporary redirect while the target may change:

```text
HTTP 302 or 307
Cache-Control: no-store
```

Do not use a permanent 301 before the destination is frozen and long-term ownership is certain.

Do not add UTM parameters or tracking identifiers.

## 25.2 QR encoding

- use the shortest stable URL;
- generate vector SVG and print PDF;
- dark modules on a plain light background;
- preserve a four-module quiet zone on every side;
- default to error-correction Level M;
- use Level Q only after a documented reason and successful scan matrix;
- do not overlay a logo in release 1;
- print the short URL underneath;
- use matte stock;
- never stretch a raster QR.

## 25.3 Physical sizes and distances

Size by use case and prove by testing:

- **A3 poster, intended scan distance up to 2 m:** start at 160 to 200 mm square;
- **A5 table stand, intended scan distance up to 0.7 m:** start at 60 to 80 mm square;
- **take-home card, hand-held:** start at 30 to 40 mm square.

These are project starting dimensions, not universal scanner guarantees. Final dimensions are accepted only after real-device tests at the actual intended distances, lighting and print quality.

## 25.4 Device and scan matrix

Record exact model, OS, camera app/browser and result for:

- current available iPhone;
- older available iPhone;
- current flagship or recent Android;
- mid-range Android;
- accessibility zoom/display scaling;
- clean print;
- mild angle;
- low light;
- stall glare;
- 0.3 m, 0.7 m, 1 m and 2 m where applicable;
- short URL manual entry.

## 25.5 Physical deliverables

- A3 hero poster;
- A5 table stand;
- take-home card;
- staff troubleshooting card;
- QR SVG;
- print-ready PDF;
- monochrome backup QR;
- short-URL lockup;
- asset and print checksum record.

Suggested copy:

> **A verse is waiting for you**  
> Scan. Choose a poet. Open a Persian verse.  
> English first. فارسی underneath.

---

# 26. Failure and recovery behaviour

## 26.1 No network before first load

Show the browser’s recoverable failure or an edge fallback where configured. Staff directs the visitor to the pre-cached tablet or printed sample.

## 26.2 Network lost after first load

Use the active cached release.

Copy:

> You are offline, but your poetry experience is ready.

## 26.3 Invalid or incomplete release

Fail closed and retain the previous verified release.

Copy:

> The current poetry collection is being prepared. Please try again shortly or visit us at the stall.

## 26.4 Audio failure

Keep the poem visible.

> Persian audio is unavailable right now.

## 26.5 Font failure

Use readable system fallbacks. Persian remains live and correctly directed.

## 26.6 Share failure

Offer text copy and screenshot guidance. Do not block the result.

## 26.7 JavaScript disabled

`index.html` contains a meaningful `<noscript>` block with:

- product explanation;
- privacy statement;
- stall direction;
- About and Credits links that remain accessible as static documents where the chosen build supports it.

The interactive random draw requires JavaScript.

## 26.8 Older browser

Use a fade-only path where the core APIs exist. If secure randomness is unavailable, explain the limitation and direct the visitor to the stall tablet.

---

# 27. Metadata, indexing and external navigation

Required:

- descriptive title;
- meta description;
- canonical URL;
- original rights-cleared Open Graph image;
- favicon and mask icon;
- `theme-color`;
- accurate structured data only;
- no hidden poem text;
- no indexable random-result URLs;
- `X-Robots-Tag: noindex` for content JSON and offline/technical resources where appropriate;
- external links use safe opener behaviour.

Suggested title:

> Divan | A Persian Poetry Experience

Suggested description:

> Open a verse from Hafez or reflect with Rumi in a bilingual Persian poetry experience from the Macquarie University Persian Society.

Use “Macquarie University” publicly only after approval.

---

# 28. Delivery phases

## Phase 0 — Discovery and launch gates

1. Inspect repository and existing build tooling.
2. Confirm this app is isolated from ballot and EOI code.
3. Inspect Droplet OS, region, CPU, memory, disk and running services.
4. Record Docker Engine and Compose versions.
5. Inspect current firewall and Docker networks.
6. Confirm Cloudflare zone, hostname and tunnel ownership.
7. Confirm official event-approval pathway.
8. Confirm Society and University naming/logo permissions.
9. Identify content and rights reviewers.
10. Confirm source editions.
11. Confirm the registry and CI system.
12. Record baseline health of existing services.
13. Write the implementation plan.

Exit: all environment-dependent decisions are written, evidence-backed and approved.

## Phase 1 — Content pipeline

1. Implement private schema.
2. Implement public schema.
3. Add non-production fixtures.
4. Implement edition and rights validation.
5. Implement private-to-public stripping.
6. Implement canonical hashing.
7. Implement release compiler.
8. Prove rejected builds fail.
9. Document editor workflow.

Exit: unapproved or unlicensed content cannot produce a release.

## Phase 2 — Accessible core

1. Build state reducer/machine.
2. Build welcome.
3. Build poet selection.
4. Build intention.
5. Build result.
6. Implement English/Persian structure.
7. Implement unbiased shuffle bag.
8. Implement browser history.
9. Implement keyboard and screen-reader flow.
10. Implement reduced motion.
11. Implement failures.

Exit: full experience works without decorative animation.

## Phase 3 — Visual system

1. Implement tokens.
2. Create original SVG geometry.
3. Build manuscript portal.
4. Build reveal choreography.
5. Add textures and responsive art.
6. Add full-motion and reduced-motion mappings.
7. Test contrast and performance continuously.

Exit: visual target passes accessibility and budgets.

## Phase 4 — Offline and sharing

1. Build release metadata.
2. Implement service worker staging.
3. Implement checksum verification.
4. Implement atomic activation and rollback cache.
5. Build offline page.
6. Implement local share card.
7. Add Web Share and fallbacks.
8. Test warm/offline/update failure paths.

Exit: a complete cached release survives outage and failed update.

## Phase 5 — Audio and context

1. Add only approved recitations.
2. Use accessible audio controls.
3. Build About.
4. Build Credits.
5. Build Privacy.
6. Build Accessibility page.
7. Verify all public credits.

Exit: cultural and rights transparency is complete.

## Phase 6 — Container, Droplet and Cloudflare

1. Build unprivileged static image.
2. Harden host.
3. Create dual-network Compose project.
4. Configure named tunnel and catch-all.
5. Configure CSP/security/cache headers.
6. Disable origin access logs.
7. Configure monitoring and alerts.
8. Deploy private preview.
9. Verify origin exposure externally.
10. Rehearse rollback.

Exit: production path is isolated, reproducible and reversible.

## Phase 7 — QR and stall validation

1. Freeze short URL ownership.
2. Generate QR variants.
3. Produce print pack.
4. Test physical scanning.
5. Test campus Wi-Fi.
6. Pre-cache staff tablet.
7. Conduct at least five-person usability test.
8. Complete cultural review.
9. Complete accessibility review.
10. Record governance approvals.
11. Make launch decision.

Exit: authorised public launch.

---

# 29. Test specification

## 29.1 Unit

- authoring schema;
- public schema;
- duplicate IDs;
- edition/reference requirements;
- rights and permission requirements;
- private-field stripping;
- blocked content;
- canonical item hashing;
- release hashing;
- secure random integer bounds;
- rejection sampling;
- Fisher-Yates bag;
- session no-repeat;
- invalid state transitions;
- reduced-motion state.

## 29.2 Integration

- application loads compiled release;
- invalid release blocks activation;
- English precedes Persian;
- Persian markup contains correct `lang` and `dir`;
- mixed identifiers use safe bidi markup;
- no private metadata in `dist`;
- no write endpoint;
- service worker stages one coherent release;
- failed update retains active release;
- old cache cleanup retains previous release;
- local share makes no network call;
- browser history follows the contract.

## 29.3 End-to-end

- complete Hafez flow;
- complete Rumi flow;
- keyboard flow;
- VoiceOver semantics;
- TalkBack semantics;
- reduced motion;
- offline after first load;
- failed release update;
- audio failure;
- share fallback;
- Back and refresh;
- mobile portrait and landscape;
- 200% zoom;
- 320 CSS-pixel reflow;
- older-browser fade fallback.

## 29.4 Security

- exact headers;
- CSP blocks inline/third-party script;
- no cookie;
- no analytics/tracker request;
- no public health path;
- no public origin port;
- no direct-IP application response;
- no ballot/EOI network or credential;
- no private source files in image;
- no source maps;
- sanitised SVG;
- no Docker socket;
- non-root UID;
- all capabilities dropped;
- read-only filesystem;
- SBOM generated;
- dependency and image scans reviewed.

## 29.5 Print and QR

- four-module quiet zone measurement;
- chosen error-correction level recorded;
- vector integrity;
- physical size per format;
- scan distance matrix;
- glare and angle tests;
- short URL manual entry;
- redirect no-store behaviour.

---

# 30. Required verification evidence

The implementation agent must create `docs/verification-report.md` and include command, tool version, timestamp, commit/tag and exit code.

## 30.1 Build and static analysis

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:content
pnpm test:a11y
pnpm test:e2e
pnpm build
pnpm verify:dist
pnpm audit --prod
```

Record any accepted audit exception with reason, owner and expiry.

## 30.2 Container evidence

```text
docker buildx build
SBOM generation command
container vulnerability scan command
docker compose config
docker compose up -d
docker compose ps
docker inspect resource/security settings
```

## 30.3 Content evidence

- total/Hafez/Rumi counts;
- zero draft items;
- zero missing edition references;
- zero missing opening hemistich for Hafez;
- zero missing rights/permissions;
- zero missing required reviews;
- zero private fields in public corpus;
- release and content checksums;
- public-manifest inspection;
- no private authoring files in final image.

## 30.4 Privacy evidence

- browser cookie inspection;
- `localStorage`, `sessionStorage`, Cache Storage and IndexedDB inspection;
- no analytics/tracker requests;
- no third-party resource request;
- no visitor identifier;
- no draw request;
- web server access logging disabled;
- cloudflared and provider log settings recorded.

## 30.5 Security evidence

- external direct-IP curl result;
- external port scan;
- no published Docker port;
- Cloud Firewall capture;
- host firewall capture;
- dual Docker network inspection;
- static container has no egress network;
- non-root/capability/read-only proof;
- secrets absent from repository, `dist` and image history;
- CSP and headers captured;
- source maps absent;
- SBOM and scan results;
- tunnel credential rotation runbook.

## 30.6 Accessibility evidence

- keyboard checklist;
- VoiceOver iOS flow;
- TalkBack Android flow;
- macOS VoiceOver flow;
- 200% zoom capture;
- 320 CSS-pixel reflow capture;
- reduced-motion capture;
- measured contrast report;
- axe report;
- manual focus order;
- Persian direction and pronunciation notes.

## 30.7 Performance evidence

Record actual test hardware and:

- LCP;
- CLS;
- press-to-feedback latency;
- long tasks;
- compressed transfer size;
- JavaScript size;
- font size;
- active offline cache size;
- reveal trace/frame stability.

## 30.8 Isolation evidence

- baseline and post-deploy EOI health;
- baseline and post-deploy ballot health;
- no schema change;
- no shared database;
- no shared credential;
- no shared volume;
- no shared Docker network;
- no route collision.

## 30.9 QR evidence

- SVG/PDF checksums;
- encoded URL;
- redirect ownership;
- status/cache headers;
- quiet zone measurement;
- error-correction level;
- physical sizes;
- device/distance/glare matrix;
- backup print.

---

# 31. Acceptance and launch gates

## 31.1 Implementation-complete criteria

All must be true:

1. The approved URL opens DIVAN.
2. Mobile and desktop visual systems are complete.
3. Hafez and Rumi modes are culturally distinct.
4. English precedes Persian.
5. Persian is live RTL text with correct language markup.
6. Every item has edition-specific provenance, rights and reviews.
7. Every reflection is labelled non-predictive.
8. Keyboard and screen readers complete the flow.
9. Reduced motion preserves the experience.
10. No personal information is requested or stored.
11. No analytics, tracking cookie or social SDK exists.
12. Secure shuffle bag avoids session repeats.
13. Site works offline after first successful load.
14. Failed release update retains the previous complete release.
15. Audio, when present, is optional and rights-cleared.
16. Share content is generated locally.
17. Performance budgets pass controlled tests.
18. Cloudflare Tunnel is the only public application path.
19. Droplet application ports are not public.
20. Static web container has no egress network.
21. Rollback is tested.
22. EOI and ballot remain unchanged.
23. QR physical matrix passes.
24. Verification evidence is complete.

## 31.2 Public-launch gates

Implementation completion does not authorise launch. Launch additionally requires:

- official event approval;
- Society executive approval of final wording;
- University name/logo approval where used;
- final source, translation, cultural and rights approval;
- named content incident owner;
- accessibility manual review;
- provider logging review;
- final production hostname and short URL control;
- launch-day fallback pack.

---

# 32. Launch-day runbook

## Before leaving

- verify production URL and short redirect;
- verify Cloudflare tunnel health;
- verify Droplet and container health;
- verify release ID and checksums;
- charge devices and power banks;
- pre-cache the complete release on staff tablet;
- pack backup QR and printed sample;
- confirm staff contact and content owner;
- freeze content and infrastructure changes.

## At setup

- scan every printed QR from its intended distance;
- test iPhone and Android on campus network;
- disable network and test one cached draw;
- test audio in venue noise;
- inspect glare and quiet zone;
- confirm short URL readability;
- brief staff on cultural disclaimer and privacy conduct.

## During event

- do not make casual production changes;
- do not photograph visitor screens without permission;
- do not record poem selections;
- do not ask visitors for their private intention;
- use staff tablet only as fallback;
- if a content concern is credible, remove the affected item through a reviewed emergency release or disable the site;
- use printed fallback if production fails.

## After event

- keep the site public only if approved;
- review technical errors without profiling visitors;
- record staff observations only in aggregate;
- review content feedback separately;
- rotate temporary credentials;
- archive release manifest, image digest, verification report and print files;
- do not infer visitor demographics.

---

# 33. Content and security incident response

## 33.1 Content incident

Examples:

- misattributed poem;
- incorrect Persian line;
- unlicensed translation;
- culturally harmful reflection;
- wrong credit.

Response:

1. Record item ID and issue without copying unnecessary personal reporter details.
2. Mark the item disabled in a reviewed emergency content patch.
3. Build and validate a new release.
4. Deploy and verify the item is absent.
5. Preserve the original release evidence.
6. Notify the rights/content owner where required.
7. Document correction and review prevention.

## 33.2 Security incident

Examples:

- leaked tunnel credential;
- public origin port;
- malicious dependency;
- altered release;
- unexpected tracker/request;
- cross-service access.

Response:

1. Take DIVAN offline or route to a static maintenance page.
2. Preserve host, container and Cloudflare evidence.
3. Rotate tunnel/registry/deployment credentials as applicable.
4. Remove public origin exposure.
5. verify EOI and ballot isolation.
6. rebuild from trusted tagged source and clean runner.
7. repeat full security and content verification.
8. obtain authorised launch approval before restoring service.

---

# 34. Future releases

Permitted after release 1:

- Persian interface toggle;
- additional poets with distinct cultural framing;
- expanded human-recorded audio;
- museum-object stories;
- kiosk mode;
- projector ambience;
- authenticated curator tool;
- archive of approved Society translations;
- transliteration;
- event-specific visual themes.

Any feedback, membership or contact feature is a separate system requiring a new privacy and security design. DIVAN must not become a hidden collection funnel.

---

# 35. References

**[R1]** Macquarie University 2026, *Student Groups Policy*, Policy Central, viewed 12 July 2026, <https://policies.mq.edu.au/document/view.php?id=383>.

**[R2]** Macquarie University 2026, *Managing a group*, Current Students, viewed 12 July 2026, <https://students.mq.edu.au/uni-life/clubs-societies/managing-group>.

**[R3]** World Wide Web Consortium 2024, *Web Content Accessibility Guidelines (WCAG) 2.2*, W3C Recommendation, viewed 12 July 2026, <https://www.w3.org/TR/WCAG22/>.

**[R4]** Mozilla Developer Network n.d., *Using Service Workers*, viewed 12 July 2026, <https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers>.

**[R5]** Mozilla Developer Network n.d., *Crypto: getRandomValues() method*, viewed 12 July 2026, <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues>.

**[R6]** Cloudflare 2026, *Cloudflare Tunnel*, last updated 17 April 2026, viewed 12 July 2026, <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/>.

**[R7]** DigitalOcean n.d., *Set up a Production-Ready Droplet*, viewed 12 July 2026, <https://docs.digitalocean.com/products/droplets/getting-started/recommended-droplet-setup/>.

**[R8]** The Metropolitan Museum of Art n.d., *Image and Data Resources*, viewed 12 July 2026, <https://www.metmuseum.org/policies/image-resources>.

**[R9]** Australian Government Attorney-General’s Department n.d., *Copyright basics*, viewed 12 July 2026, <https://www.ag.gov.au/rights-and-protections/copyright/copyright-basics>.

**[R10]** World Wide Web Consortium n.d., *Structural markup and right-to-left text in HTML*, viewed 12 July 2026, <https://www.w3.org/International/questions/qa-html-dir>.

**[R11]** Mozilla Developer Network n.d., *Web Share API*, viewed 12 July 2026, <https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API>.

**[R12]** Mozilla Developer Network n.d., *View Transition API*, viewed 12 July 2026, <https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API>.

**[R13]** OWASP Foundation n.d., *HTTP Headers Cheat Sheet*, viewed 12 July 2026, <https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html>.

**[R14]** Docker n.d., *Packet filtering and firewalls*, viewed 12 July 2026, <https://docs.docker.com/engine/network/packet-filtering-firewalls/>.

**[R15]** DENSO WAVE n.d., *Point for determining the code area*, QRcode.com, viewed 12 July 2026, <https://www.qrcode.com/en/howto/code.html>.

**[R16]** DENSO WAVE n.d., *Error correction feature*, QRcode.com, viewed 12 July 2026, <https://www.qrcode.com/en/about/error_correction.html>.

**[R17]** Google n.d., *Web Vitals*, web.dev, viewed 12 July 2026, <https://web.dev/articles/vitals>.

---

# 36. Revision quality record

This revision was audited against the original 2,295-line specification.

It intentionally contains no:

- production domain assumption;
- Droplet IP address;
- secret value;
- unverified poem text;
- modern translation excerpt;
- personal contact address;
- runtime database;
- public write API;
- unfinished `TODO`, `TBD`, `FIXME` or placeholder field masquerading as production configuration;
- claim that external governance gates have already passed.

The environment-dependent values marked as verified-at-implementation values are mandatory discovery outputs, not optional ambiguity. The implementation plan must replace them with recorded facts before code or deployment work proceeds.
