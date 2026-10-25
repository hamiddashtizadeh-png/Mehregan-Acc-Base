import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TEST_FILES = [
  'tests/foundation.test.ts',
  'tests/parties.test.ts',
  'tests/inventory.test.ts',
  'tests/purchases.test.ts',
  'tests/sales.test.ts',
  'tests/installation.test.ts',
  'tests/treasury.test.ts',
  'tests/treasury_settlement_control.test.ts',
  'tests/accounting.test.ts',
  'tests/double_entry_toggle_control.test.ts',
  'tests/stage10_profitability_fiscal.test.ts',
  'tests/stage11_projects_consumption.test.ts',
  'tests/stage12.test.ts',
  'tests/stage13.test.ts',
  'tests/industry_profiles.test.ts',
  'tests/industry_themes_phase1.test.ts',
  'tests/industry_selection_phase2.test.ts',
  'tests/industry_experience_phase3.test.ts',
  'tests/general_retail_phase4.test.ts',
  'tests/supermarket_grocery_phase5.test.ts',
  'tests/gold_jewelry_phase6.test.ts',
  'tests/restaurant_cafe_phase7.test.ts',
  'tests/wholesale_distribution_phase8.test.ts',
  'tests/mobile_electronics_phase9.test.ts',
  'tests/services_contracting_phase10.test.ts',
  'tests/enterprise_multibranch_phase11.test.ts',
  'tests/executive_bi_fiscal_phase12.test.ts',
  'tests/ui_primitives_phase1.test.ts',
  'tests/ui_redesign_phase2.test.ts',
  'tests/cheque_and_recovery_remediation.test.ts',
  'tests/remediation_services_and_depreciation.test.ts',
  'tests/inventory_transfer_remediation.test.ts',
  'tests/persistence_safety.test.ts',
  'tests/security_sessions_and_rbac.test.ts',
  'scripts/test-industry-cctv.ts',
  'scripts/test-industry-retail.ts',
  'scripts/test-industry-gold.ts',
  'scripts/test-industry-restaurant.ts',
  'scripts/test-industry-wholesale.ts',
  'scripts/test-industry-mobile.ts',
  'scripts/test-industry-contracting.ts',
  'scripts/test-industry-enterprise.ts',
];

console.log('========================================================================');
console.log(`🚀 MEHREGAN BUSINESS SUITE — EXECUTING FULL DETERMINISTIC TEST SUITE (${TEST_FILES.length} FILES)`);
console.log('========================================================================');

const dataDir = path.join(process.cwd(), '.mehregan-data');
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
}

let passedCount = 0;
let failedCount = 0;
const failedFiles: string[] = [];

const startTime = Date.now();

for (const testFile of TEST_FILES) {
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  const filePath = path.join(process.cwd(), testFile);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${testFile}`);
    failedCount++;
    failedFiles.push(testFile);
    continue;
  }

  process.stdout.write(`\n▶️  [RUNNING] ${testFile} ... `);

  const result = spawnSync('npx', ['tsx', testFile], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status === 0) {
    passedCount++;
    process.stdout.write(`✅ PASSED\n`);
  } else {
    failedCount++;
    failedFiles.push(testFile);
    process.stdout.write(`❌ FAILED\n`);
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
  }
}

const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n========================================================================');
console.log(`📊 TEST SUITE SUMMARY (Duration: ${totalDurationSec}s)`);
console.log(`   Total Test Suites: ${TEST_FILES.length}`);
console.log(`   Passed:            ${passedCount}`);
console.log(`   Failed:            ${failedCount}`);
console.log('========================================================================');

if (failedCount > 0) {
  console.error(`❌ Failed test files:`);
  failedFiles.forEach((f) => console.error(`   - ${f}`));
  process.exit(1);
} else {
  console.log(`🎉 ALL ${passedCount} TEST SUITES PASSED FLAWLESSLY!`);
  process.exit(0);
}
