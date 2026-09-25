# Architecture

## Design intent

Structural Visualizer is a curriculum platform, not a single stress-state tool. The project should support independent structural-geology modules that share a lesson shell, interaction vocabulary, accessibility system, presentation mode, and offline packaging while retaining topic-specific scientific models and visualizations.

The curriculum is defined in `docs/curriculum/`; the current code contains the lesson registry, one fully built lesson (M1), and four seed lessons. Force/stress calculations, stress definitions, qualitative deformation, Three.js rendering, and interface state are separated so they can inform—but not constrain—later modules for strain, kinematics, rheology, fractures, faults, folds, orientation data, maps, and cross-sections.

## Current layers

```text
Interface (src/main.js)
    |
    +-- lesson registry (src/lessons/registry.js)
    |       +-- curriculum catalog (src/lessons/catalog.js)
    |       +-- one data file per lesson (src/lessons/unit-*/<id>-*.js)
    +-- vector helpers (src/domain/vector.js)
    +-- equation number formatting (src/domain/format.js)
    +-- force/stress foundations (src/domain/forceStress.js)
    +-- preset catalog (src/domain/stressStates.js)
    +-- qualitative model (src/domain/deformation.js)
    +-- renderers (src/visualization/VectorScene.js, ForceLabScene.js, StressScene.js)
    +-- scene references (src/visualization/sceneRefs.js)
```

### Interface

`src/main.js` owns the selected lesson and step, the prediction state, vector-laboratory and force-laboratory state, the selected stress preset, displayed magnitude, customized tensor, visibility preferences, and the three modes. It coordinates accessible HTML controls with three topic scenes while keeping scientific calculations in the domain layer. The shell's `data-visual-kind` (`vector-lab`, `force-lab`, or `stress-state`) decides which scene is visible.

**Modes.** Guided runs the selected lesson. Explore is the open stress-state laboratory. Present projects whichever of the two it was entered from: from Guided it shows the current lesson with larger type and arrow/PageUp/PageDown step keys; from Explore it shows the stress laboratory with its presentation toolbar. The shell element carries `data-mode` and `data-lesson-view` (true in Guided and in Present-from-Guided), and layout CSS keys off `data-lesson-view`.

**Equation–model binding panel.** A lesson step may declare `equations`. Each equation has `html` in which bound symbols are `<var data-scene-ref="…">`, live values are `<output data-live="…">` (filled from `liveValues()` in `main.js`), and HTML-valued outputs use `data-live-html` (for example the tensor matrix). A live output may also carry `data-scene-ref`, so a substituted number (such as the `3²` in `√(3² + (−4)²)`) highlights its component. Keys listed in a step's `revealAfterAnswer` show `?` until the prediction is answered correctly. Its `symbols` list gives each bound symbol a plain-language description of its scene object, rendered as a key so the binding does not rely on color alone. Hovering or focusing a symbol calls the active scene's `highlight(ref)`, which dims every other bindable object; hovering a pickable scene object reports its ref back through the scene's `onHover` callback, which highlights the matching symbols.

### Lesson registry

`src/lessons/catalog.js` lists all 48 curriculum lessons (unit, id, title, prerequisites), mirroring `docs/curriculum/README.md`. `src/lessons/registry.js` merges the catalog with the lesson content files and exposes `LESSONS`, `getLesson`, `getAvailableLessons`, `getNextAvailableLesson`, `getLessonStep`, `isLessonChoiceCorrect`, `hasPrediction`, `parseNumericInput`, `checkNumericAnswer`, and `isGoalMet`. A lesson's `status` is `planned` (no content), `seed` (an early version carried over from 0.5), or `built`. Only lessons with content are selectable.

A lesson file exports `{ id, status, steps }`. Each step is data:

- `visualKind` (`vector-lab`, `force-lab`, or `stress-state`), `controls`, `labOptions`, and `initialLabState`.
- For the vector lab: `dimension` (2 or 3) and, optionally, `contexts`.
- For stress-state steps: the stress `presetId`/`magnitude` and display toggles.
- Copy: `title`, `body`, `task`.
- Optional `equations`.
- A prediction, either `prompt` + `choices` (multiple choice) or `prompt` + `answer` (numeric: `{ value, tolerance, correctFeedback, wrong: [{ value, feedback }], fallbackFeedback }`).
- Optional `revealAfterAnswer`.
- An optional construction `goal` (`{ text, check(labState) }`, checked live and shown as reached or not; it does not block progress).
- `final`: the last step opens Explore instead of the next lesson.

Renderers stay unaware of lesson progress. Lab and Self-study modes can reuse `answer` and `goal` directly and add fields such as `hints` without changing this shape.

To add a lesson: create its file under `src/lessons/unit-*/`, import it in `registry.js`, and set its status. `registry.test.js` validates ids, prerequisites, presets, answer keys, scene references, and that no engineering-statics content returns.

### Vectors and force/stress foundations

`src/domain/vector.js` holds small tested vector helpers (`add`, `subtract`, `scale`, `negate`, `dot`, `cross`, `magnitude`, `xyMagnitude`, `normalize`, `snapVector`, `clampVector`, `isUnitVector`). `src/domain/format.js` formats numbers for live equations (true minus sign, bracketed negative squares).

`src/domain/forceStress.js` converts newtons over square centimeters to megapascals, calculates vector average traction, and decomposes it into signed normal and in-plane shear components for an arbitrary surface normal. The unit conversion and inverse area relationship are tested without the browser.

### Domain catalog

`src/domain/stressStates.js` is the authoritative list of opening stress cases. Each case contains:

- A stable identifier and display order.
- A label and category.
- Six normalized tensor factors.
- A short loading description.
- A qualitative response description.

The catalog contains no Three.js or DOM behavior.

### Deformation mapping

`src/domain/deformation.js` converts a compression-positive stress tensor into a deformation gradient. It can be tested without a browser. The current implementation is explicitly qualitative; lesson R2 replaces it with linear elasticity.

### Renderers

`src/visualization/VectorScene.js` is the Unit 0 vector laboratory. It works in the math frame (right-handed x, y, z with z drawn up) and converts to Three.js coordinates internally. It draws:

- patterned 3D arrows (solid, dashed, dotted) and constant-size text labels
- the component box with labeled component arrows, and the stacked right triangles of the 3D magnitude
- the unit sphere, scaled vectors, and tip-to-tail addition with per-axis component stacks
- illustrative context props

Its camera has a 2D top view, a 3D view, and a 3D close-up. It animates between them (instantly under reduced motion) and pulls back on portrait viewports. A plain drag moves a tip across the floor, and Shift-drag moves it vertically. It reports vector and hover changes and exposes `highlight(ref)`.

`src/visualization/ForceLabScene.js` owns the directly manipulated vector (acting at the center of the selected face), selectable block faces, contact patch, distributed-load arrows, labeled axes, surface normal, and normal/shear component geometry. It reports vector, surface, and hover changes to the interface and exposes `highlight(ref)` for equation binding. The refs each scene supports are listed per visual kind in `sceneRefs.js` (`SCENE_REFS`), which has no Three.js dependency so lesson tests can validate against it.

`src/visualization/StressScene.js` owns the stress-state camera, lights, deformable block, comparison outline, arrows, labeled axes, grid, and animation. It receives stress and display settings; it does not decide which lesson or preset is active. It does not yet support equation highlighting.

## Planned curriculum architecture

The target application should use a module registry above the current layers:

```text
Shared application shell
    |
    +-- curriculum and module registry
    +-- guided-lesson runtime
    +-- accessible control and interaction system
    +-- presentation and offline-distribution systems
    |
    +-- topic module
            +-- scientific model
            +-- interactive scene or diagram
            +-- presets and examples
            +-- guided activities
            +-- assessment and explanation rules
```

The stress scene is therefore one topic renderer, not the universal renderer for every future lesson. Fold geometry, stereonets, maps, cross-sections, and other topics may use different visualization approaches behind the same product shell.

## Proposed module contract

The lesson registry (above) is in place. When the first lesson needs a genuinely different renderer (the stereonet in O3 or the Mohr plot in S5), extend each lesson or step with a scene contract similar to:

```js
{
  id,
  title,
  objectives,
  presets,
  controls,
  createModel(),
  createScene(),
  guidedSteps
}
```

The exact API should be derived from the force laboratory and that first genuinely different renderer, not finalized from the stress explorer alone. The `sceneRefs` + `highlight(ref)` + `onHover` binding contract should carry over to every renderer.

## State flow

```text
Preset selection or component edit
            |
            v
Compression-positive stress tensor
            |
            +--> tensor readout
            +--> stress-vector configuration
            +--> response model
                      |
                      v
             deformation gradient
                      |
                      v
              deformed block mesh
```

## Offline build

Vite handles development and bundling. `vite-plugin-singlefile` inlines application JavaScript and CSS into `dist/index.html`. Keeping the production artifact self-contained prevents external JavaScript-module requests from failing when the file is opened directly from disk.

## Testing strategy

Current unit tests verify:

- Vector helpers (magnitude, dot and cross products, normalization, snapping, unit-vector check) and equation number formatting.
- Force/area unit conversion and the inverse area relationship.
- Normal and shear notation.
- Catalog completeness and stable numbering.
- Tensor scaling.
- Expected extension under tension and shortening under compression.
- Volume preservation for shear-only deformation and volume reduction for compressed combined states.
- Curriculum catalog: 48 unique lessons in unit order, valid prerequisites, and content only for non-planned lessons.
- Lesson content:
  - unique step ids and valid preset references
  - exactly one correct answer per multiple-choice prompt
  - numeric answers whose known-wrong values don't overlap the answer
  - hidden values only in steps that ask for a prediction
  - equation symbols bound to the refs of the step's scene
  - no engineering-statics spotlights, controls, or options
- M1 specifics: magnitude answers match the step's starting vector, goal checks work, and the lesson stays 2D before the jump and 3D after it.
- Numeric-answer parsing and feedback.
- Lesson navigation helpers.

Browser checks are done by stepping through every lesson in Guided and Present (see the build-session protocol in `docs/curriculum/README.md`).

Future tests should add:

- Snapshot tests for preset tensor definitions.
- Accessibility checks for the application shell.
- Browser tests for state selection and controls.
- Visual regression coverage for vector orientation.
- Contract tests for lesson and response-model modules.
