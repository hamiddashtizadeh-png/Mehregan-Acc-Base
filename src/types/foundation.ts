export type ConnectionMode = 'LOCAL' | 'LAN' | 'ONLINE';
export type TlsMode = 'disable' | 'require' | 'verify-ca' | 'verify-full';

export interface PublicUser {
  id: number;
  username: string;
  fullName: string;
  jobTitle: string;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  isInitialAdmin: boolean;
  assignedRoles?: string[];
  installerPartyId?: number | null;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface RoleRecord {
  code: string;
  titleFa: string;
  descriptionFa: string;
  isSystemRole: boolean;
}

export interface PermissionRecord {
  code: string;
  moduleNumber: number;
  moduleNameFa: string;
  titleFa: string;
  descriptionFa: string;
  isCritical: boolean;
}

export interface RolePermissionRecord {
  id: number;
  roleCode: string;
  permissionCode: string;
  grantedBy: string;
  grantedAt: string;
}

export interface UserRoleAssignmentRecord {
  id: number;
  userId: number;
  roleCode: string;
  assignedAt: string;
  assignedBy: string;
}

export interface UserPermissionOverrideRecord {
  id: number;
  userId: number;
  permissionCode: string;
  effect: 'DENY' | 'ALLOW';
  reasonFa: string;
  createdBy: string;
  createdAt: string;
}

export interface InventoryTransferLine {
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  quantity: number;
  unitCostIrr?: number;
  notesFa?: string;
}

export interface InventoryTransferRecord {
  id: number;
  transferNumber: string;
  sourceWarehouseId: number;
  sourceWarehouseTitleFa?: string;
  targetWarehouseId: number;
  targetWarehouseTitleFa?: string;
  dateJalali: string;
  driverNameFa?: string;
  vehiclePlateFa?: string;
  descriptionFa?: string;
  notesFa?: string;
  status: TransferStatus;
  lines: InventoryTransferLine[];
  outgoingInventoryDocId?: number | null;
  incomingInventoryDocId?: number | null;
  actorUserId: number;
  createdAt: string;
  receivedAt?: string | null;
  receivedByUserId?: number | null;
}

export interface ExecutiveBiMetrics {
  totalRevenueIrr: number;
  totalGrossProfitIrr: number;
  totalOperatingExpensesIrr: number;
  totalNetProfitIrr: number;
  inventoryValuationIrr: number;
  totalCashAndBankIrr: number;
  accountsReceivableIrr: number;
  accountsPayableIrr: number;
  totalCustomersCount: number;
  totalSuppliersCount: number;
  activeWarehousesCount: number;
  activeProjectsCount: number;
  workingCapitalRatio: number;
  cashFlowStatus: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL';
  topSellingItems: Array<{
    itemId: number;
    itemCode: string;
    titleFa: string;
    quantity: number;
    revenueIrr: number;
  }>;
  recentAuditEvents: AuditLogRecord[];
  generatedAt: string;
}

export interface AuditLogRecord {
  id: number;
  traceId: string;
  timestamp: string;
  actorUserId: number | null;
  actorUsername: string;
  actorRoleSummary: string;
  action: string;
  category: 'SECURITY' | 'AUTH' | 'RBAC' | 'SETTINGS' | 'MIGRATION' | 'CONNECTION' | 'BUSINESS' | 'PURCHASES' | 'INVENTORY';
  targetEntity: string;
  targetId: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  detailsFa: string;
  sanitizedMetadata: Record<string, unknown>;
}

export interface DocumentNumberingConfig {
  salesInvoicePrefix: string;
  salesProformaPrefix: string;
  purchaseInvoicePrefix: string;
  purchaseProformaPrefix: string;
  treasuryReceiptPrefix: string;
  treasuryPaymentPrefix: string;
  accountingDocPrefix: string;
  projectPrefix: string;
  installationPrefix: string;
  expensePrefix: string;
  incomePrefix: string;
}

export type IndustryProfileCode =
  | 'CCTV_SECURITY'
  | 'RETAIL_GENERAL'
  | 'SUPERMARKET_GROCERY'
  | 'MOBILE_ELECTRONICS'
  | 'WHOLESALE_DISTRIBUTION'
  | 'SERVICES_CONTRACTING'
  | 'GOLD_JEWELRY'
  | 'RESTAURANT_CAFE'
  | (string & {});

export type IndustryThemeId =
  | 'cctv'
  | 'retail'
  | 'grocery'
  | 'mobile'
  | 'wholesale'
  | 'services'
  | 'gold'
  | 'restaurant'
  | (string & {});

export type IndustryLayoutPreset =
  | 'ENGINEERING_PROJECTS'
  | 'RETAIL_FAST_POS'
  | 'GROCERY_BARCODE'
  | 'GOLD_JEWELRY_CALC'
  | 'RESTAURANT_TOUCH_TABLES'
  | 'WHOLESALE_TIERS_MATRIX'
  | 'SERVICES_JOB_TICKETS'
  | (string & {});

export interface IndustryThemeConfig {
  id: IndustryThemeId;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  headerBrandTitleFa: string;
}

export interface IndustryLayoutConfig {
  preset: IndustryLayoutPreset;
  defaultSalesMode?: 'STANDARD' | 'TOUCH_POS' | 'JEWELRY_CALC' | 'WHOLESALE_MATRIX';
  showInstallationTab?: boolean;
  showProjectsTab?: boolean;
}

export interface IndustryProfileFeatures {
  enableInstallationServices: boolean;
  enableHardwareMacTracking: boolean;
  enableInstallersRole: boolean;
  enableWarrantyTracking: boolean;
  enableBarcodeScanQuickPos: boolean;
  [customFeature: string]: boolean | undefined;
}

export interface IndustryProfileUiLabels {
  inventoryTabTitleFa?: string;
  serialTrackerTitleFa?: string;
  partiesInstallerRoleTitleFa?: string;
  salesTabTitleFa?: string;
  salesTabDescFa?: string;
  purchasesTabTitleFa?: string;
  purchasesTabDescFa?: string;
  treasuryTabTitleFa?: string;
  treasuryTabDescFa?: string;
  partiesTabTitleFa?: string;
  partiesTabDescFa?: string;
  installationTabTitleFa?: string;
  quickPosButtonLabelFa?: string;
  quickSalesSubmenuTitleFa?: string;
  quickPurchasesSubmenuTitleFa?: string;
  quickTreasurySubmenuTitleFa?: string;
  quickPartiesSubmenuTitleFa?: string;
  quickInventorySubmenuTitleFa?: string;
  [customLabel: string]: string | undefined;
}

export function resolveIndustryUiLabels(profile?: { uiLabels?: IndustryProfileUiLabels } | null): Required<Omit<IndustryProfileUiLabels, string>> & Record<string, string | undefined> {
  const custom = profile?.uiLabels || {};
  return {
    inventoryTabTitleFa: custom.inventoryTabTitleFa || 'کالا و انبارداری',
    serialTrackerTitleFa: custom.serialTrackerTitleFa || 'رهگیری شماره سریال کالا',
    partiesInstallerRoleTitleFa: custom.partiesInstallerRoleTitleFa || 'نصابان و تکنسین‌ها',
    salesTabTitleFa: custom.salesTabTitleFa || 'فروش و POS',
    salesTabDescFa: custom.salesTabDescFa || 'فروش، پیش‌فاکتور، صندوق POS و مرجوعی',
    purchasesTabTitleFa: custom.purchasesTabTitleFa || 'خرید و تدارکات',
    purchasesTabDescFa: custom.purchasesTabDescFa || 'فاکتورهای خرید، تأمین کالا و بهای تمام‌شده',
    treasuryTabTitleFa: custom.treasuryTabTitleFa || 'دریافت و پرداخت',
    treasuryTabDescFa: custom.treasuryTabDescFa || 'صندوق‌ها، حساب‌های بانکی، چک‌ها و تسویه',
    partiesTabTitleFa: custom.partiesTabTitleFa || 'اشخاص و طرفین',
    partiesTabDescFa: custom.partiesTabDescFa || 'مشتریان، تأمین‌کنندگان و مانده‌حساب اشخاص',
    installationTabTitleFa: custom.installationTabTitleFa || 'خدمات و نصب CCTV',
    quickPosButtonLabelFa: custom.quickPosButtonLabelFa || 'فاکتور فروش POS',
    quickSalesSubmenuTitleFa: custom.quickSalesSubmenuTitleFa || 'فروش، POS و پیش‌فاکتور',
    quickPurchasesSubmenuTitleFa: custom.quickPurchasesSubmenuTitleFa || 'فاکتور خرید و بهای تمام‌شده',
    quickTreasurySubmenuTitleFa: custom.quickTreasurySubmenuTitleFa || 'دریافت، پرداخت و چک صیادی',
    quickPartiesSubmenuTitleFa: custom.quickPartiesSubmenuTitleFa || 'صورت‌حساب مشتریان و اشخاص',
    quickInventorySubmenuTitleFa: custom.quickInventorySubmenuTitleFa || `${custom.inventoryTabTitleFa || 'کالا و انبارداری'} و کاردکس`,
    ...custom,
  };
}

export interface IndustryProfileConfig {
  code: IndustryProfileCode;
  titleFa: string;
  descriptionFa: string;
  badgeLabelFa: string;
  features: IndustryProfileFeatures;
  uiLabels?: IndustryProfileUiLabels;
  theme?: IndustryThemeConfig;
  layout?: IndustryLayoutConfig;
}

export interface SystemSettingsRecord {
  companyName: string;
  economicCode: string;
  nationalId: string;
  phone: string;
  addressFa: string;
  baseCurrencyCode: 'IRR';
  displayCurrencyCode: 'IRT' | 'IRR';
  inventoryCostingMethod: 'SPECIFIC_OR_FIFO' | 'WEIGHTED_AVERAGE';
  landedCostAllocationDefault: 'BY_VALUE' | 'BY_WEIGHT' | 'BY_QUANTITY';
  activeFiscalYearCode: string;
  allowNegativeInventory: boolean;
  enableDoubleEntryAccounting?: boolean;
  industryProfileCode?: IndustryProfileCode;
  documentNumbering?: DocumentNumberingConfig;
  defaultWarehouseId?: number;
  defaultCashBoxId?: number;
  defaultBankAccountId?: number;
  receiptFooterMessageFa?: string;
  logoUrl?: string;
  updatedAt: string;
}

export interface SchemaMigrationRecord {
  version: string;
  name: string;
  descriptionFa: string;
  checksum: string;
  isDestructive: boolean;
  status: 'APPLIED' | 'PENDING';
  executionMs: number;
  appliedAt: string;
}

export interface RbacEvaluationResult {
  userId: number;
  username: string;
  permissionCode: string;
  allowed: boolean;
  matchedRule: 'EXPLICIT_DENY' | 'EXPLICIT_GRANT' | 'ROLE_PERMISSION' | 'DEFAULT_DENY';
  explanationFa: string;
  assignedRoles: string[];
  explicitOverridesForPermission: Array<{ effect: 'DENY' | 'ALLOW'; reasonFa: string }>;
  rolesGrantingPermission: string[];
}

export interface HealthStage {
  stageId: string;
  titleFa: string;
  ok: boolean;
  detailFa: string;
  remediationFa: string;
}

export interface HealthCheckResponse {
  ok: boolean;
  timestamp: string;
  overallStatus: 'HEALTHY_READY' | 'DEGRADED_OR_FAILED';
  failedStage: HealthStage | null;
  stages: HealthStage[];
}

export interface EnvDocItem {
  key: string;
  defaultValue: string;
  required: boolean;
  descriptionFa: string;
}

export interface FoundationDataResponse {
  activeUser: PublicUser;
  settings: SystemSettingsRecord;
  industryProfile?: IndustryProfileConfig;
  customIndustryProfiles?: IndustryProfileConfig[];
  users: PublicUser[];
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  rolePermissions: RolePermissionRecord[];
  userRoleAssignments: UserRoleAssignmentRecord[];
  userPermissionOverrides: UserPermissionOverrideRecord[];
  migrations: SchemaMigrationRecord[];
  auditLogs: AuditLogRecord[];
  connection: {
    setupWizardCompleted: boolean;
    connectionStatus: string;
    activeProfile: {
      mode: string;
      host: string;
      port: number;
      database: string;
      username: string;
      passwordMasked: string;
      tlsEnabled: boolean;
    };
  };
  parties?: PartyRecord[];
  items?: ItemRecord[];
  warehouses?: WarehouseRecord[];
  itemCategories?: ItemCategoryRecord[];
  itemBrands?: ItemBrandRecord[];
  itemUnits?: ItemUnitRecord[];
  purchaseInvoices?: PurchaseInvoiceRecord[];
  purchaseProformas?: PurchaseProformaRecord[];
  purchasePayments?: PurchasePaymentRecord[];
  purchaseReturns?: PurchaseReturnRecord[];
  salesInvoices?: SalesInvoiceRecord[];
  salesProformas?: SalesProformaRecord[];
  salesReceipts?: SalesReceiptRecord[];
  salesReturns?: SalesReturnRecord[];
  installationJobs?: InstallationJobRecord[];
  cashBoxes?: CashBoxRecord[];
  bankAccounts?: BankAccountRecord[];
  cheques?: ChequeRecord[];
  treasuryTransactions?: TreasuryTransactionRecord[];
  installments?: InstallmentRecord[];
  operationalExpenses?: OperationalExpenseRecord[];
  operationalIncomes?: OperationalIncomeRecord[];
  itemSerials?: ItemSerialRecord[];
  accountsChart?: AccountRecord[];
  accountingDocuments?: AccountingDocumentRecord[];
  fiscalYears?: FiscalYearRecord[];
  accountingPeriods?: AccountingPeriodRecord[];
  costCenters?: CostCenterRecord[];
  projects?: ProjectRecord[];
  projectRequisitions?: ProjectMaterialRequisitionRecord[];
  fixedAssets?: FixedAssetRecord[];
  depreciationEntries?: DepreciationEntryRecord[];
  openingBalanceDoc?: AccountingDocumentRecord | null;
  goldColleagueTrades?: GoldColleagueTrade[];
  restaurantTables?: RestaurantTableRecord[];
  restaurantOrders?: RestaurantOrderRecord[];
  wholesaleOrders?: WholesaleOrderRecord[];
  wholesaleDispatches?: WholesaleDispatchRecord[];
  serviceJobTickets?: ServiceJobTicketRecord[];
  mobileDevices?: MobileDeviceRecord[];
  mobileRepairTickets?: MobileRepairTicketRecord[];
  inventoryTransfers?: InventoryTransferRecord[];
  executiveBi?: ExecutiveBiMetrics;
  remoteTunnelConfig?: RemoteTunnelConfig;
  googleSheetsSyncConfig?: GoogleSheetsSyncConfig;
  googleSheetsSyncLogs?: GoogleSheetsSyncLog[];
}

export interface RemoteTunnelConfig {
  enabled: boolean;
  publicUrl: string;
  localPort: number;
  lastTestedAt?: string;
  testStatus?: 'CONNECTED' | 'DISCONNECTED' | 'UNTESTED';
}

export interface GoogleSheetsSyncConfig {
  enabled: boolean;
  spreadsheetUrl: string;
  appsScriptWebhookUrl: string;
  autoSyncIntervalMinutes: number;
  lastSyncAt?: string;
  lastSyncStatus?: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSyncStats?: {
    jobsPushed?: number;
    requisitionsPulled?: number;
    reportsPulled?: number;
  };
}

export interface GoogleSheetsSyncLog {
  id: string;
  timestamp: string;
  type: 'PUSH' | 'PULL' | 'WEBHOOK';
  status: 'SUCCESS' | 'ERROR';
  detailsFa: string;
  stats?: {
    jobsPushed?: number;
    requisitionsPulled?: number;
    reportsPulled?: number;
  };
}

export type PartyPrimaryType = 'CUSTOMER' | 'SUPPLIER' | 'INSTALLER' | 'PARTNER_OTHER';
export type PersonType = 'NATURAL' | 'LEGAL';
export type PartyStatus = 'ACTIVE' | 'INACTIVE';
export type PartyTransactionType =
  | 'SALE_INVOICE'
  | 'PURCHASE_INVOICE'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'OPENING_DEBIT'
  | 'OPENING_CREDIT'
  | 'INSTALLMENT_PLAN'
  | 'CCTV_PROJECT'
  | 'GOLD_COLLEAGUE_SALE'
  | 'GOLD_COLLEAGUE_RECEIPT'
  | 'GOLD_BARTER'
  | 'GOLD_WEIGHT_SETTLEMENT'
  | 'GOLD_TO_RIAL_CONVERSION';

export interface PartyRecord {
  id: number;
  partyCode: string;
  primaryType: PartyPrimaryType;
  roles: PartyPrimaryType[];
  personType: PersonType;
  fullName: string;
  companyTitle?: string | null;
  nationalId?: string | null;
  economicCode?: string | null;
  registrationNumber?: string | null;
  mobile: string;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  province: string;
  city: string;
  postalCode?: string | null;
  addressFa?: string | null;
  status: PartyStatus;
  creditLimitIrr: number;
  installerSkills?: string | null;
  notes?: string | null;
  isDemo?: boolean;
  goldBalanceGrams?: number; // تراز وزنی طلا به گرم ۷۵۰ (مثبت = طلبکار طلا، منفی = بدهکار طلا)
  createdAt: string;
  updatedAt: string;
  transactionsSummary?: {
    totalSalesCount: number;
    totalSalesIrr: number;
    totalPurchasesCount: number;
    totalPurchasesIrr: number;
    totalPaymentsIrr: number;
    totalReceiptsIrr: number;
    activeProjectsCount: number;
    netBalanceIrr: number; // positive = creditor (بستانکار), negative = debtor (بدهکار)
    netGoldBalanceGrams?: number; // مانده وزنی خالص طلا به گرم استاندارد ۷۵۰
    lastTransactionDateJalali?: string;
  };
}

export interface PartyTransactionRecord {
  id: number;
  partyId: number;
  recordType: PartyTransactionType;
  referenceNumber: string;
  titleFa: string;
  amountIrr: number;
  dateJalali: string;
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'SETTLED';
  goldWeightGrams?: number; // وزن طلا به گرم و سوت
  goldAyar?: number; // عیار مثلاً 750 (18 عیار)
  goldPure750Grams?: number; // وزن استاندارد عیار ۷۵۰
  goldDailyRateIrr?: number; // مظنه روز طلا به ازای هر گرم
  isPureGoldTrade?: boolean; // آیا معامله کاملاً بدون ریال و صرفاً وزنی است؟
  notesFa?: string | null;
  isDemo?: boolean;
  createdAt: string;
}

export interface DuplicateCandidate {
  partyId: number;
  partyCode: string;
  fullName: string;
  matchReasons: Array<{
    field: 'nationalId' | 'mobile' | 'economicCode' | 'fullName';
    fieldTitleFa: string;
    matchedValue: string;
    isExact: boolean;
  }>;
  existingRecord: {
    primaryType: PartyPrimaryType;
    status: PartyStatus;
    mobile: string;
    nationalId?: string | null;
  };
}

export interface DuplicateCheckResponse {
  hasDuplicate: boolean;
  isBlocking: boolean;
  messageFa: string;
  duplicates: DuplicateCandidate[];
}

// ============================================================================
// STAGE 4: INVENTORY, ITEMS, BRANDS, SPECS, SERIAL/MAC & KARDEX
// ============================================================================

export interface ItemCategoryRecord {
  id: number;
  code: string;
  categoryCode?: string;
  nameFa: string;
  titleFa?: string;
  prefix?: string;
  descriptionFa?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ItemBrandRecord {
  id: number;
  code: string;
  nameEn: string;
  nameFa: string;
  originCountryFa?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ItemUnitRecord {
  id: number;
  code: string;
  nameFa: string;
  allowDecimals: boolean;
  createdAt: string;
}

export interface ItemRecord {
  id: number;
  itemCode: string; // e.g. ITM-10001
  barcode?: string | null;
  titleFa: string;
  model: string;
  categoryId: number;
  categoryNameFa?: string;
  brandId: number;
  brandName?: string;
  unitId: number;
  unitNameFa?: string;
  isSerialized: boolean;
  hasMacAddress: boolean;
  technicalSpecs: Record<string, string | number | boolean>;
  minStockAlert: number;
  maxStockLevel?: number | null;
  purchasePriceIrr: number;
  salePriceIrr: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string | null;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
  // Dynamic calculated inventory fields:
  totalStock?: number;
  warehouseStocks?: Record<number, number>;
  activeSerialsCount?: number;
  isLowStock?: boolean;
  inventoryOnHand?: number;
}

export interface WarehouseRecord {
  id: number;
  warehouseCode: string; // e.g. WH-01
  code?: string;
  titleFa: string;
  keeperNameFa: string;
  managerNameFa?: string;
  phone?: string | null;
  addressFa?: string | null;
  locationAddressFa?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  totalItemsCount?: number;
  totalValuationIrr?: number;
}

export type SerialStatus = 'IN_STOCK' | 'DISPATCHED' | 'RESERVED' | 'RETURNED' | 'RETURNED_TO_SUPPLIER' | 'DEFECTIVE';

export interface ItemSerialRecord {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  serialNumber: string;
  macAddress?: string | null;
  currentWarehouseId: number;
  warehouseTitleFa?: string;
  status: SerialStatus;
  initialDocNumber?: string | null;
  lastDocNumber?: string | null;
  purchaseInvoiceId?: number | null;
  unitCostIrr?: number | null; // بهای تمام‌شده خرید اختصاصی این واحد فیزیکی (Landed Cost per unit)
  lastPartyId?: number | null;
  lastPartyNameFa?: string | null;
  notesFa?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export type InventoryDocType =
  | 'INBOUND_PURCHASE' // رسید ورود از خرید (افزایش موجودی)
  | 'OUTBOUND_SALE' // حواله خروج فروش (کاهش موجودی)
  | 'TRANSFER' // انتقال بین انبارها
  | 'INBOUND_RETURN' // برگشت از فروش (افزایش موجودی)
  | 'OUTBOUND_RETURN' // برگشت به تأمین‌کننده (کاهش موجودی)
  | 'ADJUSTMENT_IN' // افزایش موجودی (انبارگردانی مثبت)
  | 'ADJUSTMENT_OUT'; // کاهش موجودی (انبارگردانی منفی)

export interface InventoryDocumentLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  unitNameFa?: string;
  quantity: number;
  unitCostIrr: number;
  totalCostIrr: number;
  serialNumbers?: string[];
  notesFa?: string;
}

export interface InventoryDocumentRecord {
  id: number;
  docNumber: string; // e.g. WH-IN-1405-1001
  docType: InventoryDocType;
  dateJalali: string;
  sourceWarehouseId?: number | null;
  sourceWarehouseTitleFa?: string | null;
  targetWarehouseId?: number | null;
  targetWarehouseTitleFa?: string | null;
  partyId?: number | null;
  partyNameFa?: string | null;
  lines: InventoryDocumentLine[];
  totalAmountIrr: number;
  status: 'CONFIRMED' | 'DRAFT' | 'CANCELLED';
  notesFa?: string | null;
  actorUserId: number;
  actorUsername?: string;
  createdAt: string;
}

export interface ItemKardexEntry {
  id: number;
  itemId: number;
  timestamp: string;
  dateJalali: string;
  docId: number;
  docNumber: string;
  docType: InventoryDocType;
  docTypeTitleFa: string;
  warehouseId: number;
  warehouseTitleFa: string;
  partyNameFa?: string;
  qtyIn: number;
  qtyOut: number;
  runningBalance: number;
  unitCostIrr: number;
  totalCostIrr: number;
  serialNumbers?: string[];
  notesFa?: string;
}

// ============================================================================
// STAGE 5: PURCHASES, LANDED COST & SUPPLIER DEBT (خرید، بهای تمام‌شده و بدهی تأمین‌کننده)
// ============================================================================

export type ForeignCurrencyCode = 'IRR' | 'IRT' | 'USD' | 'AED' | 'EUR' | 'CNY';

export type CostAllocationMethod = 'BY_VALUE' | 'BY_QUANTITY';

export type PurchaseProformaStatus = 'DRAFT' | 'APPROVED' | 'CONVERTED' | 'REJECTED';

export type PurchaseInvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export type PurchasePaymentMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'POS' | 'SATNA_PAYA';

export interface PurchaseLandedCosts {
  freightCostIrr: number; // هزینه حمل و نقل
  insuranceCostIrr: number; // بیمه محموله
  packagingCostIrr: number; // بسته‌بندی
  customsCostIrr: number; // حقوق و عوارض گمرکی
  nonRefundableTaxIrr: number; // مالیات و عوارض غیرقابل استرداد
  otherLandedCostIrr: number; // سایر هزینه‌های مستقیم خرید
  totalLandedCostsIrr: number; // مجموع هزینه‌های سربار
}

export interface PurchaseInvoiceLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  unitNameFa?: string;
  quantity: number;
  unitPriceForeign: number;
  unitPriceIrr: number;
  discountIrr: number;
  vatAmountIrr: number;
  netPriceIrr: number; // (unitPriceIrr - discountIrr) * quantity + vatAmountIrr
  allocatedLandedCostPerUnitIrr: number; // سهم سربار به ازای هر واحد کالا
  finalLandedCostPerUnitIrr: number; // بهای تمام‌شده نهایی هر واحد (پایه + سربار)
  totalLandedCostIrr: number; // quantity * finalLandedCostPerUnitIrr
  serialNumbers?: string[];
  macAddresses?: string[];
  notesFa?: string;
}

export interface PurchaseProformaLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  unitNameFa?: string;
  quantity: number;
  unitPriceForeign: number;
  unitPriceIrr: number;
  totalPriceIrr: number;
  notesFa?: string;
}

export interface PurchaseProformaRecord {
  id: number;
  proformaNumber: string; // e.g. PO-1405-1001
  supplierId: number;
  supplierTitleFa: string;
  dateJalali: string;
  validUntilJalali: string;
  currency: ForeignCurrencyCode;
  exchangeRateToIrr: number;
  lines: PurchaseProformaLine[];
  subtotalIrr: number;
  status: PurchaseProformaStatus;
  convertedInvoiceId?: number | null;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoiceRecord {
  id: number;
  invoiceNumber: string; // e.g. PI-1405-1001
  supplierInvoiceNumber?: string | null;
  supplierId: number;
  supplierTitleFa: string;
  targetWarehouseId: number;
  targetWarehouseTitleFa: string;
  proformaId?: number | null;
  proformaNumber?: string | null;
  dateJalali: string;
  dueDateJalali: string;
  currency: ForeignCurrencyCode;
  exchangeRateToIrr: number;
  costAllocationMethod: CostAllocationMethod;
  landedCosts: PurchaseLandedCosts;
  lines: PurchaseInvoiceLine[];
  subtotalNetItemsIrr: number;
  totalDiscountIrr: number;
  totalVatIrr: number;
  totalInvoicePayableToSupplierIrr: number; // مبلغ تعهد پرداختی به تأمین‌کننده
  totalInventoryValuationIrr: number; // بهای تمام‌شده کل ورود به انبار (خرید + سربار)
  paidAmountIrr: number;
  remainingDebtIrr: number;
  status: PurchaseInvoiceStatus;
  inventoryDocId?: number | null;
  inventoryDocNumber?: string | null;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePaymentRecord {
  id: number;
  paymentNumber: string; // e.g. PAY-1405-1001
  supplierId: number;
  supplierTitleFa: string;
  purchaseInvoiceId?: number | null;
  invoiceNumber?: string | null;
  paymentDateJalali: string;
  amountIrr: number;
  paymentMethod: PurchasePaymentMethod;
  sourceAccountOrBank: string;
  trackingReference: string;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
}

export interface PurchaseReturnLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  quantity: number;
  unitCreditIrr: number;
  totalCreditIrr: number;
  serialNumbers?: string[];
  reasonFa?: string;
}

export interface PurchaseReturnRecord {
  id: number;
  returnNumber: string; // e.g. PRET-1405-1001
  purchaseInvoiceId: number;
  invoiceNumber: string;
  supplierId: number;
  supplierTitleFa: string;
  sourceWarehouseId: number;
  sourceWarehouseTitleFa: string;
  dateJalali: string;
  lines: PurchaseReturnLine[];
  totalReturnCreditIrr: number;
  inventoryDocId: number;
  inventoryDocNumber: string;
  status: 'CONFIRMED' | 'DRAFT';
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
}

// ============================================================================
// STAGE 6: SALES, PROFORMA, QUICK SALE (POS) & SALES RETURNS (فروش، پیش‌فاکتور و فروش سریع)
// ============================================================================

export type SalesProformaStatus = 'DRAFT' | 'APPROVED' | 'CONVERTED' | 'EXPIRED' | 'REJECTED';

export type SalesInvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export type SalesPaymentMethod = 'CASH' | 'POS' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT' | 'WALK_IN_QUICK_PAY';

export type SalesInvoiceType = 'STANDARD_SALE' | 'QUICK_POS_SALE' | 'PROFORMA_CONVERTED';

export interface SalesProformaLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  unitNameFa?: string;
  quantity: number;
  unitPriceIrr: number;
  discountIrr: number;
  vatAmountIrr: number;
  totalPriceIrr: number;
  notesFa?: string;
}

export interface SalesProformaRecord {
  id: number;
  proformaNumber: string; // e.g. SQO-1405-1001
  customerId: number;
  customerTitleFa: string;
  dateJalali: string;
  validUntilJalali: string;
  lines: SalesProformaLine[];
  subtotalItemsIrr: number;
  totalDiscountIrr: number;
  totalVatIrr: number;
  totalPayableIrr: number;
  status: SalesProformaStatus;
  convertedInvoiceId?: number | null;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoiceLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  unitNameFa?: string;
  quantity: number;
  unitPriceIrr: number;
  discountIrr: number;
  vatAmountIrr: number;
  netPriceIrr: number; // (unitPriceIrr - discountIrr) * quantity + vatAmountIrr
  unitCogsIrr: number; // بهای تمام‌شده واحد (از سربار خرید / سریال / FIFO)
  totalCogsIrr: number; // quantity * unitCogsIrr
  serialNumbers?: string[];
  macAddresses?: string[];
  notesFa?: string;
  isService?: boolean;
  skipInventoryMovement?: boolean;
}

export interface SalesInvoiceRecord {
  id: number;
  invoiceNumber: string; // e.g. INV-1405-1001 or POS-1405-1001
  saleType: SalesInvoiceType;
  customerId: number;
  customerTitleFa: string;
  sourceWarehouseId: number;
  sourceWarehouseTitleFa: string;
  proformaId?: number | null;
  proformaNumber?: string | null;
  dateJalali: string;
  dueDateJalali: string;
  lines: SalesInvoiceLine[];
  subtotalNetItemsIrr: number;
  totalDiscountIrr: number;
  totalVatIrr: number;
  totalInvoiceAmountIrr: number; // مبلغ نهایی قابل دریافت از مشتری
  totalCogsIrr: number; // مجموع بهای تمام‌شده کالای فروش‌رفته (COGS)
  paidAmountIrr: number;
  remainingBalanceIrr: number;
  status: SalesInvoiceStatus;
  inventoryDocId?: number | null;
  inventoryDocNumber?: string | null;
  paymentDetails?: {
    paymentMethod: SalesPaymentMethod;
    trackingReference?: string;
    posTerminalOrBank?: string;
  };
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReceiptRecord {
  id: number;
  receiptNumber: string; // e.g. REC-1405-1001
  customerId: number;
  customerTitleFa: string;
  salesInvoiceId?: number | null;
  invoiceNumber?: string | null;
  paymentDateJalali: string;
  amountIrr: number;
  paymentMethod: SalesPaymentMethod;
  destinationBankOrCash: string;
  trackingReference: string;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
}

export interface SalesReturnLine {
  id: number;
  itemId: number;
  itemCode?: string;
  itemTitleFa?: string;
  quantity: number;
  unitRefundIrr: number;
  totalRefundIrr: number;
  serialNumbers?: string[];
  reasonFa?: string;
}

export interface SalesReturnRecord {
  id: number;
  returnNumber: string; // e.g. SRET-1405-1001
  salesInvoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerTitleFa: string;
  targetWarehouseId: number;
  targetWarehouseTitleFa: string;
  dateJalali: string;
  lines: SalesReturnLine[];
  totalRefundAmountIrr: number;
  inventoryDocId: number;
  inventoryDocNumber: string;
  status: 'CONFIRMED' | 'DRAFT';
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
}

// ============================================================================
// STAGE 7: INSTALLATION SERVICES & ENHANCED SALES RETURNS
// ============================================================================

export type InstallationJobStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface InstallationJobRecord {
  id: number;
  jobCode: string; // e.g. INS-1405-1001
  titleFa: string;
  customerId: number;
  customerTitleFa: string;
  salesInvoiceId?: number | null;
  invoiceNumber?: string | null;
  installerId?: number | null;
  installerTitleFa?: string | null;
  serviceFeeIrr: number;
  additionalExpensesIrr: number;
  totalCostIrr: number;
  paidAmountIrr: number;
  remainingBalanceIrr: number;
  locationAddressFa: string;
  scheduledDateJalali: string;
  completedDateJalali?: string | null;
  status: InstallationJobStatus;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STAGE 8: TREASURY, CASH/BANK, CHEQUES, INSTALLMENTS & OPERATIONAL EXPENSES
// ============================================================================

export interface CashBoxRecord {
  id: number;
  boxCode: string; // e.g. CB-1001
  titleFa: string;
  cashierUserId?: number | null;
  balanceIrr: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface BankAccountRecord {
  id: number;
  accountCode: string; // e.g. BA-1001
  bankNameFa: string;
  accountNumber: string;
  shabaNumber?: string | null;
  balanceIrr: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type ChequeType = 'INBOUND' | 'OUTBOUND';
export type ChequeStatus = 'IN_HAND' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'CANCELLED';

export interface ChequeRecord {
  id: number;
  chequeNumber: string;
  chequeType: ChequeType;
  partyId: number;
  partyNameFa: string;
  bankNameFa: string;
  branchNameFa?: string | null;
  amountIrr: number;
  issueDateJalali: string;
  dueDateJalali: string;
  status: ChequeStatus;
  depositBankAccountId?: number | null;
  clearedDateJalali?: string | null;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TreasuryTransactionRecord {
  id: number;
  txNumber: string; // e.g. TRN-1405-1001
  txType: 'RECEIPT' | 'PAYMENT' | 'TRANSFER' | 'EXPENSE' | 'INCOME';
  dateJalali: string;
  partyId?: number | null;
  partyNameFa?: string | null;
  amountIrr: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CHEQUE';
  sourceCashBoxId?: number | null;
  sourceBankAccountId?: number | null;
  targetCashBoxId?: number | null;
  targetBankAccountId?: number | null;
  chequeId?: number | null;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
}

export interface InstallmentRecord {
  id: number;
  installmentCode: string; // e.g. INS-SCH-1001
  titleFa: string;
  partyId: number;
  partyNameFa: string;
  salesInvoiceId?: number | null;
  purchaseInvoiceId?: number | null;
  installmentNumber: number;
  totalInstallments: number;
  amountIrr: number;
  dueDateJalali: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDateJalali?: string | null;
  treasuryTxId?: number | null;
  notesFa?: string | null;
  createdAt: string;
}

export interface OperationalExpenseRecord {
  id: number;
  expenseCode: string; // e.g. EXP-1405-1001
  categoryFa: string; // اجاره، قبوض، حقوق و دستمزد، بازاریابی، ملزومات، سایر
  titleFa: string;
  amountIrr: number;
  dateJalali: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS';
  sourceBankOrCash: string;
  notesFa?: string | null;
  actorUserId?: number;
  createdAt?: string;
}

export interface OperationalIncomeRecord {
  id: number;
  incomeCode: string; // e.g. INC-1405-1001
  categoryFa: string; // درآمدهای عملیاتی، خدمات مشاوره، فروش ضایعات، سود بانکی، سایر
  titleFa: string;
  amountIrr: number;
  dateJalali: string;
  receiptMethod: 'CASH' | 'BANK_TRANSFER' | 'POS';
  targetBankOrCash: string;
  notesFa?: string | null;
  actorUserId: number;
  createdAt: string;
}

export interface SimpleOpeningBalancePayload {
  dateJalali: string;
  bankBalances: Array<{ id: number; titleFa: string; balanceIrr: number }>;
  cashBalances: Array<{ id: number; titleFa: string; balanceIrr: number }>;
  partyBalances: Array<{ partyId: number; partyTitleFa: string; type: 'DEBTOR' | 'CREDITOR'; amountIrr: number }>;
  inventoryBalances: Array<{ itemId: number; itemTitleFa: string; warehouseId: number; qty: number; unitCostIrr: number }>;
  notesFa?: string;
}

// ============================================================================
// STAGE 9: DOUBLE-ENTRY ACCOUNTING, CHART OF ACCOUNTS, DOCUMENTS & GENERAL LEDGER
// ============================================================================

export type AccountLevel = 'GROUP' | 'GENERAL' | 'SUBSIDIARY';
export type AccountNature = 'DEBIT' | 'CREDIT';
export type AccountGroupCode = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface AccountRecord {
  id: number;
  code: string; // e.g. '101', '10101'
  titleFa: string;
  level: AccountLevel;
  parentCode: string | null;
  nature: AccountNature;
  groupCode: AccountGroupCode;
  groupTitleFa: string;
  descriptionFa?: string;
  isSystem: boolean;
  createdAt: string;
}

export type AccountingDocumentStatus = 'DRAFT' | 'APPROVED' | 'PERMANENT';

export type AccountingSourceDocType =
  | 'MANUAL'
  | 'SALES_INVOICE'
  | 'PURCHASE_INVOICE'
  | 'TREASURY_RECEIPT'
  | 'TREASURY_PAYMENT'
  | 'CHEQUE_CLEARANCE'
  | 'CHEQUE_BOUNCE'
  | 'OPERATIONAL_EXPENSE'
  | 'INSTALLATION_JOB'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'PROJECT_CONSUMPTION'
  | 'INVENTORY_TRANSFER'
  | 'CLOSING_PERIOD'
  | 'FIXED_ASSET_DEPRECIATION';

export interface AccountingDocumentLine {
  id: number;
  rowNumber: number;
  accountCode: string;
  accountTitleFa: string;
  detailId?: number | null;
  detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
  detailTitleFa?: string | null;
  debitIrr: number;
  creditIrr: number;
  descriptionFa: string;
}

export interface AccountingDocumentRecord {
  id: number;
  docNumber: string; // e.g. DOC-1405-0001
  referenceNumber?: string | null;
  dateJalali: string;
  dateIso: string;
  docType: 'MANUAL' | 'AUTO' | 'CLOSING';
  sourceDocType?: AccountingSourceDocType | null;
  sourceDocId?: string | number | null;
  descriptionFa: string;
  status: AccountingDocumentStatus;
  totalDebitIrr: number;
  totalCreditIrr: number;
  lines: AccountingDocumentLine[];
  createdByUserId: number;
  createdByName: string;
  approvedByUserId?: number | null;
  approvedByName?: string | null;
  permanentByUserId?: number | null;
  permanentByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLedgerEntry {
  id: string;
  docId: number;
  docNumber: string;
  dateJalali: string;
  rowNumber: number;
  accountCode: string;
  accountTitleFa: string;
  detailTitleFa?: string;
  descriptionFa: string;
  debitIrr: number;
  creditIrr: number;
}

export interface GeneralLedgerEntry {
  docId: number;
  docNumber: string;
  dateJalali: string;
  descriptionFa: string;
  debitIrr: number;
  creditIrr: number;
  runningBalanceIrr: number;
  balanceSide: 'بدهکار' | 'بستانکار' | 'تسویه';
}

export interface GeneralLedgerAccountSummary {
  accountCode: string;
  accountTitleFa: string;
  level: AccountLevel;
  nature: AccountNature;
  totalDebitIrr: number;
  totalCreditIrr: number;
  netBalanceIrr: number;
  balanceSide: 'DEBIT' | 'CREDIT' | 'ZERO';
  entries: GeneralLedgerEntry[];
}

export interface TrialBalanceRow {
  accountCode: string;
  accountTitleFa: string;
  level: AccountLevel;
  groupTitleFa: string;
  nature: AccountNature;
  totalDebitIrr: number;
  totalCreditIrr: number;
  remainingDebitIrr: number;
  remainingCreditIrr: number;
}

// ============================================================================
// STAGE 10: FISCAL YEARS, ACCOUNTING PERIODS, PERIOD CLOSING,
// COST CENTERS & MULTI-DIMENSIONAL PROFITABILITY ANALYTICS
// ============================================================================

export type FiscalPeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface FiscalYearRecord {
  id: number;
  yearCode: string; // e.g. '1405'
  titleFa: string; // e.g. 'سال مالی ۱۴۰۵'
  startDateJalali: string; // '1405/01/01'
  endDateJalali: string; // '1405/12/29'
  status: FiscalPeriodStatus;
  isDefault: boolean;
  closingDocId?: number | null;
  closingDocNumber?: string | null;
  closedAt?: string | null;
  closedByUserId?: number | null;
  closedByNameFa?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingPeriodRecord {
  id: number;
  fiscalYearId: number;
  fiscalYearCode: string;
  periodNumber: number; // 1 to 12
  titleFa: string; // e.g. 'فروردین‌ماه ۱۴۰۵' or 'بهار ۱۴۰۵'
  startDateJalali: string;
  endDateJalali: string;
  status: FiscalPeriodStatus;
  closedAt?: string | null;
  closedByUserId?: number | null;
  closingDocId?: number | null;
  closingDocNumber?: string | null;
  notesFa?: string | null;
}

export interface CostCenterRecord {
  id: number;
  code: string; // e.g. 'CC-101'
  titleFa: string;
  managerNameFa?: string | null;
  budgetIrr?: number;
  isActive: boolean;
  descriptionFa?: string | null;
  createdAt: string;
}

export interface ProfitabilityDimensionRow {
  keyId: string | number;
  dimensionCode: string;
  dimensionTitleFa: string;
  subTitleFa?: string;
  quantitySold: number;
  grossSalesIrr: number;
  discountsIrr: number;
  returnsIrr: number;
  netSalesIrr: number;
  cogsIrr: number;
  grossProfitIrr: number;
  grossMarginPct: number;
  allocatedExpensesIrr: number;
  netProfitIrr: number;
  netMarginPct: number;
}

export interface ProfitabilitySummary {
  totalGrossSalesIrr: number;
  totalDiscountsIrr: number;
  totalReturnsIrr: number;
  totalNetSalesIrr: number;
  totalCogsIrr: number;
  totalGrossProfitIrr: number;
  overallGrossMarginPct: number;
  totalOperatingExpensesIrr: number;
  totalInstallerWagesIrr: number;
  totalNetProfitIrr: number;
  overallNetMarginPct: number;
  invoicesCount: number;
  returnsCount: number;
}

export interface ComprehensiveProfitabilityReport {
  summary: ProfitabilitySummary;
  byItem: ProfitabilityDimensionRow[];
  byCategory: ProfitabilityDimensionRow[];
  byCustomer: ProfitabilityDimensionRow[];
  byInstaller: ProfitabilityDimensionRow[];
  byProject: ProfitabilityDimensionRow[];
  fiscalYearCode?: string;
  fromDateJalali?: string;
  toDateJalali?: string;
  generatedAt: string;
}

export interface PeriodCloseResult {
  ok: boolean;
  messageFa: string;
  closingDoc?: AccountingDocumentRecord;
  closingDateJalali: string;
  netProfitIrr: number;
  retainedEarningsDocNumber?: string;
}

// ============================================================================
// STAGE 11: PROJECTS + INSTALLERS + MATERIAL CONSUMPTION + END-TO-END PROFITABILITY
// ============================================================================

export type ProjectStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProjectVisitReport {
  visitDateJalali: string;
  notesFa: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedByUserId: number;
  submittedByNameFa: string;
  reviewedByUserId?: number | null;
  reviewedByNameFa?: string | null;
  reviewNotesFa?: string | null;
  updatedProjectStatus?: ProjectStatus;
}

export interface ProjectRecord {
  id: number;
  projectCode: string; // e.g. PRJ-1405-101
  titleFa: string;
  customerId: number;
  customerTitleFa: string;
  installerId?: number | null;
  installerTitleFa?: string | null;
  salesInvoiceId?: number | null;
  invoiceNumber?: string | null;
  costCenterId?: number | null;
  costCenterCode?: string | null;
  status: ProjectStatus;
  locationAddressFa: string;
  startDateJalali: string;
  targetCompletionDateJalali?: string | null;
  actualCompletionDateJalali?: string | null;
  contractAmountIrr: number; // مبلغ کل قرارداد پروژه
  consumedMaterialsCostIrr: number; // بهای تمام‌شده کالای مصرف‌شده در پروژه
  installerLaborCostIrr: number; // دستمزد نصاب
  allocatedExpensesIrr: number; // هزینه‌های سربار و ترابری
  netProfitIrr: number; // سود خالص
  netMarginPct: number; // حاشیه سود
  notesFa?: string | null;
  lastVisitReport?: ProjectVisitReport | null;
  actorUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequisitionLineItem {
  id: string;
  itemId?: number | null;
  itemCode?: string | null;
  itemNameFa: string;
  requestedQty: number;
  unitFa: string;
  approvedQty?: number;
  actualConsumedQty?: number;
  unitPriceIrr?: number;
  totalPriceIrr?: number;
  serials?: string[];
  notesFa?: string | null;
}

export type ProjectMaterialRequisitionStatus =
  | 'REQUESTED' // ثبت درخواست کالا توسط نصاب
  | 'APPROVED' // تأیید و تصویب اقلام توسط مدیر
  | 'READY_FOR_INSTALL' // اعلام آمادگی و زمان‌بندی نصب توسط نصاب
  | 'CONSUMPTION_SUBMITTED' // ثبت گزارش/اصلاحیه اقلام مصرفی نهایی توسط نصاب
  | 'PRICED_AND_INVOICED' // قیمت‌گذاری مدیر + صدور فاکتور نهایی فروش و تسویه پروژه
  | 'ISSUED' // تحویل انباردار به نصاب
  | 'CONSUMED' // مصرف قطعی در محل پروژه
  | 'RETURNED' // برگشت اقلام مازاد به انبار
  | 'REJECTED'; // رد درخواست

export interface ProjectMaterialRequisitionRecord {
  id: number;
  requestCode: string; // e.g. REQ-1405-101
  projectId: number;
  projectCode: string;
  projectTitleFa: string;
  itemId?: number | null;
  itemCode?: string | null;
  itemTitleFa?: string | null;
  items?: RequisitionLineItem[];
  scheduledInstallDateJalali?: string | null;
  finalInvoiceId?: number | null;
  finalInvoiceNumber?: string | null;
  sourceWarehouseId: number;
  sourceWarehouseTitleFa: string;
  requestedQty: number;
  approvedQty: number;
  issuedQty: number;
  consumedQty: number;
  returnedQty: number;
  unitCostIrr: number; // بر اساس خرید و ارزش انبار
  totalCostIrr: number; // ارزش نهایی مصرف‌شده
  serials?: string[];
  status: ProjectMaterialRequisitionStatus;
  requestedByUserId: number;
  requestedByNameFa: string;
  approvedByUserId?: number | null;
  approvedByNameFa?: string | null;
  issuedByUserId?: number | null;
  issuedByNameFa?: string | null;
  consumedAtJalali?: string | null;
  returnedAtJalali?: string | null;
  notesFa?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectProfitabilityDetail {
  projectId: number;
  projectCode: string;
  projectTitleFa: string;
  customerTitleFa: string;
  installerTitleFa: string;
  contractAmountIrr: number;
  invoicedRevenueIrr: number;
  totalMaterialCostIrr: number;
  installerWagesIrr: number;
  allocatedExpensesIrr: number;
  totalCostsIrr: number;
  grossProfitIrr: number;
  grossMarginPct: number;
  netProfitIrr: number;
  netMarginPct: number;
  requisitions: ProjectMaterialRequisitionRecord[];
  materialsBreakdown: Array<{
    itemId: number;
    itemTitleFa: string;
    consumedQty: number;
    unitCostIrr: number;
    totalCostIrr: number;
  }>;
}

export interface QuickSettlementPayload {
  partyId: number;
  txType: 'RECEIPT' | 'PAYMENT';
  amountIrr: number;
  dateJalali: string;
  paymentMethod: 'POS' | 'CHEQUE' | 'BANK_TRANSFER' | 'CASH' | 'INSTALLMENT';
  bankAccountId?: number;
  cashBoxId?: number;
  chequeNumber?: string;
  chequeDueDateJalali?: string;
  bankNameFa?: string;
  referenceNumber?: string;
  installmentCount?: number;
  descriptionFa?: string;
}

// Stage 12: Fixed Assets & Depreciation Interfaces
export interface FixedAssetRecord {
  id: number;
  assetCode: string;
  titleFa: string;
  purchaseDateJalali: string;
  purchaseCostIrr: number;
  salvageValueIrr: number;
  usefulLifeYears: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
  custodianPartyId?: number | null;
  custodianTitleFa?: string | null;
  locationAddressFa: string;
  accumulatedDepreciationIrr: number;
  bookValueIrr: number;
  lastDepreciationDateJalali?: string | null;
  createdAt: string;
}

export interface DepreciationEntryRecord {
  id: number;
  assetId: number;
  assetTitleFa: string;
  periodJalali: string;
  depreciationAmountIrr: number;
  accountingDocId?: number | null;
  postedAt: string;
}

// Opening Balance Voucher & Excel Import Interfaces
export interface OpeningBalanceImportItem {
  type: 'PARTY' | 'INVENTORY' | 'BANK_CASH' | 'GENERAL_ACCOUNT';
  refId?: number;
  code?: string;
  titleFa: string;
  accountCode: string;
  debitIrr: number;
  creditIrr: number;
  qty?: number;
  unitCostIrr?: number;
  warehouseId?: number;
  notesFa?: string;
}

export interface OpeningBalanceBatchPayload {
  dateJalali: string;
  descriptionFa: string;
  items: OpeningBalanceImportItem[];
}

// ============================================================================
// GOLD & JEWELRY MODULE TYPES (معاملات همکار، فروش گرمی بدون ریال و کاردکس دوگانه)
// ============================================================================
export type GoldTradeType =
  | 'COLLEAGUE_WEIGHT_SALE' // فروش همکار (تحویل طلای ساخته یا آبشده به همکار - بدهکار وزنی طلا)
  | 'COLLEAGUE_WEIGHT_RECEIPT' // دریافت طلا از همکار (بستانکار وزنی طلا)
  | 'COLLEAGUE_BARTER' // بده‌بستان و تهاتر همکار (تبادل طلا به طلا با کسر/اضافه سوت و اجرت)
  | 'COLLEAGUE_SETTLEMENT' // تسویه وزنی طلا
  | 'GOLD_TO_RIAL_CONVERSION'; // تبدیل مانده وزنی به ریالی با مظنه روز

export type GoldItemCategory =
  | 'GOLD_18K_MADE' // طلای ساخته ۱۸ عیار
  | 'MELTED_GOLD' // طلای آبشده (با شماره انگ)
  | 'SCRAP_GOLD' // طلای کهنه / متفرقه
  | 'COIN' // سکه بهار آزادی
  | 'BAR_INGOT'; // شمش طلا

export interface GoldColleagueTrade {
  id: number;
  tradeNumber: string; // e.g. GLD-TRD-1405-101
  tradeType: GoldTradeType;
  partyId: number;
  partyTitleFa: string;
  dateJalali: string;
  goldItemCategory: GoldItemCategory;
  rawWeightGrams: number; // وزن ناخالص (گرم و سوت)
  stoneWeightGrams: number; // وزن نگین/سنگ
  netWeightGrams: number; // وزن خالص طلا
  ayar: number; // عیار مثلاً 750 (18 عیار) یا عیار انگ
  pure750WeightGrams: number; // وزن معادل طلای استاندارد ۷۵۰: (وزن × عیار) / 750
  makingWageGrams: number; // اجرت وزنی به ازای هر گرم یا جمع وزنی
  totalGoldEffectGrams: number; // تأثیر نهایی بر مانده طلا (+ یا -)
  isPureGoldTradeNoRial: boolean; // آیا معامله کاملاً بدون ریال و صرفاً بده‌بستان گرمی طلا است؟
  goldDailyRateIrr?: number; // مظنه روز هر گرم طلا (در صورت معامله ریالی)
  totalAmountIrr?: number; // مبلغ ریالی معامله
  engravingCode?: string; // شماره انگ آزمایشگاه یا کد کالا
  descriptionFa?: string;
  createdAt: string;
}

export interface GoldDualLedgerItem {
  id: number;
  dateJalali: string;
  refNumber: string;
  docTypeFa: string;
  titleFa: string;
  goldInGrams: number; // ورودی طلا (بستانکار وزنی ما)
  goldOutGrams: number; // خروجی طلا (بدهکار وزنی ما)
  runningGoldBalanceGrams: number; // مانده وزنی لحظه‌ای طلا (گرم ۷۵۰)
  debitIrr: number; // بدهکار ریالی
  creditIrr: number; // بستانکار ریالی
  runningRialBalanceIrr: number; // مانده لحظه‌ای ریالی
  isPureGoldTradeNoRial: boolean;
  notesFa?: string;
}

// ============================================================================
// RESTAURANT & CAFE MODULE TYPES (فاز ۷: میزها، منوی لمسی و بن آشپزخانه)
// ============================================================================
export type RestaurantOrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface RestaurantTableRecord {
  id: number;
  tableNumber: string;
  titleFa: string;
  capacity: number;
  sectionFa: string; // e.g. سالن اصلی، تراس، VIP
  status: TableStatus;
  currentOrderId?: number | null;
  currentOrderAmountIrr?: number;
}

export interface RestaurantOrderLine {
  itemId: number;
  itemTitleFa: string;
  quantity: number;
  unitPriceIrr: number;
  notesFa?: string;
}

export interface RestaurantOrderRecord {
  id: number;
  orderNumber: string;
  orderType: RestaurantOrderType;
  tableNumber?: string | null;
  customerNameFa?: string;
  phone?: string;
  lines: RestaurantOrderLine[];
  subtotalIrr: number;
  serviceChargeIrr: number;
  vatAmountIrr: number;
  totalPayableIrr: number;
  status: 'PENDING_KITCHEN' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED';
  dateJalali: string;
  salesInvoiceId?: number;
  salesInvoiceNumber?: string;
  paymentMethod?: 'POS' | 'CASH' | 'OPEN_CREDIT';
  paidAmountIrr?: number;
  financialLedgerStatus?: 'RECORDED_IN_SALES' | 'RECORDED_IN_TREASURY' | 'ON_CREDIT';
  accountingDocNumber?: string;
  createdAt: string;
}

export interface RestaurantMenuItemRecord {
  id: number;
  category: 'IRANIAN' | 'FAST_FOOD' | 'PASTA_BURGER' | 'APPETIZER' | 'CAFE_BAR' | 'DESSERT';
  categoryFa: string;
  titleFa: string;
  descriptionFa: string;
  priceIrr: number;
  prepTimeMinutes: number;
  iconText: string;
  imageUrl: string;
  badgeFa?: string;
  calories?: number;
  isAvailable: boolean;
  createdAt?: string;
}

// ============================================================================
// WHOLESALE & DISTRIBUTION MODULE TYPES (فاز ۸: پخش عمده، کارتن، نرخ همکار و توزیع)
// ============================================================================
export type PriceTierCode =
  | 'CONSUMER'          // مصرف‌کننده نهایی
  | 'RETAIL_COLLEAGUE'  // خرده‌فروش / همکار
  | 'WHOLESALE_BULK'    // عمده‌فروشی / بنکدار
  | 'DISTRIBUTOR_VIP';  // نمایندگی انحصاری / تیراژ ویژه

export interface WholesalePackagingConfig {
  primaryUnitFa: string;   // واحد جزء (عدد، قوطی، شیشه، کیلو)
  packUnitFa: string;      // واحد بسته‌بندی کل (کارتن، بسته، جعبه، شیرینک)
  unitsPerPack: number;    // ضریب بسته به جزء (مثلا ۲۴ عدد در هر کارتن)
  packWeightKg?: number;   // وزن تقریبی هر کارتن به کیلوگرم
}

export interface WholesaleItemPriceTiers {
  consumerIrr: number;
  retailColleagueIrr: number;
  wholesaleBulkIrr: number;
  distributorVipIrr: number;
}

export interface WholesaleOrderLine {
  itemId: number;
  itemTitleFa: string;
  packCount: number;         // تعداد کارتن
  looseUnitsCount: number;   // تعداد تک (جزء)
  unitsPerPack: number;      // ضریب کارتن
  totalUnits: number;        // کل تعداد جزء = (packCount * unitsPerPack) + looseUnitsCount
  priceTier: PriceTierCode;
  unitPriceIrr: number;      // قیمت هر واحد جزء در رده انتخابی
  packPriceIrr: number;      // قیمت هر کارتن در رده انتخابی = unitPriceIrr * unitsPerPack
  discountPercent: number;   // تخفیف تیراژ یا همکار
  lineTotalIrr: number;      // جمع ردیف
}

export interface WholesaleOrderRecord {
  id: number;
  orderNumber: string; // e.g. WHO-1405-001
  customerId: number;
  customerNameFa: string;
  customerCreditLimitIrr: number;
  currentOutstandingDebtIrr: number;
  isCreditLimitExceeded: boolean;
  visitorNameFa?: string;
  paymentTermsFa: 'CASH' | 'CHEQUE_30_DAYS' | 'CHEQUE_60_DAYS' | 'OPEN_CREDIT';
  lines: WholesaleOrderLine[];
  totalCartons: number;
  totalLooseUnits: number;
  subtotalIrr: number;
  discountTotalIrr: number;
  shippingFeeIrr: number;
  vatAmountIrr: number;
  totalPayableIrr: number;
  dispatchStatus: 'PENDING_PACKING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
  dateJalali: string;
  createdAt: string;
}

export interface WholesaleDispatchRecord {
  id: number;
  dispatchNumber: string; // e.g. DSP-1405-001
  orderId: number;
  orderNumber: string;
  customerNameFa: string;
  destinationCityFa: string;
  destinationAddressFa: string;
  driverNameFa: string;
  driverPhone: string;
  vehiclePlateFa: string;
  vehicleTypeFa: string; // نیسان، خاور ۶ تن، ایسوزو، وانت مزدا
  totalCartons: number;
  grossWeightKg: number;
  status: 'PREPARING' | 'LOADED' | 'ON_THE_WAY' | 'DELIVERED';
  dateJalali: string;
  shippingCostIrr: number;
  notesFa?: string;
  createdAt: string;
}

// ============================================================================
// SERVICES & CONTRACTING MODULE TYPES (فاز ۹: خدمات فنی، تیکت کار، تکنسین و قطعات)
// ============================================================================
export type JobTicketPriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type JobTicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PARTS_CONSUMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceSparePartLine {
  itemId: number;
  itemTitleFa: string;
  quantity: number;
  unitPriceIrr: number;
  totalPriceIrr: number;
}

export interface ServiceJobTicketRecord {
  id: number;
  ticketNumber: string; // e.g. TCK-1405-001
  customerId: number;
  customerNameFa: string;
  customerPhone: string;
  customerAddressFa: string;
  titleFa: string;
  descriptionFa: string;
  priority: JobTicketPriority;
  status: JobTicketStatus;
  technicianId?: number;
  technicianNameFa?: string;
  laborFeeIrr: number;
  spareParts: ServiceSparePartLine[];
  sparePartsTotalIrr: number;
  totalCostIrr: number;
  dateJalali: string;
  dueDateJalali?: string;
  completionNotesFa?: string;
  invoiceId?: number;
  createdAt: string;
}

// ============================================================================
// STAGE 16 / PHASE 9: MOBILE, LAPTOP & DIGITAL ELECTRONICS (صنف موبایل، رایانه و دیجیتال)
// ============================================================================

export type MobileDeviceCondition = 'NEW' | 'USED_LIKE_NEW' | 'USED_GOOD' | 'STOCK_REFURBISHED';
export type MobileRegistryStatus = 'REGISTERED' | 'NOT_REGISTERED' | 'TRAVELLER_PASSPORT' | 'COMMERCIAL_CUSTOMS';
export type MobileWarrantyStatus = 'UNDER_WARRANTY' | 'EXPIRED' | 'NO_WARRANTY' | 'CORPORATE_REPRESENTATIVE';

export interface MobileDeviceRecord {
  id: number;
  itemId: number;
  modelFa: string; // e.g. سامسونگ Galaxy S24 Ultra یا آیفون ۱۳ نرمال
  brandFa: string; // اپل، سامسونگ، شیائومی، ایسوس
  imei1: string; // کد IMEI 1 (۱۵ رقمی)
  imei2?: string | null; // کد IMEI 2 (دو سیم‌کارت)
  serialNumber?: string | null;
  storageGb: number; // 128, 256, 512, 1024
  ramGb?: number; // 8, 12, 16
  colorFa: string;
  condition: MobileDeviceCondition;
  registryStatus: MobileRegistryStatus;
  warrantyStatus: MobileWarrantyStatus;
  warrantyCompanyFa?: string | null;
  warrantyExpiresJalali?: string | null;
  batteryHealthPercent?: number | null; // درصد سلامت باتری
  purchasePriceIrr: number;
  salePriceIrr: number;
  stockStatus: 'IN_STOCK' | 'SOLD' | 'UNDER_REPAIR' | 'RETURNED';
  warehouseId: number;
  createdAt: string;
}

export type MobileRepairStatus =
  | 'RECEIVED' // پذیرش اولیه در نوبت بررسی
  | 'DIAGNOSING' // در حال عیب‌یابی فنی
  | 'WAITING_PARTS' // در انتظار قطعه یدکی
  | 'IN_REPAIR' // در حال تعمیر روی میز کار
  | 'REPAIRED' // تعمیر شده و آماده تست/تحویل
  | 'DELIVERED' // تحویل به مشتری و تسویه شد
  | 'UNREPAIRABLE' // غیرقابل تعمیر
  | 'CANCELLED'; // انصراف مشتری

export interface MobileRepairPartLine {
  id: number;
  partNameFa: string; // e.g. تاچ و ال‌سی‌دی اورجینال، باتری تقویت شده
  partCostIrr: number;
  quantity: number;
  totalCostIrr: number;
}

export interface MobileRepairTicketRecord {
  id: number;
  ticketNumber: string; // e.g. REP-1405-101
  customerId: number;
  customerNameFa: string;
  customerPhone: string;
  deviceModelFa: string;
  colorFa?: string;
  imeiOrSerial: string;
  securityPasscodeOrPattern?: string; // رمز ورود یا الگوی پترن جهت تست قطعات
  accompaniedAccessoriesFa?: string; // شارژر، قاب، سیم‌کارت، کارتن
  reportedFaultsFa: string; // شرح ایراد (خاموشی، شکستگی صفحه، تعویض باتری)
  physicalConditionNotesFa?: string; // خط و خش بدنه یا ضربه‌خوردگی در زمان ورود
  assignedTechnicianId?: number;
  assignedTechnicianNameFa?: string;
  estimatedCostIrr: number; // برآورد اولیه هزینه
  depositPaidIrr: number; // بیعانه دریافتی
  parts: MobileRepairPartLine[];
  partsTotalIrr: number;
  laborFeeIrr: number; // اجرت خدمات و دستمزد
  discountIrr: number;
  finalTotalIrr: number; // جمع نهایی (قطعات + اجرت - تخفیف)
  remainingPayableIrr: number; // باقیمانده قابل پرداخت
  status: MobileRepairStatus;
  receptionDateJalali: string;
  estimatedDeliveryDateJalali?: string;
  deliveredDateJalali?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  notesFa?: string;
  createdAt: string;
}
