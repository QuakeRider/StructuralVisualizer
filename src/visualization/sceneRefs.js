/**
 * Scene objects that equation symbols may bind to (equation–model binding),
 * listed per visual kind. Kept free of Three.js so lesson data and tests can
 * validate against it.
 */
export const FORCE_LAB_SCENE_REFS = Object.freeze([
  'force',
  'axis-x',
  'axis-y',
  'axis-z',
  'surface-normal',
  'area',
  'traction',
  'normal',
  'shear',
]);

export const VECTOR_LAB_SCENE_REFS = Object.freeze([
  'vector',
  'comp-x',
  'comp-y',
  'comp-z',
  'axis-x',
  'axis-y',
  'axis-z',
  'xy-diagonal',
  'unit-vector',
  'scaled-vector',
  'vector-a',
  'vector-b',
  'vector-sum',
  'stack-x',
  'stack-y',
  'stack-z',
]);

export const SCENE_REFS = Object.freeze({
  'force-lab': FORCE_LAB_SCENE_REFS,
  'vector-lab': VECTOR_LAB_SCENE_REFS,
});
