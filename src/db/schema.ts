import { pgTable, serial, varchar, date, integer, timestamp } from 'drizzle-orm/pg-core';

export const appClubs = pgTable('app_clubs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const appAthletes = pgTable('app_athletes', {
  id: serial('id').primaryKey(),
  club_id: integer('club_id').references(() => appClubs.id, { onDelete: 'cascade' }),
  cipa: varchar('cipa', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  birth_date: date('birth_date').notNull(),
  escalao: varchar('escalao', { length: 50 }).notNull(),
});

export const appVotes = pgTable('app_votes', {
  id: serial('id').primaryKey(),
  match_escalao: varchar('match_escalao', { length: 50 }).notNull(),
  club_a_id: integer('club_a_id').references(() => appClubs.id, { onDelete: 'cascade' }),
  club_b_id: integer('club_b_id').references(() => appClubs.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  athlete_cipa: varchar('athlete_cipa', { length: 50 }).references(() => appAthletes.cipa, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').defaultNow(),
});
