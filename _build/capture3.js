/* 重拍知识库跑马灯：带上下文留白 */
const path = require('path');
const { chromium } = require('playwright-core');
const OUT = 'd:\\VibeCodingDemo\\需求单\\assets\\weight';
const PORTAL = 'http://127.0.0.1:8125/online-health-care/';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'zh-CN' });
  const page = await ctx.newPage();
  await page.goto(PORTAL + 'online-service.html', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(800);
  const box = await page.locator('.kb').first().boundingBox();
  const pad = 14;
  await page.screenshot({
    path: path.join(OUT, 'kbroll.png'),
    clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 },
  });
  console.log('kbroll redone', JSON.stringify(box));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
