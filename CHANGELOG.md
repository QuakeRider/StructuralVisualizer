# Changelog

All notable user-visible changes are recorded here.

## Unreleased

### Changed

- Curriculum plan: a new **Unit 3B Faults** (`docs/curriculum/unit-3b-faults.md`), written after a review of Fossen (2016) chapters 9–10 and PSGT chapter 5 with the instructor. B7–B9 move into it and keep their IDs. Nine new lesson specs:
  - B10 fault shapes, arrays, and terminations
  - B11 fault zones and fault rocks (replaces B9's first step, with Sibson's classification, a power-law comminution model, pseudotachylyte, fault rocks with depth, porous vs crystalline hosts, and Caine et al.'s architecture index)
  - B12 kinematic indicators
  - B13 faults and earthquakes (rate-and-state friction, moment magnitude, Coulomb stress change)
  - B14 fault mechanics puzzles
  - B15 fault populations and paleostress (grid-search inversion)
  - B16 faults, fluids, and the subsurface
  - B17 and B18 fault systems, taught after Unit 6
- Binding decision 1 gains one narrow exception: force balance along a frictional sliding surface (spring-slider, thrust sheets).
- Paleostress inversion, fault seal, and map-scale fault systems moved from parked to core. Stress measurement, least-squares inversion, reservoir datasets, and plate-scale tectonics stay parked. Integrating instructor photographs is noted as a future item, to be discussed.

## 0.12.0 — 2026-09-26

### Added

- Lesson B9, Fault anatomy and growth, built ahead of the curriculum order for classroom use (eight steps):
  1. Inside a fault zone: the fault core, the principal slip surface, and the damage zone in a 40 m outcrop, with schematic drawings of fault breccia, gouge, cataclasite, and mylonite (not brittle), and how a fault zone guides groundwater.
  2. Displacement dies out at the tip line: a blind normal fault inside a 1 km block with three marker beds. A section cuts the block; its offset follows D(u) = Dmax √(1 − (u/a)²), with a goal to find where the offset is half of Dmax.
  3. The fault surface as a map of displacement: the fault colored by D, with contours, the tip line, and the elliptical radius r. A profile line slices it, and a switch compares the elliptical model with a linear taper (numeric check).
  4. Displacement–length scaling D = c Lⁿ on log–log axes, with synthetic data, sliders for L, c, and n, and a block that changes only its scale bar when n = 1 (numeric check).
  5. Growth by linkage: two segments grow from underlap to overlap, and a relay ramp tilts between them; the plot adds their profiles.
  6. Breaching the ramp: the segments hard-link into one fault with a bend, and the linked fault, under-displaced for its new length, catches up with the profile of one fault.
  7. Normal and reverse drag as displacement gradients, with a drag factor k, a cross-section, and a plot of each wall's movement against distance from the fault.
  8. Reading segmented faults and relay ramps on maps (final).
- A fault-growth laboratory (`FaultGrowthScene.js`): marker beds moved by the displacement field of one or more normal faults, so their offset shrinks to zero at the tip line, they bend near the fault, and they tilt across a relay ramp. Fault surfaces are colored by displacement (a colorblind-safe scale) with contour loops and the tip line. It has a section that cuts the block, a profile line, the fault core and damage zone with fractures, a relay-ramp outline, depth shading and structure contours on the bed, and 3D, map, section, and fault-face views.
- A general x–y plot (`XYPlot.js`) for displacement profiles, the D–L log–log plot, relay profiles, and the drag profile, and a fault-rock panel (`FaultRockPanel.js`).
- New tested domain module `faultGrowth.js`: elliptical, linear, and bell-shaped displacement on a tip line, contours and profiles, D = c Lⁿ, the 3D displacement of each wall, the drag model, and the relay system (segments, breach, linked slip).

## 0.11.0 — 2026-09-26

### Added

- Lesson B8, Fault geometry, slip, and kinematic axes, built ahead of the curriculum order for classroom use (eleven steps):
  1. Hanging wall and footwall, with the fault's pole 𝐧 pointing into the footwall (as in B6).
  2. The slip vector 𝐬 split into its strike-slip and dip-slip parts, s cos λ and s sin λ, with the rake λ drawn in the fault plane and a numeric check.
  3. Naming faults from the slip: normal, reverse, thrust, dextral, sinistral, and oblique, with a goal to make a thrust.
  4. Slip vs separation: a dike offset by the fault on an eroded map and on cross-sections. Pure normal slip shows 300 m of apparent sinistral separation, and a goal asks for a slip that leaves no separation at all (𝐦·𝐬 = 0).
  5. Missing and repeated beds in a well: a well log beside the normal sequence, with the throw as the stratigraphic separation.
  6. Slickenlines on the exposed footwall (schematic steps give the sense of slip), the slickenline's rake and plunge (sin p = sin r sin δ, numeric check), and the slip on a stereonet.
  7. The Wallace–Bott hypothesis: the slip follows the shear part of 𝐭 = 𝛔𝐧, set by the stress regime, the stress ratio φ, and the fault's orientation.
  8. Kinematic axes P ∝ 𝐧 + 𝐬̂, T ∝ 𝐧 − 𝐬̂, and B = 𝐧 × 𝐬̂, built live in 3D and plotted on the stereonet.
  9. Fault-plane solutions: beach balls for normal, thrust, strike-slip, and oblique faults, the auxiliary plane, and what the shading means.
  10. P and T are not σ1 and σ3: tilting σ1 leaves the slip and the beach ball unchanged until σ1 crosses a nodal plane.
  11. Predicting the rake from the stress with λ = atan2(τup, τstrike), a numeric check that catches the quadrant mistake.
- A fault laboratory (`FaultScene.js`): an NED Earth block split by a fault of any strike and dip, with the hanging wall displaced along the slip vector ("moved"), or both walls kept in the original block and eroded flat to show a map and cross-sections ("cut"). It draws the slip vector with its component box and rake arc, a dike with its traces and the separation arrows, a well, slickenlines, the principal stresses, the traction and its shear part, and the P, T, and B axes with their construction from 𝐧 and 𝐬̂. Beds and the ground grid travel with each block. Camera buttons give 3D, map, and section views.
- The stereonet gained fault-kinematics layers: the slip vector (with an arrow for the hanging wall's motion), the auxiliary plane, the P, T, and B axes, the beach ball (exact, as an even–odd fill of the two nodal half-nets), and a key.
- A well-log plot (`WellLog.js`): the beds a vertical well passes through beside the undisturbed sequence, with the fault crossing and the missing or repeated interval marked.
- New tested domain module `faults.js`: the fault frame, slip from rake and rake from slip, strike-slip and dip-slip parts, naming, Wallace–Bott (`resolvedShearDirection`), kinematic axes, the auxiliary plane, first-motion quadrants, tilting the stress axes, separation of a planar marker on any view surface, and well logs. `orientation.js` gained `rakeVector` and `lineToRake` (the O4 conventions).

### Changed

- The Earth-block helpers (frame change, block size, plane–box sections, bed and ground textures) moved from `AndersonScene.js` to `earthBlock.js`, shared by B6, B7, and B8.
- The stereonet's title and caption are set per lesson, and an inclined principal axis now plots once (at its lower-hemisphere end) instead of at both ends.

## 0.10.0 — 2026-09-25

### Added

- Lesson B6, Friction and reactivation of existing planes, built ahead of the curriculum order for classroom use (eight steps):
  1. Existing planes are weaker than intact rock: no cohesion, so the friction line starts at the origin.
  2. Byerlee's law (τ = 0.85σn below 200 MPa, 50 MPa + 0.6σn above), with a numeric check.
  3. Every plane is a point on the 3D Mohr diagram: the traction 𝐭 = 𝛔𝐧 on an old plane split into σn and τ, with strike and dip sliders. Planes that contain σ2 ride the big circle.
  4. Slip tendency Ts = τ/σn as the slope of a line from the origin, a numeric check, and a goal to find a plane that slips.
  5. Reactivate the old plane or break a new fault: raising σ1 stops at whichever happens first. It shows the σ1 needed for each, and planes too misoriented to ever slip ("locked").
  6. A stereonet map of slip tendency for every plane orientation, with the slipping planes hatched, pole picking on the net, a regime switch, and dilation tendency as an aside.
  7. Ranking three mapped faults by slip tendency on the stereonet and the Mohr diagram.
  8. Pore-fluid pressure: effective normal stress σn′ = σn − Pf shifts the circles left and wakes a stable fault, the mechanism behind injection-induced earthquakes.
- The first stereonet (`Stereonet.js`): lower-hemisphere equal-area, with a slip-tendency color map (viridis scale) and hatching where planes slip, principal axes marked by shape, the current plane's great circle and pole, lettered poles for mapped faults, and click or drag to pick a pole. O3 will extend it.
- A 3D Mohr diagram for friction (`FrictionMohrPlot.js`): the three circles and the region between them, Byerlee's line, the intact Coulomb line, the plane's point with its σn and τ, the slip-tendency line, the tangent point of a new fault, and the shift by pore pressure.
- New tested domain modules and functions: `tensor.js` (σ𝐧 and its normal and shear parts), `stereonet.js` (equal-area projection and its inverse, great circles, planes from poles), and in `failure.js` Byerlee's law, slip and dilation tendency, the three Mohr circles, the σ1 that reactivates a plane (closed form, both Byerlee segments), the σ1 that breaks intact rock with pore pressure, and a slip-tendency grid over the net.

### Changed

- The Earth-block scene (`AndersonScene.js`) now also serves B6. Given an existing plane, it splits the block along that plane and draws the plane's pole and the traction on it with its normal and shear parts; the Coulomb pair then stands for a new fault.
- Shared SVG plot helpers (subscripted symbols, tick spacing, hover and highlight) moved to `plotKit.js`; the B7 Mohr diagram uses them.
- Present mode now fits the window on projector-sized screens for every lesson and for the stress laboratory: the scene takes the height left under the lesson header, so nothing (such as B6's stacked Mohr diagram and stereonet) falls below the fold, and the lesson panel scrolls on its own.

## 0.9.0 — 2026-09-25

### Added

- Lesson M2, Trigonometry of projection, fully built (eight steps):
  1. The unit circle: a unit vector is (cos α, sin α).
  2. Components from a length and an angle, with feedback on a radian-mode calculator.
  3. From components back to the angle, and why tan⁻¹ needs a quadrant check (atan2).
  4. Direction angles and direction cosines in 3D, with cos²α + cos²β + cos²γ = 1 checked live.
  5. Turning the axes while the vector stays still, with the rotation equations substituted live.
  6. The same arrow in every frame: the length is unchanged, and a goal asks students to find the frame where v′y = 0.
  7. A preview of the double-angle forms of cos²θ and sin θ cos θ, with a plot.
  8. Where this shows up in geology: how steeply a line plunges (O1), and a plane tilted inside a rock (S5).
- The vector laboratory gained:
  - Length-and-angle dragging, where the angle snaps to 5°.
  - Angle arcs: α in the plane, and α, β, γ to each axis in 3D.
  - A rotatable x′, y′ axis pair (dashed) with its θ arc and the primed components.
  - An elevation angle ε, a plane trace, and a 2D close-up view.
- A curve plot (`CurvePlot.js`) beside the scene. It shows cos²θ and sin θ cos θ with a marker at the current θ, and its curves highlight with their equation symbols.
- New tested vector helpers: `fromPolar`, `polarAngle` (quadrant-aware), `directionCosines`, `directionAngles`, and `rotate2D`. The MathML builder gained `subsup` and `primed` (v′ₓ).

### Changed

- Arrows are drawn thinner in close-up views, so they keep the same weight on screen. This also affects M1's unit-vector step.
- Scene labels hide their values while a prediction is open, as the equations already did.
- Choosing an example in a "where this shows up" step can switch between 2D and 3D. The legend and hints follow the switch.
- The scene-and-plot split layout is shared by B7 (Mohr diagram) and M2 (curve plot).

## 0.8.0 — 2026-09-25

### Added

- Lesson B7, Anderson's theory of faulting, built ahead of the curriculum order for classroom use (nine steps). It covers:
  - why a free surface makes one principal stress vertical
  - the three regimes: σ1 vertical gives normal faults, σ2 vertical strike-slip faults, and σ3 vertical thrusts
  - the Coulomb angle β = 45° − φ/2 and the dips it predicts (about 60° for normal faults and 30° for thrusts at μ = 0.6)
  - dextral and sinistral conjugate strike-slip faults
  - how friction changes the dips, the limits of the theory, inferring stress from a mapped fault pair, and tectonic settings
- An Earth-block scene in the geological frame (north, east, down) (`AndersonScene.js`). It has a compass labeled N (x), E (y), D (z) and a layered block. It shows:
  - σ1, σ2, σ3 as inward arrows that differ in thickness and line pattern
  - the conjugate fault pair cut through the block
  - β and dip arcs
  - slip arrows, with a hanging wall that slides along the fault in the direction of the resolved shear stress
- A Mohr diagram (`MohrPlot.js`), drawn as SVG beside the block. It shows the σ1–σ3 circle just touching the Coulomb line τ = C + μσn, the fault and conjugate points at ±2θ, and the friction angle φ. Its parts highlight together with the equations and the block.
- New tested domain modules: `orientation.js` (trend and plunge, strike and dip, poles and normals in north, east, down), `failure.js` (friction angle, the Coulomb failure angles, and the Mohr circle at failure), and `anderson.js` (regime axes, the conjugate fault planes, the stress tensor from its principal axes, and the slip direction and sense on a plane).

### Changed

- Arrows and labels shared by the scenes moved to `sceneKit.js`. Labels gained an upright numeric subscript style (σ₁).
- The symbol key under the equations lines up its descriptions even when one symbol is a whole equation.
- In Present mode, equation text scales from 22 to 26 px with the window, so long lines fit at projector sizes such as 1280×720.

### Fixed

- M1: the 3D magnitude now puts its result on a separate line, so the longest substitution (the fault example in step 9) no longer overflows the panel.

## 0.7.0 — 2026-09-24

### Added

- Lesson M1, Vectors and components, fully built (nine steps). It starts in 2D and jumps to 3D, then covers magnitude from components with one right triangle in 2D and two stacked ones in 3D, negative components, unit vectors, vector addition done tip to tail and by components, scaling, and three geological examples of vectors.
- A new vector laboratory scene (`VectorScene.js`). It shows x, y, z axes with z up, a draggable vector with a component box, labeled component arrows, and the stacked right triangles of the 3D magnitude. It also draws unit and scaled vectors, tip-to-tail addition with component stacks on each axis, and sketched geological examples. A plain drag moves the tip across the floor, and Shift-drag moves it up or down. The camera animates between the 2D and 3D views.
- Arrows and their equation symbols use line patterns (solid, dashed, dotted) as well as color. Scene labels keep a constant size on screen.
- Numeric-answer prompts that give targeted feedback on common mistakes, such as adding the components instead of using Pythagoras.
- Construction goals checked live against the scene, for example "point the vector toward −x, +y, −z".
- Live values can stay hidden until the prediction is answered.
- Live substitution of each component in equations, for example `√(3² + (−4)²)`, with each number highlighting its component in the scene.
- A step navigator in the header above the scene, in Guided and Present. Numbered step buttons open any step directly, and hovering or focusing one previews its name. In Present mode, 1–9 open a step and Home / End go to the first / last step.
- A lesson badge in the top left of the scene header. It shows the unit letter stacked over lesson.step (for example M over 1.1), boxed in its unit's color.

- Formal math typesetting. Equations are native MathML set in a math font (STIX Two Math or Cambria Math), with no library.
  - Vectors are bold (𝐯), and scalars and components are italic (v_x).
  - Unit vectors carry hats.
  - Magnitudes, square roots, and fractions are typeset properly, and a sum can be written as a column vector.
  - Units are upright.
  - Symbols in the lesson text, the symbol key, the scene legend, and the in-scene labels use the same notation.
  - Built with `src/lessons/mathml.js`, which has tests.

### Changed (layout)

- The lesson picker moved from the lesson panel to the scene header, next to the step navigator.
- "Lesson · Step n of N" now sits above the step title in the scene header. The lesson panel no longer has its own header (unit line, lesson line, and progress bar).
- The "Interactive laboratory" label above the scene title and the step badge in the lesson card were removed.
- A `format.js` number formatter (true minus signs, bracketed negative squares) and new vector helpers, both with tests.

### Changed

- M1 no longer uses the force laboratory; the force laboratory is kept for the stress lessons.
- Lesson steps that do not show the stress scene no longer need stress-preset fields.

## 0.6.0 — 2026-09-24

### Added

- Curriculum plan in `docs/curriculum/`: 48 lessons in 7 units with a build spec for each.
- Lesson registry and catalog for the full curriculum, with a unit-grouped lesson picker; planned lessons are listed but disabled.
- Seed lessons M1 (vectors), S2 (force vs traction), S3 (normal and shear traction), S7 (stress tensor), and S10 (stress states), built from the reusable parts of the 0.5 module.
- Equation–model binding panel: equation symbols highlight their scene objects and vice versa, with live values and a symbol key.
- Present mode for lessons (entered from Guided), with arrow and PageUp/PageDown step navigation.
- `vector.js` domain helpers with tests; registry tests, including a guard against statics content.

### Removed

- The engineering-statics content added in 0.5.0: application-point dragging, `r × F` moments, free-body motion, fixed support and reactions, section cut, and axial/shear/bending/torsion resultants and deformation (`loadResponse.js`). These topics are outside the structural-geology curriculum.

### Changed

- The single 14-step guided lesson is replaced by per-lesson files; step numbers now read as lesson.step (for example, S2.1).

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
