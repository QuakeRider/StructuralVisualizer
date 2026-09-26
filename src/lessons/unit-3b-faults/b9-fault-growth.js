// B9 — Fault displacement and growth. Spec: docs/curriculum/unit-3b-faults.md (B9).
// Frame: NED (x = North, y = East, z = Down), lengths in metres. All faults
// are normal faults striking north and dipping 60° east (the relay breach
// strikes northeast). On a fault, u runs along strike and w down the dip from
// its center; D is the displacement (slip) between the walls at a point.
// The displacement models are stated idealizations (faultGrowth.js): an
// elliptical tip line with D = Dmax √(1 − r²) or D = Dmax (1 − r), D = c Lⁿ,
// summed segment profiles, and a drag factor k. Built ahead of its B-unit
// prerequisites for classroom use, after B8. Revised after B11 was built:
// the fault zone's anatomy and fault rocks moved to B11.

import { bound, frac, inline, live, math, mi, mn, mo, mtext, paren, row, sqrt, sub, sup } from '../mathml.js';

const EQ = mo('=');
const MINUS = mo('−');
const PLUS = mo('+');
const COMMA = mo(',');
const SPACE = (width = 0.5) => `<mspace width="${width}em"></mspace>`;
const squaredRatio = (top, bottom) => sup(paren(frac(top, bottom)), mn('2'));

// Bound symbols: each maps to one object in the block or the panel beside it.
const D = bound('displacement', mi('D'));
const DMAX = bound('displacement', sub(mi('D'), mtext('max')));
const A = bound('tip-line', mi('a'));
const B = bound('tip-line', mi('b'));
const U_SECTION = bound('section', mi('u'));
const W_PROFILE = bound('profile-line', mi('w'));
const R = bound('contours', mi('r'));
const L_POINT = bound('dl-point', mi('L'));
const D_POINT = bound('dl-point', mi('D'));
const C = bound('dl-line', mi('c'));
const N = bound('dl-line', mi('n'));
const D_A = bound('segment-a', sub(mi('D'), mtext('A')));
const D_B = bound('segment-b', sub(mi('D'), mtext('B')));
const D_SUM = bound('sum-profile', sub(mi('D'), mtext('sum')));
const D_LINK = bound('breach', sub(mi('D'), mtext('link')));
const D_ONE = bound('target-profile', sub(mi('D'), mtext('one')));
const K = bound('drag-profile', mi('k'));

const I = {
  D: inline(mi('D')),
  Dmax: inline(sub(mi('D'), mtext('max'))),
  a: inline(mi('a')),
  b: inline(mi('b')),
  u: inline(mi('u')),
  w: inline(mi('w')),
  r: inline(mi('r')),
  L: inline(mi('L')),
  c: inline(mi('c')),
  n: inline(mi('n')),
  k: inline(mi('k')),
  d: inline(mi('d')),
  DLn: inline(mi('D'), EQ, mi('c'), sup(mi('L'), mi('n'))),
};

const SYMBOL = {
  D: { symbol: mi('D'), sceneRef: 'displacement', description: 'Displacement: how far the two walls slipped past each other at a point on the fault (fault colors, yellow the most)' },
  Dmax: { symbol: sub(mi('D'), mtext('max')), sceneRef: 'displacement', description: 'Largest displacement, at the fault’s center' },
  ab: { symbol: row(mi('a'), COMMA, mi('b')), sceneRef: 'tip-line', description: 'Half-length along strike (a) and half-height down the dip (b) of the elliptical tip line (white loop)' },
  u: { symbol: mi('u'), sceneRef: 'section', description: 'How far north of the fault’s center the blue section cuts the block' },
  offset: { symbol: mtext('offset'), sceneRef: 'offset', description: 'Offset of the middle bed at the section, along the fault (pink arrow)' },
  r: { symbol: mi('r'), sceneRef: 'contours', description: 'Elliptical radius: 0 at the center and 1 on the tip line. Contours of D are loops of constant r (thin white loops)' },
  w: { symbol: mi('w'), sceneRef: 'profile-line', description: 'Down-dip position of the profile line (orange), from the fault’s center' },
  L: { symbol: mi('L'), sceneRef: 'dl-point', description: 'This fault’s length, tip to tip, and its largest displacement D (the diamond on the plot)' },
  cn: { symbol: row(mi('c'), COMMA, mi('n')), sceneRef: 'dl-line', description: 'The scaling line: c is D at L = 1 m, and n is the slope on log–log axes' },
  data: { symbol: mtext('data'), sceneRef: 'dl-data', description: 'Synthetic faults, spread like published data (gray points)' },
  DA: { symbol: sub(mi('D'), mtext('A')), sceneRef: 'segment-a', description: 'Displacement on segment A, the western fault' },
  DB: { symbol: sub(mi('D'), mtext('B')), sceneRef: 'segment-b', description: 'Displacement on segment B, the eastern fault' },
  sum: { symbol: sub(mi('D'), mtext('sum')), sceneRef: 'sum-profile', description: 'Total displacement across the fault system at each point along strike (solid white)' },
  ramp: { symbol: mtext('ramp'), sceneRef: 'relay-ramp', description: 'Relay ramp: the tilted bed between the overlapping segments' },
  process: { symbol: mtext('process zone'), sceneRef: 'process-zone', description: 'Process zone: cracked rock just ahead of a growing tip (pink dashed loop), which becomes damage zone as the fault grows through it (B11)' },
  link: { symbol: sub(mi('D'), mtext('link')), sceneRef: 'breach', description: 'Extra slip on the linked fault after the breach, including the breaching fault across the ramp' },
  one: { symbol: sub(mi('D'), mtext('one')), sceneRef: 'target-profile', description: 'Profile of a single fault 920 m long with the same c (dashed)' },
  k: { symbol: mi('k'), sceneRef: 'drag-profile', description: 'Drag factor: how each wall’s movement changes away from the fault (the curve on the plot)' },
  far: { symbol: mtext('offset far away'), sceneRef: 'far-offset', description: 'Offset of the beds far from the fault' },
  slipD: { symbol: mi('D'), sceneRef: 'offset', description: 'Slip on the fault itself, 60 m everywhere (pink arrow)' },
};

const RELAY_SUM = math(D_SUM, paren(mi('x')), EQ, D_A, paren(mi('x')), PLUS, D_B, paren(mi('x')));
const RELAY_STAGE = math(mtext('overlap'), SPACE(0.3), live('overlap', 'relay-ramp'), COMMA, SPACE(0.3), live('stage', 'relay-ramp'));
const RELAY_SEGMENTS = math(D_A, EQ, live('dA', 'segment-a'), COMMA, SPACE(), D_B, EQ, live('dB', 'segment-b'));
const RELAY_RAMP = math(bound('relay-ramp', mtext('ramp')), mo(':'), SPACE(0.3), live('rampDip', 'relay-ramp'));
const RELAY_NOTE = `<small>x is the distance north along strike. Each segment has ${I.D} = ${I.c}${I.L} with ${I.c} = 0.1 (large, so it shows), a bell-shaped profile ${inline(mi('D'))} = ${inline(sub(mi('D'), mtext('max')))}(1 − ${inline(mi('r'))}²), and ${inline(sub(mi('D'), mtext('A')))} and ${inline(sub(mi('D'), mtext('B')))} are their largest values.</small>`;

export default {
  id: 'B9',
  status: 'built',
  steps: [
    {
      id: 'tip-line',
      label: 'Displacement dies out',
      title: 'Displacement dies out at the tip line',
      activeLabel: 'Displacement along a fault',
      body: `B11 looked inside a fault zone. Step back to see the whole fault. B8 moved a whole block by one slip vector, as if the fault ran through the block from end to end. A real fault ends. This normal fault lies inside the block, which holds three marker beds. The <strong>displacement</strong> ${I.D}, the slip between the walls at a point, is largest near the fault’s center and falls to zero on its edge, the <strong>tip line</strong>. Beyond the tip line the beds are not broken at all. The blue section cuts the block at a distance ${I.u} north of the fault’s center, and the pink arrow is the offset of the middle bed there. Along that bed ${I.D} follows the equation beside the block, where ${I.a} is half the fault’s length. It is one idealized shape; step 2 shows another.`,
      task: `Slide the section from the fault’s center toward its north tip and watch the offset.`,
      visualKind: 'fault-growth',
      controls: ['section', 'view'],
      labOptions: { setup: 'isolated', panel: 'profile', section: true, views: ['3d', 'map', 'section', 'fault'] },
      initialLabState: { section: 0, view: '3d' },
      goal: { text: `Find where the offset is half of ${I.Dmax} (40 m, within 2 m).`, check: (lab) => lab.sectionOffset !== null && Math.abs(lab.sectionOffset - 40) < 2 },
      equations: [
        {
          id: 'profile',
          html: math(D, paren(U_SECTION), EQ, DMAX, sqrt(mn('1'), MINUS, squaredRatio(U_SECTION, A)))
            + math(U_SECTION, EQ, live('u', 'section'), COMMA, SPACE(), bound('offset', mi('D')), EQ, live('dAtU', 'offset'))
            + math(DMAX, EQ, live('dMax', 'displacement'), COMMA, SPACE(), A, EQ, live('a', 'tip-line'))
            + `<small>${I.u} is measured along strike, north positive. ${I.D} is measured along the slip, down the dip; its vertical part, the throw, is ${I.D} sin 60°. The beds bend near the fault; step 6 explains why.</small>`,
          symbols: [SYMBOL.D, SYMBOL.u, SYMBOL.offset, SYMBOL.Dmax, SYMBOL.ab],
        },
      ],
      prompt: 'At the fault’s center the middle bed is offset 80 m. What happens to its offset as the section moves toward the north tip?',
      choices: [
        { id: 'shrinks', label: 'It shrinks to zero at the tip line; beyond it the bed is unbroken', correct: true, feedback: 'Right. Each point on the fault slipped a different amount, and the tip line is where the slip reaches zero. On this elliptical profile the offset stays large most of the way and then drops quickly near the tip.' },
        { id: 'constant', label: 'It stays 80 m, then drops to zero where the fault ends', correct: false, feedback: 'That is B8’s rigid block. Slide the section: the offset shrinks gradually, because the fault slipped less toward its edges.' },
        { id: 'grows', label: 'It grows toward the tip, where the fault is breaking', correct: false, feedback: 'The tip is the part of the fault that has slipped least. Slide the section and watch the pink arrow shrink.' },
      ],
    },
    {
      id: 'displacement-map',
      label: 'The displacement map',
      title: 'The fault surface as a map of displacement',
      activeLabel: 'Displacement on the fault surface',
      body: `Lift the hanging wall away and look at the fault itself, face on. Each point is colored by its displacement ${I.D}. The contours of equal ${I.D} are ellipses, and the outermost one, ${I.D} = 0, is the tip line: an isolated fault has an elliptical outline. In fault coordinates, ${I.u} along strike and ${I.w} down the dip, the <strong>elliptical radius</strong> ${I.r} is 0 at the center and 1 on the tip line, and ${I.D} depends only on ${I.r}. A profile measured along a bed, the orange line, is a 1D slice through this 2D surface. Move it up or down the fault and the profile gets shorter and lower. The two models are both idealizations; measured profiles take many shapes, often between these two. The displacement builds up over many earthquakes: each one slips a patch of the fault, roughly elliptical, and the patches add up to this cumulative picture (B13).`,
      task: 'Move the profile line up and down the fault. Switch between the two models.',
      visualKind: 'fault-growth',
      controls: ['profile', 'model', 'view'],
      labOptions: { setup: 'isolated', panel: 'profile', hideHangingWall: true, contours: true, profile: true, views: ['3d', 'fault', 'map'] },
      initialLabState: { profileW: 0, model: 'elliptical', view: 'fault' },
      equations: [
        {
          id: 'radius',
          html: math(R, EQ, sqrt(squaredRatio(mi('u'), A), PLUS, squaredRatio(mi('w'), B)))
            + math(D, EQ, DMAX, live('shape', 'displacement'), mo(':'), SPACE(0.3), live('modelName'))
            + math(mtext('profile at'), SPACE(0.3), W_PROFILE, EQ, live('profileW', 'profile-line'))
            + math(mtext('length'), SPACE(0.3), live('profileLength', 'profile-line'), COMMA, SPACE(), mtext('peak'), SPACE(0.3), live('profilePeak', 'profile-line'))
            + `<small>${I.a} = 400 m, ${I.b} = 240 m, ${I.Dmax} = 80 m. ${I.u} and ${I.w} are measured from the fault’s center.</small>`,
          symbols: [SYMBOL.r, SYMBOL.ab, SYMBOL.D, SYMBOL.Dmax, SYMBOL.w],
        },
      ],
      prompt: `On the elliptical model with ${I.Dmax} = 80 m, what is ${I.D} halfway from the center to the tip along strike (${I.u} = ${I.a}/2, ${I.w} = 0)? (m)`,
      answer: {
        value: 69.3,
        tolerance: 0.5,
        correctFeedback: 'Correct: r = 0.5, so D = 80 √(1 − 0.25) = 80 × 0.866 = 69.3 m. Halfway to the tip, the fault still has most of its displacement.',
        wrong: [
          { value: 40, tolerance: 0.5, feedback: 'That is the linear taper, D = Dmax(1 − r). The question asks for the elliptical model: D = Dmax √(1 − r²).' },
          { value: 60, tolerance: 0.5, feedback: 'That is 80 × (1 − 0.25): you left out the square root. D = 80 √(1 − 0.25).' },
          { value: 80, tolerance: 0.5, feedback: 'That is Dmax, the value at the center. At u = a/2 the radius is r = 0.5, so D is less.' },
          { value: 20, tolerance: 0.5, feedback: 'That is 80 × 0.25 = Dmax r². Use D = Dmax √(1 − r²).' },
        ],
        fallbackFeedback: 'Find r = √((u/a)² + (w/b)²) = 0.5, then D = Dmax √(1 − r²).',
      },
    },
    {
      id: 'scaling',
      label: 'Displacement and length',
      title: 'Longer faults have more displacement',
      activeLabel: 'Displacement–length scaling',
      body: `Faults from centimetres to hundreds of kilometres long follow one rule: the largest displacement grows with the length, ${I.DLn}. Take the logarithm and it becomes a straight line on log–log axes, with slope ${I.n}, crossing ${I.L} = 1 m at ${I.D} = ${I.c}. For real faults ${I.n} is close to 1, so ${I.D}/${I.L} ≈ ${I.c}: the displacement is a roughly fixed fraction of the length, mostly between 0.001 and 0.1. The spread comes from rock type, fault type, and how the faults grew. With ${I.n} = 1 a fault looks the same at every size, so the block only changes its scale bar when you change ${I.L}. The gray points are synthetic, spread like published data.`,
      task: `Change ${I.L}, ${I.c}, and ${I.n}. Watch the diamond, the line, and the block.`,
      visualKind: 'fault-growth',
      controls: ['length', 'c', 'n'],
      labOptions: { setup: 'isolated', panel: 'scaling', scaling: true, contours: true, views: ['3d'] },
      initialLabState: { logL: 2.7, logC: -2, n: 1, view: '3d' },
      revealAfterAnswer: ['dScaled'],
      equations: [
        {
          id: 'scaling',
          html: math(D_POINT, EQ, C, sup(L_POINT, N))
            + math(mi('log'), SPACE(0.2), D_POINT, EQ, mi('log'), SPACE(0.2), C, PLUS, N, SPACE(0.2), mi('log'), SPACE(0.2), L_POINT)
            + math(L_POINT, EQ, live('length', 'dl-point'), COMMA, SPACE(), C, EQ, live('c', 'dl-line'), COMMA, SPACE(), N, EQ, live('n', 'dl-line'))
            + math(D_POINT, EQ, live('dScaled', 'dl-point'), COMMA, SPACE(), frac(D_POINT, L_POINT), EQ, live('dOverL', 'dl-point'))
            + '<small>Logarithms are base 10, with L and D in metres. The block shows D/L to scale, up to 0.25.</small>',
          symbols: [SYMBOL.L, SYMBOL.cn, SYMBOL.data],
        },
      ],
      prompt: `A fault is 2 km long, with ${I.c} = 0.03 and ${I.n} = 1. What is its largest displacement ${I.D}? (m)`,
      answer: {
        value: 60,
        tolerance: 0.5,
        correctFeedback: 'Correct: D = 0.03 × 2000 m = 60 m. Set L = 2 km and c = 0.03 to check it on the plot.',
        wrong: [
          { value: 0.06, tolerance: 0.005, feedback: 'That is 0.03 × 2: L must be in metres, the units c was defined in. 2 km = 2000 m.' },
          { value: 600, tolerance: 1, feedback: 'Check the arithmetic: 0.03 × 2000 = 60.' },
          { value: 6, tolerance: 0.1, feedback: 'Check the arithmetic: 0.03 × 2000 = 60.' },
          { value: 66.7, tolerance: 0.5, feedback: 'That is 2000 ÷ 30. Multiply instead: D = cL = 0.03 × 2000.' },
        ],
        fallbackFeedback: 'Use D = cLⁿ with L = 2000 m, c = 0.03, and n = 1.',
      },
    },
    {
      id: 'relay',
      label: 'Relay ramps',
      title: 'Growth by linkage: the relay ramp',
      activeLabel: 'Soft linkage and relay ramps',
      body: `Large faults rarely grow from one tip alone. Many start as separate segments that grow toward each other. Here two normal-fault segments, A and B, are 150 m apart across strike. As each grows longer it gains displacement (${I.D} = ${I.c}${I.L}). While they <strong>underlap</strong>, the rock between their tips is not faulted. Once they <strong>overlap</strong>, the bed between them is tilted into a <strong>relay ramp</strong>, which passes displacement from one segment to the other: the segments are <strong>soft-linked</strong>. Just ahead of each growing tip is a <strong>process zone</strong> of cracked rock (pink); as the tip moves on, it is left behind as damage zone (B11). The plot adds the two profiles. Only one bed is drawn, shaded dark where it is deep and light where it is high, with contours every 5 m of depth.`,
      task: 'Grow the segments with the slider until they overlap. Look at the ramp from above (Map) and from the side.',
      visualKind: 'fault-growth',
      controls: ['growth', 'view'],
      labOptions: { setup: 'relay', panel: 'relay', growthRange: [0, 0.59], processZones: true, views: ['3d', 'map'] },
      initialLabState: { growth: 0.2, view: '3d' },
      goal: { text: 'Grow the segments until they overlap by at least 100 m.', check: (lab) => lab.overlap !== null && lab.overlap >= 100 },
      equations: [
        {
          id: 'relay',
          html: RELAY_SUM + RELAY_STAGE + RELAY_SEGMENTS + RELAY_RAMP + math(bound('process-zone', mtext('process zones')), SPACE(0.3), mtext('at the tips')) + RELAY_NOTE,
          symbols: [SYMBOL.sum, SYMBOL.DA, SYMBOL.DB, SYMBOL.ramp, SYMBOL.process],
        },
      ],
      prompt: 'Between the overlapping segments, which way does the relay ramp dip?',
      choices: [
        { id: 'south', label: 'Along strike, down to the south, where fault A dropped it most', correct: true, feedback: 'Right. The ramp is in A’s hanging wall and B’s footwall. In the south, A’s large displacement dropped it; in the north, A dies out and B lifts it. The tilt passes the displacement from A to B.' },
        { id: 'east', label: 'East, down the dip of the faults', correct: false, feedback: 'Look from above and read the contours: they cross the ramp, so it tilts along strike, from one segment’s tip to the other’s.' },
        { id: 'flat', label: 'It stays flat, because the segments are separate faults', correct: false, feedback: 'Grow the overlap and watch the contours on the bed between the faults: they bunch up, so the ramp tilts.' },
      ],
    },
    {
      id: 'breach',
      label: 'Breaching the ramp',
      title: 'Breaching the ramp: one fault from two',
      activeLabel: 'Hard linkage',
      body: `As the overlap grows, the ramp bends more until a fault cuts across it. The ramp is <strong>breached</strong>, and the segments are <strong>hard-linked</strong> into one fault with a bend in its trace. The old tips beyond the link are left as inactive splays, and the rock around the breach is where linking damage is widest (B11). The linked fault is 920 m long, but its displacement was built by two shorter faults, so it has less than ${I.D} = ${I.c}${I.L} gives for 920 m (the dashed profile). It is under-displaced. As it keeps slipping it gains most where it lags most, until its profile looks like that of one fault.`,
      task: 'Move past the breach and keep growing. Compare the total with the dashed profile of one 920 m fault.',
      visualKind: 'fault-growth',
      controls: ['growth', 'view'],
      labOptions: { setup: 'relay', panel: 'relay', target: true, growthRange: [0.45, 1], views: ['3d', 'map'] },
      initialLabState: { growth: 0.62, view: '3d' },
      equations: [
        {
          id: 'linked',
          html: math(D_SUM, EQ, D_A, PLUS, D_B, PLUS, D_LINK)
            + math(D_ONE, EQ, mi('c'), mi('L'), EQ, mn('92'), SPACE(0.25), mtext('m'))
            + math(mtext('largest'), SPACE(0.3), D_SUM, EQ, live('dSumMax', 'sum-profile'))
            + RELAY_STAGE
            + `<small>${inline(sub(mi('D'), mtext('link')))} is the slip added after the breach, on A, the breaching fault, and B. For one fault, ${I.c} = 0.1 and ${I.L} = 920 m. The profiles use a bell shape, ${inline(mi('D'))} = ${inline(sub(mi('D'), mtext('max')))}(1 − ${inline(mi('r'))}²).</small>`,
          symbols: [SYMBOL.sum, SYMBOL.DA, SYMBOL.DB, SYMBOL.link, SYMBOL.one, SYMBOL.ramp],
        },
      ],
      prompt: 'Just after the breach, the linked fault is 920 m long. How does its displacement compare with D = cL for that length?',
      choices: [
        { id: 'under', label: 'Too small: it is under-displaced, and slips more to catch up', correct: true, feedback: 'Right. Its displacement came from two shorter faults, each with D = cL for its own length. Linking them nearly doubled L without adding D, so on the D–L plot the fault jumps to the right, below the line, and climbs back as it slips.' },
        { id: 'equal', label: 'Exactly D = cL: linkage keeps it on the line', correct: false, feedback: 'Compare the solid total with the dashed profile at the breach: the total is well below it, most of all in the middle.' },
        { id: 'over', label: 'Too large: more displacement than a fault of its length', correct: false, feedback: 'Joining two short faults nearly doubles L without adding D, so the linked fault has too little displacement, not too much.' },
      ],
    },
    {
      id: 'drag',
      label: 'Fault drag',
      title: 'Fault drag: beds bend near the fault',
      activeLabel: 'Normal and reverse drag',
      body: `Look back at step 1: near the fault the beds bent down toward it in the hanging wall and up in the footwall. That is <strong>reverse drag</strong>. The rock right beside the fault moved more than the rock farther away, so the beds curve toward the fault. <strong>Normal drag</strong> is the opposite: the beds bend back, as if the fault had dragged them. There the rock beside the fault moved less, because some of the offset was taken up by bending before or while the fault broke through. Both are displacement gradients near the fault. This fault’s tips are far away, so the slip on it is ${I.D} = 60 m everywhere. The drag factor ${I.k} sets how each wall’s movement changes with the distance ${I.d} from the fault. Normal drag is where fault-related folds begin (F6).`,
      task: `Change the drag factor ${I.k} and compare the section with the plot.`,
      visualKind: 'fault-growth',
      controls: ['drag', 'view'],
      labOptions: { setup: 'through', panel: 'drag', section: true, views: ['section', '3d'] },
      initialLabState: { drag: 0.4, view: 'section' },
      goal: { text: 'Make normal drag.', check: (lab) => lab.dragName === 'normal drag' },
      equations: [
        {
          id: 'drag',
          html: math(bound('drag-profile', row(mi('u'), paren(mi('d')))), EQ, frac(bound('offset', mi('D')), mn('2')), paren(mn('1'), MINUS, K, mi('f')))
            + math(mi('f'), EQ, mn('1'), MINUS, sup(mi('e'), row(mo('−'), mo('|'), mi('d'), mo('|'), mo('/'), mi('λ'))))
            + math(K, EQ, live('k', 'drag-profile'), mo('→'), SPACE(0.3), live('dragName', 'drag-profile'))
            + math(bound('far-offset', mtext('far away:')), SPACE(0.3), mi('D'), paren(mn('1'), MINUS, K), EQ, live('farOffset', 'far-offset'))
            + `<small>${inline(mi('u'))} is each wall’s movement along the dip: the hanging wall moves down and the footwall up. ${inline(mi('f'))} grows from 0 at the fault to 1 far away. ${I.D} = 60 m and λ = 80 m.</small>`,
          symbols: [SYMBOL.k, SYMBOL.slipD, SYMBOL.far],
        },
      ],
      prompt: 'Beds in the hanging wall of a normal fault bend down as they approach the fault. Where did the hanging-wall rock move most?',
      choices: [
        { id: 'beside', label: 'Right beside the fault: this is reverse drag', correct: true, feedback: 'Right. The displacement is largest at the fault and fades away from it, so the beds curve down toward the fault in the hanging wall and up in the footwall. Elastic models of faults of finite size predict this pattern.' },
        { id: 'far', label: 'Far from the fault: this is normal drag', correct: false, feedback: 'If the far rock had moved more, the hanging-wall beds would lag behind near the fault and bend up toward it: normal drag. Set k below 0 to see it.' },
        { id: 'same', label: 'The same amount everywhere', correct: false, feedback: 'Then the beds would stay straight (k = 0). Bent beds mean the movement changes with distance from the fault.' },
      ],
    },
    {
      id: 'maps',
      label: 'Segmented faults on maps',
      title: 'Reading segmented faults on maps',
      activeLabel: 'Relay ramps in the field',
      body: `Relay ramps are common in rifts, from the Basin and Range to the Gulf of Suez and the East African Rift. On a geologic map a segmented fault shows as traces that stop, step sideways, and continue, with beds between the segments dipping along strike. These gaps do not mean unrelated faults: the segments work together, handing displacement from one to the next. Relay ramps matter in practice. They are low paths through a line of fault scarps, so rivers and sediment often enter rift basins through them. They can also let fluids such as groundwater, oil, or gas pass from one fault block to the next, where a continuous fault would block them. A breached ramp leaves a bend in the fault trace.`,
      task: 'Look from above (Map) at several stages, from separate segments to a linked fault.',
      visualKind: 'fault-growth',
      controls: ['growth', 'view'],
      labOptions: { setup: 'relay', panel: 'relay', target: true, growthRange: [0, 1], views: ['map', '3d'] },
      initialLabState: { growth: 0.45, view: 'map' },
      equations: [
        {
          id: 'map-relay',
          html: RELAY_SUM + RELAY_STAGE + RELAY_RAMP + RELAY_NOTE,
          symbols: [SYMBOL.sum, SYMBOL.DA, SYMBOL.DB, SYMBOL.ramp],
        },
      ],
      prompt: 'A map shows a normal fault whose trace stops, steps 150 m sideways, and continues. Beds between the two traces dip gently along strike. What is the best interpretation?',
      choices: [
        { id: 'relay', label: 'Two segments of one fault, linked by a relay ramp that passes displacement between them', correct: true, feedback: 'Right: a soft-linked relay. The along-strike dip of the beds between the segments is the sign: they take up the change in displacement from one segment to the other.' },
        { id: 'unrelated', label: 'Two unrelated faults that happen to line up', correct: false, feedback: 'The tilted beds between them carry displacement from one segment to the other, and their profiles fit together: they are parts of one fault system.' },
        { id: 'restart', label: 'The fault died out, and a new one started nearby by chance', correct: false, feedback: 'Each segment tapers where they overlap, and the ramp between them tilts to make up the difference: the segments work together as one system.' },
      ],
      final: true,
    },
  ],
};
