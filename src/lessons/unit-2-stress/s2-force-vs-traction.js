// Seed version (Build 00). The full lesson is specified in
// docs/curriculum/unit-2-stress.md (S2) and adds the tilting plane and the
// cos θ vs cos² θ derivation.

import { abs, bound, frac, live, math, mi, mo, overbar, vec } from '../mathml.js';

const TRACTION_SYMBOLS = [
  { symbol: overbar(vec('t')), sceneRef: 'traction', description: 'Grid of short arrows spread over the patch' },
  { symbol: vec('F'), sceneRef: 'force', description: 'White arrow with a round drag handle' },
  { symbol: mi('A'), sceneRef: 'area', description: 'Shaded patch on the selected face' },
];

const T_BAR = bound('traction', overbar(vec('t')));

const TRACTION_EQUATION = {
  id: 'average-traction',
  html: math(T_BAR, mo('='), frac(bound('force', vec('F')), bound('area', mi('A'))))
    + math(abs(T_BAR), mo('='), live('tractionConversion'), mo('='), live('traction')),
  symbols: TRACTION_SYMBOLS,
};

const labOptions = {
  showSurfaceNormal: true,
  showArea: true,
  showDistribution: true,
  allowSurfaceSelection: true,
  allowForceDrag: true,
};

export default {
  id: 'S2',
  status: 'seed',
  steps: [
    {
      id: 'distribute-force-over-area',
      label: 'Distribute the load',
      title: 'A resultant force can stand for a load spread over an area',
      activeLabel: 'Resultant and load distribution',
      body: 'The white arrow is the resultant force. The small arrows show one idealized uniform distribution that produces it. Changing the area changes how concentrated the load is, without changing the resultant.',
      task: 'Hold the force fixed and compare 50 cm² with 100 cm². Notice what changes—and what does not.',
      visualKind: 'force-lab',
      quantity: 'force',
      controls: ['magnitude', 'area'],
      labOptions,
      initialLabState: { forceVector: { x: 0, y: -5_000, z: 0 }, surfaceNormal: { x: 0, y: 1, z: 0 }, contactArea: 100 },
      presetId: 'uniaxial-compression', magnitude: 0, vectors: false, outline: false, grid: false,
      spotlight: 'area',
      equations: [TRACTION_EQUATION],
      prompt: 'If the force stays fixed while the loaded area is halved, what happens to the average load intensity?',
      choices: [
        { id: 'halves', label: 'It is halved', correct: false, feedback: 'The same resultant is now concentrated on less area.' },
        { id: 'doubles', label: 'It doubles', correct: true, feedback: 'Correct. Dividing the same force by half the area gives twice the intensity.' },
        { id: 'same', label: 'It stays the same', correct: false, feedback: 'Area is in the denominator of F / A.' },
      ],
      responseOverride: 'A resultant summarizes a load distribution; the area controls its average intensity.',
    },
    {
      id: 'calculate-average-traction',
      label: 'Calculate traction',
      title: 'Force divided by area gives average traction',
      activeLabel: 'Average traction, t̄ = F / A',
      body: 'Average traction is a vector with stress units (pascals). It describes the force intensity on one specified surface. It is not yet the complete stress state at a point—that needs every surface through the point.',
      task: 'Set |F| = 5 kN and A = 100 cm². Follow the unit conversion to 0.50 MPa.',
      visualKind: 'force-lab',
      quantity: 'force',
      controls: ['magnitude', 'area'],
      labOptions,
      initialLabState: { forceVector: { x: 0, y: -5_000, z: 0 }, surfaceNormal: { x: 0, y: 1, z: 0 }, contactArea: 100 },
      presetId: 'uniaxial-compression', magnitude: 0, vectors: false, outline: false, grid: false,
      spotlight: 'traction',
      equations: [TRACTION_EQUATION],
      prompt: 'What is |t̄| for 5 kN spread uniformly over 100 cm²?',
      choices: [
        { id: 'point-zero-five', label: '0.05 MPa', correct: false, feedback: 'Check the conversion from square centimeters to square meters: 100 cm² = 0.01 m².' },
        { id: 'point-five', label: '0.50 MPa', correct: true, feedback: 'Correct. 5,000 N / 0.01 m² = 500,000 Pa = 0.50 MPa.' },
        { id: 'five', label: '5.0 MPa', correct: false, feedback: 'That is ten times too large—recheck the area conversion.' },
      ],
      responseOverride: 'Traction connects a force on a surface to the intensity of that force.',
    },
  ],
};
