import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pkg from 'pg';
import * as cheerio from 'cheerio';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Set up PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment below if your Hetzner Postgres requires SSL
  // ssl: { rejectUnauthorized: false }
});

// Create tables if they don't exist
const initDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL não definido. A usar ficheiro local como fallback temporário para testes.");
    return;
  }

  try {
    // Tabela atualizada para incluir cipa_atleta (VARCHAR) e tornar o número opcional
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        clube_votante VARCHAR(255) NOT NULL,
        escalao VARCHAR(50) NOT NULL,
        premio VARCHAR(100) NOT NULL,
        numero_atleta INTEGER,
        cipa_atleta VARCHAR(50) NOT NULL,
        nome_atleta VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clubs (
        id SERIAL PRIMARY KEY,
        escalao VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL
      );
    `);
    console.log("✅ Base de dados PostgreSQL inicializada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar PostgreSQL:", error);
  }
};
initDB();

// Fallback JSON methods
const DB_FILE = path.join(__dirname, 'votes.json');
const getVotesFallback = () => {
  if (fs.existsSync(DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (e) { return []; }
  }
  return [];
};
const saveVoteFallback = (vote: any) => {
  const votes = getVotesFallback();
  const newVote = { id: Math.random().toString(36).substring(2, 9), ...vote, timestamp: new Date().toISOString() };
  votes.push(newVote);
  fs.writeFileSync(DB_FILE, JSON.stringify(votes, null, 2));
  return newVote;
};

const CLUBS_FILE = path.join(__dirname, 'clubs.json');
const getClubsFallback = () => {
  if (fs.existsSync(CLUBS_FILE)) {
    try { return JSON.parse(fs.readFileSync(CLUBS_FILE, 'utf-8')); } catch (e) { return []; }
  }
  return [];
};
const saveClubFallback = (club: any) => {
  const clubs = getClubsFallback();
  const newClub = { id: Math.random().toString(36).substring(2, 9), ...club };
  clubs.push(newClub);
  fs.writeFileSync(CLUBS_FILE, JSON.stringify(clubs, null, 2));
  return newClub;
};
const deleteClubFallback = (id: string) => {
  let clubs = getClubsFallback();
  clubs = clubs.filter((c: any) => c.id !== id);
  fs.writeFileSync(CLUBS_FILE, JSON.stringify(clubs, null, 2));
};

// API Endpoints
app.get('/api/clubs', async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json(getClubsFallback());
  try {
    const result = await pool.query('SELECT * FROM clubs ORDER BY escalao, name');
    res.json(result.rows.map(row => ({ id: row.id.toString(), escalao: row.escalao, name: row.name, url: row.url })));
  } catch (error) {
    res.status(500).json({ error: 'Falha ao obter clubes' });
  }
});

app.post('/api/clubs', async (req, res) => {
  const { escalao, name, url } = req.body;
  if (!process.env.DATABASE_URL) return res.json({ success: true, club: saveClubFallback(req.body) });
  try {
    const result = await pool.query('INSERT INTO clubs (escalao, name, url) VALUES ($1, $2, $3) RETURNING *', [escalao, name, url]);
    res.json({ success: true, club: { id: result.rows.id.toString(), escalao: result.rows.escalao, name: result.rows.name, url: result.rows.url } });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao guardar clube' });
  }
});

app.put('/api/clubs/:id', async (req, res) => {
  const { id } = req.params;
  const { name, url, escalao } = req.body;
  if (!process.env.DATABASE_URL) {
    let clubs = getClubsFallback();
    const idx = clubs.findIndex((c: any) => c.id === id);
    if (idx >= 0) {
      clubs[idx] = { ...clubs[idx], name, url, escalao };
      fs.writeFileSync(CLUBS_FILE, JSON.stringify(clubs, null, 2));
    }
    return res.json({ success: true, id });
  }
  try {
    await pool.query('UPDATE clubs SET name = $1, url = $2, escalao = $3 WHERE id = $4', [name, url, escalao, id]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao atualizar clube' });
  }
});

app.delete('/api/clubs/:id', async (req, res) => {
  const { id } = req.params;
  if (!process.env.DATABASE_URL) {
    deleteClubFallback(id);
    return res.json({ success: true });
  }
  try {
    await pool.query('DELETE FROM clubs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao remover clube' });
  }
});

app.get('/api/votes', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json(getVotesFallback());
  }
  try {
    const result = await pool.query('SELECT * FROM votes ORDER BY timestamp DESC');
    const mapped = result.rows.map(row => ({
      id: row.id.toString(),
      clubeVotante: row.clube_votante,
      escalao: row.escalao,
      premio: row.premio,
      numeroAtleta: row.numero_atleta,
      cipaAtleta: row.cipa_atleta, 
      nomeAtleta: row.nome_atleta,
      timestamp: row.timestamp,
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching votes from DB:', error);
    res.status(500).json({ error: 'Falha ao obter votos' });
  }
});

// NOVO: Endpoint do Contador de Votos focado no CIPA e Nome
app.get('/api/votes/count', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    const votes = getVotesFallback();
    const counts: Record<string, any> = {};
    
    votes.forEach((v: any) => {
      const key = `${v.cipaAtleta || 'sem_cipa'}_${v.premio}`;
      if (!counts[key]) {
        counts[key] = { 
          cipaAtleta: v.cipaAtleta || 'N/A', 
          nomeAtleta: v.nomeAtleta, 
          premio: v.premio, 
          totalVotos: 0 
        };
      }
      counts[key].totalVotos += 1;
    });
    return res.json(Object.values(counts).sort((a: any, b: any) => b.totalVotos - a.totalVotos));
  }

  try {
    const result = await pool.query(`
      SELECT cipa_atleta as "cipaAtleta", nome_atleta as "nomeAtleta", premio, COUNT(id)::int as "totalVotos"
      FROM votes
      GROUP BY cipa_atleta, nome_atleta, premio
      ORDER BY premio, "totalVotos" DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error counting votes:', error);
    res.status(500).json({ error: 'Falha ao contar votos' });
  }
});

app.post('/api/votes', async (req, res) => {
  const { clubeVotante, escalao, premio, numeroAtleta, cipaAtleta, nomeAtleta } = req.body;

  if (!process.env.DATABASE_URL) {
    const newVote = saveVoteFallback(req.body);
    return res.json({ success: true, vote: newVote });
  }

  try {
    const result = await pool.query(
      'INSERT INTO votes (clube_votante, escalao, premio, numero_atleta, cipa_atleta, nome_atleta) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [clubeVotante, escalao, premio, numeroAtleta, cipaAtleta, nomeAtleta]
    );
    res.json({ success: true, vote: result.rows });
  } catch (error) {
    console.error('Error saving vote to DB:', error);
    res.status(500).json({ error: 'Falha ao guardar voto' });
  }
});

// Endpoint to scrape FPA website for a specific team URL
app.post('/api/scraper/fpa', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL ou CIPAs em falta' });

  try {
    const atletas: Array<{ numero: number | null, nome: string, cipa?: string }> = [];

    if (/^[\d\s,]+$/.test(url)) {
      console.log(`Scraping CIPA list: ${url}`);
      const cipas = url.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);

      for (const cipa of cipas) {
        try {
          const resFpa = await fetch(`https://fpa.pt{cipa}/`);
          if (resFpa.ok) {
            const html = await resFpa.text();
            const match = html.match(/<title>(.*?)<\/title>/);
            if (match) {
              const name = match.split('-').trim();
              if (name) {
                atletas.push({
                  numero: null,
                  nome: name,
                  cipa: cipa
                });
              }
            }
          }
        } catch (e) {
          console.error(`Erro ao obter CIPA ${cipa}`, e);
        }
      }
      return res.json({ success: true, atletas });
    }

    console.log(`Scraping FPA URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao aceder ao site da FPA');
    const html = await response.text();

    const regex = /var\s+TABLE_CONTENT(?:_\d+)?\s*=\s*(\{.*?\});/gs;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match);
        if (data && data.rows) {
          data.rows.forEach((row: any) => {
            let cipaValue = '';
            if (row.col_cipa) cipaValue = String(row.col_cipa).trim();
            
            atletas.push({
              numero: row.col_numero ? parseInt(row.col_numero) : null,
              nome: row.col_nome || row.name || 'Atleta Desconhecida',
              cipa: cipaValue
            });
          });
        }
      } catch (e) {
        console.error("Erro ao fazer parse dos dados da tabela FPA", e);
      }
    }
    
    return res.json({ success: true, atletas });
  } catch (error: any) {
    console.error('Error scraper:', error);
    res.status(500).json({ error: error.message || 'Falha ao executar o scraper' });
  }
});

// ATUALIZADO: Iniciar o servidor local na porta correta (3040)
if (process.env.NODE_ENV !== 'production') {
const PORT = process.env.PORT || 3040;
app.listen(PORT, () => {
console.log(`🚀 Servidor backend a correr na porta ${PORT}`);
});
}

export default app;
