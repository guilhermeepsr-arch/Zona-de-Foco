/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addMonths, formatISO, parseISO, startOfDay } from 'date-fns';
import { AppState, AppActions, Transaction, Task, Goal, GoalEntry } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
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

      // Transactions
      addTransaction: (data) => {
        const id = generateId();
        const mainTransaction: Transaction = { ...data, id };
        const newTransactions = [mainTransaction];

        if (data.recurring && data.recurring.months > 1) {
          const baseDate = parseISO(data.date);
          for (let i = 1; i < data.recurring.months; i++) {
            const nextDate = addMonths(baseDate, i);
            newTransactions.push({
              ...data,
              id: generateId(),
              date: formatISO(nextDate),
              recurring: {
                months: data.recurring.months,
                originalId: id,
              },
            });
          }
        }

        set((state) => ({
          transactions: [...state.transactions, ...newTransactions],
        }));
      },

      toggleTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),

      // Tasks
      addTask: (data) => {
        const id = generateId();
        set((state) => {
          const dateStr = data.date ? formatISO(startOfDay(parseISO(data.date))) : undefined;
          const dayTasks = state.tasks.filter(t => t.date === dateStr);
          const maxOrder = dayTasks.length > 0 ? Math.max(...dayTasks.map(t => t.order)) : -1;
          return {
            tasks: [...state.tasks, { ...data, id, date: dateStr, order: maxOrder + 1 }],
          };
        });
      },

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      updateTask: (id, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),

      reorderTasks: (newTasks) => {
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
      },

      addFrequentTask: (description) =>
        set((state) => ({
          frequentTasks: [...state.frequentTasks, description],
        })),

      deleteFrequentTask: (index) =>
        set((state) => ({
          frequentTasks: state.frequentTasks.filter((_, i) => i !== index),
        })),

      // Goals
      addGoal: (data) => {
        const id = generateId();
        set((state) => ({
          goals: [
            ...state.goals,
            {
              ...data,
              id,
              entries: data.entries || [],
            },
          ],
        }));
      },

      addGoalEntry: (goalId, value) => {
        const entry: GoalEntry = {
          id: generateId(),
          value,
          date: new Date().toISOString(),
        };
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, entries: [...(g.entries || []), entry] } : g
          ),
        }));
      },

      undoLastGoalEntry: (goalId) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, entries: (g.entries || []).slice(0, -1) } : g
          ),
        }));
      },

      clearGoalEntries: (goalId) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, entries: [] } : g
          ),
        }));
      },

      archiveGoalProgress: (goalId) => {
        // Simple clear for now as we overhauled goals
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, entries: [] } : g
          ),
        }));
      },

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      updateGoal: (id, data) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...data } : g
          ),
        })),

      // Habits
      addHabit: (data) => {
        const id = generateId();
        set((state) => ({
          habits: [...state.habits, { ...data, id, completedDates: [], failedDates: [], order: state.habits.length }],
        }));
      },

      toggleHabit: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id === id) {
              const targetDate = date || new Date().toISOString().split('T')[0];
              const currentCompletedDates = h.completedDates || [];
              const isCompleted = currentCompletedDates.includes(targetDate);
              const newCompletedDates = isCompleted
                ? currentCompletedDates.filter((d) => d !== targetDate)
                : [...currentCompletedDates, targetDate];
              return { ...h, completedDates: newCompletedDates, failedDates: (h.failedDates || []).filter(d => d !== targetDate) };
            }
            return h;
          }),
        })),

      cycleHabitStatus: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id === id) {
              const comp = h.completedDates || [];
              const fail = h.failedDates || [];
              
              if (comp.includes(date)) {
                // Was checked -> move to X
                return {
                  ...h,
                  completedDates: comp.filter(d => d !== date),
                  failedDates: [...fail, date]
                };
              } else if (fail.includes(date)) {
                // Was X -> clear
                return {
                  ...h,
                  failedDates: fail.filter(d => d !== date)
                };
              } else {
                // Was none -> move to check
                return {
                  ...h,
                  completedDates: [...comp, date]
                };
              }
            }
            return h;
          })
        })),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        })),

      updateHabit: (id, data) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...data } : h
          ),
        })),

      reorderHabits: (newHabits) => {
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
          // Optional: move habits in this category to first available or 'Geral'
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
      addList: (data) => {
        const id = generateId();
        set((state) => ({
          lists: [...state.lists, { ...data, id, items: [], order: state.lists.length }],
        }));
      },

      deleteList: (id) =>
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
        })),

      updateList: (id, data) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === id ? { ...l, ...data } : l
          ),
        })),

      reorderLists: (newLists) => {
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
      },

      addListItem: (listId, description) => {
        const newItem = { id: generateId(), description, completed: false };
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, items: [...l.items, newItem] } : l
          ),
        }));
      },

      toggleListItem: (listId, itemId) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((item) =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                  ),
                }
              : l
          ),
        })),

      deleteListItem: (listId, itemId) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((item) => item.id !== itemId) }
              : l
          ),
        })),

      updateListItem: (listId, itemId, description) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((item) =>
                    item.id === itemId ? { ...item, description } : item
                  ),
                }
              : l
          ),
        })),

      reorderListItems: (listId, newItems) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, items: newItems } : l
          ),
        })),

      // Diary
      saveDiaryEntry: (date, content) =>
        set((state) => {
          const existingEntryIndex = state.diaryEntries.findIndex((e) => e.id === date);
          if (existingEntryIndex !== -1) {
            const newEntries = [...state.diaryEntries];
            newEntries[existingEntryIndex] = { ...newEntries[existingEntryIndex], content };
            return { diaryEntries: newEntries };
          }
          return { diaryEntries: [...state.diaryEntries, { id: date, content }] };
        }),

      addDiaryTemplate: (data) =>
        set((state) => ({
          diaryTemplates: [...state.diaryTemplates, { ...data, id: generateId() }],
        })),

      deleteDiaryTemplate: (id) =>
        set((state) => ({
          diaryTemplates: state.diaryTemplates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'organized-life-storage',
    }
  )
);
