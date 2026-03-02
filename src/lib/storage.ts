import { Flashcard } from '../types';
import { getDefaultCards } from './defaultData';

const STORAGE_KEY = 'vietnamese_anki_cards';
const LEVEL_KEY = 'vietnamese_anki_level';

export const getSelectedLevel = (): number | 'all' => {
  const data = localStorage.getItem(LEVEL_KEY);
  return data ? (data === 'all' ? 'all' : parseInt(data, 10)) : 'all';
};

export const setSelectedLevel = (level: number | 'all') => {
  localStorage.setItem(LEVEL_KEY, level.toString());
};

export const getCards = (): Flashcard[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const defaultCards = getDefaultCards();
    saveCards(defaultCards);
    return defaultCards;
  }
  const parsed = JSON.parse(data);
  // Migrate old cards to have a level if missing
  return parsed.map((c: any) => ({ ...c, level: c.level || 1 }));
};

export const saveCards = (cards: Flashcard[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
};

export const updateCard = (updatedCard: Flashcard) => {
  const cards = getCards();
  const index = cards.findIndex(c => c.id === updatedCard.id);
  if (index !== -1) {
    cards[index] = updatedCard;
    saveCards(cards);
  }
};

export const addCards = (newCards: Flashcard[]) => {
  const existingCards = getCards();
  const existingIds = new Set(existingCards.map(c => c.id));
  
  const cardsToAdd = newCards.filter(c => !existingIds.has(c.id));
  saveCards([...existingCards, ...cardsToAdd]);
  
  return cardsToAdd.length;
};

export const clearAllCards = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getDueCards = (): Flashcard[] => {
  const cards = getCards();
  const selectedLevel = getSelectedLevel();
  const filteredCards = selectedLevel === 'all' ? cards : cards.filter(c => c.level === selectedLevel);
  
  const now = Date.now();
  return filteredCards.filter(c => c.nextReviewDate <= now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
};

export const getStudyBatch = (limit = 10): Flashcard[] => {
  const cards = getCards();
  const selectedLevel = getSelectedLevel();
  const filteredCards = selectedLevel === 'all' ? cards : cards.filter(c => c.level === selectedLevel);
  
  if (filteredCards.length === 0) return [];
  
  const now = Date.now();
  
  // 1. Due cards
  let batch = filteredCards.filter(c => c.nextReviewDate <= now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
  
  // 2. New cards
  if (batch.length < limit) {
    const newCards = filteredCards.filter(c => c.repetition === 0 && c.nextReviewDate > now);
    batch = [...batch, ...newCards];
  }
  
  // 3. Oldest review cards (if still need more to fill batch)
  if (batch.length < limit) {
    const reviewCards = filteredCards.filter(c => c.repetition > 0 && c.nextReviewDate > now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    const existingIds = new Set(batch.map(c => c.id));
    const uniqueReviewCards = reviewCards.filter(c => !existingIds.has(c.id));
    batch = [...batch, ...uniqueReviewCards];
  }
  
  return batch.slice(0, limit);
};

export const getStats = () => {
  const cards = getCards();
  const selectedLevel = getSelectedLevel();
  const filteredCards = selectedLevel === 'all' ? cards : cards.filter(c => c.level === selectedLevel);
  
  const now = Date.now();
  const due = filteredCards.filter(c => c.nextReviewDate <= now).length;
  const newCards = filteredCards.filter(c => c.repetition === 0).length;
  const learning = filteredCards.filter(c => c.repetition > 0 && c.interval < 21).length;
  const graduated = filteredCards.filter(c => c.interval >= 21).length;

  return {
    total: filteredCards.length,
    due,
    newCards,
    learning,
    graduated
  };
};
