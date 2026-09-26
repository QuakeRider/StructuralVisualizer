import './styles.css';
import { COMPONENTS, STRESS_STATES, formatStress, getStressState, scalePreset } from './domain/stressStates.js';
import { computeDeformation, tensorToMatrix, volumeChangePercent } from './domain/deformation.js';
import { decomposeTraction } from './domain/forceStress.js';
import { formatNumber } from './domain/format.js';
import { ANDERSON_REGIMES, andersonAxes, andersonFaults, principalStressTensor } from './domain/anderson.js';
import {
  coulombAngles,
  dilationTendency,
  frictionCheck,
  newFaultSigma1,
  principalCosines,
  principalMagnitudes,
  reactivationSigma1,
} from './domain/failure.js';
import {
  auxiliaryPlane,
  classifySlip,
  faultFrame,
  kinematicAxes,
  lineRakeFromSlipRake,
  planeThrough,
  rakeFromSlip,
  resolvedShearDirection,
  slipComponents,
  slipFromRake,
  tiltAxes,
  traceSeparation,
  wellLog,
} from './domain/faults.js';
import { lineVector, normalizeAzimuth, planeFromStrike, planePole } from './domain/orientation.js';
import { lineFromVector, planeFromPole } from './domain/stereonet.js';
import { resolveTraction } from './domain/tensor.js';
import { basis, frac, hat, inline, mi, mn, mo, mtext, num, primed, row, signedTerm, squared, sub, tuple, vec } from './lessons/mathml.js';
import { add, directionAngles, dot, fromPolar, magnitude, polarAngle, rotate2D, scale, xyMagnitude } from './domain/vector.js';
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
import { AndersonScene } from './visualization/AndersonScene.js';
import { CurvePlot } from './visualization/CurvePlot.js';
import { FaultScene } from './visualization/FaultScene.js';
import { ForceLabScene } from './visualization/ForceLabScene.js';
import { FrictionMohrPlot } from './visualization/FrictionMohrPlot.js';
import { MohrPlot } from './visualization/MohrPlot.js';
import { Stereonet } from './visualization/Stereonet.js';
import { StressScene } from './visualization/StressScene.js';
import { VectorScene } from './visualization/VectorScene.js';
import { WellLog } from './visualization/WellLog.js';

const DEFAULT_STATE_ID = 'uniaxial-tension';
const DEFAULT_MAGNITUDE = 28;
const DEFAULT_EXAGGERATION = 1.2;
const DEFAULT_FORCE = { x: 0, y: -5_000, z: 0 };
const DEFAULT_NORMAL = { x: 0, y: 1, z: 0 };
const DEFAULT_AREA = 100;
const DEFAULT_VECTOR_LAB = { v: { x: 3, y: 2, z: 0 }, b: { x: 1, y: 2, z: 0 }, scalar: 2, theta: 0, context: null, dimension: 3 };
const DEFAULT_ANDERSON = { regime: 'normal', mu: 0.6, slipped: false, setting: null };
const DEFAULT_FRICTION = { regime: 'normal', strike: 30, dip: 50, sigma1: 150, pf: 0, fault: null, slipped: false };
/** B6 teaching stress state: σ3 fixed, σ2 halfway to σ1, σ1 or σ2 north–south; intact rock for comparison (illustrative). */
const FRICTION_LAB = Object.freeze({ sigma3: 30, ratio: 0.5, shmaxTrend: 0, intact: { cohesion: 20, mu: 0.85 } });
const DEFAULT_FAULT = { strike: 0, dip: 60, rake: -90, regime: 'normal', ratio: 0.5, tilt: 0, view: '3d', preset: null, slipped: false };
/**
 * B8 fault lab (NED metres, origin on the ground above the block center): the block is
 * 1000 m across and 500 m deep, the fault passes through its center, beds are 62.5 m
 * thick, and the slip is 300 m unless a step says otherwise (large, so it reads on screen). The stress is illustrative.
 */
const FAULT_LAB = Object.freeze({ sigma1: 130, sigma3: 30, shmaxTrend: 0, slipLength: 300, bed: 62.5, depth: 500, center: { x: 0, y: 0, z: 250 } });
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
            <div class="title-stack"><p id="lesson-progress-label" class="lesson-progress-label"></p><h2 id="active-state-name"></h2></div>
          </div>
          <div class="lesson-nav">
            <label class="lesson-picker" for="lesson-select"><span class="visually-hidden">Lesson</span><select id="lesson-select"></select></label>
            <nav class="step-navigator" aria-label="Jump to a step in this lesson">
              <div id="step-strip" class="step-strip"></div>
              <p id="step-strip-label" class="step-strip-label" aria-hidden="true"></p>
            </nav>
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
          <div id="vector-lab-viewport" class="viewport vector-lab-viewport split-viewport" data-side="false">
            <div id="vector-lab-scene" class="lab-scene"></div>
            <div id="vector-plot-panel" class="plot-panel"></div>
          </div>
          <div id="anderson-viewport" class="viewport anderson-viewport split-viewport" data-side="true">
            <div id="anderson-scene" class="lab-scene"></div>
            <div id="mohr-panel" class="plot-panel"></div>
          </div>
          <div id="friction-viewport" class="viewport friction-viewport split-viewport" data-side="true" data-net="false">
            <div id="friction-scene" class="lab-scene"></div>
            <div class="plot-panel plot-stack"><div id="friction-mohr" class="plot-slot mohr-slot"></div><div id="friction-net" class="plot-slot net-slot"></div></div>
          </div>
          <div id="fault-viewport" class="viewport fault-viewport split-viewport" data-side="false" data-panel="net">
            <div id="fault-scene" class="lab-scene"></div>
            <div class="plot-panel plot-stack"><div id="fault-net" class="plot-slot fault-net-slot"></div><div id="fault-well" class="plot-slot fault-well-slot"></div></div>
          </div>
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
  lessonStepList: document.querySelector('#lesson-step-list'),
  stepStrip: document.querySelector('#step-strip'),
  stepStripLabel: document.querySelector('#step-strip-label'),
  lessonCard: document.querySelector('#lesson-card'),
  lessonPanel: document.querySelector('.lesson-panel'),
  syllabus: document.querySelector('.syllabus'),
  lessonProgressLabel: document.querySelector('#lesson-progress-label'),
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
  vectorLabScene: document.querySelector('#vector-lab-scene'),
  vectorPlotPanel: document.querySelector('#vector-plot-panel'),
  andersonViewport: document.querySelector('#anderson-viewport'),
  andersonScene: document.querySelector('#anderson-scene'),
  mohrPanel: document.querySelector('#mohr-panel'),
  frictionViewport: document.querySelector('#friction-viewport'),
  frictionScene: document.querySelector('#friction-scene'),
  frictionMohr: document.querySelector('#friction-mohr'),
  frictionNet: document.querySelector('#friction-net'),
  faultViewport: document.querySelector('#fault-viewport'),
  faultScene: document.querySelector('#fault-scene'),
  faultNet: document.querySelector('#fault-net'),
  faultWell: document.querySelector('#fault-well'),
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
  anderson: { ...DEFAULT_ANDERSON },
  friction: { ...DEFAULT_FRICTION },
  fault: { ...DEFAULT_FAULT },
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

function isAndersonStep() {
  return isLessonView() && currentStep().visualKind === 'anderson';
}

function isFrictionStep() {
  return isLessonView() && currentStep().visualKind === 'friction';
}

function isFaultStep() {
  return isLessonView() && currentStep().visualKind === 'fault';
}

function isLabStep() {
  return isForceLabStep() || isVectorLabStep() || isAndersonStep() || isFrictionStep() || isFaultStep();
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

const vectorLabScene = new VectorScene(elements.vectorLabScene, {
  onVectorChange: (key, value) => {
    const lab = state.vectorLab;
    // In the 2D view the scene works with z = 0; keep the stored z for the jump back to 3D.
    lab[key] = lab.dimension === 2 ? { ...value, z: lab[key].z } : value;
    syncVectorLab();
  },
  onHover: (ref) => {
    if (!isVectorLabStep()) return;
    vectorLabScene.highlight(ref);
    vectorPlot.highlight(ref);
    markEquationRefs(ref);
  },
});

/** Double-angle preview plot beside the vector lab (M2). */
const vectorPlot = new CurvePlot(elements.vectorPlotPanel, {
  title: 'Products of sine and cosine',
  curves: [
    { ref: 'curve-cos2', name: 'cos²θ', label: 'cos²<tspan font-style="italic">θ</tspan>', color: '#56b4e9', f: (theta) => Math.cos((theta * Math.PI) / 180) ** 2 },
    { ref: 'curve-sincos', name: 'sin θ cos θ', label: 'sin <tspan font-style="italic">θ</tspan> cos <tspan font-style="italic">θ</tspan>', color: '#cc79a7', dash: '10 7', f: (theta) => Math.sin((theta * Math.PI) / 180) * Math.cos((theta * Math.PI) / 180) },
  ],
  onHover: (ref) => {
    if (!isVectorLabStep()) return;
    vectorLabScene.highlight(ref);
    vectorPlot.highlight(ref);
    markEquationRefs(ref);
  },
});

function andersonHover(ref) {
  if (!isAndersonStep()) return;
  andersonScene.highlight(ref);
  mohrPlot.highlight(ref);
  markEquationRefs(ref);
}

const andersonScene = new AndersonScene(elements.andersonScene, { onHover: andersonHover });
const mohrPlot = new MohrPlot(elements.mohrPanel, { onHover: andersonHover });

function frictionHover(ref) {
  if (!isFrictionStep()) return;
  frictionScene.highlight(ref);
  frictionMohr.highlight(ref);
  stereonet.highlight(ref);
  markEquationRefs(ref);
}

/** The friction lab (B6) reuses the Earth-block scene with an existing plane. */
const frictionScene = new AndersonScene(elements.frictionScene, { onHover: frictionHover });
const frictionMohr = new FrictionMohrPlot(elements.frictionMohr, { onHover: frictionHover });
const stereonet = new Stereonet(elements.frictionNet, { onHover: frictionHover, onPick: pickPole });

function faultHover(ref) {
  if (!isFaultStep()) return;
  faultScene.highlight(ref);
  faultNet.highlight(ref);
  wellLogPlot.highlight(ref);
  markEquationRefs(ref);
}

/** The fault lab (B8): the faulted block, a kinematic stereonet, and a well log. */
const faultScene = new FaultScene(elements.faultScene, { onHover: faultHover });
const faultNet = new Stereonet(elements.faultNet, { onHover: faultHover, onPick: pickFaultPole });
const wellLogPlot = new WellLog(elements.faultWell, { onHover: faultHover });

/** The vectors the student currently sees: z is hidden (zero) in the 2D view. */
function vectorLabVectors() {
  const lab = state.vectorLab;
  const flatten = (vector) => (lab.dimension === 2 ? { ...vector, z: 0 } : vector);
  const v = flatten(lab.v);
  const b = flatten(lab.b);
  return { v, b, sum: add(v, b), scalar: lab.scalar, dimension: lab.dimension, theta: lab.theta, primed: rotate2D(v, lab.theta) };
}

/** The context (geology example) chosen in the current step, if any. */
function activeContext() {
  return currentStep().contexts?.find((context) => context.id === state.vectorLab.context) ?? null;
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
  renderStepStrip();
}

/** Numbered step chips for Present mode: any step can be opened directly. */
function renderStepStrip() {
  const steps = currentLesson().steps;
  elements.stepStrip.innerHTML = steps.map((step, index) => {
    const current = index === state.lessonStepIndex;
    const visited = !current && index <= state.maxLessonStepVisited;
    return `<button class="step-chip${current ? ' is-current' : ''}${visited ? ' is-visited' : ''}" type="button" data-step-index="${index}" aria-current="${current ? 'step' : 'false'}" aria-label="Step ${index + 1}: ${step.label}">${index + 1}</button>`;
  }).join('');
  const showLabel = (index) => {
    const hint = index === state.lessonStepIndex ? ' <span class="step-keys">· keys ← → 1–9 Home End</span>' : ' <span>(click to open)</span>';
    elements.stepStripLabel.innerHTML = `<strong>${index + 1}</strong> ${steps[index].label}${hint}`;
  };
  showLabel(state.lessonStepIndex);
  for (const chip of elements.stepStrip.querySelectorAll('.step-chip')) {
    const index = Number(chip.dataset.stepIndex);
    chip.addEventListener('click', () => jumpToStep(index));
    chip.addEventListener('pointerenter', () => showLabel(index));
    chip.addEventListener('focus', () => showLabel(index));
    chip.addEventListener('pointerleave', () => showLabel(state.lessonStepIndex));
    chip.addEventListener('blur', () => showLabel(state.lessonStepIndex));
  }
}

function jumpToStep(index) {
  const last = currentLesson().steps.length - 1;
  const target = Math.min(Math.max(index, 0), last);
  if (target !== state.lessonStepIndex) applyLessonStep(target);
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
      ${symbols.map((symbol) => `<div data-scene-ref="${symbol.sceneRef}"><dt><math>${symbol.symbol}</math></dt><dd>${symbol.description}</dd></div>`).join('')}
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
  vectorPlot.highlight(isVectorLabStep() ? ref : null);
  andersonScene.highlight(isAndersonStep() ? ref : null);
  mohrPlot.highlight(isAndersonStep() ? ref : null);
  frictionScene.highlight(isFrictionStep() ? ref : null);
  frictionMohr.highlight(isFrictionStep() ? ref : null);
  stereonet.highlight(isFrictionStep() ? ref : null);
  faultScene.highlight(isFaultStep() ? ref : null);
  faultNet.highlight(isFaultStep() ? ref : null);
  wellLogPlot.highlight(isFaultStep() ? ref : null);
  markEquationRefs(ref);
}

function bindEquationPanel() {
  for (const element of elements.lessonCard.querySelectorAll('.equation-panel [data-scene-ref]')) {
    if (element.hasAttribute('data-sym')) {
      element.setAttribute('tabindex', '0');
      const symbol = currentStep().equations.flatMap((equation) => equation.symbols).find((candidate) => candidate.sceneRef === element.dataset.sceneRef);
      if (symbol) element.setAttribute('aria-label', `${element.textContent}: ${symbol.description}`);
    }
    element.addEventListener('pointerenter', () => setSceneHighlight(element.dataset.sceneRef));
    element.addEventListener('pointerleave', () => setSceneHighlight(null));
    element.addEventListener('focus', () => setSceneHighlight(element.dataset.sceneRef));
    element.addEventListener('blur', () => setSceneHighlight(null));
  }
}

/** 3 î − 4 ĵ (+ 0 k̂): the component form written with the unit vectors, as MathML. */
function basisForm(vector, dimension) {
  const terms = [['x', basis.i], ['y', basis.j], ['z', basis.k]].slice(0, dimension);
  return row(...terms.map(([axis, unitVector], index) => {
    const value = vector[axis];
    if (index === 0) return row(num(value), unitVector);
    return row(mo(value < 0 ? '−' : '+'), num(Math.abs(value)), unitVector);
  }));
}

/** A number with an upright unit, e.g. 0.500 MPa. */
function quantityMath(text, unit) {
  return row(mn(text), '<mspace width="0.25em"></mspace>', mtext(unit));
}

const degrees = (value, decimals = 1) => mn(`${formatNumber(value, decimals)}°`);

/** M2 values: angles, polar substitutions, direction cosines, primed components, and the double-angle curves. */
function trigLiveValues({ v, theta, primed: turned }) {
  const length = magnitude(v);
  const alpha = polarAngle(v);
  const cosines = length > 1e-9 ? scale(v, 1 / length) : null;
  const angles = directionAngles(v);
  const rad = (value) => (value * Math.PI) / 180;
  const trig = (name, angle) => row(mi(name), degrees(angle));
  const floor = xyMagnitude(v);
  return {
    alpha: floor > 1e-9 ? degrees(alpha) : mtext('undefined'),
    sumSquares: num(v.x ** 2 + v.y ** 2),
    vx: num(v.x),
    vy: num(v.y),
    vxSub: row(num(length), mo('⋅'), trig('cos', alpha)),
    vySub: row(num(length), mo('⋅'), trig('sin', alpha)),
    tanRatio: Math.abs(v.x) < 1e-9 ? mtext('undefined (vx = 0)') : row(frac(num(v.y), num(v.x)), mo('='), num(v.y / v.x)),
    atanNaive: Math.abs(v.x) < 1e-9 ? mtext('undefined') : degrees((Math.atan(v.y / v.x) * 180) / Math.PI),
    directionAngles: angles ? tuple([angles.x, angles.y, angles.z].map((angle) => Number(angle.toFixed(1)))).replace(/<\/mn>/g, '°</mn>') : mtext('undefined'),
    cosSquares: cosines ? row(squared(cosines.x), mo('+'), squared(cosines.y), mo('+'), squared(cosines.z)) : mo('—'),
    cosSquaresSum: cosines ? num(cosines.x ** 2 + cosines.y ** 2 + cosines.z ** 2) : mo('—'),
    theta: degrees(theta),
    vxpSub: row(signedTerm(v.x), trig('cos', theta), mo('+'), signedTerm(v.y), trig('sin', theta)),
    vypSub: row(mo('−'), signedTerm(v.x), trig('sin', theta), mo('+'), signedTerm(v.y), trig('cos', theta)),
    vxp: num(turned.x),
    vyp: num(turned.y),
    primed: tuple([turned.x, turned.y, turned.z]),
    cos2: num(Math.cos(rad(theta)) ** 2, 3),
    sincos: num(Math.sin(rad(theta)) * Math.cos(rad(theta)), 3),
    elevation: length > 1e-9 ? degrees((Math.atan2(v.z, floor) * 180) / Math.PI) : mtext('undefined'),
    vzFromElevation: num(v.z),
  };
}

function vectorLabLiveValues() {
  const current = vectorLabVectors();
  const { v, b, sum, scalar, dimension } = current;
  const length = magnitude(v);
  const unit = length > 1e-9 ? scale(v, 1 / length) : null;
  const scaled = scale(v, scalar);
  const stack = (axis) => row(num(v[axis]), mo('+'), signedTerm(b[axis]), mo('='), num(sum[axis]));
  const components = (vector) => [vector.x, vector.y, vector.z].slice(0, dimension);
  return {
    v: tuple(components(v)),
    vx2: squared(v.x),
    vy2: squared(v.y),
    vz2: squared(v.z),
    magnitude: num(length),
    basisForm: basisForm(v, dimension),
    dSquared: num(v.x ** 2 + v.y ** 2),
    d: num(xyMagnitude(v)),
    unit: unit ? tuple(components(unit)) : mtext('undefined: the zero vector has no direction'),
    unitMagnitude: unit ? num(magnitude(unit)) : mo('—'),
    sum: tuple(components(sum)),
    stackX: stack('x'),
    stackY: stack('y'),
    stackZ: stack('z'),
    scaled: tuple(components(scaled)),
    absC: num(Math.abs(scalar)),
    scaledMagnitude: num(magnitude(scaled)),
    ...trigLiveValues(current),
    v: tuple(components(v)),
  };
}

const sigmaSymbol = (key) => sub(mi('σ'), mn(key.slice(-1)));
const azimuth = (value) => String(Math.round(value) % 360).padStart(3, '0');

function andersonLiveValues() {
  const { regime, mu } = state.anderson;
  const angles = coulombAngles(mu);
  const result = andersonFaults(regime, mu);
  const strikes = result.faults.map((plane) => `${azimuth(plane.strike)}°`);
  return {
    mu: num(mu),
    phi: degrees(angles.phi),
    twoTheta: degrees(angles.twoTheta),
    beta: degrees(angles.beta),
    acute: degrees(2 * angles.beta),
    dip: degrees(result.dip),
    dipNormal: degrees(90 - angles.beta),
    dipThrust: degrees(angles.beta),
    strikes: row(mn(strikes[0]), mtext(' and '), mn(strikes[1])),
    verticalName: sigmaSymbol(ANDERSON_REGIMES[regime].vertical),
    faultType: mtext(ANDERSON_REGIMES[regime].faultType),
  };
}

function liveValues() {
  if (isVectorLabStep()) return vectorLabLiveValues();
  if (isAndersonStep()) return andersonLiveValues();
  if (isFrictionStep()) return frictionLiveValues();
  if (isFaultStep()) return faultLiveValues();
  if (!isForceLabStep()) return {};
  const quantity = quantityFor(currentStep());
  const result = decomposeTraction(state.forceVector, state.contactArea, state.surfaceNormal);
  const signed = (value, digits) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;
  return {
    magnitude: quantityMath((forceMagnitude() / quantity.divisor).toFixed(2), quantity.unit),
    traction: quantityMath(result.tractionMagnitude.toFixed(3), 'MPa'),
    tractionConversion: frac(
      quantityMath(Math.round(forceMagnitude()).toLocaleString('en-US'), 'N'),
      quantityMath((state.contactArea / 10_000).toFixed(4), 'm²'),
    ),
    normalTraction: quantityMath(signed(result.normalTraction, 3), 'MPa'),
    shearMagnitude: quantityMath(result.shearMagnitude.toFixed(3), 'MPa'),
  };
}

function syncEquationValues() {
  const values = liveValues();
  // Values a step asks students to predict stay hidden until the prediction is right.
  const hidden = new Set(isLessonView() && !state.lessonChoiceCorrect ? currentStep().revealAfterAnswer ?? [] : []);
  for (const element of elements.lessonCard.querySelectorAll('[data-live]')) {
    const isHidden = hidden.has(element.dataset.live);
    const value = values[element.dataset.live] ?? mo('—');
    // Live slots sit inside MathML; values are MathML strings. Only rewrite on change.
    const markup = isHidden ? mi('?', { cls: 'hidden-value' }) : value;
    if (element.dataset.rendered !== markup) {
      element.innerHTML = markup;
      element.dataset.rendered = markup;
    }
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
  if (controls.has('length')) {
    parts.push(`<label class="lab-control" for="length-input"><span>Length ${inline(mo('|'), vec('v'), mo('|'))} <output id="length-output">${formatNumber(magnitude(lab.v))}</output></span><input id="length-input" class="range" type="range" min="0.5" max="6" step="0.5" value="${magnitude(lab.v)}" /></label>`);
  }
  if (controls.has('angle')) {
    parts.push(`<label class="lab-control" for="angle-input"><span>Angle ${inline(mi('α'))} from +x <output id="angle-output">${formatNumber(polarAngle(lab.v), 1)}°</output></span><input id="angle-input" class="range" type="range" min="0" max="360" step="1" value="${Math.round(polarAngle(lab.v))}" /></label>`);
  }
  if (controls.has('theta')) {
    parts.push(`<label class="lab-control" for="theta-input"><span>Axes turned by ${inline(mi('θ'))} <output id="theta-output">${formatNumber(lab.theta, 1)}°</output></span><input id="theta-input" class="range" type="range" min="0" max="180" step="0.5" value="${lab.theta}" /></label>`);
  }
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
  // Length and angle set the vector in polar form; the vector stays the single source of truth.
  elements.lessonCard.querySelector('#angle-input')?.addEventListener('input', (event) => {
    const length = currentStep().labOptions.fixedLength ?? (xyMagnitude(lab().v) || 1);
    lab().v = fromPolar(length, Number(event.target.value));
    syncVectorLab();
  });
  elements.lessonCard.querySelector('#length-input')?.addEventListener('input', (event) => {
    lab().v = fromPolar(Number(event.target.value), polarAngle(lab().v));
    syncVectorLab();
  });
  elements.lessonCard.querySelector('#theta-input')?.addEventListener('input', (event) => {
    lab().theta = Number(event.target.value);
    syncVectorLab();
  });
  for (const button of elements.lessonCard.querySelectorAll('[data-context]')) {
    button.addEventListener('click', () => {
      const context = currentStep().contexts.find((candidate) => candidate.id === button.dataset.context);
      lab().context = context.id;
      lab().v = { ...context.vector };
      if (context.dimension) lab().dimension = context.dimension;
      if (context.theta !== undefined) lab().theta = context.theta;
      syncVectorLab({ refreshInputs: true });
      syncAll();
    });
  }
}

function initVectorLab(step) {
  const initial = step.initialLabState ?? {};
  state.vectorLab = {
    v: { ...(initial.v ?? DEFAULT_VECTOR_LAB.v) },
    b: { ...(initial.b ?? DEFAULT_VECTOR_LAB.b) },
    scalar: initial.scalar ?? DEFAULT_VECTOR_LAB.scalar,
    theta: initial.theta ?? DEFAULT_VECTOR_LAB.theta,
    context: initial.context ?? null,
    dimension: step.dimension ?? 3,
  };
}

function syncVectorLab({ refreshInputs = false, animate = true } = {}) {
  if (!isVectorLabStep()) return;
  const step = currentStep();
  const lab = state.vectorLab;
  const current = vectorLabVectors();
  const context = activeContext();
  // Values a step asks students to predict stay hidden in the scene labels too.
  const hidden = !state.lessonChoiceCorrect ? step.revealAfterAnswer ?? [] : [];
  const options = {
    ...step.labOptions,
    ...context?.options,
    context: lab.context ?? step.labOptions.context ?? null,
    hideComponentValues: ['vx', 'vy', 'vxp', 'vyp'].some((key) => hidden.includes(key)),
  };
  vectorLabScene.setDimension(lab.dimension, { animate, close: options.view === 'close' });
  vectorLabScene.setState({
    vectors: { v: current.v, b: current.b },
    scalar: current.scalar,
    theta: lab.theta,
    options,
  });
  elements.vectorLabViewport.dataset.side = String(Boolean(options.plot));
  vectorPlot.setTheta(lab.theta);
  const angleInput = elements.lessonCard.querySelector('#angle-input');
  if (angleInput && document.activeElement !== angleInput) angleInput.value = String(Math.round(polarAngle(lab.v)));
  setText('#angle-output', `${formatNumber(polarAngle(lab.v), 1)}°`);
  const lengthInput = elements.lessonCard.querySelector('#length-input');
  if (lengthInput && document.activeElement !== lengthInput) lengthInput.value = String(magnitude(lab.v));
  setText('#length-output', formatNumber(magnitude(lab.v)));
  setText('#theta-output', `${formatNumber(lab.theta, 1)}°`);
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

/* ---------- Anderson lab (B7) ---------- */

const REGIME_BUTTONS = [
  ['normal', 'sigma1'],
  ['strike-slip', 'sigma2'],
  ['thrust', 'sigma3'],
];

function andersonControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const lab = state.anderson;
  const parts = [];
  if (controls.has('regime')) {
    parts.push(`
      <div class="direction-control"><span>Vertical principal stress</span><div class="segmented-control" role="group" aria-label="Which principal stress is vertical">
        ${REGIME_BUTTONS.map(([regime, key]) => `<button type="button" data-regime="${regime}" aria-pressed="${lab.regime === regime}">${inline(sigmaSymbol(key))} vertical</button>`).join('')}
      </div></div>`);
  }
  if (controls.has('setting')) {
    parts.push(`
      <div class="direction-control"><span>Tectonic setting</span><div class="segmented-control context-control" role="group" aria-label="Tectonic setting">
        ${step.settings.map((setting) => `<button type="button" data-setting="${setting.id}" aria-pressed="${lab.setting === setting.id}">${setting.label}<small>${setting.examples}</small></button>`).join('')}
      </div></div>`);
  }
  if (controls.has('mu')) {
    parts.push(`<label class="lab-control" for="mu-input"><span>Friction coefficient ${inline(mi('μ'))} <output id="mu-output">${formatNumber(lab.mu)}</output></span><input id="mu-input" class="range" type="range" min="0" max="1" step="0.05" value="${lab.mu}" /></label>`);
  }
  if (controls.has('slip')) {
    parts.push(`<button id="slip-button" class="button secondary slip-button" type="button" aria-pressed="${lab.slipped}">${lab.slipped ? 'Undo slip' : 'Slip ▸'}</button>`);
  }
  return parts.length ? `<div class="lab-controls">${parts.join('')}</div>` : '';
}

function bindAndersonControls() {
  for (const button of elements.lessonCard.querySelectorAll('[data-regime]')) {
    button.addEventListener('click', () => {
      state.anderson.regime = button.dataset.regime;
      state.anderson.slipped = false;
      syncAnderson();
      syncAll();
    });
  }
  for (const button of elements.lessonCard.querySelectorAll('[data-setting]')) {
    button.addEventListener('click', () => {
      const setting = currentStep().settings.find((candidate) => candidate.id === button.dataset.setting);
      state.anderson.setting = setting.id;
      state.anderson.regime = setting.regime;
      state.anderson.slipped = false;
      syncAnderson();
      syncAll();
    });
  }
  elements.lessonCard.querySelector('#mu-input')?.addEventListener('input', (event) => {
    state.anderson.mu = Number(event.target.value);
    syncAnderson();
  });
  elements.lessonCard.querySelector('#slip-button')?.addEventListener('click', () => {
    state.anderson.slipped = !state.anderson.slipped;
    andersonScene.setSlipped(state.anderson.slipped);
    syncAnderson();
  });
}

function initAnderson(step) {
  const initial = step.initialLabState ?? {};
  state.anderson = {
    regime: initial.regime ?? DEFAULT_ANDERSON.regime,
    mu: initial.mu ?? DEFAULT_ANDERSON.mu,
    slipped: false,
    setting: initial.setting ?? null,
  };
}

/** Scene options for the current step; some objects appear only after the prediction is right. */
function andersonOptions(step) {
  const options = step.labOptions;
  const answered = state.lessonChoiceCorrect;
  return {
    showAxes: options.showAxes !== false && (!options.axesAfterAnswer || answered),
    showFaults: options.showFaults !== false && (!options.faultsAfterAnswer || answered),
    showConjugate: options.showConjugate !== false,
    showAngles: options.showAngles !== false,
    showSlip: Boolean(options.showSlip),
  };
}

function syncAnderson() {
  if (!isAndersonStep()) return;
  const step = currentStep();
  const lab = state.anderson;
  const options = andersonOptions(step);
  elements.andersonViewport.dataset.side = String(Boolean(step.labOptions.showMohr));
  andersonScene.setState({ regime: lab.regime, mu: lab.mu, options });
  if (!options.showFaults && lab.slipped) lab.slipped = false;
  andersonScene.setSlipped(lab.slipped);
  mohrPlot.setState({ mu: lab.mu });
  for (const button of elements.lessonCard.querySelectorAll('[data-regime]')) button.setAttribute('aria-pressed', String(button.dataset.regime === lab.regime));
  for (const button of elements.lessonCard.querySelectorAll('[data-setting]')) button.setAttribute('aria-pressed', String(button.dataset.setting === lab.setting));
  const muInput = elements.lessonCard.querySelector('#mu-input');
  if (muInput && document.activeElement !== muInput) muInput.value = String(lab.mu);
  setText('#mu-output', formatNumber(lab.mu));
  const slipButton = elements.lessonCard.querySelector('#slip-button');
  if (slipButton) {
    slipButton.textContent = lab.slipped ? 'Undo slip' : 'Slip ▸';
    slipButton.setAttribute('aria-pressed', String(lab.slipped));
    slipButton.disabled = !options.showFaults;
  }
  syncEquationValues();
}

function resetAnderson() {
  initAnderson(currentStep());
  andersonScene.setSlipped(false, { animate: false });
  renderLessonPanel();
  syncAll();
}

/* ---------- Friction lab (B6) ---------- */

const azimuthText = (value) => `${String(Math.round(normalizeAzimuth(value))).padStart(3, '0')}°`;

/** Everything the friction lab draws, from the lab state: stress, the plane, and whether it slips or rock breaks first. */
function frictionModel() {
  const options = currentStep().labOptions ?? {};
  const lab = state.friction;
  const { sigma3, ratio, shmaxTrend, intact } = FRICTION_LAB;
  const axes = andersonAxes(lab.regime, shmaxTrend);
  const axisVectors = Object.fromEntries(Object.entries(axes).map(([key, axis]) => [key, lineVector(axis.trend, axis.plunge)]));
  const plane = planeFromStrike(lab.strike, lab.dip);
  const pole = planePole(plane);
  const pf = options.effective ? lab.pf : 0;
  const reactivate = reactivationSigma1(principalCosines(pole, axisVectors), { sigma3, ratio, pf });
  const newFault = newFaultSigma1(sigma3, { ...intact, pf });
  let sigma1 = lab.sigma1;
  let event = null;
  // Once the plane slips or the rock breaks, the stress cannot rise any further.
  if (options.stopAtFailure && sigma1 >= Math.min(reactivate, newFault)) {
    sigma1 = Math.min(reactivate, newFault);
    event = reactivate <= newFault ? 'slip' : 'new-fault';
  }
  const magnitudes = principalMagnitudes(sigma1, sigma3, ratio);
  const tensor = principalStressTensor(axes, magnitudes);
  const check = frictionCheck(tensor, pole, pf);
  const faults = (currentStep().mappedFaults ?? []).map((fault) => {
    const faultPlane = planeFromStrike(fault.strike, fault.dip);
    return { ...fault, plane: faultPlane, check: frictionCheck(tensor, planePole(faultPlane), pf) };
  });
  return { axes, plane, pole, pf, magnitudes, tensor, check, reactivate, newFault, event, faults };
}

function frictionControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const lab = state.friction;
  const parts = [];
  if (controls.has('regime')) {
    parts.push(`
      <div class="direction-control"><span>Vertical principal stress</span><div class="segmented-control" role="group" aria-label="Which principal stress is vertical">
        ${REGIME_BUTTONS.map(([regime, key]) => `<button type="button" data-friction-regime="${regime}" aria-pressed="${lab.regime === regime}">${inline(sigmaSymbol(key))} vertical</button>`).join('')}
      </div></div>`);
  }
  if (controls.has('faults')) {
    parts.push(`
      <div class="direction-control"><span>Mapped fault</span><div class="segmented-control context-control" role="group" aria-label="Mapped fault">
        ${step.mappedFaults.map((fault) => `<button type="button" data-fault="${fault.id}" aria-pressed="${lab.fault === fault.id}">Fault ${fault.label}<small>${fault.description}</small></button>`).join('')}
      </div></div>`);
  }
  if (controls.has('strike')) {
    parts.push(`<label class="lab-control" for="strike-input"><span>Strike <output id="strike-output">${azimuthText(lab.strike)}</output></span><input id="strike-input" class="range" type="range" min="0" max="355" step="5" value="${lab.strike}" /></label>`);
  }
  if (controls.has('dip')) {
    parts.push(`<label class="lab-control" for="dip-input"><span>Dip <output id="dip-output"></output></span><input id="dip-input" class="range" type="range" min="0" max="90" step="5" value="${lab.dip}" /></label>`);
  }
  if (controls.has('sigma1')) {
    parts.push(`<label class="lab-control" for="sigma1-input"><span>Raise ${inline(sigmaSymbol('sigma1'))} <output id="sigma1-output"></output></span><input id="sigma1-input" class="range" type="range" min="30" max="240" step="5" value="${lab.sigma1}" /></label>`);
  }
  if (controls.has('pf')) {
    parts.push(`<label class="lab-control" for="pf-input"><span>Pore-fluid pressure ${inline(sub(mi('P'), mi('f')))} <output id="pf-output"></output></span><input id="pf-input" class="range" type="range" min="0" max="25" step="0.5" value="${lab.pf}" /></label>`);
  }
  if (controls.has('slip')) {
    parts.push(`<button id="friction-slip-button" class="button secondary slip-button" type="button" aria-pressed="${lab.slipped}">Slip ▸</button>`);
  }
  return parts.length ? `<div class="lab-controls">${parts.join('')}</div>` : '';
}

function setFrictionPlane(strike, dip, { fault = null } = {}) {
  const lab = state.friction;
  lab.strike = normalizeAzimuth(strike);
  lab.dip = dip;
  lab.fault = fault;
  lab.slipped = false;
}

/** Stereonet click or drag: the picked point is the pole, snapped to 5°. */
function pickPole(line) {
  if (!isFrictionStep() || !currentStep().controls?.includes('strike')) return;
  const plane = planeFromPole(line);
  const dip = Math.min(90, Math.round(plane.dip / 5) * 5);
  const dipDirection = Math.round(plane.dipDirection / 5) * 5;
  setFrictionPlane(dip === 0 ? state.friction.strike : dipDirection - 90, dip);
  syncFriction({ refreshInputs: true });
}

function bindFrictionControls() {
  const lab = () => state.friction;
  for (const button of elements.lessonCard.querySelectorAll('[data-friction-regime]')) {
    button.addEventListener('click', () => {
      lab().regime = button.dataset.frictionRegime;
      lab().slipped = false;
      syncFriction();
      syncAll();
    });
  }
  for (const button of elements.lessonCard.querySelectorAll('[data-fault]')) {
    button.addEventListener('click', () => {
      const fault = currentStep().mappedFaults.find((candidate) => candidate.id === button.dataset.fault);
      setFrictionPlane(fault.strike, fault.dip, { fault: fault.id });
      syncFriction();
      syncAll();
    });
  }
  const bindRange = (id, apply) => elements.lessonCard.querySelector(id)?.addEventListener('input', (event) => {
    apply(Number(event.target.value));
    syncFriction();
  });
  bindRange('#strike-input', (value) => setFrictionPlane(value, lab().dip));
  bindRange('#dip-input', (value) => setFrictionPlane(lab().strike, value));
  bindRange('#sigma1-input', (value) => { lab().sigma1 = value; });
  bindRange('#pf-input', (value) => { lab().pf = value; });
  elements.lessonCard.querySelector('#friction-slip-button')?.addEventListener('click', () => {
    lab().slipped = !lab().slipped;
    syncFriction();
  });
}

function initFriction(step) {
  const initial = step.initialLabState ?? {};
  state.friction = { ...DEFAULT_FRICTION, ...initial, slipped: false };
}

function syncFriction({ refreshInputs = false } = {}) {
  if (!isFrictionStep()) return;
  const step = currentStep();
  const options = step.labOptions;
  const lab = state.friction;
  const model = frictionModel();
  const { check } = model;
  const canSlip = check.slips;
  if (!canSlip) lab.slipped = false;
  const newFault = model.event === 'new-fault';
  elements.frictionViewport.dataset.net = String(Boolean(options.showStereonet));
  frictionScene.setState({
    regime: lab.regime,
    mu: FRICTION_LAB.intact.mu,
    shmaxTrend: FRICTION_LAB.shmaxTrend,
    plane: model.plane,
    magnitudes: model.magnitudes,
    options: {
      showAxes: true,
      showFaults: newFault,
      showConjugate: true,
      showAngles: false,
      showSlip: Boolean(options.showSlip) && canSlip,
      showTraction: Boolean(options.showTraction),
      showPole: Boolean(options.showPole),
      canSlip,
    },
  });
  frictionScene.setSlipped(lab.slipped);
  const others = model.faults.filter((fault) => fault.id !== lab.fault);
  frictionMohr.setState({
    magnitudes: model.magnitudes,
    pf: model.pf,
    intact: FRICTION_LAB.intact,
    point: { sigmaN: check.sigmaN, tau: check.tau },
    pointLabel: lab.fault ? `fault ${lab.fault}` : 'plane',
    slips: check.slips,
    newFault,
    markers: options.showMarkers ? others.map((fault) => ({ label: fault.label, sigmaN: fault.check.sigmaN, tau: fault.check.tau })) : [],
    options: {
      showPoint: options.showPoint !== false,
      showRegion: options.showRegion !== false,
      showTsLine: Boolean(options.showTsLine),
      showProjections: Boolean(options.showProjections || options.showTraction),
      effective: Boolean(options.effective),
    },
  });
  if (options.showStereonet) {
    stereonet.setState({
      tensor: model.tensor,
      pf: model.pf,
      plane: model.plane,
      axes: model.axes,
      markers: options.showMarkers ? others.map((fault) => ({ label: fault.label, plane: fault.plane })) : [],
      options: { pickable: Boolean(step.controls?.includes('strike')), poleLabel: lab.fault ? lab.fault : 'pole' },
    });
  }

  for (const button of elements.lessonCard.querySelectorAll('[data-friction-regime]')) button.setAttribute('aria-pressed', String(button.dataset.frictionRegime === lab.regime));
  for (const button of elements.lessonCard.querySelectorAll('[data-fault]')) button.setAttribute('aria-pressed', String(button.dataset.fault === lab.fault));
  for (const [id, value] of [['#strike-input', lab.strike], ['#dip-input', lab.dip], ['#sigma1-input', lab.sigma1], ['#pf-input', lab.pf]]) {
    const input = elements.lessonCard.querySelector(id);
    if (input && (refreshInputs || document.activeElement !== input)) input.value = String(value);
  }
  setText('#strike-output', azimuthText(lab.strike));
  setText('#dip-output', lab.dip === 0 ? '0° (horizontal)' : `${lab.dip}° toward ${azimuthText(model.plane.dipDirection)}`);
  const sigma1Text = model.event ? `${formatNumber(model.magnitudes.sigma1, 0)} MPa: ${model.event === 'slip' ? 'the plane slipped' : 'new fault'}` : `${formatNumber(lab.sigma1, 0)} MPa`;
  setText('#sigma1-output', sigma1Text);
  setText('#pf-output', `${formatNumber(lab.pf, 1)} MPa`);
  const slipButton = elements.lessonCard.querySelector('#friction-slip-button');
  if (slipButton) {
    slipButton.textContent = lab.slipped ? 'Undo slip' : canSlip ? 'Slip ▸' : 'Slip ▸ (friction holds)';
    slipButton.setAttribute('aria-pressed', String(lab.slipped));
    slipButton.disabled = !canSlip;
  }
  const goalCard = elements.lessonCard.querySelector('#goal-card');
  if (goalCard) {
    const met = isGoalMet(step, { slips: check.slips });
    goalCard.dataset.met = String(met);
    setText('#goal-status', met ? '✓ Goal reached' : 'Not yet');
  }
  // The legend lists the slip arrows and a new fault only while they are drawn.
  syncFrictionChrome(step);
  syncEquationValues();
}

function resetFriction() {
  initFriction(currentStep());
  frictionScene.setSlipped(false, { animate: false });
  renderLessonPanel();
  syncAll();
}

function frictionLiveValues() {
  const model = frictionModel();
  const { check } = model;
  const mpa = (value) => row(num(value, 0), mtext(' MPa'));
  return {
    traction: tuple([check.traction.x, check.traction.y, check.traction.z], 0),
    sigmaN: num(check.sigmaN, 1),
    tau: num(check.tau, 1),
    ts: Number.isFinite(check.ts) ? num(check.ts) : mtext('no limit'),
    slipsText: mtext(check.slips ? 'slips' : 'holds'),
    td: num(dilationTendency(model.tensor, model.pole, model.magnitudes)),
    reactivate: Number.isFinite(model.reactivate) ? mpa(model.reactivate) : mtext('never: the plane is locked'),
    newFault: mpa(model.newFault),
    outcome: mtext(model.reactivate <= model.newFault ? 'the old plane slips' : 'a new fault forms'),
    pf: num(model.pf, 1),
    sigmaNEff: num(check.sigmaNEff, 1),
  };
}

const FRICTION_SWATCHES = {
  sigma1: ['#f07a3c', 'solid'],
  sigma2: ['#f0e442', 'dashed'],
  sigma3: ['#56b4e9', 'dotted'],
  fault: ['#f4f5f7', 'solid'],
  slip: ['#3fd0a0', 'solid'],
  plane: ['#d9b27c', 'solid'],
  pole: ['#f4f5f7', 'solid'],
  traction: ['#e69f00', 'solid'],
  normalStress: ['#9a8cff', 'dashed'],
  shearStress: ['#cc79a7', 'dashed'],
};

function syncFrictionChrome(step) {
  const options = step.labOptions;
  const model = frictionModel();
  elements.interactionHint.textContent = options.showStereonet && step.controls?.includes('strike')
    ? 'Drag: orbit the block · click or drag on the stereonet to pick a pole · hover to link'
    : 'Drag: orbit the block · scroll: zoom · hover a symbol or an object to link them';
  const item = (key, label) => {
    const [color, pattern] = FRICTION_SWATCHES[key];
    return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
  };
  const legend = [item('sigma1', inline(sigmaSymbol('sigma1'))), item('sigma2', inline(sigmaSymbol('sigma2'))), item('sigma3', inline(sigmaSymbol('sigma3'))), item('plane', 'old plane')];
  if (options.showPole) legend.push(item('pole', inline(vec('n'))));
  if (options.showTraction) legend.push(item('traction', inline(vec('t'))), item('normalStress', inline(sub(mi('σ'), mi('n')))), item('shearStress', inline(mi('τ'))));
  if (options.showSlip && model.check.slips) legend.push(item('slip', 'slip'));
  if (model.event === 'new-fault') legend.push(item('fault', 'new fault'));
  elements.sceneLegend.hidden = false;
  elements.sceneLegend.innerHTML = legend.join('');
}

/* ---------- Fault lab (B8) ---------- */

const ZERO_VECTOR = Object.freeze({ x: 0, y: 0, z: 0 });

/** The NED plane of the block face that the Section view looks at: the face most nearly perpendicular to strike. */
function sectionFace(plane) {
  const strike = faultFrame(plane).strike;
  return Math.abs(strike.x) >= Math.abs(strike.y)
    ? planeThrough({ x: 1, y: 0, z: 0 }, { x: -FAULT_LAB.depth, y: 0, z: 0 })
    : planeThrough({ x: 0, y: 1, z: 0 }, { x: 0, y: FAULT_LAB.depth, z: 0 });
}

/** Everything the fault lab draws, from the lab state: the fault, the slip (set by rake or by the stress), and what it offsets. */
function faultModel() {
  const step = currentStep();
  const options = step.labOptions ?? {};
  const lab = state.fault;
  const plane = planeFromStrike(lab.strike, lab.dip);
  const pole = planePole(plane);
  const frame = faultFrame(plane);
  let axes = null;
  let tensor = null;
  let magnitudes = null;
  if (options.stress) {
    axes = andersonAxes(lab.regime, FAULT_LAB.shmaxTrend);
    if (lab.tilt) axes = tiltAxes(axes, lab.tilt);
    magnitudes = principalMagnitudes(FAULT_LAB.sigma1, FAULT_LAB.sigma3, lab.ratio);
    tensor = principalStressTensor(axes, magnitudes);
  }
  const traction = tensor ? resolveTraction(tensor, pole) : null;
  const fromStress = options.slipSource === 'stress';
  const slip = fromStress ? (tensor ? resolvedShearDirection(tensor, plane) : null) : slipFromRake(plane, lab.rake);
  const rake = slip ? (fromStress ? rakeFromSlip(plane, slip) : lab.rake) : null;
  const slipLength = options.slipLength ?? FAULT_LAB.slipLength;
  const offset = slip ? scale(slip, slipLength) : ZERO_VECTOR;
  const components = slip ? slipComponents(plane, offset) : null;
  const classification = rake === null ? null : classifySlip(plane, rake);
  const kinematic = slip ? kinematicAxes(pole, slip) : null;
  const auxiliary = slip ? auxiliaryPlane(slip) : null;
  const fault = planeThrough(pole, FAULT_LAB.center);
  // In the cut (map and section) view the land is eroded flat down to the dropped block's surface.
  const erosion = options.blockMode === 'cut' ? Math.max(0, offset.z) : 0;
  let separation = null;
  if (options.dike && slip) {
    const { strike, dip, point } = options.dike;
    const marker = planeThrough(planePole(planeFromStrike(strike, dip)), point);
    separation = {
      marker,
      map: traceSeparation({ fault, marker, view: planeThrough({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: erosion }), offset, direction: frame.strike }),
      section: traceSeparation({ fault, marker, view: sectionFace(plane), offset, direction: { x: 0, y: 0, z: 1 } }),
    };
  }
  const log = options.well ? wellLog({ fault, offset, well: options.well, top: erosion, bottom: FAULT_LAB.depth, thickness: FAULT_LAB.bed }) : null;
  return { plane, pole, frame, axes, tensor, magnitudes, traction, slip, rake, slipLength, offset, components, classification, kinematic, auxiliary, erosion, separation, log };
}

const FAULT_VIEWS = [['3d', '3D'], ['map', 'Map'], ['section', 'Section']];

function faultControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const lab = state.fault;
  const parts = [];
  if (controls.has('presets')) {
    parts.push(`
      <div class="direction-control"><span>Fault type</span><div class="segmented-control context-control four-up" role="group" aria-label="Fault type">
        ${step.presets.map((preset) => `<button type="button" data-fault-preset="${preset.id}" aria-pressed="${lab.preset === preset.id}">${preset.label}<small>${preset.detail}</small></button>`).join('')}
      </div></div>`);
  }
  if (controls.has('regime')) {
    parts.push(`
      <div class="direction-control"><span>Vertical principal stress</span><div class="segmented-control" role="group" aria-label="Which principal stress is vertical">
        ${REGIME_BUTTONS.map(([regime, key]) => `<button type="button" data-fault-regime="${regime}" aria-pressed="${lab.regime === regime}">${inline(sigmaSymbol(key))} vertical</button>`).join('')}
      </div></div>`);
  }
  if (controls.has('view')) {
    parts.push(`
      <div class="direction-control"><span>View</span><div class="segmented-control" role="group" aria-label="Camera view">
        ${FAULT_VIEWS.map(([view, label]) => `<button type="button" data-fault-view="${view}" aria-pressed="${lab.view === view}">${label}</button>`).join('')}
      </div></div>`);
  }
  if (controls.has('rake')) {
    parts.push(`<label class="lab-control" for="rake-input"><span>Rake ${inline(mi('λ'))} <output id="rake-output"></output></span><input id="rake-input" class="range" type="range" min="-180" max="180" step="5" value="${lab.rake}" /></label>`);
  }
  if (controls.has('strike')) {
    parts.push(`<label class="lab-control" for="fault-strike-input"><span>Strike <output id="fault-strike-output"></output></span><input id="fault-strike-input" class="range" type="range" min="0" max="355" step="5" value="${lab.strike}" /></label>`);
  }
  if (controls.has('dip')) {
    parts.push(`<label class="lab-control" for="fault-dip-input"><span>Dip <output id="fault-dip-output"></output></span><input id="fault-dip-input" class="range" type="range" min="10" max="90" step="5" value="${lab.dip}" /></label>`);
  }
  if (controls.has('ratio')) {
    parts.push(`<label class="lab-control" for="ratio-input"><span>Stress ratio ${inline(mi('φ'))} <output id="ratio-output"></output></span><input id="ratio-input" class="range" type="range" min="0" max="1" step="0.05" value="${lab.ratio}" /></label>`);
  }
  if (controls.has('tilt')) {
    parts.push(`<label class="lab-control" for="tilt-input"><span>Tilt ${inline(sigmaSymbol('sigma1'))} <output id="tilt-output"></output></span><input id="tilt-input" class="range" type="range" min="-45" max="75" step="5" value="${lab.tilt}" /></label>`);
  }
  if (controls.has('slip')) {
    parts.push(`<button id="fault-slip-button" class="button secondary slip-button" type="button" aria-pressed="${lab.slipped}">Slip ▸</button>`);
  }
  return parts.length ? `<div class="lab-controls">${parts.join('')}</div>` : '';
}

/** Stereonet click or drag in the fault lab: the picked point is the fault's pole, snapped to 5°. */
function pickFaultPole(line) {
  if (!isFaultStep() || !currentStep().controls?.includes('strike')) return;
  const plane = planeFromPole(line);
  const dip = Math.min(90, Math.max(10, Math.round(plane.dip / 5) * 5));
  state.fault.strike = normalizeAzimuth(Math.round(plane.dipDirection / 5) * 5 - 90);
  state.fault.dip = dip;
  state.fault.preset = null;
  syncFault({ refreshInputs: true });
}

function bindFaultControls() {
  const lab = () => state.fault;
  const buttons = (selector, apply) => {
    for (const button of elements.lessonCard.querySelectorAll(selector)) {
      button.addEventListener('click', () => {
        apply(button);
        syncFault({ refreshInputs: true });
      });
    }
  };
  buttons('[data-fault-preset]', (button) => {
    const preset = currentStep().presets.find((candidate) => candidate.id === button.dataset.faultPreset);
    Object.assign(lab(), { strike: preset.strike, dip: preset.dip, rake: preset.rake, preset: preset.id });
  });
  buttons('[data-fault-regime]', (button) => {
    lab().regime = button.dataset.faultRegime;
  });
  buttons('[data-fault-view]', (button) => {
    lab().view = button.dataset.faultView;
    faultScene.setView(lab().view);
  });
  const bindRange = (id, apply) => elements.lessonCard.querySelector(id)?.addEventListener('input', (event) => {
    apply(Number(event.target.value));
    lab().preset = null;
    syncFault();
  });
  bindRange('#rake-input', (value) => { lab().rake = value; });
  bindRange('#fault-strike-input', (value) => { lab().strike = value; });
  bindRange('#fault-dip-input', (value) => { lab().dip = value; });
  bindRange('#ratio-input', (value) => { lab().ratio = value; });
  bindRange('#tilt-input', (value) => { lab().tilt = value; });
  elements.lessonCard.querySelector('#fault-slip-button')?.addEventListener('click', () => {
    lab().slipped = !lab().slipped;
    syncFault();
  });
}

function initFault(step) {
  const initial = step.initialLabState ?? {};
  state.fault = { ...DEFAULT_FAULT, ...initial, slipped: Boolean(step.labOptions?.slipped) };
  // Set the scene's slip at once (no animation) and frame the step's view.
  syncFaultScene(faultModel());
  faultScene.setSlipped(state.fault.slipped, { animate: false });
  faultScene.setView(state.fault.view);
}

/** Scene options for the step; with revealSlip the slip appears only after the prediction is right. */
function faultSceneOptions(step, model) {
  const options = step.labOptions ?? {};
  const hideSlip = options.revealSlip && !state.lessonChoiceCorrect;
  return {
    blockMode: options.blockMode ?? 'moved',
    showHangingWall: options.showHangingWall !== false,
    showWallLabels: Boolean(options.showWallLabels),
    showPole: Boolean(options.showPole),
    showSlipVector: options.showSlipVector !== false && !hideSlip,
    showComponents: Boolean(options.showComponents),
    showRake: Boolean(options.showRake) && !hideSlip,
    showStress: Boolean(options.showStress),
    showTraction: Boolean(options.showTraction),
    showKinematic: Boolean(options.showKinematic) && Boolean(model.slip),
    showConstruction: Boolean(options.showConstruction),
    showSlickenlines: Boolean(options.showSlickenlines),
    showSeparation: Boolean(options.showSeparation),
    showDike: Boolean(options.showDike),
    showWell: Boolean(options.showWell),
  };
}

function syncFaultScene(model) {
  const step = currentStep();
  const options = step.labOptions ?? {};
  faultScene.setState({
    plane: model.plane,
    slip: model.slip,
    slipLength: model.slipLength,
    axes: model.axes,
    tensor: model.tensor,
    marker: model.separation?.marker ?? null,
    separation: model.separation,
    well: options.well ?? null,
    wellFaultDepth: model.log?.faultDepth ?? null,
    options: faultSceneOptions(step, model),
  });
}

function syncFault({ refreshInputs = false } = {}) {
  if (!isFaultStep()) return;
  const step = currentStep();
  const options = step.labOptions ?? {};
  const lab = state.fault;
  const model = faultModel();
  const hideSlip = options.revealSlip && !state.lessonChoiceCorrect;
  // A revealed prediction slides the hanging wall into place.
  if (options.revealSlip && state.lessonChoiceCorrect && !lab.slipped) lab.slipped = true;
  syncFaultScene(model);
  faultScene.setSlipped(lab.slipped && !hideSlip);

  const panel = options.panel ?? null;
  elements.faultViewport.dataset.side = String(Boolean(panel));
  elements.faultViewport.dataset.panel = panel ?? 'none';
  const net = options.net ?? {};
  if (panel === 'net') {
    faultNet.setState({
      plane: model.plane,
      axes: net.axes ? model.axes : null,
      slip: net.slip && !hideSlip ? model.slip : null,
      kinematic: net.kinematic ? model.kinematic : null,
      auxiliary: net.auxiliary || net.ball ? model.auxiliary : null,
      markers: [],
      options: {
        showMap: false,
        showPole: Boolean(net.pole),
        showSlip: Boolean(net.slip) && !hideSlip,
        showKinematic: Boolean(net.kinematic),
        showAuxiliary: Boolean(net.auxiliary),
        showBeachBall: Boolean(net.ball),
        showAxes: Boolean(net.axes),
        showLegend: true,
        planeRef: 'fault',
        poleLabel: '𝐧',
        pickable: Boolean(net.pickable),
        title: net.ball ? 'Stereonet: fault-plane solution' : 'Stereonet: fault and slip',
        caption: 'Lower hemisphere, equal area.',
      },
    });
  }
  if (panel === 'well' && model.log) wellLogPlot.setState({ log: model.log, thickness: FAULT_LAB.bed });

  for (const [selector, key] of [['[data-fault-preset]', 'preset'], ['[data-fault-regime]', 'regime'], ['[data-fault-view]', 'view']]) {
    const data = { preset: 'faultPreset', regime: 'faultRegime', view: 'faultView' }[key];
    for (const button of elements.lessonCard.querySelectorAll(selector)) button.setAttribute('aria-pressed', String(button.dataset[data] === lab[key]));
  }
  for (const [id, value] of [['#rake-input', lab.rake], ['#fault-strike-input', lab.strike], ['#fault-dip-input', lab.dip], ['#ratio-input', lab.ratio], ['#tilt-input', lab.tilt]]) {
    const input = elements.lessonCard.querySelector(id);
    if (input && (refreshInputs || document.activeElement !== input)) input.value = String(value);
  }
  const name = model.classification?.name;
  setText('#rake-output', `${formatNumber(lab.rake, 0)}°${name ? ` (${name})` : ''}`);
  setText('#fault-strike-output', azimuthText(lab.strike));
  setText('#fault-dip-output', `${lab.dip}° toward ${azimuthText(model.plane.dipDirection)}`);
  setText('#ratio-output', formatNumber(lab.ratio));
  const s1 = model.axes?.sigma1;
  setText('#tilt-output', s1 ? `${formatNumber(lab.tilt, 0)}°: σ1 plunges ${formatNumber(s1.plunge, 0)}°${s1.plunge < 89.5 ? ` toward ${azimuthText(s1.trend)}` : ''}` : `${lab.tilt}°`);
  const slipButton = elements.lessonCard.querySelector('#fault-slip-button');
  if (slipButton) {
    slipButton.textContent = lab.slipped ? 'Undo slip' : model.slip ? 'Slip ▸' : 'Slip ▸ (no shear)';
    slipButton.setAttribute('aria-pressed', String(lab.slipped));
    slipButton.disabled = !model.slip;
  }
  const goalCard = elements.lessonCard.querySelector('#goal-card');
  if (goalCard) {
    const met = isGoalMet(step, { slipName: name ?? null, mapSeparation: model.separation?.map?.distance ?? null });
    goalCard.dataset.met = String(met);
    setText('#goal-status', met ? '✓ Goal reached' : 'Not yet');
  }
  syncFaultChrome(step);
  syncEquationValues();
}

function resetFault() {
  initFault(currentStep());
  renderLessonPanel();
  syncAll();
}

const lineMath = (line) => mn(`${azimuthText(line.trend)}/${formatNumber(line.plunge, 0)}°`);
const metres = (value, decimals = 1) => quantityMath(formatNumber(value, decimals), 'm');

function faultLiveValues() {
  const model = faultModel();
  const lab = state.fault;
  const { rake, classification, components, slip, kinematic, traction, frame } = model;
  const values = {
    nVec: tuple([model.pole.x, model.pole.y, model.pole.z]),
    nLine: lineMath(lineFromVector(model.pole)),
    rake: rake === null ? mtext('none') : degrees(rake, 1),
    slipName: classification ? mtext(classification.name) : mtext('no shear: the fault cannot slip'),
    ratio: num(lab.ratio),
  };
  if (slip && components) {
    values.slipLength = metres(model.slipLength, 0);
    values.sStrike = metres(components.strikeSlip);
    values.sDip = metres(components.dipSlip);
    values.throw = metres(Math.abs(model.offset.z));
    const line = lineFromVector(slip);
    values.slipLine = lineMath(line);
    values.plunge = degrees(line.plunge);
    values.lineRake = degrees(lineRakeFromSlipRake(rake), 0);
  }
  const map = model.separation?.map;
  if (map) {
    if (map.distance === null) {
      values.mapSeparation = mtext('undefined: the dike runs parallel to the fault');
      values.mapSense = mtext('nothing: the traces never meet');
    } else {
      values.mapSeparation = metres(map.distance, 0);
      const size = Math.abs(map.distance);
      values.mapSense = mtext(size < 10 ? 'an unbroken dike' : `${formatNumber(size, 0)} m ${map.distance > 0 ? 'sinistral' : 'dextral'}`);
    }
  }
  const log = model.log;
  if (log) {
    if (!log.gap) values.wellGap = mtext(log.faultDepth === null ? 'the well misses the fault' : 'nothing missing or repeated');
    else {
      values.wellGap = mtext(`${formatNumber(log.gap.thickness, 0)} m ${log.gap.kind}`);
    }
  }
  if (traction) {
    values.traction = tuple([traction.traction.x, traction.traction.y, traction.traction.z], 0);
    values.tauVec = tuple([traction.shear.x, traction.shear.y, traction.shear.z], 1);
    values.tauStrike = num(dot(traction.shear, frame.strike), 1);
    values.tauUp = num(dot(traction.shear, frame.updip), 1);
  }
  if (kinematic) {
    values.pLine = lineMath(kinematic.P);
    values.tLine = lineMath(kinematic.T);
    values.bLine = lineMath(kinematic.B);
    if (model.axes) {
      const s1 = lineVector(model.axes.sigma1.trend, model.axes.sigma1.plunge);
      const angle = (Math.acos(Math.min(1, Math.abs(dot(s1, kinematic.vectors.P)))) * 180) / Math.PI;
      values.angleS1P = degrees(angle, 0);
    }
  }
  if (model.axes) values.s1Line = lineMath(model.axes.sigma1);
  return values;
}

const FAULT_SWATCHES = {
  sigma1: ['#f07a3c', 'solid'],
  sigma2: ['#f0e442', 'dashed'],
  sigma3: ['#56b4e9', 'dotted'],
  fault: ['#d9b27c', 'solid'],
  pole: ['#f4f5f7', 'solid'],
  slip: ['#3fd0a0', 'solid'],
  strikeSlip: ['#f0e442', 'dashed'],
  dipSlip: ['#56b4e9', 'dotted'],
  rake: ['#9a8cff', 'solid'],
  dike: ['#f4f5f7', 'solid'],
  separation: ['#cc79a7', 'solid'],
  well: ['#f4f5f7', 'solid'],
  traction: ['#e69f00', 'solid'],
  shearStress: ['#cc79a7', 'dashed'],
  p: ['#9a8cff', 'solid'],
  t: ['#cc79a7', 'solid'],
  b: ['#c3c8d0', 'dashed'],
};

function syncFaultChrome(step) {
  const model = faultModel();
  const options = faultSceneOptions(step, model);
  const net = step.labOptions?.net ?? {};
  elements.interactionHint.textContent = net.pickable && step.controls?.includes('strike')
    ? 'Drag: orbit the block · click or drag on the stereonet to pick the fault’s pole · hover to link'
    : 'Drag: orbit the block · scroll: zoom · hover a symbol or an object to link them';
  const item = (key, label) => {
    const [color, pattern] = FAULT_SWATCHES[key];
    return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
  };
  const legend = [item('fault', 'fault')];
  if (options.showStress) legend.push(item('sigma1', inline(sigmaSymbol('sigma1'))), item('sigma2', inline(sigmaSymbol('sigma2'))), item('sigma3', inline(sigmaSymbol('sigma3'))));
  if (options.showPole) legend.push(item('pole', inline(vec('n'))));
  if (options.showSlipVector && model.slip) legend.push(item('slip', inline(vec('s'))));
  if (options.showComponents) legend.push(item('strikeSlip', inline(sub(mi('s'), mtext('strike')))), item('dipSlip', inline(sub(mi('s'), mtext('dip')))));
  if (options.showRake && model.slip) legend.push(item('rake', inline(mi('λ'))));
  if (options.showDike) legend.push(item('dike', 'dike'));
  if (options.showSeparation) legend.push(item('separation', 'separation'));
  if (options.showWell) legend.push(item('well', 'well'));
  if (options.showTraction) legend.push(item('traction', inline(vec('t'))), item('shearStress', inline(vec('τ'))));
  if (options.showKinematic) legend.push(item('p', inline(mi('P'))), item('t', inline(mi('T'))), item('b', inline(mi('B'))));
  if (options.showSlickenlines) legend.push(item('fault', 'slickenlines (schematic)'));
  elements.sceneLegend.hidden = false;
  elements.sceneLegend.innerHTML = legend.join('');
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
    anderson: () => andersonControlsMarkup(step),
    friction: () => `${frictionControlsMarkup(step)}${goalMarkup(step)}`,
    fault: () => `${faultControlsMarkup(step)}${goalMarkup(step)}`,
  }[step.visualKind]?.() ?? '';

  elements.lessonCard.innerHTML = `
    <div class="lesson-heading"><h2>${step.title}</h2><p>${step.body}</p></div>
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
  andersonScene.highlight(null);
  mohrPlot.highlight(null);
  frictionScene.highlight(null);
  frictionMohr.highlight(null);
  stereonet.highlight(null);
  faultScene.highlight(null);
  faultNet.highlight(null);
  wellLogPlot.highlight(null);
  bindEquationPanel();
  bindForceLabControls();
  bindVectorLabControls();
  bindAndersonControls();
  bindFrictionControls();
  bindFaultControls();
  syncForceLabReadouts();
  syncVectorLab();
  syncAnderson();
  syncFriction();
  syncFault();
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
  if (step.visualKind === 'anderson') {
    initAnderson(step);
    andersonScene.setSlipped(false, { animate: false });
  }
  if (step.visualKind === 'friction') {
    initFriction(step);
    frictionScene.setSlipped(false, { animate: false });
  }
  if (step.visualKind === 'fault') initFault(step);
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
  xPrime: ['#56b4e9', 'dashed'],
  yPrime: ['#e69f00', 'dashed'],
  theta: ['#3fd0a0', 'solid'],
  elevation: ['#9a8cff', 'solid'],
  plane: ['#d9b27c', 'solid'],
};

function legendItem(swatch, label) {
  const [color, pattern] = LEGEND_SWATCHES[swatch];
  return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
}

function syncVectorLabChrome(step) {
  const options = { ...step.labOptions, ...activeContext()?.options };
  const is3d = state.vectorLab.dimension === 3;
  const draggable = options.draggable?.length > 0;
  if (options.polar) {
    elements.interactionHint.textContent = `Drag the round handle around the origin: the angle snaps to 5°${options.fixedLength ? '' : ', the length to half units'} · scroll to zoom`;
  } else if (!draggable) {
    elements.interactionHint.textContent = is3d ? 'The vector is held still · drag empty space: orbit · scroll to zoom' : 'The vector is held still · scroll to zoom';
  } else {
    elements.interactionHint.textContent = is3d
      ? 'Drag a round handle: move the tip across the floor · Shift + drag: up or down · drag empty space: orbit'
      : 'Drag the round handle to move the tip · scroll to zoom';
  }
  const sum = options.layout === 'sum';
  const component = (axis) => inline(sub(mi('v'), mi(axis)));
  const legend = [legendItem('vector', inline(options.fixedLength === 1 ? hat(vec('v')) : vec(sum ? 'a' : 'v')))];
  if (sum) legend.push(legendItem('b', inline(vec('b'))), legendItem('result', inline(vec('a'), mo('+'), vec('b'))));
  if (!sum && options.showComponents !== false) {
    legend.push(legendItem('x', component('x')), legendItem('y', component('y')));
    if (is3d) legend.push(legendItem('z', component('z')));
  }
  if (options.showTriangles && is3d) legend.push(legendItem('guide', inline(mi('d'))));
  if (options.showUnit) legend.push(legendItem('result', inline(hat(vec('v')))));
  if (options.showScaled) legend.push(legendItem('result', inline(mi('c'), vec('v'))));
  if (options.showAngle) legend.push(legendItem('x', inline(mi('α'))));
  if (options.showDirectionAngles) legend.push(legendItem('x', inline(mi('α'))), legendItem('y', inline(mi('β'))), legendItem('z', inline(mi('γ'))));
  if (options.showElevation && is3d) legend.push(legendItem('elevation', inline(mi('ε'))));
  if (options.rotatedAxes) legend.push(legendItem('xPrime', inline(mi('x′'))), legendItem('yPrime', inline(mi('y′'))), legendItem('theta', inline(mi('θ'))));
  if (options.showPrimedComponents) legend.push(legendItem('xPrime', inline(primed('v', 'x'))), legendItem('yPrime', inline(primed('v', 'y'))));
  if (options.planeTrace) legend.push(legendItem('plane', 'plane'));
  elements.sceneLegend.hidden = false;
  elements.sceneLegend.innerHTML = legend.join('');
}

const ANDERSON_SWATCHES = {
  sigma1: ['#f07a3c', 'solid'],
  sigma2: ['#f0e442', 'dashed'],
  sigma3: ['#56b4e9', 'dotted'],
  fault: ['#f4f5f7', 'solid'],
  conjugate: ['#a7aeb8', 'dashed'],
  slip: ['#3fd0a0', 'solid'],
  beta: ['#cc79a7', 'solid'],
  dip: ['#9a8cff', 'solid'],
};

function syncAndersonChrome(step) {
  const options = andersonOptions(step);
  elements.interactionHint.textContent = 'Drag: orbit the block · scroll: zoom · hover a symbol or an object to link them';
  const item = (key, label) => {
    const [color, pattern] = ANDERSON_SWATCHES[key];
    return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
  };
  const legend = [];
  if (options.showAxes) legend.push(item('sigma1', inline(sigmaSymbol('sigma1'))), item('sigma2', inline(sigmaSymbol('sigma2'))), item('sigma3', inline(sigmaSymbol('sigma3'))));
  if (options.showFaults) {
    legend.push(item('fault', 'fault'));
    if (options.showConjugate) legend.push(item('conjugate', 'conjugate'));
    if (options.showAngles) legend.push(item('beta', inline(mi('β'))));
    if (options.showAngles && state.anderson.regime !== 'strike-slip') legend.push(item('dip', inline(mi('δ'))));
    if (options.showSlip) legend.push(item('slip', 'slip'));
  }
  elements.sceneLegend.hidden = legend.length === 0;
  elements.sceneLegend.innerHTML = legend.join('');
}

function syncAll() {
  const preset = getStressState(state.selectedId);
  const lessonView = isLessonView();
  const lesson = currentLesson();
  const step = lessonView ? currentStep() : null;
  const unit = unitOf(lesson);
  elements.activeName.textContent = step?.activeLabel ?? (state.customized ? `Modified ${preset.name}` : preset.name);
  if (step) {
    // Lesson badge: unit letter stacked over lesson.step, boxed in the unit's color.
    const [, letter, number] = lesson.id.match(/^([A-Z]+)(\d+)$/);
    elements.activeNumber.className = 'state-number lesson-badge';
    elements.activeNumber.dataset.unit = String(unit.number);
    elements.activeNumber.setAttribute('aria-label', `Lesson ${lesson.id}, step ${state.lessonStepIndex + 1}`);
    elements.activeNumber.innerHTML = `<span class="lesson-badge-unit" aria-hidden="true">${letter}</span><span class="lesson-badge-number" aria-hidden="true">${number}.${state.lessonStepIndex + 1}</span>`;
  } else {
    elements.activeNumber.className = 'state-number';
    delete elements.activeNumber.dataset.unit;
    elements.activeNumber.removeAttribute('aria-label');
    elements.activeNumber.textContent = String(preset.number).padStart(2, '0');
  }
  elements.lessonProgressLabel.textContent = `${lesson.id} ${lesson.title} · Step ${state.lessonStepIndex + 1} of ${lesson.steps.length}`;
  elements.moduleChipLabel.textContent = lessonView ? 'Current unit' : 'Laboratory';
  elements.moduleChipValue.textContent = lessonView ? `${unit.number} · ${unit.title}` : 'Stress states';
  elements.responseText.textContent = currentResponseText();
  elements.magnitudeInput.value = String(Math.max(state.magnitude, 5));
  elements.magnitudeOutput.textContent = `${state.magnitude.toFixed(0)} MPa`;
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;

  const forceLabActive = isForceLabStep();
  const vectorLabActive = isVectorLabStep();
  const andersonActive = isAndersonStep();
  const frictionActive = isFrictionStep();
  const faultActive = isFaultStep();
  if (forceLabActive) {
    syncForceLabChrome(step);
    syncForceLabReadouts();
  } else if (vectorLabActive) {
    syncVectorLabChrome(step);
  } else if (andersonActive) {
    syncAndersonChrome(step);
  } else if (frictionActive) {
    syncFrictionChrome(step);
  } else if (faultActive) {
    syncFaultChrome(step);
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
  andersonScene.renderer.domElement.setAttribute('aria-hidden', String(!andersonActive));
  elements.mohrPanel.setAttribute('aria-hidden', String(!andersonActive));
  frictionScene.renderer.domElement.setAttribute('aria-hidden', String(!frictionActive));
  elements.frictionMohr.setAttribute('aria-hidden', String(!frictionActive));
  elements.frictionNet.setAttribute('aria-hidden', String(!frictionActive));
  faultScene.renderer.domElement.setAttribute('aria-hidden', String(!faultActive));
  elements.faultNet.setAttribute('aria-hidden', String(!faultActive));
  elements.faultWell.setAttribute('aria-hidden', String(!faultActive));
  const labActive = forceLabActive || vectorLabActive || andersonActive || frictionActive || faultActive;
  stressScene.renderer.domElement.setAttribute('aria-hidden', String(labActive));
  elements.replayButton.innerHTML = labActive ? 'Reset values' : '<span aria-hidden="true">↻</span> Replay';
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
  else if (isAndersonStep()) resetAnderson();
  else if (isFrictionStep()) resetFriction();
  else if (isFaultStep()) resetFault();
  else stressScene.replay();
});
elements.resetViewButton.addEventListener('click', () => {
  if (isForceLabStep()) forceLabScene.resetCamera();
  else if (isVectorLabStep()) vectorLabScene.resetCamera();
  else if (isAndersonStep()) andersonScene.resetCamera();
  else if (isFrictionStep()) frictionScene.resetCamera();
  else if (isFaultStep()) faultScene.resetCamera();
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
  } else if (event.key === 'Home') {
    event.preventDefault();
    jumpToStep(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    jumpToStep(currentLesson().steps.length - 1);
  } else if (/^[1-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const index = Number(event.key) - 1;
    if (index < currentLesson().steps.length) {
      event.preventDefault();
      jumpToStep(index);
    }
  }
});

renderPresets();
renderLessonPicker();
renderComponentControls();
renderPresentationOptions();
loadLesson(DEFAULT_LESSON_ID);
