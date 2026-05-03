/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDate, isSameDay } from '../utils/formatters';
import { Card, cn } from '../components/UI';
import { Wallet, CheckSquare, Target, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const { transactions, tasks, goals } = useAppStore();
  const today = new Date();

  const financeSummary = useMemo(() => {
    const todayTransactions = transactions.filter((t) => t.date && isSameDay(t.date, today));
    const income = todayTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const expense = todayTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    
    // Monthly balance for the card
    const thisMonthTransactions = transactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const monthlyIncome = thisMonthTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const monthlyExpense = thisMonthTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);

    return { income, expense, monthlyBalance: monthlyIncome - monthlyExpense };
  }, [transactions]);

  const taskSummary = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.date && isSameDay(t.date, today));
    const pending = todayTasks.filter((t) => !t.completed).length;
    const total = todayTasks.length;
    const progress = total > 0 ? ((total - pending) / total) * 100 : 0;
    return { pending, total, progress };
  }, [tasks]);

  const goalSummary = useMemo(() => {
    const activeGoals = goals.length;
    const goalsWithTarget = goals.filter(g => g.target);
    const totalProgress = goalsWithTarget.length > 0 
      ? goalsWithTarget.reduce((acc, g) => {
          const goalCurrentValue = g.type === 'cumulative' 
            ? (g.entries || []).reduce((sum, e) => sum + e.value, 0)
            : (g.entries.length > 0 ? g.entries[g.entries.length - 1].value : g.initialValue || 0);
          
          if (!g.target) return acc;
          const targetVal = g.target;
          const startVal = g.initialValue || 0;

          let progress = 0;
          if (g.type === 'cumulative') {
            progress = Math.min(1, goalCurrentValue / targetVal);
          } else {
            const range = Math.abs(targetVal - startVal);
            if (range > 0) {
              if (g.direction === 'up') {
                progress = Math.max(0, Math.min(1, (goalCurrentValue - startVal) / range));
              } else {
                progress = Math.max(0, Math.min(1, (startVal - goalCurrentValue) / range));
              }
            }
          }
          return acc + progress;
        }, 0) / goalsWithTarget.length * 100
      : 0;
    return { activeGoals, totalProgress };
  }, [goals]);

  const pendingItems = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.date && isSameDay(t.date, today) && !t.completed);
    const todayBills = transactions.filter((t) => t.date && isSameDay(t.date, today) && !t.completed && t.type === 'expense');
    return { tasks: todayTasks, bills: todayBills };
  }, [tasks, transactions]);

  return (
    <div className="pb-32 px-6 pt-10 bg-[#f8f8f8] min-h-screen">
      <header className="mb-8">
        <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-1">Painel</h1>
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Foco total nos seus objetivos</p>
      </header>

      {/* Main Cards */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <Card className="col-span-2 bg-zinc-900 text-white border-none p-6 rounded-xl shadow-2xl shadow-zinc-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-[50px] -mr-12 -mt-12" />
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1.5">Saldo do Mês</p>
              <h2 className="text-2xl font-black tracking-tighter">{formatCurrency(financeSummary.monthlyBalance)}</h2>
            </div>
            <Wallet className="w-6 h-6 opacity-20" />
          </div>
          <div className="flex gap-5 text-[9px] font-black uppercase tracking-widest text-white/80">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hoje: {formatCurrency(financeSummary.income)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
              <span>Hoje: {formatCurrency(financeSummary.expense)}</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <CheckSquare className="w-5 h-5 text-red-600 stroke-[2.5]" />
            <span className="text-[10px] font-black text-red-500">{Math.round(taskSummary.progress)}%</span>
          </div>
          <div>
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Tarefas</p>
            <p className="text-sm font-black text-zinc-900">{taskSummary.pending} <span className="text-[9px] text-zinc-400 ml-0.5">pend.</span></p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <Target className="w-5 h-5 text-zinc-900 stroke-[2.5]" />
            <span className="text-[10px] font-black text-zinc-900">{Math.round(goalSummary.totalProgress)}%</span>
          </div>
          <div>
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Metas</p>
            <p className="text-sm font-black text-zinc-900">{goalSummary.activeGoals} <span className="text-[9px] text-zinc-400 ml-0.5">ativas</span></p>
          </div>
        </Card>
      </div>

      {/* Today Section */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 mb-1.5 ml-1">
          <Calendar className="w-4 h-4 text-red-600" />
          <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Agenda Hoje</h3>
        </div>

        {pendingItems.tasks.length === 0 && pendingItems.bills.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 border-dashed shadow-sm">
            <p className="text-[9px] text-zinc-300 font-black uppercase tracking-widest">Tudo em dia! ✨</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.bills.map((bill) => (
              <div key={bill.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-zinc-900 mb-0.5 uppercase tracking-tight">{bill.description}</p>
                  <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">A pagar: {formatCurrency(bill.value)}</p>
                </div>
              </div>
            ))}
            {pendingItems.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  task.type === 'habit' ? "bg-zinc-100 text-zinc-900" : "bg-red-100 text-red-600"
                )}>
                  {task.type === 'habit' ? <Target className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-zinc-900 mb-0.5 uppercase tracking-tight">{task.description}</p>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{task.type === 'habit' ? 'Hábito' : 'Tarefa'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
