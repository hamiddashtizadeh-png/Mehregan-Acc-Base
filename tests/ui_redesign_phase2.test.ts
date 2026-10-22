import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 2 UI Redesign: Main Header (App.tsx) & DashboardView', () => {
  it('verifies App.tsx uses UI Primitives and preserves 3-zone header, RTL, and all 13 modules', () => {
    const appSource = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');

    // Uses UI Primitives
    assert.ok(appSource.includes("from './components/ui'"), 'App.tsx must import from ./components/ui');
    assert.ok(appSource.includes('<Button'), 'App.tsx must use Button primitive');
    assert.ok(appSource.includes('<Card'), 'App.tsx must use Card primitive');

    // Preserves RTL
    assert.ok(appSource.includes('dir="rtl"'), 'App.tsx must preserve dir="rtl"');

    // Preserves all 13 WorkspaceTabs
    const expectedModules = [
      'DASHBOARD',
      'SALES',
      'PURCHASES',
      'PARTIES',
      'INVENTORY',
      'ACCOUNTING',
      'TREASURY',
      'INSTALLATION',
      'DEPLOYMENT',
      'USERS',
      'RBAC',
      'AUDIT',
      'SETTINGS_HEALTH',
    ];
    for (const mod of expectedModules) {
      assert.ok(
        appSource.includes(`setActiveTab('${mod}')`),
        `App.tsx must preserve navigation handler for module ${mod}`
      );
    }

    // Preserves profile conditions
    assert.ok(appSource.includes('SUPERMARKET_GROCERY'), 'App.tsx must preserve SUPERMARKET_GROCERY profile logic');
    assert.ok(appSource.includes('RETAIL_GENERAL'), 'App.tsx must preserve RETAIL_GENERAL profile logic');
    assert.ok(appSource.includes('CCTV_SECURITY'), 'App.tsx must preserve CCTV_SECURITY profile logic');
    assert.ok(
      appSource.includes('enableDoubleEntryAccounting'),
      'App.tsx must preserve enableDoubleEntryAccounting guard'
    );
  });

  it('verifies DashboardView.tsx uses UI Primitives and preserves all 3 industry profiles & calculations', () => {
    const dashSource = fs.readFileSync(path.join(process.cwd(), 'src/components/DashboardView.tsx'), 'utf8');

    // Uses UI Primitives
    assert.ok(dashSource.includes("from './ui'"), 'DashboardView.tsx must import from ./ui');
    assert.ok(dashSource.includes('<Card'), 'DashboardView.tsx must use Card primitive');
    assert.ok(dashSource.includes('<Button'), 'DashboardView.tsx must use Button primitive');
    assert.ok(dashSource.includes('<Table>'), 'DashboardView.tsx must use Table primitive');
    assert.ok(dashSource.includes('<Input'), 'DashboardView.tsx must use Input primitive');

    // Preserves all 3 profiles
    assert.ok(dashSource.includes('SUPERMARKET_GROCERY'), 'DashboardView.tsx must support SUPERMARKET_GROCERY');
    assert.ok(dashSource.includes('RETAIL_GENERAL'), 'DashboardView.tsx must support RETAIL_GENERAL');
    assert.ok(dashSource.includes('CCTV_SECURITY'), 'DashboardView.tsx must support CCTV_SECURITY');

    // Preserves tabular-nums and font-mono for monetary amounts
    assert.ok(dashSource.includes('tabular-nums'), 'DashboardView.tsx must use tabular-nums for financial figures');
  });
});
