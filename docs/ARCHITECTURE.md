# Architecture

## Design intent

Structural Visualizer is a curriculum platform, not a single stress-state tool. The project should support independent structural-geology modules that share a lesson shell, interaction vocabulary, accessibility system, presentation mode, and offline packaging while retaining topic-specific scientific models and visualizations.

The curriculum is defined in `docs/curriculum/`; the current code contains the lesson registry, three fully built lessons (M1, M2, and B7 built early), and four seed lessons. Force/stress calculations, stress definitions, qualitative deformation, Three.js rendering, and interface state are separated so they can inform—but not constrain—later modules for strain, kinematics, rheology, fractures, faults, folds, orientation data, maps, and cross-sections.

## Current layers

```text
Interface (src/main.js)
    |
    +-- lesson registry (src/lessons/registry.js)
    |       +-- curriculum catalog (src/lessons/catalog.js)
    |       +-- one data file per lesson (src/lessons/unit-*/<id>-*.js)
    +-- vector helpers (src/domain/vector.js)
    +-- equation number formatting (src/domain/format.js)
    +-- orientation, stereonet projection, stress tensors, failure and friction, Anderson faulting
    |       (src/domain/orientation.js, stereonet.js, tensor.js, failure.js, anderson.js)
    +-- force/stress foundations (src/domain/forceStress.js)
    +-- preset catalog (src/domain/stressStates.js)
    +-- qualitative model (src/domain/deformation.js)
    +-- renderers (src/visualization/VectorScene.js, CurvePlot.js, AndersonScene.js, MohrPlot.js,
    |       FrictionMohrPlot.js, Stereonet.js, ForceLabScene.js, StressScene.js)
    |       +-- shared arrows and labels (src/visualization/sceneKit.js)
    |       +-- shared SVG plot helpers (src/visualization/plotKit.js)
    +-- scene references (src/visualization/sceneRefs.js)
```

### Interface

`src/main.js` owns the selected lesson and step, the prediction state, vector-laboratory and force-laboratory state, the selected stress preset, displayed magnitude, customized tensor, visibility preferences, and the three modes. It coordinates accessible HTML controls with three topic scenes while keeping scientific calculations in the domain layer. The shell's `data-visual-kind` (`vector-lab`, `anderson`, `friction`, `force-lab`, or `stress-state`) decides which scene is visible.

**Modes.** Guided runs the selected lesson. Explore is the open stress-state laboratory. Present projects whichever of the two it was entered from: from Guided it shows the current lesson with larger type and arrow/PageUp/PageDown, 1–9, and Home/End step keys; from Explore it shows the stress laboratory with its presentation toolbar. The shell element carries `data-mode` and `data-lesson-view` (true in Guided and in Present-from-Guided), and layout CSS keys off `data-lesson-view`.

**Scene header.** In lesson view the header above the scene has two rows. The first holds the lesson badge (unit letter over lesson.step, boxed in the unit color from `.lesson-badge[data-unit]` in `styles.css`), the "lesson · step n of N" line above the step title, and the view buttons. The second holds the lesson picker and the step navigator (numbered buttons that open any step, with a name preview). In Explore the header shows the preset number and name.

**Equation–model binding panel.** A lesson step may declare `equations`. Each equation's `html` is native MathML, written with the builder in `src/lessons/mathml.js`:

- Every line is `math(...)`.
- `vec('v')` gives a bold vector, `sub`, `sup`, `sqrt`, `frac`, `hat`, `abs`, and `column` do what their names say, and `inline(...)` puts math in prose.
- `bound(ref, …)` marks a symbol bound to a scene object. It becomes a focusable `<mrow data-sym data-scene-ref>`.
- `live(key, ref)` marks a slot that `main.js` fills from `liveValues()`. Live values are MathML strings built with the same helpers (`num`, `squared`, `signedTerm`, `tuple`). A slot with a ref highlights its scene object, for example the `3²` in `√(3² + (−4)²)`.
- HTML-valued outputs use `data-live-html` (the tensor matrix).

Colors and underline patterns come from per-ref CSS custom properties (`--ref-color`, `--ref-line`), so the equation, the symbol key, and the scene share one mapping. Keys listed in a step's `revealAfterAnswer` show `?` until the prediction is answered correctly. Its `symbols` list gives each bound symbol a plain-language description of its scene object, rendered as a key so the binding does not rely on color alone. Hovering or focusing a symbol calls the active scene's `highlight(ref)`, which dims every other bindable object; hovering a pickable scene object reports its ref back through the scene's `onHover` callback, which highlights the matching symbols.

### Lesson registry

`src/lessons/catalog.js` lists all 57 curriculum lessons (unit, id, title, prerequisites) in teaching order, mirroring `docs/curriculum/README.md`. Each unit has an `id` (what a lesson's `unit` refers to) and a `number` (the label shown); Unit 3B has two groups with the same label, the second after Unit 6. `src/lessons/registry.js` merges the catalog with the lesson content files and exposes `LESSONS`, `getLesson`, `getAvailableLessons`, `getNextAvailableLesson`, `getLessonStep`, `isLessonChoiceCorrect`, `hasPrediction`, `parseNumericInput`, `checkNumericAnswer`, and `isGoalMet`. A lesson's `status` is `planned` (no content), `seed` (an early version carried over from 0.5), or `built`. Only lessons with content are selectable.

A lesson file exports `{ id, status, steps }`. Each step is data:

- `visualKind` (`vector-lab`, `anderson`, `friction`, `fault`, `fault-growth`, `fault-zone`, `force-lab`, or `stress-state`), `controls`, `labOptions`, and `initialLabState`.
- For the Anderson lab: optional `settings` (tectonic settings). For the friction lab: optional `mappedFaults` (`{ id, label, strike, dip, description }`).
- For the vector lab: `dimension` (2 or 3) and, optionally, `contexts`.
- For stress-state steps: the stress `presetId`/`magnitude` and display toggles.
- Copy: `title`, `body`, `task`.
- Optional `equations`.
- A prediction, either `prompt` + `choices` (multiple choice) or `prompt` + `answer` (numeric: `{ value, tolerance, correctFeedback, wrong: [{ value, feedback }], fallbackFeedback }`).
- Optional `revealAfterAnswer`.
- An optional construction `goal` (`{ text, check(labState) }`, checked live and shown as reached or not; it does not block progress).
- `final`: the last step opens Explore instead of the next lesson.

Renderers stay unaware of lesson progress. Lab and Self-study modes can reuse `answer` and `goal` directly and add fields such as `hints` without changing this shape.

To add a lesson: create its file under `src/lessons/unit-*/` (Unit 3B's are in `unit-3b-faults/`), import it in `registry.js`, and set its status. `registry.test.js` validates ids, prerequisites, presets, answer keys, scene references, and that no engineering-statics content returns.

### Vectors and force/stress foundations

`src/domain/vector.js` holds small tested vector helpers (`add`, `subtract`, `scale`, `negate`, `dot`, `cross`, `magnitude`, `xyMagnitude`, `normalize`, `snapVector`, `clampVector`, `isUnitVector`), plus the M2 trigonometry helpers `fromPolar`, `polarAngle` (atan2, in [0°, 360°)), `directionCosines`, `directionAngles`, and `rotate2D` (components in axes turned by θ about z). `src/domain/format.js` formats numbers for live equations (true minus sign, bracketed negative squares).

`src/domain/forceStress.js` converts newtons over square centimeters to megapascals, calculates vector average traction, and decomposes it into signed normal and in-plane shear components for an arbitrary surface normal. The unit conversion and inverse area relationship are tested without the browser.

### Orientation, failure, and faulting

`src/domain/orientation.js` converts between trend/plunge or strike/dip (right-hand rule) and unit vectors in the NED frame (x north, y east, z down): `lineVector`, `planeFromDipDirection`, `planeFromStrike`, `planePole` (downward), `planeUpwardNormal` (into the hanging wall), `strikeVector`, and `dipVector`. B8 added the O4 rake helpers `rakeVector` (the line at rake r, 0–180° from strike toward the dip) and `lineToRake`. Lessons O1–O4 extend it.

`src/domain/stereonet.js` (lesson B6) is the lower-hemisphere equal-area projection: `equalAreaPoint`, its inverse `equalAreaLine`, `lineFromVector` (the lower-hemisphere end of a direction), `greatCirclePoints`, and `planeFromPole`. O3 adds equal-angle.

`src/domain/tensor.js` applies a stress tensor to a normal (`applyTensor`) and resolves the traction into σn and τ (`resolveTraction`).

`src/domain/failure.js` holds the Coulomb failure relations: `frictionAngle`, `coulombAngles` (φ, θ, β, 2θ), `coulombShearStrength`, `sigma1AtFailure`, `mohrCircle`, and `mohrPoint`. B6 added friction on existing planes: `BYERLEE` and `byerlee`, `principalMagnitudes`, `mohrCircles3D`, `slipTendency` and `frictionCheck` (with pore pressure), `dilationTendency`, `reactivationSigma1` (closed form), `newFaultSigma1`, `principalCosines`, and `slipTendencyGrid` (Ts over the net). Lessons B2–B4 add the other envelopes and effective stress.

`src/domain/anderson.js` (lesson B7) gives each regime's principal axes (`andersonAxes`) and its conjugate fault planes (`andersonFaults`). It also builds a tensor from principal axes and magnitudes (`principalStressTensor`), finds the slip direction of the hanging wall from the shear part of 𝐭 = −σ𝐦 (`faultSlip`), and names the sense of slip (`slipSense`).

`src/domain/faultGrowth.js` (lesson B9) holds the displacement models of normal faults, with u along strike, w down the dip, and d along the downward pole: `tipRadius`, `displacementShape` (elliptical, linear, bell), `ellipticalDisplacement`, `displacementAt`, `contourRadius`, `displacementProfile`, `dlScaling` and `dlLength` (D = c Lⁿ), `dragDisplacement`, `farFieldOffset`, `classifyDrag`, `faultDisplacement` (how a point of rock moves: half of D along the dip on each wall, faded with distance or shaped by the drag model), and the relay model (`RELAY`, `segmentProfile`, `linkSegments`, `relaySystem` for the growth stage, profiles, breach, and linked slip, and `relayFaults` for the 3D faults).

`src/domain/faultRocks.js` (lesson B11) holds fault zones and fault rocks, with widths in metres and grain sizes in millimetres: the clast-size power law (`clastSizeDistribution`, `fractionFiner`, `sizeAtFraction`, `rockComposition`), the comminution rule (`COMMINUTION`, `comminutionState`), slab drawings (`sampleClasts` from the slice exponent Df − 1, `clastPolygon`, and `slabTexture`, which packs equal-area clasts on a grid so the drawn matrix matches the model), Sibson's and Woodcock & Mort's names (`sibsonClass`, `woodcockMortClass`), `frictionalHeating`, Caine et al.'s `architectureIndex` and `permeabilityStructure`, the damage-density law (`DAMAGE`, `damageDensity`, `damagePeak`, `damageZoneEdge`), the outcrop zone (`zonePosition`, `zoneDensity`), fracture traces on each face (`pavementTraces`, `sectionTraces`, `strikeFaceTraces`) with `scanlineCrossings` and `scanlineDensity`, `widthScaling`, and the depth zones (`ZONE_TEMPERATURES`, `depthOfTemperature`, `faultRockZones`). It has its own seeded random sequence (`seededRandom`).

`src/domain/faults.js` (lesson B8) holds fault kinematics with 𝐧 the downward pole (into the footwall) and 𝐬 the hanging wall's slip: `faultFrame` (strike, up-dip, down-dip, pole), `slipFromRake` and `rakeFromSlip` (λ from −180° to 180°, positive up the dip), `lineRakeFromSlipRake`, `slipComponents`, `classifySlip` (normal, reverse, thrust, dextral, sinistral, oblique; 20° windows), `resolvedShearDirection` (Wallace–Bott), `kinematicAxes` (P ∝ 𝐧 + 𝐬̂, T ∝ 𝐧 − 𝐬̂, B = 𝐧 × 𝐬̂), `auxiliaryPlane`, `firstMotion` (beach-ball quadrants), `tiltAxes` (turn σ1 and σ3 about σ2), `planeThrough`, `traceSeparation` (separation of a planar marker on any view surface), and `wellLog` (the beds a vertical well crosses, and the missing or repeated interval).

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

For M2 it also draws:
- length-and-angle (polar) dragging
- the α arc, and direction-angle arcs α, β, γ in 3D
- an elevation arc ε
- a rotatable x′, y′ axis pair with its θ arc and the primed components v′ₓ, v′ᵧ
- a plane trace normal to x′

Its camera has a 2D top view, a 2D close-up, a 3D view, and a 3D close-up. Arrows are thinner in the close-ups. It animates between them (instantly under reduced motion) and pulls back on portrait viewports. A plain drag moves a tip across the floor, and Shift-drag moves it vertically. It reports vector and hover changes and exposes `highlight(ref)`.

`src/visualization/earthBlock.js` holds what the Earth-block scenes share: the NED → Three.js frame change (`toWorld`, `toNed`), the block size and center, plane–box sections (`boxSection`), fan and loop geometry, the bed and ground textures, and on-top arrows.

`src/visualization/AndersonScene.js` is the Earth block in the NED frame used by B7 and B6, converted to Three.js internally (north −z, east +x, down −y). It draws:
- a layered block, drawn as two copies clipped by the active fault plane so the hanging wall can slide
- the σ1/σ2/σ3 glyph pairs
- the conjugate fault polygons, cut from the block by a plane–box intersection
- the β and dip arcs in the σ1–σ3 plane
- the slip arrows and an N/E/D compass
- for B6, given an existing `plane`: that plane (which then splits the block), its pole 𝐧, and the traction 𝐭 = σ𝐧 with its σn and τ parts; the Coulomb pair then stands for a new fault

It reframes itself on resize until the student orbits. `src/visualization/MohrPlot.js` is an SVG Mohr diagram next to it: the σ1–σ3 circle at Coulomb failure, the envelope, ±2θ points, and φ. Its groups carry `data-ref`, so it takes part in the same highlighting as the 3D scenes. Both expose `highlight(ref)` and report hover through `onHover`. `src/visualization/sceneKit.js` holds the patterned `Arrow3D` (with a thickness factor for close-ups), the constant-size `Label`, and the line, arc, and tube helpers the scenes share. `src/visualization/CurvePlot.js` is an SVG plot of functions of θ (0–180°) with a marker at the current θ; M2 uses it for cos²θ and sin θ cos θ. The vector lab and the Anderson lab both sit in a `.split-viewport`: a 3D scene (`.lab-scene`) beside an optional plot (`.plot-panel`), shown when `data-side="true"`. The friction lab (B6) uses a second Earth-block instance with a `.plot-stack` beside it: `FrictionMohrPlot.js` (the three circles and their region, Byerlee's and the intact-rock lines, the plane's point, the Ts line, and the shift by Pf) above `Stereonet.js` (a slip-tendency raster with the slipping planes hatched, principal axes, the plane's great circle and pole, lettered markers, and click/drag pole picking), which shows when `data-net="true"`. `plotKit.js` holds the SVG helpers the plots share (subscripted symbols, tick spacing, and `data-ref` hover and highlight).

`src/visualization/FaultScene.js` is the fault laboratory (B8): a 1000 m × 500 m NED block split by a fault through its center, built as two clipped rock boxes whose texture coordinates come from each block's own position, so beds and the ground grid travel with the rock. In "moved" mode the hanging wall is displaced by the slip; in "cut" mode both walls fill the original block, eroded flat, so the top reads as a map and the sides as cross-sections. It draws the slip vector with its strike-slip and dip-slip parts and the rake arc, a dike with its traces and separation arrows, a well, slickenlines on the exposed footwall, the principal-stress glyphs, 𝐭 and 𝛕, and the P, T, and B axes with their construction from 𝐧 and 𝐬̂, and it has 3D, map, and section camera presets. It sits in a `.split-viewport` beside a `.plot-stack` holding a second `Stereonet` instance (B8 layers: slip with the hanging wall's sense, auxiliary plane, P/T/B markers, beach ball as an exact even–odd fill, and a key) or a `WellLog.js` plot (the well's beds beside the normal sequence), chosen by `data-panel`.

`src/visualization/FaultGrowthScene.js` is the fault-growth laboratory (B9), in the same NED Earth block at a chosen scale. Marker horizons are grids of points moved by `faultDisplacement` for every fault, with triangles that span a fault dropped so each bed ends at its cutoffs; beds can be shaded by depth with structure contours (relay). Fault surfaces (ellipses inside their tip lines, or rectangles) are colored by displacement with contour loops, and dashed process zones mark the growing relay tips. Screen-width lines use Three.js `LineSegments2`. A section can cut the block (clipping planes remove the rock south of it), and the camera has 3D, map, section, and fault-face presets, with a zoom for the relay. It sits in a `.split-viewport` beside `XYPlot.js`, a general x–y plot (lines, points, markers, bands, filled areas, and log axes, with a displacement color bar). `plotKit.js` holds the displacement color scale.

`src/visualization/FaultZoneScene.js` is the fault-zone laboratory (B11), with three setups. The outcrop is an opaque block whose five visible faces are canvases painted pixel by pixel from the zone model (host rock, damage zones, core, lenses), with strands, damage-zone edges, fracture traces or deformation bands, and the scanline drawn on top; hovering reads the ref back from the same per-pixel classes, and a highlight repaints the faces with the other classes dimmed. The sample setup is a slab whose top is drawn by `faultRockTexture.js` from `slabTexture` (clasts, fine fragments, matrix, foliation, and a pseudotachylyte vein); hovering reads the slab cell. The crust setup paints the fault-rock zones, isotherms, and earthquakes on a 60 km block. It sits in a `.split-viewport` beside a `.plot-stack` of up to two panels chosen by the step's `labOptions.panels`: two `XYPlot` instances (scanline, width scaling, clast counts, fraction finer, heating), `FaultRockChart.js` (Sibson's chart with Woodcock & Mort's scale), and the `DamageMap`, `DepthColumn`, and `ArchitectureGauge` in `FaultZonePanels.js`. It replaced `FaultRockPanel.js`, B9's former fault-rock drawings, which was removed.

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
- NED orientation helpers (right-hand rule, poles, normals), the Coulomb angles and Mohr circle at failure (tangency checked over all planes), and Anderson's regimes:
  - normal ≈ 60°, thrust ≈ 30°, strike-slip vertical at ±β
  - every fault contains σ2 and lies at β from σ1
  - slip sense: normal, reverse, and sinistral/dextral for the strike-slip pair
- M2 trigonometry helpers: polar form, quadrant-correct angles, direction cosines and angles, and the invariance of |v| under axis rotation. M2 specifics: numeric answers match each step's starting vector, the rotation prediction agrees with the rotation equations, the alignment goal works, and the lesson jumps to 3D for direction angles and for turning the axes.
- B7 specifics: the numeric dip answer matches the domain prediction, each step opens in the regime it teaches, and the settings cover all three regimes.
- Numeric-answer parsing and feedback.
- Lesson navigation helpers.

Browser checks are done by stepping through every lesson in Guided and Present (see the build-session protocol in `docs/curriculum/README.md`).

Future tests should add:

- Snapshot tests for preset tensor definitions.
- Accessibility checks for the application shell.
- Browser tests for state selection and controls.
- Visual regression coverage for vector orientation.
- Contract tests for lesson and response-model modules.
