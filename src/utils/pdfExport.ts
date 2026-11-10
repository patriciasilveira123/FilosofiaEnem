import { jsPDF } from 'jspdf';
import { CURRICULUM } from '../data/curriculum';
import { Question } from '../types/quiz';

export function downloadQuestionsPdf(questions: Question[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawJustifiedText = (text: string, x: number, width: number, lineHeight: number) => {
    const lines: string[] = doc.splitTextToSize(text, width);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(lineHeight + 1);
      const line = lines[i].trim();
      const isLastLine = i === lines.length - 1;
      const words = line.split(/\s+/).filter(Boolean);

      if (!isLastLine && words.length > 1) {
        const wordsWidth = words.reduce((acc, w) => acc + doc.getTextWidth(w), 0);
        const spaceWidth = (width - wordsWidth) / (words.length - 1);
        let cx = x;
        for (let j = 0; j < words.length; j++) {
          doc.text(words[j], cx, y);
          cx += doc.getTextWidth(words[j]) + spaceWidth;
        }
      } else {
        doc.text(line, x, y);
      }
      y += lineHeight;
    }
  };

  // Cover / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('FiloENEM — Simulado Completo de Filosofia (200 Questões TRI)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '3º Ano do Ensino Médio · Questões organizadas por Unidades e Capítulos · Gabarito ao final',
    margin,
    y
  );
  y += 4;
  doc.setDrawColor(30, 41, 59);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  for (const unit of CURRICULUM) {
    const unitQuestions = questions.filter((q) => q.unitId === unit.id);
    if (unitQuestions.length === 0) continue;

    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(29, 78, 216);
    doc.text(unit.title, margin, y);
    y += 6;

    for (const chapter of unit.chapters) {
      const chapterQuestions = unitQuestions.filter((q) => q.chapterId === chapter.id);
      if (chapterQuestions.length === 0) continue;

      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${chapter.title} (${chapterQuestions.length} questões)`, margin, y);
      y += 2.5;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      for (const q of chapterQuestions) {
        ensureSpace(24);

        // Question header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Questão ${String(q.id).padStart(3, '0')} · ${q.topic} · Nível ${q.difficulty}`,
          margin,
          y
        );
        y += 5;

        // Base text (word-by-word justified)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        drawJustifiedText(q.baseText, margin, maxWidth, 4.3);

        // Source
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const sourceLines: string[] = doc.splitTextToSize(q.source, maxWidth);
        for (const line of sourceLines) {
          ensureSpace(4);
          doc.text(line, margin, y);
          y += 3.8;
        }
        doc.setTextColor(15, 23, 42);
        y += 1.5;

        // Command (word-by-word justified)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        drawJustifiedText(q.command, margin, maxWidth, 4.4);
        y += 1;

        // Alternatives (word-by-word justified)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        for (const alt of q.alternatives) {
          drawJustifiedText(`${alt.key}) ${alt.text}`, margin, maxWidth, 4.1);
          y += 0.8;
        }

        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      }
    }
  }

  // Official Answer Key Page
  doc.addPage();
  y = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Gabarito Oficial — FiloENEM (200 Questões)', margin, y);
  y += 8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  const cols = 5;
  const colWidth = maxWidth / cols;
  questions.forEach((q, idx) => {
    const col = idx % cols;
    if (col === 0 && idx > 0) {
      y += 5.5;
      ensureSpace(6);
    }
    const x = margin + col * colWidth;
    doc.text(`${String(q.id).padStart(3, '0')}: ${q.correct}`, x, y);
  });

  doc.save('simulado-filoenem-200-questoes.pdf');
}
