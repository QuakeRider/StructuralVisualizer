import { describe, expect, it } from 'vitest';
import { STRESS_STATES } from '../domain/stressStates.js';
import { FORCE_LAB_SCENE_REFS } from '../visualization/sceneRefs.js';
import {
  LESSONS,
  LESSON_STATUSES,
  UNITS,
  getAvailableLessons,
  getLesson,
  getLessonStep,
  getNextAvailableLesson,
  isLessonChoiceCorrect,
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
    for (const { step } of allSteps) expect(presetIds.has(step.presetId)).toBe(true);
  });

  it('gives every prediction prompt exactly one correct answer', () => {
    for (const { step } of allSteps.filter(({ step: candidate }) => candidate.choices)) {
      expect(step.prompt).toBeTruthy();
      expect(step.choices.filter((choice) => choice.correct)).toHaveLength(1);
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
        for (const ref of refsInHtml) expect(FORCE_LAB_SCENE_REFS, where).toContain(ref);
        for (const symbol of equation.symbols) {
          expect(FORCE_LAB_SCENE_REFS, where).toContain(symbol.sceneRef);
          expect(symbol.description, where).toBeTruthy();
        }
      }
    }
  });

  it('gives every force-lab step at least one bound equation', () => {
    for (const { lesson, step } of allSteps.filter(({ step: candidate }) => candidate.visualKind === 'force-lab')) {
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
