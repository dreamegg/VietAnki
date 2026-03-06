import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisResult, Flashcard, Word, LevelDialog } from '../types';

const parseJsonSafely = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  }
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Gemini API Key is missing.');
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeWordWithAI = async (card: Flashcard): Promise<AIAnalysisResult> => {
  const prompt = `
사용자가 다음 베트남어 단어를 학습 중입니다:
단어: ${card.word}
의미: ${card.meaning}
한자어 기원: ${card.hanja}
예문: ${card.example}
해석: ${card.translation}

이 단어와 예문을 심층 분석해주세요. 베트남어 학습자에게 도움이 되도록 자세하고 정확하게 설명해주세요.
`;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
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

  const parsed = parseJsonSafely(text) as AIAnalysisResult;
  return {
    grammarBreakdown: parsed.grammarBreakdown || '',
    additionalExpressions: parsed.additionalExpressions || [],
    synonyms: parsed.synonyms || [],
    antonyms: parsed.antonyms || [],
    culturalContext: parsed.culturalContext || '',
  };
};

export const generateNewWordsWithAI = async (
  referenceWords: Word[],
  targetLevel: number,
  count: number = 5
): Promise<Omit<Flashcard, 'repetition' | 'interval' | 'easiness' | 'nextReviewDate' | 'id'>[]> => {
  const refList = referenceWords.map(w => w.word).join(', ');

  const prompt = `
사용자는 현재 다음 베트남어 단어들을 학습했습니다: ${refList}
이 수준을 참고하여, 레벨 ${targetLevel}에 맞는 **새로운 베트남어 단어 ${count}개**를 생성해주세요.
기존에 학습한 단어와 겹치지 않아야 하며, 실생활에서 자주 쓰이는 유용한 단어여야 합니다.
`;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
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

  const newWords = parseJsonSafely(text);
  if (!Array.isArray(newWords)) {
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  }
  return newWords.map((w: any) => ({ ...w, level: targetLevel }));
};

export const generateDialogWithAI = async (
  referenceWords: Flashcard[],
  targetLevel: number
): Promise<Omit<LevelDialog, 'createdAt'> & { createdAt?: number }> => {
  const refList = referenceWords
    .map(w => `${w.word}(#${w.meaning})`)
    .join(', ');

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
레벨 ${targetLevel} 베트남어 단어들을 학습한 학습자를 위해서 대화형 해설 자료를 만들어주세요.
준비된 단어: ${refList}

요구사항:
1) 실생활에서 자연스러운 짧은 대화(10~14턴)
2) 서로 다른 두 화자 A/B로 구성
3) 각 턴은 베트남어 원문(vietnamese)과 한국어 해설(korean)
4) 단어 난이도는 레벨 ${targetLevel}에 맞게 구성
5) 대화 후 핵심 문법/표현을 이해하기 쉬운 해설 제공
6) 실제 수업에서 바로 보여줄 수 있는 제목/상황(context) 제공
`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: '학습 대화 제목',
          },
          setting: {
            type: Type.STRING,
            description: '대화 상황',
          },
          explanation: {
            type: Type.STRING,
            description: '대화의 핵심 해설(문법, 패턴, 유의점)',
          },
          usedWords: {
            type: Type.ARRAY,
            description: '대화에 사용된 단어 목록',
            items: { type: Type.STRING },
          },
          lines: {
            type: Type.ARRAY,
            description: '대화 본문',
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING, description: 'A 또는 B' },
                vietnamese: { type: Type.STRING, description: '베트남어 문장' },
                korean: { type: Type.STRING, description: '한국어 번역/해설' },
              },
              required: ['speaker', 'vietnamese', 'korean'],
            },
          },
        },
        required: ['title', 'setting', 'explanation', 'usedWords', 'lines'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  const parsed = parseJsonSafely(text);
  const lines = Array.isArray(parsed.lines) ? parsed.lines : [];
  const usedWords = Array.isArray(parsed.usedWords) ? parsed.usedWords : [];

  return {
    level: targetLevel,
    title: parsed.title || `${targetLevel} 레벨 해설`,
    setting: parsed.setting || '',
    explanation: parsed.explanation || '',
    usedWords,
    lines: lines.map((line: any) => ({
      speaker: line?.speaker === 'B' ? 'B' : 'A',
      vietnamese: String(line?.vietnamese || ''),
      korean: String(line?.korean || ''),
    })),
  };
};
