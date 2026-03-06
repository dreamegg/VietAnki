import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getLevelDialogs, getSelectedLevel } from '../lib/storage';
import { LevelDialog } from '../types';

interface LevelDialogModeProps {
  onNavigate: (view: 'dashboard') => void;
}

const levelList = [1, 2, 3, 4, 5, 6];

const speakerLabel = (speaker: LevelDialog['lines'][number]['speaker']) => {
  switch (speaker) {
    case 'A':
      return '화자 A';
    case 'B':
      return '화자 B';
    case 'T':
      return '해설자';
    default:
      return '화자';
  }
};

export const LevelDialogMode: React.FC<LevelDialogModeProps> = ({ onNavigate }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const selected = getSelectedLevel();
    return typeof selected === 'number' ? selected : 1;
  });
  const [selectedDialogId, setSelectedDialogId] = useState<string>('');
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [showKorean, setShowKorean] = useState(false);
  const [dialogs, setDialogs] = useState<LevelDialog[]>([]);

  const loadDialogs = async () => {
    const next = await getLevelDialogs(currentLevel);
    setDialogs(next.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    void loadDialogs();
  }, [currentLevel]);

  useEffect(() => {
    if (!selectedDialogId && dialogs[0]) {
      setSelectedDialogId(String(dialogs[0].createdAt));
      setTurnIndex(0);
      setShowKorean(false);
    }
  }, [dialogs, selectedDialogId]);

  useEffect(() => {
    setTurnIndex(0);
    setShowKorean(false);
  }, [selectedDialogId]);

  const selectedDialog = useMemo(
    () => dialogs.find((dialog) => String(dialog.createdAt) === selectedDialogId) || dialogs[0],
    [dialogs, selectedDialogId]
  );

  if (dialogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span className="mr-2">←</span>
          대시보드로 돌아가기
        </button>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-slate-500">선택한 레벨에 생성된 다이얼로그가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-2">레벨별 대화/해설에서 먼저 다이얼로그를 생성한 뒤 사용해 주세요.</p>
        </div>
      </div>
    );
  }

  const line = selectedDialog.lines[turnIndex];
  const isLastLine = turnIndex >= selectedDialog.lines.length - 1;

  const goNext = () => {
    setShowKorean(false);
    if (!isLastLine) {
      setTurnIndex((prev) => prev + 1);
    }
  };

  const restart = () => {
    setTurnIndex(0);
    setShowKorean(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
      >
        <span className="mr-2">←</span>
        대시보드로 돌아가기
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">레벨별 다이얼로그 모드</h2>
        <p className="text-slate-500">생성된 다이얼로그를 줄 단위로 보며 대화 흐름을 연습합니다.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {levelList.map(level => (
          <button
            key={level}
            onClick={() => setCurrentLevel(level)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              currentLevel === level
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Level {level}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <label className="block text-sm text-slate-500">대화 선택</label>
        <select
          value={selectedDialogId}
          onChange={(e) => setSelectedDialogId(e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-3"
        >
          {dialogs.map((dialog) => (
            <option key={dialog.createdAt} value={String(dialog.createdAt)}>
              {new Date(dialog.createdAt).toLocaleString()} - {dialog.title}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{speakerLabel(line?.speaker || 'A')}</span>
          <span>{turnIndex + 1} / {selectedDialog.lines.length}</span>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-slate-900">{line?.vietnamese}</p>
          {showKorean && (
            <p className="text-xl text-slate-600">{line?.korean}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKorean((prev) => !prev)}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            {showKorean ? '뜻 가리기' : '뜻 보기'}
          </button>
          {isLastLine ? (
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              다시 시작
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              다음 줄
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        <p><strong>상황</strong>: {selectedDialog.setting || '없음'}</p>
        <p><strong>요약</strong>: {selectedDialog.explanation || '요약 없음'}</p>
      </div>
    </div>
  );
};
