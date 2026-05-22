/**
 * Export d'un tableau (en-têtes + lignes) vers Excel (.xlsx) ou PDF.
 *
 * Le pendant CSV vit dans `csv-export.utils.ts` (`downloadCsv`). Les trois
 * utilitaires partagent la même forme d'entrée : `{ filename, headers, rows }`.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportCell = string | number | boolean | null | undefined;

/** Génère et télécharge un classeur Excel à une feuille. */
export function downloadXlsx(options: {
  filename: string;
  headers: string[];
  rows: ExportCell[][];
  sheetName?: string;
}): void {
  const aoa: ExportCell[][] = [options.headers, ...options.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, (options.sheetName ?? 'Export').slice(0, 31));
  XLSX.writeFile(workbook, options.filename);
}

/** Génère et télécharge un PDF paysage avec un tableau mis en page. */
export function downloadPdf(options: {
  filename: string;
  headers: string[];
  rows: ExportCell[][];
  title?: string;
}): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  let startY = 40;

  if (options.title) {
    doc.setFontSize(13);
    doc.text(options.title, 40, startY);
    doc.setFontSize(9);
    doc.text(
      `Généré le ${new Date().toLocaleString('fr-FR')} — ${options.rows.length} ligne(s)`,
      40,
      startY + 16
    );
    startY += 30;
  }

  autoTable(doc, {
    head: [options.headers],
    body: options.rows.map((row) => row.map((cell) => (cell == null ? '' : String(cell)))),
    startY,
    styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [33, 41, 64], fontSize: 7 },
    margin: { left: 40, right: 40 },
  });

  doc.save(options.filename);
}
