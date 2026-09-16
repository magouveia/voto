import React, { useState, useEffect } from 'react';
import { Club, Athlete } from '../types';
import { ESCALOES, CATEGORIES } from '../lib/utils';
import { Trophy, Shield, User, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  clubs: Club[];
  onFinish: () => void;
}

export default function VotingFlow({ clubs, onFinish }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [escalao, setEscalao] = useState<string>('');
  const [clubA, setClubA] = useState<string>('');
  const [clubB, setClubB] = useState<string>('');
  
  const [athletesA, setAthletesA] = useState<Athlete[]>([]);
  const [athletesB, setAthletesB] = useState<Athlete[]>([]);
  
  const [votes, setVotes] = useState<Record<string, string>>({}); // category -> cipa
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 3 && clubA && clubB && escalao) {
      fetchMatchAthletes();
    }
  }, [step]);

  const fetchMatchAthletes = async () => {
    try {
      const res = await fetch('/api/athletes');
      const all: Athlete[] = await res.json();
      
      const filteredA = all.filter(a => a.club_id.toString() === clubA && a.escalao === escalao);
      const filteredB = all.filter(a => a.club_id.toString() === clubB && a.escalao === escalao);
      
      setAthletesA(filteredA);
      setAthletesB(filteredB);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextStep1 = () => {
    if (escalao) setStep(2);
  };

  const handleNextStep2 = () => {
    if (clubA && clubB && clubA !== clubB) setStep(3);
    else alert('Selecione dois clubes diferentes que se vão defrontar.');
  };

  const submitVotes = async () => {
    if (Object.keys(votes).length === 0) {
      alert('Selecione pelo menos uma atleta para votar.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        match_escalao: escalao,
        club_a_id: parseInt(clubA),
        club_b_id: parseInt(clubB),
        votes: Object.entries(votes).map(([category, cipa]) => ({ category, athlete_cipa: cipa }))
      };
      
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setStep(4);
      } else {
        alert('Erro ao submeter votos.');
      }
    } catch (e) {
      alert('Erro de rede.');
    }
    setLoading(false);
  };

  const combinedAthletes = [...athletesA, ...athletesB].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative">
      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Passo 1: Escolher Escalão</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {ESCALOES.map(e => (
                <button 
                  key={e} 
                  onClick={() => setEscalao(e)}
                  className={`p-4 rounded-xl font-semibold text-left transition-all border-2 ${escalao === e ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <button disabled={!escalao} onClick={handleNextStep1} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
            <button onClick={() => setStep(1)} className="text-slate-400 font-semibold text-sm mb-4 hover:text-slate-800">← Voltar</button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Passo 2: O Jogo</h2>
            <p className="text-slate-500 mb-8 font-medium">Quem vai jogar no escalão <span className="text-blue-600 font-bold">{escalao}</span>?</p>
            
            <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
              <div className="w-full flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Equipa A</label>
                <select value={clubA} onChange={e => setClubA(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-lg font-semibold">
                  <option value="">Selecione...</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="font-black text-2xl text-slate-300">VS</div>
              <div className="w-full flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Equipa B</label>
                <select value={clubB} onChange={e => setClubB(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-lg font-semibold">
                  <option value="">Selecione...</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <button disabled={!clubA || !clubB || clubA === clubB} onClick={handleNextStep2} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              Ver Atletas <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
            <button onClick={() => setStep(2)} className="text-slate-400 font-semibold text-sm mb-4 hover:text-slate-800">← Voltar</button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Passo 3: A Sua Votação</h2>
            <p className="text-slate-500 mb-8 font-medium">Selecione as atletas que mais se destacaram. Só aparecem as atletas do escalão <span className="text-blue-600 font-bold">{escalao}</span> pertencentes a estas duas equipas.</p>
            
            {combinedAthletes.length === 0 ? (
              <div className="p-8 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-center mb-8">
                <p className="font-bold mb-2">Sem atletas disponíveis!</p>
                <p className="text-sm">Não existem atletas registadas neste escalão para estas equipas. Vá à secção de Administração para as adicionar.</p>
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {CATEGORIES.map(cat => {
                  const icons = {
                    'Melhor Jogadora': <Trophy className="w-5 h-5 text-amber-500" />,
                    'Melhor Defensora': <Shield className="w-5 h-5 text-blue-500" />,
                    'Melhor Guarda Redes': <User className="w-5 h-5 text-emerald-500" />
                  };
                  return (
                    <div key={cat} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                        {icons[cat as keyof typeof icons]} {cat}
                      </h3>
                      <select 
                        value={votes[cat] || ''} 
                        onChange={e => setVotes({...votes, [cat]: e.target.value})}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none font-semibold text-slate-700"
                      >
                        <option value="">-- Não Atribuir --</option>
                        {combinedAthletes.map(a => {
                          const clubName = clubs.find(c => c.id === a.club_id)?.name;
                          return (
                            <option key={a.cipa} value={a.cipa}>{a.name} ({clubName} - CIPA: {a.cipa})</option>
                          );
                        })}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            <button disabled={loading || combinedAthletes.length === 0} onClick={submitVotes} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition-colors shadow-md shadow-blue-200">
              {loading ? 'A processar...' : 'Submeter Votos Finais'}
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-6 max-w-sm mx-auto py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2"><CheckCircle2 className="w-12 h-12" /></div>
            <h2 className="text-3xl font-extrabold text-slate-900">Votos Registados!</h2>
            <p className="text-slate-600 font-medium">Obrigado pela sua contribuição. Os votos foram gravados com sucesso na base de dados (associados ao CIPA).</p>
            <button onClick={() => { setStep(1); setEscalao(''); setClubA(''); setClubB(''); setVotes({}); onFinish(); }} className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl w-full">
              Voltar ao Início
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
