import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Square, Plus, Trash2, History, Timer as TimerIcon, ChevronLeft, Save, BookOpen, Clock, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../components/UI';
import { format, startOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TimerProps {
  onBack: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
  '#64748b', // slate
];

export default function Timer({ onBack }: TimerProps) {
  const { 
    studySubjects, addStudySubject, deleteStudySubject, updateStudySubject,
    timerSessions, deleteTimerSession, addManualSession,
    activeTimer, startTimer, pauseTimer, resumeTimer, saveTimer, cancelTimer
  } = useAppStore();

  const [view, setView] = useState<'main' | 'setup' | 'history' | 'subjects' | 'manual' | 'stats'>('main');
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(PRESET_COLORS[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [displayTime, setDisplayTime] = useState(0);

  // Manual entry states
  const [manualSubject, setManualSubject] = useState('');
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualHours, setManualHours] = useState('0');
  const [manualMins, setManualMins] = useState('0');

  // Update display time every second
  useEffect(() => {
    let interval: number | undefined;

    const updateDisplay = () => {
      if (activeTimer) {
        if (activeTimer.startTime) {
          const now = new Date();
          const start = new Date(activeTimer.startTime);
          const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
          setDisplayTime(activeTimer.elapsedTime + diff);
        } else {
          setDisplayTime(activeTimer.elapsedTime);
        }
      } else {
        setDisplayTime(0);
      }
    };

    updateDisplay(); // initial update

    if (activeTimer && activeTimer.startTime) {
      interval = window.setInterval(updateDisplay, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleStart = () => {
    if (!selectedSubject) return;
    startTimer(selectedSubject, notes);
    setView('main');
    setNotes('');
  };

  const handleManualSave = () => {
    if (!manualSubject) return;
    const duration = (parseInt(manualHours) || 0) * 3600 + (parseInt(manualMins) || 0) * 60;
    if (duration <= 0) return;

    addManualSession({
      subject: manualSubject,
      duration,
      date: new Date(manualDate + 'T12:00:00').toISOString(),
      notes: 'Registro Manual'
    });
    setView('history');
  };

  const sessionsByDate = timerSessions.reduce((acc, session) => {
    const date = session.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof timerSessions>);

  // Statistics
  const subjectStats = useMemo(() => {
    const stats: Record<string, { duration: number, color: string }> = {};
    
    // Initialize with all subjects to show 0 if no sessions
    studySubjects.forEach(s => {
      stats[s.name] = { duration: 0, color: s.color };
    });

    timerSessions.forEach(session => {
      if (!stats[session.subject]) {
        // Fallback for subjects that might have been deleted but exist in history
        stats[session.subject] = { duration: 0, color: '#e4e4e7' };
      }
      stats[session.subject].duration += session.duration;
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        value: data.duration,
        color: data.color
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [timerSessions, studySubjects]);

  const totalStudyTime = timerSessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-xl">
            <TimerIcon className="w-5 h-5 text-red-600" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 italic">Cronômetro</h1>
        </div>
        {!activeTimer && (
          <div className="flex gap-1">
            <button 
              onClick={() => setView('stats')}
              className={cn("p-2 rounded-xl transition-colors", view === 'stats' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}
              title="Estatísticas"
            >
              <PieChartIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('history')}
              className={cn("p-2 rounded-xl transition-colors", view === 'history' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}
              title="Histórico"
            >
              <History className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('subjects')}
              className={cn("p-2 rounded-xl transition-colors", view === 'subjects' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}
              title="Matérias"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {activeTimer ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Estudando agora</span>
              <h2 className="text-3xl font-normal text-zinc-900 italic">{activeTimer.subject}</h2>
              {activeTimer.notes && (
                <p className="text-sm text-zinc-500 mt-2 max-w-[200px] line-clamp-2 italic">“{activeTimer.notes}”</p>
              )}
            </div>

            <div className="relative mb-16">
              <div className="text-[64px] font-mono font-black tracking-tighter text-zinc-900 lining-nums tabular-nums">
                {formatTime(displayTime)}
              </div>
              <div className="absolute -top-4 -right-4">
                <motion.div 
                  animate={activeTimer.startTime ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn("w-3 h-3 rounded-full", activeTimer.startTime ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-zinc-300")}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={cancelTimer}
                className="w-14 h-14 rounded-full border-2 border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Cancelar"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={activeTimer.startTime ? pauseTimer : resumeTimer}
                className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform"
              >
                {activeTimer.startTime ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={saveTimer}
                className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                title="Salvar"
              >
                <Save className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pt-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setView('main')} className="p-1 -ml-1 text-zinc-400">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-zinc-900">Histórico</h3>
                  </div>
                  <button 
                    onClick={() => setView('manual')}
                    className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-lg"
                  >
                    <Plus className="w-3 h-3" /> Manual
                  </button>
                </div>

                {Object.keys(sessionsByDate).length === 0 ? (
                  <div className="text-center py-20 text-zinc-400 italic">
                    Nenhum registro ainda.
                  </div>
                ) : (
                  Object.entries(sessionsByDate)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, sessions]) => (
                      <div key={date} className="mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-2">
                          {format(new Date(date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </h4>
                        <div className="space-y-2">
                          {sessions.map((session) => {
                            const subject = studySubjects.find(s => s.name === session.subject);
                            return (
                              <div key={session.id} className="p-4 bg-white rounded-2xl border border-zinc-100 flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: subject?.color || '#e4e4e7' }} />
                                  <div>
                                    <h5 className="font-normal text-zinc-900 italic text-sm">{session.subject}</h5>
                                    {session.notes && <p className="text-[10px] text-zinc-500 italic mt-0.5">{session.notes}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-sm font-mono font-black text-zinc-900">
                                      {formatDuration(session.duration)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => deleteTimerSession(session.id)}
                                    className="p-1.5 bg-zinc-50 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                )}
              </motion.div>
            ) : view === 'stats' ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pt-4"
              >
                <div className="flex items-center gap-2 mb-8">
                  <button onClick={() => setView('main')} className="p-1 -ml-1 text-zinc-400">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-zinc-900">Distribuição de Estudos</h3>
                </div>

                {subjectStats.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400 italic">
                    Sem dados para exibir o gráfico.
                  </div>
                ) : (
                  <>
                    <div className="h-[280px] w-full mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subjectStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {subjectStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border border-zinc-100 rounded-xl shadow-xl">
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-1 leading-none">{payload[0].name}</p>
                                    <p className="text-sm font-mono font-black text-red-600 leading-none">{formatDuration(Number(payload[0].value))}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {subjectStats.map((stat) => (
                        <div key={stat.name} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                            <span className="text-sm font-bold text-zinc-700 uppercase italic leading-none">{stat.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-black text-zinc-900 leading-none">{formatDuration(stat.value)}</div>
                            <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-bold">
                              {((stat.value / totalStudyTime) * 100).toFixed(1)}% do total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            ) : view === 'subjects' ? (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pt-4"
              >
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setView('main')} className="p-1 -ml-1 text-zinc-400">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-zinc-900">Gerenciar Matérias</h3>
                </div>

                <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden mb-8">
                  <div className="p-4 border-b border-zinc-50">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Nome da matéria..."
                      className="w-full px-0 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold uppercase italic placeholder:text-zinc-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Escolha uma cor</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewSubjectColor(color)}
                          className={cn(
                            "w-8 h-8 rounded-full transition-transform active:scale-95 border-2",
                            newSubjectColor === color ? "border-zinc-900 scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (newSubject.trim()) {
                        addStudySubject(newSubject.trim(), newSubjectColor);
                        setNewSubject('');
                      }
                    }}
                    className="w-full py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all"
                  >
                    Adicionar Matéria
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">Matérias Existentes</p>
                  {studySubjects.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 italic bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                      Nenhuma matéria cadastrada.
                    </div>
                  ) : (
                    studySubjects.map((subject) => {
                      const totalTime = timerSessions
                        .filter(s => s.subject === subject.name)
                        .reduce((acc, current) => acc + current.duration, 0);

                      return (
                        <div key={subject.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: subject.color }} />
                            <div>
                              <span className="font-normal text-zinc-700 italic text-sm leading-none block mb-1">{subject.name}</span>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block leading-none">
                                {totalTime > 0 ? `Total: ${formatDuration(totalTime)}` : 'Sem registros'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteStudySubject(subject.id)}
                            className="p-2 text-zinc-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            ) : view === 'manual' ? (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pt-4"
              >
                <div className="flex items-center gap-2 mb-8">
                  <button onClick={() => setView('history')} className="p-1 -ml-1 text-zinc-400">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-zinc-900">Registro Manual</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block px-1">
                      Matéria
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                       {studySubjects.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setManualSubject(s.name)}
                          className={cn(
                            "px-4 py-4 rounded-xl border transition-all text-left flex items-center gap-3",
                            manualSubject === s.name 
                              ? "bg-zinc-900 border-zinc-900 text-white" 
                              : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-200"
                          )}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-normal italic text-sm">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block px-1">
                        Data
                      </label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full px-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block px-1">
                        Duração
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={manualHours}
                            onChange={(e) => setManualHours(e.target.value)}
                            className="w-full px-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-mono pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">H</span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={manualMins}
                            onChange={(e) => setManualMins(e.target.value)}
                            className="w-full px-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-mono pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">M</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleManualSave}
                    disabled={!manualSubject || (parseInt(manualHours) === 0 && parseInt(manualMins) === 0)}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                  >
                    Salvar Registro Manual
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : view === 'setup' ? (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pt-4"
              >
                <div className="flex items-center gap-2 mb-8">
                  <button onClick={() => setView('main')} className="p-1 -ml-1 text-zinc-400">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-zinc-900">Configurar Sessão</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block px-1">
                      O que você vai estudar?
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {studySubjects.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSubject(s.name)}
                          className={cn(
                            "px-4 py-4 rounded-2xl border transition-all text-left group relative flex items-center gap-3",
                            selectedSubject === s.name 
                              ? "bg-red-50 border-red-200 text-red-900" 
                              : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-200 shadow-sm"
                          )}
                        >
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-normal italic text-sm">{s.name}</span>
                          {selectedSubject === s.name && (
                            <motion.div layoutId="check" className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-600" />
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setView('subjects')}
                        className="p-4 rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-400 hover:text-zinc-600 hover:border-zinc-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Nova Matéria</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block px-1">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Resolver lista de exercícios..."
                      className="w-full px-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 text-sm italic resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleStart}
                    disabled={!selectedSubject}
                    className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-3"
                  >
                    Começar Estudo Focado
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full pt-10"
              >
                <div className="w-48 h-48 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-8 relative group">
                  <div className="absolute inset-0 rounded-full bg-red-500/5 scale-0 group-hover:scale-100 transition-transform duration-500" />
                  <Clock className="w-20 h-20 text-zinc-200 group-hover:text-red-100 transition-colors" strokeWidth={1} />
                </div>
                
                <h2 className="text-2xl font-black text-zinc-900 text-center mb-2 italic uppercase">Estudo Focado</h2>
                <p className="text-sm text-zinc-500 text-center max-w-[240px] mb-12">
                  Prepare o material, escolha a matéria e inicie seu ciclo de alta performance.
                </p>

                <button
                  onClick={() => setView('setup')}
                  className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-sm shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center gap-3"
                >
                  Novo Ciclo
                  <Play className="w-5 h-5 fill-current" />
                </button>

                <div className="mt-12 w-full max-w-[280px]">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recentes</span>
                    <button onClick={() => setView('history')} className="text-[10px] font-black uppercase tracking-widest text-red-600">Ver todos</button>
                  </div>
                  <div className="space-y-3">
                    {timerSessions.slice(0, 2).map(session => (
                      <div key={session.id} className="p-4 bg-white rounded-2xl flex items-center justify-between border border-zinc-100 shadow-sm">
                        <span className="text-xs font-normal italic text-zinc-700">{session.subject}</span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                    ))}
                    {timerSessions.length === 0 && (
                      <div className="p-4 bg-white border-2 border-dashed border-zinc-100 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-zinc-300">
                        Nenhum registro
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
