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

  it('۳. آزمون تغییر ایمن به صنف فروشگاه عمومی (RETAIL_GENERAL) توسط مدیر ارشد', () => {
    // Admin user id 1
    const result = foundationStore.updateIndustryProfile('RETAIL_GENERAL', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.settings.industryProfileCode, 'RETAIL_GENERAL');
    assert.strictEqual(result.profile.code, 'RETAIL_GENERAL');

    // Verify feature flags in retail mode
    assert.strictEqual(result.profile.features.enableInstallationServices, false);
    assert.strictEqual(result.profile.features.enableHardwareMacTracking, false);
    assert.strictEqual(result.profile.features.enableInstallersRole, false);
    assert.strictEqual(result.profile.features.enableBarcodeScanQuickPos, true);

    // Verify audit log recorded
    const logs = foundationStore.getAuditLogs();
    const switchLog = logs.find((l) => l.action === 'UPDATE_INDUSTRY_PROFILE');
    assert.ok(switchLog);
    assert.strictEqual(switchLog.targetId, 'RETAIL_GENERAL');
    assert.strictEqual(switchLog.actorUserId, 1);
  });

  it('۴. بررسی پایداری عملکرد مالی، فاکتورها، انبارداری و دفاتر کل در پروفایل فروشگاه عمومی', () => {
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

  it('۵. آزمون بازگشت به صنف دوربین مداربسته (CCTV_SECURITY) بدون اتلاف داده‌های قبلی', () => {
    const result = foundationStore.updateIndustryProfile('CCTV_SECURITY', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.settings.industryProfileCode, 'CCTV_SECURITY');
    assert.strictEqual(result.profile.features.enableInstallationServices, true);
    assert.strictEqual(result.profile.features.enableHardwareMacTracking, true);
    assert.strictEqual(result.profile.features.enableInstallersRole, true);

    // Verify existing installation jobs are intact
    const jobs = foundationStore.getInstallationJobs();
    assert.ok(Array.isArray(jobs));
    assert.ok(jobs.length > 0);
  });
});
