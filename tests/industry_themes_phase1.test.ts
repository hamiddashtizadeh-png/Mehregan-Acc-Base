import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore, INDUSTRY_PROFILES } from '../src/server/foundationStore';
import { IndustryProfileCode } from '../src/types/foundation';

describe('فاز ۱ سفارشی‌سازی اصناف و موتور تم پویا (Industry Profiles & Theme Foundation Phase 1)', () => {
  it('۱. سازگاری کامل اصناف موروثی (Legacy Profiles Compatibility)', () => {
    // CCTV_SECURITY
    const cctv = foundationStore.getIndustryProfile('CCTV_SECURITY');
    assert.strictEqual(cctv.code, 'CCTV_SECURITY');
    assert.strictEqual(cctv.features.enableInstallationServices, true);
    assert.strictEqual(cctv.features.enableHardwareMacTracking, true);
    assert.strictEqual(cctv.features.enableInstallersRole, true);
    assert.strictEqual(cctv.uiLabels?.inventoryTabTitleFa, 'کالا و تجهیزات نظارتی');
    assert.strictEqual(cctv.theme?.id, 'cctv');
    assert.strictEqual(cctv.layout?.preset, 'ENGINEERING_PROJECTS');

    // RETAIL_GENERAL
    const retail = foundationStore.getIndustryProfile('RETAIL_GENERAL');
    assert.strictEqual(retail.code, 'RETAIL_GENERAL');
    assert.strictEqual(retail.features.enableInstallationServices, false);
    assert.strictEqual(retail.features.enableBarcodeScanQuickPos, true);
    assert.strictEqual(retail.theme?.id, 'retail');
    assert.strictEqual(retail.layout?.preset, 'RETAIL_FAST_POS');

    // SUPERMARKET_GROCERY
    const grocery = foundationStore.getIndustryProfile('SUPERMARKET_GROCERY');
    assert.strictEqual(grocery.code, 'SUPERMARKET_GROCERY');
    assert.strictEqual(grocery.features.enableInstallationServices, false);
    assert.strictEqual(grocery.theme?.id, 'grocery');
    assert.strictEqual(grocery.layout?.preset, 'GROCERY_BARCODE');
  });

  it('۲. رفتار بازگشت به پیش‌فرض امن (Default CCTV Fallback)', () => {
    // When called with undefined or empty
    const fallbackProfile = foundationStore.getIndustryProfile();
    assert(fallbackProfile !== undefined);
    assert.strictEqual(fallbackProfile.code, 'CCTV_SECURITY');

    // When called with an unknown or invalid code
    const invalidProfile = foundationStore.getIndustryProfile('UNKNOWN_FICTIONAL_INDUSTRY' as IndustryProfileCode);
    assert.strictEqual(invalidProfile.code, 'CCTV_SECURITY');
    assert.strictEqual(invalidProfile.theme?.id, 'cctv');
  });

  it('۳. پیکربندی یکپارچه تمامی ۷ صنف هدف همراه با تم و چیدمان مجزا', () => {
    const allProfiles = foundationStore.getAllIndustryProfiles();
    assert(allProfiles.length >= 7, 'باید حداقل ۷ صنف هدف در سیستم تعریف شده باشد.');

    const expectedCodes: IndustryProfileCode[] = [
      'CCTV_SECURITY',
      'RETAIL_GENERAL',
      'SUPERMARKET_GROCERY',
      'GOLD_JEWELRY',
      'RESTAURANT_CAFE',
      'WHOLESALE_DISTRIBUTION',
      'SERVICES_CONTRACTING',
    ];

    for (const code of expectedCodes) {
      const profile = allProfiles.find((p) => p.code === code);
      assert(profile !== undefined, `صنف هدف [${code}] باید در سیستم وجود داشته باشد.`);
      assert(profile.titleFa && profile.titleFa.length > 2, `عنوان فارسی صنف [${code}] معتبر باشد.`);
      assert(profile.badgeLabelFa && profile.badgeLabelFa.length > 1, `برچسب صنف [${code}] معتبر باشد.`);

      // Verify Theme Tokens separation
      assert(profile.theme !== undefined, `صنف [${code}] باید دارای پیکربندی تم باشد.`);
      assert(profile.theme.id && typeof profile.theme.id === 'string', `شناسه تم صنف [${code}] باید رشته معتبر باشد.`);
      assert(profile.theme.primaryColor.startsWith('#'), `رنگ تم صنف [${code}] باید کد رنگ هگز معتبر باشد.`);
      assert(profile.theme.headerBrandTitleFa.length > 0, `عنوان برند هدر در تم صنف [${code}] باید معتبر باشد.`);

      // Verify Layout Config separation
      assert(profile.layout !== undefined, `صنف [${code}] باید دارای پیکربندی چیدمان باشد.`);
      assert(profile.layout.preset && typeof profile.layout.preset === 'string', `پریست چیدمان صنف [${code}] باید مشخص باشد.`);
    }
  });

  it('۴. آزمون سوئیچ موفق صنف کاری و فعال‌سازی تم متناظر (Profile Switching & Theme Selection)', () => {
    const adminUserId = 1;

    // ۱. سوئیچ به صنف طلا و جواهرفروشی
    const goldResult = foundationStore.updateIndustryProfile('GOLD_JEWELRY', adminUserId);
    assert.strictEqual(goldResult.ok, true);
    assert.strictEqual(goldResult.profile.code, 'GOLD_JEWELRY');
    assert.strictEqual(goldResult.profile.theme?.id, 'gold');
    assert.strictEqual(goldResult.profile.layout?.preset, 'GOLD_JEWELRY_CALC');
    assert.strictEqual(foundationStore.getIndustryProfile().code, 'GOLD_JEWELRY');

    // ۲. سوئیچ به صنف رستوران و کافی‌شاپ
    const restaurantResult = foundationStore.updateIndustryProfile('RESTAURANT_CAFE', adminUserId);
    assert.strictEqual(restaurantResult.ok, true);
    assert.strictEqual(restaurantResult.profile.code, 'RESTAURANT_CAFE');
    assert.strictEqual(restaurantResult.profile.theme?.id, 'restaurant');
    assert.strictEqual(restaurantResult.profile.layout?.preset, 'RESTAURANT_TOUCH_TABLES');

    // ۳. سوئیچ به صنف پخش عمده و بنکداری
    const wholesaleResult = foundationStore.updateIndustryProfile('WHOLESALE_DISTRIBUTION', adminUserId);
    assert.strictEqual(wholesaleResult.ok, true);
    assert.strictEqual(wholesaleResult.profile.code, 'WHOLESALE_DISTRIBUTION');
    assert.strictEqual(wholesaleResult.profile.theme?.id, 'wholesale');
    assert.strictEqual(wholesaleResult.profile.layout?.preset, 'WHOLESALE_TIERS_MATRIX');

    // ۴. بازگشت ایمن به صنف پیش‌فرض دوربین مداربسته (CCTV_SECURITY)
    const cctvResult = foundationStore.updateIndustryProfile('CCTV_SECURITY', adminUserId);
    assert.strictEqual(cctvResult.ok, true);
    assert.strictEqual(cctvResult.profile.code, 'CCTV_SECURITY');
    assert.strictEqual(cctvResult.profile.theme?.id, 'cctv');
    assert.strictEqual(foundationStore.getIndustryProfile().code, 'CCTV_SECURITY');
  });

  it('۵. تفکیک معماری بین تم، پریست چیدمان و پرچم‌های عملیاتی بیزینس', () => {
    const gold = foundationStore.getIndustryProfile('GOLD_JEWELRY');
    const cctv = foundationStore.getIndustryProfile('CCTV_SECURITY');
    const wholesale = foundationStore.getIndustryProfile('WHOLESALE_DISTRIBUTION');

    // پرچم‌های عملیاتی از تم و چیدمان کاملاً تفکیک شده‌اند
    assert.strictEqual(cctv.features.enableInstallationServices, true);
    assert.strictEqual(gold.features.enableInstallationServices, false);
    assert.strictEqual(wholesale.features.enableInstallationServices, false);

    // تم‌ها از یکدیگر مستقلند
    assert.notStrictEqual(gold.theme?.primaryColor, cctv.theme?.primaryColor);
    assert.notStrictEqual(wholesale.theme?.primaryColor, gold.theme?.primaryColor);

    // پریست‌های چیدمان از یکدیگر مستقلند
    assert.notStrictEqual(gold.layout?.preset, cctv.layout?.preset);
    assert.notStrictEqual(wholesale.layout?.preset, gold.layout?.preset);
  });

  it('۶. ممانعت از تغییر صنف کاری توسط کاربر غیرمجاز (RBAC Protection)', () => {
    // User without settings permission (id: 999)
    assert.throws(
      () => {
        foundationStore.updateIndustryProfile('GOLD_JEWELRY', 999);
      },
      (err: Error) => err.message.includes('فقط راهبر کل')
    );
  });
});
