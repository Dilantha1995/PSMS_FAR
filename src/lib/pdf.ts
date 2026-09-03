import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, RGB } from "pdf-lib";
import fs from "fs";
import path from "path";
import type { DocumentRow } from "@/db/schema";
import { fmtMVR, fmtDate, DISPOSAL_METHOD_LABELS } from "@/lib/format";

/**
 * Renders a Transfer/Disposal Note straight to a PDF at exact A4 size using
 * pdf-lib, instead of relying on a browser's print-to-PDF (which is at the
 * mercy of the OS/printer's default paper size and can add blank pages).
 */

const MM = 2.83464567; // pt per mm
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;
// The letterhead artwork's "Company Registration No." line sits at ~44-46mm
// from the top, so the title needs clearance below that, not the 40mm the
// on-screen HTML padding uses (its line-height/margins add a bit more).
const PAD_TOP = 52 * MM;
const PAD_SIDE = 16 * MM;
const FOOTER_Y = 30 * MM;

const px = (n: number) => n * 0.75; // CSS px -> pt (96dpi -> 72dpi)

const INK = rgb(0.067, 0.067, 0.067); // #111
const MUTED = rgb(0.333, 0.333, 0.333); // #555
const FAINT = rgb(0.6, 0.6, 0.6); // #999
const BORDER = rgb(0.886, 0.91, 0.941); // #e2e8f0
const RED = rgb(0.863, 0.149, 0.149); // #dc2626
const GREEN = rgb(0.353, 0.541, 0.122); // #5a8a1f

let letterheadBytes: Buffer | null = null;
function loadLetterhead(): Buffer {
  if (!letterheadBytes) {
    letterheadBytes = fs.readFileSync(path.join(process.cwd(), "public", "letterhead.png"));
  }
  return letterheadBytes;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["—"];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface RowSpec {
  label: string;
  value: string;
}

function drawTable(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  rows: RowSpec[],
  x: number,
  startY: number,
  width: number,
  opts?: { highlightIndex?: number; highlightColor?: RGB }
): number {
  const labelColW = width * 0.38;
  const valueColW = width - labelColW;
  const padX = px(10);
  const padY = px(5);
  const labelSize = px(12);
  const valueSize = px(12);
  const lineGap = px(3);

  let y = startY;
  const bounds: number[] = [y];

  rows.forEach((row, i) => {
    const valueLines = wrapText(bold, row.value, valueSize, valueColW - padX * 2);
    const rowHeight = Math.max(labelSize + padY * 2, valueLines.length * (valueSize + lineGap) + padY * 2);
    const textTop = y - padY - valueSize;

    page.drawText(row.label, { x: x + padX, y: textTop, size: labelSize, font, color: MUTED });
    valueLines.forEach((line, li) => {
      page.drawText(line, {
        x: x + labelColW + padX,
        y: textTop - li * (valueSize + lineGap),
        size: valueSize,
        font: bold,
        color: opts?.highlightIndex === i && opts.highlightColor ? opts.highlightColor : INK,
      });
    });

    y -= rowHeight;
    bounds.push(y);
  });

  for (let i = 1; i < bounds.length - 1; i++) {
    page.drawLine({ start: { x, y: bounds[i] }, end: { x: x + width, y: bounds[i] }, thickness: 0.75, color: BORDER });
  }
  page.drawRectangle({ x, y, width, height: startY - y, borderWidth: 1, borderColor: BORDER });

  return y;
}

/** Wraps and draws a block of text, returning the y just below the last line. */
function drawParagraph(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  x: number,
  startY: number,
  width: number,
  color: RGB = MUTED
): number {
  const lineHeight = size + px(4);
  let y = startY;
  for (const line of wrapText(font, text, size, width)) {
    page.drawText(line, { x, y: y - size, size, font, color });
    y -= lineHeight;
  }
  return y;
}

/** A shaded 2-column key/value box, e.g. "Receiving Person" details. Each
 *  cell wraps and the box grows to fit, so a long name/designation never
 *  overflows or collides with the next line. */
function drawInfoBox(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  title: string,
  rows: RowSpec[],
  x: number,
  startY: number,
  width: number
): number {
  const padX = px(14);
  const padY = px(10);
  const titleSize = px(12);
  const rowSize = px(12);
  const rowGap = px(8);
  const lineGap = px(3);
  const colGap = px(24);
  const colW = (width - padX * 2 - colGap) / 2;

  const cells = rows.map((row) => {
    const labelText = `${row.label}: `;
    const labelW = font.widthOfTextAtSize(labelText, rowSize);
    return { labelText, labelW, lines: wrapText(bold, row.value, rowSize, colW - labelW) };
  });

  const gridRows: { left: (typeof cells)[number]; right?: (typeof cells)[number] }[] = [];
  for (let i = 0; i < cells.length; i += 2) gridRows.push({ left: cells[i], right: cells[i + 1] });

  const rowHeights = gridRows.map(
    (gr) => Math.max(gr.left.lines.length, gr.right?.lines.length ?? 1) * (rowSize + lineGap) - lineGap
  );
  const contentHeight = rowHeights.reduce((a, b) => a + b, 0) + (gridRows.length - 1) * rowGap;
  const boxHeight = padY * 2 + titleSize + px(6) + contentHeight;
  const boxBottom = startY - boxHeight;

  page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxHeight,
    color: rgb(0.973, 0.98, 0.988),
    borderWidth: 1,
    borderColor: BORDER,
  });

  let textY = startY - padY - titleSize;
  page.drawText(title, { x: x + padX, y: textY, size: titleSize, font: bold, color: INK });
  textY -= titleSize + px(6);

  gridRows.forEach((gr, i) => {
    [gr.left, gr.right].forEach((cell, col) => {
      if (!cell) return;
      const cx = x + padX + col * (colW + colGap);
      page.drawText(cell.labelText, { x: cx, y: textY, size: rowSize, font, color: MUTED });
      page.drawText(cell.lines[0] ?? "—", { x: cx + cell.labelW, y: textY, size: rowSize, font: bold, color: INK });
      for (let li = 1; li < cell.lines.length; li++) {
        page.drawText(cell.lines[li], {
          x: cx,
          y: textY - li * (rowSize + lineGap),
          size: rowSize,
          font: bold,
          color: INK,
        });
      }
    });
    textY -= rowHeights[i] + rowGap;
  });

  return boxBottom;
}

export async function generateDocumentPdf(doc: DocumentRow): Promise<Uint8Array> {
  const p = doc.payload as any;
  const isDisposal = p.kind === "DISPOSAL";

  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.title);
  pdf.setSubject(doc.referenceNo);
  pdf.setProducer("ProSynergy FAR");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const letterhead = await pdf.embedPng(loadLetterhead());

  const page = pdf.addPage([PAGE_W, PAGE_H]);
  page.drawImage(letterhead, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  const contentW = PAGE_W - PAD_SIDE * 2;
  let y = PAGE_H - PAD_TOP;

  // Title
  const title = isDisposal ? "ASSET DISPOSAL NOTE" : "ASSET TRANSFER / HANDOVER FORM";
  const titleSize = px(18);
  page.drawText(title, {
    x: (PAGE_W - bold.widthOfTextAtSize(title, titleSize)) / 2,
    y: y - titleSize,
    size: titleSize,
    font: bold,
    color: INK,
  });
  y -= titleSize + px(14);

  // Reference / Date
  const metaSize = px(12);
  const refLabel = "Reference: ";
  const refLabelW = bold.widthOfTextAtSize(refLabel, metaSize);
  page.drawText(refLabel, { x: PAD_SIDE, y, size: metaSize, font: bold, color: INK });
  page.drawText(doc.referenceNo, { x: PAD_SIDE + refLabelW, y, size: metaSize, font, color: INK });

  const dateLabel = "Date: ";
  const dateValue = fmtDate(isDisposal ? p.disposalDate : p.transferDate);
  const dateLabelW = bold.widthOfTextAtSize(dateLabel, metaSize);
  const dateValueW = font.widthOfTextAtSize(dateValue, metaSize);
  const dateStartX = PAGE_W - PAD_SIDE - dateLabelW - dateValueW;
  page.drawText(dateLabel, { x: dateStartX, y, size: metaSize, font: bold, color: INK });
  page.drawText(dateValue, { x: dateStartX + dateLabelW, y, size: metaSize, font, color: INK });
  y -= metaSize + px(18);

  if (!isDisposal) {
    y = drawInfoBox(
      page,
      font,
      bold,
      "Receiving Person",
      [
        { label: "Name", value: p.to?.custodian || "—" },
        { label: "Designation", value: p.to?.designation || "—" },
        { label: "Department", value: p.to?.department || "—" },
        { label: "Location", value: p.to?.location || "—" },
      ],
      PAD_SIDE,
      y,
      contentW
    );
    y -= px(14);

    const introSize = px(12);
    y = drawParagraph(
      page,
      font,
      `Dear ${p.to?.custodian || "Recipient"}, please find below the asset(s) handed over to you for official use. Kindly utilize and safeguard the item(s) responsibly.`,
      introSize,
      PAD_SIDE,
      y,
      contentW,
      rgb(0.2, 0.2, 0.2)
    );
    y -= px(6);
  }

  // Main details table
  const rows: RowSpec[] = [
    { label: isDisposal ? "Asset Tag" : "Asset Code", value: p.assetTag || "—" },
    { label: "Asset Name", value: p.assetName || "—" },
  ];
  if (p.serialNo) rows.push({ label: "Serial Number", value: p.serialNo });
  rows.push({ label: "Category", value: p.category || "—" });

  if (isDisposal) {
    rows.push({ label: "Acquisition Date", value: fmtDate(p.acquisitionDate) });
    rows.push({ label: "Disposal Date", value: fmtDate(p.disposalDate) });
    rows.push({ label: "Disposal Method", value: DISPOSAL_METHOD_LABELS[p.method] || p.method });
    if (p.buyer) rows.push({ label: "Buyer / Recipient", value: p.buyer });
  } else {
    rows.push({ label: "Transfer Date", value: fmtDate(p.transferDate) });
    rows.push({
      label: "From (Location / Dept / Custodian)",
      value: `${p.from?.location || "—"} / ${p.from?.department || "—"} / ${p.from?.custodian || "—"}`,
    });
    rows.push({ label: "Transfer/Handover Type", value: p.external ? "External (leaves company)" : "Internal" });
    if (p.accessories) rows.push({ label: "Other Accessories", value: p.accessories });
  }
  if (p.reason) rows.push({ label: "Reason / Remarks", value: p.reason });

  y = drawTable(page, font, bold, rows, PAD_SIDE, y, contentW);

  if (isDisposal) {
    y -= px(20);
    const headSize = px(13);
    page.drawText("Financial Summary (MVR)", { x: PAD_SIDE, y: y - headSize, size: headSize, font: bold, color: INK });
    y -= headSize + px(8);

    const gl = Number(p.gainLoss || 0);
    const finRows: RowSpec[] = [
      { label: "Original Cost", value: fmtMVR(p.cost, false) },
      { label: "Accumulated Depreciation", value: fmtMVR(p.accumDep, false) },
      { label: "Net Book Value at Disposal", value: fmtMVR(p.nbv, false) },
      { label: "Disposal Proceeds", value: fmtMVR(p.proceeds, false) },
      { label: gl < 0 ? "Loss on Disposal" : "Gain on Disposal", value: fmtMVR(Math.abs(gl), false) },
    ];
    y = drawTable(page, font, bold, finRows, PAD_SIDE, y, contentW, {
      highlightIndex: finRows.length - 1,
      highlightColor: gl < 0 ? RED : GREEN,
    });
  }

  // Signature block
  y -= px(64);
  const signLabels = isDisposal
    ? ["Prepared By", "Approved By", "Received By"]
    : ["Prepared By", "Checked By", "Approved By", "Handed Over By"];
  const gap = px(32);
  const colW = (contentW - gap * (signLabels.length - 1)) / signLabels.length;
  signLabels.forEach((label, i) => {
    const x = PAD_SIDE + i * (colW + gap);
    page.drawLine({ start: { x, y }, end: { x: x + colW, y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

    const labelSize = px(11);
    page.drawText(label, {
      x: x + (colW - font.widthOfTextAtSize(label, labelSize)) / 2,
      y: y - labelSize - px(6),
      size: labelSize,
      font,
      color: MUTED,
    });

    const subSize = px(10);
    const subText = "Name / Signature / Date";
    page.drawText(subText, {
      x: x + (colW - font.widthOfTextAtSize(subText, subSize)) / 2,
      y: y - labelSize - px(6) - subSize - px(3),
      size: subSize,
      font,
      color: FAINT,
    });
  });

  if (!isDisposal) {
    y -= px(50);
    page.drawLine({ start: { x: PAD_SIDE, y }, end: { x: PAD_SIDE + contentW, y }, thickness: 1, color: BORDER });
    y -= px(14);

    const ackHeadSize = px(12);
    page.drawText("ACKNOWLEDGMENT", { x: PAD_SIDE, y: y - ackHeadSize, size: ackHeadSize, font: bold, color: INK });
    y -= ackHeadSize + px(6);

    y = drawParagraph(
      page,
      font,
      "By signing below, I acknowledge that the asset(s) listed above have been handed over to me and are my responsibility until they are returned. I understand that if they are lost, stolen, or damaged while in my care, I will be held responsible for their repair or replacement.",
      px(10.5),
      PAD_SIDE,
      y,
      contentW,
      MUTED
    );
    y -= px(48);

    const ackColW = contentW * 0.45;
    page.drawLine({ start: { x: PAD_SIDE, y }, end: { x: PAD_SIDE + ackColW, y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    const ackLabelSize = px(11);
    page.drawText("Acknowledged & Received By", { x: PAD_SIDE, y: y - ackLabelSize - px(6), size: ackLabelSize, font, color: MUTED });
    page.drawText("Name / Signature / Date", {
      x: PAD_SIDE,
      y: y - ackLabelSize - px(6) - px(10) - px(3),
      size: px(10),
      font,
      color: FAINT,
    });
  }

  // Footer reference/page meta, matches .doc-ref
  const meta = `Ref: ${doc.referenceNo}  ·  Page 1 of ${doc.pageCount}`;
  const metaFooterSize = px(10);
  page.drawText(meta, {
    x: (PAGE_W - font.widthOfTextAtSize(meta, metaFooterSize)) / 2,
    y: FOOTER_Y,
    size: metaFooterSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdf.save();
}
