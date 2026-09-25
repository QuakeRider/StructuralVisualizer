# Structural Visualizer

Structural Visualizer is intended to become a university-level interactive learning environment for the full structural-geology curriculum. Its long-term scope includes mathematical and mechanical foundations, stress analysis, strain and kinematics, rheology, brittle and ductile deformation, folds, faults, structural data, maps, cross-sections, and integrative geological interpretation.

The current loads-to-stress-state experience is the first working module and architectural proving ground—not the product's final identity or scope. It follows external force and moment through free-body motion, constraint reactions, internal section actions, distributed load, traction, and finally three-dimensional stress states. Its visual response is deliberately qualitative and does not imply a material-specific constitutive or failure model.

The long-term curriculum and shared experience principles are defined in [docs/CURRICULUM_VISION.md](docs/CURRICULUM_VISION.md).

## Current release

**Status:** interactive mechanics learning-laboratory prototype (`0.5.0`)

Implemented:

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
- A fourteen-step university-level guided module connecting external loads, equilibrium, internal actions, traction, stress, and three-dimensional stress states.
- A shared Three.js load laboratory with direct vector dragging, movable application point, `Fx/Fy/Fz` entry, smooth magnitude control, selectable block faces, and resizable contact area.
- Explicit free-body and fixed-support modes with resultant force, resultant moment, reaction force, and reaction moment.
- Continuous illustrative block response to load face, direction, magnitude, and eccentricity, including axial, shear, bending, and torsional action.
- A movable section cut with live internal axial force, shear force, bending moment, and torsion.
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
│   ├── loadResponse.js       Resultants, reactions, and section equilibrium
│   ├── deformation.js        Qualitative deformation mapping
│   └── *.test.js             Domain tests
├── visualization/
│   ├── ForceLabScene.js      Direct-manipulation load, response, and traction laboratory
│   └── StressScene.js        Stress tensors, vectors, deformation, and camera
├── lessons/
│   └── stressLesson.js       Guided lesson content and answer keys
├── main.js                       Application interface and state coordination
└── styles.css                    Responsive visual design
docs/
├── ARCHITECTURE.md
├── CURRICULUM_VISION.md
├── PROJECT_STATUS.md
├── ROADMAP.md
└── SCIENTIFIC_SCOPE.md
```

## GitHub distribution

The workflow in `.github/workflows/ci.yml` runs tests, builds the standalone file, and uploads it as a workflow artifact. When a version tag such as `v0.5.0` is pushed, the same file is attached to the matching GitHub Release.

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
