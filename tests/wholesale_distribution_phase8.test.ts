import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۸: صنف پخش عمده، بازرگانی و بنکداری (Phase 8: Wholesale & Distribution Industry Module)', () => {
  it('باید صنف کاری سامانه را به «پخش عمده، بازرگانی و بنکداری» (WHOLESALE_DISTRIBUTION) تغییر دهد', () => {
    const result = foundationStore.updateIndustryProfile('WHOLESALE_DISTRIBUTION', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.profile.code, 'WHOLESALE_DISTRIBUTION');
    assert.strictEqual(result.profile.badgeLabelFa, 'صنف پخش عمده و بنکداری');
    assert.strictEqual(result.profile.theme.id, 'wholesale');
    assert.strictEqual(result.profile.layout.preset, 'WHOLESALE_TIERS_MATRIX');

    const activeProfile = foundationStore.getIndustryProfile();
    assert.strictEqual(activeProfile.code, 'WHOLESALE_DISTRIBUTION');
    assert.strictEqual(activeProfile.uiLabels?.salesTabTitleFa, 'فروش عمده و سفارشات');
    assert.strictEqual(activeProfile.uiLabels?.inventoryTabTitleFa, 'موجودی انبار و کارتن‌ها');
  });

  it('باید سطوح چندگانه قیمت‌گذاری (مصرف‌کننده، همکار، بنکداری، VIP) و ضریب کارتن را به درستی محاسبه کند', () => {
    const tiers = foundationStore.getItemPriceTiers(1);
    assert.ok(tiers);
    assert.strictEqual(tiers.itemId, 1);
    assert.strictEqual(tiers.packUnitFa, 'کارتن');
    assert.ok(tiers.unitsPerPack > 0);

    // بررسی سلسله‌مراتب قیمتی: VIP < بنکداری < همکار < مصرف‌کننده
    assert.ok(tiers.priceTiers.DISTRIBUTOR_VIP <= tiers.priceTiers.WHOLESALE_BULK);
    assert.ok(tiers.priceTiers.WHOLESALE_BULK <= tiers.priceTiers.RETAIL_COLLEAGUE);
    assert.ok(tiers.priceTiers.RETAIL_COLLEAGUE <= tiers.priceTiers.CONSUMER);
  });

  it('باید سقف اعتبار خریدار عمده و وضعیت مانده بدهی را به درستی پایش کند', () => {
    const creditCheck = foundationStore.checkCustomerWholesaleCredit(1, 50000000);
    assert.ok(creditCheck);
    assert.strictEqual(creditCheck.customerId, 1);
    assert.ok(creditCheck.creditLimitIrr > 0);
    assert.strictEqual(typeof creditCheck.isExceeded, 'boolean');
    assert.strictEqual(typeof creditCheck.projectedDebtIrr, 'number');
  });

  it('باید سفارش عمده را بر مبنای کارتن و جزء و نرخ بنکداری با کسر دقیق موجودی انبار ثبت نماید', () => {
    const initialStock = 120;
    const dbItem = (foundationStore as any).dbState.items.find((i: any) => i.id === 1);
    if (dbItem) dbItem.inventoryOnHand = initialStock;

    const order = foundationStore.createWholesaleOrder(
      {
        customerId: 1,
        visitorNameFa: 'مهندس رضایی (مدیر فروش بنکداری)',
        paymentTermsFa: 'CHEQUE_30_DAYS',
        lines: [
          {
            itemId: 1,
            packCount: 2, // ۲ کارتن
            looseUnitsCount: 4, // ۴ عدد تک
            priceTier: 'WHOLESALE_BULK',
            discountPercent: 5,
          },
        ],
        shippingFeeIrr: 1500000,
        dateJalali: '1405/01/25',
      },
      1
    );

    assert.ok(order.id);
    assert.ok(order.orderNumber.startsWith('WHO-1405-'));
    assert.strictEqual(order.totalCartons, 2);
    assert.strictEqual(order.totalLooseUnits, 4);
    assert.strictEqual(order.lines[0].totalUnits, 2 * order.lines[0].unitsPerPack + 4);
    assert.ok(order.totalPayableIrr > 0);
    assert.strictEqual(order.dispatchStatus, 'PENDING_PACKING');

    // بررسی کسر موجودی انبار بر حسب کل قطعات
    const itemAfter = foundationStore.getItems().find((i) => i.id === 1);
    assert.strictEqual(itemAfter?.inventoryOnHand, initialStock - order.lines[0].totalUnits);
  });

  it('باید حواله خروج انبار و بارگیری ناوگان توزیع را صادر و وضعیت سفارش را همگام نماید', () => {
    const orders = foundationStore.getWholesaleOrders();
    const lastOrder = orders[orders.length - 1];
    assert.ok(lastOrder);

    const dispatch = foundationStore.createWholesaleDispatch(
      {
        orderId: lastOrder.id,
        driverNameFa: 'حسین احمدی',
        driverPhone: '09121113344',
        vehiclePlateFa: '۵۵ ب ۷۷۷ ایران ۱۱',
        vehicleTypeFa: 'کامیونت ایسوزو ۵ تن',
        destinationCityFa: 'کرج',
        destinationAddressFa: 'بلوار شهید بهشتی، جنب بازار بزرگ، پخش مرکزی البرز',
        shippingCostIrr: 1500000,
        notesFa: 'بارگیری پالت‌ها با لیفتراک انجام شود',
      },
      1
    );

    assert.ok(dispatch.id);
    assert.ok(dispatch.dispatchNumber.startsWith('DSP-1405-'));
    assert.strictEqual(dispatch.orderId, lastOrder.id);
    assert.strictEqual(dispatch.status, 'PREPARING');

    // بررسی تغییر وضعیت سفارش عطف به بسته بندی شده
    const updatedOrder = foundationStore.getWholesaleOrders().find((o) => o.id === lastOrder.id);
    assert.strictEqual(updatedOrder?.dispatchStatus, 'PACKED');

    // تست تغییر وضعیت حواله به تحویل داده شده
    const deliveredDispatch = foundationStore.updateWholesaleDispatchStatus(dispatch.id, 'DELIVERED', 1);
    assert.strictEqual(deliveredDispatch.status, 'DELIVERED');

    const deliveredOrder = foundationStore.getWholesaleOrders().find((o) => o.id === lastOrder.id);
    assert.strictEqual(deliveredOrder?.dispatchStatus, 'DELIVERED');
  });
});
