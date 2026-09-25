const EPSILON = 1e-9;

function finiteVector(vector, name) {
  const result = {
    x: Number(vector?.x),
    y: Number(vector?.y),
    z: Number(vector?.z),
  };
  if (Object.values(result).some((value) => !Number.isFinite(value))) {
    throw new TypeError(`${name} components must be finite numbers.`);
  }
  return result;
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(vector, scalar) {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function magnitude(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function normalize(vector, name) {
  const length = magnitude(vector);
  if (length <= EPSILON) throw new RangeError(`${name} must have a non-zero magnitude.`);
  return scale(vector, 1 / length);
}

export function calculateMoment(forceVectorNewtons, applicationPointMeters, referencePointMeters = { x: 0, y: 0, z: 0 }) {
  const force = finiteVector(forceVectorNewtons, 'Force vector');
  const applicationPoint = finiteVector(applicationPointMeters, 'Application point');
  const referencePoint = finiteVector(referencePointMeters, 'Reference point');
  return cross(subtract(applicationPoint, referencePoint), force);
}

export function calculateLoadResponse({
  forceVector,
  applicationPoint,
  surfaceNormal,
  constraintMode = 'fixed',
  cutPosition = 0,
  blockHalfSize = 1.25,
}) {
  const force = finiteVector(forceVector, 'Force vector');
  const point = finiteVector(applicationPoint, 'Application point');
  const normal = normalize(finiteVector(surfaceNormal, 'Surface normal'), 'Surface normal');
  if (!['free', 'fixed'].includes(constraintMode)) throw new RangeError('Constraint mode must be free or fixed.');
  if (!Number.isFinite(cutPosition) || cutPosition < -1 || cutPosition > 1) {
    throw new RangeError('Cut position must be between -1 and 1.');
  }
  if (!Number.isFinite(blockHalfSize) || blockHalfSize <= 0) {
    throw new RangeError('Block half-size must be positive.');
  }

  const forceMagnitude = magnitude(force);
  const center = { x: 0, y: 0, z: 0 };
  const loadedFaceCenter = scale(normal, blockHalfSize);
  const supportPoint = scale(normal, -blockHalfSize);
  const cutPoint = scale(normal, cutPosition * blockHalfSize);
  const normalForce = dot(force, normal);
  const normalVector = scale(normal, normalForce);
  const shearVector = subtract(force, normalVector);
  const shearForce = magnitude(shearVector);
  const momentAboutCenter = calculateMoment(force, point, center);
  const momentAboutSupport = calculateMoment(force, point, supportPoint);
  const momentAtCut = calculateMoment(force, point, cutPoint);
  const torsionalMoment = dot(momentAtCut, normal);
  const torsionalVector = scale(normal, torsionalMoment);
  const bendingVector = subtract(momentAtCut, torsionalVector);
  const bendingMoment = magnitude(bendingVector);
  const eccentricity = subtract(point, loadedFaceCenter);

  const forceThreshold = Math.max(forceMagnitude * 0.02, EPSILON);
  const momentThreshold = Math.max(forceMagnitude * blockHalfSize * 0.02, EPSILON);
  const actions = [];
  if (normalForce > forceThreshold) actions.push('tension');
  if (normalForce < -forceThreshold) actions.push('compression');
  if (shearForce > forceThreshold) actions.push('shear');
  if (bendingMoment > momentThreshold) actions.push('bending');
  if (Math.abs(torsionalMoment) > momentThreshold) actions.push('torsion');
  if (!actions.length) actions.push('no applied load');

  return {
    constraintMode,
    force,
    forceMagnitude,
    normal,
    applicationPoint: point,
    loadedFaceCenter,
    supportPoint,
    cutPoint,
    eccentricity,
    normalForce,
    normalVector,
    shearForce,
    shearVector,
    resultantMoment: momentAboutCenter,
    resultantMomentMagnitude: magnitude(momentAboutCenter),
    momentAboutSupport,
    momentAboutSupportMagnitude: magnitude(momentAboutSupport),
    reactionForce: constraintMode === 'fixed' ? scale(force, -1) : { x: 0, y: 0, z: 0 },
    reactionMoment: constraintMode === 'fixed' ? scale(momentAboutSupport, -1) : { x: 0, y: 0, z: 0 },
    internalForce: constraintMode === 'fixed' ? scale(force, -1) : { x: 0, y: 0, z: 0 },
    internalMoment: constraintMode === 'fixed' ? scale(momentAtCut, -1) : { x: 0, y: 0, z: 0 },
    torsionalMoment,
    torsionalVector,
    bendingMoment,
    bendingVector,
    actions,
    actionLabel: actions.map((action) => action[0].toUpperCase() + action.slice(1)).join(' + '),
    isEquilibrated: constraintMode === 'fixed',
  };
}

export function pointOnFace(surfaceNormal, tangentOffset = { x: 0, y: 0, z: 0 }, blockHalfSize = 1.25) {
  const normal = normalize(finiteVector(surfaceNormal, 'Surface normal'), 'Surface normal');
  const offset = finiteVector(tangentOffset, 'Tangent offset');
  const tangentialOffset = subtract(offset, scale(normal, dot(offset, normal)));
  const limit = blockHalfSize * 0.82;
  const clamped = {
    x: Math.max(-limit, Math.min(limit, tangentialOffset.x)),
    y: Math.max(-limit, Math.min(limit, tangentialOffset.y)),
    z: Math.max(-limit, Math.min(limit, tangentialOffset.z)),
  };
  return add(scale(normal, blockHalfSize), clamped);
}
