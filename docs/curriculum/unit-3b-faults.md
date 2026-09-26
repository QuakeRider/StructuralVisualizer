# Unit 3B — Faults

**Frame:** NED. Stress is compression positive, and Mohr axes follow the README conventions. Cross-sections are vertical slices of an NED block, always extruded or linked back to 3D.

**Unit purpose:** faults are the most important brittle structures and the ones students map, drill, and feel as earthquakes. Unit 3 explains when and how rock breaks and slips (B1–B6). This unit is about faults themselves: which faults the stress predicts (B7), how slip is described and read (B8, B12), what faults look like as surfaces, arrays, and zones of broken rock (B10, B11), how they grow (B9), how they make earthquakes (B13), why some move at all (B14), what a population of faults says about stress (B15), and how faults control fluids and are found underground (B16). Fault systems (B17, B18) are taught **after Unit 6**, when fault-bend folds (F6) and simple and pure shear (D5, D6) are available.

**Origin.** Written 2026-09-26 after a review of Fossen (2016) chapters 9–10 and PSGT chapter 5 against the built lessons B6–B9, and an interview with the course instructor. B7, B8, and B9 moved here from `unit-3-brittle.md` and keep their IDs. Unit 3B shares the B prefix, so new lessons continue from B10. **Teaching order is not ID order:** B7, B8, B10, B11, B12, B9, B13, B14, B15, B16, then (after Unit 6) B17 and B18.

**Unit color.** A second, lighter vermillion, `#f5a383`, always shown with the "3B" label so color is never the only cue (its contrast with the Brittle color is only 1.4:1; see the catalog note below).

**Sliding-block exception to binding decision 1.** B13's spring-slider and B14's pushed and gliding thrust sheets are force balances *along a frictional surface*. The README allows exactly this and nothing more: no moments, supports, section cuts, or internal resultants.

**Conventions set in this unit**
- **Coulomb stress change** (B13): seismology books write ΔCFS = Δτ + μ′Δσn with tension positive. Under this project's compression-positive convention the same quantity is **ΔCFS = Δτ − μ′Δσn**. The lesson states both and shows why the sign flips. Δτ is the change in shear stress resolved in the receiver fault's slip direction.
- **Riedel angles** (B12) are measured from the shear-zone boundary in the idealized model where σ1 sits at 45° to the zone, with φ the angle of internal friction. The model is stated on screen.
- **Stress ratio** φ = (σ2 − σ3)/(σ1 − σ3) (B15), the same φ as B8's step 7. Some books use R = 1 − φ; the lesson says so.
- **Slip arrows on stereonets** (B15) point the way the hanging wall moves (B8's convention). Some books draw the footwall's motion instead, and the lesson notes this.

**Shared infrastructure first built here:**
- **Fault cross-section view** (B10): a vertical section through an NED block with editable fault trajectories (planar, listric, ramp–flat) and marker beds, linked to the 3D block. F6's fault-fold section extends it.
- **Fault-rock classification chart and texture generator** (B11): Sibson's chart (cohesion × matrix proportion × fabric) with a live sample point, and textures drawn from a power-law clast-size model. It replaces B9's `FaultRockPanel.js`.
- **Scanline plot** (B11): fracture density against distance from the fault core, on `XYPlot.js`.
- **Slip-surface close-up** (B12): a fault surface with its walls pulled apart, showing striations, steps, fibers, and Riedel fractures.
- **Spring-slider and friction-law plots** (B13), and a **map-view stress-change field** (B13).
- **Paleostress stereonet layers** (B15): slip arrows at poles, P/T clouds, and a misfit map.
- **Triangle diagram** and **unwrapped borehole image** (B16).
- **Wedge section** (B14) and **fault-system sections** (B17, B18).

**Photographs.** The instructor may supply outcrop and thin-section photographs later. How to integrate them is **deferred**, to be discussed with the instructor. Until then the procedural textures carry B11, labeled as schematic in appearance.

**Catalog.** Done in the B11 build (0.13.0): `src/lessons/catalog.js` lists Unit 3B in teaching order with B7–B18, B17 and B18 in a second "3B" group after Unit 6, B10 in F6's prerequisites, B9 retitled, and the badge color `#f5a383`. Its contrast is 9.2:1 against the page background but only 1.4:1 against the Brittle color, so the "3B · Faults" unit label, not the color, tells the two units apart. The lesson files live in `src/lessons/unit-3b-faults/`.

---

## B7 — Anderson's theory of faulting

**Prerequisites:** B3, B6, S10, O2. **Used later by:** B8, B9, B14, R5, R6.

**Learning objectives**
- Explain why near Earth's surface one principal stress is vertical (S10 callback).
- Match the three Andersonian regimes to which principal stress is vertical: σ1 vertical → normal faults, σ2 vertical → strike-slip faults, σ3 vertical → thrust faults.
- Predict typical fault dips (about 60° normal, about 30° thrust, near-vertical strike-slip) from B3 with μ ≈ 0.6, and explain why normal faults are steeper than reverse faults.
- State the conditions under which Anderson's theory strictly applies (a new fault in an isotropic rock, a horizontal free surface, infinitesimal slip), and why real faults deviate from it.
- Relate stress regime to tectonic setting (a brief map-view context only; plate tectonics is parked).

**Math introduced:** the combination of B3's plane angle with a vertical principal axis. Dip = 90° − (45° − φ/2) for normal faults, 45° − φ/2 for thrust faults, and vertical for strike-slip faults.

**Equation–model binding:** an Earth block in NED with σ1/σ2/σ3 axis glyphs. A regime toggle rotates the axes, and the conjugate fault pair appears with dip arcs and computed dips. Hanging-wall motion is animated. A stereonet shows the axes and the fault great circles for each regime.

**Step outline**
1. Recall that the free surface makes one principal axis vertical.
2. Three ways to assign σ1, σ2, σ3 to vertical. Predict the fault type for each.
3. Normal regime: σ1 vertical; faults dip about 60°.
4. Thrust regime: σ3 vertical; faults dip about 30°.
5. Strike-slip regime: σ2 vertical; faults are near vertical.
6. Vary μ and see the predicted dips change.
7. Limits of the theory: pre-existing planes (B6), rotation after formation, and non-horizontal surfaces.
8. Prompt: given an outcrop fault set, infer the stress regime.
9. *Geology:* rift, fold-thrust belt, and transform settings as context images or blocks. Mixed regimes in orogens (one context sentence).

**Geological payoff:** The single most-used link between stress and fault type in structural geology.

**Misconceptions to target:** thrust faults form under vertical σ1; Anderson predicts all real fault dips (it is an idealization, and the lesson says why).

**Exact vs illustrative:** dips are exact within Coulomb + Anderson assumptions; the block motion is schematic.

**Domain / scenes / tests:** `andersonFaults(regime, μ)` → fault planes (strike, dip) for a chosen σ1 trend, with tests.

**Out of scope:** oblique regimes and transtension/transpression (can be mentioned), and non-Andersonian faulting.

**Acceptance criteria:** all three regimes are correct; the dips match the formula; the stereonet agrees with the 3D view.

**As built (0.8.0, built early).** Built ahead of B3 and B6 for classroom use, so it stands alone:
- **Coulomb angle restated.** Step 3 states β = 45° − φ/2 from the Mohr diagram instead of pointing back to B3.
- **Stereonet deferred.** There is no stereonet view yet; it waits for the O3 renderer. That acceptance criterion is still open.
- **Scene and Mohr diagram.** The scene is an NED Earth block with the σ axes, the conjugate pair clipped through the block, and β and δ arcs. The hanging wall slides along the resolved shear direction (`faultSlip` computes the direction from 𝐭 = −σ𝐦). A Mohr diagram beside it is fixed at failure (σ3 = 20 MPa, C = 10 MPa; illustrative magnitudes, exact angles).
- **Domain modules.** `andersonAxes`, `andersonFaults(regime, μ, shmaxTrend)`, `principalStressTensor`, `faultSlip`, and `slipSense` are in `anderson.js`; the Coulomb and Mohr helpers are in `failure.js`, and the NED plane and line helpers in `orientation.js`.
- **Steps.** 1 the free surface; 2 which stress is vertical; 3 normal regime, with a numeric dip answer; 4 thrust regime; 5 strike-slip regime, with the sense of slip; 6 varying μ; 7 the limits of the theory; 8 inferring stress from a mapped pair (stress arrows hidden until the answer); 9 tectonic settings.

When B3 is built, revisit B7: point steps 2–3 back to B3. B6 is now built (0.10.0), so B7 can add the stereonet by reusing `Stereonet.js` (axes and the conjugate great circles), and step 7 can point to B6 for reactivation. B8 (0.11.0) now covers slip sense and kinematic axes, so B7's step 5 (sense of strike-slip) can point ahead to it.

---

## B8 — Fault geometry, slip, and kinematic axes

**Prerequisites:** B7, O4, S7. **Used later by:** B9, B10, B11, B12, B15, B16, F6.

**Learning objectives**
- Identify the hanging wall and footwall, and classify slip as dip-slip (normal/reverse), strike-slip (dextral/sinistral), or oblique, from the slip vector.
- Distinguish **slip** (the actual displacement vector) from **separation** (apparent offset of a marker on a map or section), including stratigraphic separation (missing or repeated section in a well).
- Express slip as rake on the fault plane (O4) and as trend/plunge. Read the sense of slip from kinematic indicators on slip surfaces (slickenlines, mineral steps, and subsidiary fractures), treated qualitatively.
- Apply the forward Wallace–Bott hypothesis: slip is parallel to the resolved shear traction on the fault plane. Predict the slip direction for any fault in a given stress field.
- Construct the **kinematic P (shortening) and T (extension) axes** of a fault from its plane and slip vector, and draw the **fault-plane-solution "beach ball"** on the stereonet. Relate this to earthquake focal mechanisms, and explain why P and T are not the same as σ1 and σ3.

**Math introduced:** the slip vector `s`; rake ↔ trend/plunge (O4); Wallace–Bott `ŝ ∥ τ = σn − (n·σn)n` (S7 callback). Separation vs slip as the geometric projection of an offset marker onto a surface. Kinematic axes from unit vectors `n̂` (fault normal) and `ŝ` (slip): `T ∝ n̂ + ŝ`, `P ∝ n̂ − ŝ` (with the sign convention for n̂ and ŝ declared), and `B = n̂ × ŝ` (the null axis). The beach ball is the lower-hemisphere projection of the fault plane and the auxiliary plane (the plane whose normal is ŝ), with the quadrants containing T shaded.

**Equation–model binding:** a fault plane in an Earth block (by strike/dip) with the hanging-wall block displaced along a slip vector (component box: dip-slip and strike-slip parts). A marker bed shows separation vs slip. A stress-field overlay shows the resolved shear vector on the plane, the predicted slip arrow, and the slickenline rake. A stereonet with the fault great circle, the slip-vector point, the P/T/B axes, and the shaded beach ball. The P and T arrows in 3D sit at 45° between n̂ and ŝ, with their construction (`n̂ ± ŝ`) shown live.

**Step outline**
1. Hanging wall vs footwall.
2. The slip vector split into dip-slip and strike-slip components (M3 split within the plane).
3. Classification from the slip vector's components. Prompts: name the fault from a vector.
4. Slip vs separation: an offset bed in map and section views can mislead. Prediction. A repeated section in a well means a reverse fault.
5. Rake of slickenlines ↔ slip vector, and how kinematic indicators give the sense of slip.
6. Wallace–Bott: place the fault in a stress field; the predicted slip ∥ resolved shear. Change σ and the slip direction rotates.
7. P and T axes: build them from n̂ and ŝ. Plot the beach ball. Prompts: match beach balls to normal, thrust, and strike-slip faults.
8. P/T vs σ1/σ3: the same beach ball arises from a range of stress states (a Wallace–Bott callback). That is why inversion needs many faults (inversion itself is parked).
9. Numeric prompt: given σ and a fault plane → predicted rake.

**Geological payoff:** Interpreting fault kinematics from slickenlines and focal mechanisms, and understanding what fault-slip data encode about stress.

**Misconceptions to target:** separation equals slip; the fault name depends on the marker's apparent offset; slip is always down-dip; P and T are the principal stresses; the beach ball's shaded quadrants are "where the rock is compressed".

**Exact vs illustrative:** the slip-vector geometry, Wallace–Bott prediction, and P/T/beach-ball construction are exact within their assumptions; the block displacement is schematic in magnitude.

**Domain / scenes / tests:** `resolvedShearDirection(σ, n)`, `slipClassification(s, plane)`, `separation(marker, fault, slip, viewPlane)`, `kinematicAxes(n, s)` → {P, T, B}, and `beachBall(n, s)` → {nodal planes, shaded regions} in `failure.js` / `orientation.js` / `stereonet.js`, with tests (the standard normal, thrust, and strike-slip cases).

**Out of scope:** stress inversion (the reduced stress tensor), moment tensors, and seismic wave radiation.

**Acceptance criteria:** slip classification is correct for all quadrants; the separation-vs-slip demonstration works; the Wallace–Bott arrow matches `resolvedShearDirection`; P/T axes and beach balls are correct for the standard fault types.

**As built (0.11.0, built early).** Built ahead of O4 and S7 for classroom use, so it stands alone:
- **Restated prerequisites.** Step 2 introduces the rake of the slip vector (O4 gives the rake of a line), and step 6 gives the O4 rake r (0–180°) of a slickenline and sin p = sin r sin δ. Step 7 restates the traction 𝐭 = σ𝐧 in B6's form (S7).
- **Sign conventions on screen.** 𝐧 is the downward pole, into the footwall (as in B6). 𝐬 is the hanging wall's slip. The slip's rake λ runs from −180° to 180°, measured in the fault plane from the strike direction, positive up the dip (λ = 90° reverse, −90° normal, 0° sinistral, 180° dextral: the earthquake-catalog convention). With 𝐧 pointing into the footwall the kinematic axes are **P ∝ 𝐧 + 𝐬̂ and T ∝ 𝐧 − 𝐬̂** (the spec's form with the normal reversed): the hanging wall pushes along 𝐧 and drags along 𝐬̂, and P lies halfway between. A vertical fault's hanging wall is the dip-direction block.
- **Naming.** Slip within 20° of pure dip-slip or strike-slip takes the pure name; otherwise it is oblique, named by both parts. Reverse slip on a fault dipping under 45° is a thrust.
- **Fault lab (`FaultScene.js`).** A 1000 m × 500 m NED block split by a fault through its center. "Moved" mode displaces the hanging wall along 𝐬 (300 m, illustrative); "cut" mode keeps both walls in the block, eroded flat to the lower block's surface, so the top is a map and the sides are cross-sections. Beds (62.5 m) and the ground grid are textured from each block's own coordinates, so they travel with it. It draws the slip vector with its strike-slip and dip-slip parts and the rake arc, a dike marker with its traces and separation arrows, a well, slickenlines with schematic steps on the exposed footwall, the principal stresses, 𝐭 and 𝛕, and P, T, B with their construction from 𝐧 and 𝐬̂. View buttons give 3D, map, and section cameras.
- **Stereonet.** B6's `Stereonet.js` gained layers for the slip vector (with the hanging wall's sense), the auxiliary plane, P/T/B markers, the beach ball (an exact even–odd fill), and a key. **Well log.** `WellLog.js` shows the well beside the normal sequence, with the missing or repeated interval.
- **Steps.** 1 hanging wall and footwall; 2 the slip vector and its parts (numeric); 3 naming faults (goal: make a thrust); 4 slip vs separation with a dike (goal: a slip with no map separation); 5 missing and repeated beds in a well; 6 slickenlines and rake (numeric plunge); 7 Wallace–Bott; 8 P, T, and B; 9 beach balls; 10 P and T are not σ1 and σ3 (tilting σ1 about σ2); 11 predict the rake from τ with atan2 (numeric, final).
- **Domain modules.** `faults.js` (`faultFrame`, `slipFromRake`, `rakeFromSlip`, `lineRakeFromSlipRake`, `slipComponents`, `classifySlip`, `resolvedShearDirection`, `kinematicAxes`, `auxiliaryPlane`, `firstMotion`, `tiltAxes`, `planeThrough`, `traceSeparation`, `wellLog`) and, in `orientation.js`, `rakeVector` and `lineToRake`. The spec's `separation(marker, fault, slip, viewPlane)` is `traceSeparation`, and `beachBall(n, s)` is split into `auxiliaryPlane`, `kinematicAxes`, and `firstMotion` (the renderer draws the quadrants).

When O4 and S7 are built, revisit B8: point steps 2 and 6 back to O4's rake and step 7 back to S7, and use O4's rake functions (already in `orientation.js`) there. B9 can reuse the fault lab for displacement along a fault. When B10 and B12 are built, step 5's throw can point ahead to B10's throw and heave, and step 6's schematic slickenline steps to B12's indicators. B15 reuses `kinematicAxes` for its P/T populations.

---

## B10 — Fault shapes, arrays, and terminations

**Prerequisites:** B8, O2, M2. **Used later by:** B11, B14, B15, B16, B17, B18, F6.

**Learning objectives**
- Split dip slip into **throw** (vertical) and **heave** (horizontal), and compute each from the dip-slip amount and the fault dip. Explain why a mapped bed shows a gap (normal fault) or an overlap (reverse fault) between its hanging-wall and footwall cutoff lines, and why the width is the heave.
- Decide whether a fault is **extensional** or **contractional** from what it does to the layers it cuts, not from its name. Show that a normal-sense fault dipping less steeply than the beds it cuts, in the same direction, shortens them.
- Describe curved faults: **listric** (flattening with depth) and antilistric, and **ramps and flats**, named with respect to the hanging wall, the footwall, or both. Explain why a fault can curve freely *across* the slip direction but not *along* it without deforming a wall.
- Use dip classes (low-angle below 30°, steep above 60°) and the names thrust and detachment correctly.
- Name fault families and arrays: synthetic and antithetic faults; horst, graben, and half-graben; parallel, anastomosing, en échelon, relay, conjugate, and nonsystematic arrays.
- Describe how faults end: at a tip line (B9), against a younger structure (another fault, an unconformity, an intrusion), or in **horsetail splays**. Distinguish emergent, blind, and exhumed faults, and use cross-cutting to order faults in time.
- Recognize **growth (syndepositional) faults** from hanging-wall thickening, and compute the **expansion index** for each unit.

**Math introduced:** throw = d sin δ and heave = d cos δ for dip slip d on a fault of dip δ (M2 callback; B8 named throw in the well step). Bed-length change: the part of the slip vector along the bed, taken toward the footwall cutoff. Its sign says extensional or contractional. Expansion index E = t_HW / t_FW for each unit (E > 1 while a normal fault grows; E < 1 is expected for a syndepositional reverse fault).

**Equation–model binding:** the new fault cross-section view beside the 3D block. A dip-slip slider moves the hanging wall; throw and heave are drawn as the legs of a right triangle on the slip, with live values. In the map view of the same block, the cutoff lines of a bed open into a gap whose width is labeled heave. A bed-dip slider tilts the layers before faulting; the bed-length change is drawn along the bed and colored extensional or contractional. A trajectory editor switches between planar, listric, and ramp–flat faults, and the hanging wall is moved rigidly to show the gap or overlap that forces it to bend (a preview of rollover, B17 and F6). A map-view array generator draws each array type. A growth-fault section deposits layers while the fault slips, with an expansion-index bar chart per unit.

**Step outline**
1. Throw and heave from dip slip. Numeric prompt: 100 m of dip slip on a 60° fault gives what throw?
2. Cutoff lines on a map: gap or overlap, and its width. Prediction: what does a reverse fault do to a mapped bed?
3. Extensional or contractional? Tilt the beds and watch the bed-length change flip sign. Goal: find a normal fault that shortens the beds.
4. Curved faults: listric, antilistric, ramps and flats, with hanging-wall and footwall names. Move a rigid hanging wall along a listric fault and watch the gap open.
5. Low-angle, steep, thrust, detachment.
6. Families in section: synthetic and antithetic faults, horst, graben, half-graben.
7. Arrays in map view. Prompt: name the array from a map.
8. How faults end: tips, horsetails, cut by younger structures. Emergent, blind, exhumed. Prompt: order three faults by cross-cutting.
9. Growth faults and the expansion index. Numeric prompt: which unit was deposited while the fault moved fastest?

**Geological payoff:** the working vocabulary for maps, cross-sections, and seismic sections, and two quick quantitative tools, throw/heave and the expansion index, used in every basin study.

**Misconceptions to target:** normal faults always extend the layers; throw and slip are the same; a fault's dip is constant; a fault that ends on a map ends in 3D; hanging-wall thickening is original depositional variation.

**Exact vs illustrative:** throw, heave, cutoff gaps, bed-length change, and the expansion index are exact. The rigid-hanging-wall gap on a listric fault is exact as geometry; how real rocks fill it is B17/F6. The arrays are schematic.

**Domain / scenes / tests:** `faultShapes.js`: `throwHeave(d, dip)`, `cutoffGap(slip, fault, bed)`, `bedLengthChange(slip, fault, bed)` → { change, kind }, `listricProfile(params)`, `rampFlatProfile(segments)`, `rigidHangingWallGap(profile, slip)`, `expansionIndex(tHW, tFW)`, and `faultArray(type, params)`. Tests: the 60° hand case, a normal fault cutting 70°-dipping beds (contractional), horizontal beds (extensional), and a synthetic growth sequence. Build the fault cross-section view.

**Out of scope:** fault-bend and fault-propagation folds (F6), rollover construction and fault systems (B17, B18), and section balancing (parked, Lab mode).

**Acceptance criteria:** throw and heave agree with the section and the map gap; the extensional/contractional flip happens at the right bed dip; each array and termination type is drawn; the expansion index matches the generated layer thicknesses.

---

## B11 — Fault zones and fault rocks

**Prerequisites:** B8, B10, B6, B1 (deformation bands; restate if B1 is not built). **Used later by:** B9, B12, B13, B16, R6, (parked) shear zones.

This lesson replaces B9's first step, "Inside a fault zone". It was built early (0.13.0), ahead of M3, at the instructor's request; see its "As built" note.

**Learning objectives**
- Describe a fault as a zone, with a scale-dependent definition: a line on a map, and a volume in outcrop. Name its parts: principal slip surface(s), **fault core**, **damage zone**, host rock, and the **process zone** ahead of a propagating tip.
- Describe real architecture: several slip surfaces and strands, **fault lenses**, damage zones that differ from wall to wall, and damage located at **tips, walls, and linkages** (Kim, Peacock & Sanderson 2004).
- Read a **scanline**: fracture density falls with distance from the core, and the damage zone ends where the density reaches the background.
- State how zone widths scale with displacement, with scatter of one to two orders of magnitude (Fossen 2016, ch. 9): core thickness about D/100 (between D/1000 and D/10), and one-sided damage-zone width of order D for faults with D up to about 100 m.
- Explain **comminution**: clasts are broken, rotated, and ground down, and the clast sizes follow a power law. Relate the matrix proportion to the amount of grinding.
- Classify fault rocks with **Sibson's (1977) scheme** along its axes:
  - *incohesive, random fabric:* fault breccia (visible fragments over 30% of the rock) and fault gouge (under 30%);
  - *cohesive, random fabric:* crush breccias (matrix under 10%, named by fragment size), then the cataclasite series: protocataclasite (10–50% matrix), cataclasite (50–90%), and ultracataclasite (90–100%);
  - *glass:* pseudotachylyte;
  - *foliated:* the mylonite series (protomylonite, mylonite, ultramylonite) and phyllonite, which are not brittle.

  Note that some gouges and cataclasites are foliated, and scaly clay (PSGT) exists.
- Know the two alternatives and where they differ. **Woodcock & Mort (2008)** define breccia by size: at least 30% clasts of 2 mm or more, subdivided into crackle (at least 75% clasts), mosaic (60–75%), and chaotic (30–60%) breccia, and they do not use cohesion. **PSGT** separates breccia from gouge at about 1 mm and allows cohesive gouge.
- Explain **pseudotachylyte** as frictional melt during seismic slip, and estimate the heating of a thin slip zone.
- Place fault rocks on a **depth column**: loose gouge and breccia near the surface, cohesive cataclasite in the middle crust, pseudotachylyte in the earthquake depth range, and mylonite below the onset of crystal plasticity (about 250 °C calcite, 300 °C quartz, 450 °C feldspar; PSGT).
- Contrast **crystalline and porous hosts**. In low-porosity rock the damage zone is open fractures and the core is gouge or cataclasite. In porous sandstone the fault grows from **deformation bands**: single bands, then a band zone, then a slip surface with a thin ultracataclasite core (the Aydin & Johnson sequence). The bands *reduce* permeability.
- Use **Caine, Evans & Forster's (1996)** architecture index F_a = damage-zone width / (core width + damage-zone width) and their four end-members: localized conduit, distributed conduit, localized barrier, and combined conduit–barrier.

**Math introduced:**
- W = w_core + w_dmg,HW + w_dmg,FW (the damage zones need not be equal).
- Scanline density ρ(x) against distance x from the core, fit by a stated decay law (power law or exponential, as in published scanlines); the damage-zone edge is where ρ reaches background.
- Width scaling as bands on log–log axes: w_core = D/k with k between 10 and 1000; D/w_dmg ≈ 1 with wide scatter.
- **Clast-size power law:** the number of clasts larger than d is N(>d) ∝ d^(−D_f), with D_f ≈ 2.58 predicted by constrained comminution and 2.60 ± 0.11 measured in natural gouge (Sammis, King & Biegel 1987). The volume fraction finer than a cutoff d_m, between the sizes d_min and d_max, is f = (d_m^(3−D_f) − d_min^(3−D_f)) / (d_max^(3−D_f) − d_min^(3−D_f)) for D_f < 3. A plane slice through 3D clasts has a 2D exponent D_f − 1, which is what the drawn texture uses.
- **Frictional heating** (adiabatic upper bound): ΔT ≈ τ·D / (ρ·c·w), for shear stress τ, slip D, density ρ, heat capacity c, and slip-zone width w. For example, 50 MPa, 1 m, 2700 kg/m³, 1000 J/(kg·K), and w = 1 cm give ≈ 1850 K; w = 1 mm gives ten times that. Thin zones melt.
- F_a = w_dmg / (w_core + w_dmg).

**Equation–model binding:**
- **Outcrop.** An outcrop-scale 3D block (B9's 40 m outcrop, rebuilt) with editable architecture: the number of strands, lenses, core width, a damage width for each wall, and host type (crystalline or porous sandstone). Fractures (crystalline) or deformation bands (porous) are generated from the density law, so the drawn fracture density matches the scanline plot beside it. A draggable scanline counts what it crosses.
- **Width scaling.** A log–log plot of core and damage widths against D, with the current fault's point.
- **Grinding.** A "grinding" (slip) slider drives a rule-based comminution model: d_max falls with slip, and D_f rises toward about 2.6. It updates the live clast-size plot, the matrix % (the formula above), and a procedurally drawn texture of a thin slab.
- **Classification.** A cohesion toggle (loose, or healed/cemented) and a fabric toggle (random or foliated) move the sample point on Sibson's chart; the name updates, and Woodcock & Mort's breccia name is shown beside it where it applies.
- **Heating and depth.** A heating calculator with τ, D, and w sliders melts the slab into a dark pseudotachylyte vein with injection veins when ΔT passes the melting range. A depth column with a geothermal-gradient slider shows which fault rock forms at each depth, and the width of the fault zone changes with depth.
- **Conduit or barrier.** An F_a gauge updates with the widths and labels the end-member.

**Step outline**
1. From line to zone: zoom from B8's plane to a fault zone. The parts are named, and hovering highlights each one.
2. Real architecture: strands, lenses, uneven walls; tip, wall, and linking damage. Prediction: where along a fault is the damage zone widest?
3. The scanline: drag it across the zone and read the density decay. Where does the damage zone end?
4. Widths grow with displacement. Numeric prompt: D = 50 m, so what range of core thickness do you expect?
5. Grinding rock: the slip slider, the clast-size power law, and the matrix % rising. Prediction: which grows faster with slip, the largest clast or the matrix fraction?
6. Naming fault rocks: Sibson's chart, and cohesion from healing or cement. Prompts: classify three generated samples. Note Woodcock & Mort's breccia names and PSGT's size-based use.
7. Melting on a fault: pseudotachylyte and the heating estimate. Numeric prompt with the calculator.
8. Fault rocks with depth: slide the geothermal gradient and watch the zones move. Bridge to B13 (the earthquake depth range) and R6.
9. Crystalline vs porous host: fractures vs deformation bands, and how a fault is born in each. Prompt: which fault zone passes water across it?
10. Conduit, barrier, or both: the F_a index and the four end-members. *Geology:* groundwater along fractured damage zones, ore in breccias, and sealing gouge. Bridge to B16.

**Geological payoff:** students can describe a fault zone they meet in outcrop or core, name its rocks with a real classification, infer the depth and conditions of faulting from the fault rock, and predict whether the fault helps or blocks fluid flow.

**Misconceptions to target:** a fault is a single clean plane; gouge and breccia are just "crushed rock" with no system to naming; mylonite is crushed rock (its name misleads); all fault zones are fluid conduits; damage is the same on both walls and along the fault; pseudotachylyte is volcanic.

**Exact vs illustrative:**
- Exact: the size-distribution integral, the matrix fraction, the 2D slice exponent, the heating bound, F_a, and the classification boundaries (as defined by each scheme).
- Illustrative, and labeled so: the comminution schedule (slip → d_max, D_f), the density-decay parameters, the depth boundaries (stated ranges from the sources), and the texture drawings (schematic in appearance, correct in size distribution).
- The width-scaling bands summarize published scatter; any points are synthetic and labeled.

**Domain / scenes / tests:** `faultRocks.js`:
- `clastSizeDistribution({ dMin, dMax, Df })` and `fractionFiner(dist, d)`
- `comminutionState(slip)`, rule-based and documented
- `sampleClasts(dist, area, seed)` for 2D textures, using D_f − 1
- `sibsonClass({ cohesive, matrixPct, fragmentSize, foliated, glass })` and `woodcockMortClass(clastPct2mm)`
- `frictionalHeating(τ, D, ρ, c, w)`
- `architectureIndex(core, damage)` and `permeabilityStructure(Fa, …)`
- `damageDensity(x, params)` and `damageZoneEdge(params, background)`
- `faultRockZones(gradient)`

Tests: hand values of the size integral (for example D_f = 2 makes f linear in d), the Sibson boundaries at 10/50/90%, the Woodcock & Mort boundaries at 30/60/75%, the heating example above, and F_a limits of 0 and 1. The fault-rock chart and texture renderer replace `FaultRockPanel.js`. Rebuild the outcrop setup of `FaultGrowthScene.js`, or split it into its own scene, with strands, lenses, uneven damage, and host type.

**Sources to check at build (numbers, never text or figures):** Sibson (1977) Table 1 for the crush-breccia fragment sizes (recalled as over 0.5 cm, 0.1–0.5 cm, and under 0.1 cm); Kim et al. (2004) for the damage-zone types; published scanline fits (for example Savage & Brodsky 2011) for a defensible decay law.

**Out of scope:** mylonite microstructures and shear-zone kinematics (parked), fault-rock permeability values beyond order-of-magnitude contrasts, and the mechanics of deformation bands (B1's out-of-scope list). Photographs are deferred (see the unit header).

**Acceptance criteria:**
- Generated fractures match the scanline plot.
- The matrix % matches `fractionFiner` for the drawn distribution, and the drawn slice uses D_f − 1.
- Every Sibson class is reachable and correctly named; Woodcock & Mort names appear where they apply.
- The heating example reproduces its number.
- The depth column moves with the gradient.
- F_a and its end-member update with the widths.
- Crystalline and porous hosts show different damage-zone structures and flow outcomes.

**As built (0.13.0, built early).** Built after B8 at the instructor's request, ahead of B10 and B1; it needs only the fault-as-a-plane idea from them and restates deformation bands in one sentence.
- **Setting.** One lab, `visualKind: 'fault-zone'`, with three setups. *Outcrop:* a 40 m NED block (1 km at map scale) around a normal fault striking north, dipping 60° east, with 10 m of slip; its faces are painted pixel by pixel from the zone model, so what is drawn and what is hovered come from the same classification. Defaults: core 0.8 m, footwall damage 5 m, hanging-wall damage 8 m; 1–3 strands and 0–2 lenses (lenses sit between strands). *Sample:* a slab of fault rock drawn from its clast-size distribution. *Crust:* a 60 km × 30 km block with the fault-rock zones by depth, the fault zone drawn wider than true.
- **Damage density.** ρ(x) = ρ₀(1 + x/x₀)^(−n) down to ρ_bg, with n = 0.8 (Savage & Brodsky 2011), x₀ = 0.5 m, and ρ_bg = 0.5 per m; ρ₀ is set so the decay reaches the background exactly at the chosen width. Pavement traces are placed so an east–west scanline crosses ρ(d) sin δ traces per metre, which the plot divides by sin δ to read per metre at right angles to the fault; a test averages many seeds and matches the law within 10%. In sandstone the law counts deformation bands (x₀ = 2 cm, ρ_bg = 0.2 per m), and the three stages (single bands, band zone, slip surface) set the widths.
- **Width scaling.** D from 0.1 m to 1 km, w_core = D/k (k from 10 to 1000) and w_dmg = aD per wall (a from 0.1 to 10), against bands for D/1000–D/10 and D/10–10D (drawn only to D = 100 m). The block grows with D and the drawn density law scales with it, so the zone looks alike at every size.
- **Comminution.** Slip from 1 cm to 100 m on a log scale t: d_max = 30 mm × 10^(−2.4t), D_f = 2.58 − 0.98 e^(−4t), d_min = 1 µm. The matrix is grains finer than 0.1 mm, Sibson's own definition. The slab is a 480 × 288 grid over a field of 6, 25, or 100 mm (the smallest at least 3 d_max). Clasts of two cells or more are equal-area outlines drawn from the slice law N(>d) ∝ d^(−(D_f − 1)) and packed without overlap, largest first; area lost to the edges or crowding is topped up from the same law, and finer fragments are single cells. The drawn matrix matches `fractionFiner` within 2% (tested).
- **Classification.** Sibson's boundaries at 10/50/90% matrix and 30% fragments; crush breccias named by the volume median of the grains coarser than the matrix (over 5 mm, 1–5 mm, under 1 mm); foliated rock under 10% matrix has no name in the scheme. Woodcock & Mort's name appears beside it from the clasts of 2 mm or more. Phyllonite is named in the text; there is no mica control.
- **Heating and depth.** The fault starts at 200 °C, about 8 km deep; the slab melts into a pseudotachylyte vein when 200 °C + ΔT reaches 1000 °C (quartz survives to 1700 °C). The depth column uses T₀ = 10 °C and boundaries at 100 °C (cohesion, a stated choice), 250 °C (calcite), 300 °C (quartz), and 450 °C (feldspar), with earthquakes between 100 and 300 °C.
- **Architecture.** A core counts as well developed from 10 cm and the damage zones from 1 m in total (a stated choice); F_a is exact.
- **Steps.** 1 from line to zone (map/outcrop switch; the damage map shows the process zone); 2 strands, lenses, uneven walls, and tip, wall, and linking damage; 3 the scanline (numeric: the edge for ρ₀ = 3 per m is 4.2 m); 4 width scaling (numeric: 0.5 m); 5 grinding; 6 naming, with a goal to make a gouge, a fine crush breccia, and an ultracataclasite; 7 melting (numeric: about 1850 K); 8 fault rocks with depth (numeric: 11.6 km); 9 crystalline vs porous host, with flow arrows; 10 conduit, barrier, or both (final).
- **Domain module.** `faultRocks.js`. Beyond the spec's list: `rockComposition`, `sizeAtFraction`, `slabTexture`, `clastPolygon`, `damagePeak`, `zonePosition`, `zoneDensity`, `pavementTraces`, `sectionTraces`, `strikeFaceTraces`, `scanlineCrossings`, `scanlineDensity`, `widthScaling`, and `depthOfTemperature`. `damageDensity(x, params)` takes the zone width; `permeabilityStructure({ core, damage })` picks the end-member from which parts are well developed and returns F_a with it.
- **Scenes.** `FaultZoneScene.js` (the three setups), `faultRockTexture.js` (slab drawings), `FaultRockChart.js` (Sibson's chart and Woodcock & Mort's scale), and `FaultZonePanels.js` (the damage map, the depth column, and the architecture gauge); `XYPlot.js` gained filled areas. `FaultRockPanel.js` was removed.
- **Sources checked at build.** Sibson's crush-breccia sizes and the 0.1 mm matrix size, and Woodcock & Mort's thresholds, against the McGill fault-rock glossary; Savage & Brodsky's decay exponent of about 0.8 for small faults. Photographs: none (deferred).

---

## B12 — Kinematic indicators

**Prerequisites:** B8, B11, B3 (Coulomb angle; restate if B3 is not built), O3. **Used later by:** B15, B18.

**Learning objectives**
- Explain why a lineation gives the direction of slip but not its sense, and why it may record only the last slip increment. Recognize overprinting lineation sets as separate slip events.
- Distinguish mechanical striations (grooves and ploughing) from **slip-fiber lineations**, and polished slickensides from fiber-coated ones.
- Read sense of slip from **steps**. Fiber (accretion) steps are reliable. Steps formed by polishing or by crossing fractures can face the opposite way, so "the smooth direction" is ambiguous.
- Use restraining and releasing irregularities: pressure solution and **stylolites** (and slickolites) on restraining faces; mineral fill on releasing faces.
- Predict the **Riedel system** in a brittle shear zone: R shears at φ/2 to the zone, R′ at 90° − φ/2, P at −φ/2, T (extension) fractures at 45°, and Y (M) shears parallel to the zone. Know which are synthetic and which antithetic.
- Apply **Petit's T-, P-, and R-criteria** to a slip surface in section, including chatter marks.
- Read shear sense from **sigmoidal en échelon veins**: new vein tips open near 45° to the zone while older parts rotate.
- Combine several indicators and state a confidence.

**Math introduced:**
- Riedel angles from B3's Coulomb angle. In the model with σ1 at 45° to the zone, the two Coulomb planes lie at 45° ± (45° − φ/2) from the zone, so R is at φ/2 and R′ at 90° − φ/2; P is R reflected across the zone. They are shown live with a φ slider.
- Rotation of an older vein segment under simple shear γ across the zone: cot θ′ = cot θ + γ, for a line at angle θ from the shear direction. This is used here as a stated rule and becomes a D5 callback when D5 is built.

**Equation–model binding:**
- **The fault surface.** The slip-surface close-up is a fault with the hanging wall lifted off and rotatable. Grooves, fiber sheets with steps, polish steps, pinnate fractures, stylolites on restraining bumps, and fill in releasing pockets are all generated from the chosen slip vector and its sense. Toggling the true sense flips every indicator consistently.
- **The Riedel box.** A clay-cake shear box (map view, extruded) drives R, R′, P, T, and Y fractures at the computed angles, with an angle readout bound to φ.
- **Veins and data.** A brittle shear zone with en échelon veins grows sigmoids as γ increases. A stereonet receives the plane, lineation, and sense for B15.

**Step outline**
1. Direction is not sense: a lineated surface with no markers. What can you and can't you tell?
2. Striations vs fibers, and the last-increment problem. Prompt: two lineation sets on one surface. What happened?
3. Steps: fiber steps vs polish steps. Prediction: which way did the missing wall move?
4. Restraining and releasing bumps: stylolites and mineral fill.
5. The Riedel experiment: shear the clay cake and watch R, R′, P, T, and Y appear at their angles. Vary φ.
6. Petit's criteria in section, and chatter marks. Prompt: read the sense from a generated section.
7. Sigmoidal vein arrays: grow the zone and read the sense.
8. Combine indicators. Goal: find the sense of an unknown fault using at least three indicators.
9. Record it: plane, lineation, and sense on the stereonet. Bridge to B15.

**Geological payoff:** the field skill behind every fault-slip measurement. Students learn to read sense of slip where no offset marker exists, and to trust some indicators more than others.

**Misconceptions to target:** a lineation gives the slip sense; the smooth direction on a slickenside is always the slip direction; Riedel shears are random cracks; one indicator is enough.

**Exact vs illustrative:** the Riedel angles are exact within the stated Coulomb/45° model, and the vein rotation is exact under simple shear. Indicator morphology is schematic, and the lesson labels it so.

**Domain / scenes / tests:** `kinematicIndicators.js`: `riedelAngles(φ)`, `riedelSet(frame, sense, φ)` → planes in NED, `indicatorSet(slip, sense, options)` (orientations and facing directions of each indicator), `rotateLineSimpleShear(θ, γ)`, and `combineIndicators(readings)`. Tests: φ = 30° gives R = 15°, R′ = 75°, P = −15°; dextral vs sinistral mirror; a sense flip reverses every step's facing. Build the slip-surface close-up scene (or a close-up mode of `FaultScene.js`).

**Out of scope:** ductile shear-sense indicators such as S–C fabrics and porphyroclasts (parked with shear zones), and fracture mechanics of Riedel growth.

**Acceptance criteria:** the indicators agree with the chosen sense for every slip orientation; the Riedel angles match `riedelAngles`; overprinting sets can be generated and identified; the stereonet record carries the sense.

---

## B9 — Fault displacement and growth

**Prerequisites:** B8, B6, B11. **Used later by:** B13, B15, B16, B17, F6.

**Learning objectives**
- Describe the displacement distribution on a fault surface: displacement is largest near the center and dies out to zero at the **tip line**, so an isolated fault has an elliptical outline in 3D.
- Use displacement–length scaling `D = c·Lⁿ` (with n ≈ 1) to estimate one from the other, and explain what c means.
- Explain how faults grow by accumulating slip (repeated earthquakes) and by **linkage**: underlapping → overlapping (a relay ramp) → hard-linked (breached relay). Recognize the resulting bends and displacement profiles, and the process zone ahead of each growing tip (B11).
- Recognize fault drag (reverse and normal drag) as a displacement-gradient effect near the fault, previewing fault-related folds (F6).

**Math introduced:** an idealized displacement field on the fault plane, for example `D(x, y) = D_max · √(1 − (x/a)² − (y/b)²)` inside an elliptical tip line (declared as one idealized model among several). A displacement profile along strike as a 1D slice of that surface. `D = c·Lⁿ` on log–log axes (a straight line with slope n). For linkage, the displacement profiles of two segments are summed.

**Equation–model binding:** the fault-surface displacement map (the fault plane colored by D, with contour lines and the tip line) inside an Earth block. Marker beds are offset by the local D, so the offset visibly shrinks toward the tips. A profile plot along a draggable line on the fault. A log–log D–L plot with a live point for the current fault and a scatter of synthetic "global" data. A two-segment scene: slide the segments toward and past each other and watch the relay ramp form, tilt, and breach, with the summed displacement profile shown and process zones ahead of the growing tips.

**Step outline**
1. An isolated fault: displacement is greatest at the center and zero at the tip line. Prediction: what happens to a marker bed's offset toward the tip?
2. The 3D picture: an elliptical fault surface colored by displacement. Repeated earthquakes, each an elliptical patch, sum to the cumulative profile (B13).
3. Displacement–length scaling. Numeric prompt: estimate D for a 2 km fault with c = 0.03.
4. Growth by linkage: underlap → overlap (relay ramp), with a process zone ahead of each growing tip. Watch the displacement profiles merge.
5. Breaching the ramp: linking damage is widest at the breach.
6. Drag folds as the rock near the fault takes up the displacement gradient (preview of F6).
7. *Geology:* relay ramps in rifts, segmented normal faults, and why fault maps show "gaps" and bends.

**Geological payoff:** Explains the real shape of faults in maps, seismic data, and outcrop, including how large faults form and where relay ramps (and their fluid pathways) occur.

**Misconceptions to target:** a fault has the same displacement everywhere; faults grow only by lengthening a single tip; fault gaps on maps are unrelated faults.

**Exact vs illustrative:** the displacement-field model and the D–L relation are stated idealizations (exact given the model). The growth and linkage animations are illustrative, the process zones are schematic, and the synthetic D–L data are labeled as synthetic.

**Domain / scenes / tests:** `ellipticalDisplacement(a, b, Dmax, x, y)`, `displacementProfile(field, line)`, `dlScaling(L, c, n)`, and `linkSegments(profiles, overlap)` in a new `src/domain/faults.js`, with tests. The fault-surface displacement-map renderer.

**Out of scope:** fault seal (B16), earthquake rupture mechanics (B13), and fault systems (B17, B18).

**Acceptance criteria:** displacement dies out to the tip line in 3D and on marker offsets; the D–L plot is consistent; the relay-ramp sequence shows the summed profiles and the process zones.

**As built (0.12.0, built early).** Built after B8 for classroom use; its B-unit prerequisites before B6 are not built, and it needs none of their content.
- **Setting.** Normal faults striking north and dipping 60° east in the NED block (1000 m, or a 40 m outcrop for step 1). Each wall moves half the local displacement D along the dip, so the walls slide without opening. Away from the fault the motion fades (decay length 350 m for the isolated fault, 180 m for the relay), which gives reverse drag; step 7 names it.
- **Displacement models.** An elliptical tip line with semi-axes a = 400 m and b = 240 m and Dmax = 80 m; D = Dmax √(1 − r²) (elliptical) or Dmax (1 − r) (linear taper), with r = √((u/a)² + (w/b)²). The relay segments use a bell profile, Dmax (1 − r²), whose tips taper more steeply, so the summed profile has a displacement minimum at the relay that fills in as the overlap grows. Displacements use D/L = 0.1 so they read on screen.
- **Linkage.** Segments A and B are 150 m apart, with fixed outer tips at ±460 m; each keeps D = cL as it grows. The growth slider moves from −200 m of underlap to 120 m of overlap, where a breaching fault (striking northeast) links them. After that the linked fault gains slip in proportion to its deficit against one fault 920 m long with the same c; the extra slip is shared by A, the breach, and B.
- **Drag.** A fault whose tips are far away (D = 60 m everywhere) with each wall's movement (D/2)(1 − k(1 − e^(−|d|/λ))), λ = 80 m: k > 0 reverse drag, k < 0 normal drag.
- **Steps.** 1 core and damage zone (with a fault-rock panel of schematic drawings); 2 displacement dies out at the tip line (goal: find half of Dmax); 3 the displacement map, contours, and profile lines (numeric); 4 D = c Lⁿ (numeric); 5 relay ramps (goal: 100 m of overlap); 6 breaching and the displacement deficit; 7 normal and reverse drag (goal: make normal drag); 8 segmented faults on maps (final).
- **Domain module.** `faultGrowth.js`, not `faults.js` (which holds B8's kinematics): `tipRadius`, `displacementShape`, `ellipticalDisplacement`, `displacementAt`, `contourRadius`, `displacementProfile`, `dlScaling`, `dlLength`, `dragDisplacement`, `farFieldOffset`, `classifyDrag`, `faultDisplacement`, `RELAY`, `segmentProfile`, `linkSegments`, `relaySystem`, and `relayFaults`. The spec's `linkSegments(profiles, overlap)` is `linkSegments(segments, x)` together with `relaySystem(growth)`.

**Revised (0.13.0), after B11 was built.** B9 is now "Fault displacement and growth", with seven steps. Its first step ("Inside a fault zone"), the outcrop setup, and `FaultRockPanel.js` (now removed) gave way to B11; the relay step draws a process zone 35 m ahead of each growing tip (a dashed loop on the bed, `process-zone`) until the breach; the displacement-map step points ahead to B13; the breach step says linking damage is widest at the breach; and the first step opens with a bridge from B11. The step numbers in the "As built" note above are now one lower.

---

## B13 — Faults and earthquakes

**Prerequisites:** B6, B9, B11, S7 (traction on a plane; restate in B6's form if S7 is not built). **Used later by:** B14, B15, R6.

**Learning objectives**
- Explain an earthquake as sudden slip on a fault that releases stored elastic strain (elastic rebound), and contrast **stick-slip** with **stable sliding (creep)**.
- Use a **spring-slider** to show how stick-slip arises, and why equal static and dynamic friction give steady sliding.
- State **rate-and-state friction** and interpret its parameters:
  - the direct effect a;
  - the evolution effect b;
  - the slip distance D_c.

  Explain that velocity weakening (a − b < 0) together with a soft enough surroundings (k < k_c) gives stick-slip.
- Explain the **seismogenic zone**: why earthquakes are rare in the top 1–3 km (low normal stress, clay-rich gouge that strengthens with speed) and below about 300–350 °C (plastic mechanisms). Link this to B11's fault-rock depth column.
- Compute **seismic moment** M₀ = G·A·D̄ and **moment magnitude** M_w for a rupture patch on a fault surface.
- Explain that a large fault is built by many earthquakes. Compute the number of events and the **recurrence interval** from slip per event and slip rate.
- Read a **Gutenberg–Richter** plot (log₁₀ N = a − bM, b ≈ 1).
- Compute a **Coulomb stress change** on a receiver fault and explain aftershock and triggered-earthquake patterns, with this project's sign convention.
- Read a **paleoseismic trench**: event horizons, colluvial wedges, and dated layers give slip per event and recurrence. Distinguish active, inactive, creeping, and locked faults.

**Math introduced:**
- **Spring-slider** (the README's sliding-block exception): the spring force k(v_L·t − x) is resisted by friction μ·σn′·A. Simple static/dynamic friction first, then rate-and-state.
- **Rate-and-state:** μ = μ₀ + a ln(V/V₀) + b ln(V₀θ/D_c), with the aging law dθ/dt = 1 − Vθ/D_c. At steady state, μ_ss = μ₀ + (a − b) ln(V/V₀). Stick-slip needs a − b < 0 and k < k_c = (b − a)·σn′/D_c (Ruina 1983).
- **Moment:** M₀ = G·A·D̄ (G ≈ 30 GPa), with D̄ = (2/3)·D_max for B9's elliptical slip patch (the volume of a half-ellipsoid divided by its area).
- **Magnitude:** M_w = (2/3)(log₁₀ M₀ − 9.1), with M₀ in N·m. This is the IASPEI form; Hanks & Kanamori's original constant differs by about 0.03 magnitude units.
- **Accumulation:** the number of events ≈ D_total / D̄_event; the recurrence interval T ≈ D̄_event / v for slip rate v (major faults: about 1–10 mm/yr, Fossen 2016).
- **Gutenberg–Richter:** log₁₀ N(≥M) = a − bM.
- **Coulomb stress change** (compression positive): ΔCFS = Δτ − μ′Δσn, with μ′ ≈ 0.4 as a commonly used effective friction. Δτ and Δσn come from B6's `resolveTraction` applied to a stress-change tensor Δσ.

**Equation–model binding:**
- **Spring-slider.** A block on a frictional surface pulled through a spring. Its position–time and friction–time plots are drawn live, with sliders for k, σn′, a, b, and D_c. A velocity-step experiment shows the direct and evolution effects on the friction plot.
- **Depth.** An a − b depth profile (illustrative, for a granitic crust) next to B11's depth column and a synthetic earthquake-depth histogram.
- **Rupture patches.** B9's fault-surface displacement map, where the student places and sizes an elliptical rupture patch. A, D_max, D̄, M₀, and M_w are live, and adding events builds the cumulative displacement map and profile.
- **Stress change.** A map view of a strike-slip rupture shows the ΔCFS field on receiver faults of a chosen orientation, with red and blue lobes and synthetic aftershocks.
- **Trench.** A trench-wall section with event horizons, colluvial wedges, and sample ages.

**Step outline**
1. Elastic rebound: stress builds and drops, making a sawtooth. Stick-slip vs creep.
2. The spring-slider with static and dynamic friction. Prediction: what happens if they are equal?
3. Rate-and-state friction: a velocity step, a, b, and D_c. Steady-state friction against ln V.
4. Stability: sweep a − b and k and find the stick-slip region.
5. The seismogenic zone: a − b with depth, gouge near the surface, plasticity at depth, and B11's pseudotachylyte in between.
6. One earthquake as a patch on the fault surface. Numeric prompt: A = 20 km × 12 km and D̄ = 1 m give what M_w?
7. Building a fault from earthquakes: stack events and watch the profile grow. Numeric prompt: 1 km of displacement at 2 m per event and 5 mm/yr gives how many events and what recurrence?
8. Many small earthquakes, few large ones: Gutenberg–Richter.
9. Stress transfer: ΔCFS lobes and aftershocks. Prediction: where will the next earthquake be encouraged? The sign convention is called out.
10. Paleoseismology: read a trench for slip per event and recurrence. Active vs inactive, creeping vs locked faults.
11. Final: a hazard-reasoning prompt combining slip rate, patch size, and ΔCFS.

**Geological payoff:** connects fault structure to earthquakes and seismic hazard. It explains where in the crust earthquakes happen, how big they are, how often they recur, and why one earthquake can bring on another.

**Misconceptions to target:** a fault's whole displacement came from one earthquake; all faults are seismic; magnitude is proportional to slip; a larger magnitude means a proportionally longer fault; a stress decrease on a fault makes it more dangerous.

**Exact vs illustrative:**
- Exact within their stated models: the spring-slider with its friction law, M₀ and M_w, D̄ for the elliptical patch, and the recurrence arithmetic.
- The ΔCFS field comes from a 2D elastic dislocation model: exact within that model, with illustrative magnitudes.
- Illustrative: the a − b depth profile, the synthetic catalogs, and the trench.

**Domain / scenes / tests:** `earthquakes.js`:
- `springSlider(params, dt, steps)` (simple and rate-and-state, with the aging law) and `steadyStateFriction(V, params)`
- `criticalStiffness(a, b, σn, Dc)` and `stabilityRegime(params)`
- `seismicMoment(G, A, Dbar)`, `momentMagnitude(M0)`, and `ellipticalMeanSlip(Dmax)`
- `eventCount(Dtotal, Devent)` and `recurrence(Devent, rate)`
- `gutenbergRichter(a, b, M)`
- `dislocationStress2D(fault, slip, point)` (plane-strain edge dislocations bounding a finite fault in map view) and `coulombStressChange(Δσ, receiver, μ′)`

Tests: steady-state friction at V = V₀ equals μ₀; the stability boundary at k = k_c; the magnitude of a known moment; the 2/3 mean slip; and the ΔCFS sign (a pure normal-stress increase under compression positive lowers ΔCFS). Build the spring-slider scene and the map-view stress-change field. Reuse `FaultGrowthScene.js` for the patches and `XYPlot.js` for the plots.

**Out of scope:** seismic waves and elastodynamic rupture, 3D elastic half-space solutions (Okada), moment tensors beyond B8's beach balls, earthquake prediction, and induced-seismicity case studies (B4 and B6 cover the pore-pressure link).

**Acceptance criteria:**
- The spring-slider shows stick-slip exactly where the stability condition predicts.
- M₀ and M_w match hand calculations.
- Stacked patches build a displacement profile consistent with B9's picture.
- The ΔCFS lobes have the correct sign pattern for dextral and sinistral sources, and the compression-positive formula is shown with its tension-positive twin.
- The trench exercise yields slip per event and recurrence.

---

## B14 — Fault mechanics puzzles

**Prerequisites:** B4, B6, B7, B10, B13. **Used later by:** B17.

**Learning objectives**
- State the **thrust paradox**: a dry thrust sheet tens of kilometres long would crush at its back before it slid. Show it with numbers.
- Resolve it with high pore-fluid pressure (Hubbert & Rubey 1959, B4 callback) and with weak fault rock (clay, serpentine; a B11 callback), and compute the longest sheet that can be pushed.
- Explain **gravity gliding** on a slope, and its condition.
- Describe a thrust belt as a **critical Coulomb wedge**: taper α + β, and what happens when the wedge is subcritical or supercritical. Relate taper to basal strength (salt-based wedges about 1–2°, stronger bases up to about 8–10°; PSGT).
- Explain **frictional lock-up** (Sibson 1985): why a pre-existing fault at too high an angle to σ1 cannot be reactivated, and why low-angle normal faults are therefore a puzzle.
- Recognize that some mature faults appear **weak** (friction well below Byerlee), and list the candidate explanations.

**Math introduced:**
- **Basal shear** on a sheet of thickness H: τ_b = C + μ(1 − λ)ρgH, where λ = Pf/σv (B4).
- **Push needed** on the back face, from the force balance along the base per unit width (the sliding-block exception): σ_push = τ_b · L/H. The longest pushable sheet, for a rock strength σ_s, is L_max = σ_s·H/τ_b. With C = 0 this becomes σ_s / (μ(1 − λ)ρg), independent of H.
- **PSGT's worked case:** a block 100 × 10 × 5 km at 2600 kg/m³ gives σn ≈ 127 MPa and, with μ = 0.7, τ ≈ 90 MPa. A fault-rock μ of 0.2 gives about 25 MPa.
- **Gravity gliding:** tan α ≥ μ(1 − λ) (no cohesion).
- **Critical taper:** α + β against its critical value, computed with a small-angle, noncohesive approximation (verify the chosen form against Dahlen 1990 at build; if it is not used exactly, label the value illustrative).
- **Reactivation** (Sibson 1985): σ1′/σ3′ = (1 + μ cot θ)/(1 − μ tan θ) for a plane at θ to σ1. The optimum is θ* = ½ tan⁻¹(1/μ) and lock-up occurs at θ = 2θ* (for Byerlee friction, the optimum is 25–30° and lock-up is at about 50–59°). With σ1 vertical, a normal fault of dip δ has θ = 90° − δ, so it locks up when δ < 90° − tan⁻¹(1/μ) (about 31° for μ = 0.6).

**Equation–model binding:**
- **Thrust sheet.** A thrust-sheet block (2D section extruded to 3D) with sliders for L, H, μ, λ, and C. Live bars compare the required push with the rock strength, and the sheet either slides or breaks at its back.
- **Slope.** A tilt control turns the base into a slope for gliding.
- **Wedge.** A wedge section with α and β marked and a pushed backstop. The wedge thickens (subcritical), slides (critical), or collapses by off-scraping or normal faulting (supercritical), with a stated taper model.
- **Reactivation.** A reactivation plot of σ1′/σ3′ against θ, with the optimum and lock-up marked, linked to B6's Mohr view and a normal-fault block whose dip sets θ.

**Step outline**
1. Push a dry thrust sheet: the required stress vs rock strength. Numeric prompt (PSGT's block).
2. Raise pore pressure: λ → 0.9. How long a sheet can now move?
3. Weaken the fault rock: μ = 0.2. Link to the clay and serpentine gouge of B11.
4. Let gravity do it: gliding on a slope. Prediction: what slope angle is needed when λ = 0.8?
5. Critical taper: build the wedge. Subcritical, critical, supercritical. Salt vs strong basal detachments.
6. Frictional lock-up: σ1′/σ3′ vs θ, the optimum and the lock-up angle.
7. The low-angle normal-fault puzzle: a normal fault dipping 20° under vertical σ1 is locked. Candidate explanations: rotation after formation, weak fault rock, high Pf, and local stress rotation.
8. Weak mature faults: the evidence and the candidate mechanisms (context).
9. Final: diagnose which fix applies to a described fault.

**Geological payoff:** explains how the largest faults on Earth (thrust sheets, detachments) can move at all, and why fluid pressure and fault rock matter as much as rock strength.

**Misconceptions to target:** big thrust sheets are pushed like rigid blocks; any existing fault will reactivate if stress is high enough; thrust belts grow at random; fluid pressure only matters for earthquakes.

**Exact vs illustrative:** the force balance, L_max, the gliding condition, and Sibson's ratio are exact within their stated models. The critical-taper value is exact only if the approximation is verified; otherwise it is labeled illustrative. The wedge evolution animation is illustrative.

**Domain / scenes / tests:** `faultMechanics.js`: `basalShear(params)`, `pushStress(params)`, `maxSheetLength(params)`, `glideCondition(α, μ, λ)`, `taperState(α, β, params)`, `reactivationRatio(θ, μ)`, `optimalReactivationAngle(μ)`, and `lockUpAngle(μ)`. Tests: PSGT's 127 MPa and 90 MPa; λ = 0 vs 0.9; θ* for μ = 0.6 (about 29.5°) and lock-up (about 59°); ratio → ∞ at lock-up. Build the wedge section.

**Out of scope:** full critical-taper theory with cohesion and a curved topography, orogenic wedge thermal models, and core complexes beyond a mention (B17).

**Acceptance criteria:** the numbers match the domain tests; the sheet slides or breaks at the right thresholds; the lock-up angle in the plot matches the normal-fault block; the taper model and its status (exact or illustrative) are shown.

---

## B15 — Fault populations and paleostress

**Prerequisites:** B8, B9, B12, S8, O3. **Used later by:** B17, B18, (parked) Lab-mode fault-slip datasets.

**Learning objectives**
- Explain why a population of faults, formed in one stress field, carries information about that stress. List the assumptions: uniform stress, no later rotation, Wallace–Bott slip, planar faults, one event.
- Define the stress ratio φ and the **reduced stress tensor**. Show that adding a pressure or scaling the deviatoric stress changes no slip direction, so only the orientation of the axes and φ can be recovered (four unknowns).
- Predict the slip pattern of a population for given axes and φ (forward model), and see how φ changes it.
- Find the **kinematic P and T axes** of a population (Marrett & Allmendinger 1990) from B8's per-fault axes.
- Measure the fit of a trial stress by the **misfit angle** between observed and predicted slip, and run a visible **grid-search inversion**.
- Recognize mixed populations and separate them with field criteria (cross-cutting, mineral fill), not only by misfit.
- Use fault **size–frequency** power laws to estimate subseismic faults, and compute horizontal extension from summed heaves (B10).

**Math introduced:**
- φ = (σ2 − σ3)/(σ1 − σ3).
- The reduced tensor in principal axes, diag(1, φ, 0), rotated into NED. Invariance of the slip direction under σ → kσ + lI is shown numerically, not proved.
- Predicted slip ŝ_pred ∥ τ = σn − (n·σn)n (B8). Misfit angle ω = angle between ŝ_obs and ŝ_pred (0–180°, so a wrong sense scores badly).
- Grid search: minimize the mean ω over trial stresses. First a 2-parameter Andersonian search (SHmax trend × φ, for each regime) drawn as a misfit map, then the full 4-parameter search reported on the stereonet.
- The population's kinematic tensor, the sum over faults of the symmetric part of n̂ŝᵀ, with its eigenvectors as the shortening, intermediate, and extension axes (an M4/S8 eigenvector callback).
- Size–frequency: N(≥L) = a·L^(−C) on log–log axes. Extension e = Σ heave / L₀ along a section.

**Equation–model binding:**
- **The data.** A synthetic outcrop of 15–25 faults with slickenlines and senses, generated from a hidden stress with noise. Each fault is plotted on the stereonet as a great circle, with its pole and a slip arrow at the pole (the hanging wall's motion). B8's P and T axes build P and T clouds.
- **Forward model.** Axis and φ controls redraw the predicted arrows beside the observed ones. Each fault's ω is shown as a colored arc.
- **Search.** The misfit map (trend × φ) has a draggable cursor that sets the trial stress. A "run full search" button reports the best tensor and its mean misfit.
- **Mixed data.** A second event can be mixed in, with a subset selector.
- **Size and strain.** A size–frequency plot of a synthetic fault map, with extrapolation below seismic resolution, and a section whose summed heaves give e.

**Step outline**
1. Many faults, one stress: the outcrop and its stereonet.
2. What can be recovered: add pressure or scale the stress and see no slip direction change. φ and the reduced tensor.
3. The forward model: choose the axes and φ, and compare predicted with observed slip. Vary φ from 0 to 1.
4. The kinematic shortcut: P and T for every fault and the population axes. Prediction: where is the shortening axis?
5. Scoring a guess: the misfit angle.
6. Grid search you can see: the misfit map, and finding the minimum. Then the full search.
7. Two events in one outcrop: one tensor fits poorly. Separate the subsets with field criteria and refit.
8. Assumptions and limits, and P/T vs σ1/σ3 again (the B8 callback).
9. Size matters: size–frequency, subseismic faults, and extension from summed heaves (numeric prompt).

**Geological payoff:** paleostress and kinematic analysis of fault-slip data, a standard field and research method, done with understanding rather than as a black-box program.

**Misconceptions to target:** one fault gives the stress; P and T equal σ1 and σ3; inversion gives stress magnitudes; any fault set can be inverted together; fault maps show all the faults.

**Exact vs illustrative:** the forward model, the misfit, the grid search, and the kinematic tensor are exact given the data and assumptions. The data are synthetic and labeled.

**Domain / scenes / tests:** `paleostress.js`:
- `reducedStress(axes, φ)` and `predictedSlip(σ, n)` (reusing `resolvedShearDirection`)
- `misfitAngle(obs, pred)` and `gridSearch(faults, { mode, resolution })`
- `kinematicTensor(faults)` and `populationAxes(faults)`
- `syntheticPopulation(σ, count, noise, seed)`
- `sizeFrequency(lengths)` and `extensionFromHeaves(heaves, L0)`

Tests: a population generated from a known stress recovers its trend and φ within the grid step; invariance under kσ + lI; the axes of a single fault equal B8's P and T. Stereonet layers: slip arrows at poles, P/T clouds, and the misfit map as a separate `XYPlot`-style heat map.

**Out of scope:** least-squares (Angelier-type) inversion, absolute stress magnitudes, calcite-twin paleopiezometry, and focal-mechanism inversion beyond a mention.

**Acceptance criteria:** the grid search recovers the hidden stress on clean synthetic data; the misfit map's minimum matches the full search; mixed data are detectably worse; the P/T population axes are computed correctly.

---

## B16 — Faults, fluids, and the subsurface

**Prerequisites:** B8, B9, B10, B11. **Used later by:** (parked) Lab-mode reservoir and subsurface datasets.

**Learning objectives**
- Predict whether a fault is a conduit, a barrier, or both from its architecture (B11's F_a) and host rock. Recall that faults tend to raise permeability in low-porosity rock and lower it in porous rock.
- Explain the three kinds of seal: **juxtaposition seal** (reservoir against shale), **self-juxtaposed seal** (reservoir against itself, sealed by fault rock or cement), and **shale-smear seal**.
- Build and read a **triangle (juxtaposition) diagram** for a layered sequence and a range of throws.
- Compute the **shale smear factor** SSF = T/Δz and the **shale gouge ratio** SGR = Σ(V_sh·Δz)/T × 100%, and map SGR over a fault surface whose throw varies (B9's displacement map).
- Explain why relay ramps and fault splits can leak (B9 callback).
- Explain the limits of **seismic resolution** (throws below about 15–20 m are hard to see; subseismic faults).
- Identify faults in wells: missing and repeated section (B8), including a deviated well that crosses a normal fault less steeply than the fault dips and sees *repeated* section.
- Read **dipmeter** cusps as drag, and read a **borehole image**: a plane crossing a vertical well unwraps to a sinusoid with trough-to-peak height h = d·tan δ and its trough at the dip direction.

**Math introduced:**
- The triangle-diagram construction (hanging-wall and footwall stratigraphy separating linearly with throw).
- SSF = T/Δz (SSF ≤ 4 is often taken as a continuous smear for faults with tens of metres of offset).
- SGR = Σ(V_sh,i·Δz_i)/T × 100% over the interval that has slipped past a point (SGR above about 20% suggests a likely seal).
- Deviated-well crossing geometry.
- The borehole sinusoid: depth z(ψ) = z₀ + (d/2)·tan δ·cos(ψ − ψ_dip) around the azimuth ψ (depth positive down), so h = d·tan δ and the deepest point is at the dip direction (an M2 trig callback). The unwrapped image width is πd.

**Equation–model binding:**
- **Sealing.** A sand–shale sequence cut by a fault with a throw slider. The fault plane shows a juxtaposition strip and, on B9's varying-displacement fault, an SGR color map. The triangle diagram updates with the stratigraphy, a cursor at the current throw, and the matching column highlighted.
- **Seismic.** A synthetic seismic-like section (band-limited smearing of reflectors, illustrative) hides small faults while wells show them.
- **Wells.** A deviated-well tool changes the well's plunge, and the well log (B8's `WellLog.js`) shows missing or repeated beds.
- **Borehole images.** A borehole-image panel unwraps the well wall. Dragging a plane's dip and dip direction moves the sinusoid, and reading a sinusoid back returns the plane (numeric). A dipmeter track shows a drag cusp.

**Step outline**
1. Conduit, barrier, or both: the F_a callback, and crystalline vs porous.
2. Juxtaposition: slide the throw and watch sand meet sand or shale. The three seal types.
3. The triangle diagram: build it, then read the contacts at a given throw.
4. Shale smear: SSF and SGR. Numeric prompt: SGR at a point for a given sequence and throw. The SGR map on a fault whose throw dies out.
5. Leaks: relay ramps and split faults.
6. Seeing faults underground: seismic resolution and subseismic faults.
7. Faults in wells, including the deviated-well surprise. Prediction: a normal fault gives repeated section?
8. Dipmeter cusps and drag.
9. Borehole images: plane ↔ sinusoid, with a numeric check (dip from amplitude and borehole diameter).
10. Cores and rubble zones. Final: combine the evidence to place a fault and judge whether it seals.

**Geological payoff:** how faults control groundwater, hydrocarbons, CO₂ storage, and mineralization, and how geologists find and characterize faults they cannot see at the surface.

**Misconceptions to target:** all faults seal or all faults leak; a fault with large throw seals better; missing section always means normal and repeated always means reverse; a fault is visible on seismic data if it exists.

**Exact vs illustrative:** juxtaposition, the triangle diagram, SSF, SGR, the well geometry, and the borehole sinusoid are exact. The seismic-like image is illustrative. The sealing thresholds are empirical rules of thumb, labeled so.

**Domain / scenes / tests:** `subsurface.js`:
- `juxtaposition(strat, throw)` and `triangleDiagram(strat, throwMax)`
- `shaleSmearFactor(T, dz)` and `shaleGougeRatio(strat, throw, depth)`
- `wellFaultCrossing(well, fault, strat)`
- `boreholeSinusoid(d, dip, dipDir)` and `planeFromSinusoid(h, d, troughAz)`
- `dipmeterProfile(dragModel, well)`

Tests: hand SGR cases; h = d·tan δ; the inverse returns the plane; the deviated-well case reproduces repeated section. Build the triangle diagram and the unwrapped borehole view. Reuse `WellLog.js` and B9's fault surface.

**Out of scope:** capillary threshold pressures and column heights, reservoir simulation, seismic processing, the clay smear potential formula (a mention), and real datasets (Lab mode).

**Acceptance criteria:** the triangle diagram agrees with the section at every throw; SGR maps correctly over a varying-throw fault; the borehole sinusoid round-trips; the deviated-well repeat is reproduced.

---

# Taught after Unit 6

B17 and B18 need fault-bend and fault-propagation folds (F6), and B18 also needs simple and pure shear (D5, D6). They come after Unit 6 in the teaching order. Plate-scale tectonics (plate kinematics, orogens, rifted margins as plate boundaries) stays parked; these lessons stay at the scale of a map sheet or a seismic survey.

---

## B17 — Extensional and contractional fault systems, and inversion

**Prerequisites:** B9, B10, B14, B15, F6. **Used later by:** B18, (parked) balanced sections and tectonics.

**Learning objectives**
- **Extensional systems:** describe half-grabens and horst-and-graben systems, domino (rigid rotating) blocks, listric faults with hanging-wall rollover and antithetic faults, relay and accommodation zones between segments (B9), and low-angle detachments and core complexes (B14's lock-up puzzle).
- Compute stretching for domino blocks from the fault's initial and present dip, and extension from summed heaves (B15).
- **Contractional systems:** describe ramp–flat thrusts and their hanging-wall and footwall cutoffs, fault-bend and fault-propagation folds over them (F6), imbricate fans, and duplexes (floor thrust, roof thrust, horses, and antiformal stacks). Describe in-sequence (piggyback) and out-of-sequence thrusting, thin-skinned vs thick-skinned deformation, and klippen and windows. Estimate shortening from bed-length restoration.
- Relate thrust-belt growth to critical taper (B14).
- **Inversion:** explain how a normal fault reactivated in compression produces harpoon structures and a null point, and why old rift faults control later mountain belts (B6 reactivation callback).

**Math introduced:**
- **Domino stretching:** β = sin δ₀ / sin δ for rigid blocks whose faults rotate from dip δ₀ to δ, with a bed tilt of δ₀ − δ.
- Extension from heaves (B15).
- **Shortening:** e = (L − L₀)/L₀ from restored bed length (a line-length restoration shown for one bed, as a construction).
- The inversion null point: the level where the net offset returns to zero.

**Equation–model binding:**
- **Extensional section.** A section-plus-3D system builder. A domino panel with a rotation slider shows the fault dip, bed tilt, and β live. A listric panel reuses F6's rollover construction, and a half-graben fills with growth strata (B10's expansion index).
- **Contractional section.** A thrust panel builds imbricates or a duplex step by step, with cutoffs labeled; F6's fault-bend-fold machinery supplies the folds. A bed-length gauge compares the deformed and restored lengths.
- **Klippen and windows.** A map/erosion slider exposes klippen and windows in 3D.
- **Inversion.** An inversion panel reverses the slip on a half-graben fault and tracks the null point.

**Step outline**
1. Half-grabens and horst-and-graben systems.
2. Domino blocks: rotate and compute β. Numeric prompt: faults from 60° to 45° gives what β?
3. Listric faults and rollover, with antithetic faults (F6 callback).
4. Segments, relays, and accommodation zones at system scale (B9 callback). Detachments and core complexes (B14 callback).
5. Ramps, flats, and cutoffs.
6. Imbricate fans and duplexes: build one. Prediction: which horse formed first?
7. Klippen and windows on an eroded map.
8. Shortening from restored bed length, and critical taper at system scale (B14).
9. Inversion: harpoons and the null point.
10. Final: interpret a system section and name its elements.

**Geological payoff:** reading rift basins and fold–thrust belts on maps, sections, and seismic data, the everyday structural settings of exploration and regional mapping.

**Misconceptions to target:** normal faults only drop blocks without rotating them; thrusts cut straight through stratigraphy; the youngest thrust is always at the front; inverted faults are simply reverse faults.

**Exact vs illustrative:** domino β, heave sums, line-length shortening, and the null-point geometry are exact within their models. The system-building animations are illustrative, and the F6 constructions keep their own labels.

**Domain / scenes / tests:** `faultSystems.js`: `dominoStretch(δ0, δ)`, `lineLengthShortening(deformed, restored)`, `duplexBuilder(params)`, `imbricateBuilder(params)`, and `inversionNullPoint(section)`. Tests: β = 1 at no rotation, the 60°→45° hand case, and shortening of a known restored bed. Extend F6's section and B10's cross-section view.

**Out of scope:** full section balancing and restoration (Lab mode), salt tectonics, plate-scale rifting and orogeny (parked), and thermal subsidence.

**Acceptance criteria:** the domino β and heave sums agree; duplexes and imbricates are built with correct cutoffs; the klippe and window appear under erosion; the inversion null point is computed and shown.

---

## B18 — Strike-slip fault systems

**Prerequisites:** B10, B12, B15, B17, D5, D6, F6. **Used later by:** (parked) transpression at plate scale and tectonics.

**Learning objectives**
- Describe strike-slip fault zones as they grow: Riedel shears at map scale (B12), en échelon folds, then a through-going fault.
- Predict **restraining and releasing bends and stepovers** from the sense of slip and the step direction: for a dextral fault a left step is restraining and a right step is releasing, and the reverse for a sinistral fault. Describe pull-apart basins, push-ups (pop-ups), and horsetail splays.
- Explain **positive and negative flower structures** in section.
- Describe **transpression and transtension** as combinations of simple shear along the zone and shortening or extension across it (D5/D6 callback), and mention strain partitioning.
- Distinguish transfer (tear) faults within fold–thrust belts or rifts from large transcurrent and transform faults (context only).

**Math introduced:**
- **Bend kinematics:** a fault segment turned θ from the slip direction carries slip s with a component s·sin θ across it (convergence or divergence) and s·cos θ along it.
- **Stepover type** from the signs of the sense and the step.
- **Transpression:** relative motion v at angle α to the zone splits into v·cos α along it (simple shear) and v·sin α across it (pure-shear shortening or extension). The combined velocity field is shown with D6's flow tools.

**Equation–model binding:**
- **Map view.** A map-view strike-slip block (extruded to 3D) with a draggable bend or stepover. The across-bend component is drawn and colored convergent or divergent, and a pull-apart basin or push-up grows accordingly.
- **Sections.** A section slider shows the flower structure below.
- **Riedels.** A clay-cake / Riedel panel reuses B12 at map scale, with en échelon folds oriented from the strain ellipse (D5 callback).
- **Transpression.** A transpression panel sets α and shows the velocity field, the strain ellipse, and the resulting fold and fault orientations.

**Step outline**
1. Growing a strike-slip zone: Riedels, en échelon folds, and a through-going fault (B12 callback).
2. Bends and stepovers. Prediction: dextral fault, left step. Basin or push-up?
3. The bend math: s·sin θ across the bend. Numeric prompt.
4. Pull-aparts, push-ups, and horsetails.
5. Flower structures in section, positive and negative.
6. Transpression and transtension from α: velocity fields and strain (D5/D6).
7. Strain partitioning (context), and transfer vs transcurrent faults.
8. Final: interpret a strike-slip map with bends, basins, and folds.

**Geological payoff:** reading strike-slip systems such as the San Andreas and the North Anatolian faults at map and seismic scale, and knowing where basins, uplifts, and traps form along them.

**Misconceptions to target:** strike-slip faults are straight and cause no vertical motion; a step in either direction makes a basin; flower structures mean the sense of slip changed.

**Exact vs illustrative:** the bend kinematics, the stepover rule, and the transpression velocity split are exact. Basin and push-up growth and the flower-structure sections are illustrative.

**Domain / scenes / tests:** `strikeSlip.js`: `bendKinematics(s, θ)`, `stepoverType(sense, step)`, and `transpressionVelocity(v, α)` → components and a D6 velocity-gradient tensor. Tests: dextral + left = restraining, and so on; θ = 0 gives no convergence; α = 0 gives pure wrench. Reuse B12's Riedel panel and the D6 flow tools.

**Out of scope:** plate-boundary transforms as plate kinematics (parked), full 3D transpression strain theory beyond D5–D7, and paleomagnetic block rotations.

**Acceptance criteria:** the bend and stepover predictions match the rule for all four sense/step combinations; the across-bend component is correct; transpression reduces to simple or pure shear at its limits.
