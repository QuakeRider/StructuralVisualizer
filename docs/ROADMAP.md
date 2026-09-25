# Roadmap

Structural Visualizer is a modular learning environment for an intro university Structural Geology course, built to make the mathematics of the subject clear and visible. The authoritative curriculum (lesson order, specs, conventions, and the build protocol) is in [curriculum/README.md](curriculum/README.md). This roadmap tracks milestones at a higher level.

## Platform milestone 1 — First vertical slice

**Status: complete (v0.1–0.4)**

- Force and area foundations.
- Ten selectable three-dimensional stress states.
- Generic deformable block, vectors, tensor display, and qualitative response.
- Guided, Explore, and Present modes.
- Offline single-file classroom build.
- Separated domain, lesson, interface, and renderer layers.

## Platform milestone 2 — Build 00: rework into the curriculum structure

**Status: next.** Spec: [curriculum/build-00-rework.md](curriculum/build-00-rework.md)

v0.5.0 added an engineering-statics sequence (moments, reactions, section cuts, bending, torsion), which the curriculum excludes. Build 00:

- Removes the statics lessons, the `loadResponse.js` domain module, and the related interface and renderer code.
- Introduces a multi-lesson registry organized by unit, with a lesson picker.
- Introduces the shared equation-binding panel (equation symbols ↔ scene objects).
- Moves the force-vector lab, traction decomposition, and stress-state scene into seed lessons M1, S1–S3, S7, and S10.
- Corrects `SCIENTIFIC_SCOPE.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`, and `CHANGELOG.md`.

Exit condition: the app runs the seed lessons from the registry, with no statics content anywhere.

## Curriculum units

Each lesson is built in its own session, in order, following the build-session protocol. Shared infrastructure is built by the first lesson that needs it.

| Unit | Lessons | Key shared infrastructure introduced | Exit condition |
|---|---|---|---|
| **0 Math foundations** | M1–M4 | Vector glyph with component box; rotatable axes; plane-with-normal widget; matrix-transform view; `vector.js`, `matrix.js` | Students can compute with and visualize vectors, projections, dot/cross products, and matrices acting on vectors, including eigenvectors |
| **1 Orientation** | O1–O4 | NED outcrop block; orientation inputs; stereonet renderer; `orientation.js`, `stereonet.js` | Students move fluently between field measurements, vectors, 3D geometry, and stereonets |
| **2 Stress** | S1–S10 | 2D-slice view; Mohr plot renderer; plane-through-a-point widget; `stress.js` | Students move between force, traction on a plane, the tensor, transformed planes, principal stresses, Mohr diagrams, and Earth stress states |
| **3 Brittle deformation** | B1–B9 | Failure envelopes (incl. composite) on the Mohr plot; fracture/fault/deformation-band glyphs; layered-block view; rose diagram; slip-tendency, P/T, and beach-ball stereonet layers; fault-surface displacement map; `failure.js`, `faults.js` | Failure and slip visuals are driven by explicit criteria, and students distinguish stress, strength, and resulting structure |
| **4 Deformation and strain** | D1–D8 | Marker-grid deformation view; strain-ellipse/ellipsoid overlay; Flinn plot; time scrubber; flow-field overlay (ISA, apophyses); `strain.js` | Students distinguish stress from strain and explain how measured geometry records a deformation history |
| **5 Rheology** | R1–R6 | Rheology element builder; time controls; depth-profile plot (crustal stress and strength); exact elastic deformation in the stress scene; `rheology.js` | Students explain why the same loading produces different responses under different material laws and conditions |
| **6 Folds and folding** | F1–F7 | Parametric fold-surface renderer; surface measurement tools; profile-section view; fault-fold cross-section with trishear; `folds.js`, `faultFolds.js` | Students describe, measure, classify, and explain folds and boudins in 3D, including fault-related and superposed folding |

## Platform milestone 3 — Classroom validation

**Status: after the first units are built (target: after Unit 2)**

- Test the standalone file on the intended Windows classroom computer.
- Teach the built lessons in lecture in Present mode, with students following along.
- Record misconceptions, interaction failures, accessibility barriers, and actual pacing.
- Check that the equation–model binding actually improves students' mathematical understanding.
- Revise the shared design system and lesson template before building further units.

## Parked and future expansions

See [curriculum/parked-and-expansions.md](curriculum/parked-and-expansions.md):

- **Parked topics:** the plastic regime (microstructures and flow laws), fabrics and shear zones, plate tectonics, paleostress inversion, fault-seal topics, map and cross-section work, and orientation statistics.
- **Lab mode:** a structural lab with datasets, problem sets, maps, and sections.
- **Self-study / homework mode:** hints, checks, progress tracking, and randomized problems.
- **Platform:** instructor-authored sequences, localization, hosted deployment, and optional analytics.

## Work-selection rules

1. Build lessons in curriculum order. Do not start a lesson whose prerequisites are not built.
2. Every topic must pass the necessity test (curriculum README, design principle 6). Engineering statics is permanently excluded.
3. Prefer reusable interaction and teaching patterns, but do not force unrelated topics into one renderer.
4. Each lesson covers its topic completely at course level. There is no length cap, and no shallow coverage.
5. Keep the specs as the source of truth. If building a lesson shows the spec is wrong, fix the spec in the same session.
