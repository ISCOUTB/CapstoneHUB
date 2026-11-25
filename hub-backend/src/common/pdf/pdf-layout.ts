import PDFDocumentModule from 'pdfkit';

export type PDFDocumentInstance = PDFKit.PDFDocument;
type PDFDocumentConstructor = new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFDocumentInstance;

// El paquete @types/pdfkit tipa el export como una instancia, pero en runtime
// `pdfkit` exporta el constructor. El cast mantiene los tipos del documento.
const PDFDocument = PDFDocumentModule as unknown as PDFDocumentConstructor;

export const PAGE_MARGIN = 48;

export const PDF_COLORS = {
  black: '#000000',
  gray: '#555555',
  border: '#999999',
};

const TABLE_FONT_SIZE = 9;
const TABLE_CELL_PADDING = 4;

const PDF_TEXT_REPLACEMENTS: Record<string, string> = {
  '–': '-',
  '—': '-',
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '…': '...',
  '•': '-',
};

/**
 * Las fuentes estándar de PDFKit cubren latín básico (incluidos los acentos
 * españoles), pero no emoji ni otras escrituras. Se reemplazan por texto
 * equivalente o por un espacio para que el PDF no falle.
 */
export function safePdfText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[–—“”‘’…•]/g, (character) => {
      return PDF_TEXT_REPLACEMENTS[character] ?? ' ';
    })
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, ' ');
}

export function createPdfDocument(
  options: PDFKit.PDFDocumentOptions,
): PDFDocumentInstance {
  return new PDFDocument(options);
}

export function collectPdfBuffer(doc: PDFDocumentInstance): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.from(chunk));
    });
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function ensureSpace(doc: PDFDocumentInstance, needed: number): void {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

export function sectionTitle(doc: PDFDocumentInstance, title: string): void {
  ensureSpace(doc, 30);
  doc.moveDown(0.7);
  doc.x = PAGE_MARGIN;
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(PDF_COLORS.black)
    .text(safePdfText(title));

  doc.moveDown(0.3);
}

export function paragraph(doc: PDFDocumentInstance, text: string): void {
  ensureSpace(doc, 28);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(PDF_COLORS.black)
    .text(safePdfText(text), { lineGap: 2 });
}

export function labelValue(
  doc: PDFDocumentInstance,
  label: string,
  value: string,
): void {
  ensureSpace(doc, 18);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_COLORS.gray)
    .text(`${label}: `, { continued: true });
  doc
    .font('Helvetica')
    .fillColor(PDF_COLORS.black)
    .text(safePdfText(value), { lineGap: 1 });
}

export function bulletList(doc: PDFDocumentInstance, items: string[]): void {
  for (const item of items) {
    ensureSpace(doc, 18);
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(PDF_COLORS.black)
      .text(`• ${safePdfText(item)}`, { indent: 10, lineGap: 1 });
  }
}

function tableRowHeight(
  doc: PDFDocumentInstance,
  cells: string[],
  widths: number[],
  bold: boolean,
): number {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(TABLE_FONT_SIZE);
  const tallest = Math.max(
    ...cells.map((cell, index) =>
      doc.heightOfString(safePdfText(cell), {
        width: widths[index],
        lineGap: 1,
      }),
    ),
  );
  return tallest + TABLE_CELL_PADDING * 2;
}

function renderTableRow(
  doc: PDFDocumentInstance,
  cells: string[],
  widths: number[],
  bold: boolean,
  y: number,
): void {
  let x = PAGE_MARGIN;
  doc
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(TABLE_FONT_SIZE)
    .fillColor(PDF_COLORS.black);

  cells.forEach((cell, index) => {
    doc.text(safePdfText(cell), x, y + TABLE_CELL_PADDING, {
      width: widths[index],
      lineGap: 1,
    });
    x += widths[index];
  });
}

/**
 * Tabla simple en blanco y negro: encabezados en negrita, sin fondo, con una
 * línea divisoria bajo el encabezado.
 */
export function drawTable(
  doc: PDFDocumentInstance,
  headers: string[],
  rows: string[][],
  columnRatios: number[],
): void {
  const contentWidth = doc.page.width - PAGE_MARGIN * 2;
  const widths = columnRatios.map((ratio) => contentWidth * ratio);

  const renderHeader = (): void => {
    const height = tableRowHeight(doc, headers, widths, true);
    const y = doc.y;
    renderTableRow(doc, headers, widths, true, y);
    doc.y = y + height;

    doc
      .moveTo(PAGE_MARGIN, doc.y)
      .lineTo(PAGE_MARGIN + contentWidth, doc.y)
      .strokeColor(PDF_COLORS.border)
      .lineWidth(0.6)
      .stroke();
  };

  renderHeader();

  for (const row of rows) {
    const height = tableRowHeight(doc, row, widths, false);

    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      renderHeader();
    }

    const y = doc.y;
    renderTableRow(doc, row, widths, false, y);
    doc.y = y + height;
  }

  // Restablece el cursor al margen izquierdo para que el contenido siguiente
  // no herede la posición de la última celda.
  doc.x = PAGE_MARGIN;
}

/** Encabezado corrido de las páginas posteriores a la primera. */
export function attachRunningHeader(
  doc: PDFDocumentInstance,
  title: string,
): void {
  doc.on('pageAdded', () => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(PDF_COLORS.gray)
      .text(safePdfText(title), PAGE_MARGIN, 24, {
        lineBreak: false,
      });

    doc
      .moveTo(PAGE_MARGIN, 36)
      .lineTo(doc.page.width - PAGE_MARGIN, 36)
      .strokeColor(PDF_COLORS.border)
      .lineWidth(0.6)
      .stroke();

    doc.x = PAGE_MARGIN;
    doc.y = 48;
  });
}

/** Bloque de título de la primera página: marca, nombre y línea de metadatos. */
export function drawDocumentTitle(
  doc: PDFDocumentInstance,
  heading: string,
  meta: string,
): void {
  doc
    .fillColor(PDF_COLORS.black)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('CapstoneHUB', PAGE_MARGIN, 30);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(PDF_COLORS.gray)
    .text('Universidad Tecnológica de Bolívar', PAGE_MARGIN, 54);

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(PDF_COLORS.black)
    .text(safePdfText(heading), PAGE_MARGIN, 74, {
      width: doc.page.width - PAGE_MARGIN * 2,
      height: 22,
      ellipsis: true,
    });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_COLORS.gray)
    .text(meta, PAGE_MARGIN, 100, { width: doc.page.width - PAGE_MARGIN * 2 });

  doc
    .moveTo(PAGE_MARGIN, 118)
    .lineTo(doc.page.width - PAGE_MARGIN, 118)
    .strokeColor(PDF_COLORS.border)
    .lineWidth(0.8)
    .stroke();

  doc.y = 136;
}

export function drawFooter(doc: PDFDocumentInstance, generated: string): void {
  const range = doc.bufferedPageRange();

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);

    const previousBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = doc.page.height - 34;

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(PDF_COLORS.gray)
      .text(`Generado el ${generated} · CapstoneHUB`, PAGE_MARGIN, y, {
        width: doc.page.width - PAGE_MARGIN * 2,
        align: 'left',
        lineBreak: false,
      });

    doc.text(`Página ${index + 1} de ${range.count}`, PAGE_MARGIN, y, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'right',
      lineBreak: false,
    });

    doc.page.margins.bottom = previousBottom;
  }
}
