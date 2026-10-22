import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { foundationStore } from '../src/server/foundationStore';

describe('آزمون‌های اعتبارسنجی اصلاحات نهایی: خدمات فنی و پیمانکاری، استهلاک دارایی‌ها و بستن حساب‌ها', () => {
  it('۱. اتصال تب و کامپوننت ServicesContractingView به App.tsx و ایزوله بودن پروفایل‌ها', () => {
    const appSource = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');

    // Must import ServicesContractingView
    assert.ok(
      appSource.includes("import { ServicesContractingView } from './components/ServicesContractingView'"),
      'App.tsx must import ServicesContractingView'
    );

    // Must include SERVICES_CONTRACTING in WorkspaceTab
    assert.ok(
      appSource.includes("'SERVICES_CONTRACTING'"),
      'App.tsx WorkspaceTab must include SERVICES_CONTRACTING'
    );

    // Must have dedicated navigation button
    assert.ok(
      appSource.includes("setActiveTab('SERVICES_CONTRACTING')"),
      'App.tsx must contain navigation button for SERVICES_CONTRACTING'
    );

    // Must render ServicesContractingView in main viewport
    assert.ok(
      appSource.includes('<ServicesContractingView'),
      'App.tsx must render ServicesContractingView in main viewport'
    );
  });

  it('۲. محاسبه استهلاک با سیاست تسهیم زمانی ماهانه (Monthly Prorating) برای خرید میان‌دوره', () => {
    // Reset state for isolation
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });

    // Create asset acquired in Month 7 (مهر ماه) with useful life 5 years
    // Purchase Cost: 120,000,000 IRR, Salvage: 0 -> Annual = 24,000,000 IRR
    // Active months in 1405: 12 - 7 + 1 = 6 months -> Prorated = 12,000,000 IRR
    const asset = foundationStore.createFixedAsset(
      {
        assetCode: 'AST-PRORATE-01',
        titleFa: 'سرور پشتیبان مرکزی شعبه',
        purchaseDateJalali: '1405/07/15',
        purchaseCostIrr: 120000000,
        salvageValueIrr: 0,
        usefulLifeYears: 5,
        depreciationMethod: 'STRAIGHT_LINE',
        locationAddressFa: 'اتاق سرور',
      },
      1
    );

    assert.ok(asset.id > 0);

    const result = foundationStore.calculateAndPostDepreciation(asset.id, '1405-Y', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.depreciationAmountIrr, 12000000, 'استهلاک ۶ ماه باید دقیقاً ۱۲,۰۰۰,۰۰۰ ریال باشد.');
    assert.ok(result.document);
    assert.strictEqual(result.document.sourceDocType, 'FIXED_ASSET_DEPRECIATION');
    assert.strictEqual(result.document.sourceDocId, asset.id);

    // Verify duplicate prevention
    assert.throws(() => {
      foundationStore.calculateAndPostDepreciation(asset.id, '1405-Y', 1);
    }, /قبلاً محاسبه و ثبت گردیده است/);
  });

  it('۳. کارکرد عملیاتی محاسبه استهلاک هنگام غیرفعال بودن حسابداری دوبل (بدون پرتاب خطا)', () => {
    // Create new asset
    const asset = foundationStore.createFixedAsset(
      {
        assetCode: 'AST-OP-02',
        titleFa: 'میز کار و تجهیزات اداری',
        purchaseDateJalali: '1405/01/01',
        purchaseCostIrr: 60000000,
        salvageValueIrr: 0,
        usefulLifeYears: 5,
        depreciationMethod: 'STRAIGHT_LINE',
        locationAddressFa: 'دفتر مرکزی',
      },
      1
    );

    // Disable double entry accounting
    foundationStore.updateSettings({ enableDoubleEntryAccounting: false });
    assert.strictEqual(foundationStore.isDoubleEntryAccountingEnabled(), false);

    // Must NOT throw; must update asset book value operationally and set document to null
    const result = foundationStore.calculateAndPostDepreciation(asset.id, '1405-Y', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.document, null);
    assert.strictEqual(result.depreciationAmountIrr, 12000000);

    const updatedAsset = foundationStore.getFixedAssets().find((a) => a.id === asset.id);
    assert.ok(updatedAsset);
    assert.strictEqual(updatedAsset.accumulatedDepreciationIrr, 12000000);
    assert.strictEqual(updatedAsset.bookValueIrr, 48000000);

    // Re-enable double-entry accounting for subsequent tests
    foundationStore.updateSettings({ enableDoubleEntryAccounting: true });
  });

  it('۴. عنوان کاملاً خنثی و اصناف‌محور حساب درآمد در سند بستن حساب‌های موقت', () => {
    const fy = foundationStore.getFiscalYears()[0];
    assert.ok(fy);

    // Close period 1
    const p1 = foundationStore.getAccountingPeriods(fy.id)[0];
    assert.ok(p1);

    if (p1.status === 'CLOSED') {
      foundationStore.reopenAccountingPeriod(p1.id, 'تست ممیزی عنوان سند بستن', 1);
    }

    const closeRes = foundationStore.closeAccountingPeriod(p1.id, { notesFa: 'تست عنوان درآمد' }, 1);
    assert.strictEqual(closeRes.ok, true);

    if (closeRes.closingDoc) {
      const revenueLine = closeRes.closingDoc.lines.find((l) => l.accountCode === '60101');
      if (revenueLine) {
        assert.ok(
          !revenueLine.accountTitleFa.includes('دوربین‌های مداربسته'),
          'عنوان حساب درآمد نباید شامل عبارت اختصاصی دوربین مداربسته باشد.'
        );
        assert.strictEqual(revenueLine.accountTitleFa, 'درآمدها و فروش دوره (بستن حساب موقت)');
      }
    }

    // Reopen period to maintain clean open state for other tests
    foundationStore.reopenAccountingPeriod(p1.id, 'اتمام تست ممیزی و بازگردانی دوره به وضعیت باز', 1);
  });

  it('۵. وجود تب و کامپوننت حواله‌های ترانزیت بین شعب در InventoryManagementView.tsx', () => {
    const invSource = fs.readFileSync(path.join(process.cwd(), 'src/components/InventoryManagementView.tsx'), 'utf8');

    assert.ok(invSource.includes("'TRANSFERS'"), 'InventoryManagementView must include TRANSFERS SubTab');
    assert.ok(invSource.includes('/api/inventory/transfers'), 'InventoryManagementView must connect to /api/inventory/transfers');
    assert.ok(invSource.includes('/receive'), 'InventoryManagementView must support receive confirmation');
    assert.ok(invSource.includes('حواله‌های ترانزیت'), 'InventoryManagementView must include transit transfers Persian labels');
  });
});
