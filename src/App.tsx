import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudySession } from './components/StudySession';
import { DataManagement } from './components/DataManagement';

type View = 'dashboard' | 'study' | 'data';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="font-bold text-xl tracking-tight cursor-pointer flex items-center space-x-2"
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="text-2xl">🇻🇳</span>
            <span>Vietnamese Anki AI</span>
          </div>
        </div>
      </header>

      <main className="py-8">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'study' && <StudySession onNavigate={setCurrentView} />}
        {currentView === 'data' && <DataManagement onNavigate={setCurrentView} />}
      </main>
    </div>
  );
}
