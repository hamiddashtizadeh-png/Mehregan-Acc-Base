import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۱۲: داشبورد هوش تجاری مدیران (Executive BI)، بستن سال مالی و گزارش‌های مالیاتی (Phase 12: Executive BI Dashboard & Fiscal Closure)', () => {
  it('باید گزارش سودآوری جامع چندبعدی (بر حسب کالا، مشتری و مرکز هزینه) را محاسبه نماید', () => {
    const report = foundationStore.getComprehensiveProfitabilityReport({
      fiscalYearCode: '1405',
    });

    assert.ok(report);
    assert.ok(report.summary.totalNetSalesIrr >= 0);
    assert.ok(report.summary.totalCogsIrr >= 0);
    assert.ok(report.summary.totalGrossProfitIrr >= 0);
    assert.ok(Array.isArray(report.byItem));
    assert.ok(Array.isArray(report.byCustomer));
  });

  it('باید سال‌های مالی موجود را بازیابی کرده و کنترل تاریخ ثبت اسناد در محدوده سال مالی باز را تأیید کند', () => {
    const fiscalYears = foundationStore.getFiscalYears();
    assert.ok(fiscalYears.length >= 1);

    const openYear = fiscalYears.find((y) => y.status === 'OPEN');
    assert.ok(openYear, 'حداقل یک سال مالی باز باید در سیستم موجود باشد.');

    const dateCheck = foundationStore.validateDocumentDateForPosting('1405/03/15');
    assert.strictEqual(dateCheck.valid, true);
    assert.strictEqual(dateCheck.fiscalYear?.yearCode, '1405');
  });

  it('باید خلاصه صورت سود و زیان (P&L Summary) و تراز آزمایشی چهارستونی را با تعادل حساب‌ها تولید کند', () => {
    const trialBalance = foundationStore.getTrialBalance();
    assert.ok(trialBalance);
    assert.ok(Array.isArray(trialBalance.rows));

    // Verify trial balance debit/credit balance equality
    const totalDebit = trialBalance.rows.reduce((sum, r) => sum + r.remainingDebitIrr, 0);
    const totalCredit = trialBalance.rows.reduce((sum, r) => sum + r.remainingCreditIrr, 0);
    assert.strictEqual(totalDebit, totalCredit, 'تراز آزمایشی باید کاملاً متعادل باشد (جمع بدهکار = جمع بستانکار).');
  });

  it('باید لاگ‌های حسابرسی امنیتی و مدیریتی (Audit Logs) را ثبت و جستجو نماید', () => {
    const logs = foundationStore.getAuditLogs();
    assert.ok(Array.isArray(logs));
    assert.ok(logs.length > 0);
  });
});
