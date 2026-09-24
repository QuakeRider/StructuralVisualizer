const SQUARE_CENTIMETERS_PER_SQUARE_METER = 10_000;
const PASCALS_PER_MEGAPASCAL = 1_000_000;

export function calculateStressMpa(forceNewtons, areaSquareCentimeters) {
  if (!Number.isFinite(forceNewtons) || forceNewtons < 0) {
    throw new RangeError('Force must be a non-negative finite number.');
  }
  if (!Number.isFinite(areaSquareCentimeters) || areaSquareCentimeters <= 0) {
    throw new RangeError('Area must be a positive finite number.');
  }

  const areaSquareMeters = areaSquareCentimeters / SQUARE_CENTIMETERS_PER_SQUARE_METER;
  return (forceNewtons / areaSquareMeters) / PASCALS_PER_MEGAPASCAL;
}

export function calculateAverageTraction(forceVectorNewtons, areaSquareCentimeters) {
  const components = ['x', 'y', 'z'].map((axis) => forceVectorNewtons?.[axis]);
  if (components.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Force vector components must be finite numbers.');
  }
  if (!Number.isFinite(areaSquareCentimeters) || areaSquareCentimeters <= 0) {
    throw new RangeError('Area must be a positive finite number.');
  }

  const conversion = calculateStressMpa(1, areaSquareCentimeters);
  return {
    x: forceVectorNewtons.x * conversion,
    y: forceVectorNewtons.y * conversion,
    z: forceVectorNewtons.z * conversion,
  };
}

export function decomposeTraction(forceVectorNewtons, areaSquareCentimeters, surfaceNormal) {
  const traction = calculateAverageTraction(forceVectorNewtons, areaSquareCentimeters);
  const normalLength = Math.hypot(surfaceNormal?.x, surfaceNormal?.y, surfaceNormal?.z);
  if (!Number.isFinite(normalLength) || normalLength <= 0) {
    throw new RangeError('Surface normal must have a non-zero finite magnitude.');
  }

  const normal = {
    x: surfaceNormal.x / normalLength,
    y: surfaceNormal.y / normalLength,
    z: surfaceNormal.z / normalLength,
  };
  const normalTraction = traction.x * normal.x + traction.y * normal.y + traction.z * normal.z;
  const shearVector = {
    x: traction.x - normalTraction * normal.x,
    y: traction.y - normalTraction * normal.y,
    z: traction.z - normalTraction * normal.z,
  };

  return {
    traction,
    tractionMagnitude: Math.hypot(traction.x, traction.y, traction.z),
    normal,
    normalTraction,
    shearVector,
    shearMagnitude: Math.hypot(shearVector.x, shearVector.y, shearVector.z),
  };
}

export function getStressNotation(direction) {
  return direction === 'shear'
    ? { symbol: 'τ', name: 'Shear stress', relationship: 'parallel to the surface' }
    : { symbol: 'σ', name: 'Normal stress', relationship: 'perpendicular to the surface' };
}
