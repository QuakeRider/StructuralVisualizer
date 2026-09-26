# Unit 3 — Brittle deformation

**Frame:** NED. Stress is compression positive, and Mohr axes follow the README conventions.

**Unit purpose:** apply the stress tools from Unit 2 to how rocks break and slip. The Mohr diagram becomes the place where **stress (the circle) meets strength (the envelope).** The 3D scene shows the resulting fractures and faults in the orientations the math predicts. Coming right after stress keeps the Mohr and principal-axis ideas fresh. The unit moves from failure criteria (B1–B4) to the structures they produce: joints and veins (B5) and reactivated planes (B6). Faults themselves, from Anderson's theory (B7) onward, are in [Unit 3B](unit-3b-faults.md), which shares the B prefix; B7, B8, and B9 moved there on 2026-09-26.

**Shared infrastructure first built here:**
- **Failure envelopes on the Mohr plot** (B2, B3): tensile cutoff, Griffith parabola, Coulomb line, a composite envelope, and the Byerlee line. Circle–envelope contact detection, and the fracture style at the contact point.
- **Fracture/fault plane glyphs in the stressed cube** (B1, B3): planes that open (Mode I), slide (Mode II/III), or compact (deformation bands), with displacement arrows.
- **Layered-block view** (B5): a stack of layers with different stiffness, used for joint spacing and mechanical stratigraphy. F5 (boudinage) reuses it.
- **Rose diagram** (B5): orientation frequency of strikes or trends.
- **Stereonet layers for stress and planes** (B6): principal axes and planes colored by slip tendency (extends the O3 renderer). Unit 3B adds the kinematic layers (B8) and the paleostress layers (B15).

---

## B1 — Brittle processes, fracture modes, and deformation bands

**Prerequisites:** S8, S10. **Used later by:** B2–B9, B11 (faults in porous rock).

**Learning objectives**
- Distinguish tensile cracking, shear rupture, frictional sliding, and cataclastic (granular) flow.
- Describe Mode I (opening), Mode II (sliding perpendicular to the crack edge), and Mode III (tearing parallel to it) by their displacement vectors relative to the fracture plane. Also recognize closing/compaction as the opposite of opening.
- Relate the modes to principal-stress orientation qualitatively (Mode I ⊥ σ3; shear fractures inclined to σ1).
- Explain how **deformation bands** in highly porous rocks (sandstones) differ from fractures. They are thicker, have small offsets, and keep or gain cohesion. Classify them kinematically as dilation, shear, or compaction bands, and state their opposite effect on permeability (fractures increase permeability; deformation bands generally reduce it).

**Math introduced:** displacement across a fracture or band as a vector, split into an opening/closing (normal) part and a sliding (in-plane) part (M3/S3 callback). A negative normal part means compaction. The vocabulary is kept brief.

**Equation–model binding:** a crack glyph in the stressed cube, with its displacement-discontinuity vector split into normal and in-plane parts using the same patterns as normal and shear traction. A toggle cycles through the modes. A "porous rock" toggle turns the sharp crack into a tabular band, with the same kinematic decomposition, including a compaction case with an inward normal part.

**Step outline**
1. What "brittle" means: localized loss of cohesion, with permanent displacement across a surface.
2. The four processes, each with a short 3D animation and a real-world example (joint, fault, slickensided surface, fault breccia).
3. Modes I, II, and III as displacement-vector decompositions.
4. Prediction: given the σ1 and σ3 directions, where does a Mode I crack open?
5. Porous rocks behave differently: deformation bands. The same vector split gives dilation, shear, and compaction bands. Prompt: which one would block fluid flow?
6. Bridge: *when* does a rock break? That is B2 and B3.

**Geological payoff:** The vocabulary for joints, veins, faults, and deformation bands, including why deformation bands matter for groundwater and petroleum reservoirs.

**Misconceptions to target:** all fractures are faults; a fracture's orientation is random; every brittle structure increases permeability.

**Exact vs illustrative:** the mode kinematics are exact decompositions; crack-growth and band-formation animations are illustrative.

**Domain / scenes / tests:** reuse `splitNormalTangential`; build the crack/band glyph component.

**Out of scope:** fracture mechanics (stress intensity factors), atomistic bonding, deformation-band mechanics (yield caps), and band-network permeability modeling.

**Acceptance criteria:** the three modes and the three deformation-band types are shown with correctly decomposed displacement vectors in a stressed cube.

---

## B2 — Tensile failure

**Prerequisites:** B1, S6, S10. **Used later by:** B3, B4, B5, B8.

**Learning objectives**
- Explain why extension (tensile) fractures open perpendicular to σ3.
- Use tensile strength T₀: tensile failure when `σ3 = −T₀` (compression-positive).
- Explain qualitatively why real rocks are much weaker than intact crystals (Griffith flaws and stress concentration at crack tips), and why larger samples are weaker (more and bigger flaws). Recognize the Griffith envelope shape on the Mohr diagram.

**Math introduced:** the tensile cutoff at `σn = −T₀`. The Griffith envelope in compression-positive form, `τ² = 4T₀(σn + T₀)`, *shown and described*, not derived. Stress concentration shown qualitatively (a flaw-tip amplification factor, labeled illustrative).

**Equation–model binding:** the Mohr plot with the tensile cutoff and Griffith curve, and σ3 pulled into tension by a slider. When the circle touches the envelope at the τ = 0 point, an extension fracture opens perpendicular to σ3 in the 3D block. An elliptical flaw with an illustrative stress-concentration color map.

**Step outline**
1. Pull the rock apart: the Mohr circle moves left into tension.
2. Tensile strength and the cutoff line. Prediction: "Which plane fails first?" (the one ⊥ σ3).
3. The extension fracture appears in 3D perpendicular to σ3.
4. Why rocks are weak: flaws concentrate stress (illustrative). Why big samples are weaker than small ones. The Griffith envelope shape.
5. Numeric prompt: T₀ = 10 MPa and σ3 = −12 MPa → does it fracture?
6. Bridge: *where* in the Earth can σ3 actually become tensile? (B4 fluids, B5 exhumation, and R5's quantitative answer.)

**Geological payoff:** The mechanics behind joints and veins (B5). Extension fractures record the σ3 direction.

**Misconceptions to target:** extension fractures need large differential stress; they form parallel to σ1 "because it's compressing."

**Exact vs illustrative:** the envelopes and cutoff are exact within the stated criteria; the flaw stress concentration is illustrative.

**Domain / scenes / tests:** `griffithEnvelope(T₀, σn)` and `tensileFailure(σ3, T₀)` in `src/domain/failure.js` (it already exists from B7 with `frictionAngle`, `coulombAngles`, `coulombShearStrength`, `sigma1AtFailure`, `mohrCircle`, and `mohrPoint`), with tests. Envelope layers on the Mohr renderer.

**Out of scope:** fracture toughness and linear elastic fracture mechanics. Joint patterns and veins are covered in B5.

**Acceptance criteria:** the circle–cutoff contact triggers the correctly oriented fracture; the Griffith curve plots correctly.

---

## B3 — Coulomb failure and the composite failure envelope

**Prerequisites:** B2, S9, O4. **Used later by:** B4–B9, B12 (Riedel angles), B14, R6.

**Learning objectives**
- State the Coulomb criterion `τ = C + μσn`, and relate μ to the angle of internal friction φ = tan⁻¹ μ.
- Grow a Mohr circle (by raising differential stress) until it touches the envelope, and read off the failure plane.
- Compute the failure plane orientation: its normal is at θ = 45° + φ/2 from σ1. Equivalently, the plane itself is at 45° − φ/2 from σ1 (about 25–30° for typical φ), and it contains σ2. Explain why shear fractures do *not* form on the 45° maximum-shear planes.
- Explain conjugate shear fractures (two planes symmetric about σ1, intersecting along σ2), with their acute bisector along σ1.
- Combine the criteria into a **composite envelope**: Griffith in the tensile field, Coulomb in the compressive field, and a flattening toward a constant-shear-stress (von Mises) cap as ductile conditions are approached (developed in R4/R6). Read the **fracture style** from where the circle touches: extension fracture, hybrid (extensional-shear) fracture, or shear fracture.
- Explain that with a curved (real, experimental) envelope, the failure angle to σ1 decreases as confining stress increases.

**Math introduced:** `τ = C + μσn`; `tan φ = μ`; the tangent point at `2θ = 90° + φ` on the circle. Both planes are shown ± from σ1, and their intersection line is σ2 (O4 cross-product callback). The composite envelope is piecewise, and the local slope at the tangent point sets the local φ and hence θ.

**Equation–model binding:** the Mohr plot with the Coulomb line (C and μ editable; φ drawn as an angle) and the circle grown by a σ1 slider. At contact, the tangent point and the 2θ arc light up. In the 3D cube, the two conjugate planes appear at the matching angle, with σ1/σ2/σ3 axes and their intersection along σ2. A stereonet shows the conjugate pair and the principal axes. An envelope selector (Coulomb / Griffith / composite) and a σ3 slider move the contact point along the composite envelope, and the 3D fracture changes from an extension fracture to a hybrid and then a shear fracture, with its angle to σ1 shown live.

**Step outline**
1. Stress vs strength: the circle is the stress, the line is the strength.
2. Increase σ1 (hold σ3). Prediction: "Where will the circle first touch?"
3. The tangent point → 2θ → the failure plane in 3D (the S6 2θ rule, reused).
4. Why not 45°? Friction tilts the plane toward σ1. Vary μ and watch the angle change.
5. The conjugate plane: symmetry gives a second solution. Both contain σ2.
6. Numeric prompt: C = 20 MPa, μ = 0.6, σ3 = 50 MPa → σ1 at failure, and the plane angle.
7. The composite envelope: slide σ3 from tension to compression and watch the fracture style change (extension → hybrid → shear) and the angle to σ1 go from 0° to about 30°.
8. Real envelopes curve: at high confinement the angle to σ1 shrinks. This is a preview of the ductile cap (R6).
9. *Geology:* conjugate fault sets in outcrop, where the acute angle between them points to σ1. Also hybrid fractures in veined rocks.

**Geological payoff:** Predicts fracture type and orientation relative to stress, and justifies reading σ1 from conjugate sets.

**Misconceptions to target:** faults form on the maximum-shear planes (45°); σ1 is perpendicular to faults; only the circle's size matters, not its position; a single straight line describes rock strength everywhere.

**Exact vs illustrative:** exact within each stated criterion. Criteria are described as empirical or idealized, and the composite join is a stated construction.

**Domain / scenes / tests:** `coulombFailure(σ1, σ3, C, μ)` → { fails, criticalσ1, θ, planes[] } and `compositeEnvelope(T₀, C, μ, options)` → { τ(σn), contactPoint(circle), fractureStyle } in `failure.js`, with tests against hand calculations.

**Out of scope:** fault growth mechanics (B9), and deriving the Griffith criterion.

**Acceptance criteria:** the tangency point, 2θ, and the 3D conjugate planes agree numerically; the σ2 intersection is shown; the fracture style changes correctly along the composite envelope; the numeric prompt matches the domain function.

---

## B4 — Confining pressure and pore-fluid pressure

**Prerequisites:** B3, S10. **Used later by:** B5, B6, B7, B14 (Hubbert–Rubey), R5, R6.

**Learning objectives**
- Explain how raising confining pressure strengthens rock: the circle moves right, away from the envelope.
- Define effective stress `σ' = σ − Pf` (applied to the normal stresses) and show pore pressure shifting the circle left without changing its size.
- Explain hydrofracturing, and why extension fractures and veins can form at depth where they otherwise could not. Predict whether raising Pf produces extension, hybrid, or shear failure, depending on differential stress (B3 composite envelope).
- Describe the triaxial experiment (confining pressure + axial load), and read its result on the Mohr diagram.

**Math introduced:** `σn' = σn − Pf`; `σ1' = σ1 − Pf`, `σ3' = σ3 − Pf`; shear is unchanged. In 3D, `σ' = σ − Pf I` (the mean-stress callback from S10). Hydrostatic Pf ≈ 10 MPa/km, lithostatic σv ≈ 26–27 MPa/km, pore-fluid factor λ = Pf/σv. Hydrofracture when `σ3' ≤ −T₀`. Extension failure requires small differential stress (`σ1 − σ3 < 4T₀` for the Griffith envelope).

**Equation–model binding:** a pore-pressure slider slides the circle left, and its radius stays fixed. A confining-pressure slider slides it right. A triaxial-rig schematic around the cube (a jacket, confining fluid, and a piston) with a live Mohr plot and a series of experiments tracing the envelope. A depth block showing σv and Pf profiles. At failure, the 3D fracture type (extension, hybrid, or shear) follows the composite envelope contact.

**Step outline**
1. The triaxial experiment: confining pressure plus axial load. Several runs trace the failure envelope on the Mohr plot.
2. Confinement moves the circle right and strengthens the rock.
3. Pore fluid pushes back: effective stress. Prediction: "Does pore pressure change the circle's size?"
4. Slide Pf up until failure. A small circle gives extension fractures (hydrofracture), a medium one gives hybrid fractures, and a large one gives shear fractures.
5. Depth profiles: hydrostatic vs overpressured.
6. Numeric prompt: a given depth, λ, and σ3 → is hydrofracture possible?
7. *Geology:* veins at depth, induced seismicity from fluid injection, and overpressured basins and thrust sheets (context: overpressure lets huge thrust sheets move).

**Geological payoff:** Fluid pressure is a first-order control on faulting, vein formation, and induced earthquakes.

**Misconceptions to target:** pore pressure increases the stress on the rock; confining pressure alone causes failure; hydrofractures need tensile tectonic stress.

**Exact vs illustrative:** effective-stress shifts are exact; the rig graphic is schematic.

**Domain / scenes / tests:** `effectiveStress(σ, Pf)` and `hydrofractureCheck` in `failure.js`, with tests. *B6 (built early) already shows effective stress in its last step: `frictionCheck(σ, n, Pf)` and `newFaultSigma1(σ3, { C, μ, Pf })` in `failure.js`, and `FrictionMohrPlot.js` draws the circles shifted left by Pf with the dry circle dashed.*

**Out of scope:** poroelastic coupling (a one-sentence mention at most), and permeability or flow.

**Acceptance criteria:** the circle shifts correctly with Pf and confinement; the triaxial series traces the envelope; the hydrofracture condition is verified; the fracture style changes with differential stress.

---

## B5 — Joints and veins

**Prerequisites:** B2, B4, O3. **Used later by:** B8, R5, F5.

**Learning objectives**
- Define joints, fissures, and veins as opening-mode (extension) structures that record the σ3 direction when they form.
- Describe joint sets and systems (systematic vs non-systematic; orthogonal and conjugate-looking sets), and represent them on a stereonet (poles) and a rose diagram (strikes).
- Explain **mechanical stratigraphy**: joints form first, and are more closely spaced, in stiff (competent) layers; spacing scales with layer thickness (ratio near 1); and joints tend to stop at layer boundaries.
- Explain the settings in which joints form: during burial (fluid overpressure, B4), under tectonic stress, and during exhumation (unloading and cooling). The quantitative exhumation argument comes in R5.
- Use abutting and cross-cutting relationships (T- and Y-junctions) and surface morphology (plumose structure) to read relative age and propagation direction.
- Describe veins as filled extension fractures. Distinguish syntaxial, antitaxial, and stretching veins by where the fill grows, and read the **opening vector** from fibrous fill.

**Math introduced:** rose-diagram binning of strike azimuths (a histogram in angle, with the 180° symmetry of strikes); poles of a joint set clustering around the σ3 direction (O3 callback). Joint spacing ∝ layer thickness, shown as a simple linear relation fit to generated data. A stiffness argument: the same stretch in a stiffer layer produces more stress (the relation `σ = Eε` is used as a forward pointer to R2). Opening vector: the fiber direction in a vein gives the displacement vector, which need not be perpendicular to the vein wall (M3 split into opening and sliding parts, B1 callback).

**Equation–model binding:** the layered-block view with layers of different stiffness under slowly increasing layer-parallel extension. Joints appear first in stiff layers, then infill until the spacing saturates; spacing vs thickness is plotted live. Joint sets in an outcrop block, with their poles on a stereonet and strikes on a rose diagram, all linked. A vein with animated fiber growth (syntaxial vs antitaxial) and its opening vector drawn and decomposed.

**Step outline**
1. Joints as extension fractures, and the B2 callback (⊥ σ3).
2. Joint sets: measure several joints; poles cluster on the stereonet; strikes pile up on a rose diagram. Prediction: where is σ3?
3. Mechanical stratigraphy: stretch a layered block. Which layer cracks first? Why is the spacing ≈ thickness? (A qualitative stress-shadow explanation.)
4. Where joints form: burial with overpressure (B4), tectonic stress, and exhumation (preview of R5's numbers).
5. Relative age: abutting (T-junctions) and cross-cutting. Plumose structures show which way a joint grew.
6. Veins: fill types and growth, and reading the opening direction from fibers. Prompt: is this vein pure opening or oblique?
7. *Geology:* jointed sandstone and shale sequences, and why joints matter for fluid flow, groundwater, reservoirs, and rock-slope stability.

**Geological payoff:** Joints and veins are the most common brittle structures near the surface. They record the late stress history, control fluid flow, and are mapped constantly in the field.

**Misconceptions to target:** joints are random cracks; thicker layers have more joints; veins always open perpendicular to their walls.

**Exact vs illustrative:** the rose diagram and stereonet are exact. The spacing–thickness growth is **illustrative** (a rule-based model, not a fracture-mechanics simulation) and is labeled. The fiber-growth animation is illustrative, but the opening-vector decomposition is exact.

**Domain / scenes / tests:** `roseHistogram(azimuths, binWidth)` in `orientation.js`, `jointSpacingModel(thickness, stiffnessContrast, strain)` (rule-based, documented) in `failure.js`, and `veinOpeningVector(fibers, wallNormal)`, with tests. Build the layered-block view and the rose diagram component.

**Out of scope:** fracture-mechanics derivation of spacing, fracture permeability calculations, and joint-network statistics (Lab mode).

**Acceptance criteria:** the stereonet, rose diagram, and 3D outcrop are linked; stiff layers joint first and the spacing trend is shown; relative-age reading works; vein opening vectors decompose correctly.

---

## B6 — Friction and reactivation of existing planes

**Prerequisites:** B3, B4, S9, O3. **Used later by:** B7, B8, B9, B11, B13, B14, R6.

**Learning objectives**
- State Byerlee's friction law, and compare the frictional sliding line with the intact-rock Coulomb envelope.
- Decide whether a pre-existing plane of arbitrary orientation will slip before a new fracture forms. Explain that reactivation is what lets faults grow large (B9 preview).
- Compute slip tendency `Ts = τ / σn'` for any plane, and map it over all orientations on a stereonet. Define "critically stressed".

**Math introduced:** Byerlee: `τ = 0.85 σn'` for σn' < 200 MPa, and `τ = 50 MPa + 0.6 σn'` above that (to about 1700 MPa). Slip tendency `Ts = τ/σn'`; slip when `Ts ≥ μs`. Planes of arbitrary orientation plot *inside* the 3D Mohr region (S9 callback). Dilation tendency `(σ1 − σn)/(σ1 − σ3)` is an optional aside, and it links to B5 (which joints open).

**Equation–model binding:** an arbitrary plane in the 3D cube (dragged, or by strike/dip) ↔ its point in the 3D Mohr region, with the Byerlee line and the intact Coulomb line both drawn. A stereonet shows a slip-tendency color map over all pole orientations, with the current plane's pole marked. Well-oriented and misoriented planes are compared.

**Step outline**
1. Existing surfaces are weaker: no cohesion, and the friction line sits below the intact envelope.
2. Byerlee's law: nearly rock-type independent (clay-rich gouge is the exception). Plot it.
3. Drag a pre-existing plane. Its point in the Mohr region either reaches the friction line or doesn't.
4. Will the old plane slip, or a new fault form? Prediction for a misoriented plane.
5. Slip tendency over all orientations: the stereonet map. Where are the "most dangerous" planes? (Near the B3 angle, containing σ2.)
6. *Geology:* reactivation of old faults, and fault-hazard ranking (an induced-seismicity callback to B4).

**Geological payoff:** Why old faults control new deformation, and how to assess which faults are critically stressed.

**Misconceptions to target:** new faults always form; all pre-existing faults slip equally.

**Exact vs illustrative:** exact within Byerlee and the slip-tendency definitions.

**Domain / scenes / tests:** `byerlee(σn)`, `slipTendency(σ, n, Pf)`, `dilationTendency(σ, n)`, and `slipTendencyGrid(σ)` in `failure.js`, with tests. A stereonet color-map layer.

**Out of scope:** rate-and-state friction and earthquake cycles (one context sentence at most; both are taught in B13).

**Acceptance criteria:** the plane ↔ Mohr point ↔ stereonet pole are all linked; the slip-tendency map is correct for known stress states.

**As built (0.10.0, built early).** Built ahead of B3, B4, S9, and O3 for classroom use, so it stands alone:
- **Restated prerequisites.** Step 1 states the Coulomb line (B3), step 3 the 3D Mohr region (S9), and step 8 effective stress (B4). No lesson is required first.
- **Traction form on screen.** 𝐭 = 𝛔𝐧 with 𝐧 the downward pole of the plane, which points into the footwall; 𝐭 is the hanging wall's push on the footwall, and its shear part points the way the hanging wall would slide.
- **Teaching stress state (illustrative).** σ3 = 30 MPa, σ2 halfway between σ3 and σ1, and σ1 set by the step or a slider (30–240 MPa), with Andersonian axes (σ1 vertical unless the regime is switched). Intact rock uses C = 20 MPa and μ = 0.85, so its Coulomb line is parallel to Byerlee's line and the gap between them is the cohesion.
- **Reactivation vs a new fault** (step 5). Raising σ1 stops at whichever comes first: the σ1 that makes the plane slip (closed form, both Byerlee segments) or the σ1 that breaks intact rock. A plane that can never slip is called locked (a 30°-dipping plane in the normal regime).
- **Stereonet.** The first stereonet, lower-hemisphere equal-area only: a slip-tendency color map (0–1.2, viridis) with the slipping planes hatched, principal axes by shape, the plane's great circle and pole, lettered mapped faults, and click/drag pole picking.
- **Steps.** 1 weak planes; 2 Byerlee's law (numeric); 3 every plane is a point; 4 slip tendency (numeric and a goal); 5 old plane or new fault; 6 the stereonet map, with dilation tendency as an aside; 7 ranking three mapped faults; 8 pore pressure and induced earthquakes.
- **Domain modules.** `tensor.js` (`applyTensor`, `resolveTraction`), `stereonet.js`, and in `failure.js` `BYERLEE`, `byerlee`, `principalMagnitudes`, `mohrCircles3D`, `slipTendency`, `frictionCheck`, `dilationTendency(σ, n, {σ1, σ3})`, `reactivationSigma1`, `newFaultSigma1`, `principalCosines`, and `slipTendencyGrid`.

When B3, B4, S9, and O3 are built, revisit B6: point steps 1, 3, and 8 back to them, and use the O3 net features (grid, equal-angle toggle) where they help.

