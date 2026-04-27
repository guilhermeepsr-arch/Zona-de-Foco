/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-black',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-zinc-500 hover:bg-zinc-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 text-[11px]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-4.5 shadow-sm border border-zinc-200', 
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  hideHeader = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 pb-10 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto border-t sm:border border-zinc-200">
        {!hideHeader && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-black uppercase tracking-tight">{title}</h2>
            <button onClick={onClose} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function FAB({ onClick, icon, color = 'black' }: { onClick: () => void; icon: React.ReactNode; color?: 'black' | 'red' | 'gray' }) {
  const colors = {
    black: 'bg-zinc-900 text-white hover:bg-black shadow-zinc-200',
    red: 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20',
    gray: 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 shadow-black/5',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-6 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 z-40',
        colors[color]
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 stroke-[2.5]' })}
    </button>
  );
}

export function ProgressBar({ progress, color = 'red' }: { progress: number; color?: 'black' | 'red' | 'gray' }) {
  const colors = {
    black: 'bg-black',
    red: 'bg-red-600',
    gray: 'bg-zinc-400',
  };

  return (
    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div
        className={cn('h-full transition-all duration-700 ease-out', colors[color])}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
