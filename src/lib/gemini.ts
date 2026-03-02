import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisResult, Flashcard, Word } from '../types';

export const analyzeWordWithAI = async (card: Flashcard): Promise<AIAnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
사용자가 다음 베트남어 단어를 학습 중입니다:
단어: ${card.word}
의미: ${card.meaning}
한자어 기원: ${card.hanja}
예문: ${card.example}
해석: ${card.translation}

이 단어와 예문을 심층 분석해주세요. 베트남어 학습자에게 도움이 되도록 자세하고 정확하게 설명해주세요.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grammarBreakdown: {
            type: Type.STRING,
            description: '예문에 사용된 문법 구조와 각 단어의 역할에 대한 상세한 설명',
          },
          additionalExpressions: {
            type: Type.ARRAY,
            description: '이 단어가 포함된 다른 유용한 실생활 표현이나 연어(collocation) 2~3개',
            items: {
              type: Type.OBJECT,
              properties: {
                expression: { type: Type.STRING, description: '베트남어 표현' },
                meaning: { type: Type.STRING, description: '한국어 뜻' },
              },
              required: ['expression', 'meaning'],
            },
          },
          synonyms: {
            type: Type.ARRAY,
            description: '유의어 목록 (베트남어)',
            items: { type: Type.STRING },
          },
          antonyms: {
            type: Type.ARRAY,
            description: '반의어 목록 (베트남어)',
            items: { type: Type.STRING },
          },
          culturalContext: {
            type: Type.STRING,
            description: '이 단어와 관련된 베트남 문화적 배경이나 뉘앙스 (없으면 빈 문자열)',
          },
        },
        required: ['grammarBreakdown', 'additionalExpressions', 'synonyms', 'antonyms'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  return JSON.parse(text) as AIAnalysisResult;
};

export const generateNewWordsWithAI = async (
  referenceWords: Word[],
  targetLevel: number,
  count: number = 5
): Promise<Omit<Flashcard, 'repetition' | 'interval' | 'easiness' | 'nextReviewDate' | 'id'>[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const refList = referenceWords.map(w => w.word).join(', ');

  const prompt = `
사용자는 현재 다음 베트남어 단어들을 학습했습니다: ${refList}
이 수준을 참고하여, 레벨 ${targetLevel}에 맞는 **새로운 베트남어 단어 ${count}개**를 생성해주세요.
기존에 학습한 단어와 겹치지 않아야 하며, 실생활에서 자주 쓰이는 유용한 단어여야 합니다.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: '베트남어 단어' },
            meaning: { type: Type.STRING, description: '한국어 뜻' },
            hanja: { type: Type.STRING, description: '한자어 기원 (없으면 빈 문자열)' },
            example: { type: Type.STRING, description: '단어가 포함된 베트남어 예문' },
            translation: { type: Type.STRING, description: '예문의 한국어 해석' },
          },
          required: ['word', 'meaning', 'hanja', 'example', 'translation'],
        }
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  const newWords = JSON.parse(text);
  return newWords.map((w: any) => ({ ...w, level: targetLevel }));
};
