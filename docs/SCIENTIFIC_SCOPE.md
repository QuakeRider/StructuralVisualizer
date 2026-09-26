# Scientific Scope

This document states what each current visualization calculates exactly and what it only illustrates. Every lesson build updates it (see the build-session protocol in [curriculum/README.md](curriculum/README.md)).

## What the prototype represents

### Vectors (lesson M1)

The vector laboratory draws vectors from the origin in an abstract right-handed x, y, z frame, with z drawn up. Everything it calculates is exact:

```text
|v| = √(vx² + vy² + vz²)        (via d² = vx² + vy², then |v|² = d² + vz²)
v̂ = v / |v|
a + b = (ax + bx, ay + by, az + bz)
c v = (c vx, c vy, c vz),  |c v| = |c| |v|
```

Dragged vectors snap to half-unit components within ±6; typed components are not snapped. The unit sphere is drawn at true radius 1. The rock block, fault plane, and fold surface in the last step are illustrative sketches placed around exact vectors, and the lesson says so. The frame is not geological: north, east, and down arrive in lesson O1.

### Anderson's theory of faulting (lesson B7)

The Earth block uses the geological frame: x north, y east, z down, compression positive, σ1 ≥ σ2 ≥ σ3. Exact within the Coulomb and Anderson assumptions:

```text
φ = tan⁻¹ μ
θ = 45° + φ/2        (σ1 to the fault normal; the fault plots at 2θ = 90° + φ)
β = 45° − φ/2        (σ1 to the fault plane)
dip: normal δ = 90° − β, thrust δ = β, strike-slip δ = 90° with strikes at σ1 trend ± β
```

- **Fault planes.** The conjugate planes both contain σ2. They are drawn through the block center at those exact orientations.
- **Slip direction.** The sense and direction of slip come from the shear part of the traction 𝐭 = −σ𝐦 on each plane. Here 𝐦 is the upward (hanging-wall) normal, and σ is built from the regime's principal axes with illustrative magnitudes (100, 60, 20 MPa). For these Andersonian planes the direction is pure dip-slip or pure strike-slip whatever the magnitudes are.
- **Illustrative parts.** The size of the hanging wall's offset, the block's layers, and the length of the stress arrows are illustrative. The arrows rank σ1 > σ2 > σ3 by thickness, length, and line pattern, not to scale.
- **Mohr diagram.** It uses fixed teaching values σ3 = 20 MPa and C = 10 MPa, with σ1 set to just reach the Coulomb line: σ1 = σ3(1 + sin φ)/(1 − sin φ) + 2C cos φ/(1 − sin φ). Its magnitudes are illustrative, but its angles (φ, 2θ) are exact, and the diagram says so.
- **Deliberately left out.** The lesson does not model pre-existing weaknesses, pore pressure, fault rotation, or tilted stress axes. Step 7 names these as the reasons real faults depart from the prediction.

### Friction and reactivation of existing planes (lesson B6)

Same geological frame as B7 (x north, y east, z down, compression positive). Exact within Byerlee's law and the slip-tendency definitions:

```text
𝐭 = σ𝐧                       (𝐧 = downward pole, into the footwall)
σn = 𝐭·𝐧,  τ = |𝐭 − σn𝐧|
Byerlee: τ = 0.85σn′ (σn′ < 200 MPa),  τ = 50 MPa + 0.6σn′ (above)
σn′ = σn − Pf                  (effective normal stress; τ unchanged)
Ts = τ/σn′  (slips when τ reaches Byerlee's line; Ts ≥ 0.85 below 200 MPa)
Td = (σ1 − σn)/(σ1 − σ3)
σ1 to reactivate:  σ3 + (a + μ(σ3 − Pf))/(g − μf)  for each Byerlee segment τ = a + μσn′,
                   f = c1² + R c2²,  g² = c1² + R² c2² − f²  (cᵢ: cosines of 𝐧 to the principal axes, R = 0.5)
σ1 for a new fault: σ3′(1 + sin φ)/(1 − sin φ) + 2C cos φ/(1 − sin φ) + Pf
```

- **Stress state (illustrative magnitudes).** σ3 = 30 MPa, σ2 halfway between σ3 and σ1, σ1 from 30 to 240 MPa, and Pf up to 25 MPa. The principal axes follow the Anderson regimes (σ1 vertical by default). Intact rock is a teaching Coulomb line with C = 20 MPa and μ = 0.85. It is drawn parallel to Byerlee's line on purpose, so the only difference is cohesion. Real intact strength varies widely with rock type.
- **Exact parts.** Every plane's σn, τ, Ts, and Td; its point on the 3D Mohr diagram (upper half only, τ ≥ 0); the three circles and the region between them; the reactivation and new-fault σ1 values; and the stereonet. The stereonet is a lower-hemisphere equal-area projection, sampled on a 120 × 120 grid of poles. Its hatching marks the cells whose plane reaches Byerlee's line, and the color scale is capped at Ts = 1.2.
- **Stopping at failure (step 5).** Once the plane slips or intact rock breaks, σ1 stops rising. This is the usual idealization: the stress cannot exceed the strength of the weakest option. Stress drops and the earthquake cycle are not modeled.
- **Illustrative parts.** The block's layers, the length of the stress arrows, and the size of the hanging wall's offset. The traction arrows are to scale with each other (1 world unit ≈ 110 MPa).
- **Deliberately left out.** Rate-and-state friction, cohesion on old faults, clay-gouge friction values, poroelastic coupling of Pf to total stress, and inversion of stress from data. The mapped faults in step 7 and the induced-seismicity examples in step 8 are context, not modeled sites.

### Fault geometry, slip, and kinematic axes (lesson B8)

Same geological frame as B6 and B7 (x north, y east, z down, compression positive). 𝐧 is the fault's downward pole, pointing into the footwall; 𝐬 is the hanging wall's slip relative to the footwall. On a vertical fault the hanging wall is, by convention, the block on the dip-direction side. Exact within these definitions:

```text
𝐬̂ = cos λ 𝐞strike + sin λ 𝐞up        (rake λ from −180° to 180°: 90° reverse, −90° normal,
                                      0° sinistral, 180° dextral)
s_strike = s cos λ,  s_dip = s sin λ
slickenline rake r (0–180°): r = −λ (λ ≤ 0), r = 180° − λ (λ > 0);  sin p = sin r sin δ
Wallace–Bott: 𝐬̂ ∥ 𝛕 = 𝐭 − (𝐭·𝐧)𝐧,  𝐭 = σ𝐧;  λ = atan2(𝛕·𝐞up, 𝛕·𝐞strike)
P ∝ 𝐧 + 𝐬̂,  T ∝ 𝐧 − 𝐬̂,  B = 𝐧 × 𝐬̂
beach ball: shaded where (𝐯·𝐧)(𝐯·𝐬̂) < 0 (compressional first motions, the T quadrants)
separation of a planar marker (pole 𝐦) on a view surface: (𝐦·𝐃)/(𝐦·𝐮),  𝐮 = the fault trace
stratigraphic separation of flat beds in a vertical well: |D_z|, the throw
```

- **Exact parts.** The slip vector and its parts, the rake and the slickenline's trend and plunge, the fault names, the Wallace–Bott slip direction and rake, the P, T, and B axes, the auxiliary plane and the beach ball (drawn as an exact even–odd fill of the two nodal half-nets on the lower-hemisphere equal-area net), the map and section separations (and the arrows showing them), and the well log.
- **Naming convention.** Slip within 20° of pure dip-slip or pure strike-slip takes the pure name; anything else is called oblique and named by both parts. A reverse fault dipping less than 45° is called a thrust. These cut-offs are conventions, not physics.
- **Illustrative parts.** The block is 1000 m across and 500 m deep with 62.5 m beds; the slip is 300 m (200 m in the separation step, 150 m in the well step), large on purpose so it reads on screen. The stress state is illustrative: σ1 = 130 MPa, σ3 = 30 MPa, σ2 set by the ratio φ, with the Anderson axes (optionally tilted about σ2 in step 10). The traction arrows are to scale with each other (1 world unit ≈ 70 MPa). The "cut" view erodes the land flat down to the lower block's surface. The slickenline steps are schematic, and the step shape shown (smooth toward the missing block's motion) is one common kind of indicator, not a rule for every surface.
- **Deliberately left out.** Stress inversion from many faults (the reduced stress tensor), moment tensors and seismic radiation beyond the first-motion quadrants, fault curvature, slip that varies along the fault, and the magnitude of slip. Wallace–Bott assumes a planar fault in one uniform stress with no interaction between faults; the lesson says so.

### Trigonometry of projection (lesson M2)

Everything in the M2 steps is exact, in the same x, y, z frame as M1 (z up), with angles in degrees:

```text
vx = |v| cos α,  vy = |v| sin α                       (α from +x, counterclockwise)
α = atan2(vy, vx), in [0°, 360°)                      (tan⁻¹(vy/vx) is also shown, with its quadrant error)
v̂ = (cos α, cos β, cos γ),  cos²α + cos²β + cos²γ = 1  (direction angles to x, y, z)
v′x = vx cos θ + vy sin θ,  v′y = −vx sin θ + vy cos θ,  v′z = vz   (axes turned by θ about z)
cos²θ = ½(1 + cos 2θ),  sin θ cos θ = ½ sin 2θ
```

Length-and-angle dragging snaps the angle to 5° and the length to 0.5; the sliders are finer. The primed axes are the x and y axes turned about z. The vector itself never moves when θ changes. In the last step, the plane trace and the "plunge-like" angle ε are geometric previews. Trend and plunge themselves, with z pointing down, are defined in O1.

### Force on a surface (lessons S2, S3)

The force laboratory draws one force acting at the center of a selected face of a schematic cube. It is a force in newtons (displayed in kN), and its magnitude is computed exactly as above.

The laboratory has no moments, supports, reactions, or internal resultants; engineering statics is outside the curriculum (see [curriculum/parked-and-expansions.md](curriculum/parked-and-expansions.md)).

### Surface traction

The laboratory calculates vector average traction from a resultant force divided by the selected contact area:

```text
t̄ = F / A
```

The units are converted explicitly from newtons and square centimeters to megapascals, and the conversion is shown on screen. The calculation assumes a uniformly distributed resultant over the highlighted patch. It is not a local boundary-condition solution or a claim that traction is spatially uniform in a real specimen. The small arrows over the patch are an illustration of that uniform distribution.

For an outward unit surface normal `n`, the laboratory resolves traction into a signed normal projection and an in-plane shear vector:

```text
tn = t̄ · n
τ  = t̄ − tn n
```

An inward compressive applied force therefore gives `tn < 0` in this seed calculation. When the stress tensor `σ` is introduced (compression positive), the mapping is stated explicitly as `t(n) = −σn`, so the traction sign and the tensor sign convention are never mixed silently. **Open item:** lesson S4 fixes the single on-screen traction form for the rest of the course (recommended: `t = σn` with t as the compression-positive push on the face). S3's full build must adopt that form.

### Stress states (lessons S7, S10, and Explore)

The stress-state scene displays a compression-positive stress tensor, its face arrows, and a deliberately exaggerated block deformation. The tensor values and arrows are exact representations of the chosen components. The deformation is not (see below). The scene does not solve a stress field from the force laboratory's boundary load; the lessons connect the two conceptually.

The model uses a compression-positive sign convention throughout.

## What the prototype does not claim

The displayed deformation is not a prediction for rock, putty, metal, or any other specific material. The application currently has no:

- Young's modulus or stiffness tensor (planned in lesson R2).
- Calibrated Poisson's ratio (planned in lesson R2).
- Plastic or viscous flow law.
- Temperature or strain-rate dependence.
- Yield surface.
- Fracture or damage model.
- Continuum boundary-value or finite-element solver.

Consequently, the application must not present fracture orientation, failure, or permanent deformation as uniquely determined by the selected stress state.

## Current qualitative response mapping

In the stress-state scene, normal stress components create extension or shortening along their axes with a small illustrative lateral coupling. Shear components apply a volume-preserving upper-triangular deformation. The deformation is clamped to keep the block legible at large display values. Lesson R2 replaces this with exact linear elasticity shown with a stated exaggeration factor.

This mapping is useful for conceptual comparison but must not be reused as a scientific calculation.

## Preset interpretation

The ten cases follow the supplied reference diagram. Some source labels are abbreviated; the application uses clearer labels while retaining the diagram order and loading pattern. Numerical magnitudes are illustrative.

## Requirements for a future physical model

A material-response lesson must explicitly identify:

1. The constitutive law.
2. Required material parameters and units.
3. Boundary conditions and dimensional assumptions.
4. Whether deformation is infinitesimal or finite.
5. Whether the response is reversible, permanent, or time dependent.
6. The limits within which the visualization should be interpreted.

Failure or fracture visuals must additionally identify the failure criterion, strength parameters, and role of confinement.
