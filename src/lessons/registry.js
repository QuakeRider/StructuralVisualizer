import { LESSON_CATALOG, UNITS } from './catalog.js';
import m1 from './unit-0-math/m1-vectors.js';
import s2 from './unit-2-stress/s2-force-vs-traction.js';
import s3 from './unit-2-stress/s3-normal-shear.js';
import s7 from './unit-2-stress/s7-stress-tensor-3d.js';
import s10 from './unit-2-stress/s10-stress-states.js';

/** Lesson content by id. Add each newly built lesson here. */
const LESSON_CONTENT = new Map([m1, s2, s3, s7, s10].map((lesson) => [lesson.id, lesson]));

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
