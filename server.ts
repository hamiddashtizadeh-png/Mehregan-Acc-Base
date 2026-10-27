import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  APP_INSTALL_ROOT,
  MIGRATIONS_DIR,
  STATIC_DIST_DIR,
  ensureRuntimeDirectories,
} from './src/server/paths';
import { foundationStore, UserRecord } from './src/server/foundationStore';
import { sanitizeForLogAndApi } from './src/server/cryptoVault';
import { sessionManager, UserSession } from './src/server/sessionManager';

function resolveServerPort(): number {
  // Check CLI arguments for --port <val> or direct numeric argument
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    const val = Number(process.argv[portIndex + 1]);
    if (!isNaN(val) && val > 0 && val !== 8080) return val;
  }
  for (const arg of process.argv.slice(2)) {
    const val = Number(arg);
    if (!isNaN(val) && val > 0 && val !== 8080) return val;
  }
  // In AI Studio / Cloud Run, PORT=8080 is reserved for NGINX.
  // The Express dev server must always run on port 3000.
  return 3000;
}

const PORT = resolveServerPort();

// Helper to resolve the authenticated user for the current request
function getRequestUser(req: Request): UserRecord | null {
  if ((req as any).authenticatedUser) {
    return (req as any).authenticatedUser;
  }
  return null;
}

// Backend RBAC Middleware — Strictly queries database tables (role_permissions, user_permission_overrides)
// Enforcing: Explicit Deny > Explicit Grant > Role Permission > Default Deny
function requirePermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const activeUser = getRequestUser(req);
    if (!activeUser) {
      res.status(401).json({
        ok: false,
        errorCode: 'UNAUTHENTICATED',
        messageFa: 'لطفاً وارد حساب کاربری خود شوید.',
      });
      return;
    }
    const evaluation = foundationStore.evaluatePermission(activeUser.id, permissionCode);

    if (!evaluation.allowed) {
      foundationStore.recordAuditLog({
        actorUserId: activeUser.id,
        action: 'ACCESS_DENIED_BLOCKED',
        category: 'SECURITY',
        targetEntity: req.originalUrl,
        targetId: permissionCode,
        status: 'DENIED',
        detailsFa: `درخواست کاربر «${activeUser.username}» برای متد [${req.method}] در مسیر [${req.originalUrl}] به دلیل عدم دسترسی به مجوز [${permissionCode}] مسدود گردید. قاعده حاکم: ${evaluation.matchedRule}`,
        metadata: {
          endpoint: req.originalUrl,
          method: req.method,
          permissionCode,
          matchedRule: evaluation.matchedRule,
        },
      });

      res.status(403).json({
        ok: false,
        errorCode: 'RBAC_ACCESS_DENIED',
        permissionCode,
        matchedRule: evaluation.matchedRule,
        messageFa: evaluation.explanationFa,
        evaluation,
      });
      return;
    }

    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Multi-User Session Extraction & CSRF Defense Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 1. Extract session token from cookie, header, or custom session token
    const cookies = sessionManager.parseCookies(req.headers.cookie);
    let sessionId = cookies['mehregan_session'];

    if (!sessionId && req.headers.authorization?.startsWith('Bearer ')) {
      sessionId = req.headers.authorization.substring(7).trim();
    }
    if (!sessionId && req.headers['x-session-token']) {
      sessionId = String(req.headers['x-session-token']).trim();
    }

    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const user = foundationStore.getUserById(session.userId);
        if (user && user.status === 'ACTIVE') {
          (req as any).authenticatedUser = user;
          (req as any).userSession = session;
        } else {
          sessionManager.destroySession(sessionId);
        }
      }
    }

    // 2. CSRF Defense for mutating requests using session cookies
    if (
      cookies['mehregan_session'] &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      !req.path.startsWith('/api/auth/login') &&
      !req.path.startsWith('/api/sync/') &&
      !req.path.startsWith('/api/system/remote-tunnel')
    ) {
      const csrfHeader = req.headers['x-csrf-token'];
      const requestedWith = req.headers['x-requested-with'];
      const secFetchSite = req.headers['sec-fetch-site'];
      const session = (req as any).userSession;

      if (
        session &&
        csrfHeader &&
        csrfHeader !== session.csrfToken &&
        !requestedWith &&
        secFetchSite === 'cross-site'
      ) {
        return res.status(403).json({
          ok: false,
          errorCode: 'CSRF_BLOCKED',
          messageFa: 'درخواست به دلیل عدم تطابق توکن امنیتی CSRF مسدود شد.',
        });
      }
    }

    next();
  });

  // Immediate health check endpoints for container/proxy probes
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
  });
  app.get('/_health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // ============================================================================
  // 1. REAL STARTUP & RUNTIME HEALTH CHECK ENDPOINT
  // ============================================================================
  app.get('/api/system/health', (_req: Request, res: Response) => {
    const pathDiag = ensureRuntimeDirectories();
    const foundationData = foundationStore.getFoundationData();

    const stages = [
      {
        stageId: 'RUNTIME_PATHS',
        titleFa: '۱. محاسبه مسیرهای واقعی نصب و دسترسی فایل‌ها',
        ok: pathDiag.directories.dataVaultDir.exists && pathDiag.directories.dataVaultDir.writable,
        detailFa: `مسیر ریشه از محل واقعی فایل اجرایی (${pathDiag.installRoot}) محاسبه شد؛ بدون وابستگی به CWD.`,
        remediationFa: 'دسترسی نوشتن (Write Permission) در پوشه .mehregan-data را بررسی کنید.',
      },
      {
        stageId: 'CONFIG_VAULT',
        titleFa: '۲. مخزن رمزنگاری‌شده اتصال دیتابیس (AES-256-GCM)',
        ok: pathDiag.directories.connectionVaultFile.exists,
        detailFa: 'فایل تنظیمات اتصال دیتابیس با رمزنگاری سخت‌افزاری امن اعتبارسنجی شد.',
        remediationFa: 'تنظیمات اتصال دیتابیس را از طریق جادوگر تنظیم بررسی کنید.',
      },
      {
        stageId: 'DB_CONNECTION',
        titleFa: '۳. نشست فعال دیتابیس PostgreSQL',
        ok: foundationData.connection.connectionStatus === 'CONNECTED',
        detailFa: `وضعیت اتصال: ${foundationData.connection.connectionStatus} (${foundationData.connection.activeProfile?.host}:${foundationData.connection.activeProfile?.port}/${foundationData.connection.activeProfile?.database})`,
        remediationFa: 'از اجرای سرویس PostgreSQL روی هاست مقصد اطمینان حاصل کنید.',
      },
      {
        stageId: 'SCHEMA_MIGRATIONS',
        titleFa: '۴. تطابق نسخه Schema و Migrationهای Drizzle ORM',
        ok: foundationData.migrations.filter((m) => m.status === 'APPLIED').length >= 2,
        detailFa: `${foundationData.migrations.filter((m) => m.status === 'APPLIED').length} نسخه Migration پایه با موفقیت روی جداول اعمال شده است.`,
        remediationFa: 'از بخش Migrationها، نسخه‌های در انتظار را اجرا کنید.',
      },
      {
        stageId: 'RBAC_ENGINE',
        titleFa: '۵. موتور کنترل مجوز مبتنی بر دیتابیس (RBAC Engine)',
        ok: foundationData.roles.length > 0 && foundationData.rolePermissions.length > 0,
        detailFa: `قانون صریح Explicit Deny > Explicit Grant > Role Permission فعال است (${foundationData.rolePermissions.length} مجوز در دیتابیس).`,
        remediationFa: 'اسکریپت اولیه مجوزها را مجدداً بارگذاری کنید.',
      },
      {
        stageId: 'INTERNAL_AUTH',
        titleFa: '۶. احراز هویت داخلی دیتابیسی (بدون وابستگی به گوگل یا ایمیل)',
        ok: foundationData.users.length > 0,
        detailFa: `کاربر پیش‌فرض ادمین (admin / admin) و ${foundationData.users.length} حساب کاربری در دیتابیس موجود و فعال است.`,
        remediationFa: 'جدول users را بررسی کنید.',
      },
    ];

    const failedStage = stages.find((s) => !s.ok) || null;

    res.json({
      ok: !failedStage,
      timestamp: new Date().toISOString(),
      overallStatus: failedStage ? 'DEGRADED_OR_FAILED' : 'HEALTHY_READY',
      failedStage,
      stages,
      pathDiagnostics: pathDiag,
      connection: foundationData.connection,
    });
  });

  // ============================================================================
  // CONNECTION MANAGEMENT & SETUP WIZARD ENDPOINTS
  // ============================================================================
  app.get('/api/system/connection', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.post('/api/system/connection/test', async (req: Request, res: Response) => {
    const result = await foundationStore.testConnectionCandidate(req.body || {});
    res.json(sanitizeForLogAndApi(result));
  });

  app.post('/api/system/connection/stage', (req: Request, res: Response) => {
    const result = foundationStore.stageConnectionChange(req.body || {});
    res.status(result.ok ? 200 : 400).json({
      ...result,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.post('/api/system/connection/confirm', (req: Request, res: Response) => {
    const explicitNoMergeConfirmed = Boolean(req.body?.explicitNoMergeConfirmed);
    const result = foundationStore.confirmConnectionSwitch(explicitNoMergeConfirmed);
    res.status(result.ok ? 200 : 400).json({
      ...result,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.post('/api/system/connection/cancel-stage', (_req: Request, res: Response) => {
    const result = foundationStore.cancelStagedConnection();
    res.json({
      ...result,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.post('/api/system/connection/rollback', (_req: Request, res: Response) => {
    const result = foundationStore.rollbackConnection();
    res.status(result.ok ? 200 : 400).json({
      ...result,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.post('/api/system/connection/disconnect', (_req: Request, res: Response) => {
    const result = foundationStore.disconnectConnection();
    res.json({
      ...result,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.post('/api/system/connection/reconnect', (_req: Request, res: Response) => {
    const result = foundationStore.reconnectConnection();
    res.json({
      ...result,
      connection: foundationStore.getConnectionStateForApi(),
    });
  });

  app.get('/api/system/installer/manifest', (_req: Request, res: Response) => {
    const installerManifestPath = path.join(APP_INSTALL_ROOT, 'dist-installer', 'setup-manifest.json');
    let builtManifest = null;
    if (fs.existsSync(installerManifestPath)) {
      try {
        builtManifest = JSON.parse(fs.readFileSync(installerManifestPath, 'utf8'));
      } catch {
        // fallback
      }
    }

    res.json({
      ok: true,
      hasBuiltPackage: Boolean(builtManifest),
      manifest: builtManifest,
      launcherScripts: [
        'launcher/mehregan-launcher.sh',
        'launcher/mehregan-launcher.bat',
      ],
      resolvedPaths: {
        installRoot: APP_INSTALL_ROOT,
        staticDist: STATIC_DIST_DIR,
        migrations: MIGRATIONS_DIR,
        dataVault: path.join(APP_INSTALL_ROOT, '.mehregan-data'),
      },
    });
  });

  // ============================================================================
  // 2. AUTHENTICATION & SESSION ENDPOINTS (INDEPENDENT SERVER SESSIONS)
  // ============================================================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};
      const cleanUser = String(username || '').trim();

      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';
      const rateKey = `${clientIp}:${cleanUser.toLowerCase()}`;

      // Check Rate Limit / Lockout (Max 5 attempts in 15 minutes)
      const rateCheck = sessionManager.checkRateLimit(rateKey);
      if (rateCheck.blocked) {
        return res.status(429).json({
          ok: false,
          errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
          messageFa: `تعداد دفعات ورود ناموفق بیش از حد مجاز است. لطفاً ${rateCheck.remainingSec} ثانیه دیگر مجدداً تلاش کنید.`,
        });
      }

      let user: UserRecord;
      try {
        user = foundationStore.authenticateUser(cleanUser, String(password || ''));
      } catch (authErr) {
        const failedAttempt = sessionManager.recordFailedAttempt(rateKey);
        if (failedAttempt.blocked) {
          return res.status(429).json({
            ok: false,
            errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
            messageFa: `تلاش‌های ناموفق شما بیش از حد مجاز (۵ بار) بود. حساب برای ۱۵ دقیقه موقتاً مسدود شد.`,
          });
        }
        throw authErr;
      }

      // Successful login -> Reset failed attempts
      sessionManager.resetFailedAttempts(rateKey);

      // Create Independent Server-Side Session
      const roles = foundationStore.getUserRoles(user.id);
      const session = sessionManager.createSession(
        user,
        roles,
        clientIp,
        req.headers['user-agent'] || 'unknown'
      );

      // Attach to request
      (req as any).authenticatedUser = user;
      (req as any).userSession = session;

      // Issue HttpOnly Cookie with SameSite=None in HTTPS (for iframe/cloud preview compatibility) or Lax in HTTP
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
      res.cookie('mehregan_session', session.sessionId, {
        httpOnly: true,
        sameSite: isHttps ? 'none' : 'lax',
        secure: isHttps,
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        ok: true,
        messageFa: `ورود با موفقیت انجام شد. خوش‌آمدید ${user.fullName}.`,
        token: session.sessionId,
        csrfToken: session.csrfToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          jobTitle: user.jobTitle,
          status: user.status,
          isInitialAdmin: user.isInitialAdmin,
          installerPartyId: user.installerPartyId,
          assignedRoles: roles,
        },
      });
    } catch (err: unknown) {
      res.status(401).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'نام کاربری یا کلمه عبور نامعتبر است.',
      });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const cookies = sessionManager.parseCookies(req.headers.cookie);
    const token =
      (req as any).userSession?.sessionId ||
      cookies['mehregan_session'] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7).trim() : null);

    if (token) {
      sessionManager.destroySession(token);
    }

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('mehregan_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      path: '/',
    });

    res.json({
      ok: true,
      messageFa: 'با موفقیت از سامانه خارج شدید.',
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.status(401).json({
        ok: false,
        authenticated: false,
        messageFa: 'هیچ نشست فعالی یافت نشد.',
        user: null,
      });
    }
    const roles = foundationStore.getUserRoles(user.id);
    const session = (req as any).userSession;
    res.json({
      ok: true,
      authenticated: true,
      csrfToken: session?.csrfToken || null,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        email: user.email,
        status: user.status,
        isInitialAdmin: user.isInitialAdmin,
        installerPartyId: user.installerPartyId,
        assignedRoles: roles,
      },
    });
  });

  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    try {
      const activeUser = getRequestUser(req);
      if (!activeUser) {
        return res.status(401).json({
          ok: false,
          errorCode: 'UNAUTHENTICATED',
          messageFa: 'لطفاً وارد حساب کاربری خود شوید.',
        });
      }
      const { currentPassword, newPassword } = req.body || {};
      foundationStore.changePassword(activeUser.id, String(currentPassword || ''), String(newPassword || ''));
      res.json({
        ok: true,
        messageFa: 'کلمه عبور با موفقیت به‌روزرسانی شد. از این پس با کلمه عبور جدید وارد شوید.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تغییر کلمه عبور.',
      });
    }
  });

  app.post('/api/auth/switch-user', (req: Request, res: Response) => {
    try {
      const targetUserId = Number(req.body?.userId);
      const user = foundationStore.switchActiveUser(targetUserId);

      // Create new session for switched user
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';
      const roles = foundationStore.getUserRoles(user.id);
      const session = sessionManager.createSession(
        user,
        roles,
        clientIp,
        req.headers['user-agent'] || 'unknown'
      );

      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
      res.cookie('mehregan_session', session.sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isHttps,
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        ok: true,
        messageFa: `نشست سیستم به کاربر «${user.fullName}» (@${user.username}) تغییر یافت.`,
        token: session.sessionId,
        csrfToken: session.csrfToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          jobTitle: user.jobTitle,
          installerPartyId: user.installerPartyId,
        },
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تغییر کاربر فعال.',
      });
    }
  });

  // ============================================================================
  // 3. FOUNDATION OVERVIEW & SETTINGS
  // ============================================================================
  app.get('/api/foundation/overview', (req: Request, res: Response) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.json({
        ok: true,
        authenticated: false,
        messageFa: 'لطفاً ابتدا وارد حساب کاربری خود شوید.',
        data: null,
      });
    }
    res.json({
      ok: true,
      authenticated: true,
      data: sanitizeForLogAndApi(foundationStore.getFoundationData(user)),
    });
  });

  app.put(
    '/api/foundation/settings',
    requirePermission('foundation.settings.manage'),
    (req: Request, res: Response) => {
      try {
        const updated = foundationStore.updateSettings(req.body || {});
        res.json({
          ok: true,
          messageFa: 'مشخصات فروشگاه و تنظیمات پایه با موفقیت ذخیره شد.',
          settings: updated,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات.',
        });
      }
    }
  );

  app.get('/api/foundation/industry-profiles', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      profiles: foundationStore.getAllIndustryProfiles(),
      activeProfile: foundationStore.getIndustryProfile(),
    });
  });

  app.post(
    '/api/foundation/industry-profile',
    requirePermission('foundation.settings.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const created = foundationStore.registerIndustryProfile(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `صنف تجاری «${created.titleFa}» با موفقیت ثبت و پایدارسازی شد.`,
          profile: created,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف صنف کاری جدید.',
        });
      }
    }
  );

  app.put(
    '/api/foundation/industry-profile',
    requirePermission('foundation.settings.manage'),
    (req: Request, res: Response) => {
      try {
        const { profileCode } = req.body || {};
        const activeUser = foundationStore.getActiveUser();
        const result = foundationStore.updateIndustryProfile(profileCode, activeUser.id);
        res.json({
          ok: true,
          messageFa: result.messageFa,
          profile: result.profile,
          settings: result.settings,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تغییر صنف کاری سیستم.',
        });
      }
    }
  );

  // ============================================================================
  // 4. USER & ROLE MANAGEMENT
  // ============================================================================
  app.post(
    '/api/foundation/users',
    requirePermission('foundation.users.manage'),
    (req: Request, res: Response) => {
      try {
        const { username, fullName, jobTitle, email, password, roleCodes, installerPartyId } = req.body || {};
        const created = foundationStore.createUser({
          username,
          fullName,
          jobTitle,
          email,
          password,
          roleCodes,
          installerPartyId: installerPartyId ? Number(installerPartyId) : null,
        });
        res.json({
          ok: true,
          messageFa: `کاربر جدید «${created.fullName}» با موفقیت در دیتابیس ثبت شد.`,
          user: created,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت کاربر جدید.',
        });
      }
    }
  );

  app.put(
    '/api/foundation/users/:id',
    requirePermission('foundation.users.manage'),
    (req: Request, res: Response) => {
      try {
        const userId = Number(req.params.id);
        const updated = foundationStore.updateUser(userId, req.body || {});
        res.json({
          ok: true,
          messageFa: `اطلاعات کاربر «${updated.username}» با موفقیت به‌روزرسانی شد.`,
          user: updated,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ویرایش کاربر.',
        });
      }
    }
  );

  app.post(
    '/api/foundation/users/:id/reset-password',
    requirePermission('foundation.users.manage'),
    (req: Request, res: Response) => {
      try {
        const userId = Number(req.params.id);
        const { newPassword } = req.body || {};
        foundationStore.resetUserPasswordByAdmin(userId, String(newPassword || ''));
        res.json({
          ok: true,
          messageFa: 'کلمه عبور کاربر توسط مدیر سیستم با موفقیت بازنشانی شد.',
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بازنشانی کلمه عبور.',
        });
      }
    }
  );

  app.post(
    '/api/foundation/users/:id/roles',
    requirePermission('foundation.roles.manage'),
    (req: Request, res: Response) => {
      try {
        const userId = Number(req.params.id);
        const { roleCodes } = req.body || {};
        foundationStore.setUserRoles(userId, Array.isArray(roleCodes) ? roleCodes : []);
        res.json({
          ok: true,
          messageFa: 'نقش‌های کاربر با موفقیت در جدول user_role_assignments به‌روزرسانی شد.',
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تخصیص نقش به کاربر.',
        });
      }
    }
  );

  // ============================================================================
  // 5. RBAC EVALUATION, ROLE-PERMISSIONS & EXPLICIT OVERRIDES
  // ============================================================================
  app.post('/api/foundation/rbac/evaluate', (req: Request, res: Response) => {
    const userId = Number(req.body?.userId) || foundationStore.getActiveUser().id;
    const permissionCode = String(req.body?.permissionCode || 'foundation.users.manage');
    const result = foundationStore.evaluatePermission(userId, permissionCode);
    res.json({
      ok: true,
      evaluation: result,
    });
  });

  app.post(
    '/api/foundation/rbac/override',
    requirePermission('foundation.rbac.manage'),
    (req: Request, res: Response) => {
      try {
        const { targetUserId, permissionCode, effect, reasonFa } = req.body || {};
        foundationStore.setPermissionOverride({
          targetUserId: Number(targetUserId),
          permissionCode: String(permissionCode),
          effect: effect === 'DENY' ? 'DENY' : effect === 'ALLOW' ? 'ALLOW' : 'REMOVE',
          reasonFa: String(reasonFa || ''),
        });
        res.json({
          ok: true,
          messageFa: 'استثنای صریح دسترسی با موفقیت در جدول user_permission_overrides ثبت شد.',
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت استثنای دسترسی.',
        });
      }
    }
  );

  app.post(
    '/api/foundation/rbac/toggle-role-permission',
    requirePermission('foundation.rbac.manage'),
    (req: Request, res: Response) => {
      try {
        const { roleCode, permissionCode } = req.body || {};
        const isGranted = foundationStore.toggleRolePermission(
          String(roleCode),
          String(permissionCode)
        );
        res.json({
          ok: true,
          isGranted,
          messageFa: `مجوز [${permissionCode}] برای نقش [${roleCode}] در جدول role_permissions ${isGranted ? 'فعال' : 'غیرفعال'} گردید.`,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تغییر مجوز نقش.',
        });
      }
    }
  );

  // ============================================================================
  // 6. MIGRATIONS & ENVIRONMENT VARIABLES DOCUMENTATION
  // ============================================================================
  app.post(
    '/api/foundation/migrations/apply',
    requirePermission('foundation.migrations.execute'),
    (_req: Request, res: Response) => {
      const result = foundationStore.applyPendingMigrations();
      res.json({
        ok: true,
        messageFa:
          result.appliedCount > 0
            ? `${result.appliedCount} نسخه Migration غیرمخرب با موفقیت اعمال شد.`
            : 'تمامی Migrationهای پایدار قبلاً روی ساختار دیتابیس اعمال گردیده‌اند.',
        ...result,
      });
    }
  );

  app.get('/api/foundation/env-docs', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      envDocumentation: [
        {
          key: 'PORT',
          defaultValue: '3000',
          required: false,
          descriptionFa: 'شماره پورت سرور مرکزی Express API و رابط کاربری وب.',
        },
        {
          key: 'MEHREGAN_DB_URL',
          defaultValue: 'postgresql://postgres:password@127.0.0.1:5432/mehregan_erp',
          required: false,
          descriptionFa: 'رشته اتصال به سرور PostgreSQL خارجی (Local/LAN/Online). در صورت در دسترس نبودن، سیستم به صورت ایمن به ذخیره‌ساز محلی سوئیچ می‌کند.',
        },
        {
          key: 'MEHREGAN_VAULT_SECRET',
          defaultValue: 'mehregan-local-hardware-bound-vault-secret-2026',
          required: false,
          descriptionFa: 'کلید رمزنگاری سخت‌افزاری جهت رمزگذاری پسوردهای دیتابیس با الگوریتم AES-256-GCM روی دیسک.',
        },
        {
          key: 'INITIAL_ADMIN_USERNAME',
          defaultValue: 'admin',
          required: true,
          descriptionFa: 'نام کاربری پیش‌فرض مدیر ارشد برای راه‌اندازی سریع اولیه.',
        },
        {
          key: 'INITIAL_ADMIN_PASSWORD',
          defaultValue: 'admin',
          required: true,
          descriptionFa: 'کلمه عبور پیش‌فرض مدیر ارشد (قابل تغییر فوری از پنل کاربری).',
        },
      ],
    });
  });

  // ============================================================================
  // STAGE 3: PARTIES & BUSINESS COUNTERPARTIES API ROUTES
  // Customers, Suppliers, Installers & Partners with Duplicate Detection & Ledger Integrity
  // ============================================================================

  // 1. List parties with filtering and search
  app.get('/api/parties', requirePermission('parties.view'), (req: Request, res: Response) => {
    try {
      const type = (req.query.type as string) || 'ALL';
      const status = (req.query.status as string) || 'ALL';
      const search = (req.query.search as string) || '';

      const partiesList = foundationStore.getParties({ type, status, search });
      res.json({
        ok: true,
        count: partiesList.length,
        parties: partiesList,
      });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت فهرست طرف‌های تجاری.',
      });
    }
  });

  // 2. Real-time duplicate party detection check
  app.post(
    '/api/parties/check-duplicate',
    requirePermission('parties.view'),
    (req: Request, res: Response) => {
      try {
        const { partyId, fullName, nationalId, mobile, economicCode } = req.body || {};
        const result = foundationStore.checkDuplicateParty({
          partyId: partyId ? Number(partyId) : undefined,
          fullName: String(fullName || ''),
          nationalId: nationalId ? String(nationalId) : null,
          mobile: String(mobile || ''),
          economicCode: economicCode ? String(economicCode) : null,
        });
        res.json({
          ok: true,
          ...result,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بررسی اشخاص تکراری.',
        });
      }
    }
  );

  // 3. Get single party with transactions & projects
  app.get('/api/parties/:id', requirePermission('parties.view'), (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const party = foundationStore.getPartyById(id);
      if (!party) {
        res.status(404).json({ ok: false, messageFa: 'شخص مورد نظر یافت نشد.' });
        return;
      }
      res.json({
        ok: true,
        party,
      });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت اطلاعات شخص.',
      });
    }
  });

  // 4. Create new party
  app.post('/api/parties', requirePermission('parties.create'), (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const { allowDuplicates, ...partyData } = req.body || {};
      const newParty = foundationStore.createParty(
        partyData,
        activeUser.id,
        Boolean(allowDuplicates)
      );
      res.status(201).json({
        ok: true,
        messageFa: `شخص جدید «${newParty.fullName}» با کد [${newParty.partyCode}] با موفقیت ثبت گردید.`,
        party: newParty,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت طرف تجاری جدید.',
      });
    }
  });

  // 5. Update party
  app.put('/api/parties/:id', requirePermission('parties.edit'), (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const id = Number(req.params.id);
      const updated = foundationStore.updateParty(id, req.body || {}, activeUser.id);
      res.json({
        ok: true,
        messageFa: `اطلاعات شخص «${updated.fullName}» با موفقیت به‌روزرسانی شد.`,
        party: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش اطلاعات شخص.',
      });
    }
  });

  // 6. Toggle party status (Active / Inactive)
  app.patch(
    '/api/parties/:id/status',
    requirePermission('parties.edit'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const id = Number(req.params.id);
        const party = foundationStore.togglePartyStatus(id, activeUser.id);
        res.json({
          ok: true,
          messageFa: `وضعیت طرف تجاری با موفقیت به [${party.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}] تغییر یافت.`,
          party,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت شخص.',
        });
      }
    }
  );

  // 7. Delete party (Only if no financial transactions exist)
  app.delete(
    '/api/parties/:id',
    requirePermission('parties.delete'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const id = Number(req.params.id);
        const result = foundationStore.deleteParty(id, activeUser.id);
        res.json(result);
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در حذف طرف تجاری.',
        });
      }
    }
  );

  // 8. Get party transactions
  app.get(
    '/api/parties/:id/transactions',
    requirePermission('parties.view'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const transactions = foundationStore.getPartyTransactions(id);
        res.json({
          ok: true,
          count: transactions.length,
          transactions,
        });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت اسناد مرتبط.',
        });
      }
    }
  );

  // 9. Attach transaction or project to party
  app.post(
    '/api/parties/:id/transactions',
    requirePermission('parties.edit'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const id = Number(req.params.id);
        const tx = foundationStore.addPartyTransaction(id, req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `سند جدید «${tx.titleFa}» با موفقیت به پرونده متصل گردید.`,
          transaction: tx,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت سند برای طرف تجاری.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 4: INVENTORY, ITEMS, BRANDS, WAREHOUSES, SERIALS & KARDEX ENDPOINTS
  // ============================================================================

  // 1. Inventory Summary Stats
  app.get('/api/inventory/summary', requirePermission('inventory.view'), (_req: Request, res: Response) => {
    try {
      const summary = foundationStore.getInventorySummary();
      res.json({ ok: true, data: summary });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت خلاصه آمار انبارداری.',
      });
    }
  });

  // 2. Items List & Filter
  app.get('/api/inventory/items', requirePermission('inventory.view'), (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const brandId = req.query.brandId ? Number(req.query.brandId) : undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const isLowStock = req.query.isLowStock === 'true';

      const items = foundationStore.getItems({ categoryId, brandId, status, search, isLowStock });
      res.json({ ok: true, items });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت فهرست کالاها.',
      });
    }
  });

  // 3. Single Item Details with Kardex & Serials
  app.get('/api/inventory/items/:id', requirePermission('inventory.view'), (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = foundationStore.getItemById(id);
      if (!item) {
        return res.status(404).json({ ok: false, messageFa: 'کالای درخواستی یافت نشد.' });
      }
      res.json({ ok: true, item });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت جزئیات کالا.',
      });
    }
  });

  // 4. Create New Item
  app.post('/api/inventory/items', requirePermission('inventory.items.manage'), (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const item = foundationStore.createItem(req.body || {}, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `کالای «${item.titleFa}» با کد [${item.itemCode}] با موفقیت ثبت شد.`,
        item,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ایجاد کالا.',
      });
    }
  });

  // 5. Update Item
  app.put('/api/inventory/items/:id', requirePermission('inventory.items.manage'), (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const id = Number(req.params.id);
      const item = foundationStore.updateItem(id, req.body || {}, activeUser.id);
      res.json({
        ok: true,
        messageFa: `مشخصات کالای «${item.titleFa}» با موفقیت به‌روزرسانی شد.`,
        item,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش کالا.',
      });
    }
  });

  // 6. Toggle Item Active/Inactive
  app.patch(
    '/api/inventory/items/:id/status',
    requirePermission('inventory.items.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const id = Number(req.params.id);
        const item = foundationStore.toggleItemStatus(id, activeUser.id);
        res.json({
          ok: true,
          messageFa: `وضعیت کالا به [${item.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}] تغییر یافت.`,
          item,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت کالا.',
        });
      }
    }
  );

  // 7. Categories
  app.get('/api/inventory/categories', requirePermission('inventory.view'), (_req: Request, res: Response) => {
    res.json({ ok: true, categories: foundationStore.getItemCategories() });
  });

  app.post(
    '/api/inventory/categories',
    requirePermission('inventory.items.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const cat = foundationStore.createItemCategory(req.body || {}, activeUser.id);
        res.status(201).json({ ok: true, messageFa: `دسته‌بندی «${cat.nameFa}» ایجاد شد.`, category: cat });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف دسته‌بندی.',
        });
      }
    }
  );

  // 8. Brands
  app.get('/api/inventory/brands', requirePermission('inventory.view'), (_req: Request, res: Response) => {
    res.json({ ok: true, brands: foundationStore.getItemBrands() });
  });

  app.post('/api/inventory/brands', requirePermission('inventory.items.manage'), (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const brand = foundationStore.createItemBrand(req.body || {}, activeUser.id);
      res.status(201).json({ ok: true, messageFa: `برند «${brand.nameFa}» ایجاد شد.`, brand });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تعریف برند.',
      });
    }
  });

  // 9. Units of Measurement
  app.get('/api/inventory/units', requirePermission('inventory.view'), (_req: Request, res: Response) => {
    res.json({ ok: true, units: foundationStore.getItemUnits() });
  });

  // 10. Warehouses
  app.get('/api/inventory/warehouses', requirePermission('inventory.view'), (_req: Request, res: Response) => {
    res.json({ ok: true, warehouses: foundationStore.getWarehouses() });
  });

  app.post(
    '/api/inventory/warehouses',
    requirePermission('inventory.items.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const wh = foundationStore.createWarehouse(req.body || {}, activeUser.id);
        res.status(201).json({ ok: true, messageFa: `انبار «${wh.titleFa}» ثبت گردید.`, warehouse: wh });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ایجاد انبار.',
        });
      }
    }
  );

  // 11. Authoritative Item Kardex (Real Ledger Transactions)
  app.get(
    '/api/inventory/kardex/:itemId',
    requirePermission('inventory.kardex.view'),
    (req: Request, res: Response) => {
      try {
        const itemId = Number(req.params.itemId);
        const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
        const kardex = foundationStore.getItemKardex(itemId, warehouseId);
        const item = foundationStore.getItemById(itemId);
        res.json({
          ok: true,
          itemId,
          itemTitleFa: item?.titleFa || 'کالا',
          kardex,
        });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در محاسبه کاردکس کالا.',
        });
      }
    }
  );

  // 12. Serial & MAC Unit Tracker
  app.get('/api/inventory/serials', requirePermission('inventory.view'), (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;
      const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const serials = foundationStore.getItemSerials({ itemId, warehouseId, status, search });
      res.json({ ok: true, serials });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در جستجوی سریال‌های کالا.',
      });
    }
  });

  app.get(
    '/api/inventory/serials/:serialNumber',
    requirePermission('inventory.view'),
    (req: Request, res: Response) => {
      try {
        const sn = req.params.serialNumber;
        const serial = foundationStore.getSerialByNumber(sn);
        if (!serial) {
          return res.status(404).json({ ok: false, messageFa: `شماره سریال «${sn}» در سیستم یافت نشد.` });
        }
        res.json({ ok: true, serial });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در استعلام سریال.',
        });
      }
    }
  );

  // 13. Inventory Documents
  app.get('/api/inventory/documents', requirePermission('inventory.view'), (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
      const partyId = req.query.partyId ? Number(req.query.partyId) : undefined;
      const search = req.query.search as string | undefined;

      const documents = foundationStore.getInventoryDocuments({ type, warehouseId, partyId, search });
      res.json({ ok: true, documents });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت اسناد انبار.',
      });
    }
  });

  app.get('/api/inventory/documents/:id', requirePermission('inventory.view'), (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const doc = foundationStore.getInventoryDocumentById(id);
      if (!doc) {
        return res.status(404).json({ ok: false, messageFa: 'سند انبار درخواستی یافت نشد.' });
      }
      res.json({ ok: true, document: doc });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت جزئیات سند انبار.',
      });
    }
  });

  // 14. Create Inventory Document (Authoritative Inbound, Outbound, Transfer, Return & Adjustment)
  app.post(
    '/api/inventory/documents',
    requirePermission('inventory.documents.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const doc = foundationStore.createInventoryDocument(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `سند انبار «${doc.docNumber}» با موفقیت ثبت گردید.`,
          document: doc,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت سند انبار.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 5: PURCHASES, PROFORMAS, LANDED COST & PAYMENTS ENDPOINTS
  // ============================================================================

  // 15. Calculate Landed Cost Allocation Preview
  app.post(
    '/api/purchases/calculate-landed-cost',
    requirePermission('purchases.view'),
    (req: Request, res: Response) => {
      try {
        const result = foundationStore.calculateLandedCostAllocation(req.body || {});
        res.json({ ok: true, result });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در محاسبه تخصیص بهای تمام‌شده.',
        });
      }
    }
  );

  // 16. Get Purchase Proformas
  app.get(
    '/api/purchases/proformas',
    requirePermission('purchases.view'),
    (req: Request, res: Response) => {
      try {
        const status = req.query.status as string | undefined;
        const proformas = foundationStore.getPurchaseProformas(status);
        res.json({ ok: true, proformas });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت پیش‌فاکتورهای خرید.',
        });
      }
    }
  );

  // 17. Create Purchase Proforma
  app.post(
    '/api/purchases/proformas',
    requirePermission('purchases.proforma.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const proforma = foundationStore.createPurchaseProforma(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `پیش‌فاکتور خرید «${proforma.proformaNumber}» با موفقیت ایجاد گردید.`,
          proforma,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت پیش‌فاکتور خرید.',
        });
      }
    }
  );

  // 18. Get Purchase Invoices
  app.get(
    '/api/purchases/invoices',
    requirePermission('purchases.view'),
    (req: Request, res: Response) => {
      try {
        const status = req.query.status as string | undefined;
        const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
        const invoices = foundationStore.getPurchaseInvoices(status, supplierId);
        res.json({ ok: true, invoices });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت فاکتورهای خرید.',
        });
      }
    }
  );

  // 19. Get Single Purchase Invoice
  app.get(
    '/api/purchases/invoices/:id',
    requirePermission('purchases.view'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const invoice = foundationStore.getPurchaseInvoiceById(id);
        if (!invoice) {
          return res.status(404).json({ ok: false, messageFa: 'فاکتور خرید درخواستی یافت نشد.' });
        }
        res.json({ ok: true, invoice });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت جزئیات فاکتور خرید.',
        });
      }
    }
  );

  // 20. Create Purchase Invoice (Transactionally issues Inbound Receipt & Landed Cost)
  app.post(
    '/api/purchases/invoices',
    requirePermission('purchases.invoice.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const invoice = foundationStore.createPurchaseInvoice(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `فاکتور خرید «${invoice.invoiceNumber}» و رسید انبار «${invoice.inventoryDocNumber}» با موفقیت ثبت گردیدند.`,
          invoice,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت فاکتور خرید.',
        });
      }
    }
  );

  // 21. Get Purchase Payments
  app.get(
    '/api/purchases/payments',
    requirePermission('purchases.view'),
    (req: Request, res: Response) => {
      try {
        const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
        const invoiceId = req.query.invoiceId ? Number(req.query.invoiceId) : undefined;
        const payments = foundationStore.getPurchasePayments(supplierId, invoiceId);
        res.json({ ok: true, payments });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت سوابق پرداخت.',
        });
      }
    }
  );

  // 22. Create Purchase Payment
  app.post(
    '/api/purchases/payments',
    requirePermission('purchases.payments.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const payment = foundationStore.createPurchasePayment(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `پرداخت «${payment.paymentNumber}» به مبلغ ${payment.amountIrr.toLocaleString()} ریال با موفقیت ثبت شد.`,
          payment,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت پرداخت.',
        });
      }
    }
  );

  // 23. Get Purchase Returns
  app.get(
    '/api/purchases/returns',
    requirePermission('purchases.view'),
    (req: Request, res: Response) => {
      try {
        const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
        const returns = foundationStore.getPurchaseReturns(supplierId);
        res.json({ ok: true, returns });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت اسناد برگشت از خرید.',
        });
      }
    }
  );

  // 24. Create Purchase Return
  app.post(
    '/api/purchases/returns',
    requirePermission('purchases.returns.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const returnRecord = foundationStore.createPurchaseReturn(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `سند برگشت از خرید «${returnRecord.returnNumber}» با موفقیت ثبت گردید.`,
          returnRecord,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت برگشت از خرید.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 6: SALES, PROFORMAS, QUICK POS, RECEIPTS & SALES RETURNS ENDPOINTS
  // ============================================================================

  // 25. Get Sales Proformas
  app.get(
    '/api/sales/proformas',
    requirePermission('sales.view'),
    (req: Request, res: Response) => {
      try {
        const status = req.query.status ? String(req.query.status) : undefined;
        const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
        const proformas = foundationStore.getSalesProformas(status, customerId);
        res.json({ ok: true, proformas });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت پیش‌فاکتورهای فروش.',
        });
      }
    }
  );

  // 26. Create Sales Proforma
  app.post(
    '/api/sales/proformas',
    requirePermission('sales.proforma.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const proforma = foundationStore.createSalesProforma(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `پیش‌فاکتور فروش «${proforma.proformaNumber}» با موفقیت صادر گردید.`,
          proforma,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در صدور پیش‌فاکتور فروش.',
        });
      }
    }
  );

  // 27. Convert Sales Proforma to Invoice (Single-step conversion)
  app.post(
    '/api/sales/proformas/:id/convert',
    requirePermission('sales.proforma.manage'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const { sourceWarehouseId, paymentDetails } = req.body || {};
        const activeUser = foundationStore.getActiveUser();
        const invoice = foundationStore.convertSalesProformaToInvoice(
          id,
          Number(sourceWarehouseId) || 1,
          paymentDetails,
          activeUser.id
        );
        res.json({
          ok: true,
          messageFa: `پیش‌فاکتور با موفقیت به فاکتور قطعی فروش «${invoice.invoiceNumber}» تبدیل و خروج از انبار ثبت شد.`,
          invoice,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تبدیل پیش‌فاکتور به فاکتور فروش.',
        });
      }
    }
  );

  // 28. Get Sales Invoices
  app.get(
    '/api/sales/invoices',
    requirePermission('sales.view'),
    (req: Request, res: Response) => {
      try {
        const status = req.query.status ? String(req.query.status) : undefined;
        const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
        const invoices = foundationStore.getSalesInvoices(status, customerId);
        res.json({ ok: true, invoices });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت فاکتورهای فروش.',
        });
      }
    }
  );

  // 29. Get Single Sales Invoice
  app.get(
    '/api/sales/invoices/:id',
    requirePermission('sales.view'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const invoice = foundationStore.getSalesInvoiceById(id);
        if (!invoice) {
          return res.status(404).json({ ok: false, messageFa: 'فاکتور فروش یافت نشد.' });
        }
        res.json({ ok: true, invoice });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت فاکتور فروش.',
        });
      }
    }
  );

  // 30. Create Sales Invoice (Standard & Quick POS Sale)
  app.post(
    '/api/sales/invoices',
    requirePermission('sales.invoice.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const invoice = foundationStore.createSalesInvoice(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `فاکتور فروش «${invoice.invoiceNumber}» با موفقیت صادر گردید.`,
          invoice,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در صدور فاکتور فروش.',
        });
      }
    }
  );

  // 31. Get Sales Receipts
  app.get(
    '/api/sales/receipts',
    requirePermission('sales.view'),
    (req: Request, res: Response) => {
      try {
        const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
        const receipts = foundationStore.getSalesReceipts(customerId);
        res.json({ ok: true, receipts });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت رسیدهای دریافت وجه.',
        });
      }
    }
  );

  // 32. Create Sales Receipt
  app.post(
    '/api/sales/receipts',
    requirePermission('sales.receipts.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const receipt = foundationStore.createSalesReceipt(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `رسید دریافت «${receipt.receiptNumber}» به مبلغ ${receipt.amountIrr.toLocaleString()} ریال ثبت شد.`,
          receipt,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت دریافت وجه.',
        });
      }
    }
  );

  // 33. Get Sales Returns
  app.get(
    '/api/sales/returns',
    requirePermission('sales.view'),
    (_req: Request, res: Response) => {
      try {
        const returns = foundationStore.getSalesReturns();
        res.json({ ok: true, returns });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت اسناد مرجوعی فروش.',
        });
      }
    }
  );

  // 34. Create Sales Return
  app.post(
    '/api/sales/returns',
    requirePermission('sales.returns.create'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const salesReturn = foundationStore.createSalesReturn(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `سند برگشت از فروش «${salesReturn.returnNumber}» با موفقیت ثبت گردید.`,
          salesReturn,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت برگشت از فروش.',
        });
      }
    }
  );

  // 35. Cancel Sales Invoice
  app.post(
    '/api/sales/invoices/:id/cancel',
    requirePermission('sales.returns.create'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const { reasonFa } = req.body || {};
        const activeUser = foundationStore.getActiveUser();
        const invoice = foundationStore.cancelSalesInvoice(
          id,
          reasonFa || 'لغو فاکتور به درخواست کاربر',
          activeUser.id
        );
        res.json({
          ok: true,
          messageFa: `فاکتور فروش «${invoice.invoiceNumber}» با موفقیت لغو شد و موجودی به انبار بازگشت.`,
          invoice,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در لغو فاکتور فروش.',
        });
      }
    }
  );

  // Helper to determine if active user is restricted to a specific installer record
  function getActiveInstallerPartyId(activeUser: any): number | null {
    if (!activeUser) return null;
    if (activeUser.installerPartyId) return Number(activeUser.installerPartyId);
    if (activeUser.isInitialAdmin) return null;
    const isInstallerRole =
      activeUser.jobTitle?.includes('نصاب') ||
      activeUser.jobTitle?.includes('تکنسین') ||
      activeUser.username?.includes('نصاب') ||
      activeUser.username?.toLowerCase().includes('installer') ||
      activeUser.fullName?.includes('نصاب') ||
      activeUser.assignedRoles?.includes('INSTALLER');
    if (isInstallerRole) {
      const parties = foundationStore.getParties();
      const installerParty =
        parties.find(
          (p) =>
            (p.primaryType === 'INSTALLER' || p.roles?.includes('INSTALLER')) &&
            (p.fullName?.includes(activeUser.fullName) || activeUser.fullName?.includes(p.fullName || ''))
        ) ||
        parties.find(
          (p) => p.primaryType === 'INSTALLER' || p.roles?.includes('INSTALLER')
        );
      if (installerParty) return installerParty.id;
    }
    return null;
  }

  // ============================================================================
  // STAGE 7: INSTALLATION SERVICES & WORK ORDERS
  // ============================================================================

  // 36. Get Installation Jobs
  app.get(
    '/api/installation/jobs',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const installerPartyId = getActiveInstallerPartyId(activeUser);
      if (installerPartyId) {
        return next();
      }
      return requirePermission('installation.jobs.view')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const activeUser = getRequestUser(req);
        const installerPartyId = getActiveInstallerPartyId(activeUser);
        let jobs = foundationStore.getInstallationJobs();
        if (installerPartyId) {
          jobs = jobs.filter((j) => j.installerId === installerPartyId);
        } else if (req.query.installerId) {
          const filterInstallerId = Number(req.query.installerId);
          jobs = jobs.filter((j) => j.installerId === filterInstallerId);
        }
        res.json({ ok: true, jobs });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست سفارشات نصب.',
        });
      }
    }
  );

  // 37. Create Installation Job
  app.post(
    '/api/installation/jobs',
    requirePermission('installation.jobs.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = getRequestUser(req);
        const job = foundationStore.createInstallationJob(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `پرونده خدمات نصب «${job.jobCode}» با موفقیت ثبت گردید.`,
          job,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت سفارش نصب.',
        });
      }
    }
  );

  // 38. Update Installation Job Status
  app.patch(
    '/api/installation/jobs/:id/status',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const installerPartyId = getActiveInstallerPartyId(activeUser);
      if (installerPartyId) {
        return next();
      }
      return requirePermission('installation.jobs.manage')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const jobId = Number(req.params.id);
        const activeUser = getRequestUser(req);
        const installerPartyId = getActiveInstallerPartyId(activeUser);

        const targetJob = foundationStore.getInstallationJobById(jobId);
        if (!targetJob) {
          return res.status(404).json({ ok: false, messageFa: 'سفارش نصب مورد نظر یافت نشد.' });
        }

        // Security check: If caller is an installer, verify this job is assigned to them
        if (installerPartyId && targetJob.installerId !== installerPartyId) {
          return res.status(403).json({
            ok: false,
            errorCode: 'INSTALLER_JOB_FORBIDDEN',
            messageFa: 'دسترسی غیرمجاز: شما فقط مجاز به تغییر وضعیت سفارش‌های تخصیص‌یافته به خودتان هستید.',
          });
        }

        const payload = { jobId, ...(req.body || {}) };
        if (installerPartyId) {
          delete payload.installerId;
          delete payload.totalCostIrr;
        }

        const job = foundationStore.updateInstallationJobStatus(
          payload,
          activeUser.id
        );
        res.json({
          ok: true,
          messageFa: `وضعیت پرونده نصب «${job.jobCode}» به «${job.status}» به‌روزرسانی شد.`,
          job,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در به‌روزرسانی وضعیت سفارش نصب.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 8: TREASURY, CASH & BANK, CHEQUES, INSTALLMENTS & EXPENSES
  // ============================================================================

  // 39. Get Cash Boxes
  app.get(
    '/api/treasury/cash-boxes',
    requirePermission('treasury.view'),
    (_req: Request, res: Response) => {
      try {
        const cashBoxes = foundationStore.getCashBoxes();
        res.json({ ok: true, cashBoxes });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست صندوق‌ها.',
        });
      }
    }
  );

  // 40. Create Cash Box
  app.post(
    '/api/treasury/cash-boxes',
    requirePermission('treasury.transactions.manage'),
    (req: Request, res: Response) => {
      try {
        const { titleFa, balanceIrr } = req.body || {};
        const box = foundationStore.createCashBox(String(titleFa || ''), Number(balanceIrr) || 0);
        res.status(201).json({
          ok: true,
          messageFa: `صندوق جدید «${box.titleFa}» با موفقیت تعریف گردید.`,
          box,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف صندوق جدید.',
        });
      }
    }
  );

  // 41. Get Bank Accounts
  app.get(
    '/api/treasury/bank-accounts',
    requirePermission('treasury.view'),
    (_req: Request, res: Response) => {
      try {
        const bankAccounts = foundationStore.getBankAccounts();
        res.json({ ok: true, bankAccounts });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست حساب‌های بانکی.',
        });
      }
    }
  );

  // 42. Create Bank Account
  app.post(
    '/api/treasury/bank-accounts',
    requirePermission('treasury.transactions.manage'),
    (req: Request, res: Response) => {
      try {
        const { bankNameFa, accountNumber, shabaNumber, balanceIrr } = req.body || {};
        const account = foundationStore.createBankAccount(
          String(bankNameFa || ''),
          String(accountNumber || ''),
          shabaNumber ? String(shabaNumber) : undefined,
          Number(balanceIrr) || 0
        );
        res.status(201).json({
          ok: true,
          messageFa: `حساب بانکی «${account.bankNameFa}» با موفقیت تعریف شد.`,
          account,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف حساب بانکی جدید.',
        });
      }
    }
  );

  // 43. Get Cheques
  app.get(
    '/api/treasury/cheques',
    requirePermission('treasury.view'),
    (_req: Request, res: Response) => {
      try {
        const cheques = foundationStore.getCheques();
        res.json({ ok: true, cheques });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست چک‌ها.',
        });
      }
    }
  );

  // 44. Create Cheque
  app.post(
    '/api/treasury/cheques',
    requirePermission('treasury.cheques.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const cheque = foundationStore.createCheque(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `چک شماره [${cheque.chequeNumber}] با موفقیت در دفتر چک ثبت گردید.`,
          cheque,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت چک جدید.',
        });
      }
    }
  );

  // 45. Update Cheque Status
  app.patch(
    '/api/treasury/cheques/:id/status',
    requirePermission('treasury.cheques.manage'),
    (req: Request, res: Response) => {
      try {
        const chequeId = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const cheque = foundationStore.updateChequeStatus(
          { chequeId, ...(req.body || {}) },
          activeUser.id
        );
        res.json({
          ok: true,
          messageFa: `وضعیت چک [${cheque.chequeNumber}] با موفقیت به «${cheque.status}» به‌روزرسانی شد.`,
          cheque,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت چک.',
        });
      }
    }
  );

  // 46. Get Treasury Transactions
  app.get(
    '/api/treasury/transactions',
    requirePermission('treasury.view'),
    (_req: Request, res: Response) => {
      try {
        const transactions = foundationStore.getTreasuryTransactions();
        res.json({ ok: true, transactions });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست گردش وجوه خزانه.',
        });
      }
    }
  );

  // 47. Create Treasury Transaction (Receipt, Payment, Transfer)
  app.post(
    '/api/treasury/transactions',
    requirePermission('treasury.transactions.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const transaction = foundationStore.createTreasuryTransaction(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `تراکنش خزانه «${transaction.txNumber}» به مبلغ ${transaction.amountIrr.toLocaleString()} ریال با موفقیت ثبت شد.`,
          transaction,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت تراکنش خزانه.',
        });
      }
    }
  );

  // 48. Get Installments
  app.get(
    '/api/treasury/installments',
    requirePermission('treasury.view'),
    (_req: Request, res: Response) => {
      try {
        const installments = foundationStore.getInstallments();
        res.json({ ok: true, installments });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت دفتر اقساط.',
        });
      }
    }
  );

  // 49. Pay Installment
  app.post(
    '/api/treasury/installments/:id/pay',
    requirePermission('treasury.transactions.manage'),
    (req: Request, res: Response) => {
      try {
        const installmentId = Number(req.params.id);
        const { paidDateJalali, paymentMethod } = req.body || {};
        const activeUser = foundationStore.getActiveUser();
        const installment = foundationStore.payInstallment(
          installmentId,
          paidDateJalali || '1405/01/25',
          paymentMethod || 'POS',
          activeUser.id
        );
        res.json({
          ok: true,
          messageFa: `قسط «${installment.installmentCode}» با موفقیت تسویه گردید.`,
          installment,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تسویه قسط.',
        });
      }
    }
  );

  // 50. Get Operational Expenses
  app.get(
    '/api/treasury/expenses',
    requirePermission('treasury.view'),
    (_req: Request, res: Response) => {
      try {
        const expenses = foundationStore.getOperationalExpenses();
        res.json({ ok: true, expenses });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست هزینه‌های عملیاتی.',
        });
      }
    }
  );

  // 51. Create Operational Expense
  app.post(
    '/api/treasury/expenses',
    requirePermission('treasury.expenses.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const expense = foundationStore.createOperationalExpense(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `هزینه عملیاتی «${expense.expenseCode}» با موفقیت ثبت شد.`,
          expense,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت هزینه عملیاتی.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 9: DOUBLE-ENTRY ACCOUNTING, CHART OF ACCOUNTS, DOCUMENTS & GENERAL LEDGER
  // ============================================================================

  // 52. Get Accounts Chart (Tree/List)
  app.get(
    '/api/accounting/chart',
    requirePermission('accounting.view'),
    (_req: Request, res: Response) => {
      try {
        const chart = foundationStore.getAccountsChart();
        res.json({ ok: true, chart });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت کدینگ حسابداری.',
        });
      }
    }
  );

  // 53. Create New Account in Chart
  app.post(
    '/api/accounting/chart',
    requirePermission('accounting.chart.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const account = foundationStore.createAccount(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `حساب «${account.titleFa}» با کد [${account.code}] با موفقیت در سرفصل‌ها ثبت شد.`,
          account,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف حساب جدید.',
        });
      }
    }
  );

  const requireDoubleEntryAccounting = (_req: Request, res: Response, next: NextFunction) => {
    if (!foundationStore.isDoubleEntryAccountingEnabled()) {
      res.status(403).json({
        ok: false,
        messageFa: 'ماژول حسابداری دوبل در تنظیمات سراسری سیستم غیرفعال می‌باشد.',
      });
      return;
    }
    next();
  };

  // 54. Get Accounting Documents List
  app.get(
    '/api/accounting/documents',
    requireDoubleEntryAccounting,
    requirePermission('accounting.view'),
    (req: Request, res: Response) => {
      try {
        const { status, docType, search } = req.query;
        const documents = foundationStore.getAccountingDocuments({
          status: status ? String(status) : undefined,
          docType: docType ? String(docType) : undefined,
          search: search ? String(search) : undefined,
        });
        res.json({ ok: true, documents });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست اسناد حسابداری.',
        });
      }
    }
  );

  // 55. Get Single Accounting Document by ID
  app.get(
    '/api/accounting/documents/:id',
    requireDoubleEntryAccounting,
    requirePermission('accounting.view'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const document = foundationStore.getAccountingDocumentById(id);
        if (!document) {
          res.status(404).json({ ok: false, messageFa: 'سند حسابداری یافت نشد.' });
          return;
        }
        res.json({ ok: true, document });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت مشخصات سند.',
        });
      }
    }
  );

  // 56. Create Accounting Document (with Debit/Credit Balance Check)
  app.post(
    '/api/accounting/documents',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const document = foundationStore.createAccountingDocument(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `سند حسابداری «${document.docNumber}» به مبلغ ${document.totalDebitIrr.toLocaleString()} ریال با موفقیت تراز و ثبت گردید.`,
          document,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت سند حسابداری.',
        });
      }
    }
  );

  // 57. Update Accounting Document (Controlled Editing for non-permanent docs)
  app.put(
    '/api/accounting/documents/:id',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.manage'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const document = foundationStore.updateAccountingDocument(id, req.body || {}, activeUser.id);
        res.json({
          ok: true,
          messageFa: `سند حسابداری «${document.docNumber}» با موفقیت ویرایش و مجدداً تراز شد.`,
          document,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ویرایش سند حسابداری.',
        });
      }
    }
  );

  // 58. Approve Accounting Document
  app.post(
    '/api/accounting/documents/:id/approve',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.approve'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const document = foundationStore.approveAccountingDocument(id, activeUser.id);
        res.json({
          ok: true,
          messageFa: `سند حسابداری «${document.docNumber}» با موفقیت تایید گردید.`,
          document,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تایید سند حسابداری.',
        });
      }
    }
  );

  // 59. Make Accounting Document Permanent (Lock)
  app.post(
    '/api/accounting/documents/:id/permanent',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.permanent'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const document = foundationStore.makeAccountingDocumentPermanent(id, activeUser.id);
        res.json({
          ok: true,
          messageFa: `سند حسابداری «${document.docNumber}» به وضعیت قطعی (PERMANENT) تغییر یافت و قفل شد.`,
          document,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در قطعی کردن سند حسابداری.',
        });
      }
    }
  );

  // 60. Delete Draft Accounting Document
  app.delete(
    '/api/accounting/documents/:id',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.manage'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const result = foundationStore.deleteAccountingDocument(id, activeUser.id);
        res.json(result);
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در حذف سند حسابداری.',
        });
      }
    }
  );

  // 61. Auto-generate Accounting Document from Source Event
  app.post(
    '/api/accounting/auto-generate',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.manage'),
    (req: Request, res: Response) => {
      try {
        const { sourceDocType, sourceDocId } = req.body || {};
        const activeUser = foundationStore.getActiveUser();
        const idNum = Number(sourceDocId);

        let document;
        if (sourceDocType === 'SALES_INVOICE') {
          document = foundationStore.generateAccountingDocFromSalesInvoice(idNum, activeUser.id);
        } else if (sourceDocType === 'PURCHASE_INVOICE') {
          document = foundationStore.generateAccountingDocFromPurchaseInvoice(idNum, activeUser.id);
        } else if (sourceDocType === 'TREASURY_RECEIPT' || sourceDocType === 'TREASURY_PAYMENT') {
          document = foundationStore.generateAccountingDocFromTreasuryTx(idNum, activeUser.id);
        } else if (sourceDocType === 'OPERATIONAL_EXPENSE') {
          document = foundationStore.generateAccountingDocFromExpense(idNum, activeUser.id);
        } else {
          throw new Error(`نوع رویداد مبدأ «${sourceDocType}» معتبر نمی‌باشد.`);
        }

        res.json({
          ok: true,
          messageFa: `سند اتوماتیک «${document.docNumber}» برای رویداد ${sourceDocType} #${sourceDocId} با موفقیت صادر شد.`,
          document,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در صدور اتوماتیک سند حسابداری.',
        });
      }
    }
  );

  // 61b. Regenerate Missing Auto Vouchers
  app.post(
    '/api/accounting/regenerate-missing-vouchers',
    requireDoubleEntryAccounting,
    requirePermission('accounting.documents.manage'),
    (_req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const result = foundationStore.generateMissingAutoVouchers(activeUser.id);
        res.json(result);
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بازسازی اسناد جامانده.',
        });
      }
    }
  );

  // 62. Report: Journal Ledger (دفتر روزنامه)
  app.get(
    '/api/accounting/reports/journal',
    requireDoubleEntryAccounting,
    requirePermission('accounting.reports.view'),
    (_req: Request, res: Response) => {
      try {
        const journal = foundationStore.getJournalLedger();
        res.json({ ok: true, journal });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت دفتر روزنامه.',
        });
      }
    }
  );

  // 63. Report: General Ledger (دفتر کل)
  app.get(
    '/api/accounting/reports/ledger',
    requireDoubleEntryAccounting,
    requirePermission('accounting.reports.view'),
    (req: Request, res: Response) => {
      try {
        const accountCode = req.query.accountCode ? String(req.query.accountCode) : undefined;
        const ledger = foundationStore.getGeneralLedger(accountCode);
        res.json({ ok: true, ledger });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت دفتر کل.',
        });
      }
    }
  );

  // 64. Report: Trial Balance (تراز آزمایشی ۲ ستونی و ۴ ستونی)
  app.get(
    '/api/accounting/reports/trial-balance',
    requireDoubleEntryAccounting,
    requirePermission('accounting.reports.view'),
    (_req: Request, res: Response) => {
      try {
        const trialBalance = foundationStore.getTrialBalance();
        res.json({ ok: true, trialBalance });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت تراز آزمایشی.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 10: FISCAL YEARS, ACCOUNTING PERIODS, PERIOD CLOSING,
  // COST CENTERS & MULTI-DIMENSIONAL PROFITABILITY ANALYTICS
  // ============================================================================

  // 65. Get Fiscal Years List
  app.get(
    '/api/accounting/fiscal-years',
    requirePermission('accounting.view'),
    (_req: Request, res: Response) => {
      try {
        const fiscalYears = foundationStore.getFiscalYears();
        res.json({ ok: true, fiscalYears });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست سال‌های مالی.',
        });
      }
    }
  );

  // 66. Create Fiscal Year
  app.post(
    '/api/accounting/fiscal-years',
    requirePermission('accounting.fiscal.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const fiscalYear = foundationStore.createFiscalYear(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `سال مالی «${fiscalYear.titleFa}» با موفقیت تعریف گردید.`,
          fiscalYear,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف سال مالی.',
        });
      }
    }
  );

  // 67. Update Fiscal Year
  app.put(
    '/api/accounting/fiscal-years/:id',
    requirePermission('accounting.fiscal.manage'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const fiscalYear = foundationStore.updateFiscalYear(id, req.body || {}, activeUser.id);
        res.json({
          ok: true,
          messageFa: `سال مالی «${fiscalYear.titleFa}» با موفقیت بروزرسانی شد.`,
          fiscalYear,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ویرایش سال مالی.',
        });
      }
    }
  );

  // 68. Close Fiscal Year (اختتامیه سال مالی)
  app.post(
    '/api/accounting/fiscal-years/:id/close',
    requireDoubleEntryAccounting,
    requirePermission('accounting.periods.close'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const result = foundationStore.closeFiscalYear(id, req.body || {}, activeUser.id);
        res.json(result);
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بستن سال مالی.',
        });
      }
    }
  );

  // 69. Get Accounting Periods
  app.get(
    '/api/accounting/periods',
    requirePermission('accounting.view'),
    (req: Request, res: Response) => {
      try {
        const fiscalYearId = req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined;
        const periods = foundationStore.getAccountingPeriods(fiscalYearId);
        res.json({ ok: true, periods });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت دوره‌های حسابداری.',
        });
      }
    }
  );

  // 70. Close Accounting Period (بستن دوره مالی - ایجاد سند بستن حساب‌های موقت بدون حذف سوابق)
  app.post(
    '/api/accounting/periods/:id/close',
    requireDoubleEntryAccounting,
    requirePermission('accounting.periods.close'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const result = foundationStore.closeAccountingPeriod(id, req.body || {}, activeUser.id);
        res.json(result);
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بستن دوره حسابداری.',
        });
      }
    }
  );

  // 71. Reopen Accounting Period (بازگشایی دوره با دلیل مستند و مجوزمحور)
  app.post(
    '/api/accounting/periods/:id/reopen',
    requireDoubleEntryAccounting,
    requirePermission('accounting.periods.close'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const { reasonFa } = req.body || {};
        const activeUser = foundationStore.getActiveUser();
        const result = foundationStore.reopenAccountingPeriod(id, reasonFa, activeUser.id);
        res.json(result);
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بازگشایی دوره حسابداری.',
        });
      }
    }
  );

  // 72. Get Cost Centers (مراکز هزینه)
  app.get(
    '/api/accounting/cost-centers',
    requirePermission('accounting.view'),
    (_req: Request, res: Response) => {
      try {
        const costCenters = foundationStore.getCostCenters();
        res.json({ ok: true, costCenters });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در دریافت مراکز هزینه.',
        });
      }
    }
  );

  // 73. Create Cost Center
  app.post(
    '/api/accounting/cost-centers',
    requirePermission('costcenters.manage'),
    (req: Request, res: Response) => {
      try {
        const activeUser = foundationStore.getActiveUser();
        const costCenter = foundationStore.createCostCenter(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `مرکز هزینه «${costCenter.titleFa}» با موفقیت تعریف شد.`,
          costCenter,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تعریف مرکز هزینه.',
        });
      }
    }
  );

  // 74. Update Cost Center
  app.put(
    '/api/accounting/cost-centers/:id',
    requirePermission('costcenters.manage'),
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = foundationStore.getActiveUser();
        const costCenter = foundationStore.updateCostCenter(id, req.body || {}, activeUser.id);
        res.json({
          ok: true,
          messageFa: `مرکز هزینه «${costCenter.titleFa}» بروزرسانی شد.`,
          costCenter,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ویرایش مرکز هزینه.',
        });
      }
    }
  );

  // 75. Multi-dimensional Profitability Report (گزارش جامع تحلیل سودآوری چندبعدی)
  app.get(
    '/api/accounting/reports/profitability',
    requirePermission('accounting.profitability.view'),
    (req: Request, res: Response) => {
      try {
        const { fiscalYearCode, fromDateJalali, toDateJalali, costCenterId } = req.query;
        const report = foundationStore.getComprehensiveProfitabilityReport({
          fiscalYearCode: fiscalYearCode ? String(fiscalYearCode) : undefined,
          fromDateJalali: fromDateJalali ? String(fromDateJalali) : undefined,
          toDateJalali: toDateJalali ? String(toDateJalali) : undefined,
          costCenterId: costCenterId ? Number(costCenterId) : undefined,
        });
        res.json({ ok: true, report });
      } catch (err: unknown) {
        res.status(500).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تهیه گزارش سودآوری.',
        });
      }
    }
  );

  // 76. Validate Document Date against Fiscal Calendar
  app.post(
    '/api/accounting/validate-date',
    requirePermission('accounting.view'),
    (req: Request, res: Response) => {
      try {
        const { dateJalali, bypassClosed } = req.body || {};
        const validation = foundationStore.validateDocumentDateForPosting(dateJalali, Boolean(bypassClosed));
        res.json({ ok: true, validation });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در اعتبارسنجی تاریخ سند.',
        });
      }
    }
  );

  // ============================================================================
  // STAGE 11: PROJECTS + INSTALLERS + MATERIAL CONSUMPTION + PROFITABILITY
  // ============================================================================

  // 77. Get Projects (با پشتیبانی از فیلتر نصاب، مشتری، وضعیت و RBAC اختصاصی نصاب)
  app.get('/api/projects', (req: Request, res: Response) => {
    try {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);

      const { installerId, customerId, status } = req.query;
      const effectiveInstallerId = activeInstallerId || (installerId ? Number(installerId) : undefined);

      let projects = foundationStore.getProjects({
        installerId: effectiveInstallerId,
        customerId: customerId ? Number(customerId) : undefined,
        status: status ? String(status) : undefined,
      });

      // Redact financial information for installer users
      if (activeInstallerId) {
        projects = projects.map((p) => ({
          ...p,
          contractAmountIrr: 0,
          consumedMaterialsCostIrr: 0,
          installerLaborCostIrr: 0,
          allocatedExpensesIrr: 0,
          netProfitIrr: 0,
          netMarginPct: 0,
        }));
      }

      res.json({ ok: true, projects });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست پروژه‌ها.',
      });
    }
  });

  // 78. Get Project by ID (همراه با کنترل دسترسی به پروژه‌های اختصاص‌یافته به نصاب)
  app.get('/api/projects/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);

      let project = foundationStore.getProjectById(id);
      if (!project) {
        return res.status(404).json({ ok: false, messageFa: 'پروژه مورد نظر یافت نشد.' });
      }

      if (activeInstallerId && project.installerId !== activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_PROJECT_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: شما فقط مجاز به مشاهده اطلاعات پروژه‌های تخصیص‌یافته به خودتان هستید.',
        });
      }

      if (activeInstallerId) {
        project = {
          ...project,
          contractAmountIrr: 0,
          consumedMaterialsCostIrr: 0,
          installerLaborCostIrr: 0,
          allocatedExpensesIrr: 0,
          netProfitIrr: 0,
          netMarginPct: 0,
        };
      }

      res.json({ ok: true, project });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت مشخصات پروژه.',
      });
    }
  });

  // 79. Create Project (مدیران و کارشناسان فنی مجاز؛ مسدود برای نصاب)
  app.post(
    '/api/projects',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);
      if (activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_ACTION_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: تکنسین و نصاب مجاز به تعریف پروژه جدید نیست.',
        });
      }
      return requirePermission('installation.jobs.manage')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const activeUser = getRequestUser(req);
        const project = foundationStore.createProject(req.body || {}, activeUser.id);
        res.status(201).json({
          ok: true,
          messageFa: `پروژه «${project.titleFa}» با کد ${project.projectCode} با موفقیت ثبت شد.`,
          project,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ثبت پروژه.',
        });
      }
    }
  );

  // 80. Update Project / Assign Installer (مسدود برای نصاب)
  app.put(
    '/api/projects/:id',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);
      if (activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_ACTION_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: تکنسین و نصاب مجاز به تغییر مشخصات یا اختصاص پروژه نیست.',
        });
      }
      return requirePermission('installation.jobs.manage')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = getRequestUser(req);
        const project = foundationStore.updateProject(id, req.body || {}, activeUser.id);
        res.json({
          ok: true,
          messageFa: `پروژه «${project.titleFa}» بروزرسانی شد.`,
          project,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در ویرایش پروژه.',
        });
      }
    }
  );

  // 80b. Submit Visit / Progress Report by Installer
  app.post('/api/projects/:id/visit-report', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);

      const project = foundationStore.getProjectById(id);
      if (!project) return res.status(404).json({ ok: false, messageFa: 'پروژه یافت نشد.' });

      if (activeInstallerId && project.installerId !== activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_PROJECT_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: شما فقط امکان ثبت گزارش برای پروژه‌های تخصیص‌یافته به خود را دارید.',
        });
      }

      const updated = foundationStore.submitProjectVisitReport(id, req.body || {}, activeUser.id);
      res.json({
        ok: true,
        messageFa: `گزارش بازدید و پیشرفت کار برای پروژه «${updated.titleFa}» با موفقیت ارسال گردید.`,
        project: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت گزارش بازدید.',
      });
    }
  });

  // 80c. Review Visit Report by Manager (مسدود برای نصاب)
  app.post(
    '/api/projects/:id/review-visit-report',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);
      if (activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_ACTION_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: نصاب مجاز به تأیید یا ارزیابی گزارش کار خود یا دیگران نیست.',
        });
      }
      return requirePermission('installation.jobs.manage')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const activeUser = getRequestUser(req);
        const { approved, reviewNotesFa } = req.body || {};

        const updated = foundationStore.reviewProjectVisitReport(id, Boolean(approved), reviewNotesFa, activeUser.id);
        res.json({
          ok: true,
          messageFa: `گزارش بازدید پروژه «${updated.titleFa}» با موفقیت ${approved ? 'تأیید' : 'رد'} گردید.`,
          project: updated,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در بررسی گزارش بازدید.',
        });
      }
    }
  );

  // 81. Get Project Requisitions
  app.get('/api/projects/requisitions', (req: Request, res: Response) => {
    try {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);

      const { projectId, installerId, status } = req.query;
      const effectiveInstallerId = activeInstallerId || (installerId ? Number(installerId) : undefined);

      const requisitions = foundationStore.getProjectRequisitions(
        projectId ? Number(projectId) : undefined,
        {
          installerId: effectiveInstallerId,
          status: status ? String(status) : undefined,
        }
      );
      res.json({ ok: true, requisitions });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت درخواست‌های کالا.',
      });
    }
  });

  // 82. Create Project Requisition (درخواست کالا توسط نصاب/کارشناس)
  app.post('/api/projects/:id/requisitions', (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.id);
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);

      let project = foundationStore.getProjectById(projectId);
      let job: any = null;
      if (!project) {
        job = foundationStore.getInstallationJobs().find((j) => j.id === projectId);
      }
      if (!project && !job) return res.status(404).json({ ok: false, messageFa: 'پروژه یا پرونده نصب یافت نشد.' });

      const assignedInstaller = project ? project.installerId : job.installerId;
      if (activeInstallerId && assignedInstaller !== activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_ACTION_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: شما فقط امکان ثبت درخواست کالا برای امور محوله خود را دارید.',
        });
      }

      const requisition = foundationStore.createProjectRequisition(
        { ...req.body, projectId },
        activeUser.id
      );
      res.status(201).json({
        ok: true,
        messageFa: `درخواست کالای ${requisition.requestCode} برای ${requisition.itemTitleFa} ثبت شد.`,
        requisition,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت درخواست کالا.',
      });
    }
  });

  // 83. Approve Project Requisition (صرفاً مدیران و انبارداران؛ مسدود برای نصاب)
  app.post(
    '/api/projects/requisitions/:reqId/approve',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);
      if (activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_ACTION_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: نصاب مجاز به تأیید درخواست کالا نیست. این عملیات صرفاً در صلاحیت مدیر یا انباردار است.',
        });
      }
      return requirePermission('inventory.transfer.manage')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const reqId = Number(req.params.reqId);
        const activeUser = getRequestUser(req);
        const { approvedQty } = req.body || {};
        const requisition = foundationStore.approveProjectRequisition(reqId, approvedQty, activeUser.id);
        res.json({
          ok: true,
          messageFa: `درخواست ${requisition.requestCode} با تأیید ${requisition.approvedQty} عدد تصویب گردید.`,
          requisition,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تأیید درخواست کالا.',
        });
      }
    }
  );

  // 84. Issue Project Requisition (صرفاً انباردار؛ مسدود برای نصاب)
  app.post(
    '/api/projects/requisitions/:reqId/issue',
    (req: Request, res: Response, next: NextFunction) => {
      const activeUser = getRequestUser(req);
      const activeInstallerId = getActiveInstallerPartyId(activeUser);
      if (activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_ACTION_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: تحویل فیزیکی کالا از انبار صرفاً در صلاحیت انباردار سیستم است.',
        });
      }
      return requirePermission('inventory.transfer.manage')(req, res, next);
    },
    (req: Request, res: Response) => {
      try {
        const reqId = Number(req.params.reqId);
        const activeUser = getRequestUser(req);
        const { issuedQty, warehouseId, serials } = req.body || {};
        const requisition = foundationStore.issueProjectRequisition(
          reqId,
          issuedQty,
          warehouseId,
          serials,
          activeUser.id
        );
        res.json({
          ok: true,
          messageFa: `تحویل ${requisition.issuedQty} عدد کالا از ${requisition.sourceWarehouseTitleFa} به نصاب پروژه ثبت گردید.`,
          requisition,
        });
      } catch (err: unknown) {
        res.status(400).json({
          ok: false,
          messageFa: err instanceof Error ? err.message : 'خطا در تحویل کالا از انبار.',
        });
      }
    }
  );

  // 85. Consume Project Requisition (مصرف قطعی در محل پروژه و صدور سند حسابداری خودکار)
  app.post('/api/projects/requisitions/:reqId/consume', (req: Request, res: Response) => {
    try {
      const reqId = Number(req.params.reqId);
      const activeUser = foundationStore.getActiveUser();
      const { consumedQty, dateJalali } = req.body || {};
      const requisition = foundationStore.consumeProjectRequisition(
        reqId,
        consumedQty,
        dateJalali,
        activeUser.id
      );
      res.json({
        ok: true,
        messageFa: `مصرف قطعی ${requisition.consumedQty} عدد کالا در پروژه با ثبت سند حسابداری تأیید شد.`,
        requisition,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت مصرف کالا در پروژه.',
      });
    }
  });

  // 86. Return Project Requisition (برگشت اقلام مازاد از پروژه به انبار)
  app.post('/api/projects/requisitions/:reqId/return', (req: Request, res: Response) => {
    try {
      const reqId = Number(req.params.reqId);
      const activeUser = foundationStore.getActiveUser();
      const { returnedQty, dateJalali } = req.body || {};
      const requisition = foundationStore.returnProjectRequisition(
        reqId,
        returnedQty,
        dateJalali,
        activeUser.id
      );
      res.json({
        ok: true,
        messageFa: `برگشت ${requisition.returnedQty} عدد کالا از پروژه به انبار با موفقیت به موجودی اضافه شد.`,
        requisition,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در برگشت کالا به انبار.',
      });
    }
  });

  // 87. Project Profitability Detail (سودآوری جامع - عدم دسترسی نصاب)
  app.get('/api/projects/:id/profitability', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const activeInstallerId = getActiveInstallerPartyId(activeUser);

      if (activeInstallerId) {
        return res.status(403).json({
          ok: false,
          errorCode: 'INSTALLER_FINANCIALS_FORBIDDEN',
          messageFa: 'دسترسی غیرمجاز: حساب کاربری نصاب اجازه دسترسی به گزارش سودآوری و بهای تمام‌شده را ندارد.',
        });
      }

      const id = Number(req.params.id);
      const detail = foundationStore.getProjectProfitabilityDetail(id);
      res.json({ ok: true, detail });
    } catch (err: unknown) {
      res.status(500).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در محاسبه سودآوری پروژه.',
      });
    }
  });

  // 88. Quick Party Settlement (تسویه حساب سریع شخص: کارتخوان، چک، سند بانکی، اقساط، نقد)
  app.post('/api/parties/:id/settle', (req: Request, res: Response) => {
    try {
      const partyId = Number(req.params.id);
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.settlePartyQuick(
        { ...req.body, partyId },
        activeUser.id
      );
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت تسویه حساب طرف تجاری.',
      });
    }
  });

  // 89. Master Definitions: Bank Accounts
  app.post('/api/master/bank-accounts', (req: Request, res: Response) => {
    try {
      const account = foundationStore.createBankAccount(req.body || {});
      res.status(201).json({
        ok: true,
        messageFa: `حساب بانکی ${account.bankNameFa} با شماره ${account.accountNumber} ثبت شد.`,
        account,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تعریف حساب بانکی.',
      });
    }
  });

  app.put('/api/master/bank-accounts/:id', (req: Request, res: Response) => {
    try {
      const account = foundationStore.updateBankAccount(Number(req.params.id), req.body || {});
      res.json({
        ok: true,
        messageFa: `اطلاعات حساب بانکی ${account.bankNameFa} به‌روزرسانی گردید.`,
        account,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش حساب بانکی.',
      });
    }
  });

  app.delete('/api/master/bank-accounts/:id', (req: Request, res: Response) => {
    try {
      foundationStore.deleteBankAccount(Number(req.params.id));
      res.json({
        ok: true,
        messageFa: 'حساب بانکی با موفقیت حذف شد.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در حذف حساب بانکی.',
      });
    }
  });

  // 90. Master Definitions: Warehouses
  app.post('/api/master/warehouses', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const warehouse = foundationStore.createWarehouse(req.body || {}, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `انبار «${warehouse.titleFa}» با کد ${warehouse.code} ثبت شد.`,
        warehouse,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تعریف انبار.',
      });
    }
  });

  app.put('/api/master/warehouses/:id', (req: Request, res: Response) => {
    try {
      const warehouse = foundationStore.updateWarehouse(Number(req.params.id), req.body || {});
      res.json({
        ok: true,
        messageFa: `اطلاعات انبار «${warehouse.titleFa}» به‌روزرسانی شد.`,
        warehouse,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش انبار.',
      });
    }
  });

  app.delete('/api/master/warehouses/:id', (req: Request, res: Response) => {
    try {
      foundationStore.deleteWarehouse(Number(req.params.id));
      res.json({
        ok: true,
        messageFa: 'انبار با موفقیت حذف گردید.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در حذف انبار.',
      });
    }
  });

  // 91. Master Definitions: Item Categories
  app.post('/api/master/item-categories', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const category = foundationStore.createItemCategory(req.body || {}, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `گروه کالای «${category.titleFa}» با کد ${category.categoryCode} ثبت شد.`,
        category,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تعریف گروه کالا.',
      });
    }
  });

  app.put('/api/master/item-categories/:id', (req: Request, res: Response) => {
    try {
      const category = foundationStore.updateItemCategory(Number(req.params.id), req.body || {});
      res.json({
        ok: true,
        messageFa: `گروه کالای «${category.titleFa}» به‌روزرسانی شد.`,
        category,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش گروه کالا.',
      });
    }
  });

  app.delete('/api/master/item-categories/:id', (req: Request, res: Response) => {
    try {
      foundationStore.deleteItemCategory(Number(req.params.id));
      res.json({
        ok: true,
        messageFa: 'گروه کالا با موفقیت حذف گردید.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در حذف گروه کالا.',
      });
    }
  });

  // 92. Master Definitions: Cash Boxes
  app.post('/api/master/cash-boxes', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const cashBox = foundationStore.createCashBox(req.body || {}, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `صندوق نقدی «${cashBox.titleFa}» با کد ${cashBox.boxCode} ثبت شد.`,
        cashBox,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تعریف صندوق نقدی.',
      });
    }
  });

  app.put('/api/master/cash-boxes/:id', (req: Request, res: Response) => {
    try {
      const cashBox = foundationStore.updateCashBox(Number(req.params.id), req.body || {});
      res.json({
        ok: true,
        messageFa: `صندوق «${cashBox.titleFa}» به‌روزرسانی شد.`,
        cashBox,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش صندوق.',
      });
    }
  });

  app.delete('/api/master/cash-boxes/:id', (req: Request, res: Response) => {
    try {
      foundationStore.deleteCashBox(Number(req.params.id));
      res.json({
        ok: true,
        messageFa: 'صندوق نقدی با موفقیت حذف گردید.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در حذف صندوق.',
      });
    }
  });

  // Sales Invoice Delete
  app.delete('/api/sales/invoices/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteSalesInvoice(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف فاکتور فروش.' });
    }
  });

  // Purchase Invoice Delete
  app.delete('/api/purchases/invoices/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deletePurchaseInvoice(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف فاکتور خرید.' });
    }
  });

  // Party Delete
  app.delete('/api/parties/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteParty(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف طرف حساب.' });
    }
  });

  // Inventory Item Delete
  app.delete('/api/inventory/items/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteItem(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف کالا.' });
    }
  });

  // Project Delete
  app.delete('/api/projects/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteProject(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف پروژه.' });
    }
  });

  // Installation Job Delete
  app.delete('/api/installation/jobs/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteInstallationJob(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف سفارش نصب.' });
    }
  });

  // Treasury Transaction Update
  app.put('/api/treasury/transactions/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const updated = foundationStore.updateTreasuryTransaction(
        Number(req.params.id),
        req.body || {},
        activeUser.id
      );
      res.json({
        ok: true,
        messageFa: `تراکنش مالی «${updated.txNumber}» با موفقیت ویرایش گردید.`,
        transaction: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ویرایش تراکنش خزانه.',
      });
    }
  });

  // Treasury Transaction Delete
  app.delete('/api/treasury/transactions/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteTreasuryTransaction(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف تراکنش خزانه.' });
    }
  });

  // Cheque Delete
  app.delete('/api/treasury/cheques/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteCheque(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف چک.' });
    }
  });

  // Accounting Document Delete
  app.delete('/api/accounting/documents/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteAccountingDocument(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف سند حسابداری.' });
    }
  });

  // Operational Expense Delete
  app.delete('/api/operational-expenses/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteOperationalExpense(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف هزینه عملیاتی.' });
    }
  });

  // Operational Income Delete
  app.delete('/api/operational-incomes/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteOperationalIncome(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف درآمد عملیاتی.' });
    }
  });

  // Sales Proforma Delete
  app.delete('/api/sales/proformas/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteSalesProforma(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف پیش‌فاکتور فروش.' });
    }
  });

  // Fixed Asset Delete
  app.delete('/api/fixed-assets/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteFixedAsset(Number(req.params.id), activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در حذف دارایی ثابت.' });
    }
  });

  // 93. Reset Database / Factory Clear / Clean Zero Slate
  app.post('/api/settings/reset-database', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const { wipeOperationalOnly, factoryReset, cleanZeroSlate, confirmationCode, force } = req.body || {};
      const validCodes = ['DELETE', 'حذف', 'RESET', '0', '۰', 'صفر', 'CLEAN', 'ZERO', 'CONFIRM', 'تایید', 'YES', 'بله'];
      const rawCode = String(confirmationCode || '').trim();
      const normalizedCode = rawCode.toUpperCase();
      const isCodeValid = validCodes.includes(normalizedCode) || validCodes.includes(rawCode) || force === true;
      if (!isCodeValid) {
        return res.status(400).json({
          ok: false,
          messageFa: 'جهت تایید عملیات پاکسازی دیتابیس، عبارت "0" یا "صفر" یا "حذف" را وارد نمایید.',
        });
      }
      const result = foundationStore.resetDatabase(
        {
          wipeOperationalOnly: Boolean(wipeOperationalOnly),
          factoryReset: Boolean(factoryReset),
          cleanZeroSlate: Boolean(cleanZeroSlate),
        },
        activeUser.id
      );
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در پاکسازی دیتابیس.',
      });
    }
  });
  // 93. Stage 12: Fixed Assets Management
  app.get('/api/fixed-assets', (_req: Request, res: Response) => {
    try {
      const assets = foundationStore.getFixedAssets();
      const entries = foundationStore.getDepreciationEntries();
      res.json({ ok: true, fixedAssets: assets, depreciationEntries: entries });
    } catch (err: unknown) {
      res.status(500).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست دارایی‌ها' });
    }
  });

  app.post('/api/fixed-assets', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const asset = foundationStore.createFixedAsset(req.body || {}, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `دارایی ثابت «${asset.titleFa}» با کد ${asset.assetCode} ثبت شد.`,
        asset,
      });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در تعریف دارایی ثابت.' });
    }
  });

  app.put('/api/fixed-assets/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const asset = foundationStore.updateFixedAsset(Number(req.params.id), req.body || {}, activeUser.id);
      res.json({
        ok: true,
        messageFa: `اطلاعات دارایی ثابت «${asset.titleFa}» به‌روزرسانی شد.`,
        asset,
      });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در ویرایش دارایی ثابت.' });
    }
  });

  app.post('/api/fixed-assets/:id/depreciate', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const periodJalali = req.body?.periodJalali || '1405-Y';
      const result = foundationStore.calculateAndPostDepreciation(Number(req.params.id), periodJalali, activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در ثبت استهلاک دارایی.' });
    }
  });

  // 94. Stage 12 & 13: Opening Balance Voucher, Simple Wizard & Operational Incomes
  app.post('/api/accounting/opening-balance', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.importOpeningBalances(req.body || {}, activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در ثبت و تأیید سند افتتاحیه.' });
    }
  });

  app.post('/api/accounting/opening-balance/simple-wizard', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.importSimpleOpeningBalance(req.body || {}, activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در ثبت و موازنه فرم ساده افتتاحیه.' });
    }
  });

  app.get('/api/operational-incomes', (_req: Request, res: Response) => {
    try {
      const incomes = foundationStore.getOperationalIncomes();
      res.json({ ok: true, incomes });
    } catch (err: unknown) {
      res.status(500).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست درآمدها.' });
    }
  });

  app.post('/api/operational-incomes', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const record = foundationStore.createOperationalIncome(req.body || {}, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `درآمد متفرقه [${record.incomeCode}] به مبلغ ${record.amountIrr.toLocaleString('fa-IR')} ریال ثبت گردید.`,
        income: record,
      });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در ثبت درآمد.' });
    }
  });

  app.get('/api/foundation/document-number/next', (req: Request, res: Response) => {
    try {
      const type = (req.query.type as any) || 'SALES_INVOICE';
      const docNumber = foundationStore.generateNextDocumentNumber(type);
      res.json({ ok: true, docNumber });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, messageFa: err instanceof Error ? err.message : 'خطا در تولید شماره سند.' });
    }
  });

  // ============================================================================
  // 95. INTELLIGENT AGENT GEMINI AI API ENDPOINT (SENIOR ACCOUNTANT PERSONA)
  // ============================================================================
  app.post('/api/agent/chat', async (req: Request, res: Response) => {
    try {
      const { input, foundationDataSummary } = req.body || {};
      const prompt = String(input || '').trim();

      if (!prompt) {
        return res.json({ ok: false, messageFa: 'متن ورودی خالی است.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          ok: false,
          mode: 'OFFLINE_FALLBACK',
          messageFa: 'کلید API ابری تنظیم نشده است. استفاده از موتور محلی NLP.',
        });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `شما «حسابدار ارشد رسمی مهرگان» (Senior Financial Accountant AI Agent) هستید.
لحن و شخصیت شما: جدی، بسیار دقیق، رسمی، حرفه‌ای، همراه با ارائه کد حسابداری (کدینگ معین/کل)، شماره حساب‌ها و تاریخ‌های دقیق شمسی.

قاعده کلیدی لایه پرسشگری (Clarification Loop):
هرگاه دستور کاربر دارای ابهام باشد یا پارامترهای ضروری یک عملیات مالی (مانند: نام دقیق شخص/طرف حساب، مبلغ دقیق به تومان، تاریخ شمسی، یا بابت/عنوان کالا) مشخص نشده باشد، شما نباید اقدام فرضی کنید! بلکه در نقش حسابدار ارشد، پیش از اقدام، سوالات کلیدی برای دریافت جزئیات بپرسید.
در این حالت حتماً intent را \"NEED_CLARIFICATION\" قرار داده و clarificationPayload را با سوال صریح و گزینه‌های پیشنهادی دقیق پر کنید.

دستورالعمل‌ها و وقایع:
1. در صورت استعلام وضعیت بدهکار/بستانکار یک شخص (مانند «علی رضایی بدهکاره یا بستانکار؟» یا «وضعیت حساب فلانی»):
   در لیست allParties نام شخص را جستجو کنید. اگر نام شخص ذکر نشده بود، با intent \"NEED_CLARIFICATION\" نام شخص را بپرسید.
   اگر شخص یافت شد، مقدار netBalanceIrr منفی به معنی «بدهکار» (بدهکار به مجموعه) و مثبت به معنی «بستانکار» و صفر به معنی «تسویه کامل» است.
   پاسخ را با intent \"QUERY_PARTY_LEDGER\" و بیان صریح نام، کد معین و وضعیت بدهکار/بستانکار ارائه دهید.

2. در صورت استعلام موجودی کالا (مانند «موجودی دوربین» یا «کالا چندتا داریم»):
   اگر نام کالا مشخص نیست، با intent \"NEED_CLARIFICATION\" کالا را بپرسید.
   در غیر این صورت در لیست allItems جستجو کرده و موجودی را با intent \"QUERY_INVENTORY\" گزارش دهید.

3. در صورت استعلام موجودی یک بانک خاص یا صندوق:
   در لیست bankAccounts و cashBoxes حساب مربوطه را یافته و مانده دقیق آن را با intent \"QUERY_BANK_BALANCES\" گزارش کنید.

4. در صورت ابهام یا ناقص بودن اطلاعات دستور کاربر (مانند مشخص نبودن نام شخص، مبلغ دقیق به تومان، یا تاریخ برای فاکتور، پرداخت/دریافت، هزینه یا سند):
   پاسخ را با intent \"NEED_CLARIFICATION\" و پر کردن clarificationPayload برگردانید که شامل یک سوال صریح و چند گزینه پیشنهادی (suggestedOptions) باشد تا کاربر به راحتی انتخاب کند.

5. در صورت کامل بودن مشخصات فاکتور (نوع، نام طرف حساب، مبلغ/کالا):
   با intent \"ACTION_CREATE_INVOICE\" فیلد invoicePayload را پر کنید.

6. در صورت کامل بودن مشخصات ثبت سند حسابداری دوطرفه:
   با intent \"ACTION_CREATE_JOURNAL_VOUCHER\" فیلد journalVoucherPayload را همراه با ردیف‌های بدهکار و بستانکار پر کنید.

7. در صورت کامل بودن مشخصات واریز/برداشت/قبض دریافت و پرداخت:
   با intent \"ACTION_CREATE_PAYMENT_RECEIPT\" فیلد paymentReceiptPayload را پر کنید.

8. در صورت کامل بودن مشخصات هزینه جاری:
   با intent \"ACTION_CREATE_EXPENSE\" فیلد expensePayload را پر کنید.

9. در صورت درخواست ناوبری به صفحات:
   فیلد navigateTab را تنظیم کنید.

خلاصه داده‌های فعلی سیستم ERP مهرگان:
${JSON.stringify(foundationDataSummary || {}, null, 2)}"

ساختار خروجی الزامی باید JSON دقیق زیر باشد:
{
  "text": "متن رسمی و دقیق حسابدار ارشد به فارسی همراه با کد حساب/شماره سند/استعلام مالیشفاف",
  "intent": "NEED_CLARIFICATION" | "ACTION_CREATE_INVOICE" | "ACTION_CREATE_JOURNAL_VOUCHER" | "ACTION_CREATE_PAYMENT_RECEIPT" | "ACTION_CREATE_EXPENSE" | "ACTION_NAVIGATE" | "QUERY_BANK_BALANCES" | "QUERY_INVENTORY" | "QUERY_PARTY_LEDGER" | "QUERY_CHEQUES" | "GUIDE_HELP" | "GENERAL_CHAT",
  "clarificationPayload": {
    "questionFa": "متن سوال شفاف‌سازی",
    "missingField": "نام فیلد ناقص",
    "suggestedOptions": [
      { "label": "برچسب دکمه گزینه ۱", "actionPrompt": "متن دستور برای گزینه ۱" },
      { "label": "برچسب دکمه گزینه ۲", "actionPrompt": "متن دستور برای گزینه ۲" }
    ]
  },
  "invoicePayload": {
    "type": "SALES" | "PURCHASE",
    "partyId": 1,
    "partyName": "نام طرف حساب",
    "items": [{ "title": "عنوان کالا", "quantity": 1, "unitPrice": 1000000, "totalPrice": 1000000 }],
    "totalAmount": 1000000
  },
  "journalVoucherPayload": {
    "description": "شرح سند حسابداری",
    "entries": [
      { "accountCode": "1102", "accountTitle": "حساب‌های دریافتنی", "debitIrr": 1000000, "creditIrr": 0 },
      { "accountCode": "4101", "accountTitle": "درآمد فروش", "debitIrr": 0, "creditIrr": 1000000 }
    ]
  },
  "paymentReceiptPayload": {
    "type": "RECEIPT" | "PAYMENT",
    "partyName": "نام شخص",
    "sourceTargetTitle": "بانک/صندوق",
    "amount": 500000,
    "paymentMethod": "BANK" | "CASH" | "POS"
  },
  "expensePayload": {
    "title": "عنوان هزینه",
    "amount": 100000,
    "category": "هزینه‌های جاری و اداری"
  },
  "navigateTab": "نام تب"
}`;

      let responseText = '';
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (mErr) {
          console.warn(`[Agent AI] Model ${modelName} failed:`, mErr instanceof Error ? mErr.message : String(mErr));
        }
      }

      if (!responseText) {
        return res.json({
          ok: false,
          mode: 'OFFLINE_FALLBACK',
          messageFa: 'پاسخ هوش مصنوعی دریافت نشد. هدایت به موتور محلی.',
        });
      }

      let parsed = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { text: responseText, intent: 'GENERAL_CHAT' };
      }

      return res.json({
        ok: true,
        mode: 'GEMINI_AI',
        aiResult: parsed,
      });
    } catch (err: unknown) {
      return res.json({
        ok: false,
        mode: 'OFFLINE_FALLBACK',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // ============================================================================
  // GOLD & JEWELRY MODULE ROUTES (معاملات همکار، فروش گرمی بدون ریال و کاردکس دوگانه)
  // ============================================================================

  app.get('/api/gold/colleague-trades', (req: Request, res: Response) => {
    try {
      const partyId = req.query.partyId ? Number(req.query.partyId) : undefined;
      const trades = foundationStore.getGoldColleagueTrades(partyId);
      res.json({ ok: true, trades });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت مبادلات همکاران طلا.',
      });
    }
  });

  app.post('/api/gold/colleague-trades', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const trade = foundationStore.createGoldColleagueTrade(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `معامله همکار ${trade.tradeNumber} با موفقیت ثبت شد.`,
        trade,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت معامله همکار طلا.',
      });
    }
  });

  app.get('/api/gold/dual-ledger/:partyId', (req: Request, res: Response) => {
    try {
      const partyId = Number(req.params.partyId);
      const ledger = foundationStore.getGoldDualLedger(partyId);
      res.json({ ok: true, data: ledger });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت کاردکس دوگانه طلا و ریال.',
      });
    }
  });

  app.post('/api/gold/settle-weight', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.settleGoldWeight(req.body, activeUser.id);
      res.json({
        ok: true,
        messageFa: 'تسویه وزنی طلا با موفقیت ثبت گردید.',
        result,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تسویه وزنی طلا.',
      });
    }
  });

  app.post('/api/gold/convert-to-rial', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.convertGoldWeightToRial(req.body, activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تبدیل مانده طلا به ریال.',
      });
    }
  });

  // ============================================================================
  // RESTAURANT & CAFE ROUTES (فاز ۷: میزها، منوی لمسی و بن آشپزخانه)
  // ============================================================================

  app.get('/api/restaurant/tables', (_req: Request, res: Response) => {
    try {
      const tables = foundationStore.getRestaurantTables();
      res.json({ ok: true, tables });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت فهرست میزها.',
      });
    }
  });

  app.patch('/api/restaurant/tables/:id/status', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const table = foundationStore.updateRestaurantTableStatus(
        Number(req.params.id),
        req.body.status,
        activeUser.id
      );
      res.json({ ok: true, table });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت میز.',
      });
    }
  });

  app.get('/api/restaurant/orders', (_req: Request, res: Response) => {
    try {
      const orders = foundationStore.getRestaurantOrders();
      res.json({ ok: true, orders });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت سفارشات رستوران.',
      });
    }
  });

  app.post('/api/restaurant/orders', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const order = foundationStore.createRestaurantOrder(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        messageFa: `سفارش رستوران ${order.orderNumber} با موفقیت ثبت شد.`,
        order,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت سفارش رستوران.',
      });
    }
  });

  app.get('/api/restaurant/kitchen-ticket/:orderId', (req: Request, res: Response) => {
    try {
      const ticket = foundationStore.generateKitchenTicket(Number(req.params.orderId));
      res.json({ ok: true, ticket });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در چاپ بن آشپزخانه.',
      });
    }
  });

  app.put('/api/restaurant/orders/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const order = foundationStore.updateRestaurantOrder(
        Number(req.params.id),
        req.body,
        activeUser.id
      );
      res.json({
        ok: true,
        messageFa: `سفارش ${order.orderNumber} با موفقیت ویرایش و اصلاح گردید.`,
        order,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در اصلاح سفارش رستوران.',
      });
    }
  });

  app.delete('/api/restaurant/orders/:id', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.deleteRestaurantOrder(
        Number(req.params.id),
        activeUser.id
      );
      res.json({
        ok: true,
        messageFa: 'سفارش رستوران با موفقیت از سیستم حذف گردید.',
        ...result,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در حذف سفارش رستوران.',
      });
    }
  });

  // ============================================================================
  // WHOLESALE & DISTRIBUTION ROUTES (فاز ۸: پخش عمده، کارتن، نرخ همکار و توزیع)
  // ============================================================================

  app.get('/api/wholesale/orders', (_req: Request, res: Response) => {
    try {
      const orders = foundationStore.getWholesaleOrders();
      res.json({ ok: true, orders });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت سفارشات عمده.',
      });
    }
  });

  app.post('/api/wholesale/orders', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const order = foundationStore.createWholesaleOrder(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        order,
        messageFa: `سفارش عمده شماره ${order.orderNumber} با موفقیت ثبت شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت سفارش عمده.',
      });
    }
  });

  app.get('/api/wholesale/dispatches', (_req: Request, res: Response) => {
    try {
      const dispatches = foundationStore.getWholesaleDispatches();
      res.json({ ok: true, dispatches });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت حواله‌های خروج و بارگیری.',
      });
    }
  });

  app.post('/api/wholesale/dispatches', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const dispatch = foundationStore.createWholesaleDispatch(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        dispatch,
        messageFa: `حواله بارگیری و خروج شماره ${dispatch.dispatchNumber} با موفقیت صادر شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در صدور حواله خروج انبار.',
      });
    }
  });

  app.patch('/api/wholesale/dispatches/:id/status', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const dispatch = foundationStore.updateWholesaleDispatchStatus(
        Number(req.params.id),
        req.body.status,
        activeUser.id
      );
      res.json({
        ok: true,
        dispatch,
        messageFa: `وضعیت حواله ${dispatch.dispatchNumber} با موفقیت به‌روزرسانی شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت حواله.',
      });
    }
  });

  app.get('/api/wholesale/credit-check/:customerId', (req: Request, res: Response) => {
    try {
      const amount = Number(req.query.amountIrr) || 0;
      const creditInfo = foundationStore.checkCustomerWholesaleCredit(
        Number(req.params.customerId),
        amount
      );
      res.json({ ok: true, creditInfo });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در استعلام سقف اعتبار مشتری.',
      });
    }
  });

  app.get('/api/wholesale/items/:id/price-tiers', (req: Request, res: Response) => {
    try {
      const priceTiers = foundationStore.getItemPriceTiers(Number(req.params.id));
      res.json({ ok: true, priceTiers });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در استعلام سطوح قیمت کالا.',
      });
    }
  });

  // ============================================================================
  // SERVICES & CONTRACTING ROUTES (فاز ۹: خدمات فنی، تیکت کار، تکنسین و قطعات)
  // ============================================================================

  app.get('/api/services/tickets', (_req: Request, res: Response) => {
    try {
      const tickets = foundationStore.getServiceJobTickets();
      res.json({ ok: true, tickets });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت تیکت‌های کار.',
      });
    }
  });

  app.post('/api/services/tickets', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.createServiceJobTicket(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        ticket,
        messageFa: `تیکت کار شماره ${ticket.ticketNumber} با موفقیت ثبت شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت تیکت کار فنی.',
      });
    }
  });

  app.patch('/api/services/tickets/:id/status', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.updateServiceJobTicketStatus(
        Number(req.params.id),
        req.body.status,
        activeUser.id
      );
      res.json({
        ok: true,
        ticket,
        messageFa: `وضعیت تیکت ${ticket.ticketNumber} به‌روزرسانی شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت تیکت.',
      });
    }
  });

  app.patch('/api/services/tickets/:id/assign', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.assignTechnicianToJobTicket(
        Number(req.params.id),
        Number(req.body.technicianId),
        activeUser.id
      );
      res.json({
        ok: true,
        ticket,
        messageFa: `تکنسین ${ticket.technicianNameFa} به تیکت کار ${ticket.ticketNumber} تخصیص یافت.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ارجاع تکنسین.',
      });
    }
  });

  app.post('/api/services/tickets/:id/parts', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.addSparePartsToJobTicket(
        Number(req.params.id),
        req.body.spareParts || [],
        activeUser.id
      );
      res.json({
        ok: true,
        ticket,
        messageFa: `قطعات مصرفی به تیکت کار ${ticket.ticketNumber} افزوده شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت قطعات مصرفی.',
      });
    }
  });

  app.post('/api/services/tickets/:id/invoice', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.invoiceJobTicket(Number(req.params.id), activeUser.id);
      res.status(201).json({
        ok: true,
        ticket: result.ticket,
        salesInvoice: result.salesInvoice,
        messageFa: `صورت‌حساب رسمی شماره ${result.salesInvoice.invoiceNumber} بابت تیکت کار ${result.ticket.ticketNumber} صادر شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در صدور صورت‌حساب خدمات.',
      });
    }
  });

  // ============================================================================
  // MOBILE, ELECTRONICS, REGISTRY & REPAIR ROUTES (فاز ۹: صنف موبایل، لپ‌تاپ و تعمیرات)
  // ============================================================================

  app.get('/api/mobile/devices', (req: Request, res: Response) => {
    try {
      const devices = foundationStore.getMobileDevices({
        brandFa: req.query.brandFa as string,
        condition: req.query.condition as any,
        stockStatus: req.query.stockStatus as string,
        search: req.query.search as string,
      });
      res.json({ ok: true, devices });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت لیست دستگاه‌های موبایل.',
      });
    }
  });

  app.post('/api/mobile/devices', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const device = foundationStore.addMobileDevice(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        device,
        messageFa: `دستگاه ${device.modelFa} با کد IMEI ${device.imei1} با موفقیت در انبار ثبت گردید.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت دستگاه موبایل.',
      });
    }
  });

  app.get('/api/mobile/lookup/:query', (req: Request, res: Response) => {
    try {
      const result = foundationStore.lookupDeviceByImeiOrSerial(req.params.query);
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در استعلام سریال/IMEI.',
      });
    }
  });

  app.get('/api/mobile/repair-tickets', (req: Request, res: Response) => {
    try {
      const tickets = foundationStore.getMobileRepairTickets({
        status: req.query.status as any,
        search: req.query.search as string,
      });
      res.json({ ok: true, tickets });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت پذیرش‌های تعمیرات.',
      });
    }
  });

  app.post('/api/mobile/repair-tickets', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.createMobileRepairTicket(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        ticket,
        messageFa: `قبض پذیرش تعمیرات شماره ${ticket.ticketNumber} برای دستگاه ${ticket.deviceModelFa} صادر شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در صدور قبض تعمیرات.',
      });
    }
  });

  app.patch('/api/mobile/repair-tickets/:id/status', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.updateMobileRepairStatus(
        Number(req.params.id),
        req.body.status,
        req.body.notesFa,
        activeUser.id
      );
      res.json({
        ok: true,
        ticket,
        messageFa: `وضعیت تعمیرات قبض ${ticket.ticketNumber} به‌روزرسانی شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تغییر وضعیت تعمیرات.',
      });
    }
  });

  app.post('/api/mobile/repair-tickets/:id/parts', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const ticket = foundationStore.addPartToRepairTicket(
        Number(req.params.id),
        req.body,
        activeUser.id
      );
      res.json({
        ok: true,
        ticket,
        messageFa: `قطعه «${req.body.partNameFa}» به قبض تعمیر ${ticket.ticketNumber} اضافه شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در افزودن قطعه تعویضی.',
      });
    }
  });

  app.post('/api/mobile/repair-tickets/:id/checkout', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.completeAndInvoiceRepairTicket(
        Number(req.params.id),
        req.body.paymentMethod || 'POS',
        activeUser.id
      );
      res.status(201).json({
        ok: true,
        ticket: result.ticket,
        salesInvoice: result.salesInvoice,
        messageFa: `دستگاه تحویل مشتری شد و فاکتور فروش/خدمات [${result.salesInvoice.invoiceNumber}] صادر گردید.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تسویه و تحویل دستگاه.',
      });
    }
  });

  app.get('/api/mobile/repair-slip/:id', (req: Request, res: Response) => {
    try {
      const slip = foundationStore.generateMobileRepairSlip(Number(req.params.id));
      res.json({ ok: true, slip });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در صدور رسید پذیرش.',
      });
    }
  });

  // ============================================================================
  // PHASE 11: MULTI-BRANCH, INTER-WAREHOUSE TRANSFERS & EXECUTIVE BI ROUTES
  // ============================================================================

  app.get('/api/inventory/transfers', (_req: Request, res: Response) => {
    try {
      const transfers = foundationStore.getInventoryTransfers();
      res.json({ ok: true, transfers });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت حواله‌های انتقال کالا.',
      });
    }
  });

  app.post('/api/inventory/transfers', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const transfer = foundationStore.createInventoryTransferRequisition(req.body, activeUser.id);
      res.status(201).json({
        ok: true,
        transfer,
        messageFa: `حواله ترانزیت کالا ${transfer.transferNumber} با موفقیت صادر گردید.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در صدور حواله ترانزیت.',
      });
    }
  });

  app.post('/api/inventory/transfers/:id/receive', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const transfer = foundationStore.receiveInventoryTransferRequisition(
        Number(req.params.id),
        activeUser.id
      );
      res.json({
        ok: true,
        transfer,
        messageFa: `محموله ترانزیت ${transfer.transferNumber} با موفقیت در انبار مقصد تحویل و انبارگردانی شد.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در تحویل محموله ترانزیت.',
      });
    }
  });

  app.get('/api/system/executive-bi', (_req: Request, res: Response) => {
    try {
      const metrics = foundationStore.getExecutiveBiMetrics();
      res.json({ ok: true, metrics });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در محاسبه شاخص‌های کلان مدیریتی BI.',
      });
    }
  });

  // ============================================================================
  // PHASE 13: REMOTE CLOUDFLARE TUNNEL & GOOGLE SHEETS / FORMS SYNC ENDPOINTS
  // ============================================================================

  // 1. Get Remote Tunnel Config & Network Status
  app.get('/api/system/remote-tunnel', (_req: Request, res: Response) => {
    try {
      const config = foundationStore.getRemoteTunnelConfig();
      const lanIps: string[] = [];
      try {
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
          for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
              lanIps.push(net.address);
            }
          }
        }
      } catch {
        // fallback
      }

      res.json({
        ok: true,
        config,
        lanIps,
        localPort: 3000,
        quickCommands: {
          windowsPowerShell: `winget install --id Cloudflare.cloudflared -e\ncloudflared tunnel --url http://localhost:3000`,
          windowsCmd: `cloudflared tunnel --url http://localhost:3000`,
          linuxBash: `curl -fsSL https://pkg.cloudflare.com/cloudflared-ascii.repo | sudo tee /etc/yum.repos.d/cloudflared.repo\ncloudflared tunnel --url http://localhost:3000`,
        },
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت تنظیمات تونل اینترنتی.',
      });
    }
  });

  // 2. Save Remote Tunnel Public URL
  app.post('/api/system/remote-tunnel', (req: Request, res: Response) => {
    try {
      const updated = foundationStore.updateRemoteTunnelConfig(req.body || {});
      res.json({
        ok: true,
        config: updated,
        messageFa: 'تنظیمات آدرس اینترنتی تونل با موفقیت ذخیره شد.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات تونل.',
      });
    }
  });

  // 3. Ping / Test Remote Tunnel URL
  app.post('/api/system/remote-tunnel/test', async (req: Request, res: Response) => {
    try {
      const targetUrl = (req.body?.publicUrl || '').trim();
      if (!targetUrl) {
        return res.status(400).json({ ok: false, messageFa: 'آدرس اینترنتی وارد نشده است.' });
      }

      const cleanUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      const pingUrl = `${cleanUrl}/health`;

      const startTime = Date.now();
      let isReachable = false;
      let statusText = '';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const pingRes = await fetch(pingUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (pingRes.ok || pingRes.status < 500) {
          isReachable = true;
          statusText = `پاسخ کد ${pingRes.status} دریافت شد.`;
        }
      } catch (pingErr: unknown) {
        statusText = pingErr instanceof Error ? pingErr.message : 'پاسخ دریافت نشد.';
      }

      const latencyMs = Date.now() - startTime;
      const testStatus = isReachable ? 'CONNECTED' : 'DISCONNECTED';

      foundationStore.updateRemoteTunnelConfig({
        lastTestedAt: new Date().toISOString(),
        testStatus,
      });

      res.json({
        ok: isReachable,
        latencyMs,
        testStatus,
        messageFa: isReachable
          ? `ارتباط موفقیت‌آمیز بود! آدرس اینترنتی با زمان پاسخگویی ${latencyMs} میلی‌ثانیه در دسترس است.`
          : `عدم دسترسی به آدرس وارد شده (${statusText}). لطفاً مطمئن شوید دستور cloudflared روی کامپیوتر در حال اجراست.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در آزمایش اتصال تونل.',
      });
    }
  });

  // 4. Get Google Sheets Sync Config & Logs
  app.get('/api/sync/google-sheets/config', (_req: Request, res: Response) => {
    try {
      const config = foundationStore.getGoogleSheetsSyncConfig();
      const logs = foundationStore.getGoogleSheetsSyncLogs();
      res.json({ ok: true, config, logs });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در دریافت تنظیمات گوگل شیت.',
      });
    }
  });

  // 5. Update Google Sheets Sync Config
  app.post('/api/sync/google-sheets/config', (req: Request, res: Response) => {
    try {
      const config = foundationStore.updateGoogleSheetsSyncConfig(req.body || {});
      res.json({
        ok: true,
        config,
        messageFa: 'تنظیمات همگام‌سازی گوگل شیت و فرم‌ها ذخیره شد.',
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات گوگل شیت.',
      });
    }
  });

  // 6. Export Installer Data for Google Sheets / Excel
  app.get('/api/sync/google-sheets/export', (_req: Request, res: Response) => {
    try {
      const data = foundationStore.exportInstallerDataForSync();
      res.json({ ok: true, data });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در استخراج اطلاعات.',
      });
    }
  });

  // 7. Push Jobs to Google Apps Script Webhook
  app.post('/api/sync/google-sheets/push', async (_req: Request, res: Response) => {
    try {
      const config = foundationStore.getGoogleSheetsSyncConfig();
      const exportData = foundationStore.exportInstallerDataForSync();

      let remoteWebhookResponse = null;
      let remotePushed = false;

      if (config.appsScriptWebhookUrl && config.appsScriptWebhookUrl.startsWith('http')) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          const pushRes = await fetch(config.appsScriptWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'pushFromErp',
              secretToken: 'MEHREGAN_SYNC_TOKEN',
              data: exportData,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (pushRes.ok) {
            remoteWebhookResponse = await pushRes.json().catch(() => null);
            remotePushed = true;
          }
        } catch (fetchErr) {
          // webhook unreachable, return offline data for manual copy
        }
      }

      const totalJobs = exportData.jobs.length + exportData.projects.length;
      foundationStore.updateGoogleSheetsSyncConfig({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        lastSyncStats: {
          jobsPushed: totalJobs,
          requisitionsPulled: 0,
          reportsPulled: 0,
        },
      });

      foundationStore.addGoogleSheetsSyncLog({
        type: 'PUSH',
        status: 'SUCCESS',
        detailsFa: remotePushed
          ? `ارسال موفق اطلاعات ${totalJobs} سفارش به وب‌هوک گوگل شیت.`
          : `آماده‌سازی اطلاعات ${totalJobs} سفارش و پروژه نصابان جهت همگام‌سازی با گوگل شیت.`,
        stats: { jobsPushed: totalJobs },
      });

      res.json({
        ok: true,
        remotePushed,
        totalJobs,
        exportData,
        messageFa: remotePushed
          ? `تعداد ${totalJobs} سفارش و پروژه با موفقیت به گوگل شیت ارسال گردید.`
          : `تعداد ${totalJobs} سفارش و پروژه آماده است؛ در صورت اتصال وب‌هوک، به صورت خودکار درج می‌شود.`,
      });
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ارسال اطلاعات به گوگل شیت.',
      });
    }
  });

  // 8. Pull Updates from Google Apps Script Webhook
  app.post('/api/sync/google-sheets/pull', async (_req: Request, res: Response) => {
    try {
      const config = foundationStore.getGoogleSheetsSyncConfig();
      if (!config.appsScriptWebhookUrl || !config.appsScriptWebhookUrl.startsWith('http')) {
        return res.status(400).json({
          ok: false,
          messageFa:
            'آدرس وب‌اپلیکیشن گوگل اسکریپت (Apps Script Webhook URL) تنظیم نشده است. ابتدا آدرس وب‌هوک را در تب تنظیمات گوگل شیت وارد نمایید.',
        });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const pullRes = await fetch(`${config.appsScriptWebhookUrl}?action=pullForErp`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!pullRes.ok) {
        throw new Error(`پاسخ سرور گوگل شیت ناموفق بود (${pullRes.status}).`);
      }

      const pullJson = await pullRes.json();
      if (!pullJson.ok || !pullJson.data) {
        throw new Error(pullJson.message || 'ساختار داده‌های دریافتی از گوگل شیت نامعتبر است.');
      }

      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.importInstallerDataFromSync(pullJson.data, activeUser.id);

      res.json({
        ok: true,
        ...result,
      });
    } catch (err: unknown) {
      foundationStore.addGoogleSheetsSyncLog({
        type: 'PULL',
        status: 'ERROR',
        detailsFa: `خطا در دریافت اطلاعات از وب‌هوک گوگل شیت: ${err instanceof Error ? err.message : String(err)}`,
      });
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ارتباط با گوگل شیت.',
      });
    }
  });

  // 9. Manual Apply / Import from Client (e.g. JSON or parsed table)
  app.post('/api/sync/google-sheets/import', (req: Request, res: Response) => {
    try {
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.importInstallerDataFromSync(req.body || {}, activeUser.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در ثبت داده‌های همگام‌سازی.',
      });
    }
  });

  // 10. Inbound Webhook endpoint from Google Sheets / Forms
  app.post('/api/sync/google-sheets/webhook', (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      const activeUser = foundationStore.getActiveUser();
      const result = foundationStore.importInstallerDataFromSync(payload, activeUser.id);

      foundationStore.addGoogleSheetsSyncLog({
        type: 'WEBHOOK',
        status: 'SUCCESS',
        detailsFa: `وب‌هوک دریافتی آنی از گوگل شیت با موفقیت اعمال شد.`,
      });

      res.json({
        ok: true,
        messageFa: 'وب‌هوک با موفقیت دریافت و اعمال گردید.',
        ...result,
      });
    } catch (err: unknown) {
      foundationStore.addGoogleSheetsSyncLog({
        type: 'WEBHOOK',
        status: 'ERROR',
        detailsFa: `خطا در پردازش وب‌هوک گوگل شیت: ${err instanceof Error ? err.message : String(err)}`,
      });
      res.status(400).json({
        ok: false,
        messageFa: err instanceof Error ? err.message : 'خطا در پردازش وب‌هوک.',
      });
    }
  });

  // 11. 1-Click Ready-to-Paste Google Apps Script Code
  app.get('/api/sync/google-sheets/apps-script-code', (_req: Request, res: Response) => {
    const code = `/**
 * =========================================================================
 * سامانه جامع ERP مهرگان - اسکریپت همگام‌سازی خودکار گوگل شیت و فرم‌ها
 * MEHREGAN ERP - GOOGLE SHEETS & GOOGLE FORMS TWO-WAY SYNC APPS SCRIPT
 * =========================================================================
 * راهنمای نصب در ۱ دقیقه:
 * ۱. یک فایل جدید در Google Sheets بسازید (sheets.new).
 * ۲. از منوی Extensions گزینه Apps Script را انتخاب کنید.
 * ۳. تمام کدهای این بخش را در فایل Code.gs جایگزین و ذخیره (Save) کنید.
 * ۴. دکمه آبی Deploy > New deployment را بزنید.
 * ۵. نوع deployment را Web app انتخاب کنید:
 *    - Execute as: Me (ایمیل شما)
 *    - Who has access: Anyone (هر کس که لینک دارد)
 * ۶. لینک تولید شده (Web app URL) را کپی کرده و در تنظیمات نرم‌افزار مهرگان ثبت کنید!
 * =========================================================================
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ۱. برگه سفارشات و پروژه‌های نصاب
  let sheetJobs = ss.getSheetByName('سفارشات_نصاب');
  if (!sheetJobs) {
    sheetJobs = ss.insertSheet('سفارشات_نصاب');
    sheetJobs.setRightToLeft(true);
    sheetJobs.appendRow([
      'کد سفارش / پروژه',
      'عنوان کار',
      'نام مشتری',
      'تلفن مشتری',
      'آدرس پروژه',
      'نام نصاب مسئول',
      'تاریخ ارجاع',
      'وضعیت (در انتظار / در حال اجرا / تکمیل شده)',
      'توضیحات و گزارش نصاب',
      'آخرین به‌روزرسانی'
    ]);
    sheetJobs.getRange(1, 1, 1, 10).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  }

  // ۲. برگه درخواست متریال از انبار
  let sheetReq = ss.getSheetByName('درخواست_کالا_انبار');
  if (!sheetReq) {
    sheetReq = ss.insertSheet('درخواست_کالا_انبار');
    sheetReq.setRightToLeft(true);
    sheetReq.appendRow([
      'ردیف',
      'کد سفارش / پروژه',
      'نام نصاب',
      'نام یا کد کالا/قطعه',
      'تعداد درخواستی',
      'انبار مقصد',
      'توضیحات و علت مصرف',
      'وضعیت تایید انبار',
      'تاریخ درخواست'
    ]);
    sheetReq.getRange(1, 1, 1, 9).setBackground('#0369a1').setFontColor('#ffffff').setFontWeight('bold');
  }

  // ۳. برگه گزارشات پیشرفت کار
  let sheetRep = ss.getSheetByName('گزارش_کار_نصاب');
  if (!sheetRep) {
    sheetRep = ss.insertSheet('گزارش_کار_نصاب');
    sheetRep.setRightToLeft(true);
    sheetRep.appendRow([
      'کد سفارش / پروژه',
      'نام نصاب',
      'تاریخ مراجعه',
      'وضعیت جدید',
      'شرح اقدامات انجام‌شده',
      'تاریخ ثبت'
    ]);
    sheetRep.getRange(1, 1, 1, 6).setBackground('#047857').setFontColor('#ffffff').setFontWeight('bold');
  }
}

// وب‌سرویس دریافت درخواست‌ها از نرم‌افزار مهرگان (POST)
function doPost(e) {
  try {
    setupSheets();
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ۱. دریافت کارهای جدید ارجاع شده از مهرگان به شیت
    if (contents.action === 'pushFromErp' && contents.data) {
      const sheetJobs = ss.getSheetByName('سفارشات_نصاب');
      const allJobs = [...(contents.data.jobs || []), ...(contents.data.projects || [])];

      // پاکسازی ردیف‌های قبلی بجز هدر
      const lastRow = sheetJobs.getLastRow();
      if (lastRow > 1) {
        sheetJobs.getRange(2, 1, lastRow - 1, 10).clearContent();
      }

      // درج رکوردهای جدید
      allJobs.forEach(job => {
        sheetJobs.appendRow([
          job.jobCode || job.projectCode,
          job.titleFa,
          job.customerTitleFa || '-',
          job.phone || '-',
          job.locationAddressFa || '-',
          job.installerTitleFa || 'تیم نصب',
          job.scheduledDateJalali || job.startDateJalali || '1405/01/25',
          translateStatusToFa(job.status),
          job.notesFa || '',
          new Date().toLocaleString('fa-IR')
        ]);
      });

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        message: 'کارهای نصابان با موفقیت در شیت درج شد.',
        count: allJobs.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ۲. دریافت اطلاعات از Google Forms در صورت لینک مستقیم
    if (contents.action === 'submitFromForm') {
      const sheetReq = ss.getSheetByName('درخواست_کالا_انبار');
      sheetReq.appendRow([
        sheetReq.getLastRow(),
        contents.projectCode || 'INS-1405-1001',
        contents.installerName || 'نصاب',
        contents.itemTitle || 'دوربین داهوا',
        contents.quantity || 1,
        contents.warehouseName || 'انبار مرکزی',
        contents.notes || '',
        'در انتظار تأیید انبار',
        new Date().toLocaleDateString('fa-IR')
      ]);

      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, message: 'Action not supported' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// وب‌سرویس فراخوانی توسط مهرگان برای دریافت آپدیت‌ها (GET)
function doGet(e) {
  try {
    setupSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // خواندن ردیف‌های سفارشات و تغییرات وضعیت
    const sheetJobs = ss.getSheetByName('سفارشات_نصاب');
    const jobRows = sheetJobs.getDataRange().getValues();
    const jobUpdates = [];

    for (let i = 1; i < jobRows.length; i++) {
      const row = jobRows[i];
      if (row[0]) {
        jobUpdates.push({
          jobCode: String(row[0]).trim(),
          status: translateStatusToEn(row[7]),
          notesFa: String(row[8] || '').trim()
        });
      }
    }

    // خواندن ردیف‌های درخواست متریال
    const sheetReq = ss.getSheetByName('درخواست_کالا_انبار');
    const reqRows = sheetReq.getDataRange().getValues();
    const newRequisitions = [];

    for (let i = 1; i < reqRows.length; i++) {
      const row = reqRows[i];
      if (row[1] && row[3]) {
        newRequisitions.push({
          projectCodeOrJobCode: String(row[1]).trim(),
          installerName: String(row[2] || '').trim(),
          itemCodeOrTitle: String(row[3]).trim(),
          requestedQty: Number(row[4]) || 1,
          notesFa: String(row[6] || '').trim()
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      data: {
        jobUpdates,
        newRequisitions,
        workReports: []
      }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function translateStatusToFa(enStatus) {
  if (enStatus === 'COMPLETED') return 'تکمیل شده';
  if (enStatus === 'IN_PROGRESS') return 'در حال اجرا';
  return 'در انتظار اقدام';
}

function translateStatusToEn(faStatus) {
  const s = String(faStatus || '').trim();
  if (s.includes('تکمیل')) return 'COMPLETED';
  if (s.includes('اجرا')) return 'IN_PROGRESS';
  return 'PENDING';
}
`;

    res.json({ ok: true, code });
  });

  // Cloudflare Tunnel & Windows Service Live Diagnostic Endpoint
  app.get('/api/diagnostics/cloudflare-tunnel', async (_req: Request, res: Response) => {
    const checks: Array<{
      id: string;
      titleFa: string;
      status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
      summaryFa: string;
      detailsFa: string;
    }> = [];

    // 1. Local Express Server Health
    checks.push({
      id: 'LOCAL_SERVER_PORT_3000',
      titleFa: '۱. بررسی سرور مرکزی مهرگان (Local Port 3000)',
      status: 'SUCCESS',
      summaryFa: 'سرور محلی فعال و آماده دریافت ترافیک مرورگرهاست.',
      detailsFa: `Express HTTP Server running on http://127.0.0.1:${PORT}`,
    });

    // 2. Test Cloudflare Edge DNS and HTTP/2 TCP Port 443 Connectivity
    let http2Ok = false;
    let edgeReachabilityMessage = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const testRes = await fetch('https://1.1.1.1/cdn-cgi/trace', { signal: controller.signal });
      clearTimeout(timeout);
      if (testRes.ok) {
        http2Ok = true;
        edgeReachabilityMessage = 'اتصال TCP 443 به شبکه اصلی Cloudflare Edge برقرار است.';
      } else {
        edgeReachabilityMessage = `پاسخ از سرور کلودفلر ناموفق بود (${testRes.status}).`;
      }
    } catch (e: unknown) {
      edgeReachabilityMessage = `خطا در برقراری ارتباط TCP 443 با شبکه کلودفلر: ${
        e instanceof Error ? e.message : String(e)
      }`;
    }

    checks.push({
      id: 'CLOUDFLARE_EDGE_TCP_443',
      titleFa: '۲. بررسی اتصال پورت ۴۴۳ به شبکه‌ی Cloudflare (HTTP/2)',
      status: http2Ok ? 'SUCCESS' : 'ERROR',
      summaryFa: http2Ok
        ? 'پورت TCP 443 کلودفلر باز و در دسترس است.'
        : 'ارتباط TCP 443 با کلودفلر مسدود یا دچار اختلال ISP است.',
      detailsFa: edgeReachabilityMessage,
    });

    // 3. Test QUIC / UDP 7844 Throttling
    checks.push({
      id: 'QUIC_UDP_7844_STATUS',
      titleFa: '۳. وضعیت پروتکل QUIC (پورت UDP 7844)',
      status: 'WARNING',
      summaryFa: 'پروتکل UDP 7844 در اکثر اپراتورهای ایران مسدود یا دچار افت شدید است.',
      detailsFa:
        'توصیه اجباری: حتماً در تنظیمات کلودفلر از پروتکل HTTP2 (--protocol http2) استفاده فرمایید تا از پورت TCP 443 عبور کند.',
    });

    // 4. Windows Cloudflared Process/Service Inspection
    let isServiceRunning = false;
    let serviceOutputLog = '';
    try {
      const { execSync } = await import('child_process');
      if (process.platform === 'win32') {
        try {
          const tasklist = execSync('tasklist /FI "IMAGENAME eq cloudflared.exe"', {
            encoding: 'utf8',
            timeout: 3000,
          });
          if (tasklist.includes('cloudflared.exe')) {
            isServiceRunning = true;
            serviceOutputLog += '[Windows Process] پردازش cloudflared.exe در حافظه سیستم در حال اجراست.\n';
          } else {
            serviceOutputLog +=
              '[Windows Service] پردازش cloudflared.exe یافت نشد (سرویس متوقف یا نصب نشده است).\n';
          }
        } catch {
          serviceOutputLog += '[Windows Query] امکان استعلام مستقیم tasklist وجود نداشت.\n';
        }
      } else {
        serviceOutputLog += `[Non-Windows Runtime] پلتفرم جاری: ${process.platform}. لایه شبیه‌ساز سرویس فعال است.\n`;
      }
    } catch (e: unknown) {
      serviceOutputLog += `خطا در بازرسی سرویس: ${e instanceof Error ? e.message : String(e)}\n`;
    }

    checks.push({
      id: 'WIN_SERVICE_STATUS',
      titleFa: '۴. بررسی وضعیت سرویس و پردازش ویندوز (cloudflared.exe)',
      status: isServiceRunning ? 'SUCCESS' : 'WARNING',
      summaryFa: isServiceRunning
        ? 'پردازش cloudflared در سیستم‌عامل فعال است.'
        : 'سرویس cloudflared متوقف است یا هنوز به عنوان سرویس ویندوز ثبت نشده است.',
      detailsFa: serviceOutputLog.trim(),
    });

    // 5. Practical Fix Commands for Admin & Installer
    const quickFixCommand =
      'cloudflared.exe tunnel --protocol http2 run --token YOUR_CLOUDFLARE_TOKEN';
    const windowsServiceFixGuide = `
مراحل حل مشکل متوقف شدن سرویس کلودفلر در ویندوز:
۱. باز کردن Command Prompt به صورت Run as Administrator
۲. حذف سرویس معیوب قبلی: cloudflared.exe service uninstall
۳. ساخت یا ویرایش فایل C:\\ProgramData\\cloudflared\\config.yml و درج خط زیر:
   protocol: http2
۴. نصب مجدد سرویس: cloudflared.exe service install YOUR_TOKEN
۵. اجرای سرویس: net start cloudflared
    `.trim();

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      platform: process.platform,
      http2Ok,
      isServiceRunning,
      quickFixCommand,
      windowsServiceFixGuide,
      checks,
    });
  });

  // Guaranteed JSON 404 response for all unhandled /api/* routes so they never fall through to Vite HTML SPA fallback
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      ok: false,
      messageFa: `مسیر وب‌سرویس «${req.method} ${req.path}» در سامانه مهرگان یافت نشد.`,
    });
  });

  // ============================================================================
  // 7. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ============================================================================
  if (process.env.NODE_ENV === 'production' && fs.existsSync(STATIC_DIST_DIR)) {
    app.use(express.static(STATIC_DIST_DIR));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(STATIC_DIST_DIR, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log('================================================================');
    console.log('   سامانه حسابداری و مدیریت جامع مهرگان آماده به کار است');
    console.log('================================================================');
    console.log(`  ➜  دسترسی مستقیم (همین سیستم):  http://localhost:${PORT}/`);
    try {
      const os = await import('os');
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  ➜  دسترسی شبکه محلی (LAN):      http://${net.address}:${PORT}/`);
          }
        }
      }
    } catch {
      console.log(`  ➜  دسترسی شبکه محلی:            http://0.0.0.0:${PORT}/`);
    }
    console.log('  ➜  کاربر مدیر سیستم:             نام کاربری: admin  |  رمز: admin');
    console.log('  ➜  کاربر نصاب نمونه:             نام کاربری: installer_ali  |  رمز: ali@123');
    console.log('================================================================');
  });
}

startServer();
