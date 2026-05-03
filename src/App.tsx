/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wallet, CheckSquare, Target, Calendar, ListChecks, BookOpen } from 'lucide-react';
import Finance from './modules/Finance';
import Tasks from './modules/Tasks';
import Goals from './modules/Goals';
import Habits from './modules/Habits';
import Lists from './modules/Lists';
import Diary from './modules/Diary';
import { cn } from './components/UI';

type Module = 'finance' | 'tasks' | 'goals' | 'habits' | 'lists' | 'diary';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('tasks');

  const renderModule = () => {
    switch (activeModule) {
      case 'finance':
        return <Finance onBack={() => {}} />;
      case 'tasks':
        return <Tasks onBack={() => {}} />;
      case 'goals':
        return <Goals onBack={() => {}} />;
      case 'habits':
        return <Habits onBack={() => {}} />;
      case 'lists':
        return <Lists onBack={() => {}} />;
      case 'diary':
        return <Diary onBack={() => {}} />;
      default:
        return <Tasks onBack={() => {}} />;
    }
  };

  const navItems: { id: Module; icon: React.ReactNode; label: string }[] = [
    { id: 'tasks', icon: <CheckSquare className="w-5 h-5" />, label: "Tarefas" },
    { id: 'habits', icon: <Calendar className="w-5 h-5" />, label: "Hábitos" },
    { id: 'goals', icon: <Target className="w-5 h-5" />, label: "Metas" },
    { id: 'finance', icon: <Wallet className="w-5 h-5" />, label: "Finanças" },
    { id: 'lists', icon: <ListChecks className="w-5 h-5" />, label: "Listas" },
    { id: 'diary', icon: <BookOpen className="w-5 h-5" />, label: "Diário" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-zinc-900 font-sans selection:bg-red-500/10">
      {/* Content */}
      <main className="max-w-md mx-auto min-h-screen relative">
        {renderModule()}
      </main>

      {/* Persistent Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-200 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center h-20 px-4">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              active={activeModule === item.id}
              onClick={() => setActiveModule(item.id)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({
  active,
  onClick,
  icon,
  label,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 flex-1',
        active ? 'text-red-600' : 'text-zinc-400'
      )}
    >
      <div className={cn(
        'p-1.5 rounded-xl transition-colors',
        active ? 'bg-red-50' : 'bg-transparent'
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest leading-none",
        active ? "text-red-700" : "text-zinc-400"
      )}>
        {label}
      </span>
    </button>
  );
}
