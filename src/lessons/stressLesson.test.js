import { describe, expect, it } from 'vitest';
import { STRESS_STATES } from '../domain/stressStates.js';
import { STRESS_LESSON, getLessonStep, isLessonChoiceCorrect } from './stressLesson.js';

describe('guided stress lesson', () => {
  it('contains a coherent seven-step sequence', () => {
    expect(STRESS_LESSON.steps).toHaveLength(7);
    expect(STRESS_LESSON.steps[0].id).toBe('orient-the-block');
    expect(STRESS_LESSON.steps.at(-1).final).toBe(true);
  });

  it('references only existing stress-state presets', () => {
    const presetIds = new Set(STRESS_STATES.map((preset) => preset.id));
    for (const step of STRESS_LESSON.steps) {
      expect(presetIds.has(step.presetId)).toBe(true);
    }
  });

  it('gives every prediction prompt exactly one correct answer', () => {
    for (const step of STRESS_LESSON.steps.filter((candidate) => candidate.choices)) {
      expect(step.choices.filter((choice) => choice.correct)).toHaveLength(1);
    }
  });

  it('clamps step lookup and evaluates answers', () => {
    expect(getLessonStep(-10)).toBe(STRESS_LESSON.steps[0]);
    expect(getLessonStep(500)).toBe(STRESS_LESSON.steps.at(-1));
    expect(isLessonChoiceCorrect(STRESS_LESSON.steps[2], 'extend')).toBe(true);
  });
});
