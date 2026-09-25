# Curriculum Vision

## Product goal

Structural Visualizer is a university-level interactive learning environment for an intro Structural Geology course (3000–4000 level). Its purpose is to make **the mathematics of structural geology understandable, visible, and interesting** for students whose math and physics are not fully solid. It builds intuition from math to geology: vectors → force → traction → the stress tensor → principal stresses → failure, strain, rheology, and folds.

The primary use is instructor projection in lecture (Present mode), with students following along. A structural-lab mode and a self-study/homework mode are planned expansions.

## Curriculum

The authoritative curriculum, with the lesson sequence, binding decisions, conventions, per-lesson specs, and build protocol, lives in **[docs/curriculum/README.md](curriculum/README.md)**.

Summary of the sequence:

| Unit | Lessons |
|---|---|
| 0 Math foundations | Vectors and components · Trigonometry of projection · Dot and cross products · Matrices as transformations |
| 1 Orientation | Geographic (NED) frame and lines · Planes, strike/dip, and poles · Stereonets · Angles, intersections, and rake |
| 2 Stress | Force · Force vs traction · Normal and shear traction · Stress at a point (2D) · Transformation and principal stresses (2D) · Mohr circle (2D) · Stress tensor (3D) · Principal stresses (3D) · 3D Mohr diagram · Mean, deviatoric, and Earth stress states |
| 3 Brittle deformation | Fracture modes and deformation bands · Tensile failure · Coulomb failure and the composite envelope · Confining and pore-fluid pressure · Joints and veins · Friction and reactivation · Anderson's theory · Fault slip and kinematic axes · Fault anatomy and growth |
| 4 Deformation and strain | Components of deformation · Homogeneous vs heterogeneous · Measuring strain · Strain ellipse and ellipsoid · Coaxial and non-coaxial (pure shear, uniaxial strain, simple shear) · Flow, ISA, apophyses, and vorticity · Progressive deformation · Strain measurement methods |
| 5 Rheology | What rheology is · Elasticity · Viscous flow · Plastic and composite behavior · Stress in the crust (reference states) · Brittle–ductile transition |
| 6 Folds and folding | Anatomy · Orientation and stereonets · Shape and classification · Mechanisms (incl. kink and chevron) · Boudinage · Fault-related folds · Superposed folding |

Deliberately parked for now: the plastic regime (microstructures, flow laws), fabrics and shear zones, plate tectonics, paleostress inversion, fault-seal topics, and map/cross-section work. See [curriculum/parked-and-expansions.md](curriculum/parked-and-expansions.md). **Engineering statics** (moments, reactions, section cuts, bending, torsion) is permanently excluded.

## Experience principles

Every lesson follows the same product principles. The full versions are in the curriculum README.

1. **Math is central, and it is bound to the model.** Every symbol in an on-screen equation has a visible, labeled counterpart in the scene, and the numbers update live as students manipulate it.
2. **Components always visible.** Vectors, tractions, and matrices are shown with their components, so students see how things break down.
3. **Manipulate → observe → formalize → apply to geology.** Every lesson ends with a geological payoff.
4. **2D → 3D.** A topic may start in 2D but always makes the jump to 3D, and stays there unless 3D would exceed the course level.
5. **Necessity test.** A topic is included only if later structural-geology lessons use it or it directly explains a geological structure or measurement.
6. **University-level accuracy.** Equations, assumptions, coordinate frames (x/y/z for math, NED for geology), units, sign conventions (compression positive), and limitations are explicit. Illustrations are clearly distinguished from exact calculations.
7. **Progressive disclosure** and **predict before reveal.**
8. **One coherent laboratory per topic.** Guided lessons, open exploration, and presentation share the same interactive scenes.
9. **Accessible by more than color.** Labels, line patterns, arrowheads, and text reinforce every color-coded distinction.
10. **Present-first, expansion-ready.** Designed for lecture projection, without blocking Lab and Self-study modes.
11. **Reusable architecture.** Topic-specific models and scenes plug into a shared lesson registry, equation panel, navigation, and presentation system.

## Current state

The current build (v0.5.0) contains an early force-to-stress-state sequence. Part of it is the engineering-statics material the curriculum excludes. [Build 00](curriculum/build-00-rework.md) removes that material, introduces the multi-lesson registry, and moves the reusable pieces (force-vector lab, traction decomposition, stress-state scene) into seed versions of lessons M1, S1–S3, S7, and S10. After that, lessons are built one per session in curriculum order.
