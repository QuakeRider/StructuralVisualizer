# Unit 0 — Math foundations

**Frame:** abstract right-handed x, y, z throughout. No geology frame yet.

**Unit purpose:** give students the four tools that all of structural geology's mathematics is built from: vectors, projection with trigonometry, dot and cross products, and matrices as machines that transform vectors. Each tool is taught **as a picture first**. Each lesson closes with a "Where this shows up in geology" preview, so the unit never feels like a detached math class.

**Shared infrastructure first built here:**
- **Vector glyph with component box** (M1). Every later vector (force, traction, slip, pole, principal axis) uses it.
- **Equation-binding panel extensions** (M1): per-component highlighting and live substitution ("|v| = √(3² + (−4)² + 0²) = 5").
- **Rotatable axis triad** (M2), reused by O1, S5, S8, and D5.
- **Plane-with-normal widget** (M3), reused by O2, S2, S3, S7, B3, B6, and B8.
- **Matrix-transform view** (M4): a unit circle or sphere of vectors mapped by a matrix, with columns drawn. Reused by S4, S7, S8, and D1–D5.

---

## M1 — Vectors and components

**Prerequisites:** none. **Used later by:** everything, directly: S1 (force), S3 (traction), O1 (lines), B8 (slip vector); also M2, M3, M4.

**Learning objectives**
- Describe a vector by magnitude and direction, and equivalently by its x, y, z components.
- Compute magnitude from components, and components from a vector drawn in the scene.
- Add vectors tip-to-tail and by components, and show that both give the same result.
- Scale a vector, and form a unit vector from any nonzero vector.

**Math introduced**
- `v = vx î + vy ĵ + vz k̂ = (vx, vy, vz)`
- `|v| = √(vx² + vy² + vz²)` (Pythagoras in 2D first, then extended to 3D by stacking two right triangles)
- `v̂ = v / |v|`
- `a + b = (ax + bx, ay + by, az + bz)`; `c·v = (c·vx, c·vy, c·vz)`

**Equation–model binding**
- The vector arrow ↔ `v`. Its dashed component box edges ↔ `vx`, `vy`, `vz`, each in its axis color and labeled. The two right triangles used in the 3D magnitude derivation can be shown when needed.
- The student drags the arrow tip, or types components. Every symbol in `|v| = …` substitutes live.
- In the addition steps, `a`, `b`, and `a + b` each have distinct line patterns. The component-wise sums are shown as stacked component segments along each axis.

**Step outline** (as built in 0.7.0)
1. *2D first:* a vector in the x–y plane. Drag the tip, and the component arrows track it. The body text says the components describe one vector, not separate forces. Prompt: "What happens to vₓ when you drag straight up?"
2. Magnitude in 2D as a right triangle, with the right-angle marker. Numeric prompt: (3, −4) → 5. The live result stays hidden until the answer is right. Targeted feedback covers 7 (sum of sizes), −1 and 1 (signed sums), and 25 (forgot the root).
3. *Jump to 3D:* the step opens in 2D, and the student presses **3D**. The camera tilts the page back and z rises. The two stacked right triangles (floor diagonal d, then the climb vz) are drawn with right-angle markers. Numeric prompt: (2, 3, 6) → 7, with feedback for 11, √13 (stopped at d), and 49.
4. Negative components. Goal: point v toward −x, +y, −z, which introduces Shift-drag for height. Prompt: which is longer, (−4, 0, 0) or (3, 0, 0)?
5. Unit vectors, in a close-up view with the unit sphere drawn. Prompt: which of (1, 1, 0), (0.6, 0, −0.8), (0.5, 0.5, 0.5) is a unit vector?
6. Addition tip to tail and by components. Component stacks on each axis end at the corners of the sum's dashed box. Prompt: a = (4, 1, 1), b = (−1, 3, 2) → a + b (the sum stays hidden until answered).
7. Steering a sum. Prompt: which b puts a + b on the x axis? Goal: build it by dragging b.
8. Scaling and negation, with a c slider from −2 to 3 and the live |c v| = |c| |v|. Prompt: what does c = −1 do?
9. *Where this shows up:* buttons load a force on a rock face (S1), a fault-slip vector (B8), and a plunging fold hinge (O1), each with an illustrative sketch. The body notes that z is still up here and that O1 switches to north, east, and down.

**Geological payoff:** Every directional quantity in structural geology is a vector: force, traction, displacement, slip, lineation, pole.

**Misconceptions to target**
- Magnitude is the sum of the components (step 2: targeted feedback for 7).
- A negative component means a "smaller" vector (step 4 prompt).
- Components are separate forces rather than one vector described in a frame (step 1 text and feedback).

**Exact vs illustrative:** vectors, components, magnitudes, unit vectors, sums, and scaled vectors are exact. The rock block, fault plane, and fold surface in step 9 are illustrative sketches, and the lesson says so.

**Domain / scenes / tests** (as built)
- `src/domain/vector.js`: `add`, `subtract`, `scale`, `negate`, `dot`, `cross`, `magnitude`, `xyMagnitude`, `normalize`, `snapVector`, `clampVector`, `isUnitVector`, all tested.
- `src/domain/format.js`: the equation number format (true minus sign, bracketed negative squares).
- `src/visualization/VectorScene.js`: a new vector laboratory, used instead of extending the force lab, because M1 needs vectors drawn from the origin in a z-up math frame rather than a force on a block face. It contains:
  - patterned 3D arrows and constant-size labels
  - the component box and stacked triangles
  - the unit sphere, scaled vectors, and tip-to-tail addition with axis stacks
  - illustrative context props
  - the 2D ↔ 3D camera animation (instant under reduced motion) and a close-up view
  - drag on the floor plane, and Shift-drag vertically
- Lesson-runtime features first built here, reusable by every later lesson:
  - numeric answers (`step.answer`), with targeted feedback for known wrong values
  - construction goals (`step.goal.check(labState)`)
  - `revealAfterAnswer`, which hides live values until the prediction is right
  - live outputs bound to scene refs, which get per-component highlighting

**Out of scope:** force and units (S1), and any geological angles (O1).

**Acceptance criteria:** the student can manipulate a vector in 2D and 3D; the component box and magnitude equation stay synchronized; each prompt has an answer and feedback; the 2D → 3D jump happens within the lesson.

---

## M2 — Trigonometry of projection

**Prerequisites:** M1. **Used later by:** M3, M4, O1 (trend/plunge and direction cosines), S2 (cos θ vs cos² θ), S5 (double angles), S8 (rotating frames), D5.

**Learning objectives**
- Use sine and cosine to find components of a vector from its length and an angle, and the reverse.
- Define direction angles and direction cosines, and show that the direction cosines of a unit vector are its components.
- Rotate the coordinate axes under a fixed vector, and compute the new components (2D rotation).
- State why the vector is unchanged when its components change.

**Math introduced**
- `vx = |v| cos α`, `vy = |v| sin α` (2D); `tan α = vy/vx` (with quadrant awareness, via atan2 described in words).
- Direction cosines `(cos α, cos β, cos γ)`, with `cos²α + cos²β + cos²γ = 1`.
- 2D axis rotation by θ: `v'x = vx cos θ + vy sin θ`, `v'y = −vx sin θ + vy cos θ`.
- Double-angle identities, *previewed only* (`cos² θ = ½(1 + cos 2θ)`, `sin θ cos θ = ½ sin 2θ`), each with a small plotted curve. They are used for real in S5.

**Equation–model binding**
- The angle arc in the scene ↔ α or θ, labeled. The projection "shadows" of the vector on each axis ↔ `|v| cos α` and `|v| sin α`.
- The rotatable axis triad (primed axes in a distinct line style) ↔ `x'` and `y'`. The live readout shows both (vx, vy) and (v'x, v'y) side by side while the vector stays fixed.

**Step outline**
1. The unit circle: a unit vector's components *are* (cos α, sin α). Drag the angle.
2. Components of a vector of length L at angle α. Numeric prompt.
3. Inverse: from components back to angle. Quadrant pitfalls highlighted.
4. *3D:* direction angles to each axis; the direction-cosine identity shown as |v̂| = 1.
5. Rotate the axes, not the vector. Prediction: "After rotating the axes 30°, is vx larger or smaller?" Then show the rotation equations with live substitution.
6. Key idea: the physical arrow is the same; only its description changed. This sets up "same stress state, different components" (S5, S8).
7. Double-angle preview: plot `cos² θ` and `sin θ cos θ` as θ sweeps 0–180°, with the note "you will meet these again in S2 and S5."
8. *Where this shows up:* trend/plunge (O1), and a plane rotating inside a stressed cube (S5).

**Geological payoff:** Field angles (trend, plunge, dip) turn into vector components through exactly these relations.

**Misconceptions to target**
- Rotating axes rotates the vector.
- Mixing degrees and radians.
- atan without quadrant checking.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `rotate2D(v, θ)` and `directionCosines(v)` in `vector.js`, with tests, including the invariance of |v| under rotation. Build the rotatable axis triad component.

**Out of scope:** 3D rotation matrices (M4), and geographic angles (O1).

**Acceptance criteria:** axis rotation works with the vector held fixed; both component sets display; the direction-cosine identity is verified live.

---

## M3 — Dot and cross products

**Prerequisites:** M1, M2. **Used later by:** O2 (pole from strike/dip, apparent dip), O4 (angles and intersections), S3 (normal/shear split), S7, B6 (slip tendency), B8 (resolved shear direction), F2 (fold axis from limbs); also M4.

**Learning objectives**
- Compute a dot product two ways, by components and as `|a||b| cos θ`, and interpret it as a projection.
- Split any vector into a part along a unit normal and a part lying in the plane.
- Compute a cross product and interpret it as the vector perpendicular to two vectors, using the right-hand rule, with magnitude equal to the parallelogram area.
- Get the normal to a plane from two lines in the plane.

**Math introduced**
- `a · b = axbx + ayby + azbz = |a||b| cos θ`
- Projection length on a unit vector: `a · n̂`. Projection vector: `(a · n̂) n̂`.
- Decomposition: `v = (v · n̂) n̂ + v∥`, where `v∥ = v − (v · n̂) n̂`
- `a × b = (aybz − azby, azbx − axbz, axby − aybx)`, with `|a × b| = |a||b| sin θ`

**Equation–model binding**
- Plane-with-normal widget: a translucent plane, its unit normal `n̂`, and a draggable vector `v`. The normal part (along `n̂`) and the in-plane part `v∥` are drawn in distinct patterns, and their right-angle marker is visible.
- For the cross product: two draggable vectors `a` and `b` in a plane, their parallelogram shaded (area ↔ |a × b|), and `a × b` drawn perpendicular to it. A right-hand-rule icon flips when the order is reversed.

**Step outline**
1. The dot product as a "shadow": drag `a` around a fixed `b` and watch `a · b` go positive, zero, and negative. Prompt: "When is a · b zero?"
2. Component formula = geometric formula (a live check with both computed).
3. Finding the angle between two vectors from the dot product. Numeric prompt.
4. Plane + normal: split `v` into normal and in-plane parts. Prediction: drag `v` to make the in-plane part vanish. *This exact picture returns as normal/shear traction in S3.*
5. The cross product: build a perpendicular from two in-plane vectors; the right-hand rule; order matters (`b × a = −a × b`).
6. |a × b| as parallelogram area. Parallel vectors give zero.
7. Normal to a plane from two lines lying in it. Preview: "Two measured lines on a bedding surface give you its pole" (O2). "Two fold limbs give you the fold axis" (F2).
8. *Where this shows up:* traction split (S3), and fault slip (B8).

**Geological payoff:** Resolving traction into normal and shear on a fault, computing a pole from field lines, and finding the fold axis from two limbs.

**Misconceptions to target**
- The dot product is a vector.
- The cross product is commutative.
- The in-plane part is "the component along the plane's strike" rather than the full in-plane vector.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `dot`, `cross`, `projectOnto`, and `splitNormalTangential(v, n)` in `vector.js`, with tests. `decomposeTraction` in `forceStress.js` should be refactored to use `splitNormalTangential`. Build the plane-with-normal widget.

**Out of scope:** triple products, and vector calculus.

**Acceptance criteria:** the split visual and equations stay in sync for arbitrary vector and normal orientations; the cross-product direction flips with order; the plane-normal-from-two-lines step works.

---

## M4 — Matrices as transformations

**Prerequisites:** M1–M3. **Used later by:** S4 and S7 (`t = σn`), S5 and S8 (transformation, eigenvectors), D1–D5 (`x' = Fx`, strain ellipse), O1 (frame change as a matrix); also D6.

**Learning objectives**
- Multiply a 2×2 and a 3×3 matrix by a vector, and read each column as "where the basis vector goes."
- Recognize rotation matrices, which keep lengths, and symmetric matrices, which stretch along perpendicular directions.
- Predict how a symmetric matrix deforms a circle (2D) or sphere (3D) into an ellipse or ellipsoid.
- Identify eigenvectors as directions whose image is parallel to the input, and eigenvalues as the stretch factors along them. Find them visually, and for 2D symmetric matrices by formula.
- Change coordinates with `A M Aᵀ` and see that the diagonal form appears in the eigenvector frame.

**Math introduced**
- `M v`: row-by-column products, and equivalently `vx·(col 1) + vy·(col 2) + vz·(col 3)`.
- Rotation matrix `R(θ)` in 2D. Rotations about x, y, and z in 3D, shown but not memorized.
- Symmetric matrix `M = Mᵀ`. Eigen relation `M e = λ e`. For 2D symmetric matrices, closed-form λ and principal angle `tan 2θ = 2m₁₂/(m₁₁ − m₂₂)`. This is exactly the S5 formula, which is noted.
- Change of basis `M' = A M Aᵀ` (shown as "same machine, new axes"). No index notation.

**Equation–model binding**
- The matrix-transform view: a ring (2D) or sphere (3D) of sample vectors, and their images after M. Column vectors `M î`, `M ĵ`, `M k̂` are drawn and linked to matrix columns in the displayed matrix (hovering a column highlights its arrow).
- One highlighted input vector `v` and its image `Mv`. The student sweeps `v` around the circle. When `Mv ∥ v`, the eigen marker lights up and λ is shown.
- Editable matrix entries. The symmetric toggle locks `m₁₂ = m₂₁`.

**Step outline**
1. A matrix as a machine: input arrow → output arrow. Edit the entries and watch the output move.
2. Columns = images of î and ĵ. Prediction: "Where does î go under this matrix?"
3. Rotation matrices keep the circle a circle.
4. Symmetric matrices turn the circle into an ellipse, and the ellipse axes are perpendicular. Prompt: which directions don't rotate?
5. Sweep an input around the circle to find eigenvectors (output ∥ input). Show `Me = λe`. Negative λ means the output reverses.
6. 2D eigen formula for symmetric matrices, with live values. Link: "In S5 this becomes the principal-stress formula."
7. *Jump to 3D:* sphere → ellipsoid, three perpendicular eigenvectors.
8. Change of axes: rotate the frame to the eigenvectors and watch the matrix become diagonal (`A M Aᵀ`). Key idea: same machine, simpler description.
9. *Where this shows up:* stress (σ maps a plane's normal to its traction), strain (F maps original positions to deformed ones). Two meanings, one kind of math.

**Geological payoff:** Principal stresses and strain axes are eigenvectors. The stress ellipsoid and strain ellipsoid are the ellipsoid in step 7.

**Misconceptions to target**
- Matrix multiplication is entry-by-entry.
- Eigenvectors are "the biggest output."
- Diagonalizing changes the physical state.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** new `src/domain/matrix.js` with `mulMatVec`, `mulMat`, `transpose`, `rotationMatrix2D`, `rotationMatrix3D(axis, θ)`, `eigenSymmetric2`, and `eigenSymmetric3` (Jacobi iteration or an analytic cubic, tested against known cases), plus `changeBasis(M, A)`. `deformation.js` helpers (`applyDeformation`, `determinant3`, `tensorToMatrix`) move here or re-export from here. Build the matrix-transform view.

**Out of scope:** general non-symmetric eigenproblems, complex eigenvalues, determinants beyond "area/volume scale factor" (which appears in D1), and index notation.

**Acceptance criteria:** the 2D and 3D matrix views work with editable entries; eigen directions are found both visually and numerically, and agree; the diagonalization step visibly zeros the off-diagonal terms.
