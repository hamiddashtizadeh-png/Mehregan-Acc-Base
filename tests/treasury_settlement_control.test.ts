import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('آزمون‌های تسویه مالی و کنترل موجودی خزانه (Treasury & Settlement Control Tests)', () => {
  it('۱. پرداخت از خزانه و اصلاح مانده شخص', () => {
    const warehouse = foundationStore.getWarehouses()[0];
    assert(warehouse, 'انبار فعال باید وجود داشته باشد.');

    // Create new party with unique mobile
    const party = foundationStore.createParty(
      {
        fullName: `تأمین‌کننده آزمایشی خزانه ${Date.now()}`,
        primaryType: 'SUPPLIER',
        mobile: `0999${Math.floor(100000 + Math.random() * 900000)}`,
        city: 'تهران',
      },
      1,
      true
    );

    // Initial balance should be 0
    const partyBefore = foundationStore.getParties().find((p) => p.id === party.id)!;
    const initialNetBalance = partyBefore.transactionsSummary?.netBalanceIrr || 0;

    // Record a purchase invoice first (Credit = 100,000,000 IRR)
    const serials1 = Array.from({ length: 10 }, (_, i) => `SN-TST1-${Date.now()}-${i}`);
    const invoice = foundationStore.createPurchaseInvoice(
      {
        supplierId: party.id,
        targetWarehouseId: warehouse.id,
        dateJalali: '1405/01/20',
        currency: 'IRR',
        exchangeRateToIrr: 1,
        lines: [
          {
            itemId: 1,
            quantity: 10,
            unitPriceForeign: 10000000, // 10 * 10M = 100M IRR
            serialNumbers: serials1,
          },
        ],
      },
      1
    );

    const partyAfterInvoice = foundationStore.getParties().find((p) => p.id === party.id)!;
    assert.strictEqual(
      partyAfterInvoice.transactionsSummary?.netBalanceIrr,
      initialNetBalance + 100000000,
      'بدهی به تأمین‌کننده باید ۱۰۰ میلیون ریال باشد.'
    );

    // Record treasury payment of 40,000,000 IRR from Bank Account 1 (ensure sufficient balance first)
    const bank = foundationStore.getBankAccounts()[0];
    assert(bank, 'حساب بانکی باید موجود باشد.');
    if (bank.balanceIrr < 40000000) {
      bank.balanceIrr = 100000000;
    }

    foundationStore.createTreasuryTransaction(
      {
        txType: 'PAYMENT',
        dateJalali: '1405/01/21',
        partyId: party.id,
        amountIrr: 40000000,
        paymentMethod: 'BANK_TRANSFER',
        sourceBankAccountId: bank.id,
        notesFa: 'پرداخت تست از خزانه',
      },
      1
    );

    const partyAfterPayment = foundationStore.getParties().find((p) => p.id === party.id)!;
    assert.strictEqual(
      partyAfterPayment.transactionsSummary?.netBalanceIrr,
      initialNetBalance + 60000000,
      'مانده طلب تأمین‌کننده باید به ۶۰ میلیون ریال کاهش یافته باشد.'
    );

    const txs = foundationStore.getPartyTransactions(party.id);
    const payments = txs.filter((t) => t.recordType === 'PAYMENT');
    assert.strictEqual(payments.length, 1, 'باید دقیقاً ۱ سند پرداخت ثبت شده باشد.');
  });

  it('۲. پرداخت از ماژول خرید و کنترل تسویه جزئی و کامل و عدم ثبت تکراری', () => {
    const warehouse = foundationStore.getWarehouses()[0];
    assert(warehouse, 'انبار فعال باید وجود داشته باشد.');

    const party = foundationStore.createParty(
      {
        fullName: `تأمین‌کننده ماژول خرید ${Date.now()}`,
        primaryType: 'SUPPLIER',
        mobile: `0998${Math.floor(100000 + Math.random() * 900000)}`,
        city: 'اصفهان',
      },
      1,
      true
    );

    const serials2 = Array.from({ length: 5 }, (_, i) => `SN-TST2-${Date.now()}-${i}`);
    const invoice = foundationStore.createPurchaseInvoice(
      {
        supplierId: party.id,
        targetWarehouseId: warehouse.id,
        dateJalali: '1405/01/22',
        currency: 'IRR',
        exchangeRateToIrr: 1,
        lines: [
          {
            itemId: 1,
            quantity: 5,
            unitPriceForeign: 20000000, // Total 100,000,000 IRR
            serialNumbers: serials2,
          },
        ],
      },
      1
    );

    const bank = foundationStore.getBankAccounts()[0];
    bank.balanceIrr = 200000000; // Fund bank with 200M IRR

    // Partial Payment: 40M IRR
    const payment1 = foundationStore.createPurchasePayment(
      {
        supplierId: party.id,
        purchaseInvoiceId: invoice.id,
        amountIrr: 40000000,
        paymentMethod: 'BANK_TRANSFER',
        sourceAccountOrBank: bank.bankNameFa,
        sourceBankAccountId: bank.id,
        trackingReference: 'TRK-PARTIAL-101',
      },
      1
    );

    const invReloaded1 = foundationStore.getPurchaseInvoiceById(invoice.id)!;
    assert.strictEqual(invReloaded1.paidAmountIrr, 40000000);
    assert.strictEqual(invReloaded1.remainingDebtIrr, 60000000);
    assert.strictEqual(invReloaded1.status, 'PARTIALLY_PAID');

    // Verify Party Balance
    const partyReloaded1 = foundationStore.getParties().find((p) => p.id === party.id)!;
    assert.strictEqual(partyReloaded1.transactionsSummary?.netBalanceIrr, 60000000);

    // Verify Party Transactions count (must be exactly 1 payment record, no duplicates)
    const partyTxs1 = foundationStore.getPartyTransactions(party.id);
    const paymentsCount1 = partyTxs1.filter((t) => t.recordType === 'PAYMENT').length;
    assert.strictEqual(paymentsCount1, 1, 'از ثبت تکراری پرداخت جلوگیری شده و دقیقا ۱ تراکنش ثبت شده است.');

    // Full Payment of remaining 60M IRR
    const payment2 = foundationStore.createPurchasePayment(
      {
        supplierId: party.id,
        purchaseInvoiceId: invoice.id,
        amountIrr: 60000000,
        paymentMethod: 'BANK_TRANSFER',
        sourceAccountOrBank: bank.bankNameFa,
        sourceBankAccountId: bank.id,
        trackingReference: 'TRK-FULL-102',
      },
      1
    );

    const invReloaded2 = foundationStore.getPurchaseInvoiceById(invoice.id)!;
    assert.strictEqual(invReloaded2.paidAmountIrr, 100000000);
    assert.strictEqual(invReloaded2.remainingDebtIrr, 0);
    assert.strictEqual(invReloaded2.status, 'PAID');

    const partyReloaded2 = foundationStore.getParties().find((p) => p.id === party.id)!;
    assert.strictEqual(partyReloaded2.transactionsSummary?.netBalanceIrr, 0, 'مانده بدهی شخص باید صفر کامل شده باشد.');
  });

  it('۳. پرداخت کمتر از موجودی، برابر موجودی و بیشتر از موجودی', () => {
    const cashbox = foundationStore.getCashBoxes()[0];
    cashbox.balanceIrr = 50000000; // 50M IRR

    // Less than balance (30M IRR) -> Success
    foundationStore.createTreasuryTransaction(
      {
        txType: 'PAYMENT',
        amountIrr: 30000000,
        paymentMethod: 'CASH',
        sourceCashBoxId: cashbox.id,
        notesFa: 'پرداخت کمتر از موجودی',
      },
      1
    );
    assert.strictEqual(cashbox.balanceIrr, 20000000, 'مانده صندوق باید به ۲۰ میلیون ریال کاهش یابد.');

    // Equal to balance (20M IRR) -> Success
    foundationStore.createTreasuryTransaction(
      {
        txType: 'PAYMENT',
        amountIrr: 20000000,
        paymentMethod: 'CASH',
        sourceCashBoxId: cashbox.id,
        notesFa: 'پرداخت برابر موجودی',
      },
      1
    );
    assert.strictEqual(cashbox.balanceIrr, 0, 'مانده صندوق باید صفر شود.');

    // Greater than balance (10M IRR when balance is 0) -> Fail
    assert.throws(
      () => {
        foundationStore.createTreasuryTransaction(
          {
            txType: 'PAYMENT',
            amountIrr: 10000000,
            paymentMethod: 'CASH',
            sourceCashBoxId: cashbox.id,
            notesFa: 'پرداخت بیش از موجودی',
          },
          1
        );
      },
      (err: any) => {
        return err.message.includes('کافی نیست') && err.message.includes('کسری موجودی');
      },
      'پرداخت بیشتر از موجودی باید با پیام کسری موجودی رد شود.'
    );
  });

  it('۴. پرداخت از صندوق با موجودی صفر و رد پرداخت بدون هیچ تغییر مالی', () => {
    const cashbox = foundationStore.getCashBoxes()[0];
    cashbox.balanceIrr = 0; // Exactly 0 balance

    const supplier = foundationStore.getParties().find((p) => p.primaryType === 'SUPPLIER') || foundationStore.getParties()[0];
    const initialCashBalance = cashbox.balanceIrr;
    const initialPartySummary = { ...supplier.transactionsSummary };

    assert.throws(
      () => {
        foundationStore.createPurchasePayment(
          {
            supplierId: supplier.id,
            amountIrr: 15000000,
            paymentMethod: 'CASH',
            sourceAccountOrBank: cashbox.titleFa,
            sourceCashBoxId: cashbox.id,
            trackingReference: 'FAIL-ZERO-BAL',
          },
          1
        );
      },
      (err: any) => {
        return err.message.includes('کافی نیست') && err.message.includes('کسری موجودی');
      }
    );

    // Verify absolutely no changes were applied to cash balance or party balance
    assert.strictEqual(cashbox.balanceIrr, initialCashBalance, 'موجودی صندوق نباید دستخوش تغییر شده باشد.');
    const supplierReloaded = foundationStore.getParties().find((p) => p.id === supplier.id)!;
    assert.strictEqual(
      supplierReloaded.transactionsSummary?.netBalanceIrr,
      initialPartySummary.netBalanceIrr,
      'مانده شخص نباید تغییر کرده باشد.'
    );
  });

  it('۵. جلوگیری از پرداخت‌های متوالی در صورتی که مجموع از موجودی بیشتر شود', () => {
    const bank = foundationStore.getBankAccounts()[0];
    bank.balanceIrr = 100000000; // 100M IRR

    // Payment 1: 70M IRR -> Success (30M IRR remaining)
    foundationStore.createTreasuryTransaction(
      {
        txType: 'PAYMENT',
        amountIrr: 70000000,
        paymentMethod: 'BANK_TRANSFER',
        sourceBankAccountId: bank.id,
        notesFa: 'پرداخت متوالی ۱',
      },
      1
    );
    assert.strictEqual(bank.balanceIrr, 30000000);

    // Payment 2: 50M IRR -> Fail (exceeds remaining 30M IRR)
    assert.throws(
      () => {
        foundationStore.createTreasuryTransaction(
          {
            txType: 'PAYMENT',
            amountIrr: 50000000,
            paymentMethod: 'BANK_TRANSFER',
            sourceBankAccountId: bank.id,
            notesFa: 'پرداخت متوالی ۲ - ناموفق',
          },
          1
        );
      },
      (err: any) => err.message.includes('کسری موجودی')
    );

    // Balance remains 30M IRR
    assert.strictEqual(bank.balanceIrr, 30000000, 'مانده حساب بانکی باید دست‌نخورده در ۳۰ میلیون ریال باقی بماند.');
  });
});
