import { Flashcard } from '../types';

// Simplified SuperMemo-2 Algorithm
export const calculateNextReview = (card: Flashcard, quality: number): Flashcard => {
  let { repetition, interval, easiness } = card;

  // quality: 0 (Again), 1 (Hard), 2 (Good), 3 (Easy)
  if (quality === 0) {
    repetition = 0;
    interval = 1;
  } else {
    if (quality === 1) {
      easiness = Math.max(1.3, easiness - 0.15);
    } else if (quality === 3) {
      easiness += 0.15;
    }

    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
      if (quality === 1) {
        interval = Math.max(1, Math.round(interval * 1.2)); // Hard gives a small boost but less than Good
      } else if (quality === 3) {
        interval = Math.round(interval * 1.3); // Easy gives a bigger boost
      }
    }
    repetition += 1;
  }

  // Add some randomness to prevent clumping (fuzzing)
  const fuzz = Math.random() * 0.1 - 0.05; // +/- 5%
  interval = Math.max(1, Math.round(interval * (1 + fuzz)));

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { ...card, repetition, interval, easiness, nextReviewDate };
};

export const createInitialCard = (word: Omit<Flashcard, 'repetition' | 'interval' | 'easiness' | 'nextReviewDate'>): Flashcard => {
  return {
    ...word,
    level: word.level || 1,
    repetition: 0,
    interval: 0,
    easiness: 2.5,
    nextReviewDate: Date.now(), // Due immediately
  };
};
