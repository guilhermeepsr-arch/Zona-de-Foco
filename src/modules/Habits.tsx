import React, { useState, useMemo } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { 
  addDays, 
  subDays, 
  startOfDay, 
  parseISO, 
  startOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay as isSameDayDateFns, 
  subWeeks,
  isAfter,
  isBefore,
  isValid,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore } from '../store/useAppStore';
import { Card, Modal, cn, Button, FAB } from '../components/UI';
import { Plus, Trash2, Check, GripVertical, Settings2, Zap, Flame, Calendar as CalendarIcon, Info, ChevronLeft } from 'lucide-react';
import { Habit } from '../types';

// --- Helpers ---

const getISODate = (date: Date) => format(date, 'yyyy-MM-dd');

const calculateStreaks = (completedDates: string[] = []) => {
  if (!completedDates || completedDates.length === 0) return { current: 0, max: 0 };

  const uniqueSortedDates = [...new Set(completedDates)]
    .sort((a, b) => b.localeCompare(a));
  
  let current = 0;
  let max = 0;
  let tempStreak = 0;
  
  const today = getISODate(new Date());
  const yesterday = getISODate(subDays(new Date(), 1));
  
  // Check if streak is still active (completed today or yesterday)
  const isStreakActive = uniqueSortedDates[0] === today || uniqueSortedDates[0] === yesterday;
  
  for (let i = 0; i < uniqueSortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = parseISO(uniqueSortedDates[i - 1]);
      const currDate = parseISO(uniqueSortedDates[i]);
      const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        tempStreak++;
      } else {
        max = Math.max(max, tempStreak);
        tempStreak = 1;
      }
    }
    
    // If it's the first sequence and the streak is active, this is the current streak
    if (i === tempStreak - 1 && isStreakActive && current === i) {
      current = tempStreak;
    }
  }
  max = Math.max(max, tempStreak);
  
  return { current, max };
};

// --- Components ---

function HabitGrid({ completions = [] }: { completions?: string[] }) {
  const today = startOfDay(new Date());
  // We want to show 4 lines of 28 days = 112 days total
  // The first day (top-left) will be today minus 111 days
  const startDate = startOfDay(subDays(new Date(), 111));
  
  // Create 4 rows of 28 days
  const rows = [0, 1, 2, 3].map(rowIdx => {
    const rowStart = addDays(startDate, rowIdx * 28);
    return eachDayOfInterval({
      start: rowStart,
      end: addDays(rowStart, 27)
    });
  });

  return (
    <div className="flex flex-col gap-[2px] sm:gap-[3px] mt-4 overflow-hidden">
      {rows.map((days, rIdx) => (
        <div key={rIdx} className="flex gap-[2px] sm:gap-[3px]">
          {days.map((day) => {
            const dateStr = getISODate(day);
            const isCompleted = completions?.includes(dateStr) || false;
            const isTodayDay = isSameDayDateFns(day, today);
            const isFuture = isAfter(day, today);
            const isPast = isBefore(day, today) && !isTodayDay;

            return (
              <div
                key={dateStr}
                className={cn(
                  "w-[5px] h-[5px] sm:w-[8px] sm:h-[8px] rounded-[1px] sm:rounded-[1.5px] transition-all",
                  isFuture ? "bg-zinc-100/50" : 
                  isCompleted ? "bg-emerald-500" :
                  isPast ? "bg-red-500/40" : "bg-zinc-200",
                  isTodayDay && !isCompleted && "ring-1 ring-zinc-400 ring-offset-0"
                )}
                title={format(day, "dd/MM/yyyy")}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HabitItem({ 
  habit, 
  onToggle, 
  onOpenDetails,
  ...props
}: { 
  habit: Habit; 
  onToggle: (id: string) => void; 
  onOpenDetails: (habit: Habit) => void;
  key?: string;
}) {
  const controls = useDragControls();
  const completedDates = habit.completedDates || [];
  const { current: streak } = calculateStreaks(completedDates);
  const today = getISODate(new Date());
  const isTodayCompleted = completedDates.includes(today);

  return (
    <Reorder.Item
      value={habit}
      dragListener={false}
      dragControls={controls}
      className="group bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm mb-5"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 cursor-pointer" onClick={() => onOpenDetails(habit)}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">{habit.icon || '✨'}</span>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight uppercase">{habit.name}</h3>
          </div>
          {habit.motivation && (
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest ml-1 mb-2">
              {habit.motivation}
            </p>
          )}
          
          <HabitGrid completions={completedDates} />
        </div>

        <div className="flex flex-col items-center gap-2 ml-4 shrink-0">
          <button
            onClick={() => onToggle(habit.id)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
              isTodayCompleted 
                ? "bg-emerald-500 text-white border border-emerald-600 shadow-md shadow-emerald-200" 
                : "bg-white border border-zinc-200 text-zinc-200 hover:text-zinc-400"
            )}
          >
            <Check className={cn("w-6 h-6 stroke-[4]", isTodayCompleted ? "opacity-100" : "opacity-40")} />
          </button>
          <div className="flex items-center gap-1.5">
             <Flame className={cn("w-3.5 h-3.5", streak > 0 ? "text-orange-500 fill-orange-500" : "text-zinc-300")} />
             <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}


export default function Habits({ onBack }: { onBack: () => void }) {
  const { 
    habits, 
    addHabit, 
    deleteHabit, 
    updateHabit, 
    reorderHabits, 
    toggleHabit, 
    habitTemplates, 
    addHabitTemplate, 
    deleteHabitTemplate 
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitMotivation, setNewHabitMotivation] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingMotivation, setEditingMotivation] = useState('');

  const selectedHabit = useMemo(() => {
    return habits.find(h => h.id === selectedHabitId) || null;
  }, [habits, selectedHabitId]);

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => a.order - b.order);
  }, [habits]);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit({ name: newHabitName, motivation: newHabitMotivation });
    setNewHabitName('');
    setNewHabitMotivation('');
    setIsModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (selectedHabitId && editingName.trim()) {
      updateHabit(selectedHabitId, { 
        name: editingName,
        motivation: editingMotivation 
      });
    }
  };

  const streakStats = useMemo(() => {
    if (!selectedHabit) return { current: 0, max: 0 };
    return calculateStreaks(selectedHabit.completedDates || []);
  }, [selectedHabit]);

  return (
    <div className="pb-32 bg-[#f8f8f8] min-h-screen">
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10">
              <Check className="w-5 h-5 text-white stroke-[3]" />
            </div>
            <h1 className="text-xl font-black text-zinc-900 tracking-tighter">Hábitos</h1>
          </div>
        </div>
      </header>

      <Reorder.Group 
        axis="y" 
        values={sortedHabits} 
        onReorder={reorderHabits}
        className="px-4"
      >
        {sortedHabits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Info className="w-7 h-7 text-zinc-300" />
            </div>
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-[0.2em] leading-loose">
              Sua lista<br />está vazia
            </p>
          </div>
        ) : (
          sortedHabits.map((habit) => (
            <HabitItem 
              key={habit.id} 
              habit={habit} 
              onToggle={(id) => toggleHabit(id)}
              onOpenDetails={(h) => {
                setSelectedHabitId(h.id);
                setEditingName(h.name);
                setEditingMotivation(h.motivation || '');
              }}
            />
          ))
        )}
      </Reorder.Group>

      <FAB onClick={() => setIsModalOpen(true)} icon={<Plus />} color="red" />

      {/* New Habit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Hábito">
        <form onSubmit={handleAddHabit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">Nome do Hábito</label>
            <input
              autoFocus
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Ex: Ler 10 páginas"
              className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 placeholder:text-zinc-300 focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
            />
          </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">Frase de Motivação</label>
              <input
                type="text"
                value={newHabitMotivation}
                onChange={(e) => setNewHabitMotivation(e.target.value)}
                placeholder="Ex: Fique forte, não desista!"
                className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 placeholder:text-zinc-300 focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
              />
            </div>
            <Button
            type="submit"
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-zinc-200 active:scale-95 transition-transform"
          >
            Começar a Trackear
          </Button>
        </form>
      </Modal>

      {/* Quick Add Library */}
      <Modal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} title="Biblioteca">
        <div className="space-y-6">
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
            {(habitTemplates || []).length === 0 ? (
               <div className="text-center py-8 bg-zinc-100 rounded-2xl border border-zinc-200 border-dashed">
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Sua caixa está vazia</p>
               </div>
            ) : (
              (habitTemplates || []).map((template, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl group transition-all">
                  <span className="text-sm font-bold text-zinc-900">{template}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        addHabit({ name: template });
                        setIsQuickAddOpen(false);
                      }}
                      className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => deleteHabitTemplate(idx)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Criar na Biblioteca</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Ex: Treino Hiit"
                className="flex-1 bg-zinc-100 border-none text-zinc-900 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 shadow-inner"
              />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (newHabitName.trim()) {
                    addHabitTemplate(newHabitName);
                    setNewHabitName('');
                  }
                }}
                className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Habit Detail Panel */}
      {selectedHabit && (
        <Modal 
          isOpen={!!selectedHabitId} 
          onClose={() => {
            setSelectedHabitId(null);
            setIsIconPickerOpen(false);
          }} 
          title="Editar Hábito"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Ícone e Nome</label>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este hábito e todo o seu histórico?')) {
                      deleteHabit(selectedHabit.id);
                      setSelectedHabitId(null);
                    }
                  }}
                  className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  title="Excluir Hábito"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                   <div 
                     onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                     className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-xl cursor-pointer hover:bg-zinc-200 transition-colors shadow-inner"
                   >
                      {selectedHabit.icon || '✨'}
                   </div>
                   {isIconPickerOpen && (
                     <div className="absolute top-16 left-0 bg-white border border-zinc-200 shadow-xl rounded-2xl p-3 z-50 grid grid-cols-4 gap-2 w-48">
                        {['⚡️', '💰', '💧', '❤️', '🚘', '📖', '✝️', '⚛️', '🧠', '📚', '🙏🏻', '💪', '🚀', '☀️', '🍎', '🧘', '🏃', '💤', '💻', '🌱'].map(icon => (
                          <button 
                            key={icon} 
                            type="button"
                            onClick={() => {
                              updateHabit(selectedHabit.id, { icon });
                              setIsIconPickerOpen(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 rounded-lg text-lg text-zinc-900"
                          >
                            {icon}
                          </button>
                        ))}
                     </div>
                   )}
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Nome do Hábito"
                    className="w-full bg-zinc-100 border-none rounded-2xl px-4 sm:px-6 py-4 text-sm sm:text-base font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner min-w-0"
                  />
                  <input
                    type="text"
                    value={editingMotivation}
                    onChange={(e) => setEditingMotivation(e.target.value)}
                    placeholder="Frase de Motivação"
                    className="w-full bg-zinc-100 border-none rounded-2xl px-4 sm:px-6 py-4 text-sm sm:text-base font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner min-w-0"
                  />
                  <Button onClick={handleSaveEdit} className="w-full bg-zinc-900 text-white">Salvar Alterações</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 p-6 rounded-xl text-center border border-red-100 shadow-sm">
                <p className="text-3xl font-black text-red-600 mb-1 tracking-tighter">{streakStats.current}</p>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sequência Atual</p>
              </div>
              <div className="bg-white p-6 rounded-xl text-center border border-zinc-200 text-zinc-900 shadow-sm">
                <p className="text-3xl font-black text-zinc-900 mb-1 tracking-tighter">{streakStats.max}</p>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Recorde Máximo</p>
              </div>
            </div>

            <div>
               <div className="flex items-center justify-between mb-4 px-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon className="w-3 h-3" />
                    Histórico Recente
                  </label>
                  <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Jan - Dez</span>
               </div>
               <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {/* Calendar component for the last 28 days to update past days */}
                  {eachDayOfInterval({
                    start: subDays(new Date(), 27),
                    end: new Date()
                  }).map((day) => {
                    const dateStr = getISODate(day);
                    const isCompleted = (selectedHabit.completedDates || []).includes(dateStr);
                    const isTodayVal = isToday(day);
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleHabit(selectedHabit.id, dateStr)}
                        className={cn(
                          "aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all active:scale-90",
                          isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/10" : "bg-zinc-100 text-zinc-400",
                          isTodayVal && !isCompleted && "border-2 border-red-500/40"
                        )}
                      >
                        <span className="text-[7px] sm:text-[8px] font-black opacity-50 mb-0.5">{format(day, 'EEE', { locale: ptBR })}</span>
                        <span className="text-xs font-black">{format(day, 'dd')}</span>
                      </button>
                    );
                  })}
               </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

