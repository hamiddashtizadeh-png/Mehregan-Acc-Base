import { foundationStore } from '../src/server/foundationStore.js';

async function runIndustryEnterpriseAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۸: سازمان‌ها و مجموعه هولدینگ چندشعبه‌ای');
  console.log('   (Mehregan Business Suite - Industry 8: Enterprise Multi-Branch & Holding)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // مرحله ۱: پاکسازی کامل دیتابیس و بازنشانی به حالت صفر مطلق (Zero Slate)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  foundationStore.resetDatabase({ cleanZeroSlate: true });

  // سوییچ تنظیمات به ساختار سازمانی
  foundationStore.updateSettings({ industryProfileCode: 'CCTV_SECURITY' }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۲: تعریف ساختار شعب، انبارها، بانک‌ها و صندوق‌های هولدینگ
  // --------------------------------------------------------------------------
  console.log('۲. تعریف شعب، انبارها، حساب‌های بانکی و صندوق‌های مرکز و شعب...');
  
  // ۱. انبارها
  const centralWarehouse = foundationStore.getWarehouses()[0]; // انبار مرکزی
  const shirazWarehouse = foundationStore.createWarehouse({
    code: 'WH-SHIRAZ-02',
    titleFa: 'انبار شعبه و مرکز توزیع شیراز',
    locationAddressFa: 'شیراز، شهرک صنعتی بزرگ، بلوار صادرات',
    managerNameFa: 'مهندس حسینی',
  }, 1);

  // ۲. حساب‌های بانکی و صندوق‌ها
  const bankCentral = foundationStore.createBankAccount({
    accountCode: '10101-01',
    bankNameFa: 'بانک ملی - حساب جاری مرکزی هولدینگ',
    accountNumber: '010044556677',
    shabaNumber: 'IR010170000000010044556677',
    balanceIrr: 0,
  });

  const cashCentral = foundationStore.createCashBox({
    cashBoxCode: 'CSH-CENTRAL-01',
    titleFa: 'صندوق مرکزی دفتر تهران',
    balanceIrr: 0,
  });

  const cashShiraz = foundationStore.createCashBox({
    cashBoxCode: 'CSH-SHIRAZ-02',
    titleFa: 'صندوق تنخواه‌گردان شعبه شیراز',
    balanceIrr: 0,
  });

  // ۳. مراکز هزینه
  const ccShiraz = foundationStore.createCostCenter({
    code: 'CC-SHIRAZ-201',
    titleFa: 'مرکز هزینه عملیاتی و پشتیبانی شعبه شیراز',
    managerNameFa: 'مهندس حسینی',
    budgetIrr: 2_000_000_000,
    descriptionFa: 'هزینه‌های اداری، حمل و توزیع منطقه جنوب',
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۳: تعریف طرفین حساب (تأمین‌کننده هولدینگ و کارفرمای منطقه شیراز)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد طرفین حساب (تأمین‌کننده وارداتی و خریدار منطقه جنوب)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'شرکت بازرگانی واردات تجهیزات هولدینگ پارس',
    companyNameFa: 'بازرگانی هولدینگ پارس',
    economicCode: '411222333444',
    phone: '02188001122',
    mobile: '09121112233',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  const customerShiraz = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'سازمان توسعه زیرساخت‌های ارتباطی شیراز',
    companyNameFa: 'توسعه زیرساخت شیراز',
    economicCode: '411555666777',
    phone: '07136667788',
    mobile: '09173334455',
    cityFa: 'شیراز',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف کالاها و تجهیزات شبکه هولدینگ
  // --------------------------------------------------------------------------
  console.log('۴. تعریف کالاها و تجهیزات زیرساختی...');
  
  // کالا ۱: رک و سرور مرکزی
  const productServer = foundationStore.createItem({
    itemCode: 'ENT-SERVER-RACK',
    titleFa: 'رک و سرور پردازشی مرکزی ۴۲ یونیت',
    model: 'SRV-RACK-42U',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 200_000_000,
    salesPriceIrr: 300_000_000,
    isSerialized: false,
    minStockAlert: 2,
    maxStockAlert: 50,
  }, 1);

  // کالا ۲: سوئیچ شبکه ۲۴ پورت
  const productSwitch = foundationStore.createItem({
    itemCode: 'ENT-SWITCH-24P',
    titleFa: 'سوئیچ شبکه مدیریتی ۲۴ پورت گیگابیت',
    model: 'SW-MNG-24P-POE',
    brandId: 1,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 30_000_000,
    salesPriceIrr: 50_000_000,
    isSerialized: false,
    minStockAlert: 5,
    maxStockAlert: 200,
  }, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه هولدینگ (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند تراز افتتاحیه هولدینگ (Opening Balances)...');
  // مانده افتتاحیه متوازن:
  // بدهکار:
  //   - بانک ملی مرکزی: 2,000,000,000
  //   - صندوق مرکزی تهران: 200,000,000
  //   - صندوق تنخواه شیراز: 100,000,000
  //   - انبار مرکزی کالا (۱۰ سرور @ 200m = 2,000,000,000 + ۲۰ سوئیچ @ 30m = 600,000,000 -> 2,600,000,000)
  //   مجموع بدهکار: 4,900,000,000 ریال
  // بستانکار:
  //   - بدهی اولیه به بازرگانی پارس: 900,000,000
  //   - سرمایه اولیه ثبت‌شده هولدینگ: 4,000,000,000
  //   مجموع بستانکار: 4,900,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه جامع سال مالی ۱۴۰۵ مجموعه هولدینگ و شعب',
    items: [
      { accountCode: '10101', titleFa: 'بانک ملی - حساب مرکزی', type: 'BANK_CASH' as const, refId: bankCentral.id, debitIrr: 2_000_000_000, creditIrr: 0 },
      { accountCode: '10103', titleFa: 'صندوق مرکزی دفتر تهران', type: 'BANK_CASH' as const, refId: cashCentral.id, debitIrr: 200_000_000, creditIrr: 0 },
      { accountCode: '10104', titleFa: 'صندوق تنخواه‌گردان شعبه شیراز', type: 'BANK_CASH' as const, refId: cashShiraz.id, debitIrr: 100_000_000, creditIrr: 0 },
      { accountCode: '10501', titleFa: 'موجودی انبار مرکزی - سرورها', type: 'INVENTORY' as const, refId: productServer.id, debitIrr: 2_000_000_000, creditIrr: 0, qty: 10, unitCostIrr: 200_000_000, warehouseId: centralWarehouse.id },
      { accountCode: '10502', titleFa: 'موجودی انبار مرکزی - سوئیچ‌ها', type: 'INVENTORY' as const, refId: productSwitch.id, debitIrr: 600_000_000, creditIrr: 0, qty: 20, unitCostIrr: 30_000_000, warehouseId: centralWarehouse.id },
      { accountCode: '20101', titleFa: 'حساب‌های پرداختنی - بازرگانی پارس', type: 'PARTY' as const, refId: supplier.id, debitIrr: 0, creditIrr: 900_000_000 },
      { accountCode: '30101', titleFa: 'سرمایه اولیه ثبت‌شده هولدینگ', type: 'GENERAL' as const, refId: null, debitIrr: 0, creditIrr: 4_000_000_000 },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload as any, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: انتقال بین انبارها (Inter-Warehouse Transfer: Central -> Shiraz)
  // --------------------------------------------------------------------------
  console.log('۶. انتقال کالا از انبار مرکزی تهران به انبار شعبه شیراز (۴ سرور + ۱۰ سوئیچ)...');
  
  const transferReq = foundationStore.createInventoryTransferRequisition({
    sourceWarehouseId: centralWarehouse.id,
    targetWarehouseId: shirazWarehouse.id,
    dateJalali: '1405/01/10',
    driverNameFa: 'حمیدرضا رضایی',
    vehiclePlateFa: '۶۸ ب ۴۵۶ ایران ۷۷',
    notesFa: 'حواله شارژ موجودی انبار شعبه شیراز جهت پوشش سفارشات جنوب',
    lines: [
      { itemId: productServer.id, quantity: 4 },
      { itemId: productSwitch.id, quantity: 10 },
    ],
  }, 1);

  foundationStore.receiveInventoryTransferRequisition(transferReq.id, 1);

  console.log(`   حواله انتقال بین انبارهای [${transferReq.transferNumber}] تایید، ارسال و تحویل انبار شیراز گردید.`);

  // --------------------------------------------------------------------------
  // مرحله ۷: صدور فاکتور فروش در شعبه شیراز و دریافت وجه
  // --------------------------------------------------------------------------
  console.log('۷. صدور فاکتور فروش تجهیزات از انبار شعبه شیراز به زیرساخت شیراز...');
  // فروش ۲ سرور @ 300m = 600m + ۵ سوئیچ @ 50m = 250m -> جمع فاکتور: 850,000,000 ریال.
  // دریافت ۶۰۰,۰۰۰,۰۰۰ ریال حواله بانکی به حساب مرکزی. مانده طلب: 250,000,000 ریال.
  const salesInvoice = foundationStore.createSalesInvoice({
    customerId: customerShiraz.id,
    sourceWarehouseId: shirazWarehouse.id,
    dateJalali: '1405/01/18',
    notesFa: 'فاکتور تجهیزات سرور و سوئیچ شعبه شیراز',
    paidAmountIrr: 600_000_000,
    targetBankAccountId: bankCentral.id,
    paymentDetails: {
      paymentMethod: 'BANK_TRANSFER',
      posTerminalOrBank: bankCentral.bankNameFa,
    },
    lines: [
      { itemId: productServer.id, quantity: 2, unitPriceIrr: 300_000_000 },
      { itemId: productSwitch.id, quantity: 5, unitPriceIrr: 50_000_000 },
    ],
  }, 1);

  console.log(`   فاکتور فروش شعبه شیراز [${salesInvoice.invoiceNumber}] ثبت شد. مبلغ: ${salesInvoice.totalInvoiceAmountIrr.toLocaleString()} ریال.`);

  // --------------------------------------------------------------------------
  // مرحله ۸: ثبت هزینه عملیاتی شعبه شیراز و تخصیص به مرکز هزینه شیراز
  // --------------------------------------------------------------------------
  console.log('۸. ثبت هزینه لجستیک و اجاره شعبه شیراز از محل تنخواه شعبه...');
  // ثبت ۵۰,۰۰۰,۰۰۰ ریال هزینه لجستیک پرداختی از صندوق تنخواه شیراز
  const expense = foundationStore.createOperationalExpense({
    expenseCategoryCode: '80104', // هزینه حمل و نقل
    titleFa: 'هزینه ترخیص و لجستیک محموله انبار شیراز',
    amountIrr: 50_000_000,
    dateJalali: '1405/01/20',
    sourceCashBoxId: cashShiraz.id,
    costCenterId: ccShiraz.id,
    descriptionFa: 'پرداخت هزینه لجستیک و انبارداری منطقه شیراز از صندوق تنخواه',
  }, 1);

  console.log(`   سند هزینه [EXP-${expense.id}] به مبلغ ${expense.amountIrr.toLocaleString()} ریال تخصیص داده شده به مرکز هزینه شیراز ثبت شد.`);

  // --------------------------------------------------------------------------
  // مرحله ۹: ممیزی جامع حسابداری، موجودی انبارها و تراز مالی هولدینگ
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار شعب (Enterprise):');
  console.log('========================================================================');

  let discrepanciesCount = 0;

  // ۱. ممیزی تفکیکی موجودی انبار مرکزی و انبار شیراز
  // انبار مرکزی (WH-CENTRAL-01):
  //   - سرور: ۱۰ افتتاحیه - ۴ انتقال = ۶ دستگاه
  //   - سوئیچ: ۲۰ افتتاحیه - ۱۰ انتقال = ۱۰ دستگاه
  // انبار شیراز (WH-SHIRAZ-02):
  //   - سرور: ۴ دریافتی - ۲ فروش = ۲ دستگاه
  //   - سوئیچ: ۱۰ دریافتی - ۵ فروش = ۵ دستگاه
  const items = foundationStore.getItems();
  const serverItem = items.find((i) => i.id === productServer.id);
  const switchItem = items.find((i) => i.id === productSwitch.id);

  const centralServerStock = foundationStore.getItemStockInWarehouse(productServer.id, centralWarehouse.id);
  const centralSwitchStock = foundationStore.getItemStockInWarehouse(productSwitch.id, centralWarehouse.id);

  const shirazServerStock = foundationStore.getItemStockInWarehouse(productServer.id, shirazWarehouse.id);
  const shirazSwitchStock = foundationStore.getItemStockInWarehouse(productSwitch.id, shirazWarehouse.id);

  console.log(`📦 موجودی انبار مرکزی (تهران):`);
  console.log(`   - سرور پردازشی: ${centralServerStock} دستگاه (مورد انتظار: 6)`);
  console.log(`   - سوئیچ ۲۴ پورت: ${centralSwitchStock} دستگاه (مورد انتظار: 10)`);

  console.log(`📦 موجودی انبار شعبه (شیراز):`);
  console.log(`   - سرور پردازشی: ${shirazServerStock} دستگاه (مورد انتظار: 2)`);
  console.log(`   - سوئیچ ۲۴ پورت: ${shirazSwitchStock} دستگاه (مورد انتظار: 5)`);

  if (centralServerStock !== 6) { discrepanciesCount++; console.error(`❌ مغایرت سرور انبار مرکزی: ${centralServerStock}`); }
  if (centralSwitchStock !== 10) { discrepanciesCount++; console.error(`❌ مغایرت سوئیچ انبار مرکزی: ${centralSwitchStock}`); }
  if (shirazServerStock !== 2) { discrepanciesCount++; console.error(`❌ مغایرت سرور انبار شیراز: ${shirazServerStock}`); }
  if (shirazSwitchStock !== 5) { discrepanciesCount++; console.error(`❌ مغایرت سوئیچ انبار شیراز: ${shirazSwitchStock}`); }

  // ۲. ممیزی خزانه‌داری، بانک‌ها و صندوق‌های شعب
  // بانک ملی مرکزی: 2,000m افتتاحیه + 600m دریافتی فروش = 2,600,000,000 ریال
  // صندوق مرکزی تهران: 200,000,000 ریال
  // صندوق تنخواه شیراز: 100m افتتاحیه - 50m هزینه لجستیک = 50,000,000 ریال
  // جمع کل نقدینگی هولدینگ: 2,600m + 200m + 50m = 2,850,000,000 ریال
  const bCentral = foundationStore.getBankAccounts().find((b) => b.id === bankCentral.id)?.balanceIrr || 0;
  const cCentral = foundationStore.getCashBoxes().find((c) => c.id === cashCentral.id)?.balanceIrr || 0;
  const cShiraz = foundationStore.getCashBoxes().find((c) => c.id === cashShiraz.id)?.balanceIrr || 0;
  const totalTreasury = bCentral + cCentral + cShiraz;

  console.log(`💳 مانده خزانه‌داری و حساب‌های هولدینگ:`);
  console.log(`   - بانک ملی مرکزی: ${bCentral.toLocaleString()} ریال (مورد انتظار: 2,600,000,000)`);
  console.log(`   - صندوق مرکزی تهران: ${cCentral.toLocaleString()} ریال (مورد انتظار: 200,000,000)`);
  console.log(`   - صندوق تنخواه شیراز: ${cShiraz.toLocaleString()} ریال (مورد انتظار: 50,000,000)`);
  console.log(`   جمع کل نقدینگی هولدینگ: ${totalTreasury.toLocaleString()} ریال (مورد انتظار: 2,850,000,000)`);

  if (bCentral !== 2_600_000_000) discrepanciesCount++;
  if (cCentral !== 200_000_000) discrepanciesCount++;
  if (cShiraz !== 50_000_000) discrepanciesCount++;

  // ۳. صورت سود و زیان هولدینگ (P&L Analysis)
  // درآمد فروش شعبه شیراز: 850,000,000 ریال
  // بهای تمام‌شده COGS (۲ سرور @ 200m = 400m + ۵ سوئیچ @ 30m = 150m): 550,000,000 ریال
  // سود ناخالص: 300,000,000 ریال (۳۵.۲۹٪)
  // هزینه‌های عملیاتی شیراز: 50,000,000 ریال
  // سود خالص هولدینگ: 250,000,000 ریال
  const pnlReport = foundationStore.getComprehensiveProfitabilityReport({ fromDateJalali: '1405/01/01', toDateJalali: '1405/12/29' });
  const pnl = pnlReport.summary;

  console.log(`📊 صورت سود و زیان تلفیقی هولدینگ (Consolidated P&L):`);
  console.log(`   - درآمد کل فروش: ${pnl.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 850,000,000)`);
  console.log(`   - بهای تمام‌شده کالای فروش‌رفته COGS: ${pnl.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 550,000,000)`);
  console.log(`   - سود ناخالص: ${pnl.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 300,000,000)`);
  console.log(`   - هزینه‌های عمومی و اداری: ${pnl.totalOperatingExpensesIrr.toLocaleString()} ریال (مورد انتظار: 50,000,000)`);
  console.log(`   - سود خالص تلفیقی هولدینگ: ${pnl.totalNetProfitIrr.toLocaleString()} ریال (مورد انتظار: 250,000,000)`);

  if (pnl.totalNetSalesIrr !== 850_000_000) discrepanciesCount++;
  if (pnl.totalCogsIrr !== 550_000_000) discrepanciesCount++;
  if (pnl.totalGrossProfitIrr !== 300_000_000) discrepanciesCount++;
  if (pnl.totalOperatingExpensesIrr !== 50_000_000) discrepanciesCount++;
  if (pnl.totalNetProfitIrr !== 250_000_000) discrepanciesCount++;

  // ۴. تراز آزمایشی و توازن دفتر کل هولدینگ
  const trialBalance = foundationStore.getTrialBalance();
  console.log(`⚖️ تراز آزمایشی کل اسناد حسابداری هولدینگ (Trial Balance):`);
  console.log(`   - مجموع گردش بدهکار: ${trialBalance.totalDebitTurnoverIrr.toLocaleString()} ریال`);
  console.log(`   - مجموع گردش بستانکار: ${trialBalance.totalCreditTurnoverIrr.toLocaleString()} ریال`);
  console.log(`   - وضعیت توازن دفتر کل: ${trialBalance.isBalanced ? 'متوازن و دقیق ✅' : 'دارای عدم توازن ❌'}`);

  if (!trialBalance.isBalanced || trialBalance.totalDebitTurnoverIrr !== trialBalance.totalCreditTurnoverIrr) {
    console.error(`❌ عدم توازن در تراز آزمایشی! اختلاف: ${trialBalance.totalDebitTurnoverIrr - trialBalance.totalCreditTurnoverIrr}`);
    discrepanciesCount++;
  }

  console.log('========================================================================');
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۸ (Enterprise Multi-Branch):`);
  console.log(`   تعداد کل مغایرت‌های کشف‌شده: ${discrepanciesCount}`);
  if (discrepanciesCount === 0) {
    console.log('   🎉 هیچ‌گونه مغایرتی یافت نشد؛ تمامی ترازها، حساب‌های شعبه‌ای، موجودی انبارها، انتقال بین انبارها و سود خالص ۱۰۰٪ مطابق محاسبات دقیق حسابداری پذیرفته شدند.');
  } else {
    console.error(`   ⚠️ تعداد ${discrepanciesCount} مغایرت کشف گردید.`);
  }
  console.log('========================================================================');

  if (discrepanciesCount > 0) {
    process.exit(1);
  }
}

runIndustryEnterpriseAcceptanceScenario().catch((err) => {
  console.error('Fatal error during Enterprise Industry acceptance scenario:', err);
  process.exit(1);
});
