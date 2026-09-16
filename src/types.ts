export interface Club {
  id: number;
  name: string;
}

export interface Athlete {
  id: number;
  club_id: number;
  cipa: string;
  name: string;
  birth_date: string;
  escalao: string;
}

export interface Vote {
  id: number;
  match_escalao: string;
  club_a_id: number;
  club_b_id: number;
  category: string;
  athlete_cipa: string;
  timestamp: string;
}

export interface VoteResult {
  cipa: string;
  name: string;
  category: string;
  total_votes: number;
}
