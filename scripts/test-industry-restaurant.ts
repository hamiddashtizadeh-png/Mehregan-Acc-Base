import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryRestaurantAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۴: رستوران، فست‌فود و کافی‌شاپ');
  console.log('   (Mehregan Business Suite - Industry 4: Restaurant & Cafe)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ صنف فعال به رستوران و کافی‌شاپ
  foundationStore.updateSettings({ industryProfileCode: 'RESTAURANT_CAFE' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف حساب‌های بانکی و صندوق‌های خزانه‌داری رستوران
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد حساب‌های بانکی و صندوق‌های خزانه‌داری رستوران...');
  const bank1 = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک کشاورزی - حساب صندوق سالن رستوران',
    accountNumber: '9988776655',
    shabaNumber: 'IR990150000000998877665501',
    balanceIrr: 0,
  });

  const cash1 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-REST-01',
    titleFa: 'صندوق تحویل سفارشات و اسنپ‌فود',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (تأمین‌کننده مواد غذایی و خریدار شرکتی)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (تأمین‌کننده مواد اولیه و خریدار شرکتی)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'شرکت کشت و صنعت و گوشت البرز (تأمین‌کننده مواد اولیه)',
    companyNameFa: 'گوشت البرز',
    economicCode: '411333444555',
    phone: '02632221100',
    mobile: '09122223344',
    cityFa: 'کرج',
    status: 'ACTIVE',
  });

  const customer = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'شرکت مهندسی تکنوپارک (سفارشات شرکتی و پرسنلی)',
    companyNameFa: 'تکنوپارک',
    economicCode: '411888777666',
    phone: '02188776655',
    mobile: '09128887766',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف اقلام و غذاهای منوی رستوران
  // --------------------------------------------------------------------------
  console.log('۴. تعریف غذاها و نوشیدنی‌های منوی رستوران...');
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: چلوکباب کوبیده مخصوص
  const productKabab = foundationStore.createItem({
    itemCode: 'RST-KABAB-KOBIDEH',
    titleFa: 'چلوکباب کوبیده مخصوص دو سیخ (همراه با برنج ایرانی)',
    model: 'SPECIAL-KOBIDEH',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'پرس',
    purchasePriceIrr: 120_000,
    salesPriceIrr: 250_000,
    isSerialized: false,
    minStockAlert: 10,
    maxStockAlert: 500,
  }, 1);

  // کالا ۲: دوغ محلی
  const productDoogh = foundationStore.createItem({
    itemCode: 'RST-DOOGH-LOCAL',
    titleFa: 'دوغ محلی بومی بطری ۱ لیتری',
    model: 'DOOGH-1L',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'بطری',
    purchasePriceIrr: 20_000,
    salesPriceIrr: 50_000,
    isSerialized: false,
    minStockAlert: 20,
    maxStockAlert: 1000,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن صنف رستوران:
  // بدهکار:
  //   - بانک کشاورزی: 150,000,000
  //   - صندوق تحویل: 50,000,000
  //   - موجودی مواد اولیه (کباب: ۲۰ پرس @ 120,000 = 2,400,000 + دوغ: ۵۰ بطری @ 20,000 = 1,000,000 -> جمع: 3,400,000)
  //   مجموع بدهکار: 203,400,000 ریال
  // بستانکار:
  //   - طلب اولیه تأمین‌کننده گوشت البرز: 103,400,000
  //   - سرمایه اولیه و حقوق صاحبان سهام: 100,000,000
  //   مجموع بستانکار: 203,400,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ صنف رستوران و کافی‌شاپ',
    items: [
      { accountCode: '10101', titleFa: 'بانک کشاورزی - صندوق سالن', type: 'BANK_CASH' as const, refId: bank1.id, debitIrr: 150_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'صندوق تحویل سفارشات و اسنپ‌فود', type: 'BANK_CASH' as const, refId: cash1.id, debitIrr: 50_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی مواد اولیه - چلوکباب', type: 'INVENTORY' as const, refId: productKabab.id, debitIrr: 2_400_000, creditIrr: 0, qty: 20, unitCostIrr: 120_000, warehouseId: defaultWarehouse.id },
      { accountCode: '10502', titleFa: 'موجودی مواد اولیه - دوغ محلی', type: 'INVENTORY' as const, refId: productDoogh.id, debitIrr: 1_000_000, creditIrr: 0, qty: 50, unitCostIrr: 20_000, warehouseId: defaultWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی - گوشت البرز', type: 'PARTY' as const, refId: supplier.id, debitIrr: 0, creditIrr: 103_400_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه رستوران', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 100_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: ثبت فاکتور خرید مواد اولیه رستوران
  // --------------------------------------------------------------------------
  console.log('۶. ثبت فاکتور خرید مواد اولیه و نوشیدنی از گوشت البرز...');
  // خرید ۳۰ پرس کباب @ 120,000 = 3,600,000 + ۵۰ بطری دوغ @ 20,000 = 1,000,000. جمع: 4,600,000 ریال.
  // پرداخت ۲,۰۰۰,۰۰۰ ریال از بانک کشاورزی. مانده بدهی به تأمین‌کننده: 2,600,000 ریال.
  const purchaseInvoice = foundationStore.createPurchaseInvoice({
    supplierId: supplier.id,
    targetWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/05',
    notesFa: 'خرید شارژ مواد اولیه آشپزخانه رستوران',
    paidAmountIrr: 2_000_000,
    paymentMethod: 'BANK_TRANSFER',
    sourceBankAccountId: bank1.id,
    lines: [
      { itemId: productKabab.id, quantity: 30, unitPriceIrr: 120_000 },
      { itemId: productDoogh.id, quantity: 50, unitPriceIrr: 20_000 },
    ],
  }, 1);

  console.log(`   فاکتور خرید [${purchaseInvoice.invoiceNumber}] ثبت شد. مبلغ: ${purchaseInvoice.totalInvoicePayableToSupplierIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: ثبت سفارش سالن رستوران (Table 1 Order) با تسویه POS
  // --------------------------------------------------------------------------
  console.log('۷. ثبت فاکتور فروش سفارش سالن (۴ پرس کباب + ۴ بطری دوغ) با تسویه آنی POS...');
  // فروش ۴ کباب @ 250,000 = 1,000,000 + ۴ دوغ @ 50,000 = 200,000. جمع: 1,200,000 ریال.
  // تسویه کامل کارتخوان (bank1): 1,200,000 ریال.
  const salesInvoice1 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/10',
    notesFa: 'سفارش میز ۱ سالن رستوران',
    paidAmountIrr: 1_200_000,
    targetBankAccountId: bank1.id,
    paymentDetails: {
      paymentMethod: 'POS',
      posTerminalOrBank: bank1.bankNameFa,
    },
    lines: [
      { itemId: productKabab.id, quantity: 4, unitPriceIrr: 250_000 },
      { itemId: productDoogh.id, quantity: 4, unitPriceIrr: 50_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش سالن [${salesInvoice1.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice1.totalInvoiceAmountIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۸: ثبت فاکتور سفارش پرسنلی و شرکتی (Takeaway / Corporate Order)
  // --------------------------------------------------------------------------
  console.log('۸. ثبت فاکتور سفارش ناهار پرسنلی تکنوپارک (۱۰ پرس کباب + ۱۰ بطری دوغ)...');
  // فروش ۱۰ کباب @ 250,000 = 2,500,000 + ۱۰ دوغ @ 50,000 = 500,000. جمع: 3,000,000 ریال.
  // پیش‌پرداخت نقدی: 1,000,000 ریال به صندوق. مانده: 2,000,000 ریال به حساب دفتری خریدار.
  const salesInvoice2 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/15',
    notesFa: 'سفارش ناهار پرسنلی تکنوپارک',
    paidAmountIrr: 1_000_000,
    targetCashBoxId: cash1.id,
    paymentDetails: {
      paymentMethod: 'CASH',
      posTerminalOrBank: 'صندوق تحویل سفارشات',
    },
    lines: [
      { itemId: productKabab.id, quantity: 10, unitPriceIrr: 250_000 },
      { itemId: productDoogh.id, quantity: 10, unitPriceIrr: 50_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش شرکتی [${salesInvoice2.invoiceNumber}] ثبت شد. مانده بدهی: ${salesInvoice2.remainingBalanceIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ممیزی جامع حسابداری و موجودی رستوران
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار (Restaurant):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی موجودی انبار غذاها و نوشیدنی‌ها
  // کباب: ۲۰ افتتاحیه + ۳۰ خرید - ۱۴ فروش = ۳۶ پرس
  // دوغ: ۵۰ افتتاحیه + ۵۰ خرید - ۱۴ فروش = ۸۶ بطری
  const items = foundationStore.getItems();
  const kababItem = items.find((i) => i.id === productKabab.id);
  const dooghItem = items.find((i) => i.id === productDoogh.id);

  const kababStock = kababItem?.totalStock ?? 0;
  const dooghStock = dooghItem?.totalStock ?? 0;

  console.log(`📦 موجودی انبار اقلام رستوران:`);
  console.log(`   - چلوکباب کوبیده مخصوص: ${kababStock} پرس (مورد انتظار: 36)`);
  console.log(`   - دوغ محلی ۱ لیتری: ${dooghStock} بطری (مورد انتظار: 86)`);

  if (kababStock !== 36) {
    console.error(`❌ مغایرت انبار چلوکباب: باید ۳۶ پرس باشد اما ${kababStock} است.`);
    discrepanciesCount++;
  }
  if (dooghStock !== 86) {
    console.error(`❌ مغایرت انبار دوغ: باید ۸۶ بطری باشد اما ${dooghStock} است.`);
    discrepanciesCount++;
  }

  // ۲. ممیزی نقدینگی، بانک‌ها و صندوق‌ها
  // بانک کشاورزی (bank1): 150m افتتاحیه - 2m پرداخت خرید + 1.2m فروش۱ = 149,200,000 ریال
  // صندوق تحویل (cash1): 50m افتتاحیه + 1m پیش‌پرداخت فروش۲ = 51,000,000 ریال
  // جمع کل نقدینگی: 149,200,000 + 51,000,000 = 200,200,000 ریال
  const b1 = foundationStore.getBankAccounts().find((b) => b.id === bank1.id)?.balanceIrr || 0;
  const c1 = foundationStore.getCashBoxes().find((c) => c.id === cash1.id)?.balanceIrr || 0;
  const totalCashBank = b1 + c1;

  console.log(`💳 مانده حساب‌های بانکی و صندوق رستوران:`);
  console.log(`   - بانک کشاورزی: ${b1.toLocaleString()} ریال (مورد انتظار: 149,200,000)`);
  console.log(`   - صندوق تحویل: ${c1.toLocaleString()} ریال (مورد انتظار: 51,000,000)`);
  console.log(`   جمع کل نقدینگی: ${totalCashBank.toLocaleString()} ریال (مورد انتظار: 200,200,000)`);

  if (b1 !== 149_200_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک کشاورزی: ${b1}`); }
  if (c1 !== 51_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق تحویل: ${c1}`); }

  // ۳. صورت سود و زیان (P&L)
  // درآمد کل فروش: ۱,۲۰۰,۰۰۰ (فروش۱) + ۳,۰۰۰,۰۰۰ (فروش۲) = ۴,۲۰0,۰۰۰ ریال
  // بهای تمام‌شده COGS:
  //   - کباب: ۱۴ پرس @ 120,000 = 1,680,000
  //   - دوغ: ۱۴ بطری @ 20,000 = 280,000
  //   مجموع بهای تمام‌شده: 1,960,000 ریال
  // سود ناخالص: ۴,۲۰۰,۰۰۰ - ۱,۹۶۰,۰۰۰ = ۲,۲۴۰,۰۰۰ ریال (۵۳.۳۳٪)
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;

  console.log(`📊 صورت سود و زیان رستوران (P&L Report):`);
  console.log(`   - درآمد کل فروش: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 4,200,000)`);
  console.log(`   - بهای تمام‌شده COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 1,960,000)`);
  console.log(`   - سود ناخالص عملیاتی: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 2,240,000)`);

  if (pnl.totalNetSalesIrr !== 4_200_000) discrepanciesCount++;
  if (pnl.totalCogsIrr !== 1_960_000) discrepanciesCount++;
  if (pnl.totalGrossProfitIrr !== 2_240_000) discrepanciesCount++;

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
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۴ (Restaurant & Cafe):`);
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

runIndustryRestaurantAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Restaurant Industry acceptance scenario:', err);
  process.exit(1);
});
