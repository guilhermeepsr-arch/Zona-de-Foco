/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { addMonths, formatISO, parseISO, startOfDay } from 'date-fns';
import { AppState, AppActions, Transaction, Task, Goal, GoalEntry, Habit, List } from '../types';
import { supabaseService } from '../services/supabaseService';

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  transactions: [],
  tasks: [],
  goals: [],
  habits: [],
  habitCategories: ['Shape', 'Mente'],
  lists: [],
  habitTemplates: [],
  frequentTasks: [],
  diaryEntries: [],
  diaryTemplates: [
    {
      id: 'default-gratitude',
      name: 'Gratidão & Destaque',
      content: '3 coisas pelas quais sou grato hoje:\n1.\n2.\n3.\n\nCoisa interessante que aconteceu hoje:\n1.\n'
    }
  ],
  theme: 'light',

  setTheme: (theme) => set({ theme }),

  // Load Data
  loadData: async () => {
    try {
      const [
        transactions,
        tasks,
        goals,
        habits,
        lists,
        diaryEntries
      ] = await Promise.all([
        supabaseService.fetchTransactions(),
        supabaseService.fetchTasks(),
        supabaseService.fetchGoals(),
        supabaseService.fetchHabits(),
        supabaseService.fetchLists(),
        supabaseService.fetchDiaryEntries()
      ]);

      set({
        transactions,
        tasks,
        goals,
        habits,
        lists,
        diaryEntries
      });
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    }
  },

  // Transactions
  addTransaction: async (data) => {
    try {
      const newTransaction = await supabaseService.addTransaction(data);
      if (newTransaction) {
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));

        // Handle recurring if needed (simplified for cloud migration)
        if (data.recurring && data.recurring.months > 1) {
          const baseDate = parseISO(data.date);
          for (let i = 1; i < data.recurring.months; i++) {
            const nextDate = addMonths(baseDate, i);
            await supabaseService.addTransaction({
              ...data,
              date: formatISO(nextDate),
              recurring: {
                months: data.recurring.months,
                originalId: newTransaction.id,
              },
            });
          }
          // Reload to get all recurring
          const transactions = await supabaseService.fetchTransactions();
          set({ transactions });
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  },

  toggleTransaction: async (id) => {
    const t = get().transactions.find(t => t.id === id);
    if (!t) return;
    const completed = !t.completed;
    
    // Optimistic update
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, completed } : t
      ),
    }));

    try {
      await supabaseService.updateTransaction(id, { completed });
    } catch (error) {
      console.error('Error toggling transaction:', error);
      // Revert on error
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, completed: !completed } : t
        ),
      }));
    }
  },

  deleteTransaction: async (id) => {
    try {
      await supabaseService.deleteTransaction(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  updateTransaction: async (id, data) => {
    try {
      await supabaseService.updateTransaction(id, data);
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
      }));
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  },

  // Tasks
  addTask: async (data) => {
    try {
      const dateStr = data.date ? formatISO(startOfDay(parseISO(data.date))) : undefined;
      const newTask = await supabaseService.addTask({ ...data, date: dateStr });
      if (newTask) {
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  },

  toggleTask: async (id) => {
    const t = get().tasks.find(t => t.id === id);
    if (!t) return;
    const completed = !t.completed;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed } : t
      ),
    }));

    try {
      await supabaseService.updateTask(id, { completed });
    } catch (error) {
      console.error('Error toggling task:', error);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, completed: !completed } : t
        ),
      }));
    }
  },

  deleteTask: async (id) => {
    try {
      await supabaseService.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },

  updateTask: async (id, data) => {
    try {
      await supabaseService.updateTask(id, data);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
      }));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  },

  reorderTasks: async (newTasks) => {
    set((state) => {
      const updatedTasks = [...state.tasks];
      newTasks.forEach((nt, index) => {
        const idx = updatedTasks.findIndex(t => t.id === nt.id);
        if (idx !== -1) {
          updatedTasks[idx] = { ...updatedTasks[idx], order: index };
        }
      });
      return { tasks: updatedTasks };
    });

    try {
      await Promise.all(newTasks.map((t, idx) => supabaseService.updateTask(t.id, { order: idx })));
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  },

  // Frequent Tasks (Simplified local for now, but following the pattern)
  addFrequentTask: (description) =>
    set((state) => ({
      frequentTasks: [...state.frequentTasks, description],
    })),

  deleteFrequentTask: (index) =>
    set((state) => ({
      frequentTasks: state.frequentTasks.filter((_, i) => i !== index),
    })),

  // Goals
  addGoal: async (data) => {
    try {
      const newGoal = await supabaseService.addGoal(data);
      if (newGoal) {
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  },

  addGoalEntry: async (goalId, value, date) => {
    const entryDate = date || new Date().toISOString();
    try {
      const newEntry = await supabaseService.addGoalEntry(goalId, value, entryDate);
      if (newEntry) {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, entries: [...(g.entries || []), newEntry] } : g
          ),
        }));
      }
    } catch (error) {
      console.error('Error adding goal entry:', error);
    }
  },

  undoLastGoalEntry: async (goalId) => {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal || !goal.entries || goal.entries.length === 0) return;
    
    const lastEntry = goal.entries[goal.entries.length - 1];
    try {
      await supabaseService.deleteGoalEntry(lastEntry.id);
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, entries: (g.entries || []).slice(0, -1) } : g
        ),
      }));
    } catch (error) {
      console.error('Error undoing goal entry:', error);
    }
  },

  clearGoalEntries: async (goalId) => {
    try {
      await supabaseService.clearGoalEntries(goalId);
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, entries: [] } : g
        ),
      }));
    } catch (error) {
      console.error('Error clearing goal entries:', error);
    }
  },

  archiveGoalProgress: async (goalId) => {
    // Simply clear current progress for now (cloud version)
    try {
      await supabaseService.clearGoalEntries(goalId);
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, entries: [] } : g
        ),
      }));
    } catch (error) {
      console.error('Error archiving goal progress:', error);
    }
  },

  updateGoal: async (id, data) => {
    try {
      await supabaseService.updateGoal(id, data);
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, ...data } : g
        ),
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  },

  deleteGoal: async (id) => {
    try {
      await supabaseService.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  },

  // Habits
  addHabit: async (data) => {
    try {
      const newHabit = await supabaseService.addHabit(data);
      if (newHabit) {
        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  },

  toggleHabit: async (id, date) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const h = get().habits.find(h => h.id === id);
    if (!h) return;

    const currentCompletedDates = h.completedDates || [];
    const isCompleted = currentCompletedDates.includes(targetDate);
    const newCompletedDates = isCompleted
      ? currentCompletedDates.filter((d) => d !== targetDate)
      : [...currentCompletedDates, targetDate];
    
    const newFailedDates = (h.failedDates || []).filter(d => d !== targetDate);

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, completedDates: newCompletedDates, failedDates: newFailedDates } : h
      ),
    }));

    try {
      await supabaseService.updateHabit(id, { completedDates: newCompletedDates, failedDates: newFailedDates });
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  },

  cycleHabitStatus: async (id, date) => {
    const h = get().habits.find(h => h.id === id);
    if (!h) return;

    const comp = h.completedDates || [];
    const fail = h.failedDates || [];
    
    let newComp = [...comp];
    let newFail = [...fail];

    if (comp.includes(date)) {
      newComp = comp.filter(d => d !== date);
      newFail = [...fail, date];
    } else if (fail.includes(date)) {
      newFail = fail.filter(d => d !== date);
    } else {
      newComp = [...comp, date];
    }

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, completedDates: newComp, failedDates: newFail } : h
      ),
    }));

    try {
      await supabaseService.updateHabit(id, { completedDates: newComp, failedDates: newFail });
    } catch (error) {
      console.error('Error cycling habit status:', error);
    }
  },

  deleteHabit: async (id) => {
    try {
      await supabaseService.deleteHabit(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  },

  updateHabit: async (id, data) => {
    try {
      await supabaseService.updateHabit(id, data);
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...data } : h
        ),
      }));
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  },
  reorderHabits: async (newHabits) => {
    set((state) => {
      const updatedHabits = [...state.habits];
      newHabits.forEach((nh, index) => {
        const idx = updatedHabits.findIndex(h => h.id === nh.id);
        if (idx !== -1) {
          updatedHabits[idx] = { ...updatedHabits[idx], order: index };
        }
      });
      return { habits: updatedHabits };
    });

    try {
      await Promise.all(newHabits.map((h, idx) => supabaseService.updateHabit(h.id, { order: idx })));
    } catch (error) {
      console.error('Error reordering habits:', error);
    }
  },

  addHabitCategory: (name) => 
    set((state) => ({ 
      habitCategories: [...state.habitCategories, name] 
    })),

  updateHabitCategory: (oldName, newName) =>
    set((state) => ({
      habitCategories: state.habitCategories.map(c => c === oldName ? newName : c),
      habits: state.habits.map(h => h.category === oldName ? { ...h, category: newName } : h)
    })),

  deleteHabitCategory: (name) =>
    set((state) => ({
      habitCategories: state.habitCategories.filter(c => c !== name),
      habits: state.habits.map(h => h.category === name ? { ...h, category: state.habitCategories[0] || 'Geral' } : h)
    })),

  addHabitTemplate: (name) =>
    set((state) => ({
      habitTemplates: [...state.habitTemplates, name],
    })),

  deleteHabitTemplate: (index) =>
    set((state) => ({
      habitTemplates: state.habitTemplates.filter((_, i) => i !== index),
    })),

  // Lists
  addList: async (data) => {
    try {
      const newList = await supabaseService.addList(data);
      if (newList) {
        set((state) => ({
          lists: [...state.lists, newList],
        }));
      }
    } catch (error) {
      console.error('Error adding list:', error);
    }
  },

  deleteList: async (id) => {
    try {
      await supabaseService.deleteList(id);
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  },

  addListItem: async (listId, description) => {
    try {
      const newItem = await supabaseService.addListItem(listId, description);
      if (newItem) {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, items: [...l.items, newItem] } : l
          ),
        }));
      }
    } catch (error) {
      console.error('Error adding list item:', error);
    }
  },

  toggleListItem: async (listId, itemId) => {
    const list = get().lists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (!item) return;

    const completed = !item.completed;

    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((it) =>
                it.id === itemId ? { ...it, completed } : it
              ),
            }
          : l
      ),
    }));

    try {
      await supabaseService.updateListItem(itemId, { completed });
    } catch (error) {
      console.error('Error toggling list item:', error);
    }
  },

  deleteListItem: async (listId, itemId) => {
    try {
      await supabaseService.deleteListItem(itemId);
      set((state) => ({
        lists: state.lists.map((l) =>
          l.id === listId
            ? { ...l, items: l.items.filter((item) => item.id !== itemId) }
            : l
        ),
      }));
    } catch (error) {
      console.error('Error deleting list item:', error);
    }
  },

  // Lists Reorder
  updateList: async (id, data) => {
    try {
      await supabaseService.updateList(id, data);
      set((state) => ({
        lists: state.lists.map((l) =>
          l.id === id ? { ...l, ...data } : l
        ),
      }));
    } catch (error) {
      console.error('Error updating list:', error);
    }
  },

  reorderLists: async (newLists) => {
    set((state) => {
      const updatedLists = [...state.lists];
      newLists.forEach((nl, index) => {
        const idx = updatedLists.findIndex(l => l.id === nl.id);
        if (idx !== -1) {
          updatedLists[idx] = { ...updatedLists[idx], order: index };
        }
      });
      return { lists: updatedLists };
    });

    try {
      await Promise.all(newLists.map((l, idx) => supabaseService.updateList(l.id, { order: idx })));
    } catch (error) {
      console.error('Error reordering lists:', error);
    }
  },

  updateListItem: async (listId, itemId, description) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((it) =>
                it.id === itemId ? { ...it, description } : it
              ),
            }
          : l
      ),
    }));

    try {
      await supabaseService.updateListItem(itemId, { description });
    } catch (error) {
      console.error('Error updating list item:', error);
    }
  },

  reorderListItems: async (listId, newItems) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, items: newItems } : l
      ),
    }));

    try {
      await Promise.all(newItems.map((it, idx) => supabaseService.updateListItem(it.id, { order: idx })));
    } catch (error) {
      console.error('Error reordering list items:', error);
    }
  },

  addDiaryTemplate: (data) =>
    set((state) => ({
      diaryTemplates: [...state.diaryTemplates, { ...data, id: Math.random().toString(36).substring(2, 9) }],
    })),

  deleteDiaryTemplate: (id) =>
    set((state) => ({
      diaryTemplates: state.diaryTemplates.filter((t) => t.id !== id),
    })),

  // Diary
  saveDiaryEntry: async (date, content) => {
    try {
      await supabaseService.saveDiaryEntry(date, content);
      set((state) => {
        const existingEntryIndex = state.diaryEntries.findIndex((e) => e.id === date);
        if (existingEntryIndex !== -1) {
          const newEntries = [...state.diaryEntries];
          newEntries[existingEntryIndex] = { ...newEntries[existingEntryIndex], content };
          return { diaryEntries: newEntries };
        }
        return { diaryEntries: [...state.diaryEntries, { id: date, content }] };
      });
    } catch (error) {
      console.error('Error saving diary entry:', error);
    }
  },
}));

