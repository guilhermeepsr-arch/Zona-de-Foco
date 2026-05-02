/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const { diaryEntries, diaryTemplates, saveDiaryEntry, addDiaryTemplate } = useAppStore();
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [noteContent, setNoteContent] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Sync content with date
  useEffect(() => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const entry = diaryEntries.find(e => e.id === dateStr);
    setNoteContent(entry?.content || '');
  }, [currentDate, diaryEntries]);

  const dateLabel = useMemo(() => {
    if (isSameDay(currentDate, startOfToday())) return 'Hoje';
    if (isSameDay(currentDate, addDays(startOfToday(), 1))) return 'Amanhã';
    if (isSameDay(currentDate, subDays(startOfToday(), 1))) return 'Ontem';
    return format(currentDate, "dd 'de' MMMM", { locale: ptBR });
  }, [currentDate]);

  const handleSaveNote = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    saveDiaryEntry(dateStr, noteContent);
  };

  const applyTemplate = (content: string) => {
    setNoteContent(prev => prev + (prev.trim() ? '\n\n' : '') + content);
  };

  const handleCreateTemplate = () => {
    if (newTemplateName.trim()) {
      addDiaryTemplate(newTemplateName, "");
      setNewTemplateName('');
      setIsTemplateModalOpen(false);
    }
  };

  return (
    <div className="pb-32 bg-[#f8f8f8] min-h-screen text-zinc-900">
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10">
            <BookOpen className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Diário</h1>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-zinc-200 mb-6 shadow-sm">
          <button 
            onClick={() => setCurrentDate(subDays(currentDate, 1))} 
            className="p-2 hover:bg-zinc-50 rounded-xl transition-all text-zinc-400 hover:text-zinc-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600 leading-none mb-1">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-900">
              {dateLabel}
            </span>
          </div>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 1))} 
            className="p-2 hover:bg-zinc-50 rounded-xl transition-all text-zinc-400 hover:text-zinc-900"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentDate, 'yyyy-MM-dd')}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Templates */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-all flex items-center gap-2 shrink-0 group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Template
              </button>
              {diaryTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.content)}
                  className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors whitespace-nowrap text-zinc-900 shrink-0"
                >
                  {template.name}
                </button>
              ))}
            </div>

            {/* Note Area */}
            <div className="relative group">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Como foi seu dia? Escreva aqui..."
                className="w-full min-h-[400px] bg-white border-2 border-zinc-100 rounded-[2.5rem] p-8 text-sm font-medium leading-relaxed text-zinc-600 placeholder:text-zinc-300 outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all shadow-xl shadow-zinc-200/30 resize-none"
              />
              <div className="absolute top-8 right-8">
                {noteContent.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Editando</span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={handleSaveNote} 
              className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-zinc-400/20 active:scale-95 transition-all"
            >
              <Save className="w-5 h-5" /> Salvar Diário
            </Button>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Novo Template"
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block ml-1">Nome do Template</label>
            <input
              autoFocus
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Ex: Gratidão, Resumo"
              className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner"
            />
          </div>
          <Button onClick={handleCreateTemplate} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Criar Template</Button>
        </div>
      </Modal>
    </div>
  );
}
