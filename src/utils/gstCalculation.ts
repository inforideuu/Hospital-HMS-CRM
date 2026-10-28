import { InvoiceItem, HospitalSettings } from '../types';

export interface DepartmentalTaxBreakdown {
  department: string;
  category: string;
  gstRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface ItemWithTax extends InvoiceItem {
  gstRate: number;
  taxAmount: number;
  departmentLabel: string;
}

export interface TaxCalculationResult {
  itemsWithTax: ItemWithTax[];
  subtotal: number;
  totalTax: number;
  effectiveTaxRate: number;
  discount: number;
  totalAmount: number;
  gstType: 'CGST_SGST' | 'IGST';
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isGstEnabled: boolean;
  departmentalBreakdown: DepartmentalTaxBreakdown[];
}

/**
 * Resolves the applicable GST percentage for an item based on its category
 * and the Hospital Admin's configured Departmental GST Presets & Rates.
 */
export function getDepartmentalGSTRate(
  category: string | undefined,
  description: string | undefined,
  settings?: HospitalSettings | null
): number {
  if (!settings || settings.enableGSTBilling === false) {
    return 0;
  }

  const cat = (category || '').toLowerCase().trim();
  const desc = (description || '').toLowerCase();

  // 1. Inpatient Bed & Room Charges GST
  if (
    cat === 'bed charge' ||
    cat === 'bed' ||
    cat === 'room' ||
    cat.includes('bed') ||
    cat.includes('ward') ||
    desc.includes('bed stay') ||
    desc.includes('ward -') ||
    desc.includes('bed charge')
  ) {
    return Number(settings.ipdRoomGSTRate ?? 5);
  }

  // 2. OPD Doctor Consultation GST (Exempt in healthcare by default = 0%)
  if (
    cat === 'consultation' ||
    cat === 'doctor' ||
    cat.includes('consult') ||
    desc.includes('consultation') ||
    desc.includes('rounds') ||
    desc.includes('inpatient care')
  ) {
    return Number(settings.consultationGSTRate ?? 0);
  }

  // 3. Laboratory & Diagnostic Tests GST
  if (
    cat === 'laboratory' ||
    cat === 'diagnostic' ||
    cat === 'diagnostics' ||
    cat.includes('lab') ||
    desc.includes('lab investigation') ||
    desc.includes('blood') ||
    desc.includes('scan') ||
    desc.includes('radiology') ||
    desc.includes('ecg')
  ) {
    return Number(settings.labDiagnosticGSTRate ?? 5);
  }

  // 4. Pharmacy & Medicines GST
  if (
    cat === 'pharmacy' ||
    cat === 'medicine' ||
    cat.includes('pharm') ||
    desc.includes('tablet') ||
    desc.includes('capsule') ||
    desc.includes('syrup') ||
    desc.includes('injection') ||
    desc.includes('batch')
  ) {
    return Number(settings.pharmacyGSTRate ?? 5);
  }

  // 5. General Hospital Services & Default Billing GST
  return Number(settings.defaultGSTRate ?? 5);
}

/**
 * Returns human-readable Department label for invoice item categorization
 */
export function getDepartmentalLabel(category: string | undefined, description: string | undefined): string {
  const cat = (category || '').toLowerCase().trim();
  const desc = (description || '').toLowerCase();

  if (cat.includes('bed') || desc.includes('bed') || desc.includes('ward')) {
    return 'Inpatient Bed & Room Charges';
  }
  if (cat.includes('consult') || desc.includes('consult') || desc.includes('round')) {
    return 'OPD Doctor Consultation';
  }
  if (cat.includes('lab') || desc.includes('lab') || desc.includes('scan') || desc.includes('ecg')) {
    return 'Laboratory & Diagnostics';
  }
  if (cat.includes('pharm') || desc.includes('batch') || desc.includes('tab') || desc.includes('rx')) {
    return 'Pharmacy & Medicines';
  }
  return 'General Hospital Services';
}

/**
 * Calculates itemized departmental GST, effective blended tax rate,
 * CGST/SGST or IGST distribution, and departmental sub-breakdowns.
 */
export function calculateItemizedDepartmentalGST(
  items: InvoiceItem[],
  settings?: HospitalSettings | null,
  discountAmount: number = 0
): TaxCalculationResult {
  const isGstEnabled = settings?.enableGSTBilling !== false;
  const gstType: 'CGST_SGST' | 'IGST' = settings?.gstType || 'CGST_SGST';

  let subtotal = 0;
  let totalTax = 0;

  const breakdownMap: Record<string, DepartmentalTaxBreakdown> = {};

  const itemsWithTax: ItemWithTax[] = items.map((item) => {
    const itemTotal = Number(item.total) || Number(item.quantity) * Number(item.unitPrice) || 0;
    subtotal += itemTotal;

    const rate = getDepartmentalGSTRate(item.category, item.description, settings);
    const tax = isGstEnabled ? Math.round((itemTotal * rate) / 100) : 0;
    totalTax += tax;

    const departmentLabel = getDepartmentalLabel(item.category, item.description);

    // Group departmental breakdown
    const key = `${departmentLabel}__${rate}`;
    if (!breakdownMap[key]) {
      breakdownMap[key] = {
        department: departmentLabel,
        category: item.category || departmentLabel,
        gstRate: rate,
        taxableAmount: 0,
        taxAmount: 0,
      };
    }
    breakdownMap[key].taxableAmount += itemTotal;
    breakdownMap[key].taxAmount += tax;

    return {
      ...item,
      total: itemTotal,
      gstRate: rate,
      taxAmount: tax,
      departmentLabel,
    };
  });

  const effectiveTaxRate = subtotal > 0 && isGstEnabled
    ? Number(((totalTax / subtotal) * 100).toFixed(2))
    : 0;

  const totalAmount = Math.max(0, subtotal + totalTax - (Number(discountAmount) || 0));

  // Split into CGST + SGST (50/50 intra-state) or IGST (100% inter-state)
  const cgstAmount = isGstEnabled && gstType === 'CGST_SGST' ? Math.round(totalTax / 2) : 0;
  const sgstAmount = isGstEnabled && gstType === 'CGST_SGST' ? totalTax - cgstAmount : 0;
  const igstAmount = isGstEnabled && gstType === 'IGST' ? totalTax : 0;

  const cgstRate = gstType === 'CGST_SGST' ? Number((effectiveTaxRate / 2).toFixed(2)) : 0;
  const sgstRate = gstType === 'CGST_SGST' ? Number((effectiveTaxRate / 2).toFixed(2)) : 0;

  return {
    itemsWithTax,
    subtotal,
    totalTax,
    effectiveTaxRate,
    discount: Number(discountAmount) || 0,
    totalAmount,
    gstType,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    isGstEnabled,
    departmentalBreakdown: Object.values(breakdownMap),
  };
}
