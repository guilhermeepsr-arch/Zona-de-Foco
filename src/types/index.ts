/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  value: number;
  type: TransactionType;
  date: string; // ISO string
  completed: boolean;
  recurring?: {
    months: number;
    originalId: string;
  };
}

export type TaskType = 'task' | 'habit';

export interface Task {
  id: string;
  description: string;
  type: TaskType;
  date?: string; // ISO string
  completed: boolean;
  notes?: string;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  order: number;
}

export interface GoalEntry {
  id: string;
  value: number;
  date: string; // ISO string with time
}

export interface GoalTarget {
  id: string;
  value: number;
  endDate: string; // ISO date string
  startDate: string; // ISO date string
}

export interface Goal {
  id: string;
  name: string;
  unit: string;
  icon?: string;
  quickButtons?: number[];
  entries: GoalEntry[];
  currentTarget?: GoalTarget;
  history?: {
    target: GoalTarget;
    entries: GoalEntry[];
  }[];
}

export interface Habit {
  id: string;
  name: string;
  icon?: string;
  completedDates: string[]; // ISO date strings (yyyy-MM-dd)
  order: number;
}

export interface ListItem {
  id: string;
  description: string;
  completed: boolean;
}

export interface List {
  id: string;
  name: string;
  icon?: string;
  items: ListItem[];
  order: number;
}

export interface DiaryEntry {
  id: string; // ISO date string (yyyy-mm-dd)
  content: string;
}

export interface DiaryTemplate {
  id: string;
  name: string;
  content: string;
}

export interface AppState {
  transactions: Transaction[];
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  lists: List[];
  diaryEntries: DiaryEntry[];
  diaryTemplates: DiaryTemplate[];
  habitTemplates: string[];
  frequentTasks: string[];
  theme: 'light' | 'dark';
}

export interface AppActions {
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  toggleTransaction: (id: string) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'order'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  reorderTasks: (tasks: Task[]) => void;
  addFrequentTask: (description: string) => void;
  deleteFrequentTask: (index: number) => void;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'entries'> & { entries?: GoalEntry[] }) => void;
  addGoalEntry: (goalId: string, value: number) => void;
  undoLastGoalEntry: (goalId: string) => void;
  clearGoalEntries: (goalId: string) => void;
  archiveGoalProgress: (goalId: string) => void;
  deleteGoal: (id: string) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'order' | 'completedDates'>) => void;
  toggleHabit: (id: string, date?: string) => void;
  deleteHabit: (id: string) => void;
  updateHabit: (id: string, data: Partial<Habit>) => void;
  reorderHabits: (habits: Habit[]) => void;
  addHabitTemplate: (name: string) => void;
  deleteHabitTemplate: (index: number) => void;

  // Lists
  addList: (list: Omit<List, 'id' | 'order' | 'items'>) => void;
  deleteList: (id: string) => void;
  updateList: (id: string, data: Partial<List>) => void;
  reorderLists: (lists: List[]) => void;
  addListItem: (listId: string, description: string) => void;
  toggleListItem: (listId: string, itemId: string) => void;
  deleteListItem: (listId: string, itemId: string) => void;
  updateListItem: (listId: string, itemId: string, description: string) => void;
  reorderListItems: (listId: string, items: ListItem[]) => void;

  // Global
  setTheme: (theme: 'light' | 'dark') => void;

  // Diary
  saveDiaryEntry: (date: string, content: string) => void;
  addDiaryTemplate: (template: Omit<DiaryTemplate, 'id'>) => void;
  deleteDiaryTemplate: (id: string) => void;
}
