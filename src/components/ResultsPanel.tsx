import React, { useState, useEffect } from 'react';
import { VoteResult } from '../types';
import { CATEGORIES } from '../lib/utils';
import { Trophy, Shield, User, Loader2, RotateCcw } from 'lucide-react';

export default function ResultsPanel() {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/votes/results');
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const icons = {
    'Melhor Jogadora': <Trophy className="w-5 h-5 text-amber-500" />,
    'Melhor Defensora': <Shield className="w-5 h-5 text-blue-500" />,
    'Melhor Guarda Redes': <User className="w-5 h-5 text-emerald-500" />
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resultados Oficiais</h2>
          <p className="text-slate-500 font-medium">Contagem absoluta agrupada pelo número CIPA da atleta.</p>
        </div>
        <button onClick={fetchResults} disabled={loading} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CATEGORIES.map(cat => {
          const catResults = results.filter(r => r.category === cat);
          
          return (
            <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg">{icons[cat as keyof typeof icons]}</div>
                <h3 className="font-bold text-lg text-white">{cat}</h3>
              </div>
              <div className="p-0">
                {catResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium">Sem votos registados.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {catResults.map((r, idx) => (
                      <li key={r.cipa} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{r.name}</p>
                            <p className="text-xs font-medium text-slate-400 font-mono">CIPA: {r.cipa}</p>
                          </div>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-black border border-blue-100">
                          {r.total_votes}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
