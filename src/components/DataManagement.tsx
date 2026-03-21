import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Upload, Trash2, ArrowLeft, FileText, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { addCards, clearAllCards, getStats, getCards, subscribeToDataRefresh } from '../lib/storage';
import { createInitialCard } from '../lib/srs';
import { getDefaultCards } from '../lib/defaultData';
import { generateNewWordsWithAI } from '../lib/gemini';

interface DataManagementProps {
  onNavigate: (view: 'dashboard') => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onNavigate }) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetLevel, setTargetLevel] = useState<number>(1);
  const [generateCount, setGenerateCount] = useState<number>(10);
  const [stats, setStats] = useState({ total: 0, due: 0, newCards: 0, learning: 0, graduated: 0 });

  const loadStats = async () => {
    const next = await getStats();
    setStats(next);
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useEffect(() => {
    return subscribeToDataRefresh(() => void loadStats());
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const newCards = results.data.map((row: any, index) => {
            const word = row['단어'] || row['word'];
            const meaning = row['의미'] || row['meaning'];
            const hanja = row['한자적 해석'] || row['hanja'] || '';
            const example = row['예문'] || row['example'] || '';
            const translation = row['해석'] || row['translation'] || '';

            const levelStr = row['레벨'] || row['level'] || '1';
            const levelMatch = levelStr.match(/\d+/);
            const level = levelMatch ? parseInt(levelMatch[0], 10) : 1;

            if (!word || !meaning) {
              throw new Error(`Row ${index + 1} is missing required fields (단어, 의미).`);
            }

            return createInitialCard({
              id: `${word}_${Date.now()}_${index}`,
              word,
              meaning,
              hanja,
              example,
              translation,
              level,
            });
          });

          const addedCount = (await addCards(newCards)).length;
          await loadStats();
          setMessage({ type: 'success', text: `성공적으로 ${addedCount}개의 단어를 추가했습니다.` });
        } catch (err: any) {
          setMessage({ type: 'error', text: `CSV 파싱 오류: ${err.message}` });
        }
      },
      error: (error) => {
        setMessage({ type: 'error', text: `파일 읽기 오류: ${error.message}` });
      }
    });
  };

  const handleLoadDefaults = async () => {
    const defaultCards = getDefaultCards();
    const addedCardsCount = (await addCards(defaultCards)).length;
    await loadStats();
    if (addedCardsCount > 0) {
      setMessage({ type: 'success', text: `기본 단어 ${addedCardsCount}개가 추가되었습니다.` });
    } else {
      setMessage({ type: 'success', text: '이미 모든 기본 단어가 추가되어 있습니다.' });
    }
  };

  const handleGenerateAIWords = async () => {
    try {
      setIsGenerating(true);
      setMessage(null);

      const allCards = await getCards();
      let referenceCards = allCards.filter(c => c.level === targetLevel || c.level === targetLevel - 1);
      if (referenceCards.length === 0) {
        referenceCards = allCards;
      }

      const shuffled = [...referenceCards].sort(() => 0.5 - Math.random());
      const selectedRefs = shuffled.slice(0, 10);

      const newWords = await generateNewWordsWithAI(selectedRefs, targetLevel, generateCount);

      const newCards = newWords.map((w, index) => createInitialCard({
        id: `ai_gen_${Date.now()}_${index}`,
        ...w
      }));

      const addedCards = await addCards(newCards);
      await loadStats();

      if (addedCards.length > 0) {
        setMessage({
          type: 'success',
          text: `AI가 레벨 ${targetLevel}의 새로운 단어 ${addedCards.length}개를 생성했습니다.`,
        });
      } else {
        setMessage({
          type: 'success',
          text: 'AI가 생성한 단어는 기존 데이터와 중복되어 추가되지 않았습니다.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `AI 단어 생성 실패: ${err.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('정말 모든 학습 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      await clearAllCards();
      await loadStats();
      setMessage({ type: 'success', text: '모든 데이터가 삭제되었습니다. 앱을 새로고침하면 기본 단어가 다시 로드됩니다.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        대시보드로 돌아가기
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">데이터 관리</h2>
        <p className="text-slate-500">CSV 파일을 업로드하거나 AI를 통해 새로운 단어를 추가하세요.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center text-emerald-600">
            <Sparkles size={20} className="mr-2" />
            AI 단어 생성
          </h3>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 space-y-4">
            <p className="text-sm text-emerald-800">
              현재 학습 중인 단어 수준을 분석하여, 선택한 레벨에 맞는 새로운 단어를 AI가 자동으로 생성합니다. (대량 생성 시 시간이 조금 걸릴 수 있습니다)
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-emerald-900">목표 레벨:</label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(Number(e.target.value))}
                  className="bg-white border border-emerald-200 text-emerald-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                >
                  {[1, 2, 3].map(lvl => (
                    <option key={lvl} value={lvl}>IM{lvl}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-emerald-900">생성 개수:</label>
                <select
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="bg-white border border-emerald-200 text-emerald-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                >
                  {[10, 20, 30, 50, 100].map(cnt => (
                    <option key={cnt} value={cnt}>{cnt}개</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateAIWords}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    단어 {generateCount}개 생성하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Upload size={20} className="mr-2 text-blue-500" />
            CSV 파일 업로드
          </h3>
          <p className="text-sm text-slate-500">
            CSV 파일은 다음 헤더를 포함해야 합니다: <br/>
            <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">단어, 의미, 한자적 해석, 예문, 해석, 레벨(선택)</code>
          </p>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-8 h-8 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭</p>
                <p className="text-xs text-slate-400">CSV (MAX. 10MB)</p>
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-lg font-semibold flex items-center text-indigo-600">
            <RefreshCw size={20} className="mr-2" />
            기본 데이터
          </h3>
          <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div>
              <p className="font-medium text-indigo-900">레벨별 기본 단어 불러오기</p>
              <p className="text-sm text-indigo-700">앱에 내장된 600개 기본 단어(IM1~IM3, 각 200개)를 추가합니다.</p>
            </div>
            <button
              onClick={handleLoadDefaults}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              불러오기
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-lg font-semibold flex items-center text-red-600">
            <Trash2 size={20} className="mr-2" />
            위험 구역
          </h3>
          <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-100">
            <div>
              <p className="font-medium text-red-900">모든 데이터 삭제</p>
              <p className="text-sm text-red-700">현재 저장된 {stats.total}개의 단어와 학습 기록이 모두 삭제됩니다.</p>
            </div>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
