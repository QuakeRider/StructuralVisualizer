# Unit 6 — Folds and folding

**Frame:** NED for fold geometry and orientation (F1–F3, F5–F7). x/y/z for the mechanics of an idealized layer (F4), with the switch back to NED shown.

**Unit purpose:** describe folds as 3D surfaces, measure and classify them with the orientation tools from Unit 1, and explain how they form using strain (Unit 4) and rheology (Unit 5). Folds are where geometry, orientation math, strain, and rheology come together. They are also where the 3D visualizer adds the most, because fold shape is hard to grasp from 2D figures.

**Shared infrastructure first built here:**
- **Parametric fold-surface renderer** (F1): multi-layer 3D surfaces from parametric profiles (sinusoidal, chevron, box, with tunable tightness, symmetry, bluntness, plunge, and axial-plane attitude), with cut planes and a profile-plane view.
- **Surface measurement tools** (F2): sample attitude (strike/dip) and poles at picked points on a surface and send them to the stereonet (O3).
- **Profile-section view** (F3): a section perpendicular to the hinge line, with layer thickness and dip-isogon construction.
- **Fault-fold cross-section** (F6): layered section with an editable fault trajectory, kink construction, and a trishear velocity-field mode.

The layered-block view from B5 is reused for boudinage (F5).

---

## F1 — Fold anatomy

**Prerequisites:** O2, O3. **Used later by:** F2–F7.

**Learning objectives**
- Identify the hinge point, hinge line, axial surface, limbs, inflection points, crest and trough, interlimb angle, wavelength, and amplitude on a 3D fold.
- Distinguish antiform/synform (shape) from anticline/syncline (age relationships), and explain when the terms differ.
- Recognize parasitic folds and S/Z/M asymmetry, and use vergence to locate a larger fold's hinge.

**Math introduced:** the fold profile as a function (for example `z = A sin(2πx/λ)`), with amplitude and wavelength defined on it; the interlimb angle as the angle between the limb tangents (M3 callback); the axial surface as the surface through successive hinge lines of stacked layers.

**Equation–model binding:** the parametric fold with labeled elements that can be toggled on individually. The A and λ sliders are bound to the profile equation. Clicking a layer's hinge highlights the hinge line across layers, and the axial surface is built from them. A stratigraphic-age toggle (layer order) flips anticline ↔ syncline labels while the antiform/synform label stays fixed. A parasitic-fold layer, with the student walking a "virtual traverse" and reading S, Z, and M shapes.

**Step outline**
1. One folded layer: hinge, limbs, and inflection points.
2. Stacked layers: hinge line → axial surface.
3. Amplitude, wavelength, and interlimb angle, bound to the equation.
4. Antiform vs anticline: flip the stratigraphic order. Prediction.
5. Parasitic folds and vergence: walk across a large fold, and infer where the hinge is.
6. *Geology:* 3D outcrop-scale and map-scale fold examples.

**Geological payoff:** The vocabulary and 3D mental model needed for all fold work.

**Misconceptions to target:** the axial surface is always vertical; anticline = antiform always; the hinge is "the top".

**Exact vs illustrative:** the geometry is exact for the defined surfaces.

**Domain / scenes / tests:** new `src/domain/folds.js` with `foldProfile(params)`, `foldSurface(params)`, `hingePoints`, and `interlimbAngle`, with tests. Build the parametric fold renderer.

**Out of scope:** fold mechanics (F4), and superposition (F7).

**Acceptance criteria:** all elements are identifiable and toggleable; the age toggle behaves correctly; parasitic vergence works.

---

## F2 — Fold orientation and stereonets

**Prerequisites:** F1, O3, O4. **Used later by:** F3, F7.

**Learning objectives**
- Measure the hinge-line trend/plunge and axial-surface strike/dip of a fold.
- Classify fold orientation (upright, inclined, recumbent; horizontal, plunging, reclined; vertical) using the hinge plunge and axial-surface dip (a Fleuty-style diagram).
- Find the fold axis from bedding measurements: on a π-diagram the poles to bedding fall on a great circle (the π-girdle), and its pole is the fold axis. Equivalently, it is the cross product of two limb poles (O4 callback). The β-diagram is shown as the equivalent intersection construction.
- Explain what cylindrical means, and how the π-girdle tests it.

**Math introduced:** fold axis `a = n₁ × n₂` (from two limb poles); for many poles, the best-fit plane to the poles (shown as a fitted girdle, with the method described in words, eigen-based, as an M4 callback kept optional). Orientation classification thresholds.

**Equation–model binding:** the fold surface with a "measuring stick": click points to record the attitude (strike/dip plus a pole arrow). Each measurement appears on the side stereonet as a pole. The π-girdle and its pole (the fold axis) are drawn in 3D and on the net, both linked. Hinge and axial-surface controls rotate the fold, and the classification point on the orientation diagram moves.

**Step outline**
1. Measure the hinge line and axial surface directly (O1, O2).
2. Classify the fold orientation. Rotate the fold and watch the classification change. Prompts.
3. Measure bedding at several points and plot their poles.
4. The poles lie on a great circle: the π-girdle. Prediction: where is its pole?
5. Fold axis = π-pole = n₁ × n₂ for two limbs.
6. Non-cylindrical folds: the poles scatter off the girdle.
7. *Geology:* field-style exercise; determine a plunging fold's axis from outcrop measurements.

**Geological payoff:** The standard field method for determining fold axes, and a direct application of Unit 0's cross product and Unit 1's stereonet.

**Misconceptions to target:** the fold axis is the axial plane; the π-girdle is the fold's profile.

**Exact vs illustrative:** exact; the multi-point fit is a least-squares estimate, and this is stated.

**Domain / scenes / tests:** `foldAxisFromPoles(poles)` (the smallest-eigenvalue eigenvector of the orientation matrix), `classifyFoldOrientation(hinge, axialPlane)` in `folds.js`, and surface-sampling helpers, with tests.

**Out of scope:** contouring and statistical confidence (Lab mode).

**Acceptance criteria:** the measurements → stereonet → axis loop works; the axis agrees with the parameters that generated the fold; the classification is correct at the boundary cases.

---

## F3 — Fold shape and classification

**Prerequisites:** F2. **Used later by:** F4, F6.

**Learning objectives**
- Describe fold shape: tightness (from the interlimb angle), symmetry, bluntness (rounded vs angular hinges, including **chevron** and **kink** folds with straight limbs and sharp hinges), and cylindrical vs non-cylindrical.
- Construct dip isogons on a fold profile, and classify layers by Ramsay class (1A, 1B, 1C, 2, 3).
- Relate parallel (1B) and similar (2) folds to layer-thickness patterns.

**Math introduced:** tightness classes by interlimb angle; the dip isogon (a line joining points of equal dip on the upper and lower layer boundaries); orthogonal thickness `t` and axial-trace-parallel thickness `T`, with normalized `t′ = t_α / t₀` and `T′ = T_α / T₀` vs limb dip α. Class boundaries: parallel (1B) `t′ = 1`; similar (2) `T′ = 1` (`t′ = cos α`). Chevron and kink profiles are piecewise-linear, so their isogons converge at the hinge.

**Equation–model binding:** the profile-section view (a plane ⊥ hinge line, with its orientation from F2). Multiple layers with tunable thickness variation, and a profile-shape selector (sinusoidal / box / chevron / kink). The student drags a dip value, and the isogon is drawn between the matching tangent points. A `t′`–α plot builds as the isogons are added. Class regions are shaded on the plot.

**Step outline**
1. Tightness, symmetry, bluntness. Rotate through the parameter space, including chevron and kink shapes. Prompts.
2. Take the profile section ⊥ hinge line (why this plane: O4/F2 callback).
3. Construct isogons.
4. Plot thickness vs dip; read the class.
5. Parallel vs similar: the same outer shape, different thickness behavior.
6. *Geology:* competent layers (≈1B) vs incompetent layers (≈3) in the same fold, and chevron folds in thin-bedded turbidites (a preview of F4).

**Geological payoff:** Fold shape classes record layer competence and mechanism, which leads directly into F4.

**Misconceptions to target:** folds keep the layer thickness constant; any cross-section gives the true shape; all folds are rounded.

**Exact vs illustrative:** exact for the generated profiles.

**Domain / scenes / tests:** `dipIsogons(profileTop, profileBottom, dips)`, `thicknessVsDip`, and `ramsayClass` in `folds.js`, plus chevron and kink profiles in `foldProfile`, with tests using analytic parallel and similar folds.

**Out of scope:** fold shape from Fourier analysis (optional aside).

**Acceptance criteria:** analytic parallel and similar folds classify correctly; chevron and kink profiles render and classify; the isogon construction is interactive.

---

## F4 — Folding mechanisms

**Prerequisites:** F3, D4–D7, R3, R4. **Used later by:** F5, F6, F7.

**Learning objectives**
- Distinguish buckling (layer-parallel shortening of a competent layer), bending (load across the layer), and passive folding (layers as markers, for example shear folds).
- Explain buckling with viscosity contrast. Use the dominant-wavelength relation `λ_d ∝ h (η_L/η_M)^(1/3)` qualitatively and quantitatively. Explain why thin layers buckle into shorter wavelengths and why thick, weakly contrasting layers thicken before they buckle.
- Describe flexural slip, flexural flow, and orthogonal flexure (tangential longitudinal strain: outer-arc extension, inner-arc shortening, neutral surface), linking fold shape to the strain ellipse.
- Describe **kinking and chevron folding** in well-layered, anisotropic sequences: straight limbs, sharp hinges, and kink bands, with slip concentrated between layers.
- Relate the mechanisms to fold classes (F3). Explain that shear (passive) folds lengthen layers rather than shortening them.

**Math introduced:** Biot–Ramberg dominant wavelength `λ_d = 2π h (η_L / 6η_M)^(1/3)`. Strain in a buckled layer (outer-arc stretch > 1, inner-arc stretch < 1), with strain ellipses plotted on the profile (D4). Flexural slip: the bed-parallel shear γ increases with limb dip. Kink-band geometry: the kink-band boundary bisects the angle between the rotated and unrotated layering when layer thickness is preserved.

**Equation–model binding:** an idealized layer in a matrix, with sliders for the thickness h and the viscosity ratio `η_L/η_M` bound to the λ_d equation. An illustrative growth animation shows the selected wavelength amplifying. Strain ellipses sampled across the folded layer (outer arc and inner arc), with the neutral surface shown. The flexural-slip graphic has bed-parallel slip arrows whose magnitude grows with dip. A multilayer stack toggles into a kink-band/chevron mode, with the kink-band boundary and the bisector relation shown. Toggles compare buckling, bending, passive folding, and kinking.

**Step outline**
1. Ways to make a fold: buckling, bending, and passive (shear) folding. Predict each shape.
2. Buckling: a competent layer shortened parallel to itself. Viscosity contrast selects a wavelength. Vary h and η ratio (a numeric prompt).
3. Low contrast → no buckle, only thickening (D5 pure-shear callback).
4. Tangential longitudinal strain: strain ellipses around the hinge; outer arc vs inner arc. Prediction: where do tension fractures form?
5. Flexural slip and flow: slip between beds, and slickenlines on bedding.
6. Kinking and chevron folds: in a thinly layered stack, straight limbs and sharp hinges form. Show the kink-band geometry.
7. Mechanisms ↔ Ramsay classes.
8. *Geology:* ptygmatic folds in veins; outer-arc extension veins; bedding-parallel slickenlines; chevron-folded turbidites.

**Geological payoff:** Explains fold size, shape, and associated minor structures from layer properties. This ties strain (Unit 4) and rheology (Unit 5) together.

**Misconceptions to target:** all folds form by buckling; thicker layers make shorter wavelengths; chevron folds are just "tight" rounded folds.

**Exact vs illustrative:** the λ_d formula, tangential-strain geometry, and kink-band bisector relation are exact within their idealizations (a single viscous layer, small amplitude; constant layer thickness in kink bands). **The growth animations are illustrative**, and the interface says so.

**Domain / scenes / tests:** `dominantWavelength(h, ηL, ηM)`, `tangentialStrain(profile, layerThickness)`, `flexuralSlipShear(dip)`, and `kinkBand(rotation, layerThickness)` in `folds.js`, with tests.

**Out of scope:** numerical buckling simulation (FEM), multilayer buckling theory beyond a mention, and folds in shear zones or sheath folds (parked with shear zones).

**Acceptance criteria:** the λ_d equation is bound to its sliders; the strain ellipses show outer-arc extension and inner-arc shortening; the kink-band geometry is correct; the mechanisms are compared.

---

## F5 — Boudinage

**Prerequisites:** F4, D4, D7, R4, B5. **Used later by:** F7, (parked) shear zones and fabrics.

**Learning objectives**
- Explain boudinage as the stretching counterpart of buckling: competent layers break up or neck when stretched along the layer, while incompetent layers flow around them.
- Distinguish **pinch-and-swell** (necking at small competence contrast) from separated **boudins** (larger contrast, or brittle failure), and relate boudin shape to competence contrast and to brittle vs ductile behavior (B5 and R4 callbacks).
- Use the strain ellipse and ellipsoid to predict where boudins form. Layers in the stretching field boudinage; layers in the shortening field fold; layers that rotate from shortening into stretching do both (D7 callback). **Chocolate-tablet** boudinage records stretching in two directions (the oblate field of the Flinn diagram, D4 callback).
- Estimate the layer-parallel stretch from a boudin train.
- Recognize asymmetric (rotated) boudins as a sense-of-shear indicator in non-coaxial deformation (a preview; kinematic indicators are parked).

**Math introduced:** stretch of a boudinaged layer `S = (Σ lᵢ + Σ gᵢ) / Σ lᵢ` (boudin lengths lᵢ, gap widths gᵢ); the layer's orientation relative to the strain-ellipse sectors (lengthening vs shortening fields, D4); for 3D, the two stretching directions in the ellipsoid ↔ chocolate-tablet geometry.

**Equation–model binding:** the layered-block view (from B5) with a competent layer in a weaker matrix. A competence-contrast slider morphs the response from pinch-and-swell to separated boudins. The strain ellipse is overlaid in the profile, and a set of variously oriented competent layers shows folding in the shortening field and boudinage in the stretching field. A 3D ellipsoid control produces chocolate-tablet boudinage for oblate strain. A boudin-train measuring tool computes S.

**Step outline**
1. Stretch a competent layer in a weak matrix: pinch-and-swell or boudins? Prediction as the contrast changes.
2. Brittle boudins from extension fractures (B5 callback) vs ductile necking (R4 callback).
3. Measure a boudin train and compute the stretch S. Numeric prompt.
4. Many layers, one strain ellipse: which fold, which boudinage, and which do both? (D4, D7 callbacks.)
5. 3D: stretching in two directions → chocolate-tablet boudins (Flinn callback).
6. Asymmetric boudins in simple shear: rotation and sense of shear (preview).
7. *Geology:* boudinaged quartz veins and amphibolite layers in gneiss, and pinch-and-swell in marble.

**Geological payoff:** Boudins are among the most useful strain and kinematic markers in deformed rocks. Paired with folds, they let students read the strain ellipse directly in outcrop.

**Misconceptions to target:** boudins are "broken folds"; boudinage needs brittle behavior; one layer orientation tells you the whole strain.

**Exact vs illustrative:** the stretch estimate and the strain-sector predictions are exact. The necking and boudin-formation animations are **illustrative**, driven by a rule-based competence model, and labeled.

**Domain / scenes / tests:** `boudinStretch(lengths, gaps)`, `layerFieldInEllipse(F, layerNormal)` (lengthening vs shortening and history), and `boudinStyle(competenceContrast, brittleFlag)` (rule-based, documented) in `folds.js`, with tests.

**Out of scope:** numerical necking mechanics, foliation boudinage (a mention only), and lithospheric boudinage (parked with tectonics).

**Acceptance criteria:** the stretch computation is correct; layers in different ellipse sectors fold or boudinage as predicted; chocolate-tablet boudinage appears for oblate strain; the illustrative animations are labeled.

---

## F6 — Fault-related folds

**Prerequisites:** F4, B8, B9, D6, O4. **Used later by:** F7, (parked) contractional and extensional tectonics, and balanced sections.

**Learning objectives**
- Explain how folds form in response to faulting: **drag folds** next to a fault (B9 callback), **fault-bend folds** above a ramp in a flat–ramp–flat fault, **fault-propagation folds** ahead of a propagating fault tip, and **forced folds/monoclines** draped over a basement fault.
- Construct a fault-bend fold with the kink method: bed length and thickness are preserved, and the hanging wall bends as it moves over the ramp. Relate the fold's limb dips to the ramp angle.
- Describe **trishear** as a velocity field (D6 callback) in a triangular zone ahead of the fault tip, and explain why it produces tightening, thickening, and thinning of the forelimb.
- Use fold geometry and drag to infer fault displacement sense and whether a fault is still buried.

**Math introduced:** kink-method geometry for fault-bend folds, with axial surfaces bisecting the bends in the fault and constant bed length (shown as a construction, with the simplest ramp-angle cases computed). Trishear velocity field: hanging-wall velocity v₀ above the zone, zero in the footwall, and a linear variation of velocity with angle across the triangular zone. It is shown as v = L-type arrows (D6) and stepped in time. A drag profile is the marker offset as a function of distance from the fault (B9 displacement gradient).

**Equation–model binding:** a layered cross-section block (extruded to 3D, NED) with an editable fault trajectory (flat–ramp–flat, with the ramp angle and slip as sliders). Beds are transported along the fault, and fold axial surfaces appear at the fault bends. A trishear mode shows the triangular zone, velocity arrows, and the evolving forelimb, with a time scrubber. A forced-fold mode drapes layers over a basement block offset. Bed-length and thickness readouts check what is conserved.

**Step outline**
1. Drag folds: beds bend near a fault as displacement dies out (B9 callback). Prompt: read the fault's sense from the drag.
2. Fault-bend folds: move a hanging wall over a ramp. Prediction: where do the fold hinges form?
3. The kink construction: conserved bed length, and axial surfaces bisecting the bends. Vary the ramp angle.
4. Fault-propagation folds: the fault tip grows as the fold develops ahead of it.
5. Trishear: the triangular velocity field, and why the forelimb steepens and thins (D6 callback).
6. Forced folds and monoclines over basement faults.
7. *Geology:* anticlines in fold-thrust belts, monoclines on the Colorado Plateau (context), and why fault-related folds are major petroleum traps.

**Geological payoff:** Links Unit 3 faults to Unit 6 folds, and explains the most common fold type in the upper crust and a key reservoir geometry.

**Misconceptions to target:** folds and faults are unrelated structures; a fold always means buckling; fault-bend folds need rock to thicken.

**Exact vs illustrative:** the kink construction and the trishear velocity-field kinematics are exact within their stated models. The forced-fold drape is illustrative, and the lesson says so.

**Domain / scenes / tests:** `faultBendFold(rampAngle, slip, layers)` (kink-method geometry for simple cases), `trishearStep(state, params, dt)`, and `dragProfile(displacementField, distance)` in a new `src/domain/faultFolds.js` (or `folds.js`), with tests that conserve bed length in fault-bend folds.

**Out of scope:** Suppe's full fault-bend equations for all geometries (simplest cases only), detachment folds (a mention), cross-section balancing and restoration (parked, Lab mode), and thrust systems and duplexes (parked with tectonics).

**Acceptance criteria:** fault-bend folds conserve bed length and place hinges at the fault bends; trishear produces the expected forelimb geometry; drag folds show the correct sense; each mode's exact vs illustrative status is labeled.

---

## F7 — Superposed folding

**Prerequisites:** F4, F2, D7 (F5 and F6 recommended). **Used later by:** (parked) fabrics and multiple deformation histories.

**Learning objectives**
- Explain how a second folding event refolds an earlier fold.
- Recognize Ramsay's interference types (1: dome-and-basin; 2: crescent/mushroom; 3: refolded/hook), and relate them to the relative orientations of the two fold axes and axial planes.
- Read interference patterns on horizontal and vertical cut surfaces.

**Math introduced:** superposition as the composition of two displacement fields (a D7 callback, applied to surfaces). The relative orientation of the F1 and F2 hinge lines and axial surfaces (angles via O4). The interference type is determined by these angles.

**Equation–model binding:** a first-generation fold surface, then a second-generation fold applied with its own hinge and axial-plane orientation controls. The resulting 3D surface is shown with a movable cut plane (horizontal and vertical) showing the 2D outcrop pattern. A stereonet shows both generations' axes and axial planes. A type-selection diagram marks the current configuration.

**Step outline**
1. Fold once (F1 parameters).
2. Fold again with a different orientation. Prediction: what pattern appears on a flat erosion surface?
3. Type 1: dome and basin. Type 2: mushroom. Type 3: hook.
4. Vary the angles between generations; watch the type change.
5. Cut the surface at different levels: the same 3D form gives different map patterns.
6. *Geology:* interpreting interference patterns in maps of polydeformed terrains.

**Geological payoff:** Reading deformation histories in complex terrains. This is the course capstone: it uses orientation, strain composition, and fold geometry.

**Misconceptions to target:** the map pattern equals the 3D shape; the order of folding can't be read.

**Exact vs illustrative:** exact for the defined displacement fields.

**Domain / scenes / tests:** `superposeFolds(fold1, fold2)` and `interferenceType(angles)` in `folds.js`, with tests. Cut-plane contouring on the fold renderer.

**Out of scope:** more than two generations (one optional example), and fabric overprinting (parked).

**Acceptance criteria:** all three types are reproducible; the cut plane shows the correct 2D patterns; the stereonet reflects both generations.
