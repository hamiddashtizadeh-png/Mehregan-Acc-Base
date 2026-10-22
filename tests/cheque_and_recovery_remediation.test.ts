import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('آزمون‌های جامع اصلاحات وصول چک و بازسازی اسناد جاافتاده (Remediation A & B)', () => {
  it('۱. وصول چک در حالت فعال بودن حسابداری دوبل باید سند متوازن و معتبر در دفتر کل ثبت کند', () => {
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });

    const cheque = foundationStore.createCheque({
      chequeNumber: `CHQ-TEST-${Date.now()}`,
      chequeType: 'INBOUND',
      partyId: 1,
      bankNameFa: 'بانک ملت',
      amountIrr: 85000000,
      issueDateJalali: '1405/01/15',
      dueDateJalali: '1405/02/15',
      notesFa: 'چک آزمایشی وصول برای آزمون دوبل',
    });

    const bankBefore = foundationStore.getBankAccounts()[0].balanceIrr;

    // Update to CLEARED
    const cleared = foundationStore.updateChequeStatus({
      chequeId: cheque.id,
      status: 'CLEARED',
      depositBankAccountId: 1,
      clearedDateJalali: '1405/02/15',
    });

    assert.strictEqual(cleared.status, 'CLEARED');

    // Verify treasury bank balance incremented
    const bankAfter = foundationStore.getBankAccounts()[0].balanceIrr;
    assert.strictEqual(bankAfter, bankBefore + 85000000);

    // Verify accounting document posted
    const docs = foundationStore.getAccountingDocuments();
    const clearanceDoc = docs.find(
      (d) => d.sourceDocType === 'CHEQUE_CLEARANCE' && String(d.sourceDocId) === String(cheque.id)
    );

    assert.ok(clearanceDoc, 'سند حسابداری وصول چک باید به صورت خودکار صادر شده باشد.');
    assert.strictEqual(clearanceDoc.totalDebitIrr, 85000000);
    assert.strictEqual(clearanceDoc.totalCreditIrr, 85000000);
    assert.strictEqual(clearanceDoc.lines.length, 2);

    const debitLine = clearanceDoc.lines.find((l) => l.debitIrr > 0);
    const creditLine = clearanceDoc.lines.find((l) => l.creditIrr > 0);

    assert.ok(debitLine && creditLine);
    assert.strictEqual(debitLine.accountCode, '10102'); // بانک
    assert.strictEqual(creditLine.accountCode, '10201'); // اسناد دریافتنی
  });

  it('۲. وصول چک صادره (OUTBOUND) باید حساب اسناد پرداختنی ۳۰۲۰۱ را بدهکار و بانک را بستانکار کند', () => {
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });

    const bank = foundationStore.getBankAccounts()[0];
    bank.balanceIrr += 150000000;

    const cheque = foundationStore.createCheque({
      chequeNumber: `CHQ-OUT-${Date.now()}`,
      chequeType: 'OUTBOUND',
      partyId: 2,
      bankNameFa: 'بانک ملت',
      amountIrr: 40000000,
      issueDateJalali: '1405/01/10',
      dueDateJalali: '1405/02/10',
      notesFa: 'چک پرداختی بابت خرید قطعات',
    });

    const bankBefore = bank.balanceIrr;

    foundationStore.updateChequeStatus({
      chequeId: cheque.id,
      status: 'CLEARED',
      depositBankAccountId: bank.id,
      clearedDateJalali: '1405/02/10',
    });

    assert.strictEqual(bank.balanceIrr, bankBefore - 40000000);

    const docs = foundationStore.getAccountingDocuments();
    const doc = docs.find(
      (d) => d.sourceDocType === 'CHEQUE_CLEARANCE' && String(d.sourceDocId) === String(cheque.id)
    );

    assert.ok(doc);
    assert.strictEqual(doc.totalDebitIrr, 40000000);
    assert.strictEqual(doc.totalCreditIrr, 40000000);

    const debitLine = doc.lines.find((l) => l.debitIrr > 0);
    const creditLine = doc.lines.find((l) => l.creditIrr > 0);

    assert.strictEqual(debitLine?.accountCode, '30201'); // اسناد پرداختنی
    assert.strictEqual(creditLine?.accountCode, '10102'); // بانک
  });

  it('۳. وصول چک در زمان غیرفعال بودن حسابداری دوبل بدون خطا خزانه را اصلاح کرده و سند دوبل صادر نمی‌کند', () => {
    foundationStore.updateSettings({ enableDoubleEntryAccounting: false });

    const cheque = foundationStore.createCheque({
      chequeNumber: `CHQ-NO-ACC-${Date.now()}`,
      chequeType: 'INBOUND',
      partyId: 1,
      bankNameFa: 'بانک ملت',
      amountIrr: 25000000,
      issueDateJalali: '1405/01/20',
      dueDateJalali: '1405/02/20',
      notesFa: 'چک در وضعیت خاموش بودن حسابداری دوبل',
    });

    const bank = foundationStore.getBankAccounts()[0];
    const bankBefore = bank.balanceIrr;

    foundationStore.updateChequeStatus({
      chequeId: cheque.id,
      status: 'CLEARED',
      depositBankAccountId: bank.id,
      clearedDateJalali: '1405/02/20',
    });

    assert.strictEqual(bank.balanceIrr, bankBefore + 25000000);

    const docs = foundationStore.getAccountingDocuments();
    const doc = docs.find(
      (d) => d.sourceDocType === 'CHEQUE_CLEARANCE' && String(d.sourceDocId) === String(cheque.id)
    );
    assert.strictEqual(doc, undefined, 'نباید سندی در حالت غیرفعال بودن حسابداری صادر شود.');

    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
  });

  it('۴. بازسازی اسناد (generateMissingAutoVouchers) باید اسناد مرجوعی و چک‌های وصول‌شده را بازیابی و ممانعت از تکرار کند', () => {
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });

    // Ensure periods are open in case earlier tests closed any period
    const periods = foundationStore.getAccountingPeriods();
    for (const p of periods) {
      if (p.status === 'CLOSED') {
        try {
          foundationStore.reopenAccountingPeriod(p.id, 'بازگشایی خودکار جهت تست بازسازی اسناد', 1);
        } catch {
          // ignore
        }
      }
    }

    const result1 = foundationStore.generateMissingAutoVouchers(1);
    assert.strictEqual(result1.ok, true);

    const docsCountAfterRecovery = foundationStore.getAccountingDocuments().length;

    // Idempotency check: running again must create 0 new documents
    const result2 = foundationStore.generateMissingAutoVouchers(1);
    assert.strictEqual(result2.ok, true);
    assert.strictEqual(result2.createdCount, 0, 'بازسازی مجدد نباید هیچ سند تکراری تولید کند.');
    assert.strictEqual(
      foundationStore.getAccountingDocuments().length,
      docsCountAfterRecovery,
      'تعداد اسناد نباید تغییر کند.'
    );
  });
});
