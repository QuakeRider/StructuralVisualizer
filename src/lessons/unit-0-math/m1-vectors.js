// M1 — Vectors and components. Spec: docs/curriculum/unit-0-math.md (M1).
// Frame: abstract right-handed x, y, z with z drawn up. The geological frame
// (north, east, down) arrives in O1. Equations are MathML built with
// ../mathml.js: vectors bold, scalars italic.

import { abs, basis, bound, column, frac, hat, inline, list, live, math, mi, mn, mo, paren, row, sqrt, sub, sup, vec } from '../mathml.js';

// Bound symbols: each maps to one object in the vector laboratory.
const V = bound('vector', vec('v'));
const VX = bound('comp-x', sub(mi('v'), mi('x')));
const VY = bound('comp-y', sub(mi('v'), mi('y')));
const VZ = bound('comp-z', sub(mi('v'), mi('z')));
const D = bound('xy-diagonal', mi('d'));
const VHAT = bound('unit-vector', hat(vec('v')));
const CV = bound('scaled-vector', row(mi('c'), vec('v')));
const A = bound('vector-a', vec('a'));
const B = bound('vector-b', vec('b'));
const SUM = bound('vector-sum', row(vec('a'), mo('+'), vec('b')));
const I = bound('axis-x', basis.i);
const J = bound('axis-y', basis.j);
const stackTerm = (axis) => bound(`stack-${axis}`, row(sub(mi('a'), mi(axis)), mo('+'), sub(mi('b'), mi(axis))));
const stackLabel = (axis) => bound(`stack-${axis}`, sub(paren(vec('a'), mo('+'), vec('b')), mi(axis)));
const EQ = mo('=');
const PLUS = mo('+');
const squareOf = (symbol) => sup(symbol, mn('2'));

// Inline math for prose.
const IV = inline(vec('v'));
const IVX = inline(sub(mi('v'), mi('x')));
const IVY = inline(sub(mi('v'), mi('y')));
const IVZ = inline(sub(mi('v'), mi('z')));
const IBX = inline(sub(mi('b'), mi('x')));
const IABSV = inline(abs(vec('v')));
const IABSV2 = inline(sup(abs(vec('v')), mn('2')));
const IVHAT = inline(hat(vec('v')));
const IA = inline(vec('a'));
const IB = inline(vec('b'));
const ISUM = inline(vec('a'), mo('+'), vec('b'));

const SYMBOL = {
  v: { symbol: vec('v'), sceneRef: 'vector', description: 'White solid arrow from the origin, with a round handle at its tip' },
  vx: { symbol: sub(mi('v'), mi('x')), sceneRef: 'comp-x', description: 'Blue arrow along x: the first leg of the component box' },
  vy: { symbol: sub(mi('v'), mi('y')), sceneRef: 'comp-y', description: 'Orange arrow parallel to y: the second leg of the component box' },
  vz: { symbol: sub(mi('v'), mi('z')), sceneRef: 'comp-z', description: 'Pink arrow parallel to z: the vertical leg of the component box' },
  i: { symbol: basis.i, sceneRef: 'axis-x', description: 'One unit step along the blue x axis' },
  j: { symbol: basis.j, sceneRef: 'axis-y', description: 'One unit step along the orange y axis' },
  d: { symbol: mi('d'), sceneRef: 'xy-diagonal', description: 'Gray dashed line on the floor, from the origin to the point under the tip' },
  unit: { symbol: hat(vec('v')), sceneRef: 'unit-vector', description: 'Green dotted arrow ending on the ring (sphere) of radius 1' },
  scaled: { symbol: row(mi('c'), vec('v')), sceneRef: 'scaled-vector', description: 'Green dotted arrow along the same line as v' },
  a: { symbol: vec('a'), sceneRef: 'vector-a', description: 'White solid arrow from the origin' },
  b: { symbol: vec('b'), sceneRef: 'vector-b', description: 'Yellow dashed arrow that starts at the tip of a' },
  sum: { symbol: row(vec('a'), mo('+'), vec('b')), sceneRef: 'vector-sum', description: 'Green dotted arrow from the origin to the tip of b' },
  stackX: { symbol: row(sub(mi('a'), mi('x')), mo('+'), sub(mi('b'), mi('x'))), sceneRef: 'stack-x', description: 'Bars on the x axis: a’s part (solid), then b’s part (dashed)' },
  stackY: { symbol: row(sub(mi('a'), mi('y')), mo('+'), sub(mi('b'), mi('y'))), sceneRef: 'stack-y', description: 'Bars on the y axis: a’s part (solid), then b’s part (dashed)' },
  stackZ: { symbol: row(sub(mi('a'), mi('z')), mo('+'), sub(mi('b'), mi('z'))), sceneRef: 'stack-z', description: 'Bars on the z axis: a’s part (solid), then b’s part (dashed)' },
};

const MAGNITUDE_3D = {
  id: 'magnitude-3d',
  html: math(abs(V), EQ, sqrt(squareOf(VX), PLUS, squareOf(VY), PLUS, squareOf(VZ)))
    + math(EQ, sqrt(live('vx2', 'comp-x'), PLUS, live('vy2', 'comp-y'), PLUS, live('vz2', 'comp-z')), EQ, live('magnitude', 'vector')),
  symbols: [SYMBOL.v, SYMBOL.vx, SYMBOL.vy, SYMBOL.vz],
};

const COMPONENTS_3D = {
  id: 'components-3d',
  html: math(V, EQ, paren(list(VX, VY, VZ))) + math(EQ, live('v', 'vector')),
  symbols: [SYMBOL.v, SYMBOL.vx, SYMBOL.vy, SYMBOL.vz],
};

const SUM_LIVE = {
  id: 'sum-live',
  html: ['x', 'y', 'z'].map((axis) => math(stackLabel(axis), EQ, live(`stack${axis.toUpperCase()}`, `stack-${axis}`))).join('')
    + math(A, PLUS, B, EQ, live('sum', 'vector-sum')),
  symbols: [SYMBOL.a, SYMBOL.b, SYMBOL.stackX, SYMBOL.stackY, SYMBOL.stackZ],
};

/** Vectors used by the geology-context buttons in the last step. */
const CONTEXTS = Object.freeze([
  { id: 'rock-face', label: 'Force on a rock face', usedIn: 'S1', vector: { x: 0.5, y: 1, z: -3 } },
  { id: 'fault', label: 'Fault slip', usedIn: 'B8', vector: { x: 2, y: -2, z: -2.5 } },
  { id: 'fold-hinge', label: 'Fold hinge', usedIn: 'O1', vector: { x: 4, y: 2.5, z: -1.5 } },
]);

const SINGLE = { layout: 'single', showComponents: true, draggable: ['v'] };

export default {
  id: 'M1',
  status: 'built',
  steps: [
    {
      id: 'drag-in-2d',
      label: 'A vector in 2D',
      title: 'A vector is an arrow you can describe with numbers',
      activeLabel: 'Vectors in the x–y plane',
      body: 'The white arrow starts at the origin and ends at its tip. Its components say how far the tip is along x and along y: walk along the blue arrow, then the orange one, and you arrive at the same tip. The components are not extra arrows pushing on anything. They are two numbers that describe the one arrow v in this frame.',
      task: `Drag the round handle at the tip. Watch ${IVX} and ${IVY} change in the scene and in the equation at the same time.`,
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['components'],
      labOptions: SINGLE,
      initialLabState: { v: { x: 3, y: 2, z: 0 } },
      equations: [
        {
          id: 'components-2d',
          html: math(V, EQ, paren(list(VX, VY)), EQ, live('v', 'vector')),
          symbols: [SYMBOL.v, SYMBOL.vx, SYMBOL.vy] },
        {
          id: 'basis-2d',
          html: math(V, EQ, VX, I, PLUS, VY, J, EQ, live('basisForm', 'vector')) + `<small>${inline(basis.i)} and ${inline(basis.j)} are one-unit steps along x and y. The components say how many steps of each.</small>`,
          symbols: [SYMBOL.i, SYMBOL.j],
        },
      ],
      prompt: `You drag the tip straight up the screen, parallel to the y axis. What happens to ${IVX}?`,
      choices: [
        { id: 'same', label: `${IVX} stays the same`, correct: true, feedback: `Right. Moving parallel to y changes only ${IVY}. Each component follows motion along its own axis.` },
        { id: 'grows', label: `${IVX} grows`, correct: false, feedback: `Try it: while you drag straight up, the blue arrow keeps its length. Only motion along x changes ${IVX}.` },
        { id: 'zero', label: `${IVX} becomes zero`, correct: false, feedback: `${IVX} is zero only when the tip sits on the y axis. Moving parallel to y keeps the tip at the same x.` },
      ],
    },
    {
      id: 'magnitude-2d',
      label: 'Length in 2D',
      title: 'The length of a vector comes from a right triangle',
      activeLabel: 'Magnitude from components',
      body: `The two components meet at a right angle (the small square marker), so the vector is the long side of a right triangle. Pythagoras gives its length, called the magnitude ${IABSV}. The magnitude is always positive, whatever the signs of the components.`,
      task: `Work out ${IABSV} for ${IV} = (3, −4) before the scene shows it.`,
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['components'],
      labOptions: { ...SINGLE, showTriangles: true },
      initialLabState: { v: { x: 3, y: -4, z: 0 } },
      revealAfterAnswer: ['magnitude'],
      equations: [
        {
          id: 'magnitude-2d',
          html: math(abs(V), EQ, sqrt(squareOf(VX), PLUS, squareOf(VY))) + math(EQ, sqrt(live('vx2', 'comp-x'), PLUS, live('vy2', 'comp-y')), EQ, live('magnitude', 'vector')),
          symbols: [SYMBOL.v, SYMBOL.vx, SYMBOL.vy],
        },
      ],
      prompt: `What is ${IABSV} for ${IV} = (3, −4)?`,
      answer: {
        value: 5,
        tolerance: 0.01,
        correctFeedback: 'Correct: √(3² + (−4)²) = √(9 + 16) = √25 = 5. Squaring removes the sign, so direction never makes a vector shorter.',
        wrong: [
          { value: 7, feedback: 'That adds the sizes 3 + 4. The components are at right angles, so they combine by Pythagoras, not by adding.' },
          { value: -1, feedback: '3 + (−4) adds the signed components. A length is never negative: square each component first.' },
          { value: 1, feedback: 'Adding or subtracting components does not give the length. Square each one, add, then take the square root.' },
          { value: 25, feedback: `25 is ${IABSV2}, the sum of the squares. Take the square root.` },
        ],
        fallbackFeedback: 'Square each component, add the squares, then take the square root: √(3² + (−4)²).',
      },
    },
    {
      id: 'jump-to-3d',
      label: 'Jump to 3D',
      title: 'In 3D the length takes two right triangles',
      activeLabel: 'Adding the z axis',
      body: `Add a third axis, z, pointing up out of the x–y plane. The tip now also has a height, ${IVZ}. Its length takes two right triangles. The first lies on the floor, from the origin to the point under the tip; its long side is d. The second stands on d and climbs straight up by ${IVZ}. Put them together and the 2D formula gains one more term.`,
      task: `Press 3D to lift the vector off the page, and orbit to see both triangles. Then find ${IABSV} for ${IV} = (2, 3, 6).`,
      visualKind: 'vector-lab',
      dimension: 2,
      controls: ['dimension', 'components'],
      labOptions: { ...SINGLE, showTriangles: true },
      initialLabState: { v: { x: 2, y: 3, z: 6 } },
      revealAfterAnswer: ['magnitude'],
      equations: [
        {
          id: 'floor-diagonal',
          html: math(squareOf(D), EQ, squareOf(VX), PLUS, squareOf(VY), EQ, live('dSquared', 'xy-diagonal')),
          symbols: [SYMBOL.d, SYMBOL.vx, SYMBOL.vy],
        },
        {
          id: 'stacked-triangles',
          html: math(squareOf(abs(V)), EQ, squareOf(D), PLUS, squareOf(VZ)) + math(EQ, squareOf(VX), PLUS, squareOf(VY), PLUS, squareOf(VZ)),
          symbols: [SYMBOL.v, SYMBOL.d, SYMBOL.vz],
        },
        MAGNITUDE_3D,
      ],
      prompt: `What is ${IABSV} for ${IV} = (2, 3, 6)?`,
      answer: {
        value: 7,
        tolerance: 0.01,
        correctFeedback: `Correct: d² = 4 + 9 = 13, then ${IABSV2} = 13 + 36 = 49, so ${IABSV} = 7. The same rule works in 2D and 3D; 3D just has one more square.`,
        wrong: [
          { value: 11, feedback: 'That adds the components 2 + 3 + 6. Use Pythagoras twice: square, add, square root.' },
          { value: Math.sqrt(13), tolerance: 0.02, feedback: `That is d, the floor diagonal: you have the first triangle. Now climb ${IVZ} = 6 with the second one.` },
          { value: 49, feedback: `49 is ${IABSV2}. Take the square root.` },
        ],
        fallbackFeedback: `First the floor: d² = 2² + 3². Then climb: ${IABSV2} = d² + 6². Take the square root at the end.`,
      },
    },
    {
      id: 'negative-components',
      label: 'Negative components',
      title: 'A sign gives a direction, not a size',
      activeLabel: 'Reading signs from the picture',
      body: 'A negative component means the tip lies on the negative side of that axis, where the axis is drawn dashed. For z, negative means below the floor. In the magnitude every component is squared, so a sign never makes a vector shorter.',
      task: 'Point the vector toward −x, +y, and −z. A plain drag moves the tip across the floor. Hold Shift while dragging to move it up or down, or type the components.',
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['components'],
      labOptions: SINGLE,
      initialLabState: { v: { x: 3, y: 2, z: 4 } },
      goal: {
        text: 'v points toward −x, +y, and −z (every component nonzero).',
        check: ({ v: vector }) => vector.x < 0 && vector.y > 0 && vector.z < 0,
      },
      equations: [COMPONENTS_3D, MAGNITUDE_3D],
      prompt: 'Which vector is longer: p = (−4, 0, 0) or q = (3, 0, 0)?',
      choices: [
        { id: 'p', label: 'p is longer', correct: true, feedback: 'Right. |p| = 4 and |q| = 3. The minus sign says only that p points along −x.' },
        { id: 'q', label: 'q is longer', correct: false, feedback: 'A negative component is not a small one. |p| = √((−4)²) = 4, which is more than 3.' },
        { id: 'same', label: 'They are the same length', correct: false, feedback: 'Their lengths are 4 and 3. Signs change the direction, not the length.' },
      ],
    },
    {
      id: 'unit-vector',
      label: 'Unit vectors',
      title: 'A unit vector keeps only the direction',
      activeLabel: 'Unit vector v̂ = v / |v|',
      body: `Divide a vector by its own length and you get a vector of length 1 that points the same way: the unit vector ${IVHAT} (read "v hat"). Its tip always lands on the sphere of radius 1 around the origin. Structural geology uses unit vectors for pure directions such as plane normals, lineations, and fold hinges, where only the direction matters.`,
      task: `Drag ${IV} anywhere. ${IVHAT} follows its direction but never leaves the unit sphere.`,
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['components'],
      labOptions: { ...SINGLE, showUnit: true, view: 'close' },
      initialLabState: { v: { x: 2, y: -1, z: 2 } },
      equations: [
        {
          id: 'unit-definition',
          html: math(VHAT, EQ, frac(V, abs(V)), EQ, frac(paren(list(VX, VY, VZ)), live('magnitude', 'vector'))) + math(EQ, live('unit', 'unit-vector')),
          symbols: [SYMBOL.unit, SYMBOL.v, SYMBOL.vx, SYMBOL.vy, SYMBOL.vz],
        },
        {
          id: 'unit-length',
          html: math(abs(VHAT), EQ, live('unitMagnitude', 'unit-vector')),
          symbols: [SYMBOL.unit],
        },
      ],
      prompt: 'Which of these could be a unit vector?',
      choices: [
        { id: 'ones', label: '(1, 1, 0)', correct: false, feedback: 'Its length is √(1 + 1) = √2 ≈ 1.41, not 1.' },
        { id: 'six-eight', label: '(0.6, 0, −0.8)', correct: true, feedback: 'Right. 0.6² + 0² + (−0.8)² = 0.36 + 0.64 = 1. Each component of a unit vector lies between −1 and 1, and their squares add to exactly 1.' },
        { id: 'halves', label: '(0.5, 0.5, 0.5)', correct: false, feedback: 'Its length is √0.75 ≈ 0.87. Small components are not enough: the squares must add to exactly 1.' },
      ],
    },
    {
      id: 'add-vectors',
      label: 'Adding vectors',
      title: 'Add vectors tip to tail, or component by component',
      activeLabel: 'Vector addition',
      body: `To add b to a, start b where a ends. The sum ${ISUM} runs from the origin to the final tip. Now look along the axes: on each one, a’s part (solid bar) and b’s part (dashed bar) stack end to end, and the green dot marks their total. The two constructions always land on the same tip, because adding arrows tip to tail is the same as adding their matching components.`,
      task: `Predict ${ISUM}, then drag either round handle and check that each stack ends at a corner of the sum’s dashed box.`,
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['components-a', 'components-b'],
      labOptions: { layout: 'sum', showComponents: false, showStacks: true, draggable: ['v', 'b'] },
      initialLabState: { v: { x: 4, y: 1, z: 1 }, b: { x: -1, y: 3, z: 2 } },
      revealAfterAnswer: ['sum', 'stackX', 'stackY', 'stackZ'],
      equations: [
        {
          id: 'sum-components',
          html: math(SUM, EQ, column(stackTerm('x'), stackTerm('y'), stackTerm('z'))),
          symbols: [SYMBOL.sum, SYMBOL.stackX, SYMBOL.stackY, SYMBOL.stackZ],
        },
        { ...SUM_LIVE, symbols: [SYMBOL.a, SYMBOL.b] },
      ],
      prompt: `a = (4, 1, 1) and b = (−1, 3, 2). What is ${ISUM}?`,
      choices: [
        { id: 'right', label: '(3, 4, 3)', correct: true, feedback: 'Right: (4 + (−1), 1 + 3, 1 + 2) = (3, 4, 3). Check it against the stacks on each axis.' },
        { id: 'sign', label: '(5, 4, 3)', correct: false, feedback: `Watch the sign of ${IBX}: 4 + (−1) = 3. On the x axis, b’s dashed bar runs back toward zero.` },
        { id: 'multiply', label: '(−4, 3, 2)', correct: false, feedback: 'That multiplies matching components. Addition adds them: (4 + (−1), 1 + 3, 1 + 2).' },
      ],
    },
    {
      id: 'aim-the-sum',
      label: 'Aim the sum',
      title: 'Use components to steer a sum',
      activeLabel: 'Steering a + b',
      body: `Component thinking turns a geometric puzzle into arithmetic. For ${ISUM} to lie along the x axis, its y and z components must be zero. So b must cancel a’s y and z parts exactly, and anything left in x survives.`,
      task: `Drag b’s yellow handle (or type b’s components) until ${ISUM} lies along the x axis.`,
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['components-a', 'components-b'],
      labOptions: { layout: 'sum', showComponents: false, showStacks: true, draggable: ['b'] },
      initialLabState: { v: { x: 3, y: 2, z: 2 }, b: { x: 1, y: 1, z: 1 } },
      goal: {
        text: `${ISUM} lies along the x axis (y and z components zero, x not zero).`,
        check: ({ sum }) => sum.y === 0 && sum.z === 0 && sum.x !== 0,
      },
      equations: [
        { ...SUM_LIVE, symbols: [SYMBOL.a, SYMBOL.b, SYMBOL.stackX, SYMBOL.stackY, SYMBOL.stackZ] },
      ],
      prompt: `With a = (3, 2, 2), which b makes ${ISUM} lie along the x axis?`,
      choices: [
        { id: 'cancel', label: 'b = (1, −2, −2)', correct: true, feedback: `Right: ${ISUM} = (4, 0, 0). Now build it in the scene.` },
        { id: 'copy', label: 'b = (1, 2, 2)', correct: false, feedback: `That doubles a’s y and z parts instead of canceling them: ${ISUM} = (4, 4, 4).` },
        { id: 'cancel-x', label: 'b = (−3, 0, 0)', correct: false, feedback: 'That cancels the x part and leaves (0, 2, 2), which is off the x axis.' },
      ],
    },
    {
      id: 'scale-vector',
      label: 'Scaling',
      title: 'Scaling stretches, shrinks, or reverses a vector',
      activeLabel: 'Scalar multiple c v',
      body: 'Multiplying a vector by a number c multiplies every component by c. The arrow stays on the same line through the origin. It grows when c is greater than 1, shrinks when c is between 0 and 1, and flips to point the opposite way when c is negative. Its length is |c| times the original length.',
      task: 'Slide c through 1, 0.5, 0, and −1. Watch the green arrow and its components.',
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['scalar', 'components'],
      labOptions: { ...SINGLE, showScaled: true },
      initialLabState: { v: { x: 2, y: 1, z: 2 }, scalar: 2 },
      equations: [
        {
          id: 'scaled-components',
          html: math(CV, EQ, paren(list(row(mi('c'), VX), row(mi('c'), VY), row(mi('c'), VZ)))) + math(EQ, live('scaled', 'scaled-vector')),
          symbols: [SYMBOL.scaled, SYMBOL.vx, SYMBOL.vy, SYMBOL.vz],
        },
        {
          id: 'scaled-length',
          html: math(abs(CV), EQ, abs(mi('c')), abs(V)) + math(EQ, live('absC'), mo('×'), live('magnitude', 'vector'), EQ, live('scaledMagnitude', 'scaled-vector')),
          symbols: [SYMBOL.scaled, SYMBOL.v],
        },
      ],
      prompt: 'What does multiplying by c = −1 do to a vector?',
      choices: [
        { id: 'reverse', label: 'Reverses its direction and keeps its length', correct: true, feedback: 'Right. −v has the same length and points the opposite way. Later this is how a push becomes a pull, or how a fault’s slip sense is reversed.' },
        { id: 'shorter', label: 'Makes it shorter', correct: false, feedback: `Slide c to −1: the length stays |−1| × ${IABSV} = ${IABSV}. Only the direction flips.` },
        { id: 'zero', label: 'Makes it zero', correct: false, feedback: 'Only c = 0 gives the zero vector. c = −1 flips the vector without shrinking it.' },
      ],
    },
    {
      id: 'where-vectors-show-up',
      label: 'Vectors in geology',
      title: 'Where this shows up: three vectors from geology',
      activeLabel: 'Vectors in structural geology',
      body: 'Every directional quantity in structural geology is a vector: the force pushing on a rock face, the slip of one fault block past another, the line along a fold’s hinge. Each is an arrow with components, exactly like the vectors you just built. Here z still points up; lesson O1 moves to the geological frame of north, east, and down.',
      task: 'Pick each example. The components and the magnitude work the same way every time.',
      visualKind: 'vector-lab',
      dimension: 3,
      controls: ['context', 'components'],
      labOptions: { ...SINGLE, context: 'rock-face' },
      initialLabState: { v: { x: 0.5, y: 1, z: -3 }, context: 'rock-face' },
      contexts: CONTEXTS,
      equations: [
        {
          ...COMPONENTS_3D,
          html: `${COMPONENTS_3D.html}<small>The rock, fault, and fold are illustrative sketches. The vector and its components are exact.</small>`,
        },
        MAGNITUDE_3D,
      ],
    },
  ],
};

