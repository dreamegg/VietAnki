import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, MessageSquare, ArrowRightLeft, Globe } from 'lucide-react';
import { Flashcard, AIAnalysisResult } from '../types';
import { analyzeWordWithAI } from '../lib/gemini';

interface AIAnalysisProps {
  card: Flashcard;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ card }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const result = await analyzeWordWithAI(card);
        if (mounted) {
          setAnalysis(result);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'AI 분석 중 오류가 발생했습니다.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();

    return () => {
      mounted = false;
    };
  }, [card]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-indigo-600 font-medium">Gemini가 단어를 심층 분석하고 있습니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
        {error}
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6 bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center space-x-2 text-indigo-600 border-b border-indigo-50 pb-4">
        <BookOpen size={20} />
        <h3 className="font-semibold text-lg">문법 구조 분석</h3>
      </div>
      <p className="text-slate-700 leading-relaxed text-sm">
        {analysis.grammarBreakdown}
      </p>

      {analysis.additionalExpressions && analysis.additionalExpressions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-emerald-600">
            <MessageSquare size={18} />
            <h4 className="font-medium">유용한 표현</h4>
          </div>
          <ul className="space-y-2">
            {analysis.additionalExpressions.map((expr, idx) => (
              <li key={idx} className="bg-slate-50 p-3 rounded-xl text-sm">
                <span className="font-medium text-slate-900 block mb-1">{expr.expression}</span>
                <span className="text-slate-500">{expr.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(analysis.synonyms?.length > 0 || analysis.antonyms?.length > 0) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          {analysis.synonyms?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-600">
                <ArrowRightLeft size={16} />
                <h4 className="font-medium text-sm">유의어</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.synonyms.map((word, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.antonyms?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-rose-600">
                <ArrowRightLeft size={16} />
                <h4 className="font-medium text-sm">반의어</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.antonyms.map((word, idx) => (
                  <span key={idx} className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-xs font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {analysis.culturalContext && (
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-amber-600">
            <Globe size={18} />
            <h4 className="font-medium">문화적 배경</h4>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed bg-amber-50/50 p-4 rounded-xl">
            {analysis.culturalContext}
          </p>
        </div>
      )}
    </div>
  );
};
