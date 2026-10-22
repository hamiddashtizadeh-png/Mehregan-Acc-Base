import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۱۱: انبارداری چندگانه، انتقال بین انبارها و حسابداری شعبه‌ای (Phase 11: Enterprise Multi-Branch & Multi-Warehouse Consolidation)', () => {
  it('باید لیست انبارهای فعال (مرکزی، شعب و سردخانه‌ها) را به درستی بازگرداند', () => {
    const warehouses = foundationStore.getWarehouses();
    assert.ok(warehouses.length >= 1, 'حداقل ۱ انبار اصلی در سیستم باید تعریف شده باشد.');
  });

  it('باید انتقال کالا بین انبارهای شعب (Inter-Warehouse Transfer) را با ثبت حواله خروج و رسید ورود انجام دهد', () => {
    const warehouses = foundationStore.getWarehouses();
    const sourceWarehouse = warehouses[0];

    // Create secondary branch warehouse if not exists
    const targetWarehouse = foundationStore.createWarehouse(
      {
        code: 'WH-SHIRAZ-02',
        titleFa: 'انبار شعبه شیراز و جنوب کشور',
        locationAddressFa: 'شیراز، منطقه صنعتی بزرگ',
        managerNameFa: 'مهندس حسینی',
      },
      1
    );

    assert.ok(targetWarehouse.id > 0);
    assert.strictEqual(targetWarehouse.warehouseCode, 'WH-SHIRAZ-02');

    // Create inter-warehouse transfer
    const items = foundationStore.getItems();
    assert.ok(items.length > 0);
    const item = items[0];

    const transfer = foundationStore.createInventoryTransferRequisition(
      {
        sourceWarehouseId: sourceWarehouse.id,
        targetWarehouseId: targetWarehouse.id,
        dateJalali: '1405/01/27',
        driverNameFa: 'حمیدرضا رضایی',
        vehiclePlateFa: '۶۸ ب ۴۵۶ ایران ۷۷',
        notesFa: 'حواله انتقال کالا از انبار مرکزی به انبار شعبه شیراز',
        lines: [
          {
            itemId: item.id,
            quantity: 5,
          },
        ],
      },
      1
    );

    assert.ok(transfer.id > 0);
    assert.ok(transfer.transferNumber.startsWith('TRN-1405-'));
    assert.strictEqual(transfer.sourceWarehouseId, sourceWarehouse.id);
    assert.strictEqual(transfer.targetWarehouseId, targetWarehouse.id);
  });

  it('باید مراکز هزینه شعب را ایجاد کرده و بودجه تخصیصی هر مرکز را کنترل نماید', () => {
    const cc = foundationStore.createCostCenter(
      {
        code: 'CC-BRANCH-TEH',
        titleFa: 'مرکز هزینه شعبه شمال تهران',
        managerNameFa: 'مهندس علوی',
        budgetIrr: 5000000000, // ۵ میلیارد ریال
        descriptionFa: 'مرکز هزینه عملیاتی و پشتیبانی شعبه شمال',
      },
      1
    );

    assert.ok(cc.id > 0);
    assert.strictEqual(cc.code, 'CC-BRANCH-TEH');
    assert.strictEqual(cc.budgetIrr, 5000000000);

    const retrieved = foundationStore.getCostCenterById(cc.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.titleFa, 'مرکز هزینه شعبه شمال تهران');
  });
});
