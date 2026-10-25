import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryWholesaleAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۵: پخش مویرگی و عمده‌فروشی');
  console.log('   (Mehregan Business Suite - Industry 5: Wholesale & Dispatch)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ صنف فعال به پخش مویرگی و عمده‌فروشی
  foundationStore.updateSettings({ industryProfileCode: 'WHOLESALE_DISPATCH' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف حساب‌های بانکی و صندوق‌های شرکت پخش
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد حساب‌های بانکی و صندوق‌های خزانه‌داری شرکت پخش...');
  const bank1 = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک سپه - حساب سپرده شرکت پخش مویرگی',
    accountNumber: '7766554433',
    shabaNumber: 'IR770150000000776655443301',
    balanceIrr: 0,
  });

  const cash1 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-WHL-01',
    titleFa: 'تنخواه صندوق موزعین و ماموران توزیع',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (تأمین‌کننده اصلی و فروشگاه‌های مسیر توزیع)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (کارخانه صنایع غذایی و فروشگاه خریدار عمده)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'کارخانه صنایع غذایی و بهداشتی میهن (تأمین‌کننده اصلی)',
    companyNameFa: 'صنایع غذایی میهن',
    economicCode: '411555666777',
    phone: '02155443322',
    mobile: '09125554433',
    cityFa: 'اسلامشهر',
    status: 'ACTIVE',
  });

  const customer = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'فروشگاه زنجیره‌ای جام‌جم (مشتری مسیر توزیع منطقه ۱)',
    companyNameFa: 'هایپرمارکت جام‌جم',
    economicCode: '411444333222',
    phone: '02122334455',
    mobile: '09124443322',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف اقلام و محصولات عمده و کارتنی
  // --------------------------------------------------------------------------
  console.log('۴. تعریف کالاها و بسته‌بندی‌های کارتنی و عمده...');
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: روغن مایع خوراکی (باکس ۶ عددی)
  const productOil = foundationStore.createItem({
    itemCode: 'WHL-OIL-18L',
    titleFa: 'روغن مایع آفتابگردان ۱.۸ لیتری (باکس ۶ عددی)',
    model: 'SUNFLOWER-BOX6',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'باکس',
    purchasePriceIrr: 900_000,
    salesPriceIrr: 1_200_000,
    isSerialized: false,
    minStockAlert: 20,
    maxStockAlert: 5000,
  }, 1);

  // کالا ۲: رب گوجه فرنگی (کارتن ۱۲ عددی)
  const productPaste = foundationStore.createItem({
    itemCode: 'WHL-PASTE-800G',
    titleFa: 'رب گوجه فرنگی ۸۰۰ گرمی قوطی (کارتن ۱۲ عددی)',
    model: 'PASTE-CARTON12',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'کارتن',
    purchasePriceIrr: 600_000,
    salesPriceIrr: 840_000,
    isSerialized: false,
    minStockAlert: 30,
    maxStockAlert: 10000,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن صنف پخش مویرگی:
  // بدهکار:
  //   - بانک سپه: 500,000,000
  //   - صندوق موزعین: 100,000,000
  //   - موجودی انبار کالا (روغن: ۱۰۰ باکس @ 900,000 = 90,000,000 + رب: ۲۰۰ کارتن @ 600,000 = 120,000,000 -> جمع: 210,000,000)
  //   مجموع بدهکار: 810,000,000 ریال
  // بستانکار:
  //   - طلب اولیه کارخانه میهن: 310,000,000
  //   - سرمایه اولیه و حقوق صاحبان سهام: 500,000,000
  //   مجموع بستانکار: 810,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ شرکت پخش مویرگی و عمده‌فروشی',
    items: [
      { accountCode: '10101', titleFa: 'بانک سپه - حساب شرکت پخش', type: 'BANK_CASH' as const, refId: bank1.id, debitIrr: 500_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'تنخواه صندوق موزعین', type: 'BANK_CASH' as const, refId: cash1.id, debitIrr: 100_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی انبار مرکزی - روغن آفتابگردان', type: 'INVENTORY' as const, refId: productOil.id, debitIrr: 90_000_000, creditIrr: 0, qty: 100, unitCostIrr: 900_000, warehouseId: defaultWarehouse.id },
      { accountCode: '10502', titleFa: 'موجودی انبار مرکزی - رب گوجه فرنگی', type: 'INVENTORY' as const, refId: productPaste.id, debitIrr: 120_000_000, creditIrr: 0, qty: 200, unitCostIrr: 600_000, warehouseId: defaultWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی - صنایع غذایی میهن', type: 'PARTY' as const, refId: supplier.id, debitIrr: 0, creditIrr: 310_000_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه شرکت پخش', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 500_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: ثبت فاکتور خرید عمده از کارخانه میهن
  // --------------------------------------------------------------------------
  console.log('۶. ثبت فاکتور خرید محموله جدید از صنایع غذایی میهن...');
  // خرید ۱۰۰ باکس روغن @ 900,000 = 90,000,000 + ۱۰۰ کارتن رب @ 600,000 = 60,000,000. جمع: 150,000,000 ریال.
  // پرداخت ۵۰,۰۰۰,۰۰۰ ریال از بانک سپه. مانده بدهی به کارخانه: 100,000,000 ریال.
  const purchaseInvoice = foundationStore.createPurchaseInvoice({
    supplierId: supplier.id,
    targetWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/05',
    notesFa: 'ورود محموله جدید کامیون توزیع از کارخانه میهن',
    paidAmountIrr: 50_000_000,
    paymentMethod: 'BANK_TRANSFER',
    sourceBankAccountId: bank1.id,
    lines: [
      { itemId: productOil.id, quantity: 100, unitPriceIrr: 900_000 },
      { itemId: productPaste.id, quantity: 100, unitPriceIrr: 600_000 },
    ],
  }, 1);

  console.log(`   فاکتور خرید [${purchaseInvoice.invoiceNumber}] ثبت شد. مبلغ: ${purchaseInvoice.totalInvoicePayableToSupplierIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: ثبت فاکتور فروش توزیع مویرگی (توزیع ۱) با کارتخوان
  // --------------------------------------------------------------------------
  console.log('۷. ثبت فاکتور توزیع و پخش مویرگی شماره ۱ به فروشگاه جام‌جم...');
  // فروش ۵۰ باکس روغن @ 1,200,000 = 60,000,000 + ۸۰ کارتن رب @ 840,000 = 67,200,000. جمع: 127,200,000 ریال.
  // تسویه ۱۰۰,۰۰۰,۰۰۰ ریال با کارتخوان موزع (bank1). مانده بدهی دفتری فروشگاه: 27,200,000 ریال.
  const salesInvoice1 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/10',
    notesFa: 'تحویل حواله خروج مسیر توزیع منطقه ۱',
    paidAmountIrr: 100_000_000,
    targetBankAccountId: bank1.id,
    paymentDetails: {
      paymentMethod: 'POS',
      posTerminalOrBank: bank1.bankNameFa,
    },
    lines: [
      { itemId: productOil.id, quantity: 50, unitPriceIrr: 1_200_000 },
      { itemId: productPaste.id, quantity: 80, unitPriceIrr: 840_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور پخش ۱ [${salesInvoice1.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice1.totalInvoiceAmountIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۸: ثبت فاکتور توزیع مویرگی (توزیع ۲) با تسویه نقدی و مانده
  // --------------------------------------------------------------------------
  console.log('۸. ثبت فاکتور توزیع و پخش مویرگی شماره ۲ به فروشگاه جام‌جم...');
  // فروش ۳۰ باکس روغن @ 1,200,000 = 36,000,000 + ۵۰ کارتن رب @ 840,000 = 42,000,000. جمع: 78,000,000 ریال.
  // دریافتی نقدی موزع: 20,000,000 ریال به صندوق تنخواه موزعین. مانده: 58,000,000 ریال.
  const salesInvoice2 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/15',
    notesFa: 'تحویل سفارش مجدد مسیر توزیع جام‌جم',
    paidAmountIrr: 20_000_000,
    targetCashBoxId: cash1.id,
    paymentDetails: {
      paymentMethod: 'CASH',
      posTerminalOrBank: 'تنخواه موزعین',
    },
    lines: [
      { itemId: productOil.id, quantity: 30, unitPriceIrr: 1_200_000 },
      { itemId: productPaste.id, quantity: 50, unitPriceIrr: 840_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور پخش ۲ [${salesInvoice2.invoiceNumber}] ثبت شد. مانده بدهی: ${salesInvoice2.remainingBalanceIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ممیزی جامع حسابداری و انبار پخش مویرگی
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار (Wholesale):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی موجودی انبار اقلام عمده
  // روغن مایع: ۱۰۰ افتتاحیه + ۱۰۰ خرید - ۸۰ فروش = ۱۲۰ باکس
  // رب گوجه: ۲۰۰ افتتاحیه + ۱۰۰ خرید - ۱۳۰ فروش = ۱۷۰ کارتن
  const items = foundationStore.getItems();
  const oilItem = items.find((i) => i.id === productOil.id);
  const pasteItem = items.find((i) => i.id === productPaste.id);

  const oilStock = oilItem?.totalStock ?? 0;
  const pasteStock = pasteItem?.totalStock ?? 0;

  console.log(`📦 موجودی انبار اقلام عمده و پخش:`);
  console.log(`   - روغن مایع خوراکی ۱.۸ لیتری: ${oilStock} باکس (مورد انتظار: 120)`);
  console.log(`   - رب گوجه فرنگی ۸۰۰ گرمی: ${pasteStock} کارتن (مورد انتظار: 170)`);

  if (oilStock !== 120) {
    console.error(`❌ مغایرت انبار روغن: باید ۱۲۰ باکس باشد اما ${oilStock} است.`);
    discrepanciesCount++;
  }
  if (pasteStock !== 170) {
    console.error(`❌ مغایرت انبار رب گوجه: باید ۱۷۰ کارتن باشد اما ${pasteStock} است.`);
    discrepanciesCount++;
  }

  // ۲. ممیزی نقدینگی، بانک‌ها و صندوق‌ها
  // بانک سپه (bank1): 500m افتتاحیه - 50m پرداخت خرید + 100m دریافتی کارتخوان = 550,000,000 ریال
  // صندوق موزعین (cash1): 100m افتتاحیه + 20m دریافتی نقدی موزع = 120,000,000 ریال
  // جمع کل نقدینگی: 550,000,000 + 120,000,000 = 670,000,000 ریال
  const b1 = foundationStore.getBankAccounts().find((b) => b.id === bank1.id)?.balanceIrr || 0;
  const c1 = foundationStore.getCashBoxes().find((c) => c.id === cash1.id)?.balanceIrr || 0;
  const totalCashBank = b1 + c1;

  console.log(`💳 مانده حساب‌های بانکی و صندوق شرکت پخش:`);
  console.log(`   - بانک سپه: ${b1.toLocaleString()} ریال (مورد انتظار: 550,000,000)`);
  console.log(`   - صندوق تنخواه موزعین: ${c1.toLocaleString()} ریال (مورد انتظار: 120,000,000)`);
  console.log(`   جمع کل نقدینگی: ${totalCashBank.toLocaleString()} ریال (مورد انتظار: 670,000,000)`);

  if (b1 !== 550_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک سپه: ${b1}`); }
  if (c1 !== 120_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق موزعین: ${c1}`); }

  // ۳. صورت سود و زیان (P&L)
  // درآمد کل فروش: ۱۲۷,۲۰0,۰۰۰ (فروش۱) + ۷۸,۰۰۰,۰۰۰ (فروش۲) = ۲۰۵,۲۰0,۰۰۰ ریال
  // بهای تمام‌شده COGS:
  //   - روغن: ۸۰ باکس @ 900,000 = 72,000,000
  //   - رب گوجه: ۱۳۰ کارتن @ 600,000 = 78,000,000
  //   مجموع بهای تمام‌شده: 150,000,000 ریال
  // سود ناخالص: ۲۰۵,۲۰0,۰۰۰ - ۱۵۰,۰۰۰,۰۰۰ = ۵۵,۲۰0,۰۰۰ ریال (۲۶.۹٪)
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;

  console.log(`📊 صورت سود و زیان شرکت پخش (P&L Report):`);
  console.log(`   - درآمد کل فروش: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 205,200,000)`);
  console.log(`   - بهای تمام‌شده COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 150,000,000)`);
  console.log(`   - سود ناخالص عملیاتی: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 55,200,000)`);

  if (pnl.totalNetSalesIrr !== 205_200_000) discrepanciesCount++;
  if (pnl.totalCogsIrr !== 150_000_000) discrepanciesCount++;
  if (pnl.totalGrossProfitIrr !== 55_200_000) discrepanciesCount++;

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
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۵ (Wholesale & Dispatch):`);
  console.log(`   تعداد کل مغایرت‌های کشف‌شده: ${discrepanciesCount}`);
  if (discrepanciesCount === 0) {
    console.log('   🎉 هیچ‌گونه مغایرتی یافت نشد؛ تمامی ترازها، حساب‌ها، موجودی‌ها و سودآوری ۱۰۰٪ مطابق محاسبات دقیق حسابداری پذیرفته شدند.');
  } else {
    console.error(`   ⚠️ تعداد ${discrepanciesCount} مغایرت کشف گردید.`);
  }
  console.log('========================================================================');

  if (discrepanciesCount > 0) {
    process.exit(1);
  }
}

runIndustryWholesaleAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Wholesale Industry acceptance scenario:', err);
  process.exit(1);
});
