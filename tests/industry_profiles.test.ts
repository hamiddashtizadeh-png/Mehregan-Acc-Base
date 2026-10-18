import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { foundationStore, INDUSTRY_PROFILES, FoundationStore } from '../src/server/foundationStore';
import { LOCAL_STATE_DB_FILE } from '../src/server/paths';

describe('مرحله ۱۴: سیستم چندصنفی (Industry Profiles) و پایداری اصناف پویا', () => {
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

    // 4. Inventory serials API must retain MAC addresses
    const serials = foundationStore.getItemSerials();
    assert.ok(Array.isArray(serials));
    const macSerial = serials.find((s) => s.macAddress && s.macAddress.length > 0);
    assert.ok(macSerial);
  });

  it('۵. بررسی پایداری عملکرد مالی، فاکتورها، انبارداری و دفاتر کل در پروفایل فروشگاه عمومی', () => {
    const data = foundationStore.getFoundationData();
    assert.strictEqual(data.settings.industryProfileCode, 'RETAIL_GENERAL');
    assert.ok(data.items && data.items.length > 0);
    assert.ok(data.parties && data.parties.length > 0);
    assert.ok(data.warehouses && data.warehouses.length > 0);
    assert.ok(data.bankAccounts && data.bankAccounts.length > 0);

    const trialBalance = foundationStore.getTrialBalance();
    assert.ok(trialBalance.rows.length > 0);
    assert.strictEqual(trialBalance.isBalanced, true);
  });

  it('۶. آزمون اعتبارسنجی ورودی‌های registerIndustryProfile', () => {
    // Missing code or invalid format
    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'invalid code with spaces!',
          titleFa: 'عنوان نامعتبر',
          descriptionFa: '',
          badgeLabelFa: 'نشان',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('کد صنف باید تنها شامل حروف بزرگ')
    );

    // Too short Persian title
    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'SHORT_TITLE_TEST',
          titleFa: 'ک',
          descriptionFa: '',
          badgeLabelFa: 'نشان',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('حداقل ۳ کاراکتر')
    );

    // Too short badge label
    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'SHORT_BADGE_TEST',
          titleFa: 'صنف تستی معتبر',
          descriptionFa: '',
          badgeLabelFa: ' ',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('حداقل ۲ کاراکتر')
    );
  });

  it('۷. آزمون ممانعت قاطع از بازنویسی پروفایل‌های رزروشده سیستم (CCTV_SECURITY و RETAIL_GENERAL)', () => {
    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'CCTV_SECURITY',
          titleFa: 'تلاش مخرب بازنویسی مهرگان',
          descriptionFa: '',
          badgeLabelFa: 'مخرب',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('پروفایل‌های پیش‌فرض و رزروشده')
    );

    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'RETAIL_GENERAL',
          titleFa: 'تلاش مخرب بازنویسی خرده‌فروشی',
          descriptionFa: '',
          badgeLabelFa: 'مخرب',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('پروفایل‌های پیش‌فرض و رزروشده')
    );

    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'SUPERMARKET_GROCERY',
          titleFa: 'تلاش مخرب بازنویسی سوپرمارکت',
          descriptionFa: '',
          badgeLabelFa: 'مخرب',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('پروفایل‌های پیش‌فرض و رزروشده')
    );
  });

  it('۸. آزمون ممانعت از ثبت کد تکراری (Duplicate Prevention)', () => {
    // First registration succeeds
    const profile = foundationStore.registerIndustryProfile({
      code: 'PHARMACY_DRUGSTORE',
      titleFa: 'داروخانه و بهداشتی',
      descriptionFa: 'پروفایل تخصصی اقلام دارویی و بهداشتی',
      badgeLabelFa: 'صنف داروخانه',
      features: {
        enableInstallationServices: false,
        enableHardwareMacTracking: false,
        enableInstallersRole: false,
        enableWarrantyTracking: false,
        enableBarcodeScanQuickPos: true,
      },
    });
    assert.strictEqual(profile.code, 'PHARMACY_DRUGSTORE');

    // Duplicate registration must throw
    assert.throws(
      () => {
        foundationStore.registerIndustryProfile({
          code: 'PHARMACY_DRUGSTORE',
          titleFa: 'تلاش تکراری',
          descriptionFa: '',
          badgeLabelFa: 'تکراری',
          features: {
            enableInstallationServices: false,
            enableHardwareMacTracking: false,
            enableInstallersRole: false,
            enableWarrantyTracking: false,
            enableBarcodeScanQuickPos: true,
          },
        });
      },
      (err: Error) => err.message.includes('قبلاً در سیستم ثبت شده است')
    );
  });

  it('۹. آزمون تفکیک تعریف صنف از فعال‌سازی و رد فعال‌سازی صنف تعریف‌نشده', () => {
    assert.throws(
      () => {
        foundationStore.updateIndustryProfile('UNDEFINED_AIRLINE_CARGO', 1);
      },
      (err: Error) => err.message.includes('در سیستم موجود نیست یا نامعتبر است')
    );
  });

  it('۱۰. آزمون ثبت پایدار صنف سفارشی در دیسک و بازیابی پس از شبیه‌سازی Restart', () => {
    // Register custom profile
    const created = foundationStore.registerIndustryProfile({
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
        enableSizeColorMatrix: true,
      },
      uiLabels: {
        inventoryTabTitleFa: 'پوشاک و البسه',
        serialTrackerTitleFa: 'رهگیری بارکد پوشاک',
      },
    });
    assert.strictEqual(created.code, 'APPAREL_BOUTIQUE');

    // Switch active profile to APPAREL_BOUTIQUE
    const switchResult = foundationStore.updateIndustryProfile('APPAREL_BOUTIQUE', 1);
    assert.strictEqual(switchResult.ok, true);
    assert.strictEqual(switchResult.profile.code, 'APPAREL_BOUTIQUE');

    // Verify directly on disk file that APPAREL_BOUTIQUE was persisted
    const rawDisk = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    const parsedState = JSON.parse(rawDisk);
    assert.ok(Array.isArray(parsedState.customIndustryProfiles));
    const foundOnDisk = parsedState.customIndustryProfiles.find(
      (p: { code: string }) => p.code === 'APPAREL_BOUTIQUE'
    );
    assert.ok(foundOnDisk, 'صنف سفارشی باید روی فایل دیتابیس دیسک ذخیره شده باشد.');
    assert.strictEqual(foundOnDisk.titleFa, 'فروشگاه پوشاک و منسوجات');

    // Simulate Restart by constructing a fresh FoundationStore instance from disk
    const restartedStore = new FoundationStore();
    const restartedProfile = restartedStore.getIndustryProfile();
    assert.strictEqual(
      restartedProfile.code,
      'APPAREL_BOUTIQUE',
      'پس از ری‌استارت، صنف فعال باید همچنان APPAREL_BOUTIQUE باقی مانده باشد.'
    );
    assert.strictEqual(restartedProfile.features.enableSizeColorMatrix, true);
    assert.strictEqual(restartedProfile.uiLabels?.inventoryTabTitleFa, 'پوشاک و البسه');

    const allProfiles = restartedStore.getAllIndustryProfiles();
    assert.ok(allProfiles.some((p) => p.code === 'APPAREL_BOUTIQUE'));
  });

  it('۱۱. آزمون بازیابی امن و تاب‌آوری در برابر تعاریف فاسد یا ناقص در فایل ذخیره‌سازی', () => {
    // Read raw state and inject a corrupt profile (missing title and invalid code)
    const raw = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    const state = JSON.parse(raw);
    state.customIndustryProfiles.push({
      code: 'corrupt!bad',
      titleFa: '', // invalid title
      features: null,
    });
    state.settings.industryProfileCode = 'NON_EXISTENT_GHOST';
    fs.writeFileSync(LOCAL_STATE_DB_FILE, JSON.stringify(state, null, 2), 'utf8');

    // Load store: it must NOT crash, must discard the corrupt profile, and fallback to CCTV_SECURITY
    const safeStore = new FoundationStore();
    const activeProfile = safeStore.getIndustryProfile();
    assert.strictEqual(
      activeProfile.code,
      'CCTV_SECURITY',
      'در صورت وجود صنف نامعتبر، سیستم باید بدون کرش به CCTV_SECURITY فال‌بک کند.'
    );

    const profiles = safeStore.getAllIndustryProfiles();
    assert.ok(!profiles.some((p) => p.code === 'corrupt!bad'));
  });

  it('۱۲. آزمون بازگشت به صنف دوربین مداربسته (CCTV_SECURITY) بدون اتلاف داده‌های قبلی', () => {
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

  it('۱۳. آزمون پذیرش صنف سیستمی سوپرمارکت و مواد غذایی (SUPERMARKET_GROCERY)', () => {
    // 1. Verify existence in system profiles
    const profiles = foundationStore.getAllIndustryProfiles();
    const grocery = profiles.find((p) => p.code === 'SUPERMARKET_GROCERY');
    assert.ok(grocery, 'پروفایل سوپرمارکت باید در لیست اصناف سیستمی موجود باشد.');
    assert.strictEqual(grocery.features.enableBarcodeScanQuickPos, true);
    assert.strictEqual(grocery.features.enableInstallationServices, false);
    assert.strictEqual(grocery.features.enableHardwareMacTracking, false);
    assert.strictEqual(grocery.features.enableInstallersRole, false);

    // 2. Verify supported uiLabels
    assert.strictEqual(grocery.uiLabels?.inventoryTabTitleFa, 'کالاها و اقلام سوپرمارکت');
    assert.strictEqual(grocery.uiLabels?.serialTrackerTitleFa, 'رهگیری بارکد کالا');
    assert.strictEqual(grocery.uiLabels?.partiesInstallerRoleTitleFa, 'پرسنل و متصدیان فروشگاه');

    // 3. Switch to SUPERMARKET_GROCERY
    const switchRes = foundationStore.updateIndustryProfile('SUPERMARKET_GROCERY', 1);
    assert.strictEqual(switchRes.ok, true);
    assert.strictEqual(switchRes.settings.industryProfileCode, 'SUPERMARKET_GROCERY');
    assert.strictEqual(switchRes.profile.code, 'SUPERMARKET_GROCERY');

    // 4. Verify audit log recorded
    const logs = foundationStore.getAuditLogs();
    const log = logs.find((l) => l.action === 'UPDATE_INDUSTRY_PROFILE' && l.targetId === 'SUPERMARKET_GROCERY');
    assert.ok(log, 'تغییر به صنف سوپرمارکت باید در لاگ ممیزی ثبت شود.');

    // 5. Verify retention of existing inventory and financial balance
    const items = foundationStore.getItems();
    assert.ok(items.length > 0);
    const trialBalance = foundationStore.getTrialBalance();
    assert.strictEqual(trialBalance.isBalanced, true);

    // 6. Verify retention of specialized CCTV data in backend
    const jobs = foundationStore.getInstallationJobs();
    assert.ok(jobs.length > 0);
    const projects = foundationStore.getProjects();
    assert.ok(projects.length > 0);

    // 7. Safely restore to CCTV_SECURITY
    const restoreRes = foundationStore.updateIndustryProfile('CCTV_SECURITY', 1);
    assert.strictEqual(restoreRes.ok, true);
    assert.strictEqual(restoreRes.settings.industryProfileCode, 'CCTV_SECURITY');
  });

  it('۱۴. آزمون تطابق ویژگی‌های ماژول فروش و POS در صنف‌های CCTV_SECURITY، RETAIL_GENERAL و SUPERMARKET_GROCERY', () => {
    // 1. CCTV profile: POS active, installation active
    const cctv = foundationStore.getIndustryProfile('CCTV_SECURITY');
    assert.strictEqual(cctv.features.enableBarcodeScanQuickPos, true);
    assert.strictEqual(cctv.features.enableInstallationServices, true);
    assert.strictEqual(cctv.features.enableHardwareMacTracking, true);

    // 2. Retail General profile: POS active, installation disabled
    const retail = foundationStore.getIndustryProfile('RETAIL_GENERAL');
    assert.strictEqual(retail.features.enableBarcodeScanQuickPos, true);
    assert.strictEqual(retail.features.enableInstallationServices, false);
    assert.strictEqual(retail.features.enableHardwareMacTracking, false);

    // 3. Supermarket Grocery profile: POS active, installation disabled
    const grocery = foundationStore.getIndustryProfile('SUPERMARKET_GROCERY');
    assert.strictEqual(grocery.features.enableBarcodeScanQuickPos, true);
    assert.strictEqual(grocery.features.enableInstallationServices, false);
    assert.strictEqual(grocery.features.enableHardwareMacTracking, false);
    assert.strictEqual(grocery.uiLabels?.inventoryTabTitleFa, 'کالاها و اقلام سوپرمارکت');

    // 4. Financial balance integrity confirmed
    const tb = foundationStore.getTrialBalance();
    assert.strictEqual(tb.isBalanced, true);
  });
});
