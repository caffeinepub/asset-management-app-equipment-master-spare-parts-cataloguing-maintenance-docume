export function exportToCSV(data: Record<string, string | number>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string
) {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const lineHeight = 6;
  const headerHeight = 15;

  let yPosition = margin + headerHeight;

  const lines: string[] = [];

  lines.push(`%PDF-1.4`);
  lines.push(`1 0 obj`);
  lines.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  lines.push(`endobj`);

  lines.push(`2 0 obj`);
  lines.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  lines.push(`endobj`);

  const contentLines: string[] = [];
  contentLines.push(`BT`);
  contentLines.push(`/F1 16 Tf`);
  contentLines.push(`${margin} ${pageHeight - margin - 10} Td`);
  contentLines.push(`(${title}) Tj`);
  contentLines.push(`ET`);

  contentLines.push(`BT`);
  contentLines.push(`/F1 10 Tf`);
  contentLines.push(`${margin} ${pageHeight - yPosition} Td`);
  contentLines.push(`(${headers.join(' | ')}) Tj`);
  contentLines.push(`ET`);

  yPosition += lineHeight;

  rows.forEach((row) => {
    if (yPosition > pageHeight - margin - 20) {
      yPosition = margin + headerHeight;
    }
    contentLines.push(`BT`);
    contentLines.push(`/F1 9 Tf`);
    contentLines.push(`${margin} ${pageHeight - yPosition} Td`);
    contentLines.push(`(${row.join(' | ')}) Tj`);
    contentLines.push(`ET`);
    yPosition += lineHeight;
  });

  const content = contentLines.join('\n');
  const contentLength = content.length;

  lines.push(`3 0 obj`);
  lines.push(`<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 5 0 R >>`);
  lines.push(`endobj`);

  lines.push(`4 0 obj`);
  lines.push(`<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>`);
  lines.push(`endobj`);

  lines.push(`5 0 obj`);
  lines.push(`<< /Length ${contentLength} >>`);
  lines.push(`stream`);
  lines.push(content);
  lines.push(`endstream`);
  lines.push(`endobj`);

  lines.push(`xref`);
  lines.push(`0 6`);
  lines.push(`0000000000 65535 f `);
  lines.push(`0000000009 00000 n `);
  lines.push(`0000000058 00000 n `);
  lines.push(`0000000115 00000 n `);
  lines.push(`0000000230 00000 n `);
  lines.push(`0000000330 00000 n `);

  lines.push(`trailer`);
  lines.push(`<< /Size 6 /Root 1 0 R >>`);
  lines.push(`startxref`);
  lines.push(`${lines.join('\n').length}`);
  lines.push(`%%EOF`);

  const pdfContent = lines.join('\n');
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCSVTemplate(headers: string[], filename: string) {
  const csvContent = headers.join(',');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
