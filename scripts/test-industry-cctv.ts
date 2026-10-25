import { foundationStore } from '../src/server/foundationStore';
import fs from 'fs';
import { LOCAL_STATE_DB_FILE } from '../src/server/paths';

export interface Discrepancy {
  category: string;
  item: string;
  expected: any;
  actual: any;
  explanationFa: string;
}

export async function runCctvAcceptanceScenario() {
  console.log('========================================================================');
  console.log('🚀 اجرای سناریوی پذیرش حسابداری صنعت ۱: دوربین مداربسته و سیستم‌های نظارتی');
  console.log('   (Mehregan Business Suite - Industry 1: CCTV & Security Systems)');
  console.log('========================================================================\n');

  const discrepancies: Discrepancy[] = [];

  // --------------------------------------------------------------------------
  // مرحله ۱: بازنشانی داده‌ها به حالت صفر با دکمه ریست سیستم (Reset Data)
  // --------------------------------------------------------------------------
  console.log('۱. بازنشانی داده‌های دیتابیس به حالت صفر مطلق (Zero Slate)...');
  const resetResult = foundationStore.resetDatabase({ cleanZeroSlate: true }, 1);
  if (!resetResult.ok) {
    discrepancies.push({
      category: 'RESET',
      item: 'cleanZeroSlate',
      expected: true,
      actual: resetResult.ok,
      explanationFa: 'عملیات ریست دیتابیس با خطا مواجه شد.',
    });
  }

  // فعال‌سازی صنف دوربین مداربسته و فعال‌سازی حسابداری دوبل
  foundationStore.updateSettings({
    activeIndustryProfile: 'CCTV_SECURITY',
    enableDoubleEntryAccounting: true,
    storeTitleFa: 'مهندسی سیستم‌های حفاظتی مهرگان',
  });

  // --------------------------------------------------------------------------
  // مرحله ۲: ایجاد حساب‌های بانکی و صندوق‌ها (۲ حساب بانک و ۲ صندوق نقد)
  // --------------------------------------------------------------------------
  console.log('۲. ایجاد ۲ حساب بانکی و ۲ صندوق نقدی...');
  // سیستم یک حساب پیش‌فرض بانک (BA-1001) و صندوق (CB-1001) دارد، آن‌ها را نام‌گذاری و دومین‌ها را می‌سازیم
  const banks = foundationStore.getBankAccounts();
  const cashes = foundationStore.getCashBoxes();

  // بانک ۱
  const bank1 = banks[0];
  bank1.bankNameFa = 'بانک ملت (حساب جاری اصلی)';
  bank1.accountNumber = '1001-Mellat-Main';

  // بانک ۲
  const bank2 = foundationStore.createBankAccount({
    bankNameFa: 'بانک ملی (حساب پشتیبان و ارزی)',
    accountNumber: '2002-Melli-Reserve',
    shabaNumber: 'IR120170000000111122223333',
    balanceIrr: 0,
  });

  // صندوق ۱
  const cash1 = cashes[0];
  cash1.titleFa = 'صندوق ریالی دفتر مرکزی و فروشگاه';

  // صندوق ۲
  const cash2 = foundationStore.createCashBox({
    boxCode: 'CB-1002',
    titleFa: 'تنخواه‌گردان پروژه‌های نصب و راه‌اندازی',
    balanceIrr: 0,
  });

  // --------------------------------------------------------------------------
  // مرحله ۳: ایجاد ۲ طرف‌حساب تجاری (۱ تأمین‌کننده تجهیزات + ۱ مشتری پروژه‌ای)
  // --------------------------------------------------------------------------
  console.log('۳. ایجاد ۲ طرف‌حساب (تأمین‌کننده و کارفرما/مشتری)...');
  const supplier = foundationStore.createParty({
    partyType: 'SUPPLIER',
    fullName: 'شرکت پارس ارتباط افزار (تأمین‌کننده هایک‌ویژن و داهوا)',
    companyNameFa: 'پارس ارتباط افزار',
    economicCode: '411234567891',
    phone: '02188990011',
    mobile: '09121112233',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  const customer = foundationStore.createParty({
    partyType: 'CUSTOMER',
    fullName: 'شرکت مهندسی سازه‌پردازان نوین (کارفرمای پروژه نظارتی)',
    companyNameFa: 'سازه‌پردازان نوین',
    economicCode: '411987654321',
    phone: '02122334455',
    mobile: '09123334455',
    cityFa: 'تهران',
    status: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // مرحله ۴: تعریف کالاها و خدمات متناسب با صنف نظارتی (۲ کالا + ۱ خدمت)
  // --------------------------------------------------------------------------
  console.log('۴. تعریف محصولات و خدمات حفاظتی و نظارتی...');
  // انبار پیش‌فرض
  const warehouses = foundationStore.getWarehouses();
  const defaultWarehouse = warehouses[0];

  // کالا ۱: دوربین دام ۲ مگاپیکسل (سریال‌پذیر سخت‌افزاری)
  const productCamera = foundationStore.createItem({
    itemCode: 'CAM-HIK-2MP',
    titleFa: 'دوربین مداربسته دام ۲ مگاپیکسل دید در شب هایک‌ویژن',
    model: 'DS-2CD2123G0-I',
    brandId: 2,
    categoryId: 1,
    unitId: 2,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 15_000_000,
    salesPriceIrr: 22_000_000,
    isSerialized: true,
    minStockAlert: 2,
    maxStockAlert: 50,
  }, 1);

  // کالا ۲: دستگاه ضبط NVR ۸ کانال
  const productNvr = foundationStore.createItem({
    itemCode: 'NVR-8CH-4K',
    titleFa: 'دستگاه ضبط تصاویر تحت شبکه NVR ۸ کانال 4K',
    model: 'DS-7608NI-K2',
    brandId: 2,
    categoryId: 1,
    unitId: 2,
    unitNameFa: 'دستگاه',
    purchasePriceIrr: 40_000_000,
    salesPriceIrr: 58_000_000,
    isSerialized: false,
    minStockAlert: 1,
    maxStockAlert: 20,
  }, 1);

  // خدمت ۱: خدمات کابل‌کشی و راه‌اندازی دوربین
  const serviceInstall = foundationStore.createItem({
    itemCode: 'SRV-CCTV-INST',
    titleFa: 'خدمات تخصصی نصب، کابل‌کشی و راه‌اندازی سیستم مداربسته',
    model: 'SERVICE-CONTRACT-INST',
    brandId: 2,
    categoryId: 1,
    unitId: 1,
    unitNameFa: 'پروژه',
    purchasePriceIrr: 0,
    salesPriceIrr: 12_000_000,
    isSerialized: false,
    itemType: 'SERVICE',
  } as any, 1);

  // --------------------------------------------------------------------------
  // مرحله ۵: ثبت تراز و سند افتتاحیه (Opening Balances)
  // --------------------------------------------------------------------------
  console.log('۵. ثبت سند و مانده‌های افتتاحیه (Opening Balances)...');
  // مانده افتتاحیه متوازن:
  // بدهکار:
  //   - موجودی نقد بانک ملت: 50,000,000
  //   - موجودی نقد بانک ملی: 30,000,000
  //   - موجودی صندوق ۱: 20,000,000
  //   - موجودی صندوق ۲: 10,000,000
  //   - بدهی اولیه مشتری (حساب دریافتنی): 25,000,000
  //   - موجودی اولیه انبار (کالا ۱: ۳ عدد @ 15,000,000 = 45,000,000)
  //   مجموع بدهکار: 180,000,000 ریال
  // بستانکار:
  //   - طلب اولیه تأمین‌کننده (حساب پرداختنی): 40,000,000
  //   - سرمایه اولیه و آورده سهامداران: 140,000,000
  //   مجموع بستانکار: 180,000,000 ریال

  const openingPayload = {
    dateJalali: '1405/01/01',
    descriptionFa: 'سند تراز افتتاحیه سال مالی ۱۴۰۵ صنف دوربین مداربسته',
    items: [
      {
        accountCode: '10101',
        titleFa: 'حساب جاری بانک ملت',
        type: 'BANK_CASH' as const,
        refId: bank1.id,
        debitIrr: 150_000_000,
        creditIrr: 0,
      },
      {
        accountCode: '10102',
        titleFa: 'حساب جاری بانک ملی',
        type: 'BANK_CASH' as const,
        refId: bank2.id,
        debitIrr: 30_000_000,
        creditIrr: 0,
      },
      {
        accountCode: '10103',
        titleFa: 'صندوق ریالی مرکزی',
        type: 'BANK_CASH' as const,
        refId: cash1.id,
        debitIrr: 20_000_000,
        creditIrr: 0,
      },
      {
        accountCode: '10104',
        titleFa: 'صندوق تنخواه‌گردان',
        type: 'BANK_CASH' as const,
        refId: cash2.id,
        debitIrr: 10_000_000,
        creditIrr: 0,
      },
      {
        accountCode: '10301',
        titleFa: 'حساب‌های دریافتنی تجاری - شرکت سازه‌پردازان نوین',
        type: 'PARTY' as const,
        refId: customer.id,
        debitIrr: 25_000_000,
        creditIrr: 0,
      },
      {
        accountCode: '10501',
        titleFa: 'موجودی کالای انبار - دوربین مداربسته دام ۲ مگاپیکسل',
        type: 'INVENTORY' as const,
        refId: productCamera.id,
        warehouseId: defaultWarehouse.id,
        qty: 3,
        unitCostIrr: 15_000_000,
        debitIrr: 45_000_000,
        creditIrr: 0,
      },
      {
        accountCode: '20101',
        titleFa: 'حساب‌های پرداختنی تجاری - شرکت پارس ارتباط افزار',
        type: 'PARTY' as const,
        refId: supplier.id,
        debitIrr: 0,
        creditIrr: 40_000_000,
      },
      {
        accountCode: '30101',
        titleFa: 'سرمایه اولیه مالکان و آورده نقدی',
        type: 'OTHER' as const,
        debitIrr: 0,
        creditIrr: 240_000_000,
      },
    ],
  };

  const openingResult = foundationStore.importOpeningBalances(openingPayload, 1);
  console.log(`   نتیجه سند افتتاحیه: ${openingResult.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۶: یک فقره فاکتور خرید (One Purchase Invoice)
  // --------------------------------------------------------------------------
  console.log('۶. ثبت یک فقره فاکتور خرید از تأمین‌کننده...');
  // خرید:
  // - ۱۰ عدد دوربین دام @ 15,000,000 = 150,000,000 (دارای شماره سریال)
  // - ۲ عدد دستگاه NVR @ 40,000,000 = 80,000,000
  // مجموع کل فاکتور خرید: 230,000,000 ریال
  // پرداخت درون فاکتوری: 100,000,000 ریال از بانک ملت
  // مانده بدهی به تأمین‌کننده: 130,000,000 ریال

  const cameraSerialsPurchase = Array.from({ length: 10 }, (_, i) => `SN-CAM-HIK-${1000 + i + 1}`);

  const purchaseInv = foundationStore.createPurchaseInvoice(
    {
      supplierId: supplier.id,
      targetWarehouseId: defaultWarehouse.id,
      dateJalali: '1405/01/10',
      paidAmountIrr: 100_000_000,
      paymentMethod: 'BANK_TRANSFER',
      sourceBankAccountId: bank1.id,
      lines: [
        {
          itemId: productCamera.id,
          quantity: 10,
          unitPriceIrr: 15_000_000,
          serialNumbers: cameraSerialsPurchase,
        },
        {
          itemId: productNvr.id,
          quantity: 2,
          unitPriceIrr: 40_000_000,
        },
      ],
    },
    1
  );

  console.log(`   فاکتور خرید ${purchaseInv.invoiceNumber} ثبت شد. مبلغ: ${purchaseInv.totalInvoicePayableToSupplierIrr?.toLocaleString()} ریال`);

  // --------------------------------------------------------------------------
  // مرحله ۷: فاکتور فروش اول (Sales Invoice 1) با پرداخت جزیی + تسویه مانده در بخش تسویه
  // --------------------------------------------------------------------------
  console.log('۷. ثبت فاکتور فروش ۱ با پرداخت جزیی و تسویه مانده در خزانه...');
  // اقلام:
  // - ۴ عدد دوربین دام @ 22,000,000 = 88,000,000 ریال
  // - ۱ عدد دستگاه NVR @ 58,000,000 = 58,000,000 ریال
  // - ۱ فقره خدمات نصب @ 12,000,000 = 12,000,000 ریال
  // جمع کل: 158,000,000 ریال
  // پرداخت در فاکتور: 58,000,000 ریال از طریق POS بانک ملت
  // مانده فاکتور: 100,000,000 ریال

  // انتخاب ۴ سریال موجود در انبار
  const availableCameraSerials = foundationStore
    .getItemSerials()
    .filter((s) => s.itemId === productCamera.id && s.status === 'IN_STOCK')
    .slice(0, 4)
    .map((s) => s.serialNumber);

  const saleInv1 = foundationStore.createSalesInvoice(
    {
      customerId: customer.id,
      sourceWarehouseId: defaultWarehouse.id,
      dateJalali: '1405/01/15',
      paidAmountIrr: 58_000_000,
      paymentDetails: {
        paymentMethod: 'POS',
        posTerminalOrBank: bank1.bankNameFa,
        trackingReference: 'POS-REC-1001',
      },
      lines: [
        {
          itemId: productCamera.id,
          quantity: 4,
          unitPriceIrr: 22_000_000,
          serialNumbers: availableCameraSerials,
        },
        {
          itemId: productNvr.id,
          quantity: 1,
          unitPriceIrr: 58_000_000,
        },
        {
          itemId: serviceInstall.id,
          quantity: 1,
          unitPriceIrr: 12_000_000,
        },
      ],
    },
    1
  );

  console.log(`   فاکتور فروش ۱ [${saleInv1.invoiceNumber}] ثبت شد. مانده: ${saleInv1.remainingBalanceIrr?.toLocaleString()} ریال.`);

  // تسویه مانده طلب ۱۰۰,۰۰۰,۰۰۰ ریال از طریق بخش تسویه حساب (واریز به حساب بانک ملی)
  const settleSale1 = foundationStore.settlePartyQuick(
    {
      partyId: customer.id,
      txType: 'RECEIPT',
      amountIrr: 100_000_000,
      paymentMethod: 'BANK_TRANSFER',
      bankAccountId: bank2.id,
      dateJalali: '1405/01/16',
      descriptionFa: `تسویه مانده فاکتور فروش ${saleInv1.invoiceNumber} از طرف شرکت سازه‌پردازان نوین`,
    },
    1
  );
  console.log(`   تسویه مانده فاکتور ۱: ${settleSale1.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۸: فاکتور فروش دوم (Sales Invoice 2) با پرداخت جزیی + تسویه مانده در خزانه
  // --------------------------------------------------------------------------
  console.log('۸. ثبت فاکتور فروش ۲ با پرداخت جزیی و تسویه مانده در خزانه...');
  // اقلام:
  // - ۳ عدد دوربین دام @ 22,000,000 = 66,000,000 ریال
  // جمع کل: 66,000,000 ریال
  // پرداخت در فاکتور: 26,000,000 ریال نقد در صندوق ۱
  // مانده فاکتور: 40,000,000 ریال

  const availableCameraSerials2 = foundationStore
    .getItemSerials()
    .filter((s) => s.itemId === productCamera.id && s.status === 'IN_STOCK')
    .slice(0, 3)
    .map((s) => s.serialNumber);

  const saleInv2 = foundationStore.createSalesInvoice(
    {
      customerId: customer.id,
      sourceWarehouseId: defaultWarehouse.id,
      dateJalali: '1405/01/18',
      paidAmountIrr: 26_000_000,
      paymentDetails: {
        paymentMethod: 'CASH',
        posTerminalOrBank: cash1.titleFa,
        trackingReference: 'CSH-REC-2001',
      },
      lines: [
        {
          itemId: productCamera.id,
          quantity: 3,
          unitPriceIrr: 22_000_000,
          serialNumbers: availableCameraSerials2,
        },
      ],
    },
    1
  );

  console.log(`   فاکتور فروش ۲ [${saleInv2.invoiceNumber}] ثبت شد. مانده: ${saleInv2.remainingBalanceIrr?.toLocaleString()} ریال.`);

  // تسویه مانده طلب ۴۰,۰۰۰,۰۰۰ ریال از طریق بخش تسویه حساب (دریافت نقدی در صندوق ۲)
  const settleSale2 = foundationStore.settlePartyQuick(
    {
      partyId: customer.id,
      txType: 'RECEIPT',
      amountIrr: 40_000_000,
      paymentMethod: 'CASH',
      cashBoxId: cash2.id,
      dateJalali: '1405/01/19',
      descriptionFa: `تسویه مانده نقدی فاکتور ${saleInv2.invoiceNumber} به صندوق تنخواه`,
    },
    1
  );
  console.log(`   تسویه مانده فاکتور ۲: ${settleSale2.messageFa}`);

  // --------------------------------------------------------------------------
  // مرحله ۹: فروش اقساطی (One Installment Sale)
  // --------------------------------------------------------------------------
  console.log('۹. ثبت فروش اقساطی (Installment Sale)...');
  // فروش:
  // - ۲ عدد دوربین دام @ 25,000,000 = 50,000,000 ریال
  // - ۱ عدد دستگاه NVR @ 60,000,000 = 60,000,000 ریال
  // جمع کل: 110,000,000 ریال
  // پیش‌پرداخت نقدی در فاکتور: 30,000,000 ریال
  // مانده: 80,000,000 ریال تقسیط در ۴ قسط ۲۰,۰۰۰,۰۰۰ ریالی

  const availableCameraSerials3 = foundationStore
    .getItemSerials()
    .filter((s) => s.itemId === productCamera.id && s.status === 'IN_STOCK')
    .slice(0, 2)
    .map((s) => s.serialNumber);

  const saleInv3 = foundationStore.createSalesInvoice(
    {
      customerId: customer.id,
      sourceWarehouseId: defaultWarehouse.id,
      dateJalali: '1405/01/20',
      paidAmountIrr: 30_000_000,
      paymentDetails: {
        paymentMethod: 'POS',
        posTerminalOrBank: bank1.bankNameFa,
        trackingReference: 'POS-INST-PREPAY',
      },
      lines: [
        {
          itemId: productCamera.id,
          quantity: 2,
          unitPriceIrr: 25_000_000,
          serialNumbers: availableCameraSerials3,
        },
        {
          itemId: productNvr.id,
          quantity: 1,
          unitPriceIrr: 60_000_000,
        },
      ],
    },
    1
  );

  // تبدیل مانده ۸۰,۰۰۰,۰۰۰ ریال به ۴ قسط ۲۰ میلیون ریالی از طریق بخش تسویه اقساطی
  foundationStore.settlePartyQuick(
    {
      partyId: customer.id,
      txType: 'RECEIPT',
      amountIrr: 80_000_000,
      paymentMethod: 'INSTALLMENT',
      installmentCount: 4,
      dateJalali: '1405/01/20',
      descriptionFa: `طرح اقساطی ۴ ماهه فاکتور ${saleInv3.invoiceNumber}`,
    },
    1
  );

  // پرداخت قسط اول به مبلغ ۲۰,۰۰۰,۰۰۰ ریال توسط مشتری
  const installments = foundationStore.getInstallments().filter((i) => i.partyId === customer.id);
  const firstInst = installments[0];
  if (firstInst) {
    foundationStore.payInstallment(firstInst.id, '1405/02/25', 'POS', 1);
    console.log(`   قسط اول [${firstInst.installmentCode}] به مبلغ ${firstInst.amountIrr.toLocaleString()} ریال با موفقیت تسویه شد.`);
  }

  // --------------------------------------------------------------------------
  // مرحله ۱۰: فروش چکی (One Cheque Sale) و وصول چک
  // --------------------------------------------------------------------------
  console.log('۱۰. ثبت فروش با دریافت چک صیادی (Cheque Sale) و وصول آن...');
  // فروش:
  // - ۲ عدد دوربین دام @ 22,000,000 = 44,000,000 ریال
  // کل مبلغ با ۱ فقره چک صیادی دریافت می‌شود
  const availableCameraSerials4 = foundationStore
    .getItemSerials()
    .filter((s) => s.itemId === productCamera.id && s.status === 'IN_STOCK')
    .slice(0, 2)
    .map((s) => s.serialNumber);

  const saleInv4 = foundationStore.createSalesInvoice(
    {
      customerId: customer.id,
      sourceWarehouseId: defaultWarehouse.id,
      dateJalali: '1405/01/22',
      paidAmountIrr: 44_000_000,
      paymentDetails: {
        paymentMethod: 'CHEQUE',
        posTerminalOrBank: 'چک صیادی بنفش بانک صادرات',
        trackingReference: 'CHQ-SAYAD-998877',
      },
      lines: [
        {
          itemId: productCamera.id,
          quantity: 2,
          unitPriceIrr: 22_000_000,
          serialNumbers: availableCameraSerials4,
        },
      ],
    },
    1
  );

  // ثبت چک صیادی در کارتابل اسناد دریافتنی
  const receivedCheque = foundationStore.createCheque(
    {
      chequeNumber: 'CHQ-SAYAD-998877',
      chequeType: 'INBOUND',
      partyId: customer.id,
      bankNameFa: 'بانک صادرات ایران',
      branchNameFa: 'شعبه مرکزی',
      amountIrr: 44_000_000,
      issueDateJalali: '1405/01/22',
      dueDateJalali: '1405/02/20',
      notesFa: `چک صیادی بابت فاکتور فروش ${saleInv4.invoiceNumber}`,
    },
    1
  );

  console.log(`   چک صیادی دریافتنی شماره ${receivedCheque.chequeNumber} به مبلغ ${receivedCheque.amountIrr.toLocaleString()} ریال ثبت شد.`);

  // وصول قطعی چک به حساب جاری بانک ملت
  foundationStore.updateChequeStatus(
    {
      chequeId: receivedCheque.id,
      status: 'CLEARED',
      depositBankAccountId: bank1.id,
      clearedDateJalali: '1405/02/20',
      notesFa: 'وصول موفق چک در سررسید و واریز به حساب بانک ملت',
    },
    1
  );
  console.log('   چک صیادی با موفقیت وصول و به حساب بانک ملت اضافه گردید.');

  // ==========================================================================
  // مرحله ۱۱: ممیزی جامع، استخراج ترازها و بررسی مغایرت‌ها (Verification)
  // ==========================================================================
  console.log('\n========================================================================');
  console.log('🔍 ممیزی کامل نتایج سناریو و استخراج ترازهای مالی و انبار:');
  console.log('========================================================================\n');

  // ۱. بررسی موجودی انبار (Inventory Stock & Serials)
  // دوربین دام:
  //   افتتاحیه: ۳ عدد
  //   خرید: ۱۰ عدد
  //   کل ورودی: ۱۳ عدد
  //   فروش‌ها: فاکتور ۱ (۴ عدد) + فاکتور ۲ (۳ عدد) + فاکتور ۳ (۲ عدد) + فاکتور ۴ (۲ عدد) = ۱۱ عدد
  //   موجودی نهایی مورد انتظار: ۱۳ - ۱۱ = ۲ عدد
  // دستگاه NVR:
  //   افتتاحیه: ۰ عدد
  //   خرید: ۲ عدد
  //   کل ورودی: ۲ عدد
  //   فروش‌ها: فاکتور ۱ (۱ عدد) + فاکتور ۳ (۱ عدد) = ۲ عدد
  //   موجودی نهایی مورد انتظار: ۲ - ۲ = ۰ عدد

  const items = foundationStore.getItems();
  const cameraSummary = items.find((i) => i.id === productCamera.id);
  const nvrSummary = items.find((i) => i.id === productNvr.id);

  console.log(`📦 موجودی انبار کالاها:`);
  console.log(`   - دوربین مداربسته: موجودی فیزیکی = ${cameraSummary?.totalStock} (مورد انتظار: 2)`);
  console.log(`   - دستگاه NVR: موجودی فیزیکی = ${nvrSummary?.totalStock} (مورد انتظار: 0)`);

  if (cameraSummary?.totalStock !== 2) {
    discrepancies.push({
      category: 'INVENTORY',
      item: 'CAM-HIK-2MP Stock',
      expected: 2,
      actual: cameraSummary?.totalStock,
      explanationFa: `موجودی دوربین مداربسته دام با محاسبات کاردکس مغایرت دارد. انتظار: ۲، فعلی: ${cameraSummary?.totalStock}`,
    });
  }
  if (nvrSummary?.totalStock !== 0) {
    discrepancies.push({
      category: 'INVENTORY',
      item: 'NVR-8CH-4K Stock',
      expected: 0,
      actual: nvrSummary?.totalStock,
      explanationFa: `موجودی دستگاه NVR با محاسبات کاردکس مغایرت دارد. انتظار: ۰، فعلی: ${nvrSummary?.totalStock}`,
    });
  }

  // وضعیت سریال‌ها:
  const serials = foundationStore.getItemSerials().filter((s) => s.itemId === productCamera.id);
  const inStockSerials = serials.filter((s) => s.status === 'IN_STOCK');
  const dispatchedSerials = serials.filter((s) => s.status === 'DISPATCHED');
  console.log(`   - سریال‌های دوربین: کل = ${serials.length}، موجود در انبار = ${inStockSerials.length}، خارج شده = ${dispatchedSerials.length}`);

  if (inStockSerials.length !== 2 || dispatchedSerials.length !== 11) {
    discrepancies.push({
      category: 'SERIALS',
      item: 'Serial Status Counts',
      expected: { inStock: 2, dispatched: 11 },
      actual: { inStock: inStockSerials.length, dispatched: dispatchedSerials.length },
      explanationFa: 'تعداد سریال‌های موجود یا خارج‌شده با اسناد انبار مغایرت دارد.',
    });
  }

  // ۲. موجودی نقد و بانک (Cash & Bank Balances)
  // بانک ملت (Bank 1):
  //   افتتاحیه: +50,000,000
  //   پرداخت فاکتور خرید: -100,000,000
  //   دریافت کارتخوان فاکتور ۱: +58,000,000
  //   پیش‌پرداخت کارتخوان فاکتور ۳: +30,000,000
  //   وصول قسط ۱ کارتخوان: +20,000,000
  //   وصول چک صیادی فاکتور ۴: +44,000,000
  //   جمع نهایی مورد انتظار بانک ملت: 50 - 100 + 58 + 30 + 20 + 44 = 102,000,000 ریال
  // بانک ملی (Bank 2):
  //   افتتاحیه: +30,000,000
  //   تسویه مانده فاکتور ۱ (حواله به بانک ۲): +100,000,000
  //   جمع نهایی مورد انتظار بانک ملی: 130,000,000 ریال
  // صندوق ۱ (Cash 1):
  //   افتتاحیه: +20,000,000
  //   دریافت نقدی فاکتور ۲: +26,000,000
  //   جمع نهایی مورد انتظار صندوق ۱: 46,000,000 ریال
  // صندوق ۲ (Cash 2 - تنخواه):
  //   افتتاحیه: +10,000,000
  //   تسویه نقدی مانده فاکتور ۲: +40,000,000
  //   جمع نهایی مورد انتظار صندوق ۲: 50,000,000 ریال

  const freshBanks = foundationStore.getBankAccounts();
  const b1 = freshBanks.find((b) => b.id === bank1.id)!;
  const b2 = freshBanks.find((b) => b.id === bank2.id)!;
  const freshCashes = foundationStore.getCashBoxes();
  const c1 = freshCashes.find((c) => c.id === cash1.id)!;
  const c2 = freshCashes.find((c) => c.id === cash2.id)!;

  console.log(`\n💳 مانده حساب‌های بانکی و صندوق‌ها:`);
  console.log(`   - بانک ملت: ${b1.balanceIrr.toLocaleString()} ریال (مورد انتظار: 202,000,000)`);
  console.log(`   - بانک ملی: ${b2.balanceIrr.toLocaleString()} ریال (مورد انتظار: 130,000,000)`);
  console.log(`   - صندوق مرکزی: ${c1.balanceIrr.toLocaleString()} ریال (مورد انتظار: 46,000,000)`);
  console.log(`   - صندوق تنخواه: ${c2.balanceIrr.toLocaleString()} ریال (مورد انتظار: 50,000,000)`);

  const totalLiquidAssets = b1.balanceIrr + b2.balanceIrr + c1.balanceIrr + c2.balanceIrr;
  const expectedLiquidAssets = 202_000_000 + 130_000_000 + 46_000_000 + 50_000_000; // 428,000,000
  console.log(`   جمع کل نقدینگی و بانک‌ها: ${totalLiquidAssets.toLocaleString()} ریال (مورد انتظار: ${expectedLiquidAssets.toLocaleString()})`);

  if (b1.balanceIrr !== 202_000_000) {
    discrepancies.push({
      category: 'TREASURY',
      item: 'Bank 1 (Mellat) Balance',
      expected: 202_000_000,
      actual: b1.balanceIrr,
      explanationFa: `مانده بانک ملت با محاسبات خزانه مغایرت دارد. انتظار: 202,000,000، فعلی: ${b1.balanceIrr}`,
    });
  }
  if (b2.balanceIrr !== 130_000_000) {
    discrepancies.push({
      category: 'TREASURY',
      item: 'Bank 2 (Melli) Balance',
      expected: 130_000_000,
      actual: b2.balanceIrr,
      explanationFa: `مانده بانک ملی با محاسبات خزانه مغایرت دارد. انتظار: 130,000,000، فعلی: ${b2.balanceIrr}`,
    });
  }
  if (c1.balanceIrr !== 46_000_000) {
    discrepancies.push({
      category: 'TREASURY',
      item: 'Cash 1 (Main Box) Balance',
      expected: 46_000_000,
      actual: c1.balanceIrr,
      explanationFa: `مانده صندوق مرکزی با محاسبات خزانه مغایرت دارد. انتظار: 46,000,000، فعلی: ${c1.balanceIrr}`,
    });
  }
  if (c2.balanceIrr !== 50_000_000) {
    discrepancies.push({
      category: 'TREASURY',
      item: 'Cash 2 (Petty Box) Balance',
      expected: 50_000_000,
      actual: c2.balanceIrr,
      explanationFa: `مانده صندوق تنخواه با محاسبات خزانه مغایرت دارد. انتظار: 50,000,000، فعلی: ${c2.balanceIrr}`,
    });
  }

  // ۳. حساب‌های طرف‌حساب‌ها (Party Balances & Receivables / Payables)
  // تأمین‌کننده (Supplier):
  //   طلب اولیه (بستانکاری در افتتاحیه): -40,000,000
  //   فاکتور خرید جدید: -230,000,000 (بستانکار شدن تأمین‌کننده)
  //   پرداخت در فاکتور: +100,000,000 (بدهکار شدن تأمین‌کننده)
  //   مانده نهایی حساب تأمین‌کننده: -40,000,000 - 130,000,000 = -170,000,000 ریال (ما به تأمین‌کننده بدهکاریم)
  // مشتری (Customer):
  //   بدهی اولیه (افتتاحیه): +25,000,000
  //   فاکتور فروش ۱: +158,000,000
  //   دریافت فاکتور ۱ (کارتخوان): -58,000,000
  //   تسویه مانده فاکتور ۱: -100,000,000 (خالص فاکتور ۱ = ۰)
  //   فاکتور فروش ۲: +66,000,000
  //   دریافت فاکتور ۲ (نقد): -26,000,000
  //   تسویه مانده فاکتور ۲: -40,000,000 (خالص فاکتور ۲ = ۰)
  //   فاکتور فروش ۳ (اقساطی): +110,000,000
  //   پیش‌پرداخت فاکتور ۳: -30,000,000
  //   تقسیط مانده در ۴ قسط (پرداخت قسط ۱ به مبلغ ۲۰ میلیون): -20,000,000
  //   فاکتور فروش ۴ (چکی): +44,000,000
  //   دریافت چک در فاکتور: -44,000,000
  //   مانده نهایی دفتر مشتری: بدهی اولیه افتتاحیه (+25,000,000) + مانده اقساط ۳ قسط باقی‌مانده (+60,000,000) = بدهکار 85,000,000 ریال (-85,000,000)

  const freshParties = foundationStore.getParties();
  const suppRec = freshParties.find((p) => p.id === supplier.id)!;
  const custRec = freshParties.find((p) => p.id === customer.id)!;

  console.log(`\n👥 مانده حساب طرف‌حساب‌ها:`);
  console.log(`   - تأمین‌کننده (پارس ارتباط): مانده دفتری = ${suppRec.transactionsSummary?.netBalanceIrr?.toLocaleString()} ریال (مورد انتظار: 170,000,000)`);
  console.log(`   - کارفرما/مشتری (سازه‌پردازان): مانده دفتری = ${custRec.transactionsSummary?.netBalanceIrr?.toLocaleString()} ریال (مورد انتظار: -85,000,000)`);

  if (suppRec.transactionsSummary?.netBalanceIrr !== 170_000_000) {
    discrepancies.push({
      category: 'PARTIES',
      item: 'Supplier Net Balance',
      expected: 170_000_000,
      actual: suppRec.transactionsSummary?.netBalanceIrr,
      explanationFa: `مانده دفتری تأمین‌کننده با محاسبات همخوان نیست. انتظار: 170,000,000، فعلی: ${suppRec.transactionsSummary?.netBalanceIrr}`,
    });
  }
  if (custRec.transactionsSummary?.netBalanceIrr !== -85_000_000) {
    discrepancies.push({
      category: 'PARTIES',
      item: 'Customer Net Balance',
      expected: -25_000_000,
      actual: custRec.transactionsSummary?.netBalanceIrr,
      explanationFa: `مانده دفتری مشتری با محاسبات همخوان نیست. انتظار: -25,000,000، فعلی: ${custRec.transactionsSummary?.netBalanceIrr}`,
    });
  }

  // ۴. وضعیت اقساط (Installments)
  // تعداد اقساط ایجاد شده: ۴ قسط ۲۰ میلیون ریالی (جمع: ۸۰ میلیون ریال)
  // قسط اول: PAID
  // سه قسط بعدی: PENDING
  // مانده اقساط در جریان (بدهی اقساطی مشتری): ۳ * ۲۰,۰۰۰,۰۰۰ = ۶۰,۰۰۰,۰۰۰ ریال
  const customerInstallments = foundationStore.getInstallments().filter((i) => i.partyId === customer.id);
  const paidInst = customerInstallments.filter((i) => i.status === 'PAID');
  const pendingInst = customerInstallments.filter((i) => i.status === 'PENDING');

  console.log(`\n📅 کارتابل اقساط:`);
  console.log(`   - کل اقساط: ${customerInstallments.length} قسط`);
  console.log(`   - اقساط تسویه‌شده (PAID): ${paidInst.length} قسط به مبلغ ${paidInst.reduce((s, i) => s + i.amountIrr, 0).toLocaleString()} ریال`);
  console.log(`   - اقساط معوق/در جریان (PENDING): ${pendingInst.length} قسط به مبلغ ${pendingInst.reduce((s, i) => s + i.amountIrr, 0).toLocaleString()} ریال`);

  if (customerInstallments.length !== 4 || paidInst.length !== 1 || pendingInst.length !== 3) {
    discrepancies.push({
      category: 'INSTALLMENTS',
      item: 'Installments Count and Status',
      expected: { total: 4, paid: 1, pending: 3 },
      actual: { total: customerInstallments.length, paid: paidInst.length, pending: pendingInst.length },
      explanationFa: 'وضعیت تعداد اقساط یا وضعیت پرداخت با سناریو مطابقت ندارد.',
    });
  }

  // ۵. وضعیت چک‌ها (Cheques)
  // ۱ فقره چک صیادی به مبلغ ۴۴,۰۰۰,۰۰۰ ریال ثبت و با موفقیت CLEARED شد
  const customerCheques = foundationStore.getCheques().filter((c) => c.partyId === customer.id);
  const clearedCheques = customerCheques.filter((c) => c.status === 'CLEARED');

  console.log(`\n📑 کارتابل چک‌ها:`);
  console.log(`   - کل چک‌های دریافتی: ${customerCheques.length} فقره`);
  console.log(`   - چک‌های وصول‌شده (CLEARED): ${clearedCheques.length} فقره به مبلغ ${clearedCheques.reduce((s, c) => s + c.amountIrr, 0).toLocaleString()} ریال`);

  if (customerCheques.length !== 1 || clearedCheques.length !== 1) {
    discrepancies.push({
      category: 'CHEQUES',
      item: 'Cheque Status',
      expected: { total: 1, cleared: 1 },
      actual: { total: customerCheques.length, cleared: clearedCheques.length },
      explanationFa: 'وضعیت چک صیادی با سناریو مطابقت ندارد.',
    });
  }

  // ۶. سودآوری و بهای تمام‌شده (Profitability & COGS)
  // کل درآمد فروش (Sales Revenue):
  //   فاکتور ۱: 158,000,000
  //   فاکتور ۲: 66,000,000
  //   فاکتور ۳: 110,000,000
  //   فاکتور ۴: 44,000,000
  //   جمع کل درآمد فروش: 378,000,000 ریال
  //
  // بهای تمام‌شده کالای فروش‌رفته (COGS):
  //   فاکتور ۱:
  //     ۴ عدد دوربین @ 15,000,000 = 60,000,000
  //     ۱ عدد NVR @ 40,000,000 = 40,000,000
  //     ۱ خدمت @ 0 = 0
  //     جمع بهای تمام‌شده فاکتور ۱: 100,000,000 ریال
  //   فاکتور ۲:
  //     ۳ عدد دوربین @ 15,000,000 = 45,000,000 ریال
  //   فاکتور ۳:
  //     ۲ عدد دوربین @ 15,000,000 = 30,000,000
  //     ۱ عدد NVR @ 40,000,000 = 40,000,000
  //     جمع بهای تمام‌شده فاکتور ۳: 70,000,000 ریال
  //   فاکتور ۴:
  //     ۲ عدد دوربین @ 15,000,000 = 30,000,000 ریال
  //
  // جمع کل بهای تمام‌شده (Total COGS): 100 + 45 + 70 + 30 = 245,000,000 ریال
  // سود ناخالص عملیاتی (Gross Operating Profit): 378,000,000 - 245,000,000 = 133,000,000 ریال
  // حاشیه سود ناخالص: (133 / 378) * 100 = 35.18%

  const profitReport = foundationStore.getComprehensiveProfitabilityReport();
  const summary = profitReport.summary;
  console.log(`\n📊 صورت سود و زیان (P&L Report):`);
  console.log(`   - کل درآمد فروش: ${summary.totalNetSalesIrr.toLocaleString()} ریال (مورد انتظار: 378,000,000)`);
  console.log(`   - کل بهای تمام‌شده COGS: ${summary.totalCogsIrr.toLocaleString()} ریال (مورد انتظار: 245,000,000)`);
  console.log(`   - سود ناخالص عملیاتی: ${summary.totalGrossProfitIrr.toLocaleString()} ریال (مورد انتظار: 133,000,000)`);
  console.log(`   - حاشیه سود ناخالص: ${summary.overallGrossMarginPct}% (مورد انتظار: 35.18%)`);

  if (summary.totalNetSalesIrr !== 378_000_000) {
    discrepancies.push({
      category: 'PROFITABILITY',
      item: 'Total Revenue',
      expected: 378_000_000,
      actual: summary.totalNetSalesIrr,
      explanationFa: `درآمد کل با جمع فاکتورهای فروش مغایرت دارد. انتظار: 378,000,000، فعلی: ${summary.totalNetSalesIrr}`,
    });
  }
  if (summary.totalCogsIrr !== 245_000_000) {
    discrepancies.push({
      category: 'PROFITABILITY',
      item: 'Total COGS',
      expected: 245_000_000,
      actual: summary.totalCogsIrr,
      explanationFa: `بهای تمام‌شده COGS با خروج‌های انبار مغایرت دارد. انتظار: 245,000,000، فعلی: ${summary.totalCogsIrr}`,
    });
  }
  if (summary.totalGrossProfitIrr !== 133_000_000) {
    discrepancies.push({
      category: 'PROFITABILITY',
      item: 'Gross Profit',
      expected: 133_000_000,
      actual: summary.totalGrossProfitIrr,
      explanationFa: `سود ناخالص مغایرت دارد. انتظار: 133,000,000، فعلی: ${summary.totalGrossProfitIrr}`,
    });
  }

  // ۷. تراز کل اسناد حسابداری (Trial Balance & Accounting Totals)
  const trialBalance = foundationStore.getTrialBalance();
  console.log(`\n⚖️ تراز آزمایشی کل اسناد حسابداری (Trial Balance):`);
  console.log(`   - مجموع گردش بدهکار: ${(trialBalance.totalDebitTurnoverIrr || 0).toLocaleString()} ریال`);
  console.log(`   - مجموع گردش بستانکار: ${(trialBalance.totalCreditTurnoverIrr || 0).toLocaleString()} ریال`);
  console.log(`   - وضعیت توازن دفتر کل: ${trialBalance.isBalanced ? 'متوازن و دقیق ✅' : 'نامتوازن ❌'}`);

  if (!trialBalance.isBalanced) {
    discrepancies.push({
      category: 'ACCOUNTING',
      item: 'Trial Balance Equilibrium',
      expected: true,
      actual: trialBalance.isBalanced,
      explanationFa: `تراز آزمایشی کل اسناد نامتوازن است! گردش بدهکار: ${trialBalance.totalDebitTurnoverIrr}، گردش بستانکار: ${trialBalance.totalCreditTurnoverIrr}`,
    });
  }

  // گزارش اسناد حسابداری ثبت‌شده
  const docs = foundationStore.getAccountingDocuments();
  console.log(`   - تعداد کل اسناد حسابداری صادره: ${docs.length} سند`);

  console.log('\n========================================================================');
  console.log(`📋 نتیجه نهایی ممیزی صنعت ۱ (CCTV & Security):`);
  console.log(`   تعداد کل مغایرت‌های کشف‌شده: ${discrepancies.length}`);
  if (discrepancies.length > 0) {
    console.log('   ⚠️ مغایرت‌ها به شرح زیر ثبت گردید:');
    discrepancies.forEach((d, idx) => {
      console.log(`   ${idx + 1}. [${d.category}] ${d.item}: انتظار: ${JSON.stringify(d.expected)} | مشاهده‌شده: ${JSON.stringify(d.actual)} -> ${d.explanationFa}`);
    });
  } else {
    console.log('   🎉 هیچ‌گونه مغایرتی یافت نشد؛ تمامی ترازها، حساب‌ها، موجودی‌ها و سودآوری ۱۰۰٪ مطابق محاسبات دقیق حسابداری پذیرفته شدند.');
  }
  console.log('========================================================================\n');

  return {
    industryCode: 'CCTV_SECURITY',
    industryTitleFa: 'دوربین مداربسته و سیستم‌های حفاظتی و نظارتی (مهرگان)',
    inventory: {
      cameraStock: cameraSummary?.totalStock,
      nvrStock: nvrSummary?.totalStock,
      inStockSerials: inStockSerials.length,
      dispatchedSerials: dispatchedSerials.length,
    },
    treasury: {
      bankMellat: b1.balanceIrr,
      bankMelli: b2.balanceIrr,
      cashMain: c1.balanceIrr,
      cashPetty: c2.balanceIrr,
      totalLiquid: totalLiquidAssets,
    },
    parties: {
      supplierBalance: suppRec.transactionsSummary?.netBalanceIrr,
      customerBalance: custRec.transactionsSummary?.netBalanceIrr,
    },
    installments: {
      total: customerInstallments.length,
      paid: paidInst.length,
      pending: pendingInst.length,
      pendingAmount: pendingInst.reduce((s, i) => s + i.amountIrr, 0),
    },
    cheques: {
      total: customerCheques.length,
      cleared: clearedCheques.length,
      clearedAmount: clearedCheques.reduce((s, c) => s + c.amountIrr, 0),
    },
    profitability: {
      revenue: summary.totalNetSalesIrr,
      cogs: summary.totalCogsIrr,
      grossProfit: summary.totalGrossProfitIrr,
      marginPercent: summary.overallGrossMarginPct,
    },
    accounting: {
      totalDebit: trialBalance.totalDebitTurnoverIrr,
      totalCredit: trialBalance.totalCreditTurnoverIrr,
      isBalanced: trialBalance.isBalanced,
      totalDocuments: docs.length,
    },
    discrepancies,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCctvAcceptanceScenario()
    .then((res) => {
      fs.writeFileSync('.mehregan-data/acceptance-cctv-results.json', JSON.stringify(res, null, 2), 'utf8');
      process.exit(res.discrepancies.length > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('CRITICAL SCENARIO FAILURE:', err);
      process.exit(1);
    });
}
