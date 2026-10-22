import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';
import { resolveIndustryUiLabels } from '../src/types/foundation';

describe('فاز ۴: خرده‌فروشی عمومی و فروش سریع (Phase 4: General Retail & Fast POS)', () => {
  it('۱. صحت پیکربندی صنف خرده‌فروشی عمومی (RETAIL_GENERAL Profile Config)', () => {
    const profiles = foundationStore.getAllIndustryProfiles();
    const retail = profiles.find((p) => p.code === 'RETAIL_GENERAL');

    assert(retail !== undefined, 'صنف RETAIL_GENERAL باید در سیستم تعریف شده باشد.');
    assert.strictEqual(retail.code, 'RETAIL_GENERAL');
    assert.ok(retail.titleFa.includes('خرده‌فروشی') || retail.titleFa.includes('فروشگاه'));
    
    // بررسی برچسب‌های متمرکز
    const labels = resolveIndustryUiLabels(retail);
    assert.ok(labels.salesTabTitleFa && labels.salesTabTitleFa.length > 2);
    assert.ok(labels.quickPosButtonLabelFa && labels.quickPosButtonLabelFa.length > 2);
  });

  it('۲. بارکد خوانی، جستجو و تطابق دقیق بارکد تک در فروش سریع (POS Barcode & Item Lookup)', () => {
    const items = foundationStore.getItems();
    assert(items.length >= 1, 'حداقل یک کالا در پایگاه داده باید وجود داشته باشد.');

    // انتخاب کالایی که بارکد معتبر دارد
    const itemWithBarcode = items.find((i) => i.barcode && i.barcode.trim().length > 0);
    assert(itemWithBarcode !== undefined, 'باید کالایی با بارکد جهت آزمون اسکن موجود باشد.');

    const barcodeQuery = itemWithBarcode.barcode!.trim();
    const exactMatches = items.filter(
      (i) => i.barcode && i.barcode.trim().toLowerCase() === barcodeQuery.toLowerCase()
    );

    assert.strictEqual(
      exactMatches.length,
      1,
      `بارکد [${barcodeQuery}] باید منحصربه‌فرد بوده و دقیقاً یک کالا بازگرداند.`
    );
    assert.strictEqual(exactMatches[0].id, itemWithBarcode.id);
  });

  it('۳. صدور فاکتور فروش سریع با تسویه نقدی/پوز و عدم ثبت مانده بدهکاری ناخواسته', () => {
    const customers = foundationStore.getParties('CUSTOMER');
    const walkIn = customers.find((c) => c.partyCode === 'PRT-10000') || customers[0];
    const warehouse = foundationStore.getWarehouses()[0];
    const item = foundationStore.getItems()[0];

    assert(walkIn && warehouse && item, 'مشتری، انبار و کالا برای ثبت فاکتور باید آماده باشند.');

    const unitPriceIrr = item.salePriceIrr || 1000000;
    const qty = 2;
    const discountIrr = 50000;
    const vatIrr = Math.round((unitPriceIrr - discountIrr) * qty * 0.1);
    const totalPayable = (unitPriceIrr - discountIrr) * qty + vatIrr;

    // مشتری تمام مبلغ را دقیقاً پرداخت می‌کند (تسویه کامل)
    const invoice = foundationStore.createSalesInvoice(
      {
        saleType: 'QUICK_POS_SALE',
        customerId: walkIn.id,
        sourceWarehouseId: warehouse.id,
        lines: [
          {
            itemId: item.id,
            quantity: qty,
            unitPriceIrr,
            discountIrr,
            vatAmountIrr: vatIrr,
          },
        ],
        paidAmountIrr: totalPayable,
        paymentDetails: {
          paymentMethod: 'POS',
          posTerminalOrBank: 'کارتخوان صندوق ۳',
          trackingReference: 'RETAIL-POS-8821',
        },
        notesFa: 'فروش سریع صندوق خرده‌فروشی',
      },
      1
    );

    assert.strictEqual(invoice.saleType, 'QUICK_POS_SALE');
    assert.strictEqual(invoice.paidAmountIrr, totalPayable);
    assert.strictEqual(invoice.remainingBalanceIrr, 0, 'فاکتور تسویه‌شده نباید مانده بدهی داشته باشد.');
    assert.strictEqual(invoice.status, 'PAID');
    assert.ok(invoice.inventoryDocNumber, 'حواله خروج انبار باید صادر شده باشد.');
  });

  it('۴. محاسبه درست بدهکاری دفتری در فروش نسیه یا پرداخت جزئی (Partial/Credit POS)', () => {
    const customers = foundationStore.getParties('CUSTOMER');
    const customer = customers[0];
    const warehouse = foundationStore.getWarehouses()[0];
    const item = foundationStore.getItems()[0];

    const totalPayable = 2000000;
    const paidAmount = 500000; // پرداخت بخشی از مبلغ
    const expectedRemaining = 1500000;

    const invoice = foundationStore.createSalesInvoice(
      {
        saleType: 'QUICK_POS_SALE',
        customerId: customer.id,
        sourceWarehouseId: warehouse.id,
        lines: [
          {
            itemId: item.id,
            quantity: 1,
            unitPriceIrr: totalPayable,
            discountIrr: 0,
            vatAmountIrr: 0,
          },
        ],
        paidAmountIrr: paidAmount,
        paymentDetails: {
          paymentMethod: 'CASH',
          posTerminalOrBank: 'صندوق نقدی',
          trackingReference: 'CASH-PARTIAL-101',
        },
        notesFa: 'فروش نقدی با مانده دفتری',
      },
      1
    );

    assert.strictEqual(invoice.paidAmountIrr, paidAmount);
    assert.strictEqual(invoice.remainingBalanceIrr, expectedRemaining);
    assert.strictEqual(invoice.status, 'PARTIALLY_PAID');
  });

  it('۵. ثبات کارکرد حسابداری، اسناد خروج انبار و گزارش‌های مالی پس از اجرای فاز ۴', () => {
    const invoices = foundationStore.getSalesInvoices();
    assert(invoices.length >= 2, 'فاکتورهای صادرشده باید در حافظه و سیستم ثبت شده باشند.');

    for (const inv of invoices) {
      assert.ok(inv.invoiceNumber);
      assert.ok(inv.totalInvoiceAmountIrr >= 0);
      assert.ok(inv.paidAmountIrr >= 0);
      assert.strictEqual(inv.remainingBalanceIrr, inv.totalInvoiceAmountIrr - inv.paidAmountIrr);
    }
  });
});
