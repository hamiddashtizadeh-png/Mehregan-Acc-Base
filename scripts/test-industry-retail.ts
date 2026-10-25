import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryRetailAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۲: فروشگاه و خرده‌فروشی عمومی');
  console.log('   (Mehregan Business Suite - Industry 2: Retail & General Store)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ صنف فعال به فروشگاه و خرده‌فروشی عمومی
  foundationStore.updateSettings({ industryProfileCode: 'RETAIL_GENERAL' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف حساب‌های بانکی و صندوق‌های خزانه‌داری
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد ۲ حساب بانکی و ۲ صندوق نقدی برای خرده‌فروشی...');
  const bank1 = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک تجارت - حساب جاری فروشگاه',
    accountNumber: '4455667788',
    shabaNumber: 'IR990180000000445566778801',
    balanceIrr: 0,
  });

  const bank2 = foundationStore.createBankAccount({
    accountCode: '10101-02',
    bankNameFa: 'بانک سامان - حساب POS کارتخوان',
    accountNumber: '8877665544',
    shabaNumber: 'IR880560000000887766554402',
    balanceIrr: 0,
  });

  const cash1 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-101',
    titleFa: 'صندوق اصلی فروشگاه (POS)',
    balanceIrr: 0,
  });

  const cash2 = foundationStore.createCashBox({
    cashBoxCode: 'CSH-102',
    titleFa: 'تنخواه‌گردان خرید خرد',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (تأمین‌کننده عمده و مشتری دفتری)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (تأمین‌کننده کالای عمومی و خریدار دفتری)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'شرکت پخش سراسری کالای طباطبایی (تأمین‌کننده لوازم خانگی و شوینده)',
    companyNameFa: 'پخش طباطبایی',
    economicCode: '411122334455',
    phone: '02155667788',
    mobile: '09121119988',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  const customer = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'هایپرمارکت آفتاب البرز (خریدار عمده و دفتری)',
    companyNameFa: 'هایپر آفتاب',
    economicCode: '411998877665',
    phone: '02633445566',
    mobile: '09123338877',
    cityFa: 'کرج',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف محصولات خرده‌فروشی عمومی
  // --------------------------------------------------------------------------
  console.log('۴. تعریف کالاها و اقلام فروشگاهی بارکدی...');
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: چای‌ساز برقی بارکدی
  const productTeaMaker = foundationStore.createItem({
    itemCode: 'RTL-TEA-MAKER',
    titleFa: 'چای‌ساز برقی استیل پارس خزر Model T-2000',
    model: 'T-2000',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 20_000_000,
    salesPriceIrr: 30_000_000,
    isSerialized: false,
    minStockAlert: 5,
    maxStockAlert: 100,
  }, 1);

  // کالا ۲: سرخ‌کن بدون روغن (Air Fryer)
  const productAirFryer = foundationStore.createItem({
    itemCode: 'RTL-AIR-FRYER',
    titleFa: 'سرخ‌کن بدون روغن فیلیپس Model HD9270',
    model: 'HD9270',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 50_000_000,
    salesPriceIrr: 75_000_000,
    isSerialized: false,
    minStockAlert: 2,
    maxStockAlert: 50,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن صنف خرده‌فروشی:
  // بدهکار:
  //   - بانک تجارت: 200,000,000
  //   - بانک سامان: 100,000,000
  //   - صندوق اصلی: 50,000,000
  //   - صندوق تنخواه: 30,000,000
  //   - بدهی اولیه خریدار (حساب دریافتنی): 40,000,000
  //   - موجودی انبار کالا (چای‌ساز: ۵ عدد @ 20,000,000 = 100,000,000)
  //   مجموع بدهکار: 520,000,000 ریال
  // بستانکار:
  //   - طلب اولیه تأمین‌کننده (حساب پرداختنی): 120,000,000
  //   - سرمایه اولیه و حقوق صاحبان سهام: 400,000,000
  //   مجموع بستانکار: 520,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ صنف فروشگاه و خرده‌فروشی عمومی',
    items: [
      { accountCode: '10101', titleFa: 'حساب جاری بانک تجارت', type: 'BANK_CASH' as const, refId: bank1.id, debitIrr: 200_000_000, creditIrr: 0 },
      { accountCode: '10102', titleFa: 'حساب کارتخوان بانک سامان', type: 'BANK_CASH' as const, refId: bank2.id, debitIrr: 100_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'صندوق اصلی فروشگاه', type: 'BANK_CASH' as const, refId: cash1.id, debitIrr: 50_000_000, creditIrr: 0 },
      { accountCode: '10104', titleFa: 'تنخواه‌گردان خرید خرد', type: 'BANK_CASH' as const, refId: cash2.id, debitIrr: 30_000_000, creditIrr: 0 },
      { accountCode: '10301', titleFa: 'حساب‌های دریافتنی تجاری - هایپرمارکت آفتاب', type: 'PARTY' as const, refId: customer.id, debitIrr: 40_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی کالای انبار - چای‌ساز برقی', type: 'INVENTORY' as const, refId: productTeaMaker.id, debitIrr: 100_000_000, creditIrr: 0, qty: 5, unitCostIrr: 20_000_000, warehouseId: defaultWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی تجاری - پخش طباطبایی', type: 'PARTY' as const, refId: supplier.id, debitIrr: 0, creditIrr: 120_000_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه صاحبان سهام', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 400_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: ثبت فاکتور خرید کالا از تأمین‌کننده
  // --------------------------------------------------------------------------
  console.log('۶. ثبت فاکتور خرید کالاهای فروشگاه از پخش طباطبایی...');
  // خرید ۱۰ عدد چای‌ساز @ 20,000,000 = 200,000,000 + ۵ عدد سرخ‌کن @ 50,000,000 = 250,000,000. جمع کل: 450,000,000 ریال.
  // پرداخت نقد/بانک از تجارت: 150,000,000 ریال. مانده بدهی به پخش: 300,000,000 ریال.
  const purchaseInvoice = foundationStore.createPurchaseInvoice({
    supplierId: supplier.id,
    targetWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/05',
    notesFa: 'خرید شارژ اولیه انبار لوازم خانگی از پخش سراسری طباطبایی',
    paidAmountIrr: 150_000_000,
    paymentMethod: 'BANK_TRANSFER',
    sourceBankAccountId: bank1.id,
    lines: [
      { itemId: productTeaMaker.id, quantity: 10, unitPriceIrr: 20_000_000 },
      { itemId: productAirFryer.id, quantity: 5, unitPriceIrr: 50_000_000 },
    ],
  }, 1);

  console.log(`   فاکتور خرید ${purchaseInvoice.invoiceNumber} ثبت شد. مبلغ کل: ${purchaseInvoice.totalInvoicePayableToSupplierIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: ثبت فاکتور فروش POS سریع (نقدی/کارتخوان)
  // --------------------------------------------------------------------------
  console.log('۷. ثبت فاکتور فروش POS ۱ (۳ عدد چای‌ساز + ۲ عدد سرخ‌کن) با تسویه آنی POS...');
  // فروش ۳ چای‌ساز @ 30m = 90m + ۲ سرخ‌کن @ 75m = 150m. جمع: 240,000,000 ریال.
  // تسویه کامل با کارتخوان بانک سامان (bank2): 240,000,000 ریال.
  const salesInvoice1 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/10',
    notesFa: 'فروش نقدی بارکدی POS صندوق ۱',
    paidAmountIrr: 240_000_000,
    targetBankAccountId: bank2.id,
    paymentDetails: {
      paymentMethod: 'POS',
      posTerminalOrBank: bank2.bankNameFa,
    },
    lines: [
      { itemId: productTeaMaker.id, quantity: 3, unitPriceIrr: 30_000_000 },
      { itemId: productAirFryer.id, quantity: 2, unitPriceIrr: 75_000_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش ۱ [${salesInvoice1.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice1.totalInvoiceAmountIrr.toLocaleString()} ریال (تسویه کامل).`);

  // --------------------------------------------------------------------------
  // مرحله ۸: ثبت فاکتور فروش ۲ با مانده و تبدیل به اقساط
  // --------------------------------------------------------------------------
  console.log('۸. ثبت فاکتور فروش ۲ (۲ عدد چای‌ساز + ۱ عدد سرخ‌کن) با مانده و تبدیل به اقساط...');
  // فروش ۲ چای‌ساز @ 30m = 60m + ۱ سرخ‌کن @ 75m = 75m. جمع: 135,000,000 ریال.
  // پیش‌پرداخت نقدی: 35,000,000 ریال. مانده: 100,000,000 ریال.
  const salesInvoice2 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/15',
    notesFa: 'فروش اقساطی لوازم خانگی به هایپرمارکت آفتاب',
    paidAmountIrr: 35_000_000,
    targetCashBoxId: cash1.id,
    paymentDetails: {
      paymentMethod: 'CASH',
      posTerminalOrBank: 'صندوق اصلی فروشگاه',
    },
    lines: [
      { itemId: productTeaMaker.id, quantity: 2, unitPriceIrr: 30_000_000 },
      { itemId: productAirFryer.id, quantity: 1, unitPriceIrr: 75_000_000 },
    ],
  } as any, 1);

  console.log(`   فاکتور فروش ۲ [${salesInvoice2.invoiceNumber}] ثبت شد. مانده: ${salesInvoice2.remainingBalanceIrr.toLocaleString()} ریال.`);

  // ایجاد ۲ قسط ۵۰,۰۰۰,۰۰۰ ریالی بابت مانده ۱۰۰,۰۰۰,۰۰۰ ریالی
  foundationStore.settlePartyQuick(
    {
      partyId: customer.id,
      txType: 'RECEIPT',
      amountIrr: 100_000_000,
      paymentMethod: 'INSTALLMENT',
      installmentCount: 2,
      dateJalali: '1405/01/15',
      descriptionFa: `طرح اقساطی ۲ ماهه فاکتور ${salesInvoice2.invoiceNumber}`,
    },
    1
  );

  // تسویه قسط اول
  const installments = foundationStore.getInstallments();
  foundationStore.payInstallment(installments[0].id, '1405/02/15', 'POS', bank2.id, undefined, 1);
  console.log(`   قسط اول به مبلغ ۵۰,۰۰۰,۰۰۰ ریال با موفقیت تسویه گردید.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ثبت فروش با چک صیادی و وصول آن
  // --------------------------------------------------------------------------
  console.log('۹. ثبت فروش با دریافت چک صیادی و وصول آن...');
  // فروش ۲ عدد چای‌ساز @ 30m = 60,000,000 ریال.
  const salesInvoice3 = foundationStore.createSalesInvoice({
    customerId: customer.id,
    sourceWarehouseId: defaultWarehouse.id,
    dateJalali: '1405/01/20',
    notesFa: 'فروش با اخذ چک صیادی ۱ ماهه',
    paidAmountIrr: 0,
    lines: [
      { itemId: productTeaMaker.id, quantity: 2, unitPriceIrr: 30_000_000 },
    ],
  }, 1);

  const cheque = foundationStore.createCheque({
    chequeNumber: 'CHQ-RETAIL-5544',
    chequeType: 'INBOUND',
    partyId: customer.id,
    bankNameFa: 'بانک ملت',
    amountIrr: 60_000_000,
    issueDateJalali: '1405/01/20',
    dueDateJalali: '1405/02/20',
    notesFa: `چک دریافتی بابت فاکتور ${salesInvoice3.invoiceNumber}`,
  }, 1);

  foundationStore.updateChequeStatus({
    chequeId: cheque.id,
    status: 'CLEARED',
    depositBankAccountId: bank1.id,
    clearedDateJalali: '1405/02/20',
  }, 1);

  console.log(`   چک صیادی شماره CHQ-RETAIL-5544 به مبلغ ۶۰,۰۰۰,۰۰۰ ریال با موفقیت وصول شد.`);

  // --------------------------------------------------------------------------
  // مرحله ۱۰: ممیزی جامع حسابداری و انبار
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار (Retail):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی موجودی انبار کالاها
  // چای‌ساز: افتتاحیه ۵ + خرید ۱۰ - فروش(۳ + ۲ + ۲) = ۸ عدد
  // سرخ‌کن: افتتاحیه ۰ + خرید ۵ - فروش(۲ + ۱) = ۲ عدد
  const items = foundationStore.getItems();
  const teaMaker = items.find((i) => i.id === productTeaMaker.id);
  const airFryer = items.find((i) => i.id === productAirFryer.id);

  const teaStock = teaMaker?.totalStock ?? 0;
  const fryerStock = airFryer?.totalStock ?? 0;

  console.log(`📦 موجودی انبار کالاها:`);
  console.log(`   - چای‌ساز برقی: موجودی فیزیکی = ${teaStock} (مورد انتظار: 8)`);
  console.log(`   - سرخ‌کن بدون روغن: موجودی فیزیکی = ${fryerStock} (مورد انتظار: 2)`);

  if (teaStock !== 8) {
    console.error(`❌ مغایرت انبار: موجودی چای‌ساز باید ۸ باشد اما ${teaStock} است.`);
    discrepanciesCount++;
  }
  if (fryerStock !== 2) {
    console.error(`❌ مغایرت انبار: موجودی سرخ‌کن باید ۲ باشد اما ${fryerStock} است.`);
    discrepanciesCount++;
  }

  // ۲. ممیزی نقدینگی، بانک‌ها و صندوق‌ها
  // بانک تجارت (bank1): افتتاحیه 200m - پرداخت خرید 150m + وصول چک 60m = 110,000,000 ریال
  // بانک سامان (bank2): افتتاحیه 100m + فروش۱ POS 240m + قسط ۱ POS 50m = 390,000,000 ریال
  // صندوق اصلی (cash1): افتتاحیه 50m + پیش‌پرداخت فروش۲ 35m = 85,000,000 ریال
  // تنخواه‌گردان (cash2): افتتاحیه 30,000,000 ریال
  // جمع کل نقدینگی: 110m + 390m + 85m + 30m = 615,000,000 ریال

  const b1 = foundationStore.getBankAccounts().find((b) => b.id === bank1.id)?.balanceIrr || 0;
  const b2 = foundationStore.getBankAccounts().find((b) => b.id === bank2.id)?.balanceIrr || 0;
  const c1 = foundationStore.getCashBoxes().find((c) => c.id === cash1.id)?.balanceIrr || 0;
  const c2 = foundationStore.getCashBoxes().find((c) => c.id === cash2.id)?.balanceIrr || 0;
  const totalCashBank = b1 + b2 + c1 + c2;

  console.log(`💳 مانده حساب‌های بانکی و صندوق‌ها:`);
  console.log(`   - بانک تجارت: ${b1.toLocaleString()} ریال (مورد انتظار: 110,000,000)`);
  console.log(`   - بانک سامان: ${b2.toLocaleString()} ریال (مورد انتظار: 390,000,000)`);
  console.log(`   - صندوق اصلی: ${c1.toLocaleString()} ریال (مورد انتظار: 85,000,000)`);
  console.log(`   - صندوق تنخواه: ${c2.toLocaleString()} ریال (مورد انتظار: 30,000,000)`);
  console.log(`   جمع کل نقدینگی: ${totalCashBank.toLocaleString()} ریال (مورد انتظار: 615,000,000)`);

  if (b1 !== 110_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک تجارت: ${b1}`); }
  if (b2 !== 390_000_000) { discrepanciesCount++; console.error(`❌ مغایرت بانک سامان: ${b2}`); }
  if (c1 !== 85_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق اصلی: ${c1}`); }
  if (c2 !== 30_000_000) { discrepanciesCount++; console.error(`❌ مغایرت صندوق تنخواه: ${c2}`); }

  // ۳. ممیزی حساب طرفین
  // تأمین‌کننده (پخش طباطبایی): افتتاحیه بستانکار 120m + خرید 450m - پرداخت 150m = 420,000,000 بستانکار (+420m)
  // خریدار (هایپر آفتاب): افتتاحیه بدهکار 40m + فروش۲(135m-35m=100m) + فروش۳(60m-60m=0) - پرداخت قسط(50m) = 90,000,000 بدهکار (-90m)
  const supplierSummary = foundationStore.getPartyById(supplier.id)?.transactionsSummary;
  const customerSummary = foundationStore.getPartyById(customer.id)?.transactionsSummary;

  console.log(`👥 مانده حساب طرف‌حساب‌ها:`);
  console.log(`   - پخش طباطبایی (تأمین‌کننده): مانده دفتری = ${supplierSummary?.netBalanceIrr.toLocaleString()} ریال (مورد انتظار: 420,000,000 بستانکار)`);
  console.log(`   - هایپر آفتاب (خریدار): مانده دفتری = ${customerSummary?.netBalanceIrr.toLocaleString()} ریال (مورد انتظار: -90,000,000 بدهکار)`);

  if (supplierSummary?.netBalanceIrr !== 420_000_000) {
    console.error(`❌ مغایرت مانده پخش طباطبایی: ${supplierSummary?.netBalanceIrr}`);
    discrepanciesCount++;
  }

  // ۴. صورت سود و زیان (P&L)
  // درآمد کل فروش: ۲۴۰m (فروش۱) + ۱۳۵m (فروش۲) + ۶۰m (فروش۳) = ۴۳۵,۰۰۰,۰۰۰ ریال
  // بهای تمام‌شده COGS:
  //   - چای‌ساز: (۳ + ۲ + ۲ = ۷ عدد) @ 20m = 140,000,000
  //   - سرخ‌کن: (۲ + ۱ = ۳ عدد) @ 50m = 150,000,000
  //   مجموع بهای تمام‌شده: 290,000,000 ریال
  // سود ناخالص: ۴۳۵m - ۲۹۰m = ۱۴۵,۰۰۰,۰۰۰ ریال (۳۳.۳۳٪)
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;
  console.log(`📊 صورت سود و زیان (P&L Report):`);
  console.log(`   - درآمد کل فروش: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 435,000,000)`);
  console.log(`   - بهای تمام‌شده COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 290,000,000)`);
  console.log(`   - سود ناخالص عملیاتی: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 145,000,000)`);

  if (pnl.totalNetSalesIrr !== 435_000_000) discrepanciesCount++;
  if (pnl.totalCogsIrr !== 290_000_000) discrepanciesCount++;
  if (pnl.totalGrossProfitIrr !== 145_000_000) discrepanciesCount++;

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
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۲ (Retail & General Store):`);
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

runIndustryRetailAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Retail Industry acceptance scenario:', err);
  process.exit(1);
});
