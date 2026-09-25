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
