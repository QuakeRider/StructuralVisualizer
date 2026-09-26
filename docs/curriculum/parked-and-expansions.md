# Parked topics and future expansions

These topics are **deliberately not scheduled**. Each was judged harder to show well with the current tools, or better suited to a later mode of the application. Revisit this list after Units 0–6 are built. Moving a topic into the curriculum requires a new lesson spec in the template from [README.md](README.md), plus the user's agreement.

## Parked curriculum topics

| Topic | Why parked | Most likely route back in |
|---|---|---|
| **Plastic regime:** crystal plasticity, dislocation and diffusion creep, power-law flow laws, deformation-mechanism maps, microstructures | Hard to visualize honestly at grain scale; needs real flow-law parameters | After R6: a lesson that replaces R6's illustrative ductile curve with a real power-law creep law |
| **Fabrics:** foliation, cleavage, lineation, shear zones, mylonites, kinematic indicators (S–C fabrics, porphyroclasts, mica fish), folds in shear zones and sheath folds | Needs strain + rheology + microstructure together | **Shear zones first**, since D5–D7 already build simple and subsimple shear, flow apophyses, Wk, and progressive strain, and F5 previews asymmetric boudins. Then foliation/lineation as strain-ellipsoid planes and axes (D4) |
| **Plate tectonics** (PSGT ch. 10–15; Fossen ch. 17–20): lithosphere, plate kinematics and Euler poles, contractional/extensional/strike-slip regimes, transpression, salt tectonics | Explicitly blocked off for now; different scale and visual needs | Plate kinematics has strong vector/rotation math (a fit with Unit 0). Map- and seismic-scale fault systems (rifts, thrust belts and duplexes, strike-slip bends, flower structures, inversion, transpression) are now core: B17 and B18 in Unit 3B. Plate-scale tectonics and salt stay parked |
| **Lithospheric strength** beyond R6 (mantle layering, flexure) | Depends on flow laws | With the Plastic-regime expansion |
| **Stress measurement** (borehole breakouts, hydrofracture tests, overcoring) and **least-squares stress inversion** | Data-heavy; the least-squares math is beyond the core | Fault-slip paleostress is now core: B15 teaches the reduced tensor, φ, P/T populations, and a grid-search inversion. Least-squares inversion and real datasets go to Lab mode. R5 gives the reference states that measurements are compared against, and B16's borehole images are the natural entry to breakouts |
| **Fault-seal datasets and reservoir work** (capillary pressure, column heights, real juxtaposition and SGR mapping) | Applied/petroleum focus; data-heavy | The concepts are now core in B16 (conduit/barrier, triangle diagrams, SSF, SGR, subsurface recognition). The data work stays in Lab mode |
| **Maps, cross-sections, structure contours, three-point problems, outcrop patterns, balanced sections and restoration** | Map and section work is the core of a structural lab | Lab mode (below). F6's fault-bend kink construction is the natural bridge to section balancing |
| **Orientation statistics** (contouring, Kamb, Fisher, eigen-fabric analysis) | Data-driven; best with real datasets | Lab mode; extends the O3 stereonet renderer (B5 adds a rose diagram) |

**Moved into the core curriculum** (after reviewing Fossen, 2016): joints and veins (B5), fault anatomy, fault rocks, growth, and linkage (B9), P/T axes and beach balls (B8), deformation bands (B1), uniaxial strain (D5), flow/ISA/apophyses/Wk and subsimple shear (D6), Wellman and Breddin methods (D8), reference states of stress (R5), kink and chevron folds (F3/F4), boudinage (F5), and fault-related folds (F6).

**Moved into the core curriculum** (after reviewing Fossen chapters 9–10 and PSGT chapter 5, 2026-09-26): the new Unit 3B Faults. It adds fault shapes and arrays (B10), fault zones and fault rocks (B11), kinematic indicators (B12), earthquakes with rate-and-state friction and Coulomb stress change (B13), fault mechanics puzzles (B14), fault populations and paleostress (B15), faults, fluids, and the subsurface (B16), and fault systems (B17, B18).

## Permanently excluded

**Engineering statics and mechanics of materials:** moments and torques (`r × F`), free-body rotation, support reactions, section cuts, internal axial/shear resultants, bending moments, and torsion. These were added in v0.5.0 and **removed on purpose** (binding decision 1 in the README). They do not serve structural geology at this level. Do not reintroduce them, even as "foundations." Stress-tensor symmetry is handled with one stated sentence in S4.

## Future application modes

The primary mode is **Present**: the instructor projects a lesson in lecture, and students follow along on their own devices. Two further modes are planned. Lesson data should carry the fields they need whenever that is cheap to add (see the Build 00 registry fields).

### Lab mode (structural lab expansion)
- Numeric problem sets with tolerances, using real or synthetic datasets.
- Map and cross-section exercises: three-point problems, structure contours, outcrop-pattern prediction, apparent dip in sections, and balanced-section basics.
- Stereonet data work: contouring, fitting girdles, and fault-slip data.
- Strain measurement on real images (extends D8).
- Needs: data import, a worksheet view, per-question answers, and possibly export of student work.

### Self-study / homework mode
- Hints, step-by-step feedback, and retry logic on prompts (the lesson data's `hints` / `numericAnswer` / `tolerance` fields).
- Progress tracking and resume.
- Possibly randomized numeric parameters so each student gets a different problem.
- Needs: persistent per-student state (local or hosted), and randomized problem generation from the domain functions.

### Other platform items (from the earlier roadmap, still valid)
- Instructor-authored activity sequences.
- Localization and unit preferences.
- Hosted deployment and optional analytics.
- Classroom validation on the intended Windows classroom computer.
- **Instructor photographs** of outcrops, hand samples, and thin sections (first wanted in B11 for fault rocks). How to integrate them (storage, licensing, labeling, and linking photos to procedural drawings) is to be discussed with the instructor before any build uses them.
