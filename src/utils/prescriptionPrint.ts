import { Prescription } from '../types';

export interface PrescriptionPrintOptions {
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalContact?: string;
  patientAge?: number | string;
  patientGender?: string;
  patientPhone?: string;
  followUpDate?: string;
}

/**
 * Generates standalone, printable HTML for a prescription.
 */
export const generatePrescriptionHtml = (
  prescription: Prescription,
  options?: PrescriptionPrintOptions
): string => {
  const hospitalName = options?.hospitalName || 'PulseCore Super Specialty Hospital';
  const hospitalAddress = options?.hospitalAddress || 'Health City, Medical District, Suite 400';
  const hospitalContact = options?.hospitalContact || 'Emergency 24x7: 1800-419-7000 | info@pulsecorehealth.com';
  const patientAge = options?.patientAge ? `${options.patientAge} Yrs` : 'N/A';
  const patientGender = options?.patientGender || 'N/A';
  const patientPhone = options?.patientPhone || 'N/A';
  const formattedDate = prescription.date || new Date().toISOString().split('T')[0];

  const medicationRows = (prescription.medications || [])
    .map(
      (med, index) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: center; color: #475569;">
          ${index + 1}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${med.medicineName || 'Medication'}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Dosage: <strong style="color: #334155;">${med.dosage || 'As directed'}</strong></div>
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #1e293b; font-weight: 500;">
          ${med.frequency || 'Once daily'}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #1e293b; font-weight: 500;">
          ${med.duration || '5 Days'}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
          ${med.instructions ? `<em>${med.instructions}</em>` : 'As directed by physician'}
        </td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prescription_${prescription.id}_${prescription.patientName.replace(/\s+/g, '_')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #0f172a;
      line-height: 1.4;
      padding: 24px;
      max-width: 860px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .hospital-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
    }
    .hospital-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .prescription-badge {
      display: inline-block;
      background: #0d9488;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .patient-meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 18px;
      font-size: 12px;
    }
    .meta-grid {
      display: table;
      width: 100%;
    }
    .meta-row {
      display: table-row;
    }
    .meta-cell {
      display: table-cell;
      padding: 3px 8px;
    }
    .meta-cell-label {
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .meta-cell-value {
      color: #0f172a;
      font-weight: 700;
      font-size: 12.5px;
    }
    .rx-title {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: bold;
      color: #0f766e;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .diagnosis-box {
      background: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .table-meds {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 20px;
    }
    .table-meds th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 8px 8px;
      border-bottom: 2px solid #cbd5e1;
      text-align: left;
    }
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 11.5px;
      color: #78350f;
      margin-bottom: 28px;
    }
    .footer-section {
      margin-top: 36px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 16px;
    }
    .sign-table {
      width: 100%;
    }
    .sign-box {
      text-align: right;
    }
    .doctor-name-sign {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .doctor-spec-sign {
      font-size: 11px;
      color: #64748b;
    }
    .sign-line {
      display: inline-block;
      width: 180px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 6px;
    }
    .disclaimer {
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 24px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; padding: 10px 16px; background: #e6fffa; border: 1px solid #99f6e4; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 12px; color: #0d9488; font-weight: 600;">Prescription ready for printing</span>
    <button onclick="window.print()" style="background: #0d9488; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 600; font-size: 12px; cursor: pointer;">
      Print Now
    </button>
  </div>

  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <div class="hospital-title">${hospitalName}</div>
        <div class="hospital-subtitle">${hospitalAddress}</div>
        <div class="hospital-subtitle">${hospitalContact}</div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <span class="prescription-badge">Official Medical Prescription</span>
        <div style="font-size: 11px; font-weight: bold; color: #334155; margin-top: 4px; font-family: monospace;">
          Rx ID: ${prescription.id}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          Date: ${formattedDate}
        </div>
      </td>
    </tr>
  </table>

  <!-- Patient & Doctor Metadata -->
  <div class="patient-meta-card">
    <div class="meta-grid">
      <div class="meta-row">
        <div class="meta-cell" style="width: 25%;">
          <div class="meta-cell-label">Patient Name</div>
          <div class="meta-cell-value">${prescription.patientName}</div>
        </div>
        <div class="meta-cell" style="width: 25%;">
          <div class="meta-cell-label">Patient ID / UHID</div>
          <div class="meta-cell-value">${prescription.patientId}</div>
        </div>
        <div class="meta-cell" style="width: 25%;">
          <div class="meta-cell-label">Age / Gender</div>
          <div class="meta-cell-value">${patientAge} / ${patientGender}</div>
        </div>
        <div class="meta-cell" style="width: 25%;">
          <div class="meta-cell-label">Phone / Contact</div>
          <div class="meta-cell-value">${patientPhone}</div>
        </div>
      </div>
      <div class="meta-row">
        <div class="meta-cell" style="padding-top: 8px;">
          <div class="meta-cell-label">Consulting Doctor</div>
          <div class="meta-cell-value">Dr. ${prescription.doctorName}</div>
        </div>
        <div class="meta-cell" style="padding-top: 8px;">
          <div class="meta-cell-label">Department / Specialization</div>
          <div class="meta-cell-value">${prescription.doctorSpecialization || 'General Medicine'}</div>
        </div>
        <div class="meta-cell" style="padding-top: 8px;">
          <div class="meta-cell-label">Prescription Status</div>
          <div class="meta-cell-value" style="color: ${prescription.status === 'Active' ? '#0d9488' : '#334155'};">
            ${prescription.status}
          </div>
        </div>
        <div class="meta-cell" style="padding-top: 8px;">
          <div class="meta-cell-label">Prescribed Date</div>
          <div class="meta-cell-value">${formattedDate}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Diagnosis Box -->
  <div class="diagnosis-box">
    <strong style="color: #15803d; text-transform: uppercase; font-size: 11px; letter-spacing: 0.3px;">Clinical Diagnosis:</strong>
    <span style="font-weight: 700; color: #166534; margin-left: 6px; font-size: 13px;">${prescription.diagnosis || 'Clinical Consultation'}</span>
    ${prescription.allergyWarning ? `<span style="display: block; color: #b91c1c; font-weight: 600; font-size: 11px; margin-top: 3px;">⚠️ Known Allergies: ${prescription.allergyWarning}</span>` : ''}
  </div>

  <!-- Rx symbol -->
  <div class="rx-title">
    <span>℞</span>
    <span style="font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 4px;">
      Prescribed Medications & Administration Schedule
    </span>
  </div>

  <!-- Medications Table -->
  <table class="table-meds">
    <thead>
      <tr>
        <th style="width: 5%; text-align: center;">#</th>
        <th style="width: 35%;">Medicine & Dosage</th>
        <th style="width: 18%; text-align: center;">Frequency</th>
        <th style="width: 15%; text-align: center;">Duration</th>
        <th style="width: 27%;">Special Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${medicationRows || '<tr><td colspan="5" style="text-align: center; padding: 14px; color: #94a3b8;">No medications listed.</td></tr>'}
    </tbody>
  </table>

  <!-- Clinical Advice / Instructions -->
  ${prescription.notes ? `
    <div class="notes-box">
      <div style="font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; margin-bottom: 2px;">
        Physician's Advice & Patient Instructions:
      </div>
      <div>${prescription.notes}</div>
    </div>
  ` : ''}

  ${options?.followUpDate ? `
    <div style="margin-bottom: 20px; font-size: 12px; color: #0369a1; background: #f0f9ff; border: 1px solid #bae6fd; padding: 8px 12px; border-radius: 6px;">
      <strong>Scheduled Follow-Up:</strong> Please report back on <strong>${options.followUpDate}</strong> for review.
    </div>
  ` : ''}

  <!-- Footer & Signature Block -->
  <div class="footer-section">
    <table class="sign-table">
      <tr>
        <td style="vertical-align: bottom; font-size: 11px; color: #64748b; width: 60%;">
          <div>Hospital Registration ID: <strong>MED-REG-${prescription.hospitalId || '001'}</strong></div>
          <div style="margin-top: 2px;">Dispensing Pharmacy: In-House Hospital Pharmacy & Licensed Dispensary</div>
          <div style="margin-top: 2px;">Generated: ${new Date().toLocaleString()}</div>
        </td>
        <td class="sign-box" style="vertical-align: bottom; width: 40%;">
          <div class="sign-line"></div>
          <div class="doctor-name-sign">Dr. ${prescription.doctorName}</div>
          <div class="doctor-spec-sign">${prescription.doctorSpecialization || 'Attending Specialist'}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Digitally Authorized & Signed</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="disclaimer">
    NOTICE: This is an official computer-generated medical prescription valid for pharmacy dispensing. Keep out of reach of children. Do not alter dosage without consulting the prescribing doctor. In case of emergency or severe adverse reactions, contact emergency services immediately.
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
};

/**
 * Triggers a print window popup with the generated prescription HTML.
 */
export const printPrescription = (
  prescription: Prescription,
  options?: PrescriptionPrintOptions
): void => {
  const printWindow = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!printWindow) {
    // If pop-ups are blocked, alert user
    window.alert('Please allow popups for this site to print the medical prescription.');
    return;
  }

  const html = generatePrescriptionHtml(prescription, options);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
