import React, { useState, useMemo } from 'react';
import { 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subDays,
  parseISO,
  subMonths,
  addMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { Modal, cn, Button, FAB } from '../components/UI';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Settings2, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  LayoutGrid,
  Menu,
  TrendingUp,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Habit } from '../types';

// --- Helpers ---
const getISODate = (date: Date) => format(date, 'yyyy-MM-dd');

export default function Habits() {
  const { 
    habits, 
    habitCategories: rawCategories,
    addHabit, 
    deleteHabit, 
    updateHabit, 
    cycleHabitStatus,
    addHabitCategory,
    deleteHabitCategory
  } = useAppStore();

  const habitCategories = useMemo(() => {
    return Array.isArray(rawCategories) && rawCategories.length > 0 ? rawCategories : ['Shape', 'Mente'];
  }, [rawCategories]);

  const [activeCategory, setActiveCategory] = useState(habitCategories[0]);

  // Sync active category if it's no longer in the list
  React.useEffect(() => {
    if (!habitCategories.includes(activeCategory)) {
      setActiveCategory(habitCategories[0]);
    }
  }, [habitCategories, activeCategory]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✨');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingIcon, setEditingIcon] = useState('');

  // Weekly View Setup based on currentWeekStart
  const today = new Date();
  const weekDays = useMemo(() => eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  }), [currentWeekStart]);

  const navigateWeek = (direction: number) => {
    setCurrentWeekStart(prev => addDays(prev, direction * 7));
  };

  const resetToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const filteredHabits = useMemo(() => {
    return habits
      .filter(h => (h.category || 'Geral') === activeCategory)
      .sort((a, b) => a.order - b.order);
  }, [habits, activeCategory]);

  const selectedHabit = useMemo(() => {
    return habits.find(h => h.id === selectedHabitId) || null;
  }, [habits, selectedHabitId]);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit({ 
      name: newHabitName, 
      category: activeCategory,
      icon: newHabitIcon 
    });
    setNewHabitName('');
    setIsNewHabitModalOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addHabitCategory(newCategoryName);
    setActiveCategory(newCategoryName);
    setNewCategoryName('');
    setIsNewCategoryModalOpen(false);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryName.trim() || editingCategoryName === activeCategory) {
      setIsEditCategoryModalOpen(false);
      return;
    }
    useAppStore.getState().updateHabitCategory(activeCategory, editingCategoryName);
    setActiveCategory(editingCategoryName);
    setIsEditCategoryModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (selectedHabitId && editingName.trim()) {
      updateHabit(selectedHabitId, { 
        name: editingName,
        category: editingCategory,
        icon: editingIcon
      });
      setIsEditHabitModalOpen(false);
    }
  };

  return (
    <div className="pb-32 bg-[#f8f8f8] min-h-screen text-zinc-900 font-sans">
      {/* Category Tabs */}
      <header className="pt-8 px-4 border-b border-zinc-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {habitCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-t-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 border-x border-t",
                activeCategory === cat 
                  ? "bg-white border-zinc-200 text-red-600 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]" 
                  : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600"
              )}
            >
              {cat}
            </button>
          ))}
          <button 
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-zinc-200 text-zinc-300 hover:text-red-500 transition-all shrink-0 ml-2 mb-1 shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setEditingCategoryName(activeCategory);
              setIsEditCategoryModalOpen(true);
            }}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-zinc-200 text-zinc-300 hover:text-red-500 transition-all shrink-0 mb-1 shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Month/Year and Navigator */}
      <div className="mt-8 px-5 flex items-center justify-between mb-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
           {format(currentWeekStart, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={resetToToday}
            className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 mr-2"
          >
            Hoje
          </button>
          <button 
            onClick={() => navigateWeek(-1)}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-zinc-200 text-zinc-400 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigateWeek(1)}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-zinc-200 text-zinc-400 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spreadsheet Header */}
      <div className="px-4">
        <div className="grid grid-cols-[1fr_repeat(7,30px)] gap-1 mb-3 border-b border-zinc-200 pb-2">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 flex items-center pl-2">
            Hábito
          </div>
          {weekDays.map(day => (
            <div key={day.toString()} className="flex flex-col items-center">
              <span className={cn(
                "text-[7px] font-black uppercase tracking-tighter mb-0.5",
                isSameDay(day, today) ? "text-red-600" : "text-zinc-300"
              )}>
                {format(day, 'EEE', { locale: ptBR }).replace('.', '')}
              </span>
              <span className={cn(
                "text-[9px] font-black",
                isSameDay(day, today) ? "text-zinc-900" : "text-zinc-400"
              )}>
                {format(day, 'dd')}
              </span>
            </div>
          ))}
        </div>

        {/* Spreadsheet Body */}
        <div className="space-y-1">
          {filteredHabits.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
               <LayoutGrid className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300">Nenhum hábito nesta aba</p>
               <button 
                onClick={() => setIsNewHabitModalOpen(true)}
                className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest"
               >
                 + Adicionar Primeiro
               </button>
            </div>
          ) : (
            filteredHabits.map(habit => (
              <div key={habit.id} className="grid grid-cols-[1fr_repeat(7,30px)] gap-1 group">
                {/* Habit Label */}
                <div 
                  onClick={() => {
                    setSelectedHabitId(habit.id);
                    setIsDetailModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-1.5 bg-white hover:bg-zinc-50 transition-all rounded-l-xl cursor-pointer border-l-2 border-transparent hover:border-red-600 shadow-sm overflow-hidden"
                >
                  <span className="text-xs shrink-0">{habit.icon || '✨'}</span>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight leading-[1.2] line-clamp-2">
                    {habit.name}
                  </p>
                </div>

                {/* Day Blocks */}
                {weekDays.map(day => {
                  const dateStr = getISODate(day);
                  const isDone = habit.completedDates.includes(dateStr);
                  const isFail = habit.failedDates?.includes(dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => cycleHabitStatus(habit.id, dateStr)}
                      className={cn(
                        "w-7.5 h-7.5 flex items-center justify-center transition-all border border-zinc-100 rounded-sm shadow-sm",
                        isDone && "bg-emerald-50 border-emerald-100 text-emerald-600",
                        isFail && "bg-red-50 border-red-100 text-red-600",
                        !isDone && !isFail && "bg-white hover:bg-zinc-50 text-zinc-200",
                        isSameDay(day, today) && !isDone && !isFail && "bg-zinc-50 border-zinc-200 text-zinc-300"
                      )}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                      {isFail && <X className="w-3.5 h-3.5 stroke-[4]" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsNewHabitModalOpen(true)}
          className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-900/20 active:scale-90 transition-all border-4 border-[#f8f8f8]"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>
      </div>

      {/* Modals */}
      {selectedHabit && (
        <HabitDetailModal
          key={selectedHabit.id}
          isOpen={isDetailModalOpen}
          habit={selectedHabit}
          onClose={() => setIsDetailModalOpen(false)}
          onSettings={() => {
            setEditingName(selectedHabit.name);
            setEditingCategory(selectedHabit.category || 'Geral');
            setEditingIcon(selectedHabit.icon || '✨');
            setIsDetailModalOpen(false);
            setIsEditHabitModalOpen(true);
          }}
        />
      )}

      {/* New Habit Modal */}
      <Modal 
        isOpen={isNewHabitModalOpen} 
        onClose={() => setIsNewHabitModalOpen(false)} 
        title="Novo Hábito"
      >
        <form onSubmit={handleAddHabit} className="space-y-6">
          <div className="flex gap-3">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Icon</label>
                <input 
                  type="text" 
                  value={newHabitIcon}
                  onChange={(e) => setNewHabitIcon(e.target.value)}
                  className="w-14 h-14 bg-zinc-100 rounded-2xl text-center text-xl border-none focus:ring-2 focus:ring-red-500"
                />
             </div>
             <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Descrição</label>
                <input
                  autoFocus
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Ex: Beber 2L Água"
                  className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner"
                />
             </div>
          </div>
          <Button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-zinc-200">
            Adicionar à lista
          </Button>
        </form>
      </Modal>

      {/* New Category Modal */}
      <Modal 
        isOpen={isNewCategoryModalOpen} 
        onClose={() => setIsNewCategoryModalOpen(false)} 
        title="Nova Aba"
      >
        <form onSubmit={handleAddCategory} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome do Grupo</label>
            <input
              autoFocus
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Rotina Matinal"
              className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner"
            />
          </div>
          <Button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest">
            Criar Grupo
          </Button>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal 
        isOpen={isEditCategoryModalOpen} 
        onClose={() => setIsEditCategoryModalOpen(false)} 
        title="Editar Categoria"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome do Grupo</label>
            <input
              autoFocus
              type="text"
              value={editingCategoryName}
              onChange={(e) => setEditingCategoryName(e.target.value)}
              className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (habitCategories.length <= 1) {
                  alert("Você precisa ter pelo menos uma aba.");
                  return;
                }
                if (confirm(`Deseja realmente apagar a aba "${activeCategory}"? Os hábitos serão movidos para a primeira aba disponível.`)) {
                  deleteHabitCategory(activeCategory);
                  setIsEditCategoryModalOpen(false);
                }
              }}
              className="flex-1 py-4 bg-zinc-50 text-zinc-300 hover:text-red-500 border border-zinc-100 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-colors"
            >
              Apagar Aba
            </button>
            <Button type="submit" className="flex-[2] bg-zinc-900 text-white">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal 
        isOpen={isEditHabitModalOpen} 
        onClose={() => setIsEditHabitModalOpen(false)} 
        title="Configurações"
      >
        <div className="space-y-8">
          <div className="flex gap-3">
             <input 
                type="text" 
                value={editingIcon} 
                onChange={(e) => setEditingIcon(e.target.value)}
                className="w-14 h-14 bg-zinc-100 rounded-2xl text-center text-xl border-none shadow-inner"
             />
             <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="flex-1 bg-zinc-100 border-none rounded-2xl px-6 text-sm font-bold text-zinc-900 shadow-inner"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mover para Aba</label>
            <div className="grid grid-cols-2 gap-2">
              {habitCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setEditingCategory(cat)}
                  className={cn(
                    "p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                    editingCategory === cat ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-100" : "bg-zinc-50 border-zinc-100 text-zinc-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
             <button
              onClick={() => {
                if (confirm('Deletar este hábito?')) {
                  deleteHabit(selectedHabitId!);
                  setIsEditHabitModalOpen(false);
                }
              }}
              className="flex-1 py-4 bg-white text-zinc-300 hover:text-red-500 border border-zinc-100 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-colors"
            >
              Excluir
            </button>
            <Button onClick={handleSaveEdit} className="flex-[2] bg-zinc-900 text-white">
              Salvar
            </Button>
          </div>

          {habitCategories.length > 1 && (
            <button
               onClick={() => {
                 if (confirm(`Deletar a aba "${activeCategory}"?`)) {
                   deleteHabitCategory(activeCategory);
                   setActiveCategory(habitCategories.find(c => c !== activeCategory) || 'Geral');
                 }
               }}
               className="w-full text-center text-[9px] font-black text-zinc-300 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Excluir Aba Atual
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

const HabitDetailModal: React.FC<{ habit: Habit; isOpen: boolean; onClose: () => void; onSettings: () => void }> = ({ habit, isOpen, onClose, onSettings }) => {
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
      const dateStr = format(d, 'yyyy-MM-dd');
      const isDone = habit.completedDates.includes(dateStr);
      
      data.push({
        name: days[d.getDay()],
        value: isDone ? 1 : 0,
        fullDate: format(d, 'dd/MM')
      });
    }
    return data;
  }, [habit, today]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={habit.name}>
      <div className="space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar pt-2">
        <div className="flex justify-end -mt-4">
          <button 
            onClick={onSettings}
            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Weekly Chart */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Últimos 7 dias
            </h4>
          </div>
          <div className="h-24 w-full bg-zinc-50 rounded-xl p-2 border border-zinc-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${entry.fullDate}-${index}`} 
                      fill={entry.value > 0 ? '#ef4444' : '#e4e4e7'} 
                    />
                  ))}
                </Bar>
                <XAxis 
                  dataKey="fullDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val, i) => weeklyData[i]?.name || ''}
                  tick={{ fontSize: 7, fontWeight: 900, fill: '#D4D4D8' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Calendar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3" /> Histórico
            </h4>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="w-5 h-5 flex items-center justify-center bg-white border border-zinc-100 rounded-lg text-zinc-400"
              >
                <ChevronLeft className="w-2.5 h-2.5" />
              </button>
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900 w-20 text-center">
                {format(currentMonth, 'MMM yy', { locale: ptBR })}
              </span>
              <button 
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="w-5 h-5 flex items-center justify-center bg-white border border-zinc-100 rounded-lg text-zinc-400"
              >
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[7px] font-black text-zinc-300 py-0.5 uppercase">{d}</div>
            ))}
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isDone = habit.completedDates.includes(dateStr);
              const isFail = habit.failedDates?.includes(dateStr);
              const isTodayDay = isSameDay(day, today);
              
              return (
                <div 
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square rounded-lg border border-zinc-100/50 flex flex-col items-center justify-center gap-0.5 transition-all",
                    isTodayDay ? "border-red-500 bg-red-50/20" : "bg-white",
                    isDone ? "bg-emerald-50 border-emerald-100" : "",
                    isFail ? "bg-red-50 border-red-100" : ""
                  )}
                >
                  <span className={cn(
                    "text-[6px] font-black",
                    isTodayDay ? "text-red-600" : "text-zinc-200"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {isDone && <Check className="w-2 h-2 text-emerald-600 stroke-[4]" />}
                  {isFail && <X className="w-2 h-2 text-red-600 stroke-[4]" />}
                </div>
              );
            })}
          </div>
        </section>

        <button 
          onClick={onSettings}
          className="w-full py-3 bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
        >
          <Settings2 className="w-3 h-3" /> Configurações do Hábito
        </button>
      </div>
    </Modal>
  );
}
