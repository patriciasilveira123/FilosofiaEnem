import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx';
import { CURRICULUM } from '../data/curriculum';
import { Question } from '../types/quiz';

export async function downloadQuestionsWord(questions: Question[]) {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: 'FiloENEM — Simulado Completo de Filosofia (200 Questões TRI)',
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '3º Ano do Ensino Médio · Questões organizadas por Unidades e Capítulos · Gabarito oficial ao final',
          italics: true,
          color: '475569',
          size: 20,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  for (const unit of CURRICULUM) {
    const unitQuestions = questions.filter((q) => q.unitId === unit.id);
    if (unitQuestions.length === 0) continue;

    children.push(
      new Paragraph({
        text: unit.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 160 },
      })
    );

    for (const chapter of unit.chapters) {
      const chapterQuestions = unitQuestions.filter((q) => q.chapterId === chapter.id);
      if (chapterQuestions.length === 0) continue;

      children.push(
        new Paragraph({
          text: `${chapter.title} (${chapterQuestions.length} questões)`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 160 },
        })
      );

      for (const q of chapterQuestions) {
        // Question header
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Questão ${String(q.id).padStart(3, '0')} · ${q.topic} · Nível ${q.difficulty}`,
                bold: true,
                size: 20,
                color: '0F172A',
              }),
            ],
            spacing: { before: 200, after: 80 },
          })
        );

        // Base text (justified)
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: q.baseText,
                size: 22,
              }),
            ],
            spacing: { after: 60 },
          })
        );

        // Source
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: q.source,
                italics: true,
                size: 18,
                color: '64748B',
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Command (justified)
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: q.command,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Alternatives A-E (justified)
        for (const alt of q.alternatives) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: `${alt.key}) `,
                  bold: true,
                  size: 21,
                }),
                new TextRun({
                  text: alt.text,
                  size: 21,
                }),
              ],
              spacing: { after: 60 },
            })
          );
        }
      }
    }
  }

  // Official Answer Key on a new page
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      text: 'Gabarito Oficial — FiloENEM (200 Questões)',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  for (let i = 0; i < questions.length; i += 5) {
    const row = questions.slice(i, i + 5);
    const rowText = row
      .map((q) => `${String(q.id).padStart(3, '0')}: ${q.correct}`)
      .join('     |     ');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: rowText,
            font: 'Courier New',
            size: 20,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simulado-filoenem-200-questoes.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
