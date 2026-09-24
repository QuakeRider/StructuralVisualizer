import './styles.css';
import { COMPONENTS, STRESS_STATES, formatStress, getStressState, scalePreset } from './domain/stressStates.js';
import { computeDeformation, tensorToMatrix, volumeChangePercent } from './domain/deformation.js';
import { decomposeTraction } from './domain/forceStress.js';
import { STRESS_LESSON, getLessonStep, isLessonChoiceCorrect } from './lessons/stressLesson.js';
import { ForceLabScene } from './visualization/ForceLabScene.js';
import { StressScene } from './visualization/StressScene.js';

const DEFAULT_STATE_ID = 'uniaxial-tension';
const DEFAULT_MAGNITUDE = 28;
const DEFAULT_EXAGGERATION = 1.2;
const DEFAULT_FORCE = { x: 0, y: -5_000, z: 0 };
const DEFAULT_NORMAL = { x: 0, y: 1, z: 0 };

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="app-shell" data-mode="guided" data-visual-kind="force-lab">
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
      <div class="module-chip"><span>Current module</span><strong>Forces &amp; stress</strong></div>
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
            <span id="active-number" class="state-number">F1</span>
            <div><p class="section-kicker">Interactive laboratory</p><h2 id="active-state-name">3D force laboratory</h2></div>
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
          <div id="stress-viewport" class="viewport stress-viewport"></div>
          <div id="interaction-hint" class="interaction-hint">Drag the white handle to change force · drag empty space to orbit</div>
          <div class="scene-legend" aria-label="Scene color and symbol key">
            <span class="legend-normal">Normal component</span><span class="legend-shear">Shear component</span><span class="legend-surface">Selected surface</span>
          </div>
        </div>

        <div id="response-strip" class="response-strip" aria-live="polite">
          <div class="response-copy"><span class="metric-label">Characteristic response</span><strong id="response-text"></strong></div>
          <div class="metric"><span id="magnitude-label" class="metric-label">Magnitude</span><strong id="magnitude-metric"></strong></div>
          <div class="metric"><span id="volume-label" class="metric-label">Volume change</span><strong id="volume-metric"></strong></div>
        </div>
      </section>

      <aside class="panel lesson-panel" aria-label="Guided lesson">
        <div class="lesson-progress-header">
          <div><p class="section-kicker">${STRESS_LESSON.title}</p><strong id="lesson-progress-label">Step 1 of ${STRESS_LESSON.steps.length}</strong></div>
          <div class="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="1" aria-valuemax="${STRESS_LESSON.steps.length}" aria-valuenow="1"><span></span></div>
        </div>
        <div id="lesson-card" class="lesson-card" aria-live="polite"></div>
        <details class="syllabus">
          <summary>View all lesson steps</summary>
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
  presetGrid: document.querySelector('#preset-grid'),
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
  responseStrip: document.querySelector('#response-strip'),
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
  stressViewport: document.querySelector('#stress-viewport'),
};

const state = {
  mode: 'guided',
  selectedId: DEFAULT_STATE_ID,
  magnitude: DEFAULT_MAGNITUDE,
  exaggeration: DEFAULT_EXAGGERATION,
  stress: scalePreset(getStressState(DEFAULT_STATE_ID), DEFAULT_MAGNITUDE),
  customized: false,
  lessonStepIndex: 0,
  maxLessonStepVisited: 0,
  lessonChoiceId: null,
  lessonChoiceCorrect: false,
  forceVector: { ...DEFAULT_FORCE },
  surfaceNormal: { ...DEFAULT_NORMAL },
  contactArea: 100,
};

function isForceLabStep() {
  return state.mode === 'guided' && getLessonStep(state.lessonStepIndex).visualKind === 'force-lab';
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
});

function forceMagnitude() {
  return Math.hypot(state.forceVector.x, state.forceVector.y, state.forceVector.z);
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

function renderPresets() {
  elements.presetGrid.innerHTML = STRESS_STATES.map((preset) => `
    <button class="preset-card${preset.id === state.selectedId ? ' is-active' : ''}" type="button" data-state-id="${preset.id}" aria-pressed="${preset.id === state.selectedId}">
      <span class="preset-topline"><span class="preset-index">${String(preset.number).padStart(2, '0')}</span><span class="preset-family">${preset.family}</span></span>
      <span class="preset-glyph" aria-hidden="true">${preset.glyph}</span><strong>${preset.name}</strong>
    </button>`).join('');
  for (const button of elements.presetGrid.querySelectorAll('.preset-card')) button.addEventListener('click', () => selectPreset(button.dataset.stateId));
}

function renderLessonSidebar() {
  elements.lessonStepList.innerHTML = STRESS_LESSON.steps.map((step, index) => `
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

function forceControlsMarkup(step) {
  const controls = new Set(step.controls ?? []);
  const magnitude = forceMagnitude() / 1_000;
  const componentFields = controls.has('components') ? `
    <fieldset class="vector-inputs"><legend>Force components <span>kN</span></legend><div>
      ${['x', 'y', 'z'].map((axis) => `<label><span>F<sub>${axis}</sub></span><input id="force-${axis}-input" data-force-axis="${axis}" type="number" min="-10" max="10" step="0.25" value="${(state.forceVector[axis] / 1_000).toFixed(2)}" /></label>`).join('')}
    </div></fieldset>` : '';
  const magnitudeControl = controls.has('magnitude') ? `
    <label class="lab-control" for="force-magnitude-input"><span>Force magnitude <output id="force-magnitude-output">${magnitude.toFixed(2)} kN</output></span><input id="force-magnitude-input" class="range" type="range" min="1000" max="10000" step="100" value="${forceMagnitude()}" /></label>` : '';
  const areaControl = controls.has('area') ? `
    <label class="lab-control" for="contact-area-input"><span>Contact area <output id="contact-area-output">${state.contactArea} cm²</output></span><input id="contact-area-input" class="range" type="range" min="25" max="200" step="5" value="${state.contactArea}" /></label>` : '';
  const presets = controls.has('presets') ? `
    <div class="direction-control"><span>Quick directions</span><div class="segmented-control" role="group" aria-label="Force direction relative to selected surface">
      <button type="button" data-force-preset="normal">Normal</button><button type="button" data-force-preset="oblique">Oblique</button><button type="button" data-force-preset="tangential">Tangential</button>
    </div></div>` : '';
  return `<div class="lab-controls">${magnitudeControl}${componentFields}${areaControl}${presets}</div>`;
}

function forceFormulaMarkup(step) {
  const decomposition = decomposeTraction(state.forceVector, state.contactArea, state.surfaceNormal);
  if (step.spotlight === 'force') return `<strong>|F| = √(F<sub>x</sub>² + F<sub>y</sub>² + F<sub>z</sub>²)</strong><span id="formula-value">${(forceMagnitude() / 1_000).toFixed(2)} kN</span>`;
  if (step.spotlight === 'surface') return `<strong>cos θ = |F · n| / |F|</strong><span id="formula-value">θ = ${surfaceAngleDegrees().toFixed(1)}°</span>`;
  if (step.spotlight === 'area' || step.spotlight === 'traction') return `<strong>t̄ = F / A</strong><span id="formula-value">|t̄| = ${decomposition.tractionMagnitude.toFixed(3)} MPa</span>`;
  return `<strong>t<sub>n</sub> = t̄ · n</strong><strong>τ = t̄ − t<sub>n</sub>n</strong>`;
}

function forceReadoutsMarkup(step) {
  const cards = [
    `<div><span>Force vector, F</span><strong id="force-vector-readout">${vectorText(state.forceVector, 1_000)} kN</strong></div>`,
  ];
  if (step.spotlight !== 'force') cards.push(`<div><span>Surface normal, n</span><strong id="surface-normal-readout">${vectorText(state.surfaceNormal, 1, 0)}</strong></div>`);
  if (['area', 'traction', 'decomposition'].includes(step.spotlight)) cards.push(`<div><span>Average traction, |t̄|</span><strong id="traction-readout">0.000 MPa</strong></div>`);
  if (step.spotlight === 'decomposition') {
    cards.push(`<div class="normal-readout"><span>Signed normal traction, t<sub>n</sub></span><strong id="normal-stress-readout">0.000 MPa</strong></div>`);
    cards.push(`<div class="shear-readout"><span>Shear magnitude, |τ|</span><strong id="shear-stress-readout">0.000 MPa</strong></div>`);
  }
  return `<div class="lab-readouts">${cards.join('')}</div>`;
}

function renderLessonPanel() {
  const step = getLessonStep(state.lessonStepIndex);
  const hasChoices = Boolean(step.choices?.length);
  const choices = hasChoices ? `
    <fieldset class="prediction-group"><legend>${step.prompt}</legend><div class="prediction-options">
      ${step.choices.map((choice) => `<button class="prediction-button${state.lessonChoiceId === choice.id ? ' is-selected' : ''}${state.lessonChoiceId === choice.id && choice.correct ? ' is-correct' : ''}" type="button" data-choice-id="${choice.id}" aria-pressed="${state.lessonChoiceId === choice.id}">${choice.label}</button>`).join('')}
    </div><p class="prediction-feedback${state.lessonChoiceId ? ' is-visible' : ''}" role="status">${state.lessonChoiceId ? step.choices.find((choice) => choice.id === state.lessonChoiceId).feedback : 'Choose an answer when you are ready.'}</p></fieldset>` : '';
  const labContent = step.visualKind === 'force-lab' ? `
    <div class="formula-card">${forceFormulaMarkup(step)}</div>
    ${forceControlsMarkup(step)}
    ${forceReadoutsMarkup(step)}` : '';

  elements.lessonCard.innerHTML = `
    <div class="lesson-heading"><span class="step-badge">${step.activeNumber}</span><h2>${step.title}</h2><p>${step.body}</p></div>
    ${step.task ? `<div class="task-card"><span>Try it</span><p>${step.task}</p></div>` : ''}
    ${labContent}${choices}
    <div class="lesson-actions"><button id="lesson-back-button" class="button secondary" type="button" ${state.lessonStepIndex === 0 ? 'disabled' : ''}>Back</button><button id="lesson-next-button" class="button" type="button" ${hasChoices && !state.lessonChoiceCorrect ? 'disabled' : ''}>${step.final ? 'Open Explore' : 'Continue'}</button></div>`;

  for (const button of elements.lessonCard.querySelectorAll('.prediction-button')) button.addEventListener('click', () => chooseLessonAnswer(button.dataset.choiceId));
  elements.lessonCard.querySelector('#lesson-back-button').addEventListener('click', () => applyLessonStep(state.lessonStepIndex - 1));
  elements.lessonCard.querySelector('#lesson-next-button').addEventListener('click', () => step.final ? setMode('explore') : applyLessonStep(state.lessonStepIndex + 1));
  bindForceLabControls();
  syncForceLabReadouts();
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
      state.forceVector = { ...state.forceVector, [input.dataset.forceAxis]: Number(input.value) * 1_000 };
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
  if (preset === 'normal') state.forceVector = { x: -normal.x * magnitude, y: -normal.y * magnitude, z: -normal.z * magnitude };
  if (preset === 'tangential') state.forceVector = { x: tangent.x * magnitude, y: tangent.y * magnitude, z: tangent.z * magnitude };
  if (preset === 'oblique') {
    const factor = magnitude / Math.sqrt(2);
    state.forceVector = { x: (tangent.x - normal.x) * factor, y: (tangent.y - normal.y) * factor, z: (tangent.z - normal.z) * factor };
  }
  syncForceLabReadouts();
}

function surfaceAngleDegrees() {
  const magnitude = forceMagnitude();
  if (magnitude < 1) return 0;
  const normalMagnitude = Math.hypot(state.surfaceNormal.x, state.surfaceNormal.y, state.surfaceNormal.z);
  const dot = state.forceVector.x * state.surfaceNormal.x + state.forceVector.y * state.surfaceNormal.y + state.forceVector.z * state.surfaceNormal.z;
  return Math.acos(Math.min(1, Math.abs(dot) / (magnitude * normalMagnitude))) * 180 / Math.PI;
}

function setText(selector, value) {
  const element = elements.lessonCard.querySelector(selector);
  if (element) element.textContent = value;
}

function syncForceLabReadouts() {
  if (!isForceLabStep()) return;
  const step = getLessonStep(state.lessonStepIndex);
  const result = decomposeTraction(state.forceVector, state.contactArea, state.surfaceNormal);
  forceLabScene.setForce(state.forceVector);
  forceLabScene.setArea(state.contactArea);
  forceLabScene.setSurfaceNormal(state.surfaceNormal);
  forceLabScene.setOptions(step.labOptions);

  const magnitudeInput = elements.lessonCard.querySelector('#force-magnitude-input');
  if (magnitudeInput && document.activeElement !== magnitudeInput) magnitudeInput.value = String(forceMagnitude());
  setText('#force-magnitude-output', `${(forceMagnitude() / 1_000).toFixed(2)} kN`);
  const areaInput = elements.lessonCard.querySelector('#contact-area-input');
  if (areaInput && document.activeElement !== areaInput) areaInput.value = String(state.contactArea);
  setText('#contact-area-output', `${state.contactArea} cm²`);
  for (const axis of ['x', 'y', 'z']) {
    const input = elements.lessonCard.querySelector(`#force-${axis}-input`);
    if (input && document.activeElement !== input) input.value = (state.forceVector[axis] / 1_000).toFixed(2);
  }
  setText('#force-vector-readout', `${vectorText(state.forceVector, 1_000)} kN`);
  setText('#surface-normal-readout', vectorText(state.surfaceNormal, 1, 0));
  setText('#traction-readout', `${result.tractionMagnitude.toFixed(3)} MPa`);
  setText('#normal-stress-readout', `${result.normalTraction.toFixed(3)} MPa`);
  setText('#shear-stress-readout', `${result.shearMagnitude.toFixed(3)} MPa`);
  if (step.spotlight === 'force') setText('#formula-value', `${(forceMagnitude() / 1_000).toFixed(2)} kN`);
  if (step.spotlight === 'surface') setText('#formula-value', `θ = ${surfaceAngleDegrees().toFixed(1)}°`);
  if (step.spotlight === 'area' || step.spotlight === 'traction') setText('#formula-value', `|t̄| = ${result.tractionMagnitude.toFixed(3)} MPa`);
}

function chooseLessonAnswer(choiceId) {
  const step = getLessonStep(state.lessonStepIndex);
  state.lessonChoiceId = choiceId;
  state.lessonChoiceCorrect = isLessonChoiceCorrect(step, choiceId);
  if (state.lessonChoiceCorrect && step.visualKind === 'stress-state') stressScene.replay();
  renderLessonPanel();
}

function applyLessonStep(index) {
  state.lessonStepIndex = Math.min(Math.max(index, 0), STRESS_LESSON.steps.length - 1);
  const step = getLessonStep(state.lessonStepIndex);
  state.maxLessonStepVisited = Math.max(state.maxLessonStepVisited, state.lessonStepIndex);
  state.lessonChoiceId = null;
  state.lessonChoiceCorrect = !step.choices;
  state.selectedId = step.presetId;
  state.magnitude = step.magnitude;
  state.stress = scalePreset(getStressState(step.presetId), step.magnitude);
  state.customized = false;
  elements.vectorsToggle.checked = step.vectors;
  elements.outlineToggle.checked = step.outline;
  elements.gridToggle.checked = step.grid;
  elements.appShell.dataset.lessonStep = String(state.lessonStepIndex);
  elements.appShell.dataset.visualKind = step.visualKind;
  stressScene.setShowVectors(step.vectors);
  stressScene.setShowOriginal(step.outline);
  stressScene.setShowGrid(step.grid);
  stressScene.setStress(state.stress);
  if (step.visualKind === 'stress-state') stressScene.replay();
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
  const leavingForceLab = getLessonStep(state.lessonStepIndex).visualKind === 'force-lab';
  state.mode = mode;
  elements.appShell.dataset.mode = mode;
  for (const button of elements.modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (mode === 'guided') applyLessonStep(state.lessonStepIndex);
  else {
    elements.appShell.dataset.visualKind = 'stress-state';
    if (leavingForceLab) restoreExploreDefaults();
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
  state.forceVector = { ...DEFAULT_FORCE };
  state.surfaceNormal = { ...DEFAULT_NORMAL };
  state.contactArea = 100;
  syncForceLabReadouts();
}

function currentResponseText() {
  const preset = getStressState(state.selectedId);
  if (state.mode !== 'guided') return preset.response;
  const step = getLessonStep(state.lessonStepIndex);
  if (step.choices && !state.lessonChoiceCorrect) return 'Use the lesson panel to make a prediction.';
  return step.responseOverride ?? preset.response;
}

function syncAll() {
  const preset = getStressState(state.selectedId);
  const lessonStep = state.mode === 'guided' ? getLessonStep(state.lessonStepIndex) : null;
  elements.activeName.textContent = lessonStep?.activeLabel ?? (state.customized ? `Modified ${preset.name}` : preset.name);
  elements.activeNumber.textContent = lessonStep?.activeNumber ?? String(preset.number).padStart(2, '0');
  elements.lessonProgressLabel.textContent = `Step ${state.lessonStepIndex + 1} of ${STRESS_LESSON.steps.length}`;
  elements.lessonProgress.setAttribute('aria-valuenow', String(state.lessonStepIndex + 1));
  elements.lessonProgress.querySelector('span').style.width = `${((state.lessonStepIndex + 1) / STRESS_LESSON.steps.length) * 100}%`;
  elements.responseText.textContent = currentResponseText();
  elements.magnitudeInput.value = String(Math.max(state.magnitude, 5));
  elements.magnitudeOutput.textContent = `${state.magnitude.toFixed(0)} MPa`;
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;

  if (isForceLabStep()) {
    const step = getLessonStep(state.lessonStepIndex);
    elements.interactionHint.textContent = step.labOptions.allowSurfaceSelection
      ? 'Drag the white handle · click a face to select its normal · drag empty space to orbit'
      : 'Drag the white handle to change force · drag empty space to orbit';
    if (step.spotlight === 'force') {
      elements.sceneLegend.hidden = true;
    } else {
      elements.sceneLegend.hidden = false;
      elements.sceneLegend.innerHTML = step.spotlight === 'decomposition'
        ? '<span class="legend-normal">Normal component</span><span class="legend-shear">Shear component</span><span class="legend-surface">Contact area</span>'
        : `<span class="legend-normal">Surface normal</span>${step.labOptions.showArea ? '<span class="legend-surface">Contact area</span>' : ''}`;
    }
    syncForceLabReadouts();
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
  const forceLabActive = isForceLabStep();
  forceLabScene.renderer.domElement.setAttribute('aria-hidden', String(!forceLabActive));
  stressScene.renderer.domElement.setAttribute('aria-hidden', String(forceLabActive));
  elements.replayButton.innerHTML = forceLabActive ? 'Reset values' : '<span aria-hidden="true">↻</span> Replay';
  for (const button of elements.presetGrid.querySelectorAll('.preset-card')) {
    const active = button.dataset.stateId === state.selectedId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  syncStressReadouts();
  syncPresentationControls();
}

function syncStressReadouts() {
  const preset = getStressState(state.selectedId);
  if (state.mode !== 'guided') elements.activeName.textContent = state.customized ? `Modified ${preset.name}` : preset.name;
  elements.tensorMode.textContent = state.customized ? 'Modified' : 'Preset';
  elements.tensorMode.classList.toggle('is-modified', state.customized);
  const matrix = tensorToMatrix(state.stress);
  elements.tensorMatrix.innerHTML = matrix.flat().map((value) => {
    const safe = Math.abs(value) < 0.05 ? 0 : value;
    return `<span data-kind="${safe > 0 ? 'compression' : safe < 0 ? 'tension' : 'zero'}">${safe.toFixed(1)}</span>`;
  }).join('');
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

for (const button of elements.modeButtons) button.addEventListener('click', () => setMode(button.dataset.mode));
elements.magnitudeInput.addEventListener('input', (event) => setMagnitude(event.target.value));
elements.exaggerationInput.addEventListener('input', (event) => {
  state.exaggeration = Number(event.target.value);
  stressScene.setExaggeration(state.exaggeration);
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;
});
elements.replayButton.addEventListener('click', () => isForceLabStep() ? resetForceLab() : stressScene.replay());
elements.resetViewButton.addEventListener('click', () => isForceLabStep() ? forceLabScene.resetCamera() : stressScene.resetCamera());
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
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.mode === 'present') setMode('explore'); });

renderPresets();
renderLessonSidebar();
renderComponentControls();
renderPresentationOptions();
applyLessonStep(0);
