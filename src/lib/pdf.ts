import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type { Complaint } from '@/types/complaint';
import { STATUS_LABELS } from '@/constants/statuses';

interface NGOLetterData {
  complaint: Complaint;
  orgName: string;
  orgAddress: string | null;
  daysOpen: number;
  district: string;
  beforeImageBytes: Uint8Array | null;
  afterImageBytes: Uint8Array | null;
  proofAiObservation: string | null;
}

/**
 * Generates a formal NGO accountability letter to the Jharkhand district government.
 * Includes complaint details, overdue notice, before/after images, and signature block.
 */
export async function generateNGOLetter(data: NGOLetterData): Promise<Uint8Array> {
  const { complaint, orgName, orgAddress, daysOpen, district, beforeImageBytes, afterImageBytes, proofAiObservation } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg    = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const navy   = rgb(0, 0.118, 0.251);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const gray   = rgb(0.4, 0.4, 0.4);
  const red    = rgb(0.8, 0.1, 0.1);
  const border = rgb(0.886, 0.910, 0.941);

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const safe = (s: string | null | undefined) => (s ?? '').replace(/[^\x00-\xFF]/g, '');

  let y = height - 40;

  // ── Letterhead ──────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: navy });
  page.drawText('OFFICIAL ACCOUNTABILITY LETTER', {
    x: 40, y: height - 32, size: 14, font: bold, color: rgb(1, 1, 1),
  });
  page.drawText(`${safe(orgName)} — Community Accountability Report`, {
    x: 40, y: height - 50, size: 9, font: reg, color: rgb(0.8, 0.85, 1),
  });
  page.drawText(`Ref: NAG-${complaint.id.slice(0, 8).toUpperCase()}`, {
    x: width - 160, y: height - 32, size: 9, font: bold, color: rgb(0.8, 0.85, 1),
  });
  page.drawText(dateStr, {
    x: width - 160, y: height - 48, size: 8, font: reg, color: rgb(0.75, 0.8, 0.95),
  });

  y = height - 90;

  // ── Date & From ─────────────────────────────────────────────────────
  page.drawText(`Date: ${dateStr}`, { x: 40, y, size: 9, font: reg, color: darkGray }); y -= 16;
  page.drawText(`From: ${safe(orgName)}`, { x: 40, y, size: 9, font: reg, color: darkGray }); y -= 14;
  if (orgAddress) {
    page.drawText(safe(orgAddress), { x: 40, y, size: 9, font: italic, color: gray }); y -= 14;
  }

  y -= 10;

  // ── Addressee ────────────────────────────────────────────────────────
  page.drawText('To,', { x: 40, y, size: 9, font: reg, color: darkGray }); y -= 14;
  page.drawText(`The District Collector,`, { x: 40, y, size: 10, font: bold, color: navy }); y -= 14;
  page.drawText(`District ${district}, Jharkhand`, { x: 40, y, size: 10, font: bold, color: navy }); y -= 14;
  page.drawText('Government of Jharkhand, India', { x: 40, y, size: 9, font: reg, color: darkGray }); y -= 20;

  // ── Subject Line ─────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: border }); y -= 14;
  const subject = `Subject: Urgent Accountability Notice — Unresolved Civic Issue (${daysOpen} Days Overdue) — ${safe(complaint.issue_type).replace(/_/g, ' ').toUpperCase()}`;
  page.drawText(subject, { x: 40, y, size: 9, font: bold, color: red, maxWidth: width - 80 }); y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: border }); y -= 18;

  // ── Salutation ───────────────────────────────────────────────────────
  page.drawText('Respected Sir/Madam,', { x: 40, y, size: 10, font: reg, color: darkGray }); y -= 18;

  // ── Body Para 1 ──────────────────────────────────────────────────────
  const para1 = `We, ${safe(orgName)}, a registered community organisation operating in District ${district}, Jharkhand, write to draw your urgent attention to a civic issue reported through the Nagrik Seva platform that has remained unresolved for ${daysOpen} days, which is beyond the acceptable resolution timeframe.`;
  y = drawWrappedText(page, reg, para1, 40, y, width - 80, 10, darkGray);
  y -= 12;

  // ── Issue Details Box ────────────────────────────────────────────────
  page.drawRectangle({ x: 40, y: y - 76, width: width - 80, height: 82, color: rgb(0.97, 0.97, 1) });
  page.drawRectangle({ x: 40, y: y - 76, width: 4, height: 82, color: navy });
  y -= 8;
  page.drawText('COMPLAINT DETAILS', { x: 50, y, size: 7, font: bold, color: gray }); y -= 14;
  page.drawText(`Complaint ID:`, { x: 50, y, size: 8, font: bold, color: gray });
  page.drawText(`NAG-${complaint.id.slice(0, 8).toUpperCase()}`, { x: 155, y, size: 8, font: reg, color: navy }); y -= 13;
  page.drawText(`Issue Type:`, { x: 50, y, size: 8, font: bold, color: gray });
  page.drawText(safe(complaint.issue_type).replace(/_/g, ' '), { x: 155, y, size: 8, font: reg, color: navy }); y -= 13;
  page.drawText(`Filed On:`, { x: 50, y, size: 8, font: bold, color: gray });
  page.drawText(new Date(complaint.created_at).toLocaleDateString('en-IN'), { x: 155, y, size: 8, font: reg, color: navy }); y -= 13;
  page.drawText(`Location:`, { x: 50, y, size: 8, font: bold, color: gray });
  page.drawText(safe(complaint.address ?? `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`), { x: 155, y, size: 8, font: reg, color: navy, maxWidth: 340 }); y -= 13;
  page.drawText(`Current Status:`, { x: 50, y, size: 8, font: bold, color: gray });
  page.drawText(STATUS_LABELS[complaint.status] ?? complaint.status, { x: 155, y, size: 8, font: bold, color: red }); y -= 18;

  // ── Body Para 2 ──────────────────────────────────────────────────────
  const para2 = `The complaint was formally filed on ${new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} and has remained in "${STATUS_LABELS[complaint.status] ?? complaint.status}" status for ${daysOpen} days with no satisfactory resolution reported. This is in violation of the expected civic service delivery standards.`;
  y = drawWrappedText(page, reg, para2, 40, y, width - 80, 10, darkGray);
  y -= 12;

  // ── AI Observation if any ─────────────────────────────────────────────
  if (proofAiObservation) {
    const aiPara = `AI Verification Finding: "${safe(proofAiObservation)}" — indicating the submitted proof of work does not meet resolution standards.`;
    y = drawWrappedText(page, italic, aiPara, 40, y, width - 80, 9, rgb(0.45, 0.15, 0.8));
    y -= 12;
  }

  // ── Para 3 — Demand ────────────────────────────────────────────────
  const para3 = `We therefore respectfully request your office to: (1) Immediately direct the concerned department to resolve the said issue within 7 days of receipt of this letter; (2) Provide a written response to our organisation acknowledging this complaint and the steps being taken; (3) Ensure accountability of the field staff responsible for this area.`;
  y = drawWrappedText(page, reg, para3, 40, y, width - 80, 10, darkGray);
  y -= 12;

  const para4 = `Failure to act within the stipulated period will compel us to escalate this matter to the Jharkhand State Human Rights Commission and relevant media bodies. We seek your cooperation in ensuring civic accountability and public trust in the administration.`;
  y = drawWrappedText(page, reg, para4, 40, y, width - 80, 10, darkGray);
  y -= 18;

  // ── Images ────────────────────────────────────────────────────────────
  if (beforeImageBytes || afterImageBytes) {
    page.drawText('PHOTOGRAPHIC EVIDENCE', { x: 40, y, size: 7, font: bold, color: gray }); y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: border }); y -= 12;

    const imgW = 230, imgH = 130;

    if (beforeImageBytes) {
      try {
        const img = await pdfDoc.embedJpg(beforeImageBytes).catch(() => pdfDoc.embedPng(beforeImageBytes!));
        page.drawImage(img, { x: 40, y: y - imgH, width: imgW, height: imgH });
        page.drawText('Before (Issue Reported)', { x: 40, y: y - imgH - 12, size: 8, font: italic, color: gray });
      } catch { /* skip if image fails */ }
    }

    if (afterImageBytes) {
      try {
        const img = await pdfDoc.embedJpg(afterImageBytes).catch(() => pdfDoc.embedPng(afterImageBytes!));
        page.drawImage(img, { x: width - 40 - imgW, y: y - imgH, width: imgW, height: imgH });
        page.drawText('After (Unresolved/Insufficient Work)', { x: width - 40 - imgW, y: y - imgH - 12, size: 8, font: italic, color: red });
      } catch { /* skip if image fails */ }
    }

    y = y - imgH - 28;
  }

  // ── Closing ────────────────────────────────────────────────────────────
  y -= 10;
  page.drawText('Yours faithfully,', { x: 40, y, size: 10, font: reg, color: darkGray }); y -= 40;
  page.drawLine({ start: { x: 40, y }, end: { x: 200, y }, thickness: 0.8, color: navy }); y -= 12;
  page.drawText(safe(orgName), { x: 40, y, size: 10, font: bold, color: navy }); y -= 14;
  page.drawText('Authorised Representative', { x: 40, y, size: 9, font: italic, color: gray }); y -= 14;
  page.drawText(`District ${district}, Jharkhand`, { x: 40, y, size: 9, font: reg, color: gray });

  // ── Footer ──────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 45 }, end: { x: width - 40, y: 45 }, thickness: 0.5, color: border });
  page.drawText(`Generated via Nagrik Seva Platform | Reference: NAG-${complaint.id.slice(0, 8).toUpperCase()} | ${dateStr}`, {
    x: 40, y: 30, size: 7, font: italic, color: gray,
  });

  return pdfDoc.save();
}

// ── Word-wrap helper ───────────────────────────────────────────────────
function drawWrappedText(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  color: ReturnType<typeof rgb>
): number {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line + word + ' ';
    const lineWidth = font.widthOfTextAtSize(testLine, size);
    if (lineWidth > maxWidth && line) {
      page.drawText(line.trim(), { x, y, size, font, color });
      y -= size + 4;
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    page.drawText(line.trim(), { x, y, size, font, color });
    y -= size + 4;
  }
  return y;
}

interface PDFComplaintData {
  complaint: Complaint;
  citizenName: string | null;
  officerName: string | null;
  appUrl: string;
}

/**
 * Generates a complaint PDF with watermark.
 * Runs server-side only (Node.js environment).
 */
export async function generateComplaintPDF(data: PDFComplaintData): Promise<Uint8Array> {
  const { complaint, citizenName, officerName, appUrl } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const helveticaBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica       = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ── Colors ──────────────────────────────────────────────────────────
  const navy   = rgb(0, 0.118, 0.251);   // #001e40
  const gray   = rgb(0.329, 0.278, 0.447); // #545f72
  const border = rgb(0.886, 0.910, 0.941); // #E2E8F0
  const aiPurple = rgb(0.486, 0.227, 0.929); // #7C3AED

  // ── Diagonal watermark ───────────────────────────────────────────────
  page.drawText('NAGRIK SEVA — UNOFFICIAL DOCUMENT', {
    x: 80,
    y: height / 2 - 20,
    size: 20,
    font: helveticaBold,
    color: rgb(0.8, 0.8, 0.85),
    opacity: 0.18,
    rotate: degrees(35),
  });

  let y = height - 40;

  // ── Header ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: navy });
  page.drawText('NAGRIK SEVA', {
    x: 40, y: height - 38,
    size: 18, font: helveticaBold, color: rgb(1, 1, 1),
  });
  page.drawText('Civic Complaint Record', {
    x: 40, y: height - 52,
    size: 10, font: helvetica, color: rgb(0.8, 0.85, 1),
  });
  page.drawText(`ID: ${complaint.id.slice(0, 8).toUpperCase()}`, {
    x: width - 140, y: height - 38,
    size: 9, font: helveticaBold, color: rgb(0.8, 0.85, 1),
  });
  page.drawText(new Date(complaint.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }), {
    x: width - 140, y: height - 52,
    size: 9, font: helvetica, color: rgb(0.8, 0.85, 1),
  });

  y = height - 80;

  // ── Helper: section title ────────────────────────────────────────────
  function sectionTitle(title: string) {
    y -= 8;
    page.drawText(title.toUpperCase(), {
      x: 40, y,
      size: 8, font: helveticaBold,
      color: gray,
    });
    y -= 3;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: border });
    y -= 12;
  }

  // ── Helper: field row ────────────────────────────────────────────────
  function field(label: string, value: string, indent = 40) {
    page.drawText(label + ':', {
      x: indent, y, size: 8, font: helveticaBold, color: gray,
    });
    // Sanitize value to prevent WinAnsi encode error on unsupported characters
    const sanitizedValue = (value || '—').replace(/[^\x00-\xFF]/g, '');
    page.drawText(sanitizedValue, {
      x: indent + 120, y, size: 9, font: helvetica, color: navy,
    });
    y -= 16;
  }

  // ── Complaint details ────────────────────────────────────────────────
  sectionTitle('Complaint Details');
  field('Issue Type', complaint.issue_type.replace(/_/g, ' ').toUpperCase());
  field('Severity', complaint.severity.toUpperCase());
  field('Status', STATUS_LABELS[complaint.status] ?? complaint.status);
  field('Filed By', complaint.is_anonymous ? 'Anonymous Citizen' : (citizenName ?? 'Unknown'));
  field('Filed On', new Date(complaint.created_at).toLocaleString('en-IN'));
  if (complaint.ward_name) field('Ward', complaint.ward_name);

  y -= 4;
  sectionTitle('Description');
  // Sanitize description to remove non-latin characters (WinAnsi limitation)
  const safeDescEn = complaint.description_en.replace(/[^\x00-\xFF]/g, '');
  const words = safeDescEn.split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line + word + ' ';
    const lineWidth = helvetica.widthOfTextAtSize(testLine, 10);
    if (lineWidth > 500 && line) {
      page.drawText(line.trim(), { x: 40, y, size: 10, font: helvetica, color: navy });
      y -= 14;
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line) { page.drawText(line.trim(), { x: 40, y, size: 10, font: helvetica, color: navy }); y -= 14; }

  const safeDescHi = (complaint.description_hi || '').replace(/[^\x00-\xFF]/g, '');
  if (safeDescHi.trim()) {
    y -= 4;
    page.drawText('(Hindi) ' + safeDescHi.trim(), {
      x: 40, y, size: 9, font: helveticaOblique, color: gray,
    });
    y -= 16;
  }

  y -= 4;
  sectionTitle('Location');
  field('Address', complaint.address ?? 'See coordinates');
  field('Coordinates', `${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(6)}`);

  y -= 4;
  sectionTitle('AI Analysis');
  field('Confidence', `${Math.round((complaint.ai_confidence ?? 0) * 100)}%`);
  if (complaint.ai_suggested_department) field('Department', complaint.ai_suggested_department);
  if (complaint.ai_urgency_reason) {
    page.drawText('Urgency:', { x: 40, y, size: 8, font: helveticaBold, color: gray });
    page.drawText(complaint.ai_urgency_reason, { x: 160, y, size: 9, font: helveticaOblique, color: aiPurple });
    y -= 16;
  }

  if (complaint.status === 'resolved' && officerName) {
    y -= 4;
    sectionTitle('Resolution');
    field('Verified By', officerName);
    if (complaint.status_updated_at) {
      field('Resolved On', new Date(complaint.status_updated_at).toLocaleString('en-IN'));
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: 50 }, end: { x: width - 40, y: 50 }, thickness: 0.5, color: border });
  page.drawText(`Verify at: ${appUrl}/verify/${complaint.id.slice(0, 8)}`, {
    x: 40, y: 36, size: 8, font: helvetica, color: gray,
  });
  page.drawText('This is an unofficial document generated by Nagrik Seva. Not a government record.', {
    x: 40, y: 24, size: 7, font: helveticaOblique, color: gray,
  });

  return pdfDoc.save();
}
