// B11 — Fault zones and fault rocks. Spec: docs/curriculum/unit-3b-faults.md (B11).
// Frame: NED (x = North, y = East, z = Down). The outcrop fault is a normal
// fault striking north and dipping 60° east, with 10 m of slip. Widths are in
// metres at right angles to the fault; grain sizes in millimetres.
// Exact: the clast-size integral, the slice exponent, Sibson's and Woodcock &
// Mort's boundaries, the heating bound, and Fa (faultRocks.js). Illustrative
// and labeled: the comminution schedule, the damage-density parameters, the
// depth boundaries, the width-scaling bands, and the drawings. Built early,
// after B8 and before B10 and B1: it restates the little it needs from them.

import { bound, frac, inline, live, math, mi, mn, mo, mtext, paren, row, sub, sup } from '../mathml.js';

const EQ = mo('=');
const PLUS = mo('+');
const MINUS = mo('−');
const COMMA = mo(',');
const TIMES = mo('×');
const SPACE = (width = 0.5) => `<mspace width="${width}em"></mspace>`;
const text = (value) => mtext(value);

// Bound symbols.
const W = bound('zone-width', mi('W'));
const W_CORE = bound('core', sub(mi('w'), mtext('core')));
const W_FW = bound('damage-fw', sub(mi('w'), mtext('FW')));
const W_HW = bound('damage-hw', sub(mi('w'), mtext('HW')));
const W_DMG = bound('damage-zone', sub(mi('w'), mtext('dmg')));
const RHO = bound('density-law', mi('ρ'));
const RHO0 = bound('density-law', sub(mi('ρ'), mn('0')));
const RHO_BG = bound('background', sub(mi('ρ'), mtext('bg')));
const X = bound('scanline', mi('x'));
const X_EDGE = bound('damage-edge', sub(mi('x'), mtext('edge')));
const D_SLIP = bound('core-point', mi('D'));
const N_COUNT = bound('clast-size', row(mi('N'), paren(mo('>'), mi('d'))));
const DF = bound('clast-size', sub(mi('D'), mtext('f')));
const D_MAX = bound('largest-clast', sub(mi('d'), mtext('max')));
const D_M = bound('matrix-cutoff', sub(mi('d'), mtext('m')));
const F = bound('fraction-curve', mi('f'));
const TAU = bound('heating-curve', mi('τ'));
const W_SLIP = bound('melt-vein', mi('w'));
const DT = bound('heating-point', row(mi('Δ'), mi('T')));
const T_MELT = bound('melt-line', sub(mi('T'), mtext('melt')));
const G = bound('isotherms', mi('G'));
const FA = bound('fa-point', sub(mi('F'), mtext('a')));

const I = {
  W: inline(mi('W')),
  wcore: inline(sub(mi('w'), mtext('core'))),
  wdmg: inline(sub(mi('w'), mtext('dmg'))),
  rho: inline(mi('ρ')),
  rho0: inline(sub(mi('ρ'), mn('0'))),
  rhobg: inline(sub(mi('ρ'), mtext('bg'))),
  x: inline(mi('x')),
  n: inline(mi('n')),
  D: inline(mi('D')),
  k: inline(mi('k')),
  d: inline(mi('d')),
  Df: inline(sub(mi('D'), mtext('f'))),
  dmax: inline(sub(mi('d'), mtext('max'))),
  dm: inline(sub(mi('d'), mtext('m'))),
  f: inline(mi('f')),
  tau: inline(mi('τ')),
  w: inline(mi('w')),
  dT: inline(mi('Δ'), mi('T')),
  G: inline(mi('G')),
  Fa: inline(sub(mi('F'), mtext('a'))),
};

const SYMBOL = {
  W: { symbol: mi('W'), sceneRef: 'zone-width', description: 'Total width of the fault zone: core plus both damage zones, measured at right angles to the fault' },
  core: { symbol: sub(mi('w'), mtext('core')), sceneRef: 'core', description: 'Width of the fault core: crushed fault rock around the slip surfaces (dark, speckled)' },
  fw: { symbol: sub(mi('w'), mtext('FW')), sceneRef: 'damage-fw', description: 'Width of the footwall damage zone (west, orange tint, dashed edge)' },
  hw: { symbol: sub(mi('w'), mtext('HW')), sceneRef: 'damage-hw', description: 'Width of the hanging-wall damage zone (east, orange tint, dashed edge)' },
  dmg: { symbol: sub(mi('w'), mtext('dmg')), sceneRef: 'damage-zone', description: 'Damage-zone width: both walls together' },
  slipSurface: { symbol: mtext('slip surface'), sceneRef: 'slip-surface', description: 'Principal slip surfaces (strands): where most of the slip happened (white lines)' },
  host: { symbol: mtext('host rock'), sceneRef: 'host', description: 'Host rock: fractured only at the background level' },
  process: { symbol: mtext('process zone'), sceneRef: 'process-zone', description: 'Process zone: small cracks ahead of a growing tip, which become damage zone as the fault grows through them (pink, map panel)' },
  lens: { symbol: mtext('lens'), sceneRef: 'lens', description: 'Fault lens: a slab of less-crushed rock caught between two strands (white outline)' },
  tip: { symbol: mtext('tip'), sceneRef: 'tip-damage', description: 'Tip damage: splays and wing cracks where a fault ends' },
  wall: { symbol: mtext('wall'), sceneRef: 'wall-damage', description: 'Wall damage: fractures along the fault’s walls' },
  linking: { symbol: mtext('linking'), sceneRef: 'linking-damage', description: 'Linking damage: fractures between overlapping segments' },
  rho: { symbol: mi('ρ'), sceneRef: 'density-law', description: 'Fracture density: fractures crossed per metre of scanline (the curves on the plot)' },
  rho0: { symbol: sub(mi('ρ'), mn('0')), sceneRef: 'density-law', description: 'Density at the core’s edge, for each wall' },
  rhobg: { symbol: sub(mi('ρ'), mtext('bg')), sceneRef: 'background', description: 'Background density of the host rock, 0.5 per metre (dashed line)' },
  x: { symbol: mi('x'), sceneRef: 'scanline', description: 'Distance from the core’s edge, at right angles to the fault, along the blue scanline' },
  edge: { symbol: sub(mi('x'), mtext('edge')), sceneRef: 'damage-edge', description: 'Where the density falls to the background: the edge of the damage zone (orange dashed lines)' },
  counts: { symbol: mtext('counted'), sceneRef: 'density-counts', description: 'Fractures the scanline crosses, counted in 1 m bins (bars)' },
  D: { symbol: mi('D'), sceneRef: 'core-point', description: 'Displacement on the fault: its total slip' },
  coreBand: { symbol: mtext('core band'), sceneRef: 'core-band', description: 'Published core widths: D/1000 to D/10 (gray band)' },
  damageBand: { symbol: mtext('damage band'), sceneRef: 'damage-band', description: 'Published damage-zone widths: about D, an order of magnitude either way (orange band)' },
  corePoint: { symbol: sub(mi('w'), mtext('core')), sceneRef: 'core-point', description: 'This fault’s core width (the diamond on the plot)' },
  damagePoint: { symbol: sub(mi('w'), mtext('dmg')), sceneRef: 'damage-point', description: 'This fault’s damage-zone width, one wall (the circle on the plot)' },
  N: { symbol: row(mi('N'), paren(mo('>'), mi('d'))), sceneRef: 'clast-size', description: 'Number of clasts larger than d (the plot, log–log)' },
  Df: { symbol: sub(mi('D'), mtext('f')), sceneRef: 'clast-size', description: 'Fractal dimension: how fast the number of clasts grows as they get smaller' },
  dmax: { symbol: sub(mi('d'), mtext('max')), sceneRef: 'largest-clast', description: 'Size of the largest clast (outlined in orange on the slab)' },
  dm: { symbol: sub(mi('d'), mtext('m')), sceneRef: 'matrix-cutoff', description: 'Matrix size, 0.1 mm: finer grains are matrix, too small to see without a lens' },
  f: { symbol: mi('f'), sceneRef: 'fraction-curve', description: 'Volume fraction of the rock finer than a size d (the curve)' },
  matrix: { symbol: mtext('matrix'), sceneRef: 'matrix', description: 'Matrix: grains finer than 0.1 mm (the dark ground of the slab)' },
  fragments: { symbol: mtext('fragments'), sceneRef: 'fragments', description: 'Fragments coarser than 0.1 mm; the smallest are single dots' },
  chart: { symbol: mtext('Sibson'), sceneRef: 'sample-point', description: 'This rock on Sibson’s chart (the diamond) and its name' },
  wm: { symbol: mtext('W & M'), sceneRef: 'wm-name', description: 'Woodcock & Mort’s breccia name, from the clasts of 2 mm or more' },
  breccia2: { symbol: mtext('2 mm'), sceneRef: 'breccia-cutoff', description: 'Woodcock & Mort count clasts of 2 mm or more' },
  tau: { symbol: mi('τ'), sceneRef: 'heating-curve', description: 'Shear stress on the fault while it slips' },
  w: { symbol: mi('w'), sceneRef: 'melt-vein', description: 'Width of the slip zone that the heat goes into (the vein on the slab)' },
  dT: { symbol: row(mi('Δ'), mi('T')), sceneRef: 'heating-point', description: 'Temperature rise of the slip zone (the point on the plot)' },
  melt: { symbol: sub(mi('T'), mtext('melt')), sceneRef: 'melt-line', description: 'Rock starts to melt near 1000 °C (dashed line)' },
  G: { symbol: mi('G'), sceneRef: 'isotherms', description: 'Geothermal gradient: how fast temperature rises with depth (yellow isotherms)' },
  loose: { symbol: mtext('loose'), sceneRef: 'zone-incohesive', description: 'Loose gouge and breccia, near the surface' },
  cataclasite: { symbol: mtext('cataclasite'), sceneRef: 'zone-cataclasite', description: 'Cohesive cataclasites; pseudotachylyte where earthquakes slip (stars)' },
  mylonite: { symbol: mtext('mylonite'), sceneRef: 'zone-quartz', description: 'Mylonites, where quartz flows (feldspar still breaks)' },
  deep: { symbol: mtext('deeper'), sceneRef: 'zone-mylonite', description: 'Mylonites where feldspar flows too' },
  fractures: { symbol: mtext('fractures'), sceneRef: 'fractures', description: 'Open fractures in the crystalline damage zone (dark lines)' },
  bands: { symbol: mtext('bands'), sceneRef: 'deformation-bands', description: 'Deformation bands in the porous sandstone (light lines)' },
  along: { symbol: mtext('along'), sceneRef: 'flow-along', description: 'Water moving along the fault (blue arrows)' },
  across: { symbol: mtext('across'), sceneRef: 'flow-across', description: 'Water trying to cross the fault (pink, stopped)' },
  Fa: { symbol: sub(mi('F'), mtext('a')), sceneRef: 'fa-point', description: 'Architecture index: the damage zones’ share of the fault zone’s width (the marker on the bar)' },
  endMember: { symbol: mtext('end-member'), sceneRef: 'end-member', description: 'Caine et al.’s end-member for this fault zone (the lit box)' },
};

const ZONE_SUM = math(W, EQ, W_CORE, PLUS, W_FW, PLUS, W_HW) + math(EQ, live('zoneSum'), EQ, live('zoneWidth', 'zone-width'));
const DENSITY = math(RHO, paren(X), EQ, RHO0, sup(paren(mn('1'), PLUS, frac(X, sub(mi('x'), mn('0')))), row(MINUS, mi('n'))))
  + math(text('down to the background'), SPACE(0.3), RHO_BG);
const MATRIX_FRACTION = math(F, paren(D_M), EQ, frac(row(sup(D_M, mi('e')), MINUS, sup(sub(mi('d'), mtext('min')), mi('e'))), row(sup(D_MAX, mi('e')), MINUS, sup(sub(mi('d'), mtext('min')), mi('e')))))
  + math(mi('e'), EQ, mn('3'), MINUS, DF);
const HEATING = math(DT, EQ, frac(row(TAU, SPACE(0.15), mi('D')), row(mi('ρ'), SPACE(0.15), mi('c'), SPACE(0.15), W_SLIP)));

export default {
  id: 'B11',
  status: 'built',
  steps: [
    {
      id: 'line-to-zone',
      label: 'From line to zone',
      title: 'A fault is a zone, not a line',
      activeLabel: 'Parts of a fault zone',
      body: `B8 drew a fault as one clean plane, and on a map that is right: in this block 1 km across, the fault is a line. Switch to the outcrop, 40 m across, and the line becomes a <strong>fault zone</strong>. Most of the slip happened on one or a few <strong>principal slip surfaces</strong> inside the <strong>fault core</strong>, a band of crushed rock called <strong>fault rock</strong>. On each side is a <strong>damage zone</strong>: host rock broken by fractures that took up little of the slip. Beyond it the <strong>host rock</strong> is fractured only at its normal background level. Before a fault reaches a place, the rock ahead of its growing tip is already cracked: that <strong>process zone</strong> becomes damage zone as the fault grows through it (map panel). Whether a fault is a surface or a zone depends on the scale you look at.`,
      task: 'Switch between the map scale and the outcrop. Hover each part of the zone.',
      visualKind: 'fault-zone',
      controls: ['scale', 'view'],
      labOptions: { setup: 'outcrop', panels: ['damage-map'], views: ['3d', 'map', 'section'] },
      initialLabState: { scale: 'map', view: '3d' },
      equations: [
        {
          id: 'parts',
          html: ZONE_SUM
            + math(bound('slip-surface', text('slip surfaces')), SPACE(0.3), text('in the'), SPACE(0.3), bound('core', text('core')))
            + math(bound('damage-zone', text('damage zones')), COMMA, SPACE(0.3), bound('host', text('host rock')))
            + math(bound('process-zone', text('process zone')), SPACE(0.3), text('at a growing tip'))
            + `<small>Widths are measured at right angles to the fault. The fault strikes north, dips 60° east, and has slipped ${inline(mi('D'))} = 10 m.</small>`,
          symbols: [SYMBOL.W, SYMBOL.core, SYMBOL.fw, SYMBOL.hw, SYMBOL.slipSurface, SYMBOL.host, SYMBOL.process],
        },
      ],
      prompt: 'This fault has slipped 10 m. Where did most of that slip happen?',
      choices: [
        { id: 'core', label: 'On the slip surfaces in the core', correct: true, feedback: 'Right. The slip surfaces carry nearly all of it. The damage zone’s fractures each moved a little or not at all; they record the stress around the fault as it grew.' },
        { id: 'spread', label: 'Spread evenly across the whole 14 m zone', correct: false, feedback: 'Then the beds would bend smoothly across the zone. Slip is concentrated: most of it is on one or a few surfaces in the core.' },
        { id: 'damage', label: 'In the damage zone, which is the widest part', correct: false, feedback: 'The damage zone is wide, but its fractures moved little. Most of the slip is on the slip surfaces in the core.' },
      ],
    },
    {
      id: 'architecture',
      label: 'Real architecture',
      title: 'Strands, lenses, and uneven walls',
      activeLabel: 'Fault-zone architecture',
      body: `Real fault zones are rarely a neat core between two equal damage zones. A core can hold several <strong>strands</strong>, slip surfaces that split and rejoin around <strong>fault lenses</strong> of less-crushed rock. The two damage zones need not match: in many normal faults the hanging wall’s is wider. Damage also changes along a fault. Kim, Peacock & Sanderson (2004) sort it by where it forms (map panel): <strong>tip damage</strong> where a fault ends, in splays and wing cracks; <strong>wall damage</strong> along its sides; and <strong>linking damage</strong> where two segments overlap and their stresses interact.`,
      task: 'Add strands and lenses. Make the two damage zones different. Hover the three kinds of damage on the map.',
      visualKind: 'fault-zone',
      controls: ['strands', 'lenses', 'footwall', 'hangingWall', 'view'],
      labOptions: { setup: 'outcrop', panels: ['damage-map'], views: ['3d', 'map', 'section'] },
      initialLabState: { strands: 2, lenses: 1, view: '3d' },
      equations: [
        {
          id: 'uneven',
          html: ZONE_SUM
            + math(W_FW, EQ, live('fw', 'damage-fw'), COMMA, SPACE(), W_HW, EQ, live('hw', 'damage-hw'))
            + math(live('strandCount', 'slip-surface'), COMMA, SPACE(0.3), live('lensCount', 'lens'))
            + math(text('damage:'), SPACE(0.3), bound('tip-damage', text('tip')), COMMA, SPACE(0.3), bound('wall-damage', text('wall')), COMMA, SPACE(0.3), bound('linking-damage', text('linking')))
            + '<small>Lenses need at least two strands. The fractures are drawn from the density law of step 3.</small>',
          symbols: [SYMBOL.fw, SYMBOL.hw, SYMBOL.slipSurface, SYMBOL.lens, SYMBOL.tip, SYMBOL.wall, SYMBOL.linking],
        },
      ],
      prompt: 'Along a fault, where is the damage zone usually widest?',
      choices: [
        { id: 'tips', label: 'At its tips and where segments link', correct: true, feedback: 'Right. Stress concentrates where a fault ends or where two segments interact, so the rock there breaks most. A fault map with wide damage in one place often marks a tip or a linkage.' },
        { id: 'middle', label: 'In the middle, where the slip is largest', correct: false, feedback: 'Wall damage does grow with slip, but tips and linkages concentrate stress. Hover the tip and linking damage on the map.' },
        { id: 'same', label: 'It is the same width all along the fault', correct: false, feedback: 'Damage varies a lot along a fault. Hover the three kinds of damage on the map: the widest are at the tip and at the linkage.' },
      ],
    },
    {
      id: 'scanline',
      label: 'The scanline',
      title: 'Measuring damage with a scanline',
      activeLabel: 'Fracture density across the zone',
      body: `How wide is a damage zone? Geologists stretch a tape across the fault, a <strong>scanline</strong>, and count the fractures it crosses in each metre. The density ${I.rho} is highest at the core and falls with distance ${I.x}. Many measured faults fit a power law, ${I.rho} ∝ (1 + ${I.x}/${inline(sub(mi('x'), mn('0')))})<sup>−${I.n}</sup>, with ${I.n} ≈ 0.8 for small faults (Savage & Brodsky 2011); others fit an exponential. Far away the density levels off at the host rock’s <strong>background</strong>, ${I.rhobg}. The damage zone ends where the density reaches the background. The bars are the fractures this scanline crosses on the outcrop surface; the curves are the law they were drawn from.`,
      task: 'Drag the scanline north and south, and compare the counted bars with the curves. Change the two damage-zone widths.',
      visualKind: 'fault-zone',
      controls: ['scanline', 'footwall', 'hangingWall', 'view'],
      labOptions: { setup: 'outcrop', panels: ['scanline'], views: ['map', '3d'] },
      initialLabState: { strands: 1, lenses: 0, footwall: 5, hangingWall: 8, scanline: 0, view: 'map' },
      equations: [
        {
          id: 'density',
          html: DENSITY
            + math(X_EDGE, EQ, sub(mi('x'), mn('0')), paren(sup(paren(frac(RHO0, RHO_BG)), row(mn('1'), mo('/'), mi('n'))), MINUS, mn('1')))
            + math(RHO0, mo(':'), SPACE(0.3), text('FW'), SPACE(0.2), live('rho0FW', 'density-law'), COMMA, SPACE(0.3), text('HW'), SPACE(0.2), live('rho0HW', 'density-law'), SPACE(0.2), text('per m'))
            + math(X_EDGE, mo(':'), SPACE(0.3), text('FW'), SPACE(0.2), live('edgeFW', 'damage-edge'), COMMA, SPACE(0.3), text('HW'), SPACE(0.2), live('edgeHW', 'damage-edge'))
            + `<small>${inline(mi('n'))} = 0.8, ${inline(sub(mi('x'), mn('0')))} = 0.5 m, ${I.rhobg} = 0.5 per m (stated values). The scanline runs east–west on the surface; distances are converted to right angles to the fault (× sin 60°). The fractures are schematic in shape; their numbers follow the law.</small>`,
          symbols: [SYMBOL.rho, SYMBOL.rho0, SYMBOL.rhobg, SYMBOL.x, SYMBOL.edge, SYMBOL.counts],
        },
      ],
      prompt: `A footwall scanline shows ${I.rho0} = 3.0 fractures per metre at the core’s edge, falling as above (${I.n} = 0.8, ${inline(sub(mi('x'), mn('0')))} = 0.5 m) to a background of 0.5 per metre. How wide is the footwall damage zone? (m)`,
      answer: {
        value: 4.2,
        tolerance: 0.06,
        correctFeedback: 'Correct: x = 0.5 m × ((3.0/0.5)^(1/0.8) − 1) = 0.5 × (6^1.25 − 1) = 0.5 × 8.39 ≈ 4.2 m. Set the footwall width to 4.2 m to see ρ₀ read 3.0.',
        wrong: [
          { value: 1.6, tolerance: 0.06, feedback: 'That used the exponent n instead of 1/n: 6^0.8. Solve ρ₀(1 + x/x₀)^(−n) = ρbg for x: the power is 1/n = 1.25.' },
          { value: 4.7, tolerance: 0.06, feedback: 'Close: you left out the −1. x = x₀((ρ₀/ρbg)^(1/n) − 1).' },
          { value: 2.5, tolerance: 0.06, feedback: 'That is 0.5 × 5, a straight line. The density law is a power law: use x = x₀((ρ₀/ρbg)^(1/n) − 1).' },
        ],
        fallbackFeedback: 'Set ρ₀(1 + x/x₀)^(−n) equal to ρbg and solve: x = x₀((ρ₀/ρbg)^(1/n) − 1), with ρ₀/ρbg = 6.',
      },
    },
    {
      id: 'scaling',
      label: 'Widths and displacement',
      title: 'Fault zones widen as faults slip',
      activeLabel: 'Width–displacement scaling',
      body: `As a fault gains displacement ${I.D}, it grinds more core rock and breaks more wall rock, so both widths grow. Compilations of many faults (Fossen 2016, ch. 9) show the core about ${I.D}/100 thick, but anywhere from ${I.D}/1000 to ${I.D}/10, and each damage zone roughly ${I.D} wide for faults with ${I.D} up to about 100 m, again scattered by an order of magnitude either way. Beyond that, damage zones stop widening as fast. On log–log axes the rule ${I.wcore} = ${I.D}/${I.k} is a straight line of slope 1. The bands summarize published scatter; they are not data. The block keeps its look as ${I.D} changes: only its scale bar does, so a fault zone looks alike at every size.`,
      task: `Change ${I.D}, the core ratio ${I.k}, and the damage ratio. Watch the points move in the bands.`,
      visualKind: 'fault-zone',
      controls: ['displacement', 'coreRatio', 'damageRatio', 'view'],
      labOptions: { setup: 'outcrop', panels: ['scaling'], scaling: true, views: ['3d', 'map'] },
      initialLabState: { logD: 1, logK: 2, logA: 0, view: '3d' },
      revealAfterAnswer: ['coreWidth'],
      equations: [
        {
          id: 'widths',
          html: math(W_CORE, EQ, frac(D_SLIP, mi('k')), COMMA, SPACE(), W_DMG, EQ, mi('a'), SPACE(0.1), D_SLIP)
            + math(D_SLIP, EQ, live('displacement', 'core-point'), COMMA, SPACE(), mi('k'), EQ, live('coreRatio', 'core-point'), COMMA, SPACE(), mi('a'), EQ, live('damageRatio', 'damage-point'))
            + math(W_CORE, EQ, live('coreWidth', 'core-point'), COMMA, SPACE(), W_DMG, EQ, live('damageWidth', 'damage-point'))
            + `<small>${I.wdmg} is for each wall. Published: ${I.k} from 10 to 1000 (typically 100); ${inline(mi('a'))} from 0.1 to 10 (typically 1), for ${I.D} up to about 100 m.</small>`,
          symbols: [SYMBOL.D, SYMBOL.corePoint, SYMBOL.damagePoint, SYMBOL.coreBand, SYMBOL.damageBand],
        },
      ],
      prompt: `A fault has ${I.D} = 50 m. With the typical core, ${I.wcore} = ${I.D}/100, how thick is its core? (m)`,
      answer: {
        value: 0.5,
        tolerance: 0.01,
        correctFeedback: 'Correct: 50 m / 100 = 0.5 m. The scatter is large, so a core anywhere from 5 cm (D/1000) to 5 m (D/10) would not be surprising.',
        wrong: [
          { value: 5, tolerance: 0.05, feedback: 'That is D/10, the thick end of the range. The typical core is D/100.' },
          { value: 0.05, tolerance: 0.005, feedback: 'That is D/1000, the thin end of the range. The typical core is D/100.' },
          { value: 50, tolerance: 0.5, feedback: 'That is the damage-zone width, about D. The core is much thinner: D/100.' },
        ],
        fallbackFeedback: 'Divide the displacement by 100: 50 m / 100.',
      },
    },
    {
      id: 'grinding',
      label: 'Grinding rock',
      title: 'Grinding rock: the clast-size power law',
      activeLabel: 'Comminution',
      body: `Inside the core, slip breaks clasts, rotates them, and grinds them down: <strong>comminution</strong>. Two grains of equal size pressed together tend to break each other, so the survivors are grains with no neighbor of their size. That leaves a <strong>power law</strong>: the number of clasts larger than ${I.d} grows as ${I.d}<sup>−${I.Df}</sup> as ${I.d} shrinks, with a fractal dimension ${I.Df} ≈ 2.58 predicted for this “constrained” comminution and 2.60 ± 0.11 measured in natural gouge (Sammis, King & Biegel 1987). The <strong>matrix</strong> is the grains finer than ${I.dm} = 0.1 mm, and its share is the integral of the power law. The slab is a slice through the rock, where the exponent drops by 1. Its clasts are drawn from that slice law, and the areas of clast and matrix match the model.`,
      task: 'Slide the slip from 1 cm to 100 m. Watch the largest clast, the slope, and the matrix.',
      visualKind: 'fault-zone',
      controls: ['slip', 'view'],
      labOptions: { setup: 'sample', panels: ['counts', 'fraction'], views: ['3d', 'map'] },
      initialLabState: { logSlip: -1.5, view: '3d' },
      equations: [
        {
          id: 'power-law',
          html: math(N_COUNT, mo('∝'), sup(mi('d'), row(MINUS, DF)))
            + math(text('in a slice:'), SPACE(0.3), sup(mi('d'), row(MINUS, paren(DF, MINUS, mn('1')))))
            + MATRIX_FRACTION
            + math(text('slip'), SPACE(0.3), live('slip'), mo(':'), SPACE(0.3), D_MAX, EQ, live('dMax', 'largest-clast'))
            + math(DF, EQ, live('df', 'clast-size'), COMMA, SPACE(0.3), bound('matrix', text('matrix')), EQ, live('matrixPct', 'matrix'))
            + math(text('matrix drawn on the slab:'), SPACE(0.3), live('drawnMatrix', 'matrix'))
            + `<small>${I.dm} = 0.1 mm, ${inline(sub(mi('d'), mtext('min')))} = 0.001 mm. How ${I.dmax} and ${I.Df} change with slip is a stated rule, not a law: real grinding depends on the rock, the stress, and fluids.</small>`,
          symbols: [SYMBOL.N, SYMBOL.Df, SYMBOL.dmax, SYMBOL.dm, SYMBOL.f, SYMBOL.matrix, SYMBOL.fragments],
        },
      ],
      prompt: 'As the slip grows from 1 cm to 100 m, how do the largest clast and the matrix change?',
      choices: [
        { id: 'late', label: 'The largest clast shrinks steadily, but the matrix stays small until the largest clasts get near 0.1 mm, then rises fast', correct: true, feedback: 'Right. With Df below 3, most of the volume sits in the largest clasts, so the matrix share stays small until those clasts are ground down close to the matrix size.' },
        { id: 'together', label: 'Both change steadily, at the same pace', correct: false, feedback: 'Slide the slip and watch the matrix: it barely moves at first, then climbs. The volume sits in the largest clasts until they get small.' },
        { id: 'early', label: 'The matrix jumps first, then the clasts shrink', correct: false, feedback: 'Watch the plot: the matrix share stays low while the largest clast shrinks, and it only rises fast near the end.' },
      ],
    },
    {
      id: 'naming',
      label: 'Naming fault rocks',
      title: 'Naming fault rocks: Sibson’s chart',
      activeLabel: 'Fault-rock classification',
      body: `Fault rocks are named on three axes (Sibson 1977). Is the rock <strong>loose</strong> (incohesive) or <strong>cohesive</strong>, healed or cemented by minerals from fluids? Is its fabric <strong>random</strong> or <strong>foliated</strong>? And how much of it is <strong>matrix</strong>? Loose rock with 30% or more visible fragments is <strong>fault breccia</strong>; with less it is <strong>fault gouge</strong>. Cohesive rock with under 10% matrix is a <strong>crush breccia</strong>, named by its fragment size; then come <strong>protocataclasite</strong> (10–50% matrix), <strong>cataclasite</strong> (50–90%), and <strong>ultracataclasite</strong> (90–100%). Foliated cohesive rocks are the <strong>mylonite series</strong>, but they form by ductile flow, not by breaking; the mica-rich kind is <strong>phyllonite</strong>. Some gouges are foliated, too. Other schemes differ: Woodcock & Mort (2008) call any rock with 30% or more clasts of 2 mm or more a breccia, loose or not, and split it into <strong>crackle</strong>, <strong>mosaic</strong>, and <strong>chaotic</strong> breccia. PSGT separates breccia from gouge at about 1 mm.`,
      task: `Set ${I.dmax} and ${I.Df}, then toggle cohesion and fabric. Make the three rocks of the goal.`,
      visualKind: 'fault-zone',
      controls: ['dmax', 'df', 'cohesion', 'fabric', 'view'],
      labOptions: { setup: 'sample', panels: ['fraction', 'chart'], views: ['3d', 'map'] },
      initialLabState: { logDMax: 1, df: 2.2, cohesive: true, foliated: false, view: '3d' },
      goal: { text: 'Make a fault gouge, a fine crush breccia, and an ultracataclasite.', check: (lab) => ['fault gouge', 'fine crush breccia', 'ultracataclasite'].every((name) => lab.madeRocks?.includes(name)) },
      equations: [
        {
          id: 'classify',
          html: math(bound('matrix', text('matrix')), EQ, mn('100'), SPACE(0.15), F, paren(D_M), EQ, live('matrixPct', 'matrix'))
            + math(bound('breccia-cutoff', text('≥ 2 mm:')), SPACE(0.3), mn('100'), mo('['), mn('1'), MINUS, F, paren(mn('2'), SPACE(0.2), text('mm')), mo(']'))
            + math(EQ, live('clastPct', 'breccia-cutoff'), SPACE(0.3), text('clasts'))
            + math(bound('fragments', text('fragments')), SPACE(0.3), text('about'), SPACE(0.3), live('fragmentSize', 'fragments'))
            + math(live('cohesion'), COMMA, SPACE(0.3), live('fabric'))
            + math(bound('sample-point', text('Sibson:')), SPACE(0.3), live('sibsonName', 'sample-point'))
            + math(bound('wm-name', text('W & M:')), SPACE(0.3), live('wmName', 'wm-name'))
            + '<small>The fragment size is the median, by volume, of the grains coarser than the matrix. Cohesion and fabric are set by the toggles: they come from healing, cement, and flow, not from the size distribution.</small>',
          symbols: [SYMBOL.f, SYMBOL.dm, SYMBOL.matrix, SYMBOL.fragments, SYMBOL.breccia2, SYMBOL.chart, SYMBOL.wm],
        },
      ],
      prompt: 'A cohesive rock has 70% matrix and a random fabric. What is it in Sibson’s scheme?',
      choices: [
        { id: 'cataclasite', label: 'Cataclasite', correct: true, feedback: 'Right: cohesive, random fabric, and 50–90% matrix. Loose, the same grains would be fault breccia (30% fragments); Woodcock & Mort would not call it a breccia unless 30% of it were clasts of 2 mm or more.' },
        { id: 'gouge', label: 'Fault gouge', correct: false, feedback: 'Gouge is loose (incohesive). This rock is cohesive, so it is in the cataclasite series.' },
        { id: 'mylonite', label: 'Mylonite', correct: false, feedback: 'Mylonites are foliated and form by ductile flow. A random fabric with 70% matrix is a cataclasite.' },
      ],
    },
    {
      id: 'melting',
      label: 'Melting on a fault',
      title: 'Melting on a fault: pseudotachylyte',
      activeLabel: 'Frictional heating',
      body: `During an earthquake a fault slips about a metre in a second or so. Friction turns the work of slip, shear stress × slip, into heat, in a slip zone only millimetres to centimetres wide. If none of the heat escapes, the zone warms by ${I.dT} = ${I.tau}${I.D}/(ρ<i>c</i>${I.w}): an upper bound, since some heat flows away and some is used up in melting. Thin zones heat most. Rock starts to melt near 1000 °C, and the melt chills into a dark glassy vein, <strong>pseudotachylyte</strong>, with injection veins forced into cracks in the walls and rounded clasts of quartz, which melts only above about 1700 °C. The name means “false tachylyte”: it looks like volcanic glass but formed on a fault. It records a fossil earthquake. Here the fault starts at 200 °C, about 8 km deep.`,
      task: `Change ${I.tau}, ${I.D}, and the slip-zone width ${I.w}. Find when the slab melts.`,
      visualKind: 'fault-zone',
      controls: ['tau', 'heatSlip', 'width', 'view'],
      labOptions: { setup: 'sample', panels: ['heating', 'chart'], views: ['3d', 'map'] },
      initialLabState: { tau: 50, logHeatSlip: 0, logWidth: -1, view: '3d' },
      equations: [
        {
          id: 'heating',
          html: HEATING
            + math(EQ, frac(row(live('tauPa'), TIMES, live('heatSlip')), row(mn('2700'), TIMES, mn('1000'), TIMES, live('widthM'))))
            + math(EQ, live('deltaT', 'heating-point'))
            + math(mi('T'), EQ, mn('200'), SPACE(0.2), text('°C'), PLUS, DT, EQ, live('temperature', 'heating-point'))
            + math(T_MELT, mo('≈'), mn('1000'), SPACE(0.2), text('°C'))
            + math(live('meltState', 'melt-vein'))
            + `<small>ρ = 2700 kg/m³ and ${inline(mi('c'))} = 1000 J/(kg K). ${I.tau} in Pa, ${I.D} and ${I.w} in metres. The bound is exact for its assumptions; the melting temperatures are stated ranges. The vein’s shape is schematic.</small>`,
          symbols: [SYMBOL.tau, SYMBOL.w, SYMBOL.dT, SYMBOL.melt],
        },
      ],
      prompt: `A fault slips ${I.D} = 1 m under ${I.tau} = 50 MPa, in a slip zone ${I.w} = 1 cm wide. What is the adiabatic temperature rise ${I.dT}? (K, or °C of change)`,
      answer: {
        value: 1852,
        tolerance: 15,
        correctFeedback: 'Correct: ΔT = (50 × 10⁶ Pa × 1 m) / (2700 kg/m³ × 1000 J/(kg K) × 0.01 m) ≈ 1850 K. From 200 °C that is far past melting; with w = 1 mm it would be ten times more. Real zones lose heat and use it to melt, so they stop near the melting range: thin zones melt.',
        wrong: [
          { value: 18.5, tolerance: 0.5, feedback: 'That used w = 1 m. Convert 1 cm to metres: w = 0.01 m.' },
          { value: 185, tolerance: 2, feedback: 'That used w = 0.1 m. 1 cm is 0.01 m.' },
          { value: 0.00185, tolerance: 0.0001, feedback: 'That used τ = 50 instead of 50 × 10⁶ Pa. Convert MPa to Pa.' },
          { value: 18519, tolerance: 150, feedback: 'That used w = 1 mm. The question gives 1 cm = 0.01 m.' },
        ],
        fallbackFeedback: 'Use ΔT = τD/(ρcw) in SI units: τ = 50 × 10⁶ Pa, D = 1 m, ρ = 2700 kg/m³, c = 1000 J/(kg K), w = 0.01 m.',
      },
    },
    {
      id: 'depth',
      label: 'Fault rocks with depth',
      title: 'Fault rocks change with depth',
      activeLabel: 'Fault rocks and temperature',
      body: `Temperature rises with depth, by the geothermal gradient ${I.G}, and the fault rock that forms depends on it. Near the surface fault rock stays <strong>loose</strong>: gouge and breccia. From about 100 °C, quartz cement and healing make it <strong>cohesive</strong>: cataclasites. Most earthquakes start in this range, so <strong>pseudotachylyte</strong> forms here (stars). Deeper, minerals begin to flow by crystal plasticity instead of breaking: calcite from about 250 °C, quartz from about 300 °C, and feldspar from about 450 °C (PSGT). Below those depths a fault becomes a <strong>shear zone</strong> of mylonite, and it widens. The name mylonite, from the Greek for mill, came from a belief that it was crushed rock; it is not. A higher gradient, as in a rift, moves every boundary up. B13 returns to the earthquake range, and R6 to the change from breaking to flowing.`,
      task: `Slide the gradient ${I.G} and watch the zones move in the block and in the column.`,
      visualKind: 'fault-zone',
      controls: ['gradient', 'view'],
      labOptions: { setup: 'crust', panels: ['depth'], views: ['3d', 'section'] },
      initialLabState: { gradient: 30, view: 'section' },
      revealAfterAnswer: ['zQuartz'],
      equations: [
        {
          id: 'geotherm',
          html: math(mi('T'), EQ, sub(mi('T'), mn('0')), PLUS, G, mi('z'), SPACE(), mo('⇒'), SPACE(), mi('z'), EQ, frac(row(mi('T'), MINUS, sub(mi('T'), mn('0'))), G))
            + math(G, EQ, live('gradient', 'isotherms'), COMMA, SPACE(), sub(mi('T'), mn('0')), EQ, mn('10'), SPACE(0.2), text('°C'))
            + math(bound('zone-incohesive', text('loose above')), SPACE(0.3), live('zCohesive', 'zone-incohesive'))
            + math(bound('zone-quartz', text('quartz flows below')), SPACE(0.3), live('zQuartz', 'zone-quartz'))
            + math(bound('zone-mylonite', text('feldspar flows below')), SPACE(0.3), live('zFeldspar', 'zone-mylonite'))
            + '<small>Boundary temperatures are stated values for quartz-rich crust; real boundaries vary with rock, fluids, and strain rate. The fault zone is drawn much wider than true, and its widening with depth is schematic.</small>',
          symbols: [SYMBOL.G, SYMBOL.loose, SYMBOL.cataclasite, SYMBOL.mylonite, SYMBOL.deep],
        },
      ],
      prompt: `With ${I.G} = 25 °C/km and a surface temperature of 10 °C, at what depth does quartz start to flow (300 °C)? (km)`,
      answer: {
        value: 11.6,
        tolerance: 0.05,
        correctFeedback: 'Correct: z = (300 − 10) / 25 = 11.6 km. Below about there, faults in quartz-rich rock turn into mylonite shear zones. Set G = 25 to check it on the column.',
        wrong: [
          { value: 12, tolerance: 0.05, feedback: 'That is 300/25: you left out the surface temperature. z = (T − T₀)/G.' },
          { value: 290, tolerance: 1, feedback: 'That is T − T₀, in °C. Divide by the gradient to get km.' },
          { value: 12.4, tolerance: 0.05, feedback: 'That adds the surface temperature. Subtract it: z = (300 − 10)/25.' },
        ],
        fallbackFeedback: 'Solve T = T₀ + G z for z: z = (T − T₀)/G.',
      },
    },
    {
      id: 'host',
      label: 'Crystalline vs porous host',
      title: 'Crystalline and porous hosts make different faults',
      activeLabel: 'Fractures and deformation bands',
      body: `The host rock sets how a fault is born. In low-porosity <strong>crystalline</strong> rock such as granite, the damage zone is open <strong>fractures</strong>, and the core is gouge or cataclasite. Water moves easily along the connected fractures, but hardly across a clay-rich core. In <strong>porous sandstone</strong> the grains can crush and pack tighter instead, in <strong>deformation bands</strong> (B1): thin bands a millimetre or so wide with a few millimetres of offset. A fault grows through a sequence (Aydin & Johnson 1978): single bands, then a zone of many bands, then a slip surface with a thin core of ultracataclasite. The bands are finer and tighter than the sandstone around them, so they <strong>reduce</strong> its permeability.`,
      task: 'Switch between granite and sandstone. In sandstone, step through the three stages. Drag the scanline.',
      visualKind: 'fault-zone',
      controls: ['host', 'stage', 'scanline', 'view'],
      labOptions: { setup: 'outcrop', panels: ['scanline'], flow: true, views: ['3d', 'map'] },
      initialLabState: { host: 'crystalline', stage: 'slip', strands: 1, lenses: 0, footwall: 5, hangingWall: 8, scanline: 0, view: '3d' },
      equations: [
        {
          id: 'host',
          html: math(live('hostName'), mo(':'))
            + math(live('damageKind', 'damage-zone'))
            + DENSITY
            + math(bound('flow-along', text('along:')), SPACE(0.3), live('flowAlong', 'flow-along'))
            + math(bound('flow-across', text('across:')), SPACE(0.3), live('flowAcross', 'flow-across'))
            + '<small>In sandstone the density law counts bands per metre (x₀ = 2 cm, background 0.2 per m). Flow arrows are schematic.</small>',
          symbols: [SYMBOL.fractures, SYMBOL.bands, SYMBOL.dmg, SYMBOL.rho, SYMBOL.along, SYMBOL.across],
        },
      ],
      prompt: 'Compared with the host rock around it, which fault zone makes water crossing the fault slower?',
      choices: [
        { id: 'sandstone', label: 'The sandstone fault, because its deformation bands are tighter than the sandstone', correct: true, feedback: 'Right. The sandstone passes water well, and its band zone is a baffle across it. The granite hardly passes water at all, so its fractured damage zone adds pathways, at least along the fault.' },
        { id: 'granite', label: 'The granite fault, because it has more fractures', correct: false, feedback: 'Fractures make granite more permeable, not less. The bands in sandstone are what make a fault tighter than its host.' },
        { id: 'neither', label: 'Neither: faults always help water through', correct: false, feedback: 'Not always. Deformation bands and clay-rich cores reduce permeability. Whether a fault helps or blocks depends on the host and the parts of the zone.' },
      ],
    },
    {
      id: 'conduit-barrier',
      label: 'Conduit or barrier',
      title: 'Conduit, barrier, or both',
      activeLabel: 'Fault-zone permeability structure',
      body: `Whether a fault helps or blocks flow depends on its parts. Caine, Evans & Forster (1996) measure the balance with the <strong>architecture index</strong> ${I.Fa}, the damage zones’ share of the fault zone’s width: 0 for all core, 1 for all damage zone. They name four end-members by which parts are well developed. A <strong>localized conduit</strong> has little core or damage: flow runs along the slip surface. A <strong>distributed conduit</strong> is mostly fractured damage zone. A <strong>localized barrier</strong> is mostly fine-grained core. A <strong>combined conduit–barrier</strong> has both: flow runs along its damage zones but not across its core. <em>Geology:</em> groundwater and hot springs follow fractured damage zones; ore minerals fill breccias, where fluids moved in pulses; and clay-rich gouge can seal an oil or gas trap. B16 returns to faults and fluids.`,
      task: 'Change the core and damage-zone widths. Find each of the four end-members.',
      visualKind: 'fault-zone',
      controls: ['core', 'footwall', 'hangingWall', 'view'],
      labOptions: { setup: 'outcrop', panels: ['gauge'], flow: true, views: ['3d', 'map'] },
      initialLabState: { host: 'crystalline', strands: 1, lenses: 0, core: 0.8, footwall: 5, hangingWall: 8, view: '3d' },
      equations: [
        {
          id: 'fa',
          html: math(FA, EQ, frac(W_DMG, row(W_CORE, PLUS, W_DMG)), EQ, frac(live('damageSum'), row(live('coreValue'), PLUS, live('damageSum'))))
            + math(EQ, live('fa', 'fa-point'), COMMA, SPACE(0.3), W_DMG, EQ, W_FW, PLUS, W_HW)
            + math(bound('end-member', text('end-member:')))
            + math(live('endMember', 'end-member'))
            + '<small>Here a core counts as well developed from 10 cm and the damage zones from 1 m in total: a stated choice for this outcrop. Fa itself is exact.</small>',
          symbols: [SYMBOL.Fa, SYMBOL.dmg, SYMBOL.core, SYMBOL.fw, SYMBOL.hw, SYMBOL.endMember],
        },
      ],
      prompt: 'A fault in granite has a 2 m core of clay-rich gouge and 15 m of fractured damage zone on each side. Which end-member is it?',
      choices: [
        { id: 'combined', label: 'A combined conduit–barrier', correct: true, feedback: 'Right. Both parts are well developed: water runs along the fractured damage zones but the gouge core blocks it from crossing. Fa = 30/32 ≈ 0.94.' },
        { id: 'distributed', label: 'A distributed conduit, because Fa is close to 1', correct: false, feedback: 'Fa is high, but a 2 m clay-rich core is well developed and blocks flow across. With both parts developed it is a combined conduit–barrier.' },
        { id: 'barrier', label: 'A localized barrier', correct: false, feedback: 'A localized barrier has little damage zone. This one has 30 m of fractures that carry water along the fault.' },
      ],
      final: true,
    },
  ],
};
