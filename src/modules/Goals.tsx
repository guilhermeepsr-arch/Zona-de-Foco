/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { motion } from 'motion/react';
import { differenceInDays, parseISO, startOfDay, format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Modal, ProgressBar, cn } from '../components/UI';
import { Plus, Trash2, Undo2, TrendingUp, AlertCircle, CheckCircle2, ArrowLeft, Edit2, History, Target, Calendar, Clock, ChevronLeft, Archive } from 'lucide-react';
import { Goal, GoalEntry, GoalTarget } from '../types';

export default function Goals({ onBack }: { onBack: () => void }) {
  const { goals, addGoal, addGoalEntry, undoLastGoalEntry, deleteGoal, updateGoal } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // New Goal Form
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [quickButtonsText, setQuickButtonsText] = useState('');

  // New Target Form
  const [targetValue, setTargetValue] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');

  const selectedGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoalId);
  }, [goals, selectedGoalId]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;

    // Parse quick buttons
    const quickButtons = quickButtonsText
      ? quickButtonsText.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      : undefined;

    addGoal({
      name,
      unit,
      quickButtons
    });
    setName('');
    setUnit('');
    setQuickButtonsText('');
    setIsModalOpen(false);
  };

  const handleSetTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !targetValue || !targetEndDate) return;

    // If starting a new cycle, we move current state to history
    const isNewCycle = !!selectedGoal.currentTarget;
    
    if (isNewCycle) {
      const historyEntry = {
        target: selectedGoal.currentTarget!,
        entries: [...selectedGoal.entries]
      };
      updateGoal(selectedGoal.id, {
        currentTarget: {
          id: Date.now().toString(),
          value: parseFloat(targetValue),
          endDate: targetEndDate,
          startDate: new Date().toISOString()
        },
        entries: [], // Reset entries for new cycle
        history: [...(selectedGoal.history || []), historyEntry]
      });
    } else {
      updateGoal(selectedGoal.id, {
        currentTarget: {
          id: Date.now().toString(),
          value: parseFloat(targetValue),
          endDate: targetEndDate,
          startDate: new Date().toISOString()
        }
      });
    }

    setTargetValue('');
    setTargetEndDate('');
    setIsTargetModalOpen(false);
  };

  return (
    <div className="pb-32 bg-[#f8f8f8] min-h-screen">
      <header className="px-6 pt-10 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-red-600" />
          <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Metas</h1>
        </div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hoje</span>
      </header>

      <div className="px-6 space-y-3 pb-24">
        {goals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <p className="text-zinc-500 font-bold uppercase tracking-widest mb-1">Sem metas criadas</p>
            <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-widest">Clique no + para começar</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id}>
              <GoalCard 
                goal={goal} 
                onAdd={(val) => addGoalEntry(goal.id, val)}
                onClick={() => setSelectedGoalId(goal.id)}
              />
            </div>
          ))
        )}
      </div>

      {/* FAB - Botão Flutuante conforme imagem */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 w-16 h-16 bg-[#FF3B30] rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-600/30 active:scale-90 transition-transform z-40 border-4 border-white/20"
      >
        <Plus className="w-8 h-8 stroke-[3]" />
      </button>

      {/* Create Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta/Contador">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Flexões, Copos d'água"
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-xl px-5 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Unidade / Métrica</label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: reps, litros, km, páginas"
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-xl px-5 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Botões Rápidos (Separados por vírgula)</label>
            <input
              type="text"
              value={quickButtonsText}
              onChange={(e) => setQuickButtonsText(e.target.value)}
              placeholder="Ex: 5, 10, 25"
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-xl px-5 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
          </div>
          <Button type="submit" className="w-full py-4 text-xs font-bold uppercase tracking-widest">Criar Meta</Button>
        </form>
      </Modal>

      {/* Goal Detail Sheet */}
      {selectedGoal && (
        <Modal 
          isOpen={!!selectedGoalId} 
          onClose={() => setSelectedGoalId(null)} 
          title={selectedGoal.name}
          hideHeader
        >
          <GoalPane 
            goal={selectedGoal} 
            onClose={() => setSelectedGoalId(null)}
            onSetTarget={() => setIsTargetModalOpen(true)}
          />
        </Modal>
      )}

      {/* Target Setup Modal */}
      <Modal 
        isOpen={isTargetModalOpen} 
        onClose={() => setIsTargetModalOpen(false)} 
        title={selectedGoal?.currentTarget ? "Novo Ciclo de Alvo" : "Definir Alvo"}
      >
        <form onSubmit={handleSetTarget} className="space-y-5">
          <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed px-1">
            {selectedGoal?.currentTarget 
              ? "Ao definir um novo alvo, o progresso atual será arquivado no histórico e um novo ciclo começará." 
              : "Defina um objetivo numérico e uma data limite para acompanhar seu ritmo."}
          </p>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Quantidade do Alvo</label>
            <input
              type="number"
              required
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-xl px-5 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
              placeholder="Ex: 500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Data Final</label>
            <input
              type="date"
              required
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
              className="w-full bg-zinc-100 border-none text-zinc-900 rounded-xl px-5 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
          </div>
          <Button type="submit" className="w-full py-4 text-xs font-bold uppercase tracking-widest">
            {selectedGoal?.currentTarget ? "Iniciar Novo Ciclo" : "Confirmar Alvo"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onAdd: (val: number) => void;
  onClick: () => void;
}

function GoalCard({ goal, onAdd, onClick }: GoalCardProps) {
  const total = (goal.entries || []).reduce((acc, e) => acc + e.value, 0);
  const todayTotal = (goal.entries || [])
    .filter(e => isToday(parseISO(e.date)))
    .reduce((acc, e) => acc + e.value, 0);

  const stats = useMemo(() => {
    if (!goal.currentTarget) return null;
    const now = new Date();
    const start = parseISO(goal.currentTarget.startDate);
    const end = parseISO(goal.currentTarget.endDate);
    
    const daysTotal = Math.max(1, differenceInDays(end, start));
    const daysRemaining = Math.max(0, differenceInDays(end, now));
    const daysPassed = Math.max(1, differenceInDays(now, start));

    const totalTarget = goal.currentTarget.value;
    const progressPerc = (total / totalTarget) * 100;
    
    const idealAccumulated = (totalTarget / daysTotal) * daysPassed;
    const isAhead = total >= idealAccumulated;
    const diff = total - idealAccumulated;

    const requiredPerDay = daysRemaining > 0 ? Math.max(0, (totalTarget - total) / daysRemaining) : 0;

    return {
      daysRemaining,
      progressPerc,
      isAhead,
      diff,
      requiredPerDay,
      targetValue: totalTarget
    };
  }, [goal, total]);

  const increments = useMemo(() => {
    if (goal.quickButtons && goal.quickButtons.length > 0) return goal.quickButtons;
    const u = goal.unit.toLowerCase();
    if (u.includes('ml')) return [200, 300, 500];
    return [5, 10, 25];
  }, [goal]);

  return (
    <div 
      className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm transition-all active:scale-[0.99] group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-0.5">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-zinc-900 tracking-tight">{goal.name}</h3>
        </div>
        <div className="text-right">
          <div className="relative inline-block">
            <p className="text-3xl font-black text-[#FF3B30] leading-none drop-shadow-[0_0_10px_rgba(255,59,48,0.2)]">{todayTotal}</p>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">hoje</p>
        </div>
      </div>

      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.1em] mb-2 -mt-1.5">{goal.unit}</p>

      <div className="mb-2">
        <p className="text-[12px] font-medium text-zinc-500">Total: <span className="text-zinc-900 font-black">{total}</span> <span className="lowercase">{goal.unit}</span></p>
      </div>

      {stats && (
        <div className="mb-4">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[11px] font-medium text-zinc-400">Meta: {total}/{stats.targetValue}</span>
            <span className={cn(
              "text-[9px] font-medium opacity-80",
              stats.isAhead ? "text-emerald-600" : "text-amber-600"
            )}>
              {stats.isAhead ? "adiantado" : "em atraso"}
            </span>
          </div>
          <div className="h-[3px] w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.min(100, stats.progressPerc)}%` }}
            />
          </div>
          <p className="text-[10px] font-medium text-zinc-400 mt-2.5">
            {stats.daysRemaining}d restantes · {stats.requiredPerDay === 0 ? '-' : ''}{stats.requiredPerDay.toFixed(1)}/{goal.unit}/dia necessário
          </p>
        </div>
      )}

      <div className="flex gap-2.5 mt-2">
        {increments.slice(0, 3).map(val => (
          <button
            key={val}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(val);
            }}
            className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-sm rounded-xl border border-zinc-200 transition-all active:scale-90"
          >
            +{val}
          </button>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-14 items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl border border-zinc-200 transition-all active:scale-90 hidden sm:flex"
        >
          <Plus className="w-5 h-5 text-zinc-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex-1 items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl border border-zinc-200 transition-all active:scale-90 flex sm:hidden"
        >
          <Plus className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

function GoalPane({ goal, onClose, onSetTarget }: { goal: Goal; onClose: () => void; onSetTarget: () => void }) {
  const { addGoalEntry, undoLastGoalEntry, deleteGoal, updateGoal } = useAppStore();
  const [addValue, setAddValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editUnit, setEditUnit] = useState(goal.unit);
  const [editQuickButtonsText, setEditQuickButtonsText] = useState(goal.quickButtons?.join(', ') || '');

  const total = useMemo(() => (goal.entries || []).reduce((acc, e) => acc + e.value, 0), [goal.entries]);
  const todayTotal = useMemo(() => (goal.entries || [])
    .filter(e => isToday(parseISO(e.date)))
    .reduce((acc, e) => acc + e.value, 0), [goal.entries]);
  
  const chartData = useMemo(() => {
    const data = [];
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isTodayBar = isToday(d);
      const dayTotal = (goal.entries || [])
        .filter(e => isSameDay(parseISO(e.date), d))
        .reduce((acc, e) => acc + e.value, 0);
      
      data.push({ 
        name: days[d.getDay()], 
        value: dayTotal,
        isToday: isTodayBar
      });
    }
    return data;
  }, [goal.entries]);

  const stats = useMemo(() => {
    if (!goal.currentTarget) return null;
    const now = new Date();
    const start = parseISO(goal.currentTarget.startDate);
    const end = parseISO(goal.currentTarget.endDate);
    
    const daysTotal = Math.max(1, differenceInDays(end, start));
    const daysRemaining = Math.max(0, differenceInDays(end, now));
    const daysPassed = Math.max(1, differenceInDays(now, start));

    const totalTarget = goal.currentTarget.value;
    const progressPerc = Math.round((total / totalTarget) * 100);
    
    const idealAccumulated = (totalTarget / daysTotal) * daysPassed;
    const isAhead = total >= idealAccumulated;
    const diff = total - idealAccumulated;

    const requiredPerDay = daysRemaining > 0 ? Math.max(0, (totalTarget - total) / daysRemaining) : 0;
    const currentAverage = total / daysPassed;

    return {
      daysRemaining,
      progressPerc,
      isAhead,
      diff,
      requiredPerDay,
      currentAverage,
      targetValue: totalTarget
    };
  }, [goal, total]);

  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValue || isNaN(parseFloat(addValue))) return;
    addGoalEntry(goal.id, parseFloat(addValue));
    setAddValue('');
    setShowManualInput(false);
  };

  const handleSaveEdit = () => {
    const quickButtons = editQuickButtonsText
      ? editQuickButtonsText.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      : undefined;

    updateGoal(goal.id, { 
      name: editName,
      unit: editUnit,
      quickButtons
    });
    setIsEditing(false);
  };

  const quickButtons = useMemo(() => {
    if (goal.quickButtons && goal.quickButtons.length > 0) return goal.quickButtons;
    return [5, 10, 25];
  }, [goal.quickButtons]);

  return (
    <div className="space-y-4 pb-16 px-1">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 -ml-2 text-zinc-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {isEditing ? (
            <div className="flex-1 space-y-2">
              <input 
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-zinc-100 border-none text-zinc-900 font-bold uppercase text-xs px-2 py-1.5 rounded-lg w-full"
              />
              <input 
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="bg-zinc-100 border-none text-zinc-500 font-bold text-[10px] px-2 py-1.5 rounded-lg w-full"
              />
              <button 
                onClick={handleSaveEdit}
                className="w-full bg-zinc-900 text-white text-[10px] font-black uppercase py-2 rounded-lg"
              >
                Salvar
              </button>
            </div>
          ) : (
            <div className="pt-1">
              <h2 className="text-lg font-medium text-zinc-900 tracking-tight leading-none uppercase">{goal.name}</h2>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{goal.unit}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="p-2 text-zinc-600 hover:text-white transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  if (isConfirmingDelete) {
                    deleteGoal(goal.id);
                    onClose();
                  } else {
                    setIsConfirmingDelete(true);
                  }
                }} 
                className={cn("p-2 transition-colors", isConfirmingDelete ? "text-red-500" : "text-zinc-600 hover:text-red-500")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 py-8 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-4xl font-black text-[#FF3B30] leading-none mb-2 drop-shadow-[0_0_15px_rgba(255,59,48,0.1)]">{todayTotal}</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">HOJE</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 py-8 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-4xl font-black text-zinc-900 leading-none mb-2">{total}</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TOTAL</p>
        </div>
      </div>

      {/* Add Row */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2.5">
          {quickButtons.map(val => (
            <button
              key={val}
              onClick={() => addGoalEntry(goal.id, val)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold py-3 rounded-xl shadow-sm border border-zinc-200 transition-all active:scale-95"
            >
              +{val}
            </button>
          ))}
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-400 font-bold py-3 rounded-xl shadow-sm border border-zinc-200 transition-all active:scale-95"
          >
            +?
          </button>
        </div>

        {showManualInput && (
          <form onSubmit={handleAddValue} className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2 bg-zinc-100 p-2 rounded-xl border border-zinc-200 shadow-inner">
              <input 
                autoFocus
                type="number"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder={`Mais ${goal.unit}...`}
                className="flex-1 bg-transparent border-none text-zinc-900 px-3 py-2 text-sm font-bold focus:ring-0"
              />
              <button 
                type="submit"
                className="p-2 bg-red-600 text-white rounded-lg active:scale-90 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        <button 
          onClick={undoLastGoalEntry}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-[13px] font-medium transition-colors ml-1"
        >
          <Undo2 className="w-4 h-4 -scale-x-100" /> Desfazer última entrada
        </button>
      </div>

      {/* Meta Ativa Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-2.5">
             <div className="w-5 h-5 rounded-full border-2 border-red-600 flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
             </div>
             <span className="text-[13px] font-bold text-zinc-900">Meta Ativa</span>
           </div>
           {stats && (
              <span className={cn(
                "text-[9px] font-medium opacity-80",
                stats.isAhead ? "text-emerald-600" : "text-amber-600"
              )}>
                {stats.isAhead ? "adiantado" : "em atraso"}
              </span>
           )}
        </div>

        <div className="h-[3px] w-full bg-zinc-100 rounded-full overflow-hidden mb-6">
          <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${stats ? Math.min(100, stats.progressPerc) : 0}%` }}
             className="h-full bg-red-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
           <div>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Progresso</p>
             <p className="text-[14px] font-bold text-zinc-900 tracking-tight">
               {total} / {stats?.targetValue || 0} ({stats?.progressPerc || 0}%)
             </p>
           </div>
           <div>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Dias restantes</p>
             <p className="text-[14px] font-bold text-zinc-900 tracking-tight">{stats?.daysRemaining || 0}</p>
           </div>
           <div>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Ritmo necessário</p>
             <p className="text-[14px] font-bold text-zinc-900 tracking-tight">{stats?.requiredPerDay.toFixed(1) || 0} {goal.unit}/dia</p>
           </div>
           <div>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Ritmo atual</p>
             <p className="text-[14px] font-bold text-zinc-900 tracking-tight">{stats?.currentAverage.toFixed(1) || 0} {goal.unit}/dia</p>
           </div>
        </div>

        {stats?.isAhead && (
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <p className="text-sm font-bold text-red-500 flex items-center gap-2">
              +{Math.floor(stats.diff)} {goal.unit} acima da meta! 🔥
            </p>
          </div>
        )}
      </div>

      {/* Target Action */}
      <button 
        onClick={onSetTarget}
        className="w-full py-4 bg-transparent border border-zinc-200 rounded-xl flex items-center justify-center gap-3 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-all active:scale-[0.98]"
      >
        <span className="text-xl">🎯</span>
        <span className="text-sm font-bold uppercase tracking-tight">Nova Meta (encerra atual)</span>
      </button>

      {/* Chart Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8">ÚLTIMOS 7 DIAS</h3>
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? '#10B981' : '#F4F4F5'} 
                  />
                ))}
              </Bar>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 700 }}
                dy={12}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-900 text-white p-2 rounded-lg shadow-2xl">
                        <p className="text-[11px] font-bold">{payload[0].value} {goal.unit}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Records Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">REGISTROS DE HOJE</h3>
        <div className="space-y-0.5">
          {goal.entries.filter(e => isToday(parseISO(e.date))).length === 0 ? (
            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest py-8 text-center italic border border-dashed border-zinc-200 rounded-2xl">Sem registros hoje</p>
          ) : (
            [...goal.entries].filter(e => isToday(parseISO(e.date))).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-4 px-2 border-b border-zinc-100 last:border-0">
                <p className="text-[13px] font-mono text-zinc-400">{format(parseISO(entry.date), "HH:mm")}</p>
                <p className="text-lg font-bold text-red-500">+{entry.value}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

function StatusTag({ goal, large = false }: { goal: Goal; large?: boolean }) {
  const total = (goal.entries || []).reduce((acc, e) => acc + e.value, 0);
  if (!goal.currentTarget) return null;

  const now = new Date();
  const start = parseISO(goal.currentTarget.startDate);
  const end = parseISO(goal.currentTarget.endDate);
  const totalTarget = goal.currentTarget.value;
  
  const daysTotal = Math.max(1, differenceInDays(end, start));
  const daysPassed = Math.max(1, differenceInDays(now, start));
  
  const idealAccumulated = (totalTarget / daysTotal) * daysPassed;
  
  let label = "Em dia";
  let color = "text-yellow-600 bg-yellow-600/10 border-yellow-600/20";

  if (total >= totalTarget) {
    label = "concluído";
    color = "text-green-500 bg-green-500/10 border-green-500/20";
  } else if (total >= idealAccumulated * 1.15) {
    label = "adiantado";
    color = "text-blue-500 bg-blue-500/10 border-blue-500/20";
  } else if (total < idealAccumulated * 0.85) {
    label = "em atraso";
    color = "text-red-500 bg-red-500/10 border-red-500/20";
  } else {
    label = "em dia";
    color = "text-green-500 bg-green-500/10 border-green-500/20";
  }

  return (
    <span className={cn(
      "font-bold uppercase tracking-widest rounded-lg border",
      large ? "px-3 py-1.5 text-[9px]" : "px-2 py-0.5 text-[7px]",
      color
    )}>
      {label}
    </span>
  );
}
