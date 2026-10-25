import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { foundationStore } from '../src/server/foundationStore';
import { LOCAL_STATE_DB_FILE, DATA_VAULT_DIR } from '../src/server/paths';

describe('آزمون‌های جامع ایمنی پایدارسازی و بازیابی پایگاه داده (Persistence Safety & Recovery)', () => {
  it('۱. پایدارسازی موفق با جایگزینی اتمیک و پاکسازی خودکار فایل‌های موقت (.tmp)', () => {
    const testMessage = `تست پایدارسازی اتمیک - ${Date.now()}`;
    foundationStore.updateSettings({ receiptFooterMessageFa: testMessage });

    // Assert file exists on disk and has valid JSON containing updated data
    assert.ok(fs.existsSync(LOCAL_STATE_DB_FILE), 'فایل اصلی دیتابیس باید در دیسک موجود باشد.');
    const raw = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.settings.receiptFooterMessageFa, testMessage);

    // Verify no orphaned .tmp files remain in .mehregan-data directory
    const files = fs.readdirSync(DATA_VAULT_DIR);
    const orphanedTmpFiles = files.filter((f) => f.includes('.tmp'));
    assert.strictEqual(
      orphanedTmpFiles.length,
      0,
      `هیچ فایل موقت .tmp نباید در پوشه باقی بماند. فایل‌های باقیمانده: ${orphanedTmpFiles.join(', ')}`
    );
  });

  it('۲. مسدودسازی استارتاپ و ممانعت قطعی از رونویسی دیتابیس مخدوش با داده‌های خام دمو', () => {
    // 1. Preserve current valid database
    const validRawContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');

    // 2. Simulate truncated / corrupt JSON in database file (e.g. power loss during write)
    const corruptSnippet = '{"activeSessionUserId": 1, "users": [{"id": 1, "username": "admin", "unclosed": ';
    fs.writeFileSync(LOCAL_STATE_DB_FILE, corruptSnippet, 'utf8');

    try {
      // 3. Attempt to initialize store from corrupted database file -> must throw critical error!
      assert.throws(() => {
        new (foundationStore.constructor as any)();
      }, /مخدوش است|امکان پارس JSON/);

      // 4. CRITICAL INVARIANT: The corrupted file MUST NOT be overwritten with default/demo data!
      const contentAfterFailedInit = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      assert.strictEqual(
        contentAfterFailedInit,
        corruptSnippet,
        'فایل مخدوش نباید با داده‌های پیش‌فرض دمو رونویسی شود؛ باید جهت بازیابی فنی دست‌نخورده باقی بماند.'
      );
    } finally {
      // Restore valid database content
      fs.writeFileSync(LOCAL_STATE_DB_FILE, validRawContent, 'utf8');
    }
  });

  it('۳. توقف بارگذاری در صورت نامعتبر بودن ساختار رکوردهای دیتابیس (فقدان جداول بنیادین)', () => {
    const validRawContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');

    // Write valid JSON but structurally invalid database (missing fundamental users/permissions tables)
    fs.writeFileSync(LOCAL_STATE_DB_FILE, JSON.stringify({ invalidStructure: true, counter: 42 }), 'utf8');

    try {
      assert.throws(() => {
        new (foundationStore.constructor as any)();
      }, /نامعتبر است|آرایه‌های بنیادین/);

      // Verify file was preserved without silent overwrite
      const content = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      assert.ok(content.includes('invalidStructure'));
    } finally {
      fs.writeFileSync(LOCAL_STATE_DB_FILE, validRawContent, 'utf8');
    }
  });

  it('۴. محافظت اتمیک از فایل اصلی دیتابیس و پاکسازی موقت در زمان شکست عملیات جایگزینی (Rename/Write Failure)', () => {
    const validRawContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    const originalFooter = foundationStore.getSettings().receiptFooterMessageFa;

    // Spy on fs.renameSync to simulate filesystem failure during atomic replacement
    const originalRenameSync = fs.renameSync;
    let renameAttempted = false;

    fs.renameSync = (oldPath: fs.PathLike, newPath: fs.PathLike) => {
      renameAttempted = true;
      throw new Error('SIMULATED_ATOMIC_RENAME_FAILURE_DISK_LOCKED');
    };

    try {
      assert.throws(() => {
        foundationStore.updateSettings({ receiptFooterMessageFa: 'UNPERSISTED_RENAME_FAIL' });
      }, /SIMULATED_ATOMIC_RENAME_FAILURE_DISK_LOCKED/);

      assert.ok(renameAttempted, 'عملیات rename باید فراخوانی شده باشد.');

      // Invariant 1: The original valid database file must remain 100% intact and undamaged
      const currentContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      assert.strictEqual(
        currentContent,
        validRawContent,
        'در صورت شکست جابجایی اتمیک، فایل قبلی دیتابیس نباید مخدوش یا پاک شود.'
      );

      // Invariant 2: Temp file must be safely unlinked/cleaned up in catch block
      const files = fs.readdirSync(DATA_VAULT_DIR);
      const orphanedTmp = files.filter((f) => f.includes('.tmp'));
      assert.strictEqual(orphanedTmp.length, 0, 'فایل موقت باید پس از شکست با موفقیت پاکسازی شود.');

      // Invariant 3: In-memory state must be rolled back and not silently retain unpersisted mutation
      const currentSettings = foundationStore.getSettings();
      assert.strictEqual(
        currentSettings.receiptFooterMessageFa,
        originalFooter,
        'وضعیت حافظه (in-memory) باید در صورت شکست rename به آخرین وضعیت پایدار برگردد.'
      );
    } finally {
      fs.renameSync = originalRenameSync;
    }
  });

  it('۵. مقداردهی اولیه امن دیتابیس تنها زمانی که فایل واقعاً در دیسک وجود ندارد', () => {
    const validRawContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');

    // Temporarily remove file to simulate genuinely fresh installation
    fs.unlinkSync(LOCAL_STATE_DB_FILE);
    assert.strictEqual(fs.existsSync(LOCAL_STATE_DB_FILE), false);

    try {
      const freshStore = new (foundationStore.constructor as any)();
      assert.ok(freshStore);

      // File should now be created cleanly
      assert.ok(fs.existsSync(LOCAL_STATE_DB_FILE), 'در نصب تازه، فایل دیتابیس باید به صورت تمیز ایجاد گردد.');
      const freshContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      const parsed = JSON.parse(freshContent);
      assert.ok(Array.isArray(parsed.users) && parsed.users.length > 0);
      assert.ok(Array.isArray(parsed.permissions) && parsed.permissions.length > 0);
    } finally {
      // Restore previous state
      fs.writeFileSync(LOCAL_STATE_DB_FILE, validRawContent, 'utf8');
    }
  });

  it('۶. تزریق خطای writeFileSync: دست‌نخورده ماندن فایل دیسک، انتشار خطا، بازگشت وضعیت حافظه و پاکسازی فایل موقت', () => {
    const validRawContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    const originalFooter = foundationStore.getSettings().receiptFooterMessageFa;

    const originalWriteFileSync = fs.writeFileSync;
    let writeAttempted = false;

    fs.writeFileSync = ((target: any, ...args: any[]) => {
      if (typeof target === 'number') {
        writeAttempted = true;
        throw new Error('SIMULATED_WRITE_SYNC_FAILURE_DISK_FULL');
      }
      return (originalWriteFileSync as any)(target, ...args);
    }) as any;

    try {
      assert.throws(() => {
        foundationStore.updateSettings({ receiptFooterMessageFa: 'UNPERSISTED_DUE_TO_WRITE_ERROR' });
      }, /SIMULATED_WRITE_SYNC_FAILURE_DISK_FULL/);

      assert.ok(writeAttempted, 'عملیات writeFileSync روی فایل موقت باید فراخوانی شده باشد.');

      // Invariant 1: File on disk remains 100% byte-for-byte intact
      const currentContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      assert.strictEqual(
        currentContent,
        validRawContent,
        'فایل قبلی دیتابیس در صورت شکست writeFileSync باید بایت‌به‌بایت دست‌نخورده باقی بماند.'
      );

      // Invariant 2: Temp file safely cleaned up
      const files = fs.readdirSync(DATA_VAULT_DIR);
      const orphanedTmp = files.filter((f) => f.includes('.tmp'));
      assert.strictEqual(orphanedTmp.length, 0, 'فایل‌های موقت .tmp باید پاکسازی شده باشند.');

      // Invariant 3: In-memory state rolled back to prevent silent divergence
      const currentSettings = foundationStore.getSettings();
      assert.strictEqual(
        currentSettings.receiptFooterMessageFa,
        originalFooter,
        'وضعیت حافظه پس از خطای نوشتن باید به مقدار قبلی بازگردد.'
      );
    } finally {
      fs.writeFileSync = originalWriteFileSync;
    }
  });

  it('۷. تزریق خطای fsyncSync: دست‌نخورده ماندن فایل دیسک، انتشار خطا، بازگشت وضعیت حافظه و پاکسازی فایل موقت', () => {
    const validRawContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    const originalFooter = foundationStore.getSettings().receiptFooterMessageFa;

    const originalFsyncSync = fs.fsyncSync;
    let fsyncAttempted = false;

    fs.fsyncSync = ((fd: number) => {
      fsyncAttempted = true;
      throw new Error('SIMULATED_FSYNC_SYNC_IO_ERROR');
    }) as any;

    try {
      assert.throws(() => {
        foundationStore.updateSettings({ receiptFooterMessageFa: 'UNPERSISTED_DUE_TO_FSYNC_ERROR' });
      }, /SIMULATED_FSYNC_SYNC_IO_ERROR/);

      assert.ok(fsyncAttempted, 'عملیات fsyncSync روی فایل موقت باید فراخوانی شده باشد.');

      // Invariant 1: Original database file remains 100% byte-for-byte intact
      const currentContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
      assert.strictEqual(
        currentContent,
        validRawContent,
        'فایل قبلی دیتابیس در صورت شکست fsyncSync باید بایت‌به‌بایت دست‌نخورده باقی بماند.'
      );

      // Invariant 2: Temp file cleaned up
      const files = fs.readdirSync(DATA_VAULT_DIR);
      const orphanedTmp = files.filter((f) => f.includes('.tmp'));
      assert.strictEqual(orphanedTmp.length, 0, 'فایل‌های موقت باید در صورت خطای fsyncSync پاکسازی شوند.');

      // Invariant 3: In-memory state safely rolled back
      const currentSettings = foundationStore.getSettings();
      assert.strictEqual(
        currentSettings.receiptFooterMessageFa,
        originalFooter,
        'وضعیت حافظه پس از خطای fsyncSync باید رول‌بک شود.'
      );
    } finally {
      fs.fsyncSync = originalFsyncSync;
    }
  });

  it('۸. عدم نشت داده‌های مخدوش به ذخیره‌سازی‌های معتبر بعدی (No Ghost State Leakage After Failure)', () => {
    const originalFsyncSync = fs.fsyncSync;
    const ghostPayload = `GHOST_DATA_${Date.now()}`;
    const validPayload = `LEGITIMATE_UPDATE_${Date.now()}`;

    // 1. Simulate failure during ghost mutation attempt
    fs.fsyncSync = () => {
      throw new Error('SIMULATED_TEMPORARY_DISK_GLITCH');
    };

    try {
      assert.throws(() => {
        foundationStore.updateSettings({ receiptFooterMessageFa: ghostPayload });
      }, /SIMULATED_TEMPORARY_DISK_GLITCH/);
    } finally {
      // Restore normal fsyncSync functionality
      fs.fsyncSync = originalFsyncSync;
    }

    // 2. Perform a subsequent legitimate mutation
    foundationStore.updateSettings({ receiptFooterMessageFa: validPayload });

    // 3. Verify disk contains the valid payload and NEVER contains the ghost payload
    const diskContent = fs.readFileSync(LOCAL_STATE_DB_FILE, 'utf8');
    assert.ok(diskContent.includes(validPayload), 'داده معتبر بعدی باید با موفقیت روی دیسک ذخیره شود.');
    assert.strictEqual(
      diskContent.includes(ghostPayload),
      false,
      'داده‌های جهش‌یافته ناموفق قبلی (Ghost Mutation) نباید به دیسک نشت پیدا کنند.'
    );

    // 4. In-memory state matches disk state
    const settings = foundationStore.getSettings();
    assert.strictEqual(settings.receiptFooterMessageFa, validPayload);
  });
});
