import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type { Complaint } from '@/types/complaint';
import { STATUS_LABELS } from '@/constants/statuses';

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
    page.drawText(value || '—', {
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
  // Word-wrap description
  const words = complaint.description_en.split(' ');
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

  if (complaint.description_hi) {
    y -= 4;
    page.drawText('(Hindi) ' + complaint.description_hi, {
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
