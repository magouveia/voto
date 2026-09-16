import React, { useState, useEffect } from 'react';
import { Trophy, ChevronRight, CheckCircle2, Shield, User, BarChart3, RotateCcw, Home, Lock, LogOut, Settings, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ViewState = 'welcome' | 'form' | 'success' | 'admin';
type AdminTab = 'resultados' | 'clubes';

interface Vote {
  id: string;
  clubeVotante: string;
  escalao: string;
  premio: string;
  numeroAtleta: number;
  nomeAtleta: string;
  timestamp: string;
}

interface Club {
  id: string;
  escalao: string;
  name: string;
  url: string;
}

const ESCALOES = ['Sub-14', 'Sub-16', 'Sub-18', 'Seniores'];
const PREMIOS = ['Melhor Jogadora', 'Melhor Defensora', 'Melhor Guarda Redes'];

export default function App() {
  const [view, setView] = useState<ViewState>('welcome');
  const [votes, setVotes] = useState<Vote[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('resultados');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Form state
  const [clubeVotante, setClubeVotante] = useState('');
  const [escalao, setEscalao] = useState(ESCALOES[0]);
  
  // 3-in-1 Votes state
  const [votesState, setVotesState] = useState<Record<string, { clubeAtletaId: string, numero: string, nome: string }>>({
    'Melhor Jogadora': { clubeAtletaId: '', numero: '', nome: '', cipa: '' },
    'Melhor Defensora': { clubeAtletaId: '', numero: '', nome: '', cipa: '' },
    'Melhor Guarda Redes': { clubeAtletaId: '', numero: '', nome: '', cipa: '' }
  });

  // Scraper cache
  const [isScraping, setIsScraping] = useState<Record<string, boolean>>({});
  const [clubAthletesCache, setClubAthletesCache] = useState<Record<string, {numero: number | null, nome: string, cipa?: string}[]>>({});

  // Admin Config Clubs state
  const [newClubName, setNewClubName] = useState('');
  const [newClubUrl, setNewClubUrl] = useState('');
  const [selectedEscalao, setSelectedEscalao] = useState(ESCALOES[0]);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchClubs();
    const handleHashChange = () => {
      if (window.location.hash === '#/admin') setView('admin');
      else setView('welcome');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (view === 'admin' && isAdminAuthenticated && adminTab === 'resultados') {
      fetchVotes();
    }
  }, [view, isAdminAuthenticated, adminTab]);

  const fetchClubs = async () => {
    try {
      const res = await fetch('/api/clubs');
      if (res.ok) {
        const data = await res.json();
        setClubs(data);
      }
    } catch (e) { console.error('Failed to fetch clubs', e); }
  };

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/votes');
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
      }
    } catch (e) { console.error('Failed to fetch votes', e); }
    setLoading(false);
  };

  const handleLoadClubAthletes = async (clubId: string, clubUrl: string) => {
    if (clubAthletesCache[clubId]) return;
    setIsScraping(prev => ({ ...prev, [clubId]: true }));
    try {
      const res = await fetch('/api/scraper/fpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clubUrl })
      });
      const data = await res.json();
      if (data.success) {
        setClubAthletesCache(prev => ({ ...prev, [clubId]: data.atletas }));
      }
    } catch (e) {
      console.error("Erro ao carregar atletas", e);
    }
    setIsScraping(prev => ({ ...prev, [clubId]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubeVotante) return;
    
    setLoading(true);
    try {
      await Promise.all(PREMIOS.map(premio => {
        const v = votesState[premio];
        if (!v.numero || !v.nome) return Promise.resolve(); // Skip empty
        return fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clubeVotante,
            escalao,
            premio,
            numeroAtleta: parseInt(v.numero, 10),
            nomeAtleta: v.nome,
            cipaAtleta: v.cipa || v.cipaAtleta || ""
          })
        });
      }));
      
      setView('success');
      // Reset
      setClubeVotante('');
      setEscalao(ESCALOES[0]);
      setVotesState({
        'Melhor Jogadora': { clubeAtletaId: '', numero: '', nome: '', cipa: '' },
        'Melhor Defensora': { clubeAtletaId: '', numero: '', nome: '', cipa: '' },
        'Melhor Guarda Redes': { clubeAtletaId: '', numero: '', nome: '', cipa: '' }
      });
    } catch (e) {
      alert('Erro ao submeter votos. Tente novamente.');
    }
    setLoading(false);
  };

  const handleUpdateVoteState = (premio: string, field: string, value: string) => {
    setVotesState(prev => ({
      ...prev,
      [premio]: {
        ...prev[premio],
        [field]: value
      }
    }));
  };

  const renderWelcome = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center space-y-8">
      <div className="mb-4">
        <img src="https://imgur.com/l2NgZN4.png" alt="Torneio CCCANDEBOL Logo" className="w-48 h-auto object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Bem vindo ao 2º Torneio<br/>
          <span className="inline-flex mt-2 items-center">
            <span className="text-blue-600">CCCA</span><span className="text-red-600">NDEBOL</span>
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">Vote nas atletas que mais se destacaram neste jogo.</p>
      </div>
      <button onClick={() => setView('form')} className="mt-8 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95">
        INICIAR VOTAÇÃO <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );

  const availableClubs = clubs.filter(c => c.escalao === escalao);

  const renderForm = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-8">
      <div className="bg-slate-50 px-6 py-6 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => setView('welcome')} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><RotateCcw className="w-5 h-5 text-slate-600" /></button>
        <h2 className="text-xl font-bold text-slate-900">Registar Votos</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Escalão do Jogo</label>
            <select value={escalao} onChange={e => { setEscalao(e.target.value); setClubeVotante(''); }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none">
              {ESCALOES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clube Votante</label>
            <div className="relative">
              <Shield className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {availableClubs.length > 0 ? (
                <select required value={clubeVotante} onChange={e => setClubeVotante(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none">
                  <option value="">Selecione o seu clube...</option>
                  {availableClubs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input required type="text" value={clubeVotante} onChange={e => setClubeVotante(e.target.value)} placeholder="Sem clubes configurados. Escreva..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {PREMIOS.map(premio => {
            const v = votesState[premio];
            const currentAthletes = clubAthletesCache[v.clubeAtletaId] || [];
            return (
              <div key={premio} className="border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                <h3 className="font-bold text-lg text-slate-800 mb-4">{premio}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Equipa da Atleta</label>
                    <select 
                      value={v.clubeAtletaId} 
                      onChange={e => {
                        const clubId = e.target.value;
                        handleUpdateVoteState(premio, 'clubeAtletaId', clubId);
                        handleUpdateVoteState(premio, 'numero', '');
                        handleUpdateVoteState(premio, 'nome', '');
                        if (clubId) {
                          const c = clubs.find(cl => cl.id === clubId);
                          if (c) handleLoadClubAthletes(c.id, c.url);
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione a equipa...</option>
                      {availableClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Número</label>
                      <input
                        type="number" min="1" value={v.numero} onChange={e => handleUpdateVoteState(premio, 'numero', e.target.value)} placeholder="Nº"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-center"
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Atleta</label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        {currentAthletes.length > 0 ? (
                          <select
                            value={v.nome}
                            onChange={e => handleUpdateVoteState(premio, 'nome', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all appearance-none"
                          >
                            <option value="">Selecione...</option>
                            {currentAthletes.map((a, i) => (
                              <option key={`nome-${i}`} value={a.nome}>
                                {a.nome} {a.cipa ? `(CIPA: ${a.cipa})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text" value={v.nome} onChange={e => handleUpdateVoteState(premio, 'nome', e.target.value)} placeholder={isScraping[v.clubeAtletaId] ? "A importar..." : "Nome"} disabled={isScraping[v.clubeAtletaId]}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
          {loading ? 'A processar...' : 'Enviar Votos'}
        </button>
      </form>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-6 max-w-sm">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2"><CheckCircle2 className="w-10 h-10" /></div>
      <h2 className="text-2xl font-bold text-slate-900">Votos Registados!</h2>
      <p className="text-slate-600">Obrigado por participares e ajudares a eleger as melhores atletas deste jogo.</p>
      <button onClick={() => setView('welcome')} className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-full font-semibold transition-colors w-full">Voltar ao Início</button>
    </motion.div>
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'mg1982') { setIsAdminAuthenticated(true); setLoginError(false); }
    else { setLoginError(true); }
  };

  const renderAdminLogin = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3"><Lock className="w-6 h-6 text-blue-400" /><h2 className="text-xl font-bold text-white">Acesso Restrito</h2></div>
      </div>
      <form onSubmit={handleLogin} className="p-6 space-y-5">
        {loginError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">Credenciais inválidas. Tente novamente.</div>}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Utilizador</label>
          <input type="text" required value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Palavra-passe</label>
          <input type="password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
        </div>
        <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]">Entrar</button>
        <button type="button" onClick={() => { window.location.hash = ''; setView('welcome'); }} className="w-full flex items-center justify-center gap-2 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition-all"><Home className="w-5 h-5" />Voltar à Homepage</button>
      </form>
    </motion.div>
  );

  const renderConfigClubs = () => {
    const handleAddClub = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const method = editingClubId ? 'PUT' : 'POST';
        const endpoint = editingClubId ? `/api/clubs/${editingClubId}` : '/api/clubs';
        const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escalao: selectedEscalao, name: newClubName, url: newClubUrl }) });
        if (res.ok) {
          setNewClubName(''); setNewClubUrl(''); setEditingClubId(null); fetchClubs();
        }
      } catch (e) { alert("Erro ao guardar clube."); }
      setIsSaving(false);
    };

    const handleCancelEdit = () => {
      setEditingClubId(null);
      setNewClubName('');
      setNewClubUrl('');
    };

    const handleEditClick = (club: any) => {
      setEditingClubId(club.id);
      setNewClubName(club.name);
      setNewClubUrl(club.url || '');
      setSelectedEscalao(club.escalao);
    };

    const handleRemoveClub = async (id: string) => {
      try {
        await fetch(`/api/clubs/${id}`, { method: 'DELETE' });
        fetchClubs();
      } catch (e) { alert("Erro ao remover clube."); }
    };

    return (
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" /> {editingClubId ? 'Editar Clube' : 'Configuração de Clubes por Escalão'}</h3>
        
        <form onSubmit={handleAddClub} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Escalão</label>
            <select value={selectedEscalao} onChange={e => setSelectedEscalao(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none">
              {ESCALOES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Clube</label>
            <input required type="text" value={newClubName} onChange={e => setNewClubName(e.target.value)} placeholder="Ex: CSS Pinhal de Frades" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Plantel (CIPAs das Atletas)</label>
            <input type="text" value={newClubUrl} onChange={e => setNewClubUrl(e.target.value)} placeholder="Ex: 259061, 239088, ..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" title="Coloque os CIPAs separados por vírgula" />
          </div>
          <div className="flex gap-2 w-full">
            {editingClubId && (
              <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-bold transition-all shadow-sm">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={isSaving} className={`${editingClubId ? 'w-2/3' : 'w-full'} bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]`}>
              {isSaving ? 'A guardar...' : editingClubId ? 'Atualizar Clube' : 'Adicionar Clube'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {ESCALOES.map(esc => {
            const list = clubs.filter(c => c.escalao === esc);
            if (list.length === 0) return null;
            return (
              <div key={esc}>
                <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">{esc}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {list.map(club => (
                    <div key={club.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{club.name}</p>
                        {club.url && <p className="text-xs text-slate-500 truncate max-w-[200px] block mt-1" title={club.url}>Plantel: {club.url}</p>}
                      </div>
                      <div className="flex items-center">
                        <button onClick={() => handleEditClick(club)} className="text-slate-400 hover:text-blue-600 p-2 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleRemoveClub(club.id)} className="text-slate-400 hover:text-red-600 p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    const grouped: Record<string, Record<string, Record<string, { nome: string, numero: number, count: number }>>> = {};
    votes.forEach(v => {
      if (!grouped[v.escalao]) grouped[v.escalao] = {};
      if (!grouped[v.escalao][v.premio]) grouped[v.escalao][v.premio] = {};
      const athleteKey = `${v.numeroAtleta}-${v.nomeAtleta.toLowerCase()}`;
      if (!grouped[v.escalao][v.premio][athleteKey]) grouped[v.escalao][v.premio][athleteKey] = { nome: v.nomeAtleta, numero: v.numeroAtleta, count: 0 };
      grouped[v.escalao][v.premio][athleteKey].count++;
    });

    return (
      <div className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Painel de Administração</h2>
            <div className="flex gap-4 mt-3">
              <button onClick={() => setAdminTab('resultados')} className={`font-semibold text-sm pb-1 border-b-2 transition-colors ${adminTab === 'resultados' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Resultados ({votes.length})</button>
              <button onClick={() => setAdminTab('clubes')} className={`font-semibold text-sm pb-1 border-b-2 transition-colors ${adminTab === 'clubes' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Configurar Clubes ({clubs.length})</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { window.location.hash = ''; setView('welcome'); setIsAdminAuthenticated(false); setLoginPass(''); setLoginUser(''); }} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"><Home className="w-4 h-4" /> Homepage</button>
            {adminTab === 'resultados' && (
              <button onClick={fetchVotes} disabled={loading} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"><RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
            )}
            <button onClick={() => { setIsAdminAuthenticated(false); setLoginPass(''); setLoginUser(''); }} className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm" title="Terminar Sessão"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        {adminTab === 'clubes' && renderConfigClubs()}
        
        {adminTab === 'resultados' && Object.keys(grouped).length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-500">Nenhum voto registado ainda.</p></div>
        ) : adminTab === 'resultados' && (
          <div className="space-y-8">
            {ESCALOES.filter(e => grouped[e]).map(escalao => (
              <div key={escalao} className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4"><h3 className="text-xl font-bold text-white">{escalao}</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PREMIOS.filter(p => grouped[escalao][p]).map(premio => {
                    const athletes = Object.values(grouped[escalao][premio]).sort((a, b) => b.count - a.count);
                    return (
                      <div key={premio} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">{premio}</h4>
                        <ul className="space-y-3">
                          {athletes.map((ath, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</span>
                                <div><p className="text-sm font-semibold text-slate-900"><span className="text-slate-500 mr-1">#{ath.numero}</span>{ath.nome}</p></div>
                              </div>
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{ath.count} {ath.count === 1 ? 'voto' : 'votos'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col items-center justify-center p-4 selection:bg-amber-100 selection:text-amber-900 font-sans">
      <AnimatePresence mode="wait">
        {view === 'welcome' && <div key="welcome" className="w-full flex justify-center">{renderWelcome()}</div>}
        {view === 'form' && <div key="form" className="w-full flex justify-center py-8">{renderForm()}</div>}
        {view === 'success' && <div key="success" className="w-full flex justify-center">{renderSuccess()}</div>}
        {view === 'admin' && !isAdminAuthenticated && <div key="admin-login" className="w-full flex justify-center items-center">{renderAdminLogin()}</div>}
        {view === 'admin' && isAdminAuthenticated && <div key="admin-panel" className="w-full flex justify-center items-start pt-12 min-h-screen">{renderAdmin()}</div>}
      </AnimatePresence>
      {view !== 'admin' && (
        <div className="fixed bottom-4 text-xs text-slate-400 font-medium"><a href="#/admin" className="hover:text-slate-600 transition-colors">Acesso Restrito</a></div>
      )}
    </div>
  );
}
