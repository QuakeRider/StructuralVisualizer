// Seed version (Build 00). The full lesson is specified in
// docs/curriculum/unit-2-stress.md (S10) and adds mean/deviatoric
// decomposition, Mohr views of each state, and lithostatic stress.

const TENSOR_EQUATION = {
  id: 'state-tensor',
  html: 'σ = <output class="equation-matrix" data-live-html="tensor"></output><small>MPa · compression positive, tension negative</small>',
  symbols: [],
};

export default {
  id: 'S10',
  status: 'seed',
  steps: [
    {
      id: 'compare-normal-stress-states',
      label: 'Build normal states',
      title: 'Normal components combine into different stress states',
      activeLabel: 'Uniaxial tension',
      body: 'Uniaxial, biaxial, and triaxial states differ in which normal components act together. In the geological convention used here, compression is positive and tension is negative.',
      task: 'Read the matrix: which component is non-zero, and what is its sign?',
      visualKind: 'stress-state',
      presetId: 'uniaxial-tension', magnitude: 28, vectors: true, outline: true, grid: true,
      equations: [TENSOR_EQUATION],
      prompt: 'What should be most visible along the loaded x-axis in uniaxial tension?',
      choices: [
        { id: 'shorten', label: 'Shortening', correct: false, feedback: 'Shortening goes with compression along x.' },
        { id: 'extend', label: 'Extension', correct: true, feedback: 'Correct. The block extends parallel to the tensile direction.' },
        { id: 'unchanged', label: 'No change', correct: false, feedback: 'The tensile component produces visible extension.' },
      ],
      responseOverride: 'A stress state combines the normal and shear components acting at one point.',
    },
    {
      id: 'open-stress-explorer',
      label: 'Open the laboratory',
      title: 'Construct and compare complete stress states',
      activeLabel: 'Stress-state laboratory',
      body: 'Use Explore to compare the reference states and edit tensor components. Keep the chain of reasoning visible: force, traction on a surface, and finally the stress state at a point.',
      task: 'Choose two states with similar magnitudes and explain why their block responses differ.',
      visualKind: 'stress-state',
      presetId: 'biaxial-tension-compression', magnitude: 26, vectors: true, outline: true, grid: true,
      equations: [TENSOR_EQUATION],
      responseOverride: 'Continue into the open stress-state laboratory and build your own comparisons.',
      final: true,
    },
  ],
};
