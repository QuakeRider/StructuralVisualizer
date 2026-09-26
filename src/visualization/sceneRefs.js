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
  // M2: angles, the rotated (primed) axes, and the geology previews.
  'angle-alpha',
  'angle-beta',
  'angle-gamma',
  'unit-circle',
  'axis-x-prime',
  'axis-y-prime',
  'comp-x-prime',
  'comp-y-prime',
  'angle-theta',
  'elevation-angle',
  'plane-trace',
  // M2: curves in the plot beside the scene (CurvePlot), not 3D objects.
  'curve-cos2',
  'curve-sincos',
]);

/** Vector-lab refs drawn by the curve plot rather than the 3D scene. */
export const CURVE_PLOT_SCENE_REFS = Object.freeze(['curve-cos2', 'curve-sincos']);

/** Anderson lab: the NED Earth block (3D) and the Mohr plot beside it. */
export const ANDERSON_SCENE_REFS = Object.freeze([
  'sigma-1',
  'sigma-2',
  'sigma-3',
  'vertical-axis',
  'free-surface',
  'fault',
  'conjugate',
  'beta',
  'dip',
  'slip',
  'envelope',
  'mohr-circle',
  'two-theta',
  'phi',
]);

/** Friction lab (B6): the NED block with an existing plane, the 3D Mohr diagram, and the stereonet. */
export const FRICTION_SCENE_REFS = Object.freeze([
  'sigma-1',
  'sigma-2',
  'sigma-3',
  'plane',
  'pole',
  'traction',
  'normal-stress',
  'shear-stress',
  'slip',
  'new-fault',
  // Mohr diagram.
  'mohr-circle',
  'mohr-region',
  'plane-point',
  'friction',
  'intact',
  'ts-line',
  'pf',
  // Stereonet.
  'ts-map',
  'critical',
  'mapped-faults',
]);

/** Fault lab (B8): the faulted NED block, the kinematic stereonet, and the well log. */
export const FAULT_SCENE_REFS = Object.freeze([
  'hanging-wall',
  'footwall',
  'fault',
  'pole',
  'slip',
  'strike-slip',
  'dip-slip',
  'rake',
  'dike',
  'separation',
  'well',
  'strat-gap',
  'sigma-1',
  'sigma-2',
  'sigma-3',
  'traction',
  'shear-stress',
  'p-axis',
  't-axis',
  'b-axis',
  // Stereonet only.
  'auxiliary',
  'beach-ball',
]);

export const SCENE_REFS = Object.freeze({
  'force-lab': FORCE_LAB_SCENE_REFS,
  'vector-lab': VECTOR_LAB_SCENE_REFS,
  anderson: ANDERSON_SCENE_REFS,
  friction: FRICTION_SCENE_REFS,
  fault: FAULT_SCENE_REFS,
});
