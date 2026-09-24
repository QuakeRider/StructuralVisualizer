# Roadmap

Structural Visualizer is planned as a modular learning environment for a full university structural-geology curriculum. The force-to-stress-state experience is the first vertical slice, not the product boundary. The broader topic map and experience principles are maintained in [CURRICULUM_VISION.md](CURRICULUM_VISION.md).

This roadmap is deliberately iterative. Curriculum order should be reviewed with instructors, and each module should be tested with students before its interaction pattern is generalized.

## Platform milestone 1 — First vertical slice

**Status: original prototype superseded by the 0.4 redesign**

- Force and area foundations.
- Ten selectable three-dimensional stress states.
- Generic deformable block, vectors, tensor display, and qualitative response.
- Guided, Explore, and Present modes.
- Offline single-file classroom build.
- Separated domain, lesson, interface, and renderer layers.

The prototype established technical feasibility. Its guided foundation steps, visual hierarchy, typography, accessibility, interaction depth, and mode-state handling require redesign before this becomes the pattern for the larger curriculum.

Exit condition: the opening module functions as a coherent university-level interactive laboratory rather than a sequence of illustrated slides.

## Platform milestone 2 — Shared learning laboratory

**Status: implemented in prototype form; validation next**

- Replace the separate foundation SVG with a reusable interactive 3D force laboratory. **Implemented.**
- Support direct manipulation and numerical entry for vectors, surfaces, and contact area.
- Introduce average traction and normal/shear decomposition accurately before tensor notation.
- Establish a minimal two-column guided layout with readable typography.
- Replace persistent lesson navigation and redundant readouts with progressive disclosure.
- Introduce a colorblind-safe semantic palette with labels, shapes, and line patterns.
- Correct input continuity, mode transitions, keyboard operation, and responsive behavior.
- Define shared control, scene, lesson-step, feedback, and presentation contracts.

Exit condition: classroom validation confirms that later modules can reuse the shell and interaction system without inheriting stress-specific assumptions.

## Platform milestone 3 — Classroom validation

**Status: follows redesign**

- Test the standalone file on the intended Windows classroom computer.
- Run the opening module with students and instructors.
- Record misconceptions, interaction failures, accessibility barriers, and actual lesson duration.
- Verify that construction and prediction tasks improve explanation rather than merely add clicks.
- Revise the shared design system before building several additional modules.

Exit condition: the platform pattern has evidence from realistic classroom use.

## Curriculum track A — Stress analysis

**Status: first module in progress**

- Force vectors, surfaces, contact area, and average traction.
- Normal and shear traction components.
- Three-dimensional stress tensor and sign convention.
- Principal stresses and principal directions.
- Stress transformation and Mohr diagrams.
- Mean and deviatoric stress and relevant invariants.

Exit condition: students can move between force on a plane, tensor representation, transformed planes, and common stress states.

## Curriculum track B — Strain and deformation kinematics

**Status: planned**

- Displacement, rotation, distortion, and dilation.
- Normal and shear strain.
- Homogeneous and heterogeneous deformation.
- Infinitesimal and finite strain.
- Strain ellipse and strain ellipsoid.
- Pure shear, simple shear, progressive deformation, and strain paths.
- Coaxial and non-coaxial deformation.

Exit condition: students can distinguish stress from strain and explain how measured geometry records a deformation history.

## Curriculum track C — Material behavior and rheology

**Status: planned**

- Elastic, viscous, plastic, and viscoelastic behavior.
- Stiffness, Poisson coupling, yield, and time dependence.
- Temperature, pressure, strain-rate, and material controls.
- Layered and heterogeneous material response.

Exit condition: students can explain why the same loading may produce different responses under different stated material assumptions.

## Curriculum track D — Brittle structures

**Status: planned**

- Fractures, joints, faults, and fault-slip kinematics.
- Confining pressure, friction, strength, and failure criteria.
- Stress orientation versus fracture or slip orientation.
- Linked structures and geological interpretation.

Exit condition: failure and slip visuals are driven by explicit criteria and students can distinguish stress, strength, and resulting structure.

## Curriculum track E — Ductile structures and folds

**Status: planned**

- Fold geometry, elements, classification, and three-dimensional form.
- Buckling, bending, flexural slip, and flow concepts.
- Foliations, lineations, shear zones, and kinematic indicators.
- Relationships among stress, strain, rheology, and structures.

Exit condition: students can describe, classify, manipulate, and interpret common ductile structures in three dimensions.

## Curriculum track F — Structural data and spatial reasoning

**Status: planned**

- Strike, dip, trend, plunge, and rake.
- Stereographic projections and orientation statistics.
- Geological maps, structure contours, and cross-sections.
- Apparent dip, three-point problems, and outcrop patterns.
- Balanced sections and restoration where appropriate.

Exit condition: students can move confidently among field measurements, three-dimensional geometry, projections, maps, and sections.

## Curriculum track G — Synthesis

**Status: exploratory**

- Connect hand-sample, outcrop, map, and regional scales.
- Reconstruct deformation histories and overprinting relationships.
- Compare multiple interpretations against observations and assumptions.
- Integrate geometry, mechanics, kinematics, and geological context.

## Course-platform capabilities

**Status: exploratory**

- Curriculum and lesson registry.
- Student progress and resume behavior.
- Instructor-authored activities and presentation sequences.
- Accessible non-pointer and non-color alternatives.
- Localization and unit preferences.
- Hosted deployment and optional analytics.

## Work-selection rules

1. Treat every topic as a module within Structural Visualizer, not as an extension of the stress-state explorer.
2. Prefer reusable interaction and teaching patterns, but do not force unrelated scientific topics into one renderer.
3. Validate scientific scope and classroom value before expanding a module deeply.
4. Prefer a few excellent interactive activities over broad but shallow slide-like coverage.
5. Keep the full curriculum vision visible while implementing one bounded vertical slice at a time.
