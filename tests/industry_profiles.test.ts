import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore, INDUSTRY_PROFILES } from '../src/server/foundationStore';

describe('مرحله ۱۴: سیستم چندصنفی (Industry Profiles) و تفکیک افزونه‌های تخصصی', () => {
  it('۱. بررسی پروفایل پیش‌فرض سیستم (دوربین مداربسته و امنیت مهرگان - CCTV_SECURITY)', () => {
    const data = foundationStore.getFoundationData();
    assert.ok(data.settings);
    assert.strictEqual(data.settings.industryProfileCode, 'CCTV_SECURITY');

    const profile = foundationStore.getIndustryProfile();
    assert.strictEqual(profile.code, 'CCTV_SECURITY');
    assert.strictEqual(profile.features.enableInstallationServices, true);
    assert.strictEqual(profile.features.enableHardwareMacTracking, true);
    assert.strictEqual(profile.features.enableInstallersRole, true);
    assert.strictEqual(profile.features.enableWarrantyTracking, true);
    assert.strictEqual(profile.features.enableBarcodeScanQuickPos, true);

    // Verify UI label configuration for CCTV
    assert.strictEqual(profile.uiLabels?.inventoryTabTitleFa, 'کالا و تجهیزات نظارتی');
    assert.strictEqual(profile.uiLabels?.serialTrackerTitleFa, 'رهگیری سریال و MAC آدرس');
    assert.strictEqual(profile.uiLabels?.partiesInstallerRoleTitleFa, 'نصابان و تکنسین‌ها');
  });

  it('۲. آزمون ممانعت از تغییر صنف کاری توسط کاربر غیرمجاز (RBAC Enforced)', () => {
    // Attempt with user ID 999 (non-existent / no admin permission)
    assert.throws(
      () => {
        foundationStore.updateIndustryProfile('RETAIL_GENERAL', 999);
      },
      (err: Error) => {
        return err.message.includes('فقط راهبر کل');
      }
    );

    // Profile must still be CCTV_SECURITY
    const profile = foundationStore.getIndustryProfile();
    assert.strictEqual(profile.code, 'CCTV_SECURITY');
  });

  it('۳. آزمون تغییر ایمن به صنف فروشگاه عمومی (RETAIL_GENERAL) و بررسی پرچم‌های UI', () => {
    // Admin user id 1
    const result = foundationStore.updateIndustryProfile('RETAIL_GENERAL', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.settings.industryProfileCode, 'RETAIL_GENERAL');
    assert.strictEqual(result.profile.code, 'RETAIL_GENERAL');

    // Verify feature flags: CCTV specialized features are hidden in UI
    assert.strictEqual(result.profile.features.enableInstallationServices, false);
    assert.strictEqual(result.profile.features.enableHardwareMacTracking, false);
    assert.strictEqual(result.profile.features.enableInstallersRole, false);
    assert.strictEqual(result.profile.features.enableBarcodeScanQuickPos, true);

    // Verify UI labels tailored for general retail
    assert.strictEqual(result.profile.uiLabels?.inventoryTabTitleFa, 'کالا و انبارداری');
    assert.strictEqual(result.profile.uiLabels?.serialTrackerTitleFa, 'رهگیری شماره سریال کالا');
    assert.strictEqual(result.profile.uiLabels?.partiesInstallerRoleTitleFa, 'مجریان و کارشناسان فنی');

    // Verify audit log recorded
    const logs = foundationStore.getAuditLogs();
    const switchLog = logs.find((l) => l.action === 'UPDATE_INDUSTRY_PROFILE');
    assert.ok(switchLog);
    assert.strictEqual(switchLog.targetId, 'RETAIL_GENERAL');
    assert.strictEqual(switchLog.actorUserId, 1);
  });

  it('۴. بررسی فعال ماندن کامل تمام APIهای تخصصی و عدم حذف داده‌ها در پروفایل عمومی', () => {
    // Current profile is RETAIL_GENERAL
    const profile = foundationStore.getIndustryProfile();
    assert.strictEqual(profile.code, 'RETAIL_GENERAL');

    // 1. Installation jobs API must return existing records
    const jobs = foundationStore.getInstallationJobs();
    assert.ok(Array.isArray(jobs));
    assert.ok(jobs.length > 0);
    assert.ok(jobs.some((j) => j.jobCode.startsWith('INS-')));

    // 2. Projects API must return existing projects
    const projects = foundationStore.getProjects();
    assert.ok(Array.isArray(projects));
    assert.ok(projects.length > 0);
    assert.ok(projects.some((p) => p.projectCode.startsWith('PRJ-')));

    // 3. Parties API must retain installer party records
    const parties = foundationStore.getParties();
    assert.ok(Array.isArray(parties));
    const installerParty = parties.find(
      (p) => p.primaryType === 'INSTALLER' || p.roles?.includes('INSTALLER')
    );
    assert.ok(installerParty);
    assert.ok(installerParty.fullName.includes('نصاب') || installerParty.primaryType === 'INSTALLER');

    // 4. Inventory serials API must retain MAC addresses
    const serials = foundationStore.getItemSerials();
    assert.ok(Array.isArray(serials));
    const macSerial = serials.find((s) => s.macAddress && s.macAddress.length > 0);
    assert.ok(macSerial);
  });

  it('۵. بررسی پایداری عملکرد مالی، فاکتورها، انبارداری و دفاتر کل در پروفایل فروشگاه عمومی', () => {
    // Verify core accounting and inventory features remain 100% functional
    const data = foundationStore.getFoundationData();
    assert.strictEqual(data.settings.industryProfileCode, 'RETAIL_GENERAL');
    assert.ok(data.items && data.items.length > 0);
    assert.ok(data.parties && data.parties.length > 0);
    assert.ok(data.warehouses && data.warehouses.length > 0);
    assert.ok(data.bankAccounts && data.bankAccounts.length > 0);

    // Verify trial balance continues to compute
    const trialBalance = foundationStore.getTrialBalance();
    assert.ok(trialBalance.rows.length > 0);
    assert.strictEqual(trialBalance.isBalanced, true);
  });

  it('۶. آزمون توسعه‌پذیری معماری با ثبت و سوئیچ به صنف جدید بدون تغییر هسته', () => {
    // Dynamically register a new custom profile
    foundationStore.registerIndustryProfile({
      code: 'APPAREL_BOUTIQUE',
      titleFa: 'فروشگاه پوشاک و منسوجات',
      descriptionFa: 'پروفایل تخصصی پوشاک؛ شامل مدیریت رنگ و سایز و فروش بارکدی سریع بدون تجهیزات نصب.',
      badgeLabelFa: 'صنف پوشاک و مد',
      features: {
        enableInstallationServices: false,
        enableHardwareMacTracking: false,
        enableInstallersRole: false,
        enableWarrantyTracking: false,
        enableBarcodeScanQuickPos: true,
        enableSizeColorMatrix: true, // Extensible custom feature flag
      },
      uiLabels: {
        inventoryTabTitleFa: 'پوشاک و البسه',
        serialTrackerTitleFa: 'رهگیری بارکد پوشاک',
      },
    });

    const allProfiles = foundationStore.getAllIndustryProfiles();
    assert.ok(allProfiles.some((p) => p.code === 'APPAREL_BOUTIQUE'));

    // Switch to new profile
    const result = foundationStore.updateIndustryProfile('APPAREL_BOUTIQUE', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.profile.code, 'APPAREL_BOUTIQUE');
    assert.strictEqual(result.profile.features.enableSizeColorMatrix, true);
    assert.strictEqual(result.profile.features.enableInstallationServices, false);
  });

  it('۷. آزمون بازگشت به صنف دوربین مداربسته (CCTV_SECURITY) بدون اتلاف داده‌های قبلی', () => {
    const result = foundationStore.updateIndustryProfile('CCTV_SECURITY', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.settings.industryProfileCode, 'CCTV_SECURITY');
    assert.strictEqual(result.profile.features.enableInstallationServices, true);
    assert.strictEqual(result.profile.features.enableHardwareMacTracking, true);
    assert.strictEqual(result.profile.features.enableInstallersRole, true);

    // Verify existing installation jobs and projects are completely intact
    const jobs = foundationStore.getInstallationJobs();
    assert.ok(Array.isArray(jobs));
    assert.ok(jobs.length > 0);

    const projects = foundationStore.getProjects();
    assert.ok(Array.isArray(projects));
    assert.ok(projects.length > 0);
  });
});
