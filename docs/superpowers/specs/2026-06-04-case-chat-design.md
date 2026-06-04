# Design: In-app case chat for the besiktning engine

Date: 2026-06-04
Status: Approved (design); pending implementation plan

## Context

Carina (besiktningskvinna, SynaHus i Sverige AB) authors överlåtelsebesiktning
utlåtanden today by hand in **Microsoft 365 Copilot**: she pastes her own
template + a competitor (Sustera) report + her riskanalysbank + the on-site field
notes, and iterates in chat until she has a finished 8-section report. Two
problems with that workflow:

1. **Copilot shortens/paraphrases her text.** For a legal document the vetted SBR
   wording must appear **verbatim and complete**. A model that *generates* the
   output will always risk truncation. This is unacceptable for official
   utlåtanden.
2. It lives outside the product. The besiktning app already does photo→notering
   matching but throws the result away (downloads a JSON and forgets it).

This feature brings that authoring loop **into the app** as a chat box on the
engine page, where the besiktningsman types instructions and the **actual case
document updates live**. It is the in-house replacement for the Copilot flow.

The core product rule (see memory `project-noteringar-catalog` /
`project-report-authoring-workflow`) is **match-never-write**: canonical
observation and risk text must come verbatim from the noteringar catalog; the AI
*matches and places*, it never writes or rewords that text.

## Decisions (all confirmed with the user 2026-06-04)

1. **Role:** full report authoring — the chat is the primary surface, drives the
   whole 8-section utlåtande. (Not just a photo-loop companion.)
2. **Persistence:** the case is stored in the existing FastAPI + Postgres
   `/protokoll` store, named and resumable, saved via the existing `useAutosave`
   hook. (Not browser-local.)
3. **Write boundary:** canonical bodies (observation/risk text) are **verbatim
   from a catalog `notering_id`** — never invented or reworded. The chat **may**
   draft the connective free-text fields from Carina's own input: the
   Sammanfattning, the `särskilt att beakta` bullets, per-finding `qualifier`
   (location/severity), and project facts (byggnadsår, etc.). She reviews those
   in the live preview.
4. **Edit mechanism:** structured-edit agent (function calling). The model emits
   typed tool calls, never prose. Verbatim text is guaranteed by construction.
5. **Photos:** v1 wires accepted photo matches into the **same persistent case**
   (as findings under Okulär besiktning, with `photo_refs`). Photos + chat build
   one document.
6. **LLM backend:** direct Gemini call for the interactive chat (free tier today),
   behind a provider-swappable interface. Hermes (the VPS agent in
   `mrglennc64/PAM`) is **not** used for the live chat (10–60s latency); it is
   reserved for async growth jobs — OCR of handwritten field notes, Word/PDF
   export with exact layout, batch import of old PDF protokoll.

## Target document

The case is an `overlatelse.json`-shaped object (already defined at
`packages/schemas/overlatelse.json`). Eight sections plus an `ansvar` block:

1. `parter_och_uppdrag` · 2. `handlingar_och_upplysningar` ·
3. `fastighetsuppgifter` · 4. `okular_besiktning` (per-byggnadsdel subsections,
each `{ besiktningsmannens_text, findings[], ej_besiktigat }`) ·
5. `riskanalys` (array of `{ rubrik, findings[] }`) · 6.
`fortsatt_teknisk_utredning` `{ motiverat, beskrivning }` · 7. `sammanfattning`
`{ text, sarskilt_att_beakta[], skick_bedomning }` · 8. `bilagor[]`.

A **finding** is `{ notering_id, qualifier, photo_refs[], ai_match_confidence,
validated_by_user }`. The `body` text is NOT stored on the finding — it is
resolved from the catalog by `notering_id` at render time (single source of
truth, always verbatim and complete).

## Architecture

Small, single-purpose units:

- **`lib/caseTemplate.ts`** — builds an empty `overlatelse` document (all 8
  sections present, empty). Used when creating a new case.
- **`lib/caseEdits.ts`** — pure functions, the typed operations applied to a case
  doc. No I/O. The heart of match-never-write: `addFinding`/`addRisk` validate
  the `notering_id` against the catalog and reject unknown ids; the body is
  resolved from the catalog by id (never taken from input). Returns
  `{ nextCase, summary }` per op for the assistant's "what changed" reply.
- **`lib/caseChatAgent.ts`** (server) — defines the Gemini function-calling tool
  schema, runs a bounded tool loop (max ~6 tool calls/message), maps each tool
  call to a `caseEdits` op, returns `{ reply, edits[] }`.
- **`lib/gemini.ts`** — extended with a text + function-calling `generateContent`
  path, alongside the existing `matchPhotoToNoteringar` vision call. Provider
  detail stays behind this module (swappable later).
- **`app/api/case-chat/route.ts`** — receives `{ caseId, message, history,
  case }`; loads the catalog `id|category|title` grounding list; runs
  `caseChatAgent`; returns `{ reply, edits[] }`. Does not persist (client owns
  state + autosave). Node runtime.
- **`app/engine/CaseChat.tsx`** — chat panel. Posts to the route, applies returned
  edits to case state, triggers autosave, appends the assistant reply
  summarizing changes ("La till Risk – Fritidshus; satte byggnadsår 1971").
- **`app/engine/CasePreview.tsx`** — live read-only render of the 8 sections from
  case state; recently-changed parts flash briefly.
- **`app/engine/useCase.ts`** — holds the current case doc; `applyEdits(edits)`
  produces a new doc and calls `useAutosave` → `PATCH /protokoll/{id}`.
- **Backend:** register `overlatelse` in the schema registry so
  `POST /protokoll?template=overlatelse` and `GET /schemas/overlatelse` work. No
  new endpoints — `data` is generic JSONB and the existing PATCH deep-merges.

## Tools the model is given

The model emits only these (never body prose):

- `set_fact(path, value)` — `fastighetsuppgifter.*`, `parter_och_uppdrag.*`,
  `handlingar_och_upplysningar.*`. Draftable values.
- `add_finding(section, notering_id, qualifier?)` — `section` ∈ okulär
  subsections. Body resolved from catalog.
- `add_risk(notering_id, rubrik?)` — section 5. Body verbatim from catalog.
- `remove_item(section, ref)`.
- `set_summary(text, bullets[])` — draftable, user-reviewed.
- `set_skick(value)` — enum `under_normalt | normalt | over_normalt`.
- `set_ftu(motiverat, beskrivning?)`.
- `search_catalog(query)` — grounding lookup, returns matching
  `id|category|title` (no bodies).

The ~300-entry catalog `id|category|title` list is included in the system prompt
for direct grounding; `search_catalog` is the fuzzy fallback. **Bodies never
appear in the prompt or in model output.**

## Match-never-write enforcement

1. `add_finding`/`add_risk` have **no body parameter** in the function schema —
   the model cannot supply body text, only an id.
2. `caseEdits` validates the id exists in `noteringar.catalog.json`; unknown id →
   no mutation, and the agent replies with the closest title matches so Carina
   can pick.
3. Body text is copied verbatim from the catalog by id at apply time and at
   render time. It is never stored on, or derived from, model output.
4. The only model-authored free text is `qualifier`, `rubrik`, summary
   text/bullets, and fact values — exactly the "draftable" set the user approved,
   all visible for review in the live preview.

## Layout

The engine page becomes a two-pane workspace:

```
┌───────────────────────────────────────────────┐
│  Case: "Ornö 1100"            ● Sparat 12:04   │
├──────────────────────┬────────────────────────┤
│  CaseChat (~40%)      │  CasePreview (~60%)     │
│  ───────────────────  │  1. Parter och uppdrag  │
│  > byggår 1971,       │  2. Handlingar …        │
│    tillbyggt 2013     │  3. Fastighetsuppgifter │
│  ✓ satte byggnadsår…  │  4. Okulär besiktning   │
│  > lägg till          │     · Grundläggning …   │
│    fritidshus-risken  │  5. Riskanalys          │
│  ✓ La till Risk –     │     · Risk – Fritidshus │
│    Fritidshus         │  …                       │
│  [ skriv …          ] │  (changed parts flash)  │
└──────────────────────┴────────────────────────┘
```

PhotoLoop is available as a panel/tab within the workspace; accepted matches
become findings in the case's Okulär besiktning section (with `photo_refs`),
replacing the current download-only behavior. Panes stack vertically on mobile
(chat first).

## Data flow (one message)

1. User types in CaseChat → POST `/api/case-chat` with `{ caseId, message,
   history, case }`.
2. Route loads catalog grounding list, runs `caseChatAgent` (Gemini
   function-calling loop). Model may call `search_catalog`, then emits edit tool
   calls.
3. Route maps tool calls → `caseEdits` ops (validating ids, resolving bodies),
   returns `{ reply, edits[] }`.
4. CaseChat applies `edits` via `useCase.applyEdits` → new case doc → autosave
   PATCH; appends assistant `reply`; CasePreview re-renders, flashing changes.

## Error handling

- Unknown `notering_id` → op skipped, agent replies with closest matches.
- Gemini 429/503 → reuse existing backoff; chat shows "tänker… (fri kvot)".
- Autosave failure → existing `useAutosave` status indicator + retry/flush.
- Edits applied atomically per message; if apply throws, case state is unchanged.
- Conversation history bounded to the last ~12 turns to control tokens (tunable).

## Testing

- **Unit** — every `caseEdits` op, especially: verbatim body injection by id,
  rejection of unknown ids, atomic apply, fact-path setting.
- **Unit** — `caseChatAgent` tool-call → edit mapping with mocked Gemini
  responses (no live model in tests).
- **Integration (golden path)** — replay the real Ornö 1100 conversation
  (byggår 1971 / tillbyggt 2013, plint/krypgrund risk, fritidshus risk, våtrum,
  parallelltak, dagvatten, low sockel, summary). Assert the resulting case JSON:
  correct `notering_id`s present, bodies byte-equal to the catalog (no
  shortening), facts set, summary drafted.
- **Manual** — author the Ornö case end-to-end in dev.

## Scope / YAGNI

In v1: single (demo) user as `/protokoll` already assumes; Gemini backend behind
a swappable interface; chat + live preview + photo→case bridge.

Deferred (natural Hermes/VPS jobs): Word/PDF export with exact SynaHus layout;
OCR of handwritten "Genomgång på plats" field notes into structured intake; batch
import of legacy PDF protokoll; undo-history UI (edits are already structured, so
undo is feasible to add later); multi-user/real-time collaboration.
