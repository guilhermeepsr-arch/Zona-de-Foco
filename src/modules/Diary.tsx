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
  Clock,
  Settings
} from 'lucide-react';
import { format, addDays, subDays, startOfToday, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Diary({ onBack }: { onBack: () => void }) {
  const { diaryEntries, diaryTemplates, saveDiaryEntry, addDiaryTemplate, deleteDiaryTemplate } = useAppStore();
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [noteContent, setNoteContent] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Auto-save: sync content whenever it changes
  useEffect(() => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    saveDiaryEntry(dateStr, noteContent);
  }, [noteContent, currentDate, saveDiaryEntry]);

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
      addDiaryTemplate({
        name: newTemplateName,
        content: noteContent
      });
      setNewTemplateName('');
      setIsTemplateModalOpen(false);
    }
  };

  return (
    <div className="pb-32 bg-[#f8f8f8] min-h-screen text-zinc-900">
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10">
              <BookOpen className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Diário</h1>
          </div>
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 transition-all shadow-sm group"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
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
            className="space-y-4"
          >
            {/* Template Shortcuts */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {diaryTemplates.slice(0, 5).map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.content)}
                  className="px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors whitespace-nowrap text-zinc-500 hover:text-zinc-900 shrink-0"
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
                placeholder="Como foi seu dia? O que está na sua mente? (Salva automaticamente)"
                className="w-full min-h-[480px] bg-white border-2 border-zinc-100 rounded-xl p-7 text-sm font-medium leading-[1.7] text-zinc-700 placeholder:text-zinc-200 outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all shadow-xl shadow-zinc-200/20 resize-none font-serif"
              />
              <div className="absolute top-8 right-8">
                {noteContent.length > 0 && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100/50">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[7.5px] font-black uppercase tracking-[0.25em] text-emerald-600">Sync</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Gerenciar Templates"
      >
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block ml-1">Criar Novo Template</label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nome do Template"
                className="flex-1 bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-red-500 shadow-inner"
              />
              <button 
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim()}
                className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
            <p className="text-[9px] text-zinc-400 font-medium px-2 mt-2 italic">O conteúdo atual do diário será salvo como template.</p>
          </div>

          <div className="pt-6 border-t border-zinc-100">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 block ml-1">Templates Existentes</label>
            <div className="space-y-3">
              {diaryTemplates.length === 0 ? (
                <p className="text-center py-8 text-zinc-300 text-[10px] font-black uppercase tracking-widest">Nenhum template salvo</p>
              ) : (
                diaryTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900">{template.name}</span>
                      <span className="text-[9px] font-medium text-zinc-400 truncate max-w-[200px]">{template.content || 'Sem conteúdo'}</span>
                    </div>
                    <button 
                      onClick={() => deleteDiaryTemplate(template.id)}
                      className="w-9 h-9 flex items-center justify-center bg-white text-zinc-300 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
