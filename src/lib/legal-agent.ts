/**
 * Legal & RTI Auto-Escalation Engine
 * Automatically constructs statutory Right to Information (RTI Act 2005)
 * Section 6 applications and Lokayukta grievance petitions for overdue civic complaints.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface RTIPetition {
  complaint_id: string;
  reference_no: string;
  applicant_name: string;
  org_name?: string;
  filing_date: string;
  days_overdue: number;
  issue_type: string;
  ward_name: string;
  address: string;
  department: string;
  severity: string;
  statutory_acts: string[];
  subject: string;
  questions: string[];
  full_legal_text: string;
}

export interface ComplaintLegalInput {
  id: string;
  issue_type: string;
  severity: string;
  ward_name: string | null;
  address: string | null;
  description_en: string;
  created_at: string;
  ai_suggested_department: string | null;
  applicant_name?: string;
  org_name?: string;
}

/**
 * Builds statutory RTI Act 2005 Section 6 petition.
 */
export function buildRTIPetition(input: ComplaintLegalInput): RTIPetition {
  const daysOpen = Math.max(
    1,
    Math.floor((Date.now() - new Date(input.created_at).getTime()) / (1000 * 3600 * 24))
  );
  const refNo = `RTI/BBMP/${new Date().getFullYear()}/${input.id.slice(0, 8).toUpperCase()}`;
  const ward = input.ward_name || 'Central Municipal Ward';
  const dept = input.ai_suggested_department || 'Engineering & Public Works Department';
  const issue = input.issue_type.replace(/_/g, ' ').toUpperCase();
  const applicant = input.applicant_name || 'Aggrieved Citizen';
  const org = input.org_name || 'Nagrik Seva Civic Oversight Coalition';

  const isLifeAndLiberty = input.severity === 'critical' || input.severity === 'high';

  const acts = [
    'Right to Information Act, 2005 — Section 6(1)',
    'Karnataka Municipal Corporations Act, 1976 / BBMP Act 2020',
    'Right to Information Act, 2005 — Section 20(1) (Penalty for willful delay)',
  ];

  if (isLifeAndLiberty) {
    acts.push('RTI Act 2005 — Section 7(1) Proviso (48-Hour Life and Liberty mandate)');
  }

  const questions = [
    `1. Please provide the exact date, diary number, and file registration timestamp on which Complaint #${input.id.slice(0, 8)} regarding "${issue}" at "${input.address || ward}" was received by the Ward Junior Engineer and Executive Engineer.`,
    `2. Please provide the certified name, designation, official email, and mobile contact of the designated field officer / contractor tasked with resolving this civic issue.`,
    `3. Under the Citizen Charter of the Municipal Corporation, the statutory turnaround time for this category is 7 days. As this grievance has remained unresolved for ${daysOpen} consecutive days, please state the official reasons recorded in writing for this default.`,
    `4. Please provide certified true copies of the work order, contractor agreement, allocated budget, and material inspection sign-off sheets issued for maintenance in ${ward} during the current fiscal year.`,
    `5. Please provide certified documentation of any disciplinary notice or daily penalty initiated against the defaulting contractor / officer under Section 20(1) of the RTI Act 2005.`,
  ];

  const fullText = `
FORM 'A'
APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

Reference No: ${refNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

TO:
The Public Information Officer (PIO) & Executive Engineer,
Bruhat Bengaluru Mahanagara Palike (BBMP) / Municipal Corporation,
Office of the Zonal Joint Commissioner,
Bengaluru, Karnataka.

APPLICANT DETAILS:
Name: ${applicant}
Advocacy Sponsor: ${org}
Address/Ward: ${ward}
Reference Grievance ID: #${input.id}

SUBJECT:
Statutory inquiry under RTI Act 2005 regarding unaddressed civic hazard (${issue}) pending for ${daysOpen} days beyond statutory SLA.

FACTS OF THE CASE:
1. On ${new Date(input.created_at).toLocaleDateString('en-IN')}, a formal grievance was registered on the municipal portal regarding: "${input.description_en}".
2. Location Coordinates / Ward: ${input.address || 'Geo-tagged on Municipal Map'}, ${ward}.
3. Despite statutory service level guarantees under the Municipal Citizen Charter, the hazard remains open and posing direct danger to public health and vehicular safety.

STATUTORY INQUIRIES SOUGHT:
${questions.join('\n\n')}

LEGAL MANDATE:
Under Section 7(1) of the RTI Act 2005, the Public Information Officer is required to provide this information within 30 days ${isLifeAndLiberty ? '(or within 48 hours where life and physical safety are compromised)' : ''}. Failure to comply will attract penalty proceedings under Section 20(1) at the rate of Rs. 250 per day up to Rs. 25,000.

Respectfully submitted,
${applicant}
Verified by: ${org}
`.trim();

  return {
    complaint_id: input.id,
    reference_no: refNo,
    applicant_name: applicant,
    org_name: org,
    filing_date: new Date().toISOString(),
    days_overdue: daysOpen,
    issue_type: issue,
    ward_name: ward,
    address: input.address || 'Geo-tagged Location',
    department: dept,
    severity: input.severity,
    statutory_acts: acts,
    subject: `Statutory inquiry under RTI Act 2005 regarding unaddressed civic hazard (${issue})`,
    questions,
    full_legal_text: fullText,
  };
}

/**
 * Generates an official A4 PDF byte stream of the statutory RTI Petition.
 */
export async function generateRTIPdfBytes(petition: RTIPetition): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(0, 0.13, 0.28); // #002147
  const red = rgb(0.72, 0.11, 0.11);
  const dark = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);

  // Top Statutory Header Bar
  page.drawRectangle({
    x: 0,
    y: height - 65,
    width,
    height: 65,
    color: navy,
  });

  page.drawText('FORM "A" — RIGHT TO INFORMATION ACT, 2005', {
    x: 40,
    y: height - 30,
    size: 13,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText('STATUTORY PETITION UNDER SECTION 6(1) & CITIZEN CHARTER OVERSIGHT', {
    x: 40,
    y: height - 48,
    size: 8,
    font: bold,
    color: rgb(0.8, 0.88, 1),
  });

  page.drawText(`Ref: ${petition.reference_no}`, {
    x: width - 180,
    y: height - 30,
    size: 8.5,
    font: bold,
    color: rgb(0.9, 0.95, 1),
  });

  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
    x: width - 180,
    y: height - 48,
    size: 8,
    font: reg,
    color: rgb(0.8, 0.88, 1),
  });

  let y = height - 90;

  // Addressee Block
  page.drawText('TO: The Public Information Officer (PIO) & Executive Engineer', {
    x: 40,
    y,
    size: 10,
    font: bold,
    color: dark,
  });
  y -= 14;
  page.drawText(`Municipal Corporation / BBMP — ${petition.department}`, {
    x: 40,
    y,
    size: 9,
    font: reg,
    color: dark,
  });
  y -= 14;
  page.drawText(`Ward / Zone: ${petition.ward_name}`, {
    x: 40,
    y,
    size: 9,
    font: reg,
    color: dark,
  });

  y -= 22;

  // Overdue Escalation Badge
  page.drawRectangle({
    x: 40,
    y: y - 24,
    width: width - 80,
    height: 28,
    color: rgb(1, 0.94, 0.94),
  });
  page.drawText(`URGENCY STATUS: ${petition.days_overdue} DAYS OVERDUE BEYOND STATUTORY SLA (${petition.severity.toUpperCase()})`, {
    x: 50,
    y: y - 16,
    size: 9,
    font: bold,
    color: red,
  });

  y -= 45;

  // Subject
  page.drawText('SUBJECT:', { x: 40, y, size: 9.5, font: bold, color: dark });
  page.drawText(petition.subject.slice(0, 75), { x: 95, y, size: 9, font: reg, color: dark });

  y -= 22;

  // Information Queries
  page.drawText('MANDATORY STATUTORY QUERIES (SECTION 6(1) RTI ACT 2005):', {
    x: 40,
    y,
    size: 9.5,
    font: bold,
    color: navy,
  });
  y -= 16;

  for (let i = 0; i < petition.questions.length; i++) {
    const q = petition.questions[i];
    const lines = [q.slice(0, 95), q.slice(95, 190)].filter(Boolean);
    for (const line of lines) {
      page.drawText(line, { x: 45, y, size: 8, font: reg, color: dark });
      y -= 12;
    }
    y -= 4;
  }

  y -= 10;

  // Statutory Citation Box
  page.drawRectangle({
    x: 40,
    y: y - 48,
    width: width - 80,
    height: 48,
    color: rgb(0.96, 0.98, 1),
  });
  page.drawText('STATUTORY PENAL PROVISIONS CITED:', {
    x: 50,
    y: y - 14,
    size: 8.5,
    font: bold,
    color: navy,
  });
  page.drawText('• Section 20(1) RTI Act: Daily penalty of Rs 250 up to Rs 25,000 for failure to supply details.', {
    x: 50,
    y: y - 27,
    size: 7.5,
    font: reg,
    color: dark,
  });
  page.drawText('• Karnataka Municipalities Act & Citizen Charter: Mandatory timebound redressal of road and drainage hazards.', {
    x: 50,
    y: y - 39,
    size: 7.5,
    font: reg,
    color: dark,
  });

  y -= 80;

  // Signature Block
  page.drawText('PETITIONER / CO-SPONSOR:', { x: 40, y, size: 8.5, font: bold, color: gray });
  page.drawText('VERIFYING PUBLIC ADVOCACY BODY:', { x: width - 240, y, size: 8.5, font: bold, color: gray });
  y -= 16;

  page.drawText(petition.applicant_name, { x: 40, y, size: 9, font: bold, color: dark });
  page.drawText(petition.org_name || 'Nagrik Seva Coalition', { x: width - 240, y, size: 9, font: bold, color: dark });
  y -= 14;

  page.drawText('Grievance Redressal Complainant', { x: 40, y, size: 8, font: reg, color: gray });
  page.drawText('Authorized Civic Redressal Partner', { x: width - 240, y, size: 8, font: reg, color: gray });

  return pdfDoc.save();
}
