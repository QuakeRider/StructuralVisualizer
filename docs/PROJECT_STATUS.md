# Project Status

Last updated: 2026-09-23

## Summary

Structural Visualizer is at **guided-lesson prototype** status (`0.2.0`). All ten reference stress states can be selected, numerically inspected, modified, and visualized on a common deformable 3D block. A seven-step guided lesson and a classroom presentation layout now use that same explorer.

The current version demonstrates the central interaction, a complete opening lesson flow, and separable domain, lesson-content, rendering, and interface layers. It is not yet a complete multi-topic course.

## Completed

### Core interaction

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
- [x] Unit tests for catalog integrity and core deformation behavior.
- [x] Responsive desktop, tablet, and mobile layouts.
- [x] Reduced-motion behavior.
- [x] Single-file production build for offline use.

### Documentation

- [x] Setup and operating instructions.
- [x] Architecture overview.
- [x] Scientific-scope statement.
- [x] Phased roadmap.
- [x] Maintained changelog.

### Teaching and distribution

- [x] Seven-step guided stress lesson.
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
9. Completing every guided lesson step, including incorrect and correct predictions.
10. Entering and exiting presentation mode and changing its state and magnitude controls.

## Known limitations

- The deformation mapping is qualitative and intentionally exaggerated.
- Preset values are illustrative and are not calibrated to a particular rock or laboratory material.
- The block does not yet support constitutive material models, yield, fracture, or damage.
- Stress arrows are placed relative to the original block faces rather than following the deformed faces.
- The application has no saved student progress, assessment, or instructor-authoring interface.
- The production HTML uses system-font fallbacks when offline; preferred fonts are not yet vendored.
- The ten presets are based on the supplied diagram and use clearer application labels where the source wording is abbreviated.
- The standalone file has been browser-tested from the production bundle, but a final double-click check on a physical Windows classroom computer remains outstanding.

## Next recommended milestone

Pilot the guided lesson with students or an instructor before adding quantitative strain. Record where students misread vector direction, sign, shape change, volume change, or the undeformed outline. Use those observations to revise the lesson and establish a small set of teaching-validation notes in the repository.

## Decisions intentionally deferred

- Exact curriculum order after the opening stress lesson.
- Whether student progress is stored locally or in a hosted account.
- Which quantitative material model is introduced first.
- Whether 2D cross-sections are derived from the same scene or use a separate renderer.
- Final deployment target beyond the offline bundle and a possible GitHub Pages build.
- Licensing.
