/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Modal, cn } from '../components/UI';
import { 
  Plus, 
  Trash2, 
  Check, 
  Edit2, 
  List as ListIcon, 
  GripVertical, 
  ChevronLeft, 
  LayoutGrid, 
  MoreHorizontal,
  PlusCircle,
  PackageOpen
} from 'lucide-react';
import { ListItem, List } from '../types';

function ProgressCircle({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-white/5"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          className={cn(
            "transition-all duration-1000 ease-out",
            percentage === 100 ? "text-green-500" : "text-red-600"
          )}
        />
      </svg>
      <span className="absolute text-[8px] font-black text-white">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

function ListItemComponent({ 
  listId,
  item, 
  editingId, 
  setEditingId, 
  editValue, 
  setEditValue, 
  handleSaveEdit, 
  toggleListItem, 
  deleteListItem 
}: any) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "group flex items-center gap-4 p-4 bg-zinc-900/40 border border-white/5 rounded-2xl transition-all mb-3",
        item.completed && "opacity-40 grayscale-[0.5]"
      )}
    >
      <button
        onClick={() => toggleListItem(listId, item.id)}
        className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 border-2",
          item.completed 
            ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/40 scale-110" 
            : "bg-zinc-950 border-zinc-800 hover:border-red-600/50"
        )}
      >
        <AnimatePresence>
          {item.completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Check className="w-4 h-4 stroke-[4]" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <div className="flex-1 min-w-0">
        {editingId === item.id ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSaveEdit(listId, item.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit(listId, item.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            className="w-full bg-transparent border-none outline-none py-1 text-sm font-bold text-white placeholder:text-zinc-700"
          />
        ) : (
          <p 
            onClick={() => {
              setEditingId(item.id);
              setEditValue(item.description);
            }}
            className={cn(
              "font-bold text-sm transition-all truncate cursor-text tracking-tight uppercase",
              item.completed ? "text-zinc-600 line-through" : "text-white"
            )}
          >
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => deleteListItem(listId, item.id)}
          className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="p-2 text-zinc-800 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function Lists({ onBack }: { onBack: () => void }) {
  const { 
    lists, 
    addList, 
    deleteList, 
    updateList, 
    reorderLists, 
    addListItem, 
    toggleListItem, 
    deleteListItem, 
    updateListItem,
    reorderListItems 
  } = useAppStore();

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📝');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const activeList = useMemo(() => {
    return lists.find(l => l.id === activeListId) || null;
  }, [lists, activeListId]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => a.order - b.order);
  }, [lists]);

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    addList({ name: newListName, icon: newListIcon });
    setNewListName('');
    setNewListIcon('📝');
    setIsNewListModalOpen(false);
  };

  const handleAddListItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListId || !newItemInput.trim()) return;
    addListItem(activeListId, newItemInput);
    setNewItemInput('');
  };

  const handleSaveEdit = (listId: string, itemId: string) => {
    if (!editValue.trim()) return;
    updateListItem(listId, itemId, editValue);
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="pb-32 bg-[#080808] min-h-screen text-white">
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={activeListId ? () => setActiveListId(null) : onBack}
              className="w-10 h-10 bg-zinc-900/50 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
                {activeList ? activeList.name : 'Suas Listas'}
              </h1>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mt-1.5 opacity-80">
                {activeList ? `${activeList.items.length} itens totais` : `${lists.length} categorias disponíveis`}
              </p>
            </div>
          </div>
          {!activeListId && (
            <button
              onClick={() => setIsNewListModalOpen(true)}
              className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6 text-white stroke-[3]" />
            </button>
          )}
        </div>
      </header>

      <main className="px-5">
        <AnimatePresence mode="wait">
          {!activeList ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 gap-4"
            >
              {sortedLists.map((list, index) => {
                const completedCount = list.items.filter(i => i.completed).length;
                return (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      onClick={() => setActiveListId(list.id)}
                      className="relative p-6 bg-zinc-900/20 hover:bg-zinc-900/40 border border-white/5 rounded-[2.5rem] transition-all cursor-pointer group overflow-hidden"
                    >
                      {/* Background accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-red-600/10 transition-colors" />
                      
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-zinc-950 border border-white/5 rounded-3xl flex items-center justify-center text-3xl shadow-2xl transition-transform group-hover:scale-105 duration-500">
                          {list.icon || '📝'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-black uppercase tracking-tight group-hover:text-red-500 transition-colors">
                            {list.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <ProgressCircle current={completedCount} total={list.items.length} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Status</span>
                              <span className="text-[10px] font-bold text-white uppercase mt-1">
                                {completedCount} de {list.items.length} feitos
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-zinc-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <PlusCircle className="w-5 h-5 text-zinc-400" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              
              {sortedLists.length === 0 && (
                <div className="text-center py-24 bg-zinc-900/10 rounded-[3rem] border border-white/5">
                  <PackageOpen className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                  <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs">Sem Listas Ativas</p>
                  <button 
                    onClick={() => setIsNewListModalOpen(true)}
                    className="mt-6 text-[10px] font-black text-red-600 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    + Criar Minha Primeira Lista
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    {activeList.icon || '📝'}
                  </div>
                  <button 
                    onClick={() => setIsEditListModalOpen(true)}
                    className="flex flex-col hover:opacity-70 transition-opacity"
                  >
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Configurações</span>
                    <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                      Personalizar <MoreHorizontal className="w-3 h-3" />
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/10 rounded-[2.5rem] p-6 border border-white/5">
                <form onSubmit={handleAddListItem} className="flex gap-3 mb-8">
                  <input
                    autoFocus
                    type="text"
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    placeholder="O que vamos adicionar?"
                    className="flex-1 bg-zinc-950 border-none text-white rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600 transition-all shadow-inner"
                  />
                  <button 
                    type="submit"
                    className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-red-900/20 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Plus className="w-7 h-7 stroke-[3]" />
                  </button>
                </form>

                <Reorder.Group 
                  axis="y" 
                  values={activeList.items} 
                  onReorder={(newItems) => reorderListItems(activeList.id, newItems)}
                  className="space-y-1"
                >
                  {activeList.items.length === 0 ? (
                    <div className="text-center py-16 opacity-30">
                      <p className="font-black uppercase tracking-[0.3em] text-[8px]">Lista Vazia</p>
                    </div>
                  ) : (
                    activeList.items.map((item) => (
                      <ListItemComponent
                        key={item.id}
                        listId={activeList.id}
                        item={item}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        handleSaveEdit={handleSaveEdit}
                        toggleListItem={toggleListItem}
                        deleteListItem={deleteListItem}
                      />
                    ))
                  )}
                </Reorder.Group>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* New List Modal */}
      <Modal
        isOpen={isNewListModalOpen}
        onClose={() => {
          setIsNewListModalOpen(false);
          setIsIconPickerOpen(false);
        }}
        title="Nova Categoria"
      >
        <form onSubmit={handleAddList} className="space-y-8">
          <div className="space-y-4 text-center">
            <div className="relative inline-block mx-auto">
              <button 
                type="button"
                onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                className="w-24 h-24 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl border-2 border-white/5 hover:border-red-600/30 transition-all"
              >
                {newListIcon}
              </button>
              {isIconPickerOpen && (
                <div className="absolute top-0 left-full ml-4 bg-[#111111] border border-white/10 shadow-2xl rounded-3xl p-4 z-50 grid grid-cols-4 gap-2 w-56 animate-in slide-in-from-left-4 duration-300">
                  {['📝', '🛒', '🎬', '📂', '💡', '✈️', '🍔', '🎨', '🚀', '🎁', '📅', '💻', '🏋️', '📚', '🎵', '🌿', '⚙️', '🔥', '💎', '🔑'].map(emoji => (
                    <button 
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setNewListIcon(emoji);
                        setIsIconPickerOpen(false);
                      }}
                      className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 rounded-xl text-xl transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Identificação da Lista</label>
              <input
                autoFocus
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ex: PROJETOS X"
                className="w-full bg-zinc-900 border-white/5 text-white rounded-3xl px-8 py-6 text-base font-black uppercase text-center focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
              />
            </div>
          </div>
          <Button type="submit" className="w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em]">Criar Agora</Button>
        </form>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        isOpen={isEditListModalOpen}
        onClose={() => {
          setIsEditListModalOpen(false);
          setIsIconPickerOpen(false);
        }}
        title="Configurar Lista"
      >
        <div className="space-y-10">
          <div className="space-y-6 text-center">
            <div className="relative inline-block">
              <button 
                type="button"
                onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center text-3xl shadow-2xl border-2 border-white/5"
              >
                {activeList?.icon || '📝'}
              </button>
              {isIconPickerOpen && activeList && (
                <div className="absolute top-0 left-full ml-4 bg-[#111111] border border-white/10 shadow-2xl rounded-3xl p-4 z-50 grid grid-cols-4 gap-2 w-56 animate-in slide-in-from-left-4">
                  {['📝', '🛒', '🎬', '📂', '💡', '✈️', '🍔', '🎨', '🚀', '🎁', '📅', '💻', '🏋️', '📚', '🎵', '🌿'].map(emoji => (
                    <button 
                      key={emoji}
                      type="button"
                      onClick={() => {
                        updateList(activeList.id, { icon: emoji });
                        setIsIconPickerOpen(false);
                      }}
                      className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 rounded-xl text-xl transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nome da Lista</label>
              <input
                type="text"
                value={activeList?.name || ''}
                onChange={(e) => activeListId && updateList(activeListId, { name: e.target.value })}
                className="w-full bg-zinc-950 border-white/5 text-white rounded-[2rem] px-8 py-5 text-sm font-black uppercase focus:ring-2 focus:ring-red-500 shadow-inner"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <button
              onClick={() => {
                if (activeListId && confirm('Deseja realmente excluir esta lista permanentemente?')) {
                  deleteList(activeListId);
                  setActiveListId(null);
                  setIsEditListModalOpen(false);
                }
              }}
              className="w-full py-5 flex items-center justify-center gap-3 bg-red-600/5 text-red-500 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.3em] border border-red-600/10 hover:bg-red-600 hover:text-white transition-all shadow-lg"
            >
              <Trash2 className="w-4 h-4" /> Deletar Lista
            </button>
            <Button onClick={() => setIsEditListModalOpen(false)} className="w-full py-5 rounded-[2rem] bg-zinc-800 text-white">Fechar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


