import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

interface FlashcardPayload {
  id: string;
  word: string;
  meaning: string;
  hanja?: string;
  example?: string;
  translation?: string;
  level?: number;
  repetition?: number;
  interval?: number;
  easiness?: number;
  nextReviewDate?: number;
}

interface LevelDialogPayload {
  level: number;
  title: string;
  setting: string;
  explanation: string;
  lines: Array<{
    speaker: 'A' | 'B' | 'T';
    vietnamese: string;
    korean: string;
  }>;
  usedWords: string[];
  createdAt: number;
}

interface FlashcardRow {
  id: string;
  word: string;
  meaning: string;
  hanja: string;
  example: string;
  translation: string;
  level: number;
  repetition: number;
  interval: number;
  easiness: number;
  nextReviewDate: number;
}

interface LevelDialogRow {
  level: number;
  title: string;
  setting: string;
  explanation: string;
  lines: string;
  used_words: string;
  createdAt: number;
}

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT || 4000);
const dbDir = process.env.VIETANIKI_DB_DIR || path.join(process.cwd(), 'server-data');
const dbPath = process.env.VIETANIKI_DB_PATH || path.join(dbDir, 'vietanki.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    hanja TEXT NOT NULL DEFAULT '',
    example TEXT NOT NULL DEFAULT '',
    translation TEXT NOT NULL DEFAULT '',
    level INTEGER NOT NULL DEFAULT 1,
    repetition INTEGER NOT NULL DEFAULT 0,
    interval INTEGER NOT NULL DEFAULT 0,
    easiness REAL NOT NULL DEFAULT 2.5,
    next_review_date INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    normalized_key TEXT NOT NULL,
    UNIQUE(normalized_key)
  );

  CREATE TABLE IF NOT EXISTS level_dialogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level INTEGER NOT NULL,
    title TEXT NOT NULL,
    setting TEXT NOT NULL,
    explanation TEXT NOT NULL,
    lines TEXT NOT NULL,
    used_words TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

const normalizeText = (value: unknown): string => String(value ?? '').trim();

const sanitizeCard = (raw: any) => {
  const id = normalizeText(raw?.id) || `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const card = {
    id,
    word: normalizeText(raw?.word),
    meaning: normalizeText(raw?.meaning),
    hanja: normalizeText(raw?.hanja),
    example: normalizeText(raw?.example),
    translation: normalizeText(raw?.translation),
    level: Number.isFinite(raw?.level) && raw.level >= 1 ? Number(raw.level) : 1,
    repetition: Number.isFinite(raw?.repetition) && raw.repetition >= 0 ? Number(raw.repetition) : 0,
    interval: Number.isFinite(raw?.interval) && raw.interval >= 0 ? Number(raw.interval) : 0,
    easiness: Number.isFinite(raw?.easiness) && raw.easiness > 0 ? Number(raw.easiness) : 2.5,
    nextReviewDate: Number.isFinite(raw?.nextReviewDate) && raw.nextReviewDate > 0 ? Number(raw.nextReviewDate) : Date.now(),
  };

  return {
    ...card,
    normalizedKey: `${card.word.toLowerCase()}|${card.meaning.toLowerCase()}`,
  };
};

const sanitizeDialog = (raw: any): LevelDialogPayload => {
  const lines = Array.isArray(raw?.lines) ? raw.lines : [];

  return {
    level: Number.isFinite(raw?.level) && raw.level >= 1 ? Number(raw.level) : 1,
    title: normalizeText(raw?.title || '레벨 학습 대화'),
    setting: normalizeText(raw?.setting),
    explanation: normalizeText(raw?.explanation),
    lines: lines
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        speaker: item.speaker === 'A' || item.speaker === 'B' || item.speaker === 'T' ? item.speaker : 'A',
        vietnamese: normalizeText(item.vietnamese),
        korean: normalizeText(item.korean),
      })),
    usedWords: Array.isArray(raw?.usedWords)
      ? raw.usedWords.map((word: any) => normalizeText(word)).filter(Boolean)
      : [],
    createdAt: Number.isFinite(raw?.createdAt) ? Number(raw.createdAt) : Date.now(),
  };
};

const insertCard = db.prepare(`
  INSERT INTO flashcards (id, word, meaning, hanja, example, translation, level, repetition, interval, easiness, next_review_date, normalized_key)
  VALUES (@id, @word, @meaning, @hanja, @example, @translation, @level, @repetition, @interval, @easiness, @nextReviewDate, @normalizedKey)
`);

const updateCard = db.prepare(`
  UPDATE flashcards
  SET word = @word,
      meaning = @meaning,
      hanja = @hanja,
      example = @example,
      translation = @translation,
      level = @level,
      repetition = @repetition,
      interval = @interval,
      easiness = @easiness,
      next_review_date = @nextReviewDate,
      normalized_key = @normalizedKey
  WHERE id = @id
`);

const findCardById = db.prepare('SELECT id FROM flashcards WHERE id = ?');
const findCardByKey = db.prepare('SELECT id FROM flashcards WHERE normalized_key = ?');
const listCards = db.prepare(`
  SELECT
    id,
    word,
    meaning,
    hanja,
    example,
    translation,
    level,
    repetition,
    interval,
    easiness,
    next_review_date as nextReviewDate
  FROM flashcards
  ORDER BY next_review_date ASC
`);

const allDialogsByLevel = db.prepare(`
  SELECT level, title, setting, explanation, lines, used_words, created_at as createdAt
  FROM level_dialogs
  ORDER BY created_at DESC
`);

const insertDialog = db.prepare(`
  INSERT INTO level_dialogs (level, title, setting, explanation, lines, used_words, created_at)
  VALUES (@level, @title, @setting, @explanation, @lines, @usedWords, @createdAt)
`);

const pruneDialogsByLevel = db.prepare(`
  DELETE FROM level_dialogs
  WHERE level = @level AND id NOT IN (
    SELECT id
    FROM level_dialogs
    WHERE level = @level
    ORDER BY created_at DESC
    LIMIT 20
  )
`);

const clearCards = db.prepare('DELETE FROM flashcards');

const upsertCard = (card: ReturnType<typeof sanitizeCard>) => {
  const existingById = findCardById.get(card.id);
  if (existingById) {
    updateCard.run(card);
    return;
  }

  const existingByKey = findCardByKey.get(card.normalizedKey);
  if (existingByKey) {
    return;
  }

  insertCard.run(card);
};

app.get('/api/storage/state', (_req, res) => {
  const cards = listCards.all() as FlashcardRow[];
  const rawDialogs = allDialogsByLevel.all() as LevelDialogRow[];

  const dialogsByLevel: Record<string, LevelDialogPayload[]> = {};

  for (const dialog of rawDialogs) {
    const key = String(dialog.level);
    if (!Array.isArray(dialogsByLevel[key])) {
      dialogsByLevel[key] = [];
    }

    let parsedLines = [];
    let parsedUsedWords = [];
    try {
      parsedLines = JSON.parse(dialog.lines);
    } catch {
      parsedLines = [];
    }
    try {
      parsedUsedWords = JSON.parse(dialog.used_words);
    } catch {
      parsedUsedWords = [];
    }

    dialogsByLevel[key].push({
      level: dialog.level,
      title: dialog.title,
      setting: dialog.setting,
      explanation: dialog.explanation,
      lines: parsedLines as any,
      usedWords: parsedUsedWords as string[],
      createdAt: dialog.createdAt,
    });
  }

  res.json({
    cards,
    levelDialogs: dialogsByLevel,
  });
});

app.post('/api/storage/cards/bulk', (req, res) => {
  const payloadCards = req.body?.cards;
  const overwrite = Boolean(req.body?.overwrite);

  if (!Array.isArray(payloadCards)) {
    return res.status(400).json({ error: 'cards must be an array' });
  }

  const cards = payloadCards.map(sanitizeCard);

  if (overwrite) {
    const trx = db.transaction((items: ReturnType<typeof sanitizeCard>[]) => {
      const seenKeys = new Set<string>();
      clearCards.run();
      for (const card of items) {
        if (seenKeys.has(card.normalizedKey)) {
          continue;
        }
        seenKeys.add(card.normalizedKey);
        insertCard.run(card);
      }
    });
    trx(cards);
    return res.json({ count: cards.length, added: cards });
  }

  const trx = db.transaction((items: ReturnType<typeof sanitizeCard>[]) => {
    for (const card of items) {
      upsertCard(card);
    }
  });

  trx(cards);
  res.json({ count: cards.length });
});

app.patch('/api/storage/cards/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const card = sanitizeCard({ ...(req.body || {}), id });
  const existing = findCardById.get(id);
  if (!existing) {
    return res.status(404).json({ error: 'card not found' });
  }

  updateCard.run(card);
  res.json({ ok: true });
});

app.delete('/api/storage/cards', (_req, res) => {
  clearCards.run();
  res.json({ ok: true });
});

app.post('/api/storage/dialogs', (req, res) => {
  const dialog = sanitizeDialog(req.body);

  insertDialog.run({
    level: dialog.level,
    title: dialog.title,
    setting: dialog.setting,
    explanation: dialog.explanation,
    lines: JSON.stringify(dialog.lines),
    usedWords: JSON.stringify(dialog.usedWords),
    createdAt: dialog.createdAt,
  });

  pruneDialogsByLevel.run({ level: dialog.level });
  res.json({ ok: true });
});

app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('*', (_req, res) => {
  const filePath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vietnamese Anki API server is running on http://localhost:${PORT}`);
});
