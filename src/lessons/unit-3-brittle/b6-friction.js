// B6 — Friction and reactivation of existing planes. Spec: docs/curriculum/unit-3-brittle.md (B6).
// Frame: NED (x = North, y = East, z = Down); stress compression positive.
// Traction form on screen: 𝐭 = 𝛔𝐧 with 𝐧 the downward pole of the plane, which
// points into the footwall, so 𝐭 is the push of the hanging wall on the footwall.
// Built ahead of its prerequisites (B3, B4, S9, O3) for classroom use, so the steps
// restate the Coulomb line, the 3D Mohr region, and effective stress where they
// need them. This lesson builds the first stereonet (O3 extends it).

import { abs, bound, frac, inline, live, math, mi, mn, mo, mtext, row, sub, subsup, vec } from '../mathml.js';

const sigma = (index) => sub(mi('σ'), mn(String(index)));
const SIGMA_N = sub(mi('σ'), mi('n'));
const SIGMA_N_EFF = subsup(mi('σ'), mi('n'), mo('′'));
const TS = sub(mi('T'), mi('s'));
const MU_S = sub(mi('μ'), mi('s'));
const PF = sub(mi('P'), mi('f'));
const EQ = mo('=');
const MINUS = mo('−');
const PLUS = mo('+');
const MPA = mtext(' MPa');

// Bound symbols: each maps to one object in the block, the Mohr diagram, or the stereonet.
const S1 = bound('sigma-1', sigma(1));
const S3 = bound('sigma-3', sigma(3));
const SN = bound('normal-stress', SIGMA_N);
const TAU = bound('shear-stress', mi('τ'));
const N = bound('pole', vec('n'));
const T = bound('traction', vec('t'));
const MUS = bound('friction', MU_S);
const C = bound('intact', mi('C'));
const TS_LINE = bound('ts-line', TS);
const TS_MAP = bound('ts-map', TS);
const P_F = bound('pf', PF);

// Inline math for prose.
const I = {
  s1: inline(sigma(1)),
  s2: inline(sigma(2)),
  s3: inline(sigma(3)),
  sn: inline(SIGMA_N),
  snEff: inline(SIGMA_N_EFF),
  tau: inline(mi('τ')),
  mu: inline(mi('μ')),
  mus: inline(MU_S),
  c: inline(mi('C')),
  ts: inline(TS),
  pf: inline(PF),
  n: inline(vec('n')),
  t: inline(vec('t')),
  sigma: inline(vec('σ')),
};

const SYMBOL = {
  s1: { symbol: sigma(1), sceneRef: 'sigma-1', description: 'Largest compression: the vertical arrows on the block, and the right end of the big Mohr circle' },
  s3: { symbol: sigma(3), sceneRef: 'sigma-3', description: 'Smallest compression: the dotted east–west arrows, and the left end of the big circle' },
  sn: { symbol: SIGMA_N, sceneRef: 'normal-stress', description: 'Normal stress: the part of the push straight across the plane (violet, dashed)' },
  tau: { symbol: mi('τ'), sceneRef: 'shear-stress', description: 'Shear stress: the part of the push along the plane (pink, dashed)' },
  n: { symbol: vec('n'), sceneRef: 'pole', description: 'Pole to the plane: the unit normal pointing down into the footwall' },
  t: { symbol: vec('t'), sceneRef: 'traction', description: 'Traction: the push of the hanging wall on the footwall, per unit area (orange)' },
  mus: { symbol: MU_S, sceneRef: 'friction', description: 'Sliding friction: the slope of Byerlee’s line (green), 0.85 for most rocks' },
  sliding: { symbol: row(mi('τ'), EQ, MU_S, SIGMA_N), sceneRef: 'friction', description: 'Byerlee’s friction line (green): the shear stress an existing plane can hold' },
  intact: { symbol: row(mi('τ'), EQ, mi('C'), PLUS, mi('μ'), SIGMA_N), sceneRef: 'intact', description: 'Coulomb line for intact rock (gray, dashed): the shear stress unbroken rock can hold' },
  c: { symbol: mi('C'), sceneRef: 'intact', description: 'Cohesion: the extra strength of unbroken rock, where the dashed line meets the τ axis' },
  tsLine: { symbol: TS, sceneRef: 'ts-line', description: 'Slip tendency: the slope of the dotted line from the origin to the plane’s point' },
  tsMap: { symbol: TS, sceneRef: 'ts-map', description: 'Slip tendency of every plane: the color at each pole on the stereonet' },
  critical: { symbol: row(TS, mo('≥'), MU_S), sceneRef: 'critical', description: 'Planes that would slip: the hatched part of the stereonet' },
  pf: { symbol: PF, sceneRef: 'pf', description: 'Pore-fluid pressure: it shifts every point left by Pf (blue arrow)' },
};

const SLIDING_LINE = bound('friction', row(mi('τ'), EQ, MU_S, SIGMA_N));
const INTACT_LINE = bound('intact', row(mi('τ'), EQ, mi('C'), PLUS, mi('μ'), SIGMA_N));

const TRACTION = {
  id: 'traction',
  html: math(T, EQ, vec('σ'), N, EQ, live('traction', 'traction'))
    + math(SN, EQ, T, mo('⋅'), N, EQ, live('sigmaN', 'normal-stress'), MPA)
    + math(TAU, EQ, abs(T, MINUS, SN, N), EQ, live('tau', 'shear-stress'), MPA)
    + `<small>${I.n} is the pole, pointing down into the footwall; ${I.t} (NED components, MPa) is the hanging wall’s push on it. Compression is positive.</small>`,
  symbols: [SYMBOL.t, SYMBOL.n, SYMBOL.sn, SYMBOL.tau],
};

const SLIP_TENDENCY = {
  id: 'slip-tendency',
  html: math(TS_LINE, EQ, frac(TAU, SN), EQ, live('ts', 'ts-line'))
    + math(mtext('slips when'), '<mspace width="0.4em"></mspace>', TS, mo('≥'), MUS, EQ, mn('0.85')),
  symbols: [SYMBOL.tsLine, SYMBOL.tau, SYMBOL.sn, SYMBOL.mus],
};

const MAP = {
  id: 'map',
  html: math(TS_MAP, EQ, frac(TAU, SN))
    + math(mtext('hatched:'), '<mspace width="0.4em"></mspace>', bound('critical', row(TS, mo('≥'), MU_S)))
    + math(mtext('this plane:'), '<mspace width="0.2em"></mspace>', TS, EQ, live('ts', 'pole'), mo(','), '<mspace width="0.3em"></mspace>', live('slipsText', 'critical')),
  symbols: [SYMBOL.tsMap, SYMBOL.critical, SYMBOL.n],
};

/** Mapped faults for the ranking step: strike/dip with the right-hand rule. */
const MAPPED_FAULTS = Object.freeze([
  { id: 'A', label: 'A', strike: 0, dip: 65, description: '000°/65° E' },
  { id: 'B', label: 'B', strike: 90, dip: 60, description: '090°/60° S' },
  { id: 'C', label: 'C', strike: 0, dip: 30, description: '000°/30° E' },
]);

const MOHR_ONLY = { showStereonet: false };

export default {
  id: 'B6',
  status: 'built',
  steps: [
    {
      id: 'weak-planes',
      label: 'Old planes are weak',
      title: 'Broken rock is weaker than intact rock',
      activeLabel: 'Existing planes are weaker',
      body: `Crust is full of old breaks: faults, joints, and bedding planes. The tan plane in the block is one of them. On the Mohr diagram (right), intact rock fails on the Coulomb line ${inline(mi('τ'), EQ, mi('C'), PLUS, mi('μ'), SIGMA_N)} (gray, dashed; B3). An existing plane only has to overcome friction, so it follows ${inline(mi('τ'), EQ, MU_S, SIGMA_N)} (green). The circle shows the stress: σ1 at the right end, σ3 at the left.`,
      task: 'Hover each line and its equation to link them.',
      visualKind: 'friction',
      controls: [],
      labOptions: { ...MOHR_ONLY, showPoint: false, showRegion: false, showTraction: false, showPole: false, showSlip: false },
      initialLabState: { strike: 0, dip: 65, sigma1: 130 },
      equations: [
        {
          id: 'two-lines',
          html: math(mtext('intact rock:'), '<mspace width="0.2em"></mspace>', INTACT_LINE)
            + math(mtext('old plane:'), '<mspace width="0.2em"></mspace>', SLIDING_LINE)
            + math(C, EQ, mn('20'), MPA, mo(','), '<mspace width="0.6em"></mspace>', mi('μ'), EQ, MUS, EQ, mn('0.85'))
            + '<small>Illustrative values: here both lines have the same slope.</small>',
          symbols: [SYMBOL.intact, SYMBOL.sliding, SYMBOL.c, SYMBOL.mus],
        },
      ],
      prompt: 'In this diagram both lines have the same slope. Why does the line for the existing plane sit lower?',
      choices: [
        { id: 'no-cohesion', label: 'The plane is already broken, so it has no cohesion', correct: true, feedback: 'Right. Cohesion C is the strength of the bonds that hold unbroken rock together. On an existing plane those bonds are already broken, so only friction resists sliding and the line starts at the origin.' },
        { id: 'less-friction', label: 'Sliding has a lower friction coefficient', correct: false, feedback: 'Not here: both lines have the same slope, μ = 0.85. The whole gap between them is the cohesion C.' },
        { id: 'less-normal', label: 'The normal stress on the plane is lower', correct: false, feedback: 'The comparison is at the same normal stress: pick any σn and read both lines above it. The existing plane holds less shear stress because it has no cohesion.' },
      ],
    },
    {
      id: 'byerlee',
      label: 'Byerlee’s law',
      title: 'Byerlee’s law: nearly all rocks slide alike',
      activeLabel: 'Byerlee’s friction law',
      body: `In 1978 James Byerlee gathered laboratory friction tests on many rock types. For normal stresses up to about 200 MPa (the upper crust), the shear stress needed to slide fits one line, ${inline(mi('τ'), EQ, mn('0.85'), SIGMA_N)}, whatever the rock. At higher normal stress the fit is ${inline(mi('τ'), EQ, mn('50'), MPA, PLUS, mn('0.6'), SIGMA_N)}. Look for the slight bend in the green line at 200 MPa. The main exception is gouge rich in some clay minerals, which can slide at much lower friction.`,
      task: 'Hover the green line. Then work out the shear stress needed to slide.',
      visualKind: 'friction',
      controls: [],
      labOptions: { ...MOHR_ONLY, showPoint: false, showRegion: false, showTraction: false, showPole: false, showSlip: false },
      initialLabState: { strike: 0, dip: 65, sigma1: 130 },
      equations: [
        {
          id: 'byerlee',
          html: math(bound('friction', row(mi('τ'), EQ, mn('0.85'), SIGMA_N)))
            + math(bound('friction', row(mi('τ'), EQ, mn('50'), PLUS, mn('0.6'), SIGMA_N)))
            + `<small>Stresses in MPa. The first line holds for ${I.sn} below 200 MPa, the second above.</small>`,
          symbols: [SYMBOL.sliding],
        },
      ],
      prompt: `An old fault carries a normal stress ${I.sn} = 50 MPa. What shear stress ${I.tau} makes it slide? (MPa)`,
      answer: {
        value: 42.5,
        tolerance: 0.5,
        correctFeedback: 'Correct: τ = 0.85 × 50 = 42.5 MPa. Below that the fault holds; at 42.5 MPa it slides.',
        wrong: [
          { value: 62.5, feedback: 'That is intact rock: 20 + 0.85 × 50. An existing fault has no cohesion, so drop the C.' },
          { value: 50, tolerance: 1, feedback: 'That would be μ = 1. Byerlee’s coefficient below 200 MPa is 0.85.' },
          { value: 30, feedback: 'The 0.6 slope applies only above 200 MPa, and it comes with a 50 MPa intercept. At 50 MPa, use τ = 0.85σn.' },
          { value: 80, tolerance: 1, feedback: 'That is the high-stress line, 50 + 0.6 × 50, used outside its range. At 50 MPa, use τ = 0.85σn.' },
        ],
        fallbackFeedback: 'Use the low-stress line: τ = 0.85 × σn with σn = 50 MPa.',
      },
    },
    {
      id: 'every-plane-a-point',
      label: 'Every plane is a point',
      title: 'Every plane is a point on the Mohr diagram',
      activeLabel: 'Planes on the 3D Mohr diagram',
      body: `Turn the old plane with the strike and dip sliders. The stress pushes on it with a traction ${I.t} = ${I.sigma}${I.n} (orange). That push has a part straight across the plane, ${I.sn}, and a part along it, ${I.tau}. Each plane plots as one point (${I.sn}, ${I.tau}). In 3D there are three Mohr circles, one for each pair of principal stresses, and every plane plots on them or in the shaded region between them (S9). Here σ1 is vertical, σ2 points north–south, and σ3 east–west.`,
      task: 'Turn the plane and watch its point move. Find where it goes when the plane contains σ2.',
      visualKind: 'friction',
      controls: ['strike', 'dip'],
      labOptions: { ...MOHR_ONLY, showTraction: true, showPole: true, showProjections: true, showSlip: false },
      initialLabState: { strike: 30, dip: 50, sigma1: 150 },
      equations: [TRACTION],
      prompt: `σ2 points north–south, so a plane striking 000° (or 180°) contains it. Where does such a plane plot?`,
      choices: [
        { id: 'big-circle', label: 'On the big σ1–σ3 circle', correct: true, feedback: 'Right. A plane that contains σ2 feels only σ1 and σ3, so it lies on their circle. That is the 2D Mohr circle from S6 and B7. Every other plane plots inside the shaded region.' },
        { id: 'small-circle', label: 'On one of the small circles', correct: false, feedback: 'Set strike to 000° and watch the point: it rides the outer circle. The small circles hold planes that contain σ3 (σ1–σ2 circle) or σ1 (σ2–σ3 circle).' },
        { id: 'axis', label: 'On the σn axis, with no shear', correct: false, feedback: 'Only planes perpendicular to a principal stress have no shear. A plane that contains σ2 feels both σ1 and σ3, so it has shear.' },
      ],
    },
    {
      id: 'slip-tendency',
      label: 'Slip tendency',
      title: 'Slip tendency: will this plane slide?',
      activeLabel: 'Slip tendency',
      body: `A plane slides when its shear stress reaches the friction line: ${inline(mi('τ'), mo('≥'), MU_S, SIGMA_N)}. Divide both sides by ${I.sn} to get the slip tendency, ${inline(TS, EQ, frac(mi('τ'), SIGMA_N))}. On the Mohr diagram, ${I.ts} is the slope of the dotted line from the origin to the plane’s point. The plane slips when that line is as steep as the green friction line, ${I.ts} ≥ ${I.mus} = 0.85.`,
      task: 'Turn the plane until it would slip, then press Slip.',
      visualKind: 'friction',
      controls: ['strike', 'dip', 'slip'],
      labOptions: { ...MOHR_ONLY, showTraction: true, showPole: true, showTsLine: true, showSlip: true },
      initialLabState: { strike: 30, dip: 50, sigma1: 150 },
      goal: { text: 'Find a plane that would slip (Ts ≥ 0.85).', check: (lab) => Boolean(lab.slips) },
      equations: [SLIP_TENDENCY],
      prompt: `A plane carries ${I.sn} = 60 MPa and ${I.tau} = 45 MPa. What is its slip tendency ${I.ts}?`,
      answer: {
        value: 0.75,
        tolerance: 0.01,
        correctFeedback: 'Correct: Ts = 45/60 = 0.75. That is below 0.85, so this plane holds.',
        wrong: [
          { value: 1.33, tolerance: 0.02, feedback: 'That is σn/τ, upside down. Slip tendency is shear over normal: τ/σn.' },
          { value: 0.85, tolerance: 0.005, feedback: '0.85 is the friction threshold μs. Compute this plane’s own ratio, τ/σn, and compare it with 0.85.' },
          { value: 15, tolerance: 0.5, feedback: 'Slip tendency is a ratio, τ divided by σn, not a difference.' },
        ],
        fallbackFeedback: 'Ts = τ/σn: divide 45 by 60.',
      },
    },
    {
      id: 'old-or-new',
      label: 'Old plane or new fault?',
      title: 'Reactivate the old plane, or break a new fault?',
      activeLabel: 'Reactivation or a new fault',
      body: `Now raise ${I.s1} and watch the circle grow. Two things can happen first: the old plane’s point reaches the green friction line and the plane slides, or the circle touches the gray intact line and a new fault breaks through the rock (B3). Whichever happens at the lower ${I.s1} wins, and the stress stops rising there. A well-oriented plane slips long before a new fault can form. A badly oriented one may never slip at all: its point can never reach the friction line, however large the circle grows.`,
      task: `Predict first. Then raise ${I.s1} and see what happens. Try dips of 65°, 45°, and 30°.`,
      visualKind: 'friction',
      controls: ['sigma1', 'strike', 'dip', 'slip'],
      labOptions: { ...MOHR_ONLY, showTraction: true, showPole: true, showTsLine: false, showSlip: true, stopAtFailure: true },
      initialLabState: { strike: 0, dip: 45, sigma1: 60 },
      revealAfterAnswer: ['reactivate', 'newFault', 'outcome'],
      equations: [
        {
          id: 'which-first',
          html: math(sub(S1, mtext('slip')), EQ, live('reactivate', 'plane-point'))
            + math(sub(S1, mtext('new fault')), EQ, live('newFault', 'intact'))
            + math(mtext('first:'), '<mspace width="0.4em"></mspace>', live('outcome', 'plane-point')),
          symbols: [SYMBOL.s1, { symbol: row(mi('τ'), EQ, mi('C'), PLUS, mi('μ'), SIGMA_N), sceneRef: 'intact', description: 'Intact-rock line: the circle touching it means a new fault' }, { symbol: mtext('plane'), sceneRef: 'plane-point', description: 'The old plane’s point: it slips when it reaches the green line' }],
        },
      ],
      prompt: 'The old plane dips 45° east and contains σ2. As σ1 rises, what happens first?',
      choices: [
        { id: 'new-fault', label: 'A new fault breaks through intact rock', correct: true, feedback: 'Right. A 45° plane needs σ1 = 370 MPa to slip, but intact rock breaks at about 227 MPa. The new fault forms at the Coulomb angle, dipping about 65°. Try a 65° dip: it slips at only 140 MPa. A 30° dip never slips.' },
        { id: 'old-slips', label: 'The old plane slips', correct: false, feedback: 'Raise σ1 and watch the tan point: at 45° it climbs toward the friction line too slowly, and the circle reaches the intact line first. A weak plane only helps if it is well oriented.' },
        { id: 'nothing', label: 'Nothing: the rock just gets more stressed', correct: false, feedback: 'The circle keeps growing as σ1 rises, and it must eventually reach one of the two lines. Raise σ1 and see which.' },
      ],
    },
    {
      id: 'slip-tendency-map',
      label: 'All planes at once',
      title: 'A map of slip tendency for every plane',
      activeLabel: 'Slip tendency on the stereonet',
      body: `A stereonet shows every plane orientation at once. Each point inside the circle is the pole of one plane: planes dipping gently have poles near the center, and steep planes have poles near the edge. Color each pole by ${I.ts} and you get a map of which planes are closest to slipping. Hatching marks the planes that would slip. Click or drag on the stereonet to pick a plane, or use the sliders. Change which stress is vertical to see the map follow the stress axes.`,
      task: 'Find the most dangerous planes, then switch regimes and look again.',
      visualKind: 'friction',
      controls: ['regime', 'strike', 'dip'],
      labOptions: { showStereonet: true, showTraction: false, showPole: true, showTsLine: true, showSlip: false },
      initialLabState: { strike: 30, dip: 50, sigma1: 150 },
      equations: [
        MAP,
        {
          id: 'dilation',
          html: math(sub(mi('T'), mi('d')), EQ, frac(row(S1, MINUS, SN), row(S1, MINUS, S3)), EQ, live('td', 'normal-stress'))
            + '<small>Aside: dilation tendency is how easily the plane opens instead. It is 1 for planes perpendicular to σ3, where joints and veins form (B5).</small>',
          symbols: [SYMBOL.s1, SYMBOL.sn, SYMBOL.s3],
        },
      ],
      prompt: 'Where are the planes most likely to slip?',
      choices: [
        { id: 'coulomb', label: 'Planes that contain σ2, about 25° from σ1', correct: true, feedback: 'Right. The two hatched patches are the conjugate Coulomb orientations: β = 45° − φ/2 ≈ 25° from σ1 with μ = 0.85, containing σ2. Old planes in those orientations are the first to slip.' },
        { id: 'perpendicular', label: 'Planes perpendicular to σ1', correct: false, feedback: 'Those planes carry the largest normal stress and no shear at all: Ts = 0. In the normal regime their pole is the center of the net, the darkest spot.' },
        { id: 'forty-five', label: 'Planes at 45° to σ1', correct: false, feedback: 'The 45° planes carry the most shear, but also a lot of normal stress. Friction favors planes turned toward σ1, about 25° from it, where τ/σn is largest.' },
      ],
    },
    {
      id: 'rank-faults',
      label: 'Rank the faults',
      title: 'Which mapped fault is closest to slipping?',
      activeLabel: 'Ranking faults by slip tendency',
      body: `A geologist maps three old faults near a planned reservoir (strike/dip, right-hand rule). The stress is a normal-faulting state with ${I.s1} vertical and ${I.s3} east–west. The letters on the stereonet are the faults’ poles, and the same letters on the Mohr diagram are their points. Ranking faults by ${I.ts} this way is how engineers screen faults near dams, wells, and waste-injection sites.`,
      task: 'Use the stereonet and the Mohr diagram to rank the faults. Select a fault to see its values.',
      visualKind: 'friction',
      controls: ['faults'],
      labOptions: { showStereonet: true, showTraction: false, showPole: true, showTsLine: true, showSlip: false, showMarkers: true },
      initialLabState: { strike: 0, dip: 65, sigma1: 130, fault: 'A' },
      mappedFaults: MAPPED_FAULTS,
      revealAfterAnswer: ['ts'],
      equations: [MAP],
      prompt: 'Which fault has the highest slip tendency?',
      choices: [
        { id: 'A', label: 'A: 000°/65° E', correct: true, feedback: 'Right: A contains σ2 and lies about 25° from the vertical σ1, the best orientation for slip (Ts ≈ 0.80). C is too gently dipping (Ts ≈ 0.41), and B strikes along σ3, so it carries little shear (Ts ≈ 0.23). None slips yet: all are below 0.85.' },
        { id: 'B', label: 'B: 090°/60° S', correct: false, feedback: 'B strikes east–west, along σ3. Its point sits low on the Mohr diagram: little shear for its normal stress.' },
        { id: 'C', label: 'C: 000°/30° E', correct: false, feedback: 'C contains σ2, but it dips only 30°: it is 60° from σ1, far from the best angle. Its pole is well away from the bright patches.' },
      ],
    },
    {
      id: 'fluid-pressure',
      label: 'Fluids wake faults',
      title: 'Fluid pressure can wake up old faults',
      activeLabel: 'Pore pressure and induced earthquakes',
      body: `So far the rock was dry. Water in pores and cracks pushes the fault walls apart and cancels part of the normal stress. What matters for friction is the effective normal stress ${I.snEff} = ${I.sn} − ${I.pf} (B4). Pore pressure does not change the shear stress, so the Mohr circles slide left by ${I.pf} and every point moves toward the friction line. Pumping fluid underground can raise ${I.pf} enough to make a stable fault slip: waste injection near Denver in the 1960s and wastewater disposal in Oklahoma in the 2010s both set off earthquakes on old faults.`,
      task: `Raise ${I.pf} slowly. How much does fault A need before it slips? Watch the hatched area grow on the stereonet.`,
      visualKind: 'friction',
      controls: ['pf', 'faults', 'slip'],
      labOptions: { showStereonet: true, showTraction: false, showPole: true, showTsLine: true, showSlip: true, showMarkers: true, effective: true },
      initialLabState: { strike: 0, dip: 65, sigma1: 130, pf: 0, fault: 'A' },
      mappedFaults: MAPPED_FAULTS,
      equations: [
        {
          id: 'effective',
          html: math(bound('normal-stress', SIGMA_N_EFF), EQ, SN, MINUS, P_F)
            + math(EQ, live('sigmaN', 'normal-stress'), MINUS, live('pf', 'pf'), EQ, live('sigmaNEff', 'normal-stress'), MPA)
            + math(TS_LINE, EQ, frac(TAU, row(SN, MINUS, P_F)), EQ, live('ts', 'ts-line')),
          symbols: [SYMBOL.pf, SYMBOL.sn, SYMBOL.tau, SYMBOL.tsLine],
        },
      ],
      prompt: `Pumping raises ${I.pf} on fault A. What happens to the shear stress ${I.tau} on the fault?`,
      choices: [
        { id: 'unchanged', label: 'It stays the same', correct: true, feedback: 'Right. Fluid pressure pushes equally in all directions, so it has no shear part: τ is unchanged, and only σn′ drops. Fault A slips once Pf reaches about 3 MPa, a small change for a critically stressed fault.' },
        { id: 'increases', label: 'It increases', correct: false, feedback: 'A fluid cannot push sideways, so it adds no shear. Watch the τ value while you raise Pf: it does not move. The point slides left, not up.' },
        { id: 'decreases', label: 'It decreases', correct: false, feedback: 'Pore pressure lowers the normal stress, not the shear stress. The point slides left toward the friction line, which is why faults get weaker.' },
      ],
      final: true,
    },
  ],
};
