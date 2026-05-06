import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Card } from './UI';
import { User, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onSession: (session: any) => void;
}

export function Auth({ onSession }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSession(data.session);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
            {isRegister ? 'Criar Conta' : 'Zona de Foco'}
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            {isRegister ? 'Junte-se a nós para organizar sua vida.' : 'Bom te ver de volta! Use suas credenciais.'}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 text-sm font-bold placeholder:text-zinc-300 outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 text-sm font-bold placeholder:text-zinc-300 outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all"
                  required
                />
              </div>

              {isRegister && (
                <div className="relative group animate-in slide-in-from-top-2">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 text-sm font-bold placeholder:text-zinc-300 outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all"
                    required
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-black uppercase tracking-widest animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Cadastrar agora' : 'Entrar na conta'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-zinc-400 hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            {isRegister
              ? 'Já tem uma conta? Entre aqui'
              : 'Não tem conta? Cadastre-se gratuitamente'}
          </button>
        </div>
      </div>
    </div>
  );
}
