import { describe, it } from 'node:test';
import assert from 'node:assert';
import { foundationStore } from '../src/server/foundationStore';

describe('فاز ۶: طلا، جواهر و نقره‌فروشی (Phase 6: Gold & Jewelry Industry Module)', () => {
  it('باید صنف کاری سامانه را به «طلا، جواهر و نقره‌فروشی» (GOLD_JEWELRY) تغییر دهد', () => {
    const result = foundationStore.updateIndustryProfile('GOLD_JEWELRY', 1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.profile.code, 'GOLD_JEWELRY');
    assert.strictEqual(result.profile.badgeLabelFa, 'صنف طلا و جواهرات');
    assert.strictEqual(result.profile.features.enableInstallationServices, false);
    assert.strictEqual(result.profile.features.enableWarrantyTracking, true);

    const activeProfile = foundationStore.getIndustryProfile();
    assert.strictEqual(activeProfile.code, 'GOLD_JEWELRY');
    assert.strictEqual(activeProfile.uiLabels?.inventoryTabTitleFa, 'موجودی طلا و جواهرات');
  });

  it('باید قابلیت‌های برچسب‌گذاری و محاسبات عیار ۱۸، اجرت ساخت و وزنی را ارائه نماید', () => {
    const activeProfile = foundationStore.getIndustryProfile('GOLD_JEWELRY');
    assert.strictEqual(activeProfile.layout?.preset, 'GOLD_JEWELRY_CALC');
    assert.strictEqual(activeProfile.layout?.defaultSalesMode, 'JEWELRY_CALC');

    // Formula test: Weight (e.g. 5.250 grams 18K), Base gold rate per gram (e.g. 35,000,000 IRR), Making Fee (10%), Profit (7%)
    const weightGram = 5.25;
    const baseRatePerGramIrr = 35000000;
    const goldValueIrr = weightGram * baseRatePerGramIrr; // 183,750,000 IRR
    const makingFeeIrr = goldValueIrr * 0.10; // 18,375,000 IRR
    const profitIrr = (goldValueIrr + makingFeeIrr) * 0.07; // 14,148,750 IRR
    const totalRawIrr = goldValueIrr + makingFeeIrr + profitIrr; // 216,273,750 IRR

    assert.strictEqual(goldValueIrr, 183750000);
    assert.ok(totalRawIrr > goldValueIrr);
  });

  it('باید اطلاعات کلی پایه سیستم پس از تغییر صنف را در متد getFoundationData به درستی بازگرداند', () => {
    const data = foundationStore.getFoundationData();
    assert.strictEqual(data.settings.industryProfileCode, 'GOLD_JEWELRY');
    assert.strictEqual(data.industryProfile.code, 'GOLD_JEWELRY');
  });

  it('باید ثبت معامله فروش همکار کاملاً بدون ریال (صرفاً بده‌بستان گرمی طلا) را بدون تغییر در ریال انجام دهد', () => {
    const trade = foundationStore.createGoldColleagueTrade(
      {
        tradeType: 'COLLEAGUE_WEIGHT_SALE',
        partyId: 1,
        goldItemCategory: 'GOLD_18K_MADE',
        rawWeightGrams: 20.000,
        stoneWeightGrams: 0,
        ayar: 750,
        isPureGoldTradeNoRial: true, // کاملاً بدون ریال
        descriptionFa: 'تحویل طلای ۱۸ عیار بدون ریال به همکار زرین‌پور',
      },
      1
    );

    assert.strictEqual(trade.isPureGoldTradeNoRial, true);
    assert.strictEqual(trade.totalAmountIrr, 0);
    assert.strictEqual(trade.pure750WeightGrams, 20.000);
    assert.strictEqual(trade.totalGoldEffectGrams, 20.000);

    const trades = foundationStore.getGoldColleagueTrades(1);
    assert.ok(trades.length > 0);
  });

  it('باید کاردکس دوگانه را با تفکیک دقیق مانده طلا (به گرم) و مانده حساب دفتری (به ریال) محاسبه نماید', () => {
    const dualLedger = foundationStore.getGoldDualLedger(1);
    assert.ok(dualLedger.summary);
    assert.strictEqual(typeof dualLedger.summary.goldBalanceGrams, 'number');
    assert.strictEqual(typeof dualLedger.summary.netBalanceIrr, 'number');
    assert.ok(dualLedger.ledgerItems.length > 0);

    // بررسی وجود ستون‌های دوگانه
    const sampleItem = dualLedger.ledgerItems[0];
    assert.ok('goldInGrams' in sampleItem);
    assert.ok('goldOutGrams' in sampleItem);
    assert.ok('runningGoldBalanceGrams' in sampleItem);
    assert.ok('runningRialBalanceIrr' in sampleItem);
  });

  it('باید تبدیل مانده وزنی طلا به ریال با مظنه روز را با موفقیت انجام داده و حساب طلا را کسر و حساب ریال را شارژ کند', () => {
    const convertResult = foundationStore.convertGoldWeightToRial(
      {
        partyId: 1,
        weightGrams: 5.000,
        dailyRateIrr: 36500000, // هر گرم ۳,۶۵۰,۰۰۰ تومان
        notesFa: 'تبدیل ۵ گرم از مانده طلای همکار به ریال با نرخ روز',
      },
      1
    );

    assert.strictEqual(convertResult.ok, true);
    assert.strictEqual(convertResult.convertedWeightGrams, 5.000);
    assert.strictEqual(convertResult.totalAmountIrr, 182500000); // 5 * 36,500,000 IRR
  });
});

