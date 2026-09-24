export const COMPONENTS = [
  { key: 'xx', label: 'σx', longLabel: 'Normal stress X' },
  { key: 'yy', label: 'σy', longLabel: 'Normal stress Y' },
  { key: 'zz', label: 'σz', longLabel: 'Normal stress Z' },
  { key: 'xy', label: 'τxy', longLabel: 'Shear stress XY' },
  { key: 'xz', label: 'τxz', longLabel: 'Shear stress XZ' },
  { key: 'yz', label: 'τyz', longLabel: 'Shear stress YZ' },
];

/**
 * Preset factors use the geology convention: compression is positive and
 * tension is negative. The presets are qualitative teaching configurations,
 * not calibrated material tests.
 */
export const STRESS_STATES = [
  {
    id: 'uniaxial-tension',
    number: 1,
    name: 'Uniaxial tension',
    family: 'Tension',
    glyph: '← □ →',
    factors: { xx: -1, yy: 0, zz: 0, xy: 0, xz: 0, yz: 0 },
    description: 'One tensile stress acts along the x-axis.',
    response: 'The block extends parallel to the tensile direction and narrows laterally.',
  },
  {
    id: 'biaxial-tension',
    number: 2,
    name: 'Biaxial tension',
    family: 'Tension',
    glyph: '↔ · ↕',
    factors: { xx: -1, yy: -1, zz: 0, xy: 0, xz: 0, yz: 0 },
    description: 'Tension acts along two perpendicular axes.',
    response: 'The block expands in two directions and contracts slightly in the third.',
  },
  {
    id: 'biaxial-tension-compression',
    number: 3,
    name: 'Biaxial tension + compression',
    family: 'Combined',
    glyph: '↔ ◇ ↓',
    factors: { xx: -1, yy: -1, zz: 0.65, xy: 0, xz: 0, yz: 0 },
    description: 'Two tensile stresses combine with compression on the third axis.',
    response: 'The block spreads in two directions while shortening through its depth.',
  },
  {
    id: 'tension-compression',
    number: 4,
    name: 'Tension + compression',
    family: 'Combined',
    glyph: '↔ ◇ ↕',
    factors: { xx: -1, yy: 0.8, zz: 0, xy: 0, xz: 0, yz: 0 },
    description: 'Tension on one axis is paired with compression on another.',
    response: 'The block lengthens in one direction and shortens in the perpendicular direction.',
  },
  {
    id: 'uniaxial-compression',
    number: 5,
    name: 'Uniaxial compression',
    family: 'Compression',
    glyph: '→ □ ←',
    factors: { xx: 1, yy: 0, zz: 0, xy: 0, xz: 0, yz: 0 },
    description: 'One compressive stress acts along the x-axis.',
    response: 'The block shortens parallel to compression and widens laterally.',
  },
  {
    id: 'biaxial-compression',
    number: 6,
    name: 'Biaxial compression',
    family: 'Compression',
    glyph: '→ ■ ←',
    factors: { xx: 1, yy: 1, zz: 0, xy: 0, xz: 0, yz: 0 },
    description: 'Compression acts along two perpendicular axes.',
    response: 'The block shortens in two directions and expands slightly in the third.',
  },
  {
    id: 'biaxial-compression-tension',
    number: 7,
    name: 'Biaxial compression + tension',
    family: 'Combined',
    glyph: '→ ◆ ↑',
    factors: { xx: 1, yy: 1, zz: -0.65, xy: 0, xz: 0, yz: 0 },
    description: 'Two compressive stresses combine with tension on the third axis.',
    response: 'The block shortens in two directions while extending through its depth.',
  },
  {
    id: 'pure-shear',
    number: 8,
    name: 'Pure shear',
    family: 'Shear',
    glyph: '↱ ◇ ↲',
    factors: { xx: 0, yy: 0, zz: 0, xy: 1, xz: 0, yz: 0 },
    description: 'Balanced shear stresses act on complementary faces.',
    response: 'The block changes shape while keeping approximately the same volume.',
  },
  {
    id: 'simple-shear-triaxial-compression',
    number: 9,
    name: 'Simple shear + triaxial compression',
    family: 'Combined',
    glyph: '↱ ■ ↲',
    factors: { xx: 0.45, yy: 0.45, zz: 0.45, xy: 0.8, xz: 0, yz: 0 },
    description: 'Simple shear is superimposed on compression from three directions.',
    response: 'The block shears while its overall volume decreases.',
  },
  {
    id: 'biaxial-shear-triaxial-compression',
    number: 10,
    name: 'Biaxial shear + triaxial compression',
    family: 'Combined',
    glyph: '⤨ ■ ⤩',
    factors: { xx: 0.45, yy: 0.45, zz: 0.45, xy: 0.7, xz: 0.7, yz: 0 },
    description: 'Shear in two planes is combined with compression from three directions.',
    response: 'The block distorts in three dimensions while contracting overall.',
  },
];

export function getStressState(id) {
  return STRESS_STATES.find((state) => state.id === id) ?? STRESS_STATES[0];
}

export function scalePreset(state, magnitude) {
  return Object.fromEntries(
    COMPONENTS.map(({ key }) => [key, state.factors[key] * magnitude]),
  );
}

export function formatStress(value) {
  const safe = Math.abs(value) < 0.05 ? 0 : value;
  return `${safe.toFixed(1)} MPa`;
}
