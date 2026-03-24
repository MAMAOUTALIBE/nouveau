export type CsvCell = string | number | boolean | null | undefined;

export function buildCsvContent(
  headers: string[],
  rows: CsvCell[][],
  delimiter = ','
): string {
  const normalizedDelimiter = delimiter === ';' ? ';' : ',';
  const serializedHeader = headers.map((cell) => escapeCsvCell(cell, normalizedDelimiter)).join(normalizedDelimiter);
  const serializedRows = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell, normalizedDelimiter)).join(normalizedDelimiter)
  );
  return [serializedHeader, ...serializedRows].join('\n');
}

export function downloadCsv(options: {
  filename: string;
  headers: string[];
  rows: CsvCell[][];
  delimiter?: ',' | ';';
}): void {
  const csv = buildCsvContent(options.headers, options.rows, options.delimiter);
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = options.filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: CsvCell, delimiter: string): string {
  const text = value === null || value === undefined ? '' : String(value);
  const escaped = text.replace(/"/g, '""');
  const needsQuotes =
    escaped.includes('"') ||
    escaped.includes('\n') ||
    escaped.includes('\r') ||
    escaped.includes(delimiter);

  return needsQuotes ? `"${escaped}"` : escaped;
}
