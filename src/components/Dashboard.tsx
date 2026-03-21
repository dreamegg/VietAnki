import React, { useEffect, useState } from 'react';
import { BookOpen, BrainCircuit, Database, Trophy, Layers, MessageCircle, Mic2 } from 'lucide-react';
import { getStats, getSelectedLevel, setSelectedLevel, subscribeToDataRefresh } from '../lib/storage';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'study' | 'data' | 'dialogs' | 'dialogMode') => void;
}

const levelOptions: (number | 'all')[] = ['all', 1, 2, 3];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const getInitialLevel = () => {
    const saved = getSelectedLevel();
    return typeof saved === 'number' && levelOptions.includes(saved) ? saved : 'all';
  };

  const [currentLevel, setCurrentLevelState] = useState<number | 'all'>(getInitialLevel());
  const [stats, setStats] = useState({ due: 0, learning: 0, graduated: 0, total: 0 });

  const loadStats = async () => {
    const next = await getStats();
    setStats(next);
  };

  const handleLevelChange = (level: number | 'all') => {
    setSelectedLevel(level);
    setCurrentLevelState(level);
    void loadStats();
  };

  useEffect(() => {
    void loadStats();
  }, [currentLevel]);

  useEffect(() => {
    return subscribeToDataRefresh(() => void loadStats());
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Vietnamese Anki AI</h1>
        <p className="text-slate-500">AI와 함께하는 스마트한 베트남어 학습</p>
      </div>

      <div className="flex flex-col items-center space-y-3 pt-4">
        <div className="flex items-center space-x-2 text-slate-600 font-medium">
          <Layers size={18} />
          <span>학습 레벨 선택</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {levelOptions.map(level => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                currentLevel === level
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {level === 'all' ? '전체 레벨' : `IM${level}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500">오늘 복습할 단어</p>
          <p className="text-3xl font-bold text-slate-900">{stats.due}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BrainCircuit size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500">학습 중인 단어</p>
          <p className="text-3xl font-bold text-slate-900">{stats.learning}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Trophy size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500">마스터한 단어</p>
          <p className="text-3xl font-bold text-slate-900">{stats.graduated}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Database size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500">전체 단어</p>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <button
          onClick={() => onNavigate('study')}
          className="flex-1 sm:flex-none px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <BookOpen size={20} />
          <span>{stats.due > 0 ? '학습 시작하기' : '무한 복습하기'}</span>
        </button>
        <button
          onClick={() => onNavigate('data')}
          className="flex-1 sm:flex-none px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Database size={20} />
          <span>단어 데이터 관리</span>
        </button>
        <button
          onClick={() => onNavigate('dialogs')}
          className="flex-1 sm:flex-none px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <MessageCircle size={20} />
          <span>레벨별 대화/해설</span>
        </button>
        <button
          onClick={() => onNavigate('dialogMode')}
          className="flex-1 sm:flex-none px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Mic2 size={20} />
          <span>레벨별 다이얼로그 모드</span>
        </button>
      </div>
    </div>
  );
};
