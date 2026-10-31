export interface RequisitionPreset {
  id: string;
  itemNameFa: string;
  defaultQty: number;
  unitFa: string;
}

export const DEFAULT_REQUISITION_PRESETS: RequisitionPreset[] = [
  { id: 'p1', itemNameFa: 'کابل شبکه Cat6 SFTP', defaultQty: 100, unitFa: 'متر' },
  { id: 'p2', itemNameFa: 'کابل ترکیبی RG59 مسی', defaultQty: 100, unitFa: 'متر' },
  { id: 'p3', itemNameFa: 'دوربین ۴ مگاپیکسل دید در شب', defaultQty: 2, unitFa: 'عدد' },
  { id: 'p4', itemNameFa: 'لوله پلی‌اتیلن سایز ۲۵', defaultQty: 30, unitFa: 'متر' },
  { id: 'p5', itemNameFa: 'داکت شیاردار ۳x۳', defaultQty: 10, unitFa: 'شاخه' },
  { id: 'p6', itemNameFa: 'باکس آداپتور / کمباکس', defaultQty: 4, unitFa: 'عدد' },
  { id: 'p7', itemNameFa: 'آداپتور ۱۲ ولت ۵ آمپر', defaultQty: 2, unitFa: 'عدد' },
  { id: 'p8', itemNameFa: 'فیش BNC پیچی یا لحیمی', defaultQty: 10, unitFa: 'عدد' },
  { id: 'p9', itemNameFa: 'سوکت شبکه RJ45 Cat6', defaultQty: 20, unitFa: 'عدد' },
  { id: 'p10', itemNameFa: 'لوله فلکسیبل شیلددار نمره ۲۱', defaultQty: 25, unitFa: 'متر' },
];

const PRESETS_STORAGE_KEY = 'mehregan_requisition_presets_v1';

export function getRequisitionPresets(): RequisitionPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return DEFAULT_REQUISITION_PRESETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_REQUISITION_PRESETS;
}

export function saveRequisitionPresets(presets: RequisitionPreset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

/**
 * Automatically learns any new item that is not in the quick preset list,
 * saving it to localStorage so subsequent projects and requisitions have it available.
 */
export function learnRequisitionItems(
  items: Array<{ itemNameFa: string; requestedQty?: number; unitFa?: string }>
): RequisitionPreset[] {
  const current = getRequisitionPresets();
  let changed = false;
  const updated = [...current];

  for (const item of items) {
    const trimmed = (item.itemNameFa || '').trim();
    if (!trimmed) continue;

    // Check if item name already exists (case-insensitive and trimmed)
    const exists = updated.some(
      (p) => p.itemNameFa.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (!exists) {
      updated.push({
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemNameFa: trimmed,
        defaultQty: item.requestedQty && item.requestedQty > 0 ? item.requestedQty : 1,
        unitFa: item.unitFa || 'عدد',
      });
      changed = true;
    }
  }

  if (changed) {
    saveRequisitionPresets(updated);
  }
  return updated;
}
