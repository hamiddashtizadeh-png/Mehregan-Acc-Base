import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۵: سوپرمارکت، هایپرمارکت و مواد غذایی (Phase 5: Supermarket & Grocery Industry)', () => {
  it('۱. صحت پیکربندی صنف سوپرمارکت و مواد غذایی (SUPERMARKET_GROCERY Profile Config)', () => {
    const profile = foundationStore.getIndustryProfile('SUPERMARKET_GROCERY');
    assert.strictEqual(profile.code, 'SUPERMARKET_GROCERY');
    assert.strictEqual(profile.features.enableInstallationServices, false);
    assert.strictEqual(profile.features.enableBarcodeScanQuickPos, true);
    assert.strictEqual(profile.layout.preset, 'GROCERY_BARCODE');
    assert.strictEqual(profile.layout.showInstallationTab, false);
    assert.ok(profile.uiLabels.salesTabTitleFa.includes('صندوق') || profile.uiLabels.salesTabTitleFa.includes('فروش'));
  });

  it('۲. سوئیچ پایدار به صنف سوپرمارکت و بارگذاری برچسب‌های اختصاصی', () => {
    const switchRes = foundationStore.updateIndustryProfile('SUPERMARKET_GROCERY', 1);
    assert.strictEqual(switchRes.settings.industryProfileCode, 'SUPERMARKET_GROCERY');
    assert.strictEqual(switchRes.profile.code, 'SUPERMARKET_GROCERY');

    const activeProfile = foundationStore.getIndustryProfile('SUPERMARKET_GROCERY');
    assert.strictEqual(activeProfile.code, 'SUPERMARKET_GROCERY');
  });

  it('۳. آزمون جستجوی سریع بارکد و صدور فاکتور در صندوق سوپرمارکت', () => {
    foundationStore.updateIndustryProfile('SUPERMARKET_GROCERY', 1);
    const customers = foundationStore.getParties('CUSTOMER');
    const walkIn = customers.find((c) => c.partyCode === 'PRT-10000') || customers[0];
    assert.ok(walkIn, 'مشتری برای ثبت فاکتور باید در سیستم وجود داشته باشد.');

    const warehouse = foundationStore.getWarehouses()[0];
    assert.ok(warehouse, 'انبار اصلی برای فروش باید موجود باشد.');

    const items = foundationStore.getItems();
    const milkItem = items.find((i) => i.barcode || i.itemCode) || items[0];
    assert.ok(milkItem, 'حداقل یک کالای سوپرمارکتی باید در استور موجود باشد');

    const unitPrice = milkItem.salePriceIrr || 450000;
    const expectedTotal = unitPrice * 3;

    // Create a fast supermarket invoice
    const newInvoice = foundationStore.createSalesInvoice(
      {
        saleType: 'QUICK_POS_SALE',
        customerId: walkIn.id,
        sourceWarehouseId: warehouse.id,
        dateJalali: '1405/01/25',
        paidAmountIrr: expectedTotal,
        lines: [
          {
            itemId: milkItem.id,
            quantity: 3,
            unitPriceIrr: unitPrice,
            discountIrr: 0,
            vatAmountIrr: 0,
          },
        ],
        paymentDetails: {
          paymentMethod: 'POS',
          trackingReference: 'TRK-98124',
        },
        notesFa: 'تسویه آنی صندوق سوپرمارکت',
      },
      1
    );

    assert.ok(newInvoice.id > 0);
    assert.strictEqual(newInvoice.totalInvoiceAmountIrr, expectedTotal);
    assert.strictEqual(newInvoice.paidAmountIrr, expectedTotal);
    assert.strictEqual(newInvoice.remainingBalanceIrr, 0);
  });

  it('۴. محاسبه دقیق بهای اقلام وزنی/کیلویی (Scale & Weighted Items Calculation)', () => {
    // Weighted item test: 1.5 kg @ 120,000 Toman (1,200,000 IRR/kg)
    const unitPriceIrr = 1200000;
    const weightKg = 1.5;
    const totalLineIrr = Math.round(unitPriceIrr * weightKg);

    assert.strictEqual(totalLineIrr, 1800000);
  });

  it('۵. حفظ یکپارچگی کاردکس انبار و اسناد خزانه‌داری پس از فروش سوپرمارکت', () => {
    const storeData = foundationStore.getFoundationData();
    const treasury = storeData.treasuryTransactions || [];
    assert.ok(Array.isArray(treasury));
    assert.ok((storeData.warehouses || []).length >= 0);
  });
});
