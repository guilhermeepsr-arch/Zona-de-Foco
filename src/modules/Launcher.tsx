/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Wallet, 
  CheckSquare, 
  Target, 
  Calendar, 
  ListChecks, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/UI';

interface LauncherProps {
  onSelect: (module: any) => void;
}

const modules = [
  { id: 'finance', label: 'Finanças', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Controle seus gastos' },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'Organize seu dia' },
  { id: 'goals', label: 'Metas', icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10', description: 'Alcance objetivos' },
  { id: 'habits', label: 'Hábitos', icon: Calendar, color: 'text-red-500', bg: 'bg-red-500/10', description: 'Construa rotinas' },
  { id: 'lists', label: 'Listas', icon: ListChecks, color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Notas e listas' },
  { id: 'diary', label: 'Diário', icon: BookOpen, color: 'text-pink-500', bg: 'bg-pink-500/10', description: 'Registre memórias' },
];

export default function Launcher({ onSelect }: LauncherProps) {
  return (
    <div className="px-6 pt-16 pb-32">
      <header className="mb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <span className="text-2xl font-black uppercase tracking-tighter text-white">Zona</span>
          <div className="bg-red-600 text-black px-5 py-1.5 rounded-full shadow-lg shadow-red-900/20 whitespace-nowrap">
            <span className="text-xl font-black uppercase tracking-tighter leading-none">Foco</span>
          </div>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px] ml-1"
        >
          Sua central de comando pessoal.
        </motion.p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {modules.map((m, index) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(m.id)}
            className="group relative p-6 bg-zinc-900/30 border border-white/5 rounded-[2.5rem] text-left hover:bg-zinc-900/50 transition-all overflow-hidden"
          >
            <div className={cn("inline-flex p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110", m.bg, m.color)}>
              <m.icon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">{m.label}</h3>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight">{m.description}</p>
            
            {/* Decoration */}
            <div className={cn("absolute -right-4 -bottom-4 w-16 h-16 opacity-10 blur-xl rounded-full", m.bg)} />
            <ArrowRight className="absolute right-6 bottom-6 w-4 h-4 text-zinc-800 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
          </motion.button>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-6 bg-[#111111] rounded-[2.5rem] border border-white/5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resumo Semanal</p>
            <p className="text-xs font-bold text-white uppercase">Sua produtividade subiu 12%</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-800" />
      </motion.div>
    </div>
  );
}
