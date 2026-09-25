# Structural Visualizer — session guide

An interactive 3D learning environment for an intro university Structural Geology course (3000–4000 level). Its purpose is to make the **mathematics** of structural geology clear, visible, and bound to a 3D model, for students with shaky math and physics.

## Start here

- **Curriculum and build plan:** `docs/curriculum/README.md`. It holds the lesson sequence, binding decisions, conventions, lesson-spec template, and build-session protocol.
- **One session builds one lesson** (or Build 00). Read the README, then only that lesson's spec in `docs/curriculum/unit-*.md`. Check its prerequisites are built before starting.
- **The next task** is `docs/curriculum/build-00-rework.md`, unless the status table in the curriculum README says otherwise.

## Rules that must not drift

- **No engineering statics:** no moments/torques, free-body rotation, support reactions, section cuts, internal resultants, bending, or torsion. They were removed on purpose.
- Every topic must pass the **necessity test**: it is used by a later structural-geology lesson, or it directly explains a geological structure or measurement.
- **Frames:** abstract x/y/z for math and stress construction; **NED** (x = North, y = East, z = Down) for geology. The switch is always shown explicitly. The renderer (Three.js, y-up) converts internally.
- **Compression-positive** stress, with σ1 ≥ σ2 ≥ σ3. The traction sign form on screen is fixed in lesson S4 and never switched silently.
- **Equation–model binding:** every equation symbol maps to a visible scene object; components are always visible; numbers are live.
- **2D → 3D:** topics may start in 2D but must jump to 3D, and stay in 3D unless 3D would exceed course level.
- Each visual is labeled **exact** or **illustrative**. Keep `docs/SCIENTIFIC_SCOPE.md` accurate.
- Never copy text or figures from textbooks (including PSGT). Write original content.

## Code layout

- `src/domain/`: pure math with Vitest tests (write tests first).
- `src/visualization/`: Three.js scenes (and 2D renderers such as the stereonet and Mohr plot).
- `src/lessons/`: lesson data (after Build 00, a registry with one file per lesson under `src/lessons/<unit>/`).
- `src/main.js`: interface state and wiring.

## Commands

- `npm run dev`: dev server.
- `npm test`: unit tests.
- `npm run build` / `npm run release:build`: production build and single-file offline release.

## After each build session

Update the status table in `docs/curriculum/README.md`, `CHANGELOG.md`, `docs/SCIENTIFIC_SCOPE.md`, and, if structure changed, `docs/ARCHITECTURE.md`. If the build showed a spec was wrong, fix the spec.
