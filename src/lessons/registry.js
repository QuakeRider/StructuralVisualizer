import { LESSON_CATALOG, UNITS } from './catalog.js';
import m1 from './unit-0-math/m1-vectors.js';
import m2 from './unit-0-math/m2-trigonometry.js';
import s2 from './unit-2-stress/s2-force-vs-traction.js';
import s3 from './unit-2-stress/s3-normal-shear.js';
import s7 from './unit-2-stress/s7-stress-tensor-3d.js';
import s10 from './unit-2-stress/s10-stress-states.js';
import b6 from './unit-3-brittle/b6-friction.js';
import b7 from './unit-3-brittle/b7-anderson.js';

/** Lesson content by id. Add each newly built lesson here. */
const LESSON_CONTENT = new Map([m1, m2, s2, s3, s7, s10, b6, b7].map((lesson) => [lesson.id, lesson]));

export const LESSON_STATUSES = Object.freeze(['planned', 'seed', 'built']);

export { UNITS };

export const LESSONS = LESSON_CATALOG.map((entry) => {
  const content = LESSON_CONTENT.get(entry.id);
  return {
    ...entry,
    status: content?.status ?? 'planned',
    steps: content?.steps ?? [],
  };
});

export function getLesson(id) {
  return LESSONS.find((lesson) => lesson.id === id) ?? null;
}

export function isLessonAvailable(lesson) {
  return lesson.status !== 'planned' && lesson.steps.length > 0;
}

export function getAvailableLessons() {
  return LESSONS.filter(isLessonAvailable);
}

export function getNextAvailableLesson(id) {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return LESSONS.slice(index + 1).find(isLessonAvailable) ?? null;
}

export function getLessonStep(lesson, index) {
  return lesson.steps[Math.min(Math.max(index, 0), lesson.steps.length - 1)];
}

export function isLessonChoiceCorrect(step, choiceId) {
  return step.choices?.find((choice) => choice.id === choiceId)?.correct ?? false;
}

/** A step asks for a prediction if it has multiple-choice options or a numeric answer. */
export function hasPrediction(step) {
  return Boolean(step.choices?.length || step.answer);
}

/** Parse a typed number, accepting a true minus sign and a leading plus. Returns null if it is not a number. */
export function parseNumericInput(raw) {
  const text = String(raw ?? '').trim().replace(/−/g, '-').replace(/^\+/, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return null;
  return Number(text);
}

/**
 * Check a numeric answer against step.answer = { value, tolerance, correctFeedback,
 * wrong: [{ value, feedback, tolerance? }], fallbackFeedback }. Known wrong answers
 * get targeted feedback (they encode common misconceptions).
 */
export function checkNumericAnswer(step, raw) {
  const { answer } = step;
  const value = parseNumericInput(raw);
  if (value === null) return { correct: false, value: null, feedback: 'Type a number, for example 2.5 or −4.' };
  const near = (target, tolerance = answer.tolerance) => Math.abs(value - target) <= tolerance;
  if (near(answer.value)) return { correct: true, value, feedback: answer.correctFeedback };
  const known = answer.wrong?.find((wrong) => near(wrong.value, wrong.tolerance));
  return { correct: false, value, feedback: known?.feedback ?? answer.fallbackFeedback };
}

/** Whether the live lab state satisfies the step's goal (a construction task). */
export function isGoalMet(step, labState) {
  return Boolean(step.goal?.check(labState));
}
