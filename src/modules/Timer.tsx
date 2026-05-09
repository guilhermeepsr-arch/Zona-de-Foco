import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Plus, Trash2, History, Timer as TimerIcon, ChevronLeft, Save, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../components/UI';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimerProps {
  onBack: () => void;
}

export default function Timer({ onBack }: TimerProps) {
  const { 
    studySubjects, addStudySubject, deleteStudySubject,
    timerSessions, deleteTimerSession,
    activeTimer, startTimer, pauseTimer, resumeTimer, saveTimer, cancelTimer
  } = useAppStore();

  const [view, setView] = useState<'main' | 'setup' | 'history' | 'subjects'>('main');
  const [newSubject, setNewSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [displayTime, setDisplayTime] = useState(0);

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

  const handleStart = () => {
    if (!selectedSubject) return;
    startTimer(selectedSubject, notes);
    setView('main');
    setNotes('');
  };

  const sessionsByDate = timerSessions.reduce((acc, session) => {
    const date = session.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof timerSessions>);

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
        <div className="flex gap-2">
          <button 
            onClick={() => setView('history')}
            className={cn("p-2 rounded-xl transition-colors", view === 'history' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('subjects')}
            className={cn("p-2 rounded-xl transition-colors", view === 'subjects' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
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
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setView('main')} className="p-1 -ml-1 text-zinc-400">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-zinc-900">Histórico de Estudos</h3>
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
                          {sessions.map((session) => (
                            <div key={session.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between group">
                              <div className="flex-1">
                                <h5 className="font-normal text-zinc-900 italic text-sm">{session.subject}</h5>
                                {session.notes && <p className="text-xs text-zinc-500 italic mt-0.5">{session.notes}</p>}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm font-mono font-black text-zinc-900">
                                    {Math.floor(session.duration / 3600)}h {Math.floor((session.duration % 3600) / 60)}m
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteTimerSession(session.id)}
                                  className="p-1 text-zinc-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
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
                  <h3 className="font-bold text-zinc-900">Matérias</h3>
                </div>

                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Nova matéria..."
                    className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newSubject.trim()) {
                        addStudySubject(newSubject.trim());
                        setNewSubject('');
                      }
                    }}
                    className="p-3 bg-zinc-900 text-white rounded-xl active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {studySubjects.length === 0 ? (
                    <div className="text-center py-20 text-zinc-400 italic">
                      Adicione matérias para começar.
                    </div>
                  ) : (
                    studySubjects.map((subject) => (
                      <div key={subject.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between group">
                        <span className="font-normal text-zinc-700 italic text-sm">{subject.name}</span>
                        <button
                          onClick={() => deleteStudySubject(subject.id)}
                          className="p-1 text-zinc-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
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
                            "px-4 py-4 rounded-2xl border transition-all text-left group relative",
                            selectedSubject === s.name 
                              ? "bg-red-50 border-red-200 text-red-900" 
                              : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-200"
                          )}
                        >
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
                    Começar Estudo
                    <Play className="w-4 h-4 fill-current" />
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
                  Pronto para evoluir? Escolha uma matéria e comece a contar seu tempo.
                </p>

                <button
                  onClick={() => setView('setup')}
                  className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-sm shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center gap-3"
                >
                  Novo Estudo
                  <Plus className="w-5 h-5" />
                </button>

                <div className="mt-12 w-full max-w-[280px]">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recentes</span>
                    <button onClick={() => setView('history')} className="text-[10px] font-black uppercase tracking-widest text-red-600">Ver todos</button>
                  </div>
                  <div className="space-y-3">
                    {timerSessions.slice(0, 2).map(session => (
                      <div key={session.id} className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between border border-zinc-100 shadow-sm">
                        <span className="text-xs font-normal italic text-zinc-700">{session.subject}</span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          {Math.floor(session.duration / 3600)}h {Math.floor((session.duration % 3600) / 60)}m
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
