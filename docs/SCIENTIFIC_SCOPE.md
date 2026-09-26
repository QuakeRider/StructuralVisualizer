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
