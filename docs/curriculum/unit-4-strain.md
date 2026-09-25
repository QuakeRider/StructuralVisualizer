# Unit 4 — Deformation and strain

**Frame:** abstract x/y/z while building deformation math (D1, D2, D4–D7). Switch to NED/outcrop framing, explicitly, for geological measurement (D3, D8).

**Unit purpose:** describe how rocks *change shape*, in the same matrix language used for stress. The key idea is **x' = F x**: a matrix maps original positions to deformed positions, and the strain ellipse/ellipsoid is what that matrix does to a circle or sphere (M4 callback). Throughout, the unit contrasts strain with stress: **same mathematics, different physical meaning.** Stress is a state of force intensity now; strain is a record of shape change.

**Shared infrastructure first built here:**
- **Marker-grid deformation view** (D1): a grid or cloud of markers (points, lines, circles, fossils) in 2D and 3D, mapped by F with displacement arrows. Supports homogeneous F and simple heterogeneous fields.
- **Strain-ellipse / ellipsoid overlay** (D4): principal axes, lines of no finite elongation, and a Flinn-diagram plot.
- **Time-scrubber for deformation paths** (D5, D7): incremental F applied step by step.
- **Flow-field overlay** (D6): velocity arrows, particle paths, ISA, and flow apophyses on the marker grid.

The existing `deformation.js` (qualitative stress → shape mapping) is **not** reused for strain here. Strain lessons take F as their input directly. The stress-to-strain link is Unit 5's job.

---

## D1 — Components of deformation

**Prerequisites:** M4, S10. **Used later by:** D2–D8, R1.

**Learning objectives**
- Split deformation into translation, rotation, distortion (shape change), and dilation (volume change).
- Describe deformation with displacement vectors at markers, and as a matrix F acting on position vectors (`x' = F x + t`).
- Read rotation, stretching, and shearing from F. Use det F as the area/volume scale factor.

**Math introduced:** `u = x' − x` (displacement vector); `x' = F x + t`; det F = area (2D) or volume (3D) ratio; examples of pure rotation, pure stretch, and simple shear F.

**Equation–model binding:** the marker grid with displacement arrows (component boxes on a highlighted marker). Editable F entries, where columns are the images of the unit square's edges (M4 callback). A translation vector control. Live det F with a colored area/volume patch.

**Step outline**
1. Translation only: every arrow is the same. No strain.
2. Rotation only: the arrows differ, but the shape is unchanged. No strain.
3. Stretch: the shape changes. Distortion.
4. Area/volume change: det F ≠ 1. Dilation.
5. Any deformation combines all four. Edit F and identify the components.
6. Deformation vs strain: strain is the distortion + dilation part, the change of points *relative to each other*.
7. *Jump to 3D:* a cube of markers, with a 3×3 F.

**Geological payoff:** Separates what moved (translation/rotation, e.g. a thrust sheet carried far) from what deformed (strain recorded in fossils or pebbles).

**Misconceptions to target:** displacement means strain; rotation is a type of strain.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** new `src/domain/strain.js` with `applyF`, `displacementField`, `decomposeRotationStretch` (polar decomposition, used in D5), and `detF`, with tests. Build the marker-grid view.

**Out of scope:** velocity gradients and continuum mechanics formalism beyond F; index notation.

**Acceptance criteria:** the four components can each be isolated; det F is shown with an area/volume patch; there are 2D and 3D versions.

---

## D2 — Homogeneous vs heterogeneous deformation

**Prerequisites:** D1. **Used later by:** D3, D4, D8, F4.

**Learning objectives**
- State the geometric tests for homogeneous deformation: straight lines stay straight, parallel lines stay parallel, and circles become ellipses (spheres become ellipsoids).
- Recognize heterogeneous deformation where F varies with position.
- Explain that homogeneity depends on scale: a folded layer is heterogeneous overall but approximately homogeneous in small domains.

**Math introduced:** constant F vs F(x) varying with position. Local approximation: a small enough region behaves homogeneously.

**Equation–model binding:** marker grid with circles; a toggle between constant F and a simple varying field (for example, a shear zone profile or a bend). A zoom lens: zoom into a heterogeneous region and watch the local circles become near-perfect ellipses, with the local F displayed.

**Step outline**
1. Homogeneous tests, demonstrated live.
2. Break them: a varying field. Prompt: which test fails first?
3. Zoom in: heterogeneous at large scale, homogeneous locally.
4. *Geology:* a folded bed, and a shear zone with deformed pebbles.

**Geological payoff:** Justifies analyzing strain in domains, which is how strain is measured in outcrop.

**Misconceptions to target:** strain in rocks is uniform; heterogeneous strain can't be analyzed.

**Exact vs illustrative:** exact for defined fields.

**Domain / scenes / tests:** `sampleField(Ffn, x)` and `localF(field, x, h)` (a finite-difference gradient) in `strain.js`, with tests.

**Out of scope:** general continuum fields and compatibility equations.

**Acceptance criteria:** a toggle between homogeneous and heterogeneous; the zoom lens shows the local F converging to homogeneous behavior.

---

## D3 — Measuring strain

**Prerequisites:** D2. **Used later by:** D4, D8, F4.

**Learning objectives**
- Compute elongation e, stretch S, and quadratic elongation λ for a line, and convert among them.
- Compute angular shear ψ and shear strain γ = tan ψ from lines that were originally perpendicular.
- Compute volumetric strain.
- Measure these on deformed fossils in an outcrop view (the switch to an outcrop/NED frame is shown).

**Math introduced:** `e = (l − l₀)/l₀`; `S = l/l₀ = 1 + e`; `λ = S²`; `γ = tan ψ`; `Δ = (V − V₀)/V₀ = det F − 1`.

**Equation–model binding:** a marker line with l₀ (ghost) and l (current); the formulas substitute live. A pair of originally perpendicular lines with a ψ arc. Deformed fossils (a brachiopod hinge line and midline, a belemnite with boudinaged segments) with measurement tools the student drags into place.

**Step outline**
1. Length change: e, S, λ. Why three measures? Different ones make different formulas simpler.
2. Angle change: ψ and γ. Prediction: "γ for ψ = 45°?" (1).
3. Volume change.
4. Frame switch: move from the abstract grid to an outcrop surface (NED).
5. Brachiopod: use the originally perpendicular hinge and midline to measure ψ.
6. Belemnite: measure stretch from pulled-apart segments.
7. Numeric prompts with tolerances.

**Geological payoff:** Real strain markers (fossils, boudins, pebbles).

**Misconceptions to target:** γ equals ψ in degrees; e and S are interchangeable.

**Exact vs illustrative:** exact; the fossil shapes are schematic.

**Domain / scenes / tests:** `elongation`, `stretch`, `quadraticElongation`, `shearStrain(ψ)`, and `volumetricStrain(F)` in `strain.js`, with tests. Fossil marker assets.

**Out of scope:** logarithmic (natural) strain (optional aside), and statistics of multiple markers (D8).

**Acceptance criteria:** each measure is bound to its geometry; the fossil measurement tools work; the numeric prompts check tolerances.

---

## D4 — The strain ellipse and ellipsoid

**Prerequisites:** D3, M4, S8 (for the contrast). **Used later by:** D5–D8, R2, F4; also R1, F5.

**Learning objectives**
- Show that homogeneous deformation maps a circle to an ellipse and a sphere to an ellipsoid, with principal stretches S1 ≥ S2 ≥ S3 along perpendicular principal axes.
- Compute the principal stretches and directions from F using `B = F Fᵀ` (eigenvalues = S², eigenvectors = the axes in the deformed state).
- Identify lines of no finite elongation, and the fields of lengthening and shortening.
- Classify 3D strain on a Flinn diagram (a = S1/S2, b = S2/S3, k = (a−1)/(b−1)): prolate/constrictional, oblate/flattening, and plane strain.
- **Contrast with stress:** the stress ellipsoid and strain ellipsoid use the same eigen math, but one is a force-intensity state and the other a shape change. Their axes need not coincide.

**Math introduced:** `B = F Fᵀ`; `B e = S² e`; `S = 1` on lines of no finite elongation; Flinn parameters. The Mohr circle for strain is an optional aside only.

**Equation–model binding:** the unit circle/sphere of markers deforming into an ellipse/ellipsoid with S1, S2, S3 axes (double-headed, labeled). The `F Fᵀ` matrix shows eigen results live. Sectors of lengthening and shortening are shaded, and lines of no finite elongation are dashed. A Flinn-diagram plot with the current strain as a point that moves as F is edited. A side-by-side "stress ellipsoid vs strain ellipsoid" panel.

**Step outline**
1. Circle → ellipse (2D): principal axes, and why they are perpendicular.
2. Principal stretches from `F Fᵀ` (the M4 eigen callback, bound to the ellipse axes).
3. Fields of lengthening and shortening, and lines of no finite elongation. Prediction: which marker lines are unchanged in length?
4. *Jump to 3D:* sphere → ellipsoid; S1 ≥ S2 ≥ S3.
5. Flinn diagram: prolate, oblate, and plane strain. Prompts: classify pebble shapes.
6. Stress vs strain ellipsoid: same math, different meaning. Prompt: "Must the strain ellipsoid's long axis parallel σ3?" (Not in general. Coaxial vs non-coaxial, D5.)
7. *Geology:* deformed conglomerate pebbles (cigar vs pancake shapes).

**Geological payoff:** The strain ellipsoid is the core descriptor of ductile deformation. It links to foliation and lineation (parked) and to fold strain (F4).

**Misconceptions to target:** the strain ellipse is the same as the stress ellipse; the principal axes of F's columns are the strain axes.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `principalStrains(F)` → { stretches, axes } using `eigenSymmetric3` on `F Fᵀ`, `flinnParameters`, and `linesOfNoFiniteElongation2D` in `strain.js`, with tests. A Flinn-diagram plot component.

**Out of scope:** Hsu/Lode parameters and log-Flinn (optional aside), and Mohr circle for strain (optional aside).

**Acceptance criteria:** the ellipse/ellipsoid axes match the eigen solution; the Flinn point updates live; the stress-vs-strain contrast step is present.


---

## D5 — Coaxial and non-coaxial deformation: pure shear, uniaxial strain, and simple shear

**Prerequisites:** D4, M2. **Used later by:** D6, D7, R5, F4, (parked) shear zones; also R3.

**Learning objectives**
- Write F for pure shear `[[k, 0], [0, 1/k]]`, **uniaxial strain** (for example vertical compaction `diag(1, 1, 1 − e)`), and simple shear `[[1, γ], [0, 1]]`, and describe their geometric differences, including volume change.
- Distinguish coaxial deformation (principal axes stay parallel to the same material lines) from non-coaxial deformation (they don't).
- Show that the same finite strain ellipse can arise from different paths.
- Show that the order of superposed deformations matters (`F₂F₁ ≠ F₁F₂`).

**Math introduced:** the three F forms. det F for each: pure shear and simple shear preserve area/volume; uniaxial strain does not, and its volume loss equals its shortening (`det F = 1 − e`). Matrix multiplication for superposition. Rotation of principal axes with increasing γ (`tan 2θ' = 2/γ`, shown). The polar decomposition F = RU is shown visually (rotation × stretch), without heavy notation.

**Equation–model binding:** blocks side by side (pure shear, uniaxial strain, simple shear) with marker circles, ellipses, and material lines, driven by a shared time scrubber. The principal axes are drawn with the material lines that currently lie along them highlighted, so rotation is visible. A det F readout with an area/volume patch. A superposition panel: apply F₁ then F₂, and the reverse, and compare.

**Step outline**
1. Pure shear: stretch one way, shorten the other. The axes stay fixed relative to the material.
2. Uniaxial strain: shorten one way, with no change in the other directions. The volume drops. Prompt: which Flinn field does it plot in (D4)? *Geology:* burial compaction of sediments.
3. Simple shear: slide layers like a deck of cards. The axes rotate.
4. Prediction: "After γ = 2, what angle does the long axis make with the shear plane?"
5. Same ellipse, different path: find a pure shear that gives the simple-shear ellipse's shape. The difference is the rotation.
6. Order matters: F₂F₁ vs F₁F₂ (for example, compaction and then shearing vs the reverse).
7. *Jump to 3D:* 3D simple shear (a shear zone block) and 3D compaction.
8. *Geology:* shear zones and asymmetric features (kinematic indicators are parked; a preview image only), and compacted sediment layers.

**Geological payoff:** Coaxial vs non-coaxial strain is central to interpreting shear zones and fold development. Uniaxial strain describes basin compaction and sets up the stress reference state in R5.

**Misconceptions to target:** simple shear is "simpler" physically; the finite ellipse tells you the path; strain can't change volume.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `pureShearF(k)`, `uniaxialStrainF(e, axis)`, `simpleShearF(γ)`, `compose(F₂, F₁)`, and `polarDecomposition(F)` in `strain.js`, with tests.

**Out of scope:** flow parameters (D6).

**Acceptance criteria:** principal-axis rotation is visible in simple shear and absent in pure shear and uniaxial strain; volume change is shown for uniaxial strain; the path-equivalence demonstration works; composition order changes the result.

---

## D6 — Flow: velocity fields, ISA, flow apophyses, and vorticity

**Prerequisites:** D5, M4. **Used later by:** D7, F4, (parked) shear zones and transpression; also F6.

**Learning objectives**
- Distinguish **flow parameters** (what is happening at an instant) from **finite strain** (what has accumulated), and say when they are related (steady-state flow).
- Describe a homogeneous flow by its velocity field `v = L x`, and split the velocity gradient L into a symmetric stretching-rate part and an antisymmetric spin part.
- Find the **instantaneous stretching axes (ISA)** as the eigenvectors of the stretching-rate matrix (the M4 symmetric eigen callback), and state that in simple shear they sit at 45° to the shear plane.
- Identify **flow apophyses** as the material lines that do not rotate (the eigenvectors of L). They are perpendicular in pure shear, coincide in simple shear, and are oblique in subsimple shear. Recognize the particle paths they separate.
- Define the **kinematic vorticity number** Wk (0 for pure shear, 1 for simple shear), and explore **subsimple shear** (0 < Wk < 1) as the family between them.
- Explain that the ISA are not the principal stress axes, and are not the finite strain axes, except in special cases.

**Math introduced**
- `v = L x`; `L = D + W` with `D = ½(L + Lᵀ)` (stretching rate) and `W = ½(L − Lᵀ)` (spin).
- ISA: `D e = λ e` (symmetric, so the axes are perpendicular).
- Flow apophyses: directions where `L a ∥ a`. They are shown visually and found numerically. The lesson notes that L is not symmetric, so the directions need not be perpendicular.
- 2D steady flow `L = [[ε̇, γ̇], [0, −ε̇]]`: `Wk = γ̇ / √(4ε̇² + γ̇²)`, and equivalently Wk = cos of the angle between the apophyses.
- Stepping the flow: `F(t + Δt) ≈ (I + L Δt) F(t)`, which connects to D7.

**Equation–model binding:** a flow field of arrows (v = Lx) over the marker grid, with particles tracing their paths. Editable ε̇ and γ̇, with a Wk slider that morphs from pure shear through subsimple to simple shear. The ISA drawn as a fixed cross, and the flow apophyses as highlighted material lines. L, D, and W are shown as matrices with their eigen results live. The finite-strain ellipse grows alongside, so the ISA and the finite axes can be compared.

**Step outline**
1. Velocity field: arrows show how fast and in which direction each point moves *right now*. The matrix is L.
2. Split L into stretching and spin (a symmetric + antisymmetric decomposition). Prediction: which part rotates material?
3. ISA from the stretching part: the eigenvectors (M4 callback). In simple shear they sit at 45°.
4. Flow apophyses: lines that don't rotate. Particle paths: hyperbolas in pure shear, straight lines in simple shear.
5. Wk: slide from 0 to 1 and watch the apophyses close up. Subsimple shear is everything in between.
6. ISA vs finite strain axes vs stress axes: three different things. Prompt: "Are the ISA the stress axes?"
7. *Jump to 3D:* 3D flow with three ISA; a transpression-style example mentioned only.
8. *Geology:* why shear zones are often subsimple (thinning or thickening shear zones), and how structures record flow.

**Geological payoff:** The language of modern shear-zone and ductile-flow analysis. It explains how rocks accumulate strain, and gives the tools (ISA, apophyses) used to interpret progressive deformation (D7).

**Misconceptions to target:** ISA = strain axes = stress axes; vorticity means rigid rotation; simple shear and pure shear are the only possibilities.

**Exact vs illustrative:** exact for homogeneous steady flow.

**Domain / scenes / tests:** `velocityGradient(ε̇, γ̇)`, `splitSymAntisym(L)`, `isa(L)`, `flowApophyses(L)` (a 2×2 general eigen solve, plus the 3D case), `kinematicVorticity(L)`, and `stepFlow(F, L, dt)` in `strain.js`, with tests (Wk = 0, 1, and intermediate). A flow-field overlay on the marker grid.

**Out of scope:** non-steady flows beyond one example, vorticity gauges and Wk estimation from rocks (parked with shear zones), and continuum-mechanics derivations.

**Acceptance criteria:** the ISA, apophyses, and Wk agree with the analytic results for pure, simple, and subsimple shear; particle paths match the apophyses; the three-kinds-of-axes comparison is shown.

---

## D7 — Progressive deformation

**Prerequisites:** D6. **Used later by:** F4, F5, F7.

**Learning objectives**
- Distinguish incremental strain from finite (accumulated) strain, and use the ISA (D6) as the incremental axes.
- Track a material line through a deformation history. Lines in some sectors shorten and then lengthen as they rotate through the ISA fields.
- Compare progressive pure shear, simple shear, and subsimple shear histories that reach similar finite strains.
- Interpret structures that record this, such as veins that were folded and then boudinaged.

**Math introduced:** `F_total = Fₙ⋯F₂F₁`, with each increment from `I + L Δt` (D6); the fields of instantaneous shortening and stretching bounded by the lines of no instantaneous stretching; a material line's history of stretch over time.

**Equation–model binding:** the time scrubber applies increments. The ISA fields (instantaneous shortening and stretching sectors, fixed for steady flow) and the finite ellipse are both shown. Tracked marker lines are colored by their history (shortening → lengthening). A vein marker folds, then boudinages. A Wk selector compares histories.

**Step outline**
1. Apply small steps; the finite ellipse grows while the ISA stay fixed (steady flow).
2. In simple shear the finite axes rotate toward the shear plane; the ISA don't.
3. Track a line: it shortens while in the shortening field, then lengthens after rotating into the stretching field. Prediction for a chosen line.
4. Folded-then-boudinaged vein: explain it with the fields.
5. Same finite ellipse from Wk = 0, 0.7, and 1 histories, with different line histories.
6. *Geology:* the vein arrays and boudins seen in shear zones.

**Geological payoff:** Explains apparently contradictory structures in one outcrop as a single progressive history.

**Misconceptions to target:** folds and boudins must come from separate events; finite strain reveals the history.

**Exact vs illustrative:** the kinematics are exact; the fold and boudin graphics of the vein are illustrative.

**Domain / scenes / tests:** `progressiveHistory(L, dt, n)` and `lineHistory(line, history)` in `strain.js`, with tests.

**Out of scope:** strain partitioning, and time-varying flow types beyond one example.

**Acceptance criteria:** the ISA fields and finite ellipses are shown together; line histories are correct; the Wk comparison works; the vein example is present.

---

## D8 — Strain measurement methods

**Prerequisites:** D4, D3. **Used later by:** F4, and a (parked) Lab mode.

**Learning objectives**
- Use deformed fossils with originally perpendicular lines: the **Wellman construction** (building the strain ellipse from several distorted perpendicular pairs) and the **Breddin graph** (angular shear vs orientation, read against curves of strain ratio R).
- Explain and apply the Rf/φ method (final axial ratio vs orientation of initially elliptical objects), including how an initial fabric shows up.
- Explain and apply the Fry method (center-to-center point cloud), and the center-to-center idea behind it.
- Combine strain ellipses from 2–3 perpendicular sections into a 3D ellipsoid (conceptually, with a guided construction).
- Explain the pitfalls: a competence contrast between markers and matrix, an initial fabric, and volume change.

**Math introduced**
- Wellman: each originally perpendicular pair constrains points on the strain ellipse. The construction is geometric (and shown on screen).
- Breddin: the shear strain of an originally perpendicular pair as a function of its deformed angle θ′ from the long axis, `γ = (λ′₂ − λ′₁) sin θ′ cos θ′` with `λ′ = 1/λ` (the sign convention is declared at build time), plotted as a family of curves for different R.
- Rf/φ: the envelope of (Rf, φ) points and its relation to Rs (the strain ratio).
- Fry: plot all center-to-center vectors; the vacancy ellipse reflects the strain ellipse.
- Combining sectional ellipses into an ellipsoid (guided, not general).

**Equation–model binding:** a bedding surface with deformed brachiopods and trilobites (generated from a known F, with the true answer hidden until reveal). The student marks hinge and midline pairs, and the Wellman construction and Breddin plot build live. A synthetic deformed conglomerate or oolite sample generates Rf/φ and Fry plots. The student fits an ellipse, and then the true F is revealed for comparison. A 3D block with three section faces, each with its measured ellipse, and the assembled ellipsoid.

**Step outline**
1. Fossils with right angles: measure ψ for several fossils in different orientations.
2. Breddin graph: plot the points and find the best-fitting R curve. Wellman construction as the geometric equivalent.
3. Rf/φ: measure the objects; the plot builds; estimate Rs.
4. Fry: build the point cloud; find the vacancy ellipse.
5. Compare all estimates with the hidden true strain. Discuss the error sources (initial fabric, competence contrast, volume change).
6. Three sections → 3D ellipsoid → Flinn point (D4 callback).

**Geological payoff:** How strain is actually measured in the field and lab.

**Misconceptions to target:** individual objects give exact strain; initial shapes are circles; stiff pebbles record the full rock strain.

**Exact vs illustrative:** the synthetic data are generated exactly from F; the fitting is an estimate (stated).

**Domain / scenes / tests:** `generateMarkers(F, n, initialRatioSpread)`, `generateFossils(F, n)`, `breddinCurves(Rs)`, `wellmanConstruction(pairs)`, `rfPhiData`, and `fryPoints` in `strain.js`, with deterministic seeded tests.

**Out of scope:** statistical fitting algorithms (for example the Robin or Mulchrone methods), and real-image analysis. These are candidates for Lab mode. The Mohr circle for strain is an optional aside only.

**Acceptance criteria:** all four methods recover a known strain within a stated tolerance on synthetic data; the 3D assembly step works.
