export interface Word {
  id: string;
  word: string;
  meaning: string;
  hanja: string;
  example: string;
  translation: string;
  level: number;
}

export interface Flashcard extends Word {
  repetition: number;
  interval: number;
  easiness: number;
  nextReviewDate: number;
}

export interface AIAnalysisResult {
  grammarBreakdown: string;
  additionalExpressions: { expression: string; meaning: string }[];
  synonyms: string[];
  antonyms: string[];
  culturalContext?: string;
}
