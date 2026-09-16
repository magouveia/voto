import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.js';
import { appClubs, appAthletes, appVotes } from './src/db/schema.js';
import { eq, desc, asc, sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

function calculateEscalaoServer(birthDateString: string) {
  const year = new Date(birthDateString).getFullYear();
  if (year <= 2008) return 'Seniores Femininos';
  if (year === 2009 || year === 2010) return 'Sub-18 Femininos';
  if (year === 2011 || year === 2012) return 'Sub-16 Femininos';
  if (year === 2013 || year === 2014) return 'Sub-14 Femininos';
  if (year === 2015 || year === 2016) return 'Sub-12 Femininos';
  if (year === 2017) return 'Sub-10 Femininos';
  return 'Bambis / Baby Andebol';
}

app.get('/api/clubs', async (req, res) => {
  try {
    const clubs = await db.query.appClubs.findMany({
      orderBy: [asc(appClubs.name)]
    });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter clubes' });
  }
});

app.post('/api/clubs', async (req, res) => {
  const { name } = req.body;
  try {
    const newClub = await db.insert(appClubs).values({ name }).returning();
    res.json(newClub[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar clube' });
  }
});

app.put('/api/clubs/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const updatedClub = await db.update(appClubs).set({ name }).where(eq(appClubs.id, parseInt(req.params.id))).returning();
    res.json(updatedClub[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar clube' });
  }
});

app.delete('/api/clubs/:id', async (req, res) => {
  try {
    await db.delete(appClubs).where(eq(appClubs.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao apagar clube' });
  }
});

app.get('/api/athletes', async (req, res) => {
  try {
    const athletes = await db.query.appAthletes.findMany({
      orderBy: [asc(appAthletes.name)]
    });
    res.json(athletes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter atletas' });
  }
});

app.post('/api/athletes', async (req, res) => {
  const { club_id, cipa, name, birth_date } = req.body;
  const escalao = calculateEscalaoServer(birth_date);
  try {
    const newAthlete = await db.insert(appAthletes).values({
      club_id,
      cipa,
      name,
      birth_date,
      escalao
    }).returning();
    res.json(newAthlete[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar atleta. Verifique se o CIPA já existe.' });
  }
});

app.put('/api/athletes/:id', async (req, res) => {
  const { club_id, cipa, name, birth_date } = req.body;
  const escalao = calculateEscalaoServer(birth_date);
  try {
    const updatedAthlete = await db.update(appAthletes).set({
      club_id,
      cipa,
      name,
      birth_date,
      escalao
    }).where(eq(appAthletes.id, parseInt(req.params.id))).returning();
    res.json(updatedAthlete[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar atleta' });
  }
});

app.delete('/api/athletes/:id', async (req, res) => {
  try {
    await db.delete(appAthletes).where(eq(appAthletes.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao apagar atleta' });
  }
});

app.post('/api/votes', async (req, res) => {
  const { match_escalao, club_a_id, club_b_id, votes } = req.body;
  try {
    await db.transaction(async (tx) => {
      for (const vote of votes) {
        if (vote.athlete_cipa) {
          await tx.insert(appVotes).values({
            match_escalao,
            club_a_id,
            club_b_id,
            category: vote.category,
            athlete_cipa: vote.athlete_cipa
          });
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving votes:', error);
    res.status(500).json({ error: 'Falha ao guardar votos' });
  }
});

app.get('/api/votes/results', async (req, res) => {
  try {
    const results = await db
      .select({
        cipa: appVotes.athlete_cipa,
        name: appAthletes.name,
        category: appVotes.category,
        total_votes: sql<number>`count(${appVotes.id})::int`
      })
      .from(appVotes)
      .innerJoin(appAthletes, eq(appVotes.athlete_cipa, appAthletes.cipa))
      .groupBy(appVotes.athlete_cipa, appAthletes.name, appVotes.category)
      .orderBy(asc(appVotes.category), desc(sql`count(${appVotes.id})`), asc(appAthletes.name));
    
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao contar votos' });
  }
});

app.delete('/api/votes/reset', async (req, res) => {
  try {
    await db.delete(appVotes);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar votos' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.APP_PORT || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
