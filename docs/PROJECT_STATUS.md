# Project Status

Last updated: 2026-09-24

## Summary

Structural Visualizer is an interactive 3D learning environment for an intro university Structural Geology course, built to make the mathematics of the subject clear and visible. The full curriculum (48 lessons in 7 units) is specified in [curriculum/README.md](curriculum/README.md).

The current release (`0.7.0`) contains the first fully built lesson, **M1 Vectors and components**, and the vector laboratory it runs in. Build 00 (0.6.0) removed the engineering-statics sequence and introduced the lesson registry and the equation–model binding panel. S2, S3, S7, and S10 are still early seed versions. The remaining 43 lessons are planned, and each has a build spec.

**Next:** build lesson M2 (trigonometry of projection), following the build-session protocol in the curriculum README.

## Completed

### Curriculum platform

- [x] Curriculum plan and per-lesson build specs in `docs/curriculum/`.
- [x] Lesson catalog for all 48 lessons, with units and prerequisites.
- [x] Lesson registry with per-lesson data files, statuses (`planned`, `seed`, `built`), and navigation helpers.
- [x] Unit-grouped lesson picker; planned lessons listed but disabled.
- [x] Lesson-to-lesson navigation ("Next lesson") and step numbers of the form lesson.step.
- [x] Equation–model binding panel: symbol ↔ scene-object highlighting in both directions, live values, and a symbol key that does not rely on color.
- [x] Present mode for lessons (entered from Guided) with larger type and arrow/PageUp/PageDown step keys; Present from Explore keeps the stress-laboratory toolbar.
- [x] Numeric-answer prompts with targeted feedback, live construction goals, and values hidden until a prediction is answered.
- [x] Vector laboratory (`VectorScene`): 2D ↔ 3D camera jump, component box, stacked magnitude triangles, unit sphere, scaling, tip-to-tail addition with component stacks, and illustrative geology contexts.

### Built lessons

- [x] M1 (built, 0.7.0): vectors and components in nine steps, from 2D to 3D: magnitude, negative components, unit vectors, addition, scaling, and geological examples.

### Seed lessons

- [x] S2 (seed): resultant vs distributed load, and average traction `t̄ = F/A` with the unit conversion shown.
- [x] S3 (seed): normal and shear traction on a selectable face.
- [x] S7 (seed): why stress needs a tensor, and combined normal + shear states, with the tensor shown in the equation panel.
- [x] S10 (seed): normal stress states and the open stress laboratory.

### Core interaction

- [x] Direct 3D vector manipulation with a draggable handle and synchronized `x/y/z` and magnitude controls.
- [x] Clickable block faces and explicit surface-normal selection.
- [x] Resizable contact patch, distributed-load arrows, and average-traction calculation.
- [x] Geometric normal and shear traction decomposition.
- [x] Ten reference stress states as selectable presets, with animated qualitative deformation.
- [x] Stress vectors, magnitude control, and direct editing of six tensor components.
- [x] Compression-positive sign convention.
- [x] Orbit, zoom, replay, reset, and display controls.

### Engineering foundation

- [x] Domain, lesson data, rendering, and interface separated.
- [x] Unit tests for vectors, traction, the stress catalog, qualitative deformation, the curriculum catalog, lesson content, and a guard against statics content.
- [x] Responsive desktop, tablet, and phone layouts; reduced-motion behavior.
- [x] Single-file offline production build, GitHub Actions tests, and release packaging.

## Verification status

Release gate:

```bash
npm test
npm run build
npm run release:build
```

Manual verification for each release:

1. Step through every available lesson in Guided mode, including wrong and right predictions, and follow "Next lesson" to the end.
2. Hover and focus every equation symbol and confirm that the matching scene object is highlighted; hover scene objects and confirm the symbol highlights.
3. Change force, components, area, and face, and confirm that the live equation values follow.
4. Enter Present from Guided: confirm the lesson is projected, arrow/PageUp/PageDown step (blocked until a prediction is answered), and Escape returns to Guided.
5. Enter Present from Explore and confirm the stress-laboratory toolbar works.
6. Select all ten presets in Explore and edit each tensor component.
7. Open `release/Structural-Visualizer.html` from disk without a development server.
8. Check desktop and phone-width layouts for overflow.

The 0.7.0 build was verified this way in a headless Chromium with software WebGL. That check covered every M1 step, the numeric answers (including Enter to submit), goal checks, mouse drags in 2D and 3D (including Shift-drag), highlighting in both directions, and phone-width framing. (The in-app browser pane used during development has WebGL disabled, so it cannot render the 3D scenes.)

## Known limitations

- The seed lessons (S2, S3, S7, S10) are short carry-overs from 0.5, and none yet meets its full spec.
- The force laboratory used by the S2 and S3 seeds still draws y up; it adopts the z-up math frame of M1 when S1–S3 are built.
- Dragging a vector tip needs a mouse or touch; keyboard users set components with the number fields, which cover every drag.
- The equation binding covers the vector and force laboratories; `StressScene` does not yet support symbol highlighting.
- S3 still shows the signed traction projection `tn = t̄ · n` (outward normal); the course-wide traction sign form is decided in S4.
- The stress-state deformation is qualitative and exaggerated until lesson R2 introduces linear elasticity.
- Preset values are illustrative and not calibrated to a particular rock.
- Stress arrows are placed relative to the original block faces rather than following the deformed faces.
- No saved student progress, assessment, or instructor authoring yet (Lab and Self-study modes are planned expansions).
- The production HTML uses system-font fallbacks when offline; preferred fonts are not yet vendored.
- A double-click check of the standalone file on a physical Windows classroom computer remains outstanding.

## Decisions intentionally deferred

- The single on-screen traction sign form (decided when S4 is built).
- Whether student progress is stored locally or in a hosted account.
- Whether 2D views (stereonet, Mohr plot, profile sections) share one renderer or use separate ones.
- Final deployment target beyond the offline bundle and a possible GitHub Pages build.
