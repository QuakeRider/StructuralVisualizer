# Architecture

## Design intent

The project is structured so that a visual lesson is not hard-coded into the renderer. Stress definitions, qualitative deformation, Three.js rendering, and interface state are separate. That separation is the foundation for later strain, material, fracture, fault, and fold modules.

## Current layers

```text
Interface (src/main.js)
    |
    +-- preset catalog (src/domain/stressStates.js)
    +-- qualitative model (src/domain/deformation.js)
    +-- lesson content (src/lessons/stressLesson.js)
    +-- 3D renderer (src/visualization/StressScene.js)
```

### Interface

`src/main.js` owns the selected preset, displayed magnitude, customized tensor, and visibility preferences. It updates accessible HTML controls and passes only stress data to the scene.

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

`src/visualization/StressScene.js` owns the camera, lights, block mesh, comparison outline, arrows, grid, and animation. It receives stress and display settings; it does not decide which lesson or preset is active.

### Lesson content

`src/lessons/stressLesson.js` defines the guided sequence as data: loading preset, magnitude, visible references, explanatory copy, prompts, answer choices, and feedback. The interface renders this content, while the renderer remains unaware of lesson progress.

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
