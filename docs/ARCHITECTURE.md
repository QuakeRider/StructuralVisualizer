# Architecture

## Design intent

Structural Visualizer is a curriculum platform, not a single stress-state tool. The project should support independent structural-geology modules that share a lesson shell, interaction vocabulary, accessibility system, presentation mode, and offline packaging while retaining topic-specific scientific models and visualizations.

The current stress implementation is the first vertical slice. Force/stress calculations, stress definitions, qualitative deformation, Three.js rendering, and interface state are separated so they can inform—but not constrain—later modules for strain, kinematics, rheology, fractures, faults, folds, orientation data, maps, and cross-sections.

## Current layers

```text
Interface (src/main.js)
    |
    +-- force/stress foundations (src/domain/forceStress.js)
    +-- preset catalog (src/domain/stressStates.js)
    +-- qualitative model (src/domain/deformation.js)
    +-- lesson content (src/lessons/stressLesson.js)
    +-- 3D renderer (src/visualization/StressScene.js)
```

### Interface

`src/main.js` owns lesson progress, force-laboratory state, the selected stress preset, displayed magnitude, customized tensor, and visibility preferences. It coordinates accessible HTML controls with two topic scenes while keeping scientific calculations in the domain layer.

### Force/stress foundations

`src/domain/forceStress.js` converts newtons over square centimeters to megapascals and supplies normal/shear notation. The unit conversion and inverse area relationship are tested without the browser.

It also calculates vector average traction and decomposes it into signed normal and in-plane shear components for an arbitrary surface normal.

### Domain catalog

`src/domain/stressStates.js` is the authoritative list of opening stress cases. Each case contains:

- A stable identifier and display order.
- A label and category.
- Six normalized tensor factors.
- A short loading description.
- A qualitative response description.

The catalog contains no Three.js or DOM behavior.

### Deformation mapping

`src/domain/deformation.js` converts a compression-positive stress tensor into a deformation gradient. It can be tested without a browser. The current implementation is explicitly qualitative and should eventually become one implementation of a broader response-model contract.

### Renderer

`src/visualization/ForceLabScene.js` owns the directly manipulated force vector, selectable block faces, contact patch, labeled axes, surface normal, and normal/shear component geometry. It reports force and surface changes to the interface without owning lesson progress.

`src/visualization/StressScene.js` owns the stress-state camera, lights, deformable block, comparison outline, arrows, labeled axes, grid, and animation. It receives stress and display settings; it does not decide which lesson or preset is active.

### Lesson content

`src/lessons/stressLesson.js` defines the guided sequence as data: visual kind, foundation controls or loading preset, magnitude, visible references, explanatory copy, prompts, answer choices, and feedback. The interface selects either the foundation illustration or the 3D scene, while the renderer remains unaware of lesson progress.

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

Before adding the second major topic, introduce a module registry with a contract similar to:

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

The exact API should be derived from the stress lesson and the first genuinely different lesson, not finalized from the stress explorer alone.

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

- Force/area unit conversion and the inverse area relationship.
- Normal and shear notation.
- Catalog completeness and stable numbering.
- Tensor scaling.
- Expected extension under tension.
- Expected shortening under compression.
- Volume preservation for shear-only deformation.
- Volume reduction for compressed combined states.
- Guided-step ordering and preset references.
- Exactly one correct answer for every prediction prompt.

Future tests should add:

- Snapshot tests for preset tensor definitions.
- Accessibility checks for the application shell.
- Browser tests for state selection and controls.
- Visual regression coverage for vector orientation.
- Contract tests for lesson and response-model modules.
