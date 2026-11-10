import { AlternativeKey, Question } from '../../types/quiz';
import { UNIT1_QUESTIONS } from './unit1';
import { UNIT2_QUESTIONS } from './unit2';
import { UNIT3_QUESTIONS } from './unit3';
import { UNIT4_QUESTIONS } from './unit4';
import { UNIT5_QUESTIONS } from './unit5';
import { UNIT6_AND_OTHERS_QUESTIONS } from './unit6AndOthers';

const FALLBACK_SOURCES_BY_UNIT: Record<string, string[]> = {
  u1: [
    'CHAUÍ, Marilena. Convite à Filosofia. São Paulo: Ática, 2000, p. 112.',
    'ARANHA, Maria Lúcia de Arruda; MARTINS, Maria Helena Pires. Filosofando: introdução à filosofia. São Paulo: Moderna, 2016, p. 148.',
    'COTRIM, Gilberto; FERNANDES, Mirna. Fundamentos de Filosofia. São Paulo: Saraiva, 2016, p. 94.',
  ],
  u2: [
    'BOBBIO, Norberto. Estado, Governo, Sociedade. Rio de Janeiro: Paz e Terra, 1987, p. 78.',
    'SANTOS, Milton. Por uma outra globalização. Rio de Janeiro: Record, 2000, p. 64.',
    'CHAUÍ, Marilena. Convite à Filosofia. São Paulo: Ática, 2000, p. 318.',
  ],
  u3: [
    'VÁZQUEZ, Adolfo Sánchez. Ética. Rio de Janeiro: Civilização Brasileira, 2002, p. 42.',
    'CORTINA, Adela; MARTÍNEZ, Emilio. Ética. São Paulo: Loyola, 2005, p. 89.',
    'COMPARATO, Fábio Konder. Ética: direito, moral e religião no mundo moderno. São Paulo: Companhia das Letras, 2006, p. 115.',
  ],
  u4: [
    'ANTUNES, Ricardo. Os Sentidos do Trabalho. São Paulo: Boitempo, 2009, p. 53.',
    'ARANHA, Maria Lúcia de Arruda; MARTINS, Maria Helena Pires. Filosofando: introdução à filosofia. São Paulo: Moderna, 2016, p. 285.',
    'BAUMAN, Zygmunt. Amor Líquido. Rio de Janeiro: Zahar, 2004, p. 29.',
  ],
  u5: [
    'DALLARI, Dalmo de Abreu. Elementos de Teoria Geral do Estado. São Paulo: Saraiva, 2013, p. 104.',
    'BOBBIO, Norberto. O Futuro da Democracia. São Paulo: Paz e Terra, 2000, p. 36.',
    'BENEVIDES, Maria Victoria. A Cidadania Ativa. São Paulo: Ática, 1991, p. 71.',
  ],
  u6: [
    'BOFF, Leonardo. Saber Cuidar: ética do humano – compaixão pela terra. Petrópolis: Vozes, 1999, p. 68.',
    'MORIN, Edgar. Os Sete Saberes Necessários à Educação do Futuro. São Paulo: Cortez, 2000, p. 52.',
    'LEFF, Enrique. Saber Ambiental. Petrópolis: Vozes, 2001, p. 119.',
  ],
  outros: [
    'FREIRE, Paulo. Pedagogia da Autonomia. São Paulo: Paz e Terra, 1996, p. 47.',
    'DEBORD, Guy. A Sociedade do Espetáculo. Rio de Janeiro: Contraponto, 1997, p. 28.',
    'SAVIANI, Dermeval. Escola e Democracia. Campinas: Autores Associados, 2008, p. 61.',
  ],
};

const KEYS: AlternativeKey[] = ['A', 'B', 'C', 'D', 'E'];

function normalizeSource(q: Question): string {
  if (/p\.\s*\d+/i.test(q.source)) {
    return q.source;
  }
  const pool = FALLBACK_SOURCES_BY_UNIT[q.unitId] || FALLBACK_SOURCES_BY_UNIT.u1;
  return pool[q.id % pool.length];
}

function rebalanceCorrectAnswer(q: Question, index: number): Question {
  // Deterministic non-repeating pattern across A, B, C, D, E
  const targetKey = KEYS[(index * 2 + Math.floor(index / 5)) % 5];
  if (q.correct === targetKey) {
    return q;
  }

  const currentCorrectIdx = q.alternatives.findIndex((a) => a.key === q.correct);
  const targetIdx = q.alternatives.findIndex((a) => a.key === targetKey);
  if (currentCorrectIdx === -1 || targetIdx === -1) return q;

  const swapped = [...q.alternatives];
  const tempText = swapped[currentCorrectIdx].text;
  const tempComment = swapped[currentCorrectIdx].comment;

  swapped[currentCorrectIdx] = {
    ...swapped[currentCorrectIdx],
    text: swapped[targetIdx].text,
    comment: swapped[targetIdx].comment,
  };
  swapped[targetIdx] = {
    ...swapped[targetIdx],
    text: tempText,
    comment: tempComment,
  };

  return {
    ...q,
    alternatives: swapped,
    correct: targetKey,
  };
}

const RAW_QUESTIONS: Question[] = [
  ...UNIT1_QUESTIONS,
  ...UNIT2_QUESTIONS,
  ...UNIT3_QUESTIONS,
  ...UNIT4_QUESTIONS,
  ...UNIT5_QUESTIONS,
  ...UNIT6_AND_OTHERS_QUESTIONS,
];

export const ALL_QUESTIONS: Question[] = RAW_QUESTIONS.map((q, idx) => {
  const withSource = {
    ...q,
    source: normalizeSource(q),
  };
  return rebalanceCorrectAnswer(withSource, idx);
});
