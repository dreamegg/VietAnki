import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { Flashcard } from '../types';
import { getStudyBatch, updateCard } from '../lib/storage';
import { calculateNextReview } from '../lib/srs';
import { AIAnalysis } from './AIAnalysis';

interface StudySessionProps {
  onNavigate: (view: 'dashboard') => void;
}

type StudyMode = 'vi-to-ko' | 'ko-to-vi' | 'fill-in-blank';

export const StudySession: React.FC<StudySessionProps> = ({ onNavigate }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState<StudyMode>('vi-to-ko');

  const ANALYSIS_READY_COUNT = 3;

  const getRandomMode = (card: Flashcard): StudyMode => {
    const modes: StudyMode[] = ['vi-to-ko', 'ko-to-vi'];
    if (card.example && card.example.toLowerCase().includes(card.word.toLowerCase())) {
      modes.push('fill-in-blank');
    }
    return modes[Math.floor(Math.random() * modes.length)];
  };

  const loadNextBatch = async () => {
    setLoading(true);
    const batch = await getStudyBatch(10);
    setCards(batch);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowAI(false);
    if (batch.length > 0) {
      setCurrentMode(getRandomMode(batch[0]));
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadNextBatch();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6 mt-20">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <Loader2 className="animate-spin" size={28} />
        </div>
        <p className="text-slate-500">학습 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6 mt-20">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">단어가 없습니다!</h2>
        <p className="text-slate-500">데이터 관리 메뉴에서 단어를 추가해주세요.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const playAudio = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    window.speechSynthesis.speak(utterance);
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const handleAnswer = async (quality: number) => {
    const updatedCard = calculateNextReview(currentCard, quality);
    await updateCard(updatedCard);

    setAnsweredCount(prev => prev + 1);

    setIsFlipped(false);
    setShowAI(false);

    if (currentIndex < cards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentMode(getRandomMode(cards[nextIndex]));
    } else {
      void loadNextBatch();
    }
  };

  const getBlankedExample = (example: string, word: string) => {
    if (!example || !word) return example;
    const regex = new RegExp(escapeRegExp(word), 'gi');
    return example.replace(regex, '_____');
  };

  const renderFront = () => {
    switch (currentMode) {
      case 'ko-to-vi':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 w-full">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">한국어 → 베트남어</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">{currentCard.meaning}</h2>
          </div>
        );
      case 'fill-in-blank':
        return (
          <div className="flex flex-col items-center justify-center space-y-6 w-full">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-2">빈칸 채우기</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-relaxed">
              {getBlankedExample(currentCard.example, currentCard.word)}
            </h2>
            <p className="text-xl text-slate-500 font-medium">{currentCard.meaning}</p>
          </div>
        );
      case 'vi-to-ko':
      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-6 w-full">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-2">베트남어 → 한국어</span>
            <div className="flex items-center justify-center space-x-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                {currentCard.word}
              </h2>
              <button
                onClick={(e) => playAudio(currentCard.word, e)}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="발음 듣기"
              >
                <Volume2 size={32} />
              </button>
            </div>

            {currentCard.example && (
              <div className="flex items-center justify-center space-x-3 mt-4 max-w-xl">
                <p className="text-xl text-slate-600 font-medium">{currentCard.example}</p>
                <button
                  onClick={(e) => playAudio(currentCard.example, e)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                  title="예문 발음 듣기"
                >
                  <Volume2 size={24} />
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 sm:px-4 sm:py-6 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          종료
        </button>
        <div className="text-sm font-medium text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
          무한 학습 모드
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div
          className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8 flex flex-col relative cursor-pointer"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {!isFlipped ? (
              <>
                {renderFront()}
                <p className="text-slate-400 mt-8 sm:mt-10 animate-pulse">클릭하여 정답 확인</p>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-8"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3">
                    <p className="text-5xl font-bold text-slate-900">{currentCard.word}</p>
                    <button onClick={(e) => playAudio(currentCard.word, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Volume2 size={28} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-xl sm:text-2xl font-medium text-blue-600">{currentCard.meaning}</p>
                    {currentCard.hanja && (
                      <p className="text-sm text-slate-500 font-mono bg-slate-50 inline-block px-3 py-1 rounded-lg">
                        {currentCard.hanja}
                      </p>
                    )}
                  </div>
                </div>

                {currentCard.example && (
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl text-left space-y-2 flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base text-slate-800 font-medium">{currentCard.example}</p>
                      <p className="text-sm sm:text-base text-slate-500">{currentCard.translation}</p>
                    </div>
                    <button onClick={(e) => playAudio(currentCard.example, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0">
                      <Volume2 size={20} />
                    </button>
                  </div>
                )}

                {!showAI ? (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAI(true);
                      }}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm"
                    >
                      <Sparkles size={16} />
                      <span>AI 심층 분석</span>
                    </button>
                  </div>
                ) : (
                  <div onClick={(e) => e.stopPropagation()} className="cursor-default text-left">
                      <AIAnalysis
                        card={currentCard}
                        canAnalyze={answeredCount >= ANALYSIS_READY_COUNT}
                        progress={answeredCount}
                        threshold={ANALYSIS_READY_COUNT}
                      />
                    </div>
                  )}
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6"
            >
              <button
                onClick={() => handleAnswer(0)}
                className="py-4 bg-white border border-slate-200 rounded-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all flex flex-col items-center space-y-1"
              >
                <span className="font-semibold">다시</span>
                <span className="text-xs text-slate-400">&lt; 1분</span>
              </button>
              <button
                onClick={() => handleAnswer(1)}
                className="py-4 bg-white border border-slate-200 rounded-2xl hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all flex flex-col items-center space-y-1"
              >
                <span className="font-semibold">어려움</span>
                <span className="text-xs text-slate-400">
                  {currentCard.repetition === 0 ? '1일' : `${Math.max(1, Math.round(currentCard.interval * 1.2))}일`}
                </span>
              </button>
              <button
                onClick={() => handleAnswer(2)}
                className="py-4 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all flex flex-col items-center space-y-1"
              >
                <span className="font-semibold">알맞음</span>
                <span className="text-xs text-slate-400">
                  {currentCard.repetition === 0 ? '1일' : currentCard.repetition === 1 ? '6일' : `${Math.round(currentCard.interval * currentCard.easiness)}일`}
                </span>
              </button>
              <button
                onClick={() => handleAnswer(3)}
                className="py-4 bg-white border border-slate-200 rounded-2xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all flex flex-col items-center space-y-1"
              >
                <span className="font-semibold">쉬움</span>
                <span className="text-xs text-slate-400">
                  {currentCard.repetition === 0 ? '1일' : currentCard.repetition === 1 ? '6일' : `${Math.round(currentCard.interval * currentCard.easiness * 1.3)}일`}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
