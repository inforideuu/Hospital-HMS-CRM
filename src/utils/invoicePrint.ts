import { Invoice } from '../types';

export interface InvoicePrintOptions {
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  taxRegistrationNumber?: string;
}

/**
 * Generates standalone, printable HTML for a hospital tax invoice / receipt.
 */
export const generateInvoiceHtml = (
  invoice: Invoice,
  options?: InvoicePrintOptions
): string => {
  const hospitalName = options?.hospitalName || 'PulseCore Super Specialty Hospital';
  const hospitalAddress = options?.hospitalAddress || 'Main Healthcare Boulevard, Medical District';
  const hospitalPhone = options?.hospitalPhone || '+91 (080) 4123-9000';
  const hospitalEmail = options?.hospitalEmail || 'billing@pulsecorehealth.com';
  const gstin = options?.taxRegistrationNumber || '29ABCDE1234F1Z5';

  const itemRows = (invoice.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-weight: 600;">
          ${idx + 1}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${item.description || 'Medical Service'}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Category: ${item.category || 'General'}</div>
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #1e293b; font-weight: 600;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; color: #1e293b; font-family: monospace;">
          ₹${(item.unitPrice || 0).toLocaleString('en-IN')}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">
          ₹${(item.total || 0).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  const balanceDue = Math.max(0, (invoice.totalAmount || 0) - (invoice.amountPaid || 0));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice_${invoice.id}_${(invoice.patientName || 'Patient').replace(/\s+/g, '_')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .h-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e1b4b;
    }
    .h-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .inv-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: ${invoice.status === 'Paid' ? '#ecfdf5' : '#fffbeb'};
      color: ${invoice.status === 'Paid' ? '#047857' : '#b45309'};
      border: 1px solid ${invoice.status === 'Paid' ? '#a7f3d0' : '#fde68a'};
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 10px 8px;
      border-bottom: 2px solid #cbd5e1;
    }
    .totals-box {
      margin-left: auto;
      width: 280px;
      border-top: 2px solid #e2e8f0;
      padding-top: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
    }
    .total-grand {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #0f172a;
      padding: 6px 0;
      margin: 4px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="h-title">${hospitalName}</div>
      <div class="h-sub">${hospitalAddress} • Phone: ${hospitalPhone}</div>
      <div class="h-sub">GSTIN / Tax ID: <strong>${gstin}</strong> • Email: ${hospitalEmail}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 18px; font-weight: 800; color: #4f46e5; font-family: monospace;">${invoice.id}</div>
      <div style="margin-top: 4px;"><span class="inv-badge">${invoice.status}</span></div>
      <div class="h-sub" style="margin-top: 6px;">Issue Date: <strong>${invoice.issueDate || 'Today'}</strong></div>
      <div class="h-sub">Due Date: <strong>${invoice.dueDate || 'N/A'}</strong></div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Billed To / Patient</div>
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${invoice.patientName}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;">UHID / Patient ID: <strong style="font-family: monospace;">${invoice.patientId}</strong></div>
      <div style="font-size: 11px; color: #475569;">Contact: ${invoice.patientPhone || 'N/A'}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Payment Details</div>
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">Payment Method: ${invoice.paymentMethod || 'Cash / Self Pay'}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;">Encounter: <strong>${invoice.encounterType || 'OPD'}</strong></div>
      ${invoice.transactionRef ? `<div style="font-size: 11px; color: #475569;">Txn Ref: <strong style="font-family: monospace;">${invoice.transactionRef}</strong></div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="text-align: left;">Description</th>
        <th style="width: 60px; text-align: center;">Qty</th>
        <th style="width: 100px; text-align: right;">Unit Rate</th>
        <th style="width: 110px; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="total-row">
      <span style="color: #64748b;">Subtotal:</span>
      <span style="font-family: monospace; font-weight: 600;">₹${(invoice.subtotal || invoice.totalAmount || 0).toLocaleString('en-IN')}</span>
    </div>
    <div class="total-row">
      <span style="color: #64748b;">Taxes & Surcharges (${invoice.taxRate ?? 5}%):</span>
      <span style="font-family: monospace;">+₹${(invoice.taxAmount || 0).toLocaleString('en-IN')}</span>
    </div>
    ${
      (invoice.discount || 0) > 0
        ? `
    <div class="total-row" style="color: #b45309;">
      <span>Discount / Adjustment:</span>
      <span style="font-family: monospace;">-₹${(invoice.discount || 0).toLocaleString('en-IN')}</span>
    </div>`
        : ''
    }
    <div class="total-row total-grand">
      <span>Grand Total:</span>
      <span style="font-family: monospace;">₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}</span>
    </div>
    <div class="total-row" style="color: #047857; font-weight: 700;">
      <span>Amount Paid:</span>
      <span style="font-family: monospace;">₹${(invoice.amountPaid || 0).toLocaleString('en-IN')}</span>
    </div>
    <div class="total-row" style="color: #e11d48; font-weight: 700;">
      <span>Balance Due:</span>
      <span style="font-family: monospace;">₹${balanceDue.toLocaleString('en-IN')}</span>
    </div>
  </div>

  ${
    invoice.notes
      ? `
  <div style="margin-top: 16px; padding: 10px 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 11px; color: #475569;">
    <strong>Billing Notes:</strong> ${invoice.notes}
  </div>`
      : ''
  }

  <div class="footer">
    <div>
      <div>Authorized Signatory / Cashier: <strong>${invoice.collectedBy || 'Hospital Cashier Desk'}</strong></div>
      <div style="margin-top: 2px;">Desk: ${invoice.cashierDesk || 'Main Central Cashier'}</div>
    </div>
    <div style="text-align: right;">
      <div>Computer Generated Official Bill of Supply</div>
      <div style="margin-top: 2px;">Thank you for choosing PulseCore Healthcare.</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;
};

/**
 * Triggers printing of the invoice receipt in a dedicated print window.
 */
export const printInvoiceReceipt = (
  invoice: Invoice,
  options?: InvoicePrintOptions
): void => {
  const printWindow = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!printWindow) {
    window.alert('Please allow popups for this site to print or save the tax invoice.');
    return;
  }
  const html = generateInvoiceHtml(invoice, options);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

