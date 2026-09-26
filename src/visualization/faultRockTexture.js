// Canvas drawings of fault rock (B11): a slice of rock from faultRocks.js
// slabTexture() (clast outlines, fine fragments, and matrix), with an
// optional foliation and a pseudotachylyte vein. Schematic in appearance;
// the areas of clasts, fine fragments, and matrix are the model's.

import { SLAB_CELL, seededRandom } from '../domain/faultRocks.js';

const CLAST_COLORS = ['#cdbb9f', '#b7a58c', '#e2d7c6', '#a3927f', '#c4b39a', '#8f8172'];
const MATRIX = { cohesive: [46, 41, 38], loose: [110, 97, 82] };
const FINE = { cohesive: [128, 116, 102], loose: [168, 152, 130] };
const MELT = '#16110f';

function mix(rgb, factor) {
  return rgb.map((value) => Math.round(Math.min(255, value * factor)));
}

/** Which slab class a highlight ref keeps lit; the other classes are dimmed. */
function litClasses(highlight) {
  if (highlight === 'matrix' || highlight === 'matrix-cutoff') return new Set([SLAB_CELL.matrix]);
  if (highlight === 'fragments' || highlight === 'clast-size') return new Set([SLAB_CELL.clast, SLAB_CELL.fine]);
  if (highlight === 'largest-clast') return new Set();
  return null;
}

/**
 * Draw a slab onto `canvas` (its size is the slab grid, nx × ny, times
 * `scale`). options: { cohesive, foliated, melt: 'none' | 'melt',
 * highlight (a scene ref) }. Returns the vein band in cell rows, if any.
 */
export function drawSlab(canvas, slab, { cohesive = true, foliated = false, melt = 'none', highlight = null, scale = 1 } = {}) {
  const { nx, ny, cells, polygons } = slab;
  canvas.width = nx * scale;
  canvas.height = ny * scale;
  const context = canvas.getContext('2d');
  const random = seededRandom(31);
  const lit = litClasses(highlight);
  const dimFor = (cellClass) => (lit && !lit.has(cellClass) ? 0.3 : 1);
  const matrix = cohesive ? MATRIX.cohesive : MATRIX.loose;
  const fine = cohesive ? FINE.cohesive : FINE.loose;

  // Matrix and fine fragments, cell by cell, with a little grain noise.
  const image = context.createImageData(nx, ny);
  for (let j = 0; j < ny; j += 1) {
    // Foliation: wavy bands in the matrix.
    const band = foliated ? 0.8 + 0.35 * Math.sin((j / ny) * Math.PI * 22 + Math.sin(j * 0.05) * 2) : 1;
    for (let i = 0; i < nx; i += 1) {
      const index = j * nx + i;
      const kind = cells[index];
      const noise = 0.88 + random() * 0.24;
      const base = kind === SLAB_CELL.fine ? fine : matrix;
      const rgb = mix(base, noise * (kind === SLAB_CELL.fine ? 1 : band) * dimFor(kind === SLAB_CELL.clast ? SLAB_CELL.matrix : kind));
      image.data.set([...rgb, 255], index * 4);
    }
  }
  const layer = document.createElement('canvas');
  layer.width = nx;
  layer.height = ny;
  layer.getContext('2d').putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(layer, 0, 0, nx * scale, ny * scale);

  // Clasts: angular outlines, host-rock colors.
  const clastDim = dimFor(SLAB_CELL.clast);
  polygons.forEach((polygon, index) => {
    const color = CLAST_COLORS[index % CLAST_COLORS.length];
    const isLargest = index === 0;
    const alpha = highlight === 'largest-clast' ? (isLargest ? 1 : 0.3) : clastDim;
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.strokeStyle = highlight === 'largest-clast' && isLargest ? '#e69f00' : '#3a322b';
    context.lineWidth = highlight === 'largest-clast' && isLargest ? 3 * scale : Math.max(0.6, Math.min(1.4, polygon.d / 40)) * scale;
    context.beginPath();
    polygon.vertices.forEach((vertex, corner) => {
      const x = (polygon.cx + vertex.x) * scale;
      const y = (polygon.cy + vertex.y) * scale;
      if (corner) context.lineTo(x, y);
      else context.moveTo(x, y);
    });
    context.closePath();
    context.fill();
    if (polygon.d / slab.cell > 3) context.stroke();
  });
  context.globalAlpha = 1;

  if (melt === 'none') return null;
  // Pseudotachylyte: a dark glassy vein along the slip zone, with injection veins
  // branching into the walls and rounded quartz clasts that did not melt.
  const veinDim = highlight && highlight !== 'melt-vein' && highlight !== 'heating-point' ? 0.45 : 1;
  const thickness = 0.07 * ny * scale;
  const middle = ny * scale * 0.52;
  const width = nx * scale;
  context.globalAlpha = veinDim;
  context.fillStyle = MELT;
  context.beginPath();
  context.moveTo(0, middle - thickness / 2);
  for (let x = 0; x <= width; x += width / 40) context.lineTo(x, middle - thickness / 2 + Math.sin(x / 37) * thickness * 0.18);
  for (let x = width; x >= 0; x -= width / 40) context.lineTo(x, middle + thickness / 2 + Math.sin(x / 29 + 1) * thickness * 0.18);
  context.closePath();
  context.fill();
  for (let index = 0; index < 7; index += 1) {
    const x = width * (0.08 + 0.84 * random());
    const up = random() > 0.5 ? -1 : 1;
    const reach = thickness * (1.5 + random() * 3);
    context.beginPath();
    context.moveTo(x - thickness * 0.35, middle);
    context.lineTo(x + (random() - 0.5) * thickness, middle + up * reach);
    context.lineTo(x + thickness * 0.35, middle);
    context.closePath();
    context.fill();
  }
  context.fillStyle = '#d9d2c4';
  for (let index = 0; index < 14; index += 1) {
    const x = random() * width;
    const y = middle + (random() - 0.5) * thickness * 0.7;
    context.beginPath();
    context.arc(x, y, (0.6 + random() * 1.6) * scale * (nx / 480), 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  return { middle: middle / scale, thickness: thickness / scale };
}
