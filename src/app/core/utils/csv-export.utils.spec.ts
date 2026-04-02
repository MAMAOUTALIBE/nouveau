import { describe, expect, it } from 'vitest';
import { buildCsvContent } from './csv-export.utils';

describe('csv-export.utils', () => {
  it('builds csv with header and row values', () => {
    const csv = buildCsvContent(
      ['Matricule', 'Nom'],
      [['PRM-001', 'Aminata Diallo']]
    );

    expect(csv).toBe('Matricule,Nom\nPRM-001,Aminata Diallo');
  });

  it('escapes quotes, delimiters and multiline cells', () => {
    const csv = buildCsvContent(
      ['Commentaire'],
      [['Decision "validée", à suivre\nNiveau 2']]
    );

    expect(csv).toBe('Commentaire\n"Decision ""validée"", à suivre\nNiveau 2"');
  });

  it('supports semicolon delimiter', () => {
    const csv = buildCsvContent(
      ['Colonne A', 'Colonne B'],
      [['A;1', 'B1']],
      ';'
    );

    expect(csv).toBe('Colonne A;Colonne B\n"A;1";B1');
  });
});
