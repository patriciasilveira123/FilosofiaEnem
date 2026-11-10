import { AnswersMap, Question } from '../types/quiz';

export interface TriStats {
  answeredCount: number;
  correctCount: number;
  accuracyPercent: number;
  triScore: number;
  coherenceLabel: string;
  byDifficulty: {
    Fácil: { total: number; correct: number };
    Médio: { total: number; correct: number };
    Difícil: { total: number; correct: number };
  };
}

export function calculateTriStats(questions: Question[], answers: AnswersMap): TriStats {
  const byDifficulty = {
    Fácil: { total: 0, correct: 0 },
    Médio: { total: 0, correct: 0 },
    Difícil: { total: 0, correct: 0 },
  };

  let answeredCount = 0;
  let correctCount = 0;
  let weightedEarned = 0;
  let weightedTotal = 0;

  for (const q of questions) {
    const ans = answers[q.id];
    if (ans) {
      answeredCount++;
      byDifficulty[q.difficulty].total++;
      weightedTotal += q.triWeight;
      if (ans === q.correct) {
        correctCount++;
        byDifficulty[q.difficulty].correct++;
        weightedEarned += q.triWeight;
      }
    }
  }

  if (answeredCount === 0) {
    return {
      answeredCount: 0,
      correctCount: 0,
      accuracyPercent: 0,
      triScore: 450,
      coherenceLabel: 'Aguardando respostas',
      byDifficulty,
    };
  }

  const easyRate = byDifficulty.Fácil.total > 0 ? byDifficulty.Fácil.correct / byDifficulty.Fácil.total : 0.7;
  const medRate = byDifficulty.Médio.total > 0 ? byDifficulty.Médio.correct / byDifficulty.Médio.total : 0.5;
  const hardRate = byDifficulty.Difícil.total > 0 ? byDifficulty.Difícil.correct / byDifficulty.Difícil.total : 0.3;

  // TRI Coherence: penalizes getting hard questions right while missing easy ones (anti-chute)
  let coherenceFactor = 1.0;
  let coherenceLabel = 'Coerência Alta';

  if (hardRate > easyRate + 0.2 && byDifficulty.Fácil.total >= 3) {
    coherenceFactor = 0.86;
    coherenceLabel = 'Coerência Baixa (atenção às fáceis)';
  } else if (medRate > easyRate + 0.15 && byDifficulty.Fácil.total >= 3) {
    coherenceFactor = 0.93;
    coherenceLabel = 'Coerência Moderada';
  }

  const rawRatio = weightedTotal > 0 ? weightedEarned / weightedTotal : 0;
  const triScore = Math.round(450 + rawRatio * 400 * coherenceFactor);

  return {
    answeredCount,
    correctCount,
    accuracyPercent: Math.round((correctCount / answeredCount) * 100),
    triScore,
    coherenceLabel,
    byDifficulty,
  };
}
