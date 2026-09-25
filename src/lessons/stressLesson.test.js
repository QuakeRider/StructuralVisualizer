import { describe, expect, it } from 'vitest';
import { STRESS_STATES } from '../domain/stressStates.js';
import { STRESS_LESSON, getLessonStep, isLessonChoiceCorrect } from './stressLesson.js';

describe('guided stress lesson', () => {
  it('contains a coherent force-to-stress sequence', () => {
    expect(STRESS_LESSON.steps).toHaveLength(14);
    expect(STRESS_LESSON.steps[0].id).toBe('construct-force-vector');
    expect(STRESS_LESSON.steps[6].id).toBe('reveal-internal-cut');
    expect(STRESS_LESSON.steps[10].id).toBe('why-stress-needs-a-tensor');
    expect(STRESS_LESSON.steps.at(-1).final).toBe(true);
  });

  it('uses the 3D force lab before transitioning to the stress-state scene', () => {
    expect(STRESS_LESSON.steps.slice(0, 10).every((step) => step.visualKind === 'force-lab')).toBe(true);
    expect(STRESS_LESSON.steps.slice(10).every((step) => step.visualKind === 'stress-state')).toBe(true);
    expect(STRESS_LESSON.steps[3].controls).toContain('constraint');
    expect(STRESS_LESSON.steps[6].controls).toContain('cut');
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
    expect(isLessonChoiceCorrect(STRESS_LESSON.steps[8], 'point-five')).toBe(true);
  });
});
