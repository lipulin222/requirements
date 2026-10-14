/* 全量校验：file:// 直接打开（不依赖本地服务），检查破图、目录、关联链接可达性、灯箱 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = 'd:\\VibeCodingDemo\\需求单';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (/^(assets|assets-opt|_build)/.test(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

(async () => {
  const files = walk(ROOT).sort();
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  const page = await ctx.newPage();
  let badBtn = 0, badLink = 0, links = 0;

  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    await page.goto('file:///' + f.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 40000 }).catch((e) => console.log('LOADFAIL ' + rel + ' ' + e.message));
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); }
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(250);

    const r = await page.evaluate(() => ({
      broken: Array.from(document.images).filter((i) => i.getAttribute('src') && !i.naturalWidth).map((i) => (i.getAttribute('src') || '').slice(0, 40)),
      imgs: document.images.length,
      toc: document.querySelectorAll('.toc a').length,
      figs: document.querySelectorAll('.fig').length,
      xrefs: Array.from(document.querySelectorAll('a.xref')).map((a) => a.getAttribute('href')),
    }));

    // 校验关联需求单链接在磁盘上真实存在
    const missing = [];
    for (const href of new Set(r.xrefs)) {
      links++;
      const target = path.resolve(path.dirname(f), decodeURI(href));
      if (!fs.existsSync(target)) missing.push(href);
    }

    if (r.broken.length || missing.length) {
      badBtn += r.broken.length ? 1 : 0;
      badLink += missing.length ? 1 : 0;
      console.log(`FAIL    ${rel}  破图=${r.broken.length} 失效关联=${missing.length} ${missing.join(',')}`);
    } else {
      console.log(`OK      ${rel}  (图 ${r.figs} · 目录 ${r.toc} · 关联链接 ${new Set(r.xrefs).size})`);
    }
  }

  // 灯箱交互抽查（当前需求单不含截图则跳过）
  let open = { hidden: false, nat: 1 }, shut = true;
  const doc = files.find((f) => /REQ-WL-STATUS-01/.test(f)) || files.find((f) => !/index\.html$/.test(f));
  if (doc) {
    await page.goto('file:///' + doc.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const im = page.locator('.fig__shot img').first();
    if (await im.count()) {
      await im.click();
      await page.waitForTimeout(350);
      open = await page.evaluate(() => ({ hidden: document.getElementById('lb').hidden, nat: document.getElementById('lbImg').naturalWidth }));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
      shut = await page.evaluate(() => document.getElementById('lb').hidden);
    } else {
      console.log('\n（当前需求单无界面截图，灯箱抽查跳过）');
    }
  }

  console.log(`\n页面 ${files.length} 个；破图页面 ${badBtn}；关联链接失效页面 ${badLink}（共校验 ${links} 条）`);
  console.log(`灯箱：打开=${!open.hidden} 原图宽=${open.nat} Esc关闭=${shut}`);
  await browser.close();
  process.exit(badBtn || badLink || open.hidden || !shut ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
