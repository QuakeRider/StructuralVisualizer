import { describe, expect, it } from 'vitest';
import { STRESS_STATES } from '../domain/stressStates.js';
import { magnitude } from '../domain/vector.js';
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
  it('starts the curriculum at M1 and seeds the Build 00 lessons', () => {
    expect(getAvailableLessons().map((lesson) => lesson.id)).toEqual(['M1', 'S2', 'S3', 'S7', 'S10']);
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
    for (const { lesson, step } of allSteps.filter(({ step: candidate }) => ['force-lab', 'vector-lab'].includes(candidate.visualKind))) {
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
    expect(getNextAvailableLesson('M1').id).toBe('S2');
    expect(getNextAvailableLesson('S3').id).toBe('S7');
    expect(getNextAvailableLesson('S10')).toBeNull();
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
