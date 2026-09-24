import './styles.css';
import { COMPONENTS, STRESS_STATES, formatStress, getStressState, scalePreset } from './domain/stressStates.js';
import { tensorToMatrix } from './domain/deformation.js';
import { STRESS_LESSON, getLessonStep, isLessonChoiceCorrect } from './lessons/stressLesson.js';
import { StressScene } from './visualization/StressScene.js';

const DEFAULT_STATE_ID = 'uniaxial-tension';
const DEFAULT_MAGNITUDE = 28;
const DEFAULT_EXAGGERATION = 1.2;

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="app-shell" data-mode="explore">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <p class="eyebrow">Structural geology learning lab</p>
          <h1>Stress State Explorer</h1>
        </div>
      </div>
      <nav class="mode-switch" aria-label="Learning mode">
        <button class="mode-button" type="button" data-mode="guided" aria-pressed="false">Guided lesson</button>
        <button class="mode-button is-active" type="button" data-mode="explore" aria-pressed="true">Explore</button>
        <button class="mode-button" type="button" data-mode="present" aria-pressed="false">Present</button>
      </nav>
      <div class="header-meta" aria-label="Project status">
        <span class="status-dot" aria-hidden="true"></span>
        <span>v0.2</span>
        <span class="header-divider" aria-hidden="true"></span>
        <span>Compression-positive</span>
      </div>
    </header>

    <main class="workspace">
      <aside class="panel preset-panel" aria-label="Stress-state navigation">
        <div class="explore-sidebar-content">
          <div class="panel-heading">
            <div><p class="section-kicker">01 / Choose a case</p><h2>Stress states</h2></div>
            <span class="count-badge">10 cases</span>
          </div>
          <p class="panel-intro">Select a preset from the reference sequence. Every case uses the same deformable block.</p>
          <div id="preset-grid" class="preset-grid" role="group" aria-label="Stress-state presets"></div>
          <div class="sign-key">
            <span><i class="key-line tension"></i>Tension</span>
            <span><i class="key-line compression"></i>Compression</span>
            <span><i class="key-line shear"></i>Shear</span>
          </div>
        </div>
        <div class="guide-sidebar-content">
          <div class="panel-heading guide-heading">
            <div><p class="section-kicker">Guided lesson</p><h2>${STRESS_LESSON.title}</h2></div>
            <span class="count-badge">${STRESS_LESSON.duration}</span>
          </div>
          <p class="panel-intro">${STRESS_LESSON.summary}</p>
          <div id="lesson-step-list" class="lesson-step-list" role="group" aria-label="Lesson steps"></div>
          <div class="lesson-sidebar-note">
            <span aria-hidden="true">◎</span>
            <p>Use <strong>Explore</strong> whenever you want the full controls and all ten cases.</p>
          </div>
        </div>
      </aside>

      <section class="visual-column" aria-labelledby="active-state-name">
        <div class="visual-header">
          <div>
            <p class="section-kicker">Observe the response</p>
            <div class="active-title-row">
              <span id="active-number" class="state-number">01</span>
              <h2 id="active-state-name">Uniaxial tension</h2>
            </div>
          </div>
          <div class="view-actions">
            <button id="replay-button" class="button primary" type="button"><span aria-hidden="true">↻</span> Replay</button>
            <button id="reset-view-button" class="button ghost" type="button">Reset view</button>
          </div>
        </div>

        <div id="lesson-card" class="lesson-card" aria-live="polite"></div>

        <div class="presentation-toolbar" aria-label="Presentation controls">
          <label><span>Stress state</span><select id="presentation-state-select"></select></label>
          <label class="presentation-magnitude-control">
            <span>Magnitude <output id="presentation-magnitude-output">28 MPa</output></span>
            <input id="presentation-magnitude-input" type="range" min="5" max="60" step="1" value="28" />
          </label>
          <button id="presentation-vectors-button" class="button ghost" type="button" aria-pressed="true">Vectors on</button>
          <button id="presentation-exit-button" class="button" type="button">Exit presentation</button>
        </div>

        <div class="viewport-shell">
          <div id="viewport" class="viewport"></div>
          <div class="viewport-label">Drag to orbit · scroll to zoom</div>
          <div class="axis-key" aria-label="Axis colors">
            <span><i class="axis-x"></i>x</span><span><i class="axis-y"></i>y</span><span><i class="axis-z"></i>z</span>
          </div>
        </div>

        <div id="response-strip" class="response-strip" aria-live="polite">
          <div class="response-copy">
            <span class="metric-label">Characteristic response</span>
            <strong id="response-text">The block extends parallel to the tensile direction and narrows laterally.</strong>
          </div>
          <div class="metric"><span class="metric-label">Magnitude</span><strong id="magnitude-metric">28.0 MPa</strong></div>
          <div class="metric"><span class="metric-label">Volume change</span><strong id="volume-metric">ΔV +0.0%</strong></div>
        </div>
      </section>

      <aside class="panel inspector-panel" aria-labelledby="controls-heading">
        <div class="panel-heading">
          <div><p class="section-kicker">03 / Change the stress</p><h2 id="controls-heading">Controls</h2></div>
          <button id="reset-all-button" class="text-button" type="button">Reset</button>
        </div>
        <div class="control-group">
          <div class="control-label-row"><label for="magnitude-input">Preset magnitude</label><output id="magnitude-output" for="magnitude-input">28 MPa</output></div>
          <input id="magnitude-input" class="range tension-range" type="range" min="5" max="60" step="1" value="28" />
          <div class="range-scale"><span>5</span><span>60 MPa</span></div>
        </div>
        <div class="control-group">
          <div class="control-label-row"><label for="exaggeration-input">Deformation exaggeration</label><output id="exaggeration-output" for="exaggeration-input">1.2×</output></div>
          <input id="exaggeration-input" class="range" type="range" min="0.5" max="2.5" step="0.1" value="1.2" />
          <div class="range-scale"><span>Subtle</span><span>High</span></div>
        </div>
        <fieldset class="display-options">
          <legend>Display</legend>
          <label class="switch-row"><span><strong>Stress vectors</strong><small>Show face-oriented arrows</small></span><input id="vectors-toggle" type="checkbox" checked /></label>
          <label class="switch-row"><span><strong>Original outline</strong><small>Compare undeformed geometry</small></span><input id="outline-toggle" type="checkbox" checked /></label>
          <label class="switch-row"><span><strong>Axes and grid</strong><small>Keep spatial reference visible</small></span><input id="grid-toggle" type="checkbox" checked /></label>
        </fieldset>
        <div class="tensor-card" aria-labelledby="tensor-heading">
          <div class="tensor-heading-row">
            <div><span class="metric-label">Current tensor</span><h3 id="tensor-heading">σ (MPa)</h3></div>
            <span id="tensor-mode" class="mode-badge">Preset</span>
          </div>
          <div id="tensor-matrix" class="tensor-matrix" aria-label="Three by three stress tensor"></div>
        </div>
        <details class="component-details">
          <summary>Fine-tune tensor components</summary>
          <p>Editing a component creates a modified version of the selected preset.</p>
          <div id="component-controls" class="component-controls"></div>
        </details>
        <div class="scope-note"><span aria-hidden="true">◎</span><p><strong>Qualitative model.</strong> Deformation is exaggerated for teaching. Material properties and failure mechanics are planned later.</p></div>
      </aside>
    </main>

    <footer class="app-footer">
      <span>Stress vectors show loading; block shape shows a simplified response.</span>
      <span>Guided lesson · free exploration · classroom presentation</span>
    </footer>
  </div>
`;

const elements = {
  appShell: document.querySelector('.app-shell'),
  modeButtons: [...document.querySelectorAll('.mode-button')],
  presetGrid: document.querySelector('#preset-grid'),
  lessonStepList: document.querySelector('#lesson-step-list'),
  lessonCard: document.querySelector('#lesson-card'),
  activeName: document.querySelector('#active-state-name'),
  activeNumber: document.querySelector('#active-number'),
  responseStrip: document.querySelector('#response-strip'),
  responseText: document.querySelector('#response-text'),
  magnitudeInput: document.querySelector('#magnitude-input'),
  magnitudeOutput: document.querySelector('#magnitude-output'),
  magnitudeMetric: document.querySelector('#magnitude-metric'),
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
  viewport: document.querySelector('#viewport'),
};

const state = {
  mode: 'explore', selectedId: DEFAULT_STATE_ID, magnitude: DEFAULT_MAGNITUDE,
  exaggeration: DEFAULT_EXAGGERATION,
  stress: scalePreset(getStressState(DEFAULT_STATE_ID), DEFAULT_MAGNITUDE),
  customized: false, lessonStepIndex: 0, maxLessonStepVisited: 0,
  lessonChoiceId: null, lessonChoiceCorrect: false,
};

const scene = new StressScene(elements.viewport, {
  onVolumeChange: (value) => {
    const sign = value > 0.05 ? '+' : '';
    elements.volumeMetric.textContent = `ΔV ${sign}${value.toFixed(1)}%`;
    elements.volumeMetric.dataset.direction = value > 0.05 ? 'increase' : value < -0.05 ? 'decrease' : 'neutral';
  },
});

function renderPresets() {
  elements.presetGrid.innerHTML = STRESS_STATES.map((preset) => `
    <button class="preset-card${preset.id === state.selectedId ? ' is-active' : ''}" type="button" data-state-id="${preset.id}" aria-pressed="${preset.id === state.selectedId}">
      <span class="preset-topline"><span class="preset-index">${String(preset.number).padStart(2, '0')}</span><span class="preset-family">${preset.family}</span></span>
      <span class="preset-glyph" aria-hidden="true">${preset.glyph}</span><strong>${preset.name}</strong>
    </button>`).join('');
  for (const button of elements.presetGrid.querySelectorAll('.preset-card')) {
    button.addEventListener('click', () => selectPreset(button.dataset.stateId));
  }
}

function renderLessonSidebar() {
  elements.lessonStepList.innerHTML = STRESS_LESSON.steps.map((step, index) => `
    <button class="lesson-step${index === state.lessonStepIndex ? ' is-active' : ''}${index < state.maxLessonStepVisited ? ' is-complete' : ''}" type="button" data-step-index="${index}" aria-current="${index === state.lessonStepIndex ? 'step' : 'false'}">
      <span class="lesson-step-number">${index < state.maxLessonStepVisited ? '✓' : String(index + 1).padStart(2, '0')}</span><span>${step.label}</span>
    </button>`).join('');
  for (const button of elements.lessonStepList.querySelectorAll('.lesson-step')) {
    button.addEventListener('click', () => applyLessonStep(Number(button.dataset.stepIndex)));
  }
}

function renderComponentControls() {
  elements.componentControls.innerHTML = COMPONENTS.map(({ key, label, longLabel }) => `
    <div class="component-control"><div class="control-label-row compact"><label for="component-${key}" aria-label="${longLabel}">${label}</label><output id="component-${key}-output" for="component-${key}">0.0</output></div>
      <input id="component-${key}" class="range component-range" data-component="${key}" type="range" min="-60" max="60" step="1" value="0" aria-label="${longLabel} in megapascals" /></div>`).join('');
  for (const input of elements.componentControls.querySelectorAll('input')) {
    input.addEventListener('input', () => {
      state.stress = { ...state.stress, [input.dataset.component]: Number(input.value) };
      state.customized = true;
      scene.setStress(state.stress);
      syncReadouts();
    });
  }
}

function renderPresentationOptions() {
  elements.presentationStateSelect.innerHTML = STRESS_STATES.map((preset) => `<option value="${preset.id}">${String(preset.number).padStart(2, '0')} · ${preset.name}</option>`).join('');
}

function renderLessonCard() {
  const step = getLessonStep(state.lessonStepIndex);
  const hasChoices = Boolean(step.choices?.length);
  const choiceMarkup = hasChoices ? `
    <fieldset class="prediction-group"><legend>${step.prompt}</legend><div class="prediction-options">
      ${step.choices.map((choice) => `<button class="prediction-button${state.lessonChoiceId === choice.id ? ' is-selected' : ''}${state.lessonChoiceId === choice.id && choice.correct ? ' is-correct' : ''}" type="button" data-choice-id="${choice.id}" aria-pressed="${state.lessonChoiceId === choice.id}">${choice.label}</button>`).join('')}
    </div><p class="prediction-feedback${state.lessonChoiceId ? ' is-visible' : ''}" role="status">${state.lessonChoiceId ? step.choices.find((choice) => choice.id === state.lessonChoiceId).feedback : 'Choose an answer to reveal the response.'}</p></fieldset>` : '';

  elements.lessonCard.innerHTML = `
    <div class="lesson-card-copy"><div class="lesson-progress-row"><span class="section-kicker">Step ${state.lessonStepIndex + 1} of ${STRESS_LESSON.steps.length}</span><div class="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="1" aria-valuemax="${STRESS_LESSON.steps.length}" aria-valuenow="${state.lessonStepIndex + 1}"><span style="width:${((state.lessonStepIndex + 1) / STRESS_LESSON.steps.length) * 100}%"></span></div></div>
      <h3>${step.title}</h3><p>${step.body}</p>${choiceMarkup}</div>
    <div class="lesson-actions"><button id="lesson-back-button" class="button ghost" type="button" ${state.lessonStepIndex === 0 ? 'disabled' : ''}>Back</button><button id="lesson-next-button" class="button primary" type="button" ${hasChoices && !state.lessonChoiceCorrect ? 'disabled' : ''}>${step.final ? 'Open explorer' : 'Continue'}</button></div>`;

  for (const button of elements.lessonCard.querySelectorAll('.prediction-button')) button.addEventListener('click', () => chooseLessonAnswer(button.dataset.choiceId));
  elements.lessonCard.querySelector('#lesson-back-button').addEventListener('click', () => applyLessonStep(state.lessonStepIndex - 1));
  elements.lessonCard.querySelector('#lesson-next-button').addEventListener('click', () => step.final ? setMode('explore') : applyLessonStep(state.lessonStepIndex + 1));
}

function chooseLessonAnswer(choiceId) {
  const step = getLessonStep(state.lessonStepIndex);
  state.lessonChoiceId = choiceId;
  state.lessonChoiceCorrect = isLessonChoiceCorrect(step, choiceId);
  if (state.lessonChoiceCorrect) scene.replay();
  renderLessonCard();
  syncAll();
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
  elements.appShell.dataset.lessonSpotlight = step.spotlight;
  scene.setShowVectors(step.vectors);
  scene.setShowOriginal(step.outline);
  scene.setShowGrid(step.grid);
  scene.setStress(state.stress);
  scene.replay();
  renderLessonSidebar();
  renderLessonCard();
  syncAll();
}

function setMode(mode) {
  state.mode = mode;
  elements.appShell.dataset.mode = mode;
  for (const button of elements.modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  if (mode === 'guided') applyLessonStep(state.lessonStepIndex);
  else {
    scene.setShowVectors(elements.vectorsToggle.checked);
    scene.setShowOriginal(elements.outlineToggle.checked);
    scene.setShowGrid(elements.gridToggle.checked);
    syncAll();
  }
  syncPresentationControls();
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function selectPreset(id) {
  state.selectedId = getStressState(id).id;
  state.stress = scalePreset(getStressState(id), state.magnitude);
  state.customized = false;
  scene.setStress(state.stress);
  syncAll();
}

function setMagnitude(value) {
  state.magnitude = Number(value);
  state.stress = scalePreset(getStressState(state.selectedId), state.magnitude);
  state.customized = false;
  scene.setStress(state.stress);
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
  scene.setExaggeration(DEFAULT_EXAGGERATION);
  scene.setShowVectors(true);
  scene.setShowOriginal(true);
  scene.setShowGrid(true);
  scene.setStress(state.stress);
  scene.replay();
  syncAll();
}

function currentResponseText() {
  const preset = getStressState(state.selectedId);
  if (state.mode !== 'guided') return preset.response;
  const step = getLessonStep(state.lessonStepIndex);
  if (step.choices && !state.lessonChoiceCorrect) return 'Make a prediction above to reveal the characteristic response.';
  return step.responseOverride ?? preset.response;
}

function syncAll() {
  const preset = getStressState(state.selectedId);
  const lessonStep = state.mode === 'guided' ? getLessonStep(state.lessonStepIndex) : null;
  const activeLabel = lessonStep?.activeLabel ?? preset.name;
  elements.activeName.textContent = state.customized ? `Modified ${activeLabel}` : activeLabel;
  elements.activeNumber.textContent = lessonStep?.activeLabel ? '00' : String(preset.number).padStart(2, '0');
  elements.responseText.textContent = currentResponseText();
  elements.responseStrip.classList.toggle('is-awaiting-prediction', Boolean(lessonStep?.choices && !state.lessonChoiceCorrect));
  elements.magnitudeInput.value = String(Math.max(state.magnitude, 5));
  elements.magnitudeOutput.textContent = `${state.magnitude.toFixed(0)} MPa`;
  elements.magnitudeMetric.textContent = formatStress(state.magnitude);
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;
  for (const button of elements.presetGrid.querySelectorAll('.preset-card')) {
    const active = button.dataset.stateId === state.selectedId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  syncReadouts();
  syncPresentationControls();
}

function syncReadouts() {
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
  scene.setExaggeration(state.exaggeration);
  elements.exaggerationOutput.textContent = `${state.exaggeration.toFixed(1)}×`;
});
elements.replayButton.addEventListener('click', () => scene.replay());
elements.resetViewButton.addEventListener('click', () => scene.resetCamera());
elements.resetAllButton.addEventListener('click', resetAll);
elements.vectorsToggle.addEventListener('change', (event) => { scene.setShowVectors(event.target.checked); syncPresentationControls(); });
elements.outlineToggle.addEventListener('change', (event) => scene.setShowOriginal(event.target.checked));
elements.gridToggle.addEventListener('change', (event) => scene.setShowGrid(event.target.checked));
elements.presentationStateSelect.addEventListener('change', (event) => selectPreset(event.target.value));
elements.presentationMagnitudeInput.addEventListener('input', (event) => setMagnitude(event.target.value));
elements.presentationVectorsButton.addEventListener('click', () => {
  elements.vectorsToggle.checked = !elements.vectorsToggle.checked;
  scene.setShowVectors(elements.vectorsToggle.checked);
  syncPresentationControls();
});
elements.presentationExitButton.addEventListener('click', () => setMode('explore'));
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.mode === 'present') setMode('explore'); });

renderPresets();
renderLessonSidebar();
renderComponentControls();
renderPresentationOptions();
scene.setStress(state.stress, { immediate: true });
syncAll();
