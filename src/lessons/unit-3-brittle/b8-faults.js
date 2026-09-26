// B8 — Fault geometry, slip, and kinematic axes. Spec: docs/curriculum/unit-3-brittle.md (B8).
// Frame: NED (x = North, y = East, z = Down); stress compression positive.
// Conventions on screen (kept from B6): 𝐧 is the downward pole of the fault, pointing
// into the footwall; 𝐭 = 𝛔𝐧 is the hanging wall's push on the footwall, and its shear
// part 𝛕 points the way the hanging wall slides. 𝐬 is the hanging wall's slip relative
// to the footwall. Rake λ (−180° to 180°) is measured in the fault plane from the strike
// direction, positive up the dip. P ∝ 𝐧 + 𝐬̂, T ∝ 𝐧 − 𝐬̂, B = 𝐧 × 𝐬̂.
// Built ahead of its prerequisites (O4, S7) for classroom use: the steps restate rake
// (O4) and the traction on a plane (S7, as in B6) where they need them.

import { bound, frac, hat, inline, live, math, mi, mn, mo, mtext, row, sub, vec } from '../mathml.js';

const sigma = (index) => sub(mi('σ'), mn(String(index)));
const EQ = mo('=');
const MINUS = mo('−');
const PLUS = mo('+');
const SPACE = (width = 0.4) => `<mspace width="${width}em"></mspace>`;
const E_STRIKE = sub(hat(vec('e')), mtext('strike'));
const E_UP = sub(hat(vec('e')), mtext('up'));
const S_HAT = hat(vec('s'));
const S_STRIKE = sub(mi('s'), mtext('strike'));
const S_DIP = sub(mi('s'), mtext('dip'));
const TAU_STRIKE = sub(mi('τ'), mtext('strike'));
const TAU_UP = sub(mi('τ'), mtext('up'));

// Bound symbols: each maps to one object in the block, the stereonet, or the well log.
const N = bound('pole', vec('n'));
const S = bound('slip', vec('s'));
const SH = bound('slip', S_HAT);
const LAMBDA = bound('rake', mi('λ'));
const SS = bound('strike-slip', S_STRIKE);
const SD = bound('dip-slip', S_DIP);
const T = bound('traction', vec('t'));
const TAU = bound('shear-stress', vec('τ'));
const P_AXIS = bound('p-axis', mi('P'));
const T_AXIS = bound('t-axis', mi('T'));
const B_AXIS = bound('b-axis', mi('B'));
const M = bound('dike', vec('m'));

const I = {
  n: inline(vec('n')),
  s: inline(vec('s')),
  sHat: inline(S_HAT),
  t: inline(vec('t')),
  tau: inline(vec('τ')),
  sigma: inline(vec('σ')),
  lambda: inline(mi('λ')),
  s1: inline(sigma(1)),
  s2: inline(sigma(2)),
  s3: inline(sigma(3)),
  sStrike: inline(S_STRIKE),
  sDip: inline(S_DIP),
  tauStrike: inline(TAU_STRIKE),
  tauUp: inline(TAU_UP),
};

const SYMBOL = {
  n: { symbol: vec('n'), sceneRef: 'pole', description: 'Pole to the fault: the unit normal pointing down into the footwall (white)' },
  hanging: { symbol: mtext('hanging wall'), sceneRef: 'hanging-wall', description: 'The block above the fault' },
  foot: { symbol: mtext('footwall'), sceneRef: 'footwall', description: 'The block below the fault' },
  s: { symbol: vec('s'), sceneRef: 'slip', description: 'Slip vector: how far and which way the hanging wall moved relative to the footwall (green)' },
  sHat: { symbol: S_HAT, sceneRef: 'slip', description: 'Unit slip vector: the direction of slip (green)' },
  sStrike: { symbol: S_STRIKE, sceneRef: 'strike-slip', description: 'Strike-slip part of the slip: along the strike line (yellow, dashed)' },
  sDip: { symbol: S_DIP, sceneRef: 'dip-slip', description: 'Dip-slip part of the slip: up or down the dip (blue, dotted)' },
  lambda: { symbol: mi('λ'), sceneRef: 'rake', description: 'Rake: the angle in the fault plane from the strike direction to the slip, positive up the dip (violet arc)' },
  m: { symbol: vec('m'), sceneRef: 'dike', description: 'Pole of the dike, the offset marker (dark sheet with white edges)' },
  separation: { symbol: sub(mi('d'), mtext('map')), sceneRef: 'separation', description: 'Map separation: the apparent offset of the dike along the fault trace (pink arrow)' },
  throw: { symbol: mtext('throw'), sceneRef: 'strat-gap', description: 'Throw: the vertical part of the slip; for flat beds it equals the missing or repeated thickness in the well' },
  well: { symbol: mtext('well'), sceneRef: 'well', description: 'A vertical well drilled through the faulted block, and its log' },
  t: { symbol: vec('t'), sceneRef: 'traction', description: 'Traction: the hanging wall’s push on the footwall, per unit area (orange)' },
  tau: { symbol: vec('τ'), sceneRef: 'shear-stress', description: 'Shear traction: the part of 𝐭 along the fault (pink, dashed)' },
  s1: { symbol: sigma(1), sceneRef: 'sigma-1', description: 'Largest compression: the thick solid arrows and the square on the stereonet' },
  s3: { symbol: sigma(3), sceneRef: 'sigma-3', description: 'Smallest compression: the thin dotted arrows and the triangle on the stereonet' },
  p: { symbol: mi('P'), sceneRef: 'p-axis', description: 'P axis: the direction of shortening, 45° from the fault (violet, arrows pointing in)' },
  tAxis: { symbol: mi('T'), sceneRef: 't-axis', description: 'T axis: the direction of lengthening, 45° from the fault (pink, arrows pointing out)' },
  b: { symbol: mi('B'), sceneRef: 'b-axis', description: 'B axis: in the fault at right angles to the slip (gray, dashed)' },
  ball: { symbol: mtext('shaded'), sceneRef: 'beach-ball', description: 'The shaded quadrants of the beach ball: compressional first motions, containing T' },
  auxiliary: { symbol: mtext('auxiliary plane'), sceneRef: 'auxiliary', description: 'Auxiliary plane: the second nodal plane, whose pole is the slip vector (dashed)' },
};

const COMPONENTS = {
  id: 'components',
  html: math(S, EQ, SS, E_STRIKE, PLUS, SD, E_UP)
    + math(SS, EQ, mi('s'), mi('cos'), LAMBDA, EQ, live('sStrike', 'strike-slip'))
    + math(SD, EQ, mi('s'), mi('sin'), LAMBDA, EQ, live('sDip', 'dip-slip'))
    + math(mi('s'), EQ, live('slipLength', 'slip'), mo(','), SPACE(0.6), LAMBDA, EQ, live('rake', 'rake'))
    + `<small>${inline(hat(vec('e')))}<sub>strike</sub> points along strike (right-hand rule) and ${inline(hat(vec('e')))}<sub>up</sub> up the dip. Positive ${I.lambda} means the hanging wall went up the dip.</small>`,
  symbols: [SYMBOL.s, SYMBOL.sStrike, SYMBOL.sDip, SYMBOL.lambda],
};

const NAMING = {
  id: 'naming',
  html: math(LAMBDA, EQ, live('rake', 'rake'), mo('→'), SPACE(0.3), live('slipName', 'slip'))
    + math(SS, EQ, live('sStrike', 'strike-slip'))
    + math(SD, EQ, live('sDip', 'dip-slip'))
    + `<small>${I.sDip} &gt; 0: reverse (a thrust if the dip is under 45°); ${I.sDip} &lt; 0: normal. ${I.sStrike} &gt; 0: sinistral; ${I.sStrike} &lt; 0: dextral.</small>`,
  symbols: [SYMBOL.lambda, SYMBOL.s, SYMBOL.sStrike, SYMBOL.sDip],
};

const TRACTION = {
  id: 'traction',
  html: math(T, EQ, vec('σ'), N, EQ, live('traction', 'traction'))
    + math(TAU, EQ, T, MINUS, row(mo('('), T, mo('⋅'), N, mo(')')), N)
    + math(EQ, live('tauVec', 'shear-stress'))
    + math(SH, EQ, frac(TAU, row(mo('|'), TAU, mo('|'))), mo('→'), SPACE(0.3), LAMBDA, EQ, live('rake', 'rake'))
    + math(mtext('slip:'), SPACE(0.3), live('slipName', 'slip'))
    + '<small>NED components (north, east, down) in MPa. 𝐧 points down into the footwall, so 𝐭 is the hanging wall’s push on it.</small>',
  symbols: [SYMBOL.t, SYMBOL.n, SYMBOL.tau, SYMBOL.sHat, SYMBOL.lambda],
};

const KINEMATIC = {
  id: 'kinematic',
  html: math(P_AXIS, mo('∝'), N, PLUS, SH, mo(':'), SPACE(), live('pLine', 'p-axis'))
    + math(T_AXIS, mo('∝'), N, MINUS, SH, mo(':'), SPACE(), live('tLine', 't-axis'))
    + math(B_AXIS, EQ, N, mo('×'), SH, mo(':'), SPACE(), live('bLine', 'b-axis'))
    + '<small>Trend/plunge of the lower end of each axis.</small>',
  symbols: [SYMBOL.p, SYMBOL.tAxis, SYMBOL.b, SYMBOL.n, SYMBOL.sHat],
};

const FAULT_PRESETS = Object.freeze([
  { id: 'normal', label: 'Normal', detail: '000°/60° E, λ −90°', strike: 0, dip: 60, rake: -90 },
  { id: 'thrust', label: 'Thrust', detail: '000°/30° E, λ 90°', strike: 0, dip: 30, rake: 90 },
  { id: 'strike-slip', label: 'Strike-slip', detail: '000°/90°, λ 180°', strike: 0, dip: 90, rake: 180 },
  { id: 'oblique', label: 'Oblique', detail: '045°/60° SE, λ −55°', strike: 45, dip: 60, rake: -55 },
]);

/** The dike used as an offset marker: strike 090°, dipping 30° south, through 250 m south of center at 250 m depth. */
const DIKE = Object.freeze({ strike: 90, dip: 30, point: { x: -250, y: 0, z: 250 } });
/** Where the well is drilled (NED metres): 300 m south and 50 m east of the block center. */
const WELL = Object.freeze({ x: -300, y: 50 });

export default {
  id: 'B8',
  status: 'built',
  steps: [
    {
      id: 'hanging-wall',
      label: 'Hanging wall and footwall',
      title: 'Which block is which?',
      activeLabel: 'Hanging wall and footwall',
      body: `A fault is a surface the rock has slipped along. The block above it is the <strong>hanging wall</strong> and the block below it is the <strong>footwall</strong>. The names come from miners: in a tunnel dug along a fault, the hanging wall hangs over your head and the footwall is under your feet. As in B6, ${I.n} is the pole of the fault pointing down into the footwall. A vertical fault has no block above the other, so it needs a convention: here the hanging wall is the block on the dip-direction side, 90° clockwise from strike.`,
      task: 'Turn the fault with the strike and dip sliders. Hover each block and its name.',
      visualKind: 'fault',
      controls: ['strike', 'dip'],
      labOptions: { showWallLabels: true, showPole: true, showSlipVector: false, slipped: false },
      initialLabState: { strike: 0, dip: 60, rake: -90 },
      equations: [
        {
          id: 'walls',
          html: math(N, EQ, live('nVec', 'pole'), mo(':'), SPACE(), live('nLine', 'pole'))
            + math(bound('hanging-wall', mtext('hanging wall')), mo(':'), SPACE(0.3), mtext('above the fault'))
            + math(bound('footwall', mtext('footwall')), mo(':'), SPACE(0.3), mtext('below it;'), SPACE(0.3), N, SPACE(0.2), mtext('points in'))
            + '<small>NED components (north, east, down) and the pole’s trend/plunge.</small>',
          symbols: [SYMBOL.n, SYMBOL.hanging, SYMBOL.foot],
        },
      ],
      prompt: 'A miner digs a tunnel along this fault, which dips 60° east. Which block is over the miner’s head?',
      choices: [
        { id: 'hanging', label: 'The hanging wall: the east block, above the fault', correct: true, feedback: 'Right. The hanging wall is the block above the fault plane, so it is overhead in the tunnel. On a fault dipping east it is the east block.' },
        { id: 'foot', label: 'The footwall', correct: false, feedback: 'The footwall is under the miner’s feet: it is the block below the fault, the side the pole 𝐧 points into.' },
        { id: 'moved', label: 'Whichever block moved down', correct: false, feedback: 'The names describe position, not motion. Either block can move up or down; the hanging wall is always the one above the fault.' },
      ],
    },
    {
      id: 'slip-vector',
      label: 'The slip vector',
      title: 'The slip vector and its two parts',
      activeLabel: 'Slip vector components',
      body: `When a fault slips, the hanging wall moves relative to the footwall by the <strong>slip vector</strong> ${I.s} (green). ${I.s} lies in the fault plane, so two directions in the plane are enough to describe it: along strike (the horizontal line in the plane) and up or down the dip. Split ${I.s} into those parts, as you split vectors into components in M1 and M2: the strike-slip part ${I.sStrike} and the dip-slip part ${I.sDip}. The angle from the strike direction to ${I.s}, measured in the fault plane, is the <strong>rake</strong> ${I.lambda} (O4 measures the rake of a line; here the slip also has a sense, so ${I.lambda} runs from −180° to 180°).`,
      task: `Change the rake ${I.lambda}. Watch the hanging wall move and the two parts change.`,
      visualKind: 'fault',
      controls: ['rake'],
      labOptions: { showComponents: true, showRake: true, showWallLabels: true, slipped: true },
      initialLabState: { strike: 0, dip: 60, rake: -60 },
      equations: [COMPONENTS],
      prompt: `A fault slipped 120 m at rake ${I.lambda} = 30°. How long is its strike-slip part ${I.sStrike}? (m)`,
      answer: {
        value: 103.9,
        tolerance: 0.5,
        correctFeedback: 'Correct: s cos λ = 120 × cos 30° = 103.9 m along strike. The other 60 m (120 × sin 30°) is up the dip.',
        wrong: [
          { value: 60, tolerance: 0.5, feedback: 'That is s sin λ, the dip-slip part. The rake is measured from the strike line, so the strike-slip part uses the cosine.' },
          { value: 120, tolerance: 0.5, feedback: 'That is the whole slip. Only part of it runs along strike: project it with cos λ.' },
          { value: 69.3, tolerance: 0.5, feedback: 'That is 120 × tan 30°. Projecting onto the strike line uses cos λ.' },
          { value: 138.6, tolerance: 0.5, feedback: 'A component can never be longer than the vector: multiply by cos λ, don’t divide.' },
        ],
        fallbackFeedback: 'Project the slip onto the strike line: s cos λ with s = 120 m and λ = 30°.',
      },
    },
    {
      id: 'classify',
      label: 'Naming faults',
      title: 'Name the fault from its slip',
      activeLabel: 'Classifying fault slip',
      body: `Faults are named by their slip vector. <strong>Dip-slip</strong> faults move up or down the dip: <strong>normal</strong> if the hanging wall goes down (${I.lambda} = −90°), <strong>reverse</strong> if it goes up (${I.lambda} = 90°), and a reverse fault dipping less than 45° is a <strong>thrust</strong>. <strong>Strike-slip</strong> faults move along strike: standing on one block, if the other block moves to your right the fault is <strong>dextral</strong> (right-lateral, ${I.lambda} = 180°), and if it moves left it is <strong>sinistral</strong> (${I.lambda} = 0°). Slip with both parts is <strong>oblique</strong>, named by both. Here slip within 20° of a pure direction takes the pure name.`,
      task: 'Make a thrust fault. Then try each quadrant of the rake.',
      visualKind: 'fault',
      controls: ['rake', 'dip'],
      labOptions: { showComponents: true, showRake: true, showWallLabels: true, slipped: true },
      initialLabState: { strike: 0, dip: 60, rake: -90 },
      goal: { text: 'Make a thrust: reverse slip on a fault dipping less than 45°.', check: (lab) => lab.slipName === 'thrust' },
      equations: [NAMING],
      prompt: `The hanging wall slips with ${I.lambda} = −135°. What kind of fault is it?`,
      choices: [
        { id: 'normal-dextral', label: 'Oblique normal–dextral', correct: true, feedback: 'Right. sin(−135°) < 0, so the dip-slip part goes down the dip (normal), and cos(−135°) < 0, so the strike-slip part points against the strike direction (dextral). Set λ = −135° to see it.' },
        { id: 'normal-sinistral', label: 'Oblique normal–sinistral', correct: false, feedback: 'The dip-slip part is normal, but check the strike-slip part: cos(−135°) is negative, so it points against the strike direction. That is dextral.' },
        { id: 'reverse-dextral', label: 'Oblique reverse–dextral', correct: false, feedback: 'A negative rake sends the hanging wall down the dip: sin(−135°) < 0, so the dip-slip part is normal.' },
        { id: 'reverse-sinistral', label: 'Oblique reverse–sinistral', correct: false, feedback: 'Both signs are negative: sin(−135°) < 0 means normal, and cos(−135°) < 0 means dextral.' },
      ],
    },
    {
      id: 'separation',
      label: 'Slip vs separation',
      title: 'Separation is not slip',
      activeLabel: 'Slip and separation',
      body: `We rarely see the slip vector itself. We see a marker that the fault cut: here a dike (a sheet of igneous rock) dipping 30° south. After the fault slipped, erosion planed the land flat, and the block now shows a map on top and cross-sections on its sides. On each, the two pieces of the dike are offset along the fault trace. That apparent offset is the <strong>separation</strong>. It depends on the slip and on how the marker is oriented, so it can be large when the slip is small, or point the wrong way.`,
      task: `Look from above (Map) with ${I.lambda} = −90°. Then find a slip direction that leaves the dike unbroken on the map.`,
      visualKind: 'fault',
      controls: ['rake', 'view'],
      labOptions: { blockMode: 'cut', showDike: true, dike: DIKE, showSeparation: true, showSlipVector: true, slipped: true, slipLength: 200 },
      initialLabState: { strike: 0, dip: 60, rake: -90, view: '3d' },
      goal: { text: 'Find a slip that leaves no separation on the map (under 10 m).', check: (lab) => lab.mapSeparation !== null && Math.abs(lab.mapSeparation) < 10 },
      equations: [
        {
          id: 'separation',
          html: math(bound('separation', sub(mi('d'), mtext('map'))), EQ, frac(row(M, mo('⋅'), S), row(M, mo('⋅'), vec('u'))), EQ, live('mapSeparation', 'separation'))
            + math(mtext('looks like:'), SPACE(0.3), live('mapSense', 'separation'))
            + math(mtext('true slip:'), SPACE(0.3), LAMBDA, EQ, live('rake', 'rake'))
            + math(SPACE(0), live('slipName', 'slip'))
            + `<small>${inline(vec('m'))} is the dike’s pole and ${inline(vec('u'))} the direction of the fault trace on the map (along strike). If ${I.s} lies in the dike, ${inline(vec('m'), mo('⋅'), vec('s'))} = 0: no separation at all, however far the fault slipped.</small>`,
          symbols: [SYMBOL.separation, SYMBOL.m, SYMBOL.s, SYMBOL.lambda],
        },
      ],
      prompt: `With ${I.lambda} = −90°, the hanging wall slid straight down the dip. Which way does the offset dike on the map make the fault look?`,
      choices: [
        { id: 'sinistral', label: 'Sinistral (left-lateral)', correct: true, feedback: 'Right: the map shows 300 m of apparent left-lateral separation, though the slip had no strike-slip part at all. Dropping the hanging wall and eroding it flat moves the outcrop of the south-dipping dike north. A map alone cannot give the slip.' },
        { id: 'dextral', label: 'Dextral (right-lateral)', correct: false, feedback: 'Look from above (Map). Standing on the west block and facing the fault, the east piece of the dike lies to your left: that looks sinistral.' },
        { id: 'normal', label: 'Normal: the map shows the drop', correct: false, feedback: 'A map is a horizontal surface. It shows where the dike’s trace meets the fault, not how far the block dropped, and here that offset runs along the fault.' },
      ],
    },
    {
      id: 'well',
      label: 'Missing and repeated beds',
      title: 'Faults in a well: missing and repeated beds',
      activeLabel: 'Stratigraphic separation',
      body: `Below ground, geologists find faults in wells. A vertical well that crosses a fault passes from the hanging wall into the footwall. Across a <strong>normal</strong> fault the hanging wall dropped, so the well skips part of the sequence: beds are <strong>missing</strong>. Across a <strong>reverse</strong> fault the hanging wall rose, so the well meets part of the sequence twice: beds are <strong>repeated</strong>. For flat-lying beds the missing or repeated thickness, the stratigraphic separation, equals the <strong>throw</strong>, the vertical part of the slip.`,
      task: 'Switch between normal and reverse slip and compare the well with the normal sequence.',
      visualKind: 'fault',
      controls: ['rake', 'view'],
      labOptions: { blockMode: 'cut', showWell: true, well: WELL, showSlipVector: true, slipped: true, panel: 'well', slipLength: 150 },
      initialLabState: { strike: 0, dip: 60, rake: -90, view: '3d' },
      equations: [
        {
          id: 'throw',
          html: math(bound('strat-gap', mtext('throw')), EQ, row(mo('|'), sub(mi('s'), mi('D')), mo('|')), EQ, live('throw', 'strat-gap'))
            + math(bound('well', mtext('in the well:')), SPACE(0.3), live('wellGap', 'strat-gap'))
            + `<small>${inline(sub(mi('s'), mi('D')))} is the down (D) component of ${I.s}. Here s = 150 m on a fault dipping 60°; the log beside the block names the beds.</small>`,
          symbols: [SYMBOL.throw, SYMBOL.well, SYMBOL.s],
        },
      ],
      prompt: 'A well log shows beds C and D twice. What kind of fault did the well cross?',
      choices: [
        { id: 'reverse', label: 'A reverse fault', correct: true, feedback: 'Right. The hanging wall rose, so the well drills through C and D in the hanging wall, crosses the fault, and meets C and D again in the footwall. Set λ = 90°: in this block beds F to H appear twice.' },
        { id: 'normal', label: 'A normal fault', correct: false, feedback: 'A normal fault drops the hanging wall, so the well goes from higher beds straight into lower ones: part of the sequence is missing, not repeated.' },
        { id: 'strike-slip', label: 'A strike-slip fault', correct: false, feedback: 'Pure strike-slip moves flat beds sideways, so both walls hold each bed at the same depth: nothing is missing or repeated. Try λ = 180°.' },
      ],
    },
    {
      id: 'slickenlines',
      label: 'Slickenlines',
      title: 'Slickenlines record the slip',
      activeLabel: 'Slickenlines and rake',
      body: `Where a fault surface is exposed, slip leaves marks on it. <strong>Slickenlines</strong> are grooves and mineral fibers parallel to the slip. Here the hanging wall is lifted away so you can see the footwall’s surface, and the stereonet shows the fault as a great circle with the slip as a point. A slickenline is a line, so it gives a rake r from 0° to 180° (O4), measured from strike toward the dip, but not which way the block moved. For that, geologists read small steps on the surface: on many surfaces it feels smooth when you rub it the way the missing block moved. The steps drawn here are schematic.`,
      task: `Change ${I.lambda} and follow the slickenlines, the arrow on the stereonet, and the plunge.`,
      visualKind: 'fault',
      controls: ['rake'],
      labOptions: { showHangingWall: false, showSlickenlines: true, showRake: true, showSlipVector: false, slipped: false, panel: 'net', net: { slip: true, pole: false } },
      initialLabState: { strike: 0, dip: 60, rake: -60 },
      equations: [
        {
          id: 'plunge',
          html: math(mi('sin'), mi('p'), EQ, mi('sin'), mi('r'), SPACE(0.2), mi('sin'), mi('δ'), mo('→'), SPACE(0.3), mi('p'), EQ, live('plunge', 'slip'))
            + math(mtext('slickenline:'), SPACE(0.3), mi('r'), EQ, live('lineRake', 'rake'))
            + math(mtext('trend/plunge:'), SPACE(0.3), live('slipLine', 'slip'))
            + `<small>r is the rake of the line (0–180°), δ the fault’s dip, p the plunge. From the slip’s rake: r = −λ when λ ≤ 0, and r = 180° − λ when λ &gt; 0.</small>`,
          symbols: [SYMBOL.lambda, SYMBOL.s],
        },
      ],
      prompt: 'Slickenlines on a fault dipping 60° have rake r = 40°. What is their plunge? (degrees)',
      answer: {
        value: 33.8,
        tolerance: 0.5,
        correctFeedback: 'Correct: sin p = sin 40° × sin 60° = 0.557, so p = 33.8°. The plunge is always less than both the rake and the dip.',
        wrong: [
          { value: 40, tolerance: 0.5, feedback: 'That is the rake, measured inside the fault plane. The plunge is measured down from horizontal: sin p = sin r sin δ.' },
          { value: 34.6, tolerance: 0.3, feedback: 'That is 40 × sin 60°. Multiply the sines, then take the inverse sine: sin p = sin r sin δ.' },
          { value: 60, tolerance: 0.5, feedback: 'That is the dip. Only a line straight down the dip (r = 90°) plunges as steeply as the fault dips.' },
          { value: 20, tolerance: 0.5, feedback: 'Use the sines: sin p = sin 40° × sin 60° = 0.557.' },
        ],
        fallbackFeedback: 'Use sin p = sin r sin δ with r = 40° and δ = 60°, then take the inverse sine.',
      },
    },
    {
      id: 'wallace-bott',
      label: 'Which way does it slip?',
      title: 'Stress sets the slip direction',
      activeLabel: 'The Wallace–Bott hypothesis',
      body: `What sets the direction of slip? In B6 the stress pushed on a plane with a traction ${I.t} = ${I.sigma}${I.n} (orange), and its shear part ${I.tau} (pink) pointed the way the hanging wall would slide. The <strong>Wallace–Bott hypothesis</strong> says the fault slips exactly that way: ${I.sHat} is parallel to ${I.tau}. It assumes a planar fault and one uniform stress. On a fault that is oblique to the stress axes, ${I.tau} is usually oblique too, so the slip is oblique.`,
      task: `Turn the fault and change the stress ratio. Watch the slip on the stereonet. Press Slip to move the hanging wall.`,
      visualKind: 'fault',
      controls: ['regime', 'ratio', 'strike', 'dip', 'slip'],
      labOptions: { stress: true, slipSource: 'stress', showStress: true, showTraction: true, showSlipVector: true, slipped: false, panel: 'net', net: { slip: true, axes: true, pickable: true } },
      initialLabState: { strike: 135, dip: 60, regime: 'normal', ratio: 0.5 },
      equations: [
        TRACTION,
        {
          id: 'ratio',
          html: math(mi('φ'), EQ, frac(row(sigma(2), MINUS, sigma(3)), row(sigma(1), MINUS, sigma(3))), EQ, live('ratio', 'sigma-1'))
            + '<small>The slip direction depends only on the directions of the principal stresses and on φ, not on how large the stresses are.</small>',
          symbols: [SYMBOL.s1, SYMBOL.s3],
        },
      ],
      prompt: `${I.s1} is vertical and ${I.s3} points east–west. A fault strikes 135° and dips 60° to the southwest. Which way does the hanging wall slide?`,
      choices: [
        { id: 'oblique', label: 'Down the dip, but swung toward the west (oblique)', correct: true, feedback: 'Right: λ ≈ −124°, oblique normal–dextral. The least compression σ3 points east–west, so the shear traction pulls the hanging wall west of straight down-dip (southwest).' },
        { id: 'down-dip', label: 'Straight down the dip (pure normal)', correct: false, feedback: 'Pure dip-slip needs the fault to contain σ2 (strike north–south here). This fault is oblique to σ2 and σ3, so τ is oblique: look at the pink arrow.' },
        { id: 'along-strike', label: 'Horizontally along strike', correct: false, feedback: 'With σ1 vertical the shear traction always has a large down-dip part. Look at the pink τ arrow and the green slip point on the stereonet.' },
      ],
    },
    {
      id: 'pt-axes',
      label: 'P and T axes',
      title: 'Kinematic axes: P, T, and B',
      activeLabel: 'P, T, and B axes',
      body: `Seismologists sum up a fault’s motion with three axes. The <strong>P axis</strong> is the direction of shortening and the <strong>T axis</strong> the direction of lengthening. Both lie at 45° to the fault, in the plane that holds ${I.n} and ${I.sHat}, and they are built from those two unit vectors: P ∝ ${I.n} + ${I.sHat} and T ∝ ${I.n} − ${I.sHat}. The hanging wall pushes across the fault along ${I.n} and drags along ${I.sHat}, and P lies halfway between the push and the drag. The <strong>B axis</strong>, ${I.n} × ${I.sHat}, lies in the fault at right angles to the slip; nothing moves along it.`,
      task: 'Change the fault and the slip. Watch P and T stay 45° from the fault.',
      visualKind: 'fault',
      controls: ['strike', 'dip', 'rake'],
      labOptions: { showKinematic: true, showConstruction: true, showPole: true, showSlipVector: false, slipped: false, panel: 'net', net: { slip: true, kinematic: true, pole: true } },
      initialLabState: { strike: 0, dip: 60, rake: -90 },
      equations: [KINEMATIC],
      prompt: `A normal fault dips 60° east and slips straight down the dip (${I.lambda} = −90°). Where is its P axis?`,
      choices: [
        { id: 'steep', label: 'Plunging 75°: nearly vertical', correct: true, feedback: 'Right: P plunges 75° west, 45° from the fault. T is nearly horizontal (15° toward the east). A normal fault shortens the crust vertically and stretches it horizontally.' },
        { id: 'horizontal', label: 'Horizontal, across the strike', correct: false, feedback: 'That is close to T, the lengthening axis (plunging 15° east). P is 90° from T.' },
        { id: 'dip', label: 'Down the dip of the fault', correct: false, feedback: 'That is the slip direction itself. P is 45° from the fault, between the push 𝐧 and the slip 𝐬̂.' },
      ],
    },
    {
      id: 'beach-ball',
      label: 'Beach balls',
      title: 'Fault-plane solutions: the beach ball',
      activeLabel: 'Beach balls',
      body: `An earthquake is a fault slipping suddenly. Seismometers around the world record whether the first ground motion was a push (compressional) or a pull (dilatational). The pattern splits the sphere into four quadrants, separated by two <strong>nodal planes</strong>: the fault and the <strong>auxiliary plane</strong>, whose pole is the slip vector. Shading the compressional quadrants on a stereonet gives the <strong>fault-plane solution</strong>, or beach ball. The shaded quadrants hold T and the white ones hold P. Shaded does not mean the rock is squeezed there: it marks where the first motion pushed outward.`,
      task: 'Pick each fault type and compare the beach balls. Then change the slip.',
      visualKind: 'fault',
      controls: ['presets', 'rake', 'strike', 'dip'],
      labOptions: { showKinematic: true, showSlipVector: false, slipped: false, panel: 'net', net: { slip: true, kinematic: true, auxiliary: true, ball: true } },
      initialLabState: { strike: 0, dip: 60, rake: -90, preset: 'normal' },
      presets: FAULT_PRESETS,
      equations: [
        {
          id: 'ball',
          html: math(bound('beach-ball', mtext('shaded')), mo(':'), SPACE(0.3), row(mo('('), vec('v'), mo('⋅'), N, mo(')'), mo('('), vec('v'), mo('⋅'), SH, mo(')')), mo('<'), mn('0'))
            + math(bound('fault', mtext('fault')), SPACE(0.2), mo('⊥'), N, mo(','), SPACE(0.5), bound('auxiliary', mtext('auxiliary')), SPACE(0.2), mo('⊥'), SH)
            + math(P_AXIS, mo(':'), SPACE(0.2), live('pLine', 'p-axis'), mo(','), SPACE(0.6), T_AXIS, mo(':'), SPACE(0.2), live('tLine', 't-axis'))
            + `<small>${inline(vec('v'))} is a direction leaving the earthquake. Swapping ${I.n} and ${I.sHat} gives the same ball: the seismic waves alone cannot tell which nodal plane slipped.</small>`,
          symbols: [SYMBOL.ball, SYMBOL.auxiliary, SYMBOL.n, SYMBOL.sHat, SYMBOL.p, SYMBOL.tAxis],
        },
      ],
      prompt: 'An earthquake’s beach ball has a shaded center and white sides. What kind of fault slipped?',
      choices: [
        { id: 'thrust', label: 'A thrust (reverse) fault', correct: true, feedback: 'Right. A thrust has T nearly vertical, so the center of the net (straight down) is in a shaded T quadrant, and P is nearly horizontal, at the white sides.' },
        { id: 'normal', label: 'A normal fault', correct: false, feedback: 'Pick Normal: P is nearly vertical, so its beach ball has a white center and shaded sides, the reverse of this one.' },
        { id: 'strike-slip', label: 'A strike-slip fault', correct: false, feedback: 'Pick Strike-slip: both nodal planes are vertical, so the ball is cut into four quadrants like a pie, with no shaded center.' },
      ],
    },
    {
      id: 'pt-not-stress',
      label: 'P and T are not σ1 and σ3',
      title: 'P and T are not the principal stresses',
      activeLabel: 'Kinematic axes vs stress axes',
      body: `It is tempting to read P as ${I.s1} and T as ${I.s3}. They are different things: P and T come from the fault’s slip alone. Tilt ${I.s1} in the vertical plane across this fault’s strike (${I.s2} stays along strike). The shear traction still points straight down the dip, so the slip, P, T, and the beach ball stay the same while ${I.s1} wanders across the white quadrant. Only when ${I.s1} crosses a nodal plane does the slip change. Friction (B6) favors faults about 25–30° from ${I.s1}, not the 45° of P. So one fault allows a wide range of stress directions; finding the stress (stress inversion) needs many faults of different orientations.`,
      task: `Tilt ${I.s1} and watch the beach ball. Find where the slip flips.`,
      visualKind: 'fault',
      controls: ['tilt'],
      labOptions: { stress: true, slipSource: 'stress', showStress: true, showKinematic: true, showSlipVector: true, slipped: true, panel: 'net', net: { slip: true, kinematic: true, auxiliary: true, ball: true, axes: true } },
      initialLabState: { strike: 0, dip: 60, regime: 'normal', ratio: 0.5, tilt: 0 },
      equations: [
        {
          id: 'angle',
          html: math(mtext('angle from'), SPACE(0.3), bound('sigma-1', sigma(1)), SPACE(0.3), mtext('to'), SPACE(0.3), P_AXIS, EQ, live('angleS1P', 'p-axis'))
            + math(LAMBDA, EQ, live('rake', 'rake'), mo('→'), SPACE(0.3), live('slipName', 'slip'))
            + math(bound('sigma-1', sigma(1)), mo(':'), SPACE(0.3), live('s1Line', 'sigma-1'), mo(','), SPACE(0.6), P_AXIS, mo(':'), SPACE(0.3), live('pLine', 'p-axis'))
            + '<small>The fault strikes 000° and dips 60° east. Trend/plunge in degrees.</small>',
          symbols: [SYMBOL.s1, SYMBOL.p, SYMBOL.lambda],
        },
      ],
      prompt: `${I.s1} tilts across a wide range, yet the beach ball does not change. What does that show?`,
      choices: [
        { id: 'range', label: 'One fault’s P and T fit a wide range of σ1 directions', correct: true, feedback: 'Right. P and T describe the slip, and a whole range of stress states produces the same slip on one fault. Here σ1 can lie anywhere between the fault plane and the auxiliary plane.' },
        { id: 'equal', label: 'P is always exactly σ1', correct: false, feedback: 'Tilt σ1 and read the angle between σ1 and P: it changes while P stays put. They coincide only by chance.' },
        { id: 'no-effect', label: 'Stress has no effect on slip', correct: false, feedback: 'It does: tilt σ1 past the fault plane (about 30° east) and the shear traction reverses, so the fault would slip the other way.' },
      ],
    },
    {
      id: 'predict-rake',
      label: 'Predict the rake',
      title: 'Predict the slip from the stress',
      activeLabel: 'Predicting the rake',
      body: `Put it together. ${I.s1} points north, ${I.s3} east, and ${I.s2} is vertical: a strike-slip regime. A fault strikes 120° and dips 60° to the south-southwest. The equations show the traction and the two parts of ${I.tau} in the fault plane: along strike, ${I.tauStrike}, and up the dip, ${I.tauUp}. The hanging wall slides along ${I.tau}, so the rake is the angle of ${I.tau} in the plane, λ = atan2(${I.tauUp}, ${I.tauStrike}). Mind the quadrant (M2).`,
      task: 'Predict the rake from the two parts of τ. The slip appears when you are right.',
      visualKind: 'fault',
      controls: [],
      labOptions: { stress: true, slipSource: 'stress', showStress: true, showTraction: true, showRake: true, showSlipVector: true, slipped: false, revealSlip: true, panel: 'net', net: { slip: true, axes: true } },
      initialLabState: { strike: 120, dip: 60, regime: 'strike-slip', ratio: 0.5 },
      revealAfterAnswer: ['rake', 'slipName'],
      equations: [
        {
          id: 'predict',
          html: math(T, EQ, vec('σ'), N, EQ, live('traction', 'traction'))
            + math(bound('shear-stress', TAU_STRIKE), EQ, TAU, mo('⋅'), E_STRIKE, EQ, live('tauStrike', 'shear-stress'))
            + math(bound('shear-stress', TAU_UP), EQ, TAU, mo('⋅'), E_UP, EQ, live('tauUp', 'shear-stress'))
            + math(LAMBDA, EQ, mtext('atan2'), row(mo('('), TAU_UP, mo(','), TAU_STRIKE, mo(')')))
            + math(EQ, live('rake', 'rake'), mo('→'), SPACE(0.3), live('slipName', 'slip'))
            + '<small>Stresses in MPa, NED components. atan2 gives the angle in the right quadrant.</small>',
          symbols: [SYMBOL.t, SYMBOL.tau, SYMBOL.lambda],
        },
      ],
      prompt: `What rake ${I.lambda} will the hanging wall slip at? (degrees, −180 to 180)`,
      answer: {
        value: 163.9,
        tolerance: 1.5,
        correctFeedback: 'Correct: λ = atan2(10.8, −37.5) = 163.9°. The slip is nearly horizontal and against the strike direction: dextral, with a small reverse part.',
        wrong: [
          { value: -16.1, tolerance: 1.5, feedback: 'That is tan⁻¹(10.8 / −37.5), which lands in the wrong quadrant. τstrike is negative, so the slip points against the strike direction: add 180°.' },
          { value: 16.1, tolerance: 1.5, feedback: 'The strike part of τ is negative, so the slip points against the strike direction: λ is near 180°, not near 0°.' },
          { value: -163.9, tolerance: 1.5, feedback: 'Check the sign of τup: it is positive, so the hanging wall goes up the dip and λ is positive.' },
          { value: 73.9, tolerance: 1.5, feedback: 'The rake is measured from the strike direction, so use λ = atan2(τup, τstrike), not the angle from the dip.' },
        ],
        fallbackFeedback: 'Use λ = atan2(τup, τstrike) with the two values on screen, and keep the quadrant: τstrike < 0 and τup > 0.',
      },
      final: true,
    },
  ],
};

