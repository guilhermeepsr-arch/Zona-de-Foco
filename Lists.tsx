/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, parseISO, formatISO, compareDesc } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatMonthYear, formatDate, isSameMonth } from '../utils/formatters';
import { Card, Button, Modal, cn } from '../components/UI';
import { Plus, Minus, ChevronLeft, ChevronRight, Check, Trash2, Edit2, LayoutGrid, Calendar, Wallet, TrendingUp, TrendingDown, Share } from 'lucide-react';
import { Transaction } from '../types';

type Filter = 'all' | 'pending' | 'paid';

export default function Finance() {
  const { transactions, addTransaction, toggleTransaction, deleteTransaction, updateTransaction } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'investment'>('income');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  // Form state
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(formatISO(new Date(), { representation: 'date' }));
  const [recurring, setRecurring] = useState(false);
  const [months, setMonths] = useState('1');

  const filteredTransactions = useMemo(() => {
    let list = transactions
      .filter((t) => t.date && isSameMonth(t.date, currentMonth));
    
    if (filter === 'pending') {
      list = list.filter(t => !t.completed);
    } else if (filter === 'paid') {
      list = list.filter(t => t.completed);
    }

    return list.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return compareDesc(parseISO(a.date), parseISO(b.date));
    });
  }, [transactions, currentMonth, filter]);

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.date && isSameMonth(t.date, currentMonth) && t.type === 'income' && t.completed)
      .reduce((acc, t) => acc + t.value, 0);
    const expense = transactions
      .filter((t) => t.date && isSameMonth(t.date, currentMonth) && t.type === 'expense' && t.completed)
      .reduce((acc, t) => acc + t.value, 0);
    
    const predictedIncome = transactions
      .filter((t) => t.date && isSameMonth(t.date, currentMonth) && t.type === 'income')
      .reduce((acc, t) => acc + t.value, 0);
    const predictedExpense = transactions
      .filter((t) => t.date && isSameMonth(t.date, currentMonth) && t.type === 'expense')
      .reduce((acc, t) => acc + t.value, 0);

    return { income, expense, balance: income - expense, predictedIncome, predictedExpense };
  }, [transactions, currentMonth]);

  const groupedTransactions = useMemo(() => {
    const groups: { dateStr: string; items: Transaction[] }[] = [];
    filteredTransactions.forEach((t) => {
      const dateStr = formatDate(t.date, "dd 'de' MMMM");
      const existingGroup = groups.find(g => g.dateStr === dateStr);
      if (existingGroup) {
        existingGroup.items.push(t);
      } else {
        groups.push({ dateStr, items: [t] });
      }
    });
    return groups;
  }, [filteredTransactions]);

  const handleSave = () => {
    if ((modalType !== 'investment' && !description) || !value) return;
    
    const transactionData = {
      description: modalType === 'investment' ? 'Investimento' : description,
      value: parseFloat(value),
      type: modalType === 'investment' ? 'expense' : modalType,
      date: formatISO(parseISO(date)),
      completed: modalType === 'investment' ? true : (editingId ? transactions.find(t => t.id === editingId)?.completed || false : false),
      recurring: recurring ? { months: parseInt(months), originalId: '' } : undefined,
    };

    if (editingId) {
      updateTransaction(editingId, transactionData);
    } else {
      addTransaction(transactionData);
    }
    
    resetForm();
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const monthStr = formatMonthYear(currentMonth);
    let text = `EXTRATO FINANCEIRO - ${monthStr.toUpperCase()}\n`;
    text += `------------------------------------------\n`;
    text += `Saldo: ${formatCurrency(summary.balance)}\n`;
    text += `Entradas: ${formatCurrency(summary.income)}\n`;
    text += `Saídas: ${formatCurrency(summary.expense)}\n`;
    text += `------------------------------------------\n\n`;

    groupedTransactions.forEach(group => {
      text += `${group.dateStr.toUpperCase()}\n`;
      group.items.forEach(t => {
        text += `${t.completed ? '[X]' : '[ ]'} ${t.description}: ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.value)}\n`;
      });
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-${monthStr.replace(' ', '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description);
    setValue(t.value.toString());
    setDate(formatISO(parseISO(t.date), { representation: 'date' }));
    setModalType(t.type);
    setRecurring(!!t.recurring);
    setMonths(t.recurring?.months.toString() || '1');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setDescription('');
    setValue('');
    setDate(formatISO(new Date(), { representation: 'date' }));
    setRecurring(false);
    setMonths('1');
    setEditingId(null);
  };

  return (
    <div className="pb-32 bg-[#080808] min-h-screen">
      {/* Header */}
      <header className="px-6 pt-10 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">Finanças</h1>
          </div>
          
          <div className="flex bg-[#111111] p-1 rounded-xl shadow-xl border border-white/5">
            {(['all', 'pending', 'paid'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                  filter === f ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {f === 'pending' && <div className="w-1 h-1 rounded-full bg-red-500" />}
                {f === 'paid' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                {f === 'all' ? 'Tudo' : f === 'pending' ? 'Pend' : 'Pagos'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="p-5 border-none bg-gradient-to-br from-[#111111] to-[#0d0d0d] shadow-2xl relative overflow-hidden rounded-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-[60px] -mr-12 -mt-12" />
          
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-white/5">
              <ChevronLeft className="w-4 h-4 text-zinc-300" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>{formatMonthYear(currentMonth)}</span>
              </div>
              <button 
                onClick={handleExport}
                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                title="Exportar Extrato"
              >
                <Share className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-white/5">
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          {/* Unified Row Summary */}
          <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/40 rounded-xl border border-white/5 divide-x divide-white/5 overflow-hidden">
            <div className="p-3 text-center">
              <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saldo Real</p>
              <p className={cn("text-[11px] font-black", summary.balance >= 0 ? "text-white" : "text-red-500")}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Entradas</p>
              <p className="text-[11px] font-black text-green-500">
                {formatCurrency(summary.predictedIncome)}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saídas</p>
              <p className="text-[11px] font-black text-red-500">
                {formatCurrency(summary.predictedExpense)}
              </p>
            </div>
          </div>
        </Card>
      </header>

      {/* Timeline */}
      <div className="px-6 space-y-8">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-12 bg-[#111111] rounded-xl border border-white/5 shadow-2xl">
            <p className="text-zinc-400 font-black uppercase tracking-[0.2em] mb-1 leading-loose">Nada aqui.</p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Seus lançamentos aparecerão aqui</p>
          </div>
        ) : (
          groupedTransactions.map(({ dateStr, items }) => (
            <div key={dateStr}>
              <h3 className="text-[8px] font-black text-zinc-400 mb-3 ml-2 uppercase tracking-[0.3em]">{dateStr}</h3>
              <div className="space-y-2.5">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-center gap-4 p-3.5 bg-[#111111] rounded-xl shadow-xl border border-white/5 transition-all active:scale-[0.98]',
                      t.completed ? 'opacity-40 grayscale' : ''
                    )}
                  >
                    <button
                      onClick={() => toggleTransaction(t.id)}
                      className={cn(
                        'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shadow-lg',
                        t.completed 
                          ? 'bg-red-600 border-red-600 text-white shadow-red-900/40' 
                          : 'bg-zinc-900 border-zinc-700'
                      )}
                    >
                      {t.completed && <Check className="w-4 h-4 stroke-[4]" />}
                    </button>
                    
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <p className={cn(
                        'text-xs font-bold text-white truncate tracking-tight',
                        t.completed && 'line-through text-zinc-500 opacity-60'
                      )}>
                        {t.description}
                      </p>
                      <p className={cn(
                        'text-xs font-black shrink-0',
                        t.type === 'income' ? 'text-green-500' : 'text-red-500'
                      )}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1 text-zinc-600 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FABs */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
        <button
          onClick={() => {
            setModalType('income');
            setIsModalOpen(true);
          }}
          className="w-11 h-11 rounded-full bg-white text-black shadow-2xl shadow-white/5 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
        <button
          onClick={() => {
            setModalType('expense');
            setIsModalOpen(true);
          }}
          className="w-11 h-11 rounded-full bg-red-600 text-white shadow-2xl shadow-red-500/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Minus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingId ? 'Editar Lançamento' : (modalType === 'income' ? 'Nova Entrada' : modalType === 'expense' ? 'Nova Saída' : 'Novo Investimento')}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {modalType !== 'investment' && (
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Descrição</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-4 bg-zinc-900 border-none rounded-[1.5rem] focus:ring-2 focus:ring-red-500 text-base font-bold text-white placeholder:text-zinc-600 shadow-inner"
                placeholder="Ex: Aluguel, Salário..."
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Valor (R$)</label>
            <input
              type="number"
              required
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-900 border-none rounded-[1.5rem] focus:ring-2 focus:ring-red-500 text-base font-bold text-white placeholder:text-zinc-600 shadow-inner"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-900 border-none rounded-[1.5rem] focus:ring-2 focus:ring-red-500 text-base font-bold text-white shadow-inner"
            />
          </div>
          {modalType !== 'investment' && (
            <>
              <div className="flex items-center gap-4 py-2 ml-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-white/5 bg-zinc-900 text-red-600 focus:ring-red-500 ring-offset-black"
                />
                <label htmlFor="recurring" className="text-sm font-black text-zinc-400 uppercase tracking-widest">Repetir mensalmente</label>
              </div>
              {recurring && (
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Quantidade de meses</label>
                  <input
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    min="2"
                    max="60"
                    className="w-full px-6 py-4 bg-zinc-900 border-none rounded-[1.5rem] focus:ring-2 focus:ring-red-500 text-base font-bold text-white shadow-inner"
                  />
                </div>
              )}
            </>
          )}
          <Button type="submit" className="w-full py-4 mt-4 mb-6" variant={modalType === 'income' ? 'primary' : modalType === 'expense' ? 'danger' : 'primary'}>
            {editingId ? 'Salvar Alterações' : `Adicionar ${modalType === 'income' ? 'Entrada' : modalType === 'expense' ? 'Saída' : 'Investimento'}`}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
