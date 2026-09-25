# Scientific Scope

## What the prototype represents

### External loads and equilibrium

The load laboratory treats the displayed body as a schematic 2.5 m cube so force application coordinates and moments have declared length units. It calculates the resultant moment about a reference point exactly from:

```text
M = r × F
```

In **Free body** mode, the application shows the directions of translational and rotational tendency produced by the nonzero resultants. The displaced wireframe is a motion cue, not a time-integrated rigid-body dynamics simulation.

In **Fixed opposite face** mode, the face opposite the selected loaded face is an ideal fixed constraint. Reaction force and reaction moment are calculated from static equilibrium. For the single applied-force model, a section cut exposes the internal force and moment required to balance the portion of the body on the loaded side. These resultants are resolved into axial force, shear force, bending moment, and torsion.

The statics calculations are quantitative within those stated assumptions. The visible deformed shape is not: it is a bounded teaching response that makes axial, shear, bending, and torsional tendencies legible without claiming a stiffness or displacement solution.

### Surface traction

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

The later application steps visualize a relationship between a selected stress tensor and a deliberately exaggerated block deformation. The load laboratory and stress-state renderer are connected conceptually by the guided lesson; the application does not solve a three-dimensional stress field from the applied boundary load. Together, the sequence is designed to help students connect:

- Force magnitude, direction, location, and contact area.
- Resultant force and moment.
- Constraints, reactions, and static equilibrium.
- Internal axial force, shear force, bending moment, and torsion.
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
- Continuum boundary-value or finite-element solver.
- Finite-element discretization.

Consequently, the application must not present fracture orientation, failure, or permanent deformation as uniquely determined by the selected stress state.

## Current qualitative response mappings

In the load laboratory, an ideal fixed face remains stationary while a deliberately exaggerated shape function displays axial, shear, bending, and torsional tendencies. Magnitude is normalized for visibility rather than divided by material stiffness. The free-body ghost indicates a direction of motion and rotation rather than position at a stated time.

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
