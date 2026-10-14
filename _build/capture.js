/* 需求单配图抓取：用 Edge 内核逐页截取真实页面 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const OUT_ROOT = 'd:\\VibeCodingDemo\\需求单\\assets';
const S = 'http://127.0.0.1:8125/';
const PORTAL = S + 'online-health-care/';
const WEIGHT = S + encodeURI('减重/Weight-Management/');
const PE = S + 'physical-examination/';

const KILL_ANIM = `*{animation-duration:0s !important;animation-delay:0s !important;transition-duration:0s !important;transition-delay:0s !important;}`;

async function prep(page) {
  await page.addStyleTag({ content: KILL_ANIM }).catch(() => {});
  // 触发 IntersectionObserver 类入场动画
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.7);
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  }).catch(() => {});
}

const shots = [];
function rec(group, name, caption, extra) {
  const rel = `${group}/${name}.png`;
  shots.push(Object.assign({ group, name, caption, file: rel }, extra || {}));
  return path.join(OUT_ROOT, group, name + '.png');
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', args: ['--force-color-profile=srgb'] });
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
    colorScheme: 'light',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  const go = async (url) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    });
    await page.waitForTimeout(600);
    await prep(page);
  };
  const shotFull = async (file) => { await page.screenshot({ path: file, fullPage: true }); };
  const shotEl = async (sel, file) => {
    const loc = page.locator(sel).first();
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(250);
    await loc.screenshot({ path: file });
  };
  const task = async (label, fn) => {
    try { await fn(); console.log('OK   ' + label); }
    catch (e) { console.log('FAIL ' + label + ' :: ' + String(e.message).split('\n')[0]); }
  };

  /* ---------------- Portal ---------------- */
  await task('portal/index', async () => {
    await go(PORTAL + 'index.html');
    await shotFull(rec('portal', 'portal-index', 'Portal 预览导航页（老客 / 新客两个入口）', { url: PORTAL + 'index.html' }));
  });
  await task('portal/home-old', async () => {
    await go(PORTAL + 'online-service.html');
    await shotFull(rec('portal', 'portal-home-old', 'Portal 首页 · 老客态（日常 / 专项 / 问诊三模块）', { url: PORTAL + 'online-service.html' }));
  });
  await task('portal/home-new', async () => {
    await go(PORTAL + 'online-service.html?state=new');
    await shotFull(rec('portal', 'portal-home-new', 'Portal 首页 · 新客态（健康扫描引导）', { url: PORTAL + 'online-service.html?state=new' }));
  });
  await task('portal/menu', async () => {
    await go(PORTAL + 'online-service.html');
    await page.locator('.topbar__more').first().click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: rec('portal', 'portal-state-menu', '右上角「···」状态切换菜单展开', { url: PORTAL + 'online-service.html' }) , clip: { x: 0, y: 0, width: 430, height: 360 } });
  });
  await task('portal/loading', async () => {
    await go(PORTAL + 'report-loading.html');
    await page.waitForTimeout(800);
    await shotFull(rec('portal', 'portal-report-loading', '新客「开始健康扫描」加载中转页', { url: PORTAL + 'report-loading.html' }));
  });
  await task('portal/module1', async () => {
    await go(PORTAL + 'online-service.html');
    await shotEl('.dh-list', rec('portal', 'portal-module1-old', '模块① 日常健康管理 · 老客四张事项卡', { url: PORTAL + 'online-service.html' }));
  });
  await task('portal/module1-new', async () => {
    await go(PORTAL + 'online-service.html?state=new');
    await shotEl('.onboard', rec('portal', 'portal-module1-new', '模块① 日常健康管理 · 新客引导卡', { url: PORTAL + 'online-service.html?state=new' }));
  });
  await task('portal/card-stages', async () => {
    await go(PORTAL + 'online-service.html');
    const box = page.locator('.wcard').first();
    await box.scrollIntoViewIfNeeded();
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(500);
      const st = await page.evaluate(() => {
        const c = document.querySelector('[data-wlcard]');
        return {
          stage: c ? (c.getAttribute('data-stage') || '') : '',
          chip: (document.querySelector('[data-stage-toggle]') || {}).textContent || '',
        };
      });
      const n = (st.stage || String(i + 1)).trim() || String(i + 1);
      await box.screenshot({ path: rec('weight', 'card-stage-' + n, `科学减重卡 · 阶段${n}（状态标签「${(st.chip || '').trim()}」）`, { url: PORTAL + 'online-service.html' }) });
      await page.locator('[data-stage-toggle]').first().click();
    }
  });

  /* ---------------- 科学减重卡片 ---------------- */
  await task('weight/card-styles', async () => {
    await go(WEIGHT + 'card-styles.html');
    await shotFull(rec('weight', 'card-styles', '卡片版式设计稿 v3.1（5 张静态卡总览）', { url: WEIGHT + 'card-styles.html' }));
  });
  for (const r of [{ h: '', n: 'demo-home', c: '可点击 Demo App 首页卡片' }, { h: '#/education', n: 'demo-education', c: 'Demo · T1 科普模板' }, { h: '#/assessment', n: 'demo-assessment', c: 'Demo · T2 问卷评测模板' }, { h: '#/tracking', n: 'demo-tracking', c: 'Demo · T6 数据记录模板' }, { h: '#/review', n: 'demo-review', c: 'Demo · T7 回顾模板' }]) {
    await task('weight/' + r.n, async () => {
      await go(WEIGHT + 'index.html' + r.h);
      await shotFull(rec('weight', r.n, r.c, { url: WEIGHT + 'index.html' + r.h }));
    });
  }
  await task('weight/plan', async () => {
    await go(PORTAL + 'weight-management-plan/index.html');
    await shotFull(rec('weight', 'plan-page', '定制减重方案页（评估结论 / 用药方案 / 剂量爬坡 / 生活配合）', { url: PORTAL + 'weight-management-plan/index.html' }));
  });
  await task('weight/edu-list', async () => {
    await go(PORTAL + 'patient-education/index.html');
    await shotFull(rec('weight', 'education-list', '患者科普知识库 · 列表（入门课 + 按阶段推荐 + 按主题）', { url: PORTAL + 'patient-education/index.html' }));
  });
  await task('weight/edu-article', async () => {
    await go(PORTAL + 'patient-education/index.html');
    const a = page.locator('a[href*="#/a/"]').first();
    await a.click({ timeout: 8000 });
    await page.waitForTimeout(900);
    await shotFull(rec('weight', 'education-article', '患者科普知识库 · 文章详情（正文 + FAQ + 审核医生）', { url: PORTAL + 'patient-education/index.html#/a/…' }));
  });
  await task('weight/invoice', async () => {
    await go(PORTAL + 'Invoice-Review-Page/index.html');
    await shotFull(rec('weight', 'invoice-page', '确认购药页 · 处方核对 + 知情同意 + 费用确认', { url: PORTAL + 'Invoice-Review-Page/index.html' }));
  });
  await task('weight/invoice-signed', async () => {
    await go(PORTAL + 'Invoice-Review-Page/index.html');
    await page.locator('#ckAgree').check({ timeout: 5000 }).catch(() => {});
    await page.locator('#signBtn').click({ timeout: 5000 });
    await page.waitForTimeout(600);
    await page.locator('#addrLink').click({ timeout: 5000 }).catch(() => {});
    const ta = page.locator('#addrInput, #addrPanel input, #addrPanel textarea').first();
    await ta.fill('上海市静安区南京西路 1266 号 25F').catch(() => {});
    await page.locator('#addrBtn').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(600);
    await shotFull(rec('weight', 'invoice-signed', '确认购药页 · 双前置完成（已签署 + 地址已保存）', { url: PORTAL + 'Invoice-Review-Page/index.html' }));
  });
  await task('weight/recap', async () => {
    await go(PORTAL + 'Journey-Recap/index.html');
    await shotFull(rec('weight', 'recap-full', '结营回顾 · 8 屏滚动叙事（整页）', { url: PORTAL + 'Journey-Recap/index.html' }));
  });
  await task('weight/assistant', async () => {
    await go(PORTAL + 'weight-management/Weight-loss-assistant/index.html?entry=4&planName=' + encodeURIComponent('GLP-1 标准方案') + '&planStage=' + encodeURIComponent('进行中') + '&week=4&totalWeeks=12');
    await page.waitForTimeout(1500);
    await shotFull(rec('weight', 'assistant-entry4', 'AI 减重助理 · entry=4 方案场景（带方案 / 周次上下文）', { url: PORTAL + 'weight-management/Weight-loss-assistant/index.html?entry=4' }));
  });
  await task('weight/agent-old', async () => {
    await go(PORTAL + 'weight-loss-agent-page/index.html');
    await page.waitForTimeout(1200);
    await shotFull(rec('weight', 'agent-old', '早期对话页「减重顾问」（与新版并存，参数契约不同）', { url: PORTAL + 'weight-loss-agent-page/index.html' }));
  });
  await task('weight/assess', async () => {
    await go(PORTAL + 'weight-management/Medication-eligibility-assessment/index.html');
    await shotFull(rec('weight', 'assess-page', 'T2 用药适应性评估（购前「测一测」）', { url: PORTAL + 'weight-management/Medication-eligibility-assessment/index.html' }));
  });
  await task('weight/followup', async () => {
    await go(PORTAL + 'weight-management/Follow-up-assessment/index.html');
    await shotFull(rec('weight', 'followup-page', 'T2 疗程随访评估（复查 / 转诊入口）', { url: PORTAL + 'weight-management/Follow-up-assessment/index.html' }));
  });

  /* ---------------- 体检报告解读 ---------------- */
  const pePages = [
    ['male.html', 'pe-overview', '体检报告解读 · 成人男性（张先生 38 岁）整页'],
    ['female.html', 'pe-female', '体检报告解读 · 成人女性（李女士 36 岁）'],
    ['child.html', 'pe-child', '体检报告解读 · 儿童（乐乐 8 岁）· 方案 B 儿童定制系统'],
    ['elder.html', 'pe-elder', '体检报告解读 · 老年女性（王阿姨 68 岁）· 7 系统布局'],
    ['zhang-plan.html', 'pe-zhang-plan', '个人健康改善计划书 · 张先生（5 章 + 目录）'],
    ['physical-system-demo.html', 'pe-system-demo', '各系统健康状态 · SVG 坐标设计稿 v4（规范源）'],
    ['agent-page/index.html', 'pe-agent', 'AI 深度解析 · 对话采集页'],
    ['agent-page/plan.html', 'pe-plan', '个人健康改善计划书 · 动态生成页'],
    ['Physical-consultant/agent-page/index.html', 'pe-consultant', '体检套餐选购顾问（另一条产品线）'],
  ];
  for (const [p, name, cap] of pePages) {
    await task('pe/' + name, async () => {
      await go(PE + p);
      await page.waitForTimeout(800);
      await shotFull(rec('physical', name, cap, { url: PE + p }));
    });
  }
  await task('pe/sysmap', async () => {
    await go(PE + 'male.html');
    await shotEl('.sysmap__canvas', rec('physical', 'pe-sysmap', '③ 各系统健康状态 · 人体示意图（SVG 卡片 + 人像 + 热区）', { url: PE + 'male.html' }));
  });
  await task('pe/sysdetail', async () => {
    await go(PE + 'male.html');
    await page.evaluate(() => {
      const z = document.querySelector('.sysmap__zone');
      if (z) z.click();
    });
    await page.waitForTimeout(700);
    await shotEl('#sysDetail', rec('physical', 'pe-sysdetail', '③ 系统详情卡（状态 / 主要关注指标 / 解读 / CTA）', { url: PE + 'male.html' }));
  });
  await task('pe/issue', async () => {
    await go(PE + 'male.html');
    await shotEl('.issues, #issues, .issue-list', rec('physical', 'pe-issues', '② 重点问题卡（3 张 + 查看详情 + 面诊入口）', { url: PE + 'male.html' }));
  });

  await browser.close();
  fs.writeFileSync(path.join(OUT_ROOT, 'shots.json'), JSON.stringify(shots, null, 2), 'utf8');
  console.log('\nTOTAL ' + shots.length);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
