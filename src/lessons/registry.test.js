import { describe, expect, it } from 'vitest';
import { ANDERSON_REGIMES, andersonAxes, andersonFaults, principalStressTensor } from '../domain/anderson.js';
import { frictionCheck, newFaultSigma1, principalCosines, principalMagnitudes, reactivationSigma1 } from '../domain/failure.js';
import { lineVector, planeFromStrike, planePole } from '../domain/orientation.js';
import { STRESS_STATES } from '../domain/stressStates.js';
import { magnitude, polarAngle, rotate2D } from '../domain/vector.js';
import { SCENE_REFS } from '../visualization/sceneRefs.js';
import {
  LESSONS,
  LESSON_STATUSES,
  UNITS,
  checkNumericAnswer,
  getAvailableLessons,
  getLesson,
  getLessonStep,
  getNextAvailableLesson,
  hasPrediction,
  isGoalMet,
  isLessonChoiceCorrect,
  parseNumericInput,
} from './registry.js';

const STATICS_SPOTLIGHTS = ['moment', 'free-body', 'equilibrium', 'actions', 'cut', 'internal-actions'];
const STATICS_CONTROLS = ['constraint', 'application', 'cut'];
const STATICS_LAB_OPTIONS = ['showResultants', 'showSupport', 'showReactions', 'showCut', 'showInternalActions', 'allowApplicationPoint'];

const allSteps = LESSONS.flatMap((lesson) => lesson.steps.map((step) => ({ lesson, step })));

describe('curriculum catalog', () => {
  it('lists the full 48-lesson curriculum with unique ids in unit order', () => {
    expect(LESSONS).toHaveLength(48);
    expect(new Set(LESSONS.map((lesson) => lesson.id)).size).toBe(48);
    const unitNumbers = LESSONS.map((lesson) => lesson.unit);
    expect(unitNumbers).toEqual([...unitNumbers].sort((a, b) => a - b));
    for (const lesson of LESSONS) expect(UNITS.some((unit) => unit.number === lesson.unit)).toBe(true);
  });

  it('references only existing lessons as prerequisites', () => {
    const ids = new Set(LESSONS.map((lesson) => lesson.id));
    for (const lesson of LESSONS) {
      for (const prerequisite of lesson.prerequisites) expect(ids.has(prerequisite), `${lesson.id} → ${prerequisite}`).toBe(true);
    }
  });

  it('gives content only to lessons that are no longer planned', () => {
    for (const lesson of LESSONS) {
      expect(LESSON_STATUSES).toContain(lesson.status);
      expect(lesson.steps.length > 0).toBe(lesson.status !== 'planned');
    }
  });
});

describe('lesson content', () => {
  it('starts the curriculum at M1, seeds the Build 00 lessons, and includes B6 and B7 (built early)', () => {
    expect(getAvailableLessons().map((lesson) => lesson.id)).toEqual(['M1', 'M2', 'S2', 'S3', 'S7', 'S10', 'B6', 'B7']);
    expect(getLesson('B6').status).toBe('built');
    expect(getLesson('M2').status).toBe('built');
    expect(getLesson('B7').status).toBe('built');
    expect(getLesson('M1').status).toBe('built');
    expect(getLesson('S1').status).toBe('planned');
  });

  it('uses unique step ids within each lesson', () => {
    for (const lesson of LESSONS) {
      const ids = lesson.steps.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('references only existing stress-state presets', () => {
    const presetIds = new Set(STRESS_STATES.map((preset) => preset.id));
    for (const { step } of allSteps) {
      if (step.visualKind === 'stress-state' || step.presetId !== undefined) expect(presetIds.has(step.presetId)).toBe(true);
    }
  });

  it('gives every prediction prompt exactly one correct answer', () => {
    for (const { step } of allSteps.filter(({ step: candidate }) => candidate.choices)) {
      expect(step.prompt).toBeTruthy();
      expect(step.choices.filter((choice) => choice.correct)).toHaveLength(1);
    }
  });

  it('gives every numeric prompt feedback, and no known-wrong value overlaps the answer', () => {
    for (const { lesson, step } of allSteps.filter(({ step: candidate }) => candidate.answer)) {
      const where = `${lesson.id}/${step.id}`;
      expect(step.prompt, where).toBeTruthy();
      expect(step.choices, where).toBeUndefined();
      expect(step.answer.correctFeedback, where).toBeTruthy();
      expect(step.answer.fallbackFeedback, where).toBeTruthy();
      for (const wrong of step.answer.wrong ?? []) {
        expect(wrong.feedback, where).toBeTruthy();
        expect(Math.abs(wrong.value - step.answer.value) > step.answer.tolerance, where).toBe(true);
      }
    }
  });

  it('only hides live values in steps that ask for a prediction', () => {
    for (const { lesson, step } of allSteps.filter(({ step: candidate }) => candidate.revealAfterAnswer)) {
      expect(hasPrediction(step), `${lesson.id}/${step.id}`).toBe(true);
    }
  });

  it('contains no engineering-statics content', () => {
    for (const { lesson, step } of allSteps) {
      const where = `${lesson.id}/${step.id}`;
      expect(STATICS_SPOTLIGHTS, where).not.toContain(step.spotlight);
      for (const control of step.controls ?? []) expect(STATICS_CONTROLS, where).not.toContain(control);
      for (const option of Object.keys(step.labOptions ?? {})) expect(STATICS_LAB_OPTIONS, where).not.toContain(option);
      expect(step.initialLabState?.constraintMode, where).toBeUndefined();
      expect(step.initialLabState?.cutPosition, where).toBeUndefined();
    }
  });

  it('binds every equation symbol to a known scene object that appears in the equation', () => {
    for (const { lesson, step } of allSteps) {
      for (const equation of step.equations ?? []) {
        const where = `${lesson.id}/${step.id}/${equation.id}`;
        const refsInHtml = [...equation.html.matchAll(/data-scene-ref="([^"]+)"/g)].map((match) => match[1]);
        const knownRefs = SCENE_REFS[step.visualKind] ?? [];
        for (const ref of refsInHtml) expect(knownRefs, where).toContain(ref);
        for (const symbol of equation.symbols) {
          expect(knownRefs, where).toContain(symbol.sceneRef);
          expect(symbol.description, where).toBeTruthy();
        }
      }
    }
  });

  it('gives every lab step at least one bound equation', () => {
    for (const { lesson, step } of allSteps.filter(({ step: candidate }) => ['force-lab', 'vector-lab', 'anderson', 'friction'].includes(candidate.visualKind))) {
      expect(step.equations?.some((equation) => equation.symbols.length > 0), `${lesson.id}/${step.id}`).toBe(true);
    }
  });
});

describe('lesson navigation helpers', () => {
  it('clamps step lookup and evaluates answers', () => {
    const lesson = getLesson('S2');
    expect(getLessonStep(lesson, -10)).toBe(lesson.steps[0]);
    expect(getLessonStep(lesson, 500)).toBe(lesson.steps.at(-1));
    expect(isLessonChoiceCorrect(lesson.steps[1], 'point-five')).toBe(true);
    expect(isLessonChoiceCorrect(lesson.steps[1], 'five')).toBe(false);
  });

  it('finds the next lesson that has content', () => {
    expect(getNextAvailableLesson('M1').id).toBe('M2');
    expect(getNextAvailableLesson('M2').id).toBe('S2');
    expect(getNextAvailableLesson('S3').id).toBe('S7');
    expect(getNextAvailableLesson('S10').id).toBe('B6');
    expect(getNextAvailableLesson('B6').id).toBe('B7');
    expect(getNextAvailableLesson('B7')).toBeNull();
  });
});

describe('numeric answers and goals', () => {
  it('parses typed numbers, including a true minus sign', () => {
    expect(parseNumericInput('5')).toBe(5);
    expect(parseNumericInput(' −4 ')).toBe(-4);
    expect(parseNumericInput('+2.5')).toBe(2.5);
    expect(parseNumericInput('.5')).toBe(0.5);
    expect(parseNumericInput('five')).toBeNull();
    expect(parseNumericInput('')).toBeNull();
  });

  it('accepts the right magnitude and explains the classic mistakes', () => {
    const step = getLesson('M1').steps.find((candidate) => candidate.id === 'magnitude-2d');
    expect(checkNumericAnswer(step, '5').correct).toBe(true);
    expect(checkNumericAnswer(step, '5.0').correct).toBe(true);
    const summed = checkNumericAnswer(step, '7');
    expect(summed.correct).toBe(false);
    expect(summed.feedback).toMatch(/Pythagoras/);
    expect(checkNumericAnswer(step, '25').feedback).toMatch(/square root/);
    expect(checkNumericAnswer(step, '4.2').feedback).toBe(step.answer.fallbackFeedback);
    expect(checkNumericAnswer(step, 'abc').value).toBeNull();
  });

  it('matches each M1 magnitude answer to the vector the step starts with', () => {
    for (const id of ['magnitude-2d', 'jump-to-3d']) {
      const step = getLesson('M1').steps.find((candidate) => candidate.id === id);
      expect(magnitude(step.initialLabState.v), id).toBeCloseTo(step.answer.value, 9);
    }
  });

  it('evaluates construction goals against the live lab state', () => {
    const steps = getLesson('M1').steps;
    const signs = steps.find((candidate) => candidate.id === 'negative-components');
    expect(isGoalMet(signs, { v: { x: -1, y: 2, z: -3 } })).toBe(true);
    expect(isGoalMet(signs, { v: { x: -1, y: 0, z: -3 } })).toBe(false);
    const aim = steps.find((candidate) => candidate.id === 'aim-the-sum');
    const a = aim.initialLabState.v;
    const b = { x: 1, y: -2, z: -2 };
    expect(isGoalMet(aim, { sum: { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z } })).toBe(true);
    expect(isGoalMet(aim, { sum: { x: 0, y: 0, z: 0 } })).toBe(false);
    expect(isGoalMet(aim, { sum: { x: 3, y: 1, z: 0 } })).toBe(false);
  });

  it('keeps M1 in 2D before the jump and in 3D after it', () => {
    const dimensions = getLesson('M1').steps.map((step) => step.dimension);
    const jump = getLesson('M1').steps.findIndex((step) => step.controls?.includes('dimension'));
    expect(jump).toBeGreaterThan(0);
    expect(dimensions.slice(0, jump + 1).every((dimension) => dimension === 2)).toBe(true);
    expect(dimensions.slice(jump + 1).every((dimension) => dimension === 3)).toBe(true);
  });
});

describe('B7 Anderson lesson', () => {
  const steps = getLesson('B7').steps;
  const step = (id) => steps.find((candidate) => candidate.id === id);

  it('starts every lab step in a known regime with a friction coefficient', () => {
    for (const candidate of steps) {
      expect(Object.keys(ANDERSON_REGIMES), candidate.id).toContain(candidate.initialLabState.regime);
      expect(candidate.initialLabState.mu, candidate.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('accepts the normal-fault dip that the domain predicts for the step’s μ', () => {
    const normal = step('normal-regime');
    const { dip } = andersonFaults('normal', normal.initialLabState.mu);
    expect(checkNumericAnswer(normal, dip.toFixed(1)).correct).toBe(true);
    expect(checkNumericAnswer(normal, '60').correct).toBe(true);
    expect(checkNumericAnswer(normal, '29.5').feedback).toMatch(/β/);
    expect(checkNumericAnswer(normal, '45').correct).toBe(false);
  });

  it('opens each single-regime step in the regime it teaches', () => {
    expect(step('normal-regime').initialLabState.regime).toBe('normal');
    expect(step('thrust-regime').initialLabState.regime).toBe('thrust');
    expect(step('strike-slip-regime').initialLabState.regime).toBe('strike-slip');
    // The field-inference step shows thrusts with the stress axes hidden until the answer.
    expect(step('infer-regime').initialLabState.regime).toBe('thrust');
    expect(step('infer-regime').labOptions.axesAfterAnswer).toBe(true);
  });

  it('matches the strike-slip prompt to the domain: the fault clockwise of σ1 is at about 030°', () => {
    const { faults } = andersonFaults('strike-slip', step('strike-slip-regime').initialLabState.mu);
    expect(Math.round(faults[0].strike / 10) * 10).toBe(30);
  });

  it('hides scene objects only in steps that ask for a prediction', () => {
    for (const candidate of steps.filter(({ labOptions }) => labOptions.faultsAfterAnswer || labOptions.axesAfterAnswer)) {
      expect(hasPrediction(candidate), candidate.id).toBe(true);
    }
  });

  it('offers one tectonic setting per regime in the final step', () => {
    const settings = step('tectonic-settings').settings;
    expect(settings.map((setting) => setting.regime).sort()).toEqual(Object.keys(ANDERSON_REGIMES).sort());
    expect(step('tectonic-settings').final).toBe(true);
  });
});

describe('M2 trigonometry lesson', () => {
  const steps = getLesson('M2').steps;
  const step = (id) => steps.find((candidate) => candidate.id === id);

  it('matches each numeric answer to the vector the step starts with', () => {
    const polar = step('length-and-angle');
    expect(polar.initialLabState.v.x).toBeCloseTo(polar.answer.value, 2);
    expect(checkNumericAnswer(polar, '4.33').correct).toBe(true);
    expect(checkNumericAnswer(polar, '0.77').feedback).toMatch(/radians/);
    const inverse = step('angle-from-components');
    expect(polarAngle(inverse.initialLabState.v)).toBeCloseTo(inverse.answer.value, 9);
    expect(checkNumericAnswer(inverse, '-45').feedback).toMatch(/180/);
  });

  it('makes the rotation prediction agree with the rotation equations', () => {
    const rotate = step('rotate-axes');
    const { v } = rotate.initialLabState;
    const larger = rotate2D(v, 30).x > v.x;
    expect(rotate.choices.find((choice) => choice.correct).id).toBe(larger ? 'larger' : 'smaller');
  });

  it('checks the alignment goal with the primed components', () => {
    const same = step('same-arrow');
    const { v } = same.initialLabState;
    expect(isGoalMet(same, { primed: rotate2D(v, polarAngle(v)) })).toBe(true);
    expect(isGoalMet(same, { primed: rotate2D(v, polarAngle(v) + 180) })).toBe(false);
    expect(isGoalMet(same, { primed: rotate2D(v, 0) })).toBe(false);
  });

  it('starts in 2D and jumps to 3D for direction angles and for turning the axes', () => {
    expect(step('unit-circle').dimension).toBe(2);
    expect(step('direction-angles-3d').dimension).toBe(3);
    expect(step('rotate-axes').dimension).toBe(2);
    expect(step('same-arrow').dimension).toBe(3);
  });

  it('keeps the unit-circle vector at length 1', () => {
    expect(magnitude(step('unit-circle').initialLabState.v)).toBeCloseTo(1, 12);
    expect(step('unit-circle').labOptions.fixedLength).toBe(1);
  });
});

describe('B6 friction lesson', () => {
  const steps = getLesson('B6').steps;
  const step = (id) => steps.find((candidate) => candidate.id === id);
  // The teaching stress state used by main.js (FRICTION_LAB): σ3 = 30 MPa, σ2 halfway, normal regime.
  const axes = andersonAxes('normal', 0);
  const axisVectors = Object.fromEntries(Object.entries(axes).map(([key, axis]) => [key, lineVector(axis.trend, axis.plunge)]));
  const tensorFor = (sigma1) => principalStressTensor(axes, principalMagnitudes(sigma1, 30));
  const checkPlane = (strike, dip, sigma1, pf = 0) => frictionCheck(tensorFor(sigma1), planePole(planeFromStrike(strike, dip)), pf);
  const reactivation = (strike, dip, pf = 0) => reactivationSigma1(principalCosines(planePole(planeFromStrike(strike, dip)), axisVectors), { sigma3: 30, pf });
  const intact = { cohesion: 20, mu: 0.85 };

  it('accepts Byerlee’s τ at σn = 50 MPa and explains the intact-rock mistake', () => {
    const byerlee = step('byerlee');
    expect(checkNumericAnswer(byerlee, '42.5').correct).toBe(true);
    expect(checkNumericAnswer(byerlee, '62.5').feedback).toMatch(/intact/);
  });

  it('puts planes that contain σ2 on the big circle (step 3’s answer)', () => {
    const { sigmaN, tau } = checkPlane(0, 40, 150);
    expect(Math.hypot(sigmaN - 90, tau)).toBeCloseTo(60, 9);
    // The step starts off the big circle and below the friction line.
    const start = step('every-plane-a-point').initialLabState;
    const initial = checkPlane(start.strike, start.dip, start.sigma1);
    expect(Math.hypot(initial.sigmaN - 90, initial.tau)).toBeLessThan(59);
  });

  it('starts the slip-tendency step on a plane that holds, and can reach the goal', () => {
    const slip = step('slip-tendency');
    const start = slip.initialLabState;
    expect(checkPlane(start.strike, start.dip, start.sigma1).slips).toBe(false);
    expect(isGoalMet(slip, { slips: checkPlane(0, 65, start.sigma1).slips })).toBe(true);
    expect(checkNumericAnswer(slip, '0.75').correct).toBe(true);
    expect(checkNumericAnswer(slip, '1.33').feedback).toMatch(/upside down/);
  });

  it('matches the numbers in the reactivation feedback', () => {
    const start = step('old-or-new').initialLabState;
    expect(start.dip).toBe(45);
    expect(reactivation(start.strike, 45)).toBeCloseTo(370, 0);
    expect(newFaultSigma1(30, intact)).toBeCloseTo(227, 0);
    expect(reactivation(0, 65)).toBeCloseTo(140, 0);
    expect(reactivation(0, 30)).toBe(Infinity);
    expect(step('old-or-new').choices.find((choice) => choice.correct).id).toBe('new-fault');
  });

  it('ranks the mapped faults as the feedback says, with none slipping dry', () => {
    const ranking = step('rank-faults');
    const sigma1 = ranking.initialLabState.sigma1;
    const ts = Object.fromEntries(ranking.mappedFaults.map((fault) => [fault.id, checkPlane(fault.strike, fault.dip, sigma1).ts]));
    expect(ts.A).toBeCloseTo(0.8, 2);
    expect(ts.C).toBeCloseTo(0.41, 2);
    expect(ts.B).toBeCloseTo(0.23, 2);
    expect(Math.max(...Object.values(ts))).toBeLessThan(0.85);
    expect(ranking.choices.find((choice) => choice.correct).id).toBe('A');
  });

  it('makes fault A slip once Pf reaches about 3 MPa, without changing τ', () => {
    const fluid = step('fluid-pressure');
    const { strike, dip, sigma1 } = fluid.initialLabState;
    expect(checkPlane(strike, dip, sigma1, 2.5).slips).toBe(false);
    expect(checkPlane(strike, dip, sigma1, 3).slips).toBe(true);
    expect(checkPlane(strike, dip, sigma1, 10).tau).toBeCloseTo(checkPlane(strike, dip, sigma1, 0).tau, 12);
    expect(fluid.final).toBe(true);
  });

  it('uses the stereonet only in the map steps', () => {
    const withNet = steps.filter((candidate) => candidate.labOptions.showStereonet).map((candidate) => candidate.id);
    expect(withNet).toEqual(['slip-tendency-map', 'rank-faults', 'fluid-pressure']);
  });
});
