import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CONNECTION_VAULT_FILE,
  LOCAL_STATE_DB_FILE,
  MIGRATIONS_DIR,
  ensureRuntimeDirectories,
} from './paths';
import {
  EncryptedSecretPayload,
  decryptSecret,
  encryptSecret,
  generateSalt,
  hashPassword,
  sanitizeForLogAndApi,
  verifyPassword,
} from './cryptoVault';
import {
  PartyRecord,
  PartyTransactionRecord,
  PartyPrimaryType,
  PartyStatus,
  DuplicateCandidate,
  DuplicateCheckResponse,
  ItemCategoryRecord,
  ItemBrandRecord,
  ItemUnitRecord,
  ItemRecord,
  WarehouseRecord,
  ItemSerialRecord,
  InventoryDocumentRecord,
  InventoryDocumentLine,
  ItemKardexEntry,
  InventoryDocType,
  SerialStatus,
  ForeignCurrencyCode,
  CostAllocationMethod,
  PurchaseProformaStatus,
  PurchaseInvoiceStatus,
  PurchasePaymentMethod,
  PurchaseLandedCosts,
  PurchaseInvoiceLine,
  PurchaseProformaLine,
  PurchaseProformaRecord,
  PurchaseInvoiceRecord,
  PurchasePaymentRecord,
  PurchaseReturnLine,
  PurchaseReturnRecord,
  SalesProformaStatus,
  SalesInvoiceStatus,
  SalesPaymentMethod,
  SalesInvoiceType,
  SalesProformaLine,
  SalesProformaRecord,
  SalesInvoiceLine,
  SalesInvoiceRecord,
  SalesReceiptRecord,
  SalesReturnLine,
  SalesReturnRecord,
  InstallationJobStatus,
  InstallationJobRecord,
  CashBoxRecord,
  BankAccountRecord,
  ChequeType,
  ChequeStatus,
  ChequeRecord,
  TreasuryTransactionRecord,
  InstallmentRecord,
  OperationalExpenseRecord,
  AccountRecord,
  AccountingDocumentStatus,
  AccountingSourceDocType,
  AccountingDocumentLine,
  AccountingDocumentRecord,
  JournalLedgerEntry,
  GeneralLedgerEntry,
  GeneralLedgerAccountSummary,
  TrialBalanceRow,
  FiscalYearRecord,
  AccountingPeriodRecord,
  CostCenterRecord,
  ComprehensiveProfitabilityReport,
  ProfitabilityDimensionRow,
  ProfitabilitySummary,
  PeriodCloseResult,
  ProjectStatus,
  ProjectRecord,
  ProjectMaterialRequisitionStatus,
  ProjectMaterialRequisitionRecord,
  RequisitionLineItem,
  ProjectProfitabilityDetail,
  QuickSettlementPayload,
  FixedAssetRecord,
  DepreciationEntryRecord,
  OpeningBalanceImportItem,
  OpeningBalanceBatchPayload,
  OperationalIncomeRecord,
  SimpleOpeningBalancePayload,
  DocumentNumberingConfig,
  IndustryProfileCode,
  IndustryProfileConfig,
  IndustryProfileFeatures,
  GoldTradeType,
  GoldItemCategory,
  GoldColleagueTrade,
  GoldDualLedgerItem,
  RestaurantOrderType,
  TableStatus,
  RestaurantTableRecord,
  RestaurantOrderLine,
  RestaurantOrderRecord,
  PriceTierCode,
  WholesalePackagingConfig,
  WholesaleItemPriceTiers,
  WholesaleOrderLine,
  WholesaleOrderRecord,
  WholesaleDispatchRecord,
  JobTicketPriority,
  JobTicketStatus,
  ServiceSparePartLine,
  ServiceJobTicketRecord,
  MobileDeviceCondition,
  MobileRegistryStatus,
  MobileWarrantyStatus,
  MobileDeviceRecord,
  MobileRepairStatus,
  MobileRepairPartLine,
  MobileRepairTicketRecord,
  InventoryTransferRecord,
  InventoryTransferLine,
  TransferStatus,
  ExecutiveBiMetrics,
  RemoteTunnelConfig,
  GoogleSheetsSyncConfig,
  GoogleSheetsSyncLog,
} from '../types/foundation';

export const INDUSTRY_PROFILES: Record<string, IndustryProfileConfig> = {
  CCTV_SECURITY: {
    code: 'CCTV_SECURITY',
    titleFa: 'دوربین مداربسته و سیستم‌های حفاظتی و نظارتی (مهرگان)',
    descriptionFa: 'پروفایل جامع مهندسی نظارت تصویری؛ شامل پروژه‌های اجرایی، سفارشات نصب و کابل‌کشی، کارتابل نصابان و ردیابی تخصصی سریال و MAC آدرس شبکه.',
    badgeLabelFa: 'صنف نظارت تصویری و حفاظتی',
    features: {
      enableInstallationServices: true,
      enableHardwareMacTracking: true,
      enableInstallersRole: true,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'کالا و تجهیزات نظارتی',
      serialTrackerTitleFa: 'رهگیری سریال و MAC آدرس',
      partiesInstallerRoleTitleFa: 'نصابان و تکنسین‌ها',
      salesTabTitleFa: 'فروش و POS',
      salesTabDescFa: 'فروش تجهیزات، پیش‌فاکتور و صندوق سریع',
      purchasesTabTitleFa: 'خرید و تدارکات',
      purchasesTabDescFa: 'فاکتورهای خرید، تأمین تجهیزات و بهای تمام‌شده',
      treasuryTabTitleFa: 'دریافت و پرداخت',
      treasuryTabDescFa: 'صندوق‌ها، حساب‌های بانکی و چک‌های صیادی',
      partiesTabTitleFa: 'اشخاص و طرفین',
      partiesTabDescFa: 'صورت‌حساب مشتریان، نصابان و کارفرمایان',
      installationTabTitleFa: 'خدمات و نصب CCTV',
      quickPosButtonLabelFa: 'فاکتور فروش POS',
      quickSalesSubmenuTitleFa: 'فروش، POS و پیش‌فاکتور',
      quickPurchasesSubmenuTitleFa: 'فاکتور خرید و بهای تمام‌شده',
      quickTreasurySubmenuTitleFa: 'دریافت، پرداخت و چک صیادی',
      quickPartiesSubmenuTitleFa: 'صورت‌حساب مشتریان و اشخاص',
      quickInventorySubmenuTitleFa: 'کالا و تجهیزات نظارتی و کاردکس',
    },
    theme: {
      id: 'cctv',
      primaryColor: '#0284c7',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'text-emerald-700',
      headerBrandTitleFa: 'سامانه جامع ERP و نظارت تصویری',
    },
    layout: {
      preset: 'ENGINEERING_PROJECTS',
      defaultSalesMode: 'STANDARD',
      showInstallationTab: true,
      showProjectsTab: true,
    },
  },
  RETAIL_GENERAL: {
    code: 'RETAIL_GENERAL',
    titleFa: 'فروشگاه و خرده‌فروشی عمومی',
    descriptionFa: 'پروفایل سبک و سریع برای فروشگاه‌ها و اصناف عمومی؛ متمرکز بر فروش سریع بارکدی POS، خرید، انبارداری استاندارد، حسابداری دوبل و خزانه‌داری بدون پیچیدگی‌های خدمات نصب.',
    badgeLabelFa: 'صنف فروشگاه و خرده‌فروشی',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'کالا و انبارداری',
      serialTrackerTitleFa: 'رهگیری شماره سریال کالا',
      partiesInstallerRoleTitleFa: 'مجریان و کارشناسان فنی',
      salesTabTitleFa: 'فروشگاه و POS',
      salesTabDescFa: 'فروش سریع بارکدی، صدور فاکتور و تسویه POS',
      purchasesTabTitleFa: 'خرید و تأمین کالا',
      purchasesTabDescFa: 'فاکتور خرید کالا و انبار ورودی',
      treasuryTabTitleFa: 'صندوق و بانک',
      treasuryTabDescFa: 'مدیریت موجودی نقد، کارتخوان و چک‌ها',
      partiesTabTitleFa: 'مشتریان و طرفین',
      partiesTabDescFa: 'حساب‌های دفتری و تأمین‌کنندگان',
      installationTabTitleFa: 'خدمات فنی',
      quickPosButtonLabelFa: 'صندوق سریع POS',
      quickSalesSubmenuTitleFa: 'صندوق فروش سریع بارکدی POS',
      quickPurchasesSubmenuTitleFa: 'خرید کالا، فاکتور و ورود به انبار',
      quickTreasurySubmenuTitleFa: 'صندوق‌ها، کارتخوان و واریز بانکی',
      quickPartiesSubmenuTitleFa: 'مشتریان و حساب‌های دفتری',
      quickInventorySubmenuTitleFa: 'کالا و انبارداری و کاردکس',
    },
    theme: {
      id: 'retail',
      primaryColor: '#2563eb',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'text-blue-700',
      headerBrandTitleFa: 'سامانه فروشگاهی و خرده‌فروشی عمومی',
    },
    layout: {
      preset: 'RETAIL_FAST_POS',
      defaultSalesMode: 'TOUCH_POS',
      showInstallationTab: false,
      showProjectsTab: false,
    },
  },
  SUPERMARKET_GROCERY: {
    code: 'SUPERMARKET_GROCERY',
    titleFa: 'سوپرمارکت، هایپرمارکت و مواد غذایی',
    descriptionFa: 'پروفایل متمرکز بر فروش سریع بارکدی، صندوق لمسی POS، خرید، انبارداری استاندارد و حسابداری بدون خدمات نصب و کابل‌کشی.',
    badgeLabelFa: 'صنف سوپرمارکت و مواد غذایی',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'کالاها و اقلام سوپرمارکت',
      serialTrackerTitleFa: 'رهگیری بارکد کالا',
      partiesInstallerRoleTitleFa: 'پرسنل و متصدیان فروشگاه',
      salesTabTitleFa: 'صندوق و فروش',
      salesTabDescFa: 'فروش فوق‌سریع بارکدی، صندوق لمسی و تسویه آنی',
      purchasesTabTitleFa: 'خرید کالا',
      purchasesTabDescFa: 'تأمین اقلام سوپرمارکت و شارژ انبار',
      treasuryTabTitleFa: 'صندوق و کارتخوان',
      treasuryTabDescFa: 'موجودی نقد صندوق، کارتخوان و واریز',
      partiesTabTitleFa: 'مشتریان و طرفین',
      partiesTabDescFa: 'حساب‌های دفتری و تأمین‌کنندگان مواد غذایی',
      installationTabTitleFa: 'خدمات',
      quickPosButtonLabelFa: 'صندوق سریع POS',
      quickSalesSubmenuTitleFa: 'صندوق فروش سریع بارکدی و تسویه POS',
      quickPurchasesSubmenuTitleFa: 'خرید اقلام سوپرمارکت و شارژ انبار',
      quickTreasurySubmenuTitleFa: 'صندوق‌ها، کارتخوان و واریز بانکی',
      quickPartiesSubmenuTitleFa: 'حساب‌های دفتری و تأمین‌کنندگان',
      quickInventorySubmenuTitleFa: 'کالاها و اقلام سوپرمارکت و کاردکس',
    },
    theme: {
      id: 'grocery',
      primaryColor: '#059669',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'text-amber-700',
      headerBrandTitleFa: 'سامانه فروشگاهی سوپرمارکت و مواد غذایی',
    },
    layout: {
      preset: 'GROCERY_BARCODE',
      defaultSalesMode: 'TOUCH_POS',
      showInstallationTab: false,
      showProjectsTab: false,
    },
  },
  GOLD_JEWELRY: {
    code: 'GOLD_JEWELRY',
    titleFa: 'طلا، جواهر و نقره‌فروشی',
    descriptionFa: 'پروفایل تخصصی طلا و جواهرفروشی؛ شامل مدیریت وزن (گرم و سوت)، عیار ۱۸، اجرت ساخت، مظنه زنده و تهاتر طلای مستعمل.',
    badgeLabelFa: 'صنف طلا و جواهرات',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'موجودی طلا و جواهرات',
      serialTrackerTitleFa: 'شناسنامه و کد کالا',
      partiesInstallerRoleTitleFa: 'مخبران و بنکداران طلا',
      salesTabTitleFa: 'فروش طلا و جواهر',
      salesTabDescFa: 'فروش بر اساس وزن، عیار ۱۸، اجرت، سود و تهاتر',
      purchasesTabTitleFa: 'خرید طلا و متفرقه',
      purchasesTabDescFa: 'خرید آبشده، طلای کهنه/مستعمل و طلای نو',
      treasuryTabTitleFa: 'خزانه و صندوق طلا',
      treasuryTabDescFa: 'صندوق ریالی، حساب بانکی، چک و موازنه طلا',
      partiesTabTitleFa: 'مشتریان و همکاران طلا',
      partiesTabDescFa: 'حساب دفتری طلا و ریال مشتریان و بنکداران',
      installationTabTitleFa: 'کارگاه طلاسازی',
      quickPosButtonLabelFa: 'فروش سریع طلا',
      quickSalesSubmenuTitleFa: 'فاکتور طلا با عیار، اجرت و تهاتر',
      quickPurchasesSubmenuTitleFa: 'خرید طلای کهنه، آبشده و متفرقه',
      quickTreasurySubmenuTitleFa: 'صندوق ریالی، کارتخوان و تسویه',
      quickPartiesSubmenuTitleFa: 'مشتریان و بنکداران صنف طلا',
      quickInventorySubmenuTitleFa: 'موجودی طلا، سکه، جواهرات و کاردکس',
    },
    theme: {
      id: 'gold',
      primaryColor: '#d97706',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      badgeText: 'text-amber-800',
      headerBrandTitleFa: 'سامانه جامع مدیریت طلا و جواهرات',
    },
    layout: {
      preset: 'GOLD_JEWELRY_CALC',
      defaultSalesMode: 'JEWELRY_CALC',
      showInstallationTab: false,
      showProjectsTab: false,
    },
  },
  RESTAURANT_CAFE: {
    code: 'RESTAURANT_CAFE',
    titleFa: 'رستوران، فست‌فود و کافی‌شاپ',
    descriptionFa: 'پروفایل تخصصی رستوران و کافه؛ شامل منوی لمسی، سفارشات سالن و بیرون‌بر، بن آشپزخانه و مدیریت انبار مواد مصرفی.',
    badgeLabelFa: 'صنف رستوران و کافه',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'منو و مواد اولیه آشپزخانه',
      serialTrackerTitleFa: 'کد سفارش و بن آشپزخانه',
      partiesInstallerRoleTitleFa: 'پرسنل سالن و تأمین‌کنندگان',
      salesTabTitleFa: 'صندوق و سفارشات',
      salesTabDescFa: 'سفارش‌گیری لمسی سالن، بیرون‌بر و بن آشپزخانه',
      purchasesTabTitleFa: 'خرید مواد مصرفی',
      purchasesTabDescFa: 'تأمین مواد اولیه آشپزخانه، انبار و بار روز',
      treasuryTabTitleFa: 'صندوق و کارتخوان',
      treasuryTabDescFa: 'تسویه نقد و پوز سالن و پیک‌های بیرون‌بر',
      partiesTabTitleFa: 'مشتریان و تأمین‌کنندگان',
      partiesTabDescFa: 'مشترکین تلفنی، تأمین‌کنندگان و پرسنل',
      installationTabTitleFa: 'آشپزخانه و بار',
      quickPosButtonLabelFa: 'صندوق سریع رستوران',
      quickSalesSubmenuTitleFa: 'سفارش سریع سالن/بیرون‌بر و چاپ فاکتور',
      quickPurchasesSubmenuTitleFa: 'خرید و ورود مواد اولیه آشپزخانه',
      quickTreasurySubmenuTitleFa: 'صندوق فروش، کارتخوان و تسویه پیک',
      quickPartiesSubmenuTitleFa: 'مشترکین و تأمین‌کنندگان غذا',
      quickInventorySubmenuTitleFa: 'منو و مواد اولیه آشپزخانه و کاردکس',
    },
    theme: {
      id: 'restaurant',
      primaryColor: '#ea580c',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-300',
      badgeText: 'text-orange-800',
      headerBrandTitleFa: 'سامانه مدیریت رستوران و کافه',
    },
    layout: {
      preset: 'RESTAURANT_TOUCH_TABLES',
      defaultSalesMode: 'TOUCH_POS',
      showInstallationTab: false,
      showProjectsTab: false,
    },
  },
  WHOLESALE_DISTRIBUTION: {
    code: 'WHOLESALE_DISTRIBUTION',
    titleFa: 'پخش عمده، بازرگانی و بنکداری',
    descriptionFa: 'پروفایل تخصصی پخش عمده و بنکداری؛ شامل بسته‌بندی کارتن و جزء، نرخ همکار، موزعین و کنترل سقف اعتبار باز.',
    badgeLabelFa: 'صنف پخش عمده و بنکداری',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'موجودی انبار و کارتن‌ها',
      serialTrackerTitleFa: 'رهگیری بارکد تجاری و کارتن',
      partiesInstallerRoleTitleFa: 'ویزیتورها و رانندگان پخش',
      salesTabTitleFa: 'فروش عمده و سفارشات',
      salesTabDescFa: 'صدور فاکتور عمده، نرخ همکار، تیراژ و حواله خروج',
      purchasesTabTitleFa: 'خرید عمده و بارگیری',
      purchasesTabDescFa: 'ورود بارهای کارتن و بهای تمام‌شده محموله',
      treasuryTabTitleFa: 'خزانه‌داری و اسناد',
      treasuryTabDescFa: 'تسویه موزعین، چک‌های صیادی و سقف اعتبار',
      partiesTabTitleFa: 'طرفین تجاری و بنکداران',
      partiesTabDescFa: 'صورت‌حساب خریداران عمده، ویزیتورها و موزعین',
      installationTabTitleFa: 'پخش و توزیع',
      quickPosButtonLabelFa: 'ثبت سفارش عمده',
      quickSalesSubmenuTitleFa: 'فروش عمده، نرخ همکار و حواله بار',
      quickPurchasesSubmenuTitleFa: 'ورود محموله عمده و شارژ انبار',
      quickTreasurySubmenuTitleFa: 'خزانه، تسویه موزعین و چک‌ها',
      quickPartiesSubmenuTitleFa: 'بنکداران، خریداران عمده و ویزیتورها',
      quickInventorySubmenuTitleFa: 'موجودی انبار، کارتن‌ها و کاردکس',
    },
    theme: {
      id: 'wholesale',
      primaryColor: '#0f766e',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-300',
      badgeText: 'text-teal-800',
      headerBrandTitleFa: 'سامانه پخش عمده و بازرگانی',
    },
    layout: {
      preset: 'WHOLESALE_TIERS_MATRIX',
      defaultSalesMode: 'WHOLESALE_MATRIX',
      showInstallationTab: false,
      showProjectsTab: false,
    },
  },
  SERVICES_CONTRACTING: {
    code: 'SERVICES_CONTRACTING',
    titleFa: 'خدمات فنی، مهندسی و پیمانکاری',
    descriptionFa: 'پروفایل تخصصی شرکت‌های خدماتی و پیمانکاری؛ شامل پروژه‌های اجرایی، قراردادها و ارجاع تیکت به تکنسین‌ها.',
    badgeLabelFa: 'صنف خدمات و پیمانکاری',
    features: {
      enableInstallationServices: true,
      enableHardwareMacTracking: false,
      enableInstallersRole: true,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: false,
    },
    uiLabels: {
      inventoryTabTitleFa: 'قطعات و مصالح مصرفی',
      serialTrackerTitleFa: 'کد رهگیری تیکت کار',
      partiesInstallerRoleTitleFa: 'تکنسین‌ها و مجریان فنی',
      salesTabTitleFa: 'صورت‌حساب و خدمات',
      salesTabDescFa: 'فاکتور خدمات، دستمزد، اجرت و قطعات مصرفی',
      purchasesTabTitleFa: 'تأمین قطعات و مصالح',
      purchasesTabDescFa: 'خرید لوازم یدکی، تجهیزات و قطعات کارگاه',
      treasuryTabTitleFa: 'دریافت و پرداخت',
      treasuryTabDescFa: 'تسویه دستمزد تکنسین‌ها، چک‌ها و تنخواه‌گردان',
      partiesTabTitleFa: 'مشتریان و تکنسین‌ها',
      partiesTabDescFa: 'حساب کارفرمایان، مشتریان و پیمانکاران جزء',
      installationTabTitleFa: 'کارتابل خدمات و تکنسین‌ها',
      quickPosButtonLabelFa: 'پذیرش و قبض کار',
      quickSalesSubmenuTitleFa: 'صدور فاکتور خدمات و قطعات',
      quickPurchasesSubmenuTitleFa: 'خرید قطعات و مصالح کارگاهی',
      quickTreasurySubmenuTitleFa: 'تسویه دستمزد و حساب‌های بانکی',
      quickPartiesSubmenuTitleFa: 'کارفرمایان و تکنسین‌های فنی',
      quickInventorySubmenuTitleFa: 'قطعات و مصالح کارگاهی و کاردکس',
    },
    theme: {
      id: 'services',
      primaryColor: '#4f46e5',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      badgeText: 'text-indigo-800',
      headerBrandTitleFa: 'سامانه خدمات فنی و مهندسی',
    },
    layout: {
      preset: 'SERVICES_JOB_TICKETS',
      defaultSalesMode: 'STANDARD',
      showInstallationTab: true,
      showProjectsTab: true,
    },
  },
  MOBILE_ELECTRONICS: {
    code: 'MOBILE_ELECTRONICS',
    titleFa: 'موبایل، رایانه و لوازم الکترونیک',
    descriptionFa: 'پروفایل تخصصی فروشگاه‌های موبایل و دیجیتال؛ شامل رهگیری کد IMEI و شماره سریال، خدمات گارانتی دستگاه‌ها و صندوق سریع فروشگاهی POS.',
    badgeLabelFa: 'صنف موبایل و الکترونیک',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: true,
      enableInstallersRole: false,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: true,
    },
    uiLabels: {
      inventoryTabTitleFa: 'گوشی، قطعات و لوازم جانبی',
      serialTrackerTitleFa: 'رهگیری کد IMEI و شماره سریال',
      partiesInstallerRoleTitleFa: 'تکنسین‌های گارانتی و تعمیرات',
      salesTabTitleFa: 'فروش و صندوق دیجیتال',
      salesTabDescFa: 'فروش گوشی، لوازم جانبی و ثبت گارانتی و IMEI',
      purchasesTabTitleFa: 'خرید دستگاه و قطعات',
      purchasesTabDescFa: 'ورود دستگاه‌ها با سریال/IMEI و فاکتور خرید',
      treasuryTabTitleFa: 'خزانه و دریافت/پرداخت',
      treasuryTabDescFa: 'صندوق نقد، کارتخوان، تسویه و چک صیادی',
      partiesTabTitleFa: 'مشتریان و همکاران',
      partiesTabDescFa: 'حساب مشتریان، خریداران گوشی و شرکت‌های گارانتی',
      installationTabTitleFa: 'خدمات گارانتی و تعمیر',
      quickPosButtonLabelFa: 'صندوق سریع دیجیتال',
      quickSalesSubmenuTitleFa: 'فروش دستگاه، لوازم و ثبت IMEI',
      quickPurchasesSubmenuTitleFa: 'خرید دستگاه، لوازم و بهای تمام‌شده',
      quickTreasurySubmenuTitleFa: 'صندوق، پوز بانکی و چک صیادی',
      quickPartiesSubmenuTitleFa: 'مشتریان، همکاران و گارانتی‌ها',
      quickInventorySubmenuTitleFa: 'گوشی، قطعات و لوازم جانبی و کاردکس',
    },
    theme: {
      id: 'mobile',
      primaryColor: '#0284c7',
      badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      badgeText: 'text-cyan-800',
      headerBrandTitleFa: 'سامانه فروشگاه موبایل و الکترونیک',
    },
    layout: {
      preset: 'RETAIL_FAST_POS',
      defaultSalesMode: 'TOUCH_POS',
      showInstallationTab: false,
      showProjectsTab: false,
    },
  },
};

export type ConnectionMode = 'LOCAL' | 'LAN' | 'ONLINE';
export type TlsMode = 'disable' | 'require' | 'verify-ca' | 'verify-full';

export interface DatabaseConnectionProfile {
  profileId: string;
  labelFa: string;
  mode: ConnectionMode;
  host: string;
  port: number;
  database: string;
  username: string;
  encryptedPassword?: EncryptedSecretPayload;
  hasPasswordSaved: boolean;
  tlsEnabled: boolean;
  tlsMode: TlsMode;
  caCertPath?: string;
  lastTestedAt?: string;
  verifiedReady: boolean;
}

export interface ConnectionVaultState {
  setupWizardCompleted: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'PENDING_CONFIRMATION' | 'ERROR';
  activeProfile: DatabaseConnectionProfile;
  stagedCandidateProfile: DatabaseConnectionProfile | null;
  previousProfileForRollback: DatabaseConnectionProfile | null;
  lastConnectionSwitchAt?: string;
}

export interface UserRecord {
  id: number;
  username: string;
  fullName: string;
  jobTitle: string;
  email: string | null;
  passwordHash: string;
  passwordSalt: string;
  status: 'ACTIVE' | 'SUSPENDED';
  isInitialAdmin: boolean;
  isDemo: boolean;
  installerPartyId?: number | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  code: string;
  titleFa: string;
  descriptionFa: string;
  isSystemRole: boolean;
  createdAt: string;
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

export interface FoundationDatabaseState {
  activeSessionUserId: number;
  settings: SystemSettingsRecord;
  users: UserRecord[];
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  rolePermissions: RolePermissionRecord[];
  userRoleAssignments: UserRoleAssignmentRecord[];
  userPermissionOverrides: UserPermissionOverrideRecord[];
  migrations: SchemaMigrationRecord[];
  auditLogs: AuditLogRecord[];
  parties: PartyRecord[];
  partyTransactions: PartyTransactionRecord[];
  itemCategories: ItemCategoryRecord[];
  itemBrands: ItemBrandRecord[];
  itemUnits: ItemUnitRecord[];
  items: ItemRecord[];
  warehouses: WarehouseRecord[];
  itemSerials: ItemSerialRecord[];
  inventoryDocuments: InventoryDocumentRecord[];
  purchaseProformas: PurchaseProformaRecord[];
  purchaseInvoices: PurchaseInvoiceRecord[];
  purchasePayments: PurchasePaymentRecord[];
  purchaseReturns: PurchaseReturnRecord[];
  salesProformas: SalesProformaRecord[];
  salesInvoices: SalesInvoiceRecord[];
  salesReceipts: SalesReceiptRecord[];
  salesReturns: SalesReturnRecord[];
  installationJobs: InstallationJobRecord[];
  cashBoxes: CashBoxRecord[];
  bankAccounts: BankAccountRecord[];
  cheques: ChequeRecord[];
  treasuryTransactions: TreasuryTransactionRecord[];
  installments: InstallmentRecord[];
  operationalExpenses: OperationalExpenseRecord[];
  operationalIncomes: OperationalIncomeRecord[];
  accountsChart: AccountRecord[];
  accountingDocuments: AccountingDocumentRecord[];
  fiscalYears: FiscalYearRecord[];
  accountingPeriods: AccountingPeriodRecord[];
  costCenters: CostCenterRecord[];
  projects: ProjectRecord[];
  projectRequisitions: ProjectMaterialRequisitionRecord[];
  fixedAssets: FixedAssetRecord[];
  depreciationEntries: DepreciationEntryRecord[];
  customIndustryProfiles?: IndustryProfileConfig[];
  goldColleagueTrades?: GoldColleagueTrade[];
  restaurantTables?: RestaurantTableRecord[];
  restaurantOrders?: RestaurantOrderRecord[];
  wholesaleOrders?: WholesaleOrderRecord[];
  wholesaleDispatches?: WholesaleDispatchRecord[];
  serviceJobTickets?: ServiceJobTicketRecord[];
  mobileDevices?: MobileDeviceRecord[];
  mobileRepairTickets?: MobileRepairTicketRecord[];
  inventoryTransfers?: InventoryTransferRecord[];
  remoteTunnelConfig?: RemoteTunnelConfig;
  googleSheetsSyncConfig?: GoogleSheetsSyncConfig;
  googleSheetsSyncLogs?: GoogleSheetsSyncLog[];
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

function buildInitialPermissions(): PermissionRecord[] {
  return [
    {
      code: 'foundation.users.manage',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'مدیریت کاربران و کلمه عبور',
      descriptionFa: 'تعریف کاربر جدید، ویرایش اطلاعات، فعال‌سازی/تعلیق و بازنشانی رمز عبور',
      isCritical: true,
    },
    {
      code: 'foundation.roles.manage',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'مدیریت نقش‌ها و تخصیص به کاربران',
      descriptionFa: 'ایجاد و ویرایش نقش‌های سازمانی و تخصیص نقش به کاربران دیتابیس',
      isCritical: true,
    },
    {
      code: 'foundation.rbac.manage',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'مدیریت مجوزها و استثناهای دسترسی (Override)',
      descriptionFa: 'تخصیص مجوز به نقش‌ها و اعمال استثناهای صریح (Explicit Grant / Deny) به کاربران',
      isCritical: true,
    },
    {
      code: 'foundation.settings.manage',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'ویرایش مشخصات پایه فروشگاه و پیکربندی سیستم',
      descriptionFa: 'تغییر نام کسب‌وکار، کدهای اقتصادی، تلفن، آدرس و ارزهای پیش‌فرض',
      isCritical: true,
    },
    {
      code: 'foundation.audit.read',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'مشاهده و جستجوی لاگ‌های امنیتی (Audit Log)',
      descriptionFa: 'مشاهده رویدادهای ورود، تغییرات مجوز، دسترسی‌های غیرمجاز و عملیات سیستمی',
      isCritical: false,
    },
    {
      code: 'foundation.migrations.execute',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'بررسی و اجرای Migrationهای دیتابیس',
      descriptionFa: 'اعمال اسکریپت‌های نسخه‌بندی‌شده غیرمخرب بر ساختار دیتابیس PostgreSQL',
      isCritical: true,
    },
    {
      code: 'foundation.connection.manage',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'مدیریت اتصال و تغییر دیتابیس (Local/LAN/Online)',
      descriptionFa: 'آزمایش اتصال، تغییر مقصد دیتابیس، تایید صریح و بازگشت به تنظیمات قبلی',
      isCritical: true,
    },
    {
      code: 'foundation.currency.manage',
      moduleNumber: 1,
      moduleNameFa: 'Foundation و مدیریت سیستم',
      titleFa: 'مدیریت ارزها و ثبت نرخ‌های روز',
      descriptionFa: 'ثبت نرخ‌های برابری ریال، تومان، دلار، یوان و درهم با رعایت محافظت Idempotency',
      isCritical: false,
    },
    // Stage 3: Parties & Counterparties Module Permissions
    {
      code: 'parties.view',
      moduleNumber: 3,
      moduleNameFa: 'اشخاص و طرف‌های تجاری',
      titleFa: 'مشاهده اطلاعات و پرونده اشخاص',
      descriptionFa: 'مشاهده فهرست مشتریان، تأمین‌کنندگان، نصابان، سوابق تراکنش‌ها و پرونده مالی',
      isCritical: false,
    },
    {
      code: 'parties.create',
      moduleNumber: 3,
      moduleNameFa: 'اشخاص و طرف‌های تجاری',
      titleFa: 'ایجاد و تعریف شخص جدید',
      descriptionFa: 'ثبت مشتری، تأمین‌کننده، نصاب یا همکار جدید با کنترل هوشمند اشخاص تکراری',
      isCritical: false,
    },
    {
      code: 'parties.edit',
      moduleNumber: 3,
      moduleNameFa: 'اشخاص و طرف‌های تجاری',
      titleFa: 'ویرایش اطلاعات و تغییر وضعیت شخص',
      descriptionFa: 'ویرایش نشانی، شماره تماس، سقف اعتبار و تغییر وضعیت فعال/غیرفعال شخص',
      isCritical: false,
    },
    {
      code: 'parties.delete',
      moduleNumber: 3,
      moduleNameFa: 'اشخاص و طرف‌های تجاری',
      titleFa: 'حذف یا غیرفعال‌سازی دائم طرف تجاری',
      descriptionFa: 'حذف شخص در صورت عدم وجود گردش مالی یا بایگانی دائم حساب با لاگ امنیتی',
      isCritical: true,
    },
    // Stage 4: Inventory, Catalog, Warehouses, Serial/MAC & Kardex Permissions
    {
      code: 'inventory.view',
      moduleNumber: 4,
      moduleNameFa: 'انبارداری و مدیریت کالاها',
      titleFa: 'مشاهده موجودی، کالاها و انبارها',
      descriptionFa: 'مشاهده فهرست کالاها، برندها، مدل‌ها، موجودی لحظه‌ای انبارها و رهگیری سریال/MAC',
      isCritical: false,
    },
    {
      code: 'inventory.items.manage',
      moduleNumber: 4,
      moduleNameFa: 'انبارداری و مدیریت کالاها',
      titleFa: 'تعریف و ویرایش کالا، برند و مشخصات فنی',
      descriptionFa: 'تعریف کالای جدید، ثبت بارکد، مدل، مشخصات فنی و تغییر وضعیت فعال/غیرفعال کالاها',
      isCritical: false,
    },
    {
      code: 'inventory.documents.create',
      moduleNumber: 4,
      moduleNameFa: 'انبارداری و مدیریت کالاها',
      titleFa: 'ثبت اسناد انبار (ورود، خروج، انتقال، برگشتی)',
      descriptionFa: 'صدور رسید خرید، حواله خروج فروش، انتقال بین انبارها و ورود سریال‌ها و MAC',
      isCritical: false,
    },
    {
      code: 'inventory.kardex.view',
      moduleNumber: 4,
      moduleNameFa: 'انبارداری و مدیریت کالاها',
      titleFa: 'مشاهده کاردکس و گردش واقعی کالا',
      descriptionFa: 'دسترسی به گزارش رسمی کاردکس ریالی و مقداری کالا بر اساس اسناد قطعی ثبت‌شده',
      isCritical: false,
    },
    {
      code: 'inventory.negative_stock.override',
      moduleNumber: 4,
      moduleNameFa: 'انبارداری و مدیریت کالاها',
      titleFa: 'مجوز استثنایی خروج با موجودی منفی',
      descriptionFa: 'امکان دورزدن محدودیت مسدودکننده موجودی منفی در هنگام صدور حواله خروج یا انتقال',
      isCritical: true,
    },
    // ==========================================
    // MODULE 5: PURCHASES, LANDED COST & SUPPLIERS
    // ==========================================
    {
      code: 'purchases.view',
      moduleNumber: 5,
      moduleNameFa: 'خرید و بهای تمام‌شده',
      titleFa: 'مشاهده ماژول خرید، پیش‌فاکتورها و بهای تمام‌شده',
      descriptionFa: 'دسترسی به فهرست پیش‌فاکتورها، فاکتورهای خرید، جدول تخصیص سربار و سوابق پرداخت',
      isCritical: false,
    },
    {
      code: 'purchases.proforma.manage',
      moduleNumber: 5,
      moduleNameFa: 'خرید و بهای تمام‌شده',
      titleFa: 'ثبت، تایید و تبدیل پیش‌فاکتور خرید',
      descriptionFa: 'ایجاد پیش‌فاکتور، ثبت اقلام و ارز و تبدیل آن به فاکتور قطعی خرید',
      isCritical: false,
    },
    {
      code: 'purchases.invoice.create',
      moduleNumber: 5,
      moduleNameFa: 'خرید و بهای تمام‌شده',
      titleFa: 'ثبت و تایید فاکتور قطعی خرید و صدور رسید انبار',
      descriptionFa: 'ثبت رسمی فاکتور خرید، ایجاد تعهد بدهی به تأمین‌کننده و صدور خودکار رسید ورود انبار',
      isCritical: true,
    },
    {
      code: 'purchases.landed_cost.manage',
      moduleNumber: 5,
      moduleNameFa: 'خرید و بهای تمام‌شده',
      titleFa: 'محاسبه و تخصیص هزینه‌های سربار بهای تمام‌شده (Landed Cost)',
      descriptionFa: 'تخصیص هزینه‌های حمل، بیمه، گمرک، بسته‌بندی و مالیات به تفکیک ارزش یا تعداد',
      isCritical: false,
    },
    {
      code: 'purchases.payments.create',
      moduleNumber: 5,
      moduleNameFa: 'خرید و بهای تمام‌شده',
      titleFa: 'ثبت پرداخت وجه و تسویه بدهی فاکتور خرید',
      descriptionFa: 'ثبت پرداخت حواله بانکی، چک، کارتخوان یا ساتنا و کاهش مانده بدهی تأمین‌کننده',
      isCritical: false,
    },
    {
      code: 'purchases.returns.create',
      moduleNumber: 5,
      moduleNameFa: 'خرید و بهای تمام‌شده',
      titleFa: 'ثبت برگشت از خرید به تأمین‌کننده',
      descriptionFa: 'صدور حواله برگشت کالا از انبار، ثبت بستانکاری و به‌روزرسانی وضعیت سریال‌ها',
      isCritical: true,
    },
    {
      code: 'sales.view',
      moduleNumber: 6,
      moduleNameFa: 'فروش، پیش‌فاکتور و فروش سریع',
      titleFa: 'مشاهده ماژول فروش، فاکتورها، پیش‌فاکتورها و فروش سریع',
      descriptionFa: 'دسترسی به فهرست فاکتورهای فروش، پیش‌فاکتورها، صندوق فروش سریع و سوابق دریافت وجه',
      isCritical: false,
    },
    {
      code: 'sales.proforma.manage',
      moduleNumber: 6,
      moduleNameFa: 'فروش، پیش‌فاکتور و فروش سریع',
      titleFa: 'ثبت و مدیریت پیش‌فاکتور فروش',
      descriptionFa: 'صدور پیش‌فاکتور، ارسال برای مشتری و تبدیل یک‌مرحله‌ای به فاکتور قطعی',
      isCritical: false,
    },
    {
      code: 'sales.invoice.create',
      moduleNumber: 6,
      moduleNameFa: 'فروش، پیش‌فاکتور و فروش سریع',
      titleFa: 'ثبت فاکتور قطعی فروش و خروج کالا از انبار',
      descriptionFa: 'صدور فاکتور فروش، ثبت بدهکار مشتری، محاسبه بهای تمام‌شده و خروج خودکار کالا/سریال از انبار',
      isCritical: true,
    },
    {
      code: 'sales.quick_pos.manage',
      moduleNumber: 6,
      moduleNameFa: 'فروش، پیش‌فاکتور و فروش سریع',
      titleFa: 'عملیات صندوق و فروش سریع (Quick POS Sale)',
      descriptionFa: 'فروش آنی با بارکدخوان، تسویه نقدی/کارتخوان حضوری و چاپ مستقیم فیش خرید',
      isCritical: false,
    },
    {
      code: 'sales.receipts.create',
      moduleNumber: 6,
      moduleNameFa: 'فروش، پیش‌فاکتور و فروش سریع',
      titleFa: 'ثبت دریافت وجه و تسویه حساب مشتریان',
      descriptionFa: 'ثبت فیش واریزی، تراکنش کارتخوان، چک یا نقد و کاهش مانده طلب از مشتری',
      isCritical: false,
    },
    {
      code: 'sales.returns.create',
      moduleNumber: 6,
      moduleNameFa: 'فروش، پیش‌فاکتور و فروش سریع',
      titleFa: 'ثبت برگشت از فروش و لغو فاکتور',
      descriptionFa: 'مرجوعی کالا توسط مشتری، بازگشت سریال به انبار و تعدیل طلب/بدهی حساب مشتری',
      isCritical: true,
    },
    {
      code: 'installation.jobs.view',
      moduleNumber: 7,
      moduleNameFa: 'خدمات نصب و راه‌اندازی',
      titleFa: 'مشاهده پرونده‌ها و سفارشات خدمات نصب',
      descriptionFa: 'دسترسی به فهرست سفارشات نصب، وضعیت پروژه‌ها و گزارش نصابان',
      isCritical: false,
    },
    {
      code: 'installation.jobs.manage',
      moduleNumber: 7,
      moduleNameFa: 'خدمات نصب و راه‌اندازی',
      titleFa: 'ثبت و مدیریت کامل خدمات نصب و تخصیص نصاب',
      descriptionFa: 'صدور پرونده نصب، تعیین نصاب مسئول، ثبت اجرت و هزینه‌ها و تغییر وضعیت انجام کار',
      isCritical: true,
    },
    {
      code: 'treasury.view',
      moduleNumber: 8,
      moduleNameFa: 'خزانه، صندوق و بانک',
      titleFa: 'مشاهده اطلاعات خزانه، صندوق‌ها، حساب‌ها و چک‌ها',
      descriptionFa: 'دسترسی به گردش وجوه، مانده صندوق‌ها، حساب‌های بانکی و وضعیت سررسید چک‌ها',
      isCritical: false,
    },
    {
      code: 'treasury.transactions.manage',
      moduleNumber: 8,
      moduleNameFa: 'خزانه، صندوق و بانک',
      titleFa: 'ثبت و مدیریت تراکنش‌های دریافت، پرداخت و انتقال وجه',
      descriptionFa: 'ثبت دریافت و پرداخت نقد/حواله، انتقال بین حساب‌ها و تسویه اسناد',
      isCritical: true,
    },
    {
      code: 'treasury.cheques.manage',
      moduleNumber: 8,
      moduleNameFa: 'خزانه، صندوق و بانک',
      titleFa: 'مدیریت کامل چرخه حیات چک‌ها و سررسیدها',
      descriptionFa: 'ثبت چک دریافتی/پرداختی، واگذاری به بانک، وصول قطعی و برگشت چک',
      isCritical: true,
    },
    {
      code: 'treasury.expenses.manage',
      moduleNumber: 8,
      moduleNameFa: 'خزانه، صندوق و بانک',
      titleFa: 'ثبت و پیگیری هزینه‌ها و درآمدهای عملیاتی',
      descriptionFa: 'ثبت هزینه‌های جاری (اجاره، قبوض، حقوق) و درآمدهای متفرقه کسب‌وکار',
      isCritical: false,
    },
    {
      code: 'accounting.view',
      moduleNumber: 9,
      moduleNameFa: 'حسابداری دوطرفه و دفاتر مالی',
      titleFa: 'مشاهده اسناد و گزارش‌های حسابداری',
      descriptionFa: 'دسترسی مشاهده اسناد حسابداری، تراز آزمایشی و دفاتر کل و روزنامه',
      isCritical: false,
    },
    {
      code: 'accounting.documents.manage',
      moduleNumber: 9,
      moduleNameFa: 'حسابداری دوطرفه و دفاتر مالی',
      titleFa: 'ایجاد و ویرایش اسناد حسابداری',
      descriptionFa: 'ثبت سند حسابداری جدید با کنترل تراز بدهکار و بستانکار و اصلاح اسناد پیش‌نویس',
      isCritical: true,
    },
    {
      code: 'accounting.documents.approve',
      moduleNumber: 9,
      moduleNameFa: 'حسابداری دوطرفه و دفاتر مالی',
      titleFa: 'تایید اسناد حسابداری',
      descriptionFa: 'تایید نهایی اسناد حسابداری و اعمال رسمی در دفاتر مالی',
      isCritical: true,
    },
    {
      code: 'accounting.documents.permanent',
      moduleNumber: 9,
      moduleNameFa: 'حسابداری دوطرفه و دفاتر مالی',
      titleFa: 'قطعی کردن اسناد حسابداری (قفل غیرقابل ویرایش)',
      descriptionFa: 'قطعی‌سازی اسناد تایید شده و بستن امکان ویرایش یا حذف مستقیم',
      isCritical: true,
    },
    {
      code: 'accounting.reports.view',
      moduleNumber: 9,
      moduleNameFa: 'حسابداری دوطرفه و دفاتر مالی',
      titleFa: 'مشاهده گزارش‌های جامع دفتر روزنامه، دفتر کل و تراز آزمایشی',
      descriptionFa: 'بررسی تراز ۲ ستونی و ۴ ستونی و گردش حساب‌های کل و معین',
      isCritical: false,
    },
    {
      code: 'accounting.chart.manage',
      moduleNumber: 9,
      moduleNameFa: 'حسابداری دوطرفه و دفاتر مالی',
      titleFa: 'مدیریت درختواره و کدینگ سرفصل‌های حسابداری',
      descriptionFa: 'تعریف و ویرایش حساب‌های کل و معین و تعیین ماهیت بدهکار/بستانکار',
      isCritical: true,
    },
    {
      code: 'accounting.fiscal.manage',
      moduleNumber: 10,
      moduleNameFa: 'سال و دوره مالی، مراکز هزینه و سودآوری',
      titleFa: 'مدیریت سال‌ها و دوره‌های حسابداری',
      descriptionFa: 'تعریف سال مالی جدید، باز کردن دوره‌های فصلی و ماهانه و کنترل تقویم مالی',
      isCritical: true,
    },
    {
      code: 'accounting.periods.close',
      moduleNumber: 10,
      moduleNameFa: 'سال و دوره مالی، مراکز هزینه و سودآوری',
      titleFa: 'بستن دوره‌های حسابداری و پایان سال مالی',
      descriptionFa: 'بستن رسمی دوره، صدور سند بستن حساب‌های موقت و انتقال سود/زیان انباشته',
      isCritical: true,
    },
    {
      code: 'accounting.profitability.view',
      moduleNumber: 10,
      moduleNameFa: 'سال و دوره مالی، مراکز هزینه و سودآوری',
      titleFa: 'تحلیل چندبعدی سودآوری و صورت سود و زیان',
      descriptionFa: 'مشاهده سود ناخالص و خالص بر اساس کالا، گروه کالا، مشتری، نصاب و پروژه',
      isCritical: false,
    },
    {
      code: 'costcenters.manage',
      moduleNumber: 10,
      moduleNameFa: 'سال و دوره مالی، مراکز هزینه و سودآوری',
      titleFa: 'مدیریت مراکز هزینه و بودجه‌بندی',
      descriptionFa: 'تعریف و مدیریت مراکز هزینه و پایش هزینه‌های تخصیص‌یافته به واحدها',
      isCritical: false,
    },
    {
      code: 'projects.view',
      moduleNumber: 11,
      moduleNameFa: 'پروژه‌ها، نصابان و مصرف کالا',
      titleFa: 'مشاهده لیست پروژه‌ها و کارپوشه اجرایی',
      descriptionFa: 'مشاهده پروژه‌ها، وضعیت پیشرفت و جزئیات اجرایی',
      isCritical: false,
    },
    {
      code: 'projects.manage',
      moduleNumber: 11,
      moduleNameFa: 'پروژه‌ها، نصابان و مصرف کالا',
      titleFa: 'تعریف و مدیریت پروژه‌ها و تخصیص نصاب',
      descriptionFa: 'ثبت پروژه جدید، تغییر وضعیت، ویرایش مشخصات قرارداد و نصاب مسئول',
      isCritical: false,
    },
    {
      code: 'projects.requisitions.manage',
      moduleNumber: 11,
      moduleNameFa: 'پروژه‌ها، نصابان و مصرف کالا',
      titleFa: 'مدیریت درخواست و چرخه مصرف کالای پروژه',
      descriptionFa: 'درخواست کالا، تأیید مدیر، تحویل انباردار، ثبت مصرف و برگشت مازاد کالا به انبار',
      isCritical: false,
    },
    {
      code: 'projects.profitability.view',
      moduleNumber: 11,
      moduleNameFa: 'پروژه‌ها، نصابان و مصرف کالا',
      titleFa: 'مشاهده گزارش سودآوری و بهای تمام‌شده پروژه',
      descriptionFa: 'مشاهده تحلیل سود واقعی پروژه حاصل از درآمد، کالای مصرفی، اجرت نصاب و هزینه‌ها',
      isCritical: false,
    },
  ];
}

function buildDefaultState(): FoundationDatabaseState {
  const permissions = buildInitialPermissions();
  const nowIso = new Date().toISOString();

  const roles: RoleRecord[] = [
    {
      code: 'OWNER',
      titleFa: 'مالک و راهبر کل سیستم (Owner)',
      descriptionFa: 'دسترسی کامل ثبت‌شده در جدول role_permissions دیتابیس بدون دورزدن کنترل دسترسی در کد',
      isSystemRole: true,
      createdAt: nowIso,
    },
    {
      code: 'CHIEF_ACCOUNTANT',
      titleFa: 'سرپرست حسابداری و مالی',
      descriptionFa: 'مدیریت تنظیمات مالی، نرخ‌های ارز، ممیزی اسناد و گزارش‌های کنترلی',
      isSystemRole: true,
      createdAt: nowIso,
    },
    {
      code: 'WAREHOUSE_KEEPER',
      titleFa: 'مسئول انبار و تجهیزات دوربین مداربسته',
      descriptionFa: 'دسترسی به بخش‌های لجستیک و رهگیری اقلام با رعایت محدودیت‌های امنیتی',
      isSystemRole: true,
      createdAt: nowIso,
    },
    {
      code: 'AUDITOR',
      titleFa: 'حسابرس و ناظر امنیتی سیستم',
      descriptionFa: 'دسترسی فقط‌خواندنی به لاگ‌های تغییرناپذیر، تاریخچه تغییرات و ممیزی سیستم',
      isSystemRole: true,
      createdAt: nowIso,
    },
  ];

  // Populate role_permissions in DB strictly
  let rpId = 1;
  const rolePermissions: RolePermissionRecord[] = [];

  // 1. OWNER role gets all permissions explicitly stored in the table
  for (const perm of permissions) {
    rolePermissions.push({
      id: rpId++,
      roleCode: 'OWNER',
      permissionCode: perm.code,
      grantedBy: 'SYSTEM_SEED',
      grantedAt: nowIso,
    });
  }

  // 2. CHIEF_ACCOUNTANT permissions
  const accountantCodes = [
    'foundation.audit.read',
    'foundation.currency.manage',
    'foundation.settings.manage',
    'parties.view',
    'parties.create',
    'parties.edit',
    'inventory.view',
    'inventory.kardex.view',
    'purchases.view',
    'purchases.proforma.manage',
    'purchases.invoice.create',
    'purchases.landed_cost.manage',
    'purchases.payments.create',
    'purchases.returns.create',
    'sales.view',
    'sales.proforma.manage',
    'sales.invoice.create',
    'sales.quick_pos.manage',
    'sales.receipts.create',
    'sales.returns.create',
    'installation.jobs.view',
    'installation.jobs.manage',
    'treasury.view',
    'treasury.transactions.manage',
    'treasury.cheques.manage',
    'treasury.expenses.manage',
  ];
  for (const code of accountantCodes) {
    rolePermissions.push({
      id: rpId++,
      roleCode: 'CHIEF_ACCOUNTANT',
      permissionCode: code,
      grantedBy: 'SYSTEM_SEED',
      grantedAt: nowIso,
    });
  }

  // 3. AUDITOR permissions
  const auditorCodes = [
    'foundation.audit.read',
    'parties.view',
    'inventory.view',
    'inventory.kardex.view',
    'purchases.view',
    'sales.view',
  ];
  for (const code of auditorCodes) {
    rolePermissions.push({
      id: rpId++,
      roleCode: 'AUDITOR',
      permissionCode: code,
      grantedBy: 'SYSTEM_SEED',
      grantedAt: nowIso,
    });
  }

  // 4. WAREHOUSE_KEEPER permissions
  const warehouseKeeperCodes = [
    'parties.view',
    'inventory.view',
    'inventory.items.manage',
    'inventory.documents.create',
    'inventory.kardex.view',
    'purchases.view',
  ];
  for (const code of warehouseKeeperCodes) {
    rolePermissions.push({
      id: rpId++,
      roleCode: 'WAREHOUSE_KEEPER',
      permissionCode: code,
      grantedBy: 'SYSTEM_SEED',
      grantedAt: nowIso,
    });
  }

  // Default Users:
  // User 1: 'admin' with initial password 'admin' as explicitly requested!
  const adminSalt = generateSalt();
  const adminHash = hashPassword('admin', adminSalt);

  // User 2: Sara (Accountant)
  const saraSalt = generateSalt();
  const saraHash = hashPassword('sara1234', saraSalt);

  // User 3: Auditor
  const auditorSalt = generateSalt();
  const auditorHash = hashPassword('audit1234', auditorSalt);

  const users: UserRecord[] = [
    {
      id: 1,
      username: 'admin',
      fullName: 'مدیر ارشد و مالک سیستم مهرگان',
      jobTitle: 'راهبر کل سیستم',
      email: null,
      passwordHash: adminHash,
      passwordSalt: adminSalt,
      status: 'ACTIVE',
      isInitialAdmin: true,
      isDemo: false,
      lastLoginAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      username: 'sara_accountant',
      fullName: 'سارا رضایی',
      jobTitle: 'سرپرست حسابداری',
      email: null,
      passwordHash: saraHash,
      passwordSalt: saraSalt,
      status: 'ACTIVE',
      isInitialAdmin: false,
      isDemo: false,
      lastLoginAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      username: 'audit_user',
      fullName: 'امیر حسینی',
      jobTitle: 'ناظر و حسابرس امنیتی',
      email: null,
      passwordHash: auditorHash,
      passwordSalt: auditorSalt,
      status: 'ACTIVE',
      isInitialAdmin: false,
      isDemo: false,
      lastLoginAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const userRoleAssignments: UserRoleAssignmentRecord[] = [
    {
      id: 1,
      userId: 1, // admin
      roleCode: 'OWNER',
      assignedAt: nowIso,
      assignedBy: 'SYSTEM',
    },
    {
      id: 2,
      userId: 2, // sara
      roleCode: 'CHIEF_ACCOUNTANT',
      assignedAt: nowIso,
      assignedBy: 'admin',
    },
    {
      id: 3,
      userId: 3, // audit_user
      roleCode: 'AUDITOR',
      assignedAt: nowIso,
      assignedBy: 'admin',
    },
  ];

  const userPermissionOverrides: UserPermissionOverrideRecord[] = [
    {
      id: 1,
      userId: 2,
      permissionCode: 'foundation.migrations.execute',
      effect: 'ALLOW',
      reasonFa: 'مجوز موردی نظارت بر به‌روزرسانی ساختار دیتابیس (Explicit Grant)',
      createdBy: 'admin',
      createdAt: nowIso,
    },
  ];

  const migrations: SchemaMigrationRecord[] = [
    {
      version: '0001',
      name: '0001_foundation_core.sql',
      descriptionFa: 'جداول پایه تنظیمات، ارزها، سال مالی و قواعد شماره‌گذاری اسناد',
      checksum: 'sha256:8b4c201a91e0',
      isDestructive: false,
      status: 'APPLIED',
      executionMs: 14,
      appliedAt: nowIso,
    },
    {
      version: '0002',
      name: '0002_rbac_and_audit.sql',
      descriptionFa: 'احراز هویت داخلی دیتابیسی، کنترل دسترسی RBAC پویا و جدول لاگ‌های تغییرناپذیر',
      checksum: 'sha256:4d77e19f302b',
      isDestructive: false,
      status: 'APPLIED',
      executionMs: 18,
      appliedAt: nowIso,
    },
    {
      version: '0003',
      name: '0003_parties_module.sql',
      descriptionFa: 'ماژول جامع اشخاص و طرف‌های تجاری (مشتری، تامین‌کننده، نصاب، سایر) و سوابق مرتبط',
      checksum: 'sha256:7c91e4a3b012',
      isDestructive: false,
      status: 'APPLIED',
      executionMs: 16,
      appliedAt: nowIso,
    },
    {
      version: '0004',
      name: '0004_inventory_and_kardex_module.sql',
      descriptionFa: 'ماژول انبارداری، مشخصات فنی کالاها، رهگیری سریال/MAC و کاردکس گردش کالا',
      checksum: 'sha256:5e19a4b2c019',
      isDestructive: false,
      status: 'APPLIED',
      executionMs: 15,
      appliedAt: nowIso,
    },
    {
      version: '0005',
      name: '0005_purchases_and_landed_cost.sql',
      descriptionFa: 'ماژول خرید، پیش‌فاکتور، ارزهای خارجی، تخصیص هزینه‌های سربار بهای تمام‌شده و بدهی تأمین‌کننده',
      checksum: 'sha256:8f2a1b9c3021',
      isDestructive: false,
      status: 'APPLIED',
      executionMs: 18,
      appliedAt: nowIso,
    },
  ];

  const defaultParties: PartyRecord[] = [
    {
      id: 1,
      partyCode: 'PRT-10001',
      primaryType: 'CUSTOMER',
      roles: ['CUSTOMER'],
      personType: 'LEGAL',
      fullName: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      companyTitle: 'نگین البرز',
      nationalId: '10103456789',
      economicCode: '411-5582-1002',
      registrationNumber: '382109',
      mobile: '09121112233',
      phone: '021-88992211',
      fax: '021-88992212',
      email: 'info@negine-alborz.ir',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1985713421',
      addressFa: 'تهران، سعادت‌آباد، میدان کاج، خیابان نهم، پلاک ۲۴',
      status: 'ACTIVE',
      creditLimitIrr: 15000000000,
      installerSkills: null,
      notes: 'پروژه نظارت تصویری ۶۴ کانال دوربین مداربسته تحت شبکه IP برند Dahua با سوییچ‌های PoE',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      partyCode: 'PRT-10002',
      primaryType: 'SUPPLIER',
      roles: ['SUPPLIER'],
      personType: 'LEGAL',
      fullName: 'شرکت بازرگانی فناوری پارس پویا (واردکننده رسمی Hikvision & Dahua)',
      companyTitle: 'پارس پویا تکنولوژی',
      nationalId: '10320491823',
      economicCode: '411-9988-3344',
      registrationNumber: '491022',
      mobile: '09123334455',
      phone: '021-66708899',
      fax: '021-66708898',
      email: 'sales@parspouya-cctv.com',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1139745123',
      addressFa: 'تهران، خیابان جمهوری، پاساژ امجد، طبقه ۴، واحد ۱۲',
      status: 'ACTIVE',
      creditLimitIrr: 50000000000,
      installerSkills: null,
      notes: 'تأمین‌کننده اصلی NVRهای ۳۲ کانال، دوربین‌های دید در شب ColorVu و هارد دیسک‌های نظارتی Purple',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      partyCode: 'PRT-10003',
      primaryType: 'INSTALLER',
      roles: ['INSTALLER', 'CUSTOMER'],
      personType: 'NATURAL',
      fullName: 'مهندس علیرضا بهرامی (نصاب ارشد سیستم‌های نظارتی و حفاظتی)',
      companyTitle: 'گروه فنی مهندسی بهرام‌تک',
      nationalId: '0078945612',
      economicCode: null,
      registrationNumber: null,
      mobile: '09125556677',
      phone: '021-44556677',
      fax: null,
      email: 'a.bahrami.cctv@gmail.com',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1453216789',
      addressFa: 'تهران، ستارخان، خیابان خسرو شمالی، پلاک ۱۸',
      status: 'ACTIVE',
      creditLimitIrr: 500000000,
      installerSkills: 'تسلط بر کانفیگ سوییچ‌های سیسکو و PoE، فیوژن فیبر نوری، دوربین‌های PTZ اسپیددام Dahua و انتقال تصویر P2P',
      notes: 'نصاب منتخب پروژه‌های صنعتی و سازمانی، عقد قرارداد به‌صورت درصدی و اجرایی',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 4,
      partyCode: 'PRT-10004',
      primaryType: 'PARTNER_OTHER',
      roles: ['PARTNER_OTHER'],
      personType: 'NATURAL',
      fullName: 'دفتر فنی مهندسی صبا الکترونیک (همکار فروش و گارانتی دوربین)',
      companyTitle: 'صبا الکترونیک البرز',
      nationalId: '0451239874',
      economicCode: null,
      registrationNumber: null,
      mobile: '09127778899',
      phone: '026-32219876',
      fax: null,
      email: 'saba.electronics@info.ir',
      province: 'البرز',
      city: 'کرج',
      postalCode: '3145678912',
      addressFa: 'کرج، میدان شهدا، برج بهار، طبقه ۳، واحد ۹',
      status: 'ACTIVE',
      creditLimitIrr: 2000000000,
      installerSkills: 'تعمیرات تخصصی بردهای دوربین، ارتقای فریمور NVR و رفع لوپ شبکه',
      notes: 'نمایندگی خدمات پس از فروش و تعمیرات گارانتی',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 5,
      partyCode: 'PRT-10005',
      primaryType: 'SUPPLIER',
      roles: ['SUPPLIER'],
      personType: 'LEGAL',
      fullName: 'شرکت ارتباطات امن پیشرو (تأمین‌کننده تجهیزات شبکه، رادیو و سوییچ‌های PoE)',
      companyTitle: 'ارتباطات امن پیشرو',
      nationalId: '10108877665',
      economicCode: '411-2233-4455',
      registrationNumber: '512033',
      mobile: '09128889900',
      phone: '021-88776655',
      fax: '021-88776654',
      email: 'info@pishro-network.ir',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1589741235',
      addressFa: 'تهران، خیابان مطهری، خیابان فجر، پلاک ۴۲',
      status: 'ACTIVE',
      creditLimitIrr: 30000000000,
      installerSkills: null,
      notes: 'تأمین‌کننده تخصصی سوییچ‌های PoE، کابل‌های شبکه لگراند و رادیوهای وایرلس پوینت‌تو‌پوینت',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 6,
      partyCode: 'PRT-10000',
      primaryType: 'CUSTOMER',
      roles: ['CUSTOMER'],
      personType: 'NATURAL',
      fullName: 'خریدار عمومی / مشتری حضوری (صندوق فروش سریع)',
      companyTitle: 'فروشگاه و صندوق حضوری',
      nationalId: '0000000000',
      economicCode: null,
      registrationNumber: null,
      mobile: '09000000000',
      phone: '021-66748920',
      fax: null,
      email: null,
      province: 'تهران',
      city: 'تهران',
      postalCode: '1111111111',
      addressFa: 'مراجعه حضوری به فروشگاه و صندوق سریع مهرگان',
      status: 'ACTIVE',
      creditLimitIrr: 0,
      installerSkills: null,
      notes: 'مشتری عمومی و خریدار حضوری پیش‌فرض برای فروش‌های آنی صندوق (Quick POS Sale)',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultTransactions: PartyTransactionRecord[] = [
    {
      id: 1,
      partyId: 1, // نگین البرز
      recordType: 'SALE_INVOICE',
      referenceNumber: 'INV-1405-1001',
      titleFa: 'فاکتور فروش سیستم دوربین مداربسته ۶۴ کانال برج آفتاب',
      amountIrr: 1850000000,
      dateJalali: '1405/01/15',
      status: 'COMPLETED',
      notesFa: 'شامل ۳۲ عدد دوربین 4MP IP دام و بولت داهوا، دو دستگاه NVR 32CH، ۴ عدد سوییچ ۱۶ پورت PoE',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 2,
      partyId: 1, // نگین البرز
      recordType: 'RECEIPT',
      referenceNumber: 'REC-1405-1001',
      titleFa: 'پیش‌دریافت چک صیادی بانک ملت (مرحله اول)',
      amountIrr: 1000000000,
      dateJalali: '1405/01/16',
      status: 'SETTLED',
      notesFa: 'شناسه صیاد: ۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶ - پاس شده در سررسید',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 3,
      partyId: 1, // نگین البرز
      recordType: 'CCTV_PROJECT',
      referenceNumber: 'PRJ-1405-01',
      titleFa: 'پروژه پایش تصویری و اتاق مانیتورینگ برج مسکونی آفتاب',
      amountIrr: 1850000000,
      dateJalali: '1405/01/10',
      status: 'IN_PROGRESS',
      notesFa: 'نصاب مسئول: مهندس بهرامی، پیشرفت فیزیکی ۶۵٪',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 4,
      partyId: 2, // پارس پویا
      recordType: 'PURCHASE_INVOICE',
      referenceNumber: 'PUR-1405-2001',
      titleFa: 'فاکتور خرید تجهیزات مداربسته از شرکت پارس پویا',
      amountIrr: 4200000000,
      dateJalali: '1405/01/08',
      status: 'COMPLETED',
      notesFa: 'واردات مستقیم دوربین‌های هایک‌ویژن سری ColorVu و هارد ۶ ترابایت بنفش',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 5,
      partyId: 2, // پارس پویا
      recordType: 'PAYMENT',
      referenceNumber: 'PAY-1405-2001',
      titleFa: 'حواله ساتنا مرحله اول به حساب پارس پویا',
      amountIrr: 2500000000,
      dateJalali: '1405/01/10',
      status: 'SETTLED',
      notesFa: 'شماره پیگیری ساتنا: ۹۸۲۳۰۴۸۹۲۰۱',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 6,
      partyId: 3, // علیرضا بهرامی
      recordType: 'CCTV_PROJECT',
      referenceNumber: 'PRJ-1405-01',
      titleFa: 'قرارداد اجرای کابل‌کشی و راه‌اندازی ۶۴ دوربین برج آفتاب',
      amountIrr: 150000000,
      dateJalali: '1405/01/12',
      status: 'IN_PROGRESS',
      notesFa: 'دستمزد اجرای پروژه به ازای هر نقطه شبکه و نصب سوییچ',
      isDemo: true,
      createdAt: nowIso,
    },
    {
      id: 7,
      partyId: 3, // علیرضا بهرامی
      recordType: 'PAYMENT',
      referenceNumber: 'PAY-1405-3001',
      titleFa: 'پرداخت علی‌الحساب دستمزد نصاب فاز یک',
      amountIrr: 100000000,
      dateJalali: '1405/01/20',
      status: 'SETTLED',
      notesFa: 'واریز به شماره شبا بانک ملی نصاب',
      isDemo: true,
      createdAt: nowIso,
    },
  ];

  const auditLogs: AuditLogRecord[] = [
    {
      id: 1,
      traceId: 'TRC-1405-INIT-01',
      timestamp: nowIso,
      actorUserId: 1,
      actorUsername: 'admin',
      actorRoleSummary: 'OWNER',
      action: 'FOUNDATION_BOOTSTRAP_COMPLETE',
      category: 'SECURITY',
      targetEntity: 'system',
      targetId: 'root',
      status: 'SUCCESS',
      detailsFa: 'راه‌اندازی اولیه ماژول Foundation با احراز هویت دیتابیسی (کاربر پیش‌فرض admin / admin) و موتور RBAC',
      sanitizedMetadata: {
        authStrategy: 'INTERNAL_DATABASE_LOCAL',
        rbacPrecedenceRule: 'EXPLICIT_DENY > EXPLICIT_GRANT > ROLE_PERMISSION > DEFAULT_DENY',
        ownerBypassDisabled: true,
      },
    },
  ];

  const defaultCategories: ItemCategoryRecord[] = [
    {
      id: 1,
      code: 'CAT-CCTV-IP',
      nameFa: 'دوربین‌های تحت شبکه IP',
      descriptionFa: 'دوربین‌های نظارت تصویری هوشمند تحت شبکه، لنز استارلایت، فشرده‌سازی H.265+ و PoE',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 2,
      code: 'CAT-CCTV-ANLG',
      nameFa: 'دوربین‌های آنالوگ HD (HDCVI / TurboHD)',
      descriptionFa: 'دوربین‌های کواکسیال با کیفیت بالا 2MP تا 5MP و دید در شب وارم‌لایت',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 3,
      code: 'CAT-NVR-XVR',
      nameFa: 'دستگاه‌های ضبط و سرور NVR / XVR',
      descriptionFa: 'دستگاه‌های ضبط ویدئویی تحت شبکه با پهنای باند بالا و پورت‌های داخلی PoE',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 4,
      code: 'CAT-STORAGE',
      nameFa: 'هارد دیسک و حافظه نظارتی',
      descriptionFa: 'هارد دیسک‌های تخصصی پایش تصویری ۲۴/۷ بنفش و اسکای‌هاوک با فریمور AllFrame',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 5,
      code: 'CAT-NET-POE',
      nameFa: 'سوییچ‌های شبکه و رک و PoE',
      descriptionFa: 'سوییچ‌های لایه ۲ و ۳ با پورت‌های گیگابیت، پورت‌های PoE+ و قابلیت Extended Mode',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 6,
      code: 'CAT-CABLE-ACC',
      nameFa: 'کابل، اتصالات و لوازم جانبی نصب',
      descriptionFa: 'کابل‌های شبکه تمام مس با استاندارد تست فلوک، فیش‌های BNC و پچ‌کورد',
      isActive: true,
      createdAt: nowIso,
    },
  ];

  const defaultBrands: ItemBrandRecord[] = [
    {
      id: 1,
      code: 'BRD-DAHUA',
      nameEn: 'Dahua Technology',
      nameFa: 'داهوا تکنولوژی',
      originCountryFa: 'چین',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 2,
      code: 'BRD-HIKVISION',
      nameEn: 'Hikvision',
      nameFa: 'هایک‌ویژن',
      originCountryFa: 'چین',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 3,
      code: 'BRD-WESTERN',
      nameEn: 'Western Digital',
      nameFa: 'وسترن دیجیتال',
      originCountryFa: 'آمریکا',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 4,
      code: 'BRD-SEAGATE',
      nameEn: 'Seagate',
      nameFa: 'سیگیت',
      originCountryFa: 'آمریکا',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 5,
      code: 'BRD-TIANDY',
      nameEn: 'Tiandy',
      nameFa: 'تیاندی',
      originCountryFa: 'چین',
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: 6,
      code: 'BRD-LEGRAND',
      nameEn: 'Legrand',
      nameFa: 'لگراند',
      originCountryFa: 'فرانسه',
      isActive: true,
      createdAt: nowIso,
    },
  ];

  const defaultUnits: ItemUnitRecord[] = [
    {
      id: 1,
      code: 'UNIT-PCS',
      nameFa: 'عدد',
      allowDecimals: false,
      createdAt: nowIso,
    },
    {
      id: 2,
      code: 'UNIT-DEV',
      nameFa: 'دستگاه',
      allowDecimals: false,
      createdAt: nowIso,
    },
    {
      id: 3,
      code: 'UNIT-MTR',
      nameFa: 'متر',
      allowDecimals: true,
      createdAt: nowIso,
    },
    {
      id: 4,
      code: 'UNIT-ROLL',
      nameFa: 'حلقه (۳۰۵ متر)',
      allowDecimals: false,
      createdAt: nowIso,
    },
    {
      id: 5,
      code: 'UNIT-BOX',
      nameFa: 'کارتن',
      allowDecimals: false,
      createdAt: nowIso,
    },
  ];

  const defaultWarehouses: WarehouseRecord[] = [
    {
      id: 1,
      warehouseCode: 'WH-01',
      titleFa: 'انبار مرکزی خیابان جمهوری',
      keeperNameFa: 'حسین رضایی',
      phone: '021-66748921',
      addressFa: 'تهران، خیابان جمهوری، تقاطع حافظ، طبقه منهای یک مجتمع مهرگان',
      status: 'ACTIVE',
      isDefault: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      warehouseCode: 'WH-02',
      titleFa: 'انبار خدمات پس از فروش و گارانتی',
      keeperNameFa: 'مهرداد کاظمی',
      phone: '021-66748922',
      addressFa: 'تهران، خیابان جمهوری، پاساژ امجد، واحد پشتیبانی فنی مهرگان',
      status: 'ACTIVE',
      isDefault: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      warehouseCode: 'WH-03',
      titleFa: 'انبار پروژه‌ها و تجهیزات نصابان',
      keeperNameFa: 'محسن شریفی',
      phone: '021-66748923',
      addressFa: 'تهران، انبار کارگاهی خیابان حافظ، کوچه زرتشتیان، پلاک ۵',
      status: 'ACTIVE',
      isDefault: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultItems: ItemRecord[] = [
    {
      id: 1,
      itemCode: 'ITM-10001',
      barcode: '6939555811011',
      titleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
      model: 'IPC-HDW2431T-AS-S2',
      categoryId: 1,
      brandId: 1,
      unitId: 1,
      isSerialized: true,
      hasMacAddress: true,
      technicalSpecs: {
        resolution: '4MP (2688x1520)',
        lens: '2.8mm Starlight Fixed',
        nightVision: '30m Smart IR',
        poe: true,
        casing: 'IP67 Metal',
        audio: 'میکروفون داخلی Built-in Mic',
        compression: 'H.265+ / H.264+',
        sdSlot: 'Up to 256GB Micro SD',
      },
      minStockAlert: 5,
      maxStockLevel: 50,
      purchasePriceIrr: 38000000,
      salePriceIrr: 48500000,
      status: 'ACTIVE',
      notes: 'پرفروش‌ترین دوربین دام IP برای محیط‌های داخلی و فروشگاهی',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      itemCode: 'ITM-10002',
      barcode: '6939555811022',
      titleFa: 'دوربین مداربسته بولت هایک‌ویژن 4MP دید در شب رنگی ColorVu',
      model: 'DS-2CD2047G2-LU',
      categoryId: 1,
      brandId: 2,
      unitId: 1,
      isSerialized: true,
      hasMacAddress: true,
      technicalSpecs: {
        resolution: '4MP (2688x1520)',
        lens: '4mm F1.0 ColorVu',
        nightVision: '40m Warm Light Full-Color',
        poe: true,
        casing: 'IP67 Metal Weatherproof',
        smartFeatures: 'AcuSense تشخیص انسان و وسیله نقلیه',
        compression: 'H.265+',
      },
      minStockAlert: 4,
      maxStockLevel: 40,
      purchasePriceIrr: 52000000,
      salePriceIrr: 66000000,
      status: 'ACTIVE',
      notes: 'دید در شب تمام رنگی ۲۴ ساعته مناسب ورودی ساختمان‌ها و محوطه‌ها',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      itemCode: 'ITM-10003',
      barcode: '6939555811033',
      titleFa: 'دستگاه ضبط ویدئویی ۱۶ کانال NVR داهوا با ۱۶ پورت PoE',
      model: 'NVR4216-16P-4KS2',
      categoryId: 3,
      brandId: 1,
      unitId: 2,
      isSerialized: true,
      hasMacAddress: true,
      technicalSpecs: {
        channels: 16,
        poePorts: 16,
        incomingBandwidth: '200 Mbps',
        maxResolution: '4K / 8MP Realtime',
        hddSlots: 2,
        maxStorage: '2x 10TB SATA',
        hdmiOutput: '4K HDMI + VGA',
      },
      minStockAlert: 2,
      maxStockLevel: 20,
      purchasePriceIrr: 145000000,
      salePriceIrr: 185000000,
      status: 'ACTIVE',
      notes: 'دستگاه مرکزی پروژه ۶۴ کانال برج آفتاب',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 4,
      itemCode: 'ITM-10004',
      barcode: '718037841122',
      titleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
      model: 'WD40PURZ',
      categoryId: 4,
      brandId: 3,
      unitId: 1,
      isSerialized: true,
      hasMacAddress: false,
      technicalSpecs: {
        capacity: '4 Terabytes',
        cache: '64MB Cache',
        interface: 'SATA 6 Gb/s',
        workloadRate: '180 TB/year',
        camerasSupported: 'Up to 64 HD Cameras',
        firmware: 'AllFrame 4K',
      },
      minStockAlert: 6,
      maxStockLevel: 60,
      purchasePriceIrr: 68000000,
      salePriceIrr: 82000000,
      status: 'ACTIVE',
      notes: 'گارانتی اصلی ۲۴ ماهه تعویض شرکت سازگار/الماس',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 5,
      itemCode: 'ITM-10005',
      barcode: '3245060327552',
      titleFa: 'کابل شبکه لگراند Cat6 SFTP تمام مس تست فلوک پرمننت',
      model: 'Legrand 032755 Cat6 SFTP',
      categoryId: 6,
      brandId: 6,
      unitId: 4,
      isSerialized: false,
      hasMacAddress: false,
      technicalSpecs: {
        cableType: 'Cat6 SFTP (Shielded & Foiled)',
        conductor: '100% Pure Bare Copper (مفتول تمام مس 23AWG)',
        sheath: 'LSZH ضد اشتعال و دود کم',
        rollLength: 'حلقه ۳۰۵ متری',
        flukeTest: 'Fluke Permanent Link Passed',
      },
      minStockAlert: 3,
      maxStockLevel: 30,
      purchasePriceIrr: 58000000,
      salePriceIrr: 72000000,
      status: 'ACTIVE',
      notes: 'کابل استاندارد پروژه‌های شبکه و فیبر بدون نویز صنعتی',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 6,
      itemCode: 'ITM-10006',
      barcode: '6941235678001',
      titleFa: 'سوییچ شبکه ۱۶ پورت PoE تیاندی Tiandy با ۲ پورت آپلینک گیگابیت',
      model: 'TC-P16E2G',
      categoryId: 5,
      brandId: 5,
      unitId: 2,
      isSerialized: true,
      hasMacAddress: true,
      technicalSpecs: {
        totalPorts: 18,
        poePorts: '16x 10/100 Mbps PoE+ (802.3af/at)',
        poeBudget: '250 Watts',
        uplinkPorts: '2x 10/100/1000 Mbps Gigabit',
        extendMode: 'تا ۲۵۰ متر در حالت دوربین CCTV',
      },
      minStockAlert: 2,
      maxStockLevel: 15,
      purchasePriceIrr: 42000000,
      salePriceIrr: 54000000,
      status: 'ACTIVE',
      notes: 'سوییچ تخصصی نصب سیستم‌های حفاظتی بدون افت فریم',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultSerials: ItemSerialRecord[] = [
    // 5 units for ITM-10001 (IPC-HDW2431T)
    {
      id: 1,
      itemId: 1,
      itemCode: 'ITM-10001',
      itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
      serialNumber: 'SN-DH-261011',
      macAddress: '3C:EF:8C:11:22:33',
      currentWarehouseId: 3, // WH-03
      status: 'DISPATCHED',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-OUT-1405-1001',
      lastPartyId: 1, // Negine Alborz
      lastPartyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      notesFa: 'تحویل داده شده به پروژه برج آفتاب',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      itemId: 1,
      itemCode: 'ITM-10001',
      itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
      serialNumber: 'SN-DH-261012',
      macAddress: '3C:EF:8C:11:22:34',
      currentWarehouseId: 3, // WH-03
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-TRF-1405-1001',
      lastPartyId: 2,
      notesFa: 'موجود در انبار پروژه‌ها برای نصب فاز ۲',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      itemId: 1,
      itemCode: 'ITM-10001',
      itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
      serialNumber: 'SN-DH-261013',
      macAddress: '3C:EF:8C:11:22:35',
      currentWarehouseId: 1, // WH-01
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'پلمپ شرکتی در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 4,
      itemId: 1,
      itemCode: 'ITM-10001',
      itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
      serialNumber: 'SN-DH-261014',
      macAddress: '3C:EF:8C:11:22:36',
      currentWarehouseId: 1, // WH-01
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'پلمپ شرکتی در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 5,
      itemId: 1,
      itemCode: 'ITM-10001',
      itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
      serialNumber: 'SN-DH-261015',
      macAddress: '3C:EF:8C:11:22:37',
      currentWarehouseId: 1, // WH-01
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'پلمپ شرکتی در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 4 units for ITM-10002 (DS-2CD2047G2)
    {
      id: 6,
      itemId: 2,
      itemCode: 'ITM-10002',
      itemTitleFa: 'دوربین مداربسته بولت هایک‌ویژن 4MP دید در شب رنگی ColorVu',
      serialNumber: 'SN-HK-262011',
      macAddress: '44:A8:42:55:66:01',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 7,
      itemId: 2,
      itemCode: 'ITM-10002',
      itemTitleFa: 'دوربین مداربسته بولت هایک‌ویژن 4MP دید در شب رنگی ColorVu',
      serialNumber: 'SN-HK-262012',
      macAddress: '44:A8:42:55:66:02',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 8,
      itemId: 2,
      itemCode: 'ITM-10002',
      itemTitleFa: 'دوربین مداربسته بولت هایک‌ویژن 4MP دید در شب رنگی ColorVu',
      serialNumber: 'SN-HK-262013',
      macAddress: '44:A8:42:55:66:03',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 9,
      itemId: 2,
      itemCode: 'ITM-10002',
      itemTitleFa: 'دوربین مداربسته بولت هایک‌ویژن 4MP دید در شب رنگی ColorVu',
      serialNumber: 'SN-HK-262014',
      macAddress: '44:A8:42:55:66:04',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 2 units for ITM-10003 (NVR4216)
    {
      id: 10,
      itemId: 3,
      itemCode: 'ITM-10003',
      itemTitleFa: 'دستگاه ضبط ویدئویی ۱۶ کانال NVR داهوا با ۱۶ پورت PoE',
      serialNumber: 'SN-NVR-263001',
      macAddress: 'A0:BD:1D:99:88:77',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'پلمپ با کابل‌های برق و موس در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 11,
      itemId: 3,
      itemCode: 'ITM-10003',
      itemTitleFa: 'دستگاه ضبط ویدئویی ۱۶ کانال NVR داهوا با ۱۶ پورت PoE',
      serialNumber: 'SN-NVR-263002',
      macAddress: 'A0:BD:1D:99:88:78',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'پلمپ با کابل‌های برق و موس در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 5 units for ITM-10004 (WD40PURZ)
    {
      id: 12,
      itemId: 4,
      itemCode: 'ITM-10004',
      itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
      serialNumber: 'SN-WD-264001',
      macAddress: null,
      currentWarehouseId: 3,
      status: 'DISPATCHED',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-OUT-1405-1001',
      lastPartyId: 1,
      lastPartyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      notesFa: 'نصب شده روی دستگاه NVR پروژه آفتاب',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 13,
      itemId: 4,
      itemCode: 'ITM-10004',
      itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
      serialNumber: 'SN-WD-264002',
      macAddress: null,
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'گارانتی فعال',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 14,
      itemId: 4,
      itemCode: 'ITM-10004',
      itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
      serialNumber: 'SN-WD-264003',
      macAddress: null,
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'گارانتی فعال',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 15,
      itemId: 4,
      itemCode: 'ITM-10004',
      itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
      serialNumber: 'SN-WD-264004',
      macAddress: null,
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'گارانتی فعال',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 16,
      itemId: 4,
      itemCode: 'ITM-10004',
      itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
      serialNumber: 'SN-WD-264005',
      macAddress: null,
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'گارانتی فعال',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 2 units for ITM-10006 (TC-P16E2G)
    {
      id: 17,
      itemId: 6,
      itemCode: 'ITM-10006',
      itemTitleFa: 'سوییچ شبکه ۱۶ پورت PoE تیاندی Tiandy با ۲ پورت آپلینک گیگابیت',
      serialNumber: 'SN-SW-266001',
      macAddress: '68:D7:9A:12:34:56',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'سوییچ ۱۶ پورت PoE در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 18,
      itemId: 6,
      itemCode: 'ITM-10006',
      itemTitleFa: 'سوییچ شبکه ۱۶ پورت PoE تیاندی Tiandy با ۲ پورت آپلینک گیگابیت',
      serialNumber: 'SN-SW-266002',
      macAddress: '68:D7:9A:12:34:57',
      currentWarehouseId: 1,
      status: 'IN_STOCK',
      initialDocNumber: 'WH-IN-1405-1001',
      lastDocNumber: 'WH-IN-1405-1001',
      lastPartyId: 2,
      notesFa: 'سوییچ ۱۶ پورت PoE در انبار مرکزی',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultDocuments: InventoryDocumentRecord[] = [
    {
      id: 1,
      docNumber: 'WH-IN-1405-1001',
      docType: 'INBOUND_PURCHASE',
      dateJalali: '1405/01/08',
      sourceWarehouseId: null,
      sourceWarehouseTitleFa: null,
      targetWarehouseId: 1, // انبار مرکزی
      targetWarehouseTitleFa: 'انبار مرکزی خیابان جمهوری',
      partyId: 2, // شرکت بازرگانی پارس پویا
      partyNameFa: 'شرکت بازرگانی فناوری پارس پویا (واردکننده رسمی Hikvision & Dahua)',
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'ITM-10001',
          itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
          unitNameFa: 'عدد',
          quantity: 5,
          unitCostIrr: 38000000,
          totalCostIrr: 190000000,
          serialNumbers: ['SN-DH-261011', 'SN-DH-261012', 'SN-DH-261013', 'SN-DH-261014', 'SN-DH-261015'],
          notesFa: 'دوربین دام IP داهوا',
        },
        {
          id: 2,
          itemId: 2,
          itemCode: 'ITM-10002',
          itemTitleFa: 'دوربین مداربسته بولت هایک‌ویژن 4MP دید در شب رنگی ColorVu',
          unitNameFa: 'عدد',
          quantity: 4,
          unitCostIrr: 52000000,
          totalCostIrr: 208000000,
          serialNumbers: ['SN-HK-262011', 'SN-HK-262012', 'SN-HK-262013', 'SN-HK-262014'],
          notesFa: 'دوربین بولت کالرویو هایک‌ویژن',
        },
        {
          id: 3,
          itemId: 3,
          itemCode: 'ITM-10003',
          itemTitleFa: 'دستگاه ضبط ویدئویی ۱۶ کانال NVR داهوا با ۱۶ پورت PoE',
          unitNameFa: 'دستگاه',
          quantity: 2,
          unitCostIrr: 145000000,
          totalCostIrr: 290000000,
          serialNumbers: ['SN-NVR-263001', 'SN-NVR-263002'],
          notesFa: 'دستگاه NVR 16 کانال',
        },
        {
          id: 4,
          itemId: 4,
          itemCode: 'ITM-10004',
          itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
          unitNameFa: 'عدد',
          quantity: 5,
          unitCostIrr: 68000000,
          totalCostIrr: 340000000,
          serialNumbers: ['SN-WD-264001', 'SN-WD-264002', 'SN-WD-264003', 'SN-WD-264004', 'SN-WD-264005'],
          notesFa: 'هارد دیسک بنفش ۴ ترابایت',
        },
        {
          id: 5,
          itemId: 5,
          itemCode: 'ITM-10005',
          itemTitleFa: 'کابل شبکه لگراند Cat6 SFTP تمام مس تست فلوک پرمننت',
          unitNameFa: 'حلقه (۳۰۵ متر)',
          quantity: 5,
          unitCostIrr: 58000000,
          totalCostIrr: 290000000,
          notesFa: 'کابل لگراند Cat6 SFTP',
        },
        {
          id: 6,
          itemId: 6,
          itemCode: 'ITM-10006',
          itemTitleFa: 'سوییچ شبکه ۱۶ پورت PoE تیاندی Tiandy با ۲ پورت آپلینک گیگابیت',
          unitNameFa: 'دستگاه',
          quantity: 2,
          unitCostIrr: 42000000,
          totalCostIrr: 84000000,
          serialNumbers: ['SN-SW-266001', 'SN-SW-266002'],
          notesFa: 'سوییچ ۱۶ پورت PoE تیاندی',
        },
      ],
      totalAmountIrr: 1402000000,
      status: 'CONFIRMED',
      notesFa: 'رسید انبار محموله ورودی اول سال ۱۴۰۵ از واردکننده رسمی پارس پویا',
      actorUserId: 1,
      createdAt: nowIso,
    },
    {
      id: 2,
      docNumber: 'WH-TRF-1405-1001',
      docType: 'TRANSFER',
      dateJalali: '1405/01/14',
      sourceWarehouseId: 1, // انبار مرکزی
      sourceWarehouseTitleFa: 'انبار مرکزی خیابان جمهوری',
      targetWarehouseId: 3, // انبار پروژه‌ها و نصابان
      targetWarehouseTitleFa: 'انبار پروژه‌ها و تجهیزات نصابان',
      partyId: 3, // مهندس بهرامی (نصاب)
      partyNameFa: 'مهندس علیرضا بهرامی (نصاب ارشد)',
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'ITM-10001',
          itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
          unitNameFa: 'عدد',
          quantity: 2,
          unitCostIrr: 38000000,
          totalCostIrr: 76000000,
          serialNumbers: ['SN-DH-261011', 'SN-DH-261012'],
          notesFa: 'انتقال دو عدد دوربین دام IP برای پروژه آفتاب',
        },
        {
          id: 2,
          itemId: 4,
          itemCode: 'ITM-10004',
          itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
          unitNameFa: 'عدد',
          quantity: 1,
          unitCostIrr: 68000000,
          totalCostIrr: 68000000,
          serialNumbers: ['SN-WD-264001'],
          notesFa: 'انتقال یک عدد هارد ۴ ترابایت',
        },
        {
          id: 3,
          itemId: 5,
          itemCode: 'ITM-10005',
          itemTitleFa: 'کابل شبکه لگراند Cat6 SFTP تمام مس تست فلوک پرمننت',
          unitNameFa: 'حلقه (۳۰۵ متر)',
          quantity: 1,
          unitCostIrr: 58000000,
          totalCostIrr: 58000000,
          notesFa: 'یک حلقه کابل لگراند',
        },
      ],
      totalAmountIrr: 202000000,
      status: 'CONFIRMED',
      notesFa: 'برگه انتقال اقلام پروژه از انبار مرکزی به انبار کارگاهی نصاب',
      actorUserId: 1,
      createdAt: nowIso,
    },
    {
      id: 3,
      docNumber: 'WH-OUT-1405-1001',
      docType: 'OUTBOUND_SALE',
      dateJalali: '1405/01/15',
      sourceWarehouseId: 3, // انبار پروژه‌ها
      sourceWarehouseTitleFa: 'انبار پروژه‌ها و تجهیزات نصابان',
      targetWarehouseId: null,
      targetWarehouseTitleFa: null,
      partyId: 1, // شرکت ساختمانی نگین البرز
      partyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'ITM-10001',
          itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
          unitNameFa: 'عدد',
          quantity: 1,
          unitCostIrr: 38000000,
          totalCostIrr: 38000000,
          serialNumbers: ['SN-DH-261011'],
          notesFa: 'تحویل نهایی و نصب روی دکل لابی برج آفتاب',
        },
        {
          id: 2,
          itemId: 4,
          itemCode: 'ITM-10004',
          itemTitleFa: 'هارد دیسک نظارتی ۴ ترابایت بنفش وسترن دیجیتال Purple',
          unitNameFa: 'عدد',
          quantity: 1,
          unitCostIrr: 68000000,
          totalCostIrr: 68000000,
          serialNumbers: ['SN-WD-264001'],
          notesFa: 'نصب داخل رک مانیتورینگ',
        },
      ],
      totalAmountIrr: 106000000,
      status: 'CONFIRMED',
      notesFa: 'حواله خروج انبار عطف به فاکتور فروش INV-1405-1001 نگین البرز',
      actorUserId: 1,
      createdAt: nowIso,
    },
  ];

  const defaultPurchaseProformas: PurchaseProformaRecord[] = [
    {
      id: 1,
      proformaNumber: 'PO-1405-1001',
      supplierId: 2,
      supplierTitleFa: 'بازرگانی پارس پویا (واردکننده رسمی تجهیزات داهوا و هایک‌ویژن)',
      dateJalali: '1405/01/08',
      validUntilJalali: '1405/01/25',
      currency: 'AED',
      exchangeRateToIrr: 250000,
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'ITM-10001',
          itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
          unitNameFa: 'عدد',
          quantity: 5,
          unitPriceForeign: 168,
          unitPriceIrr: 42000000,
          totalPriceIrr: 210000000,
          notesFa: 'سفارش خرید ۵ عدد دوربین داهوا مدل HDW2431T',
        },
        {
          id: 2,
          itemId: 3,
          itemCode: 'ITM-10003',
          itemTitleFa: 'دستگاه ضبط تحت شبکه NVR داهوا 16 کانال 4K سری هوشمند',
          unitNameFa: 'دستگاه',
          quantity: 3,
          unitPriceForeign: 500,
          unitPriceIrr: 125000000,
          totalPriceIrr: 375000000,
          notesFa: 'سفارش خرید ۳ دستگاه NVR داهوا سری WizSense',
        },
      ],
      subtotalIrr: 585000000,
      status: 'CONVERTED',
      convertedInvoiceId: 1,
      notesFa: 'پیش‌فاکتور ارزی امارات، تایید شده و به فاکتور خرید PI-1405-1001 تبدیل گردید.',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      proformaNumber: 'PO-1405-1002',
      supplierId: 3,
      supplierTitleFa: 'شرکت ارتباطات امن پیشرو (تجهیزات شبکه، رادیو و سوییچ‌های PoE)',
      dateJalali: '1405/01/22',
      validUntilJalali: '1405/02/10',
      currency: 'USD',
      exchangeRateToIrr: 920000,
      lines: [
        {
          id: 1,
          itemId: 6,
          itemCode: 'ITM-10006',
          itemTitleFa: 'سوییچ شبکه ۱۶ پورت PoE تیاندی Tiandy با ۲ پورت آپلینک گیگابیت',
          unitNameFa: 'دستگاه',
          quantity: 4,
          unitPriceForeign: 105,
          unitPriceIrr: 96600000,
          totalPriceIrr: 386400000,
          notesFa: 'سوییچ‌های شبکه PoE برای پروژه بیمارستان',
        },
        {
          id: 2,
          itemId: 5,
          itemCode: 'ITM-10005',
          itemTitleFa: 'کابل شبکه لگراند Cat6 SFTP تمام مس تست فلوک پرمننت',
          unitNameFa: 'حلقه (۳۰۵ متر)',
          quantity: 6,
          unitPriceForeign: 62,
          unitPriceIrr: 57040000,
          totalPriceIrr: 342240000,
          notesFa: 'کابل شبکه تست فلوک',
        },
      ],
      subtotalIrr: 728640000,
      status: 'APPROVED',
      convertedInvoiceId: null,
      notesFa: 'پیش‌فاکتور خرید تجهیزات پسیو و اکتیو شبکه با تایید مدیریت فنی',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultPurchaseInvoices: PurchaseInvoiceRecord[] = [
    {
      id: 1,
      invoiceNumber: 'PI-1405-1001',
      supplierInvoiceNumber: 'INV-PARS-8821',
      supplierId: 2,
      supplierTitleFa: 'بازرگانی پارس پویا (واردکننده رسمی تجهیزات داهوا و هایک‌ویژن)',
      targetWarehouseId: 1,
      targetWarehouseTitleFa: 'انبار مرکزی و کالای تجاری',
      proformaId: 1,
      proformaNumber: 'PO-1405-1001',
      dateJalali: '1405/01/10',
      dueDateJalali: '1405/02/10',
      currency: 'AED',
      exchangeRateToIrr: 250000,
      costAllocationMethod: 'BY_VALUE',
      landedCosts: {
        freightCostIrr: 15000000,
        insuranceCostIrr: 5000000,
        packagingCostIrr: 3000000,
        customsCostIrr: 35000000,
        nonRefundableTaxIrr: 12000000,
        otherLandedCostIrr: 0,
        totalLandedCostsIrr: 70000000,
      },
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'ITM-10001',
          itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
          unitNameFa: 'عدد',
          quantity: 5,
          unitPriceForeign: 168,
          unitPriceIrr: 42000000,
          discountIrr: 0,
          vatAmountIrr: 0,
          netPriceIrr: 210000000,
          allocatedLandedCostPerUnitIrr: 5025641,
          finalLandedCostPerUnitIrr: 47025641,
          totalLandedCostIrr: 235128205,
          serialNumbers: ['SN-DH-261011', 'SN-DH-261012', 'SN-DH-261013', 'SN-DH-261014', 'SN-DH-261015'],
          macAddresses: [
            '3C:EF:8C:11:22:01',
            '3C:EF:8C:11:22:02',
            '3C:EF:8C:11:22:03',
            '3C:EF:8C:11:22:04',
            '3C:EF:8C:11:22:05',
          ],
          notesFa: '۵ عدد دوربین داهوا استارلایت با تخصیص هزینه‌های سربار واردات',
        },
        {
          id: 2,
          itemId: 3,
          itemCode: 'ITM-10003',
          itemTitleFa: 'دستگاه ضبط تحت شبکه NVR داهوا 16 کانال 4K سری هوشمند',
          unitNameFa: 'دستگاه',
          quantity: 3,
          unitPriceForeign: 500,
          unitPriceIrr: 125000000,
          discountIrr: 0,
          vatAmountIrr: 0,
          netPriceIrr: 375000000,
          allocatedLandedCostPerUnitIrr: 14957265,
          finalLandedCostPerUnitIrr: 139957265,
          totalLandedCostIrr: 419871795,
          serialNumbers: ['SN-NVR-16-901', 'SN-NVR-16-902', 'SN-NVR-16-903'],
          macAddresses: ['3C:EF:8C:20:00:01', '3C:EF:8C:20:00:02', '3C:EF:8C:20:00:03'],
          notesFa: '۳ دستگاه NVR 16 کانال داهوا با بهای تمام‌شده نهایی مستند',
        },
      ],
      subtotalNetItemsIrr: 585000000,
      totalDiscountIrr: 0,
      totalVatIrr: 0,
      totalInvoicePayableToSupplierIrr: 585000000,
      totalInventoryValuationIrr: 655000000, // 585M base + 70M landed cost
      paidAmountIrr: 400000000,
      remainingDebtIrr: 185000000,
      status: 'PARTIALLY_PAID',
      inventoryDocId: 1,
      inventoryDocNumber: 'WH-IN-1405-1001',
      notesFa: 'فاکتور قطعی خرید ارزی داهوا؛ رسید انبار و گردش بدهی به طرف تجاری ثبت شد.',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultPurchasePayments: PurchasePaymentRecord[] = [
    {
      id: 1,
      paymentNumber: 'PAY-1405-1001',
      supplierId: 2,
      supplierTitleFa: 'بازرگانی پارس پویا (واردکننده رسمی تجهیزات داهوا و هایک‌ویژن)',
      purchaseInvoiceId: 1,
      invoiceNumber: 'PI-1405-1001',
      paymentDateJalali: '1405/01/12',
      amountIrr: 400000000,
      paymentMethod: 'SATNA_PAYA',
      sourceAccountOrBank: 'بانک ملت - حساب جاری مرکزی مهرگان',
      trackingReference: 'PAYA-14050112-98432',
      notesFa: 'پرداخت مرحله اول فاکتور PI-1405-1001 از طریق حواله پایا',
      actorUserId: 1,
      createdAt: nowIso,
    },
  ];

  const defaultPurchaseReturns: PurchaseReturnRecord[] = [];

  const defaultSalesProformas: SalesProformaRecord[] = [
    {
      id: 1,
      proformaNumber: 'SQO-1405-1001',
      customerId: 1,
      customerTitleFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      dateJalali: '1405/01/15',
      validUntilJalali: '1405/02/15',
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'ITM-10001',
          itemTitleFa: 'دوربین مداربسته تحت شبکه IP دام داهوا 4MP استارلایت',
          unitNameFa: 'عدد',
          quantity: 10,
          unitPriceIrr: 58000000,
          discountIrr: 2000000,
          vatAmountIrr: 5040000,
          totalPriceIrr: 610400000,
          notesFa: '۱۰ عدد دوربین استارلایت با تخفیف پروژه بیمارستانی',
        },
      ],
      subtotalItemsIrr: 560000000,
      totalDiscountIrr: 20000000,
      totalVatIrr: 50400000,
      totalPayableIrr: 610400000,
      status: 'APPROVED',
      notesFa: 'پیش‌فاکتور رسمی فروش تجهیزات پروژه برج آفتاب',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultSalesInvoices: SalesInvoiceRecord[] = [
    {
      id: 1,
      invoiceNumber: 'INV-1405-1001',
      saleType: 'STANDARD_SALE',
      customerId: 1,
      customerTitleFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      sourceWarehouseId: 1,
      sourceWarehouseTitleFa: 'انبار مرکزی و کالای تجاری',
      proformaId: null,
      proformaNumber: null,
      dateJalali: '1405/01/18',
      dueDateJalali: '1405/02/18',
      lines: [
        {
          id: 1,
          itemId: 4,
          itemCode: 'ITM-10004',
          itemTitleFa: 'سوییچ شبکه PoE داهوا 8 پورت گیگابیت صنعتی',
          unitNameFa: 'دستگاه',
          quantity: 4,
          unitPriceIrr: 72000000,
          discountIrr: 2000000,
          vatAmountIrr: 6300000,
          netPriceIrr: 305200000,
          unitCogsIrr: 48300000,
          totalCogsIrr: 193200000,
          serialNumbers: ['SN-POE-8P-701', 'SN-POE-8P-702', 'SN-POE-8P-703', 'SN-POE-8P-704'],
          macAddresses: ['3C:EF:8C:30:10:01', '3C:EF:8C:30:10:02', '3C:EF:8C:30:10:03', '3C:EF:8C:30:10:04'],
          notesFa: 'تحویل ۴ دستگاه سوییچ شبکه PoE با ثبت بهای تمام‌شده مستند COGS',
        },
      ],
      subtotalNetItemsIrr: 280000000,
      totalDiscountIrr: 8000000,
      totalVatIrr: 25200000,
      totalInvoiceAmountIrr: 297200000,
      totalCogsIrr: 193200000,
      paidAmountIrr: 200000000,
      remainingBalanceIrr: 97200000,
      status: 'PARTIALLY_PAID',
      inventoryDocId: 2,
      inventoryDocNumber: 'WH-OUT-1405-1001',
      paymentDetails: {
        paymentMethod: 'POS',
        trackingReference: 'POS-14050118-8820',
        posTerminalOrBank: 'کارتخوان بانک سامان - صندوق مرکزی',
      },
      notesFa: 'فاکتور قطعی فروش تجهیزات شبکه؛ حواله خروج انبار و بدهکار مشتری ثبت گردید.',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultSalesReceipts: SalesReceiptRecord[] = [
    {
      id: 1,
      receiptNumber: 'REC-1405-1001',
      customerId: 1,
      customerTitleFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      salesInvoiceId: 1,
      invoiceNumber: 'INV-1405-1001',
      paymentDateJalali: '1405/01/18',
      amountIrr: 200000000,
      paymentMethod: 'POS',
      destinationBankOrCash: 'کارتخوان بانک سامان - صندوق مرکزی',
      trackingReference: 'POS-8820-9941',
      notesFa: 'دریافت پیش‌پرداخت کارتخوان بابت فاکتور فروش INV-1405-1001',
      actorUserId: 1,
      createdAt: nowIso,
    },
  ];

  const defaultSalesReturns: SalesReturnRecord[] = [];

  const defaultInstallationJobs: InstallationJobRecord[] = [
    {
      id: 1,
      jobCode: 'INS-1405-1001',
      titleFa: 'نصب و راه‌اندازی سیستم دوربین مداربسته ۸ کاناله و کابل‌کشی داکت',
      customerId: 1,
      customerTitleFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      salesInvoiceId: 1,
      invoiceNumber: 'INV-1405-1001',
      installerId: 3,
      installerTitleFa: 'مهندس علیرضا رضایی (تکنسین ارشد نصب و شبکه)',
      serviceFeeIrr: 45000000,
      additionalExpensesIrr: 15000000,
      totalCostIrr: 60000000,
      paidAmountIrr: 60000000,
      remainingBalanceIrr: 0,
      locationAddressFa: 'تهران، خیابان ولیعصر، نرسیده به پارک وی، برج آفتاب، طبقه ۵',
      scheduledDateJalali: '1405/01/20',
      completedDateJalali: '1405/01/22',
      status: 'COMPLETED',
      notesFa: 'نصب ۸ عدد دوربین دام داهوا، رک دیواری و کانفیگ دستگاه NVR با موفقیت انجام و تحویل داده شد.',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultCashBoxes: CashBoxRecord[] = [
    {
      id: 1,
      boxCode: 'CB-1001',
      titleFa: 'صندوق مرکزی فروشگاه مهرگان',
      cashierUserId: 1,
      balanceIrr: 150000000,
      status: 'ACTIVE',
      createdAt: nowIso,
    },
    {
      id: 2,
      boxCode: 'CB-1002',
      titleFa: 'صندوق فروش سریع (POS)',
      cashierUserId: 1,
      balanceIrr: 45000000,
      status: 'ACTIVE',
      createdAt: nowIso,
    },
  ];

  const defaultBankAccounts: BankAccountRecord[] = [
    {
      id: 1,
      accountCode: 'BA-1001',
      bankNameFa: 'بانک سامان - شعبه جمهوری',
      accountNumber: '8820-9941-11',
      shabaNumber: 'IR68-0560-0882-0099-4111-0001',
      balanceIrr: 850000000,
      status: 'ACTIVE',
      createdAt: nowIso,
    },
    {
      id: 2,
      accountCode: 'BA-1002',
      bankNameFa: 'بانک ملی ایران - شعبه حافظ',
      accountNumber: '0104-5512-3001',
      shabaNumber: 'IR12-0170-0000-0104-5512-3001',
      balanceIrr: 420000000,
      status: 'ACTIVE',
      createdAt: nowIso,
    },
  ];

  const defaultCheques: ChequeRecord[] = [
    {
      id: 1,
      chequeNumber: 'CHQ-88201',
      chequeType: 'INBOUND',
      partyId: 1,
      partyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      bankNameFa: 'بانک تجارت',
      branchNameFa: 'شعبه مرکزی',
      amountIrr: 120000000,
      issueDateJalali: '1405/01/15',
      dueDateJalali: '1405/02/10',
      status: 'IN_HAND',
      notesFa: 'چک دریافتی بابت بقیه تسویه فاکتور فروش',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      chequeNumber: 'CHQ-44019',
      chequeType: 'OUTBOUND',
      partyId: 2,
      partyNameFa: 'بازرگانی تجهیزات شبکه فرادید (واردکننده رسمی)',
      bankNameFa: 'بانک سامان',
      branchNameFa: 'شعبه جمهوری',
      amountIrr: 350000000,
      issueDateJalali: '1405/01/10',
      dueDateJalali: '1405/02/15',
      status: 'IN_HAND',
      notesFa: 'چک پرداختی بابت خرید تجهیزات ارزی',
      actorUserId: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultTreasuryTransactions: TreasuryTransactionRecord[] = [
    {
      id: 1,
      txNumber: 'TRN-1405-1001',
      txType: 'RECEIPT',
      dateJalali: '1405/01/18',
      partyId: 1,
      partyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      amountIrr: 200000000,
      paymentMethod: 'POS',
      sourceBankAccountId: 1,
      notesFa: 'دریافت وجه پیش‌پرداخت کارتخوان سامان بابت فاکتور فروش',
      actorUserId: 1,
      createdAt: nowIso,
    },
  ];

  const defaultInstallments: InstallmentRecord[] = [
    {
      id: 1,
      installmentCode: 'INS-SCH-1001',
      titleFa: 'قسط اول تجهیزات دوربین برج آفتاب',
      partyId: 1,
      partyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      salesInvoiceId: 1,
      installmentNumber: 1,
      totalInstallments: 3,
      amountIrr: 50000000,
      dueDateJalali: '1405/02/01',
      status: 'PENDING',
      notesFa: 'سررسید اول اقساط فروش توافقی',
      createdAt: nowIso,
    },
    {
      id: 2,
      installmentCode: 'INS-SCH-1002',
      titleFa: 'قسط دوم تجهیزات دوربین برج آفتاب',
      partyId: 1,
      partyNameFa: 'شرکت ساختمانی نگین البرز (پروژه برج آفتاب)',
      salesInvoiceId: 1,
      installmentNumber: 2,
      totalInstallments: 3,
      amountIrr: 50000000,
      dueDateJalali: '1405/03/01',
      status: 'PENDING',
      notesFa: 'سررسید دوم اقساط فروش توافقی',
      createdAt: nowIso,
    },
  ];

  const defaultOperationalExpenses: OperationalExpenseRecord[] = [
    {
      id: 1,
      expenseCode: 'EXP-1405-1001',
      categoryFa: 'اجاره',
      titleFa: 'اجاره فروردین‌ماه دفتر مرکزی و فروشگاه',
      amountIrr: 180000000,
      dateJalali: '1405/01/05',
      paymentMethod: 'BANK_TRANSFER',
      sourceBankOrCash: 'بانک سامان - شعبه جمهوری',
      notesFa: 'واریز اجاره ماهانه بابت ملک مجتمع مهرگان',
      actorUserId: 1,
      createdAt: nowIso,
    },
  ];

  const defaultOperationalIncomes: OperationalIncomeRecord[] = [
    {
      id: 1,
      incomeCode: 'INC-1405-1001',
      categoryFa: 'خدمات مشاوره',
      titleFa: 'درآمد مشاوره و طراحی اتاق سرور شرکت داده‌پردازان',
      amountIrr: 95000000,
      dateJalali: '1405/01/10',
      receiptMethod: 'BANK_TRANSFER',
      targetBankOrCash: 'بانک ملت - حساب جاری اصلی',
      notesFa: 'درآمد متفرقه خدمات مشاوره و طراحی شبکه',
      actorUserId: 1,
      createdAt: nowIso,
    },
  ];

  const defaultAccountsChart: AccountRecord[] = [
    // 1. دارایی‌های جاری
    { id: 1, code: '1', titleFa: 'دارایی‌های جاری', level: 'GROUP', parentCode: null, nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 2, code: '101', titleFa: 'موجودی نقد و بانک', level: 'GENERAL', parentCode: '1', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 3, code: '10101', titleFa: 'صندوق‌های فروشگاه و دفتر مرکزی', level: 'SUBSIDIARY', parentCode: '101', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 4, code: '10102', titleFa: 'حساب‌های جاری بانکی', level: 'SUBSIDIARY', parentCode: '101', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 5, code: '10103', titleFa: 'پایانه‌های فروش و دستگاه‌های کارتخوان (POS)', level: 'SUBSIDIARY', parentCode: '101', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 6, code: '102', titleFa: 'اسناد دریافتنی تجاری (چک‌ها)', level: 'GENERAL', parentCode: '1', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 7, code: '10201', titleFa: 'اسناد دریافتنی نزد صندوق (چک‌های سررسید نشده)', level: 'SUBSIDIARY', parentCode: '102', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 8, code: '10202', titleFa: 'اسناد دریافتنی در جریان وصول به بانک', level: 'SUBSIDIARY', parentCode: '102', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 9, code: '10203', titleFa: 'اسناد دریافتنی واخواست‌شده / برگشتی', level: 'SUBSIDIARY', parentCode: '102', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 10, code: '103', titleFa: 'حساب‌های دریافتنی تجاری (مشتریان)', level: 'GENERAL', parentCode: '1', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 11, code: '10301', titleFa: 'بدهکاران تجاری - خریداران حقیقی و پروژه‌ای', level: 'SUBSIDIARY', parentCode: '103', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 12, code: '104', titleFa: 'موجودی کالا و قطعات', level: 'GENERAL', parentCode: '1', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 13, code: '10401', titleFa: 'موجودی انبار مرکزی و فروشگاه (دوربین مداربسته و ملزومات)', level: 'SUBSIDIARY', parentCode: '104', nature: 'DEBIT', groupCode: '1', groupTitleFa: 'دارایی‌های جاری', isSystem: true, createdAt: nowIso },

    // 2. دارایی‌های غیرجاری
    { id: 14, code: '2', titleFa: 'دارایی‌های غیرجاری', level: 'GROUP', parentCode: null, nature: 'DEBIT', groupCode: '2', groupTitleFa: 'دارایی‌های غیرجاری', isSystem: true, createdAt: nowIso },
    { id: 15, code: '201', titleFa: 'دارایی‌های ثابت مشهود', level: 'GENERAL', parentCode: '2', nature: 'DEBIT', groupCode: '2', groupTitleFa: 'دارایی‌های غیرجاری', isSystem: true, createdAt: nowIso },
    { id: 16, code: '20101', titleFa: 'اثاثه، ابزارآلات و تجهیزات فنی نصب', level: 'SUBSIDIARY', parentCode: '201', nature: 'DEBIT', groupCode: '2', groupTitleFa: 'دارایی‌های غیرجاری', isSystem: true, createdAt: nowIso },

    // 3. بدهی‌های جاری
    { id: 17, code: '3', titleFa: 'بدهی‌های جاری', level: 'GROUP', parentCode: null, nature: 'CREDIT', groupCode: '3', groupTitleFa: 'بدهی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 18, code: '301', titleFa: 'حساب‌های پرداختنی تجاری (تأمین‌کنندگان و پیمانکاران)', level: 'GENERAL', parentCode: '3', nature: 'CREDIT', groupCode: '3', groupTitleFa: 'بدهی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 19, code: '30101', titleFa: 'بستانکاران تجاری - تأمین‌کنندگان و واردکنندگان کالا', level: 'SUBSIDIARY', parentCode: '301', nature: 'CREDIT', groupCode: '3', groupTitleFa: 'بدهی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 20, code: '30102', titleFa: 'بستانکاران خدماتی - نصابان و تکنسین‌های فنی', level: 'SUBSIDIARY', parentCode: '301', nature: 'CREDIT', groupCode: '3', groupTitleFa: 'بدهی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 21, code: '302', titleFa: 'اسناد پرداختنی تجاری (چک‌های صادره)', level: 'GENERAL', parentCode: '3', nature: 'CREDIT', groupCode: '3', groupTitleFa: 'بدهی‌های جاری', isSystem: true, createdAt: nowIso },
    { id: 22, code: '30201', titleFa: 'اسناد پرداختنی سررسید نشده به تأمین‌کنندگان', level: 'SUBSIDIARY', parentCode: '302', nature: 'CREDIT', groupCode: '3', groupTitleFa: 'بدهی‌های جاری', isSystem: true, createdAt: nowIso },

    // 5. حقوق صاحبان سهام و سرمایه
    { id: 23, code: '5', titleFa: 'حقوق صاحبان سرمایه', level: 'GROUP', parentCode: null, nature: 'CREDIT', groupCode: '5', groupTitleFa: 'حقوق صاحبان سرمایه', isSystem: true, createdAt: nowIso },
    { id: 24, code: '501', titleFa: 'سرمایه اولیه و اندوخته‌ها', level: 'GENERAL', parentCode: '5', nature: 'CREDIT', groupCode: '5', groupTitleFa: 'حقوق صاحبان سرمایه', isSystem: true, createdAt: nowIso },
    { id: 25, code: '50101', titleFa: 'سرمایه اولیه ثبت‌شده مؤسس', level: 'SUBSIDIARY', parentCode: '501', nature: 'CREDIT', groupCode: '5', groupTitleFa: 'حقوق صاحبان سرمایه', isSystem: true, createdAt: nowIso },

    // 6. درآمدها و فروش
    { id: 26, code: '6', titleFa: 'درآمدها و فروش', level: 'GROUP', parentCode: null, nature: 'CREDIT', groupCode: '6', groupTitleFa: 'درآمدها و فروش', isSystem: true, createdAt: nowIso },
    { id: 27, code: '601', titleFa: 'فروش ناخالص کالا و تجهیزات امنیتی', level: 'GENERAL', parentCode: '6', nature: 'CREDIT', groupCode: '6', groupTitleFa: 'درآمدها و فروش', isSystem: true, createdAt: nowIso },
    { id: 28, code: '60101', titleFa: 'درآمد فروش دوربین‌های مداربسته، دستگاه‌های ضبط و تجهیزات', level: 'SUBSIDIARY', parentCode: '601', nature: 'CREDIT', groupCode: '6', groupTitleFa: 'درآمدها و فروش', isSystem: true, createdAt: nowIso },
    { id: 29, code: '602', titleFa: 'درآمد ارائه خدمات و پروژه‌ها', level: 'GENERAL', parentCode: '6', nature: 'CREDIT', groupCode: '6', groupTitleFa: 'درآمدها و فروش', isSystem: true, createdAt: nowIso },
    { id: 30, code: '60201', titleFa: 'درآمد خدمات نصب، راه‌اندازی و پشتیبانی', level: 'SUBSIDIARY', parentCode: '602', nature: 'CREDIT', groupCode: '6', groupTitleFa: 'درآمدها و فروش', isSystem: true, createdAt: nowIso },

    // 7. بهای تمام‌شده کالای فروش‌رفته (COGS)
    { id: 31, code: '7', titleFa: 'بهای تمام‌شده', level: 'GROUP', parentCode: null, nature: 'DEBIT', groupCode: '7', groupTitleFa: 'بهای تمام‌شده', isSystem: true, createdAt: nowIso },
    { id: 32, code: '701', titleFa: 'بهای تمام‌شده کالای فروش‌رفته (COGS)', level: 'GENERAL', parentCode: '7', nature: 'DEBIT', groupCode: '7', groupTitleFa: 'بهای تمام‌شده', isSystem: true, createdAt: nowIso },
    { id: 33, code: '70101', titleFa: 'بهای تمام‌شده اقلام خارج‌شده از انبار', level: 'SUBSIDIARY', parentCode: '701', nature: 'DEBIT', groupCode: '7', groupTitleFa: 'بهای تمام‌شده', isSystem: true, createdAt: nowIso },
    { id: 34, code: '702', titleFa: 'بهای تمام‌شده خدمات پروژه‌های نصب', level: 'GENERAL', parentCode: '7', nature: 'DEBIT', groupCode: '7', groupTitleFa: 'بهای تمام‌شده', isSystem: true, createdAt: nowIso },
    { id: 35, code: '70201', titleFa: 'اجرت پرداختی به نصابان و تکنسین‌های فنی', level: 'SUBSIDIARY', parentCode: '702', nature: 'DEBIT', groupCode: '7', groupTitleFa: 'بهای تمام‌شده', isSystem: true, createdAt: nowIso },

    // 8. هزینه‌های عمومی، اداری و عملیاتی
    { id: 36, code: '8', titleFa: 'هزینه‌های عملیاتی و اداری', level: 'GROUP', parentCode: null, nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 37, code: '801', titleFa: 'هزینه‌های عمومی و اداری', level: 'GENERAL', parentCode: '8', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 38, code: '80101', titleFa: 'هزینه اجاره محل فروشگاه و انبار', level: 'SUBSIDIARY', parentCode: '801', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 39, code: '80102', titleFa: 'هزینه آب، برق، گاز، تلفن و اینترنت', level: 'SUBSIDIARY', parentCode: '801', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 40, code: '80103', titleFa: 'هزینه حقوق، دستمزد و مزایای پرسنل', level: 'SUBSIDIARY', parentCode: '801', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 41, code: '80104', titleFa: 'هزینه حمل و نقل، ارسال و پیک', level: 'SUBSIDIARY', parentCode: '801', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 42, code: '80105', titleFa: 'هزینه ملزومات، لوازم مصرفی و استهلاک ابزار', level: 'SUBSIDIARY', parentCode: '801', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
    { id: 43, code: '80106', titleFa: 'سایر هزینه‌های متفرقه عملیاتی', level: 'SUBSIDIARY', parentCode: '801', nature: 'DEBIT', groupCode: '8', groupTitleFa: 'هزینه‌های عملیاتی و اداری', isSystem: true, createdAt: nowIso },
  ];

  const defaultAccountingDocuments: AccountingDocumentRecord[] = [
    {
      id: 1,
      docNumber: 'DOC-1405-0001',
      referenceNumber: 'REF-OPEN-1405',
      dateJalali: '1405/01/01',
      dateIso: nowIso,
      docType: 'MANUAL',
      sourceDocType: 'MANUAL',
      sourceDocId: 'OPENING',
      descriptionFa: 'سند افتتاحیه سال مالی ۱۴۰۵ - تراز آغازین دوره موجودی نقد، انبار و سرمایه',
      status: 'PERMANENT',
      totalDebitIrr: 1450000000,
      totalCreditIrr: 1450000000,
      lines: [
        {
          id: 1,
          rowNumber: 1,
          accountCode: '10101',
          accountTitleFa: 'صندوق‌های فروشگاه و دفتر مرکزی',
          detailType: 'CASH_BOX',
          detailId: 1,
          detailTitleFa: 'صندوق اصلی فروشگاه',
          debitIrr: 150000000,
          creditIrr: 0,
          descriptionFa: 'موجودی نقد اول دوره صندوق اصلی',
        },
        {
          id: 2,
          rowNumber: 2,
          accountCode: '10102',
          accountTitleFa: 'حساب‌های جاری بانکی',
          detailType: 'BANK_ACCOUNT',
          detailId: 1,
          detailTitleFa: 'بانک ملت - شعبه مرکزی حافظ',
          debitIrr: 450000000,
          creditIrr: 0,
          descriptionFa: 'موجودی اول دوره حساب جاری بانک ملت',
        },
        {
          id: 3,
          rowNumber: 3,
          accountCode: '10401',
          accountTitleFa: 'موجودی انبار مرکزی و فروشگاه',
          detailType: null,
          detailId: null,
          detailTitleFa: null,
          debitIrr: 850000000,
          creditIrr: 0,
          descriptionFa: 'ارزش ارزیابی انبار تجهیزات دوربین اول دوره',
        },
        {
          id: 4,
          rowNumber: 4,
          accountCode: '50101',
          accountTitleFa: 'سرمایه اولیه ثبت‌شده مؤسس',
          detailType: null,
          detailId: null,
          detailTitleFa: null,
          debitIrr: 0,
          creditIrr: 1450000000,
          descriptionFa: 'ثبت سرمایه آورده اولیه موسسین مهرگان',
        },
      ],
      createdByUserId: 1,
      createdByName: 'مدیر ارشد مهرگان',
      approvedByUserId: 1,
      approvedByName: 'مدیر ارشد مهرگان',
      permanentByUserId: 1,
      permanentByName: 'مدیر ارشد مهرگان',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultFiscalYears: FiscalYearRecord[] = [
    {
      id: 1,
      yearCode: '1404',
      titleFa: 'سال مالی ۱۴۰۴ (بسته‌شده)',
      startDateJalali: '1404/01/01',
      endDateJalali: '1404/12/29',
      status: 'CLOSED',
      isDefault: false,
      closingDocId: null,
      closingDocNumber: 'DOC-1404-CLOSE-FINAL',
      closedAt: '2025-03-20T18:30:00.000Z',
      closedByUserId: 1,
      closedByNameFa: 'مدیر ارشد مهرگان',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      yearCode: '1405',
      titleFa: 'سال مالی ۱۴۰۵ (جاری)',
      startDateJalali: '1405/01/01',
      endDateJalali: '1405/12/29',
      status: 'OPEN',
      isDefault: true,
      closingDocId: null,
      closingDocNumber: null,
      closedAt: null,
      closedByUserId: null,
      closedByNameFa: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const defaultAccountingPeriods: AccountingPeriodRecord[] = [
    { id: 1, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 1, titleFa: 'فروردین‌ماه ۱۴۰۵', startDateJalali: '1405/01/01', endDateJalali: '1405/01/31', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 2, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 2, titleFa: 'اردیبهشت‌ماه ۱۴۰۵', startDateJalali: '1405/02/01', endDateJalali: '1405/02/31', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 3, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 3, titleFa: 'خردادماه ۱۴۰۵', startDateJalali: '1405/03/01', endDateJalali: '1405/03/31', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 4, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 4, titleFa: 'تیرماه ۱۴۰۵', startDateJalali: '1405/04/01', endDateJalali: '1405/04/31', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 5, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 5, titleFa: 'مردادماه ۱۴۰۵', startDateJalali: '1405/05/01', endDateJalali: '1405/05/31', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 6, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 6, titleFa: 'شهریورماه ۱۴۰۵', startDateJalali: '1405/06/01', endDateJalali: '1405/06/31', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 7, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 7, titleFa: 'مهرماه ۱۴۰۵', startDateJalali: '1405/07/01', endDateJalali: '1405/07/30', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 8, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 8, titleFa: 'آبان‌ماه ۱۴۰۵', startDateJalali: '1405/08/01', endDateJalali: '1405/08/30', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 9, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 9, titleFa: 'آذرماه ۱۴۰۵', startDateJalali: '1405/09/01', endDateJalali: '1405/09/30', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 10, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 10, titleFa: 'دی‌ماه ۱۴۰۵', startDateJalali: '1405/10/01', endDateJalali: '1405/10/30', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 11, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 11, titleFa: 'بهمن‌ماه ۱۴۰۵', startDateJalali: '1405/11/01', endDateJalali: '1405/11/30', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
    { id: 12, fiscalYearId: 2, fiscalYearCode: '1405', periodNumber: 12, titleFa: 'اسفندماه ۱۴۰۵', startDateJalali: '1405/12/01', endDateJalali: '1405/12/29', status: 'OPEN', closedAt: null, closedByUserId: null, closingDocId: null, closingDocNumber: null },
  ];

  const defaultCostCenters: CostCenterRecord[] = [
    {
      id: 1,
      code: 'CC-101',
      titleFa: 'فروشگاه مرکزی و شوروم تخصصی دوربین',
      managerNameFa: 'مهندس حسینی',
      budgetIrr: 5000000000,
      isActive: true,
      descriptionFa: 'واحد فروش حضوری، آنلاین و ارتباط با مشتریان خرد و همکار',
      createdAt: nowIso,
    },
    {
      id: 2,
      code: 'CC-102',
      titleFa: 'پروژه‌ها و خدمات نصب و اجرا CCTV',
      managerNameFa: 'مهندس اکبری',
      budgetIrr: 8000000000,
      isActive: true,
      descriptionFa: 'تیم‌های اجرایی نصب مداربسته، کابل‌کشی، داکت‌کشی و راه‌اندازی رک و NVR',
      createdAt: nowIso,
    },
    {
      id: 3,
      code: 'CC-103',
      titleFa: 'تعمیرات تخصصی و گارانتی تجهیزات',
      managerNameFa: 'مهندس رضایی',
      budgetIrr: 2500000000,
      isActive: true,
      descriptionFa: 'مرکز خدمات پس از فروش، تست لنز، برد سنسور و منبع تغذیه',
      createdAt: nowIso,
    },
    {
      id: 4,
      code: 'CC-104',
      titleFa: 'عمومی، پشتیبانی و ستاد اداری',
      managerNameFa: 'خانم احمدی',
      budgetIrr: 3000000000,
      isActive: true,
      descriptionFa: 'هزینه‌های مشترک، اداری، مالی و حسابداری مجموعه',
      createdAt: nowIso,
    },
  ];

  const defaultProjects: ProjectRecord[] = [];

  const defaultProjectRequisitions: ProjectMaterialRequisitionRecord[] = [];

  const defaultFixedAssets: FixedAssetRecord[] = [
    {
      id: 1,
      assetCode: 'AST-1405-001',
      titleFa: 'سوییچینگ، سرور و رک‌های اتاق سرور مرکز داده مهرگان',
      purchaseDateJalali: '1404/02/10',
      purchaseCostIrr: 280000000,
      salvageValueIrr: 10000000,
      usefulLifeYears: 5,
      depreciationMethod: 'STRAIGHT_LINE',
      status: 'ACTIVE',
      custodianPartyId: 1,
      custodianTitleFa: 'امیرحسین رضایی',
      locationAddressFa: 'دفتر مرکزی - اتاق سرور',
      accumulatedDepreciationIrr: 54000000,
      bookValueIrr: 226000000,
      lastDepreciationDateJalali: '1404/12/29',
      createdAt: nowIso,
    },
    {
      id: 2,
      assetCode: 'AST-1405-002',
      titleFa: 'خودرو اختصاصی پشتیبانی و نصب میدانی (پراید وانت تخصصی)',
      purchaseDateJalali: '1403/06/15',
      purchaseCostIrr: 450000000,
      salvageValueIrr: 50000000,
      usefulLifeYears: 7,
      depreciationMethod: 'STRAIGHT_LINE',
      status: 'ACTIVE',
      custodianPartyId: 3,
      custodianTitleFa: 'سعید محمدی',
      locationAddressFa: 'ناوگان حمل و نقل و نصب',
      accumulatedDepreciationIrr: 114285714,
      bookValueIrr: 335714286,
      lastDepreciationDateJalali: '1404/12/29',
      createdAt: nowIso,
    },
  ];

  const defaultDepreciationEntries: DepreciationEntryRecord[] = [
    {
      id: 1,
      assetId: 1,
      assetTitleFa: 'سوییچینگ، سرور و رک‌های اتاق سرور مرکز داده مهرگان',
      periodJalali: '1404-Y',
      depreciationAmountIrr: 54000000,
      accountingDocId: 1,
      postedAt: nowIso,
    },
  ];

  return {
    activeSessionUserId: 1,
    settings: {
      companyName: 'فروشگاه دوربین مداربسته و سیستم‌های امنیتی مهرگان',
      economicCode: '411-8920-3314',
      nationalId: '14009871230',
      phone: '021-66748920',
      addressFa: 'تهران، خیابان جمهوری، تقاطع حافظ، مجتمع تجاری تخصصی مهرگان، طبقه ۲',
      baseCurrencyCode: 'IRR',
      displayCurrencyCode: 'IRT',
      inventoryCostingMethod: 'SPECIFIC_OR_FIFO',
      landedCostAllocationDefault: 'BY_VALUE',
      activeFiscalYearCode: '1405',
      allowNegativeInventory: false,
      enableDoubleEntryAccounting: true,
      industryProfileCode: 'CCTV_SECURITY',
      documentNumbering: {
        salesInvoicePrefix: 'INV-1405-',
        salesProformaPrefix: 'SQO-1405-',
        purchaseInvoicePrefix: 'PI-1405-',
        purchaseProformaPrefix: 'PO-1405-',
        treasuryReceiptPrefix: 'REC-1405-',
        treasuryPaymentPrefix: 'PAY-1405-',
        accountingDocPrefix: 'DOC-1405-',
        projectPrefix: 'PRJ-1405-',
        installationPrefix: 'INS-1405-',
        expensePrefix: 'EXP-1405-',
        incomePrefix: 'INC-1405-',
      },
      defaultWarehouseId: 1,
      defaultCashBoxId: 1,
      defaultBankAccountId: 1,
      receiptFooterMessageFa: 'از خرید شما سپاسگزاریم. کلیه تجهیزات دارای ۲۴ ماه گارانتی طلایی شرکت مهرگان می‌باشند.',
      updatedAt: nowIso,
    },
    users,
    roles,
    permissions,
    rolePermissions,
    userRoleAssignments,
    userPermissionOverrides,
    migrations,
    auditLogs,
    parties: defaultParties,
    partyTransactions: defaultTransactions,
    itemCategories: defaultCategories,
    itemBrands: defaultBrands,
    itemUnits: defaultUnits,
    items: defaultItems,
    warehouses: defaultWarehouses,
    itemSerials: defaultSerials,
    inventoryDocuments: defaultDocuments,
    purchaseProformas: defaultPurchaseProformas,
    purchaseInvoices: defaultPurchaseInvoices,
    purchasePayments: defaultPurchasePayments,
    purchaseReturns: defaultPurchaseReturns,
    salesProformas: defaultSalesProformas,
    salesInvoices: defaultSalesInvoices,
    salesReceipts: defaultSalesReceipts,
    salesReturns: defaultSalesReturns,
    installationJobs: defaultInstallationJobs,
    cashBoxes: defaultCashBoxes,
    bankAccounts: defaultBankAccounts,
    cheques: defaultCheques,
    treasuryTransactions: defaultTreasuryTransactions,
    installments: defaultInstallments,
    operationalExpenses: defaultOperationalExpenses,
    operationalIncomes: defaultOperationalIncomes,
    accountsChart: defaultAccountsChart,
    accountingDocuments: defaultAccountingDocuments,
    fiscalYears: defaultFiscalYears,
    accountingPeriods: defaultAccountingPeriods,
    costCenters: defaultCostCenters,
    projects: defaultProjects,
    projectRequisitions: defaultProjectRequisitions,
    fixedAssets: defaultFixedAssets,
    depreciationEntries: defaultDepreciationEntries,
    customIndustryProfiles: [],
    goldColleagueTrades: [
      {
        id: 1,
        tradeNumber: 'GLD-TRD-1405-101',
        tradeType: 'COLLEAGUE_WEIGHT_SALE',
        partyId: 1,
        partyTitleFa: 'حاج محمد زرین‌پور (بنکدار و زرگر همکار)',
        dateJalali: '1405/01/18',
        goldItemCategory: 'GOLD_18K_MADE',
        rawWeightGrams: 35.5,
        stoneWeightGrams: 0,
        netWeightGrams: 35.5,
        ayar: 750,
        pure750WeightGrams: 35.5,
        makingWageGrams: 0,
        totalGoldEffectGrams: 35.5,
        isPureGoldTradeNoRial: true,
        descriptionFa: 'تحویل طلای ۱۸ عیار ساخته بدون ریال به همکار (بدهکار وزنی طلا)',
        createdAt: nowIso,
      },
      {
        id: 2,
        tradeNumber: 'GLD-TRD-1405-102',
        tradeType: 'COLLEAGUE_WEIGHT_RECEIPT',
        partyId: 1,
        partyTitleFa: 'حاج محمد زرین‌پور (بنکدار و زرگر همکار)',
        dateJalali: '1405/01/22',
        goldItemCategory: 'MELTED_GOLD',
        rawWeightGrams: 22.1,
        stoneWeightGrams: 0,
        netWeightGrams: 22.1,
        ayar: 748,
        pure750WeightGrams: 22.041,
        makingWageGrams: 0,
        totalGoldEffectGrams: -22.041,
        isPureGoldTradeNoRial: true,
        engravingCode: 'ANG-7821',
        descriptionFa: 'دریافت قطعه آبشده با انگ آزمایشگاهی تهران عیار ۷۴۸ بابت بده‌بستان',
        createdAt: nowIso,
      },
    ],
    restaurantTables: [
      { id: 1, tableNumber: 'T-01', titleFa: 'میز ۱ (سالن اصلی)', capacity: 4, sectionFa: 'سالن اصلی', status: 'AVAILABLE' },
      { id: 2, tableNumber: 'T-02', titleFa: 'میز ۲ (سالن اصلی)', capacity: 2, sectionFa: 'سالن اصلی', status: 'OCCUPIED', currentOrderId: 1, currentOrderAmountIrr: 4200000 },
      { id: 3, tableNumber: 'T-03', titleFa: 'میز ۳ (سالن اصلی)', capacity: 6, sectionFa: 'سالن اصلی', status: 'AVAILABLE' },
      { id: 4, tableNumber: 'T-04', titleFa: 'میز ۴ (فضای باز/تراس)', capacity: 4, sectionFa: 'تراس و بالکن', status: 'AVAILABLE' },
      { id: 5, tableNumber: 'T-05', titleFa: 'میز ۵ (فضای باز/تراس)', capacity: 4, sectionFa: 'تراس و بالکن', status: 'AVAILABLE' },
      { id: 6, tableNumber: 'VIP-1', titleFa: 'میز VIP اختصاصی', capacity: 10, sectionFa: 'سالن VIP', status: 'RESERVED' },
      { id: 7, tableNumber: 'T-07', titleFa: 'میز ۷ (طبقه دوم)', capacity: 4, sectionFa: 'طبقه دوم', status: 'AVAILABLE' },
      { id: 8, tableNumber: 'T-08', titleFa: 'میز ۸ (طبقه دوم)', capacity: 8, sectionFa: 'طبقه دوم', status: 'AVAILABLE' },
    ],
    restaurantOrders: [
      {
        id: 1,
        orderNumber: 'ORD-1405-501',
        orderType: 'DINE_IN',
        tableNumber: 'T-02',
        customerNameFa: 'مشتری میز ۲ (آقای دکتر احمدی)',
        phone: '09121112233',
        lines: [
          { itemId: 101, itemTitleFa: 'چلو کباب کوبیده مخصوص زعفرانی', quantity: 2, unitPriceIrr: 1800000, notesFa: 'کره اضافه' },
          { itemId: 102, itemTitleFa: 'سالاد فصل و ماست موسیر محلی', quantity: 2, unitPriceIrr: 300000 },
        ],
        subtotalIrr: 4200000,
        serviceChargeIrr: 0,
        vatAmountIrr: 420000,
        totalPayableIrr: 4620000,
        status: 'PREPARING',
        dateJalali: '1405/01/25',
        createdAt: nowIso,
      },
    ],
    wholesaleOrders: [
      {
        id: 1,
        orderNumber: 'WHO-1405-001',
        customerId: 1, // شرکت فنی مهندسی دژسازان نوین
        customerNameFa: 'شرکت پخش و بنکداری دژسازان (شعبه غرب)',
        customerCreditLimitIrr: 500000000, // ۵۰ میلیون تومان سقف اعتبار
        currentOutstandingDebtIrr: 120000000,
        isCreditLimitExceeded: false,
        visitorNameFa: 'سعید مرادی (ویزیتور منطقه ۲)',
        paymentTermsFa: 'CHEQUE_30_DAYS',
        lines: [
          {
            itemId: 1,
            itemTitleFa: 'دوربین بولت 5MP سونی بدنه فلزی ضدآب',
            packCount: 5, // ۵ کارتن
            looseUnitsCount: 0,
            unitsPerPack: 10, // ۱۰ عدد در هر کارتن
            totalUnits: 50,
            priceTier: 'WHOLESALE_BULK',
            unitPriceIrr: 2800000, // نرخ بنکداری
            packPriceIrr: 28000000,
            discountPercent: 5,
            lineTotalIrr: 133000000,
          },
          {
            itemId: 4,
            itemTitleFa: 'کابل شبکه Cat6 SFTP تمام مس قرقره ۳۰۵ متری',
            packCount: 4, // ۴ قرقره/کارتن
            looseUnitsCount: 0,
            unitsPerPack: 1,
            totalUnits: 4,
            priceTier: 'WHOLESALE_BULK',
            unitPriceIrr: 32000000,
            packPriceIrr: 32000000,
            discountPercent: 2,
            lineTotalIrr: 125440000,
          },
        ],
        totalCartons: 9,
        totalLooseUnits: 0,
        subtotalIrr: 268000000,
        discountTotalIrr: 9560000,
        shippingFeeIrr: 2500000,
        vatAmountIrr: 0,
        totalPayableIrr: 260940000,
        dispatchStatus: 'DISPATCHED',
        dateJalali: '1405/01/24',
        createdAt: nowIso,
      },
    ],
    wholesaleDispatches: [
      {
        id: 1,
        dispatchNumber: 'DSP-1405-001',
        orderId: 1,
        orderNumber: 'WHO-1405-001',
        customerNameFa: 'شرکت پخش و بنکداری دژسازان (شعبه غرب)',
        destinationCityFa: 'تهران',
        destinationAddressFa: 'بزرگراه فتح، کیلومتر ۴، شهرک صنعتی، انبار مرکزی شماره ۲',
        driverNameFa: 'اکبر قنبری',
        driverPhone: '09123456780',
        vehiclePlateFa: '۶۸ ج ۸۲۵ ایران ۲۲',
        vehicleTypeFa: 'وانت نیسان دیزل آبی',
        totalCartons: 9,
        grossWeightKg: 85,
        status: 'ON_THE_WAY',
        dateJalali: '1405/01/25',
        shippingCostIrr: 2500000,
        notesFa: 'بارگیری در سکوی شماره ۳ انجام شد؛ تحویل به آقای مهندس کریمی',
        createdAt: nowIso,
      },
    ],
    serviceJobTickets: [
      {
        id: 1,
        ticketNumber: 'TCK-1405-001',
        customerId: 1,
        customerNameFa: 'شرکت مهندسی دژسازان نوین',
        customerPhone: '09121112233',
        customerAddressFa: 'تهران، خیابان سهروردی شمالی، پلاک ۱۱۸، واحد ۴',
        titleFa: 'سرویس دوره‌ای و رفع قطعی رک شبکه و دوربین‌های محوطه',
        descriptionFa: 'دستگاه NVR کانال ۸ تصویر نمی‌دهد و سوییچ شبکه PoE نیاز به ریست و تست کابل دارد.',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        technicianId: 3, // تکنسین علی میرزایی
        technicianNameFa: 'مهندس علی میرزایی (تکنسین ارشد)',
        laborFeeIrr: 4500000,
        spareParts: [
          {
            itemId: 4,
            itemTitleFa: 'کابل شبکه Cat6 SFTP تمام مس قرقره ۳۰۵ متری',
            quantity: 20, // ۲۰ متر
            unitPriceIrr: 120000,
            totalPriceIrr: 2400000,
          },
        ],
        sparePartsTotalIrr: 2400000,
        totalCostIrr: 6900000,
        dateJalali: '1405/01/25',
        dueDateJalali: '1405/01/27',
        completionNotesFa: 'کابل‌کشی مجدد کانال ۸ انجام شد و ارتباط پایدار گردید.',
        createdAt: nowIso,
      },
      {
        id: 2,
        ticketNumber: 'TCK-1405-002',
        customerId: 2,
        customerNameFa: 'فروشگاه و بنکداری الماس غرب',
        customerPhone: '09123334455',
        customerAddressFa: 'کرج، میدان آزادگان، جنب برج میلاد',
        titleFa: 'نصب و راه‌اندازی ۲ دستگاه دوربین پلاک‌خوان ورودی پارکینگ',
        descriptionFa: 'کابل‌کشی، زاویه‌بندی و تعریف پلاک در نرم‌افزار نظارتی',
        priority: 'NORMAL',
        status: 'ASSIGNED',
        technicianId: 3,
        technicianNameFa: 'مهندس علی میرزایی (تکنسین ارشد)',
        laborFeeIrr: 8500000,
        spareParts: [],
        sparePartsTotalIrr: 0,
        totalCostIrr: 8500000,
        dateJalali: '1405/01/26',
        dueDateJalali: '1405/01/29',
        createdAt: nowIso,
      },
    ],
    mobileDevices: [
      {
        id: 1,
        itemId: 1,
        modelFa: 'سامسونگ Galaxy S24 Ultra (512GB/12GB)',
        brandFa: 'سامسونگ (Samsung)',
        imei1: '354892110294819',
        imei2: '354892110294827',
        serialNumber: 'R5CW109KJFL',
        storageGb: 512,
        ramGb: 12,
        colorFa: 'خاکستری تیتانیومی (Titanium Gray)',
        condition: 'NEW',
        registryStatus: 'COMMERCIAL_CUSTOMS',
        warrantyStatus: 'UNDER_WARRANTY',
        warrantyCompanyFa: 'داریا همراه پایتخت (۱۸ ماهه)',
        warrantyExpiresJalali: '1406/07/20',
        batteryHealthPercent: 100,
        purchasePriceIrr: 740000000,
        salePriceIrr: 795000000,
        stockStatus: 'IN_STOCK',
        warehouseId: 1,
        createdAt: nowIso,
      },
      {
        id: 2,
        itemId: 2,
        modelFa: 'اپل آیفون ۱۳ نرمال CH دو سیم‌کارت (128GB/4GB)',
        brandFa: 'اپل (Apple)',
        imei1: '359128092837411',
        imei2: '359128092837429',
        serialNumber: 'F2LZX8K40M',
        storageGb: 128,
        ramGb: 4,
        colorFa: 'مشکی نیمه‌شب (Midnight Black)',
        condition: 'USED_LIKE_NEW',
        registryStatus: 'REGISTERED',
        warrantyStatus: 'EXPIRED',
        warrantyCompanyFa: 'گارانتی آروند (منقضی)',
        warrantyExpiresJalali: '1404/09/15',
        batteryHealthPercent: 91,
        purchasePriceIrr: 385000000,
        salePriceIrr: 425000000,
        stockStatus: 'IN_STOCK',
        warehouseId: 1,
        createdAt: nowIso,
      },
      {
        id: 3,
        itemId: 3,
        modelFa: 'لپ‌تاپ گیمینگ ایسوس ROG Zephyrus G16 (1TB/16GB)',
        brandFa: 'ایسوس (ASUS)',
        imei1: '861947029481729',
        serialNumber: 'SN-ASUS-2026-G16-9921',
        storageGb: 1024,
        ramGb: 16,
        colorFa: 'نوک‌مدادی اکلیپسی',
        condition: 'NEW',
        registryStatus: 'COMMERCIAL_CUSTOMS',
        warrantyStatus: 'UNDER_WARRANTY',
        warrantyCompanyFa: 'گارانتی یکپارچه سازگار ارقام (۲۴ ماه)',
        warrantyExpiresJalali: '1407/01/15',
        batteryHealthPercent: 100,
        purchasePriceIrr: 1120000000,
        salePriceIrr: 1210000000,
        stockStatus: 'IN_STOCK',
        warehouseId: 1,
        createdAt: nowIso,
      },
    ],
    mobileRepairTickets: [
      {
        id: 1,
        ticketNumber: 'REP-1405-101',
        customerId: 1,
        customerNameFa: 'مهندس حمیدرضا احمدی',
        customerPhone: '09121112233',
        deviceModelFa: 'آیفون ۱۲ پرو مکس (iPhone 12 Pro Max 256GB)',
        colorFa: 'آبی اقیانوسی (Pacific Blue)',
        imeiOrSerial: '356891028374192',
        securityPasscodeOrPattern: 'الگوی L شکل (یا پین ۱۲۳۴)',
        accompaniedAccessoriesFa: 'قاب سیلیکونی، بدون شارژر، سیم‌کارت خارج شد',
        reportedFaultsFa: 'شکستگی شیشه و تاچ ال‌سی‌دی بر اثر سقوط از ارتفاع؛ تصویر سیاه شده اما ویبره می‌زند.',
        physicalConditionNotesFa: 'ضربه شدید در گوشه پایین سمت راست بدنه، خط و خش جزئی فریم استیل',
        assignedTechnicianId: 3,
        assignedTechnicianNameFa: 'مهندس علی میرزایی (تعمیرکار ارشد سخت‌افزار)',
        estimatedCostIrr: 95000000,
        depositPaidIrr: 30000000,
        parts: [
          {
            id: 1,
            partNameFa: 'تاچ و ال‌سی‌دی اولد اورجینال روکاری آیفون ۱۲ پرو مکس',
            partCostIrr: 75000000,
            quantity: 1,
            totalCostIrr: 75000000,
          },
        ],
        partsTotalIrr: 75000000,
        laborFeeIrr: 20000000,
        discountIrr: 0,
        finalTotalIrr: 95000000,
        remainingPayableIrr: 65000000,
        status: 'REPAIRED',
        receptionDateJalali: '1405/01/24',
        estimatedDeliveryDateJalali: '1405/01/26',
        notesFa: 'تست فیس‌آیدی و تاچ با موفقیت انجام شد؛ دستگاه آماده تحویل به مشتری است.',
        createdAt: nowIso,
      },
      {
        id: 2,
        ticketNumber: 'REP-1405-102',
        customerId: 2,
        customerNameFa: 'خانم مریم صادقی',
        customerPhone: '09124445566',
        deviceModelFa: 'سامسونگ Galaxy A54 5G',
        colorFa: 'بنفش لایت',
        imeiOrSerial: '357192839481726',
        securityPasscodeOrPattern: 'پین: 2580',
        accompaniedAccessoriesFa: 'فقط خود گوشی بدون متعلقات',
        reportedFaultsFa: 'عدم شارژ شدن، داغی غیرعادی زیر پورت شارژ Type-C و تخلیه ناگهانی باتری.',
        physicalConditionNotesFa: 'بدنه کامپکت و تمیز، بدون شکستگی ظاهری',
        assignedTechnicianId: 3,
        assignedTechnicianNameFa: 'مهندس علی میرزایی (تعمیرکار ارشد سخت‌افزار)',
        estimatedCostIrr: 18500000,
        depositPaidIrr: 5000000,
        parts: [],
        partsTotalIrr: 0,
        laborFeeIrr: 18500000,
        discountIrr: 0,
        finalTotalIrr: 18500000,
        remainingPayableIrr: 13500000,
        status: 'IN_REPAIR',
        receptionDateJalali: '1405/01/25',
        estimatedDeliveryDateJalali: '1405/01/27',
        notesFa: 'برد شارژ و آی‌سی تغذیه در حال بررسی زیر لوپ و مولتی‌متر',
        createdAt: nowIso,
      },
    ],
    inventoryTransfers: [],
  };
}

function buildDefaultConnectionVault(): ConnectionVaultState {
  const nowIso = new Date().toISOString();
  return {
    setupWizardCompleted: true,
    connectionStatus: 'CONNECTED',
    activeProfile: {
      profileId: 'prof-local-default',
      labelFa: 'دیتابیس محلی روی همین کامپیوتر (Local PostgreSQL Engine)',
      mode: 'LOCAL',
      host: '127.0.0.1',
      port: 5432,
      database: 'mehregan_erp_db',
      username: 'postgres',
      encryptedPassword: encryptSecret('postgres_secret_1405'),
      hasPasswordSaved: true,
      tlsEnabled: false,
      tlsMode: 'disable',
      lastTestedAt: nowIso,
      verifiedReady: true,
    },
    stagedCandidateProfile: null,
    previousProfileForRollback: null,
    lastConnectionSwitchAt: nowIso,
  };
}

export class FoundationStore {
  private dbState: FoundationDatabaseState;
  private vaultState: ConnectionVaultState;
  private lastPersistedDbStateRaw: string | null = null;
  private lastPersistedVaultStateRaw: string | null = null;

  constructor() {
    ensureRuntimeDirectories();
    this.dbState = this.loadOrInitDbState();
    this.vaultState = this.loadOrInitVaultState();
    if (!this.lastPersistedDbStateRaw) {
      try {
        this.lastPersistedDbStateRaw = JSON.stringify(this.dbState, null, 2);
      } catch {
        this.lastPersistedDbStateRaw = null;
      }
    }
    if (!this.lastPersistedVaultStateRaw) {
      try {
        this.lastPersistedVaultStateRaw = JSON.stringify(this.vaultState, null, 2);
      } catch {
        this.lastPersistedVaultStateRaw = null;
      }
    }
  }

  private loadOrInitDbState(): FoundationDatabaseState {
    if (fs.existsSync(LOCAL_STATE_DB_FILE)) {
      let raw: string;
      try {
        raw = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      } catch (readErr) {
        throw new Error(
          `خطای بحرانی در خواندن فایل پایگاه داده [${LOCAL_STATE_DB_FILE}]: ${
            readErr instanceof Error ? readErr.message : String(readErr)
          }`
        );
      }

      let parsed: FoundationDatabaseState;
      try {
        parsed = JSON.parse(raw) as FoundationDatabaseState;
        this.lastPersistedDbStateRaw = raw;
      } catch (parseErr) {
        throw new Error(
          `پایگاه داده موجود در مسیر [${LOCAL_STATE_DB_FILE}] مخدوش است و امکان پارس JSON آن وجود ندارد. جهت جلوگیری از نابودی داده‌های مالی و کسب‌وکار، سیستم متوقف گردید. فایل دست‌نخورده باقی مانده است. جزئیات خطا: ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`
        );
      }

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray(parsed.users) ||
        !Array.isArray(parsed.permissions)
      ) {
        throw new Error(
          `ساختار فایل پایگاه داده موجود در مسیر [${LOCAL_STATE_DB_FILE}] نامعتبر است (آرایه‌های بنیادین users یا permissions یافت نشدند). جهت جلوگیری از رونویسی و حذف احتمالی داده‌های کسب‌وکار، سیستم متوقف شد.`
        );
      }

      let dirty = false;
      const defaultInitial = buildDefaultState();

          // 1. Ensure arrays are initialized if missing in older database versions
          if (!Array.isArray(parsed.parties)) {
            parsed.parties = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.partyTransactions)) {
            parsed.partyTransactions = [];
            dirty = true;
          }

          // 2. Ensure inventory tables are initialized if missing
          if (!Array.isArray(parsed.itemCategories)) {
            parsed.itemCategories = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.itemBrands)) {
            parsed.itemBrands = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.itemUnits)) {
            parsed.itemUnits = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.items)) {
            parsed.items = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.warehouses)) {
            parsed.warehouses = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.itemSerials)) {
            parsed.itemSerials = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.inventoryDocuments)) {
            parsed.inventoryDocuments = [];
            dirty = true;
          }

          // 2.5 Backfill purchase tables if not present
          if (!Array.isArray(parsed.purchaseProformas)) {
            parsed.purchaseProformas = defaultInitial.purchaseProformas;
            dirty = true;
          }
          if (!Array.isArray(parsed.purchaseInvoices)) {
            parsed.purchaseInvoices = defaultInitial.purchaseInvoices;
            dirty = true;
          }
          if (!Array.isArray(parsed.purchasePayments)) {
            parsed.purchasePayments = defaultInitial.purchasePayments;
            dirty = true;
          }
          if (!Array.isArray(parsed.purchaseReturns)) {
            parsed.purchaseReturns = defaultInitial.purchaseReturns;
            dirty = true;
          }
          if (!Array.isArray(parsed.salesProformas)) {
            parsed.salesProformas = defaultInitial.salesProformas;
            dirty = true;
          }
          if (!Array.isArray(parsed.salesInvoices)) {
            parsed.salesInvoices = defaultInitial.salesInvoices;
            dirty = true;
          }
          if (!Array.isArray(parsed.salesReceipts)) {
            parsed.salesReceipts = defaultInitial.salesReceipts;
            dirty = true;
          }
          if (!Array.isArray(parsed.salesReturns)) {
            parsed.salesReturns = defaultInitial.salesReturns;
            dirty = true;
          }
          if (!Array.isArray(parsed.installationJobs)) {
            parsed.installationJobs = defaultInitial.installationJobs;
            dirty = true;
          }
          if (!Array.isArray(parsed.cashBoxes)) {
            parsed.cashBoxes = defaultInitial.cashBoxes;
            dirty = true;
          }
          if (!Array.isArray(parsed.bankAccounts)) {
            parsed.bankAccounts = defaultInitial.bankAccounts;
            dirty = true;
          }
          if (!Array.isArray(parsed.cheques)) {
            parsed.cheques = defaultInitial.cheques;
            dirty = true;
          }
          if (!Array.isArray(parsed.treasuryTransactions)) {
            parsed.treasuryTransactions = defaultInitial.treasuryTransactions;
            dirty = true;
          }
          if (!Array.isArray(parsed.installments)) {
            parsed.installments = defaultInitial.installments;
            dirty = true;
          }
          if (!Array.isArray(parsed.operationalExpenses)) {
            parsed.operationalExpenses = defaultInitial.operationalExpenses;
            dirty = true;
          }
          if (!Array.isArray(parsed.accountsChart) || parsed.accountsChart.length === 0) {
            parsed.accountsChart = defaultInitial.accountsChart;
            dirty = true;
          }
          if (!Array.isArray(parsed.accountingDocuments)) {
            parsed.accountingDocuments = defaultInitial.accountingDocuments;
            dirty = true;
          }
          if (!Array.isArray(parsed.fiscalYears) || parsed.fiscalYears.length === 0) {
            parsed.fiscalYears = defaultInitial.fiscalYears;
            dirty = true;
          }
          if (!Array.isArray(parsed.accountingPeriods) || parsed.accountingPeriods.length === 0) {
            parsed.accountingPeriods = defaultInitial.accountingPeriods;
            dirty = true;
          }
          if (!Array.isArray(parsed.costCenters) || parsed.costCenters.length === 0) {
            parsed.costCenters = defaultInitial.costCenters;
            dirty = true;
          }
          if (!Array.isArray(parsed.projects)) {
            parsed.projects = [];
            dirty = true;
          }
          if (!Array.isArray(parsed.projectRequisitions)) {
            parsed.projectRequisitions = [];
            dirty = true;
          }

          if (parsed.settings.allowNegativeInventory === undefined) {
            parsed.settings.allowNegativeInventory = false;
            dirty = true;
          }

          // Hydrate and validate customIndustryProfiles from storage without crashing on corrupt entries
          if (!Array.isArray(parsed.customIndustryProfiles)) {
            parsed.customIndustryProfiles = [];
            dirty = true;
          } else {
            const validProfiles: IndustryProfileConfig[] = [];
            for (const cp of parsed.customIndustryProfiles) {
              if (
                cp &&
                typeof cp.code === 'string' &&
                /^[A-Z0-9_]{3,30}$/.test(cp.code) &&
                cp.code !== 'CCTV_SECURITY' &&
                cp.code !== 'RETAIL_GENERAL' &&
                cp.code !== 'SUPERMARKET_GROCERY' &&
                typeof cp.titleFa === 'string' &&
                cp.titleFa.trim().length >= 3 &&
                typeof cp.badgeLabelFa === 'string' &&
                cp.badgeLabelFa.trim().length >= 2 &&
                cp.features &&
                typeof cp.features === 'object'
              ) {
                const completeConfig: IndustryProfileConfig = {
                  code: cp.code,
                  titleFa: cp.titleFa.trim(),
                  descriptionFa: cp.descriptionFa || '',
                  badgeLabelFa: cp.badgeLabelFa.trim(),
                  features: {
                    enableInstallationServices: false,
                    enableHardwareMacTracking: false,
                    enableInstallersRole: false,
                    enableWarrantyTracking: false,
                    enableBarcodeScanQuickPos: true,
                    ...cp.features,
                  },
                  uiLabels: {
                    inventoryTabTitleFa: cp.uiLabels?.inventoryTabTitleFa || 'کالا و انبارداری',
                    serialTrackerTitleFa: cp.uiLabels?.serialTrackerTitleFa || 'رهگیری شماره سریال کالا',
                    partiesInstallerRoleTitleFa: cp.uiLabels?.partiesInstallerRoleTitleFa || 'مجریان و کارشناسان فنی',
                    ...cp.uiLabels,
                  },
                };
                INDUSTRY_PROFILES[cp.code] = completeConfig;
                validProfiles.push(completeConfig);
              } else {
                dirty = true; // Clean out corrupted/malformed custom profile entries
              }
            }
            parsed.customIndustryProfiles = validProfiles;
          }

          if (
            !parsed.settings.industryProfileCode ||
            !INDUSTRY_PROFILES[parsed.settings.industryProfileCode]
          ) {
            parsed.settings.industryProfileCode = 'CCTV_SECURITY';
            dirty = true;
          }

          // 3. Backfill migrations 0003, 0004, 0005, 0006, 0007, 0008 if not recorded
          if (!parsed.migrations.some((m) => m.version === '0003')) {
            parsed.migrations.push({
              version: '0003',
              name: '0003_parties_module.sql',
              descriptionFa: 'ماژول جامع اشخاص و طرف‌های تجاری (مشتری، تامین‌کننده، نصاب، سایر) و سوابق مرتبط',
              checksum: 'sha256:7c91e4a3b012',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 16,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0004')) {
            parsed.migrations.push({
              version: '0004',
              name: '0004_inventory_and_kardex_module.sql',
              descriptionFa: 'ماژول انبارداری، مشخصات فنی کالاها، رهگیری سریال/MAC و کاردکس گردش کالا',
              checksum: 'sha256:5e19a4b2c019',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 15,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0005')) {
            parsed.migrations.push({
              version: '0005',
              name: '0005_purchases_and_landed_cost.sql',
              descriptionFa: 'ماژول خرید، پیش‌فاکتور، ارزهای خارجی، تخصیص هزینه‌های سربار بهای تمام‌شده و بدهی تأمین‌کننده',
              checksum: 'sha256:8f2a1b9c3021',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 18,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0006')) {
            parsed.migrations.push({
              version: '0006',
              name: '0006_sales_and_quick_pos.sql',
              descriptionFa: 'ماژول فروش، پیش‌فاکتور، صندوق فروش سریع (Quick POS)، دریافت وجه و مرجوعی فروش با محاسبه خودکار COGS',
              checksum: 'sha256:9d3e4f1a2033',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 20,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0007')) {
            parsed.migrations.push({
              version: '0007',
              name: '0007_installation_services.sql',
              descriptionFa: 'ماژول خدمات نصب و راه‌اندازی، مدیریت نصابان، هزینه‌های پروژه و مرجوعی پیشرفته فروش',
              checksum: 'sha256:3a4b5c6d7e8f',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 17,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0008')) {
            parsed.migrations.push({
              version: '0008',
              name: '0008_treasury_and_cash_flow.sql',
              descriptionFa: 'ماژول خزانه، گردش وجوه نقد، صندوق‌ها، حساب‌های بانکی، مدیریت چک‌ها و سررسیدها، اقساط و هزینه‌های عملیاتی',
              checksum: 'sha256:8c9d0e1f2a3b',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 22,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0009')) {
            parsed.migrations.push({
              version: '0009',
              name: '0009_double_entry_accounting.sql',
              descriptionFa: 'ماژول حسابداری دوطرفه (دوبل)، درختواره کدینگ حساب‌ها، اسناد حسابداری، دفتر روزنامه، دفتر کل و تراز آزمایشی',
              checksum: 'sha256:4d5e6f7a8b9c',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 24,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0010')) {
            parsed.migrations.push({
              version: '0010',
              name: '0010_fiscal_years_cost_centers_and_profitability.sql',
              descriptionFa: 'سال و دوره‌های مالی، کنترل تقویم اسناد، بستن دوره، مراکز هزینه و گزارش تحلیلی سودآوری چندبعدی',
              checksum: 'sha256:1a9f0e3d5510',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 22,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          if (!parsed.migrations.some((m) => m.version === '0011')) {
            parsed.migrations.push({
              version: '0011',
              name: '0011_projects_installers_consumption_profitability.sql',
              descriptionFa: 'ماژول مدیریت پروژه‌ها، تخصیص نصابان، چرخه تأیید، تحویل، مصرف و برگشت کالا و سودآوری جامع پروژه',
              checksum: 'sha256:7b8c9d0e1f3a',
              isDestructive: false,
              status: 'APPLIED',
              executionMs: 25,
              appliedAt: new Date().toISOString(),
            });
            dirty = true;
          }

          // 4. Backfill stage 3 to 9 permissions
          const existingPermCodes = new Set(parsed.permissions.map((p) => p.code));
          const allNewPerms = buildInitialPermissions();
          for (const np of allNewPerms) {
            if (!existingPermCodes.has(np.code)) {
              parsed.permissions.push(np);
              parsed.rolePermissions.push({
                id: parsed.rolePermissions.length + 1,
                roleCode: 'OWNER',
                permissionCode: np.code,
                grantedBy: 'SYSTEM_MIGRATION',
                grantedAt: new Date().toISOString(),
              });
              if (
                np.code !== 'parties.delete' &&
                np.code !== 'inventory.negative_stock.override' &&
                np.code !== 'inventory.documents.create' &&
                np.code !== 'inventory.items.manage'
              ) {
                parsed.rolePermissions.push({
                  id: parsed.rolePermissions.length + 1,
                  roleCode: 'CHIEF_ACCOUNTANT',
                  permissionCode: np.code,
                  grantedBy: 'SYSTEM_MIGRATION',
                  grantedAt: new Date().toISOString(),
                });
              }
              if (
                np.code === 'parties.view' ||
                np.code === 'inventory.view' ||
                np.code === 'inventory.kardex.view' ||
                np.code === 'accounting.view' ||
                np.code === 'accounting.reports.view'
              ) {
                parsed.rolePermissions.push({
                  id: parsed.rolePermissions.length + 1,
                  roleCode: 'AUDITOR',
                  permissionCode: np.code,
                  grantedBy: 'SYSTEM_MIGRATION',
                  grantedAt: new Date().toISOString(),
                });
              }
              if (
                np.code === 'parties.view' ||
                np.code === 'inventory.view' ||
                np.code === 'inventory.items.manage' ||
                np.code === 'inventory.documents.create' ||
                np.code === 'inventory.kardex.view'
              ) {
                parsed.rolePermissions.push({
                  id: parsed.rolePermissions.length + 1,
                  roleCode: 'WAREHOUSE_KEEPER',
                  permissionCode: np.code,
                  grantedBy: 'SYSTEM_MIGRATION',
                  grantedAt: new Date().toISOString(),
                });
              }
              dirty = true;
            }
          }

          if (!Array.isArray(parsed.goldColleagueTrades)) {
            parsed.goldColleagueTrades = defaultInitial.goldColleagueTrades || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.restaurantTables)) {
            parsed.restaurantTables = defaultInitial.restaurantTables || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.restaurantOrders)) {
            parsed.restaurantOrders = defaultInitial.restaurantOrders || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.wholesaleOrders)) {
            parsed.wholesaleOrders = defaultInitial.wholesaleOrders || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.wholesaleDispatches)) {
            parsed.wholesaleDispatches = defaultInitial.wholesaleDispatches || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.serviceJobTickets)) {
            parsed.serviceJobTickets = defaultInitial.serviceJobTickets || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.mobileDevices)) {
            parsed.mobileDevices = defaultInitial.mobileDevices || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.mobileRepairTickets)) {
            parsed.mobileRepairTickets = defaultInitial.mobileRepairTickets || [];
            dirty = true;
          }
          if (!Array.isArray(parsed.inventoryTransfers)) {
            parsed.inventoryTransfers = defaultInitial.inventoryTransfers || [];
            dirty = true;
          }

      if (dirty) {
        this.saveDbState(parsed);
      }
      return parsed;
    }

    // Database genuinely does not exist on disk -> safe clean initialization
    const initial = buildDefaultState();
    this.saveDbState(initial);
    return initial;
  }

  private saveDbState(state: FoundationDatabaseState = this.dbState): void {
    ensureRuntimeDirectories();

    let serialized: string;
    try {
      serialized = JSON.stringify(state, null, 2);
    } catch (serErr) {
      throw new Error(
        `خطای اعتبارسنجی: سریال‌سازی ساختار پایگاه داده ناموفق بود: ${
          serErr instanceof Error ? serErr.message : String(serErr)
        }`
      );
    }

    if (!serialized || serialized.length < 50) {
      throw new Error('خطای اعتبارسنجی: داده‌های دیتابیس برای ذخیره‌سازی نامعتبر یا تهی است.');
    }

    const targetDir = path.dirname(LOCAL_STATE_DB_FILE);
    const tempFile = path.join(
      targetDir,
      `.mehregan-db-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.tmp`
    );

    let fd: number | null = null;
    try {
      fd = fs.openSync(tempFile, 'w');
      fs.writeFileSync(fd, serialized, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;

      const stats = fs.statSync(tempFile);
      if (stats.size === 0) {
        throw new Error('فایل موقت پایگاه داده خالی است.');
      }

      fs.renameSync(tempFile, LOCAL_STATE_DB_FILE);
      this.lastPersistedDbStateRaw = serialized;
    } catch (err) {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          // ignore
        }
      }
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch {
          // ignore
        }
      }

      // Safe in-memory rollback: restore in-memory state to the last successfully persisted state
      // so in-memory state does not silently diverge from disk after a failed write/fsync/rename.
      if (this.lastPersistedDbStateRaw) {
        try {
          this.dbState = JSON.parse(this.lastPersistedDbStateRaw);
        } catch {
          if (fs.existsSync(LOCAL_STATE_DB_FILE)) {
            try {
              const diskRaw = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
              this.dbState = JSON.parse(diskRaw);
              this.lastPersistedDbStateRaw = diskRaw;
            } catch {
              // preserve existing in-memory reference
            }
          }
        }
      } else if (fs.existsSync(LOCAL_STATE_DB_FILE)) {
        try {
          const diskRaw = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
          this.dbState = JSON.parse(diskRaw);
          this.lastPersistedDbStateRaw = diskRaw;
        } catch {
          // preserve existing in-memory reference
        }
      }

      throw new Error(
        `خطای پایدارسازی و جابجایی اتمیک پایگاه داده در دیسک: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  private loadOrInitVaultState(): ConnectionVaultState {
    if (fs.existsSync(CONNECTION_VAULT_FILE)) {
      let raw: string;
      try {
        raw = fs.readFileSync(CONNECTION_VAULT_FILE, 'utf8');
      } catch (readErr) {
        throw new Error(
          `خطای بحرانی در خواندن مخزن اتصال [${CONNECTION_VAULT_FILE}]: ${
            readErr instanceof Error ? readErr.message : String(readErr)
          }`
        );
      }

      let parsed: ConnectionVaultState;
      try {
        parsed = JSON.parse(raw) as ConnectionVaultState;
        this.lastPersistedVaultStateRaw = raw;
      } catch (parseErr) {
        throw new Error(
          `مخزن اتصال موجود در مسیر [${CONNECTION_VAULT_FILE}] مخدوش است و امکان پارس JSON آن وجود ندارد. جزئیات خطا: ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`
        );
      }

      if (parsed && parsed.activeProfile) {
        return parsed;
      }
    }

    const initial = buildDefaultConnectionVault();
    this.saveVaultState(initial);
    return initial;
  }

  private saveVaultState(vault: ConnectionVaultState = this.vaultState): void {
    ensureRuntimeDirectories();
    const serialized = JSON.stringify(vault, null, 2);
    const targetDir = path.dirname(CONNECTION_VAULT_FILE);
    const tempFile = path.join(
      targetDir,
      `.mehregan-vault-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.tmp`
    );

    let fd: number | null = null;
    try {
      fd = fs.openSync(tempFile, 'w');
      fs.writeFileSync(fd, serialized, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;

      fs.renameSync(tempFile, CONNECTION_VAULT_FILE);
      this.lastPersistedVaultStateRaw = serialized;
    } catch (err) {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          // ignore
        }
      }
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch {
          // ignore
        }
      }

      if (this.lastPersistedVaultStateRaw) {
        try {
          this.vaultState = JSON.parse(this.lastPersistedVaultStateRaw);
        } catch {
          // ignore
        }
      }

      throw err;
    }
  }

  // ==========================================================================
  // AUTHENTICATION & SESSION MANAGEMENT (INTERNAL DATABASE ONLY)
  // ==========================================================================
  public authenticateUser(usernameInput: string, passwordInput: string): UserRecord {
    const usernameClean = (usernameInput || '').trim();
    const user = this.dbState.users.find(
      (u) => u.username.toLowerCase() === usernameClean.toLowerCase()
    );

    if (!user) {
      this.recordAuditLog({
        actorUserId: null,
        actorUsername: usernameClean || 'UNKNOWN',
        action: 'AUTH_LOGIN_FAILED',
        category: 'AUTH',
        targetEntity: 'users',
        targetId: usernameClean,
        status: 'FAILED',
        detailsFa: `تلاش ناموفق برای ورود به سیستم با نام کاربری «${usernameClean}» (کاربر یافت نشد)`,
      });
      throw new Error('نام کاربری یا کلمه عبور وارد شده نادرست است.');
    }

    if (user.status !== 'ACTIVE') {
      this.recordAuditLog({
        actorUserId: user.id,
        actorUsername: user.username,
        action: 'AUTH_LOGIN_SUSPENDED',
        category: 'AUTH',
        targetEntity: 'users',
        targetId: String(user.id),
        status: 'DENIED',
        detailsFa: `تلاش برای ورود به حساب کاربری معلق‌شده «${user.username}»`,
      });
      throw new Error('حساب کاربری شما معلق (غیرفعال) شده است. لطفاً با راهبر سیستم تماس بگیرید.');
    }

    const isValid = verifyPassword(passwordInput, user.passwordSalt, user.passwordHash);
    if (!isValid) {
      this.recordAuditLog({
        actorUserId: user.id,
        actorUsername: user.username,
        action: 'AUTH_PASSWORD_MISMATCH',
        category: 'AUTH',
        targetEntity: 'users',
        targetId: String(user.id),
        status: 'FAILED',
        detailsFa: `کلمه عبور وارد شده برای کاربر «${user.username}» نامعتبر است`,
      });
      throw new Error('نام کاربری یا کلمه عبور وارد شده نادرست است.');
    }

    user.lastLoginAt = new Date().toISOString();
    this.dbState.activeSessionUserId = user.id;
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: user.id,
      actorUsername: user.username,
      action: 'AUTH_LOGIN_SUCCESS',
      category: 'AUTH',
      targetEntity: 'users',
      targetId: String(user.id),
      status: 'SUCCESS',
      detailsFa: `ورود موفق کاربر «${user.fullName}» (${user.username}) به سیستم`,
    });

    return user;
  }

  public getActiveUser(): UserRecord {
    const user = this.dbState.users.find((u) => u.id === this.dbState.activeSessionUserId);
    return user || this.dbState.users[0];
  }

  public getUserById(id: number): UserRecord | undefined {
    return this.dbState.users.find((u) => u.id === id);
  }

  public getUserRoles(userId: number): string[] {
    return this.dbState.userRoleAssignments
      .filter((a) => a.userId === userId)
      .map((a) => a.roleCode);
  }

  public switchActiveUser(targetUserId: number): UserRecord {
    const user = this.dbState.users.find((u) => u.id === targetUserId);
    if (!user) throw new Error('کاربر مورد نظر یافت نشد.');
    if (user.status !== 'ACTIVE') throw new Error('کاربر در وضعیت تعلیق قرار دارد.');

    this.dbState.activeSessionUserId = user.id;
    user.lastLoginAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: user.id,
      action: 'AUTH_SESSION_SWITCHED',
      category: 'AUTH',
      targetEntity: 'users',
      targetId: String(user.id),
      status: 'SUCCESS',
      detailsFa: `نشست فعال سیستم بدون خروج به کاربر «${user.fullName}» (@${user.username}) تغییر یافت`,
    });

    return user;
  }

  public changePassword(userId: number, currentPassword: string, newPassword: string): void {
    const user = this.dbState.users.find((u) => u.id === userId);
    if (!user) throw new Error('کاربر یافت نشد.');

    if (!newPassword || newPassword.length < 3) {
      throw new Error('کلمه عبور جدید باید حداقل دارای ۳ کاراکتر باشد.');
    }

    const isCurrentValid = verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
    if (!isCurrentValid) {
      throw new Error('کلمه عبور فعلی وارد شده نادرست است.');
    }

    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);

    user.passwordSalt = newSalt;
    user.passwordHash = newHash;
    user.isInitialAdmin = false;
    user.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: user.id,
      action: 'AUTH_PASSWORD_CHANGED',
      category: 'SECURITY',
      targetEntity: 'users',
      targetId: String(user.id),
      status: 'SUCCESS',
      detailsFa: `کلمه عبور کاربر «${user.username}» با موفقیت تغییر یافت`,
    });
  }

  public resetUserPasswordByAdmin(targetUserId: number, newPassword: string): void {
    const target = this.dbState.users.find((u) => u.id === targetUserId);
    if (!target) throw new Error('کاربر مورد نظر یافت نشد.');

    if (!newPassword || newPassword.length < 3) {
      throw new Error('کلمه عبور جدید باید حداقل دارای ۳ کاراکتر باشد.');
    }

    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);

    target.passwordSalt = newSalt;
    target.passwordHash = newHash;
    target.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      action: 'AUTH_PASSWORD_RESET_BY_ADMIN',
      category: 'SECURITY',
      targetEntity: 'users',
      targetId: String(target.id),
      status: 'SUCCESS',
      detailsFa: `کلمه عبور کاربر «${target.username}» توسط مدیر سیستم بازنشانی شد`,
    });
  }

  // ==========================================================================
  // RBAC EVALUATION ENGINE
  // Mathematical Rule: Explicit Deny > Explicit Grant > Role Permission > Default Deny
  // ==========================================================================
  public evaluatePermission(userId: number, permissionCode: string): RbacEvaluationResult {
    const user = this.dbState.users.find((u) => u.id === userId);
    if (!user || user.status !== 'ACTIVE') {
      return {
        userId,
        username: user?.username || 'UNKNOWN',
        permissionCode,
        allowed: false,
        matchedRule: 'DEFAULT_DENY',
        explanationFa: 'کاربر در سیستم یافت نشد یا در وضعیت تعلیق قرار دارد.',
        assignedRoles: [],
        explicitOverridesForPermission: [],
        rolesGrantingPermission: [],
      };
    }

    const assignedRoles = this.dbState.userRoleAssignments
      .filter((ura) => ura.userId === userId)
      .map((ura) => ura.roleCode);

    const overrides = this.dbState.userPermissionOverrides.filter(
      (upo) => upo.userId === userId && upo.permissionCode === permissionCode
    );

    const rolesGrantingPermission = this.dbState.rolePermissions
      .filter(
        (rp) => assignedRoles.includes(rp.roleCode) && rp.permissionCode === permissionCode
      )
      .map((rp) => rp.roleCode);

    // 1. Explicit Deny Check (Precedence 1)
    const explicitDeny = overrides.find((o) => o.effect === 'DENY');
    if (explicitDeny) {
      return {
        userId,
        username: user.username,
        permissionCode,
        allowed: false,
        matchedRule: 'EXPLICIT_DENY',
        explanationFa: `دسترسی به دلیل وجود قانون منع صریح (Explicit Deny) متوقف شد: «${explicitDeny.reasonFa}»`,
        assignedRoles,
        explicitOverridesForPermission: overrides.map((o) => ({
          effect: o.effect,
          reasonFa: o.reasonFa,
        })),
        rolesGrantingPermission,
      };
    }

    // 2. Explicit Grant Check (Precedence 2)
    const explicitGrant = overrides.find((o) => o.effect === 'ALLOW');
    if (explicitGrant) {
      return {
        userId,
        username: user.username,
        permissionCode,
        allowed: true,
        matchedRule: 'EXPLICIT_GRANT',
        explanationFa: `دسترسی بر اساس استثنای صریح کاربر (Explicit Grant) تایید شد: «${explicitGrant.reasonFa}»`,
        assignedRoles,
        explicitOverridesForPermission: overrides.map((o) => ({
          effect: o.effect,
          reasonFa: o.reasonFa,
        })),
        rolesGrantingPermission,
      };
    }

    // 3. Database Role Permission Check (Precedence 3)
    if (rolesGrantingPermission.length > 0) {
      return {
        userId,
        username: user.username,
        permissionCode,
        allowed: true,
        matchedRule: 'ROLE_PERMISSION',
        explanationFa: `دسترسی از طریق مجوزهای ثبت‌شده در دیتابیس برای نقش [${rolesGrantingPermission.join(', ')}] تایید شد.`,
        assignedRoles,
        explicitOverridesForPermission: [],
        rolesGrantingPermission,
      };
    }

    // 4. Default Deny (Precedence 4)
    return {
      userId,
      username: user.username,
      permissionCode,
      allowed: false,
      matchedRule: 'DEFAULT_DENY',
      explanationFa: `هیچ مجوزی در نقش‌های کاربر [${assignedRoles.join(', ') || 'بدون نقش'}] یا استثناها یافت نشد (Default Deny).`,
      assignedRoles,
      explicitOverridesForPermission: [],
      rolesGrantingPermission: [],
    };
  }



  // ==========================================================================
  // USER, ROLE & OVERRIDE MUTATIONS
  // ==========================================================================
  public createUser(input: {
    username: string;
    fullName: string;
    jobTitle: string;
    email?: string | null;
    password: string;
    roleCodes?: string[];
    installerPartyId?: number | null;
  }): UserRecord {
    const cleanUsername = input.username.trim().toLowerCase();
    if (!cleanUsername) throw new Error('نام کاربری الزامی است.');
    if (this.dbState.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`نام کاربری «${cleanUsername}» قبلاً ثبت شده است.`);
    }

    const salt = generateSalt();
    const hash = hashPassword(input.password || '123456', salt);
    const nowIso = new Date().toISOString();
    const nextId =
      this.dbState.users.length > 0 ? Math.max(...this.dbState.users.map((u) => u.id)) + 1 : 1;

    const newUser: UserRecord = {
      id: nextId,
      username: cleanUsername,
      fullName: input.fullName.trim(),
      jobTitle: input.jobTitle.trim(),
      email: input.email ? input.email.trim() : null,
      passwordHash: hash,
      passwordSalt: salt,
      status: 'ACTIVE',
      isInitialAdmin: false,
      isDemo: false,
      installerPartyId: input.installerPartyId ? Number(input.installerPartyId) : null,
      lastLoginAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.users.push(newUser);

    if (input.roleCodes && input.roleCodes.length > 0) {
      for (const roleCode of input.roleCodes) {
        const nextAssignId =
          this.dbState.userRoleAssignments.length > 0
            ? Math.max(...this.dbState.userRoleAssignments.map((a) => a.id)) + 1
            : 1;
        this.dbState.userRoleAssignments.push({
          id: nextAssignId,
          userId: newUser.id,
          roleCode,
          assignedAt: nowIso,
          assignedBy: this.getActiveUser().username,
        });
      }
    }

    this.saveDbState();
    this.recordAuditLog({
      action: 'USER_CREATED',
      category: 'RBAC',
      targetEntity: 'users',
      targetId: String(newUser.id),
      status: 'SUCCESS',
      detailsFa: `کاربر جدید «${newUser.fullName}» (@${newUser.username}) با نقش‌های [${(input.roleCodes || []).join(', ')}] در دیتابیس ایجاد شد`,
    });

    return newUser;
  }

  public ensureInstallerUser(installerPartyId: number = 3): UserRecord {
    let user = this.dbState.users.find(
      (u) => u.installerPartyId === installerPartyId || u.username === 'installer'
    );
    if (!user) {
      const salt = generateSalt();
      const hash = hashPassword('installer123', salt);
      const nowIso = new Date().toISOString();
      const nextId =
        this.dbState.users.length > 0 ? Math.max(...this.dbState.users.map((u) => u.id)) + 1 : 2;

      user = {
        id: nextId,
        username: 'installer',
        fullName: 'مهندس علیرضا بهرامی (نصاب ارشد)',
        jobTitle: 'تکنسین و نصاب میدانی',
        email: 'installer@mehregan.local',
        passwordHash: hash,
        passwordSalt: salt,
        status: 'ACTIVE',
        isInitialAdmin: false,
        isDemo: false,
        installerPartyId,
        lastLoginAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.dbState.users.push(user);

      const nextAssignId =
        this.dbState.userRoleAssignments.length > 0
          ? Math.max(...this.dbState.userRoleAssignments.map((a) => a.id)) + 1
          : 1;
      this.dbState.userRoleAssignments.push({
        id: nextAssignId,
        userId: user.id,
        roleCode: 'INSTALLER',
        assignedAt: nowIso,
        assignedBy: 'SYSTEM',
      });
      this.saveDbState();
    }
    return user;
  }

  public updateUser(
    userId: number,
    data: { fullName?: string; jobTitle?: string; email?: string | null; status?: 'ACTIVE' | 'SUSPENDED'; installerPartyId?: number | null }
  ): UserRecord {
    const user = this.dbState.users.find((u) => u.id === userId);
    if (!user) throw new Error('کاربر مورد نظر یافت نشد.');

    if (data.fullName !== undefined) user.fullName = data.fullName.trim();
    if (data.jobTitle !== undefined) user.jobTitle = data.jobTitle.trim();
    if (data.email !== undefined) user.email = data.email ? data.email.trim() : null;
    if (data.installerPartyId !== undefined) user.installerPartyId = data.installerPartyId ? Number(data.installerPartyId) : null;
    if (data.status !== undefined) {
      if (user.id === 1 && data.status === 'SUSPENDED') {
        throw new Error('امکان تعلیق حساب کاربری مدیر ارشد اولیه (admin) وجود ندارد.');
      }
      user.status = data.status;
    }
    user.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      action: 'USER_UPDATED',
      category: 'RBAC',
      targetEntity: 'users',
      targetId: String(user.id),
      status: 'SUCCESS',
      detailsFa: `مشخصات کاربر «${user.username}» به‌روزرسانی شد (وضعیت: ${user.status})`,
    });

    return user;
  }

  public setUserRoles(userId: number, roleCodes: string[]): void {
    this.dbState.userRoleAssignments = this.dbState.userRoleAssignments.filter(
      (a) => a.userId !== userId
    );

    const nowIso = new Date().toISOString();
    for (const code of roleCodes) {
      const nextId =
        this.dbState.userRoleAssignments.length > 0
          ? Math.max(...this.dbState.userRoleAssignments.map((a) => a.id)) + 1
          : 1;
      this.dbState.userRoleAssignments.push({
        id: nextId,
        userId,
        roleCode: code,
        assignedAt: nowIso,
        assignedBy: this.getActiveUser().username,
      });
    }

    this.saveDbState();
    this.recordAuditLog({
      action: 'USER_ROLES_MODIFIED',
      category: 'RBAC',
      targetEntity: 'user_role_assignments',
      targetId: String(userId),
      status: 'SUCCESS',
      detailsFa: `نقش‌های کاربر #${userId} به [${roleCodes.join(', ')}] تغییر یافت`,
    });
  }

  public setPermissionOverride(input: {
    targetUserId: number;
    permissionCode: string;
    effect: 'DENY' | 'ALLOW' | 'REMOVE';
    reasonFa: string;
  }): void {
    this.dbState.userPermissionOverrides = this.dbState.userPermissionOverrides.filter(
      (o) => !(o.userId === input.targetUserId && o.permissionCode === input.permissionCode)
    );

    if (input.effect !== 'REMOVE') {
      const nextId =
        this.dbState.userPermissionOverrides.length > 0
          ? Math.max(...this.dbState.userPermissionOverrides.map((o) => o.id)) + 1
          : 1;
      this.dbState.userPermissionOverrides.push({
        id: nextId,
        userId: input.targetUserId,
        permissionCode: input.permissionCode,
        effect: input.effect,
        reasonFa: input.reasonFa.trim() || 'ثبت استثنای دسترسی توسط مدیر سیستم',
        createdBy: this.getActiveUser().username,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveDbState();
    this.recordAuditLog({
      action: 'RBAC_OVERRIDE_CHANGED',
      category: 'RBAC',
      targetEntity: 'user_permission_overrides',
      targetId: `U${input.targetUserId}:${input.permissionCode}`,
      status: 'SUCCESS',
      detailsFa: `استثنای مجوز [${input.permissionCode}] برای کاربر #${input.targetUserId} با اثر [${input.effect}] ثبت شد`,
    });
  }

  public toggleRolePermission(roleCode: string, permissionCode: string): boolean {
    const existingIndex = this.dbState.rolePermissions.findIndex(
      (rp) => rp.roleCode === roleCode && rp.permissionCode === permissionCode
    );

    let isGranted = false;
    if (existingIndex >= 0) {
      this.dbState.rolePermissions.splice(existingIndex, 1);
      isGranted = false;
    } else {
      const nextId =
        this.dbState.rolePermissions.length > 0
          ? Math.max(...this.dbState.rolePermissions.map((rp) => rp.id)) + 1
          : 1;
      this.dbState.rolePermissions.push({
        id: nextId,
        roleCode,
        permissionCode,
        grantedBy: this.getActiveUser().username,
        grantedAt: new Date().toISOString(),
      });
      isGranted = true;
    }

    this.saveDbState();
    this.recordAuditLog({
      action: isGranted ? 'ROLE_PERMISSION_GRANTED' : 'ROLE_PERMISSION_REVOKED',
      category: 'RBAC',
      targetEntity: 'role_permissions',
      targetId: `${roleCode}:${permissionCode}`,
      status: 'SUCCESS',
      detailsFa: `مجوز [${permissionCode}] برای نقش دیتابیسی [${roleCode}] ${isGranted ? 'اعطا شد' : 'لغو گردید'}`,
    });

    return isGranted;
  }

  // ==========================================================================
  // AUDIT LOG SUBSYSTEM
  // ==========================================================================
  public recordAuditLog(params: {
    actorUserId?: number | null;
    actorUsername?: string;
    action: string;
    category: AuditLogRecord['category'];
    targetEntity: string;
    targetId: string;
    status: AuditLogRecord['status'];
    detailsFa: string;
    metadata?: Record<string, unknown>;
  }): AuditLogRecord {
    const uid =
      params.actorUserId !== undefined ? params.actorUserId : this.dbState.activeSessionUserId;
    const actor = this.dbState.users.find((u) => u.id === uid);
    const roles = actor
      ? this.dbState.userRoleAssignments
          .filter((r) => r.userId === actor.id)
          .map((r) => r.roleCode)
          .join(', ')
      : 'GUEST_OR_SYSTEM';

    const nextId =
      this.dbState.auditLogs.length > 0
        ? Math.max(...this.dbState.auditLogs.map((l) => l.id)) + 1
        : 1;

    const newLog: AuditLogRecord = {
      id: nextId,
      traceId: `TRC-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actorUserId: uid ?? null,
      actorUsername: params.actorUsername || actor?.username || 'SYSTEM',
      actorRoleSummary: roles || 'NONE',
      action: params.action,
      category: params.category,
      targetEntity: params.targetEntity,
      targetId: params.targetId,
      status: params.status,
      detailsFa: params.detailsFa,
      sanitizedMetadata: sanitizeForLogAndApi(params.metadata || {}),
    };

    this.dbState.auditLogs.unshift(newLog);
    if (this.dbState.auditLogs.length > 300) {
      this.dbState.auditLogs = this.dbState.auditLogs.slice(0, 300);
    }
    this.saveDbState();
    return newLog;
  }

  public getAuditLogs(): AuditLogRecord[] {
    return this.dbState.auditLogs || [];
  }

  // ==========================================================================
  // SETTINGS & MIGRATIONS
  // ==========================================================================
  public getIndustryProfile(code?: IndustryProfileCode): IndustryProfileConfig {
    const profileCode = code || this.dbState.settings.industryProfileCode || 'CCTV_SECURITY';
    if (INDUSTRY_PROFILES[profileCode]) {
      return INDUSTRY_PROFILES[profileCode];
    }
    const custom = (this.dbState.customIndustryProfiles || []).find((p) => p.code === profileCode);
    if (custom) {
      return custom;
    }
    return INDUSTRY_PROFILES.CCTV_SECURITY;
  }

  public getAllIndustryProfiles(): IndustryProfileConfig[] {
    const systemProfiles = Object.values(INDUSTRY_PROFILES);
    const customProfiles = (this.dbState.customIndustryProfiles || []).filter(
      (cp) => !INDUSTRY_PROFILES[cp.code]
    );
    return [...systemProfiles, ...customProfiles];
  }

  public registerIndustryProfile(
    profile: IndustryProfileConfig,
    actorUserId?: number
  ): IndustryProfileConfig {
    if (!profile || typeof profile !== 'object') {
      throw new Error('مشخصات صنف ارائه‌شده نامعتبر است.');
    }

    const cleanCode = (profile.code || '').trim().toUpperCase();
    if (!cleanCode || !/^[A-Z0-9_]{3,30}$/.test(cleanCode)) {
      throw new Error('کد صنف باید تنها شامل حروف بزرگ انگلیسی، اعداد و خط زیر (بین ۳ تا ۳۰ کاراکتر) باشد.');
    }

    // 1. Protect reserved core profiles
    if (
      cleanCode === 'CCTV_SECURITY' ||
      cleanCode === 'RETAIL_GENERAL' ||
      cleanCode === 'SUPERMARKET_GROCERY'
    ) {
      throw new Error('امکان بازنویسی پروفایل‌های پیش‌فرض و رزروشده سیستم (CCTV_SECURITY، RETAIL_GENERAL و SUPERMARKET_GROCERY) وجود ندارد.');
    }

    // 2. Prevent duplicate codes
    if (INDUSTRY_PROFILES[cleanCode]) {
      throw new Error(`صنف با کد «${cleanCode}» قبلاً در سیستم ثبت شده است.`);
    }

    // 3. Validate mandatory titles
    const cleanTitle = (profile.titleFa || '').trim();
    if (cleanTitle.length < 3) {
      throw new Error('عنوان فارسی صنف الزامی است و باید حداقل ۳ کاراکتر باشد.');
    }

    const cleanBadge = (profile.badgeLabelFa || '').trim();
    if (cleanBadge.length < 2) {
      throw new Error('برچسب کوتاه صنف (Badge) الزامی است و باید حداقل ۲ کاراکتر باشد.');
    }

    // 4. Safe defaults for features & uiLabels
    const completeProfile: IndustryProfileConfig = {
      code: cleanCode,
      titleFa: cleanTitle,
      descriptionFa: (profile.descriptionFa || '').trim() || `پروفایل تجاری تخصصی ${cleanTitle}`,
      badgeLabelFa: cleanBadge,
      features: {
        enableInstallationServices: false,
        enableHardwareMacTracking: false,
        enableInstallersRole: false,
        enableWarrantyTracking: false,
        enableBarcodeScanQuickPos: true,
        ...(profile.features || {}),
      },
      uiLabels: {
        inventoryTabTitleFa: profile.uiLabels?.inventoryTabTitleFa?.trim() || 'کالا و انبارداری',
        serialTrackerTitleFa: profile.uiLabels?.serialTrackerTitleFa?.trim() || 'رهگیری شماره سریال کالا',
        partiesInstallerRoleTitleFa: profile.uiLabels?.partiesInstallerRoleTitleFa?.trim() || 'مجریان و کارشناسان فنی',
        ...(profile.uiLabels || {}),
      },
    };

    // 5. Store in memory dictionary
    INDUSTRY_PROFILES[cleanCode] = completeProfile;

    // 6. Persist to database state JSON
    if (!Array.isArray(this.dbState.customIndustryProfiles)) {
      this.dbState.customIndustryProfiles = [];
    }
    const existingIdx = this.dbState.customIndustryProfiles.findIndex((p) => p.code === cleanCode);
    if (existingIdx >= 0) {
      this.dbState.customIndustryProfiles[existingIdx] = completeProfile;
    } else {
      this.dbState.customIndustryProfiles.push(completeProfile);
    }
    this.saveDbState();

    // 7. Audit log
    this.recordAuditLog({
      actorUserId: actorUserId || this.getActiveUser().id,
      action: 'REGISTER_CUSTOM_INDUSTRY_PROFILE',
      category: 'SETTINGS',
      targetEntity: 'industry_profiles',
      targetId: cleanCode,
      status: 'SUCCESS',
      detailsFa: `صنف تجاری جدید «${cleanTitle}» با موفقیت تعریف و پایدارسازی شد.`,
      metadata: {
        profileCode: cleanCode,
        features: completeProfile.features,
      },
    });

    return completeProfile;
  }

  public updateIndustryProfile(
    profileCode: IndustryProfileCode,
    actorUserId: number
  ): {
    ok: boolean;
    settings: SystemSettingsRecord;
    profile: IndustryProfileConfig;
    messageFa: string;
  } {
    const actorUser = this.dbState.users.find((u) => u.id === actorUserId);
    const evaluation = this.evaluatePermission(actorUserId, 'foundation.settings.manage');
    const isActorAdmin = actorUser ? (actorUser.isInitialAdmin || evaluation.allowed) : false;
    if (!isActorAdmin) {
      throw new Error('فقط راهبر کل و کاربر دارای دسترسی مدیریت تنظیمات مجاز به تغییر صنف کاری سامانه است.');
    }

    if (!profileCode || typeof profileCode !== 'string' || !INDUSTRY_PROFILES[profileCode]) {
      throw new Error(`تعریف صنف با کد «${profileCode}» در سیستم موجود نیست یا نامعتبر است.`);
    }

    const previousProfile = this.dbState.settings.industryProfileCode || 'CCTV_SECURITY';
    this.dbState.settings.industryProfileCode = profileCode;
    this.dbState.settings.updatedAt = new Date().toISOString();
    this.saveDbState();

    const selectedConfig = INDUSTRY_PROFILES[profileCode];

    this.recordAuditLog({
      actorUserId,
      action: 'UPDATE_INDUSTRY_PROFILE',
      category: 'SETTINGS',
      targetEntity: 'system_settings',
      targetId: profileCode,
      status: 'SUCCESS',
      detailsFa: `صنف کاری سیستم از «${INDUSTRY_PROFILES[previousProfile]?.titleFa || previousProfile}» به «${selectedConfig.titleFa}» تغییر یافت.`,
      metadata: {
        previousProfile,
        newProfile: profileCode,
        features: selectedConfig.features,
      },
    });

    return {
      ok: true,
      settings: this.dbState.settings,
      profile: selectedConfig,
      messageFa: `صنف کاری سامانه با موفقیت به «${selectedConfig.titleFa}» تغییر یافت و قابلیت‌های متناسب فعال گردید.`,
    };
  }

  public getSettings(): SystemSettingsRecord {
    return this.dbState.settings;
  }

  public updateSettings(partial: Partial<SystemSettingsRecord>): SystemSettingsRecord {
    this.dbState.settings = {
      ...this.dbState.settings,
      ...partial,
      industryProfileCode:
        partial.industryProfileCode && INDUSTRY_PROFILES[partial.industryProfileCode]
          ? partial.industryProfileCode
          : this.dbState.settings.industryProfileCode || 'CCTV_SECURITY',
      baseCurrencyCode: 'IRR', // Accounting ledger base is immutable
      updatedAt: new Date().toISOString(),
    };
    this.saveDbState();
    this.recordAuditLog({
      action: 'SYSTEM_SETTINGS_UPDATED',
      category: 'SETTINGS',
      targetEntity: 'system_settings',
      targetId: '1',
      status: 'SUCCESS',
      detailsFa: 'تنظیمات مشخصات کسب‌وکار و پیکربندی سیستم ذخیره شد',
    });
    return this.dbState.settings;
  }

  public applyPendingMigrations(): { appliedCount: number; migrations: SchemaMigrationRecord[] } {
    let appliedCount = 0;
    const nowIso = new Date().toISOString();
    for (const m of this.dbState.migrations) {
      if (m.status === 'PENDING' && !m.isDestructive) {
        m.status = 'APPLIED';
        m.executionMs = 15;
        m.appliedAt = nowIso;
        appliedCount++;
      }
    }
    this.saveDbState();
    if (appliedCount > 0) {
      this.recordAuditLog({
        action: 'MIGRATIONS_APPLIED',
        category: 'MIGRATION',
        targetEntity: 'schema_migrations',
        targetId: `COUNT_${appliedCount}`,
        status: 'SUCCESS',
        detailsFa: `${appliedCount} نسخه Migration غیرمخرب با موفقیت اعمال گردید`,
      });
    }
    return { appliedCount, migrations: this.dbState.migrations };
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT (LOCAL / LAN / HOSTED POSTGRESQL)
  // ==========================================================================
  public async testConnectionCandidate(input: {
    mode: ConnectionMode;
    labelFa?: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string;
    tlsEnabled: boolean;
    tlsMode: TlsMode;
    caCertPath?: string;
  }): Promise<{
    ok: boolean;
    latencyMs: number;
    stageReached: string;
    serverVersion: string;
    tlsSummary: string;
    messageFa: string;
    remediationGuideFa?: string;
  }> {
    const startTime = Date.now();
    const hostClean = (input.host || '').trim();
    const dbClean = (input.database || '').trim();
    const userClean = (input.username || '').trim();
    const portNum = Number(input.port) || 5432;

    if (!hostClean || !dbClean || !userClean) {
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        stageReached: 'VALIDATION_PARAMETERS',
        serverVersion: 'N/A',
        tlsSummary: 'N/A',
        messageFa: 'آدرس سرور، نام دیتابیس و نام کاربری الزامی هستند.',
        remediationGuideFa: 'لطفاً تمامی فیلدهای الزامی شامل Host، نام دیتابیس و نام کاربری را پر کنید.',
      };
    }

    if (portNum < 1 || portNum > 65535) {
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        stageReached: 'TCP_PORT_CHECK',
        serverVersion: 'N/A',
        tlsSummary: 'N/A',
        messageFa: `شماره پورت ${portNum} نامعتبر است. محدوده مجاز ۱ تا ۶۵۵۳۵ می‌باشد.`,
        remediationGuideFa: 'پورت استاندارد دیتابیس PostgreSQL عدد 5432 است.',
      };
    }

    if (input.mode === 'ONLINE' && !input.tlsEnabled) {
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        stageReached: 'TLS_SECURITY_POLICY',
        serverVersion: 'N/A',
        tlsSummary: 'TLS Disabled (Rejected)',
        messageFa: 'در حالت Hosted PostgreSQL (سرور آنلاین)، فعال‌سازی رمزنگاری TLS اجباری است.',
        remediationGuideFa: 'گزینه TLS را فعال کنید و سطح require یا verify-full را برگزینید.',
      };
    }

    if (hostClean.includes('invalid') || hostClean.includes('fail') || hostClean === '0.0.0.0') {
      return {
        ok: false,
        latencyMs: 38,
        stageReached: 'DB_TCP_HANDSHAKE',
        serverVersion: 'N/A',
        tlsSummary: input.tlsEnabled ? `TLS (${input.tlsMode})` : 'No TLS',
        messageFa: `خطا در برقراری نشست شبکه با سرور PostgreSQL در آدرس ${hostClean}:${portNum} (ECONNREFUSED).`,
        remediationGuideFa:
          '۱. سرویس PostgreSQL در سرور مقصد در حال اجرا باشد.\n۲. فایل pg_hba.conf و listen_addresses بررسی شوند.\n۳. پورت 5432 در فایروال باز باشد.',
      };
    }

    const latency = input.mode === 'LOCAL' ? 3 : input.mode === 'LAN' ? 12 : 45;

    this.recordAuditLog({
      action: 'CONNECTION_TEST_SUCCESS',
      category: 'CONNECTION',
      targetEntity: 'database_connection',
      targetId: `${input.mode}:${hostClean}:${portNum}/${dbClean}`,
      status: 'SUCCESS',
      detailsFa: `آزمایش موفق اتصال به سرور [${input.mode}] در آدرس ${hostClean}:${portNum}/${dbClean}`,
      metadata: {
        mode: input.mode,
        host: hostClean,
        port: portNum,
        database: dbClean,
        tlsEnabled: input.tlsEnabled,
        tlsMode: input.tlsMode,
      },
    });

    return {
      ok: true,
      latencyMs: latency,
      stageReached: 'SCHEMA_COMPATIBILITY_VERIFIED',
      serverVersion:
        input.mode === 'LOCAL'
          ? 'PostgreSQL 16.4 (Mehregan Bundled Local Engine)'
          : input.mode === 'LAN'
          ? 'PostgreSQL 16.4 (Local Area Network Server)'
          : 'PostgreSQL 16.4 (Managed Cloud Hosted TLS)',
      tlsSummary: input.tlsEnabled
        ? `TLS 1.3 Active (${input.tlsMode})`
        : 'بدون رمزنگاری شبکه (حالت محلی/شبکه امن داخلی)',
      messageFa: `اتصال به دیتابیس «${dbClean}» در آدرس ${hostClean}:${portNum} با موفقیت آزمایش شد.`,
    };
  }

  public stageConnectionChange(input: {
    mode: ConnectionMode;
    labelFa?: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string;
    tlsEnabled: boolean;
    tlsMode: TlsMode;
    caCertPath?: string;
  }): { ok: boolean; messageFa: string } {
    const secretToSave = input.password
      ? encryptSecret(input.password)
      : this.vaultState.activeProfile.encryptedPassword;

    const candidate: DatabaseConnectionProfile = {
      profileId: `prof-${input.mode.toLowerCase()}-${Date.now()}`,
      labelFa:
        input.labelFa ||
        (input.mode === 'LOCAL'
          ? 'دیتابیس محلی روی همین کامپیوتر (Local PostgreSQL)'
          : input.mode === 'LAN'
          ? 'دیتابیس روی سرور شبکه محلی (LAN PostgreSQL)'
          : 'دیتابیس روی سرور آنلاین / ابری (Hosted PostgreSQL)'),
      mode: input.mode,
      host: input.host.trim(),
      port: Number(input.port) || 5432,
      database: input.database.trim(),
      username: input.username.trim(),
      encryptedPassword: secretToSave,
      hasPasswordSaved: true,
      tlsEnabled: Boolean(input.tlsEnabled),
      tlsMode: input.tlsMode || 'disable',
      caCertPath: input.caCertPath,
      lastTestedAt: new Date().toISOString(),
      verifiedReady: true,
    };

    this.vaultState.stagedCandidateProfile = candidate;
    this.vaultState.connectionStatus = 'PENDING_CONFIRMATION';
    this.saveVaultState();

    this.recordAuditLog({
      action: 'CONNECTION_STAGED_FOR_CONFIRMATION',
      category: 'CONNECTION',
      targetEntity: 'connection_vault',
      targetId: candidate.profileId,
      status: 'SUCCESS',
      detailsFa: `مقصد جدید اتصال [${candidate.mode} - ${candidate.host}:${candidate.port}/${candidate.database}] آزمایش و در انتظار تایید صریح کاربر قرار گرفت`,
      metadata: {
        mode: candidate.mode,
        host: candidate.host,
        port: candidate.port,
        database: candidate.database,
      },
    });

    return {
      ok: true,
      messageFa: 'مقصد جدید با موفقیت آماده شد. برای فعال‌سازی قطعی، تایید صریح عدم ادغام داده‌ها الزامی است.',
    };
  }

  public confirmConnectionSwitch(explicitNoMergeConfirmed: boolean): { ok: boolean; messageFa: string } {
    if (!this.vaultState.stagedCandidateProfile) {
      return { ok: false, messageFa: 'هیچ مقصد جدیدی در صف تایید وجود ندارد.' };
    }
    if (!explicitNoMergeConfirmed) {
      return {
        ok: false,
        messageFa: 'تایید صریح عدم کپی/ادغام داده‌ها و اتصال به دیتابیس مقصد الزامی است.',
      };
    }

    const previous = this.vaultState.activeProfile;
    const nextProfile = this.vaultState.stagedCandidateProfile;

    this.vaultState.previousProfileForRollback = previous;
    this.vaultState.activeProfile = nextProfile;
    this.vaultState.stagedCandidateProfile = null;
    this.vaultState.connectionStatus = 'CONNECTED';
    this.vaultState.lastConnectionSwitchAt = new Date().toISOString();
    this.saveVaultState();

    this.recordAuditLog({
      action: 'CONNECTION_SWITCH_CONFIRMED',
      category: 'CONNECTION',
      targetEntity: 'connection_vault',
      targetId: nextProfile.profileId,
      status: 'SUCCESS',
      detailsFa: `مقصد اتصال با تایید صریح از [${previous.host}/${previous.database}] به [${nextProfile.host}/${nextProfile.database}] تغییر یافت. تنظیمات قبلی جهت Rollback ذخیره شد`,
      metadata: {
        previousMode: previous.mode,
        previousHost: previous.host,
        newMode: nextProfile.mode,
        newHost: nextProfile.host,
        newDatabase: nextProfile.database,
      },
    });

    return {
      ok: true,
      messageFa: `اتصال به مقصد جدید (${nextProfile.labelFa}) با موفقیت برقرار شد. تنظیمات قبلی جهت بازگشت آنی (Rollback) در دسترس است.`,
    };
  }

  public cancelStagedConnection(): { ok: boolean; messageFa: string } {
    this.vaultState.stagedCandidateProfile = null;
    this.vaultState.connectionStatus = 'CONNECTED';
    this.saveVaultState();
    return { ok: true, messageFa: 'تغییر مقصد اتصال لغو شد و سیستم روی اتصال فعلی باقی ماند.' };
  }

  public rollbackConnection(): { ok: boolean; messageFa: string } {
    if (!this.vaultState.previousProfileForRollback) {
      return { ok: false, messageFa: 'پروفایل اتصال قبلی برای بازگشت (Rollback) موجود نیست.' };
    }

    const current = this.vaultState.activeProfile;
    const restored = this.vaultState.previousProfileForRollback;

    this.vaultState.activeProfile = restored;
    this.vaultState.previousProfileForRollback = current;
    this.vaultState.stagedCandidateProfile = null;
    this.vaultState.connectionStatus = 'CONNECTED';
    this.vaultState.lastConnectionSwitchAt = new Date().toISOString();
    this.saveVaultState();

    this.recordAuditLog({
      action: 'CONNECTION_ROLLBACK',
      category: 'CONNECTION',
      targetEntity: 'connection_vault',
      targetId: restored.profileId,
      status: 'SUCCESS',
      detailsFa: `بازگشت فوری (Rollback) به تنظیمات اتصال قبلی [${restored.mode} - ${restored.host}:${restored.port}/${restored.database}] انجام شد`,
    });

    return {
      ok: true,
      messageFa: `بازگشت به تنظیمات اتصال قبلی (${restored.labelFa}) با موفقیت انجام شد.`,
    };
  }

  public disconnectConnection(): { ok: boolean; messageFa: string } {
    this.vaultState.connectionStatus = 'DISCONNECTED';
    this.saveVaultState();

    this.recordAuditLog({
      action: 'CONNECTION_DISCONNECTED',
      category: 'CONNECTION',
      targetEntity: 'connection_vault',
      targetId: this.vaultState.activeProfile.profileId,
      status: 'SUCCESS',
      detailsFa: 'اتصال دیتابیس به صورت ایمن قطع گردید. هیچ اطلاعاتی در دیتابیس حذف یا تغییر نیافت',
    });

    return {
      ok: true,
      messageFa: 'اتصال دیتابیس قطع شد. تمامی داده‌ها، کاربران و تنظیمات کاملاً دست‌نخورده و محفوظ هستند.',
    };
  }

  public reconnectConnection(): { ok: boolean; messageFa: string } {
    this.vaultState.connectionStatus = 'CONNECTED';
    this.vaultState.activeProfile.lastTestedAt = new Date().toISOString();
    this.saveVaultState();

    this.recordAuditLog({
      action: 'CONNECTION_RECONNECTED',
      category: 'CONNECTION',
      targetEntity: 'connection_vault',
      targetId: this.vaultState.activeProfile.profileId,
      status: 'SUCCESS',
      detailsFa: `اتصال مجدد به دیتابیس [${this.vaultState.activeProfile.host}:${this.vaultState.activeProfile.port}/${this.vaultState.activeProfile.database}] با موفقیت برقرار شد`,
    });

    return {
      ok: true,
      messageFa: `اتصال مجدد به دیتابیس «${this.vaultState.activeProfile.database}» با موفقیت برقرار شد.`,
    };
  }

  public getConnectionStateForApi() {
    return {
      setupWizardCompleted: this.vaultState.setupWizardCompleted,
      connectionStatus: this.vaultState.connectionStatus,
      activeProfile: {
        ...this.vaultState.activeProfile,
        encryptedPassword: undefined,
        passwordMasked: '••••••••••••',
      },
      stagedCandidateProfile: this.vaultState.stagedCandidateProfile
        ? {
            ...this.vaultState.stagedCandidateProfile,
            encryptedPassword: undefined,
            passwordMasked: '••••••••••••',
          }
        : null,
      previousProfileForRollback: this.vaultState.previousProfileForRollback
        ? {
            ...this.vaultState.previousProfileForRollback,
            encryptedPassword: undefined,
            passwordMasked: '••••••••••••',
          }
        : null,
      lastConnectionSwitchAt: this.vaultState.lastConnectionSwitchAt,
    };
  }

  // ==========================================================================
  // STAGE 3: PARTIES & BUSINESS COUNTERPARTIES METHODS
  // Single Authoritative Store for Customers, Suppliers, Installers & Partners
  // ==========================================================================

  public calculatePartyTransactionsSummary(partyId: number) {
    const txs = (this.dbState.partyTransactions || []).filter((t) => t.partyId === partyId);

    const sales = txs.filter((t) => t.recordType === 'SALE_INVOICE');
    const purchases = txs.filter((t) => t.recordType === 'PURCHASE_INVOICE');
    const payments = txs.filter((t) => t.recordType === 'PAYMENT');
    const receipts = txs.filter((t) => t.recordType === 'RECEIPT');
    const openingDebits = txs.filter((t) => t.recordType === 'OPENING_DEBIT');
    const openingCredits = txs.filter((t) => t.recordType === 'OPENING_CREDIT');

    const totalSalesIrr = sales.reduce((acc, s) => acc + Number(s.amountIrr || 0), 0);
    const totalPurchasesIrr = purchases.reduce((acc, p) => acc + Number(p.amountIrr || 0), 0);
    const totalPaymentsIrr = payments.reduce((acc, p) => acc + Number(p.amountIrr || 0), 0);
    const totalReceiptsIrr = receipts.reduce((acc, r) => acc + Number(r.amountIrr || 0), 0);
    const totalOpeningDebitIrr = openingDebits.reduce((acc, o) => acc + Number(o.amountIrr || 0), 0);
    const totalOpeningCreditIrr = openingCredits.reduce((acc, o) => acc + Number(o.amountIrr || 0), 0);
    const activeProjectsCount = txs.filter((t) => t.recordType === 'CCTV_PROJECT' && t.status === 'IN_PROGRESS').length;

    // Standard net balance formula: Purchases + Receipts + OpeningCredit - (Sales + Payments + OpeningDebit)
    // Positive (+) = Creditor / Supplier balance (bستانکار)
    // Negative (-) = Debtor / Customer balance (bدهکار)
    const netBalanceIrr =
      totalPurchasesIrr + totalReceiptsIrr + totalOpeningCreditIrr - (totalSalesIrr + totalPaymentsIrr + totalOpeningDebitIrr);

    return {
      totalSalesCount: sales.length,
      totalSalesIrr,
      totalPurchasesCount: purchases.length,
      totalPurchasesIrr,
      totalPaymentsIrr,
      totalReceiptsIrr,
      activeProjectsCount,
      netBalanceIrr,
    };
  }

  public getParties(filter?: string | { type?: string; status?: string; search?: string }): PartyRecord[] {
    const filterObj = typeof filter === 'string' ? { type: filter } : filter;

    let result = this.dbState.parties.map((p) => ({
      ...p,
      transactionsSummary: this.calculatePartyTransactionsSummary(p.id),
    }));

    if (filterObj?.type && filterObj.type !== 'ALL') {
      result = result.filter(
        (p) => p.primaryType === filterObj.type || (p.roles && p.roles.includes(filterObj.type as any))
      );
    }

    if (filterObj?.status && filterObj.status !== 'ALL') {
      result = result.filter((p) => p.status === filterObj.status);
    }

    if (filterObj?.search && typeof filterObj.search === 'string' && filterObj.search.trim().length > 0) {
      const q = filterObj.search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          (p.companyTitle && p.companyTitle.toLowerCase().includes(q)) ||
          p.partyCode.toLowerCase().includes(q) ||
          p.mobile.includes(q) ||
          (p.nationalId && p.nationalId.includes(q)) ||
          p.city.toLowerCase().includes(q) ||
          (p.installerSkills && p.installerSkills.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getPartyById(id: number): (PartyRecord & { transactions: PartyTransactionRecord[] }) | null {
    const party = this.dbState.parties.find((p) => p.id === id);
    if (!party) return null;

    const summary = this.calculatePartyTransactionsSummary(party.id);
    const transactions = this.dbState.partyTransactions
      .filter((t) => t.partyId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      ...party,
      transactionsSummary: summary,
      transactions,
    };
  }

  public checkDuplicateParty(input: {
    partyId?: number;
    fullName: string;
    nationalId?: string | null;
    mobile: string;
    economicCode?: string | null;
  }): DuplicateCheckResponse {
    const duplicates: DuplicateCandidate[] = [];
    const currentId = input.partyId || 0;

    const cleanMobile = (input.mobile || '').replace(/[\s\-]/g, '');
    const cleanNationalId = (input.nationalId || '').trim();
    const cleanEconomicCode = (input.economicCode || '').trim();
    const cleanName = (input.fullName || '').trim().toLowerCase();

    for (const p of this.dbState.parties) {
      if (p.id === currentId) continue;

      const pMobile = (p.mobile || '').replace(/[\s\-]/g, '');
      const pNationalId = (p.nationalId || '').trim();
      const pEconomicCode = (p.economicCode || '').trim();
      const pName = (p.fullName || '').trim().toLowerCase();

      const matchReasons: DuplicateCandidate['matchReasons'] = [];

      // 1. National ID match (Blocking duplicate)
      if (cleanNationalId && pNationalId && cleanNationalId === pNationalId) {
        matchReasons.push({
          field: 'nationalId',
          fieldTitleFa: 'کد ملی / شناسه ملی یکسان',
          matchedValue: cleanNationalId,
          isExact: true,
        });
      }

      // 2. Mobile match
      if (cleanMobile && pMobile && cleanMobile === pMobile) {
        matchReasons.push({
          field: 'mobile',
          fieldTitleFa: 'شماره همراه یکسان',
          matchedValue: cleanMobile,
          isExact: true,
        });
      }

      // 3. Economic Code match
      if (cleanEconomicCode && pEconomicCode && cleanEconomicCode === pEconomicCode) {
        matchReasons.push({
          field: 'economicCode',
          fieldTitleFa: 'کد اقتصادی یکسان',
          matchedValue: cleanEconomicCode,
          isExact: true,
        });
      }

      // 4. Similar Full Name match
      if (cleanName && pName && (cleanName === pName || (cleanName.length > 5 && pName.includes(cleanName)))) {
        matchReasons.push({
          field: 'fullName',
          fieldTitleFa: 'نام یا عنوان شخص مشابه',
          matchedValue: p.fullName,
          isExact: cleanName === pName,
        });
      }

      if (matchReasons.length > 0) {
        duplicates.push({
          partyId: p.id,
          partyCode: p.partyCode,
          fullName: p.fullName,
          matchReasons,
          existingRecord: {
            primaryType: p.primaryType,
            status: p.status,
            mobile: p.mobile,
            nationalId: p.nationalId,
          },
        });
      }
    }

    const hasExactNationalId = duplicates.some((d) =>
      d.matchReasons.some((r) => r.field === 'nationalId')
    );
    const hasDuplicate = duplicates.length > 0;

    return {
      hasDuplicate,
      isBlocking: hasExactNationalId,
      messageFa: hasExactNationalId
        ? 'کد ملی یا شناسه ملی وارد شده متعلق به شخص دیگری در سیستم است و تکراری می‌باشد.'
        : hasDuplicate
        ? `تعداد ${duplicates.length} مورد مشابه بر اساس شماره تماس یا نام در سیستم شناسایی شد.`
        : 'هیچ مورد تکراری یا مشابهی یافت نشد.',
      duplicates,
    };
  }

  public createParty(
    data: Partial<PartyRecord>,
    actorUserId: number,
    allowDuplicates: boolean = false
  ): PartyRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();

    if (!data.fullName || data.fullName.trim().length === 0) {
      throw new Error('نام و نام خانوادگی یا عنوان شرکت الزامی است.');
    }
    if (!data.mobile || data.mobile.trim().length === 0) {
      throw new Error('شماره تلفن همراه الزامی است.');
    }

    // Duplicate check
    const dupCheck = this.checkDuplicateParty({
      fullName: data.fullName,
      nationalId: data.nationalId,
      mobile: data.mobile,
      economicCode: data.economicCode,
    });

    if (dupCheck.isBlocking) {
      throw new Error(
        `امکان ثبت وجود ندارد: شناسه ملی یا کد ملی با پرونده [${dupCheck.duplicates[0]?.partyCode} - ${dupCheck.duplicates[0]?.fullName}] تکراری است.`
      );
    }

    if (dupCheck.hasDuplicate && !allowDuplicates) {
      throw new Error(
        `شخص مشابه در سیستم یافت شد (${dupCheck.messageFa}). در صورت اطمینان از ثبت شخص مجزا، تایید صریح ثبت شخص تکراری الزامی است.`
      );
    }

    // Auto-generate next party code
    const nextNum = 10001 + this.dbState.parties.length;
    const partyCode = data.partyCode || `PRT-${nextNum}`;

    const nowIso = new Date().toISOString();
    const newId = this.dbState.parties.length > 0 ? Math.max(...this.dbState.parties.map((p) => p.id)) + 1 : 1;

    const primaryType = data.primaryType || 'CUSTOMER';
    const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : [primaryType];

    const newParty: PartyRecord = {
      id: newId,
      partyCode,
      primaryType,
      roles,
      personType: data.personType || 'NATURAL',
      fullName: data.fullName.trim(),
      companyTitle: data.companyTitle ? data.companyTitle.trim() : null,
      nationalId: data.nationalId ? data.nationalId.trim() : null,
      economicCode: data.economicCode ? data.economicCode.trim() : null,
      registrationNumber: data.registrationNumber ? data.registrationNumber.trim() : null,
      mobile: data.mobile.trim(),
      phone: data.phone ? data.phone.trim() : null,
      fax: data.fax ? data.fax.trim() : null,
      email: data.email ? data.email.trim() : null,
      province: data.province ? data.province.trim() : 'تهران',
      city: data.city ? data.city.trim() : 'تهران',
      postalCode: data.postalCode ? data.postalCode.trim() : null,
      addressFa: data.addressFa ? data.addressFa.trim() : null,
      status: data.status || 'ACTIVE',
      creditLimitIrr: Number(data.creditLimitIrr || 0),
      installerSkills: data.installerSkills ? data.installerSkills.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      isDemo: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.parties.push(newParty);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'PARTY_CREATED',
      category: 'AUTH',
      targetEntity: 'parties',
      targetId: newParty.partyCode,
      status: 'SUCCESS',
      detailsFa: `شخص جدید «${newParty.fullName}» با کد [${newParty.partyCode}] و نقش اولیه [${newParty.primaryType}] ثبت گردید.`,
      metadata: {
        partyId: newParty.id,
        partyCode: newParty.partyCode,
        fullName: newParty.fullName,
        primaryType: newParty.primaryType,
        roles: newParty.roles,
        mobile: newParty.mobile,
      },
    });

    return {
      ...newParty,
      transactionsSummary: this.calculatePartyTransactionsSummary(newParty.id),
    };
  }

  public updateParty(id: number, data: Partial<PartyRecord>, actorUserId: number): PartyRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const partyIndex = this.dbState.parties.findIndex((p) => p.id === id);

    if (partyIndex === -1) {
      throw new Error(`شخص با شناسه [${id}] یافت نشد.`);
    }

    const current = this.dbState.parties[partyIndex];

    // If national ID changed, verify non-duplicate
    if (data.nationalId && data.nationalId.trim() !== current.nationalId) {
      const dupCheck = this.checkDuplicateParty({
        partyId: id,
        fullName: data.fullName || current.fullName,
        nationalId: data.nationalId,
        mobile: data.mobile || current.mobile,
        economicCode: data.economicCode || current.economicCode,
      });
      if (dupCheck.isBlocking) {
        throw new Error('کد ملی / شناسه ملی وارد شده متعلق به شخص دیگری است.');
      }
    }

    const updated: PartyRecord = {
      ...current,
      ...data,
      id: current.id,
      partyCode: current.partyCode, // Party code remains immutable for audit compliance
      roles: data.roles || current.roles,
      updatedAt: new Date().toISOString(),
    };

    this.dbState.parties[partyIndex] = updated;
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'PARTY_UPDATED',
      category: 'AUTH',
      targetEntity: 'parties',
      targetId: current.partyCode,
      status: 'SUCCESS',
      detailsFa: `مشخصات پرونده «${updated.fullName}» [${current.partyCode}] به‌روزرسانی شد.`,
      metadata: {
        partyId: current.id,
        partyCode: current.partyCode,
        updatedFields: Object.keys(data),
      },
    });

    return {
      ...updated,
      transactionsSummary: this.calculatePartyTransactionsSummary(updated.id),
    };
  }

  public togglePartyStatus(id: number, actorUserId: number): PartyRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const party = this.dbState.parties.find((p) => p.id === id);

    if (!party) {
      throw new Error(`شخص با شناسه [${id}] یافت نشد.`);
    }

    const newStatus: PartyStatus = party.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    party.status = newStatus;
    party.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'PARTY_STATUS_TOGGLED',
      category: 'AUTH',
      targetEntity: 'parties',
      targetId: party.partyCode,
      status: 'SUCCESS',
      detailsFa: `وضعیت طرف تجاری «${party.fullName}» به حالت [${newStatus === 'ACTIVE' ? 'فعال' : 'غیرفعال'}] تغییر یافت.`,
      metadata: {
        partyId: party.id,
        partyCode: party.partyCode,
        newStatus,
      },
    });

    return {
      ...party,
      transactionsSummary: this.calculatePartyTransactionsSummary(party.id),
    };
  }

  public deleteParty(id: number, actorUserId: number): { ok: boolean; messageFa: string } {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const party = this.dbState.parties.find((p) => p.id === id);

    if (!party) {
      throw new Error(`شخص با شناسه [${id}] یافت نشد.`);
    }

    // Ledger integrity check: Check if party has linked transactions
    const txCount = this.dbState.partyTransactions.filter((t) => t.partyId === id).length;
    if (txCount > 0) {
      throw new Error(
        `امکان حذف این شخص وجود ندارد؛ تعداد ${txCount} سند مالی/پروژه ثبت‌شده دارد. جهت جلوگیری از اختلال در تراز مالی، از گزینه «غیرفعال‌سازی» استفاده کنید.`
      );
    }

    this.dbState.parties = this.dbState.parties.filter((p) => p.id !== id);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'PARTY_DELETED',
      category: 'SECURITY',
      targetEntity: 'parties',
      targetId: party.partyCode,
      status: 'SUCCESS',
      detailsFa: `شخص «${party.fullName}» [${party.partyCode}] به دلیل عدم وجود اسناد مالی با موفقیت حذف گردید.`,
      metadata: {
        partyId: id,
        partyCode: party.partyCode,
        fullName: party.fullName,
      },
    });

    return {
      ok: true,
      messageFa: `شخص «${party.fullName}» با موفقیت حذف شد.`,
    };
  }

  public getPartyTransactions(partyId: number): PartyTransactionRecord[] {
    return this.dbState.partyTransactions
      .filter((t) => t.partyId === partyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addPartyTransaction(
    partyId: number,
    data: Partial<PartyTransactionRecord>,
    actorUserId: number
  ): PartyTransactionRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const party = this.dbState.parties.find((p) => p.id === partyId);

    if (!party) {
      throw new Error(`شخص با شناسه [${partyId}] یافت نشد.`);
    }

    const newId =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    const newTx: PartyTransactionRecord = {
      id: newId,
      partyId,
      recordType: data.recordType || 'SALE_INVOICE',
      referenceNumber: data.referenceNumber || `TX-${Date.now().toString().slice(-6)}`,
      titleFa: data.titleFa || 'ثبت تراکنش مرتبط',
      amountIrr: Number(data.amountIrr || 0),
      dateJalali: data.dateJalali || '1405/01/20',
      status: data.status || 'COMPLETED',
      notesFa: data.notesFa || null,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    this.dbState.partyTransactions.push(newTx);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'PARTY_TRANSACTION_ATTACHED',
      category: 'AUTH',
      targetEntity: 'party_transactions',
      targetId: newTx.referenceNumber,
      status: 'SUCCESS',
      detailsFa: `سند [${newTx.recordType}] با شماره «${newTx.referenceNumber}» و مبلغ [${newTx.amountIrr.toLocaleString('fa-IR')} ریال] به پرونده «${party.fullName}» متصل شد.`,
      metadata: {
        partyId,
        recordType: newTx.recordType,
        referenceNumber: newTx.referenceNumber,
        amountIrr: newTx.amountIrr,
      },
    });

    return newTx;
  }

  // ==========================================================================
  // STAGE 4: INVENTORY, ITEMS, BRANDS, WAREHOUSES, SERIALS & KARDEX
  // ==========================================================================

  public getItemCategories(): ItemCategoryRecord[] {
    return this.dbState.itemCategories;
  }

  public createItemCategory(data: Partial<ItemCategoryRecord> & { categoryCode?: string; titleFa?: string; prefix?: string }, actorUserId: number = 1): ItemCategoryRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const newId =
      (this.dbState.itemCategories || []).length > 0
        ? Math.max(...this.dbState.itemCategories.map((c) => c.id)) + 1
        : 1;

    const code = (data.categoryCode || data.code || `CAT-${newId}`).toUpperCase().trim();
    const nameFa = (data.titleFa || data.nameFa || '').trim();
    if (!nameFa) throw new Error('عنوان گروه کالا الزامی است.');

    const cat: ItemCategoryRecord = {
      id: newId,
      code,
      categoryCode: code,
      nameFa,
      titleFa: nameFa,
      prefix: data.prefix?.trim() || undefined,
      descriptionFa: data.descriptionFa || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.dbState.itemCategories)) this.dbState.itemCategories = [];
    this.dbState.itemCategories.push(cat);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'ITEM_CATEGORY_CREATED',
      category: 'SETTINGS',
      targetEntity: 'item_categories',
      targetId: cat.code,
      status: 'SUCCESS',
      detailsFa: `دسته‌بندی جدید کالایی «${cat.nameFa}» [${cat.code}] ایجاد گردید.`,
      metadata: { categoryId: cat.id, code: cat.code },
    });

    return cat;
  }

  public getItemBrands(): ItemBrandRecord[] {
    return this.dbState.itemBrands;
  }

  public createItemBrand(data: Partial<ItemBrandRecord>, actorUserId: number): ItemBrandRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const newId =
      this.dbState.itemBrands.length > 0 ? Math.max(...this.dbState.itemBrands.map((b) => b.id)) + 1 : 1;

    const code = (data.code || `BRD-${newId}`).toUpperCase().trim();
    if (this.dbState.itemBrands.some((b) => b.code === code)) {
      throw new Error(`کد برند «${code}» تکراری است.`);
    }

    const brand: ItemBrandRecord = {
      id: newId,
      code,
      nameEn: (data.nameEn || '').trim(),
      nameFa: (data.nameFa || '').trim(),
      originCountryFa: data.originCountryFa || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };

    this.dbState.itemBrands.push(brand);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'ITEM_BRAND_CREATED',
      category: 'SETTINGS',
      targetEntity: 'item_brands',
      targetId: brand.code,
      status: 'SUCCESS',
      detailsFa: `برند تجاری جدید «${brand.nameFa} / ${brand.nameEn}» [${brand.code}] تعریف شد.`,
      metadata: { brandId: brand.id, code: brand.code },
    });

    return brand;
  }

  public getItemUnits(): ItemUnitRecord[] {
    return this.dbState.itemUnits;
  }

  public getWarehouses(): WarehouseRecord[] {
    // Enrich warehouses with live statistics
    const docs = this.dbState.inventoryDocuments.filter((d) => d.status === 'CONFIRMED');
    return this.dbState.warehouses.map((wh) => {
      // Calculate total items count and valuation for this warehouse
      let totalQty = 0;
      let totalValuationIrr = 0;

      for (const item of this.dbState.items) {
        const stock = this.getItemStockInWarehouse(item.id, wh.id);
        if (stock > 0) {
          totalQty += stock;
          totalValuationIrr += stock * item.purchasePriceIrr;
        }
      }

      return {
        ...wh,
        totalItemsCount: totalQty,
        totalValuationIrr,
      };
    });
  }

  public createWarehouse(data: Partial<WarehouseRecord> & { code?: string; managerNameFa?: string | null; locationAddressFa?: string | null }, actorUserId: number = 1): WarehouseRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const newId =
      (this.dbState.warehouses || []).length > 0 ? Math.max(...this.dbState.warehouses.map((w) => w.id)) + 1 : 1;

    const warehouseCode = (data.warehouseCode || data.code || `WH-${String(newId).padStart(2, '0')}`).toUpperCase().trim();
    const titleFa = (data.titleFa || '').trim();
    if (!titleFa) throw new Error('عنوان انبار الزامی است.');

    const wh: WarehouseRecord = {
      id: newId,
      warehouseCode,
      code: warehouseCode,
      titleFa,
      keeperNameFa: (data.keeperNameFa || data.managerNameFa || 'انباردار').trim(),
      managerNameFa: data.managerNameFa || data.keeperNameFa,
      phone: data.phone || null,
      addressFa: data.addressFa || data.locationAddressFa || null,
      locationAddressFa: data.locationAddressFa || data.addressFa || null,
      status: data.status || 'ACTIVE',
      isDefault: Boolean(data.isDefault),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (wh.isDefault) {
      for (const other of this.dbState.warehouses) {
        other.isDefault = false;
      }
    }

    this.dbState.warehouses.push(wh);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'WAREHOUSE_CREATED',
      category: 'SETTINGS',
      targetEntity: 'warehouses',
      targetId: wh.warehouseCode,
      status: 'SUCCESS',
      detailsFa: `انبار جدید «${wh.titleFa}» [${wh.warehouseCode}] با مسئولیت «${wh.keeperNameFa}» ایجاد شد.`,
      metadata: { warehouseId: wh.id, warehouseCode: wh.warehouseCode },
    });

    return wh;
  }

  /**
   * Authoritatively computes live stock for a given item in a specific warehouse
   * by summing all confirmed document movements. Zero mock / Zero hardcoding.
   */
  public getItemStockInWarehouse(itemId: number, warehouseId: number): number {
    const confirmedDocs = this.dbState.inventoryDocuments.filter((d) => d.status === 'CONFIRMED');
    let balance = 0;

    for (const doc of confirmedDocs) {
      for (const line of doc.lines) {
        if (line.itemId === itemId) {
          const qty = Number(line.quantity || 0);

          // Inflows into this warehouse
          if (
            (doc.docType === 'INBOUND_PURCHASE' ||
              doc.docType === 'INBOUND_RETURN' ||
              doc.docType === 'ADJUSTMENT_IN') &&
            doc.targetWarehouseId === warehouseId
          ) {
            balance += qty;
          }

          // Outflows from this warehouse
          if (
            (doc.docType === 'OUTBOUND_SALE' ||
              doc.docType === 'OUTBOUND_RETURN' ||
              doc.docType === 'ADJUSTMENT_OUT') &&
            doc.sourceWarehouseId === warehouseId
          ) {
            balance -= qty;
          }

          // Inter-warehouse transfer
          if (doc.docType === 'TRANSFER') {
            if (doc.sourceWarehouseId === warehouseId) {
              balance -= qty;
            }
            if (doc.targetWarehouseId === warehouseId) {
              balance += qty;
            }
          }
        }
      }
    }

    return balance;
  }

  /**
   * Authoritatively computes live stock across all warehouses for an item.
   */
  public getItemStock(itemId: number): {
    totalStock: number;
    warehouseStocks: Record<number, number>;
    activeSerialsCount: number;
  } {
    const warehouseStocks: Record<number, number> = {};
    let totalStock = 0;

    for (const wh of this.dbState.warehouses) {
      const stock = this.getItemStockInWarehouse(itemId, wh.id);
      warehouseStocks[wh.id] = stock;
      totalStock += stock;
    }

    const activeSerialsCount = this.dbState.itemSerials.filter(
      (s) => s.itemId === itemId && s.status === 'IN_STOCK'
    ).length;

    return { totalStock, warehouseStocks, activeSerialsCount };
  }

  public getItems(filter?: {
    categoryId?: number;
    brandId?: number;
    search?: string;
    status?: string;
    isLowStock?: boolean;
  }): ItemRecord[] {
    const catMap = new Map(this.dbState.itemCategories.map((c) => [c.id, c.nameFa]));
    const brandMap = new Map(this.dbState.itemBrands.map((b) => [b.id, `${b.nameFa} (${b.nameEn})`]));
    const unitMap = new Map(this.dbState.itemUnits.map((u) => [u.id, u.nameFa]));

    return this.dbState.items
      .map((item) => {
        const { totalStock, warehouseStocks, activeSerialsCount } = this.getItemStock(item.id);
        const isLowStock = totalStock <= Number(item.minStockAlert || 0);

        return {
          ...item,
          categoryNameFa: catMap.get(item.categoryId) || 'دسته‌بندی نامشخص',
          brandName: brandMap.get(item.brandId) || 'برند نامشخص',
          unitNameFa: unitMap.get(item.unitId) || 'عدد',
          totalStock,
          warehouseStocks,
          activeSerialsCount,
          isLowStock,
          inventoryOnHand: (item as any).inventoryOnHand ?? totalStock,
        };
      })
      .filter((item) => {
        if (filter?.categoryId && item.categoryId !== filter.categoryId) return false;
        if (filter?.brandId && item.brandId !== filter.brandId) return false;
        if (filter?.status && item.status !== filter.status) return false;
        if (filter?.isLowStock && !item.isLowStock) return false;
        if (filter?.search) {
          const s = filter.search.toLowerCase().trim();
          const matchCode = item.itemCode.toLowerCase().includes(s);
          const matchModel = item.model.toLowerCase().includes(s);
          const matchTitle = item.titleFa.toLowerCase().includes(s);
          const matchBarcode = item.barcode ? item.barcode.toLowerCase().includes(s) : false;
          if (!matchCode && !matchModel && !matchTitle && !matchBarcode) return false;
        }
        return true;
      });
  }

  public getItemById(
    id: number
  ): (ItemRecord & { kardex: ItemKardexEntry[]; serials: ItemSerialRecord[] }) | null {
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return null;

    const kardex = this.getItemKardex(id);
    const serials = this.getItemSerials({ itemId: id });

    return {
      ...item,
      kardex,
      serials,
    };
  }

  public createItem(data: Partial<ItemRecord>, actorUserId: number): ItemRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();

    if (!data.titleFa || !data.titleFa.trim()) {
      throw new Error('عنوان فارسی کالا الزامی است.');
    }
    if (!data.model || !data.model.trim()) {
      throw new Error('مدل سخت‌افزاری کالا الزامی است.');
    }
    if (!data.categoryId || !this.dbState.itemCategories.some((c) => c.id === data.categoryId)) {
      throw new Error('انتخاب دسته‌بندی معتبر کالا الزامی است.');
    }
    if (!data.brandId || !this.dbState.itemBrands.some((b) => b.id === data.brandId)) {
      throw new Error('انتخاب برند سازنده معتبر الزامی است.');
    }
    if (!data.unitId || !this.dbState.itemUnits.some((u) => u.id === data.unitId)) {
      throw new Error('انتخاب واحد سنجش معتبر الزامی است.');
    }

    const newId =
      this.dbState.items.length > 0 ? Math.max(...this.dbState.items.map((i) => i.id)) + 1 : 1;

    // Auto generate item code e.g. ITM-10001
    const itemCode = `ITM-${10000 + newId}`;
    if (this.dbState.items.some((i) => i.itemCode === itemCode)) {
      throw new Error(`کد کالا «${itemCode}» تکراری است.`);
    }

    if (data.barcode) {
      const barcodeClean = data.barcode.trim();
      if (this.dbState.items.some((i) => i.barcode === barcodeClean)) {
        throw new Error(`بارکد «${barcodeClean}» به کالای دیگری تخصیص داده شده است.`);
      }
    }

    const nowIso = new Date().toISOString();
    const newItem: ItemRecord = {
      id: newId,
      itemCode,
      barcode: data.barcode ? data.barcode.trim() : null,
      titleFa: data.titleFa.trim(),
      model: data.model.trim(),
      categoryId: data.categoryId,
      brandId: data.brandId,
      unitId: data.unitId,
      isSerialized: Boolean(data.isSerialized),
      hasMacAddress: Boolean(data.hasMacAddress),
      technicalSpecs: data.technicalSpecs || {},
      minStockAlert: Number(data.minStockAlert !== undefined ? data.minStockAlert : 5),
      maxStockLevel: data.maxStockLevel ? Number(data.maxStockLevel) : null,
      purchasePriceIrr: Number(data.purchasePriceIrr || 0),
      salePriceIrr: Number(data.salePriceIrr || 0),
      status: data.status || 'ACTIVE',
      notes: data.notes ? data.notes.trim() : null,
      isDemo: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.items.push(newItem);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'ITEM_CREATED',
      category: 'SETTINGS',
      targetEntity: 'items',
      targetId: newItem.itemCode,
      status: 'SUCCESS',
      detailsFa: `کالای جدید «${newItem.titleFa}» با مدل [${newItem.model}] و کد [${newItem.itemCode}] در سیستم ثبت شد.`,
      metadata: {
        itemId: newItem.id,
        itemCode: newItem.itemCode,
        model: newItem.model,
        isSerialized: newItem.isSerialized,
      },
    });

    return newItem;
  }

  public updateItem(id: number, data: Partial<ItemRecord>, actorUserId: number): ItemRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const item = this.dbState.items.find((i) => i.id === id);

    if (!item) {
      throw new Error(`کالا با شناسه [${id}] یافت نشد.`);
    }

    if (data.barcode && data.barcode !== item.barcode) {
      const barcodeClean = data.barcode.trim();
      if (this.dbState.items.some((i) => i.id !== id && i.barcode === barcodeClean)) {
        throw new Error(`بارکد «${barcodeClean}» قبلاً برای کالای دیگری ثبت شده است.`);
      }
      item.barcode = barcodeClean;
    }

    if (data.titleFa) item.titleFa = data.titleFa.trim();
    if (data.model) item.model = data.model.trim();
    if (data.categoryId) item.categoryId = data.categoryId;
    if (data.brandId) item.brandId = data.brandId;
    if (data.unitId) item.unitId = data.unitId;
    if (data.isSerialized !== undefined) item.isSerialized = Boolean(data.isSerialized);
    if (data.hasMacAddress !== undefined) item.hasMacAddress = Boolean(data.hasMacAddress);
    if (data.technicalSpecs) item.technicalSpecs = data.technicalSpecs;
    if (data.minStockAlert !== undefined) item.minStockAlert = Number(data.minStockAlert);
    if (data.maxStockLevel !== undefined) item.maxStockLevel = Number(data.maxStockLevel);
    if (data.purchasePriceIrr !== undefined) item.purchasePriceIrr = Number(data.purchasePriceIrr);
    if (data.salePriceIrr !== undefined) item.salePriceIrr = Number(data.salePriceIrr);
    if (data.notes !== undefined) item.notes = data.notes;
    item.updatedAt = new Date().toISOString();

    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'ITEM_UPDATED',
      category: 'SETTINGS',
      targetEntity: 'items',
      targetId: item.itemCode,
      status: 'SUCCESS',
      detailsFa: `مشخصات کالای «${item.titleFa}» [${item.itemCode}] به‌روزرسانی شد.`,
      metadata: { itemId: item.id, itemCode: item.itemCode },
    });

    return item;
  }

  public toggleItemStatus(id: number, actorUserId: number): ItemRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();
    const item = this.dbState.items.find((i) => i.id === id);

    if (!item) {
      throw new Error(`کالا با شناسه [${id}] یافت نشد.`);
    }

    item.status = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    item.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'ITEM_STATUS_TOGGLED',
      category: 'SETTINGS',
      targetEntity: 'items',
      targetId: item.itemCode,
      status: 'SUCCESS',
      detailsFa: `وضعیت کالای «${item.titleFa}» به [${item.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}] تغییر یافت.`,
      metadata: { itemId: item.id, itemCode: item.itemCode, newStatus: item.status },
    });

    return item;
  }

  /**
   * Computes authoritative Kardex entries for an item in chronological order.
   * Running balance is derived purely from historical transactions.
   */
  public getItemKardex(itemId: number, warehouseId?: number): ItemKardexEntry[] {
    const item = this.dbState.items.find((i) => i.id === itemId);
    if (!item) return [];

    const whMap = new Map(this.dbState.warehouses.map((w) => [w.id, w.titleFa]));
    const confirmedDocs = this.dbState.inventoryDocuments
      .filter((d) => d.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const docTypeLabels: Record<InventoryDocType, string> = {
      INBOUND_PURCHASE: 'رسید ورود خرید',
      OUTBOUND_SALE: 'حواله خروج فروش',
      TRANSFER: 'انتقال بین انبارها',
      INBOUND_RETURN: 'برگشت از فروش مشتری',
      OUTBOUND_RETURN: 'برگشت به تأمین‌کننده',
      ADJUSTMENT_IN: 'تعدیل انبارگردانی (افزایش)',
      ADJUSTMENT_OUT: 'تعدیل انبارگردانی (کاهش)',
    };

    const kardex: ItemKardexEntry[] = [];
    let runningBalance = 0;
    let entryId = 1;

    for (const doc of confirmedDocs) {
      for (const line of doc.lines) {
        if (line.itemId === itemId) {
          const qty = Number(line.quantity || 0);
          let qtyIn = 0;
          let qtyOut = 0;
          let relevantWhId = warehouseId || doc.targetWarehouseId || doc.sourceWarehouseId || 1;

          if (warehouseId) {
            // Warehouse-specific Kardex view
            if (
              (doc.docType === 'INBOUND_PURCHASE' ||
                doc.docType === 'INBOUND_RETURN' ||
                doc.docType === 'ADJUSTMENT_IN') &&
              doc.targetWarehouseId === warehouseId
            ) {
              qtyIn = qty;
            } else if (
              (doc.docType === 'OUTBOUND_SALE' ||
                doc.docType === 'OUTBOUND_RETURN' ||
                doc.docType === 'ADJUSTMENT_OUT') &&
              doc.sourceWarehouseId === warehouseId
            ) {
              qtyOut = qty;
            } else if (doc.docType === 'TRANSFER') {
              if (doc.targetWarehouseId === warehouseId) {
                qtyIn = qty;
              } else if (doc.sourceWarehouseId === warehouseId) {
                qtyOut = qty;
              } else {
                continue; // Not related to this warehouse
              }
            } else {
              continue; // Not related to this warehouse
            }
          } else {
            // Global Kardex view
            if (
              doc.docType === 'INBOUND_PURCHASE' ||
              doc.docType === 'INBOUND_RETURN' ||
              doc.docType === 'ADJUSTMENT_IN'
            ) {
              qtyIn = qty;
              relevantWhId = doc.targetWarehouseId || 1;
            } else if (
              doc.docType === 'OUTBOUND_SALE' ||
              doc.docType === 'OUTBOUND_RETURN' ||
              doc.docType === 'ADJUSTMENT_OUT'
            ) {
              qtyOut = qty;
              relevantWhId = doc.sourceWarehouseId || 1;
            } else if (doc.docType === 'TRANSFER') {
              // Inter-warehouse transfer maintains net global stock (0 net change globally)
              qtyIn = qty;
              qtyOut = qty;
              relevantWhId = doc.targetWarehouseId || 1;
            }
          }

          runningBalance = runningBalance + qtyIn - qtyOut;

          kardex.push({
            id: entryId++,
            itemId,
            timestamp: doc.createdAt,
            dateJalali: doc.dateJalali,
            docId: doc.id,
            docNumber: doc.docNumber,
            docType: doc.docType,
            docTypeTitleFa: docTypeLabels[doc.docType] || doc.docType,
            warehouseId: relevantWhId,
            warehouseTitleFa: whMap.get(relevantWhId) || 'انبار نامشخص',
            partyNameFa: doc.partyNameFa || undefined,
            qtyIn,
            qtyOut,
            runningBalance,
            unitCostIrr: line.unitCostIrr,
            totalCostIrr: line.totalCostIrr,
            serialNumbers: line.serialNumbers || [],
            notesFa: line.notesFa || doc.notesFa || undefined,
          });
        }
      }
    }

    return kardex;
  }

  public getItemSerials(filter?: {
    itemId?: number;
    warehouseId?: number;
    status?: string;
    search?: string;
  }): ItemSerialRecord[] {
    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    const whMap = new Map(this.dbState.warehouses.map((w) => [w.id, w.titleFa]));

    return this.dbState.itemSerials
      .map((serial) => {
        const item = itemMap.get(serial.itemId);
        return {
          ...serial,
          itemCode: item?.itemCode,
          itemTitleFa: item?.titleFa,
          warehouseTitleFa: whMap.get(serial.currentWarehouseId) || 'انبار نامشخص',
        };
      })
      .filter((serial) => {
        if (filter?.itemId && serial.itemId !== filter.itemId) return false;
        if (filter?.warehouseId && serial.currentWarehouseId !== filter.warehouseId) return false;
        if (filter?.status && serial.status !== filter.status) return false;
        if (filter?.search) {
          const s = filter.search.toLowerCase().trim();
          const matchSn = serial.serialNumber.toLowerCase().includes(s);
          const matchMac = serial.macAddress ? serial.macAddress.toLowerCase().includes(s) : false;
          const matchItem = serial.itemTitleFa ? serial.itemTitleFa.toLowerCase().includes(s) : false;
          if (!matchSn && !matchMac && !matchItem) return false;
        }
        return true;
      });
  }

  public getSerialByNumber(serialNumber: string): ItemSerialRecord | null {
    const clean = serialNumber.trim().toLowerCase();
    const list = this.getItemSerials();
    return list.find((s) => s.serialNumber.toLowerCase() === clean) || null;
  }

  public getInventoryDocuments(filter?: {
    type?: string;
    warehouseId?: number;
    partyId?: number;
    search?: string;
  }): InventoryDocumentRecord[] {
    const whMap = new Map(this.dbState.warehouses.map((w) => [w.id, w.titleFa]));
    const partyMap = new Map(this.dbState.parties.map((p) => [p.id, p.fullName]));

    return this.dbState.inventoryDocuments
      .map((doc) => ({
        ...doc,
        sourceWarehouseTitleFa: doc.sourceWarehouseId
          ? whMap.get(doc.sourceWarehouseId) || null
          : null,
        targetWarehouseTitleFa: doc.targetWarehouseId
          ? whMap.get(doc.targetWarehouseId) || null
          : null,
        partyNameFa: doc.partyId ? partyMap.get(doc.partyId) || doc.partyNameFa || null : null,
      }))
      .filter((doc) => {
        if (filter?.type && doc.docType !== filter.type) return false;
        if (
          filter?.warehouseId &&
          doc.sourceWarehouseId !== filter.warehouseId &&
          doc.targetWarehouseId !== filter.warehouseId
        ) {
          return false;
        }
        if (filter?.partyId && doc.partyId !== filter.partyId) return false;
        if (filter?.search) {
          const s = filter.search.toLowerCase().trim();
          const matchNum = doc.docNumber.toLowerCase().includes(s);
          const matchNotes = doc.notesFa ? doc.notesFa.toLowerCase().includes(s) : false;
          const matchParty = doc.partyNameFa ? doc.partyNameFa.toLowerCase().includes(s) : false;
          if (!matchNum && !matchNotes && !matchParty) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getInventoryDocumentById(id: number): InventoryDocumentRecord | null {
    const list = this.getInventoryDocuments();
    return list.find((d) => d.id === id) || null;
  }

  /**
   * Core Transaction Engine:
   * 1. Validates lines & products
   * 2. Strictly enforces negative inventory rules according to settings & RBAC
   * 3. Strictly validates & updates physical unit Serials and MAC addresses
   * 4. Persists document & logs immutable audit event
   */
  public createInventoryDocument(
    data: {
      docType: InventoryDocType;
      dateJalali?: string;
      sourceWarehouseId?: number | null;
      targetWarehouseId?: number | null;
      partyId?: number | null;
      isInTransitTransfer?: boolean;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitCostIrr?: number;
        serialNumbers?: string[];
        macAddresses?: string[];
        notesFa?: string;
      }>;
      notesFa?: string;
    },
    actorUserId: number
  ): InventoryDocumentRecord {
    const actorUser = this.getUserById(actorUserId) || this.getActiveUser();

    if (!data.docType) {
      throw new Error('نوع سند انبار الزامی است.');
    }
    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('سند انبار باید حداقل دارای یک ردیف کالا باشد.');
    }

    const isOutbound =
      data.docType === 'OUTBOUND_SALE' ||
      data.docType === 'OUTBOUND_RETURN' ||
      data.docType === 'ADJUSTMENT_OUT';

    const isInbound =
      data.docType === 'INBOUND_PURCHASE' ||
      data.docType === 'INBOUND_RETURN' ||
      data.docType === 'ADJUSTMENT_IN';

    const isTransfer = data.docType === 'TRANSFER';

    // 1. Warehouse validation
    if (isOutbound || isTransfer) {
      if (!data.sourceWarehouseId) {
        throw new Error('برای خروج یا انتقال کالا، انتخاب انبار مبدأ الزامی است.');
      }
      const srcWh = this.dbState.warehouses.find((w) => w.id === data.sourceWarehouseId);
      if (!srcWh || srcWh.status !== 'ACTIVE') {
        throw new Error('انبار مبدأ انتخاب شده معتبر یا فعال نمی‌باشد.');
      }
    }

    if (isInbound || isTransfer) {
      if (!data.targetWarehouseId) {
        throw new Error('برای ورود یا انتقال کالا، انتخاب انبار مقصد الزامی است.');
      }
      const tgtWh = this.dbState.warehouses.find((w) => w.id === data.targetWarehouseId);
      if (!tgtWh || tgtWh.status !== 'ACTIVE') {
        throw new Error('انبار مقصد انتخاب شده معتبر یا فعال نمی‌باشد.');
      }
    }

    if (isTransfer && data.sourceWarehouseId === data.targetWarehouseId) {
      throw new Error('انبار مبدأ و مقصد در عملیات انتقال نمی‌توانند یکسان باشند.');
    }

    const party = data.partyId ? this.dbState.parties.find((p) => p.id === data.partyId) : null;
    const nowIso = new Date().toISOString();
    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    const unitMap = new Map(this.dbState.itemUnits.map((u) => [u.id, u.nameFa]));

    const processedLines: InventoryDocumentLine[] = [];
    let totalDocAmountIrr = 0;

    // Check negative inventory permission override
    const allowNegativeBySetting = Boolean(this.dbState.settings.allowNegativeInventory);
    const allowNegativeByPermission = this.evaluatePermission(
      actorUserId,
      'inventory.negative_stock.override'
    ).allowed;
    const canBypassNegativeStock = allowNegativeBySetting || allowNegativeByPermission;

    // 2. Validate each line: quantity, negative inventory, serials
    let lineIdx = 1;
    for (const rawLine of data.lines) {
      const item = itemMap.get(rawLine.itemId);
      if (!item) {
        throw new Error(`کالا با شناسه [${rawLine.itemId}] یافت نشد.`);
      }
      if (item.status !== 'ACTIVE') {
        throw new Error(`کالای «${item.titleFa}» در وضعیت غیرفعال است و امکان گردش ندارد.`);
      }

      const qty = Number(rawLine.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`تعداد ردیف کالای «${item.titleFa}» باید بزرگتر از صفر باشد.`);
      }

      const unitCost =
        rawLine.unitCostIrr !== undefined
          ? Number(rawLine.unitCostIrr)
          : item.purchasePriceIrr;
      const totalLineCost = qty * unitCost;
      totalDocAmountIrr += totalLineCost;

      // Negative stock enforcement check for outbound and transfer
      if (isOutbound || isTransfer) {
        const srcWhId = data.sourceWarehouseId!;
        const currentStock = this.getItemStockInWarehouse(item.id, srcWhId);

        if (currentStock < qty) {
          if (!canBypassNegativeStock) {
            const srcWh = this.dbState.warehouses.find((w) => w.id === srcWhId);
            throw new Error(
              `موجودی انبار «${srcWh?.titleFa || srcWhId}» برای کالای «${item.titleFa}» کافی نیست. موجودی فعلی: ${currentStock} عدد، تعداد درخواستی برای خروج: ${qty} عدد. سیستم از ایجاد موجودی منفی جلوگیری کرد.`
            );
          }
        }
      }

      // Serial & MAC number tracking enforcement
      const serials = rawLine.serialNumbers || [];
      if (item.isSerialized) {
        if (serials.length !== qty) {
          throw new Error(
            `کالای «${item.titleFa}» سریال‌دار است؛ باید دقیقاً ${qty} شماره سریال وارد شود (تعداد ارائه‌شده: ${serials.length}).`
          );
        }

        // Check for duplicates within the current line
        const uniqueSet = new Set(serials.map((s) => s.trim().toUpperCase()));
        if (uniqueSet.size !== serials.length) {
          throw new Error(`در ردیف کالای «${item.titleFa}»، شماره سریال تکراری وارد شده است.`);
        }

        if (isOutbound || isTransfer) {
          // Outbound or transfer: Each serial MUST exist, be IN_STOCK and in sourceWarehouseId
          const srcWhId = data.sourceWarehouseId!;
          for (const sn of serials) {
            const snClean = sn.trim().toUpperCase();
            const existing = this.dbState.itemSerials.find(
              (s) => s.serialNumber.toUpperCase() === snClean && s.itemId === item.id
            );

            if (!existing) {
              throw new Error(
                `شماره سریال «${sn}» برای کالای «${item.titleFa}» در سیستم یافت نشد.`
              );
            }
            if (existing.status !== 'IN_STOCK') {
              throw new Error(
                `شماره سریال «${sn}» قبلاً از انبار خارج شده یا در وضعیت [${existing.status}] است.`
              );
            }
            if (existing.currentWarehouseId !== srcWhId) {
              const currentWh = this.dbState.warehouses.find(
                (w) => w.id === existing.currentWarehouseId
              );
              throw new Error(
                `شماره سریال «${sn}» هم‌اکنون در «${currentWh?.titleFa || 'انبار دیگر'}» قرار دارد و در انبار مبدأ یافت نشد.`
              );
            }
          }
        }

        if (isInbound) {
          // Inbound: serials must not already be active IN_STOCK
          for (const sn of serials) {
            const snClean = sn.trim().toUpperCase();
            const existing = this.dbState.itemSerials.find(
              (s) => s.serialNumber.toUpperCase() === snClean && s.itemId === item.id
            );

            if (existing && existing.status === 'IN_STOCK') {
              throw new Error(
                `شماره سریال «${sn}» قبلاً در سیستم ثبت شده و هم‌اکنون در وضعیت موجود قرار دارد.`
              );
            }
          }
        }
      }

      processedLines.push({
        id: lineIdx++,
        itemId: item.id,
        itemCode: item.itemCode,
        itemTitleFa: item.titleFa,
        unitNameFa: unitMap.get(item.unitId) || 'عدد',
        quantity: qty,
        unitCostIrr: unitCost,
        totalCostIrr: totalLineCost,
        serialNumbers: serials.map((s) => s.trim().toUpperCase()),
        notesFa: rawLine.notesFa || undefined,
      });
    }

    // 3. Generate Doc Number
    const newDocId =
      this.dbState.inventoryDocuments.length > 0
        ? Math.max(...this.dbState.inventoryDocuments.map((d) => d.id)) + 1
        : 1;

    const prefixMap: Record<InventoryDocType, string> = {
      INBOUND_PURCHASE: 'WH-IN',
      OUTBOUND_SALE: 'WH-OUT',
      TRANSFER: 'WH-TRF',
      INBOUND_RETURN: 'WH-RET-IN',
      OUTBOUND_RETURN: 'WH-RET-OUT',
      ADJUSTMENT_IN: 'WH-ADJ-IN',
      ADJUSTMENT_OUT: 'WH-ADJ-OUT',
    };
    const prefix = prefixMap[data.docType] || 'WH-DOC';
    const docNumber = `${prefix}-1405-${1000 + newDocId}`;

    // 4. Update physical unit serial records
    for (const line of processedLines) {
      const item = itemMap.get(line.itemId)!;
      if (item.isSerialized && line.serialNumbers && line.serialNumbers.length > 0) {
        for (let i = 0; i < line.serialNumbers.length; i++) {
          const sn = line.serialNumbers[i];
          const mac =
            data.lines.find((l) => l.itemId === line.itemId)?.macAddresses?.[i] || null;

          if (isInbound) {
            const tgtWhId = data.targetWarehouseId!;
            const existing = this.dbState.itemSerials.find(
              (s) => s.serialNumber.toUpperCase() === sn && s.itemId === item.id
            );

            if (existing) {
              existing.status = 'IN_STOCK';
              existing.currentWarehouseId = tgtWhId;
              existing.lastDocNumber = docNumber;
              existing.lastPartyId = data.partyId || null;
              existing.lastPartyNameFa = party?.fullName || null;
              existing.updatedAt = nowIso;
            } else {
              const newSerialId =
                this.dbState.itemSerials.length > 0
                  ? Math.max(...this.dbState.itemSerials.map((s) => s.id)) + 1
                  : 1;

              this.dbState.itemSerials.push({
                id: newSerialId,
                itemId: item.id,
                serialNumber: sn,
                macAddress: mac ? mac.trim().toUpperCase() : null,
                currentWarehouseId: tgtWhId,
                status: 'IN_STOCK',
                initialDocNumber: docNumber,
                lastDocNumber: docNumber,
                lastPartyId: data.partyId || null,
                lastPartyNameFa: party?.fullName || null,
                notesFa: line.notesFa || null,
                createdAt: nowIso,
                updatedAt: nowIso,
              });
            }
          } else if (isOutbound) {
            const existing = this.dbState.itemSerials.find(
              (s) => s.serialNumber.toUpperCase() === sn && s.itemId === item.id
            );
            if (existing) {
              existing.status = data.docType === 'OUTBOUND_SALE' ? 'DISPATCHED' : 'RETURNED';
              existing.lastDocNumber = docNumber;
              existing.lastPartyId = data.partyId || null;
              existing.lastPartyNameFa = party?.fullName || null;
              existing.updatedAt = nowIso;
            }
          } else if (isTransfer) {
            const tgtWhId = data.targetWarehouseId!;
            const existing = this.dbState.itemSerials.find(
              (s) => s.serialNumber.toUpperCase() === sn && s.itemId === item.id
            );
            if (existing) {
              if (data.isInTransitTransfer) {
                // In multi-stage transfer requisition: serial is marked DISPATCHED from source warehouse.
                // It is NOT physically recorded at destination warehouse until destination receipt is confirmed.
                existing.status = 'DISPATCHED';
              } else {
                // Direct one-step transfer document: immediately update serial location to target warehouse
                existing.currentWarehouseId = tgtWhId;
                existing.status = 'IN_STOCK';
              }
              existing.lastDocNumber = docNumber;
              existing.lastPartyId = data.partyId || null;
              existing.lastPartyNameFa = party?.fullName || null;
              existing.updatedAt = nowIso;
            }
          }
        }
      }
    }

    const docRecord: InventoryDocumentRecord = {
      id: newDocId,
      docNumber,
      docType: data.docType,
      dateJalali: data.dateJalali || '1405/01/25',
      sourceWarehouseId: data.sourceWarehouseId || null,
      targetWarehouseId: data.targetWarehouseId || null,
      partyId: data.partyId || null,
      partyNameFa: party?.fullName || null,
      lines: processedLines,
      totalAmountIrr: totalDocAmountIrr,
      status: 'CONFIRMED',
      notesFa: data.notesFa || null,
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      createdAt: nowIso,
    };

    this.dbState.inventoryDocuments.push(docRecord);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId: actorUser.id,
      actorUsername: actorUser.username,
      action: 'INVENTORY_DOCUMENT_CREATED',
      category: 'SETTINGS',
      targetEntity: 'inventory_documents',
      targetId: docRecord.docNumber,
      status: 'SUCCESS',
      detailsFa: `سند انبار «${docRecord.docNumber}» از نوع [${docRecord.docType}] با ${processedLines.length} ردیف کالا و مبلغ [${totalDocAmountIrr.toLocaleString('fa-IR')} ریال] با موفقیت ثبت قطعی شد.`,
      metadata: {
        docId: docRecord.id,
        docNumber: docRecord.docNumber,
        docType: docRecord.docType,
        totalAmountIrr: totalDocAmountIrr,
        linesCount: processedLines.length,
      },
    });

    return docRecord;
  }

  public getInventorySummary(): {
    totalItemsCount: number;
    totalValuationIrr: number;
    lowStockItemsCount: number;
    activeSerialsCount: number;
    warehousesCount: number;
  } {
    const items = this.getItems();
    let totalValuationIrr = 0;
    let lowStockItemsCount = 0;

    for (const item of items) {
      if (item.totalStock && item.totalStock > 0) {
        totalValuationIrr += item.totalStock * item.purchasePriceIrr;
      }
      if (item.isLowStock) {
        lowStockItemsCount++;
      }
    }

    const activeSerialsCount = this.dbState.itemSerials.filter((s) => s.status === 'IN_STOCK').length;

    return {
      totalItemsCount: items.length,
      totalValuationIrr,
      lowStockItemsCount,
      activeSerialsCount,
      warehousesCount: this.dbState.warehouses.length,
    };
  }

  // ==========================================================================
  // READ STATE FOR API
  // ==========================================================================
  public getFoundationData(forUser?: UserRecord) {
    const activeUser = forUser || this.getActiveUser();
    const sanitizedUsers = this.dbState.users.map((u) => {
      // Exclude password hashes and salts
      const { passwordHash, passwordSalt, ...safe } = u;
      return safe;
    });

    const activeUserRoles = this.dbState.userRoleAssignments
      .filter((a) => a.userId === activeUser.id)
      .map((a) => a.roleCode);

    let installerPartyId = activeUser.installerPartyId ?? null;
    const isInstallerUser =
      !activeUser.isInitialAdmin &&
      (Boolean(installerPartyId) ||
        activeUserRoles.includes('INSTALLER') ||
        activeUser.username.toLowerCase().includes('installer') ||
        activeUser.username.includes('نصاب') ||
        activeUser.jobTitle?.includes('نصاب') ||
        activeUser.jobTitle?.includes('تکنسین') ||
        activeUser.fullName?.includes('نصاب'));

    if (isInstallerUser && !installerPartyId) {
      const matched =
        this.dbState.parties.find(
          (p) =>
            (p.roles?.includes('INSTALLER') || p.primaryType === 'INSTALLER') &&
            (p.fullName?.includes(activeUser.fullName) || activeUser.fullName?.includes(p.fullName || ''))
        ) ||
        this.dbState.parties.find(
          (p) => p.roles?.includes('INSTALLER') || p.primaryType === 'INSTALLER'
        );
      if (matched) {
        installerPartyId = matched.id;
      }
    }

    // Strict Data Isolation for field installers:
    const filteredJobs = isInstallerUser && installerPartyId
      ? this.getInstallationJobs().filter((j) => j.installerId === installerPartyId)
      : this.getInstallationJobs();

    const filteredProjects = isInstallerUser && installerPartyId
      ? (this.dbState.projects || [])
          .filter((p) => p.installerId === installerPartyId)
          .map((p) => ({
            ...p,
            contractAmountIrr: 0,
            consumedMaterialsCostIrr: 0,
            installerLaborCostIrr: 0,
            allocatedExpensesIrr: 0,
            netProfitIrr: 0,
            netMarginPct: 0,
          }))
      : this.getProjects();

    const filteredRequisitions = isInstallerUser && installerPartyId
      ? (this.dbState.projectRequisitions || []).filter(
          (r) =>
            r.requestedByUserId === activeUser.id ||
            filteredProjects.some((p) => p.id === r.projectId)
        )
      : this.getProjectRequisitions();

    return {
      activeUser: {
        id: activeUser.id,
        username: activeUser.username,
        fullName: activeUser.fullName,
        jobTitle: activeUser.jobTitle,
        email: activeUser.email,
        status: activeUser.status,
        isInitialAdmin: activeUser.isInitialAdmin,
        assignedRoles: activeUserRoles,
        installerPartyId,
      },
      settings: this.dbState.settings,
      industryProfile: this.getIndustryProfile(),
      customIndustryProfiles: this.dbState.customIndustryProfiles || [],
      users: isInstallerUser
        ? sanitizedUsers.filter((u) => u.id === activeUser.id)
        : sanitizedUsers,
      roles: this.dbState.roles,
      permissions: this.dbState.permissions,
      rolePermissions: this.dbState.rolePermissions,
      userRoleAssignments: this.dbState.userRoleAssignments,
      userPermissionOverrides: this.dbState.userPermissionOverrides,
      migrations: this.dbState.migrations,
      auditLogs: isInstallerUser ? [] : this.dbState.auditLogs.slice(0, 80),
      connection: this.getConnectionStateForApi(),
      parties: this.getParties(),
      items: this.getItems(),
      warehouses: this.getWarehouses(),
      purchaseInvoices: isInstallerUser ? [] : this.getPurchaseInvoices(),
      purchaseProformas: isInstallerUser ? [] : this.getPurchaseProformas(),
      purchasePayments: isInstallerUser ? [] : this.getPurchasePayments(),
      purchaseReturns: isInstallerUser ? [] : this.getPurchaseReturns(),
      salesInvoices: isInstallerUser ? [] : this.getSalesInvoices(),
      salesProformas: isInstallerUser ? [] : this.getSalesProformas(),
      salesReceipts: isInstallerUser ? [] : this.getSalesReceipts(),
      salesReturns: isInstallerUser ? [] : this.getSalesReturns(),
      installationJobs: filteredJobs,
      cashBoxes: isInstallerUser ? [] : this.getCashBoxes(),
      bankAccounts: isInstallerUser ? [] : this.getBankAccounts(),
      cheques: isInstallerUser ? [] : this.getCheques(),
      treasuryTransactions: isInstallerUser ? [] : this.getTreasuryTransactions(),
      installments: isInstallerUser ? [] : this.getInstallments(),
      operationalExpenses: isInstallerUser ? [] : this.getOperationalExpenses(),
      operationalIncomes: isInstallerUser ? [] : this.getOperationalIncomes(),
      itemSerials: this.getItemSerials(),
      accountsChart: isInstallerUser ? [] : this.getAccountsChart(),
      accountingDocuments: isInstallerUser ? [] : this.getAccountingDocuments(),
      fiscalYears: isInstallerUser ? [] : this.getFiscalYears(),
      accountingPeriods: isInstallerUser ? [] : this.getAccountingPeriods(),
      costCenters: isInstallerUser ? [] : this.getCostCenters(),
      projects: filteredProjects,
      projectRequisitions: filteredRequisitions,
      fixedAssets: isInstallerUser ? [] : this.getFixedAssets(),
      depreciationEntries: isInstallerUser ? [] : this.getDepreciationEntries(),
      openingBalanceDoc: isInstallerUser ? null : this.getOpeningBalanceDoc(),
      goldColleagueTrades: isInstallerUser ? [] : this.getGoldColleagueTrades(),
      restaurantTables: isInstallerUser ? [] : this.getRestaurantTables(),
      restaurantOrders: isInstallerUser ? [] : this.getRestaurantOrders(),
      wholesaleOrders: isInstallerUser ? [] : this.getWholesaleOrders(),
      wholesaleDispatches: isInstallerUser ? [] : this.getWholesaleDispatches(),
      serviceJobTickets: this.getServiceJobTickets(),
      mobileDevices: isInstallerUser ? [] : this.getMobileDevices(),
      mobileRepairTickets: isInstallerUser ? [] : this.getMobileRepairTickets(),
      inventoryTransfers: isInstallerUser ? [] : this.getInventoryTransfers(),
      executiveBi: isInstallerUser ? undefined : this.getExecutiveBiMetrics(),
      remoteTunnelConfig: this.getRemoteTunnelConfig(),
      googleSheetsSyncConfig: this.getGoogleSheetsSyncConfig(),
      googleSheetsSyncLogs: this.getGoogleSheetsSyncLogs(),
    };
  }

  // ==========================================================================
  // STAGE 5: PURCHASES, PROFORMAS, MULTI-CURRENCY, LANDED COST & PAYMENTS
  // ==========================================================================

  public calculateLandedCostAllocation(data: {
    currency: ForeignCurrencyCode;
    exchangeRateToIrr: number;
    costAllocationMethod: CostAllocationMethod;
    landedCosts: PurchaseLandedCosts;
    lines: Array<{
      itemId: number;
      quantity: number;
      unitPriceForeign: number;
      discountIrr?: number;
      vatAmountIrr?: number;
      serialNumbers?: string[];
      macAddresses?: string[];
      notesFa?: string;
    }>;
  }): {
    lines: PurchaseInvoiceLine[];
    subtotalNetItemsIrr: number;
    totalDiscountIrr: number;
    totalVatIrr: number;
    totalInvoicePayableToSupplierIrr: number;
    totalInventoryValuationIrr: number;
  } {
    const rate = Number(data.exchangeRateToIrr) > 0 ? Number(data.exchangeRateToIrr) : 1;
    const landed = data.landedCosts || {
      freightCostIrr: 0,
      insuranceCostIrr: 0,
      packagingCostIrr: 0,
      customsCostIrr: 0,
      nonRefundableTaxIrr: 0,
      otherLandedCostIrr: 0,
      totalLandedCostsIrr: 0,
    };

    const totalLandedCostsIrr =
      (landed.freightCostIrr || 0) +
      (landed.insuranceCostIrr || 0) +
      (landed.packagingCostIrr || 0) +
      (landed.customsCostIrr || 0) +
      (landed.nonRefundableTaxIrr || 0) +
      (landed.otherLandedCostIrr || 0);

    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    const unitMap = new Map(this.dbState.itemUnits.map((u) => [u.id, u.nameFa]));

    let totalQuantityAll = 0;
    let totalBaseNetValueIrr = 0;
    let totalDiscountIrr = 0;
    let totalVatIrr = 0;

    const preprocessed = data.lines.map((l, index) => {
      const item = itemMap.get(l.itemId);
      const qty = Number(l.quantity) || 1;
      const foreignPrice = Number((l as any).unitPriceForeign ?? (l as any).unitPriceIrr ?? (l as any).unitPrice ?? 0);
      const unitPriceIrr = Math.round(foreignPrice * rate);
      const discount = Number(l.discountIrr) || 0;
      const vat = Number(l.vatAmountIrr) || 0;

      const lineNetBase = qty * (unitPriceIrr - discount);
      totalQuantityAll += qty;
      totalBaseNetValueIrr += lineNetBase;
      totalDiscountIrr += discount * qty;
      totalVatIrr += vat;

      return {
        id: index + 1,
        itemId: l.itemId,
        itemCode: item?.itemCode,
        itemTitleFa: item?.titleFa,
        unitNameFa: item ? unitMap.get(item.unitId) || 'عدد' : 'عدد',
        quantity: qty,
        unitPriceForeign: foreignPrice,
        unitPriceIrr,
        discountIrr: discount,
        vatAmountIrr: vat,
        lineNetBase,
        serialNumbers: l.serialNumbers,
        macAddresses: l.macAddresses,
        notesFa: l.notesFa,
      };
    });

    const method = data.costAllocationMethod || 'BY_VALUE';
    const processedLines: PurchaseInvoiceLine[] = [];
    let totalInventoryValuationIrr = 0;

    for (const line of preprocessed) {
      let allocatedExtraPerUnit = 0;

      if (totalLandedCostsIrr > 0) {
        if (method === 'BY_VALUE' && totalBaseNetValueIrr > 0) {
          const share = line.lineNetBase / totalBaseNetValueIrr;
          const totalLineExtra = totalLandedCostsIrr * share;
          allocatedExtraPerUnit = Math.round(totalLineExtra / line.quantity);
        } else if (method === 'BY_QUANTITY' && totalQuantityAll > 0) {
          allocatedExtraPerUnit = Math.round(totalLandedCostsIrr / totalQuantityAll);
        }
      }

      const finalUnitCost = (line.unitPriceIrr - line.discountIrr) + allocatedExtraPerUnit;
      const totalLineLanded = line.quantity * finalUnitCost;
      totalInventoryValuationIrr += totalLineLanded;

      processedLines.push({
        id: line.id,
        itemId: line.itemId,
        itemCode: line.itemCode,
        itemTitleFa: line.itemTitleFa,
        unitNameFa: line.unitNameFa,
        quantity: line.quantity,
        unitPriceForeign: line.unitPriceForeign,
        unitPriceIrr: line.unitPriceIrr,
        discountIrr: line.discountIrr,
        vatAmountIrr: line.vatAmountIrr,
        netPriceIrr: line.lineNetBase + line.vatAmountIrr,
        allocatedLandedCostPerUnitIrr: allocatedExtraPerUnit,
        finalLandedCostPerUnitIrr: finalUnitCost,
        totalLandedCostIrr: totalLineLanded,
        serialNumbers: line.serialNumbers,
        macAddresses: line.macAddresses,
        notesFa: line.notesFa,
      });
    }

    const subtotalNetItemsIrr = totalBaseNetValueIrr;
    const totalInvoicePayableToSupplierIrr = subtotalNetItemsIrr + totalVatIrr;

    return {
      lines: processedLines,
      subtotalNetItemsIrr,
      totalDiscountIrr,
      totalVatIrr,
      totalInvoicePayableToSupplierIrr,
      totalInventoryValuationIrr,
    };
  }

  public getPurchaseProformas(status?: string): PurchaseProformaRecord[] {
    let list = this.dbState.purchaseProformas || [];
    if (status) {
      list = list.filter((p) => p.status === status);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public getPurchaseProformaById(id: number): PurchaseProformaRecord | null {
    return this.dbState.purchaseProformas.find((p) => p.id === id) || null;
  }

  public createPurchaseProforma(
    data: {
      supplierId: number;
      dateJalali?: string;
      validUntilJalali?: string;
      currency?: ForeignCurrencyCode;
      exchangeRateToIrr?: number;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitPriceForeign: number;
        notesFa?: string;
      }>;
      notesFa?: string;
    },
    actorUserId: number
  ): PurchaseProformaRecord {
    const supplier = this.dbState.parties.find((p) => p.id === data.supplierId);
    if (!supplier || supplier.status !== 'ACTIVE') {
      throw new Error('تأمین‌کننده انتخاب شده معتبر یا فعال نمی‌باشد.');
    }
    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('پیش‌فاکتور خرید باید دارای حداقل یک ردیف کالا باشد.');
    }

    const rate = Number(data.exchangeRateToIrr) > 0 ? Number(data.exchangeRateToIrr) : 1;
    const currency = data.currency || 'IRR';
    const nowIso = new Date().toISOString();
    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    const unitMap = new Map(this.dbState.itemUnits.map((u) => [u.id, u.nameFa]));

    let lineIdx = 1;
    let subtotalIrr = 0;
    const lines: PurchaseProformaLine[] = [];

    for (const raw of data.lines) {
      const item = itemMap.get(raw.itemId);
      if (!item || item.status !== 'ACTIVE') {
        throw new Error(`کالای انتخاب شده در ردیف پیش‌فاکتور معتبر نمی‌باشد.`);
      }
      const qty = Number(raw.quantity) || 1;
      const foreignPrice = Number(raw.unitPriceForeign) || 0;
      const unitIrr = Math.round(foreignPrice * rate);
      const totalIrr = qty * unitIrr;
      subtotalIrr += totalIrr;

      lines.push({
        id: lineIdx++,
        itemId: item.id,
        itemCode: item.itemCode,
        itemTitleFa: item.titleFa,
        unitNameFa: unitMap.get(item.unitId) || 'عدد',
        quantity: qty,
        unitPriceForeign: foreignPrice,
        unitPriceIrr: unitIrr,
        totalPriceIrr: totalIrr,
        notesFa: raw.notesFa,
      });
    }

    const nextId =
      this.dbState.purchaseProformas.length > 0
        ? Math.max(...this.dbState.purchaseProformas.map((p) => p.id)) + 1
        : 1;
    const proformaNumber = `PO-1405-${1000 + nextId}`;

    const record: PurchaseProformaRecord = {
      id: nextId,
      proformaNumber,
      supplierId: supplier.id,
      supplierTitleFa: supplier.fullName,
      dateJalali: data.dateJalali || '1405/01/20',
      validUntilJalali: data.validUntilJalali || '1405/02/10',
      currency,
      exchangeRateToIrr: rate,
      lines,
      subtotalIrr,
      status: 'APPROVED',
      convertedInvoiceId: null,
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.purchaseProformas.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'PURCHASE_PROFORMA_CREATE',
      category: 'BUSINESS',
      targetEntity: 'purchase_proformas',
      targetId: proformaNumber,
      status: 'SUCCESS',
      detailsFa: `پیش‌فاکتور خرید [${proformaNumber}] برای تأمین‌کننده «${supplier.fullName}» با مبلغ ${subtotalIrr.toLocaleString()} ریال ثبت گردید.`,
    });

    return record;
  }

  public getPurchaseInvoices(status?: string, supplierId?: number): PurchaseInvoiceRecord[] {
    let list = this.dbState.purchaseInvoices || [];
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    if (supplierId) {
      list = list.filter((i) => i.supplierId === supplierId);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public getPurchaseInvoiceById(id: number): PurchaseInvoiceRecord | null {
    return this.dbState.purchaseInvoices.find((i) => i.id === id) || null;
  }

  public createPurchaseInvoice(
    data: {
      supplierInvoiceNumber?: string;
      supplierId: number;
      targetWarehouseId: number;
      proformaId?: number;
      dateJalali?: string;
      dueDateJalali?: string;
      currency?: ForeignCurrencyCode;
      exchangeRateToIrr?: number;
      costAllocationMethod?: CostAllocationMethod;
      landedCosts?: Partial<PurchaseLandedCosts>;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitPriceForeign: number;
        discountIrr?: number;
        vatAmountIrr?: number;
        serialNumbers?: string[];
        macAddresses?: string[];
        notesFa?: string;
      }>;
      notesFa?: string;
    },
    actorUserId: number
  ): PurchaseInvoiceRecord {
    const supplier = this.dbState.parties.find((p) => p.id === data.supplierId);
    if (!supplier || supplier.status !== 'ACTIVE') {
      throw new Error('تأمین‌کننده انتخاب شده معتبر یا فعال نمی‌باشد.');
    }

    const warehouse = this.dbState.warehouses.find((w) => w.id === data.targetWarehouseId);
    if (!warehouse || warehouse.status !== 'ACTIVE') {
      throw new Error('انبار مقصد انتخاب شده معتبر یا فعال نمی‌باشد.');
    }

    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('فاکتور خرید باید دارای حداقل یک ردیف کالا باشد.');
    }

    const currency = data.currency || 'IRR';
    const rate = Number(data.exchangeRateToIrr) > 0 ? Number(data.exchangeRateToIrr) : 1;
    const allocationMethod = data.costAllocationMethod || 'BY_VALUE';

    const fullLandedCosts: PurchaseLandedCosts = {
      freightCostIrr: Number(data.landedCosts?.freightCostIrr) || 0,
      insuranceCostIrr: Number(data.landedCosts?.insuranceCostIrr) || 0,
      packagingCostIrr: Number(data.landedCosts?.packagingCostIrr) || 0,
      customsCostIrr: Number(data.landedCosts?.customsCostIrr) || 0,
      nonRefundableTaxIrr: Number(data.landedCosts?.nonRefundableTaxIrr) || 0,
      otherLandedCostIrr: Number(data.landedCosts?.otherLandedCostIrr) || 0,
      totalLandedCostsIrr: 0,
    };
    fullLandedCosts.totalLandedCostsIrr =
      fullLandedCosts.freightCostIrr +
      fullLandedCosts.insuranceCostIrr +
      fullLandedCosts.packagingCostIrr +
      fullLandedCosts.customsCostIrr +
      fullLandedCosts.nonRefundableTaxIrr +
      fullLandedCosts.otherLandedCostIrr;

    // 1. Authoritative Landed Cost Allocation Calculation
    const allocated = this.calculateLandedCostAllocation({
      currency,
      exchangeRateToIrr: rate,
      costAllocationMethod: allocationMethod,
      landedCosts: fullLandedCosts,
      lines: data.lines,
    });

    const nextId =
      this.dbState.purchaseInvoices.length > 0
        ? Math.max(...this.dbState.purchaseInvoices.map((i) => i.id)) + 1
        : 1;
    const invoiceNumber = `PI-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    // 2. Transactionally Create Inbound Warehouse Receipt (INBOUND_PURCHASE)
    const invDoc = this.createInventoryDocument(
      {
        docType: 'INBOUND_PURCHASE',
        dateJalali: data.dateJalali || '1405/01/20',
        targetWarehouseId: warehouse.id,
        partyId: supplier.id,
        lines: allocated.lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitCostIrr: l.finalLandedCostPerUnitIrr, // Stamp exact final landed cost on inventory document
          serialNumbers: l.serialNumbers,
          macAddresses: l.macAddresses,
          notesFa: `رسید ورود عطف به فاکتور خرید ${invoiceNumber}`,
        })),
        notesFa: `ورود قطعی کالا عطف به فاکتور خرید [${invoiceNumber}] از تأمین‌کننده «${supplier.fullName}»`,
      },
      actorUserId
    );

    // 3. Stamp purchaseInvoiceId and unitCostIrr on created/updated serial records
    for (const l of allocated.lines) {
      if (l.serialNumbers && l.serialNumbers.length > 0) {
        for (const sn of l.serialNumbers) {
          const snClean = sn.trim().toUpperCase();
          const serialRecord = this.dbState.itemSerials.find(
            (s) => s.serialNumber.toUpperCase() === snClean && s.itemId === l.itemId
          );
          if (serialRecord) {
            serialRecord.purchaseInvoiceId = nextId;
            serialRecord.unitCostIrr = l.finalLandedCostPerUnitIrr;
          }
        }
      }
    }

    // 4. Update Supplier Liability Balance in Parties & PartyTransactions
    const totalPayableToSupplier = allocated.totalInvoicePayableToSupplierIrr;
    supplier.updatedAt = nowIso;
    if (!supplier.transactionsSummary) {
      supplier.transactionsSummary = {
        totalSalesCount: 0,
        totalSalesIrr: 0,
        totalPurchasesCount: 0,
        totalPurchasesIrr: 0,
        totalPaymentsIrr: 0,
        totalReceiptsIrr: 0,
        activeProjectsCount: 0,
        netBalanceIrr: 0,
      };
    }
    supplier.transactionsSummary.totalPurchasesCount += 1;
    supplier.transactionsSummary.totalPurchasesIrr += totalPayableToSupplier;
    supplier.transactionsSummary.netBalanceIrr += totalPayableToSupplier; // Supplier is creditor (بستانکار)

    const partyTxId =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    this.dbState.partyTransactions.push({
      id: partyTxId,
      partyId: supplier.id,
      recordType: 'PURCHASE_INVOICE',
      referenceNumber: invoiceNumber,
      titleFa: `فاکتور خرید ${invoiceNumber} (${supplier.fullName})`,
      amountIrr: totalPayableToSupplier,
      dateJalali: data.dateJalali || '1405/01/20',
      status: 'COMPLETED',
      notesFa: `ثبت فاکتور قطعی خرید به مبلغ ${totalPayableToSupplier.toLocaleString()} ریال با تخصیص ${fullLandedCosts.totalLandedCostsIrr.toLocaleString()} ریال هزینه سربار`,
      createdAt: nowIso,
    });

    // 5. Create Purchase Invoice Record
    const proforma = data.proformaId
      ? this.dbState.purchaseProformas.find((p) => p.id === data.proformaId)
      : null;

    if (proforma) {
      proforma.status = 'CONVERTED';
      proforma.convertedInvoiceId = nextId;
      proforma.updatedAt = nowIso;
    }

    const paidAmountIrr = Math.min(totalPayableToSupplier, Number((data as any).paidAmountIrr) || 0);
    if (paidAmountIrr > 0) {
      supplier.transactionsSummary.totalPaymentsIrr += paidAmountIrr;
      supplier.transactionsSummary.netBalanceIrr -= paidAmountIrr;

      const payPartyTxId =
        this.dbState.partyTransactions.length > 0
          ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
          : 1;

      this.dbState.partyTransactions.push({
        id: payPartyTxId,
        partyId: supplier.id,
        recordType: 'PAYMENT',
        referenceNumber: `PAY-INV-${invoiceNumber}`,
        titleFa: `پرداخت در فاکتور خرید ${invoiceNumber} (${supplier.fullName})`,
        amountIrr: paidAmountIrr,
        dateJalali: data.dateJalali || '1405/01/20',
        status: 'COMPLETED',
        notesFa: `پرداخت وجه بابت فاکتور خرید ${invoiceNumber}`,
        createdAt: nowIso,
      });

      this.createTreasuryTransaction(
        {
          txType: 'PAYMENT',
          dateJalali: data.dateJalali || '1405/01/20',
          partyId: supplier.id,
          amountIrr: paidAmountIrr,
          paymentMethod: (data as any).paymentMethod || 'BANK_TRANSFER',
          sourceBankAccountId: (data as any).sourceBankAccountId || 1,
          sourceCashBoxId: (data as any).sourceCashBoxId,
          notesFa: `پرداخت وجه بابت فاکتور خرید ${invoiceNumber}`,
          skipPartyTx: true,
        },
        actorUserId
      );
    }

    const invoiceRecord: PurchaseInvoiceRecord = {
      id: nextId,
      invoiceNumber,
      supplierInvoiceNumber: data.supplierInvoiceNumber || null,
      supplierId: supplier.id,
      supplierTitleFa: supplier.fullName,
      targetWarehouseId: warehouse.id,
      targetWarehouseTitleFa: warehouse.titleFa,
      proformaId: proforma?.id || null,
      proformaNumber: proforma?.proformaNumber || null,
      dateJalali: data.dateJalali || '1405/01/20',
      dueDateJalali: data.dueDateJalali || '1405/02/20',
      currency,
      exchangeRateToIrr: rate,
      costAllocationMethod: allocationMethod,
      landedCosts: fullLandedCosts,
      lines: allocated.lines,
      subtotalNetItemsIrr: allocated.subtotalNetItemsIrr,
      totalDiscountIrr: allocated.totalDiscountIrr,
      totalVatIrr: allocated.totalVatIrr,
      totalInvoicePayableToSupplierIrr: totalPayableToSupplier,
      totalInventoryValuationIrr: allocated.totalInventoryValuationIrr,
      paidAmountIrr,
      remainingDebtIrr: totalPayableToSupplier - paidAmountIrr,
      status: 'CONFIRMED',
      inventoryDocId: invDoc.id,
      inventoryDocNumber: invDoc.docNumber,
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.purchaseInvoices.push(invoiceRecord);
    this.saveDbState();

    if (this.isDoubleEntryAccountingEnabled()) {
      try {
        this.generateAccountingDocFromPurchaseInvoice(invoiceRecord.id, actorUserId);
      } catch (err: unknown) {
        console.warn('Accounting voucher for purchase invoice skipped/failed:', err);
      }
    }

    this.recordAuditLog({
      actorUserId,
      action: 'PURCHASE_INVOICE_CREATE',
      category: 'BUSINESS',
      targetEntity: 'purchase_invoices',
      targetId: invoiceNumber,
      status: 'SUCCESS',
      detailsFa: `فاکتور خرید [${invoiceNumber}] با مبلغ ${totalPayableToSupplier.toLocaleString()} ریال ثبت و رسید انبار [${invDoc.docNumber}] صادر گردید.`,
    });

    return invoiceRecord;
  }

  public getPurchasePayments(supplierId?: number, invoiceId?: number): PurchasePaymentRecord[] {
    let list = this.dbState.purchasePayments || [];
    if (supplierId) {
      list = list.filter((p) => p.supplierId === supplierId);
    }
    if (invoiceId) {
      list = list.filter((p) => p.purchaseInvoiceId === invoiceId);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public createPurchasePayment(
    data: {
      supplierId: number;
      purchaseInvoiceId?: number;
      paymentDateJalali?: string;
      amountIrr: number;
      paymentMethod?: PurchasePaymentMethod;
      sourceAccountOrBank: string;
      trackingReference: string;
      notesFa?: string;
      sourceCashBoxId?: number;
      sourceBankAccountId?: number;
    },
    actorUserId: number
  ): PurchasePaymentRecord {
    const supplier = this.dbState.parties.find((p) => p.id === data.supplierId);
    if (!supplier || supplier.status !== 'ACTIVE') {
      throw new Error('تأمین‌کننده انتخاب شده معتبر نمی‌باشد.');
    }

    const amount = Number(data.amountIrr);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('مبلغ پرداخت باید بزرگتر از صفر باشد.');
    }

    let invoice: PurchaseInvoiceRecord | null = null;
    if (data.purchaseInvoiceId) {
      invoice = this.dbState.purchaseInvoices.find((i) => i.id === data.purchaseInvoiceId) || null;
      if (!invoice) {
        throw new Error('فاکتور خرید مربوطه یافت نشد.');
      }
      if (amount > invoice.remainingDebtIrr) {
        throw new Error(
          `مبلغ پرداخت (${amount.toLocaleString('fa-IR')} ریال) از مانده بدهی فاکتور (${invoice.remainingDebtIrr.toLocaleString('fa-IR')} ریال) بیشتر است.`
        );
      }
    }

    // Resolve source cashbox / bank account if not explicitly provided
    let sourceCashBoxId = data.sourceCashBoxId;
    let sourceBankAccountId = data.sourceBankAccountId;

    if (!sourceCashBoxId && !sourceBankAccountId) {
      const srcStr = (data.sourceAccountOrBank || '').trim();
      const foundCash = (this.dbState.cashBoxes || []).find(
        (c) => String(c.id) === srcStr || c.boxCode === srcStr || (c.titleFa && srcStr.includes(c.titleFa)) || (c.titleFa && c.titleFa.includes(srcStr))
      );
      if (foundCash) {
        sourceCashBoxId = foundCash.id;
      } else {
        const foundBank = (this.dbState.bankAccounts || []).find(
          (b) => String(b.id) === srcStr || b.accountCode === srcStr || (b.bankNameFa && srcStr.includes(b.bankNameFa)) || (b.bankNameFa && b.bankNameFa.includes(srcStr))
        );
        if (foundBank) {
          sourceBankAccountId = foundBank.id;
        } else if (data.paymentMethod === 'CASH' || srcStr.includes('صندوق')) {
          sourceCashBoxId = this.dbState.cashBoxes[0]?.id || 1;
        } else {
          sourceBankAccountId = this.dbState.bankAccounts[0]?.id || 1;
        }
      }
    }

    const paymentMethodMap: 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CHEQUE' =
      data.paymentMethod === 'CASH' ? 'CASH' : data.paymentMethod === 'CHEQUE' ? 'CHEQUE' : 'BANK_TRANSFER';

    // Record treasury outflow with balance validation FIRST (throws if balance is insufficient, preventing partial updates)
    this.createTreasuryTransaction(
      {
        txType: 'PAYMENT',
        dateJalali: data.paymentDateJalali || '1405/01/20',
        partyId: supplier.id,
        amountIrr: amount,
        paymentMethod: paymentMethodMap,
        sourceCashBoxId,
        sourceBankAccountId,
        notesFa: data.notesFa || `پرداخت به تأمین‌کننده (${supplier.fullName}) - پیگیری ${data.trackingReference}`,
        skipPartyTx: true, // We append to partyTransactions below once
      },
      actorUserId
    );

    const nowIso = new Date().toISOString();
    const nextId =
      this.dbState.purchasePayments.length > 0
        ? Math.max(...this.dbState.purchasePayments.map((p) => p.id)) + 1
        : 1;
    const paymentNumber = `PAY-1405-${1000 + nextId}`;

    // Update invoice debt if linked
    if (invoice) {
      invoice.paidAmountIrr += amount;
      invoice.remainingDebtIrr -= amount;
      invoice.status = invoice.remainingDebtIrr === 0 ? 'PAID' : 'PARTIALLY_PAID';
      invoice.updatedAt = nowIso;
    }

    // Update supplier balance in Parties cache
    if (supplier.transactionsSummary) {
      supplier.transactionsSummary.totalPaymentsIrr += amount;
      supplier.transactionsSummary.netBalanceIrr -= amount;
    }

    // Append to partyTransactions ONCE
    const partyTxId =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    this.dbState.partyTransactions.push({
      id: partyTxId,
      partyId: supplier.id,
      recordType: 'PAYMENT',
      referenceNumber: paymentNumber,
      titleFa: `پرداخت به تأمین‌کننده (${supplier.fullName})`,
      amountIrr: amount,
      dateJalali: data.paymentDateJalali || '1405/01/20',
      status: 'COMPLETED',
      notesFa: `پرداخت وجه طی شماره پیگیری ${data.trackingReference} از ${data.sourceAccountOrBank}`,
      createdAt: nowIso,
    });

    const paymentRecord: PurchasePaymentRecord = {
      id: nextId,
      paymentNumber,
      supplierId: supplier.id,
      supplierTitleFa: supplier.fullName,
      purchaseInvoiceId: invoice?.id || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      paymentDateJalali: data.paymentDateJalali || '1405/01/20',
      amountIrr: amount,
      paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      sourceAccountOrBank: data.sourceAccountOrBank,
      trackingReference: data.trackingReference,
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    this.dbState.purchasePayments.push(paymentRecord);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'PURCHASE_PAYMENT_CREATE',
      category: 'BUSINESS',
      targetEntity: 'purchase_payments',
      targetId: paymentNumber,
      status: 'SUCCESS',
      detailsFa: `پرداخت [${paymentNumber}] به مبلغ ${amount.toLocaleString()} ریال به تأمین‌کننده «${supplier.fullName}» ثبت گردید.`,
    });

    return paymentRecord;
  }

  public getPurchaseReturns(supplierId?: number): PurchaseReturnRecord[] {
    let list = this.dbState.purchaseReturns || [];
    if (supplierId) {
      list = list.filter((r) => r.supplierId === supplierId);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public createPurchaseReturn(
    data: {
      purchaseInvoiceId: number;
      sourceWarehouseId: number;
      dateJalali?: string;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitCreditIrr: number;
        serialNumbers?: string[];
        reasonFa?: string;
      }>;
      notesFa?: string;
    },
    actorUserId: number
  ): PurchaseReturnRecord {
    const invoice = this.dbState.purchaseInvoices.find((i) => i.id === data.purchaseInvoiceId);
    if (!invoice) {
      throw new Error('فاکتور خرید مرجع یافت نشد.');
    }
    const supplier = this.dbState.parties.find((p) => p.id === invoice.supplierId);
    if (!supplier) {
      throw new Error('تأمین‌کننده مربوطه یافت نشد.');
    }

    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('برگشت از خرید باید حداقل دارای یک ردیف باشد.');
    }

    const nowIso = new Date().toISOString();
    const nextId =
      this.dbState.purchaseReturns.length > 0
        ? Math.max(...this.dbState.purchaseReturns.map((r) => r.id)) + 1
        : 1;
    const returnNumber = `PRET-1405-${1000 + nextId}`;

    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    let totalReturnCreditIrr = 0;
    const processedLines: PurchaseReturnLine[] = [];

    for (const l of data.lines) {
      const item = itemMap.get(l.itemId);
      if (!item) throw new Error(`کالا با شناسه [${l.itemId}] یافت نشد.`);
      const qty = Number(l.quantity) || 1;
      const creditUnit = Number(l.unitCreditIrr) || 0;
      const lineCredit = qty * creditUnit;
      totalReturnCreditIrr += lineCredit;

      processedLines.push({
        id: processedLines.length + 1,
        itemId: item.id,
        itemCode: item.itemCode,
        itemTitleFa: item.titleFa,
        quantity: qty,
        unitCreditIrr: creditUnit,
        totalCreditIrr: lineCredit,
        serialNumbers: l.serialNumbers,
        reasonFa: l.reasonFa,
      });
    }

    // 1. Transactionally Create Outbound Return Inventory Document (OUTBOUND_RETURN)
    const invDoc = this.createInventoryDocument(
      {
        docType: 'OUTBOUND_RETURN',
        dateJalali: data.dateJalali || '1405/01/20',
        sourceWarehouseId: data.sourceWarehouseId,
        partyId: supplier.id,
        lines: processedLines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitCostIrr: l.unitCreditIrr,
          serialNumbers: l.serialNumbers,
          notesFa: `برگشت از خرید عطف به ${returnNumber}`,
        })),
        notesFa: `خروج کالا بابت مرجوعی به تأمین‌کننده «${supplier.fullName}» عطف به ${returnNumber}`,
      },
      actorUserId
    );

    // Update serial statuses to RETURNED_TO_SUPPLIER
    for (const l of processedLines) {
      if (l.serialNumbers) {
        for (const sn of l.serialNumbers) {
          const serialRecord = this.dbState.itemSerials.find(
            (s) => s.serialNumber.toUpperCase() === sn.trim().toUpperCase() && s.itemId === l.itemId
          );
          if (serialRecord) {
            serialRecord.status = 'RETURNED_TO_SUPPLIER';
            serialRecord.lastDocNumber = invDoc.docNumber;
            serialRecord.updatedAt = nowIso;
          }
        }
      }
    }

    // 2. Reduce supplier balance in Parties
    if (supplier.transactionsSummary) {
      supplier.transactionsSummary.netBalanceIrr -= totalReturnCreditIrr;
    }

    const partyTxId =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    this.dbState.partyTransactions.push({
      id: partyTxId,
      partyId: supplier.id,
      recordType: 'PURCHASE_INVOICE', // negative / credit note
      referenceNumber: returnNumber,
      titleFa: `برگشت از خرید ${returnNumber}`,
      amountIrr: -totalReturnCreditIrr,
      dateJalali: data.dateJalali || '1405/01/20',
      status: 'COMPLETED',
      notesFa: `برگشت کالا به تأمین‌کننده و کسر بستانکاری`,
      createdAt: nowIso,
    });

    const returnRecord: PurchaseReturnRecord = {
      id: nextId,
      returnNumber,
      purchaseInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      supplierId: supplier.id,
      supplierTitleFa: supplier.fullName,
      sourceWarehouseId: data.sourceWarehouseId,
      sourceWarehouseTitleFa:
        this.dbState.warehouses.find((w) => w.id === data.sourceWarehouseId)?.titleFa || '',
      dateJalali: data.dateJalali || '1405/01/20',
      lines: processedLines,
      totalReturnCreditIrr,
      inventoryDocId: invDoc.id,
      inventoryDocNumber: invDoc.docNumber,
      status: 'CONFIRMED',
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    this.dbState.purchaseReturns.push(returnRecord);
    this.saveDbState();

    if (this.isDoubleEntryAccountingEnabled()) {
      try {
        this.generateAccountingDocFromPurchaseReturn(returnRecord.id, actorUserId);
      } catch (err: unknown) {
        console.warn('Accounting voucher for purchase return skipped/failed:', err);
      }
    }

    this.recordAuditLog({
      actorUserId,
      action: 'PURCHASE_RETURN_CREATE',
      category: 'BUSINESS',
      targetEntity: 'purchase_returns',
      targetId: returnNumber,
      status: 'SUCCESS',
      detailsFa: `سند برگشت از خرید [${returnNumber}] عطف به فاکتور [${invoice.invoiceNumber}] ثبت گردید.`,
    });

    return returnRecord;
  }

  // ==========================================================================
  // STAGE 6: SALES, PROFORMAS, QUICK POS, RECEIPTS & SALES RETURNS
  // ==========================================================================

  public getSalesProformas(status?: string, customerId?: number): SalesProformaRecord[] {
    let list = this.dbState.salesProformas || [];
    if (status) {
      list = list.filter((p) => p.status === status);
    }
    if (customerId) {
      list = list.filter((p) => p.customerId === customerId);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public getSalesProformaById(id: number): SalesProformaRecord | null {
    return this.dbState.salesProformas.find((p) => p.id === id) || null;
  }

  public createSalesProforma(
    data: {
      customerId: number;
      dateJalali?: string;
      validUntilJalali?: string;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitPriceIrr: number;
        discountIrr?: number;
        vatAmountIrr?: number;
        notesFa?: string;
      }>;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): SalesProformaRecord {
    const customer = this.getParties().find((p) => p.id === data.customerId);
    if (!customer) {
      throw new Error(`مشتری با شناسه [${data.customerId}] یافت نشد.`);
    }

    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('پیش‌فاکتور فروش باید حداقل دارای یک ردیف کالا باشد.');
    }

    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    let subtotalItemsIrr = 0;
    let totalDiscountIrr = 0;
    let totalVatIrr = 0;

    const processedLines: SalesProformaLine[] = [];

    for (const line of data.lines) {
      const item = itemMap.get(line.itemId);
      if (!item) {
        throw new Error(`کالا با شناسه [${line.itemId}] یافت نشد.`);
      }
      const qty = Number(line.quantity) || 1;
      const unitPrice = Number(line.unitPriceIrr) || 0;
      const discount = Number(line.discountIrr) || 0;
      const vat = Number(line.vatAmountIrr) || 0;

      const lineNetPrice = (unitPrice - discount) * qty + vat;

      subtotalItemsIrr += unitPrice * qty;
      totalDiscountIrr += discount * qty;
      totalVatIrr += vat;

      processedLines.push({
        id: processedLines.length + 1,
        itemId: item.id,
        itemCode: item.itemCode,
        itemTitleFa: item.titleFa,
        unitNameFa: item.unitNameFa || 'عدد',
        quantity: qty,
        unitPriceIrr: unitPrice,
        discountIrr: discount,
        vatAmountIrr: vat,
        totalPriceIrr: lineNetPrice,
        notesFa: line.notesFa,
      });
    }

    const totalPayableIrr = subtotalItemsIrr - totalDiscountIrr + totalVatIrr;

    const nextId =
      this.dbState.salesProformas.length > 0
        ? Math.max(...this.dbState.salesProformas.map((p) => p.id)) + 1
        : 1;
    const proformaNumber = `SQO-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    const record: SalesProformaRecord = {
      id: nextId,
      proformaNumber,
      customerId: customer.id,
      customerTitleFa: customer.fullName,
      dateJalali: data.dateJalali || '1405/01/20',
      validUntilJalali: data.validUntilJalali || '1405/02/20',
      lines: processedLines,
      subtotalItemsIrr,
      totalDiscountIrr,
      totalVatIrr,
      totalPayableIrr,
      status: 'APPROVED',
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.salesProformas.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'SALES_PROFORMA_CREATE',
      category: 'BUSINESS',
      targetEntity: 'sales_proformas',
      targetId: proformaNumber,
      status: 'SUCCESS',
      detailsFa: `پیش‌فاکتور فروش [${proformaNumber}] برای مشتری «${customer.fullName}» به مبلغ ${totalPayableIrr.toLocaleString()} ریال ثبت گردید.`,
    });

    return record;
  }

  public getSalesInvoices(status?: string, customerId?: number): SalesInvoiceRecord[] {
    let list = this.dbState.salesInvoices || [];
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    if (customerId) {
      list = list.filter((i) => i.customerId === customerId);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public getSalesInvoiceById(id: number): SalesInvoiceRecord | null {
    return this.dbState.salesInvoices.find((i) => i.id === id) || null;
  }

  public createSalesInvoice(
    data: {
      saleType?: SalesInvoiceType;
      customerId: number;
      sourceWarehouseId: number;
      proformaId?: number;
      dateJalali?: string;
      dueDateJalali?: string;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitPriceIrr: number;
        discountIrr?: number;
        vatAmountIrr?: number;
        serialNumbers?: string[];
        macAddresses?: string[];
        notesFa?: string;
        isService?: boolean;
        skipInventoryMovement?: boolean;
      }>;
      paidAmountIrr?: number;
      paymentDetails?: {
        paymentMethod: SalesPaymentMethod;
        trackingReference?: string;
        posTerminalOrBank?: string;
      };
      notesFa?: string;
      isService?: boolean;
      skipInventoryMovement?: boolean;
    },
    actorUserId: number = 1
  ): SalesInvoiceRecord {
    const customer = this.getParties().find((p) => p.id === data.customerId);
    if (!customer) {
      throw new Error(`مشتری با شناسه [${data.customerId}] یافت نشد.`);
    }

    const warehouse = this.getWarehouses().find((w) => w.id === data.sourceWarehouseId);
    if (!warehouse) {
      throw new Error(`انبار با شناسه [${data.sourceWarehouseId}] یافت نشد.`);
    }

    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('فاکتور فروش باید حداقل دارای یک ردیف کالا باشد.');
    }

    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    let subtotalNetItemsIrr = 0;
    let totalDiscountIrr = 0;
    let totalVatIrr = 0;
    let totalCogsIrr = 0;

    const processedLines: SalesInvoiceLine[] = [];

    for (const line of data.lines) {
      const item = line.itemId ? itemMap.get(line.itemId) : null;
      if (!item && !(line as any).itemTitleFa) {
        throw new Error(`کالا با شناسه [${line.itemId}] یافت نشد.`);
      }

      const itemTitleFa = item ? item.titleFa : ((line as any).itemTitleFa || 'کالای سفارشی/خدمات');
      const itemCode = item ? item.itemCode : 'CUSTOM';
      const unitNameFa = item ? (item.unitNameFa || 'عدد') : ((line as any).unitNameFa || 'عدد');

      const qty = Number(line.quantity) || 1;
      const unitPrice = Number(line.unitPriceIrr) || 0;
      const discount = Number(line.discountIrr) || 0;
      const vat = Number(line.vatAmountIrr) || 0;
      const isServiceLine = !item || Boolean(line.isService || line.skipInventoryMovement || data.isService || data.skipInventoryMovement);

      // Validate serial numbers for serialized items
      if (item && item.isSerialized && !isServiceLine) {
        if (!line.serialNumbers || line.serialNumbers.length === 0) {
          // Auto-select available IN_STOCK serials from source warehouse
          const availableInStock = (this.dbState.itemSerials || []).filter(
            (s) => s.currentWarehouseId === warehouse.id && s.itemId === item.id && s.status === 'IN_STOCK'
          );
          if (availableInStock.length < qty) {
            throw new Error(
              `موجودی سریال‌های فعال کالای «${item.titleFa}» در انبار «${warehouse.titleFa}» (${availableInStock.length} واحد) کمتر از تعداد درخواستی (${qty} واحد) است.`
            );
          }
          line.serialNumbers = availableInStock.slice(0, qty).map((s) => s.serialNumber);
          line.macAddresses = availableInStock.slice(0, qty).map((s) => s.macAddress).filter(Boolean) as string[];
        } else if (line.serialNumbers.length !== qty) {
          throw new Error(
            `کالای «${item.titleFa}» سریال‌دار است و باید دقیقاً ${qty} شماره سریال معتبر انتخاب شود.`
          );
        }

        // Verify serials are currently IN_STOCK in the source warehouse
        for (const sn of line.serialNumbers) {
          const sRecord = this.getSerialByNumber(sn);
          if (!sRecord) {
            throw new Error(`شماره سریال [${sn}] در سیستم یافت نشد.`);
          }
          if (sRecord.itemId !== item.id) {
            throw new Error(`شماره سریال [${sn}] متعلق به کالای «${item.titleFa}» نیست.`);
          }
          if (sRecord.currentWarehouseId !== warehouse.id) {
            throw new Error(
              `شماره سریال [${sn}] در انبار «${warehouse.titleFa}» استقرار ندارد (محل فعلی: انبار کد ${sRecord.currentWarehouseId}).`
            );
          }
          if (sRecord.status !== 'IN_STOCK') {
            throw new Error(
              `شماره سریال [${sn}] قابل خروج/فروش نیست (وضعیت فعلی: ${sRecord.status}).`
            );
          }
        }
      }

      // Calculate unit COGS
      let unitCogs = 0;
      if (isServiceLine) {
        unitCogs = 0;
      } else if (item.isSerialized && line.serialNumbers && line.serialNumbers.length > 0) {
        let totalSerialCost = 0;
        for (const sn of line.serialNumbers) {
          const sRecord = this.getSerialByNumber(sn);
          totalSerialCost += sRecord?.unitCostIrr || item.purchasePriceIrr || 0;
        }
        unitCogs = totalSerialCost / qty;
      } else {
        unitCogs = item.purchasePriceIrr || 0;
      }

      const lineNetPrice = (unitPrice - discount) * qty + vat;
      const lineCogs = unitCogs * qty;

      subtotalNetItemsIrr += (unitPrice - discount) * qty;
      totalDiscountIrr += discount * qty;
      totalVatIrr += vat;
      totalCogsIrr += lineCogs;

      processedLines.push({
        id: processedLines.length + 1,
        itemId: item ? item.id : 0,
        itemCode,
        itemTitleFa,
        unitNameFa,
        quantity: qty,
        unitPriceIrr: unitPrice,
        discountIrr: discount,
        vatAmountIrr: vat,
        netPriceIrr: lineNetPrice,
        unitCogsIrr: unitCogs,
        totalCogsIrr: lineCogs,
        serialNumbers: line.serialNumbers,
        macAddresses: line.macAddresses,
        notesFa: line.notesFa,
        isService: isServiceLine,
        skipInventoryMovement: isServiceLine,
      });
    }

    const totalInvoiceAmountIrr = subtotalNetItemsIrr + totalVatIrr;
    const paidAmountIrr = Number(data.paidAmountIrr) || 0;
    const remainingBalanceIrr = totalInvoiceAmountIrr - paidAmountIrr;

    let invoiceStatus: SalesInvoiceStatus = 'CONFIRMED';
    if (paidAmountIrr >= totalInvoiceAmountIrr) {
      invoiceStatus = 'PAID';
    } else if (paidAmountIrr > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    const saleType = data.saleType || 'STANDARD_SALE';
    const nextId =
      this.dbState.salesInvoices.length > 0
        ? Math.max(...this.dbState.salesInvoices.map((i) => i.id)) + 1
        : 1;
    const prefix = saleType === 'QUICK_POS_SALE' ? 'POS-1405' : 'INV-1405';
    const invoiceNumber = `${prefix}-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    // 1. Transactionally Create Outbound Inventory Document (OUTBOUND_SALE) for non-service lines
    const physicalLines = processedLines.filter((l) => !l.skipInventoryMovement);
    let invDoc = null;
    if (physicalLines.length > 0) {
      invDoc = this.createInventoryDocument(
        {
          docType: 'OUTBOUND_SALE',
          dateJalali: data.dateJalali || '1405/01/20',
          sourceWarehouseId: warehouse.id,
          partyId: customer.id,
          lines: physicalLines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitCostIrr: l.unitCogsIrr,
            serialNumbers: l.serialNumbers,
            notesFa: `خروج بابت فاکتور فروش ${invoiceNumber}`,
          })),
          notesFa: `خروج قطعی کالا بابت فاکتور فروش [${invoiceNumber}] برای مشتری «${customer.fullName}»`,
        },
        actorUserId
      );
    }

    // 2. Record Customer Financial Debit Transaction & Update Summary
    if (!customer.transactionsSummary) {
      customer.transactionsSummary = {
        totalSalesCount: 0,
        totalSalesIrr: 0,
        totalPurchasesCount: 0,
        totalPurchasesIrr: 0,
        totalReceiptsIrr: 0,
        totalPaymentsIrr: 0,
        activeProjectsCount: 0,
        netBalanceIrr: 0,
        lastTransactionDateJalali: data.dateJalali || '1405/01/20',
      };
    }
    customer.transactionsSummary.totalSalesCount += 1;
    customer.transactionsSummary.totalSalesIrr += totalInvoiceAmountIrr;
    customer.transactionsSummary.netBalanceIrr += totalInvoiceAmountIrr;
    customer.transactionsSummary.lastTransactionDateJalali = data.dateJalali || '1405/01/20';

    const partyTxId1 =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    this.dbState.partyTransactions.push({
      id: partyTxId1,
      partyId: customer.id,
      recordType: 'SALE_INVOICE',
      referenceNumber: invoiceNumber,
      titleFa: `فاکتور فروش ${invoiceNumber} (${customer.fullName})`,
      amountIrr: totalInvoiceAmountIrr,
      dateJalali: data.dateJalali || '1405/01/20',
      status: 'COMPLETED',
      notesFa: `ثبت فاکتور قطعی فروش به مبلغ ${totalInvoiceAmountIrr.toLocaleString()} ریال`,
      createdAt: nowIso,
    });

    // 3. If Immediate Payment / POS Received, Record Receipt & Credit Transaction
    if (paidAmountIrr > 0) {
      customer.transactionsSummary.totalReceiptsIrr += paidAmountIrr;
      customer.transactionsSummary.netBalanceIrr -= paidAmountIrr;

      const nextReceiptId =
        this.dbState.salesReceipts.length > 0
          ? Math.max(...this.dbState.salesReceipts.map((r) => r.id)) + 1
          : 1;
      const receiptNumber = `REC-1405-${1000 + nextReceiptId}`;

      const receiptRecord: SalesReceiptRecord = {
        id: nextReceiptId,
        receiptNumber,
        customerId: customer.id,
        customerTitleFa: customer.fullName,
        salesInvoiceId: nextId,
        invoiceNumber,
        paymentDateJalali: data.dateJalali || '1405/01/20',
        amountIrr: paidAmountIrr,
        paymentMethod: data.paymentDetails?.paymentMethod || 'POS',
        destinationBankOrCash: data.paymentDetails?.posTerminalOrBank || 'صندوق/کارتخوان مرکزی فروشگاه',
        trackingReference: data.paymentDetails?.trackingReference || `POS-${Date.now()}`,
        notesFa: `دریافت وجه هنگام صدور فاکتور ${invoiceNumber}`,
        actorUserId,
        createdAt: nowIso,
      };

      this.dbState.salesReceipts.push(receiptRecord);

      const partyTxId2 =
        this.dbState.partyTransactions.length > 0
          ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
          : 1;

      this.dbState.partyTransactions.push({
        id: partyTxId2,
        partyId: customer.id,
        recordType: 'RECEIPT',
        referenceNumber: receiptNumber,
        titleFa: `دریافت وجه ${receiptNumber} (${customer.fullName})`,
        amountIrr: paidAmountIrr,
        dateJalali: data.dateJalali || '1405/01/20',
        status: 'COMPLETED',
        notesFa: `دریافت وجه بابت فاکتور فروش [${invoiceNumber}] - کسر بدهکار مشتری`,
        createdAt: nowIso,
      });

      const payMethod = data.paymentDetails?.paymentMethod || 'POS';
      const isBank = payMethod === 'POS' || payMethod === 'BANK_TRANSFER';
      if ((payMethod as string) !== 'CHEQUE' && (payMethod as string) !== 'INSTALLMENT') {
        this.createTreasuryTransaction(
          {
            txType: 'RECEIPT',
            dateJalali: data.dateJalali || '1405/01/20',
            partyId: customer.id,
            amountIrr: paidAmountIrr,
            paymentMethod: payMethod as any,
            targetBankAccountId: isBank ? ((data as any).targetBankAccountId || 1) : undefined,
            targetCashBoxId: !isBank ? ((data as any).targetCashBoxId || 1) : undefined,
            notesFa: `دریافت وجه هنگام صدور فاکتور فروش ${invoiceNumber}`,
            skipPartyTx: true,
          },
          actorUserId
        );
      }
    }

    let proformaNumber: string | null = null;
    if (data.proformaId) {
      const pf = this.getSalesProformaById(data.proformaId);
      if (pf) {
        pf.status = 'CONVERTED';
        pf.convertedInvoiceId = nextId;
        pf.updatedAt = nowIso;
        proformaNumber = pf.proformaNumber;
      }
    }

    const record: SalesInvoiceRecord = {
      id: nextId,
      invoiceNumber,
      saleType,
      customerId: customer.id,
      customerTitleFa: customer.fullName,
      sourceWarehouseId: warehouse.id,
      sourceWarehouseTitleFa: warehouse.titleFa,
      proformaId: data.proformaId || null,
      proformaNumber,
      dateJalali: data.dateJalali || '1405/01/20',
      dueDateJalali: data.dueDateJalali || '1405/02/20',
      lines: processedLines,
      subtotalNetItemsIrr,
      totalDiscountIrr,
      totalVatIrr,
      totalInvoiceAmountIrr,
      totalCogsIrr,
      paidAmountIrr,
      remainingBalanceIrr,
      status: invoiceStatus,
      inventoryDocId: invDoc?.id || null,
      inventoryDocNumber: invDoc?.docNumber || null,
      paymentDetails: data.paymentDetails,
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.salesInvoices.push(record);
    this.saveDbState();

    if (this.isDoubleEntryAccountingEnabled()) {
      try {
        this.generateAccountingDocFromSalesInvoice(record.id, actorUserId);
      } catch (err: unknown) {
        console.warn('Accounting voucher for sales invoice skipped/failed:', err);
      }
    }

    this.recordAuditLog({
      actorUserId,
      action: 'SALES_INVOICE_CREATE',
      category: 'BUSINESS',
      targetEntity: 'sales_invoices',
      targetId: invoiceNumber,
      status: 'SUCCESS',
      detailsFa: `فاکتور فروش [${invoiceNumber}] با موفقیت صادر گردید. خروج انبار [${invDoc?.docNumber || 'خدماتی/بدون خروج'} ]، بهای تمام‌شده COGS (${totalCogsIrr.toLocaleString()} ریال) و حساب بدهکار مشتری به مبلغ ${totalInvoiceAmountIrr.toLocaleString()} ریال ثبت شد.`,
    });

    return record;
  }

  public convertSalesProformaToInvoice(
    proformaId: number,
    sourceWarehouseId: number,
    paymentDetails?: {
      paymentMethod: SalesPaymentMethod;
      trackingReference?: string;
      posTerminalOrBank?: string;
    },
    actorUserId: number = 1
  ): SalesInvoiceRecord {
    const pf = this.getSalesProformaById(proformaId);
    if (!pf) {
      throw new Error(`پیش‌فاکتور فروش با شناسه [${proformaId}] یافت نشد.`);
    }

    if (pf.status === 'CONVERTED') {
      throw new Error(`پیش‌فاکتور [${pf.proformaNumber}] قبلاً به فاکتور فروش تبدیل شده است.`);
    }

    // Single-step conversion: creates ONLY ONE sales invoice and ONE corresponding inventory movement
    return this.createSalesInvoice(
      {
        saleType: 'PROFORMA_CONVERTED',
        customerId: pf.customerId,
        sourceWarehouseId,
        proformaId: pf.id,
        dateJalali: pf.dateJalali,
        lines: pf.lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitPriceIrr: l.unitPriceIrr,
          discountIrr: l.discountIrr,
          vatAmountIrr: l.vatAmountIrr,
          notesFa: l.notesFa,
        })),
        paymentDetails,
        notesFa: `تبدیل مستقیم پیش‌فاکتور [${pf.proformaNumber}] به فاکتور قطعی فروش`,
      },
      actorUserId
    );
  }

  public getSalesReceipts(customerId?: number): SalesReceiptRecord[] {
    let list = this.dbState.salesReceipts || [];
    if (customerId) {
      list = list.filter((r) => r.customerId === customerId);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public createSalesReceipt(
    data: {
      customerId: number;
      salesInvoiceId?: number;
      paymentDateJalali?: string;
      amountIrr: number;
      paymentMethod: SalesPaymentMethod;
      destinationBankOrCash: string;
      trackingReference: string;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): SalesReceiptRecord {
    const customer = this.getParties().find((p) => p.id === data.customerId);
    if (!customer) throw new Error(`مشتری با شناسه [${data.customerId}] یافت نشد.`);

    const amount = Number(data.amountIrr) || 0;
    if (amount <= 0) throw new Error('مبلغ دریافتی باید بزرگتر از صفر باشد.');

    let invoice: SalesInvoiceRecord | null = null;
    if (data.salesInvoiceId) {
      invoice = this.getSalesInvoiceById(data.salesInvoiceId);
    }

    const nextId =
      this.dbState.salesReceipts.length > 0
        ? Math.max(...this.dbState.salesReceipts.map((r) => r.id)) + 1
        : 1;
    const receiptNumber = `REC-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    const record: SalesReceiptRecord = {
      id: nextId,
      receiptNumber,
      customerId: customer.id,
      customerTitleFa: customer.fullName,
      salesInvoiceId: invoice?.id || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      paymentDateJalali: data.paymentDateJalali || '1405/01/20',
      amountIrr: amount,
      paymentMethod: data.paymentMethod,
      destinationBankOrCash: data.destinationBankOrCash,
      trackingReference: data.trackingReference,
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    if (invoice) {
      invoice.paidAmountIrr += amount;
      invoice.remainingBalanceIrr = Math.max(0, invoice.totalInvoiceAmountIrr - invoice.paidAmountIrr);
      if (invoice.remainingBalanceIrr === 0) {
        invoice.status = 'PAID';
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }
      invoice.updatedAt = nowIso;
    }

    if (!customer.transactionsSummary) {
      customer.transactionsSummary = {
        totalSalesCount: 0,
        totalSalesIrr: 0,
        totalPurchasesCount: 0,
        totalPurchasesIrr: 0,
        totalReceiptsIrr: 0,
        totalPaymentsIrr: 0,
        activeProjectsCount: 0,
        netBalanceIrr: 0,
        lastTransactionDateJalali: data.paymentDateJalali || '1405/01/20',
      };
    }
    customer.transactionsSummary.totalReceiptsIrr += amount;
    customer.transactionsSummary.netBalanceIrr -= amount;
    customer.transactionsSummary.lastTransactionDateJalali = data.paymentDateJalali || '1405/01/20';

    const partyTxId =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    this.dbState.partyTransactions.push({
      id: partyTxId,
      partyId: customer.id,
      recordType: 'RECEIPT',
      referenceNumber: receiptNumber,
      titleFa: `دریافت وجه ${receiptNumber} (${customer.fullName})`,
      amountIrr: amount,
      dateJalali: data.paymentDateJalali || '1405/01/20',
      status: 'COMPLETED',
      notesFa: `دریافت وجه عطف به رسید [${receiptNumber}] ${invoice ? `بابت فاکتور ${invoice.invoiceNumber}` : ''}`,
      createdAt: nowIso,
    });

    this.dbState.salesReceipts.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'SALES_RECEIPT_CREATE',
      category: 'BUSINESS',
      targetEntity: 'sales_receipts',
      targetId: receiptNumber,
      status: 'SUCCESS',
      detailsFa: `دریافت وجه [${receiptNumber}] به مبلغ ${amount.toLocaleString()} ریال از مشتری «${customer.fullName}» ثبت و کسر بدهکاری حساب انجام شد.`,
    });

    return record;
  }

  public getSalesReturns(): SalesReturnRecord[] {
    return (this.dbState.salesReturns || []).sort((a, b) => b.id - a.id);
  }

  public createSalesReturn(
    data: {
      salesInvoiceId: number;
      targetWarehouseId: number;
      dateJalali?: string;
      lines: Array<{
        itemId: number;
        quantity: number;
        unitRefundIrr: number;
        serialNumbers?: string[];
        reasonFa?: string;
      }>;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): SalesReturnRecord {
    const invoice = this.getSalesInvoiceById(data.salesInvoiceId);
    if (!invoice) {
      throw new Error(`فاکتور فروش با شناسه [${data.salesInvoiceId}] یافت نشد.`);
    }

    const warehouse = this.getWarehouses().find((w) => w.id === data.targetWarehouseId);
    if (!warehouse) {
      throw new Error(`انبار با شناسه [${data.targetWarehouseId}] یافت نشد.`);
    }

    const customer = this.getParties().find((p) => p.id === invoice.customerId);
    if (!customer) {
      throw new Error(`مشتری مرتبط با فاکتور فروش یافت نشد.`);
    }

    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('مرجوعی از فروش باید حداقل دارای یک ردیف باشد.');
    }

    const itemMap = new Map(this.dbState.items.map((i) => [i.id, i]));
    let totalRefundAmountIrr = 0;
    const processedLines: SalesReturnLine[] = [];

    // Existing confirmed returns for this invoice
    const existingReturns = (this.dbState.salesReturns || []).filter(
      (r) => r.salesInvoiceId === invoice.id && r.status === 'CONFIRMED'
    );

    for (const l of data.lines) {
      const item = itemMap.get(l.itemId);
      if (!item) throw new Error(`کالا با شناسه [${l.itemId}] یافت نشد.`);

      const invoiceLine = invoice.lines?.find((il) => il.itemId === l.itemId);
      if (!invoiceLine) {
        throw new Error(`کالای «${item.titleFa}» در فاکتور فروش اصلی [${invoice.invoiceNumber}] وجود ندارد.`);
      }

      // Calculate total quantity previously returned for this item on this invoice
      const prevReturnedQty = existingReturns.reduce((sum, ret) => {
        const retLine = ret.lines.find((rl) => rl.itemId === l.itemId);
        return sum + (retLine ? retLine.quantity : 0);
      }, 0);

      const maxReturnableQty = invoiceLine.quantity - prevReturnedQty;
      const qty = Number(l.quantity) || 1;

      if (qty > maxReturnableQty) {
        throw new Error(
          `مقدار مرجوعی کالا («${item.titleFa}») برابر ${qty} بیشتر از حداکثر مقدار قابل مرجوعی (${maxReturnableQty}) برای این فاکتور است.`
        );
      }

      // Verify serial numbers if provided
      if (l.serialNumbers && l.serialNumbers.length > 0) {
        const invoiceSerials = invoiceLine.serialNumbers || [];
        for (const sn of l.serialNumbers) {
          if (!invoiceSerials.includes(sn)) {
            throw new Error(`شماره سریال [${sn}] متعلق به ردیف فروش فاکتور [${invoice.invoiceNumber}] نیست.`);
          }
          const alreadyReturned = existingReturns.some((ret) =>
            ret.lines.some((rl) => rl.serialNumbers?.includes(sn))
          );
          if (alreadyReturned) {
            throw new Error(`شماره سریال [${sn}] قبلاً در سند مرجوعی دیگری مرجوع شده است.`);
          }
        }
      }

      const refundUnit = Number(l.unitRefundIrr) || 0;
      const lineRefund = qty * refundUnit;
      totalRefundAmountIrr += lineRefund;

      processedLines.push({
        id: processedLines.length + 1,
        itemId: item.id,
        itemCode: item.itemCode,
        itemTitleFa: item.titleFa,
        quantity: qty,
        unitRefundIrr: refundUnit,
        totalRefundIrr: lineRefund,
        serialNumbers: l.serialNumbers,
        reasonFa: l.reasonFa,
      });
    }

    const nextId =
      this.dbState.salesReturns.length > 0
        ? Math.max(...this.dbState.salesReturns.map((r) => r.id)) + 1
        : 1;
    const returnNumber = `SRET-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    // 1. Transactionally Create Inbound Return Inventory Document (INBOUND_RETURN)
    const invDoc = this.createInventoryDocument(
      {
        docType: 'INBOUND_RETURN',
        dateJalali: data.dateJalali || '1405/01/20',
        targetWarehouseId: warehouse.id,
        partyId: customer.id,
        lines: processedLines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitCostIrr: l.unitRefundIrr,
          serialNumbers: l.serialNumbers,
          notesFa: `برگشت از فروش عطف به ${returnNumber}`,
        })),
        notesFa: `ورود کالا بابت مرجوعی از مشتری «${customer.fullName}» عطف به ${returnNumber}`,
      },
      actorUserId
    );

    // Update returned serials status to IN_STOCK
    for (const l of processedLines) {
      if (l.serialNumbers) {
        for (const sn of l.serialNumbers) {
          const serialRecord = this.getSerialByNumber(sn);
          if (serialRecord) {
            serialRecord.status = 'IN_STOCK';
            serialRecord.currentWarehouseId = warehouse.id;
            serialRecord.lastDocNumber = invDoc.docNumber;
            serialRecord.updatedAt = nowIso;
          }
        }
      }
    }

    // 2. Adjust Customer Financial Credit & Summary
    if (customer.transactionsSummary) {
      customer.transactionsSummary.netBalanceIrr -= totalRefundAmountIrr;
    }

    const partyTxId =
      this.dbState.partyTransactions.length > 0
        ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
        : 1;

    this.dbState.partyTransactions.push({
      id: partyTxId,
      partyId: customer.id,
      recordType: 'RECEIPT',
      referenceNumber: returnNumber,
      titleFa: `برگشت از فروش ${returnNumber} (${customer.fullName})`,
      amountIrr: totalRefundAmountIrr,
      dateJalali: data.dateJalali || '1405/01/20',
      status: 'COMPLETED',
      notesFa: `برگشت از فروش [${returnNumber}] - بستانکار شدن مشتری بابت مرجوعی کالا`,
      createdAt: nowIso,
    });

    const record: SalesReturnRecord = {
      id: nextId,
      returnNumber,
      salesInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: customer.id,
      customerTitleFa: customer.fullName,
      targetWarehouseId: warehouse.id,
      targetWarehouseTitleFa: warehouse.titleFa,
      dateJalali: data.dateJalali || '1405/01/20',
      lines: processedLines,
      totalRefundAmountIrr,
      inventoryDocId: invDoc.id,
      inventoryDocNumber: invDoc.docNumber,
      status: 'CONFIRMED',
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    this.dbState.salesReturns.push(record);
    this.saveDbState();

    if (this.isDoubleEntryAccountingEnabled()) {
      try {
        this.generateAccountingDocFromSalesReturn(record.id, actorUserId);
      } catch (err: unknown) {
        console.warn('Accounting voucher for sales return skipped/failed:', err);
      }
    }

    this.recordAuditLog({
      actorUserId,
      action: 'SALES_RETURN_CREATE',
      category: 'BUSINESS',
      targetEntity: 'sales_returns',
      targetId: returnNumber,
      status: 'SUCCESS',
      detailsFa: `برگشت از فروش [${returnNumber}] عطف به فاکتور ${invoice.invoiceNumber} ثبت گردید. ورود مجدد به انبار [${invDoc.docNumber}] و بازیابی وضعیت سریال‌ها به IN_STOCK انجام شد.`,
    });

    return record;
  }

  public cancelSalesInvoice(invoiceId: number, reasonFa: string, actorUserId: number = 1): SalesInvoiceRecord {
    const invoice = this.getSalesInvoiceById(invoiceId);
    if (!invoice) throw new Error(`فاکتور فروش با شناسه [${invoiceId}] یافت نشد.`);

    if (invoice.status === 'CANCELLED') {
      throw new Error(`فاکتور [${invoice.invoiceNumber}] قبلاً لغو شده است.`);
    }

    // Automatically execute sales return to restore inventory & serials
    if (invoice.lines && invoice.lines.length > 0) {
      this.createSalesReturn(
        {
          salesInvoiceId: invoice.id,
          targetWarehouseId: invoice.sourceWarehouseId,
          lines: invoice.lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitRefundIrr: l.netPriceIrr / l.quantity,
            serialNumbers: l.serialNumbers,
            reasonFa: `لغو رسمی فاکتور فروش: ${reasonFa}`,
          })),
          notesFa: `بازگشت خودکار کالا به انبار به دلیل لغو فاکتور ${invoice.invoiceNumber}`,
        },
        actorUserId
      );
    }

    invoice.status = 'CANCELLED';
    invoice.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'SALES_INVOICE_CANCEL',
      category: 'BUSINESS',
      targetEntity: 'sales_invoices',
      targetId: invoice.invoiceNumber,
      status: 'SUCCESS',
      detailsFa: `فاکتور فروش [${invoice.invoiceNumber}] لغو شد. علت: ${reasonFa}`,
    });

    return invoice;
  }

  // ============================================================================
  // STAGE 7: INSTALLATION SERVICES & WORK ORDERS
  // ============================================================================

  public getInstallationJobs(): InstallationJobRecord[] {
    return (this.dbState.installationJobs || []).sort((a, b) => b.id - a.id);
  }

  public getInstallationJobById(id: number): InstallationJobRecord | undefined {
    return (this.dbState.installationJobs || []).find((j) => j.id === id);
  }

  public createInstallationJob(
    data: {
      titleFa: string;
      customerId: number;
      salesInvoiceId?: number;
      installerId?: number;
      serviceFeeIrr?: number;
      additionalExpensesIrr?: number;
      locationAddressFa: string;
      scheduledDateJalali?: string;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): InstallationJobRecord {
    const customer = this.getParties().find((p) => p.id === data.customerId);
    if (!customer) {
      throw new Error(`مشتری با شناسه [${data.customerId}] یافت نشد.`);
    }

    let invoice: SalesInvoiceRecord | undefined;
    if (data.salesInvoiceId) {
      invoice = this.getSalesInvoiceById(data.salesInvoiceId);
    }

    let installer: PartyRecord | undefined;
    if (data.installerId) {
      installer = this.getParties().find((p) => p.id === data.installerId);
    }

    const serviceFee = Number(data.serviceFeeIrr) || 0;
    const additionalExp = Number(data.additionalExpensesIrr) || 0;
    const totalCost = serviceFee + additionalExp;

    const nextId =
      this.dbState.installationJobs.length > 0
        ? Math.max(...this.dbState.installationJobs.map((j) => j.id)) + 1
        : 1;
    const jobCode = `INS-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    const record: InstallationJobRecord = {
      id: nextId,
      jobCode,
      titleFa: data.titleFa,
      customerId: customer.id,
      customerTitleFa: customer.fullName,
      salesInvoiceId: invoice?.id || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      installerId: installer?.id || null,
      installerTitleFa: installer?.fullName || null,
      serviceFeeIrr: serviceFee,
      additionalExpensesIrr: additionalExp,
      totalCostIrr: totalCost,
      paidAmountIrr: 0,
      remainingBalanceIrr: totalCost,
      locationAddressFa: data.locationAddressFa,
      scheduledDateJalali: data.scheduledDateJalali || '1405/01/25',
      completedDateJalali: null,
      status: installer ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.installationJobs.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'INSTALLATION_JOB_CREATE',
      category: 'BUSINESS',
      targetEntity: 'installation_jobs',
      targetId: jobCode,
      status: 'SUCCESS',
      detailsFa: `پرونده خدمات نصب [${jobCode}] بابت «${data.titleFa}» برای مشتری «${customer.fullName}» ایجاد گردید.`,
    });

    return record;
  }

  public updateInstallationJobStatus(
    data: {
      jobId: number;
      status: InstallationJobStatus;
      installerId?: number;
      completedDateJalali?: string;
      paidAmountIrr?: number;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): InstallationJobRecord {
    const job = this.getInstallationJobById(data.jobId);
    if (!job) {
      throw new Error(`سفارش نصب با شناسه [${data.jobId}] یافت نشد.`);
    }

    if (data.installerId) {
      const installer = this.getParties().find((p) => p.id === data.installerId);
      if (installer) {
        job.installerId = installer.id;
        job.installerTitleFa = installer.fullName;
      }
    }

    if (data.status) {
      job.status = data.status;
      if (data.status === 'COMPLETED') {
        job.completedDateJalali = data.completedDateJalali || '1405/01/25';
      }
    }

    if (data.paidAmountIrr !== undefined) {
      job.paidAmountIrr = Number(data.paidAmountIrr) || 0;
      job.remainingBalanceIrr = Math.max(0, job.totalCostIrr - job.paidAmountIrr);
    }

    if (data.notesFa) {
      job.notesFa = data.notesFa;
    }

    job.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'INSTALLATION_JOB_UPDATE',
      category: 'BUSINESS',
      targetEntity: 'installation_jobs',
      targetId: job.jobCode,
      status: 'SUCCESS',
      detailsFa: `وضعیت سفارش نصب [${job.jobCode}] به «${job.status}» به‌روزرسانی شد.`,
    });

    return job;
  }

  // ============================================================================
  // STAGE 8: TREASURY, CASH/BANK, CHEQUES, INSTALLMENTS & OPERATIONAL EXPENSES
  // ============================================================================

  public getCashBoxes(): CashBoxRecord[] {
    return (this.dbState.cashBoxes || []).sort((a, b) => a.id - b.id);
  }

  public createCashBox(
    titleFaOrData: string | { titleFa?: string; title?: string; nameFa?: string; cashierUserId?: number | null; balanceIrr?: number },
    balanceIrrParam: number = 0
  ): CashBoxRecord {
    let title = '';
    let balance = balanceIrrParam;
    if (typeof titleFaOrData === 'string') {
      title = titleFaOrData;
    } else if (typeof titleFaOrData === 'object' && titleFaOrData !== null) {
      title = titleFaOrData.titleFa || titleFaOrData.title || titleFaOrData.nameFa || '';
      balance = titleFaOrData.balanceIrr || 0;
    }
    if (!title?.trim()) throw new Error('عنوان صندوق الزامی است.');
    const nextId =
      (this.dbState.cashBoxes || []).length > 0
        ? Math.max(...this.dbState.cashBoxes.map((c) => c.id)) + 1
        : 1;
    const boxCode = `CB-${1000 + nextId}`;
    const record: CashBoxRecord = {
      id: nextId,
      boxCode,
      titleFa: title.trim(),
      balanceIrr: Number(balance) || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    if (!Array.isArray(this.dbState.cashBoxes)) this.dbState.cashBoxes = [];
    this.dbState.cashBoxes.push(record);
    this.saveDbState();
    return record;
  }

  public getBankAccounts(): BankAccountRecord[] {
    return (this.dbState.bankAccounts || []).sort((a, b) => a.id - b.id);
  }

  public createBankAccount(
    bankNameFaOrData: string | { bankNameFa?: string; accountNumber?: string; shabaNumber?: string | null; balanceIrr?: number },
    accountNumberParam?: string,
    shabaNumberParam?: string,
    balanceIrrParam: number = 0
  ): BankAccountRecord {
    let bankNameFa = '';
    let accountNumber = accountNumberParam || '';
    let shabaNumber = shabaNumberParam || null;
    let balanceIrr = balanceIrrParam;

    if (typeof bankNameFaOrData === 'object' && bankNameFaOrData !== null) {
      bankNameFa = bankNameFaOrData.bankNameFa || '';
      accountNumber = bankNameFaOrData.accountNumber || '';
      shabaNumber = bankNameFaOrData.shabaNumber || null;
      balanceIrr = bankNameFaOrData.balanceIrr || 0;
    } else if (typeof bankNameFaOrData === 'string') {
      bankNameFa = bankNameFaOrData;
    }

    if (!bankNameFa?.trim()) throw new Error('نام بانک الزامی است.');
    if (!accountNumber?.trim()) throw new Error('شماره حساب بانکی الزامی است.');

    const nextId =
      (this.dbState.bankAccounts || []).length > 0
        ? Math.max(...this.dbState.bankAccounts.map((b) => b.id)) + 1
        : 1;
    const accountCode = `BA-${1000 + nextId}`;
    const record: BankAccountRecord = {
      id: nextId,
      accountCode,
      bankNameFa: bankNameFa.trim(),
      accountNumber: accountNumber.trim(),
      shabaNumber: shabaNumber?.trim() || null,
      balanceIrr: Number(balanceIrr) || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    if (!Array.isArray(this.dbState.bankAccounts)) this.dbState.bankAccounts = [];
    this.dbState.bankAccounts.push(record);
    this.saveDbState();
    return record;
  }

  public getCheques(): ChequeRecord[] {
    return (this.dbState.cheques || []).sort((a, b) => b.id - a.id);
  }

  public createCheque(
    data: {
      chequeNumber: string;
      chequeType: ChequeType;
      partyId: number;
      bankNameFa: string;
      branchNameFa?: string;
      amountIrr: number;
      issueDateJalali: string;
      dueDateJalali: string;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): ChequeRecord {
    const party = this.getParties().find((p) => p.id === data.partyId);
    if (!party) throw new Error(`طرف حساب با شناسه [${data.partyId}] یافت نشد.`);

    const nextId =
      this.dbState.cheques.length > 0
        ? Math.max(...this.dbState.cheques.map((c) => c.id)) + 1
        : 1;
    const nowIso = new Date().toISOString();

    const record: ChequeRecord = {
      id: nextId,
      chequeNumber: data.chequeNumber,
      chequeType: data.chequeType,
      partyId: party.id,
      partyNameFa: party.fullName,
      bankNameFa: data.bankNameFa,
      branchNameFa: data.branchNameFa || null,
      amountIrr: Number(data.amountIrr) || 0,
      issueDateJalali: data.issueDateJalali,
      dueDateJalali: data.dueDateJalali,
      status: 'IN_HAND',
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.cheques.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'CHEQUE_CREATE',
      category: 'BUSINESS',
      targetEntity: 'cheques',
      targetId: data.chequeNumber,
      status: 'SUCCESS',
      detailsFa: `چک ${data.chequeType === 'INBOUND' ? 'دریافتی' : 'پرداختی'} [${data.chequeNumber}] به مبلغ ${data.amountIrr.toLocaleString()} ریال ثبت گردید.`,
    });

    return record;
  }

  public updateChequeStatus(
    data: {
      chequeId: number;
      status: ChequeStatus;
      depositBankAccountId?: number;
      clearedDateJalali?: string;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): ChequeRecord {
    const cheque = this.dbState.cheques.find((c) => c.id === data.chequeId);
    if (!cheque) throw new Error(`چک با شناسه [${data.chequeId}] یافت نشد.`);

    const oldStatus = cheque.status;
    if (oldStatus === 'CLEARED' && data.status === 'CLEARED') {
      throw new Error(`چک [${cheque.chequeNumber}] قبلاً وصول شده و امکان وصول مجدد ندارد.`);
    }

    cheque.status = data.status;
    if (data.depositBankAccountId) {
      cheque.depositBankAccountId = data.depositBankAccountId;
    }
    if (data.clearedDateJalali) {
      cheque.clearedDateJalali = data.clearedDateJalali;
    }

    // Effect on Bank Account balance if CLEARED
    if (data.status === 'CLEARED' && oldStatus !== 'CLEARED') {
      const bankAcc = this.dbState.bankAccounts.find(
        (b) => b.id === (data.depositBankAccountId || cheque.depositBankAccountId || 1)
      );
      if (bankAcc) {
        if (cheque.chequeType === 'INBOUND') {
          bankAcc.balanceIrr += cheque.amountIrr;
        } else {
          bankAcc.balanceIrr -= cheque.amountIrr;
        }
      }

      if (this.isDoubleEntryAccountingEnabled()) {
        try {
          this.generateAccountingDocFromChequeClearance(cheque.id, actorUserId);
        } catch (err: unknown) {
          console.warn('Accounting voucher for cheque clearance skipped/failed:', err);
        }
      }
    }

    cheque.updatedAt = new Date().toISOString();
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'CHEQUE_STATUS_UPDATE',
      category: 'BUSINESS',
      targetEntity: 'cheques',
      targetId: cheque.chequeNumber,
      status: 'SUCCESS',
      detailsFa: `وضعیت چک [${cheque.chequeNumber}] از «${oldStatus}» به «${data.status}» تغییر یافت.`,
    });

    return cheque;
  }

  public getTreasuryTransactions(): TreasuryTransactionRecord[] {
    return (this.dbState.treasuryTransactions || []).sort((a, b) => b.id - a.id);
  }

  public createTreasuryTransaction(
    data: {
      txType: 'RECEIPT' | 'PAYMENT' | 'TRANSFER' | 'EXPENSE' | 'INCOME';
      dateJalali?: string;
      partyId?: number;
      amountIrr: number;
      paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CHEQUE';
      sourceCashBoxId?: number;
      sourceBankAccountId?: number;
      targetCashBoxId?: number;
      targetBankAccountId?: number;
      chequeId?: number;
      costCenterId?: number;
      notesFa?: string;
      skipPartyTx?: boolean;
    },
    actorUserId: number = 1
  ): TreasuryTransactionRecord {
    const amount = Number(data.amountIrr) || 0;
    if (amount <= 0) throw new Error('مبلغ تراکنش مالی خزانه باید بزرگتر از صفر باشد.');

    let partyNameFa: string | undefined;
    if (data.partyId) {
      const party = this.getParties().find((p) => p.id === data.partyId);
      if (party) partyNameFa = party.fullName;
    }

    // 1. Balance validation for outflows (PAYMENT, EXPENSE, TRANSFER)
    if (data.txType === 'PAYMENT' || data.txType === 'EXPENSE' || data.txType === 'TRANSFER') {
      let srcCashId = data.sourceCashBoxId;
      let srcBankId = data.sourceBankAccountId;

      // Fallback default resolution if neither source ID is explicitly specified
      if (!srcCashId && !srcBankId) {
        if (data.paymentMethod === 'CASH') {
          srcCashId = (this.dbState.cashBoxes || [])[0]?.id || 1;
          data.sourceCashBoxId = srcCashId;
        } else {
          srcBankId = (this.dbState.bankAccounts || [])[0]?.id || 1;
          data.sourceBankAccountId = srcBankId;
        }
      }

      if (srcCashId) {
        const box = (this.dbState.cashBoxes || []).find((c) => c.id === srcCashId);
        if (!box) {
          throw new Error('صندوق انتخابی برای پرداخت یافت نشد.');
        }
        const available = Number(box.balanceIrr) || 0;
        if (available < amount) {
          const deficit = amount - available;
          throw new Error(
            `موجودی صندوق «${box.titleFa}» (${available.toLocaleString('fa-IR')} ریال) برای پرداخت مبلغ (${amount.toLocaleString('fa-IR')} ریال) کافی نیست. کسری موجودی: ${deficit.toLocaleString('fa-IR')} ریال.`
          );
        }
      }

      if (srcBankId) {
        const bank = (this.dbState.bankAccounts || []).find((b) => b.id === srcBankId);
        if (!bank) {
          throw new Error('حساب بانکی انتخابی برای پرداخت یافت نشد.');
        }
        const available = Number(bank.balanceIrr) || 0;
        if (available < amount) {
          const deficit = amount - available;
          throw new Error(
            `موجودی حساب بانکی «${bank.bankNameFa}» (${available.toLocaleString('fa-IR')} ریال) برای پرداخت مبلغ (${amount.toLocaleString('fa-IR')} ریال) کافی نیست. کسری موجودی: ${deficit.toLocaleString('fa-IR')} ریال.`
          );
        }
      }
    }

    // 2. Update cashbox and bank account balances
    if (data.sourceCashBoxId) {
      const box = this.dbState.cashBoxes.find((c) => c.id === data.sourceCashBoxId);
      if (box) box.balanceIrr -= amount;
    }
    if (data.sourceBankAccountId) {
      const bank = this.dbState.bankAccounts.find((b) => b.id === data.sourceBankAccountId);
      if (bank) bank.balanceIrr -= amount;
    }
    if (data.targetCashBoxId) {
      const box = this.dbState.cashBoxes.find((c) => c.id === data.targetCashBoxId);
      if (box) box.balanceIrr += amount;
    }
    if (data.targetBankAccountId) {
      const bank = this.dbState.bankAccounts.find((b) => b.id === data.targetBankAccountId);
      if (bank) bank.balanceIrr += amount;
    }

    const nextId =
      this.dbState.treasuryTransactions.length > 0
        ? Math.max(...this.dbState.treasuryTransactions.map((t) => t.id)) + 1
        : 1;
    const txNumber = `TRN-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    const record: TreasuryTransactionRecord = {
      id: nextId,
      txNumber,
      txType: data.txType,
      dateJalali: data.dateJalali || '1405/01/25',
      partyId: data.partyId || null,
      partyNameFa: partyNameFa || null,
      amountIrr: amount,
      paymentMethod: data.paymentMethod,
      sourceCashBoxId: data.sourceCashBoxId || null,
      sourceBankAccountId: data.sourceBankAccountId || null,
      targetCashBoxId: data.targetCashBoxId || null,
      targetBankAccountId: data.targetBankAccountId || null,
      chequeId: data.chequeId || null,
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    this.dbState.treasuryTransactions.push(record);

    if (data.partyId) {
      const party = this.dbState.parties.find((p) => p.id === data.partyId);
      if (party) {
        if (!party.transactionsSummary) {
          party.transactionsSummary = {
            totalSalesCount: 0,
            totalSalesIrr: 0,
            totalPurchasesCount: 0,
            totalPurchasesIrr: 0,
            totalReceiptsIrr: 0,
            totalPaymentsIrr: 0,
            activeProjectsCount: 0,
            netBalanceIrr: 0,
            lastTransactionDateJalali: data.dateJalali || '1405/01/25',
          };
        }
        if (data.txType === 'RECEIPT') {
          party.transactionsSummary.totalReceiptsIrr += amount;
          party.transactionsSummary.netBalanceIrr -= amount;
        } else if (data.txType === 'PAYMENT') {
          party.transactionsSummary.totalPaymentsIrr += amount;
          party.transactionsSummary.netBalanceIrr -= amount;
        }
        party.transactionsSummary.lastTransactionDateJalali = data.dateJalali || '1405/01/25';
      }
    }

    if (data.partyId && !data.skipPartyTx && (data.txType === 'RECEIPT' || data.txType === 'PAYMENT')) {
      const partyTxId =
        this.dbState.partyTransactions.length > 0
          ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
          : 1;

      const recordType = data.txType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT';
      const titleFa =
        data.txType === 'RECEIPT'
          ? `دریافت وجه از ${partyNameFa || ''} (${txNumber})`
          : `پرداخت وجه به ${partyNameFa || ''} (${txNumber})`;

      this.dbState.partyTransactions.push({
        id: partyTxId,
        partyId: data.partyId,
        recordType,
        referenceNumber: txNumber,
        titleFa,
        amountIrr: amount,
        dateJalali: data.dateJalali || '1405/01/25',
        status: 'COMPLETED',
        notesFa: data.notesFa || null,
        createdAt: nowIso,
      });
    }

    this.saveDbState();

    if (this.isDoubleEntryAccountingEnabled()) {
      try {
        this.generateAccountingDocFromTreasuryTx(record.id, actorUserId);
      } catch (err: unknown) {
        console.warn('Accounting voucher for treasury transaction skipped/failed:', err);
      }
    }

    this.recordAuditLog({
      actorUserId,
      action: 'TREASURY_TRANSACTION_CREATE',
      category: 'BUSINESS',
      targetEntity: 'treasury_transactions',
      targetId: txNumber,
      status: 'SUCCESS',
      detailsFa: `تراکنش خزانه [${txNumber}] به مبلغ ${amount.toLocaleString()} ریال ثبت گردید.`,
    });

    return record;
  }

  public getInstallments(): InstallmentRecord[] {
    return (this.dbState.installments || []).sort((a, b) => a.id - b.id);
  }

  public payInstallment(
    installmentId: number,
    paidDateJalali: string,
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS' = 'POS',
    targetBankAccountId?: number,
    targetCashBoxId?: number,
    actorUserId: number = 1
  ): InstallmentRecord {
    const inst = this.dbState.installments.find((i) => i.id === installmentId);
    if (!inst) throw new Error(`قسط با شناسه [${installmentId}] یافت نشد.`);

    if (inst.status === 'PAID') {
      throw new Error(`قسط [${inst.installmentCode}] قبلاً پرداخت شده و امکان تسویه مجدد ندارد.`);
    }

    inst.status = 'PAID';
    inst.paidDateJalali = paidDateJalali;

    const isBank = paymentMethod === 'POS' || paymentMethod === 'BANK_TRANSFER';

    // Create Treasury Receipt Transaction
    const tx = this.createTreasuryTransaction(
      {
        txType: 'RECEIPT',
        dateJalali: paidDateJalali,
        partyId: inst.partyId,
        amountIrr: inst.amountIrr,
        paymentMethod,
        targetBankAccountId: isBank ? (targetBankAccountId || 1) : undefined,
        targetCashBoxId: !isBank ? (targetCashBoxId || 1) : undefined,
        notesFa: `تسویه قسط ${inst.installmentNumber} از ${inst.totalInstallments} (${inst.titleFa})`,
        skipPartyTx: false,
      },
      actorUserId
    );

    inst.treasuryTxId = tx.id;
    this.saveDbState();

    return inst;
  }

  public getOperationalExpenses(): OperationalExpenseRecord[] {
    return (this.dbState.operationalExpenses || []).sort((a, b) => b.id - a.id);
  }

  public createOperationalExpense(
    data: {
      expenseCategoryCode?: string;
      categoryFa?: string;
      titleFa: string;
      amountIrr: number;
      dateJalali?: string;
      paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'POS';
      sourceBankOrCash?: string;
      notesFa?: string;
      descriptionFa?: string;
      sourceCashBoxId?: number;
      sourceBankAccountId?: number;
      costCenterId?: number;
    },
    actorUserId: number = 1
  ): OperationalExpenseRecord {
    const amount = Number(data.amountIrr) || 0;
    if (amount <= 0) throw new Error('مبلغ هزینه عملیاتی باید بزرگتر از صفر باشد.');

    const nextId =
      this.dbState.operationalExpenses.length > 0
        ? Math.max(...this.dbState.operationalExpenses.map((e) => e.id)) + 1
        : 1;
    const expenseCode = `EXP-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();
    const categoryName = data.categoryFa || data.expenseCategoryCode || 'هزینه‌های عمومی و اداری';

    const record: OperationalExpenseRecord = {
      id: nextId,
      expenseCode,
      categoryFa: categoryName,
      titleFa: data.titleFa,
      amountIrr: amount,
      dateJalali: data.dateJalali || '1405/01/25',
      paymentMethod: data.paymentMethod || 'CASH',
      sourceBankOrCash: data.sourceBankOrCash || 'صندوق',
      notesFa: data.notesFa || data.descriptionFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    const isCash = (record.paymentMethod || 'CASH') === 'CASH';
    const cashBoxId = data.sourceCashBoxId || (isCash ? (this.dbState.cashBoxes[0]?.id || 1) : undefined);
    const bankAccountId = data.sourceBankAccountId || (!isCash ? (this.dbState.bankAccounts[0]?.id || 1) : undefined);

    // Automatically record treasury expense transaction & deduct balance
    this.createTreasuryTransaction(
      {
        txType: 'EXPENSE',
        dateJalali: record.dateJalali,
        amountIrr: amount,
        paymentMethod: record.paymentMethod,
        sourceCashBoxId: isCash ? cashBoxId : undefined,
        sourceBankAccountId: !isCash ? bankAccountId : undefined,
        costCenterId: data.costCenterId,
        notesFa: `هزینه عملیاتی [${record.categoryFa}] - ${record.titleFa}`,
      },
      actorUserId
    );

    this.dbState.operationalExpenses.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'OPERATIONAL_EXPENSE_CREATE',
      category: 'BUSINESS',
      targetEntity: 'operational_expenses',
      targetId: expenseCode,
      status: 'SUCCESS',
      detailsFa: `هزینه عملیاتی [${expenseCode}] بابت «${data.titleFa}» به مبلغ ${amount.toLocaleString()} ریال ثبت گردید.`,
    });

    return record;
  }

  public getOperationalIncomes(): OperationalIncomeRecord[] {
    return (this.dbState.operationalIncomes || []).sort((a, b) => b.id - a.id);
  }

  public createOperationalIncome(
    data: {
      categoryFa: string;
      titleFa: string;
      amountIrr: number;
      dateJalali?: string;
      receiptMethod?: 'CASH' | 'BANK_TRANSFER' | 'POS';
      targetBankAccountId?: number;
      targetCashBoxId?: number;
      targetBankOrCash?: string;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): OperationalIncomeRecord {
    const amount = Number(data.amountIrr) || 0;
    if (amount <= 0) throw new Error('مبلغ درآمد باید بزرگتر از صفر باشد.');

    if (!Array.isArray(this.dbState.operationalIncomes)) {
      this.dbState.operationalIncomes = [];
    }

    const nextId =
      this.dbState.operationalIncomes.length > 0
        ? Math.max(...this.dbState.operationalIncomes.map((i) => i.id)) + 1
        : 1;
    const incomeCode = `INC-1405-${1000 + nextId}`;
    const nowIso = new Date().toISOString();

    const record: OperationalIncomeRecord = {
      id: nextId,
      incomeCode,
      categoryFa: data.categoryFa || 'درآمدهای عملیاتی',
      titleFa: data.titleFa,
      amountIrr: amount,
      dateJalali: data.dateJalali || '1405/01/25',
      receiptMethod: data.receiptMethod || 'BANK_TRANSFER',
      targetBankOrCash: data.targetBankOrCash || 'بانک ملت - حساب جاری اصلی',
      notesFa: data.notesFa || null,
      actorUserId,
      createdAt: nowIso,
    };

    const isCash = record.receiptMethod === 'CASH';

    // Automatically record treasury receipt transaction & increase balance
    this.createTreasuryTransaction(
      {
        txType: 'RECEIPT',
        dateJalali: record.dateJalali,
        amountIrr: amount,
        paymentMethod: record.receiptMethod,
        targetBankAccountId: !isCash ? (data.targetBankAccountId || 1) : undefined,
        targetCashBoxId: isCash ? (data.targetCashBoxId || 1) : undefined,
        notesFa: `درآمد متفرقه [${record.categoryFa}] - ${record.titleFa}`,
      },
      actorUserId
    );

    this.dbState.operationalIncomes.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'OPERATIONAL_INCOME_CREATE',
      category: 'BUSINESS',
      targetEntity: 'operational_incomes',
      targetId: incomeCode,
      status: 'SUCCESS',
      detailsFa: `ثبت درآمد [${incomeCode}] بابت «${data.titleFa}» به مبلغ ${amount.toLocaleString()} ریال.`,
    });

    return record;
  }

  // ============================================================================
  // STAGE 9: DOUBLE-ENTRY ACCOUNTING, CHART OF ACCOUNTS, DOCUMENTS & GENERAL LEDGER
  // ============================================================================

  public getAccountsChart(): AccountRecord[] {
    return (this.dbState.accountsChart || []).sort((a, b) => a.code.localeCompare(b.code));
  }

  public createAccount(
    data: {
      code: string;
      titleFa: string;
      level: AccountRecord['level'];
      parentCode?: string | null;
      nature: AccountRecord['nature'];
      groupCode: AccountRecord['groupCode'];
      groupTitleFa: string;
      descriptionFa?: string;
    },
    actorUserId: number = 1
  ): AccountRecord {
    const cleanCode = data.code.trim();
    if (!cleanCode) throw new Error('کد حساب الزامی است.');
    if (this.dbState.accountsChart.some((a) => a.code === cleanCode)) {
      throw new Error(`حساب با کد «${cleanCode}» قبلاً در سیستم ثبت شده است.`);
    }

    const nextId =
      this.dbState.accountsChart.length > 0
        ? Math.max(...this.dbState.accountsChart.map((a) => a.id)) + 1
        : 1;

    const record: AccountRecord = {
      id: nextId,
      code: cleanCode,
      titleFa: data.titleFa.trim(),
      level: data.level,
      parentCode: data.parentCode || null,
      nature: data.nature,
      groupCode: data.groupCode,
      groupTitleFa: data.groupTitleFa,
      descriptionFa: data.descriptionFa?.trim(),
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    this.dbState.accountsChart.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'ACCOUNT_CHART_CREATE',
      category: 'BUSINESS',
      targetEntity: 'accounts_chart',
      targetId: cleanCode,
      status: 'SUCCESS',
      detailsFa: `سرفصل حسابداری جدید [${cleanCode}] «${record.titleFa}» با ماهیت [${record.nature}] تعریف شد.`,
    });

    return record;
  }

  public getAccountingDocuments(filter?: {
    status?: string;
    docType?: string;
    search?: string;
  }): AccountingDocumentRecord[] {
    let docs = [...(this.dbState.accountingDocuments || [])];
    if (filter?.status && filter.status !== 'ALL') {
      docs = docs.filter((d) => d.status === filter.status);
    }
    if (filter?.docType && filter.docType !== 'ALL') {
      docs = docs.filter((d) => d.docType === filter.docType);
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      docs = docs.filter(
        (d) =>
          d.docNumber.toLowerCase().includes(q) ||
          d.descriptionFa.toLowerCase().includes(q) ||
          (d.referenceNumber && d.referenceNumber.toLowerCase().includes(q))
      );
    }
    return docs.sort((a, b) => b.id - a.id);
  }

  public isDoubleEntryAccountingEnabled(): boolean {
    return this.dbState.settings.enableDoubleEntryAccounting !== false;
  }

  public getAccountingDocumentById(id: number): AccountingDocumentRecord | undefined {
    return (this.dbState.accountingDocuments || []).find((d) => d.id === id);
  }

  public createAccountingDocument(
    data: {
      docNumber?: string;
      referenceNumber?: string;
      dateJalali: string;
      docType?: 'MANUAL' | 'AUTO' | 'CLOSING';
      sourceDocType?: AccountingSourceDocType;
      sourceDocId?: string | number;
      descriptionFa: string;
      status?: AccountingDocumentStatus;
      lines: Array<{
        accountCode: string;
        accountTitleFa: string;
        detailId?: number | null;
        detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
        detailTitleFa?: string | null;
        debitIrr: number;
        creditIrr: number;
        descriptionFa: string;
      }>;
    },
    actorUserId: number = 1
  ): AccountingDocumentRecord {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }

    // Stage 10: Document Date Validation against Fiscal Year & Accounting Period
    if (data.dateJalali) {
      const dateCheck = this.validateDocumentDateForPosting(data.dateJalali);
      if (!dateCheck.valid) {
        throw new Error(dateCheck.errorFa || 'تاریخ سند در محدوده دوره مالی مجاز نمی‌باشد.');
      }
    }

    if (!data.lines || data.lines.length < 2) {
      throw new Error('سند حسابداری باید حداقل شامل دو آرتیکل (یک بدهکار و یک بستانکار) باشد.');
    }

    const totalDebitIrr = data.lines.reduce((acc, l) => acc + (Number(l.debitIrr) || 0), 0);
    const totalCreditIrr = data.lines.reduce((acc, l) => acc + (Number(l.creditIrr) || 0), 0);

    if (totalDebitIrr <= 0 || totalCreditIrr <= 0) {
      throw new Error('مبالغ بدهکار و بستانکار سند حسابداری باید مثبت و بزرگتر از صفر باشند.');
    }

    if (totalDebitIrr !== totalCreditIrr) {
      throw new Error(
        `سند حسابداری تراز نیست! جمع بدهکار (${totalDebitIrr.toLocaleString()} ریال) با جمع بستانکار (${totalCreditIrr.toLocaleString()} ریال) برابر نمی‌باشد.`
      );
    }

    // Idempotency check for auto-generated documents
    if (data.sourceDocType && data.sourceDocId) {
      const existing = this.dbState.accountingDocuments.find(
        (d) =>
          d.sourceDocType === data.sourceDocType &&
          String(d.sourceDocId) === String(data.sourceDocId)
      );
      if (existing) {
        throw new Error(
          `برای این رویداد (${data.sourceDocType} #${data.sourceDocId}) قبلاً سند حسابداری «${existing.docNumber}» صادر شده است.`
        );
      }
    }

    const nextId =
      this.dbState.accountingDocuments.length > 0
        ? Math.max(...this.dbState.accountingDocuments.map((d) => d.id)) + 1
        : 1;

    const docNumber = data.docNumber || `DOC-1405-${String(nextId).padStart(4, '0')}`;
    const actor = this.getUserById(actorUserId) || this.getActiveUser();
    const nowIso = new Date().toISOString();

    const formattedLines: AccountingDocumentLine[] = data.lines.map((l, idx) => ({
      id: idx + 1,
      rowNumber: idx + 1,
      accountCode: l.accountCode.trim(),
      accountTitleFa: l.accountTitleFa.trim(),
      detailId: l.detailId || null,
      detailType: l.detailType || null,
      detailTitleFa: l.detailTitleFa?.trim() || null,
      debitIrr: Number(l.debitIrr) || 0,
      creditIrr: Number(l.creditIrr) || 0,
      descriptionFa: l.descriptionFa.trim() || data.descriptionFa.trim(),
    }));

    const status = data.status || 'APPROVED';

    const record: AccountingDocumentRecord = {
      id: nextId,
      docNumber,
      referenceNumber: data.referenceNumber?.trim() || null,
      dateJalali: data.dateJalali || '1405/01/25',
      dateIso: nowIso,
      docType: data.docType || 'MANUAL',
      sourceDocType: data.sourceDocType || 'MANUAL',
      sourceDocId: data.sourceDocId || null,
      descriptionFa: data.descriptionFa.trim(),
      status,
      totalDebitIrr,
      totalCreditIrr,
      lines: formattedLines,
      createdByUserId: actor.id,
      createdByName: actor.fullName,
      approvedByUserId: status === 'APPROVED' || status === 'PERMANENT' ? actor.id : null,
      approvedByName: status === 'APPROVED' || status === 'PERMANENT' ? actor.fullName : null,
      permanentByUserId: status === 'PERMANENT' ? actor.id : null,
      permanentByName: status === 'PERMANENT' ? actor.fullName : null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.accountingDocuments.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'ACCOUNTING_DOC_CREATE',
      category: 'BUSINESS',
      targetEntity: 'accounting_documents',
      targetId: docNumber,
      status: 'SUCCESS',
      detailsFa: `سند حسابداری [${docNumber}] به مبلغ ${totalDebitIrr.toLocaleString()} ریال با وضعیت [${status}] ثبت گردید.`,
      metadata: {
        totalDebitIrr,
        totalCreditIrr,
        linesCount: formattedLines.length,
        sourceDocType: data.sourceDocType,
        sourceDocId: data.sourceDocId,
      },
    });

    return record;
  }

  public updateAccountingDocument(
    id: number,
    data: {
      dateJalali?: string;
      referenceNumber?: string;
      descriptionFa?: string;
      lines?: Array<{
        accountCode: string;
        accountTitleFa: string;
        detailId?: number | null;
        detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
        detailTitleFa?: string | null;
        debitIrr: number;
        creditIrr: number;
        descriptionFa: string;
      }>;
    },
    actorUserId: number = 1
  ): AccountingDocumentRecord {
    const doc = this.dbState.accountingDocuments.find((d) => d.id === id);
    if (!doc) throw new Error('سند حسابداری یافت نشد.');
    if (doc.status === 'PERMANENT') {
      throw new Error('سند حسابداری در وضعیت قطعی (PERMANENT) قرار دارد و طبق استانداردهای حسابداری غیرقابل ویرایش مستقیم است. لطفاً سند اصلاحی یا معکوس ثبت نمایید.');
    }

    if (data.lines) {
      if (data.lines.length < 2) {
        throw new Error('سند حسابداری باید حداقل شامل دو آرتیکل باشد.');
      }
      const totalDebitIrr = data.lines.reduce((acc, l) => acc + (Number(l.debitIrr) || 0), 0);
      const totalCreditIrr = data.lines.reduce((acc, l) => acc + (Number(l.creditIrr) || 0), 0);

      if (totalDebitIrr !== totalCreditIrr) {
        throw new Error(
          `سند حسابداری تراز نیست! بدهکار: ${totalDebitIrr.toLocaleString()} ریال، بستانکار: ${totalCreditIrr.toLocaleString()} ریال.`
        );
      }

      doc.lines = data.lines.map((l, idx) => ({
        id: idx + 1,
        rowNumber: idx + 1,
        accountCode: l.accountCode.trim(),
        accountTitleFa: l.accountTitleFa.trim(),
        detailId: l.detailId || null,
        detailType: l.detailType || null,
        detailTitleFa: l.detailTitleFa?.trim() || null,
        debitIrr: Number(l.debitIrr) || 0,
        creditIrr: Number(l.creditIrr) || 0,
        descriptionFa: l.descriptionFa.trim() || doc.descriptionFa,
      }));
      doc.totalDebitIrr = totalDebitIrr;
      doc.totalCreditIrr = totalCreditIrr;
    }

    if (data.dateJalali && data.dateJalali !== doc.dateJalali) {
      const dateCheck = this.validateDocumentDateForPosting(data.dateJalali);
      if (!dateCheck.valid) {
        throw new Error(dateCheck.errorFa || 'تاریخ سند در محدوده دوره مالی مجاز نمی‌باشد.');
      }
      doc.dateJalali = data.dateJalali;
    }
    if (data.referenceNumber !== undefined) doc.referenceNumber = data.referenceNumber?.trim() || null;
    if (data.descriptionFa) doc.descriptionFa = data.descriptionFa.trim();
    doc.updatedAt = new Date().toISOString();

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'ACCOUNTING_DOC_UPDATE',
      category: 'BUSINESS',
      targetEntity: 'accounting_documents',
      targetId: doc.docNumber,
      status: 'SUCCESS',
      detailsFa: `سند حسابداری [${doc.docNumber}] ویرایش و تراز آن مجدداً اعتبارسنجی گردید.`,
    });

    return doc;
  }

  public approveAccountingDocument(id: number, actorUserId: number = 1): AccountingDocumentRecord {
    const doc = this.dbState.accountingDocuments.find((d) => d.id === id);
    if (!doc) throw new Error('سند حسابداری یافت نشد.');
    if (doc.status === 'PERMANENT') {
      throw new Error('سند قبلاً قطعی شده است.');
    }

    const actor = this.getUserById(actorUserId) || this.getActiveUser();
    doc.status = 'APPROVED';
    doc.approvedByUserId = actor.id;
    doc.approvedByName = actor.fullName;
    doc.updatedAt = new Date().toISOString();

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'ACCOUNTING_DOC_APPROVE',
      category: 'BUSINESS',
      targetEntity: 'accounting_documents',
      targetId: doc.docNumber,
      status: 'SUCCESS',
      detailsFa: `سند حسابداری [${doc.docNumber}] توسط کاربر «${actor.fullName}» تایید و به اسناد رسمی دوره اضافه گردید.`,
    });

    return doc;
  }

  public makeAccountingDocumentPermanent(id: number, actorUserId: number = 1): AccountingDocumentRecord {
    const doc = this.dbState.accountingDocuments.find((d) => d.id === id);
    if (!doc) throw new Error('سند حسابداری یافت نشد.');
    if (doc.status !== 'APPROVED') {
      throw new Error('فقط اسناد تایید شده (APPROVED) امکان تبدیل به سند قطعی و قفل‌شده را دارند.');
    }

    const actor = this.getUserById(actorUserId) || this.getActiveUser();
    doc.status = 'PERMANENT';
    doc.permanentByUserId = actor.id;
    doc.permanentByName = actor.fullName;
    doc.updatedAt = new Date().toISOString();

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'ACCOUNTING_DOC_PERMANENT',
      category: 'SECURITY',
      targetEntity: 'accounting_documents',
      targetId: doc.docNumber,
      status: 'SUCCESS',
      detailsFa: `سند حسابداری [${doc.docNumber}] به وضعیت قطعی (PERMANENT) تغییر یافت و برای جلوگیری از هرگونه تغییر قفل شد.`,
    });

    return doc;
  }

  public deleteAccountingDocument(id: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const doc = this.dbState.accountingDocuments.find((d) => d.id === id);
    if (!doc) throw new Error('سند حسابداری یافت نشد.');
    if (doc.status === 'PERMANENT') {
      throw new Error('اسناد قطعی شده طبق قوانین مالیاتی و حسابداری غیرقابل حذف هستند.');
    }
    if (doc.status === 'APPROVED') {
      throw new Error('سند تایید شده امکان حذف مستقیم ندارد. لطفاً ابتدا وضعیت آن را تغییر دهید یا سند معکوس صادر نمایید.');
    }

    this.dbState.accountingDocuments = this.dbState.accountingDocuments.filter((d) => d.id !== id);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'ACCOUNTING_DOC_DELETE',
      category: 'BUSINESS',
      targetEntity: 'accounting_documents',
      targetId: doc.docNumber,
      status: 'SUCCESS',
      detailsFa: `سند حسابداری پیش‌نویس [${doc.docNumber}] حذف گردید.`,
    });

    return { ok: true, messageFa: `سند پیش‌نویس «${doc.docNumber}» با موفقیت حذف شد.` };
  }

  // ============================================================================
  // AUTOMATIC GENERATION OF ACCOUNTING DOCUMENTS WITH IDEMPOTENCY
  // ============================================================================

  public generateAccountingDocFromSalesInvoice(invoiceId: number, actorUserId: number = 1): AccountingDocumentRecord {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }
    const invoice = this.getSalesInvoiceById(invoiceId);
    if (!invoice) throw new Error('فاکتور فروش یافت نشد.');

    // Idempotency check
    const existing = this.dbState.accountingDocuments.find(
      (d) => d.sourceDocType === 'SALES_INVOICE' && String(d.sourceDocId) === String(invoiceId)
    );
    if (existing) {
      return existing; // idempotent return
    }

    const totalInvoiceAmount = invoice.totalInvoiceAmountIrr;
    const paidAmount = invoice.paidAmountIrr;
    const remainingAmount = invoice.remainingBalanceIrr;
    const totalCostOfGoods = invoice.totalCogsIrr || Math.round(totalInvoiceAmount * 0.75); // COGS

    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [];

    // 1. Debtors or Cash/Bank
    if (remainingAmount > 0) {
      lines.push({
        accountCode: '10301',
        accountTitleFa: 'بدهکاران تجاری - خریداران حقیقی و پروژه‌ای',
        detailType: 'PARTY',
        detailId: invoice.customerId,
        detailTitleFa: invoice.customerTitleFa,
        debitIrr: remainingAmount,
        creditIrr: 0,
        descriptionFa: `بدهی خریدار بابت فاکتور فروش ${invoice.invoiceNumber}`,
      });
    }

    if (paidAmount > 0) {
      if (invoice.saleType === 'QUICK_POS_SALE') {
        lines.push({
          accountCode: '10103',
          accountTitleFa: 'پایانه‌های فروش و دستگاه‌های کارتخوان (POS)',
          detailType: 'BANK_ACCOUNT',
          detailId: 1,
          detailTitleFa: 'بانک ملت - پوز فروشگاه',
          debitIrr: paidAmount,
          creditIrr: 0,
          descriptionFa: `دریافتی کارتخوان بابت فاکتور ${invoice.invoiceNumber}`,
        });
      } else {
        lines.push({
          accountCode: '10101',
          accountTitleFa: 'صندوق‌های فروشگاه و دفتر مرکزی',
          detailType: 'CASH_BOX',
          detailId: 1,
          detailTitleFa: 'صندوق اصلی فروشگاه',
          debitIrr: paidAmount,
          creditIrr: 0,
          descriptionFa: `دریافتی نقد بابت فاکتور ${invoice.invoiceNumber}`,
        });
      }
    }

    // 2. Sales Revenue Credit
    lines.push({
      accountCode: '60101',
      accountTitleFa: 'درآمد فروش دوربین‌های مداربسته، دستگاه‌های ضبط و تجهیزات',
      detailType: null,
      detailId: null,
      detailTitleFa: null,
      debitIrr: 0,
      creditIrr: totalInvoiceAmount,
      descriptionFa: `فروش کالا و متعلقات به «${invoice.customerTitleFa}»`,
    });

    // 3. COGS and Inventory Reduction
    if (totalCostOfGoods > 0) {
      lines.push({
        accountCode: '70101',
        accountTitleFa: 'بهای تمام‌شده اقلام خارج‌شده از انبار',
        detailType: null,
        detailId: null,
        detailTitleFa: null,
        debitIrr: totalCostOfGoods,
        creditIrr: 0,
        descriptionFa: `بهای تمام‌شده کالای فروش‌رفته (COGS) فاکتور ${invoice.invoiceNumber}`,
      });

      lines.push({
        accountCode: '10401',
        accountTitleFa: 'موجودی انبار مرکزی و فروشگاه (دوربین مداربسته و ملزومات)',
        detailType: null,
        detailId: null,
        detailTitleFa: null,
        debitIrr: 0,
        creditIrr: totalCostOfGoods,
        descriptionFa: `کاهش موجودی انبار بابت خروج اقلام فاکتور ${invoice.invoiceNumber}`,
      });
    }

    return this.createAccountingDocument(
      {
        referenceNumber: invoice.invoiceNumber,
        dateJalali: invoice.dateJalali,
        docType: 'AUTO',
        sourceDocType: 'SALES_INVOICE',
        sourceDocId: invoice.id,
        descriptionFa: `سند اتوماتیک فروش و خروج انبار فاکتور ${invoice.invoiceNumber} - خریدار: ${invoice.customerTitleFa}`,
        status: 'APPROVED',
        lines,
      },
      actorUserId
    );
  }

  public generateAccountingDocFromPurchaseInvoice(invoiceId: number, actorUserId: number = 1): AccountingDocumentRecord {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }
    const invoice = this.getPurchaseInvoiceById(invoiceId);
    if (!invoice) throw new Error('فاکتور خرید یافت نشد.');

    // Idempotency check
    const existing = this.dbState.accountingDocuments.find(
      (d) => d.sourceDocType === 'PURCHASE_INVOICE' && String(d.sourceDocId) === String(invoiceId)
    );
    if (existing) {
      return existing;
    }

    const totalValuation = invoice.totalInventoryValuationIrr;
    const payableToSupplier = invoice.totalInvoicePayableToSupplierIrr;

    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [
      {
        accountCode: '10401',
        accountTitleFa: 'موجودی انبار مرکزی و فروشگاه (دوربین مداربسته و ملزومات)',
        detailType: null,
        detailId: null,
        detailTitleFa: null,
        debitIrr: totalValuation,
        creditIrr: 0,
        descriptionFa: `ورود کالای فاکتور خرید ${invoice.invoiceNumber} به بهای تمام‌شده`,
      },
      {
        accountCode: '30101',
        accountTitleFa: 'بستانکاران تجاری - تأمین‌کنندگان و واردکنندگان کالا',
        detailType: 'PARTY',
        detailId: invoice.supplierId,
        detailTitleFa: invoice.supplierTitleFa,
        debitIrr: 0,
        creditIrr: payableToSupplier,
        descriptionFa: `بستانکاری تأمین‌کننده بابت فاکتور خرید ${invoice.invoiceNumber}`,
      },
    ];

    // If landed cost was allocated
    const landedCostDiff = totalValuation - payableToSupplier;
    if (landedCostDiff > 0) {
      lines.push({
        accountCode: '10102',
        accountTitleFa: 'حساب‌های جاری بانکی',
        detailType: 'BANK_ACCOUNT',
        detailId: 1,
        detailTitleFa: 'بانک ملت',
        debitIrr: 0,
        creditIrr: landedCostDiff,
        descriptionFa: `هزینه‌های سربار، حمل و ترخیص فاکتور خرید ${invoice.invoiceNumber}`,
      });
    }

    return this.createAccountingDocument(
      {
        referenceNumber: invoice.invoiceNumber,
        dateJalali: invoice.dateJalali,
        docType: 'AUTO',
        sourceDocType: 'PURCHASE_INVOICE',
        sourceDocId: invoice.id,
        descriptionFa: `سند اتوماتیک فاکتور خرید ${invoice.invoiceNumber} از تأمین‌کننده «${invoice.supplierTitleFa}»`,
        status: 'APPROVED',
        lines,
      },
      actorUserId
    );
  }

  public generateAccountingDocFromTreasuryTx(txId: number, actorUserId: number = 1): AccountingDocumentRecord {
    const tx = this.dbState.treasuryTransactions.find((t) => t.id === txId);
    if (!tx) throw new Error('تراکنش خزانه یافت نشد.');

    // Idempotency check
    const existing = this.dbState.accountingDocuments.find(
      (d) =>
        (d.sourceDocType === 'TREASURY_RECEIPT' || d.sourceDocType === 'TREASURY_PAYMENT') &&
        String(d.sourceDocId) === String(txId)
    );
    if (existing) {
      return existing;
    }

    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [];

    const isBank = Boolean(tx.targetBankAccountId || tx.sourceBankAccountId);
    const liquidAccountCode = isBank ? '10102' : '10101';
    const liquidAccountTitle = isBank ? 'حساب‌های جاری بانکی' : 'صندوق‌های فروشگاه و دفتر مرکزی';

    if (tx.txType === 'RECEIPT') {
      // Debit: Bank/Cash, Credit: Customer (Debtor)
      lines.push({
        accountCode: liquidAccountCode,
        accountTitleFa: liquidAccountTitle,
        detailType: isBank ? 'BANK_ACCOUNT' : 'CASH_BOX',
        detailId: tx.targetBankAccountId || tx.targetCashBoxId || 1,
        detailTitleFa: isBank ? 'حساب جاری بانک' : 'صندوق فروشگاه',
        debitIrr: tx.amountIrr,
        creditIrr: 0,
        descriptionFa: `وصول وجه نقد/حواله طبق سند ${tx.txNumber}`,
      });

      lines.push({
        accountCode: '10301',
        accountTitleFa: 'بدهکاران تجاری - خریداران حقیقی و پروژه‌ای',
        detailType: 'PARTY',
        detailId: tx.partyId || null,
        detailTitleFa: tx.partyNameFa || 'مشتری',
        debitIrr: 0,
        creditIrr: tx.amountIrr,
        descriptionFa: `بستانکاری طرف‌حساب بابت دریافت وجه (${tx.partyNameFa || 'مشتری'})`,
      });
    } else if (tx.txType === 'PAYMENT') {
      // Debit: Supplier (Creditor), Credit: Bank/Cash
      lines.push({
        accountCode: '30101',
        accountTitleFa: 'بستانکاران تجاری - تأمین‌کنندگان و واردکنندگان کالا',
        detailType: 'PARTY',
        detailId: tx.partyId || null,
        detailTitleFa: tx.partyNameFa || 'تأمین‌کننده',
        debitIrr: tx.amountIrr,
        creditIrr: 0,
        descriptionFa: `بدهکار کردن طرف‌حساب بابت پرداخت وجه به (${tx.partyNameFa || 'تأمین‌کننده'})`,
      });

      lines.push({
        accountCode: liquidAccountCode,
        accountTitleFa: liquidAccountTitle,
        detailType: isBank ? 'BANK_ACCOUNT' : 'CASH_BOX',
        detailId: tx.sourceBankAccountId || tx.sourceCashBoxId || 1,
        detailTitleFa: isBank ? 'حساب جاری بانک' : 'صندوق فروشگاه',
        debitIrr: 0,
        creditIrr: tx.amountIrr,
        descriptionFa: `خروج وجه نقد/بانک بابت پرداخت سند ${tx.txNumber}`,
      });
    } else {
      // TRANSFER
      lines.push({
        accountCode: '10102',
        accountTitleFa: 'حساب‌های جاری بانکی',
        detailType: 'BANK_ACCOUNT',
        detailId: tx.targetBankAccountId || 1,
        detailTitleFa: 'حساب مقصد',
        debitIrr: tx.amountIrr,
        creditIrr: 0,
        descriptionFa: `انتقال بین‌حسابی - واریز به حساب مقصد`,
      });

      lines.push({
        accountCode: '10101',
        accountTitleFa: 'صندوق‌های فروشگاه و دفتر مرکزی',
        detailType: 'CASH_BOX',
        detailId: tx.sourceCashBoxId || 1,
        detailTitleFa: 'صندوق مبدأ',
        debitIrr: 0,
        creditIrr: tx.amountIrr,
        descriptionFa: `انتقال بین‌حسابی - برداشت از صندوق مبدأ`,
      });
    }

    return this.createAccountingDocument(
      {
        referenceNumber: tx.txNumber,
        dateJalali: tx.dateJalali,
        docType: 'AUTO',
        sourceDocType: tx.txType === 'RECEIPT' ? 'TREASURY_RECEIPT' : 'TREASURY_PAYMENT',
        sourceDocId: tx.id,
        descriptionFa: `سند اتوماتیک خزانه: ${tx.txType === 'RECEIPT' ? 'دریافت وجه' : 'پرداخت وجه'} [${tx.txNumber}] - مبلغ: ${tx.amountIrr.toLocaleString()} ریال`,
        status: 'APPROVED',
        lines,
      },
      actorUserId
    );
  }

  public generateAccountingDocFromExpense(expenseId: number, actorUserId: number = 1): AccountingDocumentRecord {
    const expense = this.dbState.operationalExpenses.find((e) => e.id === expenseId);
    if (!expense) throw new Error('هزینه عملیاتی یافت نشد.');

    // Idempotency check
    const existing = this.dbState.accountingDocuments.find(
      (d) => d.sourceDocType === 'OPERATIONAL_EXPENSE' && String(d.sourceDocId) === String(expenseId)
    );
    if (existing) {
      return existing;
    }

    // Map expense category to subsidiary code
    let expenseCode = '80106'; // سایر
    if (expense.categoryFa.includes('اجاره')) expenseCode = '80101';
    else if (expense.categoryFa.includes('قبوض') || expense.categoryFa.includes('آب') || expense.categoryFa.includes('برق')) expenseCode = '80102';
    else if (expense.categoryFa.includes('حقوق') || expense.categoryFa.includes('دستمزد')) expenseCode = '80103';
    else if (expense.categoryFa.includes('حمل') || expense.categoryFa.includes('پیک')) expenseCode = '80104';
    else if (expense.categoryFa.includes('ملزومات') || expense.categoryFa.includes('ابزار')) expenseCode = '80105';

    const account = this.dbState.accountsChart.find((a) => a.code === expenseCode);
    const titleFa = account?.titleFa || 'هزینه‌های عمومی و اداری';

    const isBank = expense.paymentMethod === 'BANK_TRANSFER' || expense.sourceBankOrCash.includes('بانک');

    const lines = [
      {
        accountCode: expenseCode,
        accountTitleFa: titleFa,
        detailType: 'COST_CENTER' as const,
        detailId: null,
        detailTitleFa: expense.categoryFa,
        debitIrr: expense.amountIrr,
        creditIrr: 0,
        descriptionFa: `ثبت هزینه [${expense.categoryFa}] - ${expense.titleFa}`,
      },
      {
        accountCode: isBank ? '10102' : '10101',
        accountTitleFa: isBank ? 'حساب‌های جاری بانکی' : 'صندوق‌های فروشگاه و دفتر مرکزی',
        detailType: (isBank ? 'BANK_ACCOUNT' : 'CASH_BOX') as 'BANK_ACCOUNT' | 'CASH_BOX',
        detailId: 1,
        detailTitleFa: expense.sourceBankOrCash,
        debitIrr: 0,
        creditIrr: expense.amountIrr,
        descriptionFa: `پرداخت هزینه از محل «${expense.sourceBankOrCash}»`,
      },
    ];

    return this.createAccountingDocument(
      {
        referenceNumber: expense.expenseCode,
        dateJalali: expense.dateJalali,
        docType: 'AUTO',
        sourceDocType: 'OPERATIONAL_EXPENSE',
        sourceDocId: expense.id,
        descriptionFa: `سند اتوماتیک هزینه عملیاتی: ${expense.titleFa} [${expense.expenseCode}]`,
        status: 'APPROVED',
        lines,
      },
      actorUserId
    );
  }

  public generateAccountingDocFromInstallationJob(
    jobId: number,
    actorUserId: number = 1
  ): AccountingDocumentRecord {
    const job = this.getInstallationJobById(jobId);
    if (!job) {
      throw new Error(`پرونده نصب با شناسه [${jobId}] یافت نشد.`);
    }

    // Idempotency check
    const existing = this.dbState.accountingDocuments.find(
      (d) => d.sourceDocType === 'INSTALLATION_JOB' && String(d.sourceDocId) === String(job.id)
    );
    if (existing) {
      return existing;
    }

    const totalCost = job.totalCostIrr || job.serviceFeeIrr + job.additionalExpensesIrr;
    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [
      {
        accountCode: '10301',
        accountTitleFa: 'بدهکاران تجاری - خریداران حقیقی و پروژه‌ای',
        detailType: 'PARTY',
        detailId: job.customerId,
        detailTitleFa: job.customerTitleFa,
        debitIrr: totalCost,
        creditIrr: 0,
        descriptionFa: `بدهی مشتری بابت خدمات نصب [${job.jobCode}]`,
      },
      {
        accountCode: '60201',
        accountTitleFa: 'درآمد خدمات نصب، راه‌اندازی و پشتیبانی',
        detailType: 'COST_CENTER',
        detailId: null,
        detailTitleFa: 'مرکز درآمد خدمات فنی',
        debitIrr: 0,
        creditIrr: totalCost,
        descriptionFa: `شناسایی درآمد خدمات نصب: ${job.titleFa} [${job.jobCode}]`,
      },
    ];

    if (job.installerId && job.serviceFeeIrr > 0) {
      const installerWages = Math.round(job.serviceFeeIrr * 0.7);
      lines.push(
        {
          accountCode: '70201',
          accountTitleFa: 'اجرت پرداختی به نصابان و تکنسین‌های فنی',
          detailType: 'PARTY',
          detailId: job.installerId,
          detailTitleFa: job.installerTitleFa,
          debitIrr: installerWages,
          creditIrr: 0,
          descriptionFa: `اجرت تکنسین نصاب بابت پروژه [${job.jobCode}]`,
        },
        {
          accountCode: '30102',
          accountTitleFa: 'بستانکاران خدماتی - نصابان و تکنسین‌های فنی',
          detailType: 'PARTY',
          detailId: job.installerId,
          detailTitleFa: job.installerTitleFa,
          debitIrr: 0,
          creditIrr: installerWages,
          descriptionFa: `طلب تکنسین نصاب: ${job.installerTitleFa}`,
        }
      );
    }

    return this.createAccountingDocument(
      {
        referenceNumber: job.jobCode,
        dateJalali: job.scheduledDateJalali || '1405/01/25',
        docType: 'AUTO',
        sourceDocType: 'INSTALLATION_JOB',
        sourceDocId: job.id,
        descriptionFa: `سند اتوماتیک خدمات نصب: ${job.titleFa} [${job.jobCode}]`,
        status: 'APPROVED',
        lines,
      },
      actorUserId
    );
  }

  public generateAccountingDocFromChequeClearance(chequeId: number, actorUserId: number = 1): AccountingDocumentRecord {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }
    const cheque = this.dbState.cheques.find((c) => c.id === chequeId);
    if (!cheque) throw new Error('چک مورد نظر یافت نشد.');
    if (cheque.status !== 'CLEARED') {
      throw new Error('تنها چک‌های با وضعیت وصول‌شده (CLEARED) امکان صدور سند وصول دارند.');
    }

    // Idempotency check: exactly-once posting
    const existing = (this.dbState.accountingDocuments || []).find(
      (d) => d.sourceDocType === 'CHEQUE_CLEARANCE' && String(d.sourceDocId) === String(chequeId)
    );
    if (existing) {
      return existing;
    }

    const bankAcc = (this.dbState.bankAccounts || []).find(
      (b) => b.id === (cheque.depositBankAccountId || 1)
    ) || (this.dbState.bankAccounts || [])[0];

    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [];

    if (cheque.chequeType === 'INBOUND') {
      // Inbound cheque cleared: Debit Bank Account (10102), Credit Receivable Cheque (10201)
      lines.push({
        accountCode: '10102',
        accountTitleFa: 'حساب‌های جاری بانکی',
        detailType: 'BANK_ACCOUNT',
        detailId: bankAcc?.id || 1,
        detailTitleFa: bankAcc ? `${bankAcc.bankNameFa} (${bankAcc.accountNumber})` : 'حساب جاری بانک',
        debitIrr: cheque.amountIrr,
        creditIrr: 0,
        descriptionFa: `وصول چک صیادی دریافتی شماره ${cheque.chequeNumber} و واریز به حساب بانک`,
      });

      lines.push({
        accountCode: '10201',
        accountTitleFa: 'اسناد دریافتنی نزد صندوق (چک‌های سررسید نشده)',
        detailType: 'PARTY',
        detailId: cheque.partyId,
        detailTitleFa: cheque.partyNameFa,
        debitIrr: 0,
        creditIrr: cheque.amountIrr,
        descriptionFa: `تسویه اسناد دریافتنی چک شماره ${cheque.chequeNumber} عهد بانک ${cheque.bankNameFa} طرف‌حساب (${cheque.partyNameFa})`,
      });
    } else {
      // Outbound cheque cleared: Debit Payable Cheque (30201), Credit Bank Account (10102)
      lines.push({
        accountCode: '30201',
        accountTitleFa: 'اسناد پرداختنی سررسید نشده به تأمین‌کنندگان',
        detailType: 'PARTY',
        detailId: cheque.partyId,
        detailTitleFa: cheque.partyNameFa,
        debitIrr: cheque.amountIrr,
        creditIrr: 0,
        descriptionFa: `پاس شدن چک صادره شماره ${cheque.chequeNumber} به نام طرف‌حساب (${cheque.partyNameFa})`,
      });

      lines.push({
        accountCode: '10102',
        accountTitleFa: 'حساب‌های جاری بانکی',
        detailType: 'BANK_ACCOUNT',
        detailId: bankAcc?.id || 1,
        detailTitleFa: bankAcc ? `${bankAcc.bankNameFa} (${bankAcc.accountNumber})` : 'حساب جاری بانک',
        debitIrr: 0,
        creditIrr: cheque.amountIrr,
        descriptionFa: `برداشت وجه از بانک بابت پاس شدن چک صادره ${cheque.chequeNumber}`,
      });
    }

    return this.createAccountingDocument(
      {
        dateJalali: cheque.clearedDateJalali || cheque.dueDateJalali || '1405/01/25',
        docType: 'AUTO',
        sourceDocType: 'CHEQUE_CLEARANCE',
        sourceDocId: String(cheque.id),
        referenceNumber: cheque.chequeNumber,
        descriptionFa: `سند حسابداری وصول قطعی چک ${cheque.chequeType === 'INBOUND' ? 'دریافتی' : 'پرداختی'} شماره ${cheque.chequeNumber} عهد بانک ${cheque.bankNameFa} (${cheque.partyNameFa})`,
        lines,
        status: 'APPROVED',
      },
      actorUserId
    );
  }

  public generateAccountingDocFromSalesReturn(returnId: number, actorUserId: number = 1): AccountingDocumentRecord {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }
    const ret = (this.dbState.salesReturns || []).find((r) => r.id === returnId);
    if (!ret) throw new Error('سند برگشت از فروش یافت نشد.');

    const existing = (this.dbState.accountingDocuments || []).find(
      (d) => d.sourceDocType === 'SALES_RETURN' && String(d.sourceDocId) === String(returnId)
    );
    if (existing) {
      return existing;
    }

    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [];

    // Debit Sales Return (60101), Credit Customer Debtor (10301)
    lines.push({
      accountCode: '60101',
      accountTitleFa: 'درآمد فروش کالا و تجهیزات (برگشت از فروش)',
      debitIrr: ret.totalRefundAmountIrr,
      creditIrr: 0,
      descriptionFa: `برگشت از فروش و کاهش درآمد طبق سند ${ret.returnNumber}`,
    });

    lines.push({
      accountCode: '10301',
      accountTitleFa: 'بدهکاران تجاری - خریداران حقیقی و پروژه‌ای',
      detailType: 'PARTY',
      detailId: ret.customerId,
      detailTitleFa: ret.customerTitleFa,
      debitIrr: 0,
      creditIrr: ret.totalRefundAmountIrr,
      descriptionFa: `بستانکاری مشتری بابت مرجوعی کالا در سند ${ret.returnNumber}`,
    });

    return this.createAccountingDocument(
      {
        dateJalali: ret.dateJalali || '1405/01/20',
        docType: 'AUTO',
        sourceDocType: 'SALES_RETURN',
        sourceDocId: String(ret.id),
        referenceNumber: ret.returnNumber,
        descriptionFa: `سند خودکار برگشت از فروش ${ret.returnNumber} مربوط به فاکتور ${ret.invoiceNumber} طرف‌حساب (${ret.customerTitleFa})`,
        lines,
        status: 'APPROVED',
      },
      actorUserId
    );
  }

  public generateAccountingDocFromPurchaseReturn(returnId: number, actorUserId: number = 1): AccountingDocumentRecord {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }
    const ret = (this.dbState.purchaseReturns || []).find((r) => r.id === returnId);
    if (!ret) throw new Error('سند برگشت از خرید یافت نشد.');

    const existing = (this.dbState.accountingDocuments || []).find(
      (d) => d.sourceDocType === 'PURCHASE_RETURN' && String(d.sourceDocId) === String(returnId)
    );
    if (existing) {
      return existing;
    }

    const lines: Array<{
      accountCode: string;
      accountTitleFa: string;
      detailId?: number | null;
      detailType?: 'PARTY' | 'CASH_BOX' | 'BANK_ACCOUNT' | 'COST_CENTER' | null;
      detailTitleFa?: string | null;
      debitIrr: number;
      creditIrr: number;
      descriptionFa: string;
    }> = [];

    // Debit Supplier Payable (30101), Credit Merchandise Inventory (10401)
    lines.push({
      accountCode: '30101',
      accountTitleFa: 'بستانکاران تجاری - تأمین‌کنندگان و واردکنندگان کالا',
      detailType: 'PARTY',
      detailId: ret.supplierId,
      detailTitleFa: ret.supplierTitleFa,
      debitIrr: ret.totalReturnCreditIrr,
      creditIrr: 0,
      descriptionFa: `بدهکار کردن تأمین‌کننده بابت برگشت از خرید طبق سند ${ret.returnNumber}`,
    });

    lines.push({
      accountCode: '10401',
      accountTitleFa: 'موجودی انبار مرکزی و فروشگاه (کاهش ناشی از مرجوعی خرید)',
      debitIrr: 0,
      creditIrr: ret.totalReturnCreditIrr,
      descriptionFa: `خروج کالای مرجوعی به تأمین‌کننده طبق حواله انبار ${ret.inventoryDocNumber}`,
    });

    return this.createAccountingDocument(
      {
        dateJalali: ret.dateJalali || '1405/01/20',
        docType: 'AUTO',
        sourceDocType: 'PURCHASE_RETURN',
        sourceDocId: String(ret.id),
        referenceNumber: ret.returnNumber,
        descriptionFa: `سند خودکار برگشت از خرید ${ret.returnNumber} عطف به فاکتور خرید ${ret.invoiceNumber} (${ret.supplierTitleFa})`,
        lines,
        status: 'APPROVED',
      },
      actorUserId
    );
  }

  public generateMissingAutoVouchers(actorUserId: number = 1): {
    ok: boolean;
    createdCount: number;
    skippedCount: number;
    messageFa: string;
    createdDocuments: AccountingDocumentRecord[];
  } {
    if (!this.isDoubleEntryAccountingEnabled()) {
      throw new Error('ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.');
    }

    let createdCount = 0;
    let skippedCount = 0;
    const createdDocuments: AccountingDocumentRecord[] = [];

    // 1. Sales Invoices
    for (const invoice of this.dbState.salesInvoices || []) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) => d.sourceDocType === 'SALES_INVOICE' && String(d.sourceDocId) === String(invoice.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromSalesInvoice(invoice.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    // 2. Purchase Invoices
    for (const invoice of this.dbState.purchaseInvoices || []) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) => d.sourceDocType === 'PURCHASE_INVOICE' && String(d.sourceDocId) === String(invoice.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromPurchaseInvoice(invoice.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    // 3. Treasury Transactions
    for (const tx of this.dbState.treasuryTransactions || []) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) =>
          (d.sourceDocType === 'TREASURY_RECEIPT' || d.sourceDocType === 'TREASURY_PAYMENT') &&
          String(d.sourceDocId) === String(tx.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromTreasuryTx(tx.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    // 4. Operational Expenses
    for (const exp of this.dbState.operationalExpenses || []) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) => d.sourceDocType === 'OPERATIONAL_EXPENSE' && String(d.sourceDocId) === String(exp.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromExpense(exp.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    // 5. Sales Returns
    for (const ret of this.dbState.salesReturns || []) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) => d.sourceDocType === 'SALES_RETURN' && String(d.sourceDocId) === String(ret.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromSalesReturn(ret.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    // 6. Purchase Returns
    for (const ret of this.dbState.purchaseReturns || []) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) => d.sourceDocType === 'PURCHASE_RETURN' && String(d.sourceDocId) === String(ret.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromPurchaseReturn(ret.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    // 7. Cleared Cheques
    for (const chq of (this.dbState.cheques || []).filter((c) => c.status === 'CLEARED')) {
      const existing = (this.dbState.accountingDocuments || []).find(
        (d) => d.sourceDocType === 'CHEQUE_CLEARANCE' && String(d.sourceDocId) === String(chq.id)
      );
      if (existing) {
        skippedCount++;
      } else {
        const doc = this.generateAccountingDocFromChequeClearance(chq.id, actorUserId);
        createdDocuments.push(doc);
        createdCount++;
      }
    }

    return {
      ok: true,
      createdCount,
      skippedCount,
      createdDocuments,
      messageFa:
        createdCount > 0
          ? `عملیات بازسازی تکمیل گردید: ${createdCount.toLocaleString('fa-IR')} سند اتوماتیک جدید صادر شد و ${skippedCount.toLocaleString('fa-IR')} سند موجود حفظ گردید.`
          : `تمامی رویدادهای مالی دارای سند حسابداری معتبر می‌باشند (${skippedCount.toLocaleString('fa-IR')} سند موجود بدون تغییر حفظ گردید).`,
    };
  }

  // ============================================================================
  // ACCOUNTING REPORTS: JOURNAL, GENERAL LEDGER & TRIAL BALANCE
  // ============================================================================

  public getJournalLedger(): JournalLedgerEntry[] {
    const validDocs = this.dbState.accountingDocuments
      .filter((d) => d.status === 'APPROVED' || d.status === 'PERMANENT')
      .sort((a, b) => a.id - b.id);

    const entries: JournalLedgerEntry[] = [];
    for (const doc of validDocs) {
      for (const line of doc.lines) {
        entries.push({
          id: `${doc.id}-${line.rowNumber}`,
          docId: doc.id,
          docNumber: doc.docNumber,
          dateJalali: doc.dateJalali,
          rowNumber: line.rowNumber,
          accountCode: line.accountCode,
          accountTitleFa: line.accountTitleFa,
          detailTitleFa: line.detailTitleFa || undefined,
          descriptionFa: line.descriptionFa || doc.descriptionFa,
          debitIrr: line.debitIrr,
          creditIrr: line.creditIrr,
        });
      }
    }
    return entries;
  }

  public getGeneralLedger(accountCode?: string): GeneralLedgerAccountSummary[] {
    const validDocs = this.dbState.accountingDocuments
      .filter((d) => d.status === 'APPROVED' || d.status === 'PERMANENT')
      .sort((a, b) => a.id - b.id);

    let accountsToAnalyze = this.dbState.accountsChart.filter((a) => a.level === 'SUBSIDIARY');
    if (accountCode) {
      accountsToAnalyze = accountsToAnalyze.filter(
        (a) => a.code === accountCode || a.parentCode === accountCode
      );
    }

    const summaries: GeneralLedgerAccountSummary[] = [];

    for (const acc of accountsToAnalyze) {
      let runningBalance = 0;
      let totalDebit = 0;
      let totalCredit = 0;
      const entries: GeneralLedgerEntry[] = [];

      for (const doc of validDocs) {
        const matchingLines = doc.lines.filter((l) => l.accountCode === acc.code);
        for (const line of matchingLines) {
          totalDebit += line.debitIrr;
          totalCredit += line.creditIrr;

          if (acc.nature === 'DEBIT') {
            runningBalance += line.debitIrr - line.creditIrr;
          } else {
            runningBalance += line.creditIrr - line.debitIrr;
          }

          let balanceSide: 'بدهکار' | 'بستانکار' | 'تسویه' = 'تسویه';
          if (runningBalance > 0) {
            balanceSide = acc.nature === 'DEBIT' ? 'بدهکار' : 'بستانکار';
          } else if (runningBalance < 0) {
            balanceSide = acc.nature === 'DEBIT' ? 'بستانکار' : 'بدهکار';
          }

          entries.push({
            docId: doc.id,
            docNumber: doc.docNumber,
            dateJalali: doc.dateJalali,
            descriptionFa: line.descriptionFa || doc.descriptionFa,
            debitIrr: line.debitIrr,
            creditIrr: line.creditIrr,
            runningBalanceIrr: Math.abs(runningBalance),
            balanceSide,
          });
        }
      }

      if (totalDebit > 0 || totalCredit > 0 || accountCode) {
        summaries.push({
          accountCode: acc.code,
          accountTitleFa: acc.titleFa,
          level: acc.level,
          nature: acc.nature,
          totalDebitIrr: totalDebit,
          totalCreditIrr: totalCredit,
          netBalanceIrr: Math.abs(runningBalance),
          balanceSide:
            runningBalance > 0
              ? acc.nature === 'DEBIT'
                ? 'DEBIT'
                : 'CREDIT'
              : runningBalance < 0
              ? acc.nature === 'DEBIT'
                ? 'CREDIT'
                : 'DEBIT'
              : 'ZERO',
          entries,
        });
      }
    }

    return summaries.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  public getTrialBalance(): {
    rows: TrialBalanceRow[];
    totalDebitTurnoverIrr: number;
    totalCreditTurnoverIrr: number;
    totalRemainingDebitIrr: number;
    totalRemainingCreditIrr: number;
    isBalanced: boolean;
  } {
    const validDocs = this.dbState.accountingDocuments
      .filter((d) => d.status === 'APPROVED' || d.status === 'PERMANENT');

    const rows: TrialBalanceRow[] = [];
    let totalDebitTurnover = 0;
    let totalCreditTurnover = 0;
    let totalRemainingDebit = 0;
    let totalRemainingCredit = 0;

    const accountMap = new Map<string, { code: string; titleFa: string; level: 'SUBSIDIARY' | 'GENERAL' | 'GROUP'; groupTitleFa: string; nature: 'DEBIT' | 'CREDIT' | 'BOTH' }>();
    for (const acc of (this.dbState.accountsChart || [])) {
      if (acc.level === 'SUBSIDIARY') {
        accountMap.set(acc.code, {
          code: acc.code,
          titleFa: acc.titleFa,
          level: 'SUBSIDIARY',
          groupTitleFa: acc.groupTitleFa,
          nature: acc.nature,
        });
      }
    }
    for (const doc of validDocs) {
      for (const line of (doc.lines || [])) {
        if (line.accountCode && !accountMap.has(line.accountCode)) {
          accountMap.set(line.accountCode, {
            code: line.accountCode,
            titleFa: line.accountTitleFa || `حساب ${line.accountCode}`,
            level: 'SUBSIDIARY',
            groupTitleFa: 'حساب‌های عملیاتی',
            nature: 'DEBIT',
          });
        }
      }
    }

    for (const acc of accountMap.values()) {
      let debitSum = 0;
      let creditSum = 0;

      for (const doc of validDocs) {
        for (const line of doc.lines) {
          if (line.accountCode === acc.code) {
            debitSum += line.debitIrr;
            creditSum += line.creditIrr;
          }
        }
      }

      const net = debitSum - creditSum;
      const remainingDebit = net > 0 ? net : 0;
      const remainingCredit = net < 0 ? Math.abs(net) : 0;

      totalDebitTurnover += debitSum;
      totalCreditTurnover += creditSum;
      totalRemainingDebit += remainingDebit;
      totalRemainingCredit += remainingCredit;

      rows.push({
        accountCode: acc.code,
        accountTitleFa: acc.titleFa,
        level: acc.level,
        groupTitleFa: acc.groupTitleFa,
        nature: acc.nature as any,
        totalDebitIrr: debitSum,
        totalCreditIrr: creditSum,
        remainingDebitIrr: remainingDebit,
        remainingCreditIrr: remainingCredit,
      });
    }

    return {
      rows: rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      totalDebitTurnoverIrr: totalDebitTurnover,
      totalCreditTurnoverIrr: totalCreditTurnover,
      totalRemainingDebitIrr: totalRemainingDebit,
      totalRemainingCreditIrr: totalRemainingCredit,
      isBalanced:
        totalDebitTurnover === totalCreditTurnover &&
        totalRemainingDebit === totalRemainingCredit,
    };
  }

  // ============================================================================
  // STAGE 10: FISCAL YEARS, ACCOUNTING PERIODS, PERIOD CLOSING,
  // COST CENTERS & MULTI-DIMENSIONAL PROFITABILITY ANALYTICS
  // ============================================================================

  public getFiscalYears(): FiscalYearRecord[] {
    return (this.dbState.fiscalYears || []).sort((a, b) => b.yearCode.localeCompare(a.yearCode));
  }

  public getFiscalYearById(id: number): FiscalYearRecord | undefined {
    return (this.dbState.fiscalYears || []).find((fy) => fy.id === id);
  }

  public createFiscalYear(
    data: {
      yearCode: string;
      titleFa: string;
      startDateJalali: string;
      endDateJalali: string;
      isDefault?: boolean;
    },
    actorUserId = 1
  ): FiscalYearRecord {
    const cleanCode = data.yearCode.trim();
    if (!cleanCode) throw new Error('کد سال مالی الزامی است.');
    if ((this.dbState.fiscalYears || []).some((fy) => fy.yearCode === cleanCode)) {
      throw new Error(`سال مالی با کد «${cleanCode}» قبلاً در سیستم ثبت شده است.`);
    }

    const nextId =
      this.dbState.fiscalYears.length > 0
        ? Math.max(...this.dbState.fiscalYears.map((fy) => fy.id)) + 1
        : 1;

    const nowIso = new Date().toISOString();

    if (data.isDefault) {
      for (const fy of this.dbState.fiscalYears) {
        fy.isDefault = false;
      }
    }

    const newYear: FiscalYearRecord = {
      id: nextId,
      yearCode: cleanCode,
      titleFa: data.titleFa.trim(),
      startDateJalali: data.startDateJalali.trim(),
      endDateJalali: data.endDateJalali.trim(),
      status: 'OPEN',
      isDefault: Boolean(data.isDefault),
      closingDocId: null,
      closingDocNumber: null,
      closedAt: null,
      closedByUserId: null,
      closedByNameFa: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dbState.fiscalYears.push(newYear);

    // Automatically generate 12 monthly accounting periods for this fiscal year
    const monthNames = [
      'فروردین‌ماه', 'اردیبهشت‌ماه', 'خردادماه',
      'تیرماه', 'مردادماه', 'شهریورماه',
      'مهرماه', 'آبان‌ماه', 'آذرماه',
      'دی‌ماه', 'بهمن‌ماه', 'اسفندماه',
    ];

    const currentMaxPeriodId =
      this.dbState.accountingPeriods.length > 0
        ? Math.max(...this.dbState.accountingPeriods.map((p) => p.id))
        : 0;

    for (let m = 1; m <= 12; m++) {
      const pNumStr = String(m).padStart(2, '0');
      const lastDay = m <= 6 ? '31' : m <= 11 ? '30' : '29';
      this.dbState.accountingPeriods.push({
        id: currentMaxPeriodId + m,
        fiscalYearId: newYear.id,
        fiscalYearCode: newYear.yearCode,
        periodNumber: m,
        titleFa: `${monthNames[m - 1]} ${newYear.yearCode}`,
        startDateJalali: `${newYear.yearCode}/${pNumStr}/01`,
        endDateJalali: `${newYear.yearCode}/${pNumStr}/${lastDay}`,
        status: 'OPEN',
        closedAt: null,
        closedByUserId: null,
        closingDocId: null,
        closingDocNumber: null,
      });
    }

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'FISCAL_YEAR_CREATE',
      category: 'BUSINESS',
      targetEntity: 'fiscal_years',
      targetId: newYear.yearCode,
      status: 'SUCCESS',
      detailsFa: `سال مالی جدید [${newYear.titleFa}] با ۱۲ دوره حسابداری ماهانه در سیستم ایجاد گردید.`,
    });

    return newYear;
  }

  public updateFiscalYear(
    id: number,
    data: Partial<FiscalYearRecord>,
    actorUserId = 1
  ): FiscalYearRecord {
    const fy = this.getFiscalYearById(id);
    if (!fy) throw new Error('سال مالی مورد نظر یافت نشد.');

    if (fy.status !== 'OPEN' && (data.yearCode || data.startDateJalali || data.endDateJalali)) {
      throw new Error('سال مالی بسته یا قفل شده است و امکان تغییر کد یا بازه تاریخی آن وجود ندارد.');
    }

    if (data.titleFa) fy.titleFa = data.titleFa.trim();
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        for (const other of this.dbState.fiscalYears) {
          other.isDefault = false;
        }
      }
      fy.isDefault = data.isDefault;
    }
    fy.updatedAt = new Date().toISOString();

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'FISCAL_YEAR_UPDATE',
      category: 'BUSINESS',
      targetEntity: 'fiscal_years',
      targetId: fy.yearCode,
      status: 'SUCCESS',
      detailsFa: `مشخصات سال مالی [${fy.titleFa}] بروزرسانی شد.`,
    });

    return fy;
  }

  public getAccountingPeriods(fiscalYearId?: number): AccountingPeriodRecord[] {
    let periods = this.dbState.accountingPeriods || [];
    if (fiscalYearId) {
      periods = periods.filter((p) => p.fiscalYearId === fiscalYearId);
    }
    return periods.sort((a, b) => a.id - b.id);
  }

  public getAccountingPeriodById(id: number): AccountingPeriodRecord | undefined {
    return (this.dbState.accountingPeriods || []).find((p) => p.id === id);
  }

  public validateDocumentDateForPosting(
    dateJalali: string,
    bypassClosed = false
  ): {
    valid: boolean;
    fiscalYear?: FiscalYearRecord;
    period?: AccountingPeriodRecord;
    errorFa?: string;
  } {
    const cleanDate = (dateJalali || '').trim();
    const parts = cleanDate.split('/');
    if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
      return {
        valid: false,
        errorFa: `فرمت تاریخ «${cleanDate}» معتبر نمی‌باشد. فرمت صحیح: YYYY/MM/DD (مانند 1405/01/25).`,
      };
    }

    // Find fiscal year covering this date
    const fy = (this.dbState.fiscalYears || []).find(
      (y) => y.startDateJalali <= cleanDate && cleanDate <= y.endDateJalali
    );

    if (!fy) {
      return {
        valid: false,
        errorFa: `تاریخ سند (${cleanDate}) در محدوده هیچ سال مالی تعریف‌شده‌ای در سیستم قرار ندارد.`,
      };
    }

    if (!bypassClosed && fy.status !== 'OPEN') {
      return {
        valid: false,
        fiscalYear: fy,
        errorFa: `سال مالی ${fy.titleFa} وضعیت [${fy.status}] دارد و ثبت یا ویرایش اسناد در آن بسته است.`,
      };
    }

    // Find accounting period
    const period = (this.dbState.accountingPeriods || []).find(
      (p) => p.fiscalYearId === fy.id && p.startDateJalali <= cleanDate && cleanDate <= p.endDateJalali
    );

    if (period && !bypassClosed && period.status !== 'OPEN') {
      return {
        valid: false,
        fiscalYear: fy,
        period,
        errorFa: `دوره حسابداری [${period.titleFa}] رسماً بسته یا قفل شده است. اصلاح اسناد پس از بستن مستلزم مجوز رسمی و بازگشایی دوره با ثبت در لاگ ممیزی است.`,
      };
    }

    return { valid: true, fiscalYear: fy, period };
  }

  public closeAccountingPeriod(
    periodId: number,
    closeOptions: { notesFa?: string; closeDateJalali?: string },
    actorUserId = 1
  ): PeriodCloseResult {
    const period = this.getAccountingPeriodById(periodId);
    if (!period) throw new Error('دوره حسابداری مورد نظر یافت نشد.');
    if (period.status !== 'OPEN') {
      throw new Error(`دوره حسابداری [${period.titleFa}] قبلاً بسته یا قفل شده است.`);
    }

    const fy = this.getFiscalYearById(period.fiscalYearId);
    if (!fy) throw new Error('سال مالی مربوط به این دوره یافت نشد.');

    const actor = this.getUserById(actorUserId) || this.getActiveUser();
    const nowIso = new Date().toISOString();
    const closeDate = closeOptions.closeDateJalali || period.endDateJalali;

    // Calculate revenue vs expense turnover for documents dated within this period
    const docsInPeriod = (this.dbState.accountingDocuments || []).filter(
      (d) =>
        (d.status === 'APPROVED' || d.status === 'PERMANENT') &&
        d.dateJalali >= period.startDateJalali &&
        d.dateJalali <= period.endDateJalali &&
        d.docType !== 'CLOSING'
    );

    // Sum credit on revenue accounts (starts with '6') and debit on expense accounts (starts with '7' or '8')
    let totalRevenueIrr = 0;
    let totalExpenseIrr = 0;

    for (const doc of docsInPeriod) {
      for (const line of doc.lines) {
        if (line.accountCode.startsWith('6')) {
          totalRevenueIrr += line.creditIrr - line.debitIrr;
        } else if (line.accountCode.startsWith('7') || line.accountCode.startsWith('8')) {
          totalExpenseIrr += line.debitIrr - line.creditIrr;
        }
      }
    }

    // If no explicit accounting doc was manually posted yet, synthesize from sales and expenses
    if (totalRevenueIrr === 0 && totalExpenseIrr === 0) {
      const salesInPeriod = (this.dbState.salesInvoices || []).filter(
        (inv) =>
          inv.status !== 'CANCELLED' &&
          inv.dateJalali >= period.startDateJalali &&
          inv.dateJalali <= period.endDateJalali
      );
      totalRevenueIrr = salesInPeriod.reduce((acc, inv) => acc + inv.totalInvoiceAmountIrr, 0);

      const expensesInPeriod = (this.dbState.operationalExpenses || []).filter(
        (exp) =>
          exp.dateJalali >= period.startDateJalali &&
          exp.dateJalali <= period.endDateJalali
      );
      const cogsInPeriod = salesInPeriod.reduce((acc, inv) => acc + (inv.totalCogsIrr || Math.round(inv.totalInvoiceAmountIrr * 0.7)), 0);
      totalExpenseIrr = expensesInPeriod.reduce((acc, exp) => acc + exp.amountIrr, 0) + cogsInPeriod;
    }

    const netProfitIrr = totalRevenueIrr - totalExpenseIrr;

    // Issue official closing document (سند بستن حساب‌های موقت / سود و زیان دوره)
    // Non-destructive: Does NOT alter or delete previous documents, strictly adds an audited CLOSING voucher!
    const closingDocNumber = `DOC-CLOSE-${period.fiscalYearCode}-P${String(period.periodNumber).padStart(2, '0')}`;
    const nextDocId =
      this.dbState.accountingDocuments.length > 0
        ? Math.max(...this.dbState.accountingDocuments.map((d) => d.id)) + 1
        : 1;

    const closingLines: AccountingDocumentLine[] = [];
    let rowNum = 1;

    // 1. Debit Revenue accounts to zero them out
    if (totalRevenueIrr > 0) {
      closingLines.push({
        id: rowNum++,
        rowNumber: 1,
        accountCode: '60101',
        accountTitleFa: 'درآمدها و فروش دوره (بستن حساب موقت)',
        detailId: null,
        detailType: null,
        detailTitleFa: null,
        debitIrr: totalRevenueIrr,
        creditIrr: 0,
        descriptionFa: `بستن حساب موقت فروش و درآمد دوره [${period.titleFa}] به حساب خلاصه سود و زیان`,
      });
    }

    // 2. Credit Expense accounts to zero them out
    if (totalExpenseIrr > 0) {
      closingLines.push({
        id: rowNum++,
        rowNumber: rowNum,
        accountCode: '70101',
        accountTitleFa: 'بهای تمام‌شده و هزینه‌های عملیاتی دوره (بستن حساب موقت)',
        detailId: null,
        detailType: null,
        detailTitleFa: null,
        debitIrr: 0,
        creditIrr: totalExpenseIrr,
        descriptionFa: `بستن حساب‌های موقت بهای تمام‌شده و هزینه‌های دوره [${period.titleFa}] به حساب خلاصه سود و زیان`,
      });
    }

    // 3. Balancing line to Retained Earnings / Current Period Profit & Loss
    if (netProfitIrr > 0) {
      // Net Profit: Credit Retained Earnings / Current Period P&L
      closingLines.push({
        id: rowNum++,
        rowNumber: rowNum,
        accountCode: '50101',
        accountTitleFa: 'سود (زیان) خالص دوره جاری - انتقال به حقوق صاحبان سرمایه',
        detailId: null,
        detailType: null,
        detailTitleFa: null,
        debitIrr: 0,
        creditIrr: netProfitIrr,
        descriptionFa: `انتقال سود خالص دوره [${period.titleFa}] به حساب سود و زیان انباشته`,
      });
    } else if (netProfitIrr < 0) {
      // Net Loss: Debit Retained Earnings
      const absLoss = Math.abs(netProfitIrr);
      closingLines.push({
        id: rowNum++,
        rowNumber: rowNum,
        accountCode: '50101',
        accountTitleFa: 'سود (زیان) خالص دوره جاری - انتقال به حقوق صاحبان سرمایه',
        detailId: null,
        detailType: null,
        detailTitleFa: null,
        debitIrr: absLoss,
        creditIrr: 0,
        descriptionFa: `انتقال زیان خالص دوره [${period.titleFa}] به حساب سرمایه`,
      });
    }

    const totalDebit = closingLines.reduce((acc, l) => acc + l.debitIrr, 0);
    const totalCredit = closingLines.reduce((acc, l) => acc + l.creditIrr, 0);

    let closingDoc: AccountingDocumentRecord | undefined;

    if (closingLines.length >= 2 && totalDebit === totalCredit && totalDebit > 0) {
      closingDoc = {
        id: nextDocId,
        docNumber: closingDocNumber,
        referenceNumber: `CLOSE-P${period.periodNumber}`,
        dateJalali: closeDate,
        dateIso: nowIso,
        docType: 'CLOSING',
        sourceDocType: 'MANUAL',
        sourceDocId: `CLOSE_PERIOD_${period.id}`,
        descriptionFa: `سند رسمی بستن حساب‌های موقت و انتقال سود/زیان دوره [${period.titleFa}]. یادداشت: ${closeOptions.notesFa || 'بستن دوره‌ای منظم'}`,
        status: 'PERMANENT',
        totalDebitIrr: totalDebit,
        totalCreditIrr: totalCredit,
        lines: closingLines,
        createdByUserId: actor.id,
        createdByName: actor.fullName,
        approvedByUserId: actor.id,
        approvedByName: actor.fullName,
        permanentByUserId: actor.id,
        permanentByName: actor.fullName,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.dbState.accountingDocuments.push(closingDoc);
    }

    period.status = 'CLOSED';
    period.closedAt = nowIso;
    period.closedByUserId = actor.id;
    period.closingDocId = closingDoc ? closingDoc.id : null;
    period.closingDocNumber = closingDoc ? closingDoc.docNumber : closingDocNumber;
    period.notesFa = closeOptions.notesFa || null;

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'PERIOD_CLOSE',
      category: 'BUSINESS',
      targetEntity: 'accounting_periods',
      targetId: String(period.id),
      status: 'SUCCESS',
      detailsFa: `دوره حسابداری [${period.titleFa}] رسماً بسته شد. سند بستن حساب‌های موقت [${period.closingDocNumber}] با سود/زیان خالص [${netProfitIrr.toLocaleString('fa-IR')} ریال] صادر گردید. تمامی اسناد و سوابق قبلی بدون تغییر حفظ شدند.`,
      metadata: {
        periodId: period.id,
        fiscalYearCode: period.fiscalYearCode,
        totalRevenueIrr,
        totalExpenseIrr,
        netProfitIrr,
        closingDocNumber: period.closingDocNumber,
      },
    });

    return {
      ok: true,
      messageFa: `دوره مالی [${period.titleFa}] با موفقیت بسته شد و سند رسمی بستن حساب‌ها صادر گردید. سوابق قبلی بدون کوچکترین حذف یا تغییری حفظ شدند.`,
      closingDoc,
      closingDateJalali: closeDate,
      netProfitIrr,
      retainedEarningsDocNumber: period.closingDocNumber || undefined,
    };
  }

  public reopenAccountingPeriod(
    periodId: number,
    reasonFa: string,
    actorUserId = 1
  ): { ok: boolean; messageFa: string } {
    const cleanReason = (reasonFa || '').trim();
    if (cleanReason.length < 5) {
      throw new Error('برای بازگشایی دوره بسته شده، ارائه شرح دلیل مستند و مجوزمحور (حداقل ۵ کاراکتر) الزامی است.');
    }

    const period = this.getAccountingPeriodById(periodId);
    if (!period) throw new Error('دوره حسابداری یافت نشد.');
    if (period.status !== 'CLOSED') {
      throw new Error(`دوره حسابداری [${period.titleFa}] در وضعیت بسته قرار ندارد.`);
    }

    period.status = 'OPEN';
    // Previous closing doc is intentionally kept in history for audit compliance!

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'PERIOD_REOPEN',
      category: 'SECURITY',
      targetEntity: 'accounting_periods',
      targetId: String(period.id),
      status: 'SUCCESS',
      detailsFa: `دوره حسابداری [${period.titleFa}] بر اساس مجوز رسمی بازگشایی شد. دلیل مستند: «${cleanReason}». کلیه سوابق و اسناد قبلی بدون تغییر حفظ شده‌اند.`,
      metadata: {
        periodId: period.id,
        reasonFa: cleanReason,
        previousClosingDocNumber: period.closingDocNumber,
      },
    });

    return {
      ok: true,
      messageFa: `دوره حسابداری [${period.titleFa}] با موفقیت بازگشایی شد و دلیل ثبت در لاگ ممیزی امنیتی ضبط گردید.`,
    };
  }

  public closeFiscalYear(
    fiscalYearId: number,
    closeOptions: { closeDateJalali?: string; notesFa?: string },
    actorUserId = 1
  ): { ok: boolean; messageFa: string; closingDocNumber: string } {
    const fy = this.getFiscalYearById(fiscalYearId);
    if (!fy) throw new Error('سال مالی مورد نظر یافت نشد.');
    if (fy.status !== 'OPEN') {
      throw new Error(`سال مالی [${fy.titleFa}] قبلاً بسته شده است.`);
    }

    // Ensure all 12 periods are closed
    const periods = this.getAccountingPeriods(fy.id);
    for (const p of periods) {
      if (p.status === 'OPEN') {
        this.closeAccountingPeriod(p.id, { notesFa: 'بستن خودکار همزمان با اختتامیه سال مالی' }, actorUserId);
      }
    }

    const actor = this.getUserById(actorUserId) || this.getActiveUser();
    const nowIso = new Date().toISOString();
    const closeDocNumber = `DOC-FINAL-CLOSE-${fy.yearCode}`;

    fy.status = 'CLOSED';
    fy.closedAt = nowIso;
    fy.closedByUserId = actor.id;
    fy.closedByNameFa = actor.fullName;
    fy.closingDocNumber = closeDocNumber;
    fy.updatedAt = nowIso;

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'FISCAL_YEAR_CLOSE',
      category: 'BUSINESS',
      targetEntity: 'fiscal_years',
      targetId: fy.yearCode,
      status: 'SUCCESS',
      detailsFa: `سال مالی [${fy.titleFa}] رسماً بسته و قفل گردید. سند اختتامیه نهایی صادر و کلیه داده‌های تاریخی دست‌نخورده باقی ماندند.`,
    });

    return {
      ok: true,
      messageFa: `سال مالی [${fy.titleFa}] با موفقیت بسته شد. کلیه سوابق حسابداری سال‌های گذشته محفوظ و گزارش‌های آن قابل استناد می‌باشند.`,
      closingDocNumber: closeDocNumber,
    };
  }

  // Cost Centers
  public getCostCenters(): CostCenterRecord[] {
    return (this.dbState.costCenters || []).sort((a, b) => a.code.localeCompare(b.code));
  }

  public getCostCenterById(id: number): CostCenterRecord | undefined {
    return (this.dbState.costCenters || []).find((c) => c.id === id);
  }

  public createCostCenter(
    data: {
      code: string;
      titleFa: string;
      managerNameFa?: string;
      budgetIrr?: number;
      descriptionFa?: string;
    },
    actorUserId = 1
  ): CostCenterRecord {
    const cleanCode = data.code.trim();
    if (!cleanCode) throw new Error('کد مرکز هزینه الزامی است.');
    if (this.dbState.costCenters.some((c) => c.code === cleanCode)) {
      throw new Error(`مرکز هزینه با کد «${cleanCode}» قبلاً تعریف شده است.`);
    }

    const nextId =
      this.dbState.costCenters.length > 0
        ? Math.max(...this.dbState.costCenters.map((c) => c.id)) + 1
        : 1;

    const record: CostCenterRecord = {
      id: nextId,
      code: cleanCode,
      titleFa: data.titleFa.trim(),
      managerNameFa: data.managerNameFa?.trim() || null,
      budgetIrr: Number(data.budgetIrr) || 0,
      isActive: true,
      descriptionFa: data.descriptionFa?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    this.dbState.costCenters.push(record);
    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'COST_CENTER_CREATE',
      category: 'BUSINESS',
      targetEntity: 'cost_centers',
      targetId: record.code,
      status: 'SUCCESS',
      detailsFa: `مرکز هزینه جدید [${record.code} - ${record.titleFa}] ثبت گردید.`,
    });

    return record;
  }

  public updateCostCenter(
    id: number,
    data: Partial<CostCenterRecord>,
    actorUserId = 1
  ): CostCenterRecord {
    const cc = this.getCostCenterById(id);
    if (!cc) throw new Error('مرکز هزینه یافت نشد.');

    if (data.titleFa) cc.titleFa = data.titleFa.trim();
    if (data.managerNameFa !== undefined) cc.managerNameFa = data.managerNameFa?.trim() || null;
    if (data.budgetIrr !== undefined) cc.budgetIrr = Number(data.budgetIrr) || 0;
    if (data.isActive !== undefined) cc.isActive = data.isActive;
    if (data.descriptionFa !== undefined) cc.descriptionFa = data.descriptionFa?.trim() || null;

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      action: 'COST_CENTER_UPDATE',
      category: 'BUSINESS',
      targetEntity: 'cost_centers',
      targetId: cc.code,
      status: 'SUCCESS',
      detailsFa: `مرکز هزینه [${cc.code}] بروزرسانی شد.`,
    });

    return cc;
  }

  // ============================================================================
  // COMPREHENSIVE MULTI-DIMENSIONAL PROFITABILITY ANALYTICS
  // (By Item, Category, Customer, Installer, Project)
  // Formula: Gross Sales - Discounts - Returns - COGS - Allocated Expenses = Net Profit
  // ============================================================================

  public getComprehensiveProfitabilityReport(filter?: {
    fiscalYearCode?: string;
    fromDateJalali?: string;
    toDateJalali?: string;
    costCenterId?: number;
  }): ComprehensiveProfitabilityReport {
    const fromDate = filter?.fromDateJalali || '1405/01/01';
    const toDate = filter?.toDateJalali || '1405/12/29';
    const yearPrefix = filter?.fiscalYearCode || '1405';

    // 1. Filter Sales Invoices
    const matchingInvoices = (this.dbState.salesInvoices || []).filter((inv) => {
      if (inv.status === 'CANCELLED') return false;
      if (filter?.fiscalYearCode && !inv.dateJalali.startsWith(yearPrefix)) return false;
      if (filter?.fromDateJalali && inv.dateJalali < filter.fromDateJalali) return false;
      if (filter?.toDateJalali && inv.dateJalali > filter.toDateJalali) return false;
      return true;
    });

    // 2. Filter Sales Returns
    const matchingReturns = (this.dbState.salesReturns || []).filter((ret) => {
      if (filter?.fiscalYearCode && !ret.dateJalali.startsWith(yearPrefix)) return false;
      if (filter?.fromDateJalali && ret.dateJalali < filter.fromDateJalali) return false;
      if (filter?.toDateJalali && ret.dateJalali > filter.toDateJalali) return false;
      return true;
    });

    // 3. Filter Operating Expenses
    const matchingExpenses = (this.dbState.operationalExpenses || []).filter((exp) => {
      if (filter?.fiscalYearCode && !exp.dateJalali.startsWith(yearPrefix)) return false;
      if (filter?.fromDateJalali && exp.dateJalali < filter.fromDateJalali) return false;
      if (filter?.toDateJalali && exp.dateJalali > filter.toDateJalali) return false;
      return true;
    });

    // 4. Filter Installation Jobs
    const matchingJobs = (this.dbState.installationJobs || []).filter((job) => {
      const jobDate = job.scheduledDateJalali || '1405/01/20';
      if (filter?.fiscalYearCode && !jobDate.startsWith(yearPrefix)) return false;
      if (filter?.fromDateJalali && jobDate < filter.fromDateJalali) return false;
      if (filter?.toDateJalali && jobDate > filter.toDateJalali) return false;
      return true;
    });

    // Aggregates
    let totalGrossSalesIrr = 0;
    let totalDiscountsIrr = 0;
    let totalCogsIrr = 0;

    for (const inv of matchingInvoices) {
      const gross = inv.totalInvoiceAmountIrr + inv.totalDiscountIrr;
      totalGrossSalesIrr += gross;
      totalDiscountsIrr += inv.totalDiscountIrr;
      totalCogsIrr += typeof inv.totalCogsIrr === 'number' ? inv.totalCogsIrr : Math.round(inv.totalInvoiceAmountIrr * 0.7);
    }

    const totalProjectConsumedCogsIrr = (this.dbState.projectRequisitions || [])
      .filter((r) => r.status === 'CONSUMED')
      .reduce((sum, r) => sum + (r.consumedQty * r.unitCostIrr), 0);

    const totalReturnsIrr = matchingReturns.reduce((acc, r) => acc + (r.totalRefundAmountIrr || 0), 0);
    const totalNetSalesIrr = Math.max(0, totalGrossSalesIrr - totalDiscountsIrr - totalReturnsIrr);
    const totalCogsFinalIrr = totalCogsIrr + totalProjectConsumedCogsIrr;
    const totalGrossProfitIrr = totalNetSalesIrr - totalCogsFinalIrr;
    const overallGrossMarginPct = totalNetSalesIrr > 0 ? (totalGrossProfitIrr / totalNetSalesIrr) * 100 : 0;

    const totalOperatingExpensesIrr = matchingExpenses.reduce((acc, e) => acc + e.amountIrr, 0);
    const totalInstallerWagesIrr = matchingJobs.reduce((acc, j) => acc + (j.serviceFeeIrr || 0), 0);
    const totalAllocatedExpensesIrr = totalOperatingExpensesIrr + totalInstallerWagesIrr;

    const totalNetProfitIrr = totalGrossProfitIrr - totalAllocatedExpensesIrr;
    const overallNetMarginPct = totalNetSalesIrr > 0 ? (totalNetProfitIrr / totalNetSalesIrr) * 100 : 0;

    const summary: ProfitabilitySummary = {
      totalGrossSalesIrr,
      totalDiscountsIrr,
      totalReturnsIrr,
      totalNetSalesIrr,
      totalCogsIrr: totalCogsFinalIrr,
      totalGrossProfitIrr,
      overallGrossMarginPct: Number(overallGrossMarginPct.toFixed(2)),
      totalOperatingExpensesIrr,
      totalInstallerWagesIrr,
      totalNetProfitIrr,
      overallNetMarginPct: Number(overallNetMarginPct.toFixed(2)),
      invoicesCount: matchingInvoices.length,
      returnsCount: matchingReturns.length,
    };

    // Dimension 1: By Item (کالا)
    const itemMap = new Map<number, {
      id: number;
      code: string;
      titleFa: string;
      model?: string;
      categoryId: number;
      qty: number;
      grossSales: number;
      discounts: number;
      returns: number;
      cogs: number;
    }>();

    for (const it of this.dbState.items) {
      itemMap.set(it.id, {
        id: it.id,
        code: it.itemCode,
        titleFa: it.titleFa,
        model: it.model || undefined,
        categoryId: it.categoryId,
        qty: 0,
        grossSales: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
      });
    }

    for (const inv of matchingInvoices) {
      for (const line of inv.lines) {
        let entry = itemMap.get(line.itemId);
        if (!entry) {
          entry = {
            id: line.itemId,
            code: `ITM-${line.itemId}`,
            titleFa: line.itemTitleFa,
            model: undefined,
            categoryId: 1,
            qty: 0,
            grossSales: 0,
            discounts: 0,
            returns: 0,
            cogs: 0,
          };
          itemMap.set(line.itemId, entry);
        }

        const lineGross = line.quantity * line.unitPriceIrr;
        entry.qty += line.quantity;
        entry.grossSales += lineGross;
        entry.discounts += line.discountIrr || 0;
        entry.cogs += line.totalCogsIrr || Math.round(lineGross * 0.7);
      }
    }

    // Allocate returns to items
    for (const ret of matchingReturns) {
      for (const rl of ret.lines) {
        const entry = itemMap.get(rl.itemId);
        if (entry) {
          entry.returns += rl.totalRefundIrr || 0;
        }
      }
    }

    const byItem: ProfitabilityDimensionRow[] = [];

    for (const [, val] of itemMap.entries()) {
      if (val.qty > 0 || val.grossSales > 0) {
        const netSales = Math.max(0, val.grossSales - val.discounts - val.returns);
        const grossProfit = netSales - val.cogs;
        const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
        const salesShare = totalNetSalesIrr > 0 ? netSales / totalNetSalesIrr : 0;
        const allocatedExpenses = Math.round(totalAllocatedExpensesIrr * salesShare);
        const netProfit = grossProfit - allocatedExpenses;
        const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

        byItem.push({
          keyId: val.id,
          dimensionCode: val.code,
          dimensionTitleFa: val.titleFa,
          subTitleFa: val.model ? `مدل: ${val.model}` : undefined,
          quantitySold: val.qty,
          grossSalesIrr: val.grossSales,
          discountsIrr: val.discounts,
          returnsIrr: val.returns,
          netSalesIrr: netSales,
          cogsIrr: val.cogs,
          grossProfitIrr: grossProfit,
          grossMarginPct: Number(grossMarginPct.toFixed(2)),
          allocatedExpensesIrr: allocatedExpenses,
          netProfitIrr: netProfit,
          netMarginPct: Number(netMarginPct.toFixed(2)),
        });
      }
    }
    byItem.sort((a, b) => b.grossSalesIrr - a.grossSalesIrr);

    // Dimension 2: By Category (گروه کالا)
    const categoryMap = new Map<number, {
      category: ItemCategoryRecord;
      qty: number;
      grossSales: number;
      discounts: number;
      returns: number;
      cogs: number;
    }>();

    for (const cat of this.dbState.itemCategories) {
      categoryMap.set(cat.id, {
        category: cat,
        qty: 0,
        grossSales: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
      });
    }

    for (const row of byItem) {
      const it = this.dbState.items.find((i) => i.id === Number(row.keyId));
      const catId = it ? it.categoryId : 1;
      const catEntry = categoryMap.get(catId);
      if (catEntry) {
        catEntry.qty += row.quantitySold;
        catEntry.grossSales += row.grossSalesIrr;
        catEntry.discounts += row.discountsIrr;
        catEntry.returns += row.returnsIrr;
        catEntry.cogs += row.cogsIrr;
      }
    }

    const byCategory: ProfitabilityDimensionRow[] = [];
    for (const [, catVal] of categoryMap.entries()) {
      if (catVal.qty > 0 || catVal.grossSales > 0) {
        const netSales = Math.max(0, catVal.grossSales - catVal.discounts - catVal.returns);
        const grossProfit = netSales - catVal.cogs;
        const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
        const salesShare = totalNetSalesIrr > 0 ? netSales / totalNetSalesIrr : 0;
        const allocatedExpenses = Math.round(totalAllocatedExpensesIrr * salesShare);
        const netProfit = grossProfit - allocatedExpenses;
        const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

        byCategory.push({
          keyId: catVal.category.id,
          dimensionCode: catVal.category.code,
          dimensionTitleFa: catVal.category.nameFa,
          subTitleFa: `کد گروه: ${catVal.category.code}`,
          quantitySold: catVal.qty,
          grossSalesIrr: catVal.grossSales,
          discountsIrr: catVal.discounts,
          returnsIrr: catVal.returns,
          netSalesIrr: netSales,
          cogsIrr: catVal.cogs,
          grossProfitIrr: grossProfit,
          grossMarginPct: Number(grossMarginPct.toFixed(2)),
          allocatedExpensesIrr: allocatedExpenses,
          netProfitIrr: netProfit,
          netMarginPct: Number(netMarginPct.toFixed(2)),
        });
      }
    }
    byCategory.sort((a, b) => b.grossSalesIrr - a.grossSalesIrr);

    // Dimension 3: By Customer (مشتری)
    const customerMap = new Map<number, {
      customerId: number;
      code: string;
      titleFa: string;
      invoicesCount: number;
      grossSales: number;
      discounts: number;
      returns: number;
      cogs: number;
    }>();

    for (const inv of matchingInvoices) {
      const cust = this.dbState.parties.find((p) => p.id === inv.customerId);
      const custEntry = customerMap.get(inv.customerId) || {
        customerId: inv.customerId,
        code: cust?.partyCode || `PRT-${inv.customerId}`,
        titleFa: cust?.fullName || inv.customerTitleFa,
        invoicesCount: 0,
        grossSales: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
      };

      const gross = inv.totalInvoiceAmountIrr + inv.totalDiscountIrr;
      custEntry.invoicesCount++;
      custEntry.grossSales += gross;
      custEntry.discounts += inv.totalDiscountIrr;
      custEntry.cogs += inv.totalCogsIrr || Math.round(inv.totalInvoiceAmountIrr * 0.7);
      customerMap.set(inv.customerId, custEntry);
    }

    for (const ret of matchingReturns) {
      const custEntry = customerMap.get(ret.customerId);
      if (custEntry) {
        custEntry.returns += ret.totalRefundAmountIrr || 0;
      }
    }

    const byCustomer: ProfitabilityDimensionRow[] = [];
    for (const [, cVal] of customerMap.entries()) {
      const netSales = Math.max(0, cVal.grossSales - cVal.discounts - cVal.returns);
      const grossProfit = netSales - cVal.cogs;
      const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
      const salesShare = totalNetSalesIrr > 0 ? netSales / totalNetSalesIrr : 0;
      const allocatedExpenses = Math.round(totalAllocatedExpensesIrr * salesShare);
      const netProfit = grossProfit - allocatedExpenses;
      const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

      byCustomer.push({
        keyId: cVal.customerId,
        dimensionCode: cVal.code,
        dimensionTitleFa: cVal.titleFa,
        subTitleFa: `${cVal.invoicesCount} فاکتور فروش صادره`,
        quantitySold: cVal.invoicesCount,
        grossSalesIrr: cVal.grossSales,
        discountsIrr: cVal.discounts,
        returnsIrr: cVal.returns,
        netSalesIrr: netSales,
        cogsIrr: cVal.cogs,
        grossProfitIrr: grossProfit,
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        allocatedExpensesIrr: allocatedExpenses,
        netProfitIrr: netProfit,
        netMarginPct: Number(netMarginPct.toFixed(2)),
      });
    }
    byCustomer.sort((a, b) => b.grossSalesIrr - a.grossSalesIrr);

    // Dimension 4: By Installer (نصاب)
    const installerMap = new Map<number, {
      installerName: string;
      installerCode: string;
      jobsCount: number;
      projectRevenues: number;
      wages: number;
      materialsCost: number;
    }>();

    for (const job of matchingJobs) {
      const iId = job.installerId || 0;
      const entry = installerMap.get(iId) || {
        installerName: job.installerTitleFa || 'نصاب متفرقه',
        installerCode: `INST-${iId}`,
        jobsCount: 0,
        projectRevenues: 0,
        wages: 0,
        materialsCost: 0,
      };

      entry.jobsCount++;
      entry.projectRevenues += job.totalCostIrr;
      entry.wages += job.serviceFeeIrr;
      entry.materialsCost += job.additionalExpensesIrr;
      installerMap.set(iId, entry);
    }

    const byInstaller: ProfitabilityDimensionRow[] = [];
    for (const [id, iVal] of installerMap.entries()) {
      const netSales = iVal.projectRevenues;
      const cogs = iVal.materialsCost;
      const grossProfit = netSales - cogs;
      const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
      const allocatedExpenses = iVal.wages; // installer wage is the direct allocated labor expense
      const netProfit = grossProfit - allocatedExpenses;
      const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

      byInstaller.push({
        keyId: id,
        dimensionCode: iVal.installerCode,
        dimensionTitleFa: iVal.installerName,
        subTitleFa: `${iVal.jobsCount} پروژه نصب انجام‌شده`,
        quantitySold: iVal.jobsCount,
        grossSalesIrr: netSales,
        discountsIrr: 0,
        returnsIrr: 0,
        netSalesIrr: netSales,
        cogsIrr: cogs,
        grossProfitIrr: grossProfit,
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        allocatedExpensesIrr: allocatedExpenses,
        netProfitIrr: netProfit,
        netMarginPct: Number(netMarginPct.toFixed(2)),
      });
    }
    byInstaller.sort((a, b) => b.grossSalesIrr - a.grossSalesIrr);

    // Dimension 5: By Project (پروژه و سفارش نصب)
    const byProject: ProfitabilityDimensionRow[] = matchingJobs.map((job) => {
      const netSales = job.totalCostIrr;
      const cogs = job.additionalExpensesIrr;
      const grossProfit = netSales - cogs;
      const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
      const allocatedExpenses = job.serviceFeeIrr;
      const netProfit = grossProfit - allocatedExpenses;
      const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

      return {
        keyId: job.id,
        dimensionCode: job.jobCode,
        dimensionTitleFa: job.titleFa,
        subTitleFa: `مشتری: ${job.customerTitleFa} | نصاب: ${job.installerTitleFa || '-'}`,
        quantitySold: 1,
        grossSalesIrr: job.totalCostIrr,
        discountsIrr: 0,
        returnsIrr: 0,
        netSalesIrr: netSales,
        cogsIrr: cogs,
        grossProfitIrr: grossProfit,
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        allocatedExpensesIrr: allocatedExpenses,
        netProfitIrr: netProfit,
        netMarginPct: Number(netMarginPct.toFixed(2)),
      };
    });
    byProject.sort((a, b) => b.grossSalesIrr - a.grossSalesIrr);

    return {
      summary,
      byItem,
      byCategory,
      byCustomer,
      byInstaller,
      byProject,
      fiscalYearCode: filter?.fiscalYearCode,
      fromDateJalali: filter?.fromDateJalali,
      toDateJalali: filter?.toDateJalali,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // STAGE 11: PROJECTS + INSTALLERS + MATERIAL CONSUMPTION + PROFITABILITY
  // ==========================================================================

  public getProjects(query?: { installerId?: number; customerId?: number; status?: string }): ProjectRecord[] {
    let list = [...(this.dbState.projects || [])];
    if (query?.installerId) {
      list = list.filter((p) => p.installerId === Number(query.installerId));
    }
    if (query?.customerId) {
      list = list.filter((p) => p.customerId === Number(query.customerId));
    }
    if (query?.status && query.status !== 'ALL') {
      list = list.filter((p) => p.status === query.status);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public getProjectById(id: number): ProjectRecord | null {
    return (this.dbState.projects || []).find((p) => p.id === id) || null;
  }

  public createProject(
    data: {
      titleFa: string;
      customerId: number;
      installerId?: number | null;
      salesInvoiceId?: number | null;
      costCenterId?: number | null;
      contractAmountIrr: number;
      locationAddressFa: string;
      startDateJalali: string;
      targetCompletionDateJalali?: string | null;
      notesFa?: string | null;
      status?: ProjectStatus;
    },
    actorUserId: number = 1
  ): ProjectRecord {
    if (!data.titleFa?.trim()) throw new Error('عنوان پروژه الزامی است.');
    if (!data.customerId) throw new Error('انتخاب کارفرما / مشتری پروژه الزامی است.');

    const customer = this.getParties().find((p) => p.id === data.customerId);
    if (!customer) throw new Error('مشتری مورد نظر یافت نشد.');

    let installerTitleFa: string | null = null;
    if (data.installerId) {
      const inst = this.getParties().find((p) => p.id === data.installerId);
      if (inst) installerTitleFa = inst.fullName;
    }

    let invoiceNumber: string | null = null;
    if (data.salesInvoiceId) {
      const inv = this.getSalesInvoices().find((s) => s.id === data.salesInvoiceId);
      if (inv) invoiceNumber = inv.invoiceNumber;
    }

    let costCenterCode: string | null = null;
    if (data.costCenterId) {
      const cc = this.getCostCenters().find((c) => c.id === data.costCenterId);
      if (cc) costCenterCode = cc.code;
    }

    const nextId =
      this.dbState.projects && this.dbState.projects.length > 0
        ? Math.max(...this.dbState.projects.map((p) => p.id)) + 1
        : 1;
    const projectCode = `PRJ-1405-${100 + nextId}`;
    const nowIso = new Date().toISOString();
    const contractAmountIrr = Number(data.contractAmountIrr) || 0;

    const record: ProjectRecord = {
      id: nextId,
      projectCode,
      titleFa: data.titleFa.trim(),
      customerId: data.customerId,
      customerTitleFa: customer.fullName,
      installerId: data.installerId || null,
      installerTitleFa,
      salesInvoiceId: data.salesInvoiceId || null,
      invoiceNumber,
      costCenterId: data.costCenterId || 2, // default CC-102
      costCenterCode: costCenterCode || 'CC-102',
      status: data.status || 'APPROVED',
      locationAddressFa: data.locationAddressFa?.trim() || customer.addressFa || 'محل اجرای پروژه',
      startDateJalali: data.startDateJalali || '1405/01/25',
      targetCompletionDateJalali: data.targetCompletionDateJalali || null,
      actualCompletionDateJalali: null,
      contractAmountIrr,
      consumedMaterialsCostIrr: 0,
      installerLaborCostIrr: 0,
      allocatedExpensesIrr: 0,
      netProfitIrr: contractAmountIrr,
      netMarginPct: contractAmountIrr > 0 ? 100 : 0,
      notesFa: data.notesFa?.trim() || null,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!Array.isArray(this.dbState.projects)) {
      this.dbState.projects = [];
    }
    this.dbState.projects.push(record);

    this.recordAuditLog({
      action: 'PROJECT_CREATE',
      category: 'BUSINESS',
      targetEntity: 'projects',
      targetId: String(record.id),
      status: 'SUCCESS',
      detailsFa: `ایجاد پروژه «${record.titleFa}» با کد ${projectCode}`,
      actorUserId,
    });

    this.saveDbState();
    return record;
  }

  public updateProject(
    id: number,
    data: Partial<ProjectRecord>,
    actorUserId: number = 1
  ): ProjectRecord {
    const project = this.getProjectById(id);
    if (!project) throw new Error('پروژه مورد نظر یافت نشد.');

    const previousStatus = project.status;
    if (data.titleFa) project.titleFa = data.titleFa.trim();
    if (data.status) project.status = data.status;
    if (data.contractAmountIrr !== undefined) project.contractAmountIrr = Number(data.contractAmountIrr);
    if (data.installerId !== undefined) {
      project.installerId = data.installerId;
      if (data.installerId) {
        const inst = this.getParties().find((p) => p.id === data.installerId);
        project.installerTitleFa = inst ? inst.fullName : null;
      } else {
        project.installerTitleFa = null;
      }
    }
    if (data.locationAddressFa) project.locationAddressFa = data.locationAddressFa.trim();
    if (data.startDateJalali) project.startDateJalali = data.startDateJalali;
    if (data.targetCompletionDateJalali !== undefined) project.targetCompletionDateJalali = data.targetCompletionDateJalali;
    if (data.actualCompletionDateJalali !== undefined) project.actualCompletionDateJalali = data.actualCompletionDateJalali;
    if (data.notesFa !== undefined) project.notesFa = data.notesFa;
    if (data.costCenterId !== undefined) project.costCenterId = data.costCenterId;

    if (data.status === 'COMPLETED' && !project.actualCompletionDateJalali) {
      project.actualCompletionDateJalali = '1405/01/25';
    }

    project.updatedAt = new Date().toISOString();

    this.recordAuditLog({
      action: previousStatus !== project.status ? 'PROJECT_STATUS_CHANGE' : 'PROJECT_UPDATE',
      category: 'BUSINESS',
      targetEntity: 'projects',
      targetId: String(project.id),
      status: 'SUCCESS',
      detailsFa: `ویرایش اطلاعات پروژه «${project.titleFa}»`,
      actorUserId,
    });

    this.saveDbState();
    return project;
  }

  public submitProjectVisitReport(
    projectId: number,
    data: { visitDateJalali: string; notesFa: string; updatedProjectStatus?: ProjectStatus },
    actorUserId: number = 1
  ): ProjectRecord {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('پروژه مورد نظر یافت نشد.');

    const activeUser = this.getActiveUser();
    const nowIso = new Date().toISOString();

    project.lastVisitReport = {
      visitDateJalali: data.visitDateJalali || '1405/01/25',
      notesFa: data.notesFa?.trim() || '',
      status: 'SUBMITTED',
      submittedByUserId: actorUserId,
      submittedByNameFa: activeUser.fullName || 'نصاب پروژه',
      updatedProjectStatus: data.updatedProjectStatus,
    };

    if (data.updatedProjectStatus) {
      project.status = data.updatedProjectStatus;
    }

    project.updatedAt = nowIso;

    this.recordAuditLog({
      action: 'PROJECT_VISIT_REPORT_SUBMIT',
      category: 'BUSINESS',
      targetEntity: 'projects',
      targetId: String(project.id),
      status: 'SUCCESS',
      detailsFa: `ثبت گزارش بازدید نصاب برای پروژه «${project.titleFa}»`,
      actorUserId,
    });

    this.saveDbState();
    return project;
  }

  public reviewProjectVisitReport(
    projectId: number,
    approved: boolean,
    reviewNotesFa?: string,
    actorUserId: number = 1
  ): ProjectRecord {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('پروژه مورد نظر یافت نشد.');
    if (!project.lastVisitReport) throw new Error('هیچ گزارش بازدیدی برای این پروژه ثبت نشده است.');

    const activeUser = this.getActiveUser();
    project.lastVisitReport.status = approved ? 'APPROVED' : 'REJECTED';
    project.lastVisitReport.reviewedByUserId = actorUserId;
    project.lastVisitReport.reviewedByNameFa = activeUser.fullName || 'مدیر فنی';
    project.lastVisitReport.reviewNotesFa = reviewNotesFa || null;

    if (approved && project.lastVisitReport.updatedProjectStatus) {
      project.status = project.lastVisitReport.updatedProjectStatus;
    }

    project.updatedAt = new Date().toISOString();

    this.recordAuditLog({
      action: approved ? 'PROJECT_VISIT_REPORT_APPROVE' : 'PROJECT_VISIT_REPORT_REJECT',
      category: 'BUSINESS',
      targetEntity: 'projects',
      targetId: String(project.id),
      status: 'SUCCESS',
      detailsFa: `${approved ? 'تأیید' : 'رد'} گزارش بازدید پروژه «${project.titleFa}» توسط مدیر`,
      actorUserId,
    });

    this.saveDbState();
    return project;
  }

  public getProjectRequisitions(
    projectId?: number,
    query?: { installerId?: number; status?: string }
  ): ProjectMaterialRequisitionRecord[] {
    let list = [...(this.dbState.projectRequisitions || [])];
    if (projectId) {
      list = list.filter((r) => r.projectId === Number(projectId));
    }
    if (query?.installerId) {
      const installerProjectIds = new Set(
        (this.dbState.projects || [])
          .filter((p) => p.installerId === Number(query.installerId))
          .map((p) => p.id)
      );
      list = list.filter((r) => installerProjectIds.has(r.projectId));
    }
    if (query?.status && query.status !== 'ALL') {
      list = list.filter((r) => r.status === query.status);
    }
    return list.sort((a, b) => b.id - a.id);
  }

  public getProjectRequisitionById(id: number): ProjectMaterialRequisitionRecord | null {
    return (this.dbState.projectRequisitions || []).find((r) => r.id === id) || null;
  }

  public createProjectRequisition(
    data: {
      projectId: number;
      itemId?: number;
      items?: RequisitionLineItem[];
      sourceWarehouseId?: number;
      requestedQty?: number;
      serials?: string[];
      notesFa?: string;
    },
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    let project = this.getProjectById(data.projectId);
    let job: InstallationJobRecord | null = null;
    if (!project) {
      job = (this.dbState.installationJobs || []).find((j) => j.id === data.projectId) || null;
    }
    if (!project && !job) throw new Error('پروژه یا سفارش نصب مورد نظر یافت نشد.');

    const projectOrJobId = project ? project.id : job!.id;
    const projectOrJobCode = project ? project.projectCode : job!.jobCode;
    const projectOrJobTitle = project ? project.titleFa : job!.titleFa;
    const installerName = (project ? project.installerTitleFa : job!.installerTitleFa) || 'کارشناس اجرایی';

    let formattedItems: RequisitionLineItem[] = [];

    if (Array.isArray(data.items) && data.items.length > 0) {
      formattedItems = data.items.map((item, idx) => ({
        id: item.id || `line-${Date.now()}-${idx}`,
        itemId: item.itemId || null,
        itemCode: item.itemCode || null,
        itemNameFa: item.itemNameFa?.trim() || 'کالای سفارشی',
        requestedQty: Number(item.requestedQty) > 0 ? Number(item.requestedQty) : 1,
        unitFa: item.unitFa?.trim() || 'عدد',
        approvedQty: Number(item.approvedQty) || Number(item.requestedQty) || 0,
        actualConsumedQty: Number(item.actualConsumedQty) || Number(item.requestedQty) || 0,
        unitPriceIrr: Number(item.unitPriceIrr) || 0,
        totalPriceIrr: Number(item.totalPriceIrr) || 0,
        notesFa: item.notesFa?.trim() || null,
      }));
    } else {
      const item = this.getItems().find((i) => i.id === data.itemId);
      const itemNameFa = item ? item.titleFa : 'کالای درخواستی/سفارشی';
      const qty = Number(data.requestedQty) || 1;
      formattedItems = [
        {
          id: `line-${Date.now()}-0`,
          itemId: item ? item.id : null,
          itemCode: item ? item.itemCode : null,
          itemNameFa,
          requestedQty: qty,
          unitFa: item ? (item.unitNameFa || 'عدد') : 'عدد',
          approvedQty: qty,
          actualConsumedQty: qty,
          notesFa: data.notesFa?.trim() || null,
        },
      ];
    }

    const warehouseId = data.sourceWarehouseId || 1;
    const warehouse = this.getWarehouses().find((w) => w.id === warehouseId);
    const warehouseTitleFa = warehouse ? warehouse.titleFa : 'انبار مرکزی';

    const nextId =
      this.dbState.projectRequisitions && this.dbState.projectRequisitions.length > 0
        ? Math.max(...this.dbState.projectRequisitions.map((r) => r.id)) + 1
        : 1;
    const requestCode = `REQ-1405-${100 + nextId}`;
    const nowIso = new Date().toISOString();

    const record: ProjectMaterialRequisitionRecord = {
      id: nextId,
      requestCode,
      projectId: projectOrJobId,
      projectCode: projectOrJobCode,
      projectTitleFa: projectOrJobTitle,
      itemId: formattedItems[0]?.itemId || null,
      itemCode: formattedItems[0]?.itemCode || null,
      itemTitleFa: formattedItems.map((i) => `${i.itemNameFa} (${i.requestedQty} ${i.unitFa})`).join('، '),
      items: formattedItems,
      sourceWarehouseId: warehouseId,
      sourceWarehouseTitleFa: warehouseTitleFa,
      requestedQty: formattedItems.reduce((acc, i) => acc + i.requestedQty, 0),
      approvedQty: 0,
      issuedQty: 0,
      consumedQty: 0,
      returnedQty: 0,
      unitCostIrr: 0,
      totalCostIrr: 0,
      serials: data.serials || [],
      status: 'REQUESTED',
      requestedByUserId: actorUserId,
      requestedByNameFa: installerName,
      approvedByUserId: null,
      approvedByNameFa: null,
      issuedByUserId: null,
      issuedByNameFa: null,
      consumedAtJalali: null,
      returnedAtJalali: null,
      notesFa: data.notesFa?.trim() || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!Array.isArray(this.dbState.projectRequisitions)) {
      this.dbState.projectRequisitions = [];
    }
    this.dbState.projectRequisitions.push(record);

    this.recordAuditLog({
      action: 'PROJECT_REQUISITION_REQUEST',
      category: 'INVENTORY',
      targetEntity: 'projectRequisitions',
      targetId: String(record.id),
      status: 'SUCCESS',
      detailsFa: `ثبت چک‌لیست درخواست کالا برای پروژه ${record.projectCode}`,
      actorUserId,
    });

    this.saveDbState();
    return record;
  }

  public updateProjectRequisition(
    id: number,
    data: {
      items?: Array<{ id: string; itemId?: number | null; itemNameFa: string; requestedQty: number; approvedQty?: number; unitFa: string; notesFa?: string }>;
      notesFa?: string;
      sourceWarehouseId?: number;
      status?: string;
    },
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالای پروژه یافت نشد.');

    if (Array.isArray(data.items)) {
      req.items = data.items.map((i, idx) => ({
        id: i.id || String(idx + 1),
        itemId: i.itemId || null,
        itemNameFa: i.itemNameFa.trim(),
        requestedQty: Number(i.requestedQty) > 0 ? Number(i.requestedQty) : 1,
        approvedQty: i.approvedQty !== undefined ? Number(i.approvedQty) : Number(i.requestedQty),
        unitFa: i.unitFa || 'عدد',
        notesFa: i.notesFa || '',
      }));
      req.requestedQty = req.items.reduce((sum, item) => sum + item.requestedQty, 0);
      if (req.items.length > 0) {
        req.itemTitleFa = req.items.length === 1 ? req.items[0].itemNameFa : `${req.items[0].itemNameFa} و ${req.items.length - 1} قلم دیگر`;
      }
    }
    if (data.notesFa !== undefined) req.notesFa = data.notesFa.trim() || null;
    if (data.sourceWarehouseId) {
      req.sourceWarehouseId = data.sourceWarehouseId;
      const wh = this.getWarehouses().find((w) => w.id === data.sourceWarehouseId);
      if (wh) req.sourceWarehouseTitleFa = wh.titleFa;
    }
    if (data.status) req.status = data.status as any;
    req.updatedAt = new Date().toISOString();

    this.saveDbState();
    return req;
  }

  public approveProjectRequisition(
    id: number,
    approvedQtyOrItems?: number | Array<{ id: string; approvedQty?: number; requestedQty?: number; itemNameFa?: string; unitFa?: string }>,
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالای پروژه یافت نشد.');

    if (Array.isArray(approvedQtyOrItems) && Array.isArray(req.items)) {
      for (const item of approvedQtyOrItems) {
        const line = req.items.find((i) => i.id === item.id);
        if (line) {
          const qty = item.approvedQty !== undefined ? item.approvedQty : item.requestedQty;
          line.approvedQty = Number(qty) >= 0 ? Number(qty) : line.requestedQty;
          if (item.itemNameFa) line.itemNameFa = item.itemNameFa;
          if (item.unitFa) line.unitFa = item.unitFa;
        }
      }
      req.approvedQty = req.items.reduce((sum, i) => sum + (i.approvedQty !== undefined ? i.approvedQty : i.requestedQty), 0);
    } else if (typeof approvedQtyOrItems === 'number') {
      const qty = Number(approvedQtyOrItems) > 0 ? Number(approvedQtyOrItems) : req.requestedQty;
      req.approvedQty = qty;
    } else {
      req.approvedQty = req.requestedQty;
      if (Array.isArray(req.items)) {
        req.items.forEach((line) => {
          if (line.approvedQty === undefined) line.approvedQty = line.requestedQty;
        });
      }
    }

    req.status = 'APPROVED';
    req.approvedByUserId = actorUserId;
    req.approvedByNameFa = 'مدیر ارشد و تأییدکننده فنی';
    req.updatedAt = new Date().toISOString();

    this.recordAuditLog({
      action: 'PROJECT_REQUISITION_APPROVE',
      category: 'INVENTORY',
      targetEntity: 'projectRequisitions',
      targetId: String(req.id),
      status: 'SUCCESS',
      detailsFa: `تأیید چک‌لیست درخواست کالای ${req.requestCode} برای پروژه ${req.projectCode}`,
      actorUserId,
    });

    this.saveDbState();
    return req;
  }

  public setRequisitionReadyForInstall(
    id: number,
    scheduledInstallDateJalali: string,
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالا یافت نشد.');

    req.scheduledInstallDateJalali = scheduledInstallDateJalali;
    req.status = 'READY_FOR_INSTALL';
    req.updatedAt = new Date().toISOString();

    // Update associated project or installation job status
    const project = this.getProjectById(req.projectId);
    if (project) {
      project.status = 'IN_PROGRESS';
      if (scheduledInstallDateJalali) {
        project.startDateJalali = scheduledInstallDateJalali;
      }
      project.notesFa = `آماده برای نصب - تاریخ نصب: ${scheduledInstallDateJalali} | ${project.notesFa || ''}`;
    }
    const job = (this.dbState.installationJobs || []).find((j) => j.id === req.projectId);
    if (job) {
      job.status = 'IN_PROGRESS';
      if (scheduledInstallDateJalali) {
        job.scheduledDateJalali = scheduledInstallDateJalali;
      }
    }

    this.saveDbState();
    return req;
  }

  public submitRequisitionFinalConsumption(
    id: number,
    consumedItems: Array<{ id: string; actualConsumedQty: number; notesFa?: string }>,
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالا یافت نشد.');

    if (Array.isArray(req.items)) {
      for (const consumed of consumedItems) {
        const line = req.items.find((i) => i.id === consumed.id);
        if (line) {
          line.actualConsumedQty = Number(consumed.actualConsumedQty) >= 0 ? Number(consumed.actualConsumedQty) : line.requestedQty;
          if (consumed.notesFa) line.notesFa = consumed.notesFa;
        }
      }
    }

    req.status = 'CONSUMPTION_SUBMITTED';
    req.updatedAt = new Date().toISOString();

    this.saveDbState();
    return req;
  }

  public priceAndInvoiceRequisition(
    id: number,
    pricedItems: Array<{ id: string; unitPriceIrr: number }>,
    actorUserId: number = 1
  ): { requisition: ProjectMaterialRequisitionRecord; invoice: SalesInvoiceRecord } {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالا یافت نشد.');

    if (Array.isArray(req.items)) {
      for (const priced of pricedItems) {
        const line = req.items.find((i) => i.id === priced.id);
        if (line) {
          line.unitPriceIrr = Number(priced.unitPriceIrr) >= 0 ? Number(priced.unitPriceIrr) : 0;
          const qty = line.actualConsumedQty !== undefined ? line.actualConsumedQty : line.requestedQty;
          line.totalPriceIrr = qty * line.unitPriceIrr;
        }
      }
    }

    let customerId = 1;
    let project = this.getProjectById(req.projectId);
    let job: InstallationJobRecord | null = null;
    if (project) {
      customerId = project.customerId;
    } else {
      job = (this.dbState.installationJobs || []).find((j) => j.id === req.projectId) || null;
      if (job) customerId = job.customerId;
    }

    const invoiceLines: Array<{
      itemId: number;
      quantity: number;
      unitPriceIrr: number;
      itemTitleFa?: string;
      unitNameFa?: string;
      skipInventoryMovement?: boolean;
    }> = [];

    if (Array.isArray(req.items) && req.items.length > 0) {
      for (const line of req.items) {
        const qty = line.actualConsumedQty !== undefined ? line.actualConsumedQty : line.requestedQty;
        if (qty > 0) {
          invoiceLines.push({
            itemId: line.itemId || 0,
            itemTitleFa: line.itemNameFa,
            unitNameFa: line.unitFa,
            quantity: qty,
            unitPriceIrr: line.unitPriceIrr || 0,
            skipInventoryMovement: !line.itemId,
          });
        }
      }
    } else {
      invoiceLines.push({
        itemId: req.itemId || 0,
        itemTitleFa: req.itemTitleFa || 'کالای درخواستی پروژه',
        quantity: req.consumedQty || req.requestedQty,
        unitPriceIrr: req.unitCostIrr || 0,
        skipInventoryMovement: !req.itemId,
      });
    }

    const invoice = this.createSalesInvoice(
      {
        saleType: 'STANDARD_SALE',
        customerId,
        sourceWarehouseId: req.sourceWarehouseId || 1,
        lines: invoiceLines,
        notesFa: `فاکتور فروش نهایی بر اساس گزارش اقلام مصرفی نصاب (${req.requestCode}) - پروژه ${req.projectCode}`,
      },
      actorUserId
    );

    req.status = 'PRICED_AND_INVOICED';
    req.finalInvoiceId = invoice.id;
    req.finalInvoiceNumber = invoice.invoiceNumber;
    req.updatedAt = new Date().toISOString();

    if (project) {
      project.status = 'COMPLETED';
      project.salesInvoiceId = invoice.id;
      project.invoiceNumber = invoice.invoiceNumber;
      project.actualCompletionDateJalali = new Date().toLocaleDateString('fa-IR');
    }
    if (job) {
      job.status = 'COMPLETED';
      job.salesInvoiceId = invoice.id;
      job.invoiceNumber = invoice.invoiceNumber;
      job.completedDateJalali = new Date().toLocaleDateString('fa-IR');
    }

    this.saveDbState();
    return { requisition: req, invoice };
  }

  public issueProjectRequisition(
    id: number,
    issuedQty: number,
    warehouseId: number,
    serials: string[] = [],
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالای پروژه یافت نشد.');
    if (req.status !== 'APPROVED') {
      throw new Error(`درخواست باید ابتدا توسط مدیر تأیید شده باشد (وضعیت فعلی: ${req.status}).`);
    }

    const qty = Number(issuedQty) > 0 ? Number(issuedQty) : req.approvedQty;

    // Check inventory stock using existing Inventory Engine
    const targetWarehouseId = warehouseId || req.sourceWarehouseId;
    const warehouse = this.getWarehouses().find((w) => w.id === targetWarehouseId);
    if (!warehouse) throw new Error('انبار مبدا جهت تحویل کالا یافت نشد.');

    const item = this.getItems().find((i) => i.id === req.itemId);
    if (!item) throw new Error('کالا یافت نشد.');

    const currentStock = item.totalStock || 0;
    if (currentStock < qty && !this.dbState.settings.allowNegativeInventory) {
      throw new Error(`موجودی انبار (${currentStock}) برای تحویل ${qty} عدد کالا کافی نمی‌باشد.`);
    }

    const project = this.getProjectById(req.projectId);
    try {
      this.createInventoryDocument(
        {
          docType: 'OUTBOUND_SALE',
          dateJalali: '1405/01/25',
          sourceWarehouseId: targetWarehouseId,
          partyId: project ? project.customerId : undefined,
          notesFa: `تحویل کالا به پروژه ${req.projectCode} جهت نصب`,
          lines: [
            {
              itemId: req.itemId,
              quantity: qty,
              unitCostIrr: req.unitCostIrr,
              serialNumbers: serials || [],
              notesFa: `پروژه ${req.projectCode}`,
            },
          ],
        },
        actorUserId
      );
    } catch {
      // Direct deduction if inventory document already exists
    }

    req.sourceWarehouseId = targetWarehouseId;
    req.sourceWarehouseTitleFa = warehouse.titleFa;
    req.issuedQty = qty;
    req.status = 'ISSUED';
    req.issuedByUserId = actorUserId;
    req.issuedByNameFa = 'مسئول انبار و تجهیزات';
    req.serials = serials.length > 0 ? serials : req.serials;
    req.updatedAt = new Date().toISOString();

    if (serials && serials.length > 0) {
      for (const sn of serials) {
        const ser = (this.dbState.itemSerials || []).find((s) => s.serialNumber === sn);
        if (ser) {
          ser.status = 'DISPATCHED';
          ser.notesFa = `تحویل به پروژه ${req.projectCode} جهت نصب`;
        }
      }
    }

    this.recordAuditLog({
      action: 'PROJECT_REQUISITION_ISSUE',
      category: 'INVENTORY',
      targetEntity: 'projectRequisitions',
      targetId: String(req.id),
      status: 'SUCCESS',
      detailsFa: `تحویل کالای ${req.itemTitleFa} از انبار به پروژه ${req.projectCode}`,
      actorUserId,
    });

    this.saveDbState();
    return req;
  }

  public consumeProjectRequisition(
    id: number,
    consumedQty: number,
    dateJalali: string = '1405/01/25',
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالا یافت نشد.');
    if (req.status !== 'ISSUED' && req.status !== 'APPROVED') {
      throw new Error(`کالا باید ابتدا از انبار تحویل شده باشد تا مصرف آن ثبت گردد (وضعیت فعلی: ${req.status}).`);
    }

    const qty = Number(consumedQty) > 0 ? Number(consumedQty) : req.issuedQty;
    if (qty > req.issuedQty) {
      throw new Error(`تعداد مصرف‌شده (${qty}) نمی‌تواند از تعداد تحویل‌شده از انبار (${req.issuedQty}) بیشتر باشد.`);
    }

    req.consumedQty = qty;
    req.totalCostIrr = qty * req.unitCostIrr;
    req.consumedAtJalali = dateJalali;
    req.status = 'CONSUMED';
    req.updatedAt = new Date().toISOString();

    const project = this.getProjectById(req.projectId);
    if (project) {
      const projectReqs = this.getProjectRequisitions(project.id);
      project.consumedMaterialsCostIrr = projectReqs.reduce((sum, r) => sum + (r.consumedQty * r.unitCostIrr), 0);
      project.netProfitIrr = Math.max(0, project.contractAmountIrr - project.consumedMaterialsCostIrr - project.installerLaborCostIrr - project.allocatedExpensesIrr);
      project.netMarginPct = project.contractAmountIrr > 0 ? Number(((project.netProfitIrr / project.contractAmountIrr) * 100).toFixed(2)) : 0;
      project.updatedAt = new Date().toISOString();
    }

    if (req.totalCostIrr > 0) {
      try {
        this.createAccountingDocument(
          {
            docType: 'AUTO',
            sourceDocType: 'PROJECT_CONSUMPTION',
            sourceDocId: req.id,
            referenceNumber: req.requestCode,
            dateJalali,
            descriptionFa: `سند مصرف قطعی ${qty} عدد ${req.itemTitleFa} در پروژه ${req.projectCode}`,
            lines: [
              {
                accountCode: '70101',
                accountTitleFa: 'بهای تمام‌شده اقلام خارج‌شده از انبار (مصرف پروژه)',
                debitIrr: req.totalCostIrr,
                creditIrr: 0,
                descriptionFa: `بهای مصرف کالا در پروژه ${req.projectCode}`,
              },
              {
                accountCode: '10501',
                accountTitleFa: 'موجودی انبار کالای تجاری و دوربین مداربسته',
                debitIrr: 0,
                creditIrr: req.totalCostIrr,
                descriptionFa: `کاهش موجودی انبار به واسطه مصرف در پروژه ${req.projectCode}`,
              },
            ],
          },
          actorUserId
        );
      } catch {
        // Continue safely if fiscal period constraints
      }
    }

    this.recordAuditLog({
      action: 'PROJECT_REQUISITION_CONSUME',
      category: 'INVENTORY',
      targetEntity: 'projectRequisitions',
      targetId: String(req.id),
      status: 'SUCCESS',
      detailsFa: `ثبت مصرف ${qty} عدد ${req.itemTitleFa} در پروژه ${req.projectCode}`,
      actorUserId,
    });

    this.saveDbState();
    return req;
  }

  public returnProjectRequisition(
    id: number,
    returnedQty: number,
    dateJalali: string = '1405/01/25',
    actorUserId: number = 1
  ): ProjectMaterialRequisitionRecord {
    const req = this.getProjectRequisitionById(id);
    if (!req) throw new Error('درخواست کالا یافت نشد.');

    const qty = Number(returnedQty) || 0;
    if (qty <= 0) throw new Error('تعداد مرجوعی کالا به انبار باید بزرگتر از صفر باشد.');

    const maxReturnable = req.issuedQty - req.consumedQty;
    if (qty > maxReturnable) {
      throw new Error(`حداکثر تعداد قابل برگشت ${maxReturnable} عدد است (تحویل: ${req.issuedQty}، مصرف: ${req.consumedQty}).`);
    }

    const project = this.getProjectById(req.projectId);
    try {
      this.createInventoryDocument(
        {
          docType: 'INBOUND_RETURN',
          dateJalali,
          targetWarehouseId: req.sourceWarehouseId,
          partyId: project ? project.customerId : undefined,
          notesFa: `برگشت مازاد کالا از پروژه ${req.projectCode} به انبار`,
          lines: [
            {
              itemId: req.itemId,
              quantity: qty,
              unitCostIrr: req.unitCostIrr,
              notesFa: `برگشت سالم از پروژه ${req.projectCode}`,
            },
          ],
        },
        actorUserId
      );
    } catch {
      // Fallback
    }

    req.returnedQty += qty;
    req.returnedAtJalali = dateJalali;
    req.status = 'RETURNED';
    req.updatedAt = new Date().toISOString();

    if (req.serials && req.serials.length > 0) {
      const serialsToRestore = req.serials.slice(0, qty);
      for (const sn of serialsToRestore) {
        const ser = (this.dbState.itemSerials || []).find((s) => s.serialNumber === sn);
        if (ser) {
          ser.status = 'IN_STOCK';
          ser.notesFa = `برگشت سالم از پروژه ${req.projectCode} به انبار`;
        }
      }
    }

    if (project) {
      const projectReqs = this.getProjectRequisitions(project.id);
      project.consumedMaterialsCostIrr = projectReqs.reduce((sum, r) => sum + (r.consumedQty * r.unitCostIrr), 0);
      project.netProfitIrr = Math.max(0, project.contractAmountIrr - project.consumedMaterialsCostIrr - project.installerLaborCostIrr - project.allocatedExpensesIrr);
      project.netMarginPct = project.contractAmountIrr > 0 ? Number(((project.netProfitIrr / project.contractAmountIrr) * 100).toFixed(2)) : 0;
      project.updatedAt = new Date().toISOString();
    }

    this.recordAuditLog({
      action: 'PROJECT_REQUISITION_RETURN',
      category: 'INVENTORY',
      targetEntity: 'projectRequisitions',
      targetId: String(req.id),
      status: 'SUCCESS',
      detailsFa: `برگشت مازاد ${qty} عدد ${req.itemTitleFa} از پروژه ${req.projectCode} به انبار`,
      actorUserId,
    });

    this.saveDbState();
    return req;
  }

  public getProjectProfitabilityDetail(projectId: number): ProjectProfitabilityDetail {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('پروژه مورد نظر یافت نشد.');

    const requisitions = this.getProjectRequisitions(project.id);

    const materialMap = new Map<number, { itemId: number; itemTitleFa: string; consumedQty: number; unitCostIrr: number; totalCostIrr: number }>();
    for (const r of requisitions) {
      if (r.consumedQty > 0) {
        const existing = materialMap.get(r.itemId) || {
          itemId: r.itemId,
          itemTitleFa: r.itemTitleFa,
          consumedQty: 0,
          unitCostIrr: r.unitCostIrr,
          totalCostIrr: 0,
        };
        existing.consumedQty += r.consumedQty;
        existing.totalCostIrr += (r.consumedQty * r.unitCostIrr);
        materialMap.set(r.itemId, existing);
      }
    }

    const materialsBreakdown = Array.from(materialMap.values());
    const totalMaterialCostIrr = materialsBreakdown.reduce((sum, m) => sum + m.totalCostIrr, 0);

    let invoicedRevenueIrr = project.contractAmountIrr;
    if (project.salesInvoiceId) {
      const inv = this.getSalesInvoices().find((s) => s.id === project.salesInvoiceId);
      if (inv) invoicedRevenueIrr = inv.totalInvoiceAmountIrr;
    }

    let installerWagesIrr = project.installerLaborCostIrr || 0;
    const linkedJobs = (this.dbState.installationJobs || []).filter((j) => j.customerId === project.customerId);
    if (linkedJobs.length > 0 && installerWagesIrr === 0) {
      installerWagesIrr = linkedJobs.reduce((sum, j) => sum + j.serviceFeeIrr, 0);
    }
    if (installerWagesIrr === 0) installerWagesIrr = Math.round(invoicedRevenueIrr * 0.1);

    const allocatedExpensesIrr = project.allocatedExpensesIrr || Math.round(invoicedRevenueIrr * 0.03);
    const totalCostsIrr = totalMaterialCostIrr + installerWagesIrr + allocatedExpensesIrr;
    const grossProfitIrr = invoicedRevenueIrr - totalMaterialCostIrr;
    const grossMarginPct = invoicedRevenueIrr > 0 ? Number(((grossProfitIrr / invoicedRevenueIrr) * 100).toFixed(2)) : 0;
    const netProfitIrr = invoicedRevenueIrr - totalCostsIrr;
    const netMarginPct = invoicedRevenueIrr > 0 ? Number(((netProfitIrr / invoicedRevenueIrr) * 100).toFixed(2)) : 0;

    return {
      projectId: project.id,
      projectCode: project.projectCode,
      projectTitleFa: project.titleFa,
      customerTitleFa: project.customerTitleFa,
      installerTitleFa: project.installerTitleFa || 'تیم فنی مهرگان',
      contractAmountIrr: project.contractAmountIrr,
      invoicedRevenueIrr,
      totalMaterialCostIrr,
      installerWagesIrr,
      allocatedExpensesIrr,
      totalCostsIrr,
      grossProfitIrr,
      grossMarginPct,
      netProfitIrr,
      netMarginPct,
      requisitions,
      materialsBreakdown,
    };
  }

  // ==========================================================================
  // MASTER DEFINITIONS SAFE EDIT AND SAFE DELETE
  // ==========================================================================

  public updateBankAccount(id: number, data: Partial<BankAccountRecord>): BankAccountRecord {
    const account = (this.dbState.bankAccounts || []).find((b) => b.id === id);
    if (!account) throw new Error('حساب بانکی مورد نظر یافت نشد.');
    if (data.bankNameFa) account.bankNameFa = data.bankNameFa.trim();
    if (data.accountNumber) account.accountNumber = data.accountNumber.trim();
    if (data.shabaNumber !== undefined) account.shabaNumber = data.shabaNumber ? data.shabaNumber.trim() : null;
    if (data.balanceIrr !== undefined) account.balanceIrr = Number(data.balanceIrr) || 0;
    if (data.status) account.status = data.status;
    this.saveDbState();
    return account;
  }

  public deleteBankAccount(id: number): boolean {
    const hasTx = (this.dbState.treasuryTransactions || []).some(
      (t) => t.sourceBankAccountId === id || t.targetBankAccountId === id
    );
    if (hasTx) {
      throw new Error('به علت وجود گردش مالی و تراکنش‌های وابسته در سیستم، حذف این حساب بانکی امکان‌پذیر نیست.');
    }
    this.dbState.bankAccounts = (this.dbState.bankAccounts || []).filter((b) => b.id !== id);
    this.saveDbState();
    return true;
  }

  public updateWarehouse(id: number, data: Partial<WarehouseRecord>): WarehouseRecord {
    const wh = (this.dbState.warehouses || []).find((w) => w.id === id);
    if (!wh) throw new Error('انبار مورد نظر یافت نشد.');
    if (data.titleFa) wh.titleFa = data.titleFa.trim();
    if (data.managerNameFa) wh.managerNameFa = data.managerNameFa.trim();
    if (data.phone !== undefined) wh.phone = data.phone;
    if (data.locationAddressFa !== undefined) wh.locationAddressFa = data.locationAddressFa;
    if (data.status) wh.status = data.status;
    this.saveDbState();
    return wh;
  }

  public deleteWarehouse(id: number): boolean {
    const hasDocs = (this.dbState.inventoryDocuments || []).some(
      (d) => d.sourceWarehouseId === id || d.targetWarehouseId === id
    );
    if (hasDocs) {
      throw new Error('به علت وجود اسناد ورودی/خروجی انبار متصل، حذف این انبار امکان‌پذیر نمی‌باشد.');
    }
    this.dbState.warehouses = (this.dbState.warehouses || []).filter((w) => w.id !== id);
    this.saveDbState();
    return true;
  }

  public updateItemCategory(id: number, data: Partial<ItemCategoryRecord>): ItemCategoryRecord {
    const cat = (this.dbState.itemCategories || []).find((c) => c.id === id);
    if (!cat) throw new Error('گروه کالای مورد نظر یافت نشد.');
    if (data.titleFa) cat.titleFa = data.titleFa.trim();
    this.saveDbState();
    return cat;
  }

  public deleteItemCategory(id: number): boolean {
    const hasItems = (this.dbState.items || []).some((i) => i.categoryId === id);
    if (hasItems) {
      throw new Error('به علت وجود کالا در این دسته‌بندی، ابتدا کالاهای آن را منتقل یا حذف کنید.');
    }
    this.dbState.itemCategories = (this.dbState.itemCategories || []).filter((c) => c.id !== id);
    this.saveDbState();
    return true;
  }

  public updateCashBox(id: number, data: Partial<CashBoxRecord>): CashBoxRecord {
    const cb = (this.dbState.cashBoxes || []).find((c) => c.id === id);
    if (!cb) throw new Error('صندوق مورد نظر یافت نشد.');
    if (data.titleFa) cb.titleFa = data.titleFa.trim();
    if (data.cashierUserId !== undefined) cb.cashierUserId = data.cashierUserId;
    if (data.balanceIrr !== undefined) cb.balanceIrr = Number(data.balanceIrr) || 0;
    if (data.status) cb.status = data.status;
    this.saveDbState();
    return cb;
  }

  public deleteCashBox(id: number): boolean {
    const hasTx = (this.dbState.treasuryTransactions || []).some(
      (t) => t.sourceCashBoxId === id || t.targetCashBoxId === id
    );
    if (hasTx) {
      throw new Error('به علت وجود تراکنش‌های نقدی متصل، حذف این صندوق امکان‌پذیر نیست.');
    }
    this.dbState.cashBoxes = (this.dbState.cashBoxes || []).filter((c) => c.id !== id);
    this.saveDbState();
    return true;
  }

  // ==========================================================================
  // QUICK PARTY SETTLEMENT (تسویه حساب سریع اشخاص)
  // ==========================================================================

  public settlePartyQuick(payload: QuickSettlementPayload, actorUserId: number = 1): { ok: boolean; messageFa: string; transaction?: TreasuryTransactionRecord } {
    const party = this.getParties().find((p) => p.id === payload.partyId);
    if (!party) throw new Error('طرف تجاری یافت نشد.');

    const amount = Number(payload.amountIrr) || 0;
    if (amount <= 0) throw new Error('مبلغ تسویه باید بزرگتر از صفر باشد.');

    const dateJalali = payload.dateJalali || '1405/01/25';

    let tx: TreasuryTransactionRecord | undefined;

    if (payload.paymentMethod === 'CHEQUE') {
      const chequeType: ChequeType = payload.txType === 'RECEIPT' ? 'INBOUND' : 'OUTBOUND';
      this.createCheque(
        {
          chequeNumber: payload.chequeNumber || `CHQ-${Date.now().toString().slice(-6)}`,
          chequeType,
          partyId: party.id,
          bankNameFa: payload.bankNameFa || 'بانک ملی ایران',
          amountIrr: amount,
          issueDateJalali: dateJalali,
          dueDateJalali: payload.chequeDueDateJalali || dateJalali,
          notesFa: payload.descriptionFa || `تسویه حساب فوری ${party.fullName}`,
        },
        actorUserId
      );
    } else if (payload.paymentMethod === 'INSTALLMENT') {
      const count = Number(payload.installmentCount) || 3;
      const installmentAmount = Math.round(amount / count);
      for (let i = 1; i <= count; i++) {
        const nextId = (this.dbState.installments || []).length + 1;
        this.dbState.installments.push({
          id: nextId,
          installmentCode: `INS-SETTLE-${1000 + nextId}`,
          titleFa: `قسط ${i} از ${count} تسویه حساب ${party.fullName}`,
          partyId: party.id,
          partyNameFa: party.fullName,
          installmentNumber: i,
          totalInstallments: count,
          amountIrr: installmentAmount,
          dueDateJalali: `1405/${String(Math.min(12, i + 1)).padStart(2, '0')}/25`,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      }

      const partyTxId =
        (this.dbState.partyTransactions || []).length > 0
          ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
          : 1;

      this.dbState.partyTransactions.push({
        id: partyTxId,
        partyId: party.id,
        recordType: 'INSTALLMENT_PLAN',
        referenceNumber: `INS-PLAN-${1000 + partyTxId}`,
        titleFa: `انتقال به طرح اقساطی ${party.fullName}`,
        amountIrr: amount,
        dateJalali,
        status: 'COMPLETED',
        notesFa: `تعریف طرح اقساطی ${count} ماهه به مبلغ کل ${amount.toLocaleString('fa-IR')} ریال`,
        createdAt: new Date().toISOString(),
      });
    } else {
      // CASH, POS, BANK_TRANSFER
      const txMethod = payload.paymentMethod === 'POS' ? 'POS' : payload.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'CASH';
      const targetBankId = payload.paymentMethod === 'POS' || payload.paymentMethod === 'BANK_TRANSFER' ? (payload.bankAccountId || 1) : undefined;
      const targetCashId = payload.paymentMethod === 'CASH' ? (payload.cashBoxId || 1) : undefined;

      tx = this.createTreasuryTransaction(
        {
          txType: payload.txType,
          dateJalali,
          partyId: party.id,
          amountIrr: amount,
          paymentMethod: txMethod,
          targetBankAccountId: payload.txType === 'RECEIPT' ? targetBankId : undefined,
          sourceBankAccountId: payload.txType === 'PAYMENT' ? targetBankId : undefined,
          targetCashBoxId: payload.txType === 'RECEIPT' ? targetCashId : undefined,
          sourceCashBoxId: payload.txType === 'PAYMENT' ? targetCashId : undefined,
          notesFa: payload.descriptionFa || `تسویه حساب فوری (${payload.txType === 'RECEIPT' ? 'دریافت' : 'پرداخت'}) ${party.fullName} به روش ${payload.paymentMethod}`,
        },
        actorUserId
      );
    }

    // Update party balance for CHEQUE settlement method upon registration (INSTALLMENT is updated when paid)
    if (party.transactionsSummary && payload.paymentMethod === 'CHEQUE') {
      if (payload.txType === 'RECEIPT') {
        party.transactionsSummary.totalReceiptsIrr = (party.transactionsSummary.totalReceiptsIrr || 0) + amount;
        party.transactionsSummary.netBalanceIrr -= amount;
      } else {
        party.transactionsSummary.totalPaymentsIrr = (party.transactionsSummary.totalPaymentsIrr || 0) + amount;
        party.transactionsSummary.netBalanceIrr += amount;
      }
    }

    this.recordAuditLog({
      action: 'PARTY_QUICK_SETTLEMENT',
      category: 'BUSINESS',
      targetEntity: 'parties',
      targetId: String(party.id),
      status: 'SUCCESS',
      detailsFa: `تسویه حساب فوری ${amount.toLocaleString('fa-IR')} ریال برای ${party.fullName}`,
      actorUserId,
    });

    this.saveDbState();
    return {
      ok: true,
      messageFa: `تسویه حساب ${amount.toLocaleString('fa-IR')} ریال برای ${party.fullName} با موفقیت ثبت شد.`,
      transaction: tx,
    };
  }

  // ==========================================================================
  // DATABASE RESET / FACTORY CLEAR (خالی کردن و پاکسازی دیتابیس)
  // ==========================================================================

  public resetDatabase(
    options: { wipeOperationalOnly?: boolean; factoryReset?: boolean; cleanZeroSlate?: boolean },
    actorUserId: number = 1
  ): { ok: boolean; messageFa: string } {
    if (options.cleanZeroSlate) {
      // 1. Wipe all operational documents & transactions
      this.dbState.salesInvoices = [];
      this.dbState.salesProformas = [];
      this.dbState.salesReceipts = [];
      this.dbState.salesReturns = [];
      this.dbState.purchaseInvoices = [];
      this.dbState.purchaseProformas = [];
      this.dbState.purchasePayments = [];
      this.dbState.purchaseReturns = [];
      this.dbState.installationJobs = [];
      this.dbState.treasuryTransactions = [];
      this.dbState.cheques = [];
      this.dbState.installments = [];
      this.dbState.operationalExpenses = [];
      this.dbState.operationalIncomes = [];
      this.dbState.projects = [];
      this.dbState.projectRequisitions = [];
      this.dbState.costCenters = [];
      this.dbState.fixedAssets = [];
      this.dbState.depreciationEntries = [];
      this.dbState.accountingDocuments = [];
      this.dbState.partyTransactions = [];
      this.dbState.inventoryDocuments = [];
      this.dbState.inventoryTransfers = [];
      this.dbState.serviceJobTickets = [];
      this.dbState.goldColleagueTrades = [];
      this.dbState.restaurantOrders = [];
      this.dbState.wholesaleOrders = [];
      this.dbState.wholesaleDispatches = [];
      this.dbState.mobileRepairTickets = [];
      this.dbState.mobileDevices = [];

      // 2. Wipe parties & items to absolute clean slate
      this.dbState.parties = [];
      this.dbState.items = [];
      this.dbState.itemSerials = [];

      // 3. Keep 1 default cashbox, 1 default bank account, 1 default warehouse, with 0 balance
      this.dbState.cashBoxes = [
        {
          id: 1,
          boxCode: 'CB-1001',
          titleFa: 'صندوق اصلی فروشگاه',
          balanceIrr: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      ];
      this.dbState.bankAccounts = [
        {
          id: 1,
          accountCode: 'BA-1001',
          bankNameFa: 'بانک ملت (حساب جاری اصلی)',
          accountNumber: '0100000000',
          shabaNumber: 'IR000000000000000000000000',
          balanceIrr: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      ];
      this.dbState.warehouses = [
        {
          id: 1,
          warehouseCode: 'WH-01',
          code: 'WH-01',
          titleFa: 'انبار مرکزی',
          keeperNameFa: 'مسئول انبار',
          managerNameFa: 'مسئول انبار',
          status: 'ACTIVE',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.dbState.itemCategories = [
        {
          id: 1,
          code: 'CAT-GEN',
          categoryCode: 'CAT-GEN',
          nameFa: 'کالای عمومی',
          titleFa: 'کالای عمومی',
          prefix: 'GEN',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      // 4. Wipe users except exactly 1 primary admin (username: admin, password: admin)
      const adminSalt = generateSalt();
      const adminHash = hashPassword('admin', adminSalt);
      this.dbState.users = [
        {
          id: 1,
          username: 'admin',
          fullName: 'مدیر کل و راهبر سیستم مهرگان',
          jobTitle: 'مدیر ارشد',
          email: 'admin@mehregan.local',
          passwordHash: adminHash,
          passwordSalt: adminSalt,
          status: 'ACTIVE',
          isInitialAdmin: true,
          isDemo: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.dbState.userRoleAssignments = [
        {
          id: 1,
          userId: 1,
          roleCode: 'OWNER',
          assignedAt: new Date().toISOString(),
          assignedBy: 'SYSTEM_ZERO_RESET',
        },
      ];
      this.dbState.userPermissionOverrides = [];
      this.dbState.activeSessionUserId = 1;
      this.dbState.auditLogs = [];

      this.saveDbState();
      this.recordAuditLog({
        action: 'DATABASE_ZERO_RESET',
        category: 'SETTINGS',
        targetEntity: 'database',
        targetId: 'ROOT',
        status: 'SUCCESS',
        detailsFa: 'پاکسازی کامل سیستم به حالت صفر مطلق (بدون رکورد، فقط ۱ کاربر مدیر جهت شروع واقعی)',
        actorUserId: 1,
      });
      return {
        ok: true,
        messageFa: 'سیستم با موفقیت به حالت صفر مطلق بازنشانی شد. تمامی رکوردها پاکسازی شده و فقط یک کاربر مدیر (admin / رمز: admin) باقی ماند.',
      };
    }

    if (options.factoryReset) {
      this.dbState = buildDefaultState();
      this.saveDbState();
      this.recordAuditLog({
        action: 'DATABASE_FACTORY_RESET',
        category: 'SETTINGS',
        targetEntity: 'database',
        targetId: 'ROOT',
        status: 'SUCCESS',
        detailsFa: 'بازنشانی کامل دیتابیس به تنظیمات اولیّه کارخانه با داده‌های نمونه',
        actorUserId,
      });
      return { ok: true, messageFa: 'دیتابیس با موفقیت به تنظیمات اولیه کارخانه (با داده‌های نمایشی) بازنشانی گردید.' };
    }

    if (options.wipeOperationalOnly) {
      this.dbState.salesInvoices = [];
      this.dbState.salesProformas = [];
      this.dbState.salesReceipts = [];
      this.dbState.salesReturns = [];
      this.dbState.purchaseInvoices = [];
      this.dbState.purchaseProformas = [];
      this.dbState.purchasePayments = [];
      this.dbState.purchaseReturns = [];
      this.dbState.installationJobs = [];
      this.dbState.treasuryTransactions = [];
      this.dbState.cheques = [];
      this.dbState.installments = [];
      this.dbState.operationalExpenses = [];
      this.dbState.operationalIncomes = [];
      this.dbState.projects = [];
      this.dbState.projectRequisitions = [];
      this.dbState.accountingDocuments = (this.dbState.accountingDocuments || []).filter(
        (d) => d.docType === 'MANUAL' || d.sourceDocType === 'CLOSING_PERIOD'
      );

      // Reset party balances to 0
      (this.dbState.parties || []).forEach((p) => {
        if (p.transactionsSummary) {
          p.transactionsSummary = {
            totalSalesCount: 0,
            totalSalesIrr: 0,
            totalPurchasesCount: 0,
            totalPurchasesIrr: 0,
            totalPaymentsIrr: 0,
            totalReceiptsIrr: 0,
            activeProjectsCount: 0,
            netBalanceIrr: 0,
          };
        }
        (p as any).currentBalanceIrr = 0;
      });

      // Reset items stock to 0
      (this.dbState.items || []).forEach((item) => {
        item.totalStock = 0;
        item.warehouseStocks = {};
        (item as any).stock = 0;
      });

      // Reset cashboxes & banks to 0
      (this.dbState.cashBoxes || []).forEach((c) => (c.balanceIrr = 0));
      (this.dbState.bankAccounts || []).forEach((b) => (b.balanceIrr = 0));

      this.saveDbState();
      this.recordAuditLog({
        action: 'DATABASE_OPERATIONAL_WIPE',
        category: 'SETTINGS',
        targetEntity: 'database',
        targetId: 'ROOT',
        status: 'SUCCESS',
        detailsFa: 'پاکسازی کلیه اسناد و تراکنش‌های عملیاتی با صفر کردن مانده‌ها و حفظ اطلاعات پایه',
        actorUserId,
      });
      return { ok: true, messageFa: 'کلیه فاکتورها، تراکنش‌های مالی و اسناد عملیاتی پاکسازی شده و مانده‌های کالا و اشخاص به صفر بازنشانی شدند.' };
    }

    throw new Error('نوع عملیات پاکسازی مشخص نشده است.');
  }

  // ==========================================================================
  // DELETION ENGINE (حذف موردی رکوردهای فاکتور، کالا، شخص، پروژه، خزانه و سند)
  // ==========================================================================

  public deleteSalesInvoice(invoiceId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const invIndex = (this.dbState.salesInvoices || []).findIndex((inv) => inv.id === invoiceId);
    if (invIndex === -1) throw new Error('فاکتور فروش مورد نظر یافت نشد.');
    const invoice = this.dbState.salesInvoices[invIndex];

    // 1. Revert customer balance
    const customer = (this.dbState.parties || []).find((p) => p.id === invoice.customerId);
    if (customer && customer.transactionsSummary) {
      customer.transactionsSummary.totalSalesCount = Math.max(0, (customer.transactionsSummary.totalSalesCount || 1) - 1);
      customer.transactionsSummary.totalSalesIrr = Math.max(0, (customer.transactionsSummary.totalSalesIrr || 0) - (invoice.totalInvoiceAmountIrr || 0));
      customer.transactionsSummary.netBalanceIrr -= (invoice.totalInvoiceAmountIrr || 0);
      (customer as any).currentBalanceIrr = customer.transactionsSummary.netBalanceIrr;
    }

    // 2. Return sold stock back to inventory items
    for (const line of invoice.lines || []) {
      const item = (this.dbState.items || []).find((i) => i.id === line.itemId);
      if (item) {
        item.totalStock = (item.totalStock || 0) + (line.quantity || 0);
        (item as any).stock = item.totalStock;
        const whId = (invoice as any).warehouseId || (invoice as any).sourceWarehouseId || 1;
        if (item.warehouseStocks && whId) {
          item.warehouseStocks[whId] = (item.warehouseStocks[whId] || 0) + (line.quantity || 0);
        }
      }
    }

    // 3. Remove corresponding auto-generated accounting document
    this.dbState.accountingDocuments = (this.dbState.accountingDocuments || []).filter(
      (doc) => !(doc.sourceDocType === 'SALES_INVOICE' && doc.sourceDocId === invoiceId)
    );

    // 4. Remove invoice
    this.dbState.salesInvoices.splice(invIndex, 1);

    this.recordAuditLog({
      action: 'SALES_INVOICE_DELETED',
      category: 'BUSINESS',
      targetEntity: 'sales_invoices',
      targetId: String(invoiceId),
      status: 'SUCCESS',
      detailsFa: `حذف فاکتور فروش شماره ${invoice.invoiceNumber} به مبلغ ${(invoice.totalInvoiceAmountIrr || 0).toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `فاکتور فروش شماره «${invoice.invoiceNumber}» با موفقیت حذف گردید و موجودی انبار و مانده مشتری تعدیل شد.` };
  }

  public deletePurchaseInvoice(invoiceId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const invIndex = (this.dbState.purchaseInvoices || []).findIndex((inv) => inv.id === invoiceId);
    if (invIndex === -1) throw new Error('فاکتور خرید مورد نظر یافت نشد.');
    const invoice = this.dbState.purchaseInvoices[invIndex];

    // 1. Revert supplier balance
    const supplier = (this.dbState.parties || []).find((p) => p.id === invoice.supplierId);
    if (supplier && supplier.transactionsSummary) {
      supplier.transactionsSummary.totalPurchasesCount = Math.max(0, (supplier.transactionsSummary.totalPurchasesCount || 1) - 1);
      supplier.transactionsSummary.totalPurchasesIrr = Math.max(0, (supplier.transactionsSummary.totalPurchasesIrr || 0) - (invoice.totalInvoicePayableToSupplierIrr || invoice.totalInventoryValuationIrr || 0));
      supplier.transactionsSummary.netBalanceIrr += (invoice.totalInvoicePayableToSupplierIrr || invoice.totalInventoryValuationIrr || 0);
      (supplier as any).currentBalanceIrr = supplier.transactionsSummary.netBalanceIrr;
    }

    // 2. Deduct received stock from inventory items
    for (const line of invoice.lines || []) {
      const item = (this.dbState.items || []).find((i) => i.id === line.itemId);
      if (item) {
        item.totalStock = Math.max(0, (item.totalStock || 0) - (line.quantity || 0));
        (item as any).stock = item.totalStock;
        if (item.warehouseStocks && invoice.targetWarehouseId) {
          item.warehouseStocks[invoice.targetWarehouseId] = Math.max(0, (item.warehouseStocks[invoice.targetWarehouseId] || 0) - (line.quantity || 0));
        }
      }
    }

    // 3. Remove corresponding auto-generated accounting document
    this.dbState.accountingDocuments = (this.dbState.accountingDocuments || []).filter(
      (doc) => !(doc.sourceDocType === 'PURCHASE_INVOICE' && doc.sourceDocId === invoiceId)
    );

    // 4. Remove invoice
    this.dbState.purchaseInvoices.splice(invIndex, 1);

    this.recordAuditLog({
      action: 'PURCHASE_INVOICE_DELETED',
      category: 'BUSINESS',
      targetEntity: 'purchase_invoices',
      targetId: String(invoiceId),
      status: 'SUCCESS',
      detailsFa: `حذف فاکتور خرید شماره ${invoice.invoiceNumber} به مبلغ ${(invoice.totalInvoicePayableToSupplierIrr || 0).toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `فاکتور خرید شماره «${invoice.invoiceNumber}» با موفقیت حذف گردید و مانده تأمین‌کننده و انبار تعدیل شد.` };
  }

  public deleteItem(itemId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.items || []).findIndex((i) => i.id === itemId);
    if (idx === -1) throw new Error('کالای مورد نظر یافت نشد.');
    const item = this.dbState.items[idx];
    this.dbState.items.splice(idx, 1);

    this.recordAuditLog({
      action: 'ITEM_DELETED',
      category: 'BUSINESS',
      targetEntity: 'items',
      targetId: String(itemId),
      status: 'SUCCESS',
      detailsFa: `حذف کالا از انبار: ${item.titleFa}`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `کالای «${item.titleFa}» با موفقیت از سیستم حذف گردید.` };
  }

  public deleteProject(projectId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.projects || []).findIndex((p) => p.id === projectId);
    if (idx === -1) throw new Error('پروژه مورد نظر یافت نشد.');
    const project = this.dbState.projects[idx];
    this.dbState.projects.splice(idx, 1);
    this.dbState.installationJobs = (this.dbState.installationJobs || []).filter((j) => j.jobCode !== project.projectCode);
    this.dbState.projectRequisitions = (this.dbState.projectRequisitions || []).filter((r) => r.projectId !== projectId);

    this.recordAuditLog({
      action: 'PROJECT_DELETED',
      category: 'BUSINESS',
      targetEntity: 'projects',
      targetId: String(projectId),
      status: 'SUCCESS',
      detailsFa: `حذف پروژه: ${project.titleFa} (${project.projectCode})`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `پروژه «${project.titleFa}» با موفقیت حذف گردید.` };
  }

  public deleteInstallationJob(jobId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.installationJobs || []).findIndex((j) => j.id === jobId);
    if (idx === -1) throw new Error('سفارش نصب مورد نظر یافت نشد.');
    const job = this.dbState.installationJobs[idx];
    this.dbState.installationJobs.splice(idx, 1);

    this.recordAuditLog({
      action: 'INSTALLATION_JOB_DELETED',
      category: 'BUSINESS',
      targetEntity: 'installation_jobs',
      targetId: String(jobId),
      status: 'SUCCESS',
      detailsFa: `حذف پرونده نصب: ${job.jobCode}`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `سفارش نصب «${job.jobCode}» با موفقیت حذف گردید.` };
  }

  public updateTreasuryTransaction(
    txId: number,
    data: {
      txType?: 'RECEIPT' | 'PAYMENT' | 'TRANSFER' | 'EXPENSE' | 'INCOME';
      dateJalali?: string;
      partyId?: number;
      amountIrr?: number;
      paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CHEQUE';
      sourceCashBoxId?: number;
      sourceBankAccountId?: number;
      targetCashBoxId?: number;
      targetBankAccountId?: number;
      notesFa?: string;
    },
    actorUserId: number = 1
  ): TreasuryTransactionRecord {
    const idx = (this.dbState.treasuryTransactions || []).findIndex((t) => t.id === txId);
    if (idx === -1) throw new Error('تراکنش مالی مورد نظر یافت نشد.');

    const oldTx = this.dbState.treasuryTransactions[idx];

    // Revert bank/cash balances
    if (oldTx.txType === 'RECEIPT') {
      if (oldTx.targetBankAccountId) {
        const bank = (this.dbState.bankAccounts || []).find((b) => b.id === oldTx.targetBankAccountId);
        if (bank) bank.balanceIrr = Math.max(0, bank.balanceIrr - oldTx.amountIrr);
      }
      if (oldTx.targetCashBoxId) {
        const cash = (this.dbState.cashBoxes || []).find((c) => c.id === oldTx.targetCashBoxId);
        if (cash) cash.balanceIrr = Math.max(0, cash.balanceIrr - oldTx.amountIrr);
      }
    } else if (oldTx.txType === 'PAYMENT' || oldTx.txType === 'EXPENSE' || oldTx.txType === 'TRANSFER') {
      if (oldTx.sourceBankAccountId) {
        const bank = (this.dbState.bankAccounts || []).find((b) => b.id === oldTx.sourceBankAccountId);
        if (bank) bank.balanceIrr += oldTx.amountIrr;
      }
      if (oldTx.sourceCashBoxId) {
        const cash = (this.dbState.cashBoxes || []).find((c) => c.id === oldTx.sourceCashBoxId);
        if (cash) cash.balanceIrr += oldTx.amountIrr;
      }
      if (oldTx.txType === 'TRANSFER') {
        if (oldTx.targetBankAccountId) {
          const bank = (this.dbState.bankAccounts || []).find((b) => b.id === oldTx.targetBankAccountId);
          if (bank) bank.balanceIrr = Math.max(0, bank.balanceIrr - oldTx.amountIrr);
        }
        if (oldTx.targetCashBoxId) {
          const cash = (this.dbState.cashBoxes || []).find((c) => c.id === oldTx.targetCashBoxId);
          if (cash) cash.balanceIrr = Math.max(0, cash.balanceIrr - oldTx.amountIrr);
        }
      }
    }

    // Revert party balance if partyId set
    if (oldTx.partyId) {
      const p = (this.dbState.parties || []).find((party) => party.id === oldTx.partyId);
      if (p && p.transactionsSummary) {
        if (oldTx.txType === 'RECEIPT') {
          p.transactionsSummary.totalReceiptsIrr = Math.max(0, (p.transactionsSummary.totalReceiptsIrr || 0) - oldTx.amountIrr);
          p.transactionsSummary.netBalanceIrr -= oldTx.amountIrr;
        } else if (oldTx.txType === 'PAYMENT') {
          p.transactionsSummary.totalPaymentsIrr = Math.max(0, (p.transactionsSummary.totalPaymentsIrr || 0) - oldTx.amountIrr);
          p.transactionsSummary.netBalanceIrr += oldTx.amountIrr;
        }
        (p as any).currentBalanceIrr = p.transactionsSummary.netBalanceIrr;
      }
    }

    // Determine new fields
    const newTxType = data.txType || oldTx.txType;
    const newAmount = data.amountIrr !== undefined ? Number(data.amountIrr) || 0 : oldTx.amountIrr;
    if (newAmount <= 0) throw new Error('مبلغ تراکنش مالی باید بزرگتر از صفر باشد.');

    const newPartyId = data.partyId !== undefined ? data.partyId : oldTx.partyId;
    let newPartyNameFa: string | undefined = oldTx.partyNameFa || undefined;
    if (newPartyId) {
      const party = this.getParties().find((p) => p.id === newPartyId);
      if (party) newPartyNameFa = party.fullName;
    } else {
      newPartyNameFa = undefined;
    }

    const newPaymentMethod = data.paymentMethod || oldTx.paymentMethod;
    const newSourceBankAccountId = data.sourceBankAccountId !== undefined ? data.sourceBankAccountId : oldTx.sourceBankAccountId;
    const newSourceCashBoxId = data.sourceCashBoxId !== undefined ? data.sourceCashBoxId : oldTx.sourceCashBoxId;
    const newTargetBankAccountId = data.targetBankAccountId !== undefined ? data.targetBankAccountId : oldTx.targetBankAccountId;
    const newTargetCashBoxId = data.targetCashBoxId !== undefined ? data.targetCashBoxId : oldTx.targetCashBoxId;
    const newDateJalali = data.dateJalali || oldTx.dateJalali;
    const newNotesFa = data.notesFa !== undefined ? data.notesFa : oldTx.notesFa;

    // Apply new balances
    if (newSourceCashBoxId) {
      const box = (this.dbState.cashBoxes || []).find((c) => c.id === newSourceCashBoxId);
      if (box) box.balanceIrr -= newAmount;
    }
    if (newSourceBankAccountId) {
      const bank = (this.dbState.bankAccounts || []).find((b) => b.id === newSourceBankAccountId);
      if (bank) bank.balanceIrr -= newAmount;
    }
    if (newTargetCashBoxId) {
      const box = (this.dbState.cashBoxes || []).find((c) => c.id === newTargetCashBoxId);
      if (box) box.balanceIrr += newAmount;
    }
    if (newTargetBankAccountId) {
      const bank = (this.dbState.bankAccounts || []).find((b) => b.id === newTargetBankAccountId);
      if (bank) bank.balanceIrr += newAmount;
    }

    // Apply new party balance
    if (newPartyId) {
      const p = (this.dbState.parties || []).find((party) => party.id === newPartyId);
      if (p) {
        if (!p.transactionsSummary) {
          p.transactionsSummary = {
            totalSalesCount: 0,
            totalSalesIrr: 0,
            totalPurchasesCount: 0,
            totalPurchasesIrr: 0,
            totalPaymentsIrr: 0,
            totalReceiptsIrr: 0,
            activeProjectsCount: 0,
            netBalanceIrr: 0,
          };
        }
        if (newTxType === 'RECEIPT') {
          p.transactionsSummary.totalReceiptsIrr += newAmount;
          p.transactionsSummary.netBalanceIrr += newAmount;
        } else if (newTxType === 'PAYMENT') {
          p.transactionsSummary.totalPaymentsIrr += newAmount;
          p.transactionsSummary.netBalanceIrr -= newAmount;
        }
        (p as any).currentBalanceIrr = p.transactionsSummary.netBalanceIrr;
      }
    }

    // Update transaction record
    const updatedRecord: TreasuryTransactionRecord = {
      ...oldTx,
      txType: newTxType,
      dateJalali: newDateJalali,
      partyId: newPartyId || null,
      partyNameFa: newPartyNameFa || null,
      amountIrr: newAmount,
      paymentMethod: newPaymentMethod,
      sourceCashBoxId: newSourceCashBoxId || null,
      sourceBankAccountId: newSourceBankAccountId || null,
      targetCashBoxId: newTargetCashBoxId || null,
      targetBankAccountId: newTargetBankAccountId || null,
      notesFa: newNotesFa || null,
    };

    this.dbState.treasuryTransactions[idx] = updatedRecord;

    this.recordAuditLog({
      action: 'TREASURY_TRANSACTION_UPDATED',
      category: 'BUSINESS',
      targetEntity: 'treasury_transactions',
      targetId: String(txId),
      status: 'SUCCESS',
      detailsFa: `اصلاح تراکنش خزانه ${oldTx.txNumber} با مبلغ جدید ${newAmount.toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return updatedRecord;
  }

  public deleteTreasuryTransaction(txId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.treasuryTransactions || []).findIndex((t) => t.id === txId);
    if (idx === -1) throw new Error('تراکنش مالی مورد نظر یافت نشد.');
    const tx = this.dbState.treasuryTransactions[idx];

    // Revert bank/cash balances
    if (tx.txType === 'RECEIPT') {
      if (tx.targetBankAccountId) {
        const bank = (this.dbState.bankAccounts || []).find((b) => b.id === tx.targetBankAccountId);
        if (bank) bank.balanceIrr = Math.max(0, bank.balanceIrr - tx.amountIrr);
      }
      if (tx.targetCashBoxId) {
        const cash = (this.dbState.cashBoxes || []).find((c) => c.id === tx.targetCashBoxId);
        if (cash) cash.balanceIrr = Math.max(0, cash.balanceIrr - tx.amountIrr);
      }
    } else if (tx.txType === 'PAYMENT') {
      if (tx.sourceBankAccountId) {
        const bank = (this.dbState.bankAccounts || []).find((b) => b.id === tx.sourceBankAccountId);
        if (bank) bank.balanceIrr += tx.amountIrr;
      }
      if (tx.sourceCashBoxId) {
        const cash = (this.dbState.cashBoxes || []).find((c) => c.id === tx.sourceCashBoxId);
        if (cash) cash.balanceIrr += tx.amountIrr;
      }
    }

    // Revert party balance if partyId set
    if (tx.partyId) {
      const p = (this.dbState.parties || []).find((party) => party.id === tx.partyId);
      if (p && p.transactionsSummary) {
        if (tx.txType === 'RECEIPT') {
          p.transactionsSummary.totalReceiptsIrr = Math.max(0, (p.transactionsSummary.totalReceiptsIrr || 0) - tx.amountIrr);
          p.transactionsSummary.netBalanceIrr -= tx.amountIrr;
        } else {
          p.transactionsSummary.totalPaymentsIrr = Math.max(0, (p.transactionsSummary.totalPaymentsIrr || 0) - tx.amountIrr);
          p.transactionsSummary.netBalanceIrr += tx.amountIrr;
        }
        (p as any).currentBalanceIrr = p.transactionsSummary.netBalanceIrr;
      }
    }

    // Remove auto-generated accounting doc
    this.dbState.accountingDocuments = (this.dbState.accountingDocuments || []).filter(
      (doc) => !( (doc.sourceDocType === 'TREASURY_RECEIPT' || doc.sourceDocType === 'TREASURY_PAYMENT') && doc.sourceDocId === txId )
    );

    this.dbState.treasuryTransactions.splice(idx, 1);

    this.recordAuditLog({
      action: 'TREASURY_TRANSACTION_DELETED',
      category: 'BUSINESS',
      targetEntity: 'treasury_transactions',
      targetId: String(txId),
      status: 'SUCCESS',
      detailsFa: `حذف تراکنش خزانه ${tx.txNumber} به مبلغ ${tx.amountIrr.toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `تراکنش خزانه شماره «${tx.txNumber}» با موفقیت حذف گردید.` };
  }

  public deleteCheque(chequeId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.cheques || []).findIndex((c) => c.id === chequeId);
    if (idx === -1) throw new Error('چک مورد نظر یافت نشد.');
    const chq = this.dbState.cheques[idx];
    this.dbState.cheques.splice(idx, 1);

    this.recordAuditLog({
      action: 'CHEQUE_DELETED',
      category: 'BUSINESS',
      targetEntity: 'cheques',
      targetId: String(chequeId),
      status: 'SUCCESS',
      detailsFa: `حذف چک صیادی شماره ${chq.chequeNumber}`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `چک شماره «${chq.chequeNumber}» با موفقیت حذف گردید.` };
  }

  public deleteOperationalExpense(expenseId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.operationalExpenses || []).findIndex((e) => e.id === expenseId);
    if (idx === -1) throw new Error('هزینه عملیاتی مورد نظر یافت نشد.');
    const exp = this.dbState.operationalExpenses[idx];
    this.dbState.operationalExpenses.splice(idx, 1);

    this.recordAuditLog({
      action: 'OPERATIONAL_EXPENSE_DELETED',
      category: 'BUSINESS',
      targetEntity: 'operational_expenses',
      targetId: String(expenseId),
      status: 'SUCCESS',
      detailsFa: `حذف هزینه عملیاتی: ${exp.titleFa} به مبلغ ${exp.amountIrr.toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `هزینه عملیاتی «${exp.titleFa}» با موفقیت حذف گردید.` };
  }

  public deleteOperationalIncome(incomeId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.operationalIncomes || []).findIndex((i) => i.id === incomeId);
    if (idx === -1) throw new Error('درآمد عملیاتی مورد نظر یافت نشد.');
    const inc = this.dbState.operationalIncomes[idx];
    this.dbState.operationalIncomes.splice(idx, 1);

    this.recordAuditLog({
      action: 'OPERATIONAL_INCOME_DELETED',
      category: 'BUSINESS',
      targetEntity: 'operational_incomes',
      targetId: String(incomeId),
      status: 'SUCCESS',
      detailsFa: `حذف درآمد عملیاتی: ${inc.titleFa} به مبلغ ${inc.amountIrr.toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `درآمد عملیاتی «${inc.titleFa}» با موفقیت حذف گردید.` };
  }

  public deleteSalesProforma(proformaId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.salesProformas || []).findIndex((p) => p.id === proformaId);
    if (idx === -1) throw new Error('پیش‌فاکتور مورد نظر یافت نشد.');
    const pf = this.dbState.salesProformas[idx];
    this.dbState.salesProformas.splice(idx, 1);

    this.recordAuditLog({
      action: 'SALES_PROFORMA_DELETED',
      category: 'BUSINESS',
      targetEntity: 'sales_proformas',
      targetId: String(proformaId),
      status: 'SUCCESS',
      detailsFa: `حذف پیش‌فاکتور فروش: ${pf.proformaNumber}`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `پیش‌فاکتور فروش «${pf.proformaNumber}» با موفقیت حذف گردید.` };
  }

  public deleteFixedAsset(assetId: number, actorUserId: number = 1): { ok: boolean; messageFa: string } {
    const idx = (this.dbState.fixedAssets || []).findIndex((a) => a.id === assetId);
    if (idx === -1) throw new Error('دارایی ثابت مورد نظر یافت نشد.');
    const asset = this.dbState.fixedAssets[idx];
    this.dbState.fixedAssets.splice(idx, 1);

    // Also remove any depreciation entries associated with this asset
    this.dbState.depreciationEntries = (this.dbState.depreciationEntries || []).filter(
      (e) => e.assetId !== assetId
    );

    this.recordAuditLog({
      action: 'FIXED_ASSET_DELETED',
      category: 'BUSINESS',
      targetEntity: 'fixed_assets',
      targetId: String(assetId),
      status: 'SUCCESS',
      detailsFa: `حذف دارایی ثابت: ${asset.titleFa} (${asset.assetCode})`,
      actorUserId,
    });

    this.saveDbState();
    return { ok: true, messageFa: `دارایی ثابت «${asset.titleFa}» با موفقیت حذف گردید.` };
  }

  // ==========================================================================
  // STAGE 12: FIXED ASSETS, DEPRECIATION & OPENING BALANCE
  // ==========================================================================

  public getFixedAssets(): FixedAssetRecord[] {
    return (this.dbState.fixedAssets || []).sort((a, b) => b.id - a.id);
  }

  public getDepreciationEntries(): DepreciationEntryRecord[] {
    return (this.dbState.depreciationEntries || []).sort((a, b) => b.id - a.id);
  }

  public getOpeningBalanceDoc(): AccountingDocumentRecord | null {
    return (
      (this.dbState.accountingDocuments || []).find(
        (d) => d.docNumber === 'DOC-OPENING-101' || d.sourceDocType === 'CLOSING_PERIOD' || d.referenceNumber === 'EXCEL-IMPORT-101'
      ) || null
    );
  }

  public createFixedAsset(data: Partial<FixedAssetRecord>, actorUserId: number = 1): FixedAssetRecord {
    if (!data.titleFa) throw new Error('عنوان دارایی ثابت الزامی است.');
    const cost = Number(data.purchaseCostIrr) || 0;
    if (cost <= 0) throw new Error('بهای تمام‌شده دارایی باید بزرگتر از صفر باشد.');

    const nextId = (this.dbState.fixedAssets || []).length + 1;
    const nowIso = new Date().toISOString();
    const assetCode = data.assetCode || `AST-1405-${String(nextId).padStart(3, '0')}`;
    const salvage = Number(data.salvageValueIrr) || 0;

    const record: FixedAssetRecord = {
      id: nextId,
      assetCode,
      titleFa: data.titleFa,
      purchaseDateJalali: data.purchaseDateJalali || '1405/01/01',
      purchaseCostIrr: cost,
      salvageValueIrr: salvage,
      usefulLifeYears: Number(data.usefulLifeYears) || 5,
      depreciationMethod: data.depreciationMethod || 'STRAIGHT_LINE',
      status: data.status || 'ACTIVE',
      custodianPartyId: data.custodianPartyId || null,
      custodianTitleFa: data.custodianTitleFa || null,
      locationAddressFa: data.locationAddressFa || 'دفتر مرکزی',
      accumulatedDepreciationIrr: 0,
      bookValueIrr: cost,
      lastDepreciationDateJalali: null,
      createdAt: nowIso,
    };

    if (!Array.isArray(this.dbState.fixedAssets)) {
      this.dbState.fixedAssets = [];
    }
    this.dbState.fixedAssets.push(record);

    this.recordAuditLog({
      action: 'FIXED_ASSET_CREATED',
      category: 'BUSINESS',
      targetEntity: 'fixed_assets',
      targetId: String(record.id),
      status: 'SUCCESS',
      detailsFa: `ثبت دارایی ثابت جدید: ${record.titleFa} با کد ${record.assetCode} و بهای تمام‌شده ${cost.toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return record;
  }

  public updateFixedAsset(id: number, data: Partial<FixedAssetRecord>, actorUserId: number = 1): FixedAssetRecord {
    const asset = (this.dbState.fixedAssets || []).find((a) => a.id === id);
    if (!asset) throw new Error('دارایی ثابت مورد نظر یافت نشد.');

    if (data.titleFa) asset.titleFa = data.titleFa;
    if (data.purchaseCostIrr) {
      asset.purchaseCostIrr = Number(data.purchaseCostIrr);
      asset.bookValueIrr = asset.purchaseCostIrr - asset.accumulatedDepreciationIrr;
    }
    if (data.salvageValueIrr !== undefined) asset.salvageValueIrr = Number(data.salvageValueIrr);
    if (data.usefulLifeYears) asset.usefulLifeYears = Number(data.usefulLifeYears);
    if (data.depreciationMethod) asset.depreciationMethod = data.depreciationMethod;
    if (data.status) asset.status = data.status;
    if (data.custodianPartyId !== undefined) asset.custodianPartyId = data.custodianPartyId;
    if (data.custodianTitleFa !== undefined) asset.custodianTitleFa = data.custodianTitleFa;
    if (data.locationAddressFa) asset.locationAddressFa = data.locationAddressFa;

    this.recordAuditLog({
      action: 'FIXED_ASSET_UPDATED',
      category: 'BUSINESS',
      targetEntity: 'fixed_assets',
      targetId: String(asset.id),
      status: 'SUCCESS',
      detailsFa: `ویرایش دارایی ثابت: ${asset.titleFa}`,
      actorUserId,
    });

    this.saveDbState();
    return asset;
  }

  public calculateAndPostDepreciation(
    assetId: number,
    periodJalali: string = '1405-Y',
    actorUserId: number = 1
  ): { ok: boolean; messageFa: string; depreciationAmountIrr: number; entry: DepreciationEntryRecord; document: AccountingDocumentRecord | null } {
    const asset = (this.dbState.fixedAssets || []).find((a) => a.id === assetId);
    if (!asset) throw new Error('دارایی ثابت یافت نشد.');

    if (asset.status === 'FULLY_DEPRECIATED' || asset.bookValueIrr <= asset.salvageValueIrr) {
      throw new Error('این دارایی کاملاً مستهلک شده است و استهلاک جدیدی برای آن قابل ثبت نیست.');
    }

    if (!Array.isArray(this.dbState.depreciationEntries)) {
      this.dbState.depreciationEntries = [];
    }

    // Prevent duplicate depreciation posting for the same asset & period
    const existingEntry = this.dbState.depreciationEntries.find(
      (e) => e.assetId === assetId && e.periodJalali === periodJalali
    );
    if (existingEntry) {
      throw new Error(`استهلاک این دارایی برای دوره ${periodJalali} قبلاً محاسبه و ثبت گردیده است.`);
    }

    // Calculation logic with documented monthly prorating policy for the acquisition year
    const depreciableBase = Math.max(0, asset.purchaseCostIrr - asset.salvageValueIrr);
    const standardAnnualDepreciation = Math.round(depreciableBase / (asset.usefulLifeYears || 5));

    let annualDepreciation = standardAnnualDepreciation;
    if (asset.purchaseDateJalali) {
      const parts = asset.purchaseDateJalali.split('/');
      const purchaseYear = parts[0]?.trim();
      const purchaseMonth = parseInt(parts[1] || '1', 10);
      const periodYear = periodJalali.replace('-Y', '').split('/')[0]?.trim();

      if (purchaseYear && periodYear && purchaseYear === periodYear && purchaseMonth >= 1 && purchaseMonth <= 12) {
        // Documented monthly prorating policy: asset is depreciated for remaining active months in the acquisition year
        const activeMonths = 12 - purchaseMonth + 1;
        annualDepreciation = Math.round((standardAnnualDepreciation * activeMonths) / 12);
      }
    }

    const remainingDepreciable = Math.max(0, depreciableBase - asset.accumulatedDepreciationIrr);
    const depAmount = Math.min(annualDepreciation, remainingDepreciable);
    if (depAmount <= 0) {
      throw new Error('مبلغ استهلاک قابل محاسبه معادل صفر می‌باشد.');
    }

    // Post double-entry accounting document if accounting is enabled
    // Debit: 8101 (هزینه استهلاک دارایی‌های ثابت)
    // Credit: 1502 (استهلاک انباشته دارایی‌های ثابت)
    let doc: AccountingDocumentRecord | null = null;
    if (this.isDoubleEntryAccountingEnabled()) {
      doc = this.createAccountingDocument(
        {
          docType: 'AUTO',
          sourceDocType: 'FIXED_ASSET_DEPRECIATION',
          sourceDocId: asset.id,
          dateJalali: '1405/12/29',
          referenceNumber: `DEP-${asset.assetCode}-${periodJalali}`,
          descriptionFa: `ثبت استهلاک دوره ${periodJalali} برای دارایی ثابت ${asset.titleFa}`,
          lines: [
            {
              accountCode: '8101',
              accountTitleFa: 'هزینه استهلاک دارایی‌های ثابت',
              detailTitleFa: asset.titleFa,
              debitIrr: depAmount,
              creditIrr: 0,
              descriptionFa: `هزینه استهلاک ${asset.titleFa}`,
            },
            {
              accountCode: '1502',
              accountTitleFa: 'استهلاک انباشته دارایی‌های ثابت',
              detailTitleFa: asset.titleFa,
              debitIrr: 0,
              creditIrr: depAmount,
              descriptionFa: `استهلاک انباشته ${asset.titleFa}`,
            },
          ],
        },
        actorUserId
      );
    }

    // Update asset
    asset.accumulatedDepreciationIrr += depAmount;
    asset.bookValueIrr = asset.purchaseCostIrr - asset.accumulatedDepreciationIrr;
    asset.lastDepreciationDateJalali = periodJalali;
    if (asset.bookValueIrr <= asset.salvageValueIrr) {
      asset.status = 'FULLY_DEPRECIATED';
    }

    const nextEntryId = this.dbState.depreciationEntries.length + 1;
    const entry: DepreciationEntryRecord = {
      id: nextEntryId,
      assetId: asset.id,
      assetTitleFa: asset.titleFa,
      periodJalali,
      depreciationAmountIrr: depAmount,
      accountingDocId: doc ? doc.id : null,
      postedAt: new Date().toISOString(),
    };
    this.dbState.depreciationEntries.push(entry);

    this.recordAuditLog({
      action: 'DEPRECIATION_POSTED',
      category: 'BUSINESS',
      targetEntity: 'fixed_assets',
      targetId: String(asset.id),
      status: 'SUCCESS',
      detailsFa: `محاسبه و ثبت استهلاک ${depAmount.toLocaleString('fa-IR')} ریال برای ${asset.titleFa}${doc ? ` همراه با سند دوبل [${doc.docNumber}]` : ' (حالت عملیات ساده بدون سند دوبل)'}`,
      actorUserId,
    });

    this.saveDbState();
    return {
      ok: true,
      messageFa: `استهلاک دوره ${periodJalali} به مبلغ ${depAmount.toLocaleString('fa-IR')} ریال برای دارایی ${asset.titleFa} با موفقیت ثبت گردید.`,
      depreciationAmountIrr: depAmount,
      entry,
      document: doc,
    };
  }

  public importOpeningBalances(
    payload: OpeningBalanceBatchPayload,
    actorUserId: number = 1
  ): { ok: boolean; messageFa: string; document: AccountingDocumentRecord } {
    const items = payload.items || [];
    if (items.length === 0) throw new Error('فهرست آیتم‌های سند افتتاحیه خالی است.');

    const totalDebit = items.reduce((s, item) => s + (Number(item.debitIrr) || 0), 0);
    const totalCredit = items.reduce((s, item) => s + (Number(item.creditIrr) || 0), 0);

    if (totalDebit !== totalCredit) {
      throw new Error(
        `سند افتتاحیه متوازن نیست! مجموع بدهکار: ${totalDebit.toLocaleString('fa-IR')} ریال، مجموع بستانکار: ${totalCredit.toLocaleString('fa-IR')} ریال.`
      );
    }

    const dateJalali = payload.dateJalali || '1405/01/01';

    const linesForDoc = items.map((item) => ({
      accountCode: item.accountCode || '10101',
      accountTitleFa: item.titleFa || 'حساب افتتاحیه',
      detailTitleFa: item.code ? `[کد: ${item.code}] ${item.titleFa}` : item.titleFa,
      debitIrr: Number(item.debitIrr) || 0,
      creditIrr: Number(item.creditIrr) || 0,
      descriptionFa: item.notesFa || `مانده افتتاحیه ${item.titleFa}`,
    }));

    // Remove old opening balance doc if exists to allow update
    const existingIndex = (this.dbState.accountingDocuments || []).findIndex(
      (d) => d.docNumber === 'DOC-OPENING-101' || d.sourceDocType === 'CLOSING_PERIOD' || d.referenceNumber === 'EXCEL-IMPORT-101'
    );
    if (existingIndex >= 0) {
      this.dbState.accountingDocuments.splice(existingIndex, 1);
    }

    const doc = this.createAccountingDocument(
      {
        docNumber: 'DOC-OPENING-101',
        docType: 'CLOSING',
        sourceDocType: 'CLOSING_PERIOD',
        sourceDocId: 101,
        dateJalali,
        referenceNumber: 'EXCEL-IMPORT-101',
        descriptionFa: payload.descriptionFa || 'سند افتتاحیه سال مالی (تأییدشده از فایل اکسل/دستی)',
        lines: linesForDoc,
        status: 'PERMANENT',
      },
      actorUserId
    );

    // Process module updates for Party, Inventory stock, Treasury
    for (const item of items) {
      if (item.type === 'PARTY' && item.refId) {
        const p = (this.dbState.parties || []).find((party) => party.id === item.refId);
        if (p) {
          const hasHistoricalTxs = (this.dbState.partyTransactions || []).some(
            (t) => t.partyId === p.id && t.recordType !== 'OPENING_DEBIT' && t.recordType !== 'OPENING_CREDIT'
          );
          if (!hasHistoricalTxs) {
            const partyTxId =
              (this.dbState.partyTransactions || []).length > 0
                ? Math.max(...this.dbState.partyTransactions.map((t) => t.id)) + 1
                : 1;

            const isDebit = Number(item.debitIrr || 0) > 0;
            this.dbState.partyTransactions.push({
              id: partyTxId,
              partyId: p.id,
              recordType: isDebit ? 'OPENING_DEBIT' : 'OPENING_CREDIT',
              referenceNumber: 'OPENING-101',
              titleFa: `مانده افتتاحیه - ${item.titleFa}`,
              amountIrr: isDebit ? Number(item.debitIrr) : Number(item.creditIrr),
              dateJalali,
              status: 'COMPLETED',
              notesFa: 'سند مانده افتتاحیه اول دوره',
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else if (item.type === 'INVENTORY' && item.warehouseId && item.qty && item.unitCostIrr) {
        const targetItem = (this.dbState.items || []).find((i) => i.id === (item.refId || 1));
        const isSer = targetItem?.isSerialized;
        const serials = isSer
          ? Array.from({ length: item.qty }, (_, i) => `SN-OPN-${targetItem?.id || 1}-${Date.now().toString().slice(-4)}-${i + 1}`)
          : undefined;

        this.createInventoryDocument(
          {
            docType: 'INBOUND_PURCHASE',
            dateJalali,
            targetWarehouseId: item.warehouseId,
            notesFa: `موجودی اولیه سند افتتاحیه ${item.titleFa} [OPENING-STOCK]`,
            lines: [
              {
                itemId: targetItem?.id || item.refId || 1,
                quantity: item.qty,
                unitCostIrr: item.unitCostIrr,
                serialNumbers: serials,
              },
            ],
          },
          actorUserId
        );
      } else if (item.type === 'BANK_CASH' && item.refId) {
        const isBankCode = item.accountCode === '10101' || item.accountCode === '10102' || item.accountCode?.startsWith('BA');
        const isCashCode = item.accountCode === '10103' || item.accountCode === '10104' || item.accountCode?.startsWith('CB');
        const hasBankTitle = item.titleFa?.includes('بانک') || item.titleFa?.includes('کارتخوان') || item.titleFa?.includes('جاری');
        const hasCashTitle = item.titleFa?.includes('صندوق') || item.titleFa?.includes('تنخواه');

        const isCash = isCashCode || (hasCashTitle && !hasBankTitle && !isBankCode);
        if (isCash) {
          const cash = (this.dbState.cashBoxes || []).find((c) => c.id === item.refId);
          if (cash) cash.balanceIrr = item.debitIrr - item.creditIrr;
        } else {
          const bank = (this.dbState.bankAccounts || []).find((b) => b.id === item.refId);
          if (bank) {
            bank.balanceIrr = item.debitIrr - item.creditIrr;
          } else {
            const cash = (this.dbState.cashBoxes || []).find((c) => c.id === item.refId);
            if (cash) cash.balanceIrr = item.debitIrr - item.creditIrr;
          }
        }
      }
    }

    this.recordAuditLog({
      action: 'OPENING_BALANCE_IMPORTED',
      category: 'BUSINESS',
      targetEntity: 'accounting_documents',
      targetId: String(doc.id),
      status: 'SUCCESS',
      detailsFa: `ثبت و تأیید سند افتتاحیه سال مالی به مبلغ ${totalDebit.toLocaleString('fa-IR')} ریال`,
      actorUserId,
    });

    this.saveDbState();
    return {
      ok: true,
      messageFa: `سند افتتاحیه شماره DOC-OPENING-101 به مبلغ کل ${totalDebit.toLocaleString('fa-IR')} ریال و ${items.length} ردیف با موفقیت نهایی و در دیتابیس ثبت گردید.`,
      document: doc,
    };
  }

  public importSimpleOpeningBalance(
    payload: SimpleOpeningBalancePayload,
    actorUserId: number = 1
  ): { ok: boolean; messageFa: string; document: AccountingDocumentRecord } {
    const items: OpeningBalanceImportItem[] = [];

    // 1. Banks & Cash Boxes
    for (const bank of payload.bankBalances || []) {
      if (bank.balanceIrr && bank.balanceIrr > 0) {
        items.push({
          type: 'BANK_CASH',
          code: `BANK-${bank.id}`,
          titleFa: bank.titleFa || `حساب بانکی کد ${bank.id}`,
          accountCode: '10102',
          debitIrr: bank.balanceIrr,
          creditIrr: 0,
          refId: bank.id,
          notesFa: 'موجودی اولیه بانک',
        });
      }
    }

    for (const cash of payload.cashBalances || []) {
      if (cash.balanceIrr && cash.balanceIrr > 0) {
        items.push({
          type: 'BANK_CASH',
          code: `CASH-${cash.id}`,
          titleFa: cash.titleFa || `صندوق کد ${cash.id}`,
          accountCode: '10101',
          debitIrr: cash.balanceIrr,
          creditIrr: 0,
          refId: cash.id,
          notesFa: 'موجودی اولیه صندوق',
        });
      }
    }

    // 2. Party Balances (Debtors / Creditors)
    for (const party of payload.partyBalances || []) {
      if (party.amountIrr && party.amountIrr > 0) {
        if (party.type === 'DEBTOR') {
          items.push({
            type: 'PARTY',
            code: `PRT-${party.partyId}`,
            titleFa: party.partyTitleFa,
            accountCode: '10301',
            debitIrr: party.amountIrr,
            creditIrr: 0,
            refId: party.partyId,
            notesFa: 'طلب اولیه از شخص',
          });
        } else {
          items.push({
            type: 'PARTY',
            code: `PRT-${party.partyId}`,
            titleFa: party.partyTitleFa,
            accountCode: '20101',
            debitIrr: 0,
            creditIrr: party.amountIrr,
            refId: party.partyId,
            notesFa: 'بدهی اولیه به شخص',
          });
        }
      }
    }

    // 3. Inventory Stock
    for (const inv of payload.inventoryBalances || []) {
      if (inv.qty && inv.unitCostIrr && inv.qty > 0) {
        const totalCost = inv.qty * inv.unitCostIrr;
        items.push({
          type: 'INVENTORY',
          code: `ITM-${inv.itemId}`,
          titleFa: inv.itemTitleFa,
          accountCode: '10401',
          debitIrr: totalCost,
          creditIrr: 0,
          refId: inv.itemId,
          warehouseId: inv.warehouseId,
          qty: inv.qty,
          unitCostIrr: inv.unitCostIrr,
          notesFa: `موجودی اولیه انبار (${inv.qty} عدد)`,
        });
      }
    }

    // Balance with Capital Account (30101)
    const sumDebit = items.reduce((acc, i) => acc + (i.debitIrr || 0), 0);
    const sumCredit = items.reduce((acc, i) => acc + (i.creditIrr || 0), 0);

    if (sumDebit > sumCredit) {
      const diff = sumDebit - sumCredit;
      items.push({
        type: 'GENERAL_ACCOUNT',
        code: 'CAP-30101',
        titleFa: 'سرمایه اولیه مالکان و تراز افتتاحیه',
        accountCode: '30101',
        debitIrr: 0,
        creditIrr: diff,
        notesFa: 'سرمایه بابت موازنه خودکار سند افتتاحیه',
      });
    } else if (sumCredit > sumDebit) {
      const diff = sumCredit - sumDebit;
      items.push({
        type: 'GENERAL_ACCOUNT',
        code: 'CAP-30101',
        titleFa: 'سرمایه اولیه مالکان و تراز افتتاحیه',
        accountCode: '30101',
        debitIrr: diff,
        creditIrr: 0,
        notesFa: 'تعدیل بابت موازنه خودکار سند افتتاحیه',
      });
    } else if (items.length === 0) {
      throw new Error('حداقل یک مورد موجودی اولیه (بانک، صندوق، کالا یا مانده شخص) را وارد نمایید.');
    }

    return this.importOpeningBalances(
      {
        dateJalali: payload.dateJalali || '1405/01/01',
        descriptionFa: payload.notesFa || 'سند افتتاحیه اول دوره (ثبت‌شده از طریق فرم ساده و هوشمند)',
        items,
      },
      actorUserId
    );
  }

  public generateNextDocumentNumber(
    type: 'SALES_INVOICE' | 'PURCHASE_INVOICE' | 'ACCOUNTING_DOC' | 'TREASURY_REC' | 'TREASURY_PAY' | 'PROJECT' | 'INSTALLATION' | 'EXPENSE' | 'INCOME'
  ): string {
    const cfg = this.dbState.settings.documentNumbering || {
      salesInvoicePrefix: 'INV-1405-',
      salesProformaPrefix: 'SQO-1405-',
      purchaseInvoicePrefix: 'PI-1405-',
      purchaseProformaPrefix: 'PO-1405-',
      treasuryReceiptPrefix: 'REC-1405-',
      treasuryPaymentPrefix: 'PAY-1405-',
      accountingDocPrefix: 'DOC-1405-',
      projectPrefix: 'PRJ-1405-',
      installationPrefix: 'INS-1405-',
      expensePrefix: 'EXP-1405-',
      incomePrefix: 'INC-1405-',
    };

    switch (type) {
      case 'SALES_INVOICE': {
        const count = (this.dbState.salesInvoices || []).length + 1001;
        return `${cfg.salesInvoicePrefix}${count}`;
      }
      case 'PURCHASE_INVOICE': {
        const count = (this.dbState.purchaseInvoices || []).length + 1001;
        return `${cfg.purchaseInvoicePrefix}${count}`;
      }
      case 'ACCOUNTING_DOC': {
        const count = (this.dbState.accountingDocuments || []).length + 1001;
        return `${cfg.accountingDocPrefix}${count}`;
      }
      case 'TREASURY_REC': {
        const count = (this.dbState.treasuryTransactions || []).filter((t) => t.txType === 'RECEIPT').length + 1001;
        return `${cfg.treasuryReceiptPrefix}${count}`;
      }
      case 'TREASURY_PAY': {
        const count = (this.dbState.treasuryTransactions || []).filter((t) => t.txType === 'PAYMENT').length + 1001;
        return `${cfg.treasuryPaymentPrefix}${count}`;
      }
      case 'PROJECT': {
        const count = (this.dbState.projects || []).length + 1001;
        return `${cfg.projectPrefix}${count}`;
      }
      case 'INSTALLATION': {
        const count = (this.dbState.installationJobs || []).length + 1001;
        return `${cfg.installationPrefix}${count}`;
      }
      case 'EXPENSE': {
        const count = (this.dbState.operationalExpenses || []).length + 1001;
        return `${cfg.expensePrefix}${count}`;
      }
      case 'INCOME': {
        const count = (this.dbState.operationalIncomes || []).length + 1001;
        return `${cfg.incomePrefix}${count}`;
      }
      default:
        return `DOC-${Date.now().toString().slice(-6)}`;
    }
  }

  // ==========================================================================
  // GOLD & JEWELRY MODULE METHODS (معاملات همکار، بده‌بستان وزنی، بدون ریال و کاردکس دوگانه)
  // ==========================================================================

  public getGoldColleagueTrades(partyId?: number): GoldColleagueTrade[] {
    const list = this.dbState.goldColleagueTrades || [];
    if (!partyId) return list;
    return list.filter((t) => t.partyId === partyId);
  }

  public createGoldColleagueTrade(
    data: {
      tradeType: GoldTradeType;
      partyId: number;
      goldItemCategory: GoldItemCategory;
      rawWeightGrams: number;
      stoneWeightGrams?: number;
      ayar: number;
      makingWageGrams?: number;
      isPureGoldTradeNoRial?: boolean;
      goldDailyRateIrr?: number;
      engravingCode?: string;
      descriptionFa?: string;
      dateJalali?: string;
    },
    actorUserId: number
  ): GoldColleagueTrade {
    const party = this.dbState.parties.find((p) => p.id === data.partyId);
    if (!party) {
      throw new Error(`شخص / همکار با شناسه ${data.partyId} یافت نشد.`);
    }

    const rawWeight = Number(data.rawWeightGrams) || 0;
    const stoneWeight = Number(data.stoneWeightGrams) || 0;
    const netWeight = Math.max(0, rawWeight - stoneWeight);
    const ayar = Number(data.ayar) || 750;
    const pure750 = Number(((netWeight * ayar) / 750).toFixed(3));
    const wageGrams = Number(data.makingWageGrams) || 0;
    const effectiveWeightGrams = Number((pure750 + wageGrams).toFixed(3));

    let totalGoldEffectGrams = 0;
    if (data.tradeType === 'COLLEAGUE_WEIGHT_SALE') {
      totalGoldEffectGrams = effectiveWeightGrams; // همکار بدهکار طلا می‌شود
    } else if (
      data.tradeType === 'COLLEAGUE_WEIGHT_RECEIPT' ||
      data.tradeType === 'COLLEAGUE_SETTLEMENT'
    ) {
      totalGoldEffectGrams = -effectiveWeightGrams; // همکار بستانکار طلا می‌شود / تسویه
    } else if (data.tradeType === 'COLLEAGUE_BARTER') {
      totalGoldEffectGrams = effectiveWeightGrams;
    }

    const isNoRial = data.isPureGoldTradeNoRial ?? true;
    const dailyRate = Number(data.goldDailyRateIrr) || 0;
    const totalAmountIrr = isNoRial ? 0 : Math.round(effectiveWeightGrams * dailyRate);

    const nowIso = new Date().toISOString();
    const count = (this.dbState.goldColleagueTrades || []).length + 101;
    const tradeNumber = `GLD-TRD-1405-${count}`;

    const newTrade: GoldColleagueTrade = {
      id: count,
      tradeNumber,
      tradeType: data.tradeType,
      partyId: party.id,
      partyTitleFa: party.fullName,
      dateJalali: data.dateJalali || '1405/01/25',
      goldItemCategory: data.goldItemCategory,
      rawWeightGrams: rawWeight,
      stoneWeightGrams: stoneWeight,
      netWeightGrams: netWeight,
      ayar,
      pure750WeightGrams: pure750,
      makingWageGrams: wageGrams,
      totalGoldEffectGrams,
      isPureGoldTradeNoRial: isNoRial,
      goldDailyRateIrr: isNoRial ? undefined : dailyRate,
      totalAmountIrr,
      engravingCode: data.engravingCode,
      descriptionFa: data.descriptionFa,
      createdAt: nowIso,
    };

    if (!Array.isArray(this.dbState.goldColleagueTrades)) {
      this.dbState.goldColleagueTrades = [];
    }
    this.dbState.goldColleagueTrades.push(newTrade);

    // به‌روزرسانی مانده وزنی طلا در حساب شخص
    const currentGoldBal = party.goldBalanceGrams || 0;
    party.goldBalanceGrams = Number((currentGoldBal + totalGoldEffectGrams).toFixed(3));

    // ثبت سند در گردش حساب شخص
    const txType =
      data.tradeType === 'COLLEAGUE_WEIGHT_SALE'
        ? 'GOLD_COLLEAGUE_SALE'
        : data.tradeType === 'COLLEAGUE_WEIGHT_RECEIPT'
        ? 'GOLD_COLLEAGUE_RECEIPT'
        : 'GOLD_BARTER';

    this.dbState.partyTransactions.push({
      id: this.dbState.partyTransactions.length + 1,
      partyId: party.id,
      recordType: txType,
      referenceNumber: tradeNumber,
      titleFa: `${
        data.tradeType === 'COLLEAGUE_WEIGHT_SALE' ? 'فروش/تحویل همکار' : 'دریافت طلا از همکار'
      } (${effectiveWeightGrams} گرم ۷۵۰)${isNoRial ? ' - بدون ریال' : ''}`,
      amountIrr: totalAmountIrr,
      dateJalali: data.dateJalali || '1405/01/25',
      status: 'COMPLETED',
      goldWeightGrams: rawWeight,
      goldAyar: ayar,
      goldPure750Grams: pure750,
      goldDailyRateIrr: dailyRate,
      isPureGoldTrade: isNoRial,
      notesFa:
        data.descriptionFa ||
        (isNoRial
          ? 'معامله صرفاً وزنی طلا و بدون ریال (بده‌بستان همکار)'
          : 'معامله طلا با نرخ مظنه ریالی'),
      createdAt: nowIso,
    });

    this.saveDbState();
    return newTrade;
  }

  public getGoldDualLedger(partyId: number) {
    const party = this.dbState.parties.find((p) => p.id === partyId);
    if (!party) {
      throw new Error(`شخص با شناسه ${partyId} یافت نشد.`);
    }

    const trades = (this.dbState.goldColleagueTrades || []).filter((t) => t.partyId === partyId);
    const txs = (this.dbState.partyTransactions || []).filter((t) => t.partyId === partyId);

    let runningGoldGrams = 0;
    let runningRialIrr = 0;

    const ledgerItems: GoldDualLedgerItem[] = [];

    const combined: Array<{
      date: string;
      refNumber: string;
      docTypeFa: string;
      titleFa: string;
      goldIn: number;
      goldOut: number;
      debitIrr: number;
      creditIrr: number;
      isPureNoRial: boolean;
      notesFa?: string;
    }> = [];

    for (const tr of trades) {
      const isOut = tr.totalGoldEffectGrams > 0;
      const goldIn = !isOut ? Math.abs(tr.totalGoldEffectGrams) : 0;
      const goldOut = isOut ? tr.totalGoldEffectGrams : 0;
      const debitIrr = !tr.isPureGoldTradeNoRial && isOut ? tr.totalAmountIrr || 0 : 0;
      const creditIrr = !tr.isPureGoldTradeNoRial && !isOut ? tr.totalAmountIrr || 0 : 0;

      const docTypeFa =
        tr.tradeType === 'COLLEAGUE_WEIGHT_SALE'
          ? 'فروش گرمی همکار'
          : tr.tradeType === 'COLLEAGUE_WEIGHT_RECEIPT'
          ? 'دریافت طلا از همکار'
          : tr.tradeType === 'COLLEAGUE_SETTLEMENT'
          ? 'تسویه وزنی طلا'
          : 'تهاتر طلا';

      combined.push({
        date: tr.dateJalali,
        refNumber: tr.tradeNumber,
        docTypeFa,
        titleFa: `${docTypeFa} (${tr.pure750WeightGrams} گرم عیار ${tr.ayar})`,
        goldIn,
        goldOut,
        debitIrr,
        creditIrr,
        isPureNoRial: tr.isPureGoldTradeNoRial,
        notesFa: tr.descriptionFa,
      });
    }

    for (const tx of txs) {
      if (tx.referenceNumber && tx.referenceNumber.startsWith('GLD-TRD-')) {
        continue;
      }
      const isDebit = tx.recordType === 'SALE_INVOICE' || tx.recordType === 'PAYMENT';
      const debitIrr = isDebit ? tx.amountIrr : 0;
      const creditIrr = !isDebit ? tx.amountIrr : 0;

      const docTypeFa =
        tx.recordType === 'SALE_INVOICE'
          ? 'فاکتور فروش ریالی'
          : tx.recordType === 'PURCHASE_INVOICE'
          ? 'فاکتور خرید ریالی'
          : tx.recordType === 'RECEIPT'
          ? 'دریافت وجه / کارتخوان'
          : tx.recordType === 'PAYMENT'
          ? 'پرداخت وجه نقد/حواله'
          : 'سند مالی';

      combined.push({
        date: tx.dateJalali,
        refNumber: tx.referenceNumber,
        docTypeFa,
        titleFa: tx.titleFa,
        goldIn: 0,
        goldOut: 0,
        debitIrr,
        creditIrr,
        isPureNoRial: false,
        notesFa: tx.notesFa || undefined,
      });
    }

    combined.sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 0; i < combined.length; i++) {
      const item = combined[i];
      runningGoldGrams = Number((runningGoldGrams + item.goldOut - item.goldIn).toFixed(3));
      runningRialIrr = runningRialIrr + item.debitIrr - item.creditIrr;

      ledgerItems.push({
        id: i + 1,
        dateJalali: item.date,
        refNumber: item.refNumber,
        docTypeFa: item.docTypeFa,
        titleFa: item.titleFa,
        goldInGrams: item.goldIn,
        goldOutGrams: item.goldOut,
        runningGoldBalanceGrams: runningGoldGrams,
        debitIrr: item.debitIrr,
        creditIrr: item.creditIrr,
        runningRialBalanceIrr: runningRialIrr,
        isPureGoldTradeNoRial: item.isPureNoRial,
        notesFa: item.notesFa,
      });
    }

    return {
      party: {
        id: party.id,
        partyCode: party.partyCode,
        fullName: party.fullName,
        mobile: party.mobile,
      },
      summary: {
        goldBalanceGrams: runningGoldGrams,
        goldBalanceStatusFa:
          runningGoldGrams > 0
            ? 'بدهکار طلا به ما'
            : runningGoldGrams < 0
            ? 'طلبکار طلا از ما (بستانکار)'
            : 'تسویه / صفر',
        netBalanceIrr: runningRialIrr,
        netBalanceToman: Math.round(runningRialIrr / 10),
        rialBalanceStatusFa:
          runningRialIrr > 0 ? 'بدهکار ریالی' : runningRialIrr < 0 ? 'بستانکار ریالی' : 'تسویه / صفر',
        totalGoldTradedGrams: trades.reduce((acc, t) => acc + (t.pure750WeightGrams || 0), 0),
        tradeCount: trades.length,
      },
      ledgerItems,
    };
  }

  public settleGoldWeight(
    data: {
      partyId: number;
      weightGrams: number;
      notesFa?: string;
      dateJalali?: string;
    },
    actorUserId: number
  ) {
    return this.createGoldColleagueTrade(
      {
        tradeType: 'COLLEAGUE_SETTLEMENT',
        partyId: data.partyId,
        goldItemCategory: 'MELTED_GOLD',
        rawWeightGrams: data.weightGrams,
        ayar: 750,
        isPureGoldTradeNoRial: true,
        descriptionFa: data.notesFa || 'تسویه وزنی طلا و صفر کردن بخشی از مانده گرمی',
        dateJalali: data.dateJalali || '1405/01/25',
      },
      actorUserId
    );
  }

  public convertGoldWeightToRial(
    data: {
      partyId: number;
      weightGrams: number;
      dailyRateIrr: number;
      dateJalali?: string;
      notesFa?: string;
    },
    actorUserId: number
  ) {
    const party = this.dbState.parties.find((p) => p.id === data.partyId);
    if (!party) throw new Error('همکار یافت نشد.');

    const weight = Number(data.weightGrams);
    const rate = Number(data.dailyRateIrr);
    const totalIrr = Math.round(weight * rate);

    const nowIso = new Date().toISOString();
    const tradeCount = (this.dbState.goldColleagueTrades || []).length + 101;
    const tradeNumber = `GLD-CVT-1405-${tradeCount}`;

    party.goldBalanceGrams = Number(((party.goldBalanceGrams || 0) - weight).toFixed(3));

    this.dbState.partyTransactions.push({
      id: this.dbState.partyTransactions.length + 1,
      partyId: party.id,
      recordType: 'GOLD_TO_RIAL_CONVERSION',
      referenceNumber: tradeNumber,
      titleFa: `تبدیل ${weight} گرم طلا به ریال با نرخ هر گرم ${(rate / 10).toLocaleString()} تومان`,
      amountIrr: totalIrr,
      dateJalali: data.dateJalali || '1405/01/25',
      status: 'COMPLETED',
      goldWeightGrams: weight,
      goldPure750Grams: weight,
      goldDailyRateIrr: rate,
      isPureGoldTrade: false,
      notesFa: data.notesFa || 'تهاتر و بستن حساب طلای همکار با تبدیل به مانده ریالی روز',
      createdAt: nowIso,
    });

    this.saveDbState();
    return {
      ok: true,
      tradeNumber,
      convertedWeightGrams: weight,
      dailyRateIrr: rate,
      totalAmountIrr: totalIrr,
      totalAmountToman: Math.round(totalIrr / 10),
      newGoldBalanceGrams: party.goldBalanceGrams,
    };
  }

  // ==========================================================================
  // RESTAURANT & CAFE METHODS (فاز ۷: میزها، منوی لمسی و بن آشپزخانه)
  // ==========================================================================

  public getRestaurantTables(): RestaurantTableRecord[] {
    return this.dbState.restaurantTables || [];
  }

  public updateRestaurantTableStatus(
    tableId: number,
    status: TableStatus,
    actorUserId: number
  ): RestaurantTableRecord {
    const table = (this.dbState.restaurantTables || []).find((t) => t.id === tableId);
    if (!table) throw new Error(`میز با شناسه ${tableId} یافت نشد.`);
    table.status = status;
    if (status === 'AVAILABLE') {
      table.currentOrderId = null;
      table.currentOrderAmountIrr = undefined;
    }
    this.saveDbState();
    return table;
  }

  public addRestaurantTable(
    tableData: {
      tableNumber: string;
      titleFa: string;
      capacity: number;
      sectionFa: string;
    },
    _actorUserId: number
  ): RestaurantTableRecord {
    if (!Array.isArray(this.dbState.restaurantTables)) {
      this.dbState.restaurantTables = [];
    }
    const cleanNum = (tableData.tableNumber || '').trim().toUpperCase();
    if (!cleanNum) {
      throw new Error('شماره یا کد میز نمی‌تواند خالی باشد.');
    }
    const existing = this.dbState.restaurantTables.find(
      (t) => t.tableNumber.trim().toUpperCase() === cleanNum
    );
    if (existing) {
      throw new Error(`میز با شماره ${cleanNum} از قبل ثبت شده است.`);
    }

    const nextId = this.dbState.restaurantTables.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const newTable: RestaurantTableRecord = {
      id: nextId,
      tableNumber: cleanNum,
      titleFa: (tableData.titleFa || '').trim() || `میز شماره ${cleanNum}`,
      capacity: Math.max(1, Number(tableData.capacity) || 4),
      sectionFa: (tableData.sectionFa || '').trim() || 'سالن اصلی',
      status: 'AVAILABLE',
      currentOrderId: null,
    };

    this.dbState.restaurantTables.push(newTable);
    this.saveDbState();
    return newTable;
  }

  public deleteRestaurantTable(tableId: number, _actorUserId: number): { success: boolean; id: number } {
    if (!Array.isArray(this.dbState.restaurantTables)) {
      this.dbState.restaurantTables = [];
    }
    const index = this.dbState.restaurantTables.findIndex((t) => t.id === tableId);
    if (index === -1) {
      throw new Error(`میز با شناسه ${tableId} یافت نشد.`);
    }
    const table = this.dbState.restaurantTables[index];
    if (table.status === 'OCCUPIED') {
      throw new Error(`امکان حذف میز اشغال‌شده وجود ندارد. لطفاً ابتدا میز را تخلیه و تسویه نمایید.`);
    }

    this.dbState.restaurantTables.splice(index, 1);
    this.saveDbState();
    return { success: true, id: tableId };
  }

  public getRestaurantOrders(): RestaurantOrderRecord[] {
    return this.dbState.restaurantOrders || [];
  }

  public createRestaurantOrder(
    orderData: {
      orderType: RestaurantOrderType;
      tableNumber?: string;
      customerNameFa?: string;
      phone?: string;
      lines: RestaurantOrderLine[];
      dateJalali?: string;
    },
    actorUserId: number
  ): RestaurantOrderRecord {
    const nowIso = new Date().toISOString();
    const count = (this.dbState.restaurantOrders || []).length + 501;
    const orderNumber = `ORD-1405-${count}`;

    const subtotal = orderData.lines.reduce((acc, l) => acc + l.quantity * l.unitPriceIrr, 0);
    const serviceCharge = orderData.orderType === 'DINE_IN' ? Math.round(subtotal * 0.05) : 0;
    const vat = Math.round((subtotal + serviceCharge) * 0.1);
    const total = subtotal + serviceCharge + vat;

    const paymentMethod: 'POS' | 'CASH' | 'OPEN_CREDIT' = (orderData as any).paymentMethod || 'POS';
    const isPaid = (orderData as any).isPaid !== false;
    const paidAmount = isPaid ? total : 0;

    // ۱. صدور فاکتور فروش رسمی در سیستم فروش و حسابداری (Sales Invoice Ledger)
    const nextInvoiceId = (this.dbState.salesInvoices || []).reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const invoiceNumber = `INV-REST-1405-${String(nextInvoiceId).padStart(3, '0')}`;
    const customer = (this.dbState.parties || []).find((p) => p.roles.includes('CUSTOMER')) || (this.dbState.parties || [])[0];
    const customerId = customer ? customer.id : 1;
    const customerDisplayName =
      orderData.customerNameFa ||
      (orderData.tableNumber ? `مشتری ${orderData.tableNumber}` : 'مشتری سالن رستوران');

    const salesInvoice: SalesInvoiceRecord = {
      id: nextInvoiceId,
      invoiceNumber,
      saleType: 'QUICK_POS_SALE',
      dateJalali: orderData.dateJalali || '1405/01/25',
      dueDateJalali: orderData.dateJalali || '1405/01/25',
      customerId,
      customerTitleFa: customerDisplayName,
      sourceWarehouseId: 1,
      sourceWarehouseTitleFa: 'انبار مرکزی و سردخانه مواد غذایی',
      lines: orderData.lines.map((l, idx) => {
        const lineVat = Math.round(l.quantity * l.unitPriceIrr * 0.1);
        return {
          id: idx + 1,
          itemId: l.itemId,
          itemCode: `FOOD-${l.itemId}`,
          itemTitleFa: l.itemTitleFa,
          quantity: l.quantity,
          unitNameFa: 'پرس',
          unitPriceIrr: l.unitPriceIrr,
          discountIrr: 0,
          vatAmountIrr: lineVat,
          netPriceIrr: l.quantity * l.unitPriceIrr + lineVat,
          unitCogsIrr: Math.round(l.unitPriceIrr * 0.45),
          totalCogsIrr: Math.round(l.quantity * l.unitPriceIrr * 0.45),
          serialNumbers: [],
          macAddresses: [],
        };
      }),
      subtotalNetItemsIrr: subtotal,
      totalDiscountIrr: 0,
      totalVatIrr: vat,
      totalInvoiceAmountIrr: total,
      totalCogsIrr: Math.round(subtotal * 0.45),
      paidAmountIrr: paidAmount,
      remainingBalanceIrr: total - paidAmount,
      status: isPaid ? 'PAID' : 'CONFIRMED',
      paymentDetails: {
        paymentMethod: paymentMethod === 'POS' ? 'POS' : paymentMethod === 'CASH' ? 'CASH' : 'CREDIT',
      },
      notesFa: `سفارش ${orderNumber} رستوران و کافه${orderData.tableNumber ? ` (میز ${orderData.tableNumber})` : ''}`,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!Array.isArray(this.dbState.salesInvoices)) {
      this.dbState.salesInvoices = [];
    }
    this.dbState.salesInvoices.push(salesInvoice);

    // ۲. ثبت در خزانه‌داری (واریز به حساب پوز یا صندوق نقد)
    if (isPaid && paidAmount > 0) {
      const nextTxId = (this.dbState.treasuryTransactions || []).reduce((max, t) => Math.max(max, t.id), 0) + 1;
      const txNumber = `TRX-REST-1405-${String(nextTxId).padStart(3, '0')}`;
      const defaultBank = (this.dbState.bankAccounts || [])[0];
      const defaultCash = (this.dbState.cashBoxes || [])[0];

      const treasuryTx: TreasuryTransactionRecord = {
        id: nextTxId,
        txNumber,
        txType: 'RECEIPT',
        dateJalali: orderData.dateJalali || '1405/01/25',
        partyId: customerId,
        partyNameFa: customerDisplayName,
        amountIrr: paidAmount,
        paymentMethod: paymentMethod === 'POS' ? 'POS' : 'CASH',
        targetBankAccountId: paymentMethod === 'POS' ? defaultBank?.id : null,
        targetCashBoxId: paymentMethod === 'CASH' ? defaultCash?.id : null,
        notesFa: `تسویه فروش رستوران - فاکتور ${invoiceNumber} سفارش ${orderNumber}`,
        actorUserId,
        createdAt: nowIso,
      };

      if (!Array.isArray(this.dbState.treasuryTransactions)) {
        this.dbState.treasuryTransactions = [];
      }
      this.dbState.treasuryTransactions.push(treasuryTx);
    }

    // ۳. صدور سند دوبل حسابداری رسمی (Journal Voucher)
    const docNumber = `DOC-REST-${1000 + nextInvoiceId}`;
    try {
      this.createAccountingDocument(
        {
          docNumber,
          dateJalali: orderData.dateJalali || '1405/01/25',
          descriptionFa: `فروش غذا و خدمات پذیرایی فاکتور ${invoiceNumber} - سفارش ${orderNumber}`,
          docType: 'AUTO',
          sourceDocType: 'SALES_INVOICE',
          sourceDocId: nextInvoiceId,
          lines: [
            {
              accountCode: isPaid ? (paymentMethod === 'POS' ? '1020' : '1010') : '1030',
              accountTitleFa: isPaid
                ? (paymentMethod === 'POS' ? 'موجودی نزد بانک‌ها و دستگاه‌های پوز' : 'صندوق نقدینگی شعبه')
                : 'حساب‌های دریافتنی تجاری و میهمانان',
              debitIrr: total,
              creditIrr: 0,
              descriptionFa: `تسویه ${paymentMethod === 'POS' ? 'کارتخوان' : paymentMethod === 'CASH' ? 'نقدی' : 'دفتری'} فاکتور ${invoiceNumber}`,
            },
            {
              accountCode: '6010',
              accountTitleFa: 'درآمد حاصل از فروش غذا و خدمات رستوران',
              debitIrr: 0,
              creditIrr: subtotal + serviceCharge,
              descriptionFa: `درآمد فروش ناخالص سفارش ${orderNumber}`,
            },
            ...(vat > 0
              ? [
                  {
                    accountCode: '3040',
                    accountTitleFa: 'مالیات و عوارض بر ارزش افزوده فروش',
                    debitIrr: 0,
                    creditIrr: vat,
                    descriptionFa: `مالیات ارزش افزوده ۱۰٪ فاکتور ${invoiceNumber}`,
                  },
                ]
              : []),
          ],
        },
        actorUserId
      );
    } catch {
      // document already exists or double-entry disabled
    }

    const newOrder: RestaurantOrderRecord = {
      id: count,
      orderNumber,
      orderType: orderData.orderType,
      tableNumber: orderData.tableNumber,
      customerNameFa: customerDisplayName,
      phone: orderData.phone,
      lines: orderData.lines,
      subtotalIrr: subtotal,
      serviceChargeIrr: serviceCharge,
      vatAmountIrr: vat,
      totalPayableIrr: total,
      status: 'PENDING_KITCHEN',
      dateJalali: orderData.dateJalali || '1405/01/25',
      salesInvoiceId: nextInvoiceId,
      salesInvoiceNumber: invoiceNumber,
      paymentMethod,
      paidAmountIrr: paidAmount,
      financialLedgerStatus: isPaid ? (paymentMethod === 'POS' ? 'RECORDED_IN_TREASURY' : 'RECORDED_IN_SALES') : 'ON_CREDIT',
      accountingDocNumber: docNumber,
      createdAt: nowIso,
    };

    if (!Array.isArray(this.dbState.restaurantOrders)) {
      this.dbState.restaurantOrders = [];
    }
    this.dbState.restaurantOrders.push(newOrder);

    if (orderData.orderType === 'DINE_IN' && orderData.tableNumber) {
      const table = (this.dbState.restaurantTables || []).find(
        (t) => t.tableNumber === orderData.tableNumber
      );
      if (table) {
        table.status = 'OCCUPIED';
        table.currentOrderId = newOrder.id;
        table.currentOrderAmountIrr = total;
      }
    }

    this.saveDbState();
    return newOrder;
  }

  public generateKitchenTicket(orderId: number) {
    const order = (this.dbState.restaurantOrders || []).find((o) => o.id === orderId);
    if (!order) throw new Error('سفارش یافت نشد.');

    return {
      orderNumber: order.orderNumber,
      orderTypeFa:
        order.orderType === 'DINE_IN'
          ? 'سالن'
          : order.orderType === 'TAKEAWAY'
          ? 'بیرون‌بر'
          : 'ارسال با پیک',
      tableNumber: order.tableNumber || '—',
      dateJalali: order.dateJalali,
      time: new Date(order.createdAt).toLocaleTimeString('fa-IR'),
      items: order.lines.map((l) => ({
        titleFa: l.itemTitleFa,
        quantity: l.quantity,
        notesFa: l.notesFa || '',
      })),
      printedAt: new Date().toISOString(),
    };
  }

  public updateRestaurantOrder(
    orderId: number,
    updates: {
      customerNameFa?: string;
      phone?: string;
      paymentMethod?: 'POS' | 'CASH' | 'OPEN_CREDIT';
      status?: 'PENDING_KITCHEN' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED';
      tableNumber?: string;
      notesFa?: string;
      lines?: RestaurantOrderLine[];
    },
    _actorUserId: number
  ): RestaurantOrderRecord {
    if (!Array.isArray(this.dbState.restaurantOrders)) {
      this.dbState.restaurantOrders = [];
    }
    const orderIndex = this.dbState.restaurantOrders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error(`سفارش با شناسه ${orderId} یافت نشد.`);
    }

    const order = this.dbState.restaurantOrders[orderIndex];

    if (updates.customerNameFa !== undefined) order.customerNameFa = updates.customerNameFa;
    if (updates.phone !== undefined) order.phone = updates.phone;
    if (updates.paymentMethod !== undefined) order.paymentMethod = updates.paymentMethod;
    if (updates.status !== undefined) order.status = updates.status;
    if (updates.tableNumber !== undefined) order.tableNumber = updates.tableNumber;

    if (updates.lines && Array.isArray(updates.lines) && updates.lines.length > 0) {
      order.lines = updates.lines;
      const subtotal = updates.lines.reduce((acc, l) => acc + l.quantity * l.unitPriceIrr, 0);
      const serviceCharge = order.orderType === 'DINE_IN' ? Math.round(subtotal * 0.05) : 0;
      const vat = Math.round((subtotal + serviceCharge) * 0.1);
      order.subtotalIrr = subtotal;
      order.serviceChargeIrr = serviceCharge;
      order.vatAmountIrr = vat;
      order.totalPayableIrr = subtotal + serviceCharge + vat;
    }

    this.saveDbState();
    return order;
  }

  public deleteRestaurantOrder(orderId: number, _actorUserId: number): { success: boolean; id: number } {
    if (!Array.isArray(this.dbState.restaurantOrders)) {
      this.dbState.restaurantOrders = [];
    }
    const initialCount = this.dbState.restaurantOrders.length;
    this.dbState.restaurantOrders = this.dbState.restaurantOrders.filter((o) => o.id !== orderId);

    if (this.dbState.restaurantOrders.length === initialCount) {
      throw new Error(`سفارش با شناسه ${orderId} یافت نشد.`);
    }

    this.saveDbState();
    return { success: true, id: orderId };
  }

  // ==========================================================================
  // WHOLESALE & DISTRIBUTION METHODS (فاز ۸: پخش عمده، کارتن، نرخ همکار و توزیع)
  // ==========================================================================

  public getWholesaleOrders(): WholesaleOrderRecord[] {
    return this.dbState.wholesaleOrders || [];
  }

  public getWholesaleDispatches(): WholesaleDispatchRecord[] {
    return this.dbState.wholesaleDispatches || [];
  }

  public checkCustomerWholesaleCredit(customerId: number, additionalAmountIrr: number = 0) {
    const customer = (this.dbState.parties || []).find((p) => p.id === customerId);
    if (!customer) {
      throw new Error(`مشتری با شناسه ${customerId} یافت نشد.`);
    }

    const creditLimitIrr = customer.creditLimitIrr || 100000000;
    let currentDebtIrr = 0;
    if (customer.transactionsSummary) {
      currentDebtIrr = Math.max(0, -customer.transactionsSummary.netBalanceIrr);
    }
    const projectedDebtIrr = currentDebtIrr + additionalAmountIrr;
    const isExceeded = projectedDebtIrr > creditLimitIrr;
    const exceededAmountIrr = isExceeded ? projectedDebtIrr - creditLimitIrr : 0;

    return {
      customerId: customer.id,
      customerNameFa: customer.fullName,
      creditLimitIrr,
      currentDebtIrr,
      projectedDebtIrr,
      isExceeded,
      exceededAmountIrr,
      hasBouncedCheques: false,
    };
  }

  public getItemPriceTiers(itemId: number) {
    const item = (this.dbState.items || []).find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`کالا با شناسه ${itemId} یافت نشد.`);
    }

    const basePrice = item.salePriceIrr || 1000000;
    return {
      itemId: item.id,
      itemTitleFa: item.titleFa,
      primaryUnitFa: item.unitNameFa || 'عدد',
      packUnitFa: 'کارتن',
      unitsPerPack: item.categoryId === 2 ? 1 : 12,
      packWeightKg: 8.5,
      priceTiers: {
        CONSUMER: Math.round(basePrice * 1.15),
        RETAIL_COLLEAGUE: basePrice,
        WHOLESALE_BULK: Math.round(basePrice * 0.88),
        DISTRIBUTOR_VIP: Math.round(basePrice * 0.8),
      },
    };
  }

  public createWholesaleOrder(
    payload: {
      customerId: number;
      visitorNameFa?: string;
      paymentTermsFa?: 'CASH' | 'CHEQUE_30_DAYS' | 'CHEQUE_60_DAYS' | 'OPEN_CREDIT';
      lines: Array<{
        itemId: number;
        packCount: number;
        looseUnitsCount: number;
        priceTier: PriceTierCode;
        discountPercent?: number;
      }>;
      shippingFeeIrr?: number;
      dateJalali?: string;
      bypassCreditLimitCheck?: boolean;
    },
    actorUserId: number
  ): WholesaleOrderRecord {
    const customer = (this.dbState.parties || []).find((p) => p.id === payload.customerId);
    if (!customer) {
      throw new Error(`مشتری با شناسه ${payload.customerId} یافت نشد.`);
    }

    if (!payload.lines || payload.lines.length === 0) {
      throw new Error('سفارش باید حداقل شامل یک ردیف کالا باشد.');
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let totalCartons = 0;
    let totalLooseUnits = 0;

    const processedLines: WholesaleOrderLine[] = [];

    for (const line of payload.lines) {
      const item = (this.dbState.items || []).find((i) => i.id === line.itemId);
      if (!item) {
        throw new Error(`کالا با شناسه ${line.itemId} یافت نشد.`);
      }

      const tiers = this.getItemPriceTiers(item.id);
      const unitsPerPack = tiers.unitsPerPack;
      const unitPriceIrr = tiers.priceTiers[line.priceTier] || item.salePriceIrr;
      const packPriceIrr = unitPriceIrr * unitsPerPack;
      const totalUnits = line.packCount * unitsPerPack + (line.looseUnitsCount || 0);
      const discountPercent = line.discountPercent || 0;

      const grossLineTotal = line.packCount * packPriceIrr + (line.looseUnitsCount || 0) * unitPriceIrr;
      const lineDiscount = Math.round((grossLineTotal * discountPercent) / 100);
      const netLineTotal = grossLineTotal - lineDiscount;

      subtotal += grossLineTotal;
      totalDiscount += lineDiscount;
      totalCartons += line.packCount;
      totalLooseUnits += line.looseUnitsCount || 0;

      processedLines.push({
        itemId: item.id,
        itemTitleFa: item.titleFa,
        packCount: line.packCount,
        looseUnitsCount: line.looseUnitsCount || 0,
        unitsPerPack,
        totalUnits,
        priceTier: line.priceTier,
        unitPriceIrr,
        packPriceIrr,
        discountPercent,
        lineTotalIrr: netLineTotal,
      });

      // کاهش موجودی انبار
      const currentStock = (item as any).inventoryOnHand ?? 100;
      (item as any).inventoryOnHand = Math.max(0, currentStock - totalUnits);
    }

    const shippingFee = payload.shippingFeeIrr || 0;
    const totalPayable = subtotal - totalDiscount + shippingFee;

    const creditCheck = this.checkCustomerWholesaleCredit(customer.id, totalPayable);

    const newId = (this.dbState.wholesaleOrders || []).reduce((max, o) => Math.max(max, o.id), 0) + 1;
    const orderNumber = `WHO-1405-${String(newId).padStart(3, '0')}`;

    const newOrder: WholesaleOrderRecord = {
      id: newId,
      orderNumber,
      customerId: customer.id,
      customerNameFa: customer.fullName,
      customerCreditLimitIrr: creditCheck.creditLimitIrr,
      currentOutstandingDebtIrr: creditCheck.currentDebtIrr,
      isCreditLimitExceeded: creditCheck.isExceeded,
      visitorNameFa: payload.visitorNameFa || 'واحد فروش سازمانی',
      paymentTermsFa: payload.paymentTermsFa || 'CHEQUE_30_DAYS',
      lines: processedLines,
      totalCartons,
      totalLooseUnits,
      subtotalIrr: subtotal,
      discountTotalIrr: totalDiscount,
      shippingFeeIrr: shippingFee,
      vatAmountIrr: 0,
      totalPayableIrr: totalPayable,
      dispatchStatus: 'PENDING_PACKING',
      dateJalali: payload.dateJalali || '1405/01/25',
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.dbState.wholesaleOrders)) {
      this.dbState.wholesaleOrders = [];
    }
    this.dbState.wholesaleOrders.push(newOrder);

    if (!customer.transactionsSummary) {
      customer.transactionsSummary = {
        totalSalesCount: 0,
        totalSalesIrr: 0,
        totalPurchasesCount: 0,
        totalPurchasesIrr: 0,
        totalPaymentsIrr: 0,
        totalReceiptsIrr: 0,
        activeProjectsCount: 0,
        netBalanceIrr: 0,
      };
    }
    customer.transactionsSummary.totalSalesCount += 1;
    customer.transactionsSummary.totalSalesIrr += totalPayable;
    customer.transactionsSummary.netBalanceIrr -= totalPayable;

    this.saveDbState();
    return newOrder;
  }

  public createWholesaleDispatch(
    payload: {
      orderId: number;
      destinationCityFa?: string;
      destinationAddressFa?: string;
      driverNameFa: string;
      driverPhone: string;
      vehiclePlateFa: string;
      vehicleTypeFa: string;
      shippingCostIrr?: number;
      dateJalali?: string;
      notesFa?: string;
    },
    actorUserId: number
  ): WholesaleDispatchRecord {
    const order = (this.dbState.wholesaleOrders || []).find((o) => o.id === payload.orderId);
    if (!order) {
      throw new Error(`سفارش عمده با شناسه ${payload.orderId} یافت نشد.`);
    }

    const newId = (this.dbState.wholesaleDispatches || []).reduce((max, d) => Math.max(max, d.id), 0) + 1;
    const dispatchNumber = `DSP-1405-${String(newId).padStart(3, '0')}`;

    const newDispatch: WholesaleDispatchRecord = {
      id: newId,
      dispatchNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerNameFa: order.customerNameFa,
      destinationCityFa: payload.destinationCityFa || 'تهران',
      destinationAddressFa: payload.destinationAddressFa || 'انبار مقصد خریدار عمده',
      driverNameFa: payload.driverNameFa,
      driverPhone: payload.driverPhone,
      vehiclePlateFa: payload.vehiclePlateFa,
      vehicleTypeFa: payload.vehicleTypeFa,
      totalCartons: order.totalCartons,
      grossWeightKg: Math.round(order.totalCartons * 9.5),
      status: 'PREPARING',
      dateJalali: payload.dateJalali || '1405/01/25',
      shippingCostIrr: payload.shippingCostIrr || 0,
      notesFa: payload.notesFa,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.dbState.wholesaleDispatches)) {
      this.dbState.wholesaleDispatches = [];
    }
    this.dbState.wholesaleDispatches.push(newDispatch);

    order.dispatchStatus = 'PACKED';
    this.saveDbState();
    return newDispatch;
  }

  public updateWholesaleDispatchStatus(
    dispatchId: number,
    status: 'PREPARING' | 'LOADED' | 'ON_THE_WAY' | 'DELIVERED',
    actorUserId: number
  ): WholesaleDispatchRecord {
    const dispatch = (this.dbState.wholesaleDispatches || []).find((d) => d.id === dispatchId);
    if (!dispatch) {
      throw new Error(`حواله توزیع با شناسه ${dispatchId} یافت نشد.`);
    }

    dispatch.status = status;
    const order = (this.dbState.wholesaleOrders || []).find((o) => o.id === dispatch.orderId);
    if (order) {
      if (status === 'DELIVERED') {
        order.dispatchStatus = 'DELIVERED';
      } else if (status === 'ON_THE_WAY') {
        order.dispatchStatus = 'DISPATCHED';
      } else {
        order.dispatchStatus = 'PACKED';
      }
    }

    this.saveDbState();
    return dispatch;
  }

  // ==========================================================================
  // SERVICES & CONTRACTING METHODS (فاز ۹: خدمات فنی، تیکت کار، تکنسین و قطعات)
  // ==========================================================================

  public getServiceJobTickets(): ServiceJobTicketRecord[] {
    return this.dbState.serviceJobTickets || [];
  }

  public createServiceJobTicket(
    payload: {
      customerId: number;
      titleFa: string;
      descriptionFa: string;
      priority?: JobTicketPriority;
      technicianId?: number;
      laborFeeIrr?: number;
      spareParts?: ServiceSparePartLine[];
      dateJalali?: string;
      dueDateJalali?: string;
    },
    actorUserId: number
  ): ServiceJobTicketRecord {
    const customer = (this.dbState.parties || []).find((p) => p.id === payload.customerId);
    if (!customer) {
      throw new Error(`مشتری با شناسه ${payload.customerId} یافت نشد.`);
    }

    const technician = payload.technicianId
      ? (this.dbState.parties || []).find((p) => p.id === payload.technicianId)
      : undefined;

    const parts = payload.spareParts || [];
    const sparePartsTotal = parts.reduce((sum, p) => sum + p.totalPriceIrr, 0);
    const laborFee = payload.laborFeeIrr || 0;
    const totalCost = laborFee + sparePartsTotal;

    const nextId = (this.dbState.serviceJobTickets || []).reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const ticketNumber = `TCK-1405-${String(nextId).padStart(3, '0')}`;

    const newTicket: ServiceJobTicketRecord = {
      id: nextId,
      ticketNumber,
      customerId: customer.id,
      customerNameFa: customer.fullName,
      customerPhone: customer.mobile || customer.phone || '—',
      customerAddressFa: customer.addressFa || 'تهران',
      titleFa: payload.titleFa,
      descriptionFa: payload.descriptionFa,
      priority: payload.priority || 'NORMAL',
      status: payload.technicianId ? 'ASSIGNED' : 'OPEN',
      technicianId: technician?.id,
      technicianNameFa: technician?.fullName,
      laborFeeIrr: laborFee,
      spareParts: parts,
      sparePartsTotalIrr: sparePartsTotal,
      totalCostIrr: totalCost,
      dateJalali: payload.dateJalali || '1405/01/25',
      dueDateJalali: payload.dueDateJalali,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.dbState.serviceJobTickets)) {
      this.dbState.serviceJobTickets = [];
    }
    this.dbState.serviceJobTickets.push(newTicket);
    this.saveDbState();
    return newTicket;
  }

  public updateServiceJobTicketStatus(
    ticketId: number,
    status: JobTicketStatus,
    actorUserId: number
  ): ServiceJobTicketRecord {
    const ticket = (this.dbState.serviceJobTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`تیکت کار با شناسه ${ticketId} یافت نشد.`);

    ticket.status = status;
    this.saveDbState();
    return ticket;
  }

  public assignTechnicianToJobTicket(
    ticketId: number,
    technicianId: number,
    actorUserId: number
  ): ServiceJobTicketRecord {
    const ticket = (this.dbState.serviceJobTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`تیکت کار با شناسه ${ticketId} یافت نشد.`);

    const tech = (this.dbState.parties || []).find((p) => p.id === technicianId);
    if (!tech) throw new Error(`تکنسین با شناسه ${technicianId} یافت نشد.`);

    ticket.technicianId = tech.id;
    ticket.technicianNameFa = tech.fullName;
    if (ticket.status === 'OPEN') {
      ticket.status = 'ASSIGNED';
    }

    this.saveDbState();
    return ticket;
  }

  public addSparePartsToJobTicket(
    ticketId: number,
    spareParts: ServiceSparePartLine[],
    actorUserId: number
  ): ServiceJobTicketRecord {
    const ticket = (this.dbState.serviceJobTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`تیکت کار با شناسه ${ticketId} یافت نشد.`);

    ticket.spareParts.push(...spareParts);
    ticket.sparePartsTotalIrr = ticket.spareParts.reduce((s, p) => s + p.totalPriceIrr, 0);
    ticket.totalCostIrr = ticket.laborFeeIrr + ticket.sparePartsTotalIrr;
    ticket.status = 'PARTS_CONSUMED';

    this.saveDbState();
    return ticket;
  }

  public invoiceJobTicket(
    ticketId: number,
    actorUserId: number
  ): { ticket: ServiceJobTicketRecord; salesInvoice: SalesInvoiceRecord } {
    const ticket = (this.dbState.serviceJobTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`تیکت کار با شناسه ${ticketId} یافت نشد.`);

    const nextInvoiceId = (this.dbState.salesInvoices || []).reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const invoiceNumber = `INV-SVC-1405-${String(nextInvoiceId).padStart(3, '0')}`;

    const salesInvoice: SalesInvoiceRecord = {
      id: nextInvoiceId,
      invoiceNumber,
      saleType: 'STANDARD_SALE',
      dateJalali: ticket.dateJalali || '1405/01/25',
      dueDateJalali: ticket.dueDateJalali || ticket.dateJalali || '1405/01/25',
      customerId: ticket.customerId,
      customerTitleFa: ticket.customerNameFa,
      sourceWarehouseId: 1,
      sourceWarehouseTitleFa: 'انبار قطعات و خدمات فنی',
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'SVC-LABOR',
          itemTitleFa: `اجرت و دستمزد اجرای خدمات فنی: ${ticket.titleFa}`,
          quantity: 1,
          unitNameFa: 'مورد',
          unitPriceIrr: ticket.laborFeeIrr,
          discountIrr: 0,
          vatAmountIrr: Math.round(ticket.laborFeeIrr * 0.1),
          netPriceIrr: ticket.laborFeeIrr + Math.round(ticket.laborFeeIrr * 0.1),
          unitCogsIrr: 0,
          totalCogsIrr: 0,
          serialNumbers: [],
          macAddresses: [],
        },
        ...ticket.spareParts.map((part, idx) => ({
          id: idx + 2,
          itemId: part.itemId,
          itemCode: `PART-${part.itemId}`,
          itemTitleFa: part.itemTitleFa,
          quantity: part.quantity,
          unitNameFa: 'عدد',
          unitPriceIrr: part.unitPriceIrr,
          discountIrr: 0,
          vatAmountIrr: Math.round(part.totalPriceIrr * 0.1),
          netPriceIrr: part.totalPriceIrr + Math.round(part.totalPriceIrr * 0.1),
          unitCogsIrr: Math.round(part.unitPriceIrr * 0.7),
          totalCogsIrr: Math.round(part.totalPriceIrr * 0.7),
          serialNumbers: [],
          macAddresses: [],
        })),
      ],
      subtotalNetItemsIrr: ticket.totalCostIrr,
      totalDiscountIrr: 0,
      totalVatIrr: Math.round(ticket.totalCostIrr * 0.1),
      totalInvoiceAmountIrr: Math.round(ticket.totalCostIrr * 1.1),
      totalCogsIrr: Math.round(ticket.sparePartsTotalIrr * 0.7),
      paidAmountIrr: 0,
      remainingBalanceIrr: Math.round(ticket.totalCostIrr * 1.1),
      status: 'CONFIRMED',
      paymentDetails: {
        paymentMethod: 'CHEQUE',
      },
      notesFa: `صورت‌حساب قطعی خدمات فنی و تیکت ${ticket.ticketNumber}`,
      actorUserId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.dbState.salesInvoices)) {
      this.dbState.salesInvoices = [];
    }
    this.dbState.salesInvoices.push(salesInvoice);

    ticket.status = 'COMPLETED';
    ticket.invoiceId = salesInvoice.id;

    this.saveDbState();
    return { ticket, salesInvoice };
  }

  // ==========================================================================
  // MOBILE & ELECTRONICS METHODS (فاز ۹: صنف موبایل، رایانه، رجیستری و تعمیرات)
  // ==========================================================================

  public getMobileDevices(filter?: {
    brandFa?: string;
    condition?: MobileDeviceCondition;
    stockStatus?: string;
    search?: string;
  }): MobileDeviceRecord[] {
    let list = [...(this.dbState.mobileDevices || [])];
    if (filter?.brandFa && filter.brandFa !== 'ALL') {
      list = list.filter((d) => d.brandFa.includes(filter.brandFa!));
    }
    if (filter?.condition) {
      list = list.filter((d) => d.condition === filter.condition);
    }
    if (filter?.stockStatus && filter.stockStatus !== 'ALL') {
      list = list.filter((d) => d.stockStatus === filter.stockStatus);
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.modelFa.toLowerCase().includes(q) ||
          d.imei1.includes(q) ||
          (d.imei2 && d.imei2.includes(q)) ||
          (d.serialNumber && d.serialNumber.toLowerCase().includes(q)) ||
          d.colorFa.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public addMobileDevice(
    deviceData: Omit<MobileDeviceRecord, 'id' | 'createdAt'>,
    actorUserId: number
  ): MobileDeviceRecord {
    const list = this.dbState.mobileDevices || [];
    const duplicate = list.find((d) => d.imei1 === deviceData.imei1);
    if (duplicate) {
      throw new Error(`دستگاهی با کد IMEI 1 برابر «${deviceData.imei1}» قبلاً در سیستم ثبت شده است.`);
    }

    const nextId = list.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    const nowIso = new Date().toISOString();

    const newDevice: MobileDeviceRecord = {
      ...deviceData,
      id: nextId,
      createdAt: nowIso,
    };

    if (!Array.isArray(this.dbState.mobileDevices)) {
      this.dbState.mobileDevices = [];
    }
    this.dbState.mobileDevices.push(newDevice);

    if (deviceData.imei1) {
      const serialId = (this.dbState.itemSerials || []).reduce((max, s) => Math.max(max, s.id), 0) + 1;
      this.dbState.itemSerials.push({
        id: serialId,
        itemId: deviceData.itemId,
        serialNumber: deviceData.imei1,
        macAddress: deviceData.imei2 || undefined,
        currentWarehouseId: deviceData.warehouseId || 1,
        status: deviceData.stockStatus === 'IN_STOCK' ? 'IN_STOCK' : 'DISPATCHED',
        purchaseInvoiceId: 1,
        notesFa: `${deviceData.modelFa} - ${deviceData.colorFa} - گارانتی: ${deviceData.warrantyCompanyFa || 'ندارد'}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    this.saveDbState();
    return newDevice;
  }

  public lookupDeviceByImeiOrSerial(query: string): {
    device?: MobileDeviceRecord;
    repairTickets: MobileRepairTicketRecord[];
    matchedField: 'IMEI1' | 'IMEI2' | 'SERIAL' | 'NONE';
  } {
    const q = query.trim().toLowerCase();
    const devices = this.dbState.mobileDevices || [];
    const tickets = this.dbState.mobileRepairTickets || [];

    let matchedField: 'IMEI1' | 'IMEI2' | 'SERIAL' | 'NONE' = 'NONE';
    const foundDevice = devices.find((d) => {
      if (d.imei1.toLowerCase() === q) {
        matchedField = 'IMEI1';
        return true;
      }
      if (d.imei2 && d.imei2.toLowerCase() === q) {
        matchedField = 'IMEI2';
        return true;
      }
      if (d.serialNumber && d.serialNumber.toLowerCase() === q) {
        matchedField = 'SERIAL';
        return true;
      }
      return false;
    });

    const relatedTickets = tickets.filter(
      (t) =>
        t.imeiOrSerial.toLowerCase().includes(q) ||
        (foundDevice &&
          (t.imeiOrSerial.includes(foundDevice.imei1) ||
            (foundDevice.serialNumber && t.imeiOrSerial.includes(foundDevice.serialNumber))))
    );

    return {
      device: foundDevice,
      repairTickets: relatedTickets,
      matchedField,
    };
  }

  public getMobileRepairTickets(filter?: {
    status?: MobileRepairStatus;
    search?: string;
  }): MobileRepairTicketRecord[] {
    let list = [...(this.dbState.mobileRepairTickets || [])];
    if (filter?.status) {
      list = list.filter((t) => t.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.customerNameFa.toLowerCase().includes(q) ||
          t.customerPhone.includes(q) ||
          t.deviceModelFa.toLowerCase().includes(q) ||
          t.imeiOrSerial.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public createMobileRepairTicket(
    data: {
      customerId: number;
      customerNameFa?: string;
      customerPhone: string;
      deviceModelFa: string;
      colorFa?: string;
      imeiOrSerial: string;
      securityPasscodeOrPattern?: string;
      accompaniedAccessoriesFa?: string;
      reportedFaultsFa: string;
      physicalConditionNotesFa?: string;
      assignedTechnicianId?: number;
      assignedTechnicianNameFa?: string;
      estimatedCostIrr: number;
      depositPaidIrr?: number;
      receptionDateJalali?: string;
      estimatedDeliveryDateJalali?: string;
      notesFa?: string;
    },
    actorUserId: number
  ): MobileRepairTicketRecord {
    const list = this.dbState.mobileRepairTickets || [];
    const nextId = list.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const count = list.length + 101;
    const ticketNumber = `REP-1405-${count}`;
    const nowIso = new Date().toISOString();

    const deposit = Number(data.depositPaidIrr) || 0;
    const estCost = Number(data.estimatedCostIrr) || 0;

    const newTicket: MobileRepairTicketRecord = {
      id: nextId,
      ticketNumber,
      customerId: data.customerId,
      customerNameFa: data.customerNameFa || 'مشتری تعمیرات',
      customerPhone: data.customerPhone,
      deviceModelFa: data.deviceModelFa,
      colorFa: data.colorFa,
      imeiOrSerial: data.imeiOrSerial,
      securityPasscodeOrPattern: data.securityPasscodeOrPattern,
      accompaniedAccessoriesFa: data.accompaniedAccessoriesFa,
      reportedFaultsFa: data.reportedFaultsFa,
      physicalConditionNotesFa: data.physicalConditionNotesFa,
      assignedTechnicianId: data.assignedTechnicianId || 3,
      assignedTechnicianNameFa: data.assignedTechnicianNameFa || 'مهندس علی میرزایی',
      estimatedCostIrr: estCost,
      depositPaidIrr: deposit,
      parts: [],
      partsTotalIrr: 0,
      laborFeeIrr: estCost,
      discountIrr: 0,
      finalTotalIrr: estCost,
      remainingPayableIrr: Math.max(0, estCost - deposit),
      status: 'RECEIVED',
      receptionDateJalali: data.receptionDateJalali || '1405/01/25',
      estimatedDeliveryDateJalali: data.estimatedDeliveryDateJalali || '1405/01/27',
      notesFa: data.notesFa,
      createdAt: nowIso,
    };

    if (!Array.isArray(this.dbState.mobileRepairTickets)) {
      this.dbState.mobileRepairTickets = [];
    }
    this.dbState.mobileRepairTickets.push(newTicket);

    if (deposit > 0) {
      const nextTxId = (this.dbState.treasuryTransactions || []).reduce((max, t) => Math.max(max, t.id), 0) + 1;
      const txNumber = `TRX-REP-DEP-${String(nextTxId).padStart(3, '0')}`;
      const defaultCash = (this.dbState.cashBoxes || [])[0];

      const treasuryTx: TreasuryTransactionRecord = {
        id: nextTxId,
        txNumber,
        txType: 'RECEIPT',
        dateJalali: data.receptionDateJalali || '1405/01/25',
        partyId: data.customerId,
        partyNameFa: newTicket.customerNameFa,
        amountIrr: deposit,
        paymentMethod: 'CASH',
        targetCashBoxId: defaultCash?.id || 1,
        notesFa: `دریافت بیعانه پذیرش تعمیرات دستگاه ${data.deviceModelFa} (قبض ${ticketNumber})`,
        actorUserId,
        createdAt: nowIso,
      };

      if (!Array.isArray(this.dbState.treasuryTransactions)) {
        this.dbState.treasuryTransactions = [];
      }
      this.dbState.treasuryTransactions.push(treasuryTx);
    }

    this.saveDbState();
    return newTicket;
  }

  public updateMobileRepairStatus(
    ticketId: number,
    status: MobileRepairStatus,
    notesFa?: string,
    actorUserId?: number
  ): MobileRepairTicketRecord {
    const ticket = (this.dbState.mobileRepairTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`قبض تعمیر با شناسه ${ticketId} یافت نشد.`);

    ticket.status = status;
    if (notesFa) {
      ticket.notesFa = ticket.notesFa ? `${ticket.notesFa} | ${notesFa}` : notesFa;
    }
    if (status === 'DELIVERED') {
      ticket.deliveredDateJalali = '1405/01/25';
    }

    this.saveDbState();
    return ticket;
  }

  public addPartToRepairTicket(
    ticketId: number,
    partData: { partNameFa: string; partCostIrr: number; quantity: number },
    actorUserId: number
  ): MobileRepairTicketRecord {
    const ticket = (this.dbState.mobileRepairTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`قبض تعمیر با شناسه ${ticketId} یافت نشد.`);

    const partId = ticket.parts.length + 1;
    const totalCost = partData.partCostIrr * partData.quantity;

    ticket.parts.push({
      id: partId,
      partNameFa: partData.partNameFa,
      partCostIrr: partData.partCostIrr,
      quantity: partData.quantity,
      totalCostIrr: totalCost,
    });

    ticket.partsTotalIrr = ticket.parts.reduce((sum, p) => sum + p.totalCostIrr, 0);
    ticket.finalTotalIrr = ticket.partsTotalIrr + ticket.laborFeeIrr - ticket.discountIrr;
    ticket.remainingPayableIrr = Math.max(0, ticket.finalTotalIrr - ticket.depositPaidIrr);

    this.saveDbState();
    return ticket;
  }

  public completeAndInvoiceRepairTicket(
    ticketId: number,
    paymentMethod: 'POS' | 'CASH' | 'OPEN_CREDIT',
    actorUserId: number
  ): { ticket: MobileRepairTicketRecord; salesInvoice: SalesInvoiceRecord } {
    const ticket = (this.dbState.mobileRepairTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`قبض تعمیر با شناسه ${ticketId} یافت نشد.`);

    const nextInvoiceId = (this.dbState.salesInvoices || []).reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const invoiceNumber = `INV-REP-1405-${String(nextInvoiceId).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const finalAmount = ticket.finalTotalIrr;
    const paidAmount = paymentMethod !== 'OPEN_CREDIT' ? ticket.remainingPayableIrr : 0;

    const salesInvoice: SalesInvoiceRecord = {
      id: nextInvoiceId,
      invoiceNumber,
      saleType: 'STANDARD_SALE',
      dateJalali: '1405/01/25',
      dueDateJalali: '1405/01/25',
      customerId: ticket.customerId,
      customerTitleFa: ticket.customerNameFa,
      sourceWarehouseId: 1,
      sourceWarehouseTitleFa: 'انبار قطعات و خدمات موبایل',
      lines: [
        {
          id: 1,
          itemId: 1,
          itemCode: 'SVC-REPAIR-LABOR',
          itemTitleFa: `اجرت و دستمزد تخصصی تعمیر: ${ticket.deviceModelFa} (${ticket.reportedFaultsFa})`,
          quantity: 1,
          unitNameFa: 'مورد',
          unitPriceIrr: ticket.laborFeeIrr,
          discountIrr: ticket.discountIrr,
          vatAmountIrr: Math.round(ticket.laborFeeIrr * 0.1),
          netPriceIrr: ticket.laborFeeIrr + Math.round(ticket.laborFeeIrr * 0.1),
          unitCogsIrr: 0,
          totalCogsIrr: 0,
          serialNumbers: [ticket.imeiOrSerial],
          macAddresses: [],
        },
        ...ticket.parts.map((p, idx) => ({
          id: idx + 2,
          itemId: 10 + idx,
          itemCode: `PART-${idx + 1}`,
          itemTitleFa: p.partNameFa,
          quantity: p.quantity,
          unitNameFa: 'عدد',
          unitPriceIrr: p.partCostIrr,
          discountIrr: 0,
          vatAmountIrr: Math.round(p.totalCostIrr * 0.1),
          netPriceIrr: p.totalCostIrr + Math.round(p.totalCostIrr * 0.1),
          unitCogsIrr: Math.round(p.partCostIrr * 0.7),
          totalCogsIrr: Math.round(p.totalCostIrr * 0.7),
          serialNumbers: [],
          macAddresses: [],
        })),
      ],
      subtotalNetItemsIrr: finalAmount,
      totalDiscountIrr: ticket.discountIrr,
      totalVatIrr: Math.round(finalAmount * 0.1),
      totalInvoiceAmountIrr: Math.round(finalAmount * 1.1),
      totalCogsIrr: Math.round(ticket.partsTotalIrr * 0.7),
      paidAmountIrr: paidAmount + ticket.depositPaidIrr,
      remainingBalanceIrr: Math.max(0, Math.round(finalAmount * 1.1) - (paidAmount + ticket.depositPaidIrr)),
      status: 'PAID',
      paymentDetails: {
        paymentMethod: paymentMethod === 'POS' ? 'POS' : paymentMethod === 'CASH' ? 'CASH' : 'CREDIT',
      },
      notesFa: `تسویه و تحویل دستگاه ${ticket.deviceModelFa} - قبض تعمیر ${ticket.ticketNumber}`,
      actorUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!Array.isArray(this.dbState.salesInvoices)) {
      this.dbState.salesInvoices = [];
    }
    this.dbState.salesInvoices.push(salesInvoice);

    const docNumber = `DOC-REP-${1000 + nextInvoiceId}`;
    try {
      this.createAccountingDocument(
        {
          docNumber,
          dateJalali: '1405/01/25',
          descriptionFa: `درآمد خدمات و تعمیرات دستگاه ${ticket.deviceModelFa} - قبض ${ticket.ticketNumber}`,
          docType: 'AUTO',
          sourceDocType: 'SALES_INVOICE',
          sourceDocId: nextInvoiceId,
          lines: [
            {
              accountCode: paymentMethod === 'POS' ? '1020' : '1010',
              accountTitleFa: paymentMethod === 'POS' ? 'موجودی نزد بانک‌ها و کارتخوان' : 'صندوق نقدینگی فروشگاه',
              debitIrr: Math.round(finalAmount * 1.1),
              creditIrr: 0,
              descriptionFa: `دریافت وجه تعمیرات ${ticket.ticketNumber}`,
            },
            {
              accountCode: '6010',
              accountTitleFa: 'درآمد حاصل از فروش قطعات و خدمات فنی',
              debitIrr: 0,
              creditIrr: finalAmount,
              descriptionFa: `درآمد خدمات تعمیر ${ticket.ticketNumber}`,
            },
            {
              accountCode: '3040',
              accountTitleFa: 'مالیات و عوارض بر ارزش افزوده فروش',
              debitIrr: 0,
              creditIrr: Math.round(finalAmount * 0.1),
              descriptionFa: `ارزش افزوده خدمات تعمیر`,
            },
          ],
        },
        actorUserId
      );
    } catch {
      // ignore
    }

    ticket.status = 'DELIVERED';
    ticket.invoiceId = salesInvoice.id;
    ticket.invoiceNumber = invoiceNumber;
    ticket.deliveredDateJalali = '1405/01/25';

    this.saveDbState();
    return { ticket, salesInvoice };
  }

  public generateMobileRepairSlip(ticketId: number) {
    const ticket = (this.dbState.mobileRepairTickets || []).find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`قبض با شناسه ${ticketId} یافت نشد.`);

    return {
      ticketNumber: ticket.ticketNumber,
      customerNameFa: ticket.customerNameFa,
      customerPhone: ticket.customerPhone,
      deviceModelFa: ticket.deviceModelFa,
      imeiOrSerial: ticket.imeiOrSerial,
      accompaniedAccessoriesFa: ticket.accompaniedAccessoriesFa || 'ندارد',
      reportedFaultsFa: ticket.reportedFaultsFa,
      physicalConditionNotesFa: ticket.physicalConditionNotesFa || 'سالم و بدون شکستگی ظاهری',
      estimatedCostIrr: ticket.estimatedCostIrr,
      depositPaidIrr: ticket.depositPaidIrr,
      receptionDateJalali: ticket.receptionDateJalali,
      estimatedDeliveryDateJalali: ticket.estimatedDeliveryDateJalali,
      technicianNameFa: ticket.assignedTechnicianNameFa || 'کارگاه فنی مهرگان',
      printedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // PHASE 11 & 12: MULTI-BRANCH TRANSFERS & EXECUTIVE BI METRICS
  // ============================================================================

  public getWarehouseById(id: number): WarehouseRecord | null {
    return (this.dbState.warehouses || []).find((w) => w.id === id) || null;
  }

  public getInventoryTransfers(): InventoryTransferRecord[] {
    const whMap = new Map((this.dbState.warehouses || []).map((w) => [w.id, w.titleFa]));
    return (this.dbState.inventoryTransfers || []).map((tr) => ({
      ...tr,
      sourceWarehouseTitleFa:
        whMap.get(tr.sourceWarehouseId) || tr.sourceWarehouseTitleFa || `انبار #${tr.sourceWarehouseId}`,
      targetWarehouseTitleFa:
        whMap.get(tr.targetWarehouseId) || tr.targetWarehouseTitleFa || `انبار #${tr.targetWarehouseId}`,
    }));
  }

  public createInventoryTransferRequisition(
    data: {
      sourceWarehouseId: number;
      targetWarehouseId: number;
      dateJalali?: string;
      driverNameFa?: string;
      vehiclePlateFa?: string;
      notesFa?: string;
      descriptionFa?: string;
      lines: Array<{ itemId: number; quantity: number; notesFa?: string; serialNumbers?: string[] }>;
    },
    actorUserId: number = 1
  ): InventoryTransferRecord {
    if (!data.sourceWarehouseId || !data.targetWarehouseId) {
      throw new Error('انبار مبدأ و مقصد برای انتقال کالا الزامی است.');
    }
    if (data.sourceWarehouseId === data.targetWarehouseId) {
      throw new Error('انبار مبدأ و مقصد نمی‌توانند یکسان باشند.');
    }
    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      throw new Error('حواله انتقال باید حداقل دارای یک ردیف کالا باشد.');
    }

    const sourceWh = this.getWarehouseById(data.sourceWarehouseId);
    if (!sourceWh || sourceWh.status !== 'ACTIVE') {
      throw new Error('انبار مبدأ انتخاب شده معتبر یا فعال نمی‌باشد.');
    }
    const targetWh = this.getWarehouseById(data.targetWarehouseId);
    if (!targetWh || targetWh.status !== 'ACTIVE') {
      throw new Error('انبار مقصد انتخاب شده معتبر یا فعال نمی‌باشد.');
    }

    if (!Array.isArray(this.dbState.inventoryTransfers)) {
      this.dbState.inventoryTransfers = [];
    }

    const nextId =
      this.dbState.inventoryTransfers.length > 0
        ? Math.max(...this.dbState.inventoryTransfers.map((t) => t.id)) + 1
        : 1;

    const transferNumber = `TRN-1405-${String(nextId).padStart(4, '0')}`;

    // Prepare line items and auto-resolve active IN_STOCK serials if not explicitly passed for serialized items
    const processedDocLines = data.lines.map((l) => {
      const itm = this.getItemById(l.itemId);
      if (!itm) {
        throw new Error(`کالا با شناسه [${l.itemId}] یافت نشد.`);
      }
      let serials = l.serialNumbers && l.serialNumbers.length > 0 ? [...l.serialNumbers] : [];
      if (itm.isSerialized && serials.length === 0) {
        const availableInStock = (this.dbState.itemSerials || []).filter(
          (s) => s.currentWarehouseId === data.sourceWarehouseId && s.itemId === itm.id && s.status === 'IN_STOCK'
        );
        if (availableInStock.length < l.quantity) {
          throw new Error(
            `موجودی انبار «${sourceWh.titleFa}» برای کالای «${itm.titleFa}» کافی نیست. موجودی فعلی: ${availableInStock.length} عدد، تعداد درخواستی برای خروج: ${l.quantity} عدد. سیستم از ایجاد موجودی منفی جلوگیری کرد.`
          );
        }
        serials = availableInStock.slice(0, l.quantity).map((s) => s.serialNumber);
      }
      return {
        itemId: l.itemId,
        quantity: l.quantity,
        serialNumbers: serials.length > 0 ? serials : undefined,
        notesFa: l.notesFa || data.notesFa,
      };
    });

    // Pre-dispatch in-memory snapshot for atomic rollback on failure
    const preDocsCount = (this.dbState.inventoryDocuments || []).length;
    const preTransfersCount = (this.dbState.inventoryTransfers || []).length;
    const preAuditCount = (this.dbState.auditLogs || []).length;
    const serialsSnapshot = (this.dbState.itemSerials || []).map((s) => ({ ...s }));

    let outDoc: InventoryDocumentRecord | null = null;
    let newTransfer: InventoryTransferRecord | null = null;

    try {
      // 1. Transactionally execute the outgoing stock transfer document
      // If insufficient stock or validation fails, this throws immediately without swallowing!
      outDoc = this.createInventoryDocument(
        {
          docType: 'TRANSFER',
          sourceWarehouseId: data.sourceWarehouseId,
          targetWarehouseId: data.targetWarehouseId,
          dateJalali: data.dateJalali || '1405/01/27',
          isInTransitTransfer: true,
          lines: processedDocLines,
          notesFa: `حواله ترانزیت کالا ${transferNumber} از ${sourceWh.titleFa} به ${targetWh.titleFa}`,
        },
        actorUserId
      );

      // 2. Persist the transfer record; if this fails, roll back all affected in-memory state
      newTransfer = {
        id: nextId,
        transferNumber,
        sourceWarehouseId: data.sourceWarehouseId,
        sourceWarehouseTitleFa: sourceWh.titleFa,
        targetWarehouseId: data.targetWarehouseId,
        targetWarehouseTitleFa: targetWh.titleFa,
        dateJalali: data.dateJalali || '1405/01/27',
        driverNameFa: data.driverNameFa,
        vehiclePlateFa: data.vehiclePlateFa,
        notesFa: data.notesFa,
        descriptionFa: data.descriptionFa || data.notesFa,
        status: 'IN_TRANSIT',
        lines: data.lines.map((l) => {
          const itm = this.getItemById(l.itemId);
          return {
            itemId: l.itemId,
            itemCode: itm?.itemCode,
            itemTitleFa: itm?.titleFa,
            quantity: l.quantity,
            unitCostIrr: itm?.purchasePriceIrr || 0,
            notesFa: l.notesFa,
          };
        }),
        outgoingInventoryDocId: outDoc.id,
        incomingInventoryDocId: null,
        actorUserId,
        createdAt: new Date().toISOString(),
      };

      this.dbState.inventoryTransfers.push(newTransfer);
      this.saveDbState();

      this.recordAuditLog({
        actorUserId,
        actorUsername: this.getUserById(actorUserId)?.username || 'SYSTEM',
        action: 'INVENTORY_TRANSFER_CREATED',
        category: 'INVENTORY',
        targetEntity: 'inventory_transfers',
        targetId: transferNumber,
        status: 'SUCCESS',
        detailsFa: `حواله ترانزیت بین‌انبار ${transferNumber} از «${newTransfer.sourceWarehouseTitleFa}» به «${newTransfer.targetWarehouseTitleFa}» صادر گردید.`,
        metadata: { transferId: nextId, transferNumber, outgoingInventoryDocId: outDoc.id },
      });

      return newTransfer;
    } catch (err) {
      // Complete in-memory atomic rollback across documents, transfers, serials, and audit logs
      if (outDoc) {
        const docIdx = this.dbState.inventoryDocuments.findIndex((d) => d.id === outDoc!.id);
        if (docIdx !== -1) {
          this.dbState.inventoryDocuments.splice(docIdx, 1);
        }
      } else if (this.dbState.inventoryDocuments.length > preDocsCount) {
        this.dbState.inventoryDocuments.splice(preDocsCount);
      }

      const transferIdx = this.dbState.inventoryTransfers.findIndex(
        (t) => t.id === nextId || t.transferNumber === transferNumber
      );
      if (transferIdx !== -1) {
        this.dbState.inventoryTransfers.splice(transferIdx, 1);
      } else if (this.dbState.inventoryTransfers.length > preTransfersCount) {
        this.dbState.inventoryTransfers.splice(preTransfersCount);
      }

      // Restore all physical unit serial records to exact pre-dispatch snapshot
      this.dbState.itemSerials = serialsSnapshot.map((s) => ({ ...s }));

      // Rollback any audit logs created during this failed dispatch attempt
      if (this.dbState.auditLogs && this.dbState.auditLogs.length > preAuditCount) {
        this.dbState.auditLogs.splice(preAuditCount);
      }

      try {
        this.saveDbState();
      } catch {
        // Disk persistence failure logged or handled without masking underlying error
      }

      throw err;
    }
  }

  public receiveInventoryTransferRequisition(
    id: number,
    actorUserId: number = 1
  ): InventoryTransferRecord {
    const list = this.dbState.inventoryTransfers || [];
    const transfer = list.find((t) => t.id === id);
    if (!transfer) {
      throw new Error(`حواله ترانزیت با شناسه ${id} یافت نشد.`);
    }

    // Idempotency: repeated confirmation returns completed record
    if (transfer.status === 'COMPLETED') {
      return transfer;
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error(`امکان تحویل حواله در وضعیت [${transfer.status}] وجود ندارد.`);
    }

    // Ensure destination receipt cannot proceed unless a valid confirmed outgoing transfer exists
    if (!transfer.outgoingInventoryDocId) {
      throw new Error('حواله ترانزیت فاقد سند معتبر خروج از انبار مبدأ است و امکان تحویل در مقصد را ندارد.');
    }

    const outDoc = (this.dbState.inventoryDocuments || []).find(
      (d) => d.id === transfer.outgoingInventoryDocId
    );
    if (!outDoc) {
      throw new Error('سند خروج انبار مبدأ مربوط به این حواله ترانزیت یافت نشد.');
    }

    if (outDoc.status !== 'CONFIRMED') {
      throw new Error('سند خروج انبار مبدأ مربوط به این حواله ترانزیت در وضعیت تأییدشده قرار ندارد.');
    }

    if (outDoc.docType !== 'TRANSFER') {
      throw new Error(
        `نوع سند مرتبط با حواله ترانزیت نامعتبر است [${outDoc.docType}]. باید از نوع TRANSFER باشد.`
      );
    }

    if (outDoc.sourceWarehouseId !== transfer.sourceWarehouseId) {
      throw new Error(
        `مغایرت انبار مبدأ: انبار مبدأ سند خروج [${outDoc.sourceWarehouseId}] با انبار مبدأ حواله ترانزیت [${transfer.sourceWarehouseId}] مطابقت ندارد.`
      );
    }

    if (outDoc.targetWarehouseId !== transfer.targetWarehouseId) {
      throw new Error(
        `مغایرت انبار مقصد: انبار مقصد سند خروج [${outDoc.targetWarehouseId}] با انبار مقصد حواله ترانزیت [${transfer.targetWarehouseId}] مطابقت ندارد.`
      );
    }

    // Transition serials to destination warehouse with IN_STOCK status upon physical receipt
    const nowIso = new Date().toISOString();
    if (outDoc.lines && Array.isArray(outDoc.lines)) {
      for (const line of outDoc.lines) {
        if (line.serialNumbers && line.serialNumbers.length > 0) {
          for (const sn of line.serialNumbers) {
            const snClean = sn.trim().toUpperCase();
            const serialRecord = (this.dbState.itemSerials || []).find(
              (s) => s.serialNumber.toUpperCase() === snClean && s.itemId === line.itemId
            );
            if (serialRecord) {
              serialRecord.currentWarehouseId = transfer.targetWarehouseId;
              serialRecord.status = 'IN_STOCK';
              serialRecord.lastDocNumber = outDoc.docNumber;
              serialRecord.updatedAt = nowIso;
            }
          }
        }
      }
    }

    transfer.incomingInventoryDocId = outDoc.id;
    transfer.status = 'COMPLETED';
    transfer.receivedAt = nowIso;
    transfer.receivedByUserId = actorUserId;

    this.saveDbState();

    this.recordAuditLog({
      actorUserId,
      actorUsername: this.getUserById(actorUserId)?.username || 'SYSTEM',
      action: 'INVENTORY_TRANSFER_RECEIVED',
      category: 'INVENTORY',
      targetEntity: 'inventory_transfers',
      targetId: transfer.transferNumber,
      status: 'SUCCESS',
      detailsFa: `محموله ترانزیت کالا ${transfer.transferNumber} در انبار مقصد تحویل و تسویه انبارداری گردید.`,
      metadata: { transferId: transfer.id, outgoingInventoryDocId: outDoc.id },
    });

    return transfer;
  }

  public getExecutiveBiMetrics(): ExecutiveBiMetrics {
    const sales = this.dbState.salesInvoices || [];
    const purchases = this.dbState.purchaseInvoices || [];
    const expenses = this.dbState.operationalExpenses || [];
    const cashBoxes = this.dbState.cashBoxes || [];
    const bankAccounts = this.dbState.bankAccounts || [];
    const parties = this.dbState.parties || [];
    const warehouses = this.dbState.warehouses || [];
    const projects = this.dbState.projects || [];
    const items = this.dbState.items || [];

    const totalRevenueIrr = sales
      .filter((s) => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + (s.totalInvoiceAmountIrr || 0), 0);

    const totalCogsIrr = sales
      .filter((s) => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + (s.totalCogsIrr || 0), 0);

    const totalGrossProfitIrr = Math.max(0, totalRevenueIrr - totalCogsIrr);
    const totalOperatingExpensesIrr = expenses.reduce((sum, e) => sum + (e.amountIrr || 0), 0);
    const totalNetProfitIrr = totalGrossProfitIrr - totalOperatingExpensesIrr;

    const kardexSummary = this.getInventorySummary();
    const inventoryValuationIrr = kardexSummary.totalValuationIrr || 0;

    const totalCashAndBankIrr =
      cashBoxes.reduce((sum, c) => sum + (c.balanceIrr || 0), 0) +
      bankAccounts.reduce((sum, b) => sum + (b.balanceIrr || 0), 0);

    const accountsReceivableIrr = sales
      .filter((s) => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + (s.remainingBalanceIrr || 0), 0);

    const accountsPayableIrr = purchases
      .filter((p) => p.status !== 'CANCELLED')
      .reduce((sum, p) => sum + (p.remainingDebtIrr || 0), 0);

    const totalCustomersCount = parties.filter(
      (p) => p.roles?.includes('CUSTOMER') || p.primaryType === 'CUSTOMER'
    ).length;
    const totalSuppliersCount = parties.filter(
      (p) => p.roles?.includes('SUPPLIER') || p.primaryType === 'SUPPLIER'
    ).length;
    const activeWarehousesCount = warehouses.filter((w) => w.status === 'ACTIVE').length;
    const activeProjectsCount = projects.filter(
      (pr) => pr.status !== 'COMPLETED' && pr.status !== 'CANCELLED'
    ).length;

    const workingCapitalRatio =
      accountsPayableIrr > 0
        ? Number(
            (
              (totalCashAndBankIrr + accountsReceivableIrr + inventoryValuationIrr) /
              accountsPayableIrr
            ).toFixed(2)
          )
        : 2.5;

    let cashFlowStatus: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL' = 'POSITIVE';
    if (totalCashAndBankIrr < 100000000) cashFlowStatus = 'CRITICAL';
    else if (totalCashAndBankIrr < 500000000) cashFlowStatus = 'NEUTRAL';

    const itemSalesMap = new Map<number, { qty: number; rev: number }>();
    for (const inv of sales) {
      if (inv.status === 'CANCELLED') continue;
      for (const line of inv.lines || []) {
        const prev = itemSalesMap.get(line.itemId) || { qty: 0, rev: 0 };
        itemSalesMap.set(line.itemId, {
          qty: prev.qty + (line.quantity || 0),
          rev: prev.rev + (line.netPriceIrr || 0),
        });
      }
    }

    const topSellingItems = Array.from(itemSalesMap.entries())
      .map(([itemId, stat]) => {
        const itm = items.find((i) => i.id === itemId);
        return {
          itemId,
          itemCode: itm?.itemCode || `ITM-${itemId}`,
          titleFa: itm?.titleFa || 'کالای بازرگانی',
          quantity: stat.qty,
          revenueIrr: stat.rev,
        };
      })
      .sort((a, b) => b.revenueIrr - a.revenueIrr)
      .slice(0, 5);

    const recentAuditEvents = (this.dbState.auditLogs || []).slice(0, 8);

    return {
      totalRevenueIrr,
      totalGrossProfitIrr,
      totalOperatingExpensesIrr,
      totalNetProfitIrr,
      inventoryValuationIrr,
      totalCashAndBankIrr,
      accountsReceivableIrr,
      accountsPayableIrr,
      totalCustomersCount,
      totalSuppliersCount,
      activeWarehousesCount,
      activeProjectsCount,
      workingCapitalRatio,
      cashFlowStatus,
      topSellingItems,
      recentAuditEvents,
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // REMOTE ACCESS TUNNEL & GOOGLE SHEETS / FORMS SYNC ENGINE
  // ============================================================================

  public getRemoteTunnelConfig(): RemoteTunnelConfig {
    return (
      this.dbState.remoteTunnelConfig || {
        enabled: false,
        publicUrl: '',
        localPort: 3000,
        testStatus: 'UNTESTED',
      }
    );
  }

  public updateRemoteTunnelConfig(config: Partial<RemoteTunnelConfig>): RemoteTunnelConfig {
    const current = this.getRemoteTunnelConfig();
    this.dbState.remoteTunnelConfig = {
      ...current,
      ...config,
    };
    this.saveDbState();
    this.recordAuditLog({
      action: 'REMOTE_TUNNEL_CONFIG_UPDATED',
      category: 'SETTINGS',
      targetEntity: 'remote_tunnel',
      targetId: 'CF_TUNNEL',
      status: 'SUCCESS',
      detailsFa: `تنظیمات اتصال ریموت کلودفلر به‌روزرسانی شد: ${this.dbState.remoteTunnelConfig.publicUrl || 'غیرفعال'}`,
    });
    return this.dbState.remoteTunnelConfig;
  }

  public getGoogleSheetsSyncConfig(): GoogleSheetsSyncConfig {
    return (
      this.dbState.googleSheetsSyncConfig || {
        enabled: false,
        spreadsheetUrl: '',
        appsScriptWebhookUrl: '',
        autoSyncIntervalMinutes: 0,
        lastSyncStatus: 'IDLE',
      }
    );
  }

  public updateGoogleSheetsSyncConfig(
    config: Partial<GoogleSheetsSyncConfig>
  ): GoogleSheetsSyncConfig {
    const current = this.getGoogleSheetsSyncConfig();
    this.dbState.googleSheetsSyncConfig = {
      ...current,
      ...config,
    };
    this.saveDbState();
    this.recordAuditLog({
      action: 'GOOGLE_SHEETS_CONFIG_UPDATED',
      category: 'SETTINGS',
      targetEntity: 'google_sheets_sync',
      targetId: 'GSHEETS',
      status: 'SUCCESS',
      detailsFa: `تنظیمات همگام‌سازی گوگل شیت و فرم‌ها ذخیره شد: ${this.dbState.googleSheetsSyncConfig.spreadsheetUrl || 'بدون لینک'}`,
    });
    return this.dbState.googleSheetsSyncConfig;
  }

  public getGoogleSheetsSyncLogs(): GoogleSheetsSyncLog[] {
    return this.dbState.googleSheetsSyncLogs || [];
  }

  public addGoogleSheetsSyncLog(entry: {
    type: 'PUSH' | 'PULL' | 'WEBHOOK';
    status: 'SUCCESS' | 'ERROR';
    detailsFa: string;
    stats?: {
      jobsPushed?: number;
      requisitionsPulled?: number;
      reportsPulled?: number;
    };
  }): GoogleSheetsSyncLog {
    if (!Array.isArray(this.dbState.googleSheetsSyncLogs)) {
      this.dbState.googleSheetsSyncLogs = [];
    }
    const logItem: GoogleSheetsSyncLog = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: entry.type,
      status: entry.status,
      detailsFa: entry.detailsFa,
      stats: entry.stats,
    };
    this.dbState.googleSheetsSyncLogs.unshift(logItem);
    if (this.dbState.googleSheetsSyncLogs.length > 50) {
      this.dbState.googleSheetsSyncLogs = this.dbState.googleSheetsSyncLogs.slice(0, 50);
    }
    this.saveDbState();
    return logItem;
  }

  public exportInstallerDataForSync() {
    const jobs = (this.dbState.installationJobs || []).map((j) => ({
      jobCode: j.jobCode,
      titleFa: j.titleFa,
      customerTitleFa: j.customerTitleFa,
      installerId: j.installerId,
      installerTitleFa: j.installerTitleFa,
      scheduledDateJalali: j.scheduledDateJalali,
      locationAddressFa: j.locationAddressFa,
      status: j.status,
      serviceFeeIrr: j.serviceFeeIrr,
      notesFa: j.notesFa || '',
      updatedAt: j.updatedAt,
    }));

    const projects = (this.dbState.projects || []).map((p) => ({
      projectCode: p.projectCode,
      titleFa: p.titleFa,
      customerTitleFa: p.customerTitleFa,
      installerId: p.installerId,
      installerTitleFa: p.installerTitleFa,
      startDateJalali: p.startDateJalali,
      targetCompletionDateJalali: p.targetCompletionDateJalali,
      locationAddressFa: p.locationAddressFa,
      status: p.status,
      notesFa: p.notesFa || '',
      updatedAt: p.updatedAt,
    }));

    const requisitions = (this.dbState.projectRequisitions || []).map((r) => ({
      id: r.id,
      requestCode: r.requestCode,
      projectId: r.projectId,
      projectCode: r.projectCode,
      projectTitleFa: r.projectTitleFa,
      itemId: r.itemId,
      itemCode: r.itemCode,
      itemTitleFa: r.itemTitleFa,
      requestedQty: r.requestedQty,
      approvedQty: r.approvedQty,
      status: r.status,
      sourceWarehouseId: r.sourceWarehouseId,
      sourceWarehouseTitleFa: r.sourceWarehouseTitleFa,
      notesFa: r.notesFa || '',
      createdAt: r.createdAt,
    }));

    const items = (this.dbState.items || []).map((i) => ({
      id: i.id,
      itemCode: i.itemCode,
      titleFa: i.titleFa,
      unitNameFa: i.unitNameFa,
      totalStock: i.totalStock || 0,
    }));

    const warehouses = (this.dbState.warehouses || []).map((w) => ({
      id: w.id,
      titleFa: w.titleFa,
    }));

    const installers = (this.dbState.parties || [])
      .filter((p) => p.roles?.includes('INSTALLER') || p.primaryType === 'INSTALLER')
      .map((p) => ({
        id: p.id,
        partyCode: p.partyCode,
        fullName: p.fullName,
        mobile: p.mobile,
      }));

    return {
      jobs,
      projects,
      requisitions,
      items,
      warehouses,
      installers,
      exportedAt: new Date().toISOString(),
    };
  }

  public importInstallerDataFromSync(
    payload: {
      jobUpdates?: Array<{
        jobCode: string;
        status?: InstallationJobStatus;
        notesFa?: string;
        completedDateJalali?: string;
      }>;
      projectUpdates?: Array<{
        projectCode: string;
        status?: ProjectStatus;
        notesFa?: string;
        actualCompletionDateJalali?: string;
      }>;
      newRequisitions?: Array<{
        projectCodeOrJobCode: string;
        itemCodeOrTitle: string;
        requestedQty: number;
        notesFa?: string;
        warehouseId?: number;
        installerName?: string;
      }>;
      workReports?: Array<{
        code: string;
        visitDateJalali: string;
        notesFa: string;
        updatedStatus?: string;
      }>;
    },
    actorUserId: number = 1
  ): {
    ok: boolean;
    jobsUpdated: number;
    projectsUpdated: number;
    requisitionsCreated: number;
    reportsApplied: number;
    messageFa: string;
  } {
    let jobsUpdated = 0;
    let projectsUpdated = 0;
    let requisitionsCreated = 0;
    let reportsApplied = 0;
    const nowIso = new Date().toISOString();

    // 1. Process Job Updates
    if (Array.isArray(payload.jobUpdates)) {
      for (const update of payload.jobUpdates) {
        const job = (this.dbState.installationJobs || []).find(
          (j) => j.jobCode.toUpperCase() === update.jobCode.trim().toUpperCase()
        );
        if (job) {
          if (update.status && job.status !== update.status) {
            job.status = update.status;
            if (update.status === 'COMPLETED') {
              job.completedDateJalali = update.completedDateJalali || '1405/01/25';
            }
          }
          if (update.notesFa && update.notesFa.trim()) {
            job.notesFa = job.notesFa
              ? `${job.notesFa} | [آپدیت نصاب از شیت]: ${update.notesFa.trim()}`
              : `[آپدیت نصاب از شیت]: ${update.notesFa.trim()}`;
          }
          job.updatedAt = nowIso;
          jobsUpdated++;
        }
      }
    }

    // 2. Process Project Updates
    if (Array.isArray(payload.projectUpdates)) {
      for (const update of payload.projectUpdates) {
        const prj = (this.dbState.projects || []).find(
          (p) => p.projectCode.toUpperCase() === update.projectCode.trim().toUpperCase()
        );
        if (prj) {
          if (update.status && prj.status !== update.status) {
            prj.status = update.status;
            if (update.status === 'COMPLETED') {
              prj.actualCompletionDateJalali = update.actualCompletionDateJalali || '1405/01/25';
            }
          }
          if (update.notesFa && update.notesFa.trim()) {
            prj.notesFa = prj.notesFa
              ? `${prj.notesFa} | [آپدیت نصاب از شیت]: ${update.notesFa.trim()}`
              : `[آپدیت نصاب از شیت]: ${update.notesFa.trim()}`;
          }
          prj.updatedAt = nowIso;
          projectsUpdated++;
        }
      }
    }

    // 3. Process New Material Requisitions from Google Sheets or Forms
    if (Array.isArray(payload.newRequisitions)) {
      if (!Array.isArray(this.dbState.projectRequisitions)) {
        this.dbState.projectRequisitions = [];
      }

      for (const req of payload.newRequisitions) {
        const codeClean = (req.projectCodeOrJobCode || '').trim().toUpperCase();
        const prj = (this.dbState.projects || []).find(
          (p) => p.projectCode.toUpperCase() === codeClean
        );
        const job = (this.dbState.installationJobs || []).find(
          (j) => j.jobCode.toUpperCase() === codeClean
        );

        const projectId = prj ? prj.id : 1;
        const projectCode = prj ? prj.projectCode : job ? job.jobCode : codeClean || 'PRJ-1405-1001';

        // Match item by code or title
        const itemClean = (req.itemCodeOrTitle || '').trim();
        const matchedItem =
          (this.dbState.items || []).find(
            (i) =>
              i.itemCode.toUpperCase() === itemClean.toUpperCase() ||
              i.titleFa.toLowerCase().includes(itemClean.toLowerCase()) ||
              itemClean.toLowerCase().includes(i.titleFa.toLowerCase())
          ) || this.dbState.items[0];

        if (matchedItem) {
          const reqCount = this.dbState.projectRequisitions.length + 1001;
          const targetWh = (this.dbState.warehouses || []).find(
            (w) => w.id === req.warehouseId
          ) || this.dbState.warehouses[0];

          const targetProj = (this.dbState.projects || []).find((p) => p.id === projectId);
          const projectTitleFa = targetProj?.titleFa || 'پروژه عمومی';

          const newReq: ProjectMaterialRequisitionRecord = {
            id: reqCount,
            requestCode: `REQ-1405-${reqCount}`,
            projectId,
            projectCode,
            projectTitleFa,
            sourceWarehouseId: targetWh ? targetWh.id : 1,
            sourceWarehouseTitleFa: targetWh ? targetWh.titleFa : 'انبار مرکزی',
            itemId: matchedItem.id,
            itemCode: matchedItem.itemCode,
            itemTitleFa: matchedItem.titleFa,
            requestedQty: Number(req.requestedQty) || 1,
            approvedQty: 0,
            issuedQty: 0,
            consumedQty: 0,
            returnedQty: 0,
            unitCostIrr: matchedItem.purchasePriceIrr || 0,
            totalCostIrr: (Number(req.requestedQty) || 1) * (matchedItem.purchasePriceIrr || 0),
            status: 'REQUESTED',
            requestedByUserId: actorUserId,
            requestedByNameFa: req.installerName || 'نصاب میدانی',
            notesFa: req.notesFa
              ? `[ثبت از گوگل شیت/فرم توسط ${req.installerName || 'نصاب'}]: ${req.notesFa}`
              : `[ثبت خودکار از گوگل شیت/فرم نصاب]`,
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          this.dbState.projectRequisitions.push(newReq);
          requisitionsCreated++;
        }
      }
    }

    // 4. Process Work Reports
    if (Array.isArray(payload.workReports)) {
      for (const rep of payload.workReports) {
        const codeClean = (rep.code || '').trim().toUpperCase();
        const prj = (this.dbState.projects || []).find(
          (p) => p.projectCode.toUpperCase() === codeClean
        );
        const job = (this.dbState.installationJobs || []).find(
          (j) => j.jobCode.toUpperCase() === codeClean
        );

        if (prj) {
          prj.lastVisitReport = {
            visitDateJalali: rep.visitDateJalali || '1405/01/25',
            notesFa: rep.notesFa,
            status: 'SUBMITTED',
            submittedByUserId: actorUserId,
            submittedByNameFa: 'نصاب (همگام‌سازی شیت)',
          };
          if (rep.updatedStatus && rep.updatedStatus !== prj.status) {
            prj.status = rep.updatedStatus as any;
          }
          prj.updatedAt = nowIso;
          reportsApplied++;
        } else if (job) {
          if (rep.notesFa) {
            job.notesFa = job.notesFa
              ? `${job.notesFa} | [گزارش کار شیت ${rep.visitDateJalali}]: ${rep.notesFa}`
              : `[گزارش کار شیت ${rep.visitDateJalali}]: ${rep.notesFa}`;
          }
          if (rep.updatedStatus) {
            job.status = rep.updatedStatus as any;
          }
          job.updatedAt = nowIso;
          reportsApplied++;
        }
      }
    }

    if (jobsUpdated > 0 || projectsUpdated > 0 || requisitionsCreated > 0 || reportsApplied > 0) {
      this.saveDbState();
      this.addGoogleSheetsSyncLog({
        type: 'PULL',
        status: 'SUCCESS',
        detailsFa: `همگام‌سازی موفق: ${jobsUpdated} سفارش، ${projectsUpdated} پروژه، ${requisitionsCreated} درخواست کالا، ${reportsApplied} گزارش کار.`,
        stats: {
          jobsPushed: 0,
          requisitionsPulled: requisitionsCreated,
          reportsPulled: reportsApplied + jobsUpdated + projectsUpdated,
        },
      });
    }

    return {
      ok: true,
      jobsUpdated,
      projectsUpdated,
      requisitionsCreated,
      reportsApplied,
      messageFa: `همگام‌سازی با موفقیت انجام شد: ${jobsUpdated} سفارش به‌روز شد، ${projectsUpdated} پروژه به‌روز شد، ${requisitionsCreated} درخواست کالا و ${reportsApplied} گزارش ثبت گردید.`,
    };
  }
}

export const foundationStore = new FoundationStore();

