import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  parseISO, 
  startOfWeek, 
  isSameWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  subWeeks, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  isToday,
  subDays,
  addWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { Modal, Button, cn } from '../components/UI';
import { 
  Plus, 
  Settings2, 
  Target as TargetIcon, 
  ChevronRight, 
  ChevronLeft,
  Trash2,
  RefreshCcw,
  LayoutGrid,
  TrendingUp,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Goal, GoalType } from '../types';

export default function Goals() {
  const { goals, addGoal, addGoalEntry, clearGoalEntries, deleteGoal, updateGoal } = useAppStore();
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);

  return (
    <div className="pb-32 bg-[#f8f8f8] min-h-screen text-zinc-900 font-sans">
      <header className="px-6 pt-10 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TargetIcon className="w-5 h-5 text-red-600" />
          <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Metas & Progresso</h1>
        </div>
      </header>

      <div className="px-6 space-y-3">
        {goals.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl bg-white">
            <LayoutGrid className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Nenhuma meta ativa</p>
            <button 
              onClick={() => setIsNewGoalModalOpen(true)}
              className="mt-4 text-[11px] font-black text-red-500 uppercase tracking-widest transition-all hover:scale-110"
            >
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          goals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onAdd={(val) => addGoalEntry(goal.id, val)}
              onClick={() => {
                setSelectedGoalId(goal.id);
                setIsDetailModalOpen(true);
              }}
              onSettings={() => {
                setSelectedGoalId(goal.id);
                setIsEditGoalModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsNewGoalModalOpen(true)}
          className="w-14 h-14 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-[#f8f8f8]"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* Modals */}
      <NewGoalModal 
        isOpen={isNewGoalModalOpen} 
        onClose={() => setIsNewGoalModalOpen(false)} 
        onAdd={addGoal}
      />

      {selectedGoal && (
        <>
          <GoalDetailModal
            isOpen={isDetailModalOpen}
            goal={selectedGoal}
            onClose={() => setIsDetailModalOpen(false)}
            onSettings={() => {
              setIsDetailModalOpen(false);
              setIsEditGoalModalOpen(true);
            }}
          />
          <EditGoalModal
            isOpen={isEditGoalModalOpen}
            goal={selectedGoal}
            onClose={() => setIsEditGoalModalOpen(false)}
            onUpdate={updateGoal}
            onDelete={deleteGoal}
            onReset={clearGoalEntries}
          />
        </>
      )}
    </div>
  );
}

const GoalCard: React.FC<{ goal: Goal; onAdd: (v: number) => void; onClick: () => void; onSettings: () => void }> = ({ goal, onAdd, onClick, onSettings }) => {
  const [inputValue, setInputValue] = useState('');
  
  const stats = useMemo(() => calculateGoalStats(goal), [goal]);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      onAdd(val);
      setInputValue('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-3 shadow-sm border border-zinc-100 flex items-center gap-3 cursor-pointer hover:border-red-100 transition-all group"
    >
      {/* Icon */}
      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105">
        {goal.icon || '🎯'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-900 truncate mb-0.5">
          {goal.name}
        </h3>
        <div className="flex flex-col gap-0">
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 leading-none">
            <span className="text-zinc-900">{stats.displayValue}</span>
            <span className="text-[8px]">/ {goal.target || '-'} {goal.unit}</span>
          </p>
          {stats.secondaryInfo && (
            <p className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter mt-1">
              {stats.secondaryInfo}
            </p>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <input 
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="0"
          className="w-12 h-9 bg-zinc-100 border-none rounded-xl text-center text-xs font-black text-zinc-900 focus:ring-1 focus:ring-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleAction}
          className="h-9 px-3 bg-zinc-900 text-white text-[8px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm"
        >
          {goal.type === 'cumulative' ? 'Add' : 'Set'}
        </button>
      </div>
    </motion.div>
  );
};

function calculateGoalStats(goal: Goal) {
  const entries = goal.entries || [];
  
  if (goal.type === 'cumulative') {
    const total = entries.reduce((acc, e) => acc + e.value, 0);
    return {
      displayValue: total.toLocaleString(),
      secondaryInfo: null
    };
  } else {
    const now = new Date();
    const currentWeekEntries = entries.filter(e => isSameWeek(parseISO(e.date), now, { weekStartsOn: 1 }));
    const lastWeekEntries = entries.filter(e => isSameWeek(parseISO(e.date), subWeeks(now, 1), { weekStartsOn: 1 }));
    
    const currentAvg = currentWeekEntries.length > 0 
      ? currentWeekEntries.reduce((acc, e) => acc + e.value, 0) / currentWeekEntries.length 
      : (entries.length > 0 ? entries[entries.length - 1].value : goal.initialValue || 0);
      
    const lastAvg = lastWeekEntries.length > 0
      ? lastWeekEntries.reduce((acc, e) => acc + e.value, 0) / lastWeekEntries.length
      : goal.initialValue || 0;

    const diffWeek = currentAvg - lastAvg;
    const diffStart = currentAvg - (goal.initialValue || 0);

    const progressText = `Sem: ${diffWeek >= 0 ? '+' : ''}${diffWeek.toFixed(1)} | Tot: ${diffStart >= 0 ? '+' : ''}${diffStart.toFixed(1)}`;

    return {
      displayValue: currentAvg.toFixed(1),
      secondaryInfo: progressText
    };
  }
}

function GoalDetailModal({ goal, isOpen, onClose, onSettings }: { goal: Goal; isOpen: boolean; onClose: () => void; onSettings: () => void }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weeklyData = useMemo(() => {
    const data = [];
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dayEntries = goal.entries.filter(e => isSameDay(parseISO(e.date), d));
      const value = goal.type === 'cumulative'
        ? dayEntries.reduce((acc, e) => acc + e.value, 0)
        : (dayEntries.length > 0 ? dayEntries[dayEntries.length - 1].value : 0);
      
      data.push({
        name: days[d.getDay()],
        value,
        fullDate: format(d, 'dd/MM')
      });
    }
    return data;
  }, [goal]);

  const getDayTotal = (day: Date) => {
    const dayEntries = goal.entries.filter(e => isSameDay(parseISO(e.date), day));
    if (goal.type === 'cumulative') {
      const sum = dayEntries.reduce((acc, e) => acc + e.value, 0);
      return sum > 0 ? sum : null;
    } else {
      return dayEntries.length > 0 ? dayEntries[dayEntries.length - 1].value : null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal.name}>
      <div className="space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar pt-2">
        
        {/* Weekly Chart */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Últimos 7 dias
            </h4>
          </div>
          <div className="h-32 w-full bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > 0 ? '#ef4444' : '#e4e4e7'} 
                    />
                  ))}
                </Bar>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#A1A1AA' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 text-white px-2 py-1 rounded text-[9px] font-black">
                          {payload[0].value} {goal.unit}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Monthly Calendar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3" /> Histórico
            </h4>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(prev => subWeeks(prev, 4))}
                className="w-5 h-5 flex items-center justify-center bg-white border border-zinc-100 rounded-lg text-zinc-400"
              >
                <ChevronLeft className="w-2.5 h-2.5" />
              </button>
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900 w-20 text-center">
                {format(currentMonth, 'MMM yy', { locale: ptBR })}
              </span>
              <button 
                onClick={() => setCurrentMonth(prev => addWeeks(prev, 4))}
                className="w-5 h-5 flex items-center justify-center bg-white border border-zinc-100 rounded-lg text-zinc-400"
              >
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <div key={d} className="text-center text-[7px] font-black text-zinc-300 py-0.5 uppercase">{d}</div>
            ))}
            {daysInMonth.map((day) => {
              const total = getDayTotal(day);
              const isTodayDay = isToday(day);
              
              return (
                <div 
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square rounded-lg border border-zinc-100/50 flex flex-col items-center justify-center gap-0.5 transition-all",
                    isTodayDay ? "border-red-500 bg-red-50/20" : "bg-white",
                    total ? "bg-red-50" : ""
                  )}
                >
                  <span className={cn(
                    "text-[6px] font-black",
                    isTodayDay ? "text-red-600" : "text-zinc-200"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {total !== null && (
                    <span className="text-[7px] font-black text-zinc-900 leading-none">
                      {total}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <button 
          onClick={onSettings}
          className="w-full py-3 bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
        >
          <Settings2 className="w-3 h-3" /> Preferências
        </button>
      </div>
    </Modal>
  );
}

function NewGoalModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (g: any) => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [unit, setUnit] = useState('');
  const [type, setType] = useState<GoalType>('cumulative');
  const [target, setTarget] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;

    onAdd({
      name,
      icon,
      unit,
      type,
      target: target ? parseFloat(target) : undefined,
      initialValue: initialValue ? parseFloat(initialValue) : undefined,
      direction,
      entries: []
    });

    setName('');
    setIcon('🎯');
    setUnit('');
    setTarget('');
    setInitialValue('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Meta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Icon</label>
            <input 
              type="text" 
              value={icon} 
              onChange={(e) => setIcon(e.target.value)}
              className="w-10 h-10 bg-zinc-100 rounded-xl text-center text-base border-none focus:ring-1 focus:ring-red-500 shadow-inner"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Peso"
              className="w-full h-10 bg-zinc-100 border-none rounded-xl px-4 text-[10px] font-bold text-zinc-900 shadow-inner focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Unidade</label>
            <input 
              type="text" 
              required
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-9 bg-zinc-100 border-none rounded-xl px-3 text-[9px] font-bold text-zinc-900 shadow-inner"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Alvo</label>
            <input 
              type="number" 
              value={target} 
              onChange={(e) => setTarget(e.target.value)}
              className="w-full h-9 bg-zinc-100 border-none rounded-xl px-3 text-[9px] font-bold text-zinc-900 shadow-inner"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('cumulative')}
              className={cn(
                "py-2 px-2 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all",
                type === 'cumulative' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-400 border-zinc-100"
              )}
            >
              Acumulada
            </button>
            <button
              type="button"
              onClick={() => setType('tracking')}
              className={cn(
                "py-2 px-2 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all",
                type === 'tracking' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-400 border-zinc-100"
              )}
            >
              Evolução
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full py-3.5 text-[9px] font-black uppercase tracking-[0.2em] mt-2">
           Criar Meta
        </Button>
      </form>
    </Modal>
  );
}

function EditGoalModal({ goal, isOpen, onClose, onUpdate, onDelete, onReset }: { 
  goal: Goal; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdate: (id: string, d: any) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [name, setName] = useState(goal.name);
  const [icon, setIcon] = useState(goal.icon || '🎯');
  const [unit, setUnit] = useState(goal.unit);
  const [target, setTarget] = useState(goal.target?.toString() || '');
  const [description, setDescription] = useState(goal.description || '');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(goal.id, {
      name,
      icon,
      unit,
      target: target ? parseFloat(target) : undefined,
      description
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar">
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={icon} 
            onChange={(e) => setIcon(e.target.value)}
            className="w-10 h-10 bg-zinc-100 rounded-xl text-center text-base border-none shadow-inner"
          />
          <input 
            type="text" 
            required
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-zinc-100 border-none rounded-xl px-4 text-[10px] font-bold text-zinc-900 shadow-inner"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Unidade</label>
            <input 
              type="text" 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              className="bg-zinc-100 border-none rounded-xl px-3 py-2 text-[9px] font-bold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Alvo</label>
            <input 
              type="number" 
              value={target} 
              onChange={(e) => setTarget(e.target.value)}
              className="bg-zinc-100 border-none rounded-xl px-3 py-2 text-[9px] font-bold"
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Apagar registros?')) {
                  onReset(goal.id);
                  onClose();
                }
              }}
              className="flex-1 py-2.5 bg-zinc-50 text-zinc-400 text-[7px] font-black uppercase tracking-widest border border-zinc-100 rounded-xl"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Excluir?')) {
                  onDelete(goal.id);
                  onClose();
                }
              }}
              className="flex-1 py-2.5 bg-zinc-50 text-zinc-400 text-[7px] font-black uppercase tracking-widest border border-zinc-100 rounded-xl"
            >
              Excluir
            </button>
          </div>
          <Button type="submit" className="w-full py-3.5 text-[9px] font-black uppercase tracking-widest">
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
