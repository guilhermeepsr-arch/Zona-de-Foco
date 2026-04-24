/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { addDays, subDays, formatISO, startOfDay, isToday, isTomorrow, parseISO } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { formatDate, isSameDay } from '../utils/formatters';
import { Card, Button, Modal, ProgressBar, cn } from '../components/UI';
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, Edit2, Rocket, Inbox, X, GripVertical, Repeat } from 'lucide-react';
import { Task, TaskType } from '../types';

function TaskItem({ 
  task, 
  editingId, 
  setEditingId, 
  editValue, 
  setEditValue, 
  handleSaveEdit, 
  toggleTask, 
  deleteTask 
}: any) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "group flex items-center gap-2.5 p-2.5 !bg-[#111111] border border-white/5 rounded-xl shadow-xl transition-all mb-1.5",
        task.completed && "opacity-50 grayscale"
      )}
    >
      <button
        onClick={() => toggleTask(task.id)}
        className={cn(
          "w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 shadow-lg",
          task.completed 
            ? "bg-red-600 border-red-600 text-white shadow-red-900/40" 
            : "bg-zinc-900 border-zinc-700"
        )}
      >
        {task.completed && <Check className="w-3 h-3 stroke-[4]" />}
      </button>

      <div className="flex-1 min-w-0">
        {editingId === task.id ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSaveEdit(task.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit(task.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            className="w-full bg-transparent border-b border-red-600 outline-none py-0.5 text-xs font-bold text-white"
          />
        ) : (
          <p 
            onClick={() => {
              setEditingId(task.id);
              setEditValue(task.description);
            }}
            className={cn(
              "font-bold text-xs transition-all truncate cursor-text tracking-tight",
              task.completed ? "text-zinc-600 line-through" : "text-white"
            )}
          >
            {task.description || 'O que vamos fazer hoje?'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => deleteTask(task.id)}
          className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="p-1.5 text-zinc-600 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function Tasks({ onBack }: { onBack: () => void }) {
  const { tasks, addTask, toggleTask, deleteTask, updateTask, reorderTasks, frequentTasks, addFrequentTask, deleteFrequentTask } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isFrequentOpen, setIsFrequentOpen] = useState(false);
  const [inboxInput, setInboxInput] = useState('');
  const [frequentInput, setFrequentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered tasks for the current day
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date && isSameDay(t.date, currentDate))
      .sort((a, b) => a.order - b.order);
  }, [tasks, currentDate]);

  // Tasks without a date (Inbox)
  const inboxTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.date)
      .sort((a, b) => a.order - b.order);
  }, [tasks]);

  // Progress calculation
  const progress = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const completed = filteredTasks.filter((t) => t.completed).length;
    return (completed / filteredTasks.length) * 100;
  }, [filteredTasks]);

  // Date label logic
  const dateLabel = useMemo(() => {
    if (isToday(currentDate)) return 'Hoje';
    if (isTomorrow(currentDate)) return 'Amanhã';
    return formatDate(currentDate, "dd 'de' MMMM");
  }, [currentDate]);

  // Handle adding a new task to the current day
  const handleAddNew = () => {
    addTask({
      description: '',
      type: 'task' as TaskType,
      date: formatISO(startOfDay(currentDate)),
      completed: false,
    });
  };

  // Auto-focus empty tasks for editing
  useEffect(() => {
    const emptyTask = filteredTasks.find(t => t.description === '' && !editingId);
    if (emptyTask) {
      setEditingId(emptyTask.id);
      setEditValue('');
    }
  }, [filteredTasks, editingId]);

  const handleSaveEdit = (id: string) => {
    if (!editValue.trim()) {
      deleteTask(id);
    } else {
      updateTask(id, { description: editValue });
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleAddInboxTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxInput.trim()) return;
    addTask({
      description: inboxInput,
      type: 'task' as TaskType,
      completed: false,
      date: undefined
    });
    setInboxInput('');
  };

  const handleAddFrequentTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frequentInput.trim()) return;
    addFrequentTask(frequentInput);
    setFrequentInput('');
  };

  const moveTaskToToday = (id: string) => {
    updateTask(id, { date: formatISO(startOfDay(currentDate)) });
  };

  const addFrequentToToday = (description: string) => {
    addTask({
      description,
      type: 'task' as TaskType,
      date: formatISO(startOfDay(currentDate)),
      completed: false,
    });
  };

  return (
    <div className="pb-32 bg-[#080808] min-h-screen">
      {/* Header */}
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
              <Rocket className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">Tarefas</h1>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFrequentOpen(true)}
              className="relative p-2 bg-[#111111] rounded-xl border border-white/5 hover:bg-zinc-900 transition-all active:scale-95 shadow-xl"
            >
              <Repeat className="w-5 h-5 text-zinc-300" />
            </button>
            <button
              onClick={() => setIsInboxOpen(true)}
              className="relative p-2 bg-[#111111] rounded-xl border border-white/5 hover:bg-zinc-900 transition-all active:scale-95 shadow-xl"
            >
              <Inbox className="w-5 h-5 text-zinc-300" />
              {inboxTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#080808] shadow-lg shadow-red-900/20">
                  {inboxTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-[#111111] p-1.5 rounded-xl border border-white/5 mb-8 shadow-2xl">
          <button 
            onClick={() => setCurrentDate(subDays(currentDate, 1))} 
            className="p-2 hover:bg-zinc-900 rounded-lg transition-all text-zinc-500 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
            {dateLabel}
          </span>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 1))} 
            className="p-2 hover:bg-zinc-900 rounded-lg transition-all text-zinc-500 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-1 mb-8">
          <div className="flex justify-between items-end mb-1.5 px-0.5">
            <span className="text-[9px] font-mono text-zinc-600 tracking-tight">
              {filteredTasks.filter(t => t.completed).length}/{filteredTasks.length} tarefas concluídas
            </span>
            <span className="text-[9px] font-mono text-zinc-600">{Math.round(progress)}%</span>
          </div>
          <ProgressBar progress={progress} color="red" />
        </div>
      </header>

      {/* Task List */}
      <Reorder.Group 
        axis="y" 
        values={filteredTasks} 
        onReorder={(newOrder) => {
          reorderTasks(newOrder);
        }}
        className="px-6 space-y-1.5"
      >
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-[#111111] rounded-xl border border-white/5 shadow-2xl">
            <p className="text-zinc-500 font-black uppercase tracking-[0.2em] mb-1 leading-loose">Vazio.</p>
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">Nada planejado para este dia</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              editingId={editingId}
              setEditingId={setEditingId}
              editValue={editValue}
              setEditValue={setEditValue}
              handleSaveEdit={handleSaveEdit}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
            />
          ))
        )}
      </Reorder.Group>

      {/* FAB */}
      <button
        onClick={handleAddNew}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-red-600 text-white shadow-xl shadow-red-200 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Inbox Modal */}
      <Modal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        title="Caixa de Entrada"
      >
        <div className="space-y-6">
          <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2">
            {inboxTasks.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 rounded-xl border border-white/5">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Vazio</p>
              </div>
            ) : (
              inboxTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-white/5 rounded-xl group">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveTaskToToday(task.id)}
                      className="px-3 py-1.5 bg-[#111111] rounded-lg shadow-sm border border-white/5 text-red-600 text-[10px] font-black uppercase tracking-tight hover:bg-zinc-800 transition-colors"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddInboxTask} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inboxInput}
              onChange={(e) => setInboxInput(e.target.value)}
              placeholder="Ideia ou tarefa rápida..."
              className="flex-1 bg-zinc-900 border-white/5 text-white rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
            />
            <button 
              type="submit"
              className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform flex-shrink-0"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>
        </div>
      </Modal>

      {/* Frequent Tasks Modal */}
      <Modal
        isOpen={isFrequentOpen}
        onClose={() => setIsFrequentOpen(false)}
        title="Tarefas Frequentes"
      >
        <div className="space-y-6">
          <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2">
            {(frequentTasks || []).length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 rounded-xl border border-white/5">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Nenhuma tarefa frequente</p>
              </div>
            ) : (
              (frequentTasks || []).map((desc, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-zinc-900 border border-white/5 rounded-xl group">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{desc}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addFrequentToToday(desc)}
                      className="px-3 py-1.5 bg-[#111111] rounded-lg shadow-sm border border-white/5 text-red-600 text-[10px] font-black uppercase tracking-tight hover:bg-zinc-800 transition-colors"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => deleteFrequentTask(index)}
                      className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddFrequentTask} className="flex gap-2">
            <input
              type="text"
              value={frequentInput}
              onChange={(e) => setFrequentInput(e.target.value)}
              placeholder="Nova tarefa frequente..."
              className="flex-1 bg-zinc-900 border-white/5 text-white rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
            />
            <button 
              type="submit"
              className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform flex-shrink-0"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
