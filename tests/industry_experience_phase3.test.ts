import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';
import { resolveIndustryUiLabels, IndustryProfileCode } from '../src/types/foundation';

describe('فاز ۳: تجربه کاربری مشترک و متمرکزسازی اصناف (Phase 3: Shared Industry Experience)', () => {
  it('۱. صحت عملکرد تابع resolveIndustryUiLabels در حالت بدون پارامتر یا مقادیر خالی (Default Fallback)', () => {
    const labelsNull = resolveIndustryUiLabels(null);
    assert.strictEqual(labelsNull.inventoryTabTitleFa, 'کالا و انبارداری');
    assert.strictEqual(labelsNull.salesTabTitleFa, 'فروش و POS');
    assert.strictEqual(labelsNull.purchasesTabTitleFa, 'خرید و تدارکات');
    assert.strictEqual(labelsNull.treasuryTabTitleFa, 'دریافت و پرداخت');
    assert.strictEqual(labelsNull.partiesTabTitleFa, 'اشخاص و طرفین');
    assert.strictEqual(labelsNull.installationTabTitleFa, 'خدمات و نصب CCTV');
    assert.strictEqual(labelsNull.quickPosButtonLabelFa, 'فاکتور فروش POS');
    assert.ok(labelsNull.salesTabDescFa.length > 5);
    assert.ok(labelsNull.purchasesTabDescFa.length > 5);
  });

  it('۲. صحت و تمایز عناوین متمرکز تمام ۸ صنف هدف سیستم (Centralized Navigation & Industry Labels)', () => {
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
      assert(p !== undefined, `صنف [${code}] باید در سیستم وجود داشته باشد.`);

      const labels = resolveIndustryUiLabels(p);
      assert.ok(labels.salesTabTitleFa && labels.salesTabTitleFa.length > 2, `عنوان فروش صنف [${code}] نامعتبر است.`);
      assert.ok(labels.purchasesTabTitleFa && labels.purchasesTabTitleFa.length > 2, `عنوان خرید صنف [${code}] نامعتبر است.`);
      assert.ok(labels.treasuryTabTitleFa && labels.treasuryTabTitleFa.length > 2, `عنوان خزانه صنف [${code}] نامعتبر است.`);
      assert.ok(labels.partiesTabTitleFa && labels.partiesTabTitleFa.length > 2, `عنوان طرفین صنف [${code}] نامعتبر است.`);
      assert.ok(labels.inventoryTabTitleFa && labels.inventoryTabTitleFa.length > 2, `عنوان انبار صنف [${code}] نامعتبر است.`);
      assert.ok(labels.installationTabTitleFa && labels.installationTabTitleFa.length > 2, `عنوان خدمات صنف [${code}] نامعتبر است.`);
      assert.ok(labels.quickPosButtonLabelFa && labels.quickPosButtonLabelFa.length > 2, `عنوان صندوق POS صنف [${code}] نامعتبر است.`);
      assert.ok(labels.quickSalesSubmenuTitleFa && labels.quickSalesSubmenuTitleFa.length > 2, `زیرمنوی فروش صنف [${code}] نامعتبر است.`);
      assert.ok(labels.quickPurchasesSubmenuTitleFa && labels.quickPurchasesSubmenuTitleFa.length > 2, `زیرمنوی خرید صنف [${code}] نامعتبر است.`);
      assert.ok(labels.quickTreasurySubmenuTitleFa && labels.quickTreasurySubmenuTitleFa.length > 2, `زیرمنوی خزانه صنف [${code}] نامعتبر است.`);
      assert.ok(labels.quickPartiesSubmenuTitleFa && labels.quickPartiesSubmenuTitleFa.length > 2, `زیرمنوی طرفین صنف [${code}] نامعتبر است.`);
      assert.ok(labels.quickInventorySubmenuTitleFa && labels.quickInventorySubmenuTitleFa.length > 2, `زیرمنوی انبار صنف [${code}] نامعتبر است.`);
    }

    // بررسی اختصاصی اصناف کلیدی:
    // طلا و جواهرات
    const gold = allProfiles.find((p) => p.code === 'GOLD_JEWELRY');
    assert(gold?.uiLabels?.salesTabTitleFa.includes('طلا'));
    assert(gold?.uiLabels?.treasuryTabTitleFa.includes('طلا'));

    // رستوران و کافی‌شاپ
    const restaurant = allProfiles.find((p) => p.code === 'RESTAURANT_CAFE');
    assert(restaurant?.uiLabels?.salesTabTitleFa.includes('سفارشات'));
    assert(restaurant?.uiLabels?.inventoryTabTitleFa.includes('آشپزخانه'));

    // موبایل و الکترونیک
    const mobile = allProfiles.find((p) => p.code === 'MOBILE_ELECTRONICS');
    assert(mobile?.uiLabels?.serialTrackerTitleFa?.includes('IMEI'));

    // پخش عمده و بنکداری
    const wholesale = allProfiles.find((p) => p.code === 'WHOLESALE_DISTRIBUTION');
    assert(wholesale?.uiLabels?.inventoryTabTitleFa.includes('کارتن'));
    assert(wholesale?.uiLabels?.salesTabTitleFa.includes('عمده'));

    // خدمات فنی و پیمانکاری
    const services = allProfiles.find((p) => p.code === 'SERVICES_CONTRACTING');
    assert(services?.uiLabels?.installationTabTitleFa?.includes('تکنسین'));
  });

  it('۳. انطباق دقیق چیدمان پیش‌فرض (Layout Presets) و پرچم‌های عملیاتی (Feature Flags)', () => {
    const allProfiles = foundationStore.getAllIndustryProfiles();

    const cctv = allProfiles.find((p) => p.code === 'CCTV_SECURITY')!;
    assert.strictEqual(cctv.layout?.preset, 'ENGINEERING_PROJECTS');
    assert.strictEqual(cctv.features.enableInstallationServices, true);
    assert.strictEqual(cctv.features.enableHardwareMacTracking, true);
    assert.strictEqual(cctv.layout?.showInstallationTab, true);

    const retail = allProfiles.find((p) => p.code === 'RETAIL_GENERAL')!;
    assert.strictEqual(retail.layout?.preset, 'RETAIL_FAST_POS');
    assert.strictEqual(retail.features.enableInstallationServices, false);
    assert.strictEqual(retail.features.enableHardwareMacTracking, false);
    assert.strictEqual(retail.layout?.showInstallationTab, false);

    const gold = allProfiles.find((p) => p.code === 'GOLD_JEWELRY')!;
    assert.strictEqual(gold.layout?.preset, 'GOLD_JEWELRY_CALC');
    assert.strictEqual(gold.layout?.defaultSalesMode, 'JEWELRY_CALC');

    const wholesale = allProfiles.find((p) => p.code === 'WHOLESALE_DISTRIBUTION')!;
    assert.strictEqual(wholesale.layout?.preset, 'WHOLESALE_TIERS_MATRIX');
    assert.strictEqual(wholesale.layout?.defaultSalesMode, 'WHOLESALE_MATRIX');

    const restaurant = allProfiles.find((p) => p.code === 'RESTAURANT_CAFE')!;
    assert.strictEqual(restaurant.layout?.preset, 'RESTAURANT_TOUCH_TABLES');
  });

  it('۴. عدم تأثیر تم بر منطق تجاری و مجوزها (Theme & Logic Decoupling)', () => {
    const adminUserId = 1;
    // فعال‌سازی صنف عمومی
    foundationStore.updateIndustryProfile('RETAIL_GENERAL', adminUserId);
    const active = foundationStore.getIndustryProfile();

    // بررسی اینکه در صنف عمومی، حتی با داشتن تم، قابلیت‌های نصابان و سخت‌افزاری فعال نیستند
    assert.strictEqual(active.features.enableInstallationServices, false);
    assert.strictEqual(active.features.enableHardwareMacTracking, false);
    assert.strictEqual(active.features.enableInstallersRole, false);

    // بازگردانی به صنف پیش‌فرض
    foundationStore.updateIndustryProfile('CCTV_SECURITY', adminUserId);
    const cctv = foundationStore.getIndustryProfile();
    assert.strictEqual(cctv.code, 'CCTV_SECURITY');
    assert.strictEqual(cctv.features.enableInstallationServices, true);
  });
});
