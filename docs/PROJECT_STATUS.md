# Project Status

Last updated: 2026-09-26

## Summary

Structural Visualizer is an interactive 3D learning environment for an intro university Structural Geology course, built to make the mathematics of the subject clear and visible. The full curriculum (48 lessons in 7 units) is specified in [curriculum/README.md](curriculum/README.md).

The current release (`0.11.0`) contains five fully built lessons: **M1 Vectors and components** and **M2 Trigonometry of projection**, which run in the vector laboratory, and **B6 Friction and reactivation of existing planes**, **B7 Anderson's theory of faulting**, and **B8 Fault geometry, slip, and kinematic axes**, all built early for classroom use on an NED Earth block. B7 added the first Mohr diagram; B6 added the 3D Mohr diagram and the first stereonet; B8 added the fault laboratory, a well log, and the stereonet's kinematic layers (slip, P/T/B, beach balls). Build 00 (0.6.0) removed the engineering-statics sequence and introduced the lesson registry and the equation–model binding panel. S2, S3, S7, and S10 are still early seed versions. The remaining 39 lessons are planned, and each has a build spec.

**Next:** build lesson M3 (dot and cross products), following the build-session protocol in the curriculum README.

## Completed

### Curriculum platform

- [x] Curriculum plan and per-lesson build specs in `docs/curriculum/`.
- [x] Lesson catalog for all 48 lessons, with units and prerequisites.
- [x] Lesson registry with per-lesson data files, statuses (`planned`, `seed`, `built`), and navigation helpers.
- [x] Unit-grouped lesson picker; planned lessons listed but disabled.
- [x] Lesson-to-lesson navigation ("Next lesson") and step numbers of the form lesson.step.
- [x] Equation–model binding panel: symbol ↔ scene-object highlighting in both directions, live values, and a symbol key that does not rely on color.
- [x] Scene header with a unit-colored lesson badge, the lesson and step line, the lesson picker, and a step navigator that opens any step.
- [x] Formal math: equations typeset as native MathML (bold vectors, italic scalars, radicals, fractions, hats, column vectors) in a math font, with symbols bound to the scene.
- [x] Present mode for lessons (entered from Guided) with larger type and arrow/PageUp/PageDown, 1–9, and Home/End keys; Present from Explore keeps the stress-laboratory toolbar.
- [x] Numeric-answer prompts with targeted feedback, live construction goals, and values hidden until a prediction is answered.
- [x] Vector laboratory (`VectorScene`): 2D ↔ 3D camera jump, component box, stacked magnitude triangles, unit sphere, scaling, tip-to-tail addition with component stacks, and illustrative geology contexts.

### Built lessons

- [x] M1 (built, 0.7.0): vectors and components in nine steps, from 2D to 3D: magnitude, negative components, unit vectors, addition, scaling, and geological examples.
- [x] M2 (built, 0.9.0): trigonometry of projection in eight steps: the unit circle, components from a length and an angle, the angle back from components (with the quadrant), direction cosines in 3D, turning the axes under a fixed vector (2D, then 3D), a double-angle preview plot, and geological uses.
- [x] B6 (built early, 0.10.0): friction and reactivation in eight steps: weak planes and cohesion, Byerlee's law, every plane as a point on the 3D Mohr diagram, slip tendency, reactivation vs a new fault (with locked planes), a slip-tendency stereonet, ranking mapped faults, and pore pressure and induced earthquakes. Its prerequisites (B3, B4, S9, O3) are not built yet, so it restates what it needs from them.
- [x] B8 (built early, 0.11.0): fault geometry, slip, and kinematic axes in eleven steps: hanging wall and footwall, the slip vector and its parts (rake), naming faults, slip vs separation with a dike on an eroded map and cross-sections, missing and repeated beds in a well, slickenlines and their plunge, Wallace–Bott slip from the stress, P, T, and B axes, beach balls, why P and T are not σ1 and σ3, and predicting the rake with atan2. Its prerequisites O4 and S7 are not built yet, so it restates rake and the traction on a plane.
- [x] B7 (built early, 0.8.0): Anderson's theory of faulting in nine steps. It covers the free surface, the three regimes, dips from the Coulomb angle, the sense of strike-slip, friction, the limits of the theory, reading stress from faults, and tectonic settings. It uses an NED Earth block with a sliding hanging wall and a linked Mohr diagram. Its prerequisites B3 and O2 are not built yet; its stereonet view can now reuse the B6 stereonet.

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
4. Enter Present from Guided: confirm the lesson is projected, arrow/PageUp/PageDown step (blocked until a prediction is answered), the step navigator and 1–9/Home/End open any step, and Escape returns to Guided.
5. Enter Present from Explore and confirm the stress-laboratory toolbar works.
6. Select all ten presets in Explore and edit each tensor component.
7. Open `release/Structural-Visualizer.html` from disk without a development server.
8. Check desktop and phone-width layouts for overflow.

The 0.11.0 build was verified the same way. The check covered every B8 step with wrong and right answers, the rake, strike, dip, view, regime, stress-ratio, tilt, preset, and slip controls, both goals, picking the fault's pole on the stereonet, highlighting in both directions between the equations, the block (including hovering each wall), the stereonet, and the well log, and keyboard focus. It checked equation overflow at 1440×900 and 1280×720 in Guided and Present, that every available lesson fits the window in Present mode at both sizes, and the release file opened from disk. B6 and B7 were rechecked after the shared Earth-block and stereonet changes. Phone width was not checked (out of scope at the instructor's request). The 0.10.0 build was verified the same way. The check covered every B6 step with wrong and right answers, the strike, dip, σ1, Pf, regime, fault, and slip controls, the slip goal, the σ1 stop at reactivation or a new fault, picking a pole on the stereonet, highlighting in both directions between the equations, the block, the Mohr diagram, and the stereonet, and keyboard focus. It checked equation overflow at 1440×900 and 1280×720 in Guided and Present, the phone layout, and the release file opened from disk; B7 was rechecked after the shared scene and plot changes, and every available lesson and the stress laboratory were checked to fit the window in Present mode at both sizes. The 0.9.0 build was verified the same way. The check covered every M2 step with wrong and right answers, the angle, length, and θ controls, the alignment goal, highlighting in both directions (including the curve plot), and equation overflow at 1440×900 and 1280×720 in Guided and Present. M1 and B7 were rechecked after the shared scene changes. The 0.8.0 build was verified the same way. The check covered every B7 step in Guided and Present, wrong and right answers, the regime, μ, slip, and setting controls, highlighting in both directions between the equations, the block, and the Mohr diagram, and keyboard focus. It also checked for equation overflow at 1440×900 and 1280×720 (a projector size) and at phone width, and opened the release file from disk. The 0.7.0 build was verified this way in a headless Chromium with software WebGL. That check covered every M1 step, the numeric answers (including Enter to submit), goal checks, mouse drags in 2D and 3D (including Shift-drag), highlighting in both directions, and phone-width framing. (The in-app browser pane used during development has WebGL disabled, so it cannot render the 3D scenes.)

## Known limitations

- The seed lessons (S2, S3, S7, S10) are short carry-overs from 0.5, and none yet meets its full spec.
- The force laboratory used by the S2 and S3 seeds still draws y up; it adopts the z-up math frame of M1 when S1–S3 are built.
- Dragging a vector tip needs a mouse or touch; keyboard users set components with the number fields, which cover every drag.
- The equation binding covers the vector, Anderson, friction, fault, and force laboratories; `StressScene` does not yet support symbol highlighting.
- B7 was built ahead of B3, so it restates the Coulomb angle itself, and it does not yet show the stereonet. The Mohr diagram's magnitudes are fixed teaching values.
- B6 was built ahead of B3, B4, S9, and O3. It restates the Coulomb line, the 3D Mohr region, and effective stress, and its stereonet is the first one (equal-area only, no net grid). Its stress state is illustrative: σ3 = 30 MPa, σ2 halfway to σ1, and intact rock with C = 20 MPa and μ = 0.85.
- B8 was built ahead of O4 and S7. It restates rake and the traction on a plane. Its slip (300 m on a 1000 m block) and stress state (σ1 = 130 MPa, σ3 = 30 MPa) are illustrative; the slip directions, P/T axes, beach balls, separations, and well logs are exact for them. The slickenline steps are schematic.
- The stereonet's pole picking needs a mouse or touch; keyboard users set the plane with the strike and dip sliders.
- S3 still shows the signed traction projection `tn = t̄ · n` (outward normal); the course-wide traction sign form is decided in S4.
- The stress-state deformation is qualitative and exaggerated until lesson R2 introduces linear elasticity.
- Preset values are illustrative and not calibrated to a particular rock.
- Stress arrows are placed relative to the original block faces rather than following the deformed faces.
- No saved student progress, assessment, or instructor authoring yet (Lab and Self-study modes are planned expansions).
- The production HTML uses system-font fallbacks when offline; preferred fonts are not yet vendored. Equations use the system math font (Cambria Math on Windows, STIX Two Math on macOS and many Linux systems). Very old browsers without MathML support would show unformatted equations.
- The equation font was checked on Windows by the instructor (2026-09-25) and renders correctly.

## Decisions intentionally deferred

- The single on-screen traction sign form (decided when S4 is built).
- Whether student progress is stored locally or in a hosted account.
- Whether 2D views (stereonet, Mohr plot, profile sections) share one renderer or use separate ones.
- Final deployment target beyond the offline bundle and a possible GitHub Pages build.
