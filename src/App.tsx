/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wallet, CheckSquare, Target, Calendar, ListChecks, BookOpen, LogOut, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { useAppStore } from './store/useAppStore';
import { Auth } from './components/Auth';
import Finance from './modules/Finance';
import Tasks from './modules/Tasks';
import Goals from './modules/Goals';
import Habits from './modules/Habits';
import Lists from './modules/Lists';
import Diary from './modules/Diary';
import { cn, Button } from './components/UI';

type Module = 'finance' | 'tasks' | 'goals' | 'habits' | 'lists' | 'diary';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('tasks');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        setSession(session);
        if (session?.user) {
          let p = await fetchProfile(session.user.id);
          
          // Retry logic: Trigger might take a second to create the profile
          if (!p) {
            await new Promise(r => setTimeout(r, 1000));
            p = await fetchProfile(session.user.id);
          }
          
          setProfile(p);
          // Load operational data
          useAppStore.getState().loadData();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        // Safety: Ensure loading is always disabled
        setLoading(false);
      }
    };

    // Emergency timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn('Auth initialization timed out after 5s');
          return false;
        }
        return false;
      });
    }, 5000);

    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        // Load operational data
        useAppStore.getState().loadData();
      } else {
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-6 text-zinc-400">
        <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Carregando sistema...</span>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-red-100 animate-bounce">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-black text-black uppercase tracking-tight mb-4">Configuração Pendente</h1>
        <p className="text-zinc-500 text-sm font-medium max-w-xs leading-relaxed mb-8">
          Para ativar o sistema de autenticação, você precisa adicionar as chaves do Supabase nas configurações do projeto.
        </p>
        <div className="space-y-3 w-full max-w-xs mx-auto">
          <div className="p-4 bg-white border border-zinc-200 rounded-xl text-left">
            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Passo 1</p>
            <p className="text-[10px] font-bold text-black">Acesse as chaves em Settings &gt; API do Supabase</p>
          </div>
          <div className="p-4 bg-white border border-zinc-200 rounded-xl text-left">
            <p className="text-[8px] font-black uppercase text-zinc-400 mb-1">Passo 2</p>
            <p className="text-[10px] font-bold text-black">Adicione <code className="bg-zinc-100 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-zinc-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> no menu de settings deste app.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onSession={setSession} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'finance':
        return <Finance onBack={() => {}} />;
      case 'tasks':
        return <Tasks onBack={() => {}} />;
      case 'goals':
        return <Goals onBack={() => {}} />;
      case 'habits':
        return <Habits onBack={() => {}} />;
      case 'lists':
        return <Lists onBack={() => {}} />;
      case 'diary':
        return <Diary onBack={() => {}} />;
      default:
        return <Tasks onBack={() => {}} />;
    }
  };

  const navItems: { id: Module; icon: React.ReactNode; label: string }[] = [
    { id: 'tasks', icon: <CheckSquare className="w-5 h-5" />, label: "Tarefas" },
    { id: 'habits', icon: <Calendar className="w-5 h-5" />, label: "Hábitos" },
    { id: 'goals', icon: <Target className="w-5 h-5" />, label: "Metas" },
    { id: 'finance', icon: <Wallet className="w-5 h-5" />, label: "Finanças" },
    { id: 'lists', icon: <ListChecks className="w-5 h-5" />, label: "Listas" },
    { id: 'diary', icon: <BookOpen className="w-5 h-5" />, label: "Diário" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-zinc-900 font-sans selection:bg-red-500/10">
      {/* Header with User Info */}
      <header className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-zinc-400 leading-none mb-1">
              Bem-vindo(a) {profile?.role ? `• ${profile.role}` : ''}
            </p>
            <p className="text-[12px] font-bold text-black truncate max-w-[120px]">{session.user.email}</p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="p-2 border border-zinc-200 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all group"
          title="Sair"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </button>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto min-h-screen relative pb-32">
        {renderModule()}
      </main>

      {/* Persistent Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-200 z-50 shadow-2xl">
        <div className="max-w-md mx-auto flex justify-between items-center h-20 px-4">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              active={activeModule === item.id}
              onClick={() => setActiveModule(item.id)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({
  active,
  onClick,
  icon,
  label,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 flex-1',
        active ? 'text-red-600' : 'text-zinc-400'
      )}
    >
      <div className={cn(
        'p-1.5 rounded-xl transition-colors',
        active ? 'bg-red-50' : 'bg-transparent'
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest leading-none",
        active ? "text-red-700" : "text-zinc-400"
      )}>
        {label}
      </span>
    </button>
  );
}
