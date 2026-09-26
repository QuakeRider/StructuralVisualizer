// B7 — Anderson's theory of faulting. Spec: docs/curriculum/unit-3b-faults.md (B7).
// Frame: NED (x = North, y = East, z = Down); stress compression positive.
// Built ahead of its prerequisites (B3, B6) for classroom use, so the steps
// restate the Coulomb angle they rely on. The stereonet view waits for O3.

import { basis, bound, frac, inline, live, math, mi, mn, mo, mtext, row, sub, sup, vec } from '../mathml.js';

const sigma = (index) => sub(mi('σ'), mn(String(index)));

// Bound symbols: each maps to one object in the block or the Mohr diagram.
const S1 = bound('sigma-1', sigma(1));
const S2 = bound('sigma-2', sigma(2));
const SV = bound('vertical-axis', sub(mi('σ'), mi('v')));
const K = bound('vertical-axis', basis.k);
const TAU_GROUND = bound('free-surface', sub(mi('τ'), mtext('ground')));
const MU = bound('envelope', mi('μ'));
const PHI = bound('phi', mi('φ'));
const TWO_THETA = bound('two-theta', row(mn('2'), mi('θ')));
const BETA = bound('beta', mi('β'));
const DIP = bound('dip', mi('δ'));
const ENVELOPE = bound('envelope', row(mi('τ'), mo('='), mi('C'), mo('+'), mi('μ'), sub(mi('σ'), mi('n'))));
const EQ = mo('=');
const MINUS = mo('−');
const deg = (value) => mn(`${value}°`);

// Inline math for prose.
const I = {
  s1: inline(sigma(1)),
  s2: inline(sigma(2)),
  s3: inline(sigma(3)),
  mu: inline(mi('μ')),
  phi: inline(mi('φ')),
  beta: inline(mi('β')),
  dip: inline(mi('δ')),
  twoTheta: inline(mn('2'), mi('θ')),
  twoBeta: inline(mn('2'), mi('β')),
  k: inline(basis.k),
  envelope: inline(mi('τ'), mo('='), mi('C'), mo('+'), mi('μ'), sub(mi('σ'), mi('n'))),
};

const SYMBOL = {
  s1: { symbol: sigma(1), sceneRef: 'sigma-1', description: 'Largest compression: the thick solid arrows, and the right end of the Mohr circle' },
  s2: { symbol: sigma(2), sceneRef: 'sigma-2', description: 'Intermediate compression: the dashed arrows. Both faults contain this direction' },
  s3: { symbol: sigma(3), sceneRef: 'sigma-3', description: 'Smallest compression: the thin dotted arrows, and the left end of the Mohr circle' },
  sv: { symbol: sub(mi('σ'), mi('v')), sceneRef: 'vertical-axis', description: 'The principal stress that points straight down into the ground' },
  k: { symbol: basis.k, sceneRef: 'vertical-axis', description: 'Unit vector along z, which points down in the NED frame' },
  tauGround: { symbol: sub(mi('τ'), mtext('ground')), sceneRef: 'free-surface', description: 'Shear traction on the ground surface (the top of the block): zero, because air cannot push sideways' },
  mu: { symbol: mi('μ'), sceneRef: 'envelope', description: 'Coefficient of internal friction: the slope of the Coulomb line' },
  envelope: { symbol: row(mi('τ'), mo('='), mi('C'), mo('+'), mi('μ'), sub(mi('σ'), mi('n'))), sceneRef: 'envelope', description: 'Coulomb failure line (green): the shear stress the rock can bear at each normal stress' },
  phi: { symbol: mi('φ'), sceneRef: 'phi', description: 'Friction angle: the tilt of the Coulomb line from horizontal' },
  twoTheta: { symbol: row(mn('2'), mi('θ')), sceneRef: 'two-theta', description: 'Angle on the Mohr circle from σ1 to the fault’s point (orange dashed)' },
  beta: { symbol: mi('β'), sceneRef: 'beta', description: 'Angle between σ1 and the fault in the block (pink arc)' },
  dip: { symbol: mi('δ'), sceneRef: 'dip', description: 'Dip: the angle from horizontal down to the fault (violet arc)' },
};

const FRICTION = {
  id: 'friction-angle',
  html: math(PHI, EQ, sup(mi('tan'), row(mo('−'), mn('1'))), MU, EQ, live('phi', 'phi')),
  symbols: [SYMBOL.phi, SYMBOL.mu],
};

const MOHR_ANGLE = {
  id: 'mohr-angle',
  html: math(ENVELOPE) + math(TWO_THETA, EQ, deg(90), mo('+'), PHI, EQ, live('twoTheta', 'two-theta')),
  symbols: [SYMBOL.envelope, SYMBOL.twoTheta],
};

const BETA_ANGLE = {
  id: 'beta-angle',
  html: math(BETA, EQ, deg(45), MINUS, frac(PHI, mn('2')), EQ, live('beta', 'beta')),
  symbols: [SYMBOL.beta, SYMBOL.phi],
};

const DIP_NORMAL = {
  id: 'dip-normal',
  html: math(DIP, EQ, deg(90), MINUS, BETA, EQ, live('dip', 'dip')) + `<small>${I.s1} is vertical, and ${I.beta} is measured from it; the dip is measured from horizontal.</small>`,
  symbols: [SYMBOL.dip, SYMBOL.beta],
};

const DIP_THRUST = {
  id: 'dip-thrust',
  html: math(DIP, EQ, BETA, EQ, live('dip', 'dip')) + `<small>${I.s1} is horizontal, so the angle from ${I.s1} is the dip.</small>`,
  symbols: [SYMBOL.dip, SYMBOL.beta],
};

const DIP_BOTH = {
  id: 'dip-both',
  html: math(sub(DIP, mtext('normal')), EQ, deg(90), MINUS, BETA, EQ, live('dipNormal', 'dip'))
    + math(sub(DIP, mtext('thrust')), EQ, BETA, EQ, live('dipThrust', 'dip')),
  symbols: [SYMBOL.dip, SYMBOL.beta],
};

const VERTICAL_RULE = {
  id: 'vertical-rule',
  html: math(SV, EQ, live('verticalName', 'vertical-axis')) + math(mtext('fault type:'), '<mspace width="0.4em"></mspace>', live('faultType', 'fault')),
  symbols: [SYMBOL.sv],
};

/** Tectonic settings for the last step. Examples are named places; the stress regime is the textbook end member. */
const SETTINGS = Object.freeze([
  { id: 'rift', label: 'Rift', regime: 'normal', examples: 'East African Rift, Basin and Range' },
  { id: 'thrust-belt', label: 'Fold–thrust belt', regime: 'thrust', examples: 'Canadian Rockies, Zagros' },
  { id: 'transform', label: 'Transform', regime: 'strike-slip', examples: 'San Andreas, North Anatolian' },
]);

const WITH_MOHR = { showMohr: true, showAxes: true, showFaults: true, showConjugate: true, showAngles: true, showSlip: true };

export default {
  id: 'B7',
  status: 'built',
  steps: [
    {
      id: 'free-surface',
      label: 'The free surface',
      title: 'At the ground, one principal stress must be vertical',
      activeLabel: 'The free surface',
      body: `The block is a piece of crust in the geological frame: x points north, y east, and z down. Its top is the ground, a free surface. The air above cannot push sideways on the rock, so the shear traction on the ground is zero. A plane with no shear traction is a principal plane, and its normal is a principal direction. The normal to the ground is vertical (${I.k}), so one principal stress is vertical. Anderson’s theory assumes this stays true to the depths where faults form.`,
      task: 'Hover the symbols in the equation to find the ground and the vertical principal stress in the block. Drag to orbit the block.',
      visualKind: 'anderson',
      controls: [],
      labOptions: { showMohr: false, showAxes: true, showFaults: false, showAngles: false, showSlip: false },
      initialLabState: { regime: 'normal', mu: 0.6 },
      equations: [
        {
          id: 'free-surface',
          html: math(TAU_GROUND, EQ, mn('0'), '<mspace width="0.5em"></mspace>', mo('⇒'), '<mspace width="0.5em"></mspace>', vec('σ'), K, EQ, SV, K)
            + `<small>An equation of the form ${inline(vec('σ'), vec('n'), mo('='), mi('λ'), vec('n'))} says that ${inline(vec('n'))} is a principal direction (an eigenvector of the stress tensor).</small>`,
          symbols: [SYMBOL.tauGround, SYMBOL.k, SYMBOL.sv],
        },
      ],
      prompt: 'One principal stress is vertical. What does that mean for the other two?',
      choices: [
        { id: 'horizontal', label: 'Both are horizontal', correct: true, feedback: 'Right. Principal directions are mutually perpendicular, so the other two lie in the horizontal plane. The only question left is which of σ1, σ2, σ3 is the vertical one.' },
        { id: 'vertical', label: 'They are vertical too', correct: false, feedback: 'Only one direction can be vertical. The three principal directions are perpendicular to each other.' },
        { id: 'anywhere', label: 'They can point anywhere', correct: false, feedback: 'They must be perpendicular to the vertical one, so they are confined to the horizontal plane.' },
      ],
    },
    {
      id: 'three-regimes',
      label: 'Three choices',
      title: 'Three ways to stand the stress axes up',
      activeLabel: 'Which stress is vertical?',
      body: `With one axis vertical there are only three choices: the vertical stress is ${I.s1}, ${I.s2}, or ${I.s3}. A new shear fault forms on a Coulomb plane (B3). That plane contains ${I.s2} and lies at a small angle ${I.beta}, about 30°, from ${I.s1}. So each fault leans toward whichever axis is ${I.s1}.`,
      task: `Predict first. Then use the buttons to stand ${I.s2} and then ${I.s3} vertical, and compare the faults.`,
      visualKind: 'anderson',
      controls: ['regime'],
      labOptions: { showMohr: false, showAxes: true, showFaults: true, faultsAfterAnswer: true, showConjugate: true, showAngles: false, showSlip: true },
      initialLabState: { regime: 'normal', mu: 0.6 },
      revealAfterAnswer: ['faultType'],
      equations: [VERTICAL_RULE],
      prompt: `${I.s1} is vertical: the weight of the rock above is the largest compression. The faults contain ${I.s2} and lie about 30° from ${I.s1}. What kind of faults are they?`,
      choices: [
        { id: 'normal', label: 'Normal faults', correct: true, feedback: 'Right. The planes are steep, and the hanging wall slides down them: normal faults. Now stand σ2 and then σ3 vertical.' },
        { id: 'thrust', label: 'Thrust faults', correct: false, feedback: 'Thrusts need σ1 horizontal, pushing the hanging wall up a gentle ramp. Here σ1 is vertical, so the planes are steep and the hanging wall moves down.' },
        { id: 'strike-slip', label: 'Strike-slip faults', correct: false, feedback: 'Strike-slip faults are vertical, which needs σ1 and σ3 both horizontal. Here σ1 is vertical.' },
      ],
    },
    {
      id: 'normal-regime',
      label: 'σ1 vertical: normal',
      title: 'σ1 vertical: normal faults dip about 60°',
      activeLabel: 'Normal-fault regime',
      body: `The Mohr circle (right) grows until it touches the Coulomb line ${I.envelope}. The contact point is the plane that breaks first. It sits at ${I.twoTheta} = 90° + ${I.phi} around the circle, where ${I.phi} = tan⁻¹${I.mu} is the friction angle. In the block that plane lies at ${I.beta} = 45° − ${I.phi}/2 from ${I.s1}. With ${I.s1} vertical, ${I.beta} is measured from the vertical. The dip ${I.dip} is measured from the horizontal, so ${I.dip} = 90° − ${I.beta}.`,
      task: `Hover ${I.phi}, ${I.twoTheta}, ${I.beta}, and ${I.dip} to find each angle in the diagram and the block. Then work out the dip for ${I.mu} = 0.6.`,
      visualKind: 'anderson',
      controls: ['slip'],
      labOptions: WITH_MOHR,
      initialLabState: { regime: 'normal', mu: 0.6 },
      revealAfterAnswer: ['dip'],
      equations: [FRICTION, MOHR_ANGLE, BETA_ANGLE, DIP_NORMAL],
      prompt: `With ${I.mu} = 0.6, what dip ${I.dip} does Anderson predict for the normal faults? (degrees)`,
      answer: {
        value: 60.5,
        tolerance: 1,
        correctFeedback: 'Correct: φ = tan⁻¹0.6 ≈ 31.0°, β = 45° − 15.5° ≈ 29.5°, and δ = 90° − 29.5° ≈ 60.5°. Press Slip to watch the hanging wall move down the fault.',
        wrong: [
          { value: 29.5, feedback: '29.5° is β, the angle from σ1 to the fault. σ1 is vertical here, so the dip from horizontal is 90° − β.' },
          { value: 31, tolerance: 0.5, feedback: '31° is φ, the friction angle. Use it to find β = 45° − φ/2, then δ = 90° − β.' },
          { value: 45, feedback: '45° is the plane of maximum shear stress. Friction turns the failure plane toward σ1, to 45° − φ/2 from it.' },
          { value: 121, tolerance: 1.5, feedback: 'That is 2θ, the angle on the Mohr circle. Angles on the circle are doubled; halve it to get θ, the angle from σ1 to the fault’s normal.' },
        ],
        fallbackFeedback: 'Go one equation at a time: φ = tan⁻¹0.6, then β = 45° − φ/2, then δ = 90° − β.',
      },
    },
    {
      id: 'thrust-regime',
      label: 'σ3 vertical: thrust',
      title: 'σ3 vertical: thrust faults dip about 30°',
      activeLabel: 'Thrust-fault regime',
      body: `Now the smallest compression is vertical and ${I.s1} is horizontal. The Mohr diagram has not changed: the same stresses, the same Coulomb line, the same ${I.beta}. Only the direction of ${I.s1} in the block has changed. Measured from a horizontal ${I.s1}, the angle ${I.beta} is the dip itself. The hanging wall is pushed up a gentle ramp: a reverse fault with a low dip, called a thrust. A common mistake is to picture thrusts under a vertical ${I.s1}, rock squashed from above. Thrusting needs the largest push to be horizontal.`,
      task: 'Predict the dip, then press Slip.',
      visualKind: 'anderson',
      controls: ['slip'],
      labOptions: WITH_MOHR,
      initialLabState: { regime: 'thrust', mu: 0.6 },
      revealAfterAnswer: ['dip'],
      equations: [BETA_ANGLE, DIP_THRUST],
      prompt: 'How steep are the thrust faults, compared with the normal faults in step 3?',
      choices: [
        { id: 'thirty', label: 'About 30°: shallower', correct: true, feedback: 'Right. δ = β ≈ 29.5° for μ = 0.6: the same Coulomb angle, measured from a horizontal σ1 instead of a vertical one.' },
        { id: 'sixty', label: 'About 60°: the same', correct: false, feedback: 'The Mohr diagram is the same, but β is measured from σ1, which is now horizontal. The dip equals β, not 90° − β.' },
        { id: 'forty-five', label: 'About 45°', correct: false, feedback: '45° would need zero friction. With μ > 0 the fault turns toward σ1, which here is horizontal, so it gets shallower than 45°.' },
      ],
    },
    {
      id: 'strike-slip-regime',
      label: 'σ2 vertical: strike-slip',
      title: 'σ2 vertical: vertical strike-slip faults',
      activeLabel: 'Strike-slip regime',
      body: `With ${I.s2} vertical, ${I.s1} and ${I.s3} are both horizontal. The faults still contain ${I.s2}, so they are vertical. Seen from above, each one lies ${I.beta} from ${I.s1}, one on each side of it. The pair meets at an acute angle ${I.twoBeta} that ${I.s1} bisects. Slip is horizontal, along the strike. One fault of the pair is right-lateral (dextral) and the other is left-lateral (sinistral).`,
      task: 'Orbit to look down on the block from above. Predict, then press Slip.',
      visualKind: 'anderson',
      controls: ['slip'],
      labOptions: WITH_MOHR,
      initialLabState: { regime: 'strike-slip', mu: 0.6 },
      equations: [
        BETA_ANGLE,
        {
          id: 'strikes',
          html: math(DIP, EQ, deg(90)) + math(mtext('strike'), EQ, mtext('trend of'), '<mspace width="0.3em"></mspace>', S1, mo('±'), BETA) + math(EQ, live('strikes', 'fault')),
          symbols: [SYMBOL.dip, SYMBOL.s1, SYMBOL.beta],
        },
      ],
      prompt: 'The solid fault strikes about 030°, clockwise from σ1. Standing on one side of it, which way does the far side move?',
      choices: [
        { id: 'sinistral', label: 'To the left: sinistral', correct: true, feedback: 'Right. σ1 drives the blocks in the acute angles together, and the blocks in the obtuse angles move out sideways. The fault clockwise of σ1 is sinistral; its conjugate at about 330° is dextral.' },
        { id: 'dextral', label: 'To the right: dextral', correct: false, feedback: 'That is the conjugate, at about 330°. Press Slip and follow the green arrows: on the 030° fault the far block moves to your left.' },
        { id: 'down-dip', label: 'Down the dip', correct: false, feedback: 'The faults are vertical and contain the vertical σ2, so there is no up-or-down slip. The motion is horizontal.' },
      ],
    },
    {
      id: 'vary-friction',
      label: 'Change the friction',
      title: 'Friction sets the angles',
      activeLabel: 'Friction and fault dip',
      body: `Every step so far used ${I.mu} = 0.6, typical of rock. Drag ${I.mu} and watch the Coulomb line tilt. As ${I.phi} grows, the contact point moves around the circle and ${I.beta} shrinks: the fault turns toward ${I.s1}. Switch regimes to see what that does to each dip. With no friction (${I.mu} = 0), the fault would lie on the plane of maximum shear stress, 45° from ${I.s1}, in every regime.`,
      task: `Try ${I.mu} = 0.2, 0.6, and 1.0 in the normal and thrust regimes.`,
      visualKind: 'anderson',
      controls: ['regime', 'mu', 'slip'],
      labOptions: WITH_MOHR,
      initialLabState: { regime: 'normal', mu: 0.6 },
      equations: [FRICTION, BETA_ANGLE, DIP_BOTH],
      prompt: `As ${I.mu} increases from 0.6 toward 1, what happens to the predicted dips?`,
      choices: [
        { id: 'opposite', label: 'Normal faults steepen, thrusts flatten', correct: true, feedback: 'Right. Higher friction makes β smaller. δ = 90° − β grows for normal faults and δ = β shrinks for thrusts: both turn toward σ1.' },
        { id: 'both-steepen', label: 'Both get steeper', correct: false, feedback: 'Drag μ in the thrust regime and watch δ: it follows β, which shrinks as friction grows.' },
        { id: 'fixed', label: 'Neither changes', correct: false, feedback: '60° and 30° belong to μ ≈ 0.6. β = 45° − φ/2 depends on friction, so the dips do too.' },
      ],
    },
    {
      id: 'limits',
      label: 'Limits of the theory',
      title: 'When real faults disagree with Anderson',
      activeLabel: 'Assumptions and limits',
      body: `Anderson’s predictions rest on three assumptions: a new fault breaks intact rock that is equally strong in every direction; the ground is flat and horizontal, so one principal stress is vertical; and slip is small, so the fault keeps the orientation it formed with. Real faults often break these. Rock already contains weak planes such as bedding and older faults, and a weak plane at the “wrong” angle can slip before a new fault forms (B6). Normal faults in rifts rotate like tilting dominoes as they slip, so their dips decrease. Steep topography and layers of different stiffness tilt the stress axes away from vertical.`,
      task: 'Keep the normal regime and think about what could make a real fault shallower than the prediction.',
      visualKind: 'anderson',
      controls: ['regime', 'mu', 'slip'],
      labOptions: WITH_MOHR,
      initialLabState: { regime: 'normal', mu: 0.6 },
      equations: [DIP_NORMAL],
      prompt: 'A rift contains many normal faults dipping 35–45°, much shallower than the predicted 60°. What is the best explanation?',
      choices: [
        { id: 'rotated', label: 'They rotated during slip, or reused older weak planes', correct: true, feedback: 'Right. Anderson predicts the angle at which a fault forms in intact rock. Rotation after formation, and reactivation of weaker planes, both break that assumption.' },
        { id: 'horizontal-s1', label: 'σ1 was horizontal when they formed', correct: false, feedback: 'With σ1 horizontal the faults would be thrusts or strike-slip faults, not normal faults.' },
        { id: 'high-friction', label: 'Friction was very high', correct: false, feedback: 'Higher friction makes normal faults steeper, not shallower (step 6).' },
      ],
    },
    {
      id: 'infer-regime',
      label: 'Read the stress',
      title: 'Read the stress from the faults',
      activeLabel: 'From faults back to stress',
      body: `In the field the reasoning runs backward: you map the faults and their slip, then infer the stress. The line where the conjugate faults intersect is ${I.s2}, ${I.s1} bisects the acute angle ${I.twoBeta} between the faults, and ${I.s3} bisects the obtuse angle. The stress arrows are hidden until you answer.`,
      task: 'Orbit the block and press Slip to see the sense of motion.',
      visualKind: 'anderson',
      controls: ['slip'],
      labOptions: { showMohr: false, showAxes: true, axesAfterAnswer: true, showFaults: true, showConjugate: true, showAngles: false, showSlip: true },
      initialLabState: { regime: 'thrust', mu: 0.6 },
      equations: [
        {
          id: 'read-stress',
          html: math(S2, mo('∥'), mtext('intersection line')) + math(mtext('acute angle'), EQ, mn('2'), BETA, EQ, live('acute', 'beta')),
          symbols: [SYMBOL.s2, SYMBOL.beta],
        },
      ],
      prompt: 'This conjugate pair strikes east–west and dips about 30° north and south, with reverse slip. Which stress state formed it?',
      choices: [
        { id: 's3-vertical-ns', label: 'σ3 vertical, σ1 north–south', correct: true, feedback: 'Right. Gentle dips with reverse slip mean σ3 is vertical. σ1 bisects the acute angle between the faults, so it is horizontal and perpendicular to their strike: north–south.' },
        { id: 's3-vertical-ew', label: 'σ3 vertical, σ1 east–west', correct: false, feedback: 'The faults intersect along an east–west line, and that line is σ2. σ1 is perpendicular to it: north–south.' },
        { id: 's1-vertical', label: 'σ1 vertical', correct: false, feedback: 'A vertical σ1 gives steep normal faults. These dip gently with reverse slip.' },
        { id: 's2-vertical', label: 'σ2 vertical', correct: false, feedback: 'A vertical σ2 gives vertical strike-slip faults. These dip about 30°.' },
      ],
    },
    {
      id: 'tectonic-settings',
      label: 'Tectonic settings',
      title: 'Where each regime shows up',
      activeLabel: 'Stress regimes and tectonics',
      body: 'Each regime matches a tectonic setting. Where the crust is stretched, the vertical load is the largest stress and normal faults form: continental rifts and the Basin and Range. Where the crust is shortened, σ1 is horizontal and σ3 vertical: fold–thrust belts. Where blocks slide past each other, σ2 is vertical: transform and wrench zones. Real mountain belts often mix regimes, with thrusting in one place and strike-slip or normal faulting nearby or at another time. Oblique combinations are called transpression and transtension.',
      task: 'Choose a setting. The block switches to its stress regime.',
      visualKind: 'anderson',
      controls: ['setting', 'mu', 'slip'],
      labOptions: WITH_MOHR,
      initialLabState: { regime: 'normal', mu: 0.6, setting: 'rift' },
      settings: SETTINGS,
      equations: [VERTICAL_RULE],
      final: true,
    },
  ],
};
