import './styles.css';
import { COMPONENTS, STRESS_STATES, formatStress, getStressState, scalePreset } from './domain/stressStates.js';
import { computeDeformation, tensorToMatrix, volumeChangePercent } from './domain/deformation.js';
import { decomposeTraction } from './domain/forceStress.js';
import { formatNumber, formatSquared, formatVector } from './domain/format.js';
import { add, magnitude, scale, xyMagnitude } from './domain/vector.js';
import {
  LESSONS,
  UNITS,
  checkNumericAnswer,
  getAvailableLessons,
  getLesson,
  getLessonStep,
  getNextAvailableLesson,
  hasPrediction,
  isGoalMet,
  isLessonAvailable,
  isLessonChoiceCorrect,
} from './lessons/registry.js';
import { ForceLabScene } from './visualization/ForceLabScene.js';
import { StressScene } from './visualization/StressScene.js';
import { VectorScene } from './visualization/VectorScene.js';

const DEFAULT_STATE_ID = 'uniaxial-tension';
const DEFAULT_MAGNITUDE = 28;
const DEFAULT_EXAGGERATION = 1.2;
const DEFAULT_FORCE = { x: 0, y: -5_000, z: 0 };
const DEFAULT_NORMAL = { x: 0, y: 1, z: 0 };
const DEFAULT_AREA = 100;
const DEFAULT_VECTOR_LAB = { v: { x: 3, y: 2, z: 0 }, b: { x: 1, y: 2, z: 0 }, scalar: 2, context: null, dimension: 3 };
const COMPONENT_LIMIT = 6;
const DEFAULT_LESSON_ID = getAvailableLessons()[0].id;

/** How the force-lab vector is named and displayed. Internally it is stored in newtons. */
const QUANTITIES = {
  force: { name: 'Force', symbol: 'F', unit: 'kN', divisor: 1_000 },
};

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="app-shell" data-mode="guided" data-lesson-view="true" data-visual-kind="force-lab">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div><p class="eyebrow">Interactive structural geology</p><h1>Structural Visualizer</h1></div>
      </div>
      <nav class="mode-switch" aria-label="Learning mode">
        <button class="mode-button is-active" type="button" data-mode="guided" aria-pressed="true">Guided</button>
        <button class="mode-button" type="button" data-mode="explore" aria-pressed="false">Explore</button>
        <button class="mode-button" type="button" data-mode="present" aria-pressed="false">Present</button>
      </nav>
      <div class="module-chip"><span id="module-chip-label">Current unit</span><strong id="module-chip-value"></strong></div>
    </header>

    <main class="workspace">
      <aside class="panel preset-panel" aria-label="Stress-state navigation">
        <div class="panel-heading">
          <div><p class="section-kicker">Stress laboratory</p><h2>Reference states</h2></div>
          <span class="count-badge">10</span>
        </div>
        <p class="panel-intro">Select a state, inspect its tensor, and compare the block response.</p>
        <div id="preset-grid" class="preset-grid" role="group" aria-label="Stress-state presets"></div>
        <div class="sign-key">
          <span><i class="key-line tension"></i>Tension</span>
          <span><i class="key-line compression"></i>Compression</span>
          <span><i class="key-line shear"></i>Shear</span>
        </div>
      </aside>

      <section class="visual-column" aria-labelledby="active-state-name">
        <div class="visual-header">
          <div class="active-title-row">
            <span id="active-number" class="state-number"></span>
            <div><p class="section-kicker">Interactive laboratory</p><h2 id="active-state-name"></h2></div>
          </div>
          <div class="view-actions">
            <button id="replay-button" class="button secondary replay-button" type="button"><span aria-hidden="true">↻</span> Replay</button>
            <button id="reset-view-button" class="button secondary" type="button">Reset view</button>
          </div>
        </div>

        <div class="presentation-toolbar" aria-label="Presentation controls">
          <label><span>Stress state</span><select id="presentation-state-select"></select></label>
          <label class="presentation-magnitude-control"><span>Magnitude <output id="presentation-magnitude-output">28 MPa</output></span><input id="presentation-magnitude-input" type="range" min="5" max="60" step="1" value="28" /></label>
          <button id="presentation-vectors-button" class="button secondary" type="button" aria-pressed="true">Vectors on</button>
          <button id="presentation-exit-button" class="button" type="button">Exit presentation</button>
        </div>

        <div class="viewport-shell">
          <div id="force-lab-viewport" class="viewport force-lab-viewport"></div>
          <div id="vector-lab-viewport" class="viewport vector-lab-viewport"></div>
          <div id="stress-viewport" class="viewport stress-viewport"></div>
          <div id="interaction-hint" class="interaction-hint"></div>
          <div class="scene-legend" aria-label="Scene color and symbol key"></div>
        </div>

        <div id="response-strip" class="response-strip" aria-live="polite">
          <div class="response-copy"><span class="metric-label">Characteristic response</span><strong id="response-text"></strong></div>
          <div class="metric"><span id="magnitude-label" class="metric-label">Magnitude</span><strong id="magnitude-metric"></strong></div>
          <div class="metric"><span id="volume-label" class="metric-label">Volume change</span><strong id="volume-metric"></strong></div>
        </div>
      </section>

      <aside class="panel lesson-panel" aria-label="Guided lesson">
        <div class="lesson-progress-header">
          <label class="lesson-picker" for="lesson-select"><span>Lesson</span><select id="lesson-select"></select></label>
          <div><p id="lesson-unit-label" class="section-kicker"></p><strong id="lesson-progress-label"></strong></div>
          <div class="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="1"><span></span></div>
        </div>
        <div id="lesson-card" class="lesson-card" aria-live="polite"></div>
        <details class="syllabus">
          <summary>View all steps in this lesson</summary>
          <div id="lesson-step-list" class="lesson-step-list" role="group" aria-label="Lesson steps"></div>
        </details>
      </aside>

      <aside class="panel inspector-panel" aria-labelledby="controls-heading">
        <div class="panel-heading">
          <div><p class="section-kicker">Stress controls</p><h2 id="controls-heading">Modify the state</h2></div>
          <button id="reset-all-button" class="text-button" type="button">Reset</button>
        </div>
        <div class="control-group">
          <div class="control-label-row"><label for="magnitude-input">Preset magnitude</label><output id="magnitude-output" for="magnitude-input">28 MPa</output></div>
          <input id="magnitude-input" class="range" type="range" min="5" max="60" step="1" value="28" />
          <div class="range-scale"><span>5 MPa</span><span>60 MPa</span></div>
        </div>
        <div class="control-group">
          <div class="control-label-row"><label for="exaggeration-input">Visual exaggeration</label><output id="exaggeration-output" for="exaggeration-input">1.2×</output></div>
          <input id="exaggeration-input" class="range" type="range" min="0.5" max="2.5" step="0.1" value="1.2" />
          <div class="range-scale"><span>Subtle</span><span>High</span></div>
        </div>
        <fieldset class="display-options">
          <legend>Display</legend>
          <label class="switch-row"><span><strong>Stress vectors</strong><small>Show face-oriented arrows</small></span><input id="vectors-toggle" type="checkbox" checked /></label>
          <label class="switch-row"><span><strong>Reference outline</strong><small>Compare original geometry</small></span><input id="outline-toggle" type="checkbox" checked /></label>
          <label class="switch-row"><span><strong>Axes and grid</strong><small>Keep spatial reference visible</small></span><input id="grid-toggle" type="checkbox" checked /></label>
        </fieldset>
        <div class="tensor-card" aria-labelledby="tensor-heading">
          <div class="tensor-heading-row"><div><span class="metric-label">Current tensor</span><h3 id="tensor-heading">σ (MPa)</h3></div><span id="tensor-mode" class="mode-badge">Preset</span></div>
          <div id="tensor-matrix" class="tensor-matrix" aria-label="Three by three stress tensor"></div>
        </div>
        <details class="component-details">
          <summary>Fine-tune tensor components</summary>
          <p>Editing a component creates a modified version of the selected preset.</p>
          <div id="component-controls" class="component-controls"></div>
        </details>
        <div class="scope-note"><span aria-hidden="true">i</span><p><strong>Qualitative response.</strong> Loading is defined numerically; deformation remains an exaggerated teaching model.</p></div>
      </aside>
    </main>
  </div>
`;

const elements = {
  appShell: document.querySelector('.app-shell'),
  modeButtons: [...document.querySelectorAll('.mode-button')],
  moduleChipLabel: document.querySelector('#module-chip-label'),
  moduleChipValue: document.querySelector('#module-chip-value'),
  presetGrid: document.querySelector('#preset-grid'),
  lessonSelect: document.querySelector('#lesson-select'),
  lessonUnitLabel: document.querySelector('#lesson-unit-label'),
  lessonStepList: document.querySelector('#lesson-step-list'),
  lessonCard: document.querySelector('#lesson-card'),
  lessonPanel: document.querySelector('.lesson-panel'),
  syllabus: document.querySelector('.syllabus'),
  lessonProgressLabel: document.querySelector('#lesson-progress-label'),
  lessonProgress: document.querySelector('.lesson-progress'),
  activeName: document.querySelector('#active-state-name'),
  activeNumber: document.querySelector('#active-number'),
  interactionHint: document.querySelector('#interaction-hint'),
  sceneLegend: document.querySelector('.scene-legend'),
  responseText: document.querySelector('#response-text'),
  magnitudeInput: document.querySelector('#magnitude-input'),
  magnitudeOutput: document.querySelector('#magnitude-output'),
  magnitudeLabel: document.querySelector('#magnitude-label'),
  magnitudeMetric: document.querySelector('#magnitude-metric'),
  volumeLabel: document.querySelector('#volume-label'),
  volumeMetric: document.querySelector('#volume-metric'),
  exaggerationInput: document.querySelector('#exaggeration-input'),
  exaggerationOutput: document.querySelector('#exaggeration-output'),
  replayButton: document.querySelector('#replay-button'),
  resetViewButton: document.querySelector('#reset-view-button'),
  resetAllButton: document.querySelector('#reset-all-button'),
  vectorsToggle: document.querySelector('#vectors-toggle'),
  outlineToggle: document.querySelector('#outline-toggle'),
  gridToggle: document.querySelector('#grid-toggle'),
  tensorMatrix: document.querySelector('#tensor-matrix'),
  tensorMode: document.querySelector('#tensor-mode'),
  componentControls: document.querySelector('#component-controls'),
  presentationStateSelect: document.querySelector('#presentation-state-select'),
  presentationMagnitudeInput: document.querySelector('#presentation-magnitude-input'),
  presentationMagnitudeOutput: document.querySelector('#presentation-magnitude-output'),
  presentationVectorsButton: document.querySelector('#presentation-vectors-button'),
  presentationExitButton: document.querySelector('#presentation-exit-button'),
  forceLabViewport: document.querySelector('#force-lab-viewport'),
  vectorLabViewport: document.querySelector('#vector-lab-viewport'),
  stressViewport: document.querySelector('#stress-viewport'),
};

const state = {
  mode: 'guided',
  presentSource: 'explore',
  selectedId: DEFAULT_STATE_ID,
  magnitude: DEFAULT_MAGNITUDE,
  exaggeration: DEFAULT_EXAGGERATION,
  stress: scalePreset(getStressState(DEFAULT_STATE_ID), DEFAULT_MAGNITUDE),
  customized: false,
  lessonId: DEFAULT_LESSON_ID,
  lessonStepIndex: 0,
  maxLessonStepVisited: 0,
  lessonChoiceId: null,
  lessonChoiceCorrect: false,
  lessonAnswerText: '',
  lessonFeedback: '',
  forceVector: { ...DEFAULT_FORCE },
  surfaceNormal: { ...DEFAULT_NORMAL },
  contactArea: DEFAULT_AREA,
  vectorLab: structuredClone(DEFAULT_VECTOR_LAB),
};

function currentLesson() {
  return getLesson(state.lessonId);
}

function currentStep() {
  return getLessonStep(currentLesson(), state.lessonStepIndex);
}

function unitOf(lesson) {
  return UNITS.find((unit) => unit.number === lesson.unit);
}

/** Guided mode, or Present mode entered from Guided, shows the current lesson. */
function isLessonView() {
  return state.mode === 'guided' || (state.mode === 'present' && state.presentSource === 'guided');
}

function isForceLabStep() {
  return isLessonView() && currentStep().visualKind === 'force-lab';
}

function isVectorLabStep() {
  return isLessonView() && currentStep().visualKind === 'vector-lab';
}

function isLabStep() {
  return isForceLabStep() || isVectorLabStep();
}

function quantityFor(step) {
  return QUANTITIES[step.quantity] ?? QUANTITIES.force;
}

const stressScene = new StressScene(elements.stressViewport, {
  onVolumeChange: (value) => {
    if (isForceLabStep()) return;
    const sign = value > 0.05 ? '+' : '';
    elements.volumeMetric.textContent = `ΔV ${sign}${value.toFixed(1)}%`;
    elements.volumeMetric.dataset.direction = value > 0.05 ? 'increase' : value < -0.05 ? 'decrease' : 'neutral';
  },
});

const forceLabScene = new ForceLabScene(elements.forceLabViewport, {
  onForceChange: (forceVector) => {
    state.forceVector = Object.fromEntries(Object.entries(forceVector).map(([axis, value]) => [axis, Math.round(value / 10) * 10]));
    syncForceLabReadouts();
  },
  onSurfaceChange: (surfaceNormal) => {
    state.surfaceNormal = surfaceNormal;
    syncForceLabReadouts();
  },
  onHover: (ref) => {
    if (!isForceLabStep()) return;
    forceLabScene.highlight(ref);
    markEquationRefs(ref);
  },
});

const vectorLabScene = new VectorScene(elements.vectorLabViewport, {
  onVectorChange: (key, value) => {
    const lab = state.vectorLab;
    // In the 2D view the scene works with z = 0; keep the stored z for the jump back to 3D.
    lab[key] = lab.dimension === 2 ? { ...value, z: lab[key].z } : value;
    syncVectorLab();
  },
  onHover: (ref) => {
    if (!isVectorLabStep()) return;
    vectorLabScene.highlight(ref);
    markEquationRefs(ref);
  },
});

/** The vectors the student currently sees: z is hidden (zero) in the 2D view. */
function vectorLabVectors() {
  const lab = state.vectorLab;
  const flatten = (vector) => (lab.dimension === 2 ? { ...vector, z: 0 } : vector);
  const v = flatten(lab.v);
  const b = flatten(lab.b);
  return { v, b, sum: add(v, b), scalar: lab.scalar, dimension: lab.dimension };
}

function forceMagnitude() {
  return Math.hypot(state.forceVector.x, state.forceVector.y, state.forceVector.z);
}

function formatQuantity(value, quantity, decimals = 2) {
  return `${(value / quantity.divisor).toFixed(decimals)}${quantity.unit ? ` ${quantity.unit}` : ''}`;
}

function vectorText(vector, divisor = 1, decimals = 2) {
  return `(${(vector.x / divisor).toFixed(decimals)}, ${(vector.y / divisor).toFixed(decimals)}, ${(vector.z / divisor).toFixed(decimals)})`;
}

function getTangent(normal) {
  const reference = Math.abs(normal.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const tangent = {
    x: normal.y * reference.z - normal.z * reference.y,
    y: normal.z * reference.x - normal.x * reference.z,
    z: normal.x * reference.y - normal.y * reference.x,
  };
  const length = Math.hypot(tangent.x, tangent.y, tangent.z) || 1;
  return { x: tangent.x / length, y: tangent.y / length, z: tangent.z / length };
}

function tensorCellsMarkup(stress) {
  return tensorToMatrix(stress).flat().map((value) => {
    const safe = Math.abs(value) < 0.05 ? 0 : value;
    return `<span data-kind="${safe > 0 ? 'compression' : safe < 0 ? 'tension' : 'zero'}">${safe.toFixed(1)}</span>`;
  }).join('');
}

function renderPresets() {
  elements.presetGrid.innerHTML = STRESS_STATES.map((preset) => `
    <button class="preset-card${preset.id === state.selectedId ? ' is-active' : ''}" type="button" data-state-id="${preset.id}" aria-pressed="${preset.id === state.selectedId}">
      <span class="preset-topline"><span class="preset-index">${String(preset.number).padStart(2, '0')}</span><span class="preset-family">${preset.family}</span></span>
      <span class="preset-glyph" aria-hidden="true">${preset.glyph}</span><strong>${preset.name}</strong>
    </button>`).join('');
  for (const button of elements.presetGrid.querySelectorAll('.preset-card')) button.addEventListener('click', () => selectPreset(button.dataset.stateId));
}

function renderLessonPicker() {
  const statusNote = { planned: ' (planned)', seed: ' (preview)', built: '' };
  elements.lessonSelect.innerHTML = UNITS.map((unit) => `
    <optgroup label="Unit ${unit.number} · ${unit.title}">
      ${LESSONS.filter((lesson) => lesson.unit === unit.number).map((lesson) => `
        <option value="${lesson.id}"${isLessonAvailable(lesson) ? '' : ' disabled'}>${lesson.id} · ${lesson.title}${statusNote[lesson.status]}</option>`).join('')}
    </optgroup>`).join('');
  elements.lessonSelect.value = state.lessonId;
}

function renderLessonSidebar() {
  elements.lessonStepList.innerHTML = currentLesson().steps.map((step, index) => `
    <button class="lesson-step${index === state.lessonStepIndex ? ' is-active' : ''}${index < state.maxLessonStepVisited ? ' is-complete' : ''}" type="button" data-step-index="${index}" aria-current="${index === state.lessonStepIndex ? 'step' : 'false'}">
      <span class="lesson-step-number">${index < state.maxLessonStepVisited ? '✓' : String(index + 1).padStart(2, '0')}</span><span>${step.label}</span>
    </button>`).join('');
  for (const button of elements.lessonStepList.querySelectorAll('.lesson-step')) button.addEventListener('click', () => applyLessonStep(Number(button.dataset.stepIndex)));
}

function renderComponentControls() {
  elements.componentControls.innerHTML = COMPONENTS.map(({ key, label, longLabel }) => `
    <div class="component-control"><div class="control-label-row compact"><label for="component-${key}" aria-label="${longLabel}">${label}</label><output id="component-${key}-output" for="component-${key}">0.0</output></div>
      <input id="component-${key}" class="range component-range" data-component="${key}" type="range" min="-60" max="60" step="1" value="0" aria-label="${longLabel} in megapascals" /></div>`).join('');
  for (const input of elements.componentControls.querySelectorAll('input')) {
    input.addEventListener('input', () => {
      state.stress = { ...state.stress, [input.dataset.component]: Number(input.value) };
      state.customized = true;
      stressScene.setStress(state.stress);
      syncStressReadouts();
    });
  }
}

function renderPresentationOptions() {
  elements.presentationStateSelect.innerHTML = STRESS_STATES.map((preset) => `<option value="${preset.id}">${String(preset.number).padStart(2, '0')} · ${preset.name}</option>`).join('');
}

function stepNumber(index = state.lessonStepIndex) {
  return `${state.lessonId}.${index + 1}`;
}

/* ---------- Equation–model binding panel ---------- */

function equationPanelMarkup(step) {
  if (!step.equations?.length) return '';
  const symbols = [];
  for (const equation of step.equations) {
    for (const symbol of equation.symbols) {
      if (!symbols.some((existing) => existing.symbol === symbol.symbol && existing.sceneRef === symbol.sceneRef)) symbols.push(symbol);
    }
  }
  const key = symbols.length ? `
    <dl class="equation-key" aria-label="What each symbol is in the scene">
      ${symbols.map((symbol) => `<div data-scene-ref="${symbol.sceneRef}"><dt><var>${symbol.symbol}</var></dt><dd>${symbol.description}</dd></div>`).join('')}
    </dl>` : '';
  return `
    <section class="equation-panel" aria-label="Equations">
      ${step.equations.map((equation) => `<div class="equation-line" data-equation-id="${equation.id}">${equation.html}</div>`).join('')}
      ${key}
    </section>`;
}

function markEquationRefs(ref) {
  for (const element of elements.lessonCard.querySelectorAll('.equation-panel [data-scene-ref]')) {
    element.classList.toggle('is-highlighted', ref !== null && element.dataset.sceneRef === ref);
  }
  elements.lessonCard.querySelector('.equation-panel')?.classList.toggle('has-highlight', Boolean(ref));
}

function setSceneHighlight(ref) {
  forceLabScene.highlight(isForceLabStep() ? ref : null);
  vectorLabScene.highlight(isVectorLabStep() ? ref : null);
  markEquationRefs(ref);
}

function bindEquationPanel() {
  for (const element of elements.lessonCard.querySelectorAll('.equation-panel [data-scene-ref]')) {
    if (element.tagName === 'VAR') {
      element.tabIndex = 0;
      const symbol = currentStep().equations.flatMap((equation) => equation.symbols).find((candidate) => candidate.sceneRef === element.dataset.sceneRef);
      if (symbol) element.setAttribute('aria-label', `${element.textContent}: ${symbol.description}`);
    }
    element.addEventListener('pointerenter', () => setSceneHighlight(element.dataset.sceneRef));
    element.addEventListener('pointerleave', () => setSceneHighlight(null));
    element.addEventListener('focus', () => setSceneHighlight(element.dataset.sceneRef));
    element.addEventListener('blur', () => setSceneHighlight(null));
  }
}

function bracketNegative(value) {
  const text = formatNumber(value);
  return value < 0 && text !== '0' ? `(${text})` : text;
}

/** "3 î − 4 ĵ + 0 k̂": the component form written with the unit vectors. */
function basisForm(vector, dimension) {
  const terms = [['x', 'î'], ['y', 'ĵ'], ['z', 'k̂']].slice(0, dimension);
  return terms.map(([axis, basis], index) => {
    const value = vector[axis];
    if (index === 0) return `${formatNumber(value)} ${basis}`;
    return `${value < 0 ? '−' : '+'} ${formatNumber(Math.abs(value))} ${basis}`;
  }).join(' ');
}

function vectorLabLiveValues() {
  const { v, b, sum, scalar, dimension } = vectorLabVectors();
  const length = magnitude(v);
  const unit = length > 1e-9 ? scale(v, 1 / length) : null;
  const scaled = scale(v, scalar);
  const stack = (axis) => `${formatNumber(v[axis])} + ${bracketNegative(b[axis])} = ${formatNumber(sum[axis])}`;
  return {
    v: formatVector(v, { dimension }),
    vx2: formatSquared(v.x),
    vy2: formatSquared(v.y),
    vz2: formatSquared(v.z),
    magnitude: formatNumber(length),
    basisForm: basisForm(v, dimension),
    dSquared: formatNumber(v.x ** 2 + v.y ** 2),
    d: formatNumber(xyMagnitude(v)),
    unit: unit ? formatVector(unit) : 'undefined: v has no direction when it is zero',
    unitMagnitude: unit ? formatNumber(magnitude(unit)) : '—',
    sum: formatVector(sum),
    stackX: stack('x'),
    stackY: stack('y'),
    stackZ: stack('z'),
    scaled: formatVector(scaled),
    absC: formatNumber(Math.abs(scalar)),
    scaledMagnitude: formatNumber(magnitude(scaled)),
  };
}

function liveValues() {
  if (isVectorLabStep()) return vectorLabLiveValues();
  if (!isForceLabStep()) return {};
  const quantity = quantityFor(currentStep());
  const result = decomposeTraction(state.forceVector, state.contactArea, state.surfaceNormal);
  return {
    magnitude: formatQuantity(forceMagnitude(), quantity),
    traction: `${result.tractionMagnitude.toFixed(3)} MPa`,
    tractionConversion: `${Math.round(forceMagnitude()).toLocaleString('en-US')} N / ${(state.contactArea / 10_000).toFixed(4)} m²`,
    normalTraction: `${result.normalTraction.toFixed(3)} MPa`,
    shearMagnitude: `${result.shearMagnitude.toFixed(3)} MPa`,
  };
}

function syncEquationValues() {
  const values = liveValues();
  // Values a step asks students to predict stay hidden until the prediction is right.
  const hidden = new Set(isLessonView() && !state.lessonChoiceCorrect ? currentStep().revealAfterAnswer ?? [] : []);
  for (const element of elements.lessonCard.querySelectorAll('[data-live]')) {
    const isHidden = hidden.has(element.dataset.live);
    element.textContent = isHidden ? '?' : values[element.dataset.live] ?? '—';
    element.classList.toggle('is-hidden-value', isHidden);
    if (isHidden) element.setAttribute('aria-label', 'hidden until you answer');
    else element.removeAttribute('aria-label');
  }
  for (const element of elements.lessonCard.querySelectorAll('[data-live-html="tensor"]')) {
    element.classList.add('tensor-matrix');
    element.setAttribute('aria-label', 'Three by three stress tensor in megapascals');
    element.innerHTML = tensorCellsMarkup(state.stress);
  }
}

/* ---------- Force-lab controls ---------- */

function forceControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const quantity = quantityFor(step);
  const componentFields = controls.has('components') ? `
    <fieldset class="vector-inputs"><legend>${quantity.name} components${quantity.unit ? ` <span>${quantity.unit}</span>` : ''}</legend><div>
      ${['x', 'y', 'z'].map((axis) => `<label><span>${quantity.symbol}<sub>${axis}</sub></span><input id="force-${axis}-input" data-force-axis="${axis}" type="number" min="-10" max="10" step="0.25" value="${(state.forceVector[axis] / quantity.divisor).toFixed(2)}" /></label>`).join('')}
    </div></fieldset>` : '';
  const magnitudeControl = controls.has('magnitude') ? `
    <label class="lab-control" for="force-magnitude-input"><span>${quantity.name} magnitude <output id="force-magnitude-output">${formatQuantity(forceMagnitude(), quantity)}</output></span><input id="force-magnitude-input" class="range" type="range" min="1000" max="10000" step="100" value="${forceMagnitude()}" /></label>` : '';
  const areaControl = controls.has('area') ? `
    <label class="lab-control" for="contact-area-input"><span>Contact area <output id="contact-area-output">${state.contactArea} cm²</output></span><input id="contact-area-input" class="range" type="range" min="25" max="200" step="5" value="${state.contactArea}" /></label>` : '';
  const presets = controls.has('presets') ? `
    <div class="direction-control"><span>Quick directions</span><div class="segmented-control four-up" role="group" aria-label="Force direction relative to selected surface">
      <button type="button" data-force-preset="compression">Compression</button><button type="button" data-force-preset="tension">Tension</button><button type="button" data-force-preset="tangential">Tangential</button><button type="button" data-force-preset="oblique">Oblique</button>
    </div></div>` : '';
  return `<div class="lab-controls">${magnitudeControl}${componentFields}${areaControl}${presets}</div>`;
}

function forceReadoutsMarkup(step) {
  const quantity = quantityFor(step);
  const cards = [
    `<div><span>${quantity.name}, ${quantity.symbol}</span><strong id="force-vector-readout">${vectorText(state.forceVector, quantity.divisor)}${quantity.unit ? ` ${quantity.unit}` : ''}</strong></div>`,
  ];
  if (step.spotlight !== 'force') cards.push(`<div><span>Surface normal, n</span><strong id="surface-normal-readout">${vectorText(state.surfaceNormal, 1, 0)}</strong></div>`);
  if (['area', 'traction', 'decomposition'].includes(step.spotlight)) cards.push(`<div><span>Average traction, |t̄|</span><strong id="traction-readout">0.000 MPa</strong></div>`);
  if (step.spotlight === 'decomposition') {
    cards.push(`<div class="normal-readout"><span>Signed normal traction, t<sub>n</sub></span><strong id="normal-stress-readout">0.000 MPa</strong></div>`);
    cards.push(`<div class="shear-readout"><span>Shear magnitude, |τ|</span><strong id="shear-stress-readout">0.000 MPa</strong></div>`);
  }
  return `<div class="lab-readouts">${cards.join('')}</div>`;
}

/* ---------- Vector-lab controls ---------- */

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

function vectorInputsMarkup(key, name, symbol) {
  const vector = state.vectorLab[key];
  return `
    <fieldset class="vector-inputs"><legend>${name} components</legend><div>
      ${['x', 'y', 'z'].map((axis) => `<label data-axis-field="${axis}"><span>${symbol}<sub>${axis}</sub></span><input data-vector-key="${key}" data-axis="${axis}" type="number" min="${-COMPONENT_LIMIT}" max="${COMPONENT_LIMIT}" step="0.5" value="${vector[axis]}" aria-label="${name}, ${axis} component" /></label>`).join('')}
    </div></fieldset>`;
}

function vectorLabControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const lab = state.vectorLab;
  const parts = [];
  if (controls.has('dimension')) {
    parts.push(`
      <div class="direction-control"><span>View</span><div class="segmented-control two-up" role="group" aria-label="Number of dimensions">
        <button type="button" data-dimension="2" aria-pressed="${lab.dimension === 2}">2D: the x–y plane</button>
        <button type="button" data-dimension="3" aria-pressed="${lab.dimension === 3}">3D: add z</button>
      </div></div>`);
  }
  if (controls.has('components')) parts.push(vectorInputsMarkup('v', 'Vector v', 'v'));
  if (controls.has('components-a')) parts.push(vectorInputsMarkup('v', 'Vector a', 'a'));
  if (controls.has('components-b')) parts.push(vectorInputsMarkup('b', 'Vector b', 'b'));
  if (controls.has('scalar')) {
    parts.push(`<label class="lab-control" for="scalar-input"><span>Scale factor c <output id="scalar-output">${formatNumber(lab.scalar)}</output></span><input id="scalar-input" class="range" type="range" min="-2" max="3" step="0.1" value="${lab.scalar}" /></label>`);
  }
  if (controls.has('context')) {
    parts.push(`
      <div class="direction-control"><span>Geological example</span><div class="segmented-control context-control" role="group" aria-label="Geological example">
        ${step.contexts.map((context) => `<button type="button" data-context="${context.id}" aria-pressed="${lab.context === context.id}">${context.label}<small>more in ${context.usedIn}</small></button>`).join('')}
      </div></div>`);
  }
  return `<div class="lab-controls">${parts.join('')}</div>`;
}

function goalMarkup(step) {
  if (!step.goal) return '';
  return `<div id="goal-card" class="goal-card"><span>Goal</span><p>${step.goal.text}</p><strong id="goal-status" role="status"></strong></div>`;
}

function bindVectorLabControls() {
  const lab = () => state.vectorLab;
  for (const input of elements.lessonCard.querySelectorAll('[data-vector-key]')) {
    input.addEventListener('input', () => {
      const value = Number(input.value);
      if (input.value === '' || !Number.isFinite(value)) return;
      const clamped = Math.min(COMPONENT_LIMIT, Math.max(-COMPONENT_LIMIT, value));
      lab()[input.dataset.vectorKey] = { ...lab()[input.dataset.vectorKey], [input.dataset.axis]: clamped };
      syncVectorLab();
    });
    input.addEventListener('change', () => syncVectorLab({ refreshInputs: true }));
  }
  for (const button of elements.lessonCard.querySelectorAll('[data-dimension]')) {
    button.addEventListener('click', () => {
      lab().dimension = Number(button.dataset.dimension);
      syncVectorLab();
      syncAll();
    });
  }
  elements.lessonCard.querySelector('#scalar-input')?.addEventListener('input', (event) => {
    lab().scalar = Number(event.target.value);
    syncVectorLab();
  });
  for (const button of elements.lessonCard.querySelectorAll('[data-context]')) {
    button.addEventListener('click', () => {
      const context = currentStep().contexts.find((candidate) => candidate.id === button.dataset.context);
      lab().context = context.id;
      lab().v = { ...context.vector };
      syncVectorLab({ refreshInputs: true });
    });
  }
}

function initVectorLab(step) {
  const initial = step.initialLabState ?? {};
  state.vectorLab = {
    v: { ...(initial.v ?? DEFAULT_VECTOR_LAB.v) },
    b: { ...(initial.b ?? DEFAULT_VECTOR_LAB.b) },
    scalar: initial.scalar ?? DEFAULT_VECTOR_LAB.scalar,
    context: initial.context ?? null,
    dimension: step.dimension ?? 3,
  };
}

function syncVectorLab({ refreshInputs = false, animate = true } = {}) {
  if (!isVectorLabStep()) return;
  const step = currentStep();
  const lab = state.vectorLab;
  const current = vectorLabVectors();
  vectorLabScene.setDimension(lab.dimension, { animate, close: step.labOptions.view === 'close' });
  vectorLabScene.setState({
    vectors: { v: current.v, b: current.b },
    scalar: current.scalar,
    options: { ...step.labOptions, context: lab.context ?? step.labOptions.context ?? null },
  });
  for (const input of elements.lessonCard.querySelectorAll('[data-vector-key]')) {
    if (refreshInputs || document.activeElement !== input) input.value = String(lab[input.dataset.vectorKey][input.dataset.axis]);
    if (input.dataset.axis === 'z') input.closest('label').hidden = lab.dimension === 2;
  }
  for (const button of elements.lessonCard.querySelectorAll('[data-dimension]')) button.setAttribute('aria-pressed', String(Number(button.dataset.dimension) === lab.dimension));
  for (const button of elements.lessonCard.querySelectorAll('[data-context]')) button.setAttribute('aria-pressed', String(button.dataset.context === lab.context));
  setText('#scalar-output', formatNumber(lab.scalar));
  const goalCard = elements.lessonCard.querySelector('#goal-card');
  if (goalCard) {
    const met = isGoalMet(step, current);
    goalCard.dataset.met = String(met);
    setText('#goal-status', met ? '✓ Goal reached' : 'Not yet');
  }
  syncEquationValues();
}

function resetVectorLab() {
  initVectorLab(currentStep());
  syncVectorLab({ refreshInputs: true });
  syncAll();
}

function predictionMarkup(step) {
  if (step.choices?.length) {
    return `
    <fieldset class="prediction-group"><legend>${step.prompt}</legend><div class="prediction-options">
      ${step.choices.map((choice) => `<button class="prediction-button${state.lessonChoiceId === choice.id ? ' is-selected' : ''}${state.lessonChoiceId === choice.id && choice.correct ? ' is-correct' : ''}" type="button" data-choice-id="${choice.id}" aria-pressed="${state.lessonChoiceId === choice.id}">${choice.label}</button>`).join('')}
    </div><p class="prediction-feedback${state.lessonChoiceId ? ' is-visible' : ''}" role="status">${state.lessonChoiceId ? step.choices.find((choice) => choice.id === state.lessonChoiceId).feedback : 'Choose an answer when you are ready.'}</p></fieldset>`;
  }
  if (step.answer) {
    const solved = state.lessonChoiceCorrect;
    return `
    <fieldset class="prediction-group"><legend><label for="numeric-answer-input">${step.prompt}</label></legend>
      <form id="numeric-answer-form" class="numeric-answer" novalidate>
        <input id="numeric-answer-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${escapeHtml(state.lessonAnswerText)}" ${solved ? 'readonly' : ''} />
        <button class="button secondary" type="submit" ${solved ? 'disabled' : ''}>Check</button>
      </form>
      <p class="prediction-feedback${state.lessonFeedback ? ' is-visible' : ''}${solved ? ' is-correct' : ''}" role="status">${state.lessonFeedback || 'Type a number, then press Check or Enter.'}</p></fieldset>`;
  }
  return '';
}

function submitNumericAnswer(raw) {
  const result = checkNumericAnswer(currentStep(), raw);
  state.lessonAnswerText = raw;
  state.lessonFeedback = result.feedback;
  if (result.correct) state.lessonChoiceCorrect = true;
  renderLessonPanel();
  syncAll();
  if (!result.correct) elements.lessonCard.querySelector('#numeric-answer-input')?.focus();
}

function nextAction(step) {
  const lesson = currentLesson();
  if (state.lessonStepIndex < lesson.steps.length - 1) return { label: 'Continue', run: () => applyLessonStep(state.lessonStepIndex + 1) };
  const nextLesson = step.final ? null : getNextAvailableLesson(lesson.id);
  if (nextLesson) return { label: `Next lesson: ${nextLesson.id}`, run: () => loadLesson(nextLesson.id) };
  return { label: 'Open Explore', run: () => setMode('explore') };
}

function canAdvance(step) {
  return !hasPrediction(step) || state.lessonChoiceCorrect;
}

function renderLessonPanel() {
  const step = currentStep();
  const next = nextAction(step);
  const choices = predictionMarkup(step);
  const labContent = {
    'force-lab': () => `${forceControlsMarkup(step)}${forceReadoutsMarkup(step)}`,
    'vector-lab': () => `${vectorLabControlsMarkup(step)}${goalMarkup(step)}`,
  }[step.visualKind]?.() ?? '';

  elements.lessonCard.innerHTML = `
    <div class="lesson-heading"><span class="step-badge">${stepNumber()}</span><h2>${step.title}</h2><p>${step.body}</p></div>
    ${step.task ? `<div class="task-card"><span>Try it</span><p>${step.task}</p></div>` : ''}
    ${equationPanelMarkup(step)}${labContent}${choices}
    <div class="lesson-actions"><button id="lesson-back-button" class="button secondary" type="button" ${state.lessonStepIndex === 0 ? 'disabled' : ''}>Back</button><button id="lesson-next-button" class="button" type="button" ${canAdvance(step) ? '' : 'disabled'}>${next.label}</button></div>`;

  for (const button of elements.lessonCard.querySelectorAll('.prediction-button')) button.addEventListener('click', () => chooseLessonAnswer(button.dataset.choiceId));
  elements.lessonCard.querySelector('#numeric-answer-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    submitNumericAnswer(elements.lessonCard.querySelector('#numeric-answer-input').value);
  });
  elements.lessonCard.querySelector('#lesson-back-button').addEventListener('click', goBack);
  elements.lessonCard.querySelector('#lesson-next-button').addEventListener('click', () => next.run());
  forceLabScene.highlight(null);
  vectorLabScene.highlight(null);
  bindEquationPanel();
  bindForceLabControls();
  bindVectorLabControls();
  syncForceLabReadouts();
  syncVectorLab();
  syncEquationValues();
}

function goBack() {
  if (state.lessonStepIndex > 0) applyLessonStep(state.lessonStepIndex - 1);
}

function goForward() {
  const step = currentStep();
  if (canAdvance(step)) nextAction(step).run();
}

function bindForceLabControls() {
  const magnitudeInput = elements.lessonCard.querySelector('#force-magnitude-input');
  magnitudeInput?.addEventListener('input', (event) => {
    const current = forceMagnitude();
    const direction = current > 1 ? Object.fromEntries(Object.entries(state.forceVector).map(([axis, value]) => [axis, value / current])) : { x: 0, y: -1, z: 0 };
    const nextMagnitude = Number(event.target.value);
    state.forceVector = Object.fromEntries(Object.entries(direction).map(([axis, value]) => [axis, value * nextMagnitude]));
    syncForceLabReadouts();
  });
  const areaInput = elements.lessonCard.querySelector('#contact-area-input');
  areaInput?.addEventListener('input', (event) => {
    state.contactArea = Number(event.target.value);
    syncForceLabReadouts();
  });
  for (const input of elements.lessonCard.querySelectorAll('[data-force-axis]')) {
    input.addEventListener('input', () => {
      state.forceVector = { ...state.forceVector, [input.dataset.forceAxis]: Number(input.value) * quantityFor(currentStep()).divisor };
      if (forceMagnitude() < 1) state.forceVector = { ...DEFAULT_FORCE };
      syncForceLabReadouts();
    });
  }
  for (const button of elements.lessonCard.querySelectorAll('[data-force-preset]')) button.addEventListener('click', () => setForcePreset(button.dataset.forcePreset));
}

function setForcePreset(preset) {
  const magnitude = Math.max(forceMagnitude(), 5_000);
  const normal = state.surfaceNormal;
  const tangent = getTangent(normal);
  if (preset === 'compression') state.forceVector = { x: -normal.x * magnitude, y: -normal.y * magnitude, z: -normal.z * magnitude };
  if (preset === 'tension') state.forceVector = { x: normal.x * magnitude, y: normal.y * magnitude, z: normal.z * magnitude };
  if (preset === 'tangential') state.forceVector = { x: tangent.x * magnitude, y: tangent.y * magnitude, z: tangent.z * magnitude };
  if (preset === 'oblique') {
    const factor = magnitude / Math.sqrt(2);
    state.forceVector = { x: (tangent.x - normal.x) * factor, y: (tangent.y - normal.y) * factor, z: (tangent.z - normal.z) * factor };
  }
  syncForceLabReadouts();
}

function setText(selector, value) {
  const element = elements.lessonCard.querySelector(selector);
  if (element) element.textContent = value;
}

function syncForceLabReadouts() {
  if (!isForceLabStep()) return;
  const step = currentStep();
  const quantity = quantityFor(step);
  const result = decomposeTraction(state.forceVector, state.contactArea, state.surfaceNormal);
  forceLabScene.setOptions(step.labOptions);
  forceLabScene.setForce(state.forceVector);
  forceLabScene.setArea(state.contactArea);
  forceLabScene.setSurfaceNormal(state.surfaceNormal);

  const magnitudeInput = elements.lessonCard.querySelector('#force-magnitude-input');
  if (magnitudeInput && document.activeElement !== magnitudeInput) magnitudeInput.value = String(forceMagnitude());
  setText('#force-magnitude-output', formatQuantity(forceMagnitude(), quantity));
  const areaInput = elements.lessonCard.querySelector('#contact-area-input');
  if (areaInput && document.activeElement !== areaInput) areaInput.value = String(state.contactArea);
  setText('#contact-area-output', `${state.contactArea} cm²`);
  for (const axis of ['x', 'y', 'z']) {
    const input = elements.lessonCard.querySelector(`#force-${axis}-input`);
    if (input && document.activeElement !== input) input.value = (state.forceVector[axis] / quantity.divisor).toFixed(2);
  }
  setText('#force-vector-readout', `${vectorText(state.forceVector, quantity.divisor)}${quantity.unit ? ` ${quantity.unit}` : ''}`);
  setText('#surface-normal-readout', vectorText(state.surfaceNormal, 1, 0));
  setText('#traction-readout', `${result.tractionMagnitude.toFixed(3)} MPa`);
  setText('#normal-stress-readout', `${result.normalTraction.toFixed(3)} MPa`);
  setText('#shear-stress-readout', `${result.shearMagnitude.toFixed(3)} MPa`);
  syncEquationValues();
}

/* ---------- Lesson flow ---------- */

function chooseLessonAnswer(choiceId) {
  const step = currentStep();
  state.lessonChoiceId = choiceId;
  state.lessonChoiceCorrect = isLessonChoiceCorrect(step, choiceId);
  if (state.lessonChoiceCorrect && step.visualKind === 'stress-state') stressScene.replay();
  renderLessonPanel();
  syncAll();
}

function loadLesson(id) {
  const lesson = getLesson(id);
  if (!lesson || !isLessonAvailable(lesson)) return;
  state.lessonId = id;
  state.lessonStepIndex = 0;
  state.maxLessonStepVisited = 0;
  elements.lessonSelect.value = id;
  applyLessonStep(0);
}

/** Reset the lesson state to the start of a step, then render it. */
function applyLessonStep(index) {
  const lesson = currentLesson();
  state.lessonStepIndex = Math.min(Math.max(index, 0), lesson.steps.length - 1);
  const step = currentStep();
  state.maxLessonStepVisited = Math.max(state.maxLessonStepVisited, state.lessonStepIndex);
  state.lessonChoiceId = null;
  state.lessonChoiceCorrect = !hasPrediction(step);
  state.lessonAnswerText = '';
  state.lessonFeedback = '';
  if (step.presetId) {
    state.selectedId = step.presetId;
    state.magnitude = step.magnitude;
    state.stress = scalePreset(getStressState(step.presetId), step.magnitude);
    state.customized = false;
    elements.vectorsToggle.checked = step.vectors;
    elements.outlineToggle.checked = step.outline;
    elements.gridToggle.checked = step.grid;
    stressScene.setShowVectors(step.vectors);
    stressScene.setShowOriginal(step.outline);
    stressScene.setShowGrid(step.grid);
    stressScene.setStress(state.stress);
  }
  const initial = step.initialLabState ?? {};
  if (step.visualKind === 'force-lab') {
    if (initial.forceVector) state.forceVector = { ...initial.forceVector };
    if (initial.surfaceNormal) state.surfaceNormal = { ...initial.surfaceNormal };
    if (initial.contactArea !== undefined) state.contactArea = initial.contactArea;
  }
  if (step.visualKind === 'vector-lab') {
    // Animate the 2D ↔ 3D camera only if the vector lab is already on screen.
    const labOnScreen = elements.appShell.dataset.visualKind === 'vector-lab' && isLessonView();
    initVectorLab(step);
    vectorLabScene.setDimension(state.vectorLab.dimension, { animate: labOnScreen, close: step.labOptions.view === 'close' });
  }
  if (step.visualKind === 'stress-state') stressScene.replay();
  renderLessonView();
}

/** Render the current lesson step without resetting its state. */
function renderLessonView() {
  const step = currentStep();
  elements.appShell.dataset.lessonStep = String(state.lessonStepIndex);
  elements.appShell.dataset.visualKind = step.visualKind;
  forceLabScene.setOptions(step.labOptions ?? {});
  renderLessonSidebar();
  renderLessonPanel();
  elements.syllabus.open = false;
  requestAnimationFrame(() => { elements.lessonPanel.scrollTop = 0; });
  syncAll();
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function restoreExploreDefaults() {
  state.selectedId = DEFAULT_STATE_ID;
  state.magnitude = DEFAULT_MAGNITUDE;
  state.stress = scalePreset(getStressState(DEFAULT_STATE_ID), DEFAULT_MAGNITUDE);
  state.customized = false;
  elements.vectorsToggle.checked = true;
  elements.outlineToggle.checked = true;
  elements.gridToggle.checked = true;
  stressScene.setShowVectors(true);
  stressScene.setShowOriginal(true);
  stressScene.setShowGrid(true);
  stressScene.setStress(state.stress, { immediate: true });
}

function setMode(mode) {
  const wasLessonView = isLessonView();
  const wasLab = isLabStep();
  if (mode === 'present' && state.mode !== 'present') state.presentSource = state.mode === 'guided' ? 'guided' : 'explore';
  state.mode = mode;
  const lessonView = isLessonView();
  elements.appShell.dataset.mode = mode;
  elements.appShell.dataset.lessonView = String(lessonView);
  for (const button of elements.modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (lessonView) {
    if (wasLessonView) renderLessonView();
    else applyLessonStep(state.lessonStepIndex);
  } else {
    elements.appShell.dataset.visualKind = 'stress-state';
    if (wasLab) restoreExploreDefaults();
    stressScene.setShowVectors(elements.vectorsToggle.checked);
    stressScene.setShowOriginal(elements.outlineToggle.checked);
    stressScene.setShowGrid(elements.gridToggle.checked);
    syncAll();
  }
  syncPresentationControls();
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function selectPreset(id) {
  state.selectedId = getStressState(id).id;
  state.stress = scalePreset(getStressState(id), state.magnitude || DEFAULT_MAGNITUDE);
  state.magnitude = state.magnitude || DEFAULT_MAGNITUDE;
  state.customized = false;
  stressScene.setStress(state.stress);
  syncAll();
}

function setMagnitude(value) {
  state.magnitude = Number(value);
  state.stress = scalePreset(getStressState(state.selectedId), state.magnitude);
  state.customized = false;
  stressScene.setStress(state.stress);
  syncAll();
}

function resetAll() {
  state.magnitude = DEFAULT_MAGNITUDE;
  state.exaggeration = DEFAULT_EXAGGERATION;
  state.stress = scalePreset(getStressState(state.selectedId), state.magnitude);
  state.customized = false;
  elements.vectorsToggle.checked = true;
  elements.outlineToggle.checked = true;
  elements.gridToggle.checked = true;
  stressScene.setExaggeration(DEFAULT_EXAGGERATION);
  stressScene.setShowVectors(true);
  stressScene.setShowOriginal(true);
  stressScene.setShowGrid(true);
  stressScene.setStress(state.stress);
  stressScene.replay();
  syncAll();
}

function resetForceLab() {
  const initial = currentStep().initialLabState ?? {};
  state.forceVector = { ...(initial.forceVector ?? DEFAULT_FORCE) };
  state.surfaceNormal = { ...(initial.surfaceNormal ?? DEFAULT_NORMAL) };
  state.contactArea = initial.contactArea ?? DEFAULT_AREA;
  syncForceLabReadouts();
}

function currentResponseText() {
  const preset = getStressState(state.selectedId);
  if (!isLessonView()) return preset.response;
  const step = currentStep();
  if (hasPrediction(step) && !state.lessonChoiceCorrect) return 'Use the lesson panel to make a prediction.';
  return step.responseOverride ?? preset.response;
}

function syncForceLabChrome(step) {
  const quantity = quantityFor(step);
  const hints = [`Drag white handle: ${quantity.name.toLowerCase()}`];
  if (step.labOptions.allowSurfaceSelection) hints.push('click a face: select surface');
  hints.push('drag empty space: orbit');
  elements.interactionHint.textContent = hints.join(' · ');
  const legend = [];
  if (step.labOptions.showSurfaceNormal || step.labOptions.showDecomposition) legend.push('<span class="legend-normal">Normal</span>');
  if (step.labOptions.showDecomposition) legend.push('<span class="legend-shear">Shear</span>');
  if (step.labOptions.showArea || step.labOptions.showDistribution) legend.push('<span class="legend-surface">Loaded area</span>');
  elements.sceneLegend.hidden = legend.length === 0;
  elements.sceneLegend.innerHTML = legend.join('');
}

const LEGEND_SWATCHES = {
  vector: ['#f4f5f7', 'solid'],
  b: ['#f0e442', 'dashed'],
  result: ['#3fd0a0', 'dotted'],
  x: ['#56b4e9', 'solid'],
  y: ['#e69f00', 'solid'],
  z: ['#cc79a7', 'solid'],
  guide: ['#c3c8d0', 'dashed'],
};

function legendItem(swatch, label) {
  const [color, pattern] = LEGEND_SWATCHES[swatch];
  return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
}

function syncVectorLabChrome(step) {
  const options = step.labOptions;
  const is3d = state.vectorLab.dimension === 3;
  elements.interactionHint.textContent = is3d
    ? 'Drag a round handle: move the tip across the floor · Shift + drag: up or down · drag empty space: orbit'
    : 'Drag the round handle to move the tip · scroll to zoom';
  const sum = options.layout === 'sum';
  const legend = [legendItem('vector', sum ? 'a' : 'v')];
  if (sum) legend.push(legendItem('b', 'b'), legendItem('result', 'a + b'));
  if (!sum && options.showComponents !== false) {
    legend.push(legendItem('x', 'v<sub>x</sub>'), legendItem('y', 'v<sub>y</sub>'));
    if (is3d) legend.push(legendItem('z', 'v<sub>z</sub>'));
  }
  if (options.showTriangles && is3d) legend.push(legendItem('guide', 'd'));
  if (options.showUnit) legend.push(legendItem('result', 'v̂'));
  if (options.showScaled) legend.push(legendItem('result', 'c v'));
  elements.sceneLegend.hidden = false;
  elements.sceneLegend.innerHTML = legend.join('');
}

function syncAll() {
  const preset = getStressState(state.selectedId);
  const lessonView = isLessonView();
  const lesson = currentLesson();
  const step = lessonView ? currentStep() : null;
  const unit = unitOf(lesson);
  elements.activeName.textContent = step?.activeLabel ?? (state.customized ? `Modified ${preset.name}` : preset.name);
  elements.activeNumber.textContent = step ? stepNumber() : String(preset.number).padStart(2, '0');
  elements.lessonUnitLabel.textContent = `Unit ${unit.number} · ${unit.title}`;
  elements.lessonProgressLabel.textContent = `${lesson.id} ${lesson.title} · Step ${state.lessonStepIndex + 1} of ${lesson.steps.length}`;
  elements.lessonProgress.setAttribute('aria-valuemax', String(lesson.steps.length));
  elements.lessonProgress.setAttribute('aria-valuenow', String(state.lessonStepIndex + 1));
  elements.lessonProgress.querySelector('span').style.width = `${((state.lessonStepIndex + 1) / lesson.steps.length) * 100}%`;
  elements.moduleChipLabel.textContent = lessonView ? 'Current unit' : 'Laboratory';
  elements.moduleChipValue.textContent = lessonView ? `${unit.number} · ${unit.title}` : 'Stress states';
  elements.responseText.textContent = currentResponseText();
  elements.magnitudeInput.value = String(Math.max(state.magnitude, 5));
  elements.magnitudeOutput.textContent = `${state.magnitude.toFixed(0)} MPa`;
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;

  const forceLabActive = isForceLabStep();
  const vectorLabActive = isVectorLabStep();
  if (forceLabActive) {
    syncForceLabChrome(step);
    syncForceLabReadouts();
  } else if (vectorLabActive) {
    syncVectorLabChrome(step);
  } else {
    elements.sceneLegend.hidden = true;
    elements.interactionHint.textContent = 'Drag to orbit · scroll to zoom';
    const volumeChange = volumeChangePercent(computeDeformation(state.stress, state.exaggeration).determinant);
    const sign = volumeChange > 0.05 ? '+' : '';
    elements.magnitudeLabel.textContent = 'Magnitude';
    elements.magnitudeMetric.textContent = formatStress(state.magnitude);
    elements.volumeLabel.textContent = 'Volume change';
    elements.volumeMetric.textContent = `ΔV ${sign}${volumeChange.toFixed(1)}%`;
    elements.volumeMetric.dataset.direction = volumeChange > 0.05 ? 'increase' : volumeChange < -0.05 ? 'decrease' : 'neutral';
  }
  forceLabScene.renderer.domElement.setAttribute('aria-hidden', String(!forceLabActive));
  vectorLabScene.renderer.domElement.setAttribute('aria-hidden', String(!vectorLabActive));
  stressScene.renderer.domElement.setAttribute('aria-hidden', String(forceLabActive || vectorLabActive));
  elements.replayButton.innerHTML = forceLabActive || vectorLabActive ? 'Reset values' : '<span aria-hidden="true">↻</span> Replay';
  for (const button of elements.presetGrid.querySelectorAll('.preset-card')) {
    const active = button.dataset.stateId === state.selectedId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  syncStressReadouts();
  syncPresentationControls();
  if (lessonView) syncEquationValues();
}

function syncStressReadouts() {
  const preset = getStressState(state.selectedId);
  if (!isLessonView()) elements.activeName.textContent = state.customized ? `Modified ${preset.name}` : preset.name;
  elements.tensorMode.textContent = state.customized ? 'Modified' : 'Preset';
  elements.tensorMode.classList.toggle('is-modified', state.customized);
  elements.tensorMatrix.innerHTML = tensorCellsMarkup(state.stress);
  for (const { key } of COMPONENTS) {
    document.querySelector(`#component-${key}`).value = String(state.stress[key]);
    document.querySelector(`#component-${key}-output`).textContent = state.stress[key].toFixed(1);
  }
}

function syncPresentationControls() {
  elements.presentationStateSelect.value = state.selectedId;
  elements.presentationMagnitudeInput.value = String(Math.max(state.magnitude, 5));
  elements.presentationMagnitudeOutput.textContent = `${state.magnitude.toFixed(0)} MPa`;
  elements.presentationVectorsButton.textContent = elements.vectorsToggle.checked ? 'Vectors on' : 'Vectors off';
  elements.presentationVectorsButton.setAttribute('aria-pressed', String(elements.vectorsToggle.checked));
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.matches('input, select, textarea') || target.isContentEditable);
}

for (const button of elements.modeButtons) button.addEventListener('click', () => setMode(button.dataset.mode));
elements.lessonSelect.addEventListener('change', (event) => loadLesson(event.target.value));
elements.magnitudeInput.addEventListener('input', (event) => setMagnitude(event.target.value));
elements.exaggerationInput.addEventListener('input', (event) => {
  state.exaggeration = Number(event.target.value);
  stressScene.setExaggeration(state.exaggeration);
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;
});
elements.replayButton.addEventListener('click', () => {
  if (isForceLabStep()) resetForceLab();
  else if (isVectorLabStep()) resetVectorLab();
  else stressScene.replay();
});
elements.resetViewButton.addEventListener('click', () => {
  if (isForceLabStep()) forceLabScene.resetCamera();
  else if (isVectorLabStep()) vectorLabScene.resetCamera();
  else stressScene.resetCamera();
});
elements.resetAllButton.addEventListener('click', resetAll);
elements.vectorsToggle.addEventListener('change', (event) => { stressScene.setShowVectors(event.target.checked); syncPresentationControls(); });
elements.outlineToggle.addEventListener('change', (event) => stressScene.setShowOriginal(event.target.checked));
elements.gridToggle.addEventListener('change', (event) => stressScene.setShowGrid(event.target.checked));
elements.presentationStateSelect.addEventListener('change', (event) => selectPreset(event.target.value));
elements.presentationMagnitudeInput.addEventListener('input', (event) => setMagnitude(event.target.value));
elements.presentationVectorsButton.addEventListener('click', () => {
  elements.vectorsToggle.checked = !elements.vectorsToggle.checked;
  stressScene.setShowVectors(elements.vectorsToggle.checked);
  syncPresentationControls();
});
elements.presentationExitButton.addEventListener('click', () => setMode('explore'));
window.addEventListener('keydown', (event) => {
  if (state.mode !== 'present') return;
  if (event.key === 'Escape') {
    setMode(state.presentSource);
    return;
  }
  if (!isLessonView() || isTypingTarget(event.target)) return;
  if (['ArrowRight', 'PageDown'].includes(event.key)) {
    event.preventDefault();
    goForward();
  } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    goBack();
  }
});

renderPresets();
renderLessonPicker();
renderComponentControls();
renderPresentationOptions();
loadLesson(DEFAULT_LESSON_ID);
