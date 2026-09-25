# Architecture

## Design intent

Structural Visualizer is a curriculum platform, not a single stress-state tool. The project should support independent structural-geology modules that share a lesson shell, interaction vocabulary, accessibility system, presentation mode, and offline packaging while retaining topic-specific scientific models and visualizations.

The curriculum is defined in `docs/curriculum/`; the current code contains the lesson registry and five seed lessons. Force/stress calculations, stress definitions, qualitative deformation, Three.js rendering, and interface state are separated so they can inform—but not constrain—later modules for strain, kinematics, rheology, fractures, faults, folds, orientation data, maps, and cross-sections.

## Current layers

```text
Interface (src/main.js)
    |
    +-- lesson registry (src/lessons/registry.js)
    |       +-- curriculum catalog (src/lessons/catalog.js)
    |       +-- one data file per lesson (src/lessons/unit-*/<id>-*.js)
    +-- vector helpers (src/domain/vector.js)
    +-- force/stress foundations (src/domain/forceStress.js)
    +-- preset catalog (src/domain/stressStates.js)
    +-- qualitative model (src/domain/deformation.js)
    +-- renderers (src/visualization/ForceLabScene.js, StressScene.js)
    +-- scene references (src/visualization/sceneRefs.js)
```

### Interface

`src/main.js` owns the selected lesson and step, force-laboratory state, the selected stress preset, displayed magnitude, customized tensor, visibility preferences, and the three modes. It coordinates accessible HTML controls with two topic scenes while keeping scientific calculations in the domain layer.

**Modes.** Guided runs the selected lesson. Explore is the open stress-state laboratory. Present projects whichever of the two it was entered from: from Guided it shows the current lesson with larger type and arrow/PageUp/PageDown step keys; from Explore it shows the stress laboratory with its presentation toolbar. The shell element carries `data-mode` and `data-lesson-view` (true in Guided and in Present-from-Guided), and layout CSS keys off `data-lesson-view`.

**Equation–model binding panel.** A lesson step may declare `equations`. Each equation has `html` in which bound symbols are `<var data-scene-ref="…">`, live values are `<output data-live="…">` (filled from `liveValues()` in `main.js`), and HTML-valued outputs use `data-live-html` (for example the tensor matrix). Its `symbols` list gives each bound symbol a plain-language description of its scene object, rendered as a key so the binding does not rely on color alone. Hovering or focusing a symbol calls `ForceLabScene.highlight(ref)`, which dims every other bindable object; hovering a pickable scene object reports its ref back through the scene's `onHover` callback, which highlights the matching symbols.

### Lesson registry

`src/lessons/catalog.js` lists all 48 curriculum lessons (unit, id, title, prerequisites), mirroring `docs/curriculum/README.md`. `src/lessons/registry.js` merges the catalog with the lesson content files and exposes `LESSONS`, `getLesson`, `getAvailableLessons`, `getNextAvailableLesson`, `getLessonStep`, and `isLessonChoiceCorrect`. A lesson's `status` is `planned` (no content), `seed` (an early version carried over from 0.5), or `built`. Only lessons with content are selectable.

A lesson file exports `{ id, status, steps }`. Each step is data: `visualKind` (`force-lab` or `stress-state`), `quantity` (`vector` or `force`), `controls`, `labOptions`, `initialLabState`, the stress `presetId`/`magnitude` and display toggles, copy (`title`, `body`, `task`), optional `equations`, optional `prompt`/`choices`, and `final` (the last step opens Explore instead of the next lesson). Renderers stay unaware of lesson progress. Later modes can add fields such as `numericAnswer`, `tolerance`, and `hints` without changing this shape.

To add a lesson: create its file under `src/lessons/unit-*/`, import it in `registry.js`, and set its status. `registry.test.js` validates ids, prerequisites, presets, answer keys, scene references, and that no engineering-statics content returns.

### Vectors and force/stress foundations

`src/domain/vector.js` holds small tested vector helpers (`add`, `subtract`, `scale`, `dot`, `cross`, `magnitude`, `normalize`). Lessons M1 and M3 extend it.

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

`src/visualization/ForceLabScene.js` owns the directly manipulated vector (acting at the center of the selected face), selectable block faces, contact patch, distributed-load arrows, labeled axes, surface normal, and normal/shear component geometry. It reports vector, surface, and hover changes to the interface and exposes `highlight(ref)` for equation binding. The refs it supports are listed in `sceneRefs.js`, which has no Three.js dependency so lesson tests can validate against it.

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

- Vector helpers (magnitude, dot and cross products, normalization).
- Force/area unit conversion and the inverse area relationship.
- Normal and shear notation.
- Catalog completeness and stable numbering.
- Tensor scaling.
- Expected extension under tension and shortening under compression.
- Volume preservation for shear-only deformation and volume reduction for compressed combined states.
- Curriculum catalog: 48 unique lessons in unit order, valid prerequisites, and content only for non-planned lessons.
- Lesson content: unique step ids, valid preset references, exactly one correct answer per prompt, equation symbols bound to known scene refs, and no engineering-statics spotlights, controls, or options.
- Lesson navigation helpers.

Browser checks are done by stepping through every lesson in Guided and Present (see the build-session protocol in `docs/curriculum/README.md`).

Future tests should add:

- Snapshot tests for preset tensor definitions.
- Accessibility checks for the application shell.
- Browser tests for state selection and controls.
- Visual regression coverage for vector orientation.
- Contract tests for lesson and response-model modules.
