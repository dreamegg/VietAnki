import { Flashcard } from '../types';
import { LevelDialog } from '../types';
import { getDefaultCards } from './defaultData';

const STORAGE_KEY = 'vietnamese_anki_cards';
const LEVEL_KEY = 'vietnamese_anki_level';
const LEVEL_DIALOG_KEY = 'vietnamese_anki_level_dialogs';

const API_BASE = import.meta.env.VITE_STORAGE_API_BASE || '/api/storage';

const sanitizeCard = (card: any): Flashcard => ({
  id: String(card?.id || `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
  word: String(card?.word || ''),
  meaning: String(card?.meaning || ''),
  hanja: String(card?.hanja || ''),
  example: String(card?.example || ''),
  translation: String(card?.translation || ''),
  level: Number.isFinite(card?.level) && card.level >= 1 ? card.level : 1,
  repetition: Number.isFinite(card?.repetition) && card.repetition >= 0 ? card.repetition : 0,
  interval: Number.isFinite(card?.interval) && card.interval >= 0 ? card.interval : 0,
  easiness: Number.isFinite(card?.easiness) && card.easiness > 0 ? card.easiness : 2.5,
  nextReviewDate: Number.isFinite(card?.nextReviewDate) && card.nextReviewDate > 0 ? card.nextReviewDate : Date.now(),
});

const normalizeDialog = (dialog: any): LevelDialog => ({
  level: Number.isFinite(dialog?.level) ? dialog.level : 1,
  title: String(dialog?.title || '레벨 학습 대화'),
  setting: String(dialog?.setting || ''),
  explanation: String(dialog?.explanation || ''),
  lines: Array.isArray(dialog?.lines)
    ? dialog.lines
        .filter((line: any) => line && typeof line === 'object')
        .map((line: any) => ({
          speaker: line.speaker === 'A' || line.speaker === 'B' || line.speaker === 'T' ? line.speaker : 'A',
          vietnamese: String(line.vietnamese || ''),
          korean: String(line.korean || ''),
        }))
    : [],
  usedWords: Array.isArray(dialog?.usedWords)
    ? dialog.usedWords.map((word: string) => String(word || '')).filter(Boolean)
    : [],
  createdAt: Number.isFinite(dialog?.createdAt) ? dialog.createdAt : Date.now(),
});

let cardsCache: Flashcard[] = [];
let levelDialogsCache: Record<string, LevelDialog[]> = {};
let initialized = false;
let initializing: Promise<void> | null = null;
let serverAvailable = true;

const readCardsFromLocal = (): Flashcard[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((card: any) => card && typeof card === 'object')
      .map(sanitizeCard);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const readDialogsFromLocal = (): Record<string, LevelDialog[]> => {
  const data = localStorage.getItem(LEVEL_DIALOG_KEY);
  if (!data) return {};

  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized: Record<string, LevelDialog[]> = {};
    for (const [level, list] of Object.entries(parsed)) {
      if (Array.isArray(list)) {
        normalized[level] = (list as any[]).map(normalizeDialog);
      }
    }
    return normalized;
  } catch {
    localStorage.removeItem(LEVEL_DIALOG_KEY);
    return {};
  }
};

const writeCardsToLocal = (cards: Flashcard[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
};

const writeDialogsToLocal = (dialogs: Record<string, LevelDialog[]>) => {
  localStorage.setItem(LEVEL_DIALOG_KEY, JSON.stringify(dialogs));
};

const request = async (path: string, options: RequestInit = {}) => {
  if (!serverAvailable) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!res.ok) {
      if (res.status >= 500) {
        serverAvailable = false;
      }
      return null;
    }

    return res;
  } catch {
    serverAvailable = false;
    return null;
  }
};

const loadFromServer = async () => {
  const res = await request('/state');
  if (!res) {
    return;
  }

  const payload = await res.json();

  if (Array.isArray(payload?.cards)) {
    const serverCards = payload.cards.map(sanitizeCard);
    cardsCache = serverCards;
    writeCardsToLocal(serverCards);
  }

  if (payload?.levelDialogs && typeof payload.levelDialogs === 'object') {
    const normalized: Record<string, LevelDialog[]> = {};
    for (const [level, list] of Object.entries(payload.levelDialogs)) {
      if (Array.isArray(list)) {
        normalized[level] = (list as any[]).map(normalizeDialog);
      }
    }
    levelDialogsCache = normalized;
    writeDialogsToLocal(normalized);
  }
};

const ensureInitialized = async () => {
  if (initialized) return;

  if (!initializing) {
    initializing = (async () => {
      cardsCache = readCardsFromLocal();
      levelDialogsCache = readDialogsFromLocal();

      if (cardsCache.length === 0 && Object.keys(levelDialogsCache).length === 0) {
        const defaults = getDefaultCards();
        cardsCache = defaults;
        writeCardsToLocal(defaults);
      }

      await loadFromServer();

      if (cardsCache.length === 0) {
        const defaults = getDefaultCards();
        cardsCache = defaults;
        writeCardsToLocal(defaults);
        await request('/cards/bulk', {
          method: 'POST',
          body: JSON.stringify({ cards: defaults }),
        });
      }

      initialized = true;
    })();
  }

  await initializing;
};

export const getSelectedLevel = (): number | 'all' => {
  const data = localStorage.getItem(LEVEL_KEY);
  if (!data) return 'all';
  if (data === 'all') return 'all';
  const level = parseInt(data, 10);
  return Number.isNaN(level) ? 'all' : level;
};

export const setSelectedLevel = (level: number | 'all') => {
  localStorage.setItem(LEVEL_KEY, level.toString());
};

export const getCards = async (): Promise<Flashcard[]> => {
  await ensureInitialized();
  return cardsCache.map(card => ({ ...card }));
};

export const saveCards = async (cards: Flashcard[]) => {
  const sanitized = cards.map(sanitizeCard);
  cardsCache = sanitized;
  writeCardsToLocal(sanitized);

  await request('/cards/bulk', {
    method: 'POST',
    body: JSON.stringify({ cards: sanitized, overwrite: true }),
  });
};

export const updateCard = async (updatedCard: Flashcard) => {
  await ensureInitialized();

  const cards = cardsCache;
  const index = cards.findIndex(c => c.id === updatedCard.id);
  if (index !== -1) {
    const next = [...cards];
    next[index] = sanitizeCard(updatedCard);
    cardsCache = next;
    writeCardsToLocal(next);

    await request(`/cards/${encodeURIComponent(updatedCard.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(next[index]),
    });
  }
};

export const addCards = async (newCards: Flashcard[]) => {
  await ensureInitialized();

  const existingCards = cardsCache;
  const existingIds = new Set(existingCards.map(c => c.id));
  const existingWords = new Set(existingCards.map(c => `${c.word.trim().toLowerCase()}|${c.meaning.trim().toLowerCase()}`));

  const cardsToAdd = newCards
    .map(sanitizeCard)
    .filter(c => {
      const key = `${c.word.trim().toLowerCase()}|${c.meaning.trim().toLowerCase()}`;
      if (existingIds.has(c.id)) return false;
      if (existingWords.has(key)) return false;
      existingIds.add(c.id);
      existingWords.add(key);
      return true;
    });

  if (cardsToAdd.length > 0) {
    cardsCache = [...existingCards, ...cardsToAdd];
    writeCardsToLocal(cardsCache);

    await request('/cards/bulk', {
      method: 'POST',
      body: JSON.stringify({ cards: cardsToAdd }),
    });
  }

  return cardsToAdd;
};

export const clearAllCards = async () => {
  cardsCache = [];
  writeCardsToLocal([]);
  await request('/cards', {
    method: 'DELETE',
  });
};

export const getDueCards = async (): Promise<Flashcard[]> => {
  const cards = await getCards();
  const selectedLevel = getSelectedLevel();
  const filteredCards = selectedLevel === 'all' ? cards : cards.filter(c => c.level === selectedLevel);

  const now = Date.now();
  return filteredCards.filter(c => c.nextReviewDate <= now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
};

export const getStudyBatch = async (limit = 10): Promise<Flashcard[]> => {
  const cards = await getCards();
  const selectedLevel = getSelectedLevel();
  const filteredCards = selectedLevel === 'all' ? cards : cards.filter(c => c.level === selectedLevel);

  if (filteredCards.length === 0) return [];

  const now = Date.now();

  let batch = filteredCards.filter(c => c.nextReviewDate <= now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);

  if (batch.length < limit) {
    const newCards = filteredCards.filter(c => c.repetition === 0 && c.nextReviewDate > now);
    batch = [...batch, ...newCards];
  }

  if (batch.length < limit) {
    const reviewCards = filteredCards.filter(c => c.repetition > 0 && c.nextReviewDate > now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    const existingIds = new Set(batch.map(c => c.id));
    const uniqueReviewCards = reviewCards.filter(c => !existingIds.has(c.id));
    batch = [...batch, ...uniqueReviewCards];
  }

  return batch.slice(0, limit);
};

export const getStats = async () => {
  const cards = await getCards();
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
    graduated,
  };
};

export const getLevelDialogs = async (level?: number): Promise<LevelDialog[]> => {
  await ensureInitialized();
  const dialogs = levelDialogsCache;

  const source = level ? dialogs[String(level)] || [] : Object.values(dialogs).flat();
  return (Array.isArray(source) ? source : []).map(normalizeDialog);
};

export const saveLevelDialog = async (dialog: LevelDialog): Promise<LevelDialog> => {
  await ensureInitialized();

  const normalized = normalizeDialog(dialog);
  const key = String(normalized.level);
  const list = Array.isArray(levelDialogsCache[key]) ? [...levelDialogsCache[key]] : [];
  const next = [...list, normalized].slice(-20);
  levelDialogsCache[key] = next;

  writeDialogsToLocal({
    ...levelDialogsCache,
    [key]: next,
  });

  await request('/dialogs', {
    method: 'POST',
    body: JSON.stringify(normalized),
  });

  return normalized;
};
