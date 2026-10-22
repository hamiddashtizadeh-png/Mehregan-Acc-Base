import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('آزمون‌های کنترل سراسری ماژول حسابداری دوبل (Double-Entry Accounting Global Toggle Tests)', () => {
  it('۱. تغییر تنظیم سراسری enableDoubleEntryAccounting و حفظ اسناد قبلی', () => {
    // Enable initially
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
    assert.strictEqual(foundationStore.isDoubleEntryAccountingEnabled(), true);

    const initialDocsCount = foundationStore.getAccountingDocuments().length;

    // Disable double entry accounting
    foundationStore.updateSettings({ enableDoubleEntryAccounting: false });
    assert.strictEqual(foundationStore.isDoubleEntryAccountingEnabled(), false);

    // Documents must still exist in database state (preserved, not deleted)
    const docsAfterDisable = foundationStore.getAccountingDocuments().length;
    assert.strictEqual(
      docsAfterDisable,
      initialDocsCount,
      'غیرفعال‌سازی ماژول نباید هیچ اسنادی از اسناد حسابداری قبلی را حذف کند.'
    );

    // Re-enable
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
    assert.strictEqual(foundationStore.isDoubleEntryAccountingEnabled(), true);
  });

  it('۲. محدودسازی و پرتاب خطا در زمان غیرفعال بودن حسابداری دوبل', () => {
    foundationStore.updateSettings({ enableDoubleEntryAccounting: false });

    // Attempting to create accounting document should throw
    assert.throws(
      () => {
        foundationStore.createAccountingDocument(
          {
            dateJalali: '1405/01/25',
            descriptionFa: 'سند تست در حالت غیرفعال',
            lines: [
              { accountCode: '10101', accountTitleFa: 'صندوق', debitIrr: 1000, creditIrr: 0, descriptionFa: 'تست' },
              { accountCode: '10102', accountTitleFa: 'بانک', debitIrr: 0, creditIrr: 1000, descriptionFa: 'تست' },
            ],
          },
          1
        );
      },
      (err: any) => err.message.includes('غیرفعال می‌باشد'),
      'در حالت غیرفعال، ثبت سند حسابداری باید با پیام خطای سرور رد شود.'
    );

    // Attempting auto-generation should throw
    assert.throws(
      () => {
        foundationStore.generateAccountingDocFromSalesInvoice(1, 1);
      },
      (err: any) => err.message.includes('غیرفعال می‌باشد')
    );

    // Restore setting
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
  });

  it('۳. استقلال عملیات مالی (فروش، خرید، خزانه و انبار) در زمان غیرفعال بودن حسابداری دوبل', () => {
    // Disable double-entry accounting
    foundationStore.updateSettings({ enableDoubleEntryAccounting: false });

    const warehouse = foundationStore.getWarehouses()[0];
    const party = foundationStore.createParty(
      {
        fullName: `طرف‌حساب تست استقلال ${Date.now()}`,
        primaryType: 'SUPPLIER',
        mobile: `0912${Math.floor(100000 + Math.random() * 900000)}`,
        city: 'تهران',
      },
      1,
      true
    );

    // 1. Core Purchase Operation must succeed without double-entry accounting
    const bank = foundationStore.getBankAccounts()[0];
    bank.balanceIrr = 500000000;

    const serials = Array.from({ length: 2 }, (_, i) => `SN-DE-TEST-${Date.now()}-${i}`);
    const purchaseInv = foundationStore.createPurchaseInvoice(
      {
        supplierId: party.id,
        targetWarehouseId: warehouse.id,
        dateJalali: '1405/01/25',
        currency: 'IRR',
        exchangeRateToIrr: 1,
        lines: [
          {
            itemId: 1,
            quantity: 2,
            unitPriceForeign: 50000000, // 100M IRR
            serialNumbers: serials,
          },
        ],
      },
      1
    );

    assert(purchaseInv.id > 0, 'ثبت فاکتور خرید باید با موفقیت انجام شود.');
    assert.strictEqual(purchaseInv.totalInvoicePayableToSupplierIrr, 100000000);

    // 2. Core Treasury Operation must succeed
    const treasuryTx = foundationStore.createTreasuryTransaction(
      {
        txType: 'PAYMENT',
        dateJalali: '1405/01/25',
        partyId: party.id,
        amountIrr: 40000000,
        paymentMethod: 'BANK_TRANSFER',
        sourceBankAccountId: bank.id,
        notesFa: 'پرداخت تست در حالت غیرفعال بودن حسابداری دوبل',
      },
      1
    );

    assert(treasuryTx.id > 0, 'تراکنش خزانه باید با موفقیت ثبت شود.');

    // 3. Core Sales Operation must succeed
    const salesInv = foundationStore.createSalesInvoice(
      {
        customerId: party.id,
        sourceWarehouseId: warehouse.id,
        dateJalali: '1405/01/25',
        lines: [
          {
            itemId: 1,
            quantity: 1,
            unitPriceIrr: 70000000,
            serialNumbers: [serials[0]],
          },
        ],
      },
      1
    );

    assert(salesInv.id > 0, 'ثبت فاکتور فروش باید با موفقیت انجام شود.');

    // Verify Party balance dynamically updated
    const partyReloaded = foundationStore.getParties().find((p) => p.id === party.id)!;
    // Purchases (+100M) + Receipts (0) - Sales (70M) - Payments (40M) = -10,000,000 IRR
    assert.strictEqual(
      partyReloaded.transactionsSummary?.netBalanceIrr,
      -10000000,
      'مانده حساب شخص باید در حالت غیرفعال بودن حسابداری دوبل کاملاً دقیق محاسبه گردد.'
    );

    // Restore setting
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
  });

  it('۴. بازسازی ایمن اسناد جامانده و جلوگیری قاطع از ثبت تکراری (Idempotency)', () => {
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });

    const result1 = foundationStore.generateMissingAutoVouchers(1);
    assert.strictEqual(result1.ok, true);

    const initialDocsCount = foundationStore.getAccountingDocuments().length;

    // Running regeneration a second time must produce 0 new documents (no duplicates)
    const result2 = foundationStore.generateMissingAutoVouchers(1);
    assert.strictEqual(result2.createdCount, 0, 'دوبار بازسازی نباید هیچ سند تکراری ایجاد کند.');
    assert.strictEqual(
      foundationStore.getAccountingDocuments().length,
      initialDocsCount,
      'تعداد کل اسناد نباید تغییر کرده باشد.'
    );
  });

  it('۵. استقلال کامل حساب اشخاص، ریز تراکنش‌ها، صورت‌حساب تفصیلی و تسویه در حالت غیرفعال بودن حسابداری دوبل', () => {
    // غیرفعال‌سازی سراسری حسابداری دوبل
    foundationStore.updateSettings({ enableDoubleEntryAccounting: false });
    assert.strictEqual(foundationStore.isDoubleEntryAccountingEnabled(), false);

    // ۱. تعریف مشتری جدید
    const customer = foundationStore.createParty(
      {
        fullName: `مشتری مستقل ${Date.now()}`,
        primaryType: 'CUSTOMER',
        mobile: `0935${Math.floor(100000 + Math.random() * 900000)}`,
        city: 'اصفهان',
      },
      1,
      true
    );
    assert(customer.id > 0);

    const warehouse = foundationStore.getWarehouses()[0];
    const item = foundationStore.getItems()[0];
    const initialStock = item.totalStock || 10;
    item.totalStock = initialStock + 5;

    // ۲. صدور فاکتور فروش نسیه (بدهکار شدن مشتری) بدون ثبت سند دوبل
    const salesInv = foundationStore.createSalesInvoice(
      {
        customerId: customer.id,
        sourceWarehouseId: warehouse.id,
        dateJalali: '1405/01/25',
        lines: [
          {
            itemId: item.id,
            quantity: 2,
            unitPriceIrr: 25000000, // 50,000,000 IRR
          },
        ],
      },
      1
    );
    assert.strictEqual(salesInv.totalInvoiceAmountIrr, 50000000);

    // ۳. بررسی صورت‌حساب تفصیلی و ریز تراکنش‌های شخص
    const partyWithTxs1 = foundationStore.getPartyById(customer.id);
    assert(partyWithTxs1 !== null);
    assert(partyWithTxs1.transactions.length >= 1);
    const saleTx = partyWithTxs1.transactions.find((t) => t.recordType === 'SALE_INVOICE');
    assert(saleTx !== undefined, 'تراکنش فروش باید در پرونده تفصیلی شخص ثبت شده باشد.');
    assert.strictEqual(saleTx?.amountIrr, 50000000);

    // ۴. مانده بدهکاری شخص: مشتری ۵۰ میلیون ریال بدهکار است (netBalanceIrr = -50,000,000)
    assert.strictEqual(
      partyWithTxs1.transactionsSummary?.netBalanceIrr,
      -50000000,
      'مانده بدهکار شخص در وضعیت خاموش بودن حسابداری دوبل باید دقیقاً منفی پنجاه میلیون ریال باشد.'
    );

    // ۵. تسویه حساب سریع شخص (دریافت ۲۰ میلیون ریال از طریق پوز بانکی)
    const bank = foundationStore.getBankAccounts()[0];
    const settleResult = foundationStore.settlePartyQuick(
      {
        partyId: customer.id,
        txType: 'RECEIPT',
        amountIrr: 20000000,
        paymentMethod: 'POS',
        bankAccountId: bank.id,
        dateJalali: '1405/01/25',
        descriptionFa: 'تسویه حساب کارتخوان',
      },
      1
    );
    assert.strictEqual(settleResult.ok, true);

    // ۶. بررسی مجدد مانده و ریز تراکنش‌های تفصیلی پس از تسویه
    const partyWithTxs2 = foundationStore.getPartyById(customer.id);
    assert(partyWithTxs2 !== null);
    // بدهکار ۵۰ میلیون - دریافت ۲۰ میلیون = بدهکار ۳۰ میلیون (netBalanceIrr = -30,000,000)
    assert.strictEqual(
      partyWithTxs2.transactionsSummary?.netBalanceIrr,
      -30000000,
      'پس از دریافت وجه، مانده شخص باید دقیقاً به منفی سی میلیون ریال کاهش یابد.'
    );

    // ۷. بررسی عدم تغییر یا حذف کدینگ و اسناد تاریخی
    const chart = foundationStore.getAccountsChart();
    assert(chart.length > 0, 'کدینگ سرفصل‌های حسابداری نباید حذف شود.');

    // بازگردانی تنظیمات به پیش‌فرض
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
    assert.strictEqual(foundationStore.isDoubleEntryAccountingEnabled(), true);
  });
});
