import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۹: صنف موبایل، رایانه، رجیستری همتا و تعمیرات (Phase 9: Mobile & Electronics Module)', () => {
  it('باید صنف کاری سامانه را به «موبایل، رایانه و الکترونیک» (MOBILE_ELECTRONICS) تغییر دهد', () => {
    const result = foundationStore.updateIndustryProfile('MOBILE_ELECTRONICS', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.profile.code, 'MOBILE_ELECTRONICS');
    assert.strictEqual(result.profile.badgeLabelFa, 'صنف موبایل و الکترونیک');
    assert.strictEqual(foundationStore.getIndustryProfile().code, 'MOBILE_ELECTRONICS');
  });

  it('باید دستگاه جدید نو/کارکرده را با شناسه دوگانه IMEI 1 و IMEI 2 ثبت و از کدهای تکراری جلوگیری کند', () => {
    const newDevice = foundationStore.addMobileDevice(
      {
        itemId: 101,
        modelFa: 'شیائومی 14 Ultra (512GB/16GB)',
        brandFa: 'شیائومی (Xiaomi)',
        imei1: '869910293847561',
        imei2: '869910293847579',
        serialNumber: 'SN-XIAOMI-14U-001',
        storageGb: 512,
        ramGb: 16,
        colorFa: 'سفید چرمی',
        condition: 'NEW',
        registryStatus: 'COMMERCIAL_CUSTOMS',
        warrantyStatus: 'UNDER_WARRANTY',
        warrantyCompanyFa: 'تسکو تجارت (۱۸ ماهه)',
        purchasePriceIrr: 620000000,
        salePriceIrr: 670000000,
        stockStatus: 'IN_STOCK',
        warehouseId: 1,
      },
      1
    );

    assert.ok(newDevice.id > 0);
    assert.strictEqual(newDevice.imei1, '869910293847561');

    // Duplicate IMEI test
    assert.throws(() => {
      foundationStore.addMobileDevice(
        {
          itemId: 101,
          modelFa: 'شیائومی 14 Ultra تکراری',
          brandFa: 'شیائومی',
          imei1: '869910293847561', // duplicate!
          storageGb: 512,
          colorFa: 'مشکی',
          condition: 'NEW',
          registryStatus: 'COMMERCIAL_CUSTOMS',
          warrantyStatus: 'UNDER_WARRANTY',
          purchasePriceIrr: 600000000,
          salePriceIrr: 650000000,
          stockStatus: 'IN_STOCK',
          warehouseId: 1,
        },
        1
      );
    }, /قبلاً در سیستم ثبت شده است/);
  });

  it('باید استعلام آنلاین IMEI و جستجوی سوابق تعمیرات را به درستی انجام دهد', () => {
    const lookup = foundationStore.lookupDeviceByImeiOrSerial('869910293847561');
    assert.ok(lookup.device);
    assert.strictEqual(lookup.device.modelFa, 'شیائومی 14 Ultra (512GB/16GB)');
    assert.strictEqual(lookup.matchedField, 'IMEI1');
  });

  it('باید قبض جدید پذیرش تعمیرات صادر کرده و بیعانه دریافتی را در خزانه‌داری منظور نماید', () => {
    const initialTreasuryCount = foundationStore.getTreasuryTransactions().length;

    const ticket = foundationStore.createMobileRepairTicket(
      {
        customerId: 1,
        customerNameFa: 'مهندس حمیدرضا احمدی',
        customerPhone: '09121112233',
        deviceModelFa: 'لپ‌تاپ مک‌بوک پرو M2 (MacBook Pro 14")',
        colorFa: 'خاکستری فضایی',
        imeiOrSerial: 'C02GX920MD6R',
        reportedFaultsFa: 'عدم روشن شدن پس از نوسان برق و تعویض آی‌سی شارژ Type-C',
        estimatedCostIrr: 45000000,
        depositPaidIrr: 10000000, // ۱۰ میلیون ریال بیعانه
      },
      1
    );

    assert.ok(ticket.ticketNumber.startsWith('REP-1405-'));
    assert.strictEqual(ticket.depositPaidIrr, 10000000);
    assert.strictEqual(ticket.status, 'RECEIVED');

    // Check treasury receipt created for deposit
    const updatedTreasuryCount = foundationStore.getTreasuryTransactions().length;
    assert.strictEqual(updatedTreasuryCount, initialTreasuryCount + 1);
  });

  it('باید قطعات تعویضی به قبض اضافه کرده، وضعیت را به‌روزرسانی و فاکتور فروش/خدمات با سند حسابداری صادر نماید', () => {
    const tickets = foundationStore.getMobileRepairTickets();
    const ticket = tickets[tickets.length - 1]; // recent ticket

    // Add part
    const updatedTicket = foundationStore.addPartToRepairTicket(
      ticket.id,
      {
        partNameFa: 'آی‌سی مدیریت شارژ اورجینال Type-C',
        partCostIrr: 15000000,
        quantity: 1,
      },
      1
    );

    assert.strictEqual(updatedTicket.parts.length, 1);
    assert.strictEqual(updatedTicket.partsTotalIrr, 15000000);

    // Update status to REPAIRED
    foundationStore.updateMobileRepairStatus(ticket.id, 'REPAIRED', 'تست بورد انجام شد', 1);

    // Final checkout and invoice
    const initialInvoiceCount = foundationStore.getSalesInvoices().length;
    const initialDocCount = foundationStore.getAccountingDocuments().length;

    const checkout = foundationStore.completeAndInvoiceRepairTicket(ticket.id, 'POS', 1);

    assert.strictEqual(checkout.ticket.status, 'DELIVERED');
    assert.ok(checkout.salesInvoice.invoiceNumber.startsWith('INV-REP-1405-'));
    assert.strictEqual(foundationStore.getSalesInvoices().length, initialInvoiceCount + 1);
    assert.strictEqual(foundationStore.getAccountingDocuments().length, initialDocCount + 1);

    // Verify printable slip generation
    const slip = foundationStore.generateMobileRepairSlip(ticket.id);
    assert.strictEqual(slip.ticketNumber, ticket.ticketNumber);
    assert.strictEqual(slip.customerNameFa, 'مهندس حمیدرضا احمدی');
  });
});
