/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { differenceInDays, parseISO, startOfDay, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Modal, ProgressBar, cn } from '../components/UI';
import { Plus, Trash2, Undo2, TrendingUp, AlertCircle, CheckCircle2, ArrowLeft, Edit2, History, Target, Calendar, Clock } from 'lucide-react';
import { Goal, GoalEntry, GoalTarget } from '../types';

export default function Goals() {
  const { goals, addGoal, addGoalEntry, undoLastGoalEntry, deleteGoal, updateGoal } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // New Goal Form
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [icon, setIcon] = useState('🎯');

  // New Target Form
  const [targetValue, setTargetValue] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');

  const selectedGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoalId);
  }, [goals, selectedGoalId]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;
    addGoal({
      name,
      unit,
      icon,
    });
    setName('');
    setUnit('');
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
    <div className="pb-32 bg-[#080808] min-h-screen">
      <header className="px-6 pt-10 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <Target className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">Metas</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2.5 bg-[#111111] rounded-xl border border-white/5 hover:bg-zinc-900 transition-all shadow-xl"
        >
          <Plus className="w-5 h-5 text-zinc-300" />
        </button>
      </header>

      <div className="px-6 space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-2xl border border-white/5 shadow-2xl">
            <p className="text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">Sem metas criadas</p>
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">Clique no + para começar</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id}>
              <GoalMiniCard 
                goal={goal} 
                onAdd={(val) => addGoalEntry(goal.id, val)}
                onClick={() => setSelectedGoalId(goal.id)}
              />
            </div>
          ))
        )}
      </div>

      {/* Create Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta/Contador">
        <form onSubmit={handleAddGoal} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Ícone</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-zinc-900 border-none text-white rounded-xl px-2 py-4 text-center text-xl shadow-inner focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Nome</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Flexões, Copos d'água"
                className="w-full bg-zinc-900 border-none text-white rounded-xl px-6 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Unidade</label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: reps, litros, km"
              className="w-full bg-zinc-900 border-none text-white rounded-xl px-6 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
          </div>
          <Button type="submit" className="w-full py-5 text-xs font-black uppercase tracking-widest">Criar Meta</Button>
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
        <form onSubmit={handleSetTarget} className="space-y-6">
          <p className="text-[10px] text-zinc-500 font-bold leading-relaxed px-1">
            {selectedGoal?.currentTarget 
              ? "Ao definir um novo alvo, o progresso atual será arquivado no histórico e um novo ciclo começará." 
              : "Defina um objetivo numérico e uma data limite para acompanhar seu ritmo."}
          </p>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Quantidade do Alvo</label>
            <input
              type="number"
              required
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-zinc-900 border-none text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
              placeholder="Ex: 500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Data Final</label>
            <input
              type="date"
              required
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
              className="w-full bg-zinc-900 border-none text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
          </div>
          <Button type="submit" className="w-full py-5 text-xs font-black uppercase tracking-widest">
            {selectedGoal?.currentTarget ? "Iniciar Novo Ciclo" : "Confirmar Alvo"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function GoalMiniCard({ goal, onAdd, onClick }: { goal: Goal; onAdd: (val: number) => void; onClick: () => void }) {
  const [quickValue, setQuickValue] = useState('');
  const total = (goal.entries || []).reduce((acc, e) => acc + e.value, 0);
  
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!quickValue || isNaN(parseFloat(quickValue))) return;
    onAdd(parseFloat(quickValue));
    setQuickValue('');
  };

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "p-5 bg-[#111111] border border-white/5 rounded-xl shadow-xl group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative",
        goal.currentTarget && "pb-6"
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-xl shadow-inner">
            {goal.icon || '🎯'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{goal.name}</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{goal.unit}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white tracking-tighter leading-none">{total}</p>
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Acumulado</p>
        </div>
      </div>

      <div className="flex gap-2 mb-2" onClick={e => e.stopPropagation()}>
        <input 
          type="number"
          value={quickValue}
          onChange={e => setQuickValue(e.target.value)}
          placeholder={`Add ${goal.unit}...`}
          className="flex-1 bg-zinc-950 border-none text-white rounded-lg px-4 py-2.5 text-xs font-bold shadow-inner focus:ring-1 focus:ring-red-600"
          onClick={e => e.stopPropagation()}
        />
        <button 
          onClick={handleQuickAdd}
          className="px-4 py-2.5 bg-red-600 text-white rounded-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {goal.currentTarget && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-end mb-2 px-1">
            <div className="flex items-center gap-2">
              <StatusTag goal={goal} />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
               {total}/{goal.currentTarget.value} {goal.unit} ({Math.round((total/goal.currentTarget.value) * 100)}%)
            </span>
          </div>
          <ProgressBar progress={(total/goal.currentTarget.value) * 100} color="red" />
        </div>
      )}
    </Card>
  );
}

function GoalPane({ goal, onClose, onSetTarget }: { goal: Goal; onClose: () => void; onSetTarget: () => void }) {
  const { addGoalEntry, undoLastGoalEntry, deleteGoal, updateGoal } = useAppStore();
  const [addValue, setAddValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editIcon, setEditIcon] = useState(goal.icon || '🎯');
  const [editUnit, setEditUnit] = useState(goal.unit);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const total = useMemo(() => (goal.entries || []).reduce((acc, e) => acc + e.value, 0), [goal.entries]);
  
  const stats = useMemo(() => {
    if (!goal.currentTarget) return null;
    const now = new Date();
    const start = parseISO(goal.currentTarget.startDate);
    const end = parseISO(goal.currentTarget.endDate);
    
    const daysTotal = Math.max(1, differenceInDays(end, start));
    const daysRemaining = Math.max(0, differenceInDays(end, now));
    const daysPassed = Math.max(1, differenceInDays(now, start));

    const totalTarget = goal.currentTarget.value;
    const requiredPerDay = daysRemaining > 0 ? (totalTarget - total) / daysRemaining : 0;
    const currentAverage = total / daysPassed;
    
    const idealAccumulated = (totalTarget / daysTotal) * daysPassed;
    const progress = (total / totalTarget) * 100;

    return {
      daysRemaining,
      requiredPerDay: Math.max(0, requiredPerDay),
      currentAverage,
      idealAccumulated,
      progress
    };
  }, [goal, total]);

  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValue || isNaN(parseFloat(addValue))) return;
    addGoalEntry(goal.id, parseFloat(addValue));
    setAddValue('');
  };

  const handleSaveEdit = () => {
    updateGoal(goal.id, { 
      name: editName,
      icon: editIcon,
      unit: editUnit
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 pb-4">
      {/* Pane Header */}
      <div className="flex items-center justify-between -mt-2">
        <button onClick={onClose} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 px-4">
           {isEditing ? (
             <div className="flex flex-col gap-3">
               <div className="flex gap-2 items-center">
                 <div className="relative">
                   <button 
                     onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                     className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-lg shadow-inner border border-white/5"
                   >
                     {editIcon}
                   </button>
                   {isIconPickerOpen && (
                     <div className="absolute top-12 left-0 bg-[#1a1a1a] border border-white/10 shadow-2xl rounded-xl p-3 z-50 grid grid-cols-4 gap-2 w-48 animate-in fade-in zoom-in duration-200">
                        {['🎯', '💧', '🏃', '📚', '💪', '💰', '🔥', '⭐️', '🍎', '🧘', '⚡️', '🚲', '🏋️', '🏊', '🥊', '🥗', '☕️', '🛌', '💻', '🌱'].map(emoji => (
                          <button 
                            key={emoji} 
                            type="button"
                            onClick={() => {
                              setEditIcon(emoji);
                              setIsIconPickerOpen(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded-lg text-lg transition-colors border border-transparent hover:border-white/5"
                          >
                            {emoji}
                          </button>
                        ))}
                     </div>
                   )}
                 </div>
                 <input 
                   autoFocus
                   value={editName}
                   onChange={(e) => setEditName(e.target.value)}
                   placeholder="Nome da meta"
                   className="bg-zinc-900 border-none text-white font-black uppercase text-xs px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-red-600 flex-1"
                 />
               </div>
               <div className="flex gap-2">
                 <input 
                   value={editUnit}
                   onChange={(e) => setEditUnit(e.target.value)}
                   placeholder="Unidade (ex: kg, reps)"
                   className="bg-zinc-900 border-none text-zinc-400 font-bold text-[10px] px-3 py-2 rounded-lg focus:ring-1 focus:ring-red-600 flex-1"
                 />
                 <button onClick={handleSaveEdit} className="px-3 bg-white text-black rounded-lg font-black text-[10px] uppercase">Salvar</button>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center">
               <div className="flex items-center justify-center gap-2">
                 <span className="text-xl">{goal.icon}</span>
                 <h2 className="text-sm font-black text-white uppercase tracking-widest">{goal.name}</h2>
               </div>
               <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{goal.unit}</p>
             </div>
           )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setIsIconPickerOpen(false);
              } else {
                setIsEditing(true);
              }
            }} 
            className={cn("p-2 transition-colors", isEditing ? "text-white" : "text-zinc-600 hover:text-white")}
          >
            <Edit2 className="w-5 h-5" />
          </button>
          
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-300">
              <button 
                onClick={() => setIsConfirmingDelete(false)}
                className="p-2 text-zinc-500 hover:text-white text-[8px] font-black uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  deleteGoal(goal.id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20"
              >
                Confirmar
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfirmingDelete(true)} 
              className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Target Stats Section */}
      {goal.currentTarget && stats && (
        <div className="bg-[#111111] rounded-xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <StatusTag goal={goal} large />
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-end mb-3 px-1">
               <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Alvo Progresso</span>
               <span className="text-xs font-mono text-white font-black">{total} / {goal.currentTarget.value} {goal.unit}</span>
            </div>
            <ProgressBar progress={stats.progress} color="red" />
          </div>

          <div className="grid grid-cols-2 gap-y-8 gap-x-6">
            <StatItem label="Ritmo Necessário" value={`${stats.requiredPerDay.toFixed(1)} ${goal.unit}/dia`} />
            <StatItem label="Média Atual" value={`${stats.currentAverage.toFixed(1)} ${goal.unit}/dia`} />
            <StatItem label="Dias Restantes" value={`${stats.daysRemaining} dias`} />
            <StatItem label="Progresso" value={`${Math.round(stats.progress)}%`} />
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="space-y-4">
        <div className="bg-zinc-900/30 rounded-xl p-6 border border-white/5">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-6 text-center">Registrar Progresso</p>
          <form onSubmit={handleAddValue} className="flex gap-2">
            <input
              type="number"
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              placeholder={`Quantos ${goal.unit} hoje?`}
              className="flex-1 bg-zinc-950 border-none text-white rounded-lg px-6 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-red-600"
            />
            <button 
              type="submit"
              className="w-14 h-14 bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
            >
              <Plus className="w-7 h-7" />
            </button>
          </form>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={undoLastGoalEntry}
              className="flex-1 py-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg border border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Undo2 className="w-4 h-4" /> Desfazer Última
            </button>
            <button 
              onClick={onSetTarget}
              className="flex-1 py-4 bg-red-600/10 hover:bg-red-600 rounded-lg border border-red-600/20 text-[10px] font-black text-red-500 hover:text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Target className="w-4 h-4" /> {goal.currentTarget ? "Novo Alvo" : "Criar Alvo"}
            </button>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4 px-2">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Registros Recentes</h3>
           <History className="w-4 h-4 text-zinc-800" />
        </div>
        <div className="space-y-2">
          {goal.entries.length === 0 ? (
            <p className="text-[10px] text-zinc-800 font-bold uppercase tracking-widest py-8 text-center italic">Nenhum registro encontrado</p>
          ) : (
            [...goal.entries].reverse().slice(0, 15).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-zinc-900/50 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">+{entry.value} {goal.unit}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[9px] font-mono text-zinc-600 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {format(parseISO(entry.date), "dd MMM", { locale: ptBR })}
                       </span>
                       <span className="text-[9px] font-mono text-zinc-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {format(parseISO(entry.date), "HH:mm")}
                       </span>
                    </div>
                  </div>
                </div>
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
      <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-black text-white tracking-tight">{value}</p>
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
    label = "Concluído";
    color = "text-green-500 bg-green-500/10 border-green-500/20";
  } else if (total >= idealAccumulated * 1.15) {
    label = "Adiantado";
    color = "text-blue-500 bg-blue-500/10 border-blue-500/20";
  } else if (total < idealAccumulated * 0.85) {
    label = "Atrasado";
    color = "text-red-500 bg-red-500/10 border-red-500/20";
  } else {
    label = "Em dia";
    color = "text-green-500 bg-green-500/10 border-green-500/20";
  }

  return (
    <span className={cn(
      "font-black uppercase tracking-widest rounded-lg border",
      large ? "px-3 py-1.5 text-[9px]" : "px-2 py-0.5 text-[7px]",
      color
    )}>
      {label}
    </span>
  );
}
