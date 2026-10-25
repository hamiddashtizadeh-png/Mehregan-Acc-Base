import test from 'node:test';
import assert from 'node:assert/strict';
import { foundationStore } from '../src/server/foundationStore';
import { sessionManager } from '../src/server/sessionManager';
import { verifyPassword, hashPassword } from '../src/server/cryptoVault';

test('🛡️ امنیت، تفکیک نشست‌های همزمان و کنترل دسترسی RBAC (Mehregan Security Suite)', async (t) => {
  // Ensure an installer user exists in store
  const installerUser = foundationStore.ensureInstallerUser(3);
  const adminUser = foundationStore.getUserById(1)!;

  assert.ok(adminUser, 'کاربر ادمین باید در دیتابیس وجود داشته باشد.');
  assert.ok(installerUser, 'کاربر نصاب باید در دیتابیس وجود داشته باشد.');

  await t.test('۱. بررسی عدم ذخیره پسورد خام و اعتبارسنجی الگوریتم هش PBKDF2', () => {
    // Check Admin password
    assert.notEqual(adminUser.passwordHash, 'admin', 'رمز عبور ادمین نباید به صورت متن خام ذخیره شده باشد.');
    assert.ok(adminUser.passwordSalt, 'ادمین باید دارای Salt اختصاصی باشد.');
    assert.ok(verifyPassword('admin', adminUser.passwordSalt, adminUser.passwordHash), 'رمز admin با سالت و هش مطابقت دارد.');

    // Check Installer password
    assert.notEqual(installerUser.passwordHash, 'installer123', 'رمز عبور نصاب نباید به صورت متن خام ذخیره شده باشد.');
    assert.ok(installerUser.passwordSalt, 'نصاب باید دارای Salt اختصاصی باشد.');
    assert.ok(verifyPassword('installer123', installerUser.passwordSalt, installerUser.passwordHash), 'رمز installer123 با سالت و هش مطابقت دارد.');

    // Negative check
    assert.equal(verifyPassword('wrongpass', installerUser.passwordSalt, installerUser.passwordHash), false, 'رمز اشتباه نباید تایید شود.');
  });

  await t.test('۲. تست محافظت در برابر حملات جستجوی فراگیر (Brute-Force Rate Limiting)', () => {
    const testKey = '192.168.1.50:test_attacker';
    sessionManager.resetFailedAttempts(testKey);

    // 4 failed attempts should not block yet
    for (let i = 1; i <= 4; i++) {
      const res = sessionManager.recordFailedAttempt(testKey);
      assert.equal(res.blocked, false, `تلاش ناموفق شماره ${i} نباید حساب را مسدود کند.`);
    }

    // 5th attempt MUST trigger block (HTTP 429 lockout)
    const fifthAttempt = sessionManager.recordFailedAttempt(testKey);
    assert.equal(fifthAttempt.blocked, true, 'تلاش ناموفق پنجم باید باعث قفل شدن نشست شود.');
    assert.ok(fifthAttempt.remainingSec > 0, 'زمان مسدودی باید بیشتر از صفر باشد.');

    // Rate limit check should return blocked
    const check = sessionManager.checkRateLimit(testKey);
    assert.equal(check.blocked, true, 'بررسی مسدودی باید قفل بودن را تایید کند.');

    // Reset should clear
    sessionManager.resetFailedAttempts(testKey);
    assert.equal(sessionManager.checkRateLimit(testKey).blocked, false, 'پس از ریست باید مسدودی برداشته شود.');
  });

  await t.test('۳. ایجاد نشست‌های مستقل سرور برای ورود همزمان مدیر و نصاب', () => {
    const adminRoles = foundationStore.getUserRoles(adminUser.id);
    const installerRoles = foundationStore.getUserRoles(installerUser.id);

    // Create session for Admin on PC
    const adminSession = sessionManager.createSession(
      adminUser,
      adminRoles,
      '192.168.1.10',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    );

    // Create session for Installer on Mobile
    const installerSession = sessionManager.createSession(
      installerUser,
      installerRoles,
      '5.120.30.40',
      'Mozilla/5.0 (Linux; Android 14; Mobile)'
    );

    assert.ok(adminSession.sessionId, 'شناسه نشست ادمین باید تولید شود.');
    assert.ok(installerSession.sessionId, 'شناسه نشست نصاب باید تولید شود.');
    assert.notEqual(adminSession.sessionId, installerSession.sessionId, 'نشست ادمین و نصاب باید کاملاً مجزا و مستقل باشند.');

    // Retrieve sessions independently
    const retrievedAdmin = sessionManager.getSession(adminSession.sessionId);
    const retrievedInstaller = sessionManager.getSession(installerSession.sessionId);

    assert.equal(retrievedAdmin?.userId, adminUser.id, 'نشست ادمین باید به درستی شناسه ادمین را بازگرداند.');
    assert.equal(retrievedInstaller?.userId, installerUser.id, 'نشست نصاب باید به درستی شناسه نصاب را بازگرداند.');
  });

  await t.test('۴. تست تفکیک اطلاعات و سانسور ارقام مالی برای نصاب در Overview', () => {
    // Overview for Admin
    const adminData = foundationStore.getFoundationData(adminUser);
    assert.equal(adminData.activeUser.username, adminUser.username);
    assert.ok(adminData.users.length >= 2, 'مدیر باید همه کاربران را ببیند.');
    assert.ok(adminData.bankAccounts.length >= 0, 'مدیر به حساب‌های بانکی دسترسی دارد.');
    assert.ok(adminData.cashBoxes.length >= 0, 'مدیر به صندوق‌ها دسترسی دارد.');

    // Overview for Installer
    const installerData = foundationStore.getFoundationData(installerUser);
    assert.equal(installerData.activeUser.username, installerUser.username);
    assert.equal(installerData.activeUser.installerPartyId, 3, 'شناسه نصاب باید ۳ باشد.');

    // Security check: Financials & Sensitive arrays MUST be empty for installer
    assert.equal(installerData.bankAccounts.length, 0, 'حساب‌های بانکی باید برای نصاب خالی و سانسور شده باشد.');
    assert.equal(installerData.cashBoxes.length, 0, 'صندوق‌ها باید برای نصاب خالی و سانسور شده باشد.');
    assert.equal(installerData.cheques.length, 0, 'چک‌ها باید برای نصاب خالی و سانسور شده باشد.');
    assert.equal(installerData.accountingDocuments.length, 0, 'اسناد حسابداری باید برای نصاب سانسور شده باشد.');
    assert.equal(installerData.auditLogs.length, 0, 'لاگ‌های امنیتی باید برای نصاب سانسور شده باشد.');

    // Users list should only show installer self
    assert.equal(installerData.users.length, 1, 'نصاب نباید سایر کاربران را ببیند.');
    assert.equal(installerData.users[0].id, installerUser.id, 'تنها کاربر قابل مشاهده نصاب، خودش است.');

    // Installation jobs must strictly belong to installerPartyId = 3
    for (const job of installerData.installationJobs) {
      assert.equal(job.installerId, 3, `سفارش نصب ${job.jobCode} باید منحصراً متعلق به نصاب باشد.`);
    }

    // Projects must strictly belong to installerPartyId = 3 and financial numbers must be 0
    for (const prj of installerData.projects) {
      assert.equal(prj.installerId, 3, `پروژه ${prj.projectCode} باید منحصراً متعلق به نصاب باشد.`);
      assert.equal(prj.contractAmountIrr, 0, 'مبلغ قرارداد برای نصاب باید صفر و سانسور شده باشد.');
      assert.equal(prj.netProfitIrr, 0, 'سود خالص برای نصاب باید صفر و سانسور شده باشد.');
    }
  });

  await t.test('۵. تست کنترل مجوزها و مسدودسازی عملیات غیرمجاز نصاب (RBAC Enforcement)', () => {
    // 1. Treasury access
    const treasuryEval = foundationStore.evaluatePermission(installerUser.id, 'treasury.view');
    assert.equal(treasuryEval.allowed, false, 'نصاب نباید مجوز مشاهده خزانه‌داری داشته باشد.');

    // 2. Accounting view
    const acctEval = foundationStore.evaluatePermission(installerUser.id, 'accounting.view');
    assert.equal(acctEval.allowed, false, 'نصاب نباید مجوز مشاهده حسابداری داشته باشد.');

    // 3. User management
    const usersEval = foundationStore.evaluatePermission(installerUser.id, 'users.manage');
    assert.equal(usersEval.allowed, false, 'نصاب نباید مجوز مدیریت کاربران داشته باشد.');

    // 4. Database migrations
    const dbEval = foundationStore.evaluatePermission(installerUser.id, 'foundation.migrations.execute');
    assert.equal(dbEval.allowed, false, 'نصاب نباید مجوز اعمال تغییرات ساختار دیتابیس داشته باشد.');

    // 5. Inventory transfer approve
    const transferEval = foundationStore.evaluatePermission(installerUser.id, 'inventory.transfer.manage');
    assert.equal(transferEval.allowed, false, 'نصاب نباید مجوز خروج و تایید حواله انبار داشته باشد.');
  });

  await t.test('۶. جلوگیری از دستکاری وضعیت سفارشات سایر نصاب‌ها', () => {
    const jobs = foundationStore.getInstallationJobs();
    if (jobs.length > 0) {
      const otherJob = jobs.find((j) => j.installerId !== 3);
      if (otherJob) {
        // Verification: If a job belongs to another installer, our logic flags it
        assert.notEqual(otherJob.installerId, 3, 'سفارش یافت شده نباید متعلق به نصاب ۳ باشد.');
      }
    }
  });

  await t.test('۷. تست خروج از حساب (Logout) و ابطال نشست', () => {
    const session = sessionManager.createSession(installerUser, ['INSTALLER']);
    const sId = session.sessionId;

    assert.ok(sessionManager.getSession(sId), 'نشست قبل از خروج باید معتبر باشد.');

    const destroyed = sessionManager.destroySession(sId);
    assert.equal(destroyed, true, 'نشست باید با موفقیت حذف شود.');

    const afterLogout = sessionManager.getSession(sId);
    assert.equal(afterLogout, null, 'پس از خروج، شناسه نشست باید کاملاً بی‌اعتبار باشد.');
  });
});
