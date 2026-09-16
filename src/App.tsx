import React, { useState, useEffect } from 'react';
import { Club } from './types';
import AdminPanel from './components/AdminPanel';
import VotingFlow from './components/VotingFlow';
import ResultsPanel from './components/ResultsPanel';
import { Lock, Home, BarChart3, Edit3, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ViewMode = 'vote' | 'results' | 'admin' | 'admin-login';

export default function App() {
  const [view, setView] = useState<ViewMode>('vote');
  const [clubs, setClubs] = useState<Club[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginPass, setLoginPass] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await fetch('/api/clubs');
      if (res.ok) setClubs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPass === 'mg1982') {
      setIsAdmin(true);
      setView('admin');
      setLoginPass('');
    } else {
      alert('Password incorreta');
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setView('vote');
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-slate-800 font-sans flex flex-col">
      <header className="bg-slate-900 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('vote')}>
              <img src="https://imgur.com/l2NgZN4.png" alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
              <h1 className="text-xl font-extrabold tracking-tight">CCCA <span className="text-blue-400">Andebol</span></h1>
            </div>
            
            <nav className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setView('vote')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${view === 'vote' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <Home className="w-4 h-4 hidden sm:block" /> Votar
              </button>
              <button 
                onClick={() => setView('results')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${view === 'results' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <BarChart3 className="w-4 h-4 hidden sm:block" /> Resultados
              </button>
              
              <div className="w-px h-6 bg-slate-700 mx-2"></div>
              
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setView('admin')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${view === 'admin' ? 'bg-blue-600 text-white' : 'text-blue-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <Lock className="w-4 h-4 hidden sm:block" /> Admin
                  </button>
                  <button onClick={logoutAdmin} className="px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setView('admin-login')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${view === 'admin-login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Lock className="w-4 h-4 hidden sm:block" /> Login Admin
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
        <AnimatePresence mode="wait">
          
          {view === 'vote' && (
            <motion.div key="vote" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              <div className="text-center mb-8">
                <img src="https://imgur.com/l2NgZN4.png" alt="Torneio CCCANDEBOL Logo" className="w-48 h-auto object-contain drop-shadow-lg mx-auto mb-4" referrerPolicy="no-referrer" />
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                  Votação em Jogo
                </h1>
                <p className="text-slate-600 font-medium">Selecione as equipas e vote nas melhores em campo.</p>
              </div>
              <VotingFlow clubs={clubs} onFinish={() => setView('results')} />
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              <ResultsPanel />
            </motion.div>
          )}

          {view === 'admin-login' && (
            <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm mt-12">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Lock className="w-6 h-6" /></div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Acesso Restrito</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <input type="password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium" />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-md">
                    Entrar
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'admin' && isAdmin && (
            <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              <AdminPanel clubs={clubs} fetchClubs={fetchClubs} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
