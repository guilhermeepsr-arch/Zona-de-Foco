/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Modal, cn } from '../components/UI';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  BookOpen, 
  Save, 
  Trash2, 
  Plus,
  FileText,
  Copy,
  Clock
} from 'lucide-react';
import { format, addDays, subDays, startOfToday, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Diary({ onBack }: { onBack: () => void }) {
  const { diaryEntries, diaryTemplates, saveDiaryEntry, addDiaryTemplate, deleteDiaryTemplate } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate range of dates (60 days before, 60 days after)
  const today = startOfToday();
  const dates = [];
  for (let i = -60; i <= 60; i++) {
    dates.push(addDays(today, i));
  }

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayElement = scrollRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = diaryEntries.find(e => e.id === dateStr);
    setNoteContent(entry?.content || '');
  };

  const handleSaveNote = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      saveDiaryEntry(dateStr, noteContent);
      setSelectedDate(null);
    }
  };

  const applyTemplate = (content: string) => {
    setNoteContent(prev => prev + (prev.trim() ? '\n\n' : '') + content);
  };

  const handleCreateTemplate = () => {
    if (newTemplateName.trim() && noteContent.trim()) {
      addDiaryTemplate({
        name: newTemplateName,
        content: noteContent
      });
      setNewTemplateName('');
      setIsTemplateModalOpen(false);
    }
  };

  return (
    <div className="pb-32 bg-[#080808] min-h-screen text-white">
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <BookOpen className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">Diário</h1>
          </div>
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Sua jornada, dia após dia.</p>
      </header>

      <main className="px-6 relative">
        <div 
          ref={scrollRef}
          className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar py-20"
        >
          {dates.map((date) => {
            const isToday = isSameDay(date, today);
            const dateStr = format(date, 'yyyy-MM-dd');
            const hasEntry = diaryEntries.find(e => e.id === dateStr);

            return (
              <motion.div
                key={dateStr}
                data-today={isToday}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer text-center",
                  isToday 
                    ? "bg-red-600 border-red-500 shadow-2xl shadow-red-900/30 scale-105 z-10" 
                    : hasEntry
                      ? "bg-zinc-900/40 border-white/10"
                      : "bg-[#111111] border-white/5 opacity-60"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-[0.3em]",
                    isToday ? "text-white" : "text-zinc-500"
                  )}>
                    {format(date, 'EEEE', { locale: ptBR })}
                  </span>
                  <span className="text-2xl font-black tracking-tighter">
                    {format(date, 'dd/MM/yyyy')}
                  </span>
                  {hasEntry && !isToday && (
                    <div className="mt-2 w-1.5 h-1.5 bg-red-600 rounded-full" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Editor Modal */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
      >
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {diaryTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template.content)}
                className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                + {template.name}
              </button>
            ))}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Novo Template
            </button>
          </div>

          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Como foi seu dia? Escreva aqui..."
            className="w-full h-80 bg-zinc-950 border border-white/5 rounded-3xl p-6 text-sm font-bold text-white placeholder:text-zinc-700 outline-none focus:ring-2 focus:ring-red-600 transition-all resize-none shadow-inner"
          />

          <div className="flex gap-3">
            <Button onClick={handleSaveNote} className="flex-1 py-5 rounded-2xl flex items-center justify-center gap-3">
              <Save className="w-5 h-5" /> Salvar Nota
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Salvar como Template"
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Nome do Template</label>
            <input
              autoFocus
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Ex: Gratidão, Exercícios..."
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 opacity-50 grayscale">
            <p className="text-[10px] font-bold text-zinc-400 line-clamp-3 italic">
              {noteContent || 'O conteúdo atual será salvo como template...'}
            </p>
          </div>
          <Button onClick={handleCreateTemplate} className="w-full py-5 rounded-2xl">Confirmar Template</Button>
        </div>
      </Modal>
    </div>
  );
}
