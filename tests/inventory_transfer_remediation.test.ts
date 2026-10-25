import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('آزمون‌های اعتبارسنجی اصلاح نقایص ترانزیت کالا بین انبارها (Inventory Transfer Remediation)', () => {
  it('۱. عدم صدور حواله ترانزیت و پرتاب خطای صریح در صورت کسری موجودی انبار مبدأ', () => {
    const warehouses = foundationStore.getWarehouses();
    const sourceWarehouse = warehouses[0];
    const targetWarehouse = warehouses[1] || warehouses[0];

    const item = foundationStore.getItems()[0];
    const initialStockWh1 = foundationStore.getItemStockInWarehouse(item.id, sourceWarehouse.id);

    const initialTransfersCount = foundationStore.getInventoryTransfers().length;
    const initialDocsCount = foundationStore.getInventoryDocuments().length;

    // Attempt transfer with quantity exceeding available stock (e.g. stock + 1000)
    const excessQuantity = initialStockWh1 + 1000;

    assert.throws(() => {
      foundationStore.createInventoryTransferRequisition(
        {
          sourceWarehouseId: sourceWarehouse.id,
          targetWarehouseId: targetWarehouse.id === sourceWarehouse.id ? 2 : targetWarehouse.id,
          dateJalali: '1405/01/28',
          driverNameFa: 'راننده آزمایشی کسری موجودی',
          lines: [
            {
              itemId: item.id,
              quantity: excessQuantity,
            },
          ],
        },
        1
      );
    }, /کافی نیست|موجودی/);

    // Verify atomic invariant: NO transfer record and NO inventory document created
    assert.strictEqual(
      foundationStore.getInventoryTransfers().length,
      initialTransfersCount,
      'در صورت کسری موجودی، هیچ حواله ترانزیتی نباید در سیستم ایجاد شود.'
    );
    assert.strictEqual(
      foundationStore.getInventoryDocuments().length,
      initialDocsCount,
      'در صورت کسری موجودی، هیچ سند انباری نباید صادر شود.'
    );
    assert.strictEqual(
      foundationStore.getItemStockInWarehouse(item.id, sourceWarehouse.id),
      initialStockWh1,
      'موجودی انبار مبدأ نباید دچار تغییر شده باشد.'
    );
  });

  it('۲. ممانعت از ایجاد حواله با انبار مبدأ و مقصد یکسان یا شناسه انبار نامعتبر', () => {
    const item = foundationStore.getItems()[0];

    // Same source and target
    assert.throws(() => {
      foundationStore.createInventoryTransferRequisition(
        {
          sourceWarehouseId: 1,
          targetWarehouseId: 1,
          lines: [{ itemId: item.id, quantity: 1 }],
        },
        1
      );
    }, /یکسان/);

    // Non-existent warehouse
    assert.throws(() => {
      foundationStore.createInventoryTransferRequisition(
        {
          sourceWarehouseId: 99999,
          targetWarehouseId: 1,
          lines: [{ itemId: item.id, quantity: 1 }],
        },
        1
      );
    }, /انبار مبدأ/);
  });

  it('۳. صدور موفق حواله ترانزیت، ثبت سند خروج، کسر موجودی و وضعیت DISPATCHED سریال‌ها بدون جابجایی پیش‌رس به مقصد', () => {
    const items = foundationStore.getItems();
    const item = items.find((i) => i.isSerialized) || items[0];
    const srcWhId = 1;
    const tgtWhId = 2;

    // Ensure at least 5 units and serials are available in source warehouse
    if (foundationStore.getItemStockInWarehouse(item.id, srcWhId) < 2) {
      const seedSn1 = `SN-SEED-TRF-${Date.now()}-1`;
      const seedSn2 = `SN-SEED-TRF-${Date.now()}-2`;
      foundationStore.createInventoryDocument(
        {
          docType: 'INBOUND_PURCHASE',
          targetWarehouseId: srcWhId,
          dateJalali: '1405/01/25',
          lines: [
            {
              itemId: item.id,
              quantity: 2,
              unitCostIrr: item.purchasePriceIrr || 1000000,
              serialNumbers: item.isSerialized ? [seedSn1, seedSn2] : undefined,
            },
          ],
        },
        1
      );
    }

    const stockWh1Before = foundationStore.getItemStockInWarehouse(item.id, srcWhId);
    assert.ok(stockWh1Before >= 1, 'حداقل ۱ عدد کالا در انبار مبدأ باید موجود باشد.');

    const transfer = foundationStore.createInventoryTransferRequisition(
      {
        sourceWarehouseId: srcWhId,
        targetWarehouseId: tgtWhId,
        dateJalali: '1405/01/28',
        driverNameFa: 'اصغر کریمی',
        vehiclePlateFa: '۱۸ ج ۷۸۹ ایران ۳۳',
        notesFa: 'تست موفق صدور حواله ترانزیت',
        lines: [
          {
            itemId: item.id,
            quantity: 1,
          },
        ],
      },
      1
    );

    assert.ok(transfer.id > 0);
    assert.strictEqual(transfer.status, 'IN_TRANSIT');
    assert.ok(transfer.outgoingInventoryDocId, 'حواله باید دارای شناسه سند خروج باشد.');
    assert.strictEqual(transfer.incomingInventoryDocId, null, 'پیش از تحویل، شناسه سند ورود باید null باشد.');

    // Outgoing document must exist and be confirmed
    const docs = foundationStore.getInventoryDocuments();
    const outDoc = docs.find((d) => d.id === transfer.outgoingInventoryDocId);
    assert.ok(outDoc);
    assert.strictEqual(outDoc.status, 'CONFIRMED');
    assert.strictEqual(outDoc.docType, 'TRANSFER');

    // Stock in WH1 must be deducted by 1
    const stockWh1After = foundationStore.getItemStockInWarehouse(item.id, srcWhId);
    assert.strictEqual(stockWh1After, stockWh1Before - 1, 'موجودی انبار مبدأ باید ۱ واحد کسر شده باشد.');

    // Verify serials lifecycle: serials must be marked DISPATCHED and NOT yet in destination warehouse
    if (outDoc.lines[0]?.serialNumbers?.length) {
      const sn = outDoc.lines[0].serialNumbers[0];
      const serialRecord = (foundationStore as any).dbState.itemSerials.find(
        (s: any) => s.serialNumber.toUpperCase() === sn.toUpperCase()
      );
      assert.ok(serialRecord);
      assert.strictEqual(
        serialRecord.status,
        'DISPATCHED',
        'سریال کالا حین ترانزیت باید در وضعیت DISPATCHED قرار گیرد.'
      );
      assert.notStrictEqual(
        serialRecord.currentWarehouseId,
        tgtWhId,
        'سریال کالا پیش از تحویل فیزیکی در مقصد نباید به انبار مقصد منتقل شده باشد.'
      );
    }
  });

  it('۴. تأیید تحویل قطعی در مقصد (receive)، انتقال قطعی سریال‌ها به انبار مقصد و تغییر وضعیت به COMPLETED', () => {
    const transfers = foundationStore.getInventoryTransfers();
    const inTransitTransfer = transfers.find((t) => t.status === 'IN_TRANSIT');
    assert.ok(inTransitTransfer, 'حداقل یک حواله در وضعیت ترانزیت باید وجود داشته باشد.');

    const docs = foundationStore.getInventoryDocuments();
    const outDoc = docs.find((d) => d.id === inTransitTransfer.outgoingInventoryDocId);
    assert.ok(outDoc);

    const completed = foundationStore.receiveInventoryTransferRequisition(inTransitTransfer.id, 1);
    assert.strictEqual(completed.status, 'COMPLETED');
    assert.ok(completed.receivedAt, 'زمان تحویل باید ثبت شده باشد.');
    assert.strictEqual(completed.receivedByUserId, 1);
    assert.ok(completed.incomingInventoryDocId, 'سند ورودی/تأیید تحویل باید پیوند خورده باشد.');
    assert.strictEqual(completed.incomingInventoryDocId, inTransitTransfer.outgoingInventoryDocId);

    // Verify serials are now in target warehouse with IN_STOCK status
    if (outDoc.lines[0]?.serialNumbers?.length) {
      const sn = outDoc.lines[0].serialNumbers[0];
      const serialRecord = (foundationStore as any).dbState.itemSerials.find(
        (s: any) => s.serialNumber.toUpperCase() === sn.toUpperCase()
      );
      assert.ok(serialRecord);
      assert.strictEqual(
        serialRecord.status,
        'IN_STOCK',
        'پس از تحویل در مقصد، سریال کالا باید به وضعیت IN_STOCK تغییر یابد.'
      );
      assert.strictEqual(
        serialRecord.currentWarehouseId,
        completed.targetWarehouseId,
        'پس از تحویل در مقصد، سریال باید به انبار مقصد منتقل شود.'
      );
    }
  });

  it('۵. تکرارپذیری امن (Idempotency) در تأیید مکرر تحویل بدون تغییر مجدد موجودی یا ایجاد سند تکراری', () => {
    const transfers = foundationStore.getInventoryTransfers();
    const completedTransfer = transfers.find((t) => t.status === 'COMPLETED');
    assert.ok(completedTransfer);

    const docsCountBefore = foundationStore.getInventoryDocuments().length;
    const item = completedTransfer.lines[0];
    const wh1StockBefore = foundationStore.getItemStockInWarehouse(item.itemId, completedTransfer.sourceWarehouseId);
    const wh2StockBefore = foundationStore.getItemStockInWarehouse(item.itemId, completedTransfer.targetWarehouseId);

    // Call receive a second time
    const secondCall = foundationStore.receiveInventoryTransferRequisition(completedTransfer.id, 1);
    assert.strictEqual(secondCall.status, 'COMPLETED');
    assert.strictEqual(secondCall.id, completedTransfer.id);

    // Invariant checks
    assert.strictEqual(
      foundationStore.getInventoryDocuments().length,
      docsCountBefore,
      'تأیید مجدد نباید هیچ سند انبار جدیدی تولید کند.'
    );
    assert.strictEqual(
      foundationStore.getItemStockInWarehouse(item.itemId, completedTransfer.sourceWarehouseId),
      wh1StockBefore,
      'موجودی انبار مبدأ نباید با تأیید مکرر کسر مضاعف شود.'
    );
    assert.strictEqual(
      foundationStore.getItemStockInWarehouse(item.itemId, completedTransfer.targetWarehouseId),
      wh2StockBefore,
      'موجودی انبار مقصد نباید با تأیید مکرر افزایش مضاعف یابد.'
    );
  });

  it('۶. ممانعت از تحویل حواله مخدوش فاقد سند خروج معتبر', () => {
    // Non-existent transfer
    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(999999, 1);
    }, /یافت نشد/);

    // Corrupted record with missing outgoing doc
    const fakeTransferId = 998877;
    (foundationStore as any).dbState.inventoryTransfers.push({
      id: fakeTransferId,
      transferNumber: 'TRN-FAKE-998877',
      sourceWarehouseId: 1,
      targetWarehouseId: 2,
      dateJalali: '1405/01/28',
      status: 'IN_TRANSIT',
      lines: [{ itemId: 1, quantity: 10 }],
      outgoingInventoryDocId: null, // missing outgoing document!
      actorUserId: 1,
      createdAt: new Date().toISOString(),
    });

    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(fakeTransferId, 1);
    }, /فاقد سند معتبر خروج/);

    // Clean up test fake
    const idx = (foundationStore as any).dbState.inventoryTransfers.findIndex((t: any) => t.id === fakeTransferId);
    if (idx !== -1) {
      (foundationStore as any).dbState.inventoryTransfers.splice(idx, 1);
    }
  });

  it('۷. تزریق عمدی خطا پس از صدور سند خروج و اثبات رول‌بک اتمیک کلیه حالات در حافظه (اسناد، ترانزیت، سریال‌ها و لاگ‌ها)', () => {
    const items = foundationStore.getItems();
    const item = items.find((i) => i.isSerialized) || items[0];
    const srcWhId = 1;
    const tgtWhId = 2;

    // Ensure warehouse 1 has an active IN_STOCK serial for item
    let targetSerial = (foundationStore as any).dbState.itemSerials.find(
      (s: any) => s.itemId === item.id && s.currentWarehouseId === srcWhId && s.status === 'IN_STOCK'
    );
    if (!targetSerial) {
      const testSn = `SN-INJECT-TEST-${Date.now()}`;
      foundationStore.createInventoryDocument(
        {
          docType: 'INBOUND_PURCHASE',
          targetWarehouseId: srcWhId,
          dateJalali: '1405/01/25',
          lines: [
            {
              itemId: item.id,
              quantity: 1,
              unitCostIrr: item.purchasePriceIrr || 1000000,
              serialNumbers: [testSn],
            },
          ],
        },
        1
      );
      targetSerial = (foundationStore as any).dbState.itemSerials.find(
        (s: any) => s.serialNumber === testSn
      );
    }
    assert.ok(targetSerial, 'حداقل یک سریال فعال در انبار مبدأ برای تست تزریق خطا الزامی است.');

    const preDocs = [...foundationStore.getInventoryDocuments()];
    const preTransfers = [...foundationStore.getInventoryTransfers()];
    const preAuditLogs = [...((foundationStore as any).dbState.auditLogs || [])];
    const preStockSrc = foundationStore.getItemStockInWarehouse(item.id, srcWhId);
    const preStockTgt = foundationStore.getItemStockInWarehouse(item.id, tgtWhId);
    const origSerialWarehouse = targetSerial.currentWarehouseId;
    const origSerialStatus = targetSerial.status;
    const origSerialLastDoc = targetSerial.lastDocNumber;

    // Inject failure into inventoryTransfers.push to trigger catch block after outDoc has been created
    const originalPush = (foundationStore as any).dbState.inventoryTransfers.push;
    (foundationStore as any).dbState.inventoryTransfers.push = () => {
      throw new Error('SIMULATED_TRANSFER_PERSISTENCE_CRASH');
    };

    try {
      assert.throws(() => {
        foundationStore.createInventoryTransferRequisition(
          {
            sourceWarehouseId: srcWhId,
            targetWarehouseId: tgtWhId,
            dateJalali: '1405/01/29',
            lines: [
              {
                itemId: item.id,
                quantity: 1,
                serialNumbers: [targetSerial.serialNumber],
              },
            ],
          },
          1
        );
      }, /SIMULATED_TRANSFER_PERSISTENCE_CRASH/);
    } finally {
      // Restore method immediately
      (foundationStore as any).dbState.inventoryTransfers.push = originalPush;
    }

    // Verify complete in-memory atomic rollback:
    // 1. Documents restored
    const postDocs = foundationStore.getInventoryDocuments();
    assert.strictEqual(postDocs.length, preDocs.length, 'سند خروج ایجادشده حین خطا باید کاملاً رول‌بک شود.');

    // 2. Transfers restored
    const postTransfers = foundationStore.getInventoryTransfers();
    assert.strictEqual(postTransfers.length, preTransfers.length, 'هیچ حواله ترانزیتی نباید ثبت شده باشد.');

    // 3. Serial states restored
    const postSerial = (foundationStore as any).dbState.itemSerials.find(
      (s: any) => s.serialNumber === targetSerial.serialNumber
    );
    assert.strictEqual(
      postSerial.currentWarehouseId,
      origSerialWarehouse,
      'انبار سریال باید به انبار اولیه بازگردد.'
    );
    assert.strictEqual(
      postSerial.status,
      origSerialStatus,
      'وضعیت سریال باید به وضعیت اولیه IN_STOCK بازگردد.'
    );
    assert.strictEqual(
      postSerial.lastDocNumber,
      origSerialLastDoc,
      'lastDocNumber سریال باید به مقدار اولیه بازگردد.'
    );

    // 4. Audit logs restored
    const postAuditLogs = (foundationStore as any).dbState.auditLogs || [];
    assert.strictEqual(
      postAuditLogs.length,
      preAuditLogs.length,
      'لاگ حسابرسی سند انبار نباید در لاگ‌ها باقی بماند.'
    );

    // 5. Stock balances restored
    assert.strictEqual(foundationStore.getItemStockInWarehouse(item.id, srcWhId), preStockSrc);
    assert.strictEqual(foundationStore.getItemStockInWarehouse(item.id, tgtWhId), preStockTgt);
  });

  it('۸. ممانعت قطعی از تحویل حواله در صورت مغایرت وضعیت، نوع سند، انبار مبدأ یا انبار مقصد سند با حواله', () => {
    const fakeTransferId = 887766;
    const testTransfer: any = {
      id: fakeTransferId,
      transferNumber: 'TRN-TEST-MISMATCH',
      sourceWarehouseId: 1,
      targetWarehouseId: 2,
      dateJalali: '1405/01/29',
      status: 'IN_TRANSIT',
      lines: [{ itemId: 1, quantity: 1 }],
      outgoingInventoryDocId: 999911,
      actorUserId: 1,
      createdAt: new Date().toISOString(),
    };
    (foundationStore as any).dbState.inventoryTransfers.push(testTransfer);

    // Case A: outgoing document does not exist
    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(fakeTransferId, 1);
    }, /سند خروج انبار مبدأ مربوط به این حواله ترانزیت یافت نشد/);

    // Case B: doc exists but status is DRAFT (not CONFIRMED)
    const fakeDoc: any = {
      id: 999911,
      docNumber: 'WH-DOC-FAKE',
      docType: 'TRANSFER',
      sourceWarehouseId: 1,
      targetWarehouseId: 2,
      status: 'DRAFT',
      lines: [{ itemId: 1, quantity: 1 }],
      createdAt: new Date().toISOString(),
    };
    (foundationStore as any).dbState.inventoryDocuments.push(fakeDoc);

    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(fakeTransferId, 1);
    }, /وضعیت تأییدشده قرار ندارد/);

    // Case C: doc is CONFIRMED but docType is OUTBOUND_SALE instead of TRANSFER
    fakeDoc.status = 'CONFIRMED';
    fakeDoc.docType = 'OUTBOUND_SALE';
    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(fakeTransferId, 1);
    }, /نوع سند مرتبط با حواله ترانزیت نامعتبر است/);

    // Case D: docType is TRANSFER but sourceWarehouseId does not match transfer.sourceWarehouseId
    fakeDoc.docType = 'TRANSFER';
    fakeDoc.sourceWarehouseId = 3; // mismatch with transfer sourceWarehouseId (1)
    fakeDoc.targetWarehouseId = 2;
    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(fakeTransferId, 1);
    }, /مغایرت انبار مبدأ/);

    // Case E: docType is TRANSFER but targetWarehouseId does not match transfer.targetWarehouseId
    fakeDoc.sourceWarehouseId = 1;
    fakeDoc.targetWarehouseId = 3; // mismatch with transfer targetWarehouseId (2)
    assert.throws(() => {
      foundationStore.receiveInventoryTransferRequisition(fakeTransferId, 1);
    }, /مغایرت انبار مقصد/);

    // Clean up test fakes
    const tIdx = (foundationStore as any).dbState.inventoryTransfers.findIndex((t: any) => t.id === fakeTransferId);
    if (tIdx !== -1) (foundationStore as any).dbState.inventoryTransfers.splice(tIdx, 1);
    const dIdx = (foundationStore as any).dbState.inventoryDocuments.findIndex((d: any) => d.id === 999911);
    if (dIdx !== -1) (foundationStore as any).dbState.inventoryDocuments.splice(dIdx, 1);
  });
});
