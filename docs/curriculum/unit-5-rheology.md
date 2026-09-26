# Unit 5 — Rheology

**Frame:** x/y/z for constitutive relations; depth (z down, NED) for R6.

**Unit purpose:** connect the two tensors. Stress (Unit 2) and strain (Unit 4) are only linked through a **material law**, and the same stress produces very different results in different materials, temperatures, and timescales. This unit sits after strain because rheology is the relation *between* stress and strain (or strain rate), and before folds because buckling depends on viscosity contrast. Placing it here is a deliberate curriculum improvement over PSGT, where rheology sits under the Lithosphere chapter.

It also fixes a standing limitation of the tool. The current `computeDeformation` (qualitative stress → shape) is replaced in R2 by real linear elasticity. From then on the stress-state scene's deformation can be exact under stated assumptions.

**Shared infrastructure first built here:**
- **Rheology element builder** (R3/R4): spring, dashpot, and friction slider, combined in series or parallel, with live stress–strain and strain–time plots.
- **Time controls** (R1/R3): load holding, unloading, and time-lapse at geological rates, with a log-time axis.
- **Depth-profile plot** (R5, extended in R6): stress or strength vs depth, with geotherm and pore-pressure inputs.

**Parked, not here:** power-law creep equations, deformation mechanisms (dislocation and diffusion creep), deformation-mechanism maps, and microstructures. See [parked-and-expansions.md](parked-and-expansions.md).

---

## R1 — What rheology is

**Prerequisites:** S10, D4. **Used later by:** R2–R6, F4.

**Learning objectives**
- Explain that rheology links stress to strain or strain rate, and why neither tensor alone predicts deformation.
- Define strain rate (s⁻¹) and estimate geological rates (about 10⁻¹⁴ s⁻¹) from displacement and time.
- Read creep curves (strain vs time under constant stress): the elastic, transient, steady-state, and accelerating stages.

**Math introduced:** `ε̇ = Δε / Δt`; converting cm/yr over km-scale zones to s⁻¹; a creep curve as an ε(t) plot.

**Equation–model binding:** the same stress applied to three blocks labeled "elastic", "viscous", and "brittle-plastic" (schematic responses), with a shared clock. A strain-rate calculator bound to a moving-plate/shear-zone graphic (displacement arrow and zone width). A creep-curve plot.

**Step outline**
1. The same stress, different outcomes: why a material law is needed.
2. Strain rate: a numeric prompt (1 cm/yr across a 1 km zone → about 3×10⁻¹³ s⁻¹).
3. Geological vs laboratory rates: many orders of magnitude apart, and why that matters.
4. The creep curve and its stages.
5. Roadmap: elastic (R2), viscous (R3), plastic and combinations (R4), and Earth controls (R6).

**Geological payoff:** Explains why rocks that shatter under a hammer fold over millions of years.

**Misconceptions to target:** strain rate and strain are the same; rock rheology is a fixed property.

**Exact vs illustrative:** the strain-rate arithmetic is exact; the three block responses are schematic here and become exact in R2–R4.

**Domain / scenes / tests:** new `src/domain/rheology.js` with `strainRate(displacement, width, time)` and unit helpers, with tests.

**Out of scope:** flow laws.

**Acceptance criteria:** the strain-rate calculator is bound to its graphic; the creep curve is annotated.

---

## R2 — Elasticity

**Prerequisites:** R1, S7, D4. **Used later by:** R4, R5 (uniaxial-strain reference state), R6, B2 and B5 (retroactive links to stress concentration and stiff-layer jointing), and the stress-state scene everywhere.

**Learning objectives**
- Apply Hooke's law in 1D, `σ = E ε`, and interpret Young's modulus.
- Define Poisson's ratio ν, and predict lateral strain.
- Apply 3D isotropic linear elasticity to compute the strain (and deformed shape) from any stress tensor, *with sign conventions made explicit* (compression-positive stress produces shortening).
- Explain that elastic strain is recoverable and small (about 10⁻⁴–10⁻³ for rocks before failure).

**Math introduced**
- `σ = E ε` (1D); `ε_lateral = −ν ε_axial`.
- 3D isotropic form, in principal axes: `ε1 = [σ1 − ν(σ2 + σ3)]/E` (and cyclically), with the sign statement for compression-positive stress and shortening-positive strain (or a declared equivalent). Shear: `γ = τ/G`, `G = E / (2(1+ν))`.
- Typical E and ν for granite, sandstone, shale, and salt.

**Equation–model binding:** the stress-state cube from Unit 2 now deforms by **exact elastic strain**, with a display exaggeration factor shown prominently (for example ×1000). E and ν sliders, and a material picker. Strain components are shown next to the stress components, both as matrices, with the linking equations. A loading/unloading control shows recovery.

**Step outline**
1. A spring and 1D Hooke's law: slope = E.
2. Poisson effect: squeeze and it bulges sideways. Prediction: what does ν = 0.5 imply? (Incompressible.)
3. 3D: the full stress tensor → the strain tensor. The existing presets now deform correctly.
4. Real magnitudes are tiny: exaggeration is required, and the lesson says so.
5. Unload: full recovery.
6. *Geology:* elastic strain in the crust stores energy that is released in earthquakes (context), and flexure (one sentence; lithosphere is parked).

**Geological payoff:** Elastic behavior governs the crust's short-term response and sets the stage for brittle failure.

**Misconceptions to target:** elastic means "stretchy" (rubber-like large strains); ν can be anything.

**Exact vs illustrative:** **exact** linear elasticity for small strains; the displayed deformation is exact × a stated exaggeration factor.

**Domain / scenes / tests:** `elasticStrain(σ, E, ν)` → strain tensor, and `deformationFromSmallStrain(ε, exaggeration)` in `rheology.js`, with tests (uniaxial, hydrostatic, pure shear). **Replace** `computeDeformation` in `StressScene` with this, behind a clearly labeled exaggeration control. Update `SCIENTIFIC_SCOPE.md` so the stress-state deformation is no longer described as qualitative.

**Out of scope:** anisotropic elasticity, and dynamic or seismic-wave elasticity.

**Acceptance criteria:** the stress-state scene deforms using the elastic law; the exaggeration is visible; the tests pass for standard cases; the scope documentation is updated.

---

## R3 — Viscous flow

**Prerequisites:** R1, D5. **Used later by:** R4, R6, F4.

**Learning objectives**
- Apply Newtonian viscosity: shear stress is proportional to strain *rate*, `τ = η γ̇` (in simple shear), or equivalently `σ_dev = 2η ε̇`.
- Explain that viscous strain accumulates with time and is not recovered.
- Compare viscosities: water, honey, salt, ice, and the mantle. Estimate deformation timescales.

**Math introduced:** `τ = η γ̇`; `γ(t) = (τ/η) t` under constant stress; the units Pa·s; order-of-magnitude viscosities (salt ~10¹⁷–10¹⁸, ice ~10¹³, upper mantle ~10²⁰–10²¹ Pa·s).

**Equation–model binding:** a dashpot graphic; a simple-shear block (reusing D5) deforming continuously under constant τ with a time scrubber; a strain–time plot with a slope of τ/η. A viscosity picker and a log-time axis.

**Step outline**
1. The dashpot: resistance depends on how fast you push.
2. Constant stress → steady strain rate → strain grows linearly with time.
3. Remove the stress: the strain stays.
4. Viscosity comparison and a time-scale prompt ("how long for γ = 1 in salt under 1 MPa?").
5. *Geology:* salt glaciers and diapirs, glacier flow, and mantle convection (context only).

**Geological payoff:** Explains long-term flow of salt, ice, and hot rock, and sets up competence contrast for F4.

**Misconceptions to target:** viscous means "liquid"; stress sets strain directly.

**Exact vs illustrative:** exact for Newtonian flow.

**Domain / scenes / tests:** `newtonianStrain(τ, η, t)` and `strainRateFromStress` in `rheology.js`, with tests. The time-scrubber integration with the D5 block.

**Out of scope:** non-Newtonian power-law flow (parked, mentioned only as "real rocks often aren't linear").

**Acceptance criteria:** the strain–time slope is bound to τ/η; the no-recovery behavior is shown; the timescale prompt uses real viscosities.

---

## R4 — Plastic and composite behavior

**Prerequisites:** R2, R3. **Used later by:** R5, R6, F4, F5.

**Learning objectives**
- Describe perfectly plastic behavior: no permanent strain below the yield stress, and flow at the yield stress. Relate yield at constant shear stress to a horizontal (von Mises-type) envelope on the Mohr diagram (a B3 callback: the ductile cap of the composite envelope).
- Describe **strain hardening** and **strain softening**, and why softening promotes localization (shear zones, a parked preview).
- Build and interpret composite models: elastic–plastic, Maxwell viscoelastic (a spring and dashpot in series), and optionally Kelvin (in parallel).
- Compute the Maxwell relaxation time and explain why the crust is elastic on short timescales and viscous on long ones.
- Read the two standard laboratory experiments: **constant-stress (creep)** tests and **constant-strain-rate** tests, and what each curve shows.

**Math introduced:** yield condition `σ = σy` (or τ = constant on the Mohr diagram). Hardening and softening as a yield stress that rises or falls with strain, `σy(ε)`. Maxwell: `ε̇ = σ̇/E + σ/η`, with relaxation time `t_M = η/E` (or η/G). Elastic–plastic stress–strain curve. Stress relaxation under fixed strain.

**Equation–model binding:** the rheology element builder: drag springs, dashpots, and sliders into series or parallel. Live stress–strain and strain–time plots update with loading programs (step load = creep test, constant rate, hold = relaxation). The relaxation time is marked on the time axis. A hardening/softening control tilts the slider's yield level with strain. A Mohr-plot thumbnail shows the horizontal yield cap.

**Step outline**
1. Yield: the friction-slider element. Below σy nothing permanent happens; at σy it flows. On the Mohr diagram, this is a horizontal cap.
2. Elastic–plastic: a spring plus a slider. Load, yield, then unload, leaving permanent strain.
3. Hardening vs softening: the yield level climbs or drops with strain. Prediction: which one localizes deformation?
4. Maxwell: a spring and dashpot in series. The instantaneous elastic response is followed by flow.
5. Relaxation time. Prediction: is the mantle elastic or viscous for seismic waves vs for post-glacial rebound?
6. The two lab experiments: run a creep test and a constant-strain-rate test on the same model and compare the curves.
7. Build your own model to match a given creep curve (a challenge).
8. *Geology:* post-glacial rebound (context), elastic–plastic behavior of rocks in experiments, and softening in shear zones (preview).

**Geological payoff:** Explains timescale-dependent behavior, such as the same rock being brittle in an earthquake and flowing over millions of years, and why deformation localizes.

**Misconceptions to target:** a material has one rheology; plastic means moldable like clay; rocks always get stronger as they deform.

**Exact vs illustrative:** exact for the idealized element models.

**Domain / scenes / tests:** `simulateRheology(elements, loadingProgram, dt)` (a simple ODE integrator, with a strain-dependent yield option) in `rheology.js`, with tests against analytic Maxwell and elastic–plastic solutions. The element-builder component.

**Out of scope:** Burgers and more complex models (optional aside), microphysical causes of hardening and softening (parked with the plastic regime), and power-law creep.

**Acceptance criteria:** the builder produces correct curves for Maxwell and elastic–plastic models against analytic results; the relaxation time is correct; hardening and softening change the curves as expected.

---

## R5 — Stress in the crust: reference states and tectonic stress

**Prerequisites:** R2, R4, S10, B4, B7, D5 (uniaxial strain). **Used later by:** R6, B5 (a retroactive link: exhumation joints), (parked) stress measurement and lithosphere.

**Learning objectives**
- Explain what a **reference state of stress** is: an idealized crust with no tectonics, against which real stress is compared. Define **tectonic stress** as the deviation from the reference state.
- Compute the **lithostatic** reference state `σ1 = σ2 = σ3 = ρgz`, and explain why no real solid rock is exactly lithostatic. Combine it with pore pressure into effective stress (B4 callback).
- Derive the **uniaxial-strain** reference state from elasticity. If the crust cannot strain horizontally (a D5 callback: uniaxial strain), then `σh = ν/(1 − ν) · σv`. Compute σh/σv for typical ν, and note the resulting differential stress.
- Explain **thermal** effects on horizontal stress (a laterally constrained layer that cools contracts and loses horizontal stress, `Δσh = E α ΔT / (1 − ν)`), and **uplift/exhumation** effects (unloading plus cooling can drive σh into tension near the surface). Use these to explain *why joints form during exhumation* (closing the B5 loop), and why stiff layers such as sandstone joint more readily than shale.
- Describe **residual stress** (stress locked in after the load is removed) qualitatively.
- Classify tectonic stress with Anderson's regimes (B7 callback), and explain why the differential stress a rock can support increases downward through the brittle crust (preview of R6).

**Math introduced:** `σv = ρgz`; `σh = ν/(1 − ν) · σv` (uniaxial-strain reference); `Δσh = E α ΔT / (1 − ν)` (thermal); `Δσh = ν/(1 − ν) · Δσv` for erosional unloading under uniaxial strain; tectonic stress = total − reference. Typical values: ρ ≈ 2700 kg/m³, a gradient of about 26.5 MPa/km, geothermal gradient about 25–30 °C/km, α ≈ 10⁻⁵ K⁻¹.

**Equation–model binding:** a crustal column block (NED, depth down) with a depth cursor. Live σv and σh profiles are plotted for the selected reference state (lithostatic, uniaxial-strain, or with a tectonic addition), with a Mohr circle at the cursor depth. ν, E, α, and ΔT sliders. An "exhume" control removes overburden and cools the column, and the σh profile swings toward tension near the surface. When σh' reaches −T₀ (B2 callback), vertical joints appear in the stiffest layer of a layered section (the B5 layered-block view). A tectonic-stress slider adds horizontal compression or extension, and the Anderson regime label updates.

**Step outline**
1. Why a reference state? Stress measurements only mean something relative to what a "quiet" crust would have.
2. Lithostatic: the same stress in all directions, ρgz. Numeric prompt at 5 km. What is the differential stress? (Zero.)
3. Uniaxial strain: the crust is confined sideways, so σh depends on Poisson's ratio. Derive `ν/(1−ν)` from R2's 3D Hooke's law with lateral strain set to zero. Numeric prompt: ν = 0.25 → σh/σv?
4. Temperature: cooling a confined layer reduces σh.
5. Exhumation: remove overburden and cool. Prediction: can σh become tensile near the surface? Joints form in the stiff layers (a B5 callback).
6. Residual stress (a qualitative panel).
7. Tectonic stress as the deviation. Add it and see which Anderson regime results.
8. Differential stress grows downward in the brittle crust, which leads into R6.
9. *Geology:* sheet joints parallel to topography in exhumed granite, and jointed uplifted sandstone over unjointed shale.

**Geological payoff:** Turns S10's lithostatic idea into a working model of crustal stress, explains exhumation joints quantitatively, and defines what "tectonic stress" actually means.

**Misconceptions to target:** the crust is lithostatic everywhere; horizontal stress equals vertical stress; tension cannot exist underground; tectonic stress is the total stress.

**Exact vs illustrative:** the reference-state formulas are exact within their stated elastic, laterally constrained assumptions. The exhumation joint appearance uses the B2/B5 criteria; the joint pattern graphic is illustrative.

**Domain / scenes / tests:** `lithostatic(ρ, z)` (from S10), `uniaxialStrainReference(σv, ν)`, `thermalHorizontalStress(E, α, ΔT, ν)`, `exhumationPath(params)`, and `tectonicStress(total, reference)` in `rheology.js` (or a new `crustStress.js`), with tests. The depth-profile plot component (shared with R6, so build it here).

**Out of scope:** stress measurement methods (hydrofracture tests, borehole breakouts, overcoring), the World Stress Map (one context sentence at most), topographic stress, and plate-driving forces (parked).

**Acceptance criteria:** the reference-state profiles and ratios match the formulas; the exhumation path produces tension near the surface for reasonable parameters, and joints appear in the stiff layer; tectonic stress is shown as a deviation and the Anderson regime label updates.

---

## R6 — Controls and the brittle–ductile transition

**Prerequisites:** R4, R5, B6, B7, S10; B11 and B13 recommended. **Used later by:** F4, (parked) lithosphere/tectonics.

**Learning objectives**
- Explain the effects of temperature, confining pressure, strain rate, and fluids on rock behavior (brittle vs ductile).
- Use the terms precisely: **brittle** and **plastic** describe deformation *mechanisms* (fracture and frictional sliding vs crystal-plastic flow), while **ductile** describes a *style* (distributed flow at the scale of observation) that can happen by either mechanism, for example cataclastic flow. Explain why the transition is better called brittle–plastic when mechanisms are meant.
- Build a strength-vs-depth profile: the brittle frictional strength increases with depth (Byerlee + Anderson + pore pressure, from Unit 3), and the ductile strength decreases with temperature. Their intersection is the brittle–ductile transition.
- Predict how the transition moves with the geotherm, strain rate, and fluid pressure.

**Math introduced**
- Brittle: frictional differential stress as a function of depth for the chosen Anderson regime, `Δσ = f(μ, λ, ρgz)`. The linear forms are derived from B6/B7 (for example, thrust: `σ1 − σ3 = β ρ g z (1 − λ)`, with β from μ).
- Ductile: a **simplified, declared-illustrative** temperature-weakening curve, `Δσ_ductile = A · exp(B / T(z))`, with a linear geotherm `T(z) = T₀ + (dT/dz) z`. It is labeled as a stand-in for a power-law creep law (parked).
- Transition depth: where the two curves meet.

**Equation–model binding:** a depth-profile plot (depth increasing downward, NED) with brittle and ductile curves and a shaded strength envelope. Sliders for geotherm, strain rate (shifting the ductile curve), pore-fluid factor λ, and fault regime. A crust block beside it shows a brittle upper layer (faults) and a ductile lower layer (flow/shear zone), with the boundary tracking the intersection. Mohr-circle thumbnails at selected depths (callback to B3/B4).

**Step outline**
1. The controls, one at a time, in schematic experiments: T up → weaker and more ductile; P up → stronger and more ductile; ε̇ down → weaker (ductile).
2. Brittle strength vs depth from Byerlee + Anderson: build the line from Unit 3 ideas.
3. Pore pressure lowers the brittle line (B4 callback).
4. Ductile strength vs depth: the temperature-weakening curve (the von Mises-type cap from R4, now depth-dependent).
5. Terminology check: brittle vs plastic (mechanism) and ductile (style). Prompt: classify three examples.
6. The envelope and its transition depth. Prediction: "A hotter geotherm moves the transition which way?"
7. Compare the three Anderson regimes: thrust is strongest, normal is weakest.
8. *Geology:* the seismogenic zone depth (~10–15 km in continents), and why deep crust flows. Point back to B11's fault-rock depth column (gouge → cataclasite → pseudotachylyte → mylonite) and B13's a − b depth profile: this lesson supplies the strength explanation for both.

**Geological payoff:** Explains why earthquakes are shallow and why structures change style with depth, linking brittle (Unit 3) and ductile (Unit 6 and parked topics).

**Misconceptions to target:** the brittle–ductile transition is a fixed depth; deeper always means stronger.

**Exact vs illustrative:** the brittle curve is exact within Byerlee/Anderson assumptions. **The ductile curve is illustrative** (a simplified functional form), and the interface states this.

**Domain / scenes / tests:** `brittleStrength(z, regime, μ, λ, ρ)`, `ductileStrengthSimplified(z, geotherm, ε̇factor)`, and `bdtDepth(...)` in `rheology.js`, with tests. The depth-profile plot component.

**Out of scope:** real flow-law parameters, mineral-specific curves, lithospheric strength (mantle layering), and jelly-sandwich debates (parked with Plate Tectonics / Plastic regime).

**Acceptance criteria:** the brittle line matches the Unit 3 functions; the transition depth responds correctly to each slider; the illustrative ductile curve is labeled in the interface.
