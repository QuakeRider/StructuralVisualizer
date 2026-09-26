# Structural Visualizer Curriculum

This directory is the authoritative plan for what Structural Visualizer teaches, in what order, and how each lesson is built. It replaces the broad topic map that earlier versions of `CURRICULUM_VISION.md` contained.

Every build session should start here, then read the spec for the one lesson it is building.

## Audience and level

- An intro Structural Geology course at university level (3000–4000 level, junior/senior undergraduates).
- Students have had calculus-era math and introductory physics, but **their vector, trigonometry, and matrix skills are not assumed to be solid.** The curriculum rebuilds those skills, and does it inside the tool.
- The primary use is **instructor projection in lecture (Present mode) with students following along on their own devices.** A structural-lab mode and a self-study/homework mode are planned later (see [parked-and-expansions.md](parked-and-expansions.md)). Design decisions must not block them.

## What this tool is for

The tool makes **the mathematics of structural geology understandable, visible, and interesting.** It builds intuition from math to geology. Equations sit alongside the 3D model as an equal partner, not a footnote. Each symbol is tied to something the student can see and move.

## Master sequence

| Unit | ID | Lesson | Frame | Status |
|---|---|---|---|---|
| **0 Math foundations** — [spec](unit-0-math.md) | M1 | Vectors and components | x/y/z | Built (0.7.0) |
| | M2 | Trigonometry of projection | x/y/z | Built (0.9.0) |
| | M3 | Dot and cross products | x/y/z | Planned |
| | M4 | Matrices as transformations | x/y/z | Planned |
| **1 Orientation** — [spec](unit-1-orientation.md) | O1 | The geographic frame and lines | x/y/z → NED | Planned |
| | O2 | Planes: strike, dip, and poles | NED | Planned |
| | O3 | Stereonets | NED | Planned |
| | O4 | Angles, intersections, and rake | NED | Planned |
| **2 Stress** — [spec](unit-2-stress.md) | S1 | Force | x/y/z | Planned |
| | S2 | Force vs traction | x/y/z | Seed (0.6.0) |
| | S3 | Normal and shear traction | x/y/z | Seed (0.6.0) |
| | S4 | Stress at a point (2D) | x/y | Planned |
| | S5 | Transformation and principal stresses (2D) | x/y | Planned |
| | S6 | The Mohr circle (2D) | x/y | Planned |
| | S7 | The stress tensor in 3D | x/y/z → NED | Seed (0.6.0) |
| | S8 | Principal stresses in 3D | x/y/z and NED | Planned |
| | S9 | The 3D Mohr diagram | NED | Planned |
| | S10 | Mean, deviatoric, and Earth stress states | NED | Seed (0.6.0) |
| **3 Brittle deformation** — [spec](unit-3-brittle.md) | B1 | Brittle processes, fracture modes, and deformation bands | NED | Planned |
| | B2 | Tensile failure | NED | Planned |
| | B3 | Coulomb failure and the composite failure envelope | NED | Planned |
| | B4 | Confining pressure and pore-fluid pressure | NED | Planned |
| | B5 | Joints and veins | NED | Planned |
| | B6 | Friction and reactivation of existing planes | NED | Planned |
| | B7 | Anderson's theory of faulting | NED | Built early (0.8.0) |
| | B8 | Fault geometry, slip, and kinematic axes (P/T, beach balls) | NED | Planned |
| | B9 | Fault anatomy and growth | NED | Planned |
| **4 Deformation and strain** — [spec](unit-4-strain.md) | D1 | Components of deformation | x/y/z | Planned |
| | D2 | Homogeneous vs heterogeneous deformation | x/y/z | Planned |
| | D3 | Measuring strain | x/y → NED | Planned |
| | D4 | The strain ellipse and ellipsoid | x/y/z | Planned |
| | D5 | Coaxial and non-coaxial deformation: pure shear, uniaxial strain, simple shear | x/y/z | Planned |
| | D6 | Flow: velocity fields, ISA, flow apophyses, and vorticity | x/y/z | Planned |
| | D7 | Progressive deformation | x/y/z | Planned |
| | D8 | Strain measurement methods | x/y → 3D | Planned |
| **5 Rheology** — [spec](unit-5-rheology.md) | R1 | What rheology is | — | Planned |
| | R2 | Elasticity | x/y/z | Planned |
| | R3 | Viscous flow | x/y/z | Planned |
| | R4 | Plastic and composite behavior | — | Planned |
| | R5 | Stress in the crust: reference states and tectonic stress | NED (depth) | Planned |
| | R6 | Controls and the brittle–ductile transition | NED (depth) | Planned |
| **6 Folds and folding** — [spec](unit-6-folds.md) | F1 | Fold anatomy | NED | Planned |
| | F2 | Fold orientation and stereonets | NED | Planned |
| | F3 | Fold shape and classification | NED | Planned |
| | F4 | Folding mechanisms | x/y/z | Planned |
| | F5 | Boudinage | NED | Planned |
| | F6 | Fault-related folds | NED | Planned |
| | F7 | Superposed folding | NED | Planned |

"Built early" means the lesson was built ahead of its prerequisites for classroom use. B7 restates the Coulomb angle it needs from B3, builds the first Mohr plot (later lessons reuse it), and leaves the stereonet view for after O3 is built. When B3 and B6 are built, B7 should be revisited to point back to them.

"Seed" means an early version exists in the app (moved from the 0.5 module by [Build 00](build-00-rework.md)); it does not yet meet its spec. A seed lesson's build session replaces it fully and sets the status to "Built".

**Why this order.** Math comes first because every later topic is built from vectors and matrices. Orientation comes next, because a plane is defined by its normal vector, and `t = σn` needs exactly that. Stress follows, and brittle deformation comes straight after it while Mohr circles and principal stresses are still fresh. Strain comes after brittle. Rheology comes after strain because it is the relationship *between* stress and strain. Stress in the crust (R5) sits in rheology because its uniaxial-strain reference state needs Poisson's ratio (R2). It closes the loop on exhumation joints (B5) and leads into the brittle–ductile transition (R6). Folds come last because buckling needs viscosity contrast (R3), strain patterns in folds need the strain ellipse (D4), and fault-related folds (F6) need the fault lessons (B8, B9).

**Reference textbooks used while planning** (for topic coverage and depth calibration only):
- PSGT, *Processes in Structural Geology & Tectonics* (University of Michigan open textbook).
- Fossen, *Structural Geology*, 2nd ed. (Cambridge, 2016). Its intro-level strain chapter and appendix (deformation matrix, polar decomposition, ISA, flow apophyses, Wk) confirmed that our math depth is appropriate for the course level. It also prompted the additions of joints and veins, fault growth, P/T axes, deformation bands, flow and vorticity, uniaxial strain, the stress-reference-states lesson, boudinage, kink/chevron folds, and fault-related folds.

Our order differs from both books: PSGT puts rheology under the lithosphere, and Fossen teaches strain before stress. We put rheology after strain, and bring orientation in when it is first needed rather than grouping it as a lab skill. We are free to reorder and to go deeper than any single textbook. **We never copy text or figures from any source.**

## Binding decisions

These were set with the course instructor. Do not change them without asking.

1. **No engineering statics.** Moments (`r × F`), free-body rotation, support reactions, section cuts, internal axial/shear resultants, bending, and torsion are **not part of this curriculum.** Equilibrium appears only as "the forces on a stationary rock element balance" (S1), plus one sentence of justification for stress-tensor symmetry (S4).
2. **Math is central.** A dedicated math unit comes first. Equations are always visible, live, and bound to the 3D model.
3. **Tensor depth:** Cauchy's relation `t = σn`, the transformation equations, the Mohr circle as a picture of those equations, and principal stresses as eigenvectors (shown visually and geometrically). The matrix form `σ' = AσAᵀ` is shown. Index notation (`σij nj`) appears only as an optional aside, never as a requirement.
4. **2D → 3D.** A topic may start in 2D, but it must always make the jump to 3D. Once in 3D, it stays in 3D unless the 3D treatment would go beyond junior/senior level (for example, full 3D Mohr construction for strain).
5. **No length cap.** A lesson covers its topic completely, to the clarity and depth needed to master it at this level. Lessons are not trimmed to fit a class period.

## Conventions

| Item | Convention |
|---|---|
| Math and stress construction frame | Abstract right-handed **x, y, z**, drawn with **z up** (2D views show the x–y plane with x right and y up). Used in Unit 0 and while building the stress tensor (S1–S6), because the principal-stress transformation is a pure-math operation. |
| Geological frame | **NED**: x = North, y = East, z = Down (right-handed). Used from O1 onward whenever a topic is discussed in geological terms. The change of frame is **taught as an explicit step**, never done silently (O1 first, then S7 and elsewhere as needed). |
| Renderer frame | Three.js is y-up. The renderer converts internally. Students never see renderer coordinates. |
| Stress sign | **Compression positive**, tension negative. σ1 ≥ σ2 ≥ σ3. |
| Traction sign | Stated explicitly wherever it matters: `t(n) = −σn` with an outward normal under compression-positive σ, or equivalently `t = σn` using the inward normal. Each lesson spec says which form is on screen; the form is never switched silently. |
| Mohr diagram | σn on the horizontal axis (compression to the right); τ on the vertical axis. The angle θ is measured from σ1 to the **plane normal**, and the plane appears at 2θ on the circle. The sign convention for τ (sense of shear) is declared in S5 and kept thereafter. |
| Orientation | Strike/dip with the **right-hand rule**; dip direction/dip accepted as an alternative input. Lines use trend/plunge. The stereonet is **lower hemisphere**. Equal-angle and equal-area nets are both available, and the lesson says which is shown. |
| Unit colors | Each unit's lesson badge uses one color from the Okabe–Ito colorblind-safe palette, lightened for the dark background: 0 Math sky blue `#56b4e9`, 1 Orientation bluish green `#3fd0a0`, 2 Stress orange `#e69f00`, 3 Brittle vermillion `#f07a3c`, 4 Strain reddish purple `#cc79a7`, 5 Rheology yellow `#f0e442`, 6 Folds violet `#9a8cff`. The unit letter always appears with the color, so the color is never the only cue. |
| Notation | Vectors bold upright (𝐯, 𝐅, 𝛔 for the tensor), scalars and components italic (v_x, d, c), unit vectors with hats (𝐯̂, ı̂, ȷ̂, k̂), units upright. Equations are MathML written with `src/lessons/mathml.js`; the same notation appears in lesson text and scene labels. |
| Units | SI. Force in N/kN, stress in Pa/MPa, lengths in m/km, strain rate in s⁻¹. Unit conversions are shown, never hidden. |

## Design principles

1. **Equation–model binding.** Every symbol in an on-screen equation has a visible counterpart in the scene, with the same color, label, and line style (so it is readable without color). Numbers update live while the student manipulates the scene. Focusing or hovering a symbol highlights its object, and the reverse. The equation panel is readable when projected.
2. **Components always visible.** Vectors are drawn with their component arrows, as a dashed "component box" that can be toggled but is on by default in Units 0–2. Traction is always shown alongside its normal and shear parts. Matrices are shown with each column drawn as the image of a basis vector.
3. **Manipulate → observe → formalize → apply.** Students move something first, notice a pattern, see the equation that describes it, and then use it on a geological case. Every lesson ends with a **geological payoff**.
4. **Progressive disclosure.** Each step shows only the controls and representations its objective needs.
5. **Predict before reveal.** Key steps ask for a prediction (multiple choice, numeric, or "drag to where you think") before showing the answer.
6. **Necessity test.** A topic belongs only if (a) a later structural-geology lesson uses it, or (b) it directly explains a geological structure, measurement, or process. Each lesson spec lists "Used later by" to show it passes. This test exists to prevent drift into topics (such as engineering statics) that don't serve structural geology.
7. **Exact vs illustrative.** Every visual declares whether it is an exact calculation or a qualitative illustration, and the interface says so where students could be misled. The detailed statement lives in `docs/SCIENTIFIC_SCOPE.md`.
8. **Present-first, expansion-ready.** Big type, step pacing, and instructor-driven flow come first. Lesson data should also carry what Lab and Self-study modes will need later (numeric answers, tolerances, hints) whenever that is cheap to include.
9. **Accessible by more than color.** Labels, line patterns, arrowheads, and text reinforce every color-coded distinction. Everything is keyboard-operable.

## Lesson spec template

Each unit file contains one spec per lesson with these fields:

- **Prerequisites / Used later by:** lesson IDs.
- **Learning objectives:** measurable ("student can compute…", "…can predict…").
- **Math introduced:** the exact equations and notation, with 2D and 3D forms.
- **Equation–model binding:** symbol → scene object, and what the student manipulates.
- **Step outline:** ordered steps, each giving the concept, the interaction, and a prompt/prediction. This is intent, not final copy.
- **Geological payoff.**
- **Misconceptions to target.**
- **Exact vs illustrative.**
- **Domain functions, scenes, and tests:** what to build or reuse. Domain math lives in `src/domain/` with unit tests.
- **Out of scope:** explicit exclusions.
- **Acceptance criteria.**

## Build-session protocol

One session builds one lesson (or Build 00). For each session:

1. Read this README, then the lesson's spec. Check that every prerequisite lesson is built (status table above). If one isn't, stop and say so.
2. Recheck the spec against the binding decisions and conventions above. Raise conflicts with the user instead of resolving them silently.
3. **Domain first:** implement the math in `src/domain/` as pure functions, with Vitest unit tests that include hand-checkable numeric cases.
4. **Scene second:** add or extend the renderer. Reuse existing scenes and the shared equation-binding panel where they fit. Build a new renderer when the topic needs a different visual (stereonet, Mohr plot, parametric fold surface), rather than forcing it into an existing one.
5. **Lesson data third:** add the lesson file under `src/lessons/<unit>/` and register it.
6. Verify with `npm test`, then in the browser: step through every lesson step in both Guided and Present modes, check the equation-to-scene highlighting, check keyboard operation, and check narrow widths.
7. Update this README's status table, `CHANGELOG.md`, `docs/SCIENTIFIC_SCOPE.md` (exact vs illustrative), and, if structure changed, `docs/ARCHITECTURE.md`.
8. If the build shows the spec was wrong or incomplete, correct the spec in the same session so the docs stay the source of truth.

Shared infrastructure (the stereonet renderer, the Mohr plot, the equation-binding panel, 2D-slice views) is built by **the first lesson that needs it**, and specified there.

## Files

- [build-00-rework.md](build-00-rework.md): the first build session. It removes statics and restructures the code into a lesson registry.
- [unit-0-math.md](unit-0-math.md) · [unit-1-orientation.md](unit-1-orientation.md) · [unit-2-stress.md](unit-2-stress.md) · [unit-3-brittle.md](unit-3-brittle.md) · [unit-4-strain.md](unit-4-strain.md) · [unit-5-rheology.md](unit-5-rheology.md) · [unit-6-folds.md](unit-6-folds.md)
- [parked-and-expansions.md](parked-and-expansions.md): topics deliberately deferred, and future modes.
