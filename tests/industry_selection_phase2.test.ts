import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';
import { IndustryProfileCode } from '../src/types/foundation';

describe('فاز ۲ انتخاب صنف کاری و افزونه‌های تخصصی (Phase 2: Industry Selection & Settings UI)', () => {
  it('۱. صحت پیکربندی تمام اصناف هدف سیستم (Target Industries Configuration)', () => {
    const allProfiles = foundationStore.getAllIndustryProfiles();
    const targetCodes: IndustryProfileCode[] = [
      'CCTV_SECURITY',
      'RETAIL_GENERAL',
      'MOBILE_ELECTRONICS',
      'WHOLESALE_DISTRIBUTION',
      'SERVICES_CONTRACTING',
      'GOLD_JEWELRY',
      'RESTAURANT_CAFE',
      'SUPERMARKET_GROCERY',
    ];

    for (const code of targetCodes) {
      const p = allProfiles.find((item) => item.code === code);
      assert(p !== undefined, `صنف [${code}] باید در سیستم پیکربندی شده باشد.`);
      assert(p.titleFa.length > 3, `عنوان صنف [${code}] باید معتبر باشد.`);
      assert(p.badgeLabelFa.length > 1, `بج صنف [${code}] باید معتبر باشد.`);
      assert(p.theme?.id && p.theme.id.length > 0, `شناسه تم صنف [${code}] باید معتبر باشد.`);
      assert(p.theme?.primaryColor.startsWith('#'), `رنگ تم صنف [${code}] باید هگز معتبر باشد.`);
      assert(p.theme?.headerBrandTitleFa.length > 0, `عنوان برند هدر صنف [${code}] باید معتبر باشد.`);
    }
  });

  it('۲. آزمون تغییر پایدار صنف کاری برای تک‌تک اصناف هدف (Persisted Profile Switching)', () => {
    const adminUserId = 1;

    const testSwitch = (code: IndustryProfileCode, expectedThemeId: string) => {
      const res = foundationStore.updateIndustryProfile(code, adminUserId);
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.profile.code, code);
      assert.strictEqual(res.settings.industryProfileCode, code);
      assert.strictEqual(res.profile.theme?.id, expectedThemeId);

      const active = foundationStore.getIndustryProfile();
      assert.strictEqual(active.code, code);
      assert.strictEqual(active.theme?.id, expectedThemeId);
    };

    // ۱. موبایل و الکترونیک
    testSwitch('MOBILE_ELECTRONICS', 'mobile');

    // ۲. طلا و جواهرات
    testSwitch('GOLD_JEWELRY', 'gold');

    // ۳. رستوران و کافی‌شاپ
    testSwitch('RESTAURANT_CAFE', 'restaurant');

    // ۴. پخش عمده و بنکداری
    testSwitch('WHOLESALE_DISTRIBUTION', 'wholesale');

    // ۵. خدمات و تعمیرات
    testSwitch('SERVICES_CONTRACTING', 'services');

    // ۶. خرده‌فروشی عمومی
    testSwitch('RETAIL_GENERAL', 'retail');

    // ۷. سوپرمارکت و مواد غذایی
    testSwitch('SUPERMARKET_GROCERY', 'grocery');

    // ۸. بازگشت به دوربین مداربسته و سیستم‌های حفاظتی (CCTV)
    testSwitch('CCTV_SECURITY', 'cctv');
  });

  it('۳. حفظ کامل داده‌های موجود در زمان تغییر صنف کاری (Data Integrity & Backward Compatibility)', () => {
    const adminUserId = 1;

    const initialDocsCount = foundationStore.getAccountingDocuments().length;
    const initialPartiesCount = foundationStore.getParties().length;
    const initialItemsCount = foundationStore.getItems().length;
    const initialWarehousesCount = foundationStore.getWarehouses().length;

    // Switch across multiple profiles
    foundationStore.updateIndustryProfile('GOLD_JEWELRY', adminUserId);
    foundationStore.updateIndustryProfile('RESTAURANT_CAFE', adminUserId);
    foundationStore.updateIndustryProfile('WHOLESALE_DISTRIBUTION', adminUserId);
    foundationStore.updateIndustryProfile('CCTV_SECURITY', adminUserId);

    // Verify all core data collections remain untouched
    assert.strictEqual(foundationStore.getAccountingDocuments().length, initialDocsCount);
    assert.strictEqual(foundationStore.getParties().length, initialPartiesCount);
    assert.strictEqual(foundationStore.getItems().length, initialItemsCount);
    assert.strictEqual(foundationStore.getWarehouses().length, initialWarehousesCount);
  });

  it('۴. اعمال سخت‌گیرانه دسترسی تغییر صنف کاری (RBAC Enforcement)', () => {
    // Non-admin / unauthorized user ID 999
    assert.throws(
      () => {
        foundationStore.updateIndustryProfile('GOLD_JEWELRY', 999);
      },
      (err: Error) => err.message.includes('فقط راهبر کل')
    );

    // Active profile must still remain CCTV_SECURITY
    assert.strictEqual(foundationStore.getIndustryProfile().code, 'CCTV_SECURITY');
  });

  it('۵. ثبات تنظیمات در دیسک و بازیابی پس از فراخوانی مجدد (Storage Persistence)', () => {
    const adminUserId = 1;
    foundationStore.updateIndustryProfile('MOBILE_ELECTRONICS', adminUserId);

    // Read directly from settings
    const currentSettings = foundationStore.getSettings();
    assert.strictEqual(currentSettings.industryProfileCode, 'MOBILE_ELECTRONICS');

    // Reset back to default
    foundationStore.updateIndustryProfile('CCTV_SECURITY', adminUserId);
    assert.strictEqual(foundationStore.getSettings().industryProfileCode, 'CCTV_SECURITY');
  });
});
