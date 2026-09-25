# Project Status

Last updated: 2026-09-24

## Summary

Structural Visualizer is planned as a modular, university-level learning environment for the full structural-geology curriculum. The current release is the **interactive mechanics learning-laboratory prototype** (`0.5.0`): a loads-to-stress-state vertical slice used to establish the interaction model, 3D visualization, guided lessons, free exploration, presentation mode, testing, and offline distribution.

Stress states are one curriculum topic, not the identity or endpoint of the application. Planned scope includes stress and strain analysis, deformation kinematics, rheology, brittle and ductile structures, folds, faults, structural measurements, stereographic projection, maps, cross-sections, and synthesis. The complete product goal is documented in [CURRICULUM_VISION.md](CURRICULUM_VISION.md).

The current version demonstrates the first reusable interaction pattern and separable domain, lesson-content, rendering, and interface layers. It is not yet a complete multi-topic course. The opening sequence now builds continuously from external load through equilibrium, internal action, traction, and stress before reaching named stress states.

## Completed

### Core interaction

- [x] Direct 3D force-vector manipulation with a draggable handle.
- [x] Draggable force application point on every selectable face.
- [x] Resultant force and `r × F` moment calculation.
- [x] Free-body translation and rotation tendency.
- [x] Ideal fixed-opposite-face support with force and moment reactions.
- [x] Continuous illustrative axial, shear, bending, and torsional response.
- [x] Movable imaginary section cut with internal force and moment.
- [x] Live axial-force, shear-force, bending-moment, and torsion readouts.
- [x] Visible uniform distributed-load arrows tied to the contact area.
- [x] Synchronized force magnitude and `Fx/Fy/Fz` numerical controls.
- [x] Clickable block faces and explicit surface-normal selection.
- [x] Resizable contact patch and average-traction calculation.
- [x] Geometric normal and shear traction decomposition.
- [x] Ten reference stress states represented as selectable presets.
- [x] Shared generic block instead of a material-specific specimen.
- [x] Animated transitions between undeformed and deformed states.
- [x] Stress vectors for normal and shear components.
- [x] Stress magnitude control.
- [x] Direct editing of six independent tensor components.
- [x] Compression-positive sign convention.
- [x] Original block outline for before/after comparison.
- [x] Approximate volume-change readout.
- [x] Orbit, zoom, replay, reset, and display controls.

### Engineering foundation

- [x] Preset definitions separated from visualization code.
- [x] Deformation calculation separated from rendering code.
- [x] Reusable Three.js stress-scene class.
- [x] Reusable Three.js load-response scene class.
- [x] Unit tests for statics, traction, catalog integrity, and core deformation behavior.
- [x] Responsive desktop, tablet, and mobile layouts.
- [x] Reduced-motion behavior.
- [x] Single-file production build for offline use.

### Documentation

- [x] Full-curriculum product vision and topic map.
- [x] Setup and operating instructions.
- [x] Architecture overview.
- [x] Scientific-scope statement.
- [x] Phased roadmap.
- [x] Maintained changelog.

### Teaching and distribution

- [x] Ten-step 3D loads-to-stress foundation sequence before tensor presets.
- [x] Explicit distinction among external force, resultant moment, reactions, internal resultants, average traction, signed normal traction, and the stress tensor.
- [x] Live vector traction calculation with newton, square-centimeter, and megapascal units.
- [x] Transition from normal and shear stress into the 3D stress-state sequence.
- [x] Fourteen-step guided opening module.
- [x] Prediction questions with immediate feedback.
- [x] Progressive reveal of tension, compression, shear, and combined loading.
- [x] Free Explore mode retained as the full sandbox.
- [x] Presentation mode with enlarged visualization and compact controls.
- [x] Named single-file classroom release artifact.
- [x] GitHub Actions tests and build artifact.
- [x] Tagged-release attachment workflow.

## Verification status

The following commands are the release gate:

```bash
npm test
npm run build
npm run release:build
```

Manual verification should cover:

1. Selecting all ten presets.
2. Confirming that displayed arrows match active tensor components.
3. Confirming that tension extends and compression shortens the loaded axis.
4. Confirming that pure shear distorts without a significant volume change.
5. Editing each tensor component.
6. Replaying deformation and resetting the camera.
7. Opening `release/Structural-Visualizer.html` without a development server.
8. Checking desktop and narrow-screen layouts.
9. Changing force and area and confirming that the live stress calculation follows `F/A`.
10. Dragging the 3D force handle and confirming that all three numerical components update smoothly.
11. Selecting multiple block faces and confirming the surface normal and traction decomposition update.
12. Switching among normal, oblique, and tangential loading.
13. Completing every guided lesson step, including incorrect and correct predictions.
14. Entering and exiting Explore and Present without carrying invalid zero-magnitude foundation state.
15. Moving the application point and confirming that `r × F` updates without changing force.
16. Switching between free and fixed conditions and confirming reaction activation.
17. Constructing axial, shear, bending, and torsional actions from load geometry.
18. Moving the section cut and confirming constant internal force with changing bending moment for a single end force.

## Known limitations

- The current navigation and state model still need extraction into a curriculum-level module registry.
- Both deformation mappings are qualitative and intentionally exaggerated; the statics resultants are quantitative under the documented ideal assumptions.
- Preset values are illustrative and are not calibrated to a particular rock or laboratory material.
- The block does not yet solve continuum displacements or stresses and has no constitutive material model, yield, fracture, or damage.
- The free-body ghost is a direction cue, not a rigid-body dynamics simulation.
- The fixed support and section resultants represent one idealized single-force model.
- Stress arrows are placed relative to the original block faces rather than following the deformed faces.
- The application has no saved student progress, assessment, or instructor-authoring interface.
- The production HTML uses system-font fallbacks when offline; preferred fonts are not yet vendored.
- The ten presets are based on the supplied diagram and use clearer application labels where the source wording is abbreviated.
- The standalone file has been browser-tested from the production bundle, but a final double-click check on a physical Windows classroom computer remains outstanding.

## Next recommended milestone

Validate the redesigned loads-to-stress module with instructors and students. Record misconceptions about free bodies, reactions, internal resultants, traction, and tensors alongside interaction failures, accessibility barriers, and lesson duration. Use that evidence to refine the shared laboratory before building the next curriculum module.

## Decisions intentionally deferred

- Exact ordering and grouping of the curriculum families in `CURRICULUM_VISION.md`.
- Whether student progress is stored locally or in a hosted account.
- Which quantitative material model is introduced first.
- Whether 2D cross-sections are derived from the same scene or use a separate renderer.
- Final deployment target beyond the offline bundle and a possible GitHub Pages build.
- Licensing.
