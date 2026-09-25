// Seed version (Build 00). The full lesson is specified in
// docs/curriculum/unit-2-stress.md (S3). It must adopt the traction sign
// form fixed in S4 (compression positive); this seed still shows the signed
// projection onto the outward normal, as described in SCIENTIFIC_SCOPE.md.

export default {
  id: 'S3',
  status: 'seed',
  steps: [
    {
      id: 'decompose-traction',
      label: 'Resolve normal and shear',
      title: 'Traction has normal and shear components',
      activeLabel: 'Traction decomposition',
      body: 'Project the traction onto the surface normal. The signed projection is the normal traction; what remains lies in the surface and is the shear traction. Drag the force and watch both parts change with angle and magnitude.',
      task: 'Choose Oblique, then adjust the direction until the normal and shear magnitudes are about equal.',
      visualKind: 'force-lab',
      quantity: 'force',
      controls: ['components', 'area', 'presets'],
      labOptions: {
        showSurfaceNormal: true,
        showArea: true,
        showDecomposition: true,
        allowSurfaceSelection: true,
        allowForceDrag: true,
      },
      initialLabState: { forceVector: { x: 3_535, y: -3_535, z: 0 }, surfaceNormal: { x: 0, y: 1, z: 0 }, contactArea: 100 },
      presetId: 'pure-shear', magnitude: 0, vectors: false, outline: false, grid: false,
      spotlight: 'decomposition',
      equations: [
        {
          id: 'normal-part',
          html: '<var data-scene-ref="normal">t<sub>n</sub></var> = <var data-scene-ref="force">t̄</var> · <var data-scene-ref="surface-normal">n</var> = <output data-live="normalTraction"></output>',
          symbols: [
            { symbol: 't̄', sceneRef: 'force', description: 'White arrow with a round drag handle (traction direction)' },
            { symbol: 'n', sceneRef: 'surface-normal', description: 'Short arrow pointing straight out of the selected face' },
            { symbol: 'tₙ', sceneRef: 'normal', description: 'Arrow parallel to n, drawn from the tip of the shear arrow' },
          ],
        },
        {
          id: 'shear-part',
          html: '<var data-scene-ref="shear">τ</var> = <var data-scene-ref="force">t̄</var> − <var data-scene-ref="normal">t<sub>n</sub></var><var data-scene-ref="surface-normal">n</var> &nbsp;→&nbsp; |<var data-scene-ref="shear">τ</var>| = <output data-live="shearMagnitude"></output>',
          symbols: [
            { symbol: 'τ', sceneRef: 'shear', description: 'Arrow lying in the face, starting at the tail of the white arrow' },
          ],
        },
      ],
      prompt: 'At 45° to the surface normal, how do the normal and shear magnitudes compare?',
      choices: [
        { id: 'normal-larger', label: 'Normal is larger', correct: false, feedback: 'At 45°, the two projections have equal magnitudes.' },
        { id: 'equal', label: 'They are equal', correct: true, feedback: 'Correct. cos 45° = sin 45°, so both projections are the same size.' },
        { id: 'shear-zero', label: 'Shear is zero', correct: false, feedback: 'Shear vanishes only when the traction is exactly parallel to the normal.' },
      ],
      responseOverride: 'Normal and shear traction are components of one surface-traction vector.',
    },
  ],
};
