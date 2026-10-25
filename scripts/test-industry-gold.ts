import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryGoldAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۳: طلا، جواهر، سکه و صرافی');
  console.log('   (Mehregan Business Suite - Industry 3: Gold & Jewelry)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ صنف فعال به طلا و جواهر
  foundationStore.updateSettings({ industryProfileCode: 'GOLD_JEWELRY' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف حساب‌های بانکی و صندوق‌های خزانه‌داری صنف طلا
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد حساب‌های بانکی و صندوق گالری طلا...');
  const bank1 = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک صادرات - حساب اصلی بنکداری طلا',
    accountNumber: '1122334455',
    shabaNumber: 'IR110190000000112233445501',
    balanceIrr: 0,
  });

  const bank2 = foundationStore.createBankAccount({
    accountCode: '10101-02',
    bankNameFa: 'بانک سامان - کارتخوان گالری طلا',
    accountNumber: '5544332211',
    shabaNumber: 'IR550560000000554433221102',
    balanceIrr: 0,
  });

  const cash1 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-GOLD-01',
    titleFa: 'صندوق گالری و ویترین طلا',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (همکار بنکدار طلا و مشتری خریدار)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (همکار بنکدار طلا و خریدار سکه/طلا)...');
  const colleagueParty = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'بنکداری و کارگاه طلاسازی امیری (همکار طلافروش)',
    companyNameFa: 'طلاسازی امیری',
    economicCode: '411222333444',
    phone: '02133998877',
    mobile: '09121112233',
    cityFa: 'تهران (بازار بزرگ)',
    status: 'ACTIVE',
  });

  const customerParty = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'آقای محمد حسینی (خریدار طلا و سکه)',
    mobile: '09129998877',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف اقلام و محصولات طلا و سکه
  // --------------------------------------------------------------------------
  console.log('۴. تعریف محصولات طلا و سکه...');
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: طلای آبشده ۱۸ عیار (۷۵۰)
  const productGoldMelted = foundationStore.createItem({
    itemCode: 'GLD-MELTED-18K',
    titleFa: 'طلای آبشده ۱۸ عیار (شمش ۷۵۰)',
    model: '18K-MELTED',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'گرم',
    purchasePriceIrr: 48_000_000,
    salesPriceIrr: 50_000_000,
    isSerialized: false,
    minStockAlert: 10,
    maxStockAlert: 1000,
  }, 1);

  // کالا ۲: سکه تمام بهار آزادی طرح جدید (امامی)
  const productCoinEmami = foundationStore.createItem({
    itemCode: 'GLD-COIN-EMAMI',
    titleFa: 'سکه تمام بهار آزادی طرح جدید (امامی)',
    model: 'EMAMI-COIN',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'عدد',
    purchasePriceIrr: 500_000_000,
    salesPriceIrr: 520_000_000,
    isSerialized: false,
    minStockAlert: 2,
    maxStockAlert: 50,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن صنف طلا و جواهر:
  // بدهکار:
  //   - بانک صادرات: 300,000,000
  //   - صندوق گالری: 100,000,000
  //   - موجودی انبار طلا (طلای آبشده: ۵۰ گرم @ 48,000,000 = 2,400,000,000)
  //   مجموع بدهکار: 2,800,000,000 ریال
  // بستانکار:
  //   - طلب اولیه بنکدار امیری (حساب پرداختنی): 500,000,000
  //   - سرمایه اولیه و حقوق صاحبان سهام: 2,300,000,000
  //   مجموع بستانکار: 2,800,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ صنف طلا، جواهر و سکه',
    items: [
      { accountCode: '10101', titleFa: 'بانک صادرات - بنکداری طلا', type: 'BANK_CASH' as const, refId: bank1.id, debitIrr: 300_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'صندوق گالری و ویترین طلا', type: 'BANK_CASH' as const, refId: cash1.id, debitIrr: 100_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی انبار طلا - طلای آبشده ۱۸ عیار', type: 'INVENTORY' as const, refId: productGoldMelted.id, debitIrr: 2_400_000_000, creditIrr: 0, qty: 50, unitCostIrr: 48_000_000, warehouseId: defaultWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی - بنکداری امیری', type: 'PARTY' as const, refId: colleagueParty.id, debitIrr: 0, creditIrr: 500_000_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه گالری طلا', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 2_300_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: ثبت معاملات وزنی طلا با همکار (Gold Colleague Trades - No Rial)
  // --------------------------------------------------------------------------
  console.log('۶. ثبت معاملات صرفاً وزنی طلا (دفتر دووجهی وزنی/ریالی)...');
  // معامله ۱: تحویل/فروش گرمی طلا به همکار امیری (۱۰۰ گرم خام، عیار ۷۵۰، ۵ گرم اجرت).
  // مجموع اثر وزنی طلا = ۱۰۵ گرم ۷۵۰. همکار ۱۰۵ گرم بدهکار طلا می‌شود.
  const trade1 = foundationStore.createGoldColleagueTrade({
    tradeType: 'COLLEAGUE_WEIGHT_SALE',
    partyId: colleagueParty.id,
    goldItemCategory: 'MELTED_GOLD',
    rawWeightGrams: 100,
    stoneWeightGrams: 0,
    ayar: 750,
    makingWageGrams: 5,
    isPureGoldTradeNoRial: true,
    descriptionFa: 'تحویل ۱۰۰ گرم طلای آبشده + ۵ گرم ساخت به کارگاه امیری',
    dateJalali: '1405/01/05',
  }, 1);

  console.log(`   معامله ۱ [${trade1.tradeNumber}] ثبت شد: ${trade1.totalGoldEffectGrams} گرم ۷۵۰ بدهکار وزنی همکار.`);

  // معامله ۲: دریافت ۵۰ گرم طلا از همکار امیری بابت تسویه بخشی از بدهی وزنی.
  // اثر وزنی طلا = -۵۰ گرم ۷۵۰.
  const trade2 = foundationStore.createGoldColleagueTrade({
    tradeType: 'COLLEAGUE_WEIGHT_RECEIPT',
    partyId: colleagueParty.id,
    goldItemCategory: 'MELTED_GOLD',
    rawWeightGrams: 50,
    stoneWeightGrams: 0,
    ayar: 750,
    makingWageGrams: 0,
    isPureGoldTradeNoRial: true,
    descriptionFa: 'دریافت ۵۰ گرم طلای آبشده بابت تسویه وزنی همکار',
    dateJalali: '1405/01/08',
  }, 1);

  console.log(`   معامله ۲ [${trade2.tradeNumber}] ثبت شد: ${Math.abs(trade2.totalGoldEffectGrams)} گرم ۷۵۰ دریافت گردید.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: ثبت فاکتور خرید سکه از همکار
  // --------------------------------------------------------------------------
  console.log('۷. ثبت فاکتور خرید ۵ عدد سکه امامی از بنکداری امیری...');
  // خرید ۵ عدد سکه @ 500,000,000 = 2,500,000,000 ریال.
  // پرداخت نقدی/بانک: 0 ریال (تماماً به حساب دفتری بنکدار امیری برده می‌شود).
  const purchaseInvoice = foundationStore.createPurchaseInvoice({
    supplierId: colleagueParty.id,
    targetWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/10',
    notesFa: 'خرید ۵ عدد سکه تمام امامی از بنکداری امیری',
    paidAmountIrr: 0,
    lines: [
      { itemId: productCoinEmami.id, quantity: 5, unitPriceIrr: 500_000_000 },
    ],
  }, 1);

  console.log(`   فاکتور خرید سکه [${purchaseInvoice.invoiceNumber}] ثبت شد. مبلغ: ${purchaseInvoice.totalInvoicePayableToSupplierIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۸: ثبت فاکتور فروش ریالی سکه به مشتری با تسویه کارتخوان
  // --------------------------------------------------------------------------
  console.log('۸. ثبت فاکتور فروش ۲ عدد سکه امامی به آقای حسینی با تسویه کارتخوان...');
  // فروش ۲ سکه @ 520,000,000 = 1,040,000,000 ریال.
  // تسویه کامل با کارتخوان سامان (bank2): 1,040,000,000 ریال.
  const salesInvoice1 = foundationStore.createSalesInvoice({
    customerId: customerParty.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/12',
    notesFa: 'فروش ۲ عدد سکه امامی با تسویه کارتخوان گالری',
    paidAmountIrr: 1_040_000_000,
    targetBankAccountId: bank2.id,
    paymentDetails: {
      paymentMethod: 'POS',
      posTerminalOrBank: bank2.bankNameFa,
    },
    lines: [
      { itemId: productCoinEmami.id, quantity: 2, unitPriceIrr: 520_000_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش سکه [${salesInvoice1.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice1.totalInvoiceAmountIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ثبت فاکتور فروش طلای آبشده با تسویه نقدی و مانده
  // --------------------------------------------------------------------------
  console.log('۹. ثبت فاکتور فروش ۱۰ گرم طلای آبشده به آقای حسینی...');
  // فروش ۱۰ گرم طلای آبشده @ 50,000,000 = 500,000,000 ریال.
  // پیش‌پرداخت نقدی به صندوق: 200,000,000 ریال. مانده بدهی: 300,000,000 ریال.
  const salesInvoice2 = foundationStore.createSalesInvoice({
    customerId: customerParty.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/15',
    notesFa: 'فروش ۱۰ گرم طلای آبشده به آقای حسینی',
    paidAmountIrr: 200_000_000,
    targetCashBoxId: cash1.id,
    paymentDetails: {
      paymentMethod: 'CASH',
      posTerminalOrBank: 'صندوق گالری',
    },
    lines: [
      { itemId: productGoldMelted.id, quantity: 10, unitPriceIrr: 50_000_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش طلای آبشده [${salesInvoice2.invoiceNumber}] ثبت شد. مانده بدهی مشتری: ${salesInvoice2.remainingBalanceIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۱۰: ممیزی جامع حسابداری وزنی و ریالی صنف طلا
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای وزنی/ریالی و مالی (Gold):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی دفتر معین دووجهی طلا (Gold Dual Ledger)
  // همکار طلافروش (بنکداری امیری):
  //   - مانده وزنی طلا: +۱۰۵ - ۵۰ = +۵۵ گرم ۷۵۰ (۵۵ گرم بدهکار طلا)
  //   - مانده ریالی دفتری: ۵۰۰m افتتاحیه بستانکار + ۲,۵۰۰m خرید سکه = ۳,۰۰۰,۰۰۰,۰۰۰ بستانکار ریالی (+3,000,000,000)
  const colleagueDualLedger = foundationStore.getGoldDualLedger(colleagueParty.id);
  console.log(`⚖️ دفتر معین دووجهی همکار (Gold Dual Ledger):`);
  console.log(`   - مانده وزنی طلا: ${colleagueDualLedger.summary.goldBalanceGrams} گرم ۷۵۰ (${colleagueDualLedger.summary.goldBalanceStatusFa}) [مورد انتظار: 55 گرم]`);
  console.log(`   - مانده ریالی دفتری: ${colleagueDualLedger.summary.netBalanceIrr.toLocaleString()} ریال [مورد انتظار: 3,000,000,000 بستانکار]`);

  if (colleagueDualLedger.summary.goldBalanceGrams !== 55) {
    console.error(`❌ مغایرت وزنی طلا: مانده باید ۵۵ گرم باشد اما ${colleagueDualLedger.summary.goldBalanceGrams} است.`);
    discrepanciesCount++;
  }
  if (Math.abs(colleagueDualLedger.summary.netBalanceIrr) !== 3_000_000_000) {
    console.error(`❌ مغایرت ریالی همکار: مانده باید ۳,۰۰۰,۰۰۰,۰۰۰ بستانکار باشد اما ${colleagueDualLedger.summary.netBalanceIrr} است.`);
    discrepanciesCount++;
  }

  // ۲. ممیزی موجودی انبار کالاها
  // طلای آبشده: ۵۰ افتتاحیه - ۱۰ فروش = ۴۰ گرم
  // سکه امامی: ۰ افتتاحیه + ۵ خرید - ۲ فروش = ۳ عدد
  const items = foundationStore.getItems();
  const goldMeltedItem = items.find((i) => i.id === productGoldMelted.id);
  const coinEmamiItem = items.find((i) => i.id === productCoinEmami.id);

  const meltedStock = goldMeltedItem?.totalStock ?? 0;
  const coinStock = coinEmamiItem?.totalStock ?? 0;

  console.log(`📦 موجودی انبار اقلام گالری:`);
  console.log(`   - طلای آبشده ۱۸ عیار: ${meltedStock} گرم (مورد انتظار: 40)`);
  console.log(`   - سکه تمام امامی: ${coinStock} عدد (مورد انتظار: 3)`);

  if (meltedStock !== 40) {
    console.error(`❌ مغایرت انبار طلای آبشده: باید ۴۰ گرم باشد اما ${meltedStock} است.`);
    discrepanciesCount++;
  }
  if (coinStock !== 3) {
    console.error(`❌ مغایرت انبار سکه امامی: باید ۳ عدد باشد اما ${coinStock} است.`);
    discrepanciesCount++;
  }

  // ۳. ممیزی نقدینگی، بانک‌ها و صندوق‌ها
  // بانک صادرات (bank1): افتتاحیه 300,000,000
  // بانک سامان (bank2): فروش سکه 1,040,000,000
  // صندوق گالری (cash1): افتتاحیه 100m + فروش۲ پیش‌پرداخت 200m = 300,000,000
  // جمع کل نقدینگی: 300m + 1,040m + 300m = 1,640,000,000 ریال
  const b1 = foundationStore.getBankAccounts().find((b) => b.id === bank1.id)?.balanceIrr || 0;
  const b2 = foundationStore.getBankAccounts().find((b) => b.id === bank2.id)?.balanceIrr || 0;
  const c1 = foundationStore.getCashBoxes().find((c) => c.id === cash1.id)?.balanceIrr || 0;
  const totalCashBank = b1 + b2 + c1;

  console.log(`💳 مانده حساب‌های بانکی و صندوق گالری:`);
  console.log(`   - بانک صادرات: ${b1.toLocaleString()} ریال (مورد انتظار: 300,000,000)`);
  console.log(`   - بانک سامان: ${b2.toLocaleString()} ریال (مورد انتظار: 1,040,000,000)`);
  console.log(`   - صندوق گالری: ${c1.toLocaleString()} ریال (مورد انتظار: 300,000,000)`);
  console.log(`   جمع کل نقدینگی: ${totalCashBank.toLocaleString()} ریال (مورد انتظار: 1,640,000,000)`);

  if (b1 !== 300_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک صادرات: ${b1}`); }
  if (b2 !== 1_040_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک سامان: ${b2}`); }
  if (c1 !== 300_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق گالری: ${c1}`); }

  // ۴. صورت سود و زیان (P&L)
  // درآمد کل فروش: ۱,۰۴۰m (فروش سکه) + ۵۰۰m (فروش طلا) = ۱,۵۴۰,۰۰۰,۰۰۰ ریال
  // بهای تمام‌شده COGS:
  //   - سکه: ۲ عدد @ 500m = 1,000,000,000
  //   - طلای آبشده: ۱۰ گرم @ 48m = 480,000,000
  //   مجموع بهای تمام‌شده: 1,480,000,000 ریال
  // سود ناخالص: ۱,۵۴۰m - ۱,۴۸۰m = ۶۰,۰۰۰,۰۰۰ ریال
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;

  console.log(`📊 صورت سود و زیان گالری طلا (P&L Report):`);
  console.log(`   - درآمد کل فروش: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 1,540,000,000)`);
  console.log(`   - بهای تمام‌شده COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 1,480,000,000)`);
  console.log(`   - سود ناخالص عملیاتی: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 60,000,000)`);

  if (pnl.totalNetSalesIrr !== 1_540_000_000) discrepanciesCount++;
  if (pnl.totalCogsIrr !== 1_480_000_000) discrepanciesCount++;
  if (pnl.totalGrossProfitIrr !== 60_000_000) discrepanciesCount++;

  // ۵. تراز آزمایشی و توازن دفتر کل
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
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۳ (Gold & Jewelry):`);
  console.log(`   تعداد کل مغایرت‌های کشف‌شده: ${discrepanciesCount}`);
  if (discrepanciesCount === 0) {
    console.log('   🎉 هیچ‌گونه مغایرتی یافت نشد؛ تمامی ترازها، حساب‌های دووجهی وزنی/ریالی، موجودی طلا و سودآوری ۱۰۰٪ مطابق محاسبات دقیق حسابداری پذیرفته شدند.');
  } else {
    console.error(`   ⚠️ تعداد ${discrepanciesCount} مغایرت کشف گردید.`);
  }
  console.log('========================================================================');

  if (discrepanciesCount > 0) {
    process.exit(1);
  }
}

runIndustryGoldAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Gold Industry acceptance scenario:', err);
  process.exit(1);
});
