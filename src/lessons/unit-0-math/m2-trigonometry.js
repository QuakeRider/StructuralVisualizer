// M2 — Trigonometry of projection. Spec: docs/curriculum/unit-0-math.md (M2).
// Frame: abstract right-handed x, y, z with z drawn up (as in M1). Angles in
// degrees. Equations are MathML built with ../mathml.js.

import { fromPolar } from '../../domain/vector.js';
import { abs, bound, frac, hat, inline, list, live, math, mi, mn, mo, mtext, paren, primed, row, sqrt, sub, sup, vec } from '../mathml.js';

// Bound symbols: each maps to one object in the vector laboratory.
const V = bound('vector', vec('v'));
const ABSV = bound('vector', abs(vec('v')));
const VHAT_UNIT = bound('vector', hat(vec('v')));
const VHAT = bound('unit-vector', hat(vec('v')));
const VX = bound('comp-x', sub(mi('v'), mi('x')));
const VY = bound('comp-y', sub(mi('v'), mi('y')));
const VZ = bound('comp-z', sub(mi('v'), mi('z')));
const VXP = bound('comp-x-prime', primed('v', 'x'));
const VYP = bound('comp-y-prime', primed('v', 'y'));
const ALPHA = bound('angle-alpha', mi('α'));
const BETA = bound('angle-beta', mi('β'));
const GAMMA = bound('angle-gamma', mi('γ'));
const THETA = bound('angle-theta', mi('θ'));
const EPS = bound('elevation-angle', mi('ε'));
const D = bound('xy-diagonal', mi('d'));
const COS2 = bound('curve-cos2', row(sup(mi('cos'), mn('2')), mi('θ')));
const SINCOS = bound('curve-sincos', row(mi('sin'), mi('θ'), mi('cos'), mi('θ')));
const EQ = mo('=');
const PLUS = mo('+');
const cos = (angle) => row(mi('cos'), angle);
const sin = (angle) => row(mi('sin'), angle);
const squareOf = (symbol) => sup(symbol, mn('2'));
const cosSquared = (angle) => row(sup(mi('cos'), mn('2')), angle);
const HALF = frac(mn('1'), mn('2'));
const ATAN = sup(mi('tan'), row(mo('−'), mn('1')));
const note = (text) => `<small>${text}</small>`;

// Inline math for prose.
const I = {
  v: inline(vec('v')),
  absv: inline(abs(vec('v'))),
  vhat: inline(hat(vec('v'))),
  vx: inline(sub(mi('v'), mi('x'))),
  vy: inline(sub(mi('v'), mi('y'))),
  vz: inline(sub(mi('v'), mi('z'))),
  vxp: inline(primed('v', 'x')),
  vyp: inline(primed('v', 'y')),
  alpha: inline(mi('α')),
  beta: inline(mi('β')),
  gamma: inline(mi('γ')),
  theta: inline(mi('θ')),
  eps: inline(mi('ε')),
  xp: inline(mi('x′')),
  yp: inline(mi('y′')),
};

const SYMBOL = {
  v: { symbol: vec('v'), sceneRef: 'vector', description: 'White solid arrow from the origin, with a round handle at its tip' },
  absv: { symbol: abs(vec('v')), sceneRef: 'vector', description: 'Length of the white arrow' },
  vhatUnit: { symbol: hat(vec('v')), sceneRef: 'vector', description: 'The white arrow: length 1, so its tip stays on the circle' },
  vhat: { symbol: hat(vec('v')), sceneRef: 'unit-vector', description: 'Green dotted arrow of length 1 along v, ending on the unit sphere' },
  vx: { symbol: sub(mi('v'), mi('x')), sceneRef: 'comp-x', description: 'Blue solid arrow along x: the side of the triangle next to α' },
  vy: { symbol: sub(mi('v'), mi('y')), sceneRef: 'comp-y', description: 'Orange solid arrow parallel to y: the side opposite α' },
  vz: { symbol: sub(mi('v'), mi('z')), sceneRef: 'comp-z', description: 'Pink arrow parallel to z: the vertical leg' },
  vxp: { symbol: primed('v', 'x'), sceneRef: 'comp-x-prime', description: 'Blue dashed arrow along the turned axis x′' },
  vyp: { symbol: primed('v', 'y'), sceneRef: 'comp-y-prime', description: 'Orange dashed arrow parallel to the turned axis y′' },
  alpha: { symbol: mi('α'), sceneRef: 'angle-alpha', description: 'Blue arc: the angle from the +x axis to the arrow' },
  beta: { symbol: mi('β'), sceneRef: 'angle-beta', description: 'Orange arc: the angle from the +y axis to the arrow' },
  gamma: { symbol: mi('γ'), sceneRef: 'angle-gamma', description: 'Pink arc: the angle from the +z axis to the arrow' },
  theta: { symbol: mi('θ'), sceneRef: 'angle-theta', description: 'Green arc: how far the dashed axes x′, y′ are turned from x, y' },
  eps: { symbol: mi('ε'), sceneRef: 'elevation-angle', description: 'Violet arc: the angle between the floor and the arrow' },
  d: { symbol: mi('d'), sceneRef: 'xy-diagonal', description: 'Gray dashed line on the floor: the arrow’s shadow' },
  cos2: { symbol: row(sup(mi('cos'), mn('2')), mi('θ')), sceneRef: 'curve-cos2', description: 'Blue solid curve in the plot' },
  sincos: { symbol: row(mi('sin'), mi('θ'), mi('cos'), mi('θ')), sceneRef: 'curve-sincos', description: 'Pink dashed curve in the plot' },
};

const ROTATE_X = {
  id: 'rotate-x',
  html: math(VXP, EQ, VX, cos(THETA), PLUS, VY, sin(THETA)) + math(EQ, live('vxpSub', 'comp-x-prime')) + math(EQ, live('vxp', 'comp-x-prime')),
  symbols: [SYMBOL.vxp, SYMBOL.vx, SYMBOL.vy, SYMBOL.theta],
};

const ROTATE_Y = {
  id: 'rotate-y',
  html: math(VYP, EQ, mo('−'), VX, sin(THETA), PLUS, VY, cos(THETA)) + math(EQ, live('vypSub', 'comp-y-prime')) + math(EQ, live('vyp', 'comp-y-prime')),
  symbols: [SYMBOL.vyp],
};

const SINGLE = { layout: 'single', showComponents: true, draggable: ['v'] };
const ROTATION = { layout: 'single', showComponents: true, draggable: [], rotatedAxes: true, showPrimedComponents: true };

/** Geology previews for the last step. Each sets the vector and what the scene shows. */
const CONTEXTS = Object.freeze([
  { id: 'line-plunge', label: 'A line and how steeply it plunges', usedIn: 'O1', vector: { x: 3, y: 2, z: 2.5 }, dimension: 3, options: { showTriangles: true, showElevation: true } },
  { id: 'tilted-plane', label: 'A plane tilted inside a rock', usedIn: 'S5', vector: { x: 3, y: 3.5, z: 0 }, dimension: 2, theta: 30, options: { showComponents: false, rotatedAxes: true, showPrimedComponents: true, planeTrace: true } },
]);

export default {
  id: 'M2',
  status: 'built',
  steps: [
    {
      id: 'unit-circle',
      label: 'The unit circle',
      title: 'A unit vector’s components are its cosine and sine',
      activeLabel: 'The unit circle',
      body: `The white arrow has length 1 and makes an angle ${I.alpha} with the +x axis, measured counterclockwise. Its tip always lies on the circle of radius 1. The arrow and its two components form a right triangle whose longest side is 1. By the definitions of cosine and sine, the side along x is cos ${I.alpha} and the side along y is sin ${I.alpha}. So the components of a unit vector are simply (cos ${I.alpha}, sin ${I.alpha}).`,
      task: 'Drag the tip around the circle, or use the angle slider. Watch the signs of the components change from quadrant to quadrant.',
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['angle'],
      labOptions: { ...SINGLE, polar: true, fixedLength: 1, showAngle: true, showUnitCircle: true, view: 'close' },
      initialLabState: { v: fromPolar(1, 40) },
      equations: [
        {
          id: 'unit-components',
          html: math(VHAT_UNIT, EQ, paren(list(VX, VY)), EQ, paren(list(cos(ALPHA), sin(ALPHA)))) + math(EQ, live('v', 'vector')) + math(ALPHA, EQ, live('alpha', 'angle-alpha')),
          symbols: [SYMBOL.vhatUnit, SYMBOL.vx, SYMBOL.vy, SYMBOL.alpha],
        },
        {
          id: 'unit-pythagoras',
          html: math(cosSquared(ALPHA), PLUS, row(sup(mi('sin'), mn('2')), ALPHA), EQ, mn('1')) + math(live('vx2', 'comp-x'), PLUS, live('vy2', 'comp-y'), EQ, live('sumSquares', 'vector'))
            + note('Pythagoras on a triangle whose longest side is 1.'),
          symbols: [],
        },
      ],
      prompt: `Drag the tip to ${I.alpha} = 120°. Which component is negative?`,
      choices: [
        { id: 'vx', label: `${I.vx}`, correct: true, feedback: 'Right: cos 120° = −0.5. Past 90° the tip is left of the y axis, so the x component is negative, while sin 120° ≈ 0.87 is still positive.' },
        { id: 'vy', label: `${I.vy}`, correct: false, feedback: 'sin α stays positive from 0° to 180°, because the tip is above the x axis. Drag to 120° and look at the blue arrow.' },
        { id: 'both', label: 'Both', correct: false, feedback: 'Both are negative only in the third quadrant, from 180° to 270°. At 120° the tip is up and to the left.' },
      ],
    },
    {
      id: 'length-and-angle',
      label: 'Length and angle',
      title: 'Components from a length and an angle',
      activeLabel: 'Components from length and angle',
      body: `A vector of any length is a unit vector stretched by that length, so both components stretch too: ${I.vx} = ${I.absv} cos ${I.alpha} and ${I.vy} = ${I.absv} sin ${I.alpha}. This is the step you take whenever a measurement gives a size and a direction, such as a force of 5 kN pushing 30° above the horizontal. Set your calculator to degrees: cos 30 in radians is a completely different number.`,
      task: 'Answer the question first. Then change the length and the angle and watch both components follow.',
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['length', 'angle'],
      labOptions: { ...SINGLE, polar: true, showAngle: true },
      initialLabState: { v: fromPolar(5, 30) },
      revealAfterAnswer: ['vx', 'vy'],
      equations: [
        {
          id: 'polar-x',
          html: math(VX, EQ, ABSV, cos(ALPHA), EQ, live('vxSub', 'comp-x'), EQ, live('vx', 'comp-x')),
          symbols: [SYMBOL.vx, SYMBOL.absv, SYMBOL.alpha],
        },
        {
          id: 'polar-y',
          html: math(VY, EQ, ABSV, sin(ALPHA), EQ, live('vySub', 'comp-y'), EQ, live('vy', 'comp-y')),
          symbols: [SYMBOL.vy],
        },
      ],
      prompt: `A vector has length 5 and points 30° above the +x axis. What is ${I.vx}?`,
      answer: {
        value: 4.33,
        tolerance: 0.02,
        correctFeedback: 'Correct: 5 cos 30° = 5 × 0.866 ≈ 4.33. The x component goes with cosine because it is the side next to the angle.',
        wrong: [
          { value: 2.5, feedback: 'That is 5 sin 30°, the y component. The x component is the side next to the angle, so it goes with cosine.' },
          { value: 0.87, tolerance: 0.01, feedback: '0.866 is cos 30° by itself. Multiply by the length: vx = 5 × 0.866.' },
          { value: 0.77, tolerance: 0.01, feedback: 'Your calculator is in radians: 5 cos(30 radians) ≈ 0.77. Switch it to degrees.' },
          { value: 5, feedback: '5 is the whole length. Only a vector lying along the x axis has vx = |v|.' },
        ],
        fallbackFeedback: 'Use vx = |v| cos α with |v| = 5 and α = 30°, with the calculator in degrees.',
      },
    },
    {
      id: 'angle-from-components',
      label: 'Back to the angle',
      title: 'From components back to the angle: check the quadrant',
      activeLabel: 'The angle from components',
      body: `Going backward, tan ${I.alpha} = ${I.vy}/${I.vx}. But the ratio cannot tell opposite directions apart: (3, 3) and (−3, −3) give the same ratio. A calculator’s tan⁻¹ key always answers between −90° and 90°, so for any vector pointing left (${I.vx} < 0) it is off by 180°. The fix is to look at the signs of the components: if ${I.vx} is negative, add 180°; if the result is still negative, add 360°. Programs do this in one step with a function called atan2.`,
      task: 'Predict the angle first. Then drag the tip into each quadrant and compare the calculator’s answer with the true angle.',
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['components'],
      labOptions: { ...SINGLE, showAngle: true },
      initialLabState: { v: { x: -3, y: 3, z: 0 } },
      revealAfterAnswer: ['atanNaive', 'alpha'],
      equations: [
        {
          id: 'tan-ratio',
          html: math(mi('tan'), ALPHA, EQ, frac(VY, VX), EQ, live('tanRatio', 'vector')),
          symbols: [SYMBOL.alpha, SYMBOL.vx, SYMBOL.vy],
        },
        {
          id: 'quadrant',
          html: math(ATAN, paren(frac(VY, VX)), EQ, live('atanNaive')) + note('What the calculator’s tan⁻¹ key returns.')
            + math(ALPHA, EQ, live('alpha', 'angle-alpha')) + note('The true angle, found with the quadrant (atan2).'),
          symbols: [],
        },
      ],
      prompt: `What is ${I.alpha} for ${I.v} = (−3, 3), measured counterclockwise from +x? (degrees)`,
      answer: {
        value: 135,
        tolerance: 1,
        correctFeedback: 'Correct. tan⁻¹(3/−3) gives −45°, but the vector points up and to the left, into the second quadrant, so α = −45° + 180° = 135°.',
        wrong: [
          { value: -45, feedback: '−45° is what tan⁻¹(3/−3) returns, but that direction points down and to the right. This vector points up and to the left: add 180°.' },
          { value: 45, feedback: '45° points up and to the right, the direction of (3, 3). Here vx is negative, so the vector points left.' },
          { value: 315, feedback: '315° is the same direction as −45°: down and to the right. That is (3, −3).' },
          { value: 225, feedback: '225° points down and to the left, the direction of (−3, −3). Here vy is positive.' },
        ],
        fallbackFeedback: 'Find tan⁻¹(vy/vx), then use the signs of vx and vy to put the angle in the right quadrant.',
      },
    },
    {
      id: 'direction-angles-3d',
      label: 'Direction angles in 3D',
      title: 'In 3D: one angle to each axis',
      activeLabel: 'Direction angles and cosines',
      body: `In 3D a single angle is not enough. Instead, measure the angle from the vector to each axis: ${I.alpha} to x, ${I.beta} to y, and ${I.gamma} to z. These are the direction angles. The same right-triangle reasoning gives ${I.vx} = ${I.absv} cos ${I.alpha}, ${I.vy} = ${I.absv} cos ${I.beta}, and ${I.vz} = ${I.absv} cos ${I.gamma}. Divide by ${I.absv}: the direction cosines are exactly the components of the unit vector ${I.vhat}. Because ${I.vhat} has length 1, their squares add to 1. In the flat x–y plane, ${I.beta} = 90° − ${I.alpha}, so cos ${I.beta} = sin ${I.alpha}: the 2D formulas are a special case.`,
      task: 'Drag the tip (Shift + drag moves it up or down). The three cosines change, but the sum of their squares stays 1.',
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['components'],
      labOptions: { ...SINGLE, showDirectionAngles: true, showUnit: true },
      initialLabState: { v: { x: 2, y: 3, z: 6 } },
      equations: [
        {
          id: 'direction-cosines',
          html: math(VHAT, EQ, frac(V, ABSV), EQ, paren(list(cos(ALPHA), cos(BETA), cos(GAMMA)))) + math(EQ, live('unit', 'unit-vector'))
            + math(paren(list(ALPHA, BETA, GAMMA)), EQ, live('directionAngles')),
          symbols: [SYMBOL.vhat, SYMBOL.alpha, SYMBOL.beta, SYMBOL.gamma],
        },
        {
          id: 'cosine-identity',
          html: math(cosSquared(ALPHA), PLUS, cosSquared(BETA), PLUS, cosSquared(GAMMA), EQ, mn('1')) + math(live('cosSquares'), EQ, live('cosSquaresSum')),
          symbols: [],
        },
      ],
      prompt: `Point ${I.v} straight up the z axis. What are its direction angles (${I.alpha}, ${I.beta}, ${I.gamma})?`,
      choices: [
        { id: 'up', label: '(90°, 90°, 0°)', correct: true, feedback: 'Right. The vector lies along z, so it makes 0° with z and is perpendicular (90°) to x and y. The direction cosines are (0, 0, 1): the unit vector k̂.' },
        { id: 'flat', label: '(0°, 0°, 90°)', correct: false, feedback: 'A vector cannot make 0° with both x and y at once. Along z it is perpendicular to x and y, so those angles are 90°.' },
        { id: 'zeros', label: '(0°, 0°, 0°)', correct: false, feedback: 'The cosines would all be 1, and 1² + 1² + 1² = 3, not 1. A vector can lie along only one axis at a time.' },
      ],
    },
    {
      id: 'rotate-axes',
      label: 'Turn the axes',
      title: 'Turn the axes, not the vector',
      activeLabel: 'Rotating the axes',
      body: `Now keep the arrow still and turn the coordinate axes by an angle ${I.theta}. The turned axes are ${I.xp} and ${I.yp} (dashed). The arrow does not move. Only its description changes: its components in the new axes, ${I.vxp} and ${I.vyp}, are its projections onto ${I.xp} and ${I.yp}. Each new component collects a piece of both old ones, which is what the two equations say.`,
      task: `Predict first, then drag ${I.theta} to 30°.`,
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['theta'],
      labOptions: ROTATION,
      initialLabState: { v: { x: 4, y: 2, z: 0 }, theta: 0 },
      revealAfterAnswer: ['vxp', 'vyp'],
      equations: [ROTATE_X, ROTATE_Y, { id: 'theta', html: math(THETA, EQ, live('theta', 'angle-theta')), symbols: [SYMBOL.theta] }],
      prompt: `You will turn the axes 30° counterclockwise. Will ${I.vxp} be larger or smaller than ${I.vx} = 4?`,
      choices: [
        { id: 'larger', label: 'Larger', correct: true, feedback: 'Right: v′x = 4 cos 30° + 2 sin 30° ≈ 4.46. The arrow points about 27° above x, so turning x′ by 30° swings it almost onto the arrow, and more of the arrow lies along it.' },
        { id: 'smaller', label: 'Smaller', correct: false, feedback: 'Turning the axes counterclockwise moves x′ toward the arrow, which points about 27° above x. The projection onto x′ grows. Drag θ and watch the dashed blue arrow.' },
        { id: 'same', label: 'The same', correct: false, feedback: 'The arrow does not change, but its projection onto a different axis does. Only its length stays the same.' },
      ],
    },
    {
      id: 'same-arrow',
      label: 'Same arrow, new numbers',
      title: 'Same arrow, different description',
      activeLabel: 'One arrow, many descriptions',
      body: `Every choice of axes gives different components, but they all describe one arrow. Its length is the same in every frame. Turning about the z axis leaves the z component alone: ${I.vz} does not change. One frame is special: turn ${I.xp} until it lies under the arrow, and the horizontal part of the vector is a single component, ${I.vyp} = 0. Stress uses the same idea. In S5 and S8 you will turn the axes until the shear components of stress vanish, and those special axes are the principal stress directions.`,
      task: 'Reach the goal, then orbit the view: the arrow never moved.',
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['theta', 'components'],
      labOptions: ROTATION,
      initialLabState: { v: { x: 4, y: 2, z: 3 }, theta: 0 },
      goal: {
        text: `Turn the axes until ${I.vyp} = 0 with ${I.vxp} positive.`,
        check: (state) => Math.abs(state.primed.y) < 0.05 && state.primed.x > 0,
      },
      equations: [
        {
          id: 'invariant',
          html: math(ABSV, EQ, sqrt(squareOf(VX), PLUS, squareOf(VY), PLUS, squareOf(VZ))) + math(EQ, sqrt(squareOf(VXP), PLUS, squareOf(VYP), PLUS, squareOf(VZ)), EQ, live('magnitude', 'vector')),
          symbols: [SYMBOL.absv, SYMBOL.vx, SYMBOL.vy, SYMBOL.vz, SYMBOL.vxp, SYMBOL.vyp],
        },
        {
          id: 'both-frames',
          html: math(paren(list(VX, VY, VZ)), EQ, live('v', 'vector')) + math(paren(list(VXP, VYP, VZ)), EQ, live('primed')) + math(THETA, EQ, live('theta', 'angle-theta')),
          symbols: [SYMBOL.theta],
        },
      ],
    },
    {
      id: 'double-angle',
      label: 'Preview: double angles',
      title: 'A preview: squares and products of sine and cosine',
      activeLabel: 'Double-angle preview',
      body: `Project something twice and you get products such as cos²${I.theta} and sin ${I.theta} cos ${I.theta}. Stress does exactly that. In S2 a force is projected onto a tilted plane and spread over an area that grows as the plane tilts, which gives cos²${I.theta}. In S5 the shear stress on a tilted plane goes as sin ${I.theta} cos ${I.theta}. Both can be rewritten with the double angle 2${I.theta}, which is why the Mohr circle (S6) uses 2${I.theta}. You don’t need to derive these now; notice their shapes.`,
      task: `Sweep ${I.theta} from 0° to 180° and follow the dots on both curves.`,
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['theta'],
      labOptions: { ...ROTATION, showComponents: false, showUnitCircle: true, view: 'close', plot: 'double-angle' },
      initialLabState: { v: { x: 1, y: 0, z: 0 }, theta: 30 },
      equations: [
        {
          id: 'cos-squared',
          html: math(COS2, EQ, HALF, paren(mn('1'), PLUS, mi('cos'), mn('2'), mi('θ')), EQ, live('cos2', 'curve-cos2')),
          symbols: [SYMBOL.cos2],
        },
        {
          id: 'sin-cos',
          html: math(SINCOS, EQ, HALF, mi('sin'), mn('2'), mi('θ'), EQ, live('sincos', 'curve-sincos')) + math(THETA, EQ, live('theta', 'angle-theta')),
          symbols: [SYMBOL.sincos, SYMBOL.theta],
        },
      ],
      prompt: `At which angle is sin ${I.theta} cos ${I.theta} largest?`,
      choices: [
        { id: '45', label: '45°', correct: true, feedback: 'Right: ½ sin 2θ is largest when 2θ = 90°. This is why the largest shear stress acts on planes at 45° to the principal stresses (S5).' },
        { id: '90', label: '90°', correct: false, feedback: 'At 90°, cos θ = 0, so the product is 0. It peaks halfway, where 2θ = 90°.' },
        { id: '0', label: '0°', correct: false, feedback: 'At 0°, sin θ = 0, so the product is 0. It peaks at 45°, where 2θ = 90°.' },
      ],
    },
    {
      id: 'where-trig-shows-up',
      label: 'Trig in geology',
      title: 'Where this shows up in geology',
      activeLabel: 'Trigonometry in structural geology',
      body: `Field measurements are angles, and these relations turn them into vectors. A line in the field, such as a fold hinge, is recorded by its compass direction and by how steeply it plunges. Here z still points up, so its steepness is the angle ${I.eps} between the line and the floor: ${I.vz} = ${I.absv} sin ${I.eps} and its floor shadow is ${I.absv} cos ${I.eps}. O1 turns this into trend and plunge, with z pointing down. And whenever a plane is tilted inside a stressed rock (S5), the stress is described in axes turned to match the plane, with the rotation equations from step 5.`,
      task: 'Pick each example.',
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['context'],
      contexts: CONTEXTS,
      labOptions: { ...SINGLE, draggable: [] },
      initialLabState: { v: CONTEXTS[0].vector, context: CONTEXTS[0].id },
      equations: [
        {
          id: 'elevation',
          html: math(VZ, EQ, ABSV, sin(EPS), EQ, live('vzFromElevation', 'comp-z')) + math(D, EQ, ABSV, cos(EPS), EQ, live('d', 'xy-diagonal')) + math(EPS, EQ, live('elevation', 'elevation-angle')),
          symbols: [SYMBOL.vz, SYMBOL.d, SYMBOL.eps],
        },
        {
          id: 'plane-normal',
          html: math(VXP, EQ, VX, cos(THETA), PLUS, VY, sin(THETA), EQ, live('vxp', 'comp-x-prime')) + note('For the tilted plane: the part of the vector along the plane’s normal x′. The rest, v′y, lies in the plane.'),
          symbols: [SYMBOL.vxp, SYMBOL.theta],
        },
      ],
    },
  ],
};
