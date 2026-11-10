export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';

export type AlternativeKey = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Alternative {
  key: AlternativeKey;
  text: string;
  comment: string;
}

export interface Question {
  id: number;
  unitId: string;
  chapterId: string;
  topic: string;
  difficulty: Difficulty;
  triWeight: number; // 1.0 (Fácil), 1.5 (Médio), 2.2 (Difícil)
  baseText: string;
  source: string;
  command: string;
  alternatives: Alternative[];
  correct: AlternativeKey;
}

export interface Chapter {
  id: string;
  title: string;
  topics: string[];
}

export interface Unit {
  id: string;
  title: string;
  chapters: Chapter[];
}

export type AnswersMap = Record<number, AlternativeKey>;
