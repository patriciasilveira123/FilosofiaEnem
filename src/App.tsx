import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  XCircle,
  BookOpen,
  BarChart3,
  ListChecks,
  Filter,
  FileDown,
} from 'lucide-react';
import { ALL_QUESTIONS } from './data/questions';
import { CURRICULUM } from './data/curriculum';
import { AlternativeKey, AnswersMap, Difficulty } from './types/quiz';
import { calculateTriStats } from './utils/tri';
import { downloadQuestionsPdf } from './utils/pdfExport';
import { downloadQuestionsWord } from './utils/wordExport';

type ViewTab = 'simulado' | 'unidades' | 'desempenho' | 'gabarito';
type StatusFilter = 'todas' | 'nao_respondidas' | 'erradas';

const STORAGE_KEY = 'filoenem_answers_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('simulado');
  const [answers, setAnswers] = useState<AnswersMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(1);
  const [showAllComments, setShowAllComments] = useState<boolean>(true);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Ignore storage quota errors
    }
  }, [answers]);

  const filteredQuestions = useMemo(() => {
    return ALL_QUESTIONS.filter((q) => {
      if (selectedUnit !== 'all' && q.unitId !== selectedUnit) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      if (statusFilter === 'nao_respondidas' && answers[q.id]) return false;
      if (statusFilter === 'erradas' && (!answers[q.id] || answers[q.id] === q.correct)) return false;
      return true;
    });
  }, [selectedUnit, selectedDifficulty, statusFilter, answers]);

  const currentQuestion = useMemo(() => {
    return (
      filteredQuestions.find((q) => q.id === currentQuestionId) ||
      filteredQuestions[0] ||
      ALL_QUESTIONS[0]
    );
  }, [filteredQuestions, currentQuestionId]);

  const currentIndex = useMemo(() => {
    const idx = filteredQuestions.findIndex((q) => q.id === currentQuestion.id);
    return idx >= 0 ? idx : 0;
  }, [filteredQuestions, currentQuestion]);

  const triStats = useMemo(() => calculateTriStats(ALL_QUESTIONS, answers), [answers]);

  const handleSelectAlternative = (key: AlternativeKey) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: key,
    }));
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentQuestionId(filteredQuestions[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentQuestionId(filteredQuestions[currentIndex - 1].id);
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    setAnswers({});
    setConfirmReset(false);
    setCurrentQuestionId(1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'simulado') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      const keyMap: Record<string, AlternativeKey> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
        '5': 'E',
        a: 'A',
        b: 'B',
        c: 'C',
        d: 'D',
        e: 'E',
      };
      const mapped = keyMap[e.key.toLowerCase()];
      if (mapped) handleSelectAlternative(mapped);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const currentUnitObj = CURRICULUM.find((u) => u.id === currentQuestion.unitId);
  const currentChapterObj = currentUnitObj?.chapters.find((c) => c.id === currentQuestion.chapterId);
  const userAnswer = answers[currentQuestion.id];
  const isAnswered = Boolean(userAnswer);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            onClick={() => setActiveTab('simulado')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            FiloENEM
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('simulado')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'simulado'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Simulado
            </button>
            <button
              onClick={() => setActiveTab('unidades')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'unidades'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Unidades
            </button>
            <button
              onClick={() => setActiveTab('desempenho')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'desempenho'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Desempenho TRI
            </button>
            <button
              onClick={() => setActiveTab('gabarito')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'gabarito'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Gabarito
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              onClick={handleReset}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                confirmReset
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {confirmReset ? 'Confirmar Reinício' : 'Reiniciar'}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('simulado')}
            className={`px-2 py-1 ${activeTab === 'simulado' ? 'text-blue-700 font-semibold' : ''}`}
          >
            Simulado
          </button>
          <button
            onClick={() => setActiveTab('unidades')}
            className={`px-2 py-1 ${activeTab === 'unidades' ? 'text-blue-700 font-semibold' : ''}`}
          >
            Unidades
          </button>
          <button
            onClick={() => setActiveTab('desempenho')}
            className={`px-2 py-1 ${activeTab === 'desempenho' ? 'text-blue-700 font-semibold' : ''}`}
          >
            TRI
          </button>
          <button
            onClick={() => setActiveTab('gabarito')}
            className={`px-2 py-1 ${activeTab === 'gabarito' ? 'text-blue-700 font-semibold' : ''}`}
          >
            Gabarito
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'simulado' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Main Interactive Question Stage */}
            <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              {/* Unboxed Metadata Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4 font-mono tabular-nums">
                <span className="font-semibold text-slate-900">
                  Questão {String(currentQuestion.id).padStart(3, '0')} / {ALL_QUESTIONS.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentUnitObj?.title}</span>
                <span aria-hidden="true">·</span>
                <span>{currentChapterObj?.title}</span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.topic}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">
                  Nível {currentQuestion.difficulty} (Peso TRI {currentQuestion.triWeight.toFixed(1)})
                </span>
              </div>

              {/* Base Text */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-5 mb-5">
                <p className="text-[15px] sm:text-base leading-relaxed text-slate-800 whitespace-pre-line text-justify">
                  {currentQuestion.baseText}
                </p>
                <p className="mt-3 text-xs text-slate-500 italic">{currentQuestion.source}</p>
              </div>

              {/* Command */}
              <h1 className="font-sans text-base sm:text-lg font-semibold text-slate-900 leading-snug mb-6">
                {currentQuestion.command}
              </h1>

              {/* Alternatives A-E */}
              <div className="space-y-3">
                {currentQuestion.alternatives.map((alt) => {
                  const isSelected = userAnswer === alt.key;
                  const isCorrectAlt = currentQuestion.correct === alt.key;

                  let containerClass =
                    'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';
                  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  let statusText = '';

                  if (isAnswered) {
                    if (isCorrectAlt) {
                      containerClass = 'border-emerald-600 bg-emerald-50/50';
                      badgeClass = 'bg-emerald-600 text-white border-emerald-600';
                      statusText = isSelected ? 'Sua escolha · Correta' : 'Gabarito Correto';
                    } else if (isSelected && !isCorrectAlt) {
                      containerClass = 'border-red-600 bg-red-50/50';
                      badgeClass = 'bg-red-600 text-white border-red-600';
                      statusText = 'Sua escolha · Incorreta';
                    } else {
                      containerClass = 'border-slate-200 bg-white opacity-90';
                    }
                  }

                  return (
                    <button
                      key={alt.key}
                      onClick={() => handleSelectAlternative(alt.key)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${containerClass}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`w-7 h-7 rounded-md border text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 ${badgeClass}`}
                        >
                          {alt.key}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm sm:text-[15px] text-slate-800 leading-relaxed text-justify">
                              {alt.text}
                            </p>
                            {isAnswered && isCorrectAlt && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {isAnswered && isSelected && !isCorrectAlt && (
                              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                            )}
                          </div>

                          {statusText && (
                            <p
                              className={`mt-1.5 text-xs font-semibold ${
                                isCorrectAlt ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {statusText}
                            </p>
                          )}

                          {/* Gabarito Comentado for every alternative when answered */}
                          {isAnswered && (showAllComments || isSelected || isCorrectAlt) && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 text-xs sm:text-sm text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-800">Comentário: </span>
                              {alt.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer Controls */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= filteredQuestions.length - 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {isAnswered && (
                  <button
                    onClick={() => setShowAllComments((v) => !v)}
                    className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                  >
                    {showAllComments
                      ? 'Mostrar apenas selecionada e correta'
                      : 'Mostrar comentários de todas as 5 alternativas'}
                  </button>
                )}
              </div>
            </section>

            {/* Right / Control & Navigator Deck */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Live TRI Score Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Estimativa TRI</span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {triStats.answeredCount}/200 respondidas
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
                    {triStats.triScore}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {triStats.coherenceLabel}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-slate-500">Fácil</div>
                    <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {triStats.byDifficulty.Fácil.correct}/{triStats.byDifficulty.Fácil.total}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Médio</div>
                    <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {triStats.byDifficulty.Médio.correct}/{triStats.byDifficulty.Médio.total}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Difícil</div>
                    <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {triStats.byDifficulty.Difícil.correct}/{triStats.byDifficulty.Difícil.total}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Full PDF & Word Card in Simulado */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Caderno Completo</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    200 questões por capítulos + gabarito oficial
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => downloadQuestionsPdf(ALL_QUESTIONS)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Baixar PDF
                  </button>
                  <button
                    onClick={() => downloadQuestionsWord(ALL_QUESTIONS)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Baixar Word
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Filter className="w-4 h-4 text-slate-500" />
                  Filtros do Caderno
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unidade</label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
                  >
                    <option value="all">Todas as Unidades (200)</option>
                    {CURRICULUM.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nível TRI
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) =>
                        setSelectedDifficulty(e.target.value as Difficulty | 'all')
                      }
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800"
                    >
                      <option value="all">Todos</option>
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800"
                    >
                      <option value="todas">Todas</option>
                      <option value="nao_respondidas">Não respondidas</option>
                      <option value="erradas">Erradas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Grid Navigator */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-900">
                    Navegador ({filteredQuestions.length})
                  </span>
                  <span className="text-xs text-slate-500">Atalhos: A–E, ← →</span>
                </div>

                {filteredQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Nenhuma questão encontrada com esses filtros.
                  </p>
                ) : (
                  <div className="grid grid-cols-8 gap-1.5 max-h-64 overflow-y-auto pr-1">
                    {filteredQuestions.map((q) => {
                      const ans = answers[q.id];
                      const isCurrent = q.id === currentQuestion.id;
                      let btnStyle = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                      if (ans) {
                        btnStyle =
                          ans === q.correct
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-red-100 text-red-900 border-red-300';
                      }
                      if (isCurrent) {
                        btnStyle += ' ring-2 ring-blue-700 ring-offset-1';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionId(q.id)}
                          className={`h-8 text-xs font-mono font-medium rounded border transition-colors cursor-pointer tabular-nums ${btnStyle}`}
                        >
                          {q.id}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'unidades' && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Conteúdo Programático
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Selecione qualquer unidade para filtrar o simulado e praticar os temas do 3º ano do
                Ensino Médio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CURRICULUM.map((unit) => {
                const unitQuestions = ALL_QUESTIONS.filter((q) => q.unitId === unit.id);
                const answeredInUnit = unitQuestions.filter((q) => answers[q.id]).length;
                return (
                  <div
                    key={unit.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-blue-700" />
                        <span className="text-xs font-mono text-slate-500 tabular-nums">
                          {answeredInUnit}/{unitQuestions.length} respondidas
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-slate-900 mb-3">
                        {unit.title}
                      </h2>
                      <div className="space-y-3">
                        {unit.chapters.map((cap) => (
                          <div key={cap.id}>
                            <h3 className="text-xs font-semibold text-slate-800">{cap.title}</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {cap.topics.join(' · ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedUnit(unit.id);
                        setSelectedDifficulty('all');
                        setStatusFilter('todas');
                        if (unitQuestions[0]) setCurrentQuestionId(unitQuestions[0].id);
                        setActiveTab('simulado');
                      }}
                      className="mt-6 w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Praticar esta Unidade
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'desempenho' && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Desempenho e Análise TRI
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                A Teoria de Resposta ao Item (TRI) valoriza a coerência pedagógica: acertar questões
                fáceis e médias sustenta sua nota nas questões difíceis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Nota TRI Estimada</div>
                <div className="font-mono text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {triStats.triScore}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Questões Respondidas</div>
                <div className="font-mono text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {triStats.answeredCount} / 200
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Acertos Totais</div>
                <div className="font-mono text-3xl font-bold text-emerald-700 mt-1 tabular-nums">
                  {triStats.correctCount} ({triStats.accuracyPercent}%)
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Padrão de Coerência</div>
                <div className="text-sm font-semibold text-slate-900 mt-2 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-700" />
                  {triStats.coherenceLabel}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-lg font-bold text-slate-900 mb-4">
                Desempenho por Unidade
              </h2>
              <div className="space-y-4">
                {CURRICULUM.map((unit) => {
                  const qs = ALL_QUESTIONS.filter((q) => q.unitId === unit.id);
                  const answered = qs.filter((q) => answers[q.id]).length;
                  const correct = qs.filter((q) => answers[q.id] === q.correct).length;
                  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                  return (
                    <div key={unit.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{unit.title}</span>
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          {correct}/{answered} acertos ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-700 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gabarito' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                  Gabarito Oficial Comentado
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Consulte rapidamente a resposta correta e o comentário de cada uma das 200 questões.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                  <ListChecks className="w-4 h-4 text-blue-700" />
                  200 questões
                </span>
                <button
                  onClick={() => downloadQuestionsPdf(ALL_QUESTIONS)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Baixar PDF
                </button>
                <button
                  onClick={() => downloadQuestionsWord(ALL_QUESTIONS)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Baixar Word
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {ALL_QUESTIONS.map((q) => {
                const correctAlt = q.alternatives.find((a) => a.key === q.correct);
                const userAns = answers[q.id];
                return (
                  <div key={q.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">
                          Questão {String(q.id).padStart(3, '0')}
                        </span>
                        <span>·</span>
                        <span>{q.topic}</span>
                        <span>·</span>
                        <span>{q.difficulty}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{q.command}</p>
                      <p className="text-xs sm:text-sm text-emerald-800">
                        <span className="font-semibold">Gabarito {q.correct}: </span>
                        {correctAlt?.comment}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {userAns && (
                        <span
                          className={`text-xs font-mono font-semibold ${
                            userAns === q.correct ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          Sua: {userAns}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUnit('all');
                          setSelectedDifficulty('all');
                          setStatusFilter('todas');
                          setCurrentQuestionId(q.id);
                          setActiveTab('simulado');
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Print-only Complete PDF Layout (200 Questions + Gabarito) */}
      <section className="hidden print:block p-8 text-slate-900 bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="font-display text-2xl font-bold">
            FiloENEM — Simulado Completo de Filosofia (200 Questões TRI)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            3º Ano do Ensino Médio · Estilo ENEM · Gabarito oficial ao final do caderno
          </p>
        </div>

        <div className="space-y-6">
          {ALL_QUESTIONS.map((q) => (
            <article key={q.id} className="break-inside-avoid pb-4 border-b border-slate-200">
              <div className="text-xs font-mono font-semibold text-slate-700 mb-1">
                Questão {String(q.id).padStart(3, '0')} · {q.topic} · Nível {q.difficulty}
              </div>
              <p className="text-xs leading-relaxed text-justify mb-1.5">{q.baseText}</p>
              <p className="text-[11px] text-slate-500 italic mb-2">{q.source}</p>
              <p className="text-xs font-semibold mb-2">{q.command}</p>
              <div className="space-y-1">
                {q.alternatives.map((alt) => (
                  <p key={alt.key} className="text-xs leading-snug text-justify">
                    <span className="font-mono font-semibold">{alt.key}) </span>
                    {alt.text}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="break-before-page pt-6">
          <h2 className="font-display text-xl font-bold mb-4">Gabarito Oficial</h2>
          <div className="grid grid-cols-5 gap-2 text-xs font-mono">
            {ALL_QUESTIONS.map((q) => (
              <div key={q.id} className="border border-slate-300 px-2 py-1">
                {String(q.id).padStart(3, '0')}: <strong>{q.correct}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
