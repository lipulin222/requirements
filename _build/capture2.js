/* 补齐：文章详情、购药双前置、体检各模块、提醒卡与跑马灯 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const OUT_ROOT = 'd:\\VibeCodingDemo\\需求单\\assets';
const S = 'http://127.0.0.1:8125/';
const PORTAL = S + 'online-health-care/';
const PE = S + 'physical-examination/';

const shots = [];
function rec(group, name, caption, extra) {
  shots.push(Object.assign({ group, name, caption, file: `${group}/${name}.png` }, extra || {}));
  return path.join(OUT_ROOT, group, name + '.png');
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', args: ['--force-color-profile=srgb'] });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'zh-CN', colorScheme: 'light' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const KILL = `*{animation-duration:0s !important;transition-duration:0s !important;}`;

  const go = async (url) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    });
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: KILL }).catch(() => {});
  };
  const task = async (label, fn) => {
    try { await fn(); console.log('OK   ' + label); }
    catch (e) { console.log('FAIL ' + label + ' :: ' + String(e.message).split('\n')[0]); }
  };

  await task('edu-article', async () => {
    await go(PORTAL + 'patient-education/index.html');
    await page.locator('[data-act="art"]').first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: rec('weight', 'education-article', '患者科普 · 文章详情（正文 + FAQ + 相关阅读 + 审核医生）', { url: PORTAL + 'patient-education/index.html#/a/{id}' }), fullPage: true });
  });

  await task('invoice-signed', async () => {
    await go(PORTAL + 'Invoice-Review-Page/index.html');
    await page.locator('#signLink').click();
    await page.waitForTimeout(300);
    await page.locator('#ckAgree').check();
    await page.locator('#signBtn').click();
    await page.waitForTimeout(400);
    await page.locator('#addrLink').click();
    await page.waitForTimeout(300);
    await page.locator('#addrDetail').fill('南京西路 1266 号 25F');
    await page.locator('#addrBtn').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: rec('weight', 'invoice-signed', '确认购药 · 双前置完成（已签署知情同意 + 地址已保存）', { url: PORTAL + 'Invoice-Review-Page/index.html' }), fullPage: true });
  });

  await task('portal-rk', async () => {
    await go(PORTAL + 'online-service.html');
    const l = page.locator('.rk').first();
    await l.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await l.screenshot({ path: rec('weight', 'reminder-card', '提醒卡（续费阶段置顶，右上「切换 / 问助理」，共 8 条提醒）', { url: PORTAL + 'online-service.html' }) });
  });

  await task('portal-kbroll', async () => {
    await go(PORTAL + 'online-service.html');
    const l = page.locator('.kb').first();
    await l.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await l.screenshot({ path: rec('weight', 'kbroll', '知识库入口跑马灯（.kbroll，2.6s 一轮）', { url: PORTAL + 'online-service.html' }) });
  });

  const mods = [
    [0, 'pe-module1', '① 健康总览（年度 / 姓名 / 报告日期 / 整体标签 / AI 摘要）'],
    [1, 'pe-issues', '② 重点问题（3 张问题卡 + 查看详情 + 面诊入口）'],
    [2, 'pe-sysmap-module', '③ 各系统健康状态（人体示意图 + 热区）'],
    [3, 'pe-trend', '④ 健康趋势（指标 Tab + 折线对比）'],
    [4, 'pe-lifestyle', '⑤ 生活方式管理（四段式干预卡 + AI 深度建议）'],
    [5, 'pe-followup', '⑥ 随访计划（日常 / 1 个月 / 3 个月 / 6 个月）'],
  ];
  for (const [i, name, cap] of mods) {
    await task(name, async () => {
      await go(PE + 'male.html');
      const l = page.locator('section.module').nth(i);
      await l.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await l.screenshot({ path: rec('physical', name, cap, { url: PE + 'male.html' }) });
    });
  }

  await browser.close();
  const f = path.join(OUT_ROOT, 'shots2.json');
  fs.writeFileSync(f, JSON.stringify(shots, null, 2), 'utf8');
  console.log('\nTOTAL ' + shots.length);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
