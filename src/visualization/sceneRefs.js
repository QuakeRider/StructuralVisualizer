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

/** Fault growth lab (B9): the block with marker horizons and fault surfaces, and the plot or fault-rock panel beside it. */
export const GROWTH_SCENE_REFS = Object.freeze([
  'horizon',
  'fault',
  'displacement',
  'contours',
  'tip-line',
  'section',
  'offset',
  'profile-line',
  'hanging-wall',
  'footwall',
  // Linkage.
  'segment-a',
  'segment-b',
  'relay-ramp',
  'breach',
  'process-zone',
  // Plot only.
  'sum-profile',
  'target-profile',
  'dl-line',
  'dl-data',
  'dl-point',
  'drag-profile',
  'far-offset',
]);

/** B11 fault-zone lab: the outcrop, the fault-rock slab, the crustal block, and the panels beside them. */
export const ZONE_SCENE_REFS = Object.freeze([
  // Outcrop.
  'host',
  'core',
  'damage-zone',
  'damage-fw',
  'damage-hw',
  'damage-edge',
  'zone-width',
  'slip-surface',
  'lens',
  'fractures',
  'deformation-bands',
  'scanline',
  'flow-along',
  'flow-across',
  // Plan view of damage (panel).
  'fault-trace',
  'wall-damage',
  'tip-damage',
  'linking-damage',
  'process-zone',
  // Scanline and width plots.
  'density-law',
  'density-counts',
  'background',
  'core-band',
  'damage-band',
  'core-point',
  'damage-point',
  // Fault-rock slab and its plots.
  'matrix',
  'fragments',
  'largest-clast',
  'clast-size',
  'fraction-curve',
  'matrix-cutoff',
  'breccia-cutoff',
  'sibson-chart',
  'sample-point',
  'wm-name',
  // Melting.
  'melt-vein',
  'heating-curve',
  'heating-point',
  'melt-line',
  // Depth.
  'zone-incohesive',
  'zone-cataclasite',
  'zone-quartz',
  'zone-mylonite',
  'fault-zone',
  'isotherms',
  'earthquakes',
  // Architecture.
  'fa-gauge',
  'fa-point',
  'end-member',
]);

export const SCENE_REFS = Object.freeze({
  'force-lab': FORCE_LAB_SCENE_REFS,
  'vector-lab': VECTOR_LAB_SCENE_REFS,
  anderson: ANDERSON_SCENE_REFS,
  friction: FRICTION_SCENE_REFS,
  fault: FAULT_SCENE_REFS,
  'fault-growth': GROWTH_SCENE_REFS,
  'fault-zone': ZONE_SCENE_REFS,
});
