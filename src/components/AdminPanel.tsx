import React, { useState, useEffect } from 'react';
import { Club, Athlete } from '../types';
import { Settings, Users, Trash2, Pencil, Save } from 'lucide-react';

interface Props {
  clubs: Club[];
  fetchClubs: () => void;
}

export default function AdminPanel({ clubs, fetchClubs }: Props) {
  const [activeTab, setActiveTab] = useState<'clubs' | 'athletes'>('clubs');
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  const [clubName, setClubName] = useState('');
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const [athleteCipa, setAthleteCipa] = useState('');
  const [athleteName, setAthleteName] = useState('');
  const [athleteClubId, setAthleteClubId] = useState('');
  const [athleteBirthDate, setAthleteBirthDate] = useState('');
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      const res = await fetch('/api/athletes');
      if (res.ok) {
        setAthletes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingClub ? `/api/clubs/${editingClub.id}` : '/api/clubs';
      const method = editingClub ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clubName })
      });
      setClubName('');
      setEditingClub(null);
      fetchClubs();
    } catch (e) {
      alert("Erro ao guardar clube");
    }
  };

  const deleteClub = async (id: number) => {
    if (!confirm('Apagar clube? Todos os atletas e votos associados serão removidos.')) return;
    try {
      await fetch(`/api/clubs/${id}`, { method: 'DELETE' });
      fetchClubs();
      fetchAthletes();
    } catch (e) {
      alert("Erro ao apagar clube");
    }
  };

  const saveAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAthlete ? `/api/athletes/${editingAthlete.id}` : '/api/athletes';
      const method = editingAthlete ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: parseInt(athleteClubId),
          cipa: athleteCipa,
          name: athleteName,
          birth_date: athleteBirthDate
        })
      });
      setAthleteCipa('');
      setAthleteName('');
      setAthleteBirthDate('');
      setAthleteClubId('');
      setEditingAthlete(null);
      fetchAthletes();
    } catch (e) {
      alert("Erro ao guardar atleta");
    }
  };

  const deleteAthlete = async (id: number) => {
    if (!confirm('Apagar atleta? Votos associados serão removidos.')) return;
    try {
      await fetch(`/api/athletes/${id}`, { method: 'DELETE' });
      fetchAthletes();
    } catch (e) {
      alert("Erro ao apagar atleta");
    }
  };

  const resetVotes = async () => {
    if (!confirm('APAGAR TODOS OS VOTOS? Esta ação é irreversível.')) return;
    try {
      await fetch('/api/votes/reset', { method: 'DELETE' });
      alert('Votos apagados com sucesso.');
    } catch (e) {
      alert("Erro ao limpar votos");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('clubs')}
          className={`px-4 py-3 font-semibold ${activeTab === 'clubs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> Gestão de Clubes</div>
        </button>
        <button 
          onClick={() => setActiveTab('athletes')}
          className={`px-4 py-3 font-semibold ${activeTab === 'athletes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Gestão de Atletas</div>
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={resetVotes} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
          ⚠️ Reset a todos os Votos
        </button>
      </div>

      {activeTab === 'clubs' && (
        <div className="space-y-6">
          <form onSubmit={saveClub} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Clube</label>
              <input required type="text" value={clubName} onChange={e => setClubName(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 h-[42px] rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm">
              <Save className="w-4 h-4" /> {editingClub ? 'Atualizar' : 'Criar Clube'}
            </button>
            {editingClub && <button type="button" onClick={() => { setEditingClub(null); setClubName(''); }} className="px-6 py-2 h-[42px] bg-slate-200 rounded-xl font-bold text-slate-700">Cancelar</button>}
          </form>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Clubes Registados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clubs.map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 border rounded-xl bg-slate-50">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingClub(c); setClubName(c.name); }} className="p-2 text-slate-500 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteClub(c.id)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'athletes' && (
        <div className="space-y-6">
          <form onSubmit={saveAthlete} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">CIPA</label>
              <input required type="text" value={athleteCipa} onChange={e => setAthleteCipa(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
              <input required type="text" value={athleteName} onChange={e => setAthleteName(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Data Nascimento</label>
              <input required type="date" value={athleteBirthDate} onChange={e => setAthleteBirthDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Clube</label>
              <select required value={athleteClubId} onChange={e => setAthleteClubId(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white">
                <option value="">Selecione...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-900 text-white py-2 h-[42px] rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm text-sm">
                {editingAthlete ? 'Guardar' : 'Adicionar'}
              </button>
              {editingAthlete && <button type="button" onClick={() => { setEditingAthlete(null); setAthleteCipa(''); setAthleteName(''); setAthleteBirthDate(''); setAthleteClubId(''); }} className="flex-1 bg-slate-200 py-2 h-[42px] rounded-xl font-bold text-slate-700 text-sm">X</button>}
            </div>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Atletas Registadas</h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-3 rounded-tl-lg">CIPA</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Clube</th>
                  <th className="p-3">Escalão</th>
                  <th className="p-3 rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {athletes.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-medium text-slate-700">{a.cipa}</td>
                    <td className="p-3 font-semibold text-slate-900">{a.name}</td>
                    <td className="p-3 text-slate-600">{clubs.find(c => c.id === a.club_id)?.name}</td>
                    <td className="p-3 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{a.escalao}</span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditingAthlete(a); setAthleteCipa(a.cipa); setAthleteName(a.name); setAthleteBirthDate(a.birth_date.split('T')[0]); setAthleteClubId(a.club_id.toString()); }} className="text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteAthlete(a.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {athletes.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma atleta registada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
