# Roadmap

This roadmap keeps the opening stress-state explorer useful by itself while preserving a path toward a broader structural-geology learning platform.

## Phase 1 — Stress-state explorer

**Status: implemented in prototype form**

- Ten selectable stress states.
- Generic deformable block.
- Normal and shear vectors.
- Numerical tensor display.
- Magnitude, exaggeration, and component controls.
- Animated transitions and comparison outline.
- Offline single-file build.

Exit condition: a student can select any reference case, change its loading, and explain the visible shape or volume response.

## Phase 2 — First guided lesson

**Status: implemented in prototype form**

- Add an optional guided mode alongside free exploration.
- Introduce vector direction before tensor notation.
- Walk through tension, compression, shear, and combined states.
- Add prediction prompts before selected transitions.
- Add concise reflection checks without turning the explorer into a quiz application.
- Add instructor presentation mode with larger labels and simplified controls.

Implemented as a seven-step lesson with three prediction checkpoints, progressive examples, and a focused presentation layout. Student/instructor validation is still required before the phase is considered complete.

Exit condition: an instructor can assign or demonstrate a coherent 15–25 minute lesson using the same explorer.

## Phase 2.5 — Classroom validation

**Status: next**

- Test the standalone file on the intended Windows classroom computer.
- Run the lesson with a small student group or instructor.
- Note misconceptions about vector direction, sign convention, and stress versus response.
- Check whether prediction prompts improve explanation rather than merely add clicks.
- Revise wording, camera defaults, and visual emphasis from observed use.
- Record the tested lesson duration and any accessibility barriers.

Exit condition: the lesson has been used in a realistic setting and the resulting changes are documented.

## Phase 3 — Quantitative strain

**Status: planned**

- Separate stress inputs from strain outputs.
- Introduce normal and shear strain.
- Display dimensional changes and strain components.
- Add synchronized 2D sections or projections.
- Introduce principal directions.
- Compare coaxial and non-coaxial deformation.

Exit condition: students can distinguish stress from strain and connect tensor components to measured geometric change.

## Phase 4 — Material response

**Status: planned**

- Add material-response modules behind a common interface.
- Begin with a simple isotropic elastic model.
- Introduce Poisson coupling and stiffness.
- Add time-dependent or rate-dependent behavior only after the elastic lesson is validated.
- Make assumptions and units explicit in every model.

Exit condition: the same stress state can produce different responses because students selected different stated material assumptions.

## Phase 5 — Failure and geological structures

**Status: planned**

- Add strength and failure criteria.
- Add conceptual fracture initiation and orientation.
- Introduce confining pressure.
- Connect stress and material response to fractures and faults.
- Add fold visualizations as a separate structural module.

Exit condition: failure visuals are calculated or rule-driven and no longer presented as a direct consequence of stress alone.

## Phase 6 — Course platform capabilities

**Status: exploratory**

- Lesson registry and course navigation.
- Student progress and resume behavior.
- Instructor-authored lesson configuration.
- Accessibility audit and keyboard-only 3D alternatives.
- Localization and unit preferences.
- Hosted deployment and optional analytics.

## Work-selection rule

Before starting a new phase, validate the previous phase with students or an instructor. Prefer improving conceptual clarity in an existing interaction over adding another model that has not been placed in a teaching sequence.
