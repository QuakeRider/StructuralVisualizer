# Unit 2 — Stress

**Frame:** abstract x/y/z while building the concept (S1–S6). The tensor and its principal-axis transformation are pure math, and principal stress vectors depend on that transformation. The unit switches to **NED at S7**, as an explicit step, when planes are specified by strike/dip and stress is discussed in the Earth.

**Sign convention:** compression positive. The on-screen traction convention is fixed in S4 (see the note there) and never changes afterward.

**Unit purpose:** build from force → traction on a plane → stress at a point → the stress tensor → principal stresses → Mohr diagrams → stress states in the Earth. The central idea is **one tensor gives the traction on every plane through a point (`t = σn`).** Everything else in the unit is a way of seeing that.

**Explicitly not in this unit:** moments, torques, reactions, section cuts, internal resultants, bending, or torsion (binding decision 1).

**Shared infrastructure first built here:**
- **2D-slice view** (S4): a square element shown as a slice through the 3D cube, so the jump to 3D is a reveal rather than a new scene.
- **Mohr plot renderer** (S5/S6): σn–τ axes; circles, points, envelopes, and shaded regions; linked selection with the scene. B3–B6 extend it. *An early SVG version, `src/visualization/MohrPlot.js`, was built by B7 (0.8.0, built early). It draws one σ1–σ3 circle at Coulomb failure with fixed teaching values, the fault points at ±2θ, and φ. It binds to equations through `data-ref`. S5/S6 should generalize it (any σ, interactive points) instead of starting over.*
- **Plane-through-a-point widget in a stressed cube** (S7): an arbitrary plane (by normal, or by strike/dip in NED) with traction, normal, and shear arrows.

---

## S1 — Force

**Prerequisites:** M1. **Used later by:** S2, S4.

**Learning objectives**
- Describe force as a vector with units (N), and distinguish body forces (gravity) from surface forces (contact).
- Compute resultants of several forces by components.
- State the balance condition for a rock element that is not accelerating (ΣF = 0), and show that the forces on the two sides of any imaginary plane are equal and opposite.

**Math introduced:** `F = m a` (only to define the newton); weight `W = m g`; resultant `R = ΣFᵢ` by components; balance `ΣF = 0`.

**Equation–model binding:** a rock cube with draggable force vectors and component boxes, plus a resultant arrow built tip-to-tail. For the balance step, an imaginary plane splits the cube, and the equal-and-opposite pair of forces across it is drawn and labeled.

**Step outline**
1. Force as a vector, using the M1 vector glyph. Now it has units: N, kN, MN.
2. Body vs surface forces: gravity acting on the whole volume vs a push on a face. Brief geology context: overburden, tectonic push.
3. Several forces → one resultant, by components. Numeric prompt.
4. A stationary block: the forces must sum to zero. Prediction: "Drag the third force so the block stays put."
5. An imaginary plane through the block: each side pushes the other equally and oppositely. This is the doorway to traction ("how intense is that push on the plane?").
6. Scale of geological forces: why force alone is not useful (it depends on how big the block is). This motivates S2.

**Geological payoff:** Overburden weight and tectonic forces, and the recognition that "force" is the wrong quantity for comparing rocks. Traction and stress are needed.

**Misconceptions to target:** bigger rock → bigger "stress"; balanced forces mean no forces.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `vector.js` (M1). Reuse the Build 00 force lab with multiple force arrows.

**Out of scope:** moments and rotation, acceleration or dynamics, supports and reactions.

**Acceptance criteria:** multiple-force resultant and balance interactions work; the equal-and-opposite pair across the imaginary plane is shown.

---

## S2 — Force vs traction

**Prerequisites:** S1, M2. **Used later by:** S3, S5 (double-angle forms).

**Learning objectives**
- Define traction as force per unit area on a specified plane, `t = F/A`, and convert N/m² → Pa → MPa.
- Show that for a fixed force, an inclined plane has a larger area (`A = A₀/cos θ`).
- Derive the normal and shear traction on an inclined plane under a uniaxial load: `σn = σ₀ cos² θ`, `τ = σ₀ sin θ cos θ`. Explain why these differ from the force components (`F cos θ`, `F sin θ`).

**Math introduced**
- `t = F/A`, units, and orders of magnitude (1 MPa = 10⁶ Pa, the weight of about 40 m of rock per m²).
- Inclined plane: `A = A₀ / cos θ`; `Fn = F cos θ`, `Fs = F sin θ`; hence `σn = (F/A₀) cos² θ` and `τ = (F/A₀) sin θ cos θ`.
- Double-angle link (M2): `σn = ½σ₀(1 + cos 2θ)`, `τ = ½σ₀ sin 2θ`, with a preview of S5.

**Equation–model binding**
- A prism under a uniaxial load (the force arrow and cross-sectional area A₀). An inclined cut plane, rotated by dragging θ, shows its area patch growing (the area readout ↔ `A`), the force components ↔ `Fn`, `Fs`, and the traction components ↔ `σn`, `τ`.
- A live plot beside it: `F cos θ` vs `σ₀ cos² θ`, and `F sin θ` vs `σ₀ sin θ cos θ`, as θ sweeps.
- Reuses the contact patch and distributed-load arrows from the current force lab for `t = F/A`.

**Step outline**
1. `t = F/A`: same force, change the area → traction changes. Unit conversion shown in full (the existing 5 kN / 100 cm² = 0.50 MPa task is kept).
2. Tilt the plane. Prediction: "Does the area change?" Show `A = A₀ / cos θ`.
3. Resolve the force into normal and shear parts on the tilted plane (M2 projection).
4. Divide by the *new* area: this is the key step. Show the extra cos θ appear.
5. Plot and compare: force components vs traction components. Prediction: "At what θ is τ largest?" (45°).
6. Rewrite with double angles, and flag that this shape returns as the Mohr circle.
7. *Geology:* why a rock under compression feels maximum shear on planes near 45°, which foreshadows faulting (B3).

**Geological payoff:** Explains why shear on inclined planes, not the raw force, controls faulting, and why the angle matters.

**Misconceptions to target:** traction resolves like force (cos θ); traction is the same on every plane; "stress = force".

**Exact vs illustrative:** exact for the uniform uniaxial idealization.

**Domain / scenes / tests:** `calculateStressMpa` and `calculateAverageTraction` (existing), plus new `inclinedPlaneTraction(σ₀, θ)` with tests (θ = 0, 45°, 90°).

**Out of scope:** non-uniform tractions and stress concentrations (B2 covers the latter qualitatively).

**Acceptance criteria:** the area growth, force components, and traction components are all visible and bound to the equations; the plot and the scene stay in sync.

---

## S3 — Normal and shear traction on any plane

**Prerequisites:** S2, M3. **Used later by:** S4, S7, B3, B6, B8.

**Learning objectives**
- Split any traction vector into normal and shear parts with the dot product.
- Apply the compression-positive sign convention to the normal part.
- Describe the direction (sense) of shear traction on a plane, not just its magnitude.

**Math introduced:** `σn = t · n̂`, `τ = t − σn n̂`, `|τ| = √(|t|² − σn²)`. The compression-positive sign statement. The shear direction as a vector in the plane.

**Equation–model binding:** reuses the existing decomposition geometry and the M3 plane-with-normal widget. The traction arrow `t`, the normal part (in the normal color and pattern), and the shear part in the plane (shear color and pattern) have a right-angle marker. Live `σn` and `|τ|`.

**Step outline**
1. The M3 split, now with traction on a rock face.
2. Signs: compressive normal traction is positive. Prompt: a pulling traction gives what sign?
3. Drag the traction direction; find where the shear vanishes and where the normal part vanishes.
4. At 45° to the normal, the normal and shear magnitudes are equal (the existing prompt is kept).
5. The shear *direction* matters: it is the direction a fault would slip (preview of B8).
6. *Geology:* a fault plane with a push on it. Which way would it want to slip?

**Geological payoff:** Resolved normal stress (clamping) and shear stress (driving slip) on faults and fractures.

**Misconceptions to target:** shear is a separate force; the sign of the normal traction depends on the viewing side.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `decomposeTraction` (existing, refactored onto `splitNormalTangential` from M3).

**Out of scope:** the tensor (S4).

**Acceptance criteria:** the decomposition works for arbitrary face and direction; the sign convention is stated on screen; the shear direction is drawn as a vector.

---

## S4 — Stress at a point (2D)

**Prerequisites:** S3, M4. **Used later by:** S5, S6, S7.

**Learning objectives**
- Explain why traction depends on the plane's orientation, so "stress at a point" needs more than one vector.
- Define σxx, σyy, and σxy on a small square element, including the naming convention (plane, then direction).
- State that σxy = σyx, with a one-sentence reason.
- Compute the traction on any plane through the point using `t = σn` in 2D, and read it as the M4 matrix machine.

**Math introduced**
- The 2D stress matrix `σ = [[σxx, σxy], [σxy, σyy]]`.
- `t = σ n̂` (the Cauchy relation) in 2D, with components written out.
- Symmetry: if σxy ≠ σyx, the tiny square would spin. This is **stated only**, not derived with moment equations.
- **Traction sign note (decide at build time and record in SCIENTIFIC_SCOPE):** the recommended on-screen form is `t = σn`, with n the outward normal and t the *compression-positive traction* (the push on the face). Its normal part `t·n > 0` is then compressive, and the arrow is drawn pointing into the face. The physics-convention equivalent (`t_phys = −σn`) is noted once, in an aside.

**Equation–model binding**
- The 2D-slice view: a square element highlighted as a slice through the 3D cube, the rest of the cube ghosted.
- Face arrows labeled σxx, σyy, and σxy on each face, in normal and shear patterns.
- A rotatable plane through the element, with its normal `n` (component box) and traction `t` (component box). The matrix `σ` is displayed with each column highlighted as `σ î` and `σ ĵ` (M4 callback).
- Editable σxx, σyy, σxy.

**Step outline**
1. One point, many planes: rotate a plane and watch the traction change. One vector cannot describe the point.
2. The square element: name the face stresses (σxx on the x-face in the x-direction; σxy on the x-face in the y-direction).
3. Why σxy = σyx: a quick animation of a square that would spin, then the statement.
4. The matrix, and `t = σn` as the M4 machine: input the normal, output the traction. Live components.
5. Numeric prompt: given σ and a normal at 30°, find t, then σn and τ (using S3).
6. Faces of the element are special cases: n = î gives `t = σ î`, the first column.
7. Tease the reveal: this square is one slice of a cube (S7).

**Geological payoff:** Prepares the language that the rest of the unit and all of Unit 3 use.

**Misconceptions to target:** σxy and σyx are independent; stress is a vector; the matrix changes when the plane rotates. (The matrix stays the same; the normal changes.)

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** new `src/domain/stress.js` with `traction2D(σ, n)` and `normalShear2D(σ, n)`, with tests. Build the **2D-slice view** in or beside `StressScene`.

**Out of scope:** transformation of the matrix itself (S5), and 3D (S7).

**Acceptance criteria:** the plane rotates and `t`, `σn`, `τ` update, bound to the equations; the matrix columns highlight as face tractions; the slice-of-cube framing is visible.

---

## S5 — Transformation and principal stresses (2D)

**Prerequisites:** S4, M2 (double angles), M4 (eigenvectors). **Used later by:** S6, S8, B3; also S7.

**Learning objectives**
- Derive, step by step, σn(θ) and τ(θ) for a plane whose normal is at θ from x.
- Find the principal directions (τ = 0) and principal stresses σ1 and σ3, and identify them as the eigenvectors and eigenvalues of σ.
- Show that maximum shear acts on planes at 45° to the principal directions, with magnitude (σ1 − σ3)/2.

**Math introduced**
- General 2D form:
  `σn = (σxx + σyy)/2 + (σxx − σyy)/2 · cos 2θ + σxy sin 2θ`
  `τ = −(σxx − σyy)/2 · sin 2θ + σxy cos 2θ` (the sign of τ is declared here and kept).
- Principal-axis form: `σn = (σ1 + σ3)/2 + (σ1 − σ3)/2 · cos 2θ`, `τ = (σ1 − σ3)/2 · sin 2θ`, with θ from σ1 to the plane normal.
- `tan 2θp = 2σxy / (σxx − σyy)`; `σ1,3 = (σxx + σyy)/2 ± √(((σxx − σyy)/2)² + σxy²)`. This is identical to the M4 2D eigen formula, and the lesson points that out.

**Equation–model binding**
- The 2D-slice element with a plane rotated by θ (drag the plane or a slider). Live σn and τ arrows on the plane.
- A live plot of σn(θ) and τ(θ) as θ sweeps 0–180°, with a cursor at the current θ.
- The principal directions are drawn as double-headed arrows labeled σ1 and σ3 once found.
- "Rotate the element to principal axes" button: the element rotates by θp and the shear arrows on its faces go to zero (`A σ Aᵀ` from M4, shown in 2D).

**Step outline**
1. Sweep θ and watch σn and τ oscillate. Prediction: "How many times does τ hit zero in 180°?"
2. Derivation in stages, each substep bound to the scene: project `t = σn` onto n and onto the in-plane direction, expand, then apply the double-angle identities (M2 callback).
3. Where τ = 0: the principal planes. They are perpendicular to each other.
4. This is the eigen problem: the traction is parallel to the normal (M4 callback, visual and formula).
5. Rotate the element to the principal axes: off-diagonal terms → 0, and the diagonal holds σ1 and σ3.
6. Maximum shear at 45°: prediction, then verify with the plot.
7. Numeric prompt: from σxx, σyy, σxy, compute σ1, σ3, θp, and τmax.
8. *Geology preview:* faults form near but not at 45° (B3 explains why).

**Geological payoff:** Principal stresses are the language of every stress-based geological argument that follows.

**Misconceptions to target:** principal stresses are "the biggest components in the matrix"; rotating the frame changes the stress state; maximum shear is on the σ1 plane.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `transform2D(σ, θ)`, `principal2D(σ)`, and `normalShearAtAngle(σ1, σ3, θ)` in `stress.js`, with tests that cross-check the eigen results from `matrix.js`. **Generalize the Mohr plot renderer here** (S6 uses it immediately), starting with the θ-sweep plot. The B7 version (`MohrPlot.js`) is the starting point.

**Out of scope:** 3D (S8), and the pole method on the Mohr circle (optional aside in S6 at most).

**Acceptance criteria:** the derivation steps are shown and bound; the principal rotation zeros the shear on the faces; the numbers agree with the M4 eigen solver.

---

## S6 — The Mohr circle (2D)

**Prerequisites:** S5. **Used later by:** S9, B2–B6, R6; also S7.

**Learning objectives**
- Show that the (σn, τ) pairs from S5 trace a circle, and explain why (the cos 2θ / sin 2θ parametrization).
- Construct the circle from σ1 and σ3, or from σxx, σyy, and σxy. Identify the center, the radius, and the 2θ angle.
- Read normal and shear stress for any plane from the circle, and go the other way (from a point on the circle back to a plane in the element).

**Math introduced:** center `C = (σ1 + σ3)/2`, radius `R = (σ1 − σ3)/2`; a plane at θ plots at 2θ from the σ1 point; `σn = C + R cos 2θ`, `τ = R sin 2θ`. Axis convention from the README.

**Equation–model binding:** the element (plane at θ) and the Mohr plot are linked both ways. Dragging the plane moves the point, and dragging the point rotates the plane. The θ arc in the element and the 2θ arc on the circle are shown together, in the same color. C and R are drawn as labeled segments.

**Step outline**
1. Plot the S5 sweep as points in σn–τ space, and watch a circle appear.
2. Why a circle: `(σn − C)² + τ² = R²`.
3. Construct from σ1 and σ3; construct from σxx, σyy, σxy (the two face points and the diameter).
4. The 2θ rule: prediction ("the plane at 90° to σ1 plots where?"), then verify.
5. Bidirectional exploration: pick a point on the circle, and find the plane.
6. What changes the circle: increasing σ1 − σ3 grows R, and adding equal pressure to both shifts C. This preview is essential for B3 and B4.
7. Numeric prompts: read σn and τ for a given θ.

**Geological payoff:** The Mohr diagram is where stress meets rock strength (B2–B6).

**Misconceptions to target:** θ on the circle is θ (not 2θ); the circle's position doesn't matter, only its size; points inside the circle are valid 2D planes. (In 2D, only points *on* the circle are; S9 changes this in 3D.)

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `mohrCircle2D(σ)` and `planeToMohrPoint` / `mohrPointToPlane` in `stress.js`, with tests. Extend the Mohr renderer with interactive points.

**Out of scope:** the Mohr circle for strain (optional aside in D4 at most), and the pole-of-planes method (optional aside only).

**Acceptance criteria:** bidirectional linking; the 2θ relationship is visibly correct; both constructions match.

---

## S7 — The stress tensor in 3D

**Prerequisites:** S4–S6, O2 (planes by strike/dip), M4. **Used later by:** S8–S10, B6–B8; also R2.

**Learning objectives**
- Extend the 2D square to the 3D cube: 9 components, 6 of them independent by symmetry.
- Compute the traction on any 3D plane with `t = σn`, and its normal and shear parts.
- **Switch to NED:** specify a plane by strike/dip, get its normal from O2, and compute the traction. The frame change is shown as a step.

**Math introduced:** the 3×3 symmetric `σ`; `t = σ n̂` in 3D, with components written out; `σn = n̂ · σ n̂`; `τ = t − σn n̂`. The frame change from x/y/z to NED, `σ_NED = A σ Aᵀ`, is shown as "same state, new axes" (M4 callback). Index notation `ti = σij nj` appears only as an optional aside.

**Equation–model binding:** the reveal. The S4 square expands into the 3D cube (this reuses `StressScene`). There are face arrows for all components, a plane through the center with its normal (component box), and a traction arrow with normal and shear parts. The 3×3 matrix is shown with columns highlighted as face tractions. The plane can be set by dragging its normal, or by strike/dip inputs once in NED.

**Step outline**
1. Reveal: the 2D slice was one face-on view of a cube. Add z.
2. Name all nine components; symmetry leaves six. (The existing tensor-editing controls are reused.)
3. `t = σn` in 3D: pick any plane and see the traction. The components are written out live.
4. Normal and shear on that plane (S3 in 3D). The shear direction lies anywhere in the plane.
5. Switch to NED: the frame-change step, animated. Enter a plane as strike/dip (O2), and read the traction in NED.
6. Numeric prompt: a given σ (NED) and a given plane (strike/dip) → σn and |τ|.
7. *Geology:* a fault plane in a stressed crust. Normal stress clamps it; shear stress drives it.

**Geological payoff:** Resolving stress onto real fault and fracture planes, which B6 and B8 build on directly.

**Misconceptions to target:** nine independent numbers; the tensor is attached to the cube's faces rather than to the point.

**Exact vs illustrative:** exact. The existing block *deformation* in `StressScene` remains **illustrative** until R2 and must be labeled as such, or hidden in this lesson.

**Domain / scenes / tests:** `traction3D`, `normalShear3D`, and `transformTensor(σ, A)` in `stress.js`, with tests. Extend `StressScene` with the plane-through-the-point widget (built from M3 and O2 components).

**Out of scope:** principal axes (S8).

**Acceptance criteria:** the 2D → 3D reveal is continuous; an arbitrary plane (by normal, or by strike/dip in NED) gives correct traction; the frame change is explicit and animated.

---

## S8 — Principal stresses in 3D

**Prerequisites:** S7, M4, O3. **Used later by:** S9, S10, B3, B6, B7; also B1, D4.

**Learning objectives**
- Find the three principal stresses and directions as the eigenvalues and eigenvectors of σ (visually and numerically), with the ordering σ1 ≥ σ2 ≥ σ3.
- Rotate to the principal frame and see σ become diagonal.
- Describe the stress ellipsoid, and plot the principal axes on a stereonet as trend/plunge.

**Math introduced:** `σ e = λ e`; `σ' = A σ Aᵀ = diag(σ1, σ2, σ3)`; the stress ellipsoid with semi-axes σ1, σ2, σ3 (only meaningful for all-compressive states; this is stated).

**Equation–model binding:** sweep a plane normal over the sphere of directions; where `t ∥ n` (shear = 0), the principal markers light up. A "rotate to principal frame" animation zeros the off-diagonal terms of the displayed matrix. A stress-ellipsoid overlay is available. A side stereonet (O3) shows the σ1, σ2, σ3 axes as points labeled 1, 2, 3.

**Step outline**
1. Hunt for planes with no shear. Prediction: how many are there, and how are they arranged?
2. These are eigenvectors: `σe = λe` (M4 callback). Show the numeric eigen solution next to the visual one.
3. Order them σ1 ≥ σ2 ≥ σ3 (compression positive).
4. Rotate the cube into the principal frame: the diagonal matrix.
5. The stress ellipsoid.
6. The principal axes as trend/plunge on the stereonet (NED).
7. Numeric prompt: given σ, identify σ1 and its orientation.

**Geological payoff:** Paleostress and present-day stress are reported as principal-axis orientations and magnitudes.

**Misconceptions to target:** σ1 is always vertical; principal axes must align with x, y, z; the ellipsoid shows the deformed shape. (It doesn't; that is strain, D4.)

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `principal3D(σ)`, using `eigenSymmetric3` from M4, returning sorted values and NED trend/plunge for each axis. Tests use known diagonal and rotated cases.

**Out of scope:** stress inversion (parked).

**Acceptance criteria:** visual and numeric principal axes agree; the principal-frame rotation zeros the off-diagonals; the stereonet plot is correct.

---

## S9 — The 3D Mohr diagram

**Prerequisites:** S6, S8. **Used later by:** B3, B6; also S10.

**Learning objectives**
- Draw the three Mohr circles from σ1, σ2, and σ3.
- Show that every plane plots on or between the circles, and locate a given plane's point.
- Recognize that planes containing a principal axis plot on the corresponding circle.

**Math introduced:** circle pairs (σ1, σ3), (σ1, σ2), (σ2, σ3). The admissible region is inside the large circle and outside the two small ones. A plane's (σn, τ) point comes from S7's formulas.

**Equation–model binding:** a 3D plane (dragged, or set by strike/dip) ↔ a point in the shaded Mohr region. Rotating the plane about σ2 moves the point along the big circle, and the scene highlights the σ2 axis while this happens.

**Step outline**
1. Three circles from three principal stresses.
2. Drag a plane in 3D, and watch its point wander within the region.
3. Planes containing σ2 lie on the σ1–σ3 circle. This is why 2D analysis in the σ1–σ3 plane works for faulting (preview of B3).
4. Prompts: locate specific planes.

**Geological payoff:** Justifies using the σ1–σ3 circle for fault and fracture analysis, and shows where arbitrarily oriented pre-existing faults plot (B6).

**Misconceptions to target:** planes plot only on the circles; σ2 is irrelevant.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `mohr3D(σ)` and `planeToMohrPoint3D` in `stress.js`, with tests. Extend the Mohr renderer with the region shading.

**Out of scope:** graphical 3D Mohr construction for a given plane (the numeric point is enough).

**Acceptance criteria:** plane ↔ point linking in 3D; region shading is correct; the special cases lie on the circles.

---

## S10 — Mean, deviatoric, and Earth stress states

**Prerequisites:** S8, S9, O1. **Used later by:** B2–B7, R6; also B1, D1, R1, R5.

**Learning objectives**
- Split σ into mean (isotropic) and deviatoric parts, and say which one changes volume and which drives distortion.
- Compute differential stress σ1 − σ3.
- Recognize common stress states by their principal values and Mohr pictures: uniaxial, axial compression, axial extension, triaxial, and pure-shear stress.
- Compute lithostatic stress `σv = ρgz`, and explain why near Earth's surface one principal stress is vertical.

**Math introduced:** `σm = (σ1 + σ2 + σ3)/3`; `σdev = σ − σm I`; differential stress; `σv = ρ g z` (about 26–27 MPa/km for ρ ≈ 2700 kg/m³); the lithostatic reference state (`σ1 = σ2 = σ3 = ρgz`). A free surface carries no shear traction, so the vertical is a principal direction.

**Equation–model binding:** the cube shows the total, mean, and deviatoric parts as three linked views (arrows and matrices), with a Mohr view for each. A depth slider for the lithostatic state. The existing 10 presets (`stressStates.js`) become a labeled catalog, each with its Mohr diagram. An Earth-surface block in NED shows the vertical principal axis.

**Step outline**
1. Mean stress: an equal push from all sides. On the Mohr diagram it is a point; it shifts the circles without changing their size.
2. Deviatoric stress: what's left, which drives shape change.
3. Differential stress σ1 − σ3 is the Mohr circle's diameter.
4. Catalog tour: each preset with its tensor, arrows, and Mohr diagram. Prompts: match a Mohr picture to its state.
5. Lithostatic stress with depth: a numeric prompt at 3 km depth.
6. The free surface forces one principal axis to be vertical. Preview of Anderson (B7).
7. The existing open explorer (tensor editing) closes the unit.

**Geological payoff:** Burial stress, tectonic "extra" stress, and the reason fault regimes come in three types (B7).

**Misconceptions to target:** high pressure alone breaks rocks (no, it takes differential stress, B3); lithostatic means "no stress".

**Exact vs illustrative:** exact. The preset *block deformation* remains illustrative until R2 and is labeled.

**Domain / scenes / tests:** `meanStress`, `deviatoric`, `differentialStress`, and `lithostatic(ρ, z)` in `stress.js`, with tests. Reuse the `STRESS_STATES` catalog, extended with Mohr metadata.

**Out of scope:** the uniaxial-strain, thermal, and exhumation reference states, and tectonic stress as a deviation from reference (all in R5, which needs elasticity first); stress measurement methods and the World Stress Map (parked; a single context sentence is fine); and invariants beyond the mean (optional aside).

**Acceptance criteria:** the total, mean, and deviatoric decomposition is shown with Mohr views; the catalog is integrated; the lithostatic calculation is verified; the vertical-principal-axis argument is present.
