import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Flashcard, LevelDialog } from '../types';
import { getCards } from '../lib/storage';
import { generateDialogWithAI } from '../lib/gemini';
import { saveLevelDialog, getLevelDialogs } from '../lib/storage';

interface LevelDialogsProps {
  onNavigate: (view: 'dashboard') => void;
}

const levelList = [1, 2, 3, 4, 5, 6];

export const LevelDialogs: React.FC<LevelDialogsProps> = ({ onNavigate }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [dialogs, setDialogs] = useState<LevelDialog[]>([]);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCards = async () => {
    setAllCards(await getCards());
  };

  const loadDialogs = async (level = currentLevel) => {
    const next = await getLevelDialogs(level);
    setDialogs(next);
  };

  const cardsByLevel = useMemo(() => {
    const grouped: Record<number, number> = {};
    for (const card of allCards) {
      grouped[card.level] = (grouped[card.level] || 0) + 1;
    }
    return grouped;
  }, [allCards]);

  useEffect(() => {
    void loadCards();
  }, []);

  useEffect(() => {
    void loadDialogs();
  }, [currentLevel]);

  const handleGenerate = async () => {
    if (allCards.length === 0) {
      setMessage('먼저 단어를 추가해주세요.');
      return;
    }

    const targetCards = allCards.filter(card => card.level === currentLevel);
    if (targetCards.length === 0) {
      setMessage('해당 레벨에 사용할 단어가 없습니다. 먼저 단어를 추가해주세요.');
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    try {
      const dialog = await generateDialogWithAI(targetCards, currentLevel);
      const saved = await saveLevelDialog({ ...dialog, level: currentLevel, createdAt: Date.now() });
      setDialogs(prev => [saved, ...prev]);
      setMessage('레벨별 대화 및 해설이 생성되었습니다. 아래에서 바로 확인하세요.');
    } catch (err: any) {
      setMessage(`생성 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (dialog: LevelDialog) => {
    const lines = dialog.lines
      .map(line => `${line.speaker}: ${line.vietnamese}\n   ${line.korean}`)
      .join('\n');
    const content = `# ${dialog.title}\n\n레벨: ${dialog.level}\n상황: ${dialog.setting}\n생성일: ${new Date(dialog.createdAt).toLocaleString()}\n\n해설:\n${dialog.explanation}\n\n대화:\n${lines}\n`;
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vietanki_level_${dialog.level}_dialog_${dialog.createdAt}.md`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (dialog: LevelDialog) => {
    const rows = dialog.lines.map((line, idx) => ({
      level: dialog.level,
      title: dialog.title,
      setting: dialog.setting,
      createdAt: new Date(dialog.createdAt).toISOString(),
      turn: idx + 1,
      speaker: line.speaker,
      vietnamese: line.vietnamese,
      korean: line.korean,
    }));

    const usedWords = (dialog.usedWords || []).join(', ');
    const metadataRow = {
      level: dialog.level,
      title: `${dialog.title} (해설/메타)`,
      setting: dialog.setting,
      createdAt: new Date(dialog.createdAt).toISOString(),
      turn: 'metadata',
      speaker: 'META',
      vietnamese: `usedWords: ${usedWords}`,
      korean: dialog.explanation || '',
    };

    const csv = Papa.unparse([metadataRow, ...rows]);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vietanki_level_${dialog.level}_dialog_${dialog.createdAt}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
      >
        <span className="mr-2">←</span>
        대시보드로 돌아가기
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">레벨별 대화 &amp; 해설 페이지</h2>
        <p className="text-slate-500">레벨의 단어를 기반으로 실생활 대화와 해설을 자동 생성합니다.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {levelList.map(level => {
            const count = cardsByLevel[level] || 0;
            return (
              <button
                key={level}
                onClick={() => setCurrentLevel(level)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  currentLevel === level
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Level {level} ({count}단어)
              </button>
            );
          })}
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>해설 대화 생성</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {dialogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            해당 레벨의 해설이 없습니다. <strong>생성</strong> 버튼을 눌러 만들어보세요.
          </div>
        ) : (
          dialogs.map((dialog) => (
            <div key={`${dialog.level}-${dialog.createdAt}`} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <BookOpen size={20} className="mr-2 text-indigo-600" />
                    {dialog.title}
                  </h3>
                  <p className="text-sm text-slate-500">상황: {dialog.setting}</p>
                  <p className="text-sm text-slate-400 mt-1">{new Date(dialog.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleExport(dialog)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  .md 저장
                </button>
                <button
                  onClick={() => handleExportCSV(dialog)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  .csv 저장
                </button>
              </div>
              <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-3 rounded-xl">{dialog.explanation}</p>
              <div className="space-y-2">
                {dialog.lines.map((line, idx) => (
                  <div key={idx} className="p-3 border rounded-xl bg-slate-50">
                    <p className="text-slate-900 font-medium">[{line.speaker}] {line.vietnamese}</p>
                    <p className="text-slate-500 text-sm mt-1">{line.korean}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                사용 단어: {dialog.usedWords.join(', ') || '자동 선택'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
