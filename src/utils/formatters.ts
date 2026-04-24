/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ptBR });
};

export const formatMonthYear = (date: Date) => {
  if (!date) return '';
  return format(date, 'MMMM yyyy', { locale: ptBR });
};

export const isSameDay = (date1: string, date2: Date) => {
  if (!date1 || !date2) return false;
  try {
    const d1 = startOfDay(parseISO(date1));
    const d2 = startOfDay(date2);
    return d1.getTime() === d2.getTime();
  } catch (e) {
    return false;
  }
};

export const isSameMonth = (date1: string, date2: Date) => {
  if (!date1 || !date2) return false;
  try {
    const d1 = parseISO(date1);
    return d1.getMonth() === date2.getMonth() && d1.getFullYear() === date2.getFullYear();
  } catch (e) {
    return false;
  }
};
