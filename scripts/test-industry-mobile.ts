import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryMobileAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۶: موبایل، لپ‌تاپ و خدمات تعمیرات');
  console.log('   (Mehregan Business Suite - Industry 6: Mobile & Repair)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ صنف فعال به موبایل و تعمیرات
  foundationStore.updateSettings({ industryProfileCode: 'MOBILE_REPAIR' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف حساب‌های بانکی و صندوق‌های مرکز تعمیرات و فروش
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد حساب‌های بانکی و صندوق مرکز خدمات و فروش موبایل...');
  const bank1 = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک پاسارگاد - حساب جاری فروشگاه و خدمات فنی',
    accountNumber: '3322110099',
    shabaNumber: 'IR330570000000332211009901',
    balanceIrr: 0,
  });

  const cash1 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-MOB-01',
    titleFa: 'صندوق تحویل و پذیرش فنی',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (واردکننده قطعات/گوشی و مشتری پذیرش)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (واردکننده قطعات و مشتری پذیرش تعمیرات)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'شرکت بازرگانی پارس پرداز (واردکننده قطعات و گوشی)',
    companyNameFa: 'پارس پرداز',
    economicCode: '411666777888',
    phone: '02166778899',
    mobile: '09126667788',
    cityFa: 'تهران (علاءالدین)',
    status: 'ACTIVE',
  });

  const customer = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'آقای علی رضایی (مشتری خرید گوشی و پذیرش تعمیرات)',
    mobile: '09127778899',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف اقلام (گوشی موبایل IMEI دار و قطعات یدکی)
  // --------------------------------------------------------------------------
  console.log('۴. تعریف محصولات گوشی موبایل و قطعات یدکی...');
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: گوشی موبایل سامسونگ Galaxy A55
  const productPhone = foundationStore.createItem({
    itemCode: 'MOB-SAMSUNG-A55',
    titleFa: 'گوشی موبایل سامسونگ Galaxy A55 256GB (پک ویتنام)',
    model: 'GALAXY-A55',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 180_000_000,
    salesPriceIrr: 210_000_000,
    isSerialized: true,
    hasMacAddress: true,
    minStockAlert: 2,
    maxStockAlert: 50,
  }, 1);

  // کالا ۲: تاچ و ال‌سی‌دی اورجینال سامسونگ A55
  const productScreen = foundationStore.createItem({
    itemCode: 'MOB-LCD-A55',
    titleFa: 'تاچ و ال‌سی‌دی اورجینال سامسونگ A55 (قطعه یدکی)',
    model: 'LCD-A55-ORIG',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'عدد',
    purchasePriceIrr: 30_000_000,
    salesPriceIrr: 45_000_000,
    isSerialized: false,
    minStockAlert: 5,
    maxStockAlert: 100,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن صنف موبایل و تعمیرات:
  // بدهکار:
  //   - بانک پاسارگاد: 400,000,000
  //   - صندوق پذیرش: 100,000,000
  //   - موجودی انبار کالا (گوشی: ۲ دستگاه @ 180,000,000 = 360,000,000 + ال‌سی‌دی: ۵ عدد @ 30,000,000 = 150,000,000 -> جمع: 510,000,000)
  //   مجموع بدهکار: 1,010,000,000 ریال
  // بستانکار:
  //   - طلب اولیه پارس پرداز: 510,000,000
  //   - سرمایه اولیه مرکز موبایل: 500,000,000
  //   مجموع بستانکار: 1,010,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ صنف موبایل، لپ‌تاپ و خدمات فنی',
    items: [
      { accountCode: '10101', titleFa: 'بانک پاسارگاد - حساب جاری فروشگاه', type: 'BANK_CASH' as const, refId: bank1.id, debitIrr: 400_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'صندوق تحویل و پذیرش فنی', type: 'BANK_CASH' as const, refId: cash1.id, debitIrr: 100_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی انبار کالا - گوشی سامسونگ A55', type: 'INVENTORY' as const, refId: productPhone.id, debitIrr: 360_000_000, creditIrr: 0, qty: 2, unitCostIrr: 180_000_000, warehouseId: defaultWarehouse.id },
      { accountCode: '10502', titleFa: 'موجودی انبار قطعات - تاچ و ال‌سی‌دی', type: 'INVENTORY' as const, refId: productScreen.id, debitIrr: 150_000_000, creditIrr: 0, qty: 5, unitCostIrr: 30_000_000, warehouseId: defaultWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی - پارس پرداز', type: 'PARTY' as const, refId: supplier.id, debitIrr: 0, creditIrr: 510_000_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه مرکز موبایل', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 500_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: ثبت فاکتور خرید جدید قطعات و گوشی از پارس پرداز
  // --------------------------------------------------------------------------
  console.log('۶. ثبت فاکتور خرید گوشی و قطعات از پارس پرداز...');
  // خرید ۲ دستگاه گوشی A55 @ 180m = 360,000,000 + ۵ عدد ال‌سی‌دی @ 30m = 150,000,000. جمع: 510,000,000 ریال.
  // پرداخت ۲۰۰,۰۰۰,۰۰۰ ریال از بانک پاسارگاد. مانده بدهی به پارس پرداز: 310,000,000 ریال.
  const purchaseInvoice = foundationStore.createPurchaseInvoice({
    supplierId: supplier.id,
    targetWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/05',
    notesFa: 'خرید شارژ گوشی‌های جدید و قطعات یدکی ال‌سی‌دی',
    paidAmountIrr: 200_000_000,
    paymentMethod: 'BANK_TRANSFER',
    sourceBankAccountId: bank1.id,
    lines: [
      { itemId: productPhone.id, quantity: 2, unitPriceIrr: 180_000_000, serialNumbers: ['IMEI-354988112233441', 'IMEI-354988112233442'] },
      { itemId: productScreen.id, quantity: 5, unitPriceIrr: 30_000_000 },
    ],
  }, 1);

  console.log(`   فاکتور خرید [${purchaseInvoice.invoiceNumber}] ثبت شد. مبلغ: ${purchaseInvoice.totalInvoicePayableToSupplierIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: ثبت فاکتور فروش گوشی موبایل با تسویه کارتخوان
  // --------------------------------------------------------------------------
  console.log('۷. ثبت فاکتور فروش ۱ دستگاه گوشی سامسونگ A55 به آقای رضایی...');
  // فروش ۱ دستگاه گوشی A55 @ 210,000,000 ریال.
  // تسویه کامل کارتخوان (bank1): 210,000,000 ریال.
  const salesInvoice1 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/10',
    notesFa: 'فروش با استعلام کد همتا و فعال‌سازی آنی',
    paidAmountIrr: 210_000_000,
    targetBankAccountId: bank1.id,
    paymentDetails: {
      paymentMethod: 'POS',
      posTerminalOrBank: bank1.bankNameFa,
    },
    lines: [
      { itemId: productPhone.id, quantity: 1, unitPriceIrr: 210_000_000, serialNumbers: ['IMEI-354988112233441'] },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش گوشی [${salesInvoice1.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice1.totalInvoiceAmountIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۸: ثبت فاکتور تعمیرات و تعویض ال‌سی‌دی گوشی
  // --------------------------------------------------------------------------
  console.log('۸. ثبت فاکتور پذیرش و خدمات تعویض ال‌سی‌دی برای آقای رضایی...');
  // هزینه اجرت تعمیرات: ۱۵,۰۰۰,۰۰۰ + ۱ عدد قطعه ال‌سی‌دی @ ۴۵,۰۰۰,۰۰۰ = ۶۰,۰۰۰,۰۰۰ ریال.
  // پیش‌پرداخت نقدی: ۳۰,۰۰۰,۰۰۰ ریال به صندوق. مانده: ۳۰,۰۰۰,۰۰۰ ریال.
  const salesInvoice2 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/15',
    notesFa: 'قبض خدمات تعویض تاچ و ال‌سی‌دی گوشی سامسونگ A55',
    paidAmountIrr: 30_000_000,
    targetCashBoxId: cash1.id,
    paymentDetails: {
      paymentMethod: 'CASH',
      posTerminalOrBank: 'صندوق پذیرش فنی',
    },
    lines: [
      { itemId: productScreen.id, quantity: 1, unitPriceIrr: 45_000_000 },
    ],
  } as any, 1);

  // ثبت اجرت خدمات فنی در درآمد
  foundationStore.createOperationalIncome({
    categoryFa: 'درآمد خدمات تعمیرات فنی',
    titleFa: 'اجرت تعویض ال‌سی‌دی و عیب‌یابی گوشی آقای رضایی',
    amountIrr: 15_000_000,
    receiptMethod: 'CASH',
    targetCashBoxId: cash1.id,
    targetBankOrCash: 'صندوق پذیرش فنی',
    dateJalali: '1405/01/15',
  }, 1);

  console.log(`   فاکتور خدمات تعمیرات [${salesInvoice2.invoiceNumber}] ثبت گردید.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ممیزی جامع حسابداری و انبار موبایل و تعمیرات
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار (Mobile):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی موجودی انبار اقلام گوشی و قطعات
  // گوشی A55: ۲ افتتاحیه + ۲ خرید - ۱ فروش = ۳ دستگاه
  // تاچ ال‌سی‌دی: ۵ افتتاحیه + ۵ خرید - ۱ مصرف تعمیرات = ۹ عدد
  const items = foundationStore.getItems();
  const phoneItem = items.find((i) => i.id === productPhone.id);
  const screenItem = items.find((i) => i.id === productScreen.id);

  const phoneStock = phoneItem?.totalStock ?? 0;
  const screenStock = screenItem?.totalStock ?? 0;

  console.log(`📦 موجودی انبار گوشی و قطعات:`);
  console.log(`   - گوشی سامسونگ A55: ${phoneStock} دستگاه (مورد انتظار: 3)`);
  console.log(`   - تاچ و ال‌سی‌دی اورجینال: ${screenStock} عدد (مورد انتظار: 9)`);

  if (phoneStock !== 3) {
    console.error(`❌ مغایرت انبار گوشی: باید ۳ دستگاه باشد اما ${phoneStock} است.`);
    discrepanciesCount++;
  }
  if (screenStock !== 9) {
    console.error(`❌ مغایرت انبار ال‌سی‌دی: باید ۹ عدد باشد اما ${screenStock} است.`);
    discrepanciesCount++;
  }

  // ۲. ممیزی نقدینگی، بانک‌ها و صندوق‌ها
  // بانک پاسارگاد (bank1): 400m افتتاحیه - 200m پرداخت خرید + 210m فروش کارتخوان = 410,000,000 ریال
  // صندوق پذیرش (cash1): 100m افتتاحیه + 30m پیش‌پرداخت قطعه + 15m اجرت تعمیرات = 145,000,000 ریال
  // جمع کل نقدینگی: 410,000,000 + 145,000,000 = 555,000,000 ریال
  const b1 = foundationStore.getBankAccounts().find((b) => b.id === bank1.id)?.balanceIrr || 0;
  const c1 = foundationStore.getCashBoxes().find((c) => c.id === cash1.id)?.balanceIrr || 0;
  const totalCashBank = b1 + c1;

  console.log(`💳 مانده حساب‌های بانکی و صندوق مرکز خدمات:`);
  console.log(`   - بانک پاسارگاد: ${b1.toLocaleString()} ریال (مورد انتظار: 410,000,000)`);
  console.log(`   - صندوق پذیرش فنی: ${c1.toLocaleString()} ریال (مورد انتظار: 145,000,000)`);
  console.log(`   جمع کل نقدینگی: ${totalCashBank.toLocaleString()} ریال (مورد انتظار: 555,000,000)`);

  if (b1 !== 410_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک پاسارگاد: ${b1}`); }
  if (c1 !== 145_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق پذیرش: ${c1}`); }

  // ۳. صورت سود و زیان (P&L)
  // درآمد کل: ۲۱۰m (فروش گوشی) + ۴۵m (فروش قطعه) + ۱۵m (درآمد اجرت تعمیرات) = ۲۷۰,۰۰۰,۰۰۰ ریال
  // بهای تمام‌شده COGS:
  //   - گوشی: ۱۸۰,۰۰۰,۰۰۰
  //   - ال‌سی‌دی: ۳۰,۰۰۰,۰۰۰
  //   مجموع بهای تمام‌شده: 210,000,000 ریال
  // سود ناخالص: ۲۷۰m - ۲۱۰m = ۶۰,۰۰۰,۰۰۰ ریال
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;

  console.log(`📊 صورت سود و زیان مرکز خدمات موبایل (P&L Report):`);
  console.log(`   - درآمد کل فروش و خدمات: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 255,000,000 فاکتوری)`);
  console.log(`   - بهای تمام‌شده COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 210,000,000)`);
  console.log(`   - سود ناخالص عملیاتی: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 45,000,000 ناخالص فروش)`);

  if (pnl.totalCogsIrr !== 210_000_000) discrepanciesCount++;

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
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۶ (Mobile & Repair):`);
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

runIndustryMobileAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Mobile Industry acceptance scenario:', err);
  process.exit(1);
});
