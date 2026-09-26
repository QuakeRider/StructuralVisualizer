# Structural Visualizer

Structural Visualizer is an interactive 3D learning environment for an intro university Structural Geology course (3000–4000 level). Its purpose is to make the mathematics of structural geology clear and visible: every equation on screen is bound to the objects it describes in the 3D model, and vector components are always shown.

The curriculum runs from vectors and matrices through orientation, stress, brittle deformation, strain, rheology, and folds—48 lessons in 7 units. The lesson sequence, conventions, and a build spec for every lesson are in [docs/curriculum/README.md](docs/curriculum/README.md); the product vision is in [docs/CURRICULUM_VISION.md](docs/CURRICULUM_VISION.md).

## Current release

**Status:** curriculum-structured prototype (`0.12.0`)

Lessons M1 (vectors and components), M2 (trigonometry of projection), B6 (friction and reactivation of existing planes), B7 (Anderson's theory of faulting), B8 (fault geometry, slip, and kinematic axes), and B9 (fault anatomy and growth) are fully built; B6 to B9 were built ahead of their prerequisites for classroom use. Four more lessons exist as early *seed* versions (S2, S3, S7, S10); the other 38 are listed in the lesson picker as planned. Each future lesson is built in its own session from its spec.

Implemented:

- A vector laboratory for the math unit: 2D-to-3D camera jump, component box, stacked right triangles for the 3D magnitude, unit vectors, scaling, and tip-to-tail addition with component stacks. For trigonometry it adds angle arcs, direction angles, and a rotatable x′, y′ axis pair, with a curve plot beside it.
- An Anderson faulting laboratory: an Earth block in north–east–down coordinates with principal-stress arrows, the predicted conjugate faults, β and dip angles, and a sliding hanging wall. A Mohr diagram beside it shows the circle touching the Coulomb line.
- A friction laboratory on the same Earth block: an old plane of any strike and dip with the traction on it, a 3D Mohr diagram with Byerlee's friction line and the intact-rock line, and the first stereonet, which maps slip tendency over every plane orientation and responds to pore-fluid pressure.
- A fault laboratory: a faulted block whose hanging wall moves by a slip vector (with its strike-slip and dip-slip parts and the rake), a dike that shows separation on an eroded map and in cross-section, a well log with missing or repeated beds, slickenlines, slip set by the stress (Wallace–Bott), and the P, T, and B axes. The stereonet beside it shows the slip, the auxiliary plane, and the beach ball.
- A fault-growth laboratory: marker beds offset by faults whose displacement dies out at an elliptical tip line, the fault surface colored by displacement, the fault core and damage zone, displacement–length scaling on log–log axes, relay ramps between overlapping segments and their breaching, and normal and reverse drag, with profile plots beside the block.
- Numeric-answer predictions with feedback on common mistakes, and construction goals checked live.
- A lesson registry covering the full 48-lesson curriculum, with a unit-grouped lesson picker and lesson-to-lesson navigation.
- An equation–model binding panel: hovering or focusing a symbol highlights its object in the 3D scene (and hovering the object highlights the symbol), with live values and a key describing each symbol's scene object.
- Present mode that projects the current lesson (large type, arrow/PageUp/PageDown step keys) when entered from Guided, or the stress laboratory when entered from Explore.
- Ten selectable stress-state presets based on the supplied reference sequence.
- Animated 3D deformation of a shared generic block.
- Tension, compression, and shear vectors on the relevant faces.
- Compression-positive numerical stress tensor.
- Preset magnitude and deformation-exaggeration controls.
- Fine-grained editing of all six independent stress components.
- Original-shape comparison, axes, grid, orbit, and zoom controls.
- Approximate volume-change readout.
- Responsive layout and reduced-motion support.
- A single-file offline production build.
- A Three.js vector/force laboratory with direct vector dragging, `x/y/z` component entry, smooth magnitude control, selectable block faces, and resizable contact area.
- A visible uniform load distribution connected to its resultant force.
- Live average-traction and normal/shear decomposition with explicit surface normals, units, assumptions, and sign conventions.
- Prediction-and-feedback checkpoints integrated with construction and comparison tasks.
- A minimal two-column guided layout with readable typography and progressive disclosure.
- Colorblind-safe semantic colors reinforced by labels, symbols, and geometry.
- A focused classroom presentation layout.
- Automated GitHub testing and standalone-file packaging.

The current status and known limitations are maintained in [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md). Product and curriculum direction are defined in [docs/CURRICULUM_VISION.md](docs/CURRICULUM_VISION.md), with implementation priorities in [docs/ROADMAP.md](docs/ROADMAP.md).

## Quick start

Requirements:

- Node.js 20 or newer.
- npm 10 or newer.

Install and run the development server:

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

Run the automated checks:

```bash
npm test
npm run build
```

Create the named classroom release file:

```bash
npm run release:build
```

## Offline classroom build

Create the distributable file:

```bash
npm run release:build
```

The release build produces `release/Structural-Visualizer.html`. JavaScript, CSS, lesson content, and the 3D engine are bundled into that file; the visualization itself does not require a network connection. Copy that one file to the classroom computer and open it in a current browser.

The source interface requests web fonts during development. The production visualization remains functional if the font request is unavailable and falls back to system fonts. A later packaging pass will vendor the preferred fonts as well.

## Traction and stress convention

The opening laboratory uses newtons for force, square centimeters for contact area, and megapascals for average traction. Its calculation performs the unit conversion explicitly: `1 cm² = 10⁻⁴ m²` and `1 MPa = 10⁶ Pa`. With outward surface normal `n`, inward loading produces a negative signed projection `tn = t̄ · n`.

The stress-state section declares the structural-geology convention:

- Compression is positive.
- Tension is negative.
- Shear signs follow the displayed x, y, and z axes.

Under that compression-positive tensor convention, the lesson writes the plane-traction relation as `t(n) = −σn`.

Preset magnitudes are teaching values rather than measurements from a particular material or experiment.

## Scientific scope

The deformation engine maps a stress tensor to an exaggerated deformation gradient. This is a visual teaching rule, not an elastic, plastic, viscous, or brittle constitutive model. Pure-shear presets are kept approximately volume preserving, while compressive and tensile states show their expected qualitative volume and shape trends.

See [docs/SCIENTIFIC_SCOPE.md](docs/SCIENTIFIC_SCOPE.md) before adding material behavior, strain calculations, or fracture mechanics.

## Project structure

```text
src/
├── domain/
│   ├── stressStates.js       Preset catalog and tensor helpers
│   ├── forceStress.js        Force/area conversion and stress notation
│   ├── vector.js             Vector helpers (add, dot, cross, normalize, …)
│   ├── format.js             Number formatting for live equations
│   ├── orientation.js        Trend/plunge and strike/dip ↔ vectors (north, east, down)
│   ├── failure.js            Coulomb failure angles and the Mohr circle at failure
│   ├── anderson.js           Anderson regimes, conjugate faults, slip sense
│   ├── deformation.js        Qualitative deformation mapping
│   └── *.test.js             Domain tests
├── visualization/
│   ├── VectorScene.js        Vector laboratory for the math unit (lesson M1)
│   ├── AndersonScene.js      Earth block with stress axes and faults (lesson B7)
│   ├── MohrPlot.js           SVG Mohr diagram with the Coulomb line
│   ├── CurvePlot.js          SVG plot of functions of an angle (M2)
│   ├── sceneKit.js           Shared arrows and labels
│   ├── ForceLabScene.js      Force-on-a-surface laboratory with symbol highlighting
│   ├── StressScene.js        Stress tensors, vectors, deformation, and camera
│   └── sceneRefs.js          Scene objects that equation symbols may bind to
├── lessons/
│   ├── catalog.js            All 48 lessons: units, titles, prerequisites
│   ├── registry.js           Merges the catalog with lesson content; navigation helpers
│   ├── unit-0-math/          One file per lesson (m1-vectors.js, m2-trigonometry.js, …)
│   ├── unit-2-stress/        s2-…, s3-…, s7-…, s10-…
│   └── unit-3-brittle/       b7-anderson.js
├── main.js                       Application interface and state coordination
└── styles.css                    Responsive visual design
docs/
├── curriculum/               Lesson sequence, conventions, and per-lesson build specs
├── ARCHITECTURE.md
├── CURRICULUM_VISION.md
├── PROJECT_STATUS.md
├── ROADMAP.md
└── SCIENTIFIC_SCOPE.md
```

## GitHub distribution

The workflow in `.github/workflows/ci.yml` runs tests, builds the standalone file, and uploads it as a workflow artifact. When a version tag such as `v0.7.0` is pushed, the same file is attached to the matching GitHub Release.

Students should download `Structural-Visualizer.html`, not the development `index.html` at the repository root.

## Documentation maintenance

When behavior or scope changes:

1. Update `docs/PROJECT_STATUS.md` with what is actually working.
2. Keep `docs/CURRICULUM_VISION.md` aligned with the intended course scope and experience principles.
3. Move completed or rescheduled items in `docs/ROADMAP.md`.
4. Update `docs/SCIENTIFIC_SCOPE.md` if the mathematical assumptions change.
5. Update `CHANGELOG.md` for user-visible changes.
6. Keep this README focused on the product goal, setup, use, and current release.

## License

This project is available under the [MIT License](LICENSE).
