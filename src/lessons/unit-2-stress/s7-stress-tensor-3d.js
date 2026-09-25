// Seed version (Build 00). The full lesson is specified in
// docs/curriculum/unit-2-stress.md (S7) and adds the 2D-slice reveal, an
// arbitrary plane through the point, t = σn in 3D, and the switch to NED.

import { inline, math, mo, row, vec } from '../mathml.js';

const TENSOR_EQUATION = {
  id: 'cauchy',
  html: math(vec('t'), row(mo('('), vec('n'), mo(')')), mo('='), mo('−'), vec('σ'), vec('n'))
    + `<small>(compression-positive ${inline(vec('σ'))}, outward ${inline(vec('n'))})</small><output class="equation-matrix" data-live-html="tensor"></output>`,
  symbols: [],
};

export default {
  id: 'S7',
  status: 'seed',
  steps: [
    {
      id: 'why-stress-needs-a-tensor',
      label: 'Motivate the tensor',
      title: 'Stress at a point must describe every plane orientation',
      activeLabel: 'From traction to the stress tensor',
      body: 'One traction vector describes one plane. A complete stress state must give the traction on every plane through the point. The stress tensor σ does that: it turns a plane’s normal n into that plane’s traction.',
      task: 'Orbit the cube and find the single non-zero component in the matrix and the faces it acts on.',
      visualKind: 'stress-state',
      presetId: 'uniaxial-compression', magnitude: 20, vectors: true, outline: true, grid: true,
      equations: [TENSOR_EQUATION],
      responseOverride: 'The tensor compactly describes how traction depends on plane orientation.',
    },
    {
      id: 'compare-shear-and-combined-states',
      label: 'Add shear components',
      title: 'Shear and normal components can act together',
      activeLabel: 'Combined stress state',
      body: 'Off-diagonal components are shear tractions on the coordinate planes. A combined state has both normal and shear components; its effect cannot be read from a single external arrow.',
      task: 'Identify at least one normal component and one shear component in the matrix.',
      visualKind: 'stress-state',
      presetId: 'simple-shear-triaxial-compression', magnitude: 30, vectors: true, outline: true, grid: true,
      equations: [TENSOR_EQUATION],
      prompt: 'Which representation completely specifies the displayed stress state at the point?',
      choices: [
        { id: 'one-arrow', label: 'One force arrow', correct: false, feedback: 'A single arrow describes force or traction on one surface, not the complete state.' },
        { id: 'tensor', label: 'The stress tensor', correct: true, feedback: 'Correct. Its components determine the traction on every plane orientation.' },
      ],
      responseOverride: 'Combined states require the full tensor, not a single force or traction vector.',
    },
  ],
};
