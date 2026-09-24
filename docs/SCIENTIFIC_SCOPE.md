# Scientific Scope

## What the prototype represents

The opening laboratory calculates vector average traction from a resultant force divided by the selected contact area:

```text
t̄ = F / A
```

The units are converted explicitly from newtons and square centimeters to megapascals. The calculation assumes a uniformly distributed resultant over the highlighted patch. It is not a local boundary-condition solution or a claim that traction is spatially uniform in a real specimen.

For an outward unit surface normal `n`, the laboratory resolves traction into a signed normal projection and an in-plane shear vector:

```text
tn = t̄ · n
τ  = t̄ − tn n
```

An inward compressive applied force therefore gives `tn < 0` in this surface-traction calculation. When the lesson introduces the compression-positive geological stress tensor `σ`, it states the corresponding mapping explicitly as `t(n) = −σn`. This prevents the traction sign and the chosen tensor sign convention from being silently mixed.

The later application steps visualize a relationship between a selected stress tensor and a deliberately exaggerated block deformation. Together, the sequence is designed to help students connect:

- Force magnitude, direction, and contact area.
- Average traction and its signed normal and shear components on a surface.
- Stress magnitude and direction.
- Normal and shear components.
- Tension, compression, and combined loading.
- Shape change versus volume change.

The model uses a compression-positive sign convention.

## What the prototype does not claim

The displayed deformation is not a prediction for rock, putty, metal, or any other specific material. The application currently has no:

- Young’s modulus or stiffness tensor.
- Calibrated Poisson’s ratio.
- Plastic or viscous flow law.
- Temperature or strain-rate dependence.
- Yield surface.
- Fracture or damage model.
- Boundary-condition solver.
- Finite-element discretization.

Consequently, the application must not present fracture orientation, failure, or permanent deformation as uniquely determined by the selected stress state.

## Current qualitative mapping

Normal stress components create extension or shortening along their axes with a small illustrative lateral coupling. Shear components apply a volume-preserving upper-triangular deformation. The deformation is clamped to keep the block legible at large display values.

This mapping is useful for conceptual comparison but should not be reused as a scientific calculation.

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
