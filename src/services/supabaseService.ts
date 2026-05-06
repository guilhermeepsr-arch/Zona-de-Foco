/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { Transaction, Task, Goal, Habit, List, DiaryEntry } from '../types';

export const supabaseService = {
  // Config
  async getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  },

  // Transactions
  async fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data as Transaction[];
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>) {
    const userId = await this.getUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Tasks
  async fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return data as Task[];
  },

  async addTask(task: Omit<Task, 'id' | 'order'>) {
    const userId = await this.getUserId();
    if (!userId) return;
    
    // Get max order
    const { data: maxOrderData } = await supabase
      .from('tasks')
      .select('order')
      .eq('user_id', userId)
      .order('order', { ascending: false })
      .limit(1);
    
    const nextOrder = (maxOrderData?.[0]?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, user_id: userId, order: nextOrder }])
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Goals
  async fetchGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_entries(*)');
    if (error) throw error;
    
    return data.map(g => ({
      ...g,
      entries: g.goal_entries || []
    })) as Goal[];
  },

  async addGoal(goal: Omit<Goal, 'id' | 'entries'>) {
    const userId = await this.getUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('goals')
      .insert([{ ...goal, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return { ...data, entries: [] } as Goal;
  },

  async addGoalEntry(goalId: string, value: number, date: string) {
    const userId = await this.getUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('goal_entries')
      .insert([{ goal_id: goalId, user_id: userId, value, date }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Habits
  async fetchHabits() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return (data || []).map(h => ({
      ...h,
      completedDates: h.completed_dates || [],
      failedDates: h.failed_dates || []
    })) as Habit[];
  },

  async addHabit(habit: Omit<Habit, 'id' | 'order' | 'completedDates' | 'failedDates'>) {
    const userId = await this.getUserId();
    if (!userId) return;
    
    const { data: maxOrderData } = await supabase
      .from('habits')
      .select('order')
      .eq('user_id', userId)
      .order('order', { ascending: false })
      .limit(1);
    
    const nextOrder = (maxOrderData?.[0]?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from('habits')
      .insert([{ 
        ...habit, 
        user_id: userId, 
        order: nextOrder, 
        completed_dates: [], 
        failed_dates: [] 
      }])
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      completedDates: data.completed_dates || [],
      failedDates: data.failed_dates || []
    } as Habit;
  },

  async updateHabit(id: string, updates: Partial<Habit>) {
    const mappedUpdates: any = { ...updates };
    if (updates.completedDates) {
      mappedUpdates.completed_dates = updates.completedDates;
      delete mappedUpdates.completedDates;
    }
    if (updates.failedDates) {
      mappedUpdates.failed_dates = updates.failedDates;
      delete mappedUpdates.failedDates;
    }

    const { error } = await supabase
      .from('habits')
      .update(mappedUpdates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteHabit(id: string) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Lists
  async fetchLists() {
    const { data, error } = await supabase
      .from('lists')
      .select('*, list_items(*)');
    if (error) throw error;
    
    return data.map(l => ({
      ...l,
      items: (l.list_items || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    })) as List[];
  },

  async addList(list: Omit<List, 'id' | 'order' | 'items'>) {
    const userId = await this.getUserId();
    if (!userId) return;
    
    const { data: maxOrderData } = await supabase
      .from('lists')
      .select('order')
      .eq('user_id', userId)
      .order('order', { ascending: false })
      .limit(1);
    
    const nextOrder = (maxOrderData?.[0]?.order ?? -1) + 1;

    const { data, error } = await supabase
      .from('lists')
      .insert([{ ...list, user_id: userId, order: nextOrder }])
      .select()
      .single();
    if (error) throw error;
    return { ...data, items: [] } as List;
  },

  async addListItem(listId: string, description: string) {
    const userId = await this.getUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('list_items')
      .insert([{ list_id: listId, user_id: userId, description }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateListItem(itemId: string, updates: any) {
    const { error } = await supabase
      .from('list_items')
      .update(updates)
      .eq('id', itemId);
    if (error) throw error;
  },

  async deleteListItem(itemId: string) {
    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  async deleteList(id: string) {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateList(id: string, updates: Partial<List>) {
    const { error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async updateGoal(id: string, updates: Partial<Goal>) {
    const { error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteGoalEntry(id: string) {
    const { error } = await supabase
      .from('goal_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async clearGoalEntries(goalId: string) {
    const { error } = await supabase
      .from('goal_entries')
      .delete()
      .eq('goal_id', goalId);
    if (error) throw error;
  },

  // Diary
  async fetchDiaryEntries() {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*');
    if (error) throw error;
    return data as DiaryEntry[];
  },

  async saveDiaryEntry(id: string, content: string) {
    const userId = await this.getUserId();
    if (!userId) return;
    const { error } = await supabase
      .from('diary_entries')
      .upsert({ id, user_id: userId, content }, { onConflict: 'id,user_id' });
    if (error) throw error;
  }
};
