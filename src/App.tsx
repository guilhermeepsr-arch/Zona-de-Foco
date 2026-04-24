/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wallet, CheckSquare, Target, Calendar, ListChecks, BookOpen, LayoutGrid } from 'lucide-react';
import Finance from './modules/Finance';
import Tasks from './modules/Tasks';
import Goals from './modules/Goals';
import Habits from './modules/Habits';
import Lists from './modules/Lists';
import Diary from './modules/Diary';
import Launcher from './modules/Launcher';
import { cn } from './components/UI';

type Module = 'launcher' | 'finance' | 'tasks' | 'goals' | 'habits' | 'lists' | 'diary';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('launcher');

  const renderModule = () => {
    switch (activeModule) {
      case 'launcher':
        return <Launcher onSelect={setActiveModule} />;
      case 'finance':
        return <Finance />;
      case 'tasks':
        return <Tasks />;
      case 'goals':
        return <Goals />;
      case 'habits':
        return <Habits />;
      case 'lists':
        return <Lists />;
      case 'diary':
        return <Diary />;
      default:
        return <Launcher onSelect={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-red-500/30">
      {/* Content */}
      <main className="max-w-md mx-auto min-h-screen relative">
        {renderModule()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0c0c0c]/80 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
          <NavButton
            active={activeModule === 'launcher'}
            onClick={() => setActiveModule('launcher')}
            icon={<LayoutGrid className="w-5 h-5" />}
            label="Início"
          />
          <NavButton
            active={activeModule === 'diary'}
            onClick={() => setActiveModule('diary')}
            icon={<BookOpen className="w-5 h-5" />}
            label="Diário"
          />
          <NavButton
            active={activeModule === 'tasks'}
            onClick={() => setActiveModule('tasks')}
            icon={<CheckSquare className="w-5 h-5" />}
            label="Tarefas"
          />
          <NavButton
            active={activeModule === 'finance'}
            onClick={() => setActiveModule('finance')}
            icon={<Wallet className="w-5 h-5" />}
            label="Dinheiro"
          />
          <NavButton
            active={activeModule === 'habits'}
            onClick={() => setActiveModule('habits')}
            icon={<Calendar className="w-5 h-5" />}
            label="Hábitos"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90',
        active ? 'text-red-500' : 'text-zinc-500'
      )}
    >
      <div className={cn(
        'p-1.5 rounded-xl transition-colors',
        active ? 'bg-red-500/10' : 'bg-transparent'
      )}>
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
