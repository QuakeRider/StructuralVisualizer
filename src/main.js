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
import {
  RELAY,
  classifyDrag,
  displacementAt,
  displacementProfile,
  dlScaling,
  dragDisplacement,
  faultDisplacement,
  relayFaults,
  relaySystem,
} from './domain/faultGrowth.js';
import {
  COMMINUTION,
  DAMAGE,
  MELTING,
  WELL_DEVELOPED,
  ZONE_TEMPERATURES,
  clastSizeDistribution,
  comminutionState,
  damagePeak,
  damageZoneEdge,
  depthOfTemperature,
  faultRockZones,
  fractionFiner,
  frictionalHeating,
  pavementTraces,
  permeabilityStructure,
  rockComposition,
  scanlineCrossings,
  scanlineDensity,
  sectionTraces,
  sibsonClass,
  slabTexture,
  strikeFaceTraces,
  woodcockMortClass,
  zoneDensity,
} from './domain/faultRocks.js';
import { lineVector, normalizeAzimuth, planeFromStrike, planePole } from './domain/orientation.js';
import { lineFromVector, planeFromPole } from './domain/stereonet.js';
import { resolveTraction } from './domain/tensor.js';
import { basis, frac, hat, inline, mi, mn, mo, mtext, num, paren, primed, row, signedTerm, sqrt, squared, sub, sup, tuple, vec } from './lessons/mathml.js';
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
import { FaultGrowthScene, formatLength } from './visualization/FaultGrowthScene.js';
import { FaultRockChart } from './visualization/FaultRockChart.js';
import { FaultScene } from './visualization/FaultScene.js';
import { FaultZoneScene } from './visualization/FaultZoneScene.js';
import { ArchitectureGauge, DamageMap, DepthColumn } from './visualization/FaultZonePanels.js';
import { ForceLabScene } from './visualization/ForceLabScene.js';
import { FrictionMohrPlot } from './visualization/FrictionMohrPlot.js';
import { MohrPlot } from './visualization/MohrPlot.js';
import { Stereonet } from './visualization/Stereonet.js';
import { StressScene } from './visualization/StressScene.js';
import { VectorScene } from './visualization/VectorScene.js';
import { WellLog } from './visualization/WellLog.js';
import { XYPlot } from './visualization/XYPlot.js';

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
const DEFAULT_GROWTH = { view: '3d', section: 0, profileW: 0, model: 'elliptical', lIndex: 8, cIndex: 4, n: 1, growth: 0.2, drag: 0.4 };
/**
 * B9 fault-growth lab (NED metres, origin on the ground above the block center). The
 * faults strike north and dip 60° east. 'isolated': one blind fault with an elliptical
 * tip line in the 1 km block; 'through': a fault whose tips are far away (drag). The
 * relay model is RELAY in faultGrowth.js; process zones reach 35 m ahead of each
 * growing tip. Displacements are large (D/L = 0.1) so they read on screen.
 */
const GROWTH_LAB = Object.freeze({
  horizonColors: ['#c2a878', '#9a5b45', '#8f9a6a'],
  isolated: { center: { x: 0, y: 0, z: 250 }, a: 400, b: 240, dMax: 80, decay: 350, horizons: [125, 250, 375], contourLevels: [20, 40, 60] },
  through: { center: { x: 0, y: 0, z: 250 }, slip: 60, dragWidth: 80, horizons: [125, 250, 375], section: -300 },
  processZone: { ahead: 35, rx: 40, ry: 24 },
  /** Fault lengths and scaling constants the D–L sliders step through (m). */
  lengths: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
  constants: [0.001, 0.002, 0.003, 0.005, 0.01, 0.02, 0.03, 0.05, 0.1],
  /** The block shows a fault 800 m long; D/L is drawn to scale up to this value. */
  displayLength: 800,
  maxDisplayRatio: 0.25,
});
const DEFAULT_ZONE = {
  view: '3d', scale: 'outcrop', strands: 1, lenses: 0, core: 0.8, footwall: 5, hangingWall: 8, host: 'crystalline', stage: 'slip', scanline: 0,
  logD: 1, logK: 2, logA: 0, logSlip: -1.5, logDMax: 1, df: 2.2, cohesive: true, foliated: false, tau: 50, logHeatSlip: 0, logWidth: -2, gradient: 30, madeRocks: [],
};
/**
 * B11 fault-zone lab (NED metres, origin on the outcrop surface above the fault).
 * The fault strikes north, dips 60° east, and has slipped 10 m; the outcrop is
 * 40 m across (1 km at map scale). In sandstone the density law counts
 * deformation bands; its stages set the zone's widths. The melting step starts
 * at 200 °C with a cataclasite ground by 3 m of slip. The slab is drawn on a
 * 480 × 288 grid. The other stated values live in faultRocks.js.
 */
const ZONE_LAB = Object.freeze({
  dip: 60,
  slip: 10,
  outcrop: 40,
  mapScale: 1000,
  traceLength: 3,
  sandLaw: { background: 0.2, x0: 0.02, n: 0.8 },
  stages: {
    bands: { core: 0, footwall: 0.6, hangingWall: 0.6, strands: 0 },
    zone: { core: 0, footwall: 1.5, hangingWall: 1.8, strands: 0 },
    slip: { core: 0.05, footwall: 3, hangingWall: 4, strands: 1 },
  },
  ambient: 200,
  meltHostSlip: 3,
  slab: { nx: 480, ny: 288 },
  surfaceT: 10,
  crust: 60000,
});
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
          <div id="growth-viewport" class="viewport growth-viewport split-viewport" data-side="true" data-panel="profile">
            <div id="growth-scene" class="lab-scene"></div>
            <div class="plot-panel plot-stack"><div id="growth-plot" class="plot-slot growth-plot-slot"></div></div>
          </div>
          <div id="zone-viewport" class="viewport zone-viewport split-viewport" data-side="true">
            <div id="zone-scene" class="lab-scene"></div>
            <div class="plot-panel plot-stack">
              <div id="zone-plot-a" class="plot-slot"></div><div id="zone-plot-b" class="plot-slot"></div><div id="zone-map" class="plot-slot"></div>
              <div id="zone-chart" class="plot-slot"></div><div id="zone-depth" class="plot-slot"></div><div id="zone-gauge" class="plot-slot"></div>
            </div>
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
  growthViewport: document.querySelector('#growth-viewport'),
  growthScene: document.querySelector('#growth-scene'),
  growthPlot: document.querySelector('#growth-plot'),
  zoneViewport: document.querySelector('#zone-viewport'),
  zoneScene: document.querySelector('#zone-scene'),
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
  growth: { ...DEFAULT_GROWTH },
  zone: structuredClone(DEFAULT_ZONE),
};

function currentLesson() {
  return getLesson(state.lessonId);
}

function currentStep() {
  return getLessonStep(currentLesson(), state.lessonStepIndex);
}

function unitOf(lesson) {
  return UNITS.find((unit) => unit.id === lesson.unit);
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

function isGrowthStep() {
  return isLessonView() && currentStep().visualKind === 'fault-growth';
}

function isZoneStep() {
  return isLessonView() && currentStep().visualKind === 'fault-zone';
}

function isLabStep() {
  return isForceLabStep() || isVectorLabStep() || isAndersonStep() || isFrictionStep() || isFaultStep() || isGrowthStep() || isZoneStep();
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

function growthHover(ref) {
  if (!isGrowthStep()) return;
  growthScene.highlight(ref);
  growthPlot.highlight(ref);
  markEquationRefs(ref);
}

/** The fault-growth lab (B9): marker beds and fault surfaces in the block, with a plot beside it. */
const growthScene = new FaultGrowthScene(elements.growthScene, { onHover: growthHover });
const growthPlot = new XYPlot(elements.growthPlot, { onHover: growthHover });

function zoneHover(ref) {
  if (!isZoneStep()) return;
  setZoneHighlight(ref);
  markEquationRefs(ref);
}

function setZoneHighlight(ref) {
  for (const view of [zoneScene, zonePlotA, zonePlotB, zoneChart, damageMap, depthColumn, architectureGauge]) view.highlight(ref);
}

/** The fault-zone lab (B11): the outcrop, a fault-rock slab, or the crust, with plots and panels beside it. */
const zoneScene = new FaultZoneScene(elements.zoneScene, { onHover: zoneHover });
const zonePlotA = new XYPlot(elements.zoneViewport.querySelector('#zone-plot-a'), { onHover: zoneHover });
const zonePlotB = new XYPlot(elements.zoneViewport.querySelector('#zone-plot-b'), { onHover: zoneHover });
const zoneChart = new FaultRockChart(elements.zoneViewport.querySelector('#zone-chart'), { onHover: zoneHover });
const damageMap = new DamageMap(elements.zoneViewport.querySelector('#zone-map'), { onHover: zoneHover });
const depthColumn = new DepthColumn(elements.zoneViewport.querySelector('#zone-depth'), { onHover: zoneHover });
const architectureGauge = new ArchitectureGauge(elements.zoneViewport.querySelector('#zone-gauge'), { onHover: zoneHover });
damageMap.render();

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
      ${LESSONS.filter((lesson) => lesson.unit === unit.id).map((lesson) => `
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
  growthScene.highlight(isGrowthStep() ? ref : null);
  growthPlot.highlight(isGrowthStep() ? ref : null);
  setZoneHighlight(isZoneStep() ? ref : null);
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
  if (isGrowthStep()) return growthLiveValues();
  if (isZoneStep()) return zoneLiveValues();
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

/* ---------- Fault-growth lab (B9) ---------- */

const GROWTH_VIEWS = { '3d': '3D', map: 'Map', section: 'Section', fault: 'Fault face' };
const FAULT_PLANE = planeFromStrike(0, 60);

/** Synthetic D–L data (deterministic): lengths from 2 m to 50 km with D/L scattered about 0.015, mostly between 0.001 and 0.1. */
const SYNTHETIC_DL = (() => {
  let seed = 17;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: 150 }, () => {
    const logL = 0.3 + random() * 4.4;
    const logRatio = Math.min(-1, Math.max(-3, -1.8 + (random() + random() + random() - 1.5) * 0.75));
    return [10 ** logL, 10 ** (logL + logRatio)];
  });
})();

/** Everything the fault-growth lab draws, from the step's setup and the lab state. */
function growthModel() {
  const step = currentStep();
  const options = step.labOptions ?? {};
  const lab = state.growth;
  const colors = GROWTH_LAB.horizonColors;
  const horizonsAt = (depths) => depths.map((depth, index) => ({ depth, color: colors[index % colors.length] }));
  const base = { setup: options.setup, metersPerUnit: 250, contourInterval: 10, colorMax: 1, contourLevels: [], section: null, profile: null, relay: null, dimension: null, scaleParts: null };

  if (options.setup === 'through') {
    const setup = GROWTH_LAB.through;
    const k = lab.drag;
    return {
      ...base,
      faults: [{ id: 'main', ref: 'fault', center: setup.center, plane: FAULT_PLANE, field: { uniform: true, dMax: setup.slip }, drag: { k, width: setup.dragWidth }, surface: { kind: 'rect', uMin: -520, uMax: 520, wMin: -300, wMax: 300 } }],
      horizons: horizonsAt(setup.horizons),
      section: { x: setup.section, horizon: 1, showOffset: true, cut: true, offsetLabel: [['D', 'var'], [` = ${setup.slip} m`]] },
      options: { showWallLabels: true, colorFault: false, showTipLine: false },
      drag: { k, name: classifyDrag(k), slip: setup.slip, width: setup.dragWidth },
    };
  }

  if (options.setup === 'relay') {
    const system = relaySystem(lab.growth);
    const refs = { A: 'segment-a', B: 'segment-b', breach: 'breach' };
    const faults = relayFaults(system).map((fault) => ({
      ...fault,
      ref: refs[fault.id],
      surface: fault.id === 'breach'
        ? { kind: 'rect', uMin: -fault.halfLength, uMax: fault.halfLength, wMin: -RELAY.height, wMax: RELAY.height }
        : { kind: 'ellipse', u0: fault.tipLine.u0, a: fault.tipLine.a, b: fault.tipLine.b },
    }));
    const half = RELAY.stepover / 2;
    const overlap = system.overlap;
    // The ramp's tilt along its middle line, from the moved bed.
    const depthAt = (x) => RELAY.depth + faults.reduce((sum, fault) => sum + faultDisplacement({ x, y: 0, z: RELAY.depth }, fault).vector.z, 0);
    const reach = Math.max(20, Math.min(Math.abs(overlap) / 2 - 5, 60));
    const tilt = (Math.atan2(depthAt(-reach) - depthAt(reach), 2 * reach) * 180) / Math.PI;
    let totalMax = 0;
    for (let x = -RELAY.outerTip; x <= RELAY.outerTip; x += 5) totalMax = Math.max(totalMax, system.profile(x).total);
    return {
      ...base,
      faults,
      horizons: [{ depth: RELAY.depth, color: colors[0] }],
      horizonShading: { range: 22 },
      camera: { zoom: 0.66, depth: RELAY.depth },
      contourInterval: 5,
      // Fault surfaces stop just above the highest footwall cutoff, so the bed hides the rest from above.
      surfaceTop: RELAY.depth - (system.target.dMax / 2) * Math.sin(Math.PI / 3) - 4,
      colorMax: system.target.dMax,
      options: { colorFault: true, showTipLine: false, bedContours: true },
      relay: {
        labels: { A: { x: -380, y: -half, z: RELAY.depth }, B: { x: 380, y: half, z: RELAY.depth }, ...(system.breach ? { breach: { x: 30, y: 30, z: RELAY.depth } } : {}) },
        ramp: overlap > 0 ? { x: system.breach ? -80 : 0, y: 0, z: RELAY.depth } : null,
        rampZone: overlap > 0 ? { xMin: -overlap / 2, xMax: overlap / 2, yMin: -half, yMax: half } : null,
        // Ahead of the growing inner tips: A's northern tip and B's southern tip.
        processZones: options.processZones && !system.breach ? [
          { x: overlap / 2 + GROWTH_LAB.processZone.ahead, y: -half, rx: GROWTH_LAB.processZone.rx, ry: GROWTH_LAB.processZone.ry },
          { x: -overlap / 2 - GROWTH_LAB.processZone.ahead, y: half, rx: GROWTH_LAB.processZone.rx, ry: GROWTH_LAB.processZone.ry },
        ] : [],
      },
      system,
      tilt,
      totalMax,
    };
  }

  // Isolated fault: steps 2–4. The scaling step draws the fault at the chosen size (D/L to scale).
  const setup = GROWTH_LAB.isolated;
  let field = { a: setup.a, b: setup.b, dMax: setup.dMax, model: lab.model };
  let scaling = null;
  if (options.scaling) {
    const length = GROWTH_LAB.lengths[lab.lIndex];
    const c = GROWTH_LAB.constants[lab.cIndex];
    const displacement = dlScaling(length, c, lab.n);
    const ratio = displacement / length;
    field = { ...field, model: 'elliptical', dMax: Math.min(ratio, GROWTH_LAB.maxDisplayRatio) * GROWTH_LAB.displayLength };
    scaling = { length, c, n: lab.n, displacement, ratio };
  }
  const profile = options.profile ? displacementProfile(field, { w: lab.profileW }) : null;
  const sectionD = options.section ? displacementAt(field, lab.section, 0) : null;
  const blockMetres = scaling ? (1000 * scaling.length) / GROWTH_LAB.displayLength : 1000;
  return {
    ...base,
    faults: [{ id: 'main', ref: 'displacement', center: setup.center, plane: FAULT_PLANE, field, decay: setup.decay, surface: { kind: 'ellipse', a: setup.a, b: setup.b } }],
    horizons: horizonsAt(setup.horizons),
    colorMax: field.dMax,
    contourLevels: options.contours && !scaling ? setup.contourLevels : [],
    section: options.section ? { x: lab.section, horizon: 1, showOffset: true, cut: true, offsetLabel: [['D', 'var'], [` = ${formatNumber(sectionD, 0)} m`]] } : null,
    profile: profile ? { w: lab.profileW, halfLength: profile.halfLength } : null,
    dimension: scaling ? { parts: [['L', 'var'], [` = ${formatLength(scaling.length)}`]] } : null,
    scaleParts: [[formatLength(blockMetres)]],
    options: { showHangingWall: !options.hideHangingWall, colorFault: true, showTipLine: true, showContours: Boolean(options.contours) && !scaling, showWallLabels: !scaling, showTipLabel: true },
    field,
    sectionD,
    profileSlice: profile,
    scaling,
  };
}

function growthControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const options = step.labOptions ?? {};
  const lab = state.growth;
  const parts = [];
  const range = (id, label, min, max, stepSize, value) => `<label class="lab-control" for="${id}"><span>${label} <output id="${id}-output"></output></span><input id="${id}" class="range" type="range" min="${min}" max="${max}" step="${stepSize}" value="${value}" /></label>`;
  if (controls.has('view')) {
    parts.push(`
      <div class="direction-control"><span>View</span><div class="segmented-control" role="group" aria-label="Camera view">
        ${(options.views ?? ['3d']).map((view) => `<button type="button" data-growth-view="${view}" aria-pressed="${lab.view === view}">${GROWTH_VIEWS[view]}</button>`).join('')}
      </div></div>`);
  }
  if (controls.has('model')) {
    parts.push(`
      <div class="direction-control"><span>Model</span><div class="segmented-control" role="group" aria-label="Displacement model">
        <button type="button" data-growth-model="elliptical" aria-pressed="${lab.model === 'elliptical'}">Elliptical</button>
        <button type="button" data-growth-model="linear" aria-pressed="${lab.model === 'linear'}">Linear taper</button>
      </div></div>`);
  }
  if (controls.has('section')) parts.push(range('growth-section-input', `Section ${inline(mi('u'))}`, -480, 480, 10, lab.section));
  if (controls.has('profile')) parts.push(range('growth-profile-input', `Profile line ${inline(mi('w'))}`, -230, 230, 10, lab.profileW));
  if (controls.has('length')) parts.push(range('growth-length-input', `Length ${inline(mi('L'))}`, 0, GROWTH_LAB.lengths.length - 1, 1, lab.lIndex));
  if (controls.has('c')) parts.push(range('growth-c-input', `Constant ${inline(mi('c'))}`, 0, GROWTH_LAB.constants.length - 1, 1, lab.cIndex));
  if (controls.has('n')) parts.push(range('growth-n-input', `Exponent ${inline(mi('n'))}`, 0.5, 1.5, 0.1, lab.n));
  if (controls.has('growth')) {
    const [min, max] = options.growthRange ?? [0, 1];
    parts.push(range('growth-growth-input', 'Growth', min, max, 0.01, lab.growth));
  }
  if (controls.has('drag')) parts.push(range('growth-drag-input', `Drag factor ${inline(mi('k'))}`, -0.6, 0.6, 0.05, lab.drag));
  return parts.length ? `<div class="lab-controls">${parts.join('')}</div>` : '';
}

function bindGrowthControls() {
  const lab = () => state.growth;
  for (const button of elements.lessonCard.querySelectorAll('[data-growth-view]')) {
    button.addEventListener('click', () => {
      lab().view = button.dataset.growthView;
      growthScene.setView(lab().view);
      syncGrowth();
    });
  }
  for (const button of elements.lessonCard.querySelectorAll('[data-growth-model]')) {
    button.addEventListener('click', () => {
      lab().model = button.dataset.growthModel;
      syncGrowth();
    });
  }
  const bindRange = (id, key) => elements.lessonCard.querySelector(id)?.addEventListener('input', (event) => {
    lab()[key] = Number(event.target.value);
    syncGrowth();
  });
  bindRange('#growth-section-input', 'section');
  bindRange('#growth-profile-input', 'profileW');
  bindRange('#growth-length-input', 'lIndex');
  bindRange('#growth-c-input', 'cIndex');
  bindRange('#growth-n-input', 'n');
  bindRange('#growth-growth-input', 'growth');
  bindRange('#growth-drag-input', 'drag');
}

function initGrowth(step) {
  state.growth = { ...DEFAULT_GROWTH, ...(step.initialLabState ?? {}) };
  growthScene.setState(growthModel());
  growthScene.setView(state.growth.view);
}

const STAGE_NAMES = { underlapping: 'underlapping', overlapping: 'soft-linked', breached: 'hard-linked' };
const metreText = (value, decimals = 0) => `${formatNumber(value, decimals)} m`;

/** The plot beside the block: a displacement profile, the D–L plot, the relay profiles, or the drag profile. */
function syncGrowthPlot(step, model) {
  const options = step.labOptions ?? {};
  const alongStrike = { label: '<tspan font-style="italic">x</tspan> (m)', min: -500, max: 500, ticks: [-400, -200, 0, 200, 400] };
  if (options.panel === 'profile') {
    const field = model.field;
    const center = displacementProfile(field, { w: 0, count: 161 });
    const series = [];
    const markers = [];
    const vlines = [{ ref: 'tip-line', x: -field.a, color: '#f4f5f7', dash: '3 5' }, { ref: 'tip-line', x: field.a, color: '#f4f5f7', dash: '3 5' }];
    if (model.profileSlice) {
      const slice = displacementProfile(field, { w: state.growth.profileW, count: 161 });
      series.push({ ref: 'displacement', points: center.points.map((point) => [point.u, point.d]), color: '#9aa1ad', width: 2, dash: '7 6', label: 'center line, <tspan font-style="italic">w</tspan> = 0' });
      series.push({ ref: 'profile-line', points: slice.points.map((point) => [point.u, point.d]), color: '#e69f00', label: `profile at <tspan font-style="italic">w</tspan> = ${formatNumber(state.growth.profileW, 0)} m` });
    } else {
      series.push({ ref: 'displacement', points: center.points.map((point) => [point.u, point.d]), color: '#f4f5f7', label: 'middle bed' });
    }
    if (model.section) {
      vlines.push({ ref: 'section', x: state.growth.section, color: '#56b4e9', dash: '6 4', width: 2.4 });
      markers.push({ ref: 'offset', x: state.growth.section, y: model.sectionD, color: '#cc79a7', label: `${metreText(model.sectionD)}`, dx: state.growth.section > 250 ? -12 : 12, anchor: state.growth.section > 250 ? 'end' : 'start' });
    }
    growthPlot.setState({
      title: 'Displacement along strike',
      caption: 'Tip line dotted. Colors match the fault surface.',
      x: { ...alongStrike, label: '<tspan font-style="italic">u</tspan> (m)' },
      y: { label: '<tspan font-style="italic">D</tspan> (m)', min: 0, max: 100, ticks: [0, 20, 40, 60, 80, 100] },
      series,
      markers,
      vlines,
      colorbar: { max: field.dMax, ref: 'displacement' },
      ariaLabel: `Displacement along strike. Peak ${metreText(field.dMax)}; zero at the tips, ${metreText(field.a)} from the center.`,
    });
    return;
  }
  if (options.panel === 'scaling') {
    const { length, c, n, displacement } = model.scaling;
    const lengths = [1, 1e5];
    const lengthFormat = (value) => formatLength(value);
    const displacementFormat = (value) => (value >= 1000 ? `${formatNumber(value / 1000, 0)} km` : value >= 1 ? `${formatNumber(value, 0)} m` : value >= 0.01 ? `${formatNumber(value * 100, 0)} cm` : `${formatNumber(value * 1000, 0)} mm`);
    const answered = state.lessonChoiceCorrect;
    growthPlot.setState({
      title: 'Displacement–length scaling',
      caption: 'Log–log axes. Gray points: synthetic faults.',
      x: { label: '<tspan font-style="italic">L</tspan>', min: 1, max: 1e5, log: true, format: lengthFormat },
      y: { label: '<tspan font-style="italic">D</tspan>', min: 1e-3, max: 1e4, log: true, format: displacementFormat },
      series: [
        { ref: 'dl-data', kind: 'points', points: SYNTHETIC_DL, color: '#9aa1ad', radius: 2.8, opacity: 0.55, label: 'synthetic faults' },
        { ref: 'dl-data', points: lengths.map((value) => [value, 0.1 * value]), color: '#6c7380', width: 1.4, dash: '4 5' },
        { ref: 'dl-data', points: lengths.map((value) => [value, 0.001 * value]), color: '#6c7380', width: 1.4, dash: '4 5' },
        { ref: 'dl-line', points: Array.from({ length: 21 }, (_, index) => { const value = 10 ** (index / 4); return [value, dlScaling(value, c, n)]; }), color: '#3fd0a0', label: `<tspan font-style="italic">D</tspan> = ${formatNumber(c, 3)} <tspan font-style="italic">L</tspan><tspan dy="-0.45em" font-size="0.72em">${formatNumber(n, 1)}</tspan>` },
      ],
      markers: [{ ref: 'dl-point', x: length, y: displacement, color: '#e69f00', shape: 'diamond', label: answered ? `${formatLength(length)}, ${displacementFormat(displacement)}` : `${formatLength(length)}`, dx: length > 3e3 ? -14 : 14, anchor: length > 3e3 ? 'end' : 'start', key: 'this fault' }],
      notes: [
        { ref: 'dl-data', x: 1.6e4, y: 0.1 * 1.6e4, text: 'D/L = 0.1', dy: -12, color: '#9aa1ad' },
        { ref: 'dl-data', x: 1.6e4, y: 0.001 * 1.6e4, text: 'D/L = 0.001', dy: 20, color: '#9aa1ad' },
      ],
      ariaLabel: `Log–log plot of displacement against length with the line D = c L to the n, c = ${formatNumber(c, 3)}, n = ${formatNumber(n, 1)}.`,
    });
    return;
  }
  if (options.panel === 'relay') {
    const { system } = model;
    const xs = Array.from({ length: 201 }, (_, index) => -500 + index * 5);
    const samples = xs.map((x) => ({ x, ...system.profile(x) }));
    const series = [
      { ref: 'segment-a', points: samples.map((point) => [point.x, point.A]), color: '#56b4e9', dash: '9 6', label: '<tspan font-style="italic">D</tspan><tspan dy="0.3em" font-size="0.7em">A</tspan>' },
      { ref: 'segment-b', points: samples.map((point) => [point.x, point.B]), color: '#e69f00', dash: '3 5', label: '<tspan font-style="italic">D</tspan><tspan dy="0.3em" font-size="0.7em">B</tspan>' },
    ];
    if (system.linked > 0) series.push({ ref: 'breach', points: samples.map((point) => [point.x, point.extraA + point.extraB + point.extraBreach]), color: '#cc79a7', width: 2.4, label: '<tspan font-style="italic">D</tspan><tspan dy="0.3em" font-size="0.7em">link</tspan>' });
    if (options.target) series.push({ ref: 'target-profile', points: samples.map((point) => [point.x, point.target]), color: '#9aa1ad', width: 2, dash: '7 6', label: 'one 920 m fault' });
    series.push({ ref: 'sum-profile', points: samples.map((point) => [point.x, point.total]), color: '#f4f5f7', width: 3.6, label: '<tspan font-style="italic">D</tspan><tspan dy="0.3em" font-size="0.7em">sum</tspan>' });
    const overlap = system.overlap;
    const bands = overlap > 0 ? [{ ref: 'relay-ramp', from: -overlap / 2, to: overlap / 2, color: '#3fd0a0', opacity: 0.18 }] : [{ ref: 'relay-ramp', from: overlap / 2, to: -overlap / 2, color: '#9aa1ad', opacity: 0.12 }];
    growthPlot.setState({
      title: 'Displacement along strike',
      caption: overlap > 0 ? 'Green band: where the segments overlap (the ramp).' : 'Gray band: the unfaulted gap between the tips.',
      x: alongStrike,
      y: { label: '<tspan font-style="italic">D</tspan> (m)', min: 0, max: 110, ticks: [0, 20, 40, 60, 80, 100] },
      series,
      bands,
      ariaLabel: `Displacement profiles of segments A and B and their sum, ${STAGE_NAMES[system.stage]}.`,
    });
    return;
  }
  if (options.panel === 'drag') {
    const { k, slip, width } = model.drag;
    const hanging = Array.from({ length: 61 }, (_, index) => { const d = (index / 60) * 450; return [d, dragDisplacement(d, { slip, k, width })]; });
    const foot = hanging.map(([d, u]) => [-d, -u]);
    const far = dragDisplacement(450, { slip, k, width });
    growthPlot.setState({
      title: 'Movement across the fault',
      caption: 'Each wall’s movement along the dip, down positive.',
      x: { label: 'distance from the fault (m)', min: -450, max: 450, ticks: [-400, -200, 0, 200, 400] },
      y: { label: '<tspan font-style="italic">u</tspan> (m)', min: -60, max: 60, ticks: [-60, -30, 0, 30, 60] },
      series: [
        { ref: 'far-offset', points: [[-450, -slip / 2], [0, -slip / 2]], color: '#6c7380', width: 1.6, dash: '5 5' },
        { ref: 'far-offset', points: [[0, slip / 2], [450, slip / 2]], color: '#6c7380', width: 1.6, dash: '5 5', label: 'no drag' },
        { ref: 'drag-profile', points: foot, color: '#f4f5f7', label: `<tspan font-style="italic">u</tspan>(<tspan font-style="italic">d</tspan>), ${classifyDrag(k)}` },
        { ref: 'drag-profile', points: hanging, color: '#f4f5f7' },
      ],
      vlines: [{ ref: 'fault', x: 0, color: '#d9b27c', dash: '0', width: 2.4 }],
      markers: [
        { ref: 'offset', x: 0, y: slip / 2, color: '#cc79a7', r: 5.5 },
        { ref: 'offset', x: 0, y: -slip / 2, color: '#cc79a7', r: 5.5, label: `slip ${metreText(slip)}`, dx: 10, dy: 24 },
        { ref: 'far-offset', x: 440, y: far, color: '#3fd0a0', r: 5.5, label: `far offset ${metreText(2 * far)}`, dx: -12, dy: far > 0 ? -12 : 24, anchor: 'end' },
        { ref: 'far-offset', x: -440, y: -far, color: '#3fd0a0', r: 5.5 },
      ],
      notes: [
        { x: -250, y: 50, text: '← footwall', color: '#c3c8d0' },
        { x: 270, y: -50, text: 'hanging wall →', color: '#c3c8d0' },
      ],
      ariaLabel: `Movement of each wall against distance from the fault: ${classifyDrag(k)}, slip ${slip} m on the fault, ${formatNumber(2 * far, 0)} m offset far away.`,
    });
  }
}

function syncGrowth({ refreshInputs = false } = {}) {
  if (!isGrowthStep()) return;
  const step = currentStep();
  const options = step.labOptions ?? {};
  const lab = state.growth;
  const model = growthModel();
  growthScene.setState(model);
  const panel = options.panel ?? null;
  elements.growthViewport.dataset.side = String(Boolean(panel));
  elements.growthViewport.dataset.panel = panel ?? 'none';
  if (panel) syncGrowthPlot(step, model);

  for (const button of elements.lessonCard.querySelectorAll('[data-growth-view]')) button.setAttribute('aria-pressed', String(button.dataset.growthView === lab.view));
  for (const button of elements.lessonCard.querySelectorAll('[data-growth-model]')) button.setAttribute('aria-pressed', String(button.dataset.growthModel === lab.model));
  for (const [id, value] of [['#growth-section-input', lab.section], ['#growth-profile-input', lab.profileW], ['#growth-length-input', lab.lIndex], ['#growth-c-input', lab.cIndex], ['#growth-n-input', lab.n], ['#growth-growth-input', lab.growth], ['#growth-drag-input', lab.drag]]) {
    const input = elements.lessonCard.querySelector(id);
    if (input && (refreshInputs || document.activeElement !== input)) input.value = String(value);
  }
  setText('#growth-section-input-output', `${formatNumber(lab.section, 0)} m ${lab.section > 0 ? 'north' : lab.section < 0 ? 'south' : ''}`.trim());
  setText('#growth-profile-input-output', `${formatNumber(lab.profileW, 0)} m (depth ${formatNumber(GROWTH_LAB.isolated.center.z + lab.profileW * Math.sin(Math.PI / 3), 0)} m)`);
  setText('#growth-length-input-output', formatLength(GROWTH_LAB.lengths[lab.lIndex]));
  setText('#growth-c-input-output', formatNumber(GROWTH_LAB.constants[lab.cIndex], 3));
  setText('#growth-n-input-output', formatNumber(lab.n, 1));
  if (model.system) setText('#growth-growth-input-output', STAGE_NAMES[model.system.stage]);
  setText('#growth-drag-input-output', `${formatNumber(lab.drag, 2)} (${classifyDrag(lab.drag)})`);
  const goalCard = elements.lessonCard.querySelector('#goal-card');
  if (goalCard) {
    const met = isGoalMet(step, { sectionOffset: model.sectionD ?? null, overlap: model.system?.overlap ?? null, dragName: model.drag?.name ?? null });
    goalCard.dataset.met = String(met);
    setText('#goal-status', met ? '✓ Goal reached' : 'Not yet');
  }
  syncGrowthChrome(step, model);
  syncEquationValues();
}

function resetGrowth() {
  initGrowth(currentStep());
  renderLessonPanel();
  syncAll();
}

function growthLiveValues() {
  const model = growthModel();
  const lab = state.growth;
  const values = {};
  const m = (value, decimals = 0) => metres(value, decimals);
  if (model.field) {
    values.dMax = m(model.field.dMax, 0);
    values.a = m(model.field.a, 0);
    values.shape = model.field.model === 'linear' ? paren(mn('1'), mo('−'), mi('r')) : sqrt(mn('1'), mo('−'), sup(mi('r'), mn('2')));
    values.modelName = mtext(model.field.model === 'linear' ? 'linear taper' : 'elliptical');
  }
  if (model.sectionD !== null && model.sectionD !== undefined) {
    values.u = m(lab.section);
    values.dAtU = m(model.sectionD, 1);
  }
  if (model.profileSlice) {
    values.profileW = m(lab.profileW);
    values.profileLength = m(2 * model.profileSlice.halfLength);
    values.profilePeak = m(model.profileSlice.peak, 1);
  }
  if (model.scaling) {
    const { length, c, n, displacement, ratio } = model.scaling;
    values.length = length >= 1000 ? quantityMath(formatNumber(length / 1000, 0), 'km') : m(length);
    values.c = num(c, 3);
    values.n = num(n, 1);
    values.dScaled = m(displacement, displacement < 1 ? 3 : displacement < 100 ? 1 : 0);
    values.dOverL = num(ratio, 4);
  }
  if (model.system) {
    const { system } = model;
    values.overlap = m(system.overlap);
    values.stage = mtext(STAGE_NAMES[system.stage]);
    values.dA = m(system.segments[0].dMax);
    values.dB = m(system.segments[1].dMax);
    values.dSumMax = m(model.totalMax);
    values.rampDip = mtext(system.overlap <= 0 ? 'none: no overlap' : system.breach ? 'cut by the breach' : `dips ${formatNumber(Math.abs(model.tilt), 0)}° toward ${model.tilt >= 0 ? 'S' : 'N'}`);
  }
  if (model.drag) {
    values.k = num(model.drag.k, 2);
    values.dragName = mtext(model.drag.name);
    values.farOffset = m(model.drag.slip * (1 - model.drag.k));
  }
  return values;
}

const GROWTH_SWATCHES = {
  bed: ['#c2a878', 'solid'],
  fault: ['#d9b27c', 'solid'],
  displacement: ['#5ec962', 'solid'],
  tip: ['#f4f5f7', 'solid'],
  section: ['#56b4e9', 'solid'],
  offset: ['#cc79a7', 'solid'],
  profile: ['#e69f00', 'solid'],
  ramp: ['#3fd0a0', 'solid'],
  processZone: ['#cc79a7', 'dashed'],
};

function syncGrowthChrome(step, model = growthModel()) {
  elements.interactionHint.textContent = 'Drag: orbit the block · scroll: zoom · hover a symbol or an object to link them';
  const item = (key, label) => {
    const [color, pattern] = GROWTH_SWATCHES[key];
    return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
  };
  const legend = [item('bed', 'marker beds')];
  if (model.options.colorFault) {
    legend.push(item('displacement', `fault, colored by ${inline(mi('D'))}`));
    if (model.options.showTipLine !== false) legend.push(item('tip', 'tip line'));
  } else {
    legend.push(item('fault', 'fault'));
  }
  if (model.section) legend.push(item('section', 'section'), item('offset', 'offset'));
  if (model.profile) legend.push(item('profile', 'profile line'));
  if (model.relay?.ramp) legend.push(item('ramp', 'relay ramp'));
  if (model.relay?.processZones?.length) legend.push(item('processZone', 'process zone'));
  elements.sceneLegend.hidden = false;
  elements.sceneLegend.innerHTML = legend.join('');
}

/* ---------- Fault-zone lab (B11) ---------- */

const ZONE_VIEWS = { '3d': '3D', map: 'Map', section: 'Section' };
const ROCK_FIELDS = [6, 25, 100];
const zoneCache = new Map();

/** Build once per key: traces and slab drawings are slow to regenerate on every slider move. */
function cachedZone(key, build) {
  if (!zoneCache.has(key)) {
    if (zoneCache.size > 60) zoneCache.clear();
    zoneCache.set(key, build());
  }
  return zoneCache.get(key);
}

/** The smallest of 1, 1.5, 2, 3, 4, 5, 6, 8 × 10ⁿ that is at least `value`. */
function niceSize(value) {
  const power = 10 ** Math.floor(Math.log10(value));
  return ([1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((step) => step * power >= value - 1e-9) ?? 10) * power;
}

/** The outcrop's fault zone for this step: from the widths, the width-scaling rule, or the sandstone stage. */
function outcropZone(options, lab) {
  const dip = ZONE_LAB.dip;
  if (options.scaling) {
    const D = 10 ** lab.logD;
    const core = D / 10 ** lab.logK;
    const damage = D * 10 ** lab.logA;
    const size = niceSize((2.6 * (core / 2 + damage)) / Math.sin((dip * Math.PI) / 180));
    // The block keeps its look at every size: the density law scales with it (drawing only).
    const scale = size / ZONE_LAB.outcrop;
    return { size, zone: { core, footwall: damage, hangingWall: damage, dip, law: { ...DAMAGE, background: DAMAGE.background / scale, x0: DAMAGE.x0 * scale } }, traceLength: ZONE_LAB.traceLength * scale, strands: 1, lenses: 0, host: 'crystalline', scaling: { D, core, damage } };
  }
  if (lab.host === 'porous') {
    const stage = ZONE_LAB.stages[lab.stage];
    return { size: ZONE_LAB.outcrop, zone: { core: stage.core, footwall: stage.footwall, hangingWall: stage.hangingWall, dip, law: ZONE_LAB.sandLaw }, traceLength: ZONE_LAB.traceLength, strands: stage.strands, lenses: 0, host: 'porous' };
  }
  const map = options.setup === 'outcrop' && lab.scale === 'map';
  return {
    size: map ? ZONE_LAB.mapScale : ZONE_LAB.outcrop,
    zone: { core: lab.core, footwall: lab.footwall, hangingWall: lab.hangingWall, dip },
    traceLength: ZONE_LAB.traceLength,
    strands: lab.strands,
    lenses: lab.strands >= 2 ? lab.lenses : 0,
    host: 'crystalline',
    lineOnly: map,
  };
}

/** The fault rock in the slab for this step: from the slip (comminution rule), the free distribution, or a cataclasite that melts. */
function sampleRock(step, lab) {
  const controls = new Set(step.controls ?? []);
  let dist;
  if (controls.has('slip')) dist = comminutionState(10 ** lab.logSlip).dist;
  else if (controls.has('dmax')) dist = clastSizeDistribution({ dMin: COMMINUTION.dMin, dMax: 10 ** lab.logDMax, Df: lab.df });
  else dist = comminutionState(ZONE_LAB.meltHostSlip).dist;
  const naming = controls.has('cohesion');
  const cohesive = naming ? lab.cohesive : true;
  const foliated = naming ? lab.foliated : false;
  let heating = null;
  if (controls.has('tau')) {
    const slip = 10 ** lab.logHeatSlip;
    const width = 10 ** lab.logWidth;
    const deltaT = frictionalHeating({ tau: lab.tau, slip, width });
    heating = { tau: lab.tau, slip, width, deltaT, temperature: ZONE_LAB.ambient + deltaT };
  }
  const melt = heating && heating.temperature >= MELTING.onset ? 'melt' : 'none';
  return { dist, cohesive, foliated, heating, melt };
}

/** Everything the fault-zone lab draws, from the step's setup and the lab state. */
function zoneModel() {
  const step = currentStep();
  const options = step.labOptions ?? {};
  const lab = state.zone;
  if (options.setup === 'crust') {
    return { setup: 'crust', size: ZONE_LAB.crust, gradient: lab.gradient, surface: ZONE_LAB.surfaceT, zones: faultRockZones(lab.gradient, { surface: ZONE_LAB.surfaceT }), labels: true };
  }
  if (options.setup === 'sample') {
    const rock = sampleRock(step, lab);
    const { dist, foliated } = rock;
    const composition = rockComposition(dist);
    const field = ROCK_FIELDS.find((value) => value >= 3 * dist.dMax) ?? ROCK_FIELDS.at(-1);
    const { nx, ny } = ZONE_LAB.slab;
    const slab = cachedZone(`slab:${dist.dMax}:${dist.Df}:${field}:${foliated}`, () => slabTexture(dist, { width: field, height: 0.6 * field, nx, ny, foliated }));
    const sibson = sibsonClass({ cohesive: rock.cohesive, ...composition, foliated, glass: rock.melt !== 'none' });
    return { setup: 'sample', ...rock, slab, field, composition, sibson, wm: woodcockMortClass(composition.clastPct2mm) };
  }
  const outcrop = outcropZone(options, lab);
  const { size, zone, traceLength: length } = outcrop;
  const key = `traces:${size}:${zone.core}:${zone.footwall}:${zone.hangingWall}:${JSON.stringify(zone.law ?? null)}:${length}`;
  const traces = outcrop.lineOnly ? null : cachedZone(key, () => ({
    top: pavementTraces(zone, { halfLength: size / 2, halfWidth: size / 2, length }),
    section: sectionTraces(zone, { east: [-size / 2, size / 2], depth: size / 2, length }),
    strikeEast: strikeFaceTraces(zone, { east: size / 2, north: [-size / 2, size / 2], depth: size / 2, length, seed: 11 }),
    strikeWest: strikeFaceTraces(zone, { east: -size / 2, north: [-size / 2, size / 2], depth: size / 2, length, seed: 13 }),
  }));
  const panels = options.panels ?? [];
  const scanline = panels.includes('scanline') ? { north: lab.scanline, crossings: scanlineCrossings(traces.top, lab.scanline) } : null;
  return {
    setup: 'outcrop',
    ...outcrop,
    slip: ZONE_LAB.slip,
    traces,
    scanline,
    flow: options.flow ? outcrop.host : null,
    labels: true,
  };
}

function zoneControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const options = step.labOptions ?? {};
  const lab = state.zone;
  const parts = [];
  const range = (id, label, min, max, stepSize, value, disabled = false) => `<label class="lab-control" for="${id}"><span>${label} <output id="${id}-output"></output></span><input id="${id}" class="range" type="range" min="${min}" max="${max}" step="${stepSize}" value="${value}"${disabled ? ' disabled' : ''} /></label>`;
  const segmented = (label, attribute, items, current) => `
      <div class="direction-control"><span>${label}</span><div class="segmented-control" role="group" aria-label="${label}">
        ${items.map(([value, text]) => `<button type="button" data-${attribute}="${value}" aria-pressed="${current === value}">${text}</button>`).join('')}
      </div></div>`;
  if (controls.has('view')) parts.push(segmented('View', 'zone-view', (options.views ?? ['3d']).map((view) => [view, ZONE_VIEWS[view]]), lab.view));
  if (controls.has('scale')) parts.push(segmented('Scale', 'zone-scale', [['map', 'Map (1 km)'], ['outcrop', 'Outcrop (40 m)']], lab.scale));
  if (controls.has('host')) parts.push(segmented('Host rock', 'zone-host', [['crystalline', 'Granite'], ['porous', 'Porous sandstone']], lab.host));
  if (controls.has('stage')) parts.push(segmented('Sandstone stage', 'zone-stage', [['bands', 'Single bands'], ['zone', 'Band zone'], ['slip', 'Slip surface']], lab.host === 'porous' ? lab.stage : null));
  if (controls.has('cohesion')) parts.push(segmented('Cohesion', 'zone-cohesion', [['loose', 'Loose'], ['cohesive', 'Healed or cemented']], lab.cohesive ? 'cohesive' : 'loose'));
  if (controls.has('fabric')) parts.push(segmented('Fabric', 'zone-fabric', [['random', 'Random'], ['foliated', 'Foliated']], lab.foliated ? 'foliated' : 'random'));
  if (controls.has('strands')) parts.push(range('zone-strands-input', 'Slip surfaces (strands)', 1, 3, 1, lab.strands));
  if (controls.has('lenses')) parts.push(range('zone-lenses-input', 'Fault lenses', 0, 2, 1, lab.lenses, lab.strands < 2));
  if (controls.has('core')) parts.push(range('zone-core-input', `Core ${inline(sub(mi('w'), mtext('core')))}`, 0.02, 3, 0.02, lab.core));
  if (controls.has('footwall')) parts.push(range('zone-footwall-input', `Footwall damage ${inline(sub(mi('w'), mtext('FW')))}`, 0.5, 12, 0.1, lab.footwall));
  if (controls.has('hangingWall')) parts.push(range('zone-hanging-input', `Hanging-wall damage ${inline(sub(mi('w'), mtext('HW')))}`, 0.5, 12, 0.1, lab.hangingWall));
  if (controls.has('scanline')) parts.push(range('zone-scanline-input', 'Scanline position', -18, 18, 1, lab.scanline));
  if (controls.has('displacement')) parts.push(range('zone-d-input', `Displacement ${inline(mi('D'))}`, -1, 3, 0.05, lab.logD));
  if (controls.has('coreRatio')) parts.push(range('zone-k-input', `Core ratio ${inline(mi('k'))}`, 1, 3, 0.05, lab.logK));
  if (controls.has('damageRatio')) parts.push(range('zone-a-input', `Damage ratio ${inline(mi('a'))}`, -1, 1, 0.05, lab.logA));
  if (controls.has('slip')) parts.push(range('zone-slip-input', 'Slip (grinding)', -2, 2, 0.02, lab.logSlip));
  if (controls.has('dmax')) parts.push(range('zone-dmax-input', `Largest clast ${inline(sub(mi('d'), mtext('max')))}`, Math.log10(0.12), Math.log10(30), 0.01, lab.logDMax));
  if (controls.has('df')) parts.push(range('zone-df-input', `Fractal dimension ${inline(sub(mi('D'), mtext('f')))}`, 1.6, 2.9, 0.02, lab.df));
  if (controls.has('tau')) parts.push(range('zone-tau-input', `Shear stress ${inline(mi('τ'))}`, 10, 100, 5, lab.tau));
  if (controls.has('heatSlip')) parts.push(range('zone-heat-slip-input', `Slip ${inline(mi('D'))}`, -2, 0.7, 0.02, lab.logHeatSlip));
  if (controls.has('width')) parts.push(range('zone-width-input', `Slip-zone width ${inline(mi('w'))}`, -4, -1, 0.05, lab.logWidth));
  if (controls.has('gradient')) parts.push(range('zone-gradient-input', `Geothermal gradient ${inline(mi('G'))}`, 15, 60, 1, lab.gradient));
  return parts.length ? `<div class="lab-controls">${parts.join('')}</div>` : '';
}

const ZONE_RANGES = [
  ['#zone-strands-input', 'strands'],
  ['#zone-lenses-input', 'lenses'],
  ['#zone-core-input', 'core'],
  ['#zone-footwall-input', 'footwall'],
  ['#zone-hanging-input', 'hangingWall'],
  ['#zone-scanline-input', 'scanline'],
  ['#zone-d-input', 'logD'],
  ['#zone-k-input', 'logK'],
  ['#zone-a-input', 'logA'],
  ['#zone-slip-input', 'logSlip'],
  ['#zone-dmax-input', 'logDMax'],
  ['#zone-df-input', 'df'],
  ['#zone-tau-input', 'tau'],
  ['#zone-heat-slip-input', 'logHeatSlip'],
  ['#zone-width-input', 'logWidth'],
  ['#zone-gradient-input', 'gradient'],
];

function bindZoneControls() {
  const lab = () => state.zone;
  const bindButtons = (attribute, apply) => {
    for (const button of elements.lessonCard.querySelectorAll(`[data-${attribute}]`)) {
      button.addEventListener('click', () => {
        apply(button.dataset[attribute.replace(/-(\w)/g, (_, letter) => letter.toUpperCase())]);
        syncZone();
      });
    }
  };
  bindButtons('zone-view', (value) => {
    lab().view = value;
    zoneScene.setView(value);
  });
  bindButtons('zone-scale', (value) => { lab().scale = value; });
  bindButtons('zone-host', (value) => { lab().host = value; });
  bindButtons('zone-stage', (value) => {
    lab().host = 'porous';
    lab().stage = value;
  });
  bindButtons('zone-cohesion', (value) => { lab().cohesive = value === 'cohesive'; });
  bindButtons('zone-fabric', (value) => { lab().foliated = value === 'foliated'; });
  for (const [id, key] of ZONE_RANGES) {
    elements.lessonCard.querySelector(id)?.addEventListener('input', (event) => {
      lab()[key] = Number(event.target.value);
      syncZone();
    });
  }
}

function initZone(step) {
  state.zone = { ...DEFAULT_ZONE, ...(step.initialLabState ?? {}), madeRocks: [] };
  zoneScene.setState(zoneModel());
  zoneScene.setView(state.zone.view);
}

const lengthText = (metres) => (metres >= 1000 ? `${formatNumber(metres / 1000, 1)} km` : metres >= 1 ? `${formatNumber(metres, metres >= 100 ? 0 : 1)} m` : metres >= 0.01 ? `${formatNumber(metres * 100, 1)} cm` : `${formatNumber(metres * 1000, 1)} mm`);
const sizeText = (mm) => (mm >= 10 ? `${formatNumber(mm, 0)} mm` : mm >= 1 ? `${formatNumber(mm, 1)} mm` : `${formatNumber(mm, mm >= 0.1 ? 2 : 3)} mm`);
const lengthMath = (metres) => {
  const [value, unit] = lengthText(metres).split(' ');
  return quantityMath(value, unit);
};

/** Log-spaced samples from a to b. */
function logSamples(a, b, count = 120) {
  return Array.from({ length: count }, (_, index) => a * (b / a) ** (index / (count - 1)));
}

/** The panels beside the block: plots, the fault-rock chart, the damage map, the depth column, or the architecture gauge. */
function syncZonePanels(step, model) {
  const panels = step.labOptions?.panels ?? [];
  const xyPanels = panels.filter((panel) => ['scanline', 'scaling', 'counts', 'fraction', 'heating'].includes(panel));
  const slots = { 'zone-plot-a': xyPanels[0], 'zone-plot-b': xyPanels[1], 'zone-map': panels.includes('damage-map'), 'zone-chart': panels.includes('chart'), 'zone-depth': panels.includes('depth'), 'zone-gauge': panels.includes('gauge') };
  for (const [id, shown] of Object.entries(slots)) elements.zoneViewport.querySelector(`#${id}`).hidden = !shown;
  xyPanels.forEach((panel, index) => zoneXYPanel(panel, index ? zonePlotB : zonePlotA, model));
  if (panels.includes('chart')) zoneChart.setState({ matrixPct: model.composition.matrixPct, clastPct2mm: model.composition.clastPct2mm, sibson: model.sibson, wmName: model.wm });
  if (panels.includes('depth')) depthColumn.setState({ gradient: model.gradient, surface: model.surface, zones: model.zones });
  if (panels.includes('gauge')) {
    const damage = model.zone.footwall + model.zone.hangingWall;
    const structure = permeabilityStructure({ core: model.zone.core, damage });
    architectureGauge.setState({ Fa: structure.Fa, structure, limits: WELL_DEVELOPED });
  }
}

function zoneXYPanel(panel, plot, model) {
  if (panel === 'scanline') {
    const { zone } = model;
    const reach = (model.size / 2) * Math.sin((zone.dip * Math.PI) / 180);
    const from = -Math.floor(reach);
    const bins = scanlineDensity(zone, model.scanline.crossings, { from, to: -from, bin: 1 });
    const half = zone.core / 2;
    const side = (sign) => {
      const points = [];
      for (let d = half; d <= reach; d += 0.05) points.push([sign * d, zoneDensity(zone, sign * (d + 1e-9))]);
      return points;
    };
    const background = zone.law?.background ?? DAMAGE.background;
    const peak = Math.max(damagePeak(zone.footwall, zone.law), damagePeak(zone.hangingWall, zone.law), ...bins.map((item) => item.density));
    const yMax = niceSize(peak * 1.15);
    const porous = model.host === 'porous';
    plot.setState({
      title: 'Scanline across the fault',
      caption: 'Bars: counted in 1 m bins. Lines: the density law.',
      x: { label: '<tspan font-style="italic">d</tspan> (m), footwall ← → hanging wall', min: from, max: -from },
      y: { label: `<tspan font-style="italic">ρ</tspan> (${porous ? 'bands' : 'fractures'} per m)`, min: 0, max: yMax },
      areas: bins.filter((item) => item.count > 0).map((item, index) => ({ ref: 'density-counts', points: [[item.from, 0], [item.to, 0], [item.to, item.density], [item.from, item.density]], color: '#56b4e9', opacity: 0.42, label: index === 0 ? 'counted' : undefined })),
      series: [
        { ref: 'background', points: [[from, background], [-from, background]], color: '#9aa1ad', width: 1.8, dash: '6 5', label: `background <tspan font-style="italic">ρ</tspan><tspan dy="0.3em" font-size="0.7em">bg</tspan>` },
        { ref: 'density-law', points: side(-1), color: '#f4f5f7', width: 3, label: '<tspan font-style="italic">ρ</tspan>(<tspan font-style="italic">x</tspan>)' },
        { ref: 'density-law', points: side(1), color: '#f4f5f7', width: 3 },
      ],
      bands: zone.core > 0 ? [{ ref: 'core', from: -half, to: half, color: '#6b6259', opacity: 0.6 }] : [],
      vlines: [
        ...(zone.footwall > 0 ? [{ ref: 'damage-edge', x: -half - zone.footwall, color: '#e69f00', dash: '8 6', width: 2.2 }] : []),
        ...(zone.hangingWall > 0 ? [{ ref: 'damage-edge', x: half + zone.hangingWall, color: '#e69f00', dash: '8 6', width: 2.2 }] : []),
      ],
      ariaLabel: `Scanline density across the fault: ${model.scanline.crossings.length} crossings, peak ${formatNumber(peak, 1)} per metre, background ${background} per metre.`,
    });
    return;
  }
  if (panel === 'scaling') {
    const { D, core, damage } = model.scaling;
    const format = (value) => lengthText(value).replace(/\.0 /, ' ');
    plot.setState({
      title: 'Widths grow with displacement',
      caption: 'Log–log axes. Bands: published scatter (summary).',
      x: { label: '<tspan font-style="italic">D</tspan>', min: 0.1, max: 1000, log: true, format },
      y: { label: 'width', min: 1e-4, max: 1e4, log: true, format },
      areas: [
        { ref: 'core-band', points: [[0.1, 1e-4], [1000, 1], [1000, 100], [0.1, 0.01]], color: '#9aa1ad', opacity: 0.25, label: 'core, <tspan font-style="italic">D</tspan>/1000 to <tspan font-style="italic">D</tspan>/10' },
        { ref: 'damage-band', points: [[0.1, 0.01], [100, 10], [100, 1000], [0.1, 1]], color: '#e69f00', opacity: 0.22, label: 'damage, <tspan font-style="italic">D</tspan>/10 to 10<tspan font-style="italic">D</tspan>' },
      ],
      series: [
        { ref: 'core-band', points: [[0.1, 0.001], [1000, 10]], color: '#c3c8d0', width: 1.6, dash: '6 5' },
        { ref: 'damage-band', points: [[0.1, 0.1], [100, 100]], color: '#e69f00', width: 1.6, dash: '6 5' },
      ],
      markers: [
        { ref: 'core-point', x: D, y: core, color: '#f4f5f7', shape: 'diamond', key: 'this core', label: state.lessonChoiceCorrect ? format(core) : '', dx: 14 },
        { ref: 'damage-point', x: D, y: damage, color: '#e69f00', key: 'this damage zone', label: format(damage), dx: 14 },
      ],
      ariaLabel: `Width against displacement on log–log axes. D = ${format(D)}: damage zone ${format(damage)}.`,
    });
    return;
  }
  if (panel === 'counts') {
    const { slab, dist } = model;
    const areaCm2 = (model.field * 0.6 * model.field) / 100;
    const sizes = slab.polygons.map((polygon) => polygon.d).sort((a, b) => b - a);
    const k = dist.Df - 1;
    const total = sizes.length;
    const low = slab.dDraw;
    const law = (d) => (total * (d ** -k - dist.dMax ** -k)) / (low ** -k - dist.dMax ** -k) / areaCm2;
    const step = Math.max(1, Math.floor(total / 250));
    const points = sizes.map((d, index) => [d, (index + 1) / areaCm2]).filter((_, index) => index % step === 0 || index === total - 1);
    const yMax = 10 ** Math.ceil(Math.log10(Math.max(total, 1) / areaCm2) + 0.3);
    const yMin = 10 ** Math.floor(Math.log10(0.5 / areaCm2));
    plot.setState({
      title: 'Clast sizes in the slab',
      caption: `Log–log. Slope of the line: −(D<tspan dy="0.3em" font-size="0.7em">f</tspan><tspan dy="-0.3em"> − 1) = −${formatNumber(k, 2)}.</tspan>`,
      x: { label: '<tspan font-style="italic">d</tspan>', min: 0.01, max: 100, log: true, format: sizeText },
      y: { label: 'clasts larger than <tspan font-style="italic">d</tspan>, per cm²', min: yMin, max: yMax, log: true, format: (value) => (value >= 1 ? formatNumber(value, 0) : String(value)) },
      series: [
        { ref: 'clast-size', kind: 'points', points, color: '#cdbb9f', radius: 3, opacity: 0.8, label: 'counted in the slab' },
        { ref: 'clast-size', points: logSamples(low, dist.dMax * 0.999, 60).map((d) => [d, law(d)]), color: '#f4f5f7', width: 2.6, label: 'slice law' },
      ],
      vlines: [
        { ref: 'matrix-cutoff', x: 0.1, color: '#9aa1ad', dash: '4 5' },
        { ref: 'largest-clast', x: dist.dMax, color: '#e69f00', dash: '8 5', width: 2.2 },
      ],
      notes: [{ ref: 'matrix-cutoff', x: 0.1, y: yMin, text: 'matrix', dy: -8, anchor: 'end', dx: -6, color: '#9aa1ad' }],
      ariaLabel: `Number of clasts larger than d in the slab, on log–log axes: ${total} clasts drawn, slope ${formatNumber(-k, 2)}.`,
    });
    return;
  }
  if (panel === 'fraction') {
    const { dist, composition } = model;
    const matrix = composition.matrixPct;
    const finer2 = 100 - composition.clastPct2mm;
    plot.setState({
      title: 'How much of the rock is finer',
      caption: 'Volume (or slice area) finer than each size.',
      x: { label: '<tspan font-style="italic">d</tspan>', min: 0.001, max: 100, log: true, format: sizeText },
      y: { label: '<tspan font-style="italic">f</tspan> (%)', min: 0, max: 100, ticks: [0, 20, 40, 60, 80, 100] },
      series: [{ ref: 'fraction-curve', points: logSamples(0.001, 100, 160).map((d) => [d, 100 * fractionFiner(dist, d)]), color: '#f4f5f7', width: 3, label: '<tspan font-style="italic">f</tspan>(<tspan font-style="italic">d</tspan>)' }],
      vlines: [
        { ref: 'matrix-cutoff', x: 0.1, color: '#9aa1ad', dash: '4 5' },
        { ref: 'breccia-cutoff', x: 2, color: '#9aa1ad', dash: '4 5' },
        { ref: 'largest-clast', x: dist.dMax, color: '#e69f00', dash: '8 5', width: 2.2 },
      ],
      markers: [
        { ref: 'matrix', x: 0.1, y: matrix, color: '#56b4e9', label: `${formatNumber(matrix, 1)}% matrix`, dx: matrix > 70 ? -12 : 12, anchor: matrix > 70 ? 'end' : 'start', dy: matrix > 85 ? 20 : -10 },
        ...(dist.dMax > 2 ? [{ ref: 'breccia-cutoff', x: 2, y: finer2, color: '#cc79a7', label: `${formatNumber(100 - finer2, 0)}% ≥ 2 mm`, dx: 12, dy: 20 }] : []),
      ],
      ariaLabel: `Volume fraction finer than each size: ${formatNumber(matrix, 1)}% finer than 0.1 mm.`,
    });
    return;
  }
  if (panel === 'heating') {
    const { heating } = model;
    const temperature = (width) => ZONE_LAB.ambient + frictionalHeating({ tau: heating.tau, slip: heating.slip, width });
    const format = (value) => lengthText(value).replace(/\.0 /, ' ');
    plot.setState({
      title: 'Heating of the slip zone',
      caption: `Adiabatic bound, starting at ${ZONE_LAB.ambient} °C.`,
      x: { label: 'slip-zone width <tspan font-style="italic">w</tspan>', min: 1e-4, max: 0.1, log: true, format },
      y: { label: '<tspan font-style="italic">T</tspan> (°C)', min: 100, max: 1e6, log: true, format: (value) => formatNumber(value, 0) },
      series: [
        { ref: 'melt-line', points: [[1e-4, MELTING.onset], [0.1, MELTING.onset]], color: '#f07a3c', width: 2.2, dash: '8 5', label: 'rock melts, 1000 °C' },
        { ref: 'melt-line', points: [[1e-4, MELTING.quartz], [0.1, MELTING.quartz]], color: '#9aa1ad', width: 1.6, dash: '3 5', label: 'quartz melts, 1700 °C' },
        { ref: 'heating-curve', points: logSamples(1e-4, 0.1, 60).map((width) => [width, temperature(width)]), color: '#f4f5f7', width: 3, label: '<tspan font-style="italic">T</tspan> = 200 °C + Δ<tspan font-style="italic">T</tspan>' },
      ],
      markers: [{ ref: 'heating-point', x: heating.width, y: heating.temperature, color: model.melt === 'melt' ? '#f07a3c' : '#56b4e9', label: `${formatNumber(heating.temperature, 0)} °C`, dx: heating.width > 0.01 ? -12 : 12, anchor: heating.width > 0.01 ? 'end' : 'start' }],
      ariaLabel: `Slip-zone temperature against width: ${formatNumber(heating.temperature, 0)} degrees at ${format(heating.width)}.`,
    });
  }
}

function syncZone({ refreshInputs = false } = {}) {
  if (!isZoneStep()) return;
  const step = currentStep();
  const lab = state.zone;
  const model = zoneModel();
  zoneScene.setState(model);
  const panels = step.labOptions?.panels ?? [];
  elements.zoneViewport.dataset.side = String(panels.length > 0);
  syncZonePanels(step, model);
  if (model.setup === 'sample' && model.sibson.name && !lab.madeRocks.includes(model.sibson.name)) lab.madeRocks.push(model.sibson.name);

  const pressed = (attribute, value) => {
    for (const button of elements.lessonCard.querySelectorAll(`[data-${attribute}]`)) button.setAttribute('aria-pressed', String(button.getAttribute(`data-${attribute}`) === value));
  };
  pressed('zone-view', lab.view);
  pressed('zone-scale', lab.scale);
  pressed('zone-host', lab.host);
  pressed('zone-stage', lab.host === 'porous' ? lab.stage : '');
  pressed('zone-cohesion', lab.cohesive ? 'cohesive' : 'loose');
  pressed('zone-fabric', lab.foliated ? 'foliated' : 'random');
  for (const [id, key] of ZONE_RANGES) {
    const input = elements.lessonCard.querySelector(id);
    if (input && (refreshInputs || document.activeElement !== input)) input.value = String(lab[key]);
  }
  const lenses = elements.lessonCard.querySelector('#zone-lenses-input');
  if (lenses) lenses.disabled = lab.strands < 2;
  setText('#zone-strands-input-output', String(lab.strands));
  setText('#zone-lenses-input-output', lab.strands < 2 ? 'needs 2 strands' : String(lab.lenses));
  setText('#zone-core-input-output', lengthText(lab.core));
  setText('#zone-footwall-input-output', lengthText(lab.footwall));
  setText('#zone-hanging-input-output', lengthText(lab.hangingWall));
  setText('#zone-scanline-input-output', `${formatNumber(Math.abs(lab.scanline), 0)} m ${lab.scanline > 0 ? 'north' : lab.scanline < 0 ? 'south' : ''}`.trim());
  setText('#zone-d-input-output', lengthText(10 ** lab.logD));
  setText('#zone-k-input-output', formatNumber(10 ** lab.logK, 0));
  setText('#zone-a-input-output', formatNumber(10 ** lab.logA, 2));
  setText('#zone-slip-input-output', lengthText(10 ** lab.logSlip));
  setText('#zone-dmax-input-output', sizeText(10 ** lab.logDMax));
  setText('#zone-df-input-output', formatNumber(lab.df, 2));
  setText('#zone-tau-input-output', `${formatNumber(lab.tau, 0)} MPa`);
  setText('#zone-heat-slip-input-output', lengthText(10 ** lab.logHeatSlip));
  setText('#zone-width-input-output', lengthText(10 ** lab.logWidth));
  setText('#zone-gradient-input-output', `${formatNumber(lab.gradient, 0)} °C/km`);
  const goalCard = elements.lessonCard.querySelector('#goal-card');
  if (goalCard) {
    const met = isGoalMet(step, { madeRocks: lab.madeRocks });
    goalCard.dataset.met = String(met);
    const made = ['fault gouge', 'fine crush breccia', 'ultracataclasite'].filter((name) => lab.madeRocks.includes(name));
    setText('#goal-status', met ? '✓ Goal reached' : made.length ? `Made: ${made.join(', ')}` : 'Not yet');
  }
  syncZoneChrome(step, model);
  syncEquationValues();
}

function resetZone() {
  initZone(currentStep());
  renderLessonPanel();
  syncAll();
}

function zoneLiveValues() {
  const model = zoneModel();
  const lab = state.zone;
  const values = {};
  if (model.setup === 'outcrop') {
    const { zone } = model;
    values.zoneSum = row(num(zone.core, 2), mo('+'), num(zone.footwall, 1), mo('+'), num(zone.hangingWall, 1));
    values.zoneWidth = lengthMath(zone.core + zone.footwall + zone.hangingWall);
    values.fw = lengthMath(zone.footwall);
    values.hw = lengthMath(zone.hangingWall);
    values.strandCount = mtext(`${model.strands} slip surface${model.strands === 1 ? '' : 's'}`);
    values.lensCount = mtext(model.lenses ? `${model.lenses} lens${model.lenses === 1 ? '' : 'es'}` : 'no lenses');
    const peakFW = damagePeak(zone.footwall, zone.law);
    const peakHW = damagePeak(zone.hangingWall, zone.law);
    values.rho0FW = num(peakFW, 2);
    values.rho0HW = num(peakHW, 2);
    values.edgeFW = lengthMath(damageZoneEdge({ peak: peakFW, ...zone.law }));
    values.edgeHW = lengthMath(damageZoneEdge({ peak: peakHW, ...zone.law }));
    if (model.scaling) {
      const { D, core, damage } = model.scaling;
      values.displacement = lengthMath(D);
      values.coreRatio = num(10 ** lab.logK, 0);
      values.damageRatio = num(10 ** lab.logA, 2);
      values.coreWidth = lengthMath(core);
      values.damageWidth = lengthMath(damage);
    }
    const porous = model.host === 'porous';
    values.hostName = mtext(porous ? 'porous sandstone' : 'granite (crystalline)');
    values.damageKind = mtext(porous ? { bands: 'single deformation bands', zone: 'a zone of many bands', slip: 'slip surface in a band zone' }[lab.stage] : 'open fractures, gouge core');
    values.flowAlong = mtext(porous ? 'slowed in the band zone' : 'easy, in the fractures');
    values.flowAcross = mtext(porous ? 'slowed by the bands' : 'blocked by the core');
    const damage = zone.footwall + zone.hangingWall;
    const structure = permeabilityStructure({ core: zone.core, damage });
    values.damageSum = num(damage, 1);
    values.coreValue = num(zone.core, 2);
    values.fa = structure.Fa === null ? mtext('undefined') : num(structure.Fa, 2);
    values.endMember = mtext(structure.name);
  }
  if (model.setup === 'sample') {
    const { dist, composition, sibson } = model;
    values.slip = lengthMath(10 ** lab.logSlip);
    values.dMax = quantityMath(sizeText(dist.dMax).split(' ')[0], 'mm');
    values.df = num(dist.Df, 2);
    values.matrixPct = mn(`${formatNumber(composition.matrixPct, 1)}%`);
    values.drawnMatrix = mn(`${formatNumber(model.slab.drawnMatrixPct, 1)}%`);
    values.clastPct = mn(`${formatNumber(composition.clastPct2mm, 1)}%`);
    values.fragmentSize = composition.matrixPct >= 100 ? mtext('none') : quantityMath(sizeText(composition.fragmentSize).split(' ')[0], 'mm');
    values.cohesion = mtext(model.cohesive ? 'cohesive' : 'loose');
    values.fabric = mtext(model.foliated ? 'foliated' : 'random fabric');
    values.sibsonName = mtext(sibson.name ?? 'no name in the scheme');
    values.wmName = mtext(model.wm ?? 'not a breccia (under 30%)');
    if (model.heating) {
      const { tau, slip, width, deltaT, temperature } = model.heating;
      values.tauPa = row(num(tau, 0), mo('×'), sup(mn('10'), mn('6')));
      values.heatSlip = num(slip, slip < 0.1 ? 3 : 2);
      values.widthM = num(width, width < 0.001 ? 5 : 4);
      values.deltaT = quantityMath(formatNumber(deltaT, deltaT < 100 ? 1 : 0), 'K');
      values.temperature = quantityMath(formatNumber(temperature, 0), '°C');
      values.meltState = mtext(model.melt === 'melt' ? 'melts → pseudotachylyte' : 'no melt');
    }
  }
  if (model.setup === 'crust') {
    const depth = (temperature) => quantityMath(formatNumber(depthOfTemperature(temperature, model.gradient, model.surface), 1), 'km');
    values.gradient = quantityMath(formatNumber(model.gradient, 0), '°C/km');
    values.zCohesive = depth(ZONE_TEMPERATURES.cohesive);
    values.zQuartz = depth(ZONE_TEMPERATURES.quartz);
    values.zFeldspar = depth(ZONE_TEMPERATURES.feldspar);
  }
  return values;
}

const ZONE_SWATCHES = {
  host: ['#a79c90', 'solid'],
  sandstone: ['#d9c49a', 'solid'],
  damage: ['#e69f00', 'dashed'],
  core: ['#4a433c', 'solid'],
  slip: ['#f4f5f7', 'solid'],
  fracture: ['#1c1917', 'solid'],
  band: ['#f6f0e2', 'solid'],
  scanline: ['#56b4e9', 'solid'],
  along: ['#56b4e9', 'solid'],
  across: ['#cc79a7', 'solid'],
  matrix: ['#2e2926', 'solid'],
  clast: ['#cdbb9f', 'solid'],
  vein: ['#16110f', 'solid'],
  isotherm: ['#f0e442', 'dashed'],
  quake: ['#f07a3c', 'solid'],
};

function syncZoneChrome(step, model = zoneModel()) {
  const item = (key, label) => {
    const [color, pattern] = ZONE_SWATCHES[key];
    return `<span class="legend-line" data-pattern="${pattern}" style="--swatch: ${color}">${label}</span>`;
  };
  const legend = [];
  if (model.setup === 'sample') {
    elements.interactionHint.textContent = 'Drag: orbit the slab · scroll: zoom · hover the slab or a symbol to link them';
    legend.push(item('clast', 'clasts (schematic shapes)'), item('matrix', 'matrix, under 0.1 mm'));
    if (model.melt === 'melt') legend.push(item('vein', 'pseudotachylyte'));
  } else if (model.setup === 'crust') {
    elements.interactionHint.textContent = 'Drag: orbit the block · scroll: zoom · hover a zone or a symbol to link them';
    legend.push(item('isotherm', 'isotherms'), item('quake', 'earthquakes'));
  } else {
    elements.interactionHint.textContent = 'Drag: orbit the outcrop · scroll: zoom · hover a part of the zone or a symbol to link them';
    legend.push(item(model.host === 'porous' ? 'sandstone' : 'host', model.host === 'porous' ? 'sandstone beds' : 'granite'));
    if (model.zone.core > 0) legend.push(item('core', 'fault core'));
    if (!model.lineOnly) legend.push(item('damage', 'damage-zone edge'));
    if (model.strands > 0) legend.push(item('slip', 'slip surface'));
    if (model.traces) legend.push(model.host === 'porous' ? item('band', 'deformation bands') : item('fracture', 'fractures'));
    if (model.scanline) legend.push(item('scanline', 'scanline'));
    if (model.flow) legend.push(...(model.flow === 'crystalline' ? [item('along', 'flow along')] : []), item('across', 'flow across, stopped'));
  }
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
    'fault-growth': () => `${growthControlsMarkup(step)}${goalMarkup(step)}`,
    'fault-zone': () => `${zoneControlsMarkup(step)}${goalMarkup(step)}`,
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
  growthScene.highlight(null);
  growthPlot.highlight(null);
  setZoneHighlight(null);
  bindEquationPanel();
  bindForceLabControls();
  bindVectorLabControls();
  bindAndersonControls();
  bindFrictionControls();
  bindFaultControls();
  bindGrowthControls();
  bindZoneControls();
  syncForceLabReadouts();
  syncVectorLab();
  syncAnderson();
  syncFriction();
  syncFault();
  syncGrowth();
  syncZone();
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
  if (step.visualKind === 'fault-growth') initGrowth(step);
  if (step.visualKind === 'fault-zone') initZone(step);
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
  const growthActive = isGrowthStep();
  const zoneActive = isZoneStep();
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
  } else if (growthActive) {
    syncGrowthChrome(step);
  } else if (zoneActive) {
    syncZoneChrome(step);
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
  growthScene.renderer.domElement.setAttribute('aria-hidden', String(!growthActive));
  elements.growthPlot.setAttribute('aria-hidden', String(!growthActive));
  zoneScene.renderer.domElement.setAttribute('aria-hidden', String(!zoneActive));
  elements.zoneViewport.querySelector('.plot-panel').setAttribute('aria-hidden', String(!zoneActive));
  const labActive = forceLabActive || vectorLabActive || andersonActive || frictionActive || faultActive || growthActive || zoneActive;
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
  else if (isGrowthStep()) resetGrowth();
  else if (isZoneStep()) resetZone();
  else stressScene.replay();
});
elements.resetViewButton.addEventListener('click', () => {
  if (isForceLabStep()) forceLabScene.resetCamera();
  else if (isVectorLabStep()) vectorLabScene.resetCamera();
  else if (isAndersonStep()) andersonScene.resetCamera();
  else if (isFrictionStep()) frictionScene.resetCamera();
  else if (isFaultStep()) faultScene.resetCamera();
  else if (isGrowthStep()) growthScene.resetCamera();
  else if (isZoneStep()) zoneScene.resetCamera();
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
