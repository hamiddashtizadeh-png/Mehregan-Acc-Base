import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۱۰: صنف خدمات، پیمانکاری، تیکت‌های کار فنی و پروژه‌ها (Phase 10: Services & Contracting Module)', () => {
  it('باید صنف کاری سامانه را به «خدمات، پیمانکاری و نصب» (SERVICES_CONTRACTING) تغییر دهد', () => {
    const result = foundationStore.updateIndustryProfile('SERVICES_CONTRACTING', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.profile.code, 'SERVICES_CONTRACTING');
    assert.strictEqual(result.profile.badgeLabelFa, 'صنف خدمات و پیمانکاری');
    assert.strictEqual(foundationStore.getIndustryProfile().code, 'SERVICES_CONTRACTING');
  });

  it('باید تیکت کار جدید فنی (Job Ticket) ثبت کرده و به تکنسین اعزامی ارجاع دهد', () => {
    const ticket = foundationStore.createServiceJobTicket(
      {
        customerId: 1,
        titleFa: 'سرویس دوره‌ای و تست تجهیزات مانیتورینگ سالن همایش',
        descriptionFa: 'بررسی فیش‌های BNC، منبع تغذیه مرکزی، آراستگی رک و تست سوئیچ‌های شبکه POE.',
        priority: 'URGENT',
        technicianId: 3,
        laborFeeIrr: 8500000,
        dateJalali: '1405/01/26',
        dueDateJalali: '1405/01/29',
      },
      1
    );

    assert.ok(ticket.id > 0);
    assert.ok(ticket.ticketNumber.startsWith('TCK-1405-'));
    assert.strictEqual(ticket.status, 'ASSIGNED');
    assert.strictEqual(ticket.laborFeeIrr, 8500000);
    assert.strictEqual(ticket.technicianId, 3);
  });

  it('باید وضعیت تیکت کار را تغییر دهد و تکنسین جدید را مجدداً انتساب کند', () => {
    const tickets = foundationStore.getServiceJobTickets();
    const ticket = tickets[tickets.length - 1];

    const updated = foundationStore.updateServiceJobTicketStatus(ticket.id, 'IN_PROGRESS', 1);
    assert.strictEqual(updated.status, 'IN_PROGRESS');

    const reassigned = foundationStore.assignTechnicianToJobTicket(ticket.id, 2, 1);
    assert.strictEqual(reassigned.technicianId, 2);
  });

  it('باید قطعات تعویضی و مصرفی انبار را به تیکت اضافه کرده و بهای کل را به‌روزرسانی نماید', () => {
    const tickets = foundationStore.getServiceJobTickets();
    const ticket = tickets[tickets.length - 1];

    const spareParts = [
      {
        itemId: 101,
        itemTitleFa: 'منبع تغذیه ۱۲ ولت ۳۰ آمپر صنعتی',
        quantity: 2,
        unitPriceIrr: 3500000,
        totalPriceIrr: 7000000,
      },
      {
        itemId: 102,
        itemTitleFa: 'کابل شبکه Cat6 SFTP نکسنس (متر)',
        quantity: 50,
        unitPriceIrr: 180000,
        totalPriceIrr: 9000000,
      },
    ];

    const updatedTicket = foundationStore.addSparePartsToJobTicket(ticket.id, spareParts, 1);
    assert.strictEqual(updatedTicket.spareParts.length, 2);
    assert.strictEqual(updatedTicket.sparePartsTotalIrr, 16000000);
    assert.strictEqual(updatedTicket.totalCostIrr, 8500000 + 16000000); // 24,500,000 IRR
  });

  it('باید تیکت کار تکمیل‌شده را به فاکتور فروش رسمی تبدیل کرده و اسناد روزنامه و خزانه‌داری را صادر کند', () => {
    const tickets = foundationStore.getServiceJobTickets();
    const ticket = tickets[tickets.length - 1];

    const initialInvoicesCount = foundationStore.getSalesInvoices().length;

    const result = foundationStore.invoiceJobTicket(ticket.id, 1);

    assert.ok(result.salesInvoice.id > 0);
    assert.ok(result.salesInvoice.invoiceNumber.startsWith('INV-SVC-1405-'));
    assert.strictEqual(result.ticket.status, 'COMPLETED');
    assert.strictEqual(result.ticket.invoiceId, result.salesInvoice.id);

    // Verify invoice lines contain both labor and spare parts
    assert.strictEqual(result.salesInvoice.lines.length, 3);
    assert.strictEqual(foundationStore.getSalesInvoices().length, initialInvoicesCount + 1);
  });
});
