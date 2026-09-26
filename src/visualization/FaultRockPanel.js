import { applyRefHighlight, bindRefHover } from './plotKit.js';

const WIDTH = 480;
const HEIGHT = 470;
const CARD = { width: 214, height: 118 };

/** A deterministic random sequence, so the drawings are the same every time. */
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function polygon(random, cx, cy, size, corners = 5) {
  const points = [];
  const start = random() * Math.PI * 2;
  for (let index = 0; index < corners; index += 1) {
    const angle = start + (index / corners) * Math.PI * 2 + (random() - 0.5) * 0.7;
    const radius = size * (0.55 + random() * 0.45);
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return `<polygon points="${points.join(' ')}" />`;
}

/** Schematic textures of each fault rock (drawn here, not photographs). */
const DRAWINGS = {
  breccia: () => {
    const random = seeded(3);
    let shapes = '';
    for (let index = 0; index < 26; index += 1) shapes += polygon(random, 10 + random() * 194, 8 + random() * 102, 7 + random() * 13);
    return `<rect width="${CARD.width}" height="${CARD.height}" fill="#6b5f52" /><g fill="#c9b79c" stroke="#3d342b" stroke-width="1.2">${shapes}</g>`;
  },
  gouge: () => {
    const random = seeded(8);
    let streaks = '';
    for (let index = 0; index < 18; index += 1) {
      const y = 6 + index * 6.2 + random() * 3;
      streaks += `<path d="M 0 ${y.toFixed(1)} C 60 ${(y + random() * 4 - 2).toFixed(1)}, 140 ${(y + random() * 4 - 2).toFixed(1)}, ${CARD.width} ${(y + random() * 3 - 1.5).toFixed(1)}" />`;
    }
    let grains = '';
    for (let index = 0; index < 9; index += 1) grains += polygon(random, 10 + random() * 194, 10 + random() * 98, 2.5 + random() * 3, 4);
    return `<rect width="${CARD.width}" height="${CARD.height}" fill="#7c7268" /><g fill="none" stroke="#968b7f" stroke-width="1.4">${streaks}</g><g fill="#c9b79c" stroke="#4a4036" stroke-width="0.8">${grains}</g>`;
  },
  cataclasite: () => {
    const random = seeded(21);
    let grains = '';
    for (let index = 0; index < 150; index += 1) grains += polygon(random, random() * CARD.width, random() * CARD.height, 1.6 + random() * 5, 4 + Math.floor(random() * 2));
    return `<rect width="${CARD.width}" height="${CARD.height}" fill="#3f3934" /><g fill="#9d8f7e" stroke="#2c2622" stroke-width="0.6">${grains}</g>`;
  },
  mylonite: () => {
    const random = seeded(13);
    let bands = '';
    for (let index = 0; index < 14; index += 1) {
      const y = 4 + index * 8.4;
      bands += `<path d="M 0 ${y.toFixed(1)} C 50 ${(y - 3 + random() * 6).toFixed(1)}, 150 ${(y - 3 + random() * 6).toFixed(1)}, ${CARD.width} ${y.toFixed(1)}" stroke="${index % 2 ? '#8a8f96' : '#5c6168'}" stroke-width="${(3 + random() * 3).toFixed(1)}" />`;
    }
    let eyes = '';
    for (let index = 0; index < 6; index += 1) {
      const cx = 18 + random() * 178;
      const cy = 14 + random() * 90;
      const rx = 9 + random() * 6;
      eyes += `<path d="M ${(cx - rx * 2).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy - 7).toFixed(1)} ${(cx + rx * 2).toFixed(1)} ${cy.toFixed(1)} Q ${cx.toFixed(1)} ${(cy + 7).toFixed(1)} ${(cx - rx * 2).toFixed(1)} ${cy.toFixed(1)} Z" fill="#b3a79a" stroke="#43474d" stroke-width="1" />`;
    }
    return `<rect width="${CARD.width}" height="${CARD.height}" fill="#6f747b" /><g fill="none">${bands}</g>${eyes}`;
  },
};

const ROCKS = [
  { ref: 'breccia', name: 'Fault breccia', lines: ['Angular broken pieces, over 30%', 'of the rock. Loose (incohesive).'] },
  { ref: 'gouge', name: 'Fault gouge', lines: ['Crushed to fine, often clay-rich', 'powder; under 30% pieces. Loose.'] },
  { ref: 'cataclasite', name: 'Cataclasite', lines: ['Crushed grains, cemented or', 'healed: cohesive, no layering.'] },
  { ref: 'mylonite', name: 'Mylonite (not brittle)', lines: ['Ductile shear-zone rock: layered,', 'with stretched grains. Forms deeper.'] },
];

/**
 * The fault rocks of B9 as schematic drawings, with the properties that
 * name them: cohesion, the share of visible fragments, and foliation.
 * Cards carry data-ref for equation–model binding.
 */
export class FaultRockPanel {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.highlightRef = null;
    bindRefHover(container, (ref) => onHover?.(ref));
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  render() {
    const cards = ROCKS.map((rock, index) => {
      const x = 20 + (index % 2) * (CARD.width + 12);
      const y = 70 + Math.floor(index / 2) * (CARD.height + 82);
      return `
        <g data-ref="${rock.ref}" transform="translate(${x} ${y})">
          <clipPath id="rock-clip-${rock.ref}"><rect width="${CARD.width}" height="${CARD.height}" rx="6" /></clipPath>
          <g clip-path="url(#rock-clip-${rock.ref})">${DRAWINGS[rock.ref]()}</g>
          <rect width="${CARD.width}" height="${CARD.height}" rx="6" fill="none" stroke="${rock.ref === 'mylonite' ? '#9aa1ad' : '#d9b27c'}" stroke-width="2"${rock.ref === 'mylonite' ? ' stroke-dasharray="7 5"' : ''} />
          <text x="0" y="${CARD.height + 24}" class="mohr-small rock-name" fill="#f4f5f7">${rock.name}</text>
          ${rock.lines.map((line, lineIndex) => `<text x="0" y="${CARD.height + 44 + lineIndex * 18}" class="mohr-caption" fill="#c3c8d0">${line}</text>`).join('')}
        </g>`;
    }).join('');
    this.container.innerHTML = `
      <svg class="mohr-svg rock-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="Schematic drawings of four fault rocks: breccia, gouge, cataclasite, and mylonite, with what distinguishes them.">
        <text class="mohr-title" x="20" y="28">Fault rocks</text>
        <text class="mohr-caption" x="20" y="50" fill="#9aa1ad">Schematic drawings, a few centimetres across; not photographs.</text>
        ${cards}
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
