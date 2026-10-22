import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۷: صنف رستوران، فست‌فود و کافی‌شاپ (Phase 7: Restaurant & Cafe Industry Module)', () => {
  it('باید صنف کاری سامانه را به «رستوران، فست‌فود و کافی‌شاپ» (RESTAURANT_CAFE) تغییر دهد', () => {
    const result = foundationStore.updateIndustryProfile('RESTAURANT_CAFE', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.profile.code, 'RESTAURANT_CAFE');
    assert.strictEqual(result.profile.badgeLabelFa, 'صنف رستوران و کافه');
    assert.strictEqual(result.profile.features.enableInstallationServices, false);
    assert.strictEqual(result.profile.features.enableBarcodeScanQuickPos, true);

    const activeProfile = foundationStore.getIndustryProfile();
    assert.strictEqual(activeProfile.code, 'RESTAURANT_CAFE');
    assert.strictEqual(activeProfile.uiLabels?.inventoryTabTitleFa, 'منو و مواد اولیه آشپزخانه');
    assert.strictEqual(activeProfile.uiLabels?.salesTabTitleFa, 'صندوق و سفارشات');
  });

  it('باید فهرست میزهای سالن رستوران را به درستی با وضعیت و ظرفیت بازگرداند', () => {
    const tables = foundationStore.getRestaurantTables();
    assert.ok(Array.isArray(tables));
    assert.ok(tables.length >= 8);

    const table1 = tables.find((t) => t.tableNumber === 'T-01');
    assert.ok(table1);
    assert.strictEqual(table1.status, 'AVAILABLE');
    assert.strictEqual(table1.capacity, 4);
  });

  it('باید سفارش جدید سالن (Dine-in) ثبت کرده و وضعیت میز را به اشغال (OCCUPIED) تغییر دهد', () => {
    const order = foundationStore.createRestaurantOrder(
      {
        orderType: 'DINE_IN',
        tableNumber: 'T-01',
        customerNameFa: 'مهندس رضایی',
        phone: '09129998877',
        lines: [
          { itemId: 101, itemTitleFa: 'چلو کباب کوبیده مخصوص زعفرانی', quantity: 2, unitPriceIrr: 2200000 },
          { itemId: 108, itemTitleFa: 'سالاد سزار سوخاری', quantity: 1, unitPriceIrr: 1400000 },
        ],
        dateJalali: '1405/01/25',
      },
      1
    );

    assert.ok(order.id);
    assert.ok(order.orderNumber.startsWith('ORD-1405-'));
    assert.strictEqual(order.orderType, 'DINE_IN');
    assert.strictEqual(order.subtotalIrr, 5800000); // 2*2,200,000 + 1,400,000
    assert.ok(order.serviceChargeIrr > 0); // 5% service charge
    assert.ok(order.totalPayableIrr > order.subtotalIrr);

    // بررسی وضعیت میز
    const tables = foundationStore.getRestaurantTables();
    const table1 = tables.find((t) => t.tableNumber === 'T-01');
    assert.ok(table1);
    assert.strictEqual(table1.status, 'OCCUPIED');
  });

  it('باید بن حرارتی سفارش آشپزخانه را با اقلام و مشخصات میز به درستی تولید کند', () => {
    const orders = foundationStore.getRestaurantOrders();
    assert.ok(orders.length > 0);
    const lastOrder = orders[orders.length - 1];

    const ticket = foundationStore.generateKitchenTicket(lastOrder.id);
    assert.strictEqual(ticket.orderNumber, lastOrder.orderNumber);
    assert.strictEqual(ticket.tableNumber, lastOrder.tableNumber);
    assert.strictEqual(ticket.orderTypeFa, 'سالن');
    assert.strictEqual(ticket.items.length, lastOrder.lines.length);
  });

  it('باید تغییر وضعیت میز (آزاد کردن میز پس از تسویه) را انجام دهد', () => {
    const updatedTable = foundationStore.updateRestaurantTableStatus(1, 'AVAILABLE', 1);
    assert.strictEqual(updatedTable.status, 'AVAILABLE');
    assert.strictEqual(updatedTable.currentOrderId, null);
  });
});
