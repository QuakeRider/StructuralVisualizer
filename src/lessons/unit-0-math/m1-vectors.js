// Seed version (Build 00). The full lesson is specified in
// docs/curriculum/unit-0-math.md (M1) and adds the component box, the
// 2D-first sequence, vector addition, and scaling.

const VECTOR_SYMBOLS = [
  { symbol: 'v', sceneRef: 'force', description: 'White arrow with a round drag handle' },
  { symbol: 'vₓ', sceneRef: 'axis-x', description: 'Direction of the X axis arrow' },
  { symbol: 'vᵧ', sceneRef: 'axis-y', description: 'Direction of the Y axis arrow' },
  { symbol: 'v_z', sceneRef: 'axis-z', description: 'Direction of the Z axis arrow' },
];

export default {
  id: 'M1',
  status: 'seed',
  steps: [
    {
      id: 'build-a-vector',
      label: 'Build a vector',
      title: 'Build a vector in three dimensions',
      activeLabel: 'Vector laboratory',
      body: 'A vector has a magnitude and a direction. Drag the white handle or type the x, y, and z components; the arrow and the numbers always describe the same vector.',
      task: 'Set v = (3, −4, 0) and find its magnitude.',
      visualKind: 'force-lab',
      quantity: 'vector',
      controls: ['magnitude', 'components'],
      labOptions: { allowForceDrag: true },
      initialLabState: { forceVector: { x: 3_000, y: -4_000, z: 0 }, surfaceNormal: { x: 0, y: 1, z: 0 } },
      presetId: 'uniaxial-compression', magnitude: 0, vectors: false, outline: false, grid: false,
      spotlight: 'force',
      equations: [
        {
          id: 'vector-magnitude',
          html: '|<var data-scene-ref="force">v</var>| = √(<var data-scene-ref="axis-x">v<sub>x</sub></var>² + <var data-scene-ref="axis-y">v<sub>y</sub></var>² + <var data-scene-ref="axis-z">v<sub>z</sub></var>²) = <output data-live="magnitude"></output>',
          symbols: VECTOR_SYMBOLS,
        },
      ],
      prompt: 'What is the magnitude of v = (3, −4, 0)?',
      choices: [
        { id: 'three', label: '3', correct: false, feedback: 'That is only the x-component. The magnitude uses all three components.' },
        { id: 'five', label: '5', correct: true, feedback: 'Correct. √(3² + (−4)² + 0²) = √25 = 5.' },
        { id: 'seven', label: '7', correct: false, feedback: 'Magnitude is not the sum of the component sizes; the components are perpendicular, so use Pythagoras.' },
      ],
      responseOverride: 'Components and magnitude-with-direction are two descriptions of the same vector.',
    },
  ],
};
