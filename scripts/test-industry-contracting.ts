import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryContractingAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۷: پیمانکاری و خدمات پروژه‌ای');
  console.log('   (Mehregan Business Suite - Industry 7: Contracting & Project Services)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ صنف فعال به پیمانکاری و خدمات پروژه‌ای
  foundationStore.updateSettings({ industryProfileCode: 'SERVICES_CONTRACTING' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف حساب‌های بانکی و صندوق‌های مرکز پیمانکاری
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد حساب‌های بانکی و صندوق‌های مرکز پیمانکاری...');
  const bank1 = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک تجارت - حساب جاری پیمانکاری و پروژه‌ها',
    accountNumber: '4433221100',
    shabaNumber: 'IR440180000000443322110001',
    balanceIrr: 0,
  });

  const cash1 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-CON-01',
    titleFa: 'صندوق تنخواه‌گردان کارگاه و پروژه‌ها',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (تأمین‌کننده تجهیزات و کارفرمای پروژه)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (تأمین‌کننده تجهیزات و کارفرمای پروژه)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'شرکت تجهیزکاران صنعتی البرز (تأمین‌کننده تجهیزات)',
    companyNameFa: 'تجهیزکاران البرز',
    economicCode: '411777888999',
    phone: '02634445566',
    mobile: '09127776655',
    cityFa: 'کرج',
    status: 'ACTIVE',
  });

  const customer = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'شرکت مجتمع‌های صنعتی پارس (کارفرمای پیمان)',
    companyNameFa: 'مجتمع پارس',
    economicCode: '411999888777',
    phone: '02188990011',
    mobile: '09128889900',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف اقلام و تجهیزات پروژه‌ای
  // --------------------------------------------------------------------------
  console.log('۴. تعریف کالاها و تجهیزات مصرفی پروژه‌ها...');
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: تابلو برق صنعتی ۳ فاز
  const productPanel = foundationStore.createItem({
    itemCode: 'CON-PANEL-3PH',
    titleFa: 'تابلو برق صنعتی ۳ فاز فشار ضعیف (تجهیزات پروژه‌ای)',
    model: 'PANEL-3PH-400A',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 120_000_000,
    salesPriceIrr: 180_000_000,
    isSerialized: false,
    minStockAlert: 1,
    maxStockAlert: 20,
  }, 1);

  // کالا ۲: کابل فشار قوی مس
  const productCable = foundationStore.createItem({
    itemCode: 'CON-CABLE-16X4',
    titleFa: 'کابل فشار قوی مس ۱۶*۴ (مصرفی پروژه)',
    model: 'CABLE-COPPER-16X4',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'متر',
    purchasePriceIrr: 800_000,
    salesPriceIrr: 1_200_000,
    isSerialized: false,
    minStockAlert: 100,
    maxStockAlert: 5000,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن صنف پیمانکاری:
  // بدهکار:
  //   - بانک تجارت: 600,000,000
  //   - صندوق تنخواه کارگاه: 100,000,000
  //   - موجودی انبار کالا (تابلو برق: ۲ دستگاه @ 120,000,000 = 240,000,000 + کابل: ۵۰۰ متر @ 800,000 = 400,000,000 -> جمع: 640,000,000)
  //   مجموع بدهکار: 1,340,000,000 ریال
  // بستانکار:
  //   - طلب اولیه تجهیزکاران البرز: 340,000,000
  //   - سرمایه اولیه و حقوق صاحبان سهام: 1,000,000,000
  //   مجموع بستانکار: 1,340,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ شرکت پیمانکاری و خدمات مهندسی',
    items: [
      { accountCode: '10101', titleFa: 'بانک تجارت - حساب پیمانکاری', type: 'BANK_CASH' as const, refId: bank1.id, debitIrr: 600_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'صندوق تنخواه‌گردان کارگاه', type: 'BANK_CASH' as const, refId: cash1.id, debitIrr: 100_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی انبار پروژه - تابلو برق', type: 'INVENTORY' as const, refId: productPanel.id, debitIrr: 240_000_000, creditIrr: 0, qty: 2, unitCostIrr: 120_000_000, warehouseId: defaultWarehouse.id },
      { accountCode: '10502', titleFa: 'موجودی انبار پروژه - کابل مس', type: 'INVENTORY' as const, refId: productCable.id, debitIrr: 400_000_000, creditIrr: 0, qty: 500, unitCostIrr: 800_000, warehouseId: defaultWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی - تجهیزکاران البرز', type: 'PARTY' as const, refId: supplier.id, debitIrr: 0, creditIrr: 340_000_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه شرکت پیمانکاری', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 1_000_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: ثبت فاکتور خرید شارژ تجهیزات و مصالح از تجهیزکاران البرز
  // --------------------------------------------------------------------------
  console.log('۶. ثبت فاکتور خرید مصالح و تجهیزات جدید از تجهیزکاران البرز...');
  // خرید ۲ دستگاه تابلو برق @ 120m = 240,000,000 + ۵۰۰ متر کابل @ 800k = 400,000,000. جمع: 640,000,000 ریال.
  // پرداخت ۲۰۰,۰۰۰,۰۰۰ ریال از بانک تجارت. مانده بدهی به تأمین‌کننده: 440,000,000 ریال.
  const purchaseInvoice = foundationStore.createPurchaseInvoice({
    supplierId: supplier.id,
    targetWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/05',
    notesFa: 'خرید تجهیزات برق و کابل جهت مجهز کردن انبار پروژه‌ها',
    paidAmountIrr: 200_000_000,
    paymentMethod: 'BANK_TRANSFER',
    sourceBankAccountId: bank1.id,
    lines: [
      { itemId: productPanel.id, quantity: 2, unitPriceIrr: 120_000_000 },
      { itemId: productCable.id, quantity: 500, unitPriceIrr: 800_000 },
    ],
  }, 1);

  console.log(`   فاکتور خرید [${purchaseInvoice.invoiceNumber}] ثبت شد. مبلغ: ${purchaseInvoice.totalInvoicePayableToSupplierIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: تعریف پروژه پیمانکاری جدید و ثبت درخواست و مصرف مصالح
  // --------------------------------------------------------------------------
  console.log('۷. تعریف پروژه پیمانکاری برق مجتمع صنعتی پارس و مصرف قطعات...');
  const project = foundationStore.createProject({
    projectCode: 'PRJ-PARS-101',
    titleFa: 'پروژه تجهیز و احداث تاسیسات برق فشار ضعیف مجتمع صنعتی پارس',
    customerId: customer.id,
    contractAmountIrr: 1_000_000_000,
    startDateJalali: '1405/01/01',
    endDateJalali: '1405/06/31',
    status: 'IN_PROGRESS',
    descriptionFa: 'پیمان تجهیز تابلوها و کابل‌کشی فشار ضعیف سالن تولید',
  }, 1);

  console.log(`   پروژه پیمانکاری [${project.projectCode}] به مبلغ قرارداد ${project.contractAmountIrr.toLocaleString()} ریال تعریف گردید.`);

  // ثبت درخواست حواله کالا برای پروژه: ۳ دستگاه تابلو برق + ۶۰۰ متر کابل
  const req1 = foundationStore.createProjectRequisition({
    projectId: project.id,
    itemId: productPanel.id,
    requestedQty: 3,
    notesFa: 'درخواست ۳ دستگاه تابلو برق جهت نصب در سالن',
  }, 1);

  const req2 = foundationStore.createProjectRequisition({
    projectId: project.id,
    itemId: productCable.id,
    requestedQty: 600,
    notesFa: 'درخواست ۶۰۰ متر کابل مس جهت کابل‌کشی',
  }, 1);

  // تأیید، تحویل از انبار و ثبت مصرف قطعی
  foundationStore.approveProjectRequisition(req1.id, 3, 1);
  foundationStore.issueProjectRequisition(req1.id, 3, defaultWarehouse.id, [], 1);
  foundationStore.consumeProjectRequisition(req1.id, 3, '1405/01/10', 1);

  foundationStore.approveProjectRequisition(req2.id, 600, 1);
  foundationStore.issueProjectRequisition(req2.id, 600, defaultWarehouse.id, [], 1);
  foundationStore.consumeProjectRequisition(req2.id, 600, '1405/01/10', 1);

  console.log(`   مصرف مصالح پروژه ثبت گردید (۳ دستگاه تابلو برق + ۶۰۰ متر کابل مس).`);

  // --------------------------------------------------------------------------
  // مرحله ۸: صدور صورت وضعیت و فاکتور کارکرد پروژه
  // --------------------------------------------------------------------------
  console.log('۸. صدور صورت وضعیت و فاکتور کارکرد پیمان مجتمع صنعتی پارس...');
  // فاکتور صورت وضعیت ۱: ۱,۰۰۰,۰۰۰,۰۰۰ ریال.
  // دریافت ۸۰۰,۰۰۰,۰۰۰ ریال حواله بانکی به بانک تجارت. مانده طلب صورت وضعیت: 200,000,000 ریال.
  const salesInvoice = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/15',
    notesFa: 'صورت وضعیت شماره ۱ تایید شده پروژه تاسیسات مجتمع پارس',
    paidAmountIrr: 800_000_000,
    targetBankAccountId: bank1.id,
    paymentDetails: {
      paymentMethod: 'BANK_TRANSFER',
      posTerminalOrBank: bank1.bankNameFa,
    },
    lines: [
      { itemId: productPanel.id, quantity: 1, unitPriceIrr: 1_000_000_000, isService: true },
    ],
  } as any, 1);

  console.log(`   فاکتور صورت وضعیت [${salesInvoice.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice.totalInvoiceAmountIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ممیزی جامع حسابداری، سودآوری پروژه و انبار پیمانکاری
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار (Contracting):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی موجودی انبار مصالح و تجهیزات
  // تابلو برق: ۲ افتتاحیه + ۲ خرید - ۳ مصرف پروژه = ۱ دستگاه
  // کابل مس: ۵۰۰m افتتاحیه + ۵۰۰m خرید - ۶۰۰m مصرف پروژه = ۴۰۰ متر
  const items = foundationStore.getItems();
  const panelItem = items.find((i) => i.id === productPanel.id);
  const cableItem = items.find((i) => i.id === productCable.id);

  const panelStock = panelItem?.totalStock ?? 0;
  const cableStock = cableItem?.totalStock ?? 0;

  console.log(`📦 موجودی انبار تجهیزات و مصالح پیمانکاری:`);
  console.log(`   - تابلو برق صنعتی ۳ فاز: ${panelStock} دستگاه (مورد انتظار: 1)`);
  console.log(`   - کابل فشار قوی مس: ${cableStock} متر (مورد انتظار: 400)`);

  if (panelStock !== 1) {
    console.error(`❌ مغایرت انبار تابلو برق: باید ۱ دستگاه باشد اما ${panelStock} است.`);
    discrepanciesCount++;
  }
  if (cableStock !== 400) {
    console.error(`❌ مغایرت انبار کابل مس: باید ۴۰۰ متر باشد اما ${cableStock} است.`);
    discrepanciesCount++;
  }

  // ۲. ممیزی نقدینگی، بانک‌ها و صندوق کارگاه
  // بانک تجارت (bank1): 600m افتتاحیه - 200m پرداخت خرید + 800m دریافتی صورت وضعیت = 1,200,000,000 ریال
  // صندوق کارگاه (cash1): 100m افتتاحیه = 100,000,000 ریال
  // جمع کل نقدینگی: 1,200,000,000 + 100,000,000 = 1,300,000,000 ریال
  const b1 = foundationStore.getBankAccounts().find((b) => b.id === bank1.id)?.balanceIrr || 0;
  const c1 = foundationStore.getCashBoxes().find((c) => c.id === cash1.id)?.balanceIrr || 0;
  const totalCashBank = b1 + c1;

  console.log(`💳 مانده حساب‌های بانکی و صندوق‌های پیمانکاری:`);
  console.log(`   - بانک تجارت: ${b1.toLocaleString()} ریال (مورد انتظار: 1,200,000,000)`);
  console.log(`   - صندوق تنخواه کارگاه: ${c1.toLocaleString()} ریال (مورد انتظار: 100,000,000)`);
  console.log(`   جمع کل نقدینگی: ${totalCashBank.toLocaleString()} ریال (مورد انتظار: 1,300,000,000)`);

  if (b1 !== 1_200_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک تجارت: ${b1}`); }
  if (c1 !== 100_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق کارگاه: ${c1}`); }

  // ۳. صورت سود و زیان و سودآوری پروژه (P&L & Project Profitability)
  // درآمد کل صورت وضعیت: ۱,۰۰۰,۰۰۰,۰۰۰ ریال
  // بهای تمام‌شده مصالح مصرف‌شده (COGS): (۳ دستگاه @ 120m = 360m) + (۶۰۰ متر @ 800k = 480m) = ۸۴۰,۰۰۰,۰۰۰ ریال
  // سود ناخالص عملیاتی: ۱,۰۰۰m - ۸۴۰m = ۱۶۰,۰۰۰,۰۰۰ ریال (۱۶.۰۰٪)
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;

  const projDetail = foundationStore.getProjectProfitabilityDetail(project.id);

  console.log(`📊 صورت سود و زیان و آنالیز سودآوری پروژه (Project Profitability):`);
  console.log(`   - درآمد کارکرد صورت وضعیت: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 1,000,000,000)`);
  console.log(`   - بهای تمام‌شده مصالح مصرفی COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 840,000,000)`);
  console.log(`   - سود ناخالص پیمانکاری: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 160,000,000)`);
  console.log(`   - حاشیه سود سودآوری پروژه: ${projDetail.grossMarginPct}% (مورد انتظار: 16%)`);

  if (pnl.totalNetSalesIrr !== 1_000_000_000) discrepanciesCount++;
  if (pnl.totalCogsIrr !== 840_000_000) discrepanciesCount++;
  if (pnl.totalGrossProfitIrr !== 160_000_000) discrepanciesCount++;

  // ۴. تراز آزمایشی و توازن دفتر کل
  const trialBalance = foundationStore.getTrialBalance();
  console.log(`⚖️ تراز آزمایشی کل اسناد حسابداری (Trial Balance):`);
  console.log(`   - مجموع گردش بدهکار: ${trialBalance.totalDebitTurnoverIrr.toLocaleString()} ریال`);
  console.log(`   - مجموع گردش بستانکار: ${trialBalance.totalCreditTurnoverIrr.toLocaleString()} ریال`);
  console.log(`   - وضعیت توازن دفتر کل: ${trialBalance.isBalanced ? 'متوازن و دقیق ✅' : 'دارای عدم توازن ❌'}`);

  if (!trialBalance.isBalanced || trialBalance.totalDebitTurnoverIrr !== trialBalance.totalCreditTurnoverIrr) {
    console.error(`❌ عدم توازن در تراز آزمایشی! اختلاف: ${trialBalance.totalDebitTurnoverIrr - trialBalance.totalCreditTurnoverIrr}`);
    discrepanciesCount++;
  }

  console.log('========================================================================');
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۷ (Services & Contracting):`);
  console.log(`   تعداد کل مغایرت‌های کشف‌شده: ${discrepanciesCount}`);
  if (discrepanciesCount === 0) {
    console.log('   🎉 هیچ‌گونه مغایرتی یافت نشد؛ تمامی ترازها، حساب‌ها، موجودی‌ها، مصرف پروژه و سودآوری ۱۰۰٪ مطابق محاسبات دقیق حسابداری پذیرفته شدند.');
  } else {
    console.error(`   ⚠️ تعداد ${discrepanciesCount} مغایرت کشف گردید.`);
  }
  console.log('========================================================================');

  if (discrepanciesCount > 0) {
    process.exit(1);
  }
}

runIndustryContractingAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Contracting Industry acceptance scenario:', err);
  process.exit(1);
});
