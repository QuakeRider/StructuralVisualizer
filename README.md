# Structural Visualizer

Structural Visualizer is an interactive teaching application for building intuition about stress, strain, and deformation. The current prototype lets a student select one of ten common stress states, inspect its stress tensor, adjust its components, and watch a generic three-dimensional block deform.

The visual response is deliberately qualitative. It connects arrows and tensor values to visible shape and volume changes without implying a material-specific constitutive or failure model.

## Current release

**Status:** guided-lesson prototype (`0.2.0`)

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
- A seven-step guided lesson with prediction-and-feedback checkpoints.
- A focused classroom presentation layout.
- Automated GitHub testing and standalone-file packaging.

The current status, known limitations, and next decisions are maintained in [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md). Planned phases are in [docs/ROADMAP.md](docs/ROADMAP.md).

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

## Stress convention

The application uses the structural-geology convention:

- Compression is positive.
- Tension is negative.
- Shear signs follow the displayed x, y, and z axes.

Preset magnitudes are teaching values rather than measurements from a particular material or experiment.

## Scientific scope

The deformation engine maps a stress tensor to an exaggerated deformation gradient. This is a visual teaching rule, not an elastic, plastic, viscous, or brittle constitutive model. Pure-shear presets are kept approximately volume preserving, while compressive and tensile states show their expected qualitative volume and shape trends.

See [docs/SCIENTIFIC_SCOPE.md](docs/SCIENTIFIC_SCOPE.md) before adding material behavior, strain calculations, or fracture mechanics.

## Project structure

```text
src/
├── domain/
│   ├── stressStates.js       Preset catalog and tensor helpers
│   ├── deformation.js        Qualitative deformation mapping
│   └── deformation.test.js   Domain tests
├── visualization/
│   └── StressScene.js        Three.js scene, vectors, block, and camera
├── lessons/
│   └── stressLesson.js       Guided lesson content and answer keys
├── main.js                       Application interface and state coordination
└── styles.css                    Responsive visual design
docs/
├── ARCHITECTURE.md
├── PROJECT_STATUS.md
├── ROADMAP.md
└── SCIENTIFIC_SCOPE.md
```

## GitHub distribution

The workflow in `.github/workflows/ci.yml` runs tests, builds the standalone file, and uploads it as a workflow artifact. When a version tag such as `v0.2.0` is pushed, the same file is attached to the matching GitHub Release.

Students should download `Structural-Visualizer.html`, not the development `index.html` at the repository root.

## Documentation maintenance

When behavior or scope changes:

1. Update `docs/PROJECT_STATUS.md` with what is actually working.
2. Move completed or rescheduled items in `docs/ROADMAP.md`.
3. Update `docs/SCIENTIFIC_SCOPE.md` if the mathematical assumptions change.
4. Update `CHANGELOG.md` for user-visible changes.
5. Keep this README focused on setup, use, and the current release.

## License

This project is available under the [MIT License](LICENSE).
