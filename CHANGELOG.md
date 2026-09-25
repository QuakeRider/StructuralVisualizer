# Changelog

All notable user-visible changes are recorded here.

## 0.5.0 — 2026-09-24

### Added

- Draggable force application point on any selectable block face.
- Exact resultant-moment calculation using `M = r × F`.
- Free-body and ideal fixed-support conditions with visible force and moment reactions.
- Continuous illustrative axial, shear, bending, and torsional block response.
- Uniform distributed-load arrows tied to the selected contact patch.
- Movable imaginary section cut with live axial force, shear force, bending moment, and torsion.
- Tested domain model for moments, equilibrium reactions, load decomposition, and section resultants.

### Changed

- Expanded the guided opening module from ten to fourteen activities.
- Reordered the curriculum so external loading, equilibrium, internal action, traction, and stress are established before stress states.
- Made loading modes consequences of face, angle, magnitude, and application point rather than preset-only illustrations.
- Clarified the boundary between exact statics calculations and qualitative deformation graphics.

### Fixed

- Reaction and internal-action arrows now render visibly over the translucent block.
- Lesson resets now restore the current activity's intended mechanical setup.

## 0.4.0 — 2026-09-23

### Added

- Shared Three.js force laboratory with a draggable 3D vector handle.
- Synchronized force magnitude and `Fx/Fy/Fz` numerical inputs.
- Clickable block faces with explicit outward surface normals.
- Resizable contact area and vector average-traction calculation.
- Geometric normal and shear traction decomposition.
- Labeled, colorblind-safe axes and semantic scene legend.

### Changed

- Rebuilt Guided mode as a focused two-column learning laboratory.
- Increased instructional, control, and navigation typography substantially.
- Reduced the opening module from twelve slide-like steps to ten interactive university-level activities.
- Replaced the blue-teal visual theme with a restrained neutral palette and accessible semantic colors.
- Removed redundant guided-mode readouts and persistent lesson navigation.
- Corrected the bridge between signed surface traction and the compression-positive stress convention.

### Fixed

- Sliders no longer replace their own DOM nodes during input, restoring continuous pointer dragging.
- Entering Explore or Present from a foundation activity no longer carries a zero-magnitude hidden stress state.

## 0.3.0 — 2026-09-23

### Added

- Five interactive foundation steps covering force vectors, direction, contact area, stress calculation, and normal versus shear stress.
- Live force and contact-area controls with a unit-aware `F/A` calculation.
- A dedicated 2D foundation illustration that transitions into the existing 3D block.
- Automated tests for force-to-stress conversion and notation.

### Changed

- Expanded the guided lesson from seven to twelve steps.
- Made Guided Lesson the default entry point while retaining Explore and Present modes.
- Updated project positioning and documentation around a foundations-first course sequence.
- Established Structural Visualizer as a full structural-geology curriculum platform, with the stress experience documented as its first vertical slice.

## 0.2.0 — 2026-09-23

### Added

- Seven-step guided lesson covering axes, vectors, tension, compression, shear, and combined loading.
- Prediction questions with immediate feedback and gated progression.
- Dedicated Explore, Guided Lesson, and Present modes.
- Classroom presentation controls for stress state, magnitude, and vectors.
- Standalone `release/Structural-Visualizer.html` packaging command.
- GitHub Actions verification, artifact upload, and tagged-release attachment.
- Automated lesson-content tests.

### Changed

- Project status advanced from interactive prototype to guided-lesson prototype.
- Roadmap now prioritizes classroom validation before quantitative strain.

## 0.1.0 — 2026-09-23

### Added

- First interactive stress-state explorer.
- Ten stress presets from the reference sequence.
- Animated deformable 3D block.
- Normal and shear stress vectors.
- Compression-positive tensor display and component editing.
- Magnitude, exaggeration, replay, reset, and display controls.
- Original-shape comparison and volume-change readout.
- Responsive application layout.
- Offline single-file production build.
- Initial project status, roadmap, architecture, and scientific-scope documentation.
