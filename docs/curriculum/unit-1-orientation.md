# Unit 1 — Orientation of lines and planes

**Frame:** starts in abstract x/y/z, and **switches to NED (x = North, y = East, z = Down) in O1 as an explicit, taught step.** From this unit on, geological discussions use NED.

**Unit purpose:** connect field measurements (trend/plunge and strike/dip) to the vectors of Unit 0. A plane is defined by its normal vector, and stress acts on a plane through that normal (`t = σn`, Unit 2). Orientation therefore comes before stress, where it is first needed, rather than being grouped into a later "lab skills" block.

**Shared infrastructure first built here:**
- **NED frame + compass rose + "outcrop block"** (O1): a block-diagram context with a north arrow and a depth axis pointing down.
- **Orientation input widgets** (O1/O2): trend/plunge, strike/dip (RHR), and dip direction/dip, each with synchronized vector readouts.
- **Stereonet renderer** (O3): lower hemisphere, equal-angle and equal-area, plotting lines, great circles, poles, and small circles. It is linked to a 3D reference sphere. Every later unit uses it. *An early version was built by B6 (0.10.0, built early): `src/visualization/Stereonet.js` (SVG, lower-hemisphere equal-area only) draws a raster color map, great circles, poles, principal axes by shape, lettered markers, and click/drag pole picking, bound through `data-ref`. `src/domain/stereonet.js` has `equalAreaPoint`, `equalAreaLine` (inverse), `lineFromVector`, `greatCirclePoints`, and `planeFromPole`. O3 should extend both (equal-angle, net grid, small circles, the 3D sphere) instead of starting over. B8 (0.11.0) added layers for a slip vector, an auxiliary plane, P/T/B markers, and a beach ball, and a per-lesson title and key.*

---

## O1 — The geographic frame and lines

**Prerequisites:** M1, M2, M4. **Used later by:** O2–O4, S7 (switch to NED), S10 (vertical principal stress), B7, F1, F2.

**Learning objectives**
- Explain why geology uses a North–East–Down frame, and convert a vector between abstract x/y/z and NED.
- Convert trend and plunge to a unit vector and back.
- Interpret direction cosines of a line as its components along North, East, and Down.

**Math introduced**
- The frame change as a matrix (from M4). For example, a y-up display frame maps to NED by a fixed permutation/sign matrix. Showing it as a matrix reinforces "same arrow, new description."
- Line (trend T, plunge P) → `û = (cos P cos T, cos P sin T, sin P)` in NED.
- The inverse: `P = asin(uD)`, `T = atan2(uE, uN)` (normalized to 0–360°). A line with negative uD is flipped to point downward (lower-hemisphere convention).

**Equation–model binding**
- The outcrop block with a compass rose. A line (for example a lineation or fold hinge) pierces the block. The trend arc on the horizontal surface ↔ T. The plunge arc in the vertical plane containing the line ↔ P. The component box in N, E, D colors ↔ the direction cosines.
- A toggle shows the abstract x/y/z triad and the NED triad together, and animates the frame change.

**Step outline**
1. Why a new frame: maps use North and East, and geologists measure downward. Animate x/y/z → NED and show the frame-change matrix.
2. Trend: the compass direction of a line's horizontal projection. Drag the line and read T.
3. Plunge: the angle below horizontal. Prompt: "What is the plunge of a vertical line? Of a horizontal one?"
4. Trend/plunge → unit vector. Live substitution, and the component box in NED.
5. Numeric prompt: T = 030°, P = 20° → components. Then the inverse from components.
6. Lower-hemisphere convention: an upward-pointing vector is reported by its downward opposite. Drag a line upward and watch the flip.
7. *Geology:* measure a plunging fold hinge and a mineral lineation in a 3D outcrop.

**Geological payoff:** Lineations, fold hinges, slip directions, and principal-stress axes are all reported as trend/plunge.

**Misconceptions to target**
- Plunge measured from vertical.
- Trend of the upward end.
- Treating NED like a standard math frame, where z is up.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `src/domain/orientation.js` (it already exists from B7 with `lineVector(trend, plunge)`, `planeFromDipDirection`, `planeFromStrike`, `planePole`, `planeUpwardNormal`, `strikeVector`, and `dipVector`; extend it rather than duplicating these) with `vectorToLine`, `toLowerHemisphere`, and `frameMatrix('xyz'→'NED')`, plus round-trip tests. Build the outcrop block and compass.

**Out of scope:** planes (O2), stereonets (O3), and magnetic declination (mentioned in one sentence at most).

**Acceptance criteria:** round-trip conversion is exact (to rounding) across the full range; the frame-change step is animated and uses a visible matrix; the upward-line flip is demonstrated.

---

## O2 — Planes: strike, dip, and poles

**Prerequisites:** O1, M3. **Used later by:** O3, O4, S7 (a plane by strike/dip), B3, B6, B7, B8, F2; also F1.

**Learning objectives**
- Describe a plane by strike/dip (right-hand rule) and by dip direction/dip, and convert between them.
- Compute the pole (normal) vector of a plane from strike and dip, and the reverse.
- Compute apparent dip in any vertical section.

**Math introduced**
- RHR: the dip direction is 90° clockwise from strike.
- Pole (lower hemisphere): trend = strike − 90°, plunge = 90° − dip. As a vector, `n̂ = (sin δ sin s, −sin δ cos s, cos δ)` in NED (s = strike, δ = dip).
- Strike line vector (horizontal) and dip line vector. The pole is their cross product (from M3).
- Apparent dip: `tan α = tan δ · sin β`, where β is the angle between strike and the section line. This is also derived as the dip of the plane's intersection line with a vertical section.

**Equation–model binding**
- A plane in the outcrop block, with a strike line (horizontal, labeled with its azimuth), a dip-direction arrow, a dip-angle arc, and the pole vector with its component box.
- A draggable vertical section plane shows the apparent-dip line and the α arc.
- Strike/dip and dip-direction/dip inputs are synchronized.

**Step outline**
1. A plane intersects the horizontal: the strike line. Drag the plane.
2. Dip: the steepest angle downward, perpendicular to strike. The RHR convention, with a hand icon.
3. Dip direction/dip as an alternative. Convert both ways (numeric prompt).
4. The pole: the plane's normal, pointing downward. Live formula and component box. Prompt: "What is the pole of a horizontal bed?"
5. The pole as the cross product of the strike and dip vectors (M3 callback).
6. Apparent dip: slide a vertical section around. Prediction: "Can the apparent dip ever exceed the true dip?"
7. *Geology:* bedding, a joint, and a fault plane in a road-cut block, each reported three ways.

**Geological payoff:** Every planar structure (bedding, joints, faults, foliation, axial planes) is recorded this way. The pole is what enters `t = σn`.

**Misconceptions to target**
- Strike ambiguity without the RHR.
- The pole lying in the plane.
- Apparent dip larger than true dip.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `planeToPole`, `poleToPlane`, `strikeDipToDipDirection`, and `apparentDip` in `orientation.js`, with tests (including edge cases: vertical and horizontal planes, strike 0/360).

**Out of scope:** projection (O3), and three-point problems or map patterns (parked with Lab mode).

**Acceptance criteria:** all representations stay synchronized; the pole formula matches the cross-product construction; apparent dip is verified against the formula.

---

## O3 — Stereonets

**Prerequisites:** O1, O2. **Used later by:** O4, S8, S9 (principal axes and planes), B6 (slip tendency plots), B7, B8, F2; also B5, F1.

**Learning objectives**
- Explain the stereonet as the lower half of a sphere of directions, flattened.
- Plot and read lines (points), planes (great circles), and poles.
- Distinguish equal-angle from equal-area projection, and say when each is used.

**Math introduced**
- A line through the sphere's center pierces the lower hemisphere at a point. Projection radius: equal-angle `r = R tan(θ/2)`, equal-area `r = R√2 sin(θ/2)`, where θ is the angle from vertical (= 90° − plunge).
- A plane → its great circle. Its pole plots 90° from every point on that circle.

**Equation–model binding**
- Side by side: a 3D reference sphere with the plane or line through its center, and the 2D net. The piercing point and its projection ray animate. Hovering a point on the net highlights the direction in 3D, and the reverse.
- A projection-type toggle, with the radius formula live.

**Step outline**
1. The sphere of directions: every line through the center.
2. Lower hemisphere only, which links to the O1 convention.
3. Project a line: the piercing point moves onto the plane. Its trend is the azimuth on the net; its plunge is the distance from the rim.
4. Planes as great circles. Drag strike and dip and watch the circle move.
5. Poles: plot the pole of the same plane, showing it is 90° from the great circle.
6. Equal-angle vs equal-area: identical inputs, different radii. Equal-area is used for data density (orientation statistics are parked).
7. Numeric and reading prompts: read trend/plunge off the net, and plot a given plane.
8. *Geology:* plot bedding, a joint set, and a lineation from an outcrop.

**Geological payoff:** The stereonet is the working tool for all orientation reasoning in later units.

**Misconceptions to target**
- The great circle "is" the plane's map trace.
- A pole plots on its own great circle.
- The net center is north.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `projectEqualAngle`, `projectEqualArea`, and `greatCirclePoints(plane)` in `src/domain/stereonet.js` (it already exists from B6 with the equal-area projection and `greatCirclePoints`; add equal-angle beside it), with tests. Build the **stereonet renderer** (an SVG or canvas 2D component), designed for reuse: layers for lines, planes, poles, small circles, and shaded regions.

**Out of scope:** contouring, density statistics, and Kamb or Fisher statistics (parked with Lab mode). Rotation on the net is also out of scope unless F7 needs it.

**Acceptance criteria:** 3D and net are bidirectionally linked; both projections are correct at test points; the renderer API is documented for reuse.

---

## O4 — Angles, intersections, and rake

**Prerequisites:** O3, M3. **Used later by:** B3 (conjugate planes and the σ2 intersection), B8 (rake of the slip vector), F2 (fold axis as an intersection); also F6.

**Learning objectives**
- Compute the angle between two lines, or between two planes, using the dot product of their vectors or poles.
- Find the intersection line of two planes using the cross product of their poles, and show it on the net.
- Measure the rake (pitch) of a line lying in a plane, and convert rake ↔ trend/plunge.

**Math introduced**
- Angle between lines: `cos θ = û₁ · û₂`. Between planes: the angle between their poles.
- Intersection: `l = n₁ × n₂`, normalized and flipped to the lower hemisphere.
- Rake: the angle within the plane from the strike direction to the line, with a declared sense convention (RHR strike and measured in the plane, 0–180°).
- A plane from two apparent dips (two lines in the plane): the pole is their cross product (M3 callback), which is the reverse of O2's apparent-dip calculation.

**Equation–model binding**
- Two planes in the outcrop block, with their intersection line drawn and its vector shown as `n₁ × n₂` with the M3 parallelogram cue. The same scene appears on the net, where the great circles cross at the intersection point.
- A line on a plane with a rake arc drawn in the plane.

**Step outline**
1. Angle between two lines, in 3D and on the net.
2. Angle between two planes via their poles.
3. The intersection line of two planes. Prediction: "Where will the great circles cross?"
4. Intersection by cross product (live).
5. Rake of a line in a plane. Convert to trend/plunge.
6. True dip from two apparent dips (for example, two road-cut faces): the cross product gives the pole.
7. *Geology:* the intersection of bedding and cleavage (intersection lineation), a slickenline on a fault given as a rake, and the preview "two fold limbs meet along the fold axis (F2)."

**Geological payoff:** Slip vectors on faults, intersection lineations, and fold axes.

**Misconceptions to target**
- Rake measured from dip direction without saying so.
- Forgetting to flip the intersection to the lower hemisphere.

**Exact vs illustrative:** exact.

**Domain / scenes / tests:** `angleBetween`, `planeIntersection`, `rakeToLine`, `lineToRake`, and `planeFromTwoLines` in `orientation.js`, with tests. *B8 (0.11.0, built early) already added `rakeVector(plane, r)` (the line at rake r, this lesson's `rakeToLine`) and `lineToRake` to `orientation.js`, with tests, using this lesson's convention (0–180° from the RHR strike toward the dip). Reuse them.*

**Out of scope:** rotations of data on the net (for example restoring tilted beds), which are parked unless F7 needs them.

**Acceptance criteria:** the 3D and net intersection agree with the cross product; rake conversions round-trip.
