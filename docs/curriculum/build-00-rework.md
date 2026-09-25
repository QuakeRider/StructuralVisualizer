# Build 00 — Remove statics and restructure into a lesson registry

**Goal:** turn the current single 14-step guided lesson (v0.5.0) into the start of the curriculum in [README.md](README.md). This build removes the engineering-statics content, introduces a multi-lesson registry and a shared equation-binding panel, and moves the reusable pieces into seed versions of M1, S1–S3, S7, and S10.

This is a restructuring session. It does not fully build M1 or any other lesson; each of those gets its own later session. What it does produce is a working app with no statics content and the new lesson structure in place.

## Before starting

- The v0.5.0 work is uncommitted at the time this spec was written. Ask the user whether to commit it as-is first, so the removal shows up as a clean, reviewable diff. **Do not revert it.** The 0.5 changes also contain improvements that are worth keeping (listed below).
- Run `npm test` to get a baseline.

## Remove (statics, which is out of scope per binding decision 1)

**Lesson steps** in `src/lessons/stressLesson.js`: `force-location-and-moment` (L2), `free-body-response` (L3), `constraints-and-reactions` (L4), `create-loading-actions` (L5), `reveal-internal-cut` (I1), and `resolve-section-actions` (I2).

**Domain:** `src/domain/loadResponse.js` and `src/domain/loadResponse.test.js` (`calculateLoadResponse`, `pointOnFace`, reactions, section resultants, the action label). Before deleting, check whether anything worth keeping lives there, such as a small vector helper. If something is, move it into a general `src/domain/vector.js` (which M1/M3 will need anyway), with tests.

**Interface (`src/main.js`):**
- The `loadResponse()` helper, and the import of `calculateLoadResponse` and `pointOnFace`.
- State fields `constraintMode` and `cutPosition`. Keep `applicationPoint` only if the force lab still needs a point where the force is drawn. It should be a fixed display anchor with no moment calculation.
- Control markup and bindings for `constraint`, `application` presets, and `cut` (`data-constraint-mode`, `data-application-preset`, `#cut-position-input`).
- Spotlight branches `moment`, `free-body`, `equilibrium`, `actions`, `cut`, and `internal-actions` in `forceFormulaMarkup`, `forceReadoutsMarkup`, and `syncForceLabReadouts`, plus the moment, reaction, and internal-action readout cards.
- `formatMoment`, `setApplicationPreset`, and the lesson-reset handling of `constraintMode` and `cutPosition`.

**Renderer (`src/visualization/ForceLabScene.js`):**
- Support group, reaction arrow, and `REACTION_COLOR` usage.
- Translation arrow and rotation arc (`updateResultants`).
- Cut plane and internal-action arrows (`updateCut`).
- Bending, torsion, and free-body ghost behavior in `updateBlockResponse`. The block should either stay undeformed in the force lab or show only the existing, clearly labeled qualitative response.
- Options `showResultants`, `showSupport`, `showReactions`, `showCut`, `showInternalActions`, and `allowApplicationPoint` (if the application point is fixed), plus `setConstraintMode` and `setCutPosition`.
- Application-point dragging, unless M1 needs it (it doesn't; a vector's tail position is not a curriculum topic).

**CSS:** styles used only by the removed controls and readouts (`src/styles.css`).

## Keep (these are useful and feed the new lessons)

- Direct 3D force-vector drag with synchronized Fx/Fy/Fz and magnitude controls. This seeds **M1** and **S1**.
- Clickable faces and surface-normal selection, the contact patch, and the uniform distributed-load arrows. This seeds **S2**.
- Normal/shear traction decomposition geometry and `decomposeTraction`. This seeds **S3**.
- `StressScene`, the 10 presets, and tensor editing. These seed **S7** and **S10**.
- The 0.5 fixes: arrows rendering over the translucent block, and lesson reset restoring each step's setup.

## Restructure: lesson registry

Replace the single `STRESS_LESSON` export with a registry that can hold the whole curriculum.

- One data file per lesson: `src/lessons/<unit>/<id>.js` (for example `src/lessons/unit-0-math/m1-vectors.js`, `src/lessons/unit-2-stress/s3-normal-shear.js`).
- `src/lessons/registry.js` exports the ordered lesson list, grouped by unit, with `id`, `unit`, `title`, `prerequisites`, `status` (`planned` | `seed` | `built`), and `steps`.
- Keep the existing step shape (`visualKind`, `controls`, `labOptions`, `initialLabState`, `prompt`, `choices`, `spotlight`, …), which works. Add optional fields that later modes will need: `equations` (for the binding panel), `numericAnswer` + `tolerance`, and `hints`. Leave them unused for now if nothing needs them yet.
- The interface gets a lesson picker, grouped by unit, that shows only lessons with `seed` or `built` status (planned lessons are listed but disabled, or hidden). Guided mode runs the chosen lesson. Explore and Present keep working.
- Migrate the remaining steps into seed lessons:
  - **M1 seed:** `construct-force-vector`, reworded as a generic vector (x/y/z, no force units). M1's spec replaces it fully later.
  - **S1–S3 seeds:** `distribute-force-over-area` and `calculate-average-traction` → S2; `decompose-traction` → S3. S1 may be empty (planned) for now.
  - **S7 / S10 seeds:** `why-stress-needs-a-tensor`, `compare-normal-stress-states`, `compare-shear-and-combined-states`, and `open-stress-explorer`.
- Rewrite `stressLesson.test.js` as `registry.test.js`: unique lesson and step IDs, every prerequisite ID exists, every `presetId` exists, each prompt has exactly one correct choice, and seed lessons contain no statics spotlights.

## Restructure: equation-binding panel (foundation only)

Build the shared component described in design principle 1 of the README, in minimal form:

- A step can declare `equations: [{ id, tex-or-html, symbols: [{ symbol, sceneRef, color, pattern }] }]`.
- The panel renders the equations large, with live values, and hovering or focusing a symbol calls into the scene to highlight `sceneRef` (and the reverse, where the scene supports picking).
- Replace the ad-hoc `forceFormulaMarkup` string branches for the kept spotlights (`force`, `area`, `traction`, `decomposition`) with this panel.

Keep it small. M1 will extend it (component box, per-component highlighting), and later lessons will add to it.

## Docs to correct in this session

- `docs/SCIENTIFIC_SCOPE.md`: remove the "External loads and equilibrium" section and the statics bullets. Keep traction, sign conventions, and the qualitative-deformation disclaimer.
- `docs/ARCHITECTURE.md`: remove `loadResponse.js`, and describe the lesson registry and equation panel.
- `docs/PROJECT_STATUS.md`: remove the statics checklist items, and point to `docs/curriculum/README.md` for what is next.
- `CHANGELOG.md`: add a 0.6.0 entry covering statics removal, the lesson registry, and the equation panel. Mark the 0.5.0 statics items as removed rather than deleting history.
- `README.md` (repo root): make the feature list match.
- `docs/curriculum/README.md`: set the status of seeded lessons.

## Acceptance criteria

- No statics code or copy remains: `grep -rniE "moment|reaction|torsion|bending|section.cut|free.body|constraint" src/` returns only unrelated matches (for example "moment" in a comment about time). Review each hit.
- `npm test` passes, and `npm run build` succeeds, including the single-file release.
- In the browser: the lesson picker lists units and lessons; each seed lesson runs start to finish in Guided and Present modes; Explore still works; the equation panel highlights scene objects for at least the `force` and `decomposition` steps.
- `docs/` contains no description of statics features except the "removed" note in the curriculum README and CHANGELOG history.
