/* 需求单 md -> 自包含 HTML（图片内联为 data URI、关联需求单可点击、目录、灯箱）+ 索引页 */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = 'd:\\VibeCodingDemo\\需求单';
const ASSETS = path.join(ROOT, 'assets');
const OPT = path.join(ROOT, 'assets-opt');

/* ---- 图片清单（optimize.js 产出） ---- */
const mfPath = path.join(OPT, 'manifest.json');
const MANIFEST = fs.existsSync(mfPath) ? JSON.parse(fs.readFileSync(mfPath, 'utf8')) : {};
const uriCache = {};
function dataUri(rel) {
  if (!uriCache[rel]) {
    const buf = fs.readFileSync(path.join(OPT, rel));
    uriCache[rel] = 'data:image/webp;base64,' + buf.toString('base64');
  }
  return uriCache[rel];
}

const STAGES = ['weight/card-stage-1', 'weight/card-stage-2', 'weight/card-stage-3', 'weight/card-stage-4', 'weight/card-stage-5'];

const DOCS = [
  /* ================= 跨项目 · 规范与对单 ================= */
  {
    md: '待确认问题清单.md',
    title: '待确认问题清单（评审对单用）',
    project: '跨项目 · 规范与对单', pri: 'P0',
    desc: '阻塞项 / 冲突 / 缺失 / 待决策 / 缺陷，逐条给建议',
    code: 'REQ-BASE-01',
    figs: [],
  },
  {
    md: '数据上报规范.md',
    title: '数据上报规范（埋点）',
    project: '跨项目 · 规范与对单', pri: 'P0',
    desc: '两端统一的事件模型、公共参数、重试与合规',
    code: 'REQ-BASE-02',
    cover: 'weight/demo-tracking',
    figs: [],
  },

  /* ================= 线上健康 Portal ================= */
  {
    md: '线上健康portal/REQ-P01-Portal首页框架与新老用户双态.md',
    title: 'REQ-P01 · Portal 首页框架与新老用户双态',
    project: '线上健康 Portal', pri: 'P0',
    desc: '单页三模块 + 新老双状态的 Portal 骨架',
    cover: 'portal/portal-home-old',
    figs: [
      { before: '范围', imgs: ['portal/portal-index', 'portal/portal-home-old', 'portal/portal-home-new'] },
      { before: '交互与规则细节', imgs: ['portal/portal-state-menu', 'portal/portal-report-loading'] },
    ],
  },
  {
    md: '线上健康portal/REQ-P02-日常健康管理模块.md',
    title: 'REQ-P02 · 日常健康管理模块',
    project: '线上健康 Portal', pri: 'P0',
    desc: '老客事项卡 + 新客健康扫描引导',
    cover: 'portal/portal-module1-old',
    figs: [
      { before: '范围', imgs: ['portal/portal-home-old'] },
      { before: '交互与规则细节', imgs: ['portal/portal-module1-old', 'portal/portal-module1-new'] },
    ],
  },
  {
    md: '线上健康portal/REQ-P03-专项健康管理模块.md',
    title: 'REQ-P03 · 专项健康管理模块与科学减重卡容器',
    project: '线上健康 Portal', pri: 'P0',
    desc: '专项容器 + 减重卡结构 + 专项标签行',
    cover: 'weight/card-stage-3',
    figs: [
      { before: '范围', imgs: ['portal/portal-home-old'] },
      { before: '交互与规则细节', grid: STAGES },
    ],
  },
  {
    md: '线上健康portal/REQ-P04-线上问诊模块.md',
    title: 'REQ-P04 · 线上问诊模块',
    project: '线上健康 Portal', pri: 'P1',
    desc: '在线问诊 + 线上家庭医生，新客专属 CTA',
    cover: 'portal/portal-home-new',
    figs: [
      { before: '范围', imgs: ['portal/portal-home-old'] },
      { before: '交互与规则细节', imgs: ['portal/portal-home-new'] },
    ],
  },
  {
    md: '线上健康portal/REQ-P05-跨页跳转与参数契约.md',
    title: 'REQ-P05 · 跨页跳转与参数契约、工程收口',
    project: '线上健康 Portal', pri: 'P1',
    desc: '环境化域名、入口参数对齐、上下文脱敏',
    cover: 'physical/pe-agent',
    figs: [
      { before: '交互与规则细节', imgs: ['portal/portal-home-old', 'weight/assistant-entry4', 'portal/portal-report-loading'] },
    ],
  },

  /* ================= 科学减重卡片 ================= */
  {
    md: '科学减重卡片/REQ-W01-卡片模型与模板装配规范.md',
    title: 'REQ-W01 · 卡片模型与模板装配规范',
    project: '科学减重卡片', pri: 'P0',
    desc: '7 个功能模板 × 5 个服务阶段 + 装配表',
    cover: 'weight/card-styles',
    figs: [
      { before: '范围', imgs: ['weight/card-styles'] },
      { before: '交互与规则细节', grid: STAGES },
    ],
  },
  {
    md: '科学减重卡片/REQ-W02-Portal科学减重卡5态渲染.md',
    title: 'REQ-W02 · Portal 科学减重卡 5 态渲染',
    project: '科学减重卡片', pri: 'P0',
    desc: '状态标签循环 + 5 个阶段核心区规格',
    cover: 'weight/card-stage-1',
    figs: [
      { before: '范围', imgs: ['portal/portal-home-old'] },
      { before: '交互与规则细节', grid: STAGES },
    ],
  },
  {
    md: '科学减重卡片/REQ-W03-知识库跑马灯与提醒卡.md',
    title: 'REQ-W03 · 知识库跑马灯与提醒卡',
    project: '科学减重卡片', pri: 'P1',
    desc: '.kbroll 轮播 + 8 条提醒卡与切换',
    cover: 'weight/reminder-card',
    figs: [
      { before: '范围', imgs: ['weight/reminder-card', 'weight/kbroll'] },
    ],
  },
  {
    md: '科学减重卡片/REQ-W04-可点击Demo-App.md',
    title: 'REQ-W04 · 减重服务应用（原可点击 Demo → 上线改造）',
    project: '科学减重卡片', pri: 'P0',
    desc: '路由单页 + 7 模板详情 + 调试器（均需生产化改造）',
    cover: 'weight/demo-home',
    figs: [
      { before: '范围', imgs: ['weight/demo-home', 'weight/card-styles'] },
      { before: '交互与规则细节', imgs: ['weight/demo-education', 'weight/demo-assessment', 'weight/demo-tracking', 'weight/demo-review'] },
    ],
  },
  {
    md: '科学减重卡片/REQ-W05-AI减重助理分入口.md',
    title: 'REQ-W05 · AI 减重助理（entry 1–8 分入口）',
    project: '科学减重卡片', pri: 'P0',
    desc: '场景化开场 + 上下文读取 + 咨询小结',
    cover: 'weight/assistant-entry4',
    figs: [
      { before: '范围', imgs: ['weight/assistant-entry4'] },
      { before: '交互与规则细节', imgs: ['weight/agent-old'] },
    ],
  },
  {
    md: '科学减重卡片/REQ-W06-评估类页面.md',
    title: 'REQ-W06 · 评估类页面',
    project: '科学减重卡片', pri: 'P1',
    desc: '用药适应性评估 + 疗程随访评估',
    cover: 'weight/assess-page',
    figs: [
      { before: '范围', imgs: ['weight/assess-page'] },
      { before: '交互与规则细节', imgs: ['weight/followup-page'] },
    ],
  },
  {
    md: '科学减重卡片/REQ-W07-减重方案与科普知识库.md',
    title: 'REQ-W07 · 定制减重方案页与患者科普知识库',
    project: '科学减重卡片', pri: 'P0',
    desc: '方案 6 模块 + 15 篇科普与文章详情',
    cover: 'weight/plan-page',
    figs: [
      { before: '范围', imgs: ['weight/plan-page'] },
      { before: '交互与规则细节', imgs: ['weight/education-list', 'weight/education-article'] },
    ],
  },
  {
    md: '科学减重卡片/REQ-W08-购药与结营回顾.md',
    title: 'REQ-W08 · 确认购药与结营回顾',
    project: '科学减重卡片', pri: 'P0',
    desc: '双前置解锁支付 + 8 屏结营叙事',
    cover: 'weight/invoice-signed',
    figs: [
      { before: '范围', imgs: ['weight/invoice-page'] },
      { before: '交互与规则细节', imgs: ['weight/invoice-signed', 'weight/recap-full'] },
    ],
  },
  {
    md: '科学减重卡片/REQ-W09-口径统一与文案合规.md',
    title: 'REQ-W09 · 口径统一与文案合规',
    project: '科学减重卡片', pri: 'P0',
    desc: '价格/周期/数量口径 + 文案红线',
    cover: 'weight/invoice-signed',
    figs: [
      { before: '现状', imgs: ['weight/card-styles', 'weight/invoice-signed'] },
      { before: '交互与规则细节', imgs: ['weight/card-stage-2'] },
    ],
  },

  /* ================= 体检报告解读 ================= */
  {
    md: '体检报告解读/REQ-E01-解读页整体框架与案例体系.md',
    title: 'REQ-E01 · 解读页整体框架与案例体系',
    project: '体检报告解读', pri: 'P0',
    desc: '6 模块骨架 + 多案例体系与切换菜单',
    cover: 'physical/pe-overview',
    figs: [
      { before: '范围', imgs: ['physical/pe-overview'] },
      { before: '交互与规则细节', imgs: ['physical/pe-female', 'physical/pe-child', 'physical/pe-elder'] },
    ],
  },
  {
    md: '体检报告解读/REQ-E02-健康总览与重点问题.md',
    title: 'REQ-E02 · 健康总览与重点问题',
    project: '体检报告解读', pri: 'P0',
    desc: '结论前置：整体标签 + AI 摘要 + 3 张问题卡',
    cover: 'physical/pe-module1',
    figs: [
      { before: '范围', imgs: ['physical/pe-module1'] },
      { before: '交互与规则细节', imgs: ['physical/pe-issues'] },
    ],
  },
  {
    md: '体检报告解读/REQ-E03-各系统健康状态地图.md',
    title: 'REQ-E03 · 各系统健康状态地图',
    project: '体检报告解读', pri: 'P0',
    desc: 'SVG 卡片 + 人像 + 热区 + 详情卡',
    cover: 'physical/pe-sysmap',
    figs: [
      { before: '范围', imgs: ['physical/pe-sysmap'] },
      { before: '交互与规则细节', imgs: ['physical/pe-sysmap-module', 'physical/pe-sysdetail', 'physical/pe-system-demo'] },
    ],
  },
  {
    md: '体检报告解读/REQ-E04-健康趋势.md',
    title: 'REQ-E04 · 健康趋势',
    project: '体检报告解读', pri: 'P1',
    desc: '指标 Tab + 折线（需改数据驱动）',
    cover: 'physical/pe-trend',
    figs: [{ before: '范围', imgs: ['physical/pe-trend'] }],
  },
  {
    md: '体检报告解读/REQ-E05-生活方式管理.md',
    title: 'REQ-E05 · 生活方式管理',
    project: '体检报告解读', pri: 'P1',
    desc: '四段式干预卡 + AI 深度建议入口',
    cover: 'physical/pe-lifestyle',
    figs: [
      { before: '范围', imgs: ['physical/pe-lifestyle'] },
      { before: '交互与规则细节', imgs: ['physical/pe-child'] },
    ],
  },
  {
    md: '体检报告解读/REQ-E06-随访计划.md',
    title: 'REQ-E06 · 随访计划',
    project: '体检报告解读', pri: 'P1',
    desc: '四档随访 + 提醒通道（需结构化）',
    cover: 'physical/pe-followup',
    figs: [{ before: '范围', imgs: ['physical/pe-followup'] }],
  },
  {
    md: '体检报告解读/REQ-E07-AI深度解析与计划书链路.md',
    title: 'REQ-E07 · AI 深度解析与计划书链路',
    project: '体检报告解读', pri: 'P0',
    desc: '③/⑤ CTA → 采集页 → 个人健康改善计划书',
    cover: 'physical/pe-plan',
    figs: [
      { before: '范围', imgs: ['physical/pe-agent'] },
      { before: '交互与规则细节', imgs: ['physical/pe-plan', 'physical/pe-zhang-plan'] },
    ],
  },
  {
    md: '体检报告解读/REQ-E08-儿童版方案B.md',
    title: 'REQ-E08 · 儿童版「方案 B：儿童定制系统」',
    project: '体检报告解读', pri: 'P1',
    desc: '7 个儿童定制系统 + 监护人授权',
    cover: 'physical/pe-child',
    figs: [
      { before: '范围', imgs: ['physical/pe-child'] },
      { before: '交互与规则细节', imgs: ['physical/pe-elder'] },
    ],
  },
];

/* ===== 减重项目专用需求单（新命名：REQ-WL-{模块}-{序号}） ===== */
const WL_DOCS = [
  {
    md: '减重/REQ-WL-STATUS-01-减重卡进行中状态与跨渠道购药判定.md',
    module: 'STATUS', code: 'REQ-WL-STATUS-01', pri: 'P0', status: '待评审',
    desc: '三渠道（线上/客服/线下）处方 + 支付判定 → 健康订阅区置顶减重卡并进入「进行中」',
    demos: [
      ['线上服务页', 'https://lipulin222.github.io/online-health-care/online-service.html'],
      ['确认购药页', 'https://lipulin222.github.io/online-health-care/Invoice-Review-Page/index.html'],
      ['AI 减重助理', 'https://lipulin222.github.io/online-health-care/weight-management/Weight-loss-Assistant/index.html'],
    ],
  },
  {
    md: '减重/REQ-WL-STATUS-02-健康订阅区排序与置顶规则.md',
    module: 'STATUS', code: 'REQ-WL-STATUS-02', pri: 'P0', status: '待评审',
    desc: '多张卡之间谁在前：置顶优先级、其余卡排序、未上线专项不渲染、空态引导',
    demos: [['线上服务页', 'https://lipulin222.github.io/online-health-care/online-service.html']],
  },
  {
    md: '减重/REQ-WL-STATUS-03-减重卡阶段状态机与核心区内容.md',
    module: 'STATUS', code: 'REQ-WL-STATUS-03', pri: 'P0', status: '待评审',
    desc: '单张卡内部：阶段状态机、各阶段核心区模块与 CTA、数据缺失降级',
    demos: [
      ['线上服务页', 'https://lipulin222.github.io/online-health-care/online-service.html'],
      ['AI 减重助理', 'https://lipulin222.github.io/online-health-care/weight-management/Weight-loss-Assistant/index.html'],
    ],
  },
  {
    md: '减重/REQ-WL-BASE-01-数据上报规范.md',
    module: 'BASE', code: 'REQ-WL-BASE-01', pri: 'P0', status: '制定中',
    desc: '埋点唯一登记表：命名规范、公共字段、事件表、漏斗、脱敏红线、变更流程',
    demos: [],
  },
  {
    md: '减重/REQ-WL-BASE-02-上线基线.md',
    module: 'BASE', code: 'REQ-WL-BASE-02', pri: 'P0', status: '制定中',
    desc: '所有减重单共用：通用基线、上线放行清单、小程序适配要点',
    demos: [],
  },
];

/* ---- 关联需求单跳转表（支持 REQ-P/E/W-NN 与 REQ-WL-{模块}-NN） ---- */
const idOf = (d) => (path.basename(d.md).match(/REQ-(?:[PWE]\d{2}|WL-[A-Z]+-\d{2})/) || [d.code])[0];
const DOC_OUT = {};
for (const d of DOCS.concat(WL_DOCS)) DOC_OUT[idOf(d)] = d.md.replace(/\.md$/, '.html');

/* ---------------- 模板 ---------------- */
const CSS = `
:root{
  --ink:#1B2733; --ink-2:#48596A; --ink-3:#7A8A99; --line:#E4E9EE; --line-2:#EFF3F6;
  --bg:#F6F8FA; --card:#FFFFFF; --brand:#0F7C86; --brand-2:#E7F4F5; --warn:#C2761C; --warn-bg:#FDF3E4;
  --danger:#B4453C; --danger-bg:#FBEDEB;
  --radius:14px; --shadow:0 1px 2px rgba(16,32,48,.05),0 8px 24px rgba(16,32,48,.05);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);
  font:15px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
.topbar{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--line);}
.topbar__in{max-width:1320px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.topbar__back{font-size:13px;color:var(--ink-2);border:1px solid var(--line);border-radius:999px;padding:4px 12px;background:#fff;white-space:nowrap}
.topbar__back:hover{text-decoration:none;border-color:var(--brand);color:var(--brand)}
.badge{font-size:12px;line-height:1;padding:5px 10px;border-radius:999px;background:var(--brand-2);color:var(--brand);font-weight:600;white-space:nowrap}
.badge--warn{background:var(--warn-bg);color:var(--warn)}
.badge--p0{background:var(--danger-bg);color:var(--danger)}
.topbar__title{font-size:14px;font-weight:600;color:var(--ink)}
.wrap{max-width:1320px;margin:0 auto;padding:26px 24px 80px;display:grid;grid-template-columns:258px minmax(0,1fr);gap:34px;align-items:start}
.toc{position:sticky;top:70px;max-height:calc(100vh - 96px);overflow:auto;
  background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:16px 14px;box-shadow:var(--shadow)}
.toc__h{font-size:11px;letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase;margin:0 0 10px}
.toc ol{list-style:none;margin:0;padding:0}
.toc li{margin:2px 0}
.toc a{display:block;padding:5px 8px;border-radius:8px;font-size:13px;color:var(--ink-2);line-height:1.45}
.toc a:hover{background:var(--line-2);text-decoration:none;color:var(--brand)}
.toc .lv3 a{padding-left:20px;font-size:12.5px;color:var(--ink-3)}
.doc{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:34px 40px 46px;box-shadow:var(--shadow);min-width:0}
.doc h1{font-size:26px;line-height:1.35;margin:0 0 6px;letter-spacing:-.01em}
.doc .subtitle{color:var(--ink-3);font-size:13px;margin:0 0 22px}
.doc h2{font-size:19px;margin:44px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--line);scroll-margin-top:78px}
.doc h3{font-size:15.5px;margin:26px 0 10px;scroll-margin-top:78px}
.doc p{margin:10px 0;color:var(--ink-2)}
.doc strong{color:var(--ink)}
.doc ul,.doc ol{padding-left:1.35em;color:var(--ink-2)}
.doc li{margin:5px 0}
.doc li:has(> input[type=checkbox]){list-style:none;margin-left:-1.35em;display:flex;gap:9px;align-items:flex-start;color:var(--ink)}
.doc input[type=checkbox]{flex:none;width:16px;height:16px;margin:5px 0 0;border-radius:4px;accent-color:var(--brand)}
.doc code{background:#F1F5F8;border:1px solid var(--line-2);border-radius:5px;padding:1px 5px;font-size:12.5px;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#20465A}
.doc pre{background:#F7FAFB;border:1px solid var(--line);border-radius:10px;padding:14px 16px;overflow:auto}
.doc pre code{background:none;border:0;padding:0;font-size:12.5px;color:var(--ink-2)}
.doc blockquote{margin:14px 0;padding:10px 16px;background:#FFFBF0;border-left:3px solid #E9C683;border-radius:0 10px 10px 0}
.doc blockquote p{margin:4px 0;color:#7A5C1E}
.doc hr{border:0;border-top:1px dashed var(--line);margin:26px 0}
.doc table{width:100%;border-collapse:separate;border-spacing:0;margin:16px 0;font-size:13.5px;display:block;overflow-x:auto}
.doc thead th{background:#F3F7F9;color:var(--ink);font-weight:600;text-align:left;white-space:nowrap}
.doc th,.doc td{border-bottom:1px solid var(--line-2);padding:9px 12px;vertical-align:top;color:var(--ink-2)}
.doc tbody tr:last-child td{border-bottom:0}
.doc tbody tr:hover td{background:#FAFCFD}
/* 关联需求单 chip */
.doc a.xref{display:inline-block;padding:1px 8px;margin:1px 0;border-radius:7px;background:var(--brand-2);color:var(--brand);
  font-weight:600;font-size:12.5px;border:1px solid #CFE7E9;white-space:nowrap}
.doc a.xref:hover{background:#D6EDEF;text-decoration:none;border-color:var(--brand)}
.doc .xref--self{display:inline-block;padding:1px 8px;border-radius:7px;background:#F1F5F8;color:var(--ink-3);
  font-weight:600;font-size:12.5px;border:1px solid var(--line);white-space:nowrap}
.figs{margin:22px 0 6px;display:grid;gap:18px}
.figs__h{font-size:12px;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;margin:0}
.fig{margin:0;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:#fff}
.fig__shot{max-height:520px;overflow:auto;background:#F1F5F7}
.fig__shot img{display:block;width:100%;height:auto;cursor:zoom-in}
.fig figcaption{padding:10px 14px;font-size:12.5px;color:var(--ink-2);border-top:1px solid var(--line-2);background:#FBFDFE;display:flex;gap:10px;align-items:baseline}
.fig figcaption b{color:var(--brand);font-weight:600;flex:none}
.fig figcaption em{margin-left:auto;font-style:normal;color:var(--ink-3);font-size:11.5px;white-space:nowrap;flex:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:14px}
.grid .fig__shot{max-height:none;overflow:visible}
.grid figcaption{display:block;font-size:12px;padding:8px 11px}
.grid figcaption em{display:none}
.lb{position:fixed;inset:0;z-index:99;background:rgba(12,22,30,.92);display:flex;align-items:center;justify-content:center;padding:28px}
.lb[hidden]{display:none}
.lb img{max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);background:#fff;cursor:zoom-out}
.lb__x{position:absolute;top:16px;right:20px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.14);
  color:#fff;font-size:22px;line-height:1;cursor:pointer}
.lb__x:hover{background:rgba(255,255,255,.26)}
.lb__tip{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:#CBD6DE;font-size:12px}
/* 索引页 */
.hero{max-width:1320px;margin:0 auto;padding:38px 24px 6px}
.hero h1{margin:0 0 10px;font-size:30px;letter-spacing:-.02em}
.hero p{margin:0 0 8px;color:var(--ink-2);max-width:900px}
.stats{display:flex;gap:28px;margin:20px 0 0;flex-wrap:wrap}
.stat b{display:block;font-size:24px;color:var(--brand);line-height:1.2}
.stat span{font-size:12.5px;color:var(--ink-3)}
.callout{max-width:1320px;margin:22px auto 0;padding:0 24px}
.callout__in{background:linear-gradient(135deg,#FFF7EC,#FDF1E3);border:1px solid #F0D9B4;border-radius:var(--radius);padding:16px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.callout__in b{color:#8A5A15}
.callout__in a{margin-left:auto;font-weight:600}
.sec{max-width:1320px;margin:0 auto;padding:8px 24px}
.sec__h{display:flex;align-items:baseline;gap:12px;margin:32px 0 16px}
.sec__h h2{margin:0;font-size:19px}
.sec__h span{font-size:12.5px;color:var(--ink-3)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:18px}
.rcard{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);
  overflow:hidden;box-shadow:var(--shadow);transition:transform .16s ease,box-shadow .16s ease}
.rcard:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(16,32,48,.06),0 14px 32px rgba(16,32,48,.09);text-decoration:none}
.rcard__cover{height:132px;background:#EFF4F6;overflow:hidden;border-bottom:1px solid var(--line-2);position:relative}
.rcard__cover img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.rcard__cover--ph{display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#0F7C86,#14A0A8);color:#fff;font-weight:700;font-size:15px;letter-spacing:.04em}
.rcard__b{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1}
.rcard__t{font-size:14.5px;font-weight:600;color:var(--ink);line-height:1.45}
.rcard__d{font-size:12.5px;color:var(--ink-3);line-height:1.6}
.rcard__f{margin-top:auto;padding-top:10px;display:flex;gap:8px;align-items:center;font-size:11.5px;color:var(--ink-3)}
.note{max-width:1320px;margin:32px auto 0;padding:0 24px 70px}
.note__in{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 22px;color:var(--ink-2);font-size:13px;box-shadow:var(--shadow)}
.note__in b{color:var(--ink)}
footer.pg{max-width:1320px;margin:0 auto;padding:0 24px 60px;color:var(--ink-3);font-size:12px}
@media (max-width:1080px){
  .wrap{grid-template-columns:1fr;gap:20px;padding-top:20px}
  .toc{position:static;max-height:none}
  .doc{padding:26px 20px 34px}
  .fig__shot{max-height:400px}
}
@media print{
  .topbar,.toc,.lb{display:none}
  .wrap{display:block;padding:0;max-width:none}
  .doc{border:0;box-shadow:none;padding:0}
  .fig__shot{max-height:none;overflow:visible}
  body{background:#fff}
}
`;

const JS = `
(function(){
  var lb=document.getElementById('lb'),lbImg=document.getElementById('lbImg');
  if(!lb) return;
  function close(){lb.hidden=true;lbImg.src='';document.body.style.overflow='';}
  document.addEventListener('click',function(e){
    var img=e.target.closest && e.target.closest('.fig__shot img');
    if(img){lbImg.src=img.src;lb.hidden=false;document.body.style.overflow='hidden';return;}
    if(e.target===lb||e.target===lbImg||(e.target.classList&&e.target.classList.contains('lb__x'))) close();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden) close();});
})();
`;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slugify(s, used) {
  let base = String(s).replace(/<[^>]+>/g, '').replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60);
  if (!base) base = 'sec';
  let out = base, i = 2;
  while (used[out]) { out = base + '-' + i++; }
  used[out] = 1;
  return out;
}
marked.setOptions({ gfm: true, breaks: false });

/* 把 REQ-XX 文本变成可点击的 chip（跳过 code/pre/a 内） */
function linkify(html, selfId, dir) {
  const stash = [];
  html = html.replace(/<(code|pre|a)\b[\s\S]*?<\/\1>/g, (m) => { stash.push(m); return '\u0000' + (stash.length - 1) + '\u0000'; });
  const one = (id) => {
    if (id === selfId) return `<span class="xref--self">${id}</span>`;
    const target = DOC_OUT[id];
    if (!target) return id;
    const href = encodeURI(path.relative(dir, path.join(ROOT, target)).split(path.sep).join('/'));
    return `<a class="xref" href="${esc(href)}">${id}</a>`;
  };
  html = html.replace(/REQ-([PWE]\d{2}|WL-[A-Z]+-\d{2})/g, (m, n) => one('REQ-' + n));
  // 处理「REQ-E02 ~ E08」「REQ-W02/W03」这类省略写法（前面已生成 chip）
  for (let k = 0; k < 4; k++) {
    const before = html;
    html = html.replace(/(<a class="xref"[^>]*>REQ-[PWE]\d{2}<\/a>)(\s*(?:~|、|\/|–|-)\s*)([PWE]\d{2})/g,
      (m, a, sep, n) => a + sep + one('REQ-' + n));
    if (html === before) break;
  }
  return html.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[+i]);
}

function renderDoc(cfg) {
  const mdPath = path.join(ROOT, cfg.md);
  const dir = path.dirname(mdPath);
  let md = fs.readFileSync(mdPath, 'utf8').replace(/^\uFEFF/, '');
  let title = cfg.title;
  const lines = md.split(/\r?\n/);
  if (/^#\s+/.test(lines[0])) { title = lines[0].replace(/^#\s+/, '').trim(); lines.shift(); }
  md = lines.join('\n');

  const figBlocks = [];
  for (const f of cfg.figs || []) {
    const imgs = f.imgs || f.grid || [];
    if (!imgs.length) continue;
    const isGrid = !!f.grid;
    const figs = [];
    for (const key of imgs) {
      const man = MANIFEST[key];
      if (!man) { console.log('  ! 缺图 ' + cfg.md + ' -> ' + key); continue; }
      man.parts.forEach((part, i) => {
        const label = man.parts.length > 1 ? `（第 ${i + 1}/${man.parts.length} 段）` : '';
        figs.push({ uri: dataUri(part), key, label, idx: i });
      });
    }
    figBlocks.push({ anchor: f.before, isGrid, figs });
  }

  let html = marked.parse(md);
  html = linkify(html, cfg.code, dir);

  const used = {};
  const toc = [];
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (m, lv, inner) => {
    const id = slugify(inner, used);
    toc.push({ lv: +lv, id, text: inner.replace(/<[^>]+>/g, '').trim() });
    return `<h${lv} id="${id}">${inner}</h${lv}>`;
  });

  for (const fb of figBlocks) {
    const re = new RegExp('<h2[^>]*>(?:(?!</h2>)[\\s\\S])*?' + fb.anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?</h2>');
    const m = html.match(re);
    if (!m) { console.log('  ! 未找到锚点 ' + fb.anchor + ' @ ' + cfg.md); continue; }
    const body = fb.figs.map((f, i) => {
      const desc = CAPTION[f.key] || f.key;
      return `<figure class="fig">
  <div class="fig__shot"><img src="${f.uri}" alt="${esc(desc)}" loading="lazy"></div>
  <figcaption>${fb.isGrid ? '' : `<b>图 ${i + 1}</b>`}${esc(desc)}${esc(f.label)}<em>点击放大</em></figcaption>
</figure>`;
    }).join('\n');
    const block = `\n<div class="figs">\n<p class="figs__h">界面示意（截图取自真实页面）</p>\n<div class="${fb.isGrid ? 'grid' : ''}">\n${body}\n</div>\n</div>\n`;
    html = html.replace(m[0], block + m[0]);
  }

  const tocHtml = toc.map((t) => `<li class="${t.lv === 3 ? 'lv3' : 'lv2'}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('\n');
  const priCls = cfg.pri === 'P0' ? 'badge badge--p0' : 'badge badge--warn';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · 需求单</title>
<style>${CSS}</style>
</head>
<body>
<header class="topbar">
  <div class="topbar__in">
    <a class="topbar__back" href="../index.html">← 需求单索引</a>
    <span class="badge">${esc(cfg.project)}</span>
    <span class="${priCls}">优先级 ${esc(cfg.pri)}</span>
    <span class="topbar__title">${esc(title)}</span>
  </div>
</header>
<div class="wrap">
  <nav class="toc">
    <p class="toc__h">本单目录</p>
    <ol>${tocHtml}</ol>
  </nav>
  <main class="doc">
    <h1>${esc(title)}</h1>
    <p class="subtitle">需求单 · ${esc(cfg.project)} · 交付目标：可上线面向用户使用（H5 + 微信小程序）</p>
    ${html}
  </main>
</div>
<div class="lb" id="lb" hidden><button class="lb__x" aria-label="关闭">×</button><img id="lbImg" alt=""><p class="lb__tip">原图 · 点击图片或按 Esc 关闭</p></div>
<script>${JS}</script>
</body>
</html>`;
}

let CAPTION = {};
function renderIndex(counts) {
  const groups = ['跨项目 · 规范与对单', '线上健康 Portal', '科学减重卡片', '体检报告解读'];
  const secs = groups.map((g) => {
    const items = DOCS.filter((d) => d.project === g).map((d) => {
      const man = d.cover && MANIFEST[d.cover] ? MANIFEST[d.cover] : null;
      const cover = man
        ? `<img src="${dataUri(man.cover || man.parts[0])}" alt="" loading="lazy">`
        : `<span>${esc(d.code || (d.title.match(/REQ-[PWE]\d{2}/) || [''])[0])}</span>`;
      const id = (d.title.match(/REQ-[PWE]\d{2}/) || [])[0] || d.code;
      const priCls = d.pri === 'P0' ? 'badge badge--p0' : 'badge badge--warn';
      return `<a class="rcard" href="${esc(encodeURI(d.md.replace(/\.md$/, '.html')))}">
  <div class="rcard__cover${man ? '' : ' rcard__cover--ph'}">${cover}</div>
  <div class="rcard__b">
    <div class="rcard__t">${esc(d.title)}</div>
    <div class="rcard__d">${esc(d.desc)}</div>
    <div class="rcard__f"><span class="badge">${esc(id)}</span><span class="${priCls}">${esc(d.pri)}</span><span style="margin-left:auto">打开 →</span></div>
  </div>
</a>`;
    }).join('\n');
    return `<section class="sec">
  <div class="sec__h"><h2>${esc(g)}</h2><span>${DOCS.filter((d) => d.project === g).length} 张</span></div>
  <div class="cards">${items}</div>
</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>需求单总览 · 开发评审用（上线交付）</title>
<style>${CSS}</style>
</head>
<body>
<div class="hero">
  <h1>需求单总览 · 开发评审用</h1>
  <p>把「线上健康 Portal」「科学减重卡片」「体检报告解读」三个项目拆解为可独立评审、联调、验收的功能单元。<b>交付目标：可上线面向用户使用（H5 + 微信小程序）</b>，不是演示原型。</p>
  <p>每张需求单包含：背景与目标 / 范围 / 用户场景 / 功能需求 / 交互与规则 / 数据与字段 / <b>数据上报（埋点）</b> / 验收标准 / 依赖与风险 / <b>上线要求（生产级 · 微信小程序）</b> / 待决策项，并附真实页面截图。</p>
  <div class="stats">
    <div class="stat"><b>${DOCS.filter((d) => /REQ-[PWE]/.test(d.title)).length}</b><span>项目需求单</span></div>
    <div class="stat"><b>2</b><span>跨项目规范</span></div>
    <div class="stat"><b>${Object.keys(MANIFEST).length}</b><span>张真实页面截图</span></div>
    <div class="stat"><b>${counts.total}</b><span>项待确认 / 待决策</span></div>
  </div>
</div>
<div class="callout">
  <div class="callout__in">
    <b>⚠ 评审建议从这里开始：</b>
    <span>阻塞项 ${counts.Q} 条 · 冲突 ${counts.A} 条 · 缺失 ${counts.B} 条 · 待决策 ${counts.C} 条 · 缺陷 ${counts.D} 条</span>
    <a href="./待确认问题清单.html">打开待确认问题清单 →</a>
  </div>
</div>
${secs}
<div class="note">
  <div class="note__in">
    <p style="margin:0 0 8px"><b>怎么用：</b>点卡片进入需求单；左侧是本单目录，正文中的截图可直接滚动查看，<b>点击截图可放大</b>（Esc 或点击图片关闭）；正文里的 <span class="xref--self">REQ-XX</span> 是<b>可点击的关联需求单</b>。右上角「← 需求单索引」随时返回。</p>
    <p style="margin:0 0 8px"><b>图片说明：</b>全部截取自本地实际运行的页面（无头浏览器整页/元素截图），共 ${Object.keys(MANIFEST).length} 张。图片已压缩并<b>内联进 HTML</b>，因此本目录<b>不依赖任何本地服务，双击即可打开</b>；整页长图在卡片内是可滚动区域。</p>
    <p style="margin:0"><b>源文件与重建：</b>同目录保留同名 <code>.md</code> 作为唯一内容源（HTML 由 <code>_build/build.js</code> 生成）。改内容请改 md，然后 <code>cd _build &amp;&amp; npm run build</code>。</p>
  </div>
</div>
<footer class="pg">生成时间 2026-09-18 · ${DOCS.length} 份文档 · 交付目标：可上线（H5 + 微信小程序）</footer>
<script>${JS}</script>
</body>
</html>`;
}

/* 图片说明文案（与截图脚本中的 caption 保持一致） */
const CAPTIONS_JSON = path.join(ASSETS, 'shots.json');
const CAPTIONS2_JSON = path.join(ASSETS, 'shots2.json');
for (const f of [CAPTIONS_JSON, CAPTIONS2_JSON]) {
  if (!fs.existsSync(f)) continue;
  for (const s of JSON.parse(fs.readFileSync(f, 'utf8'))) CAPTION[s.group + '/' + s.name] = s.caption;
}
CAPTION['weight/kbroll'] = '知识库入口跑马灯（.kbroll，2.6s 一轮，当前项 is-on / 离场项 is-out）';

/* 统计待确认清单条目 */
const clistPath = path.join(ROOT, '待确认问题清单.md');
const clistMd = fs.existsSync(clistPath) ? fs.readFileSync(clistPath, 'utf8') : '';
const counts = {
  Q: (clistMd.match(/^### Q-\d{2}/gm) || []).length,
  A: (clistMd.match(/^\| A-\d{2} \|/gm) || []).length,
  B: (clistMd.match(/^\| B-\d{2} \|/gm) || []).length,
  C: (clistMd.match(/^\| C-\d{2} \|/gm) || []).length,
  D: (clistMd.match(/^\| D-\d{2} \|/gm) || []).length,
};
counts.total = counts.Q + counts.A + counts.B + counts.C + counts.D;

let n = 0;
const ALL = DOCS.concat(WL_DOCS.map((d) => Object.assign({ project: '科学减重（WL）' }, d)))
  .filter((c) => fs.existsSync(path.join(ROOT, c.md)));
for (const cfg of ALL) {
  const out = path.join(ROOT, cfg.md.replace(/\.md$/, '.html'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderDoc(cfg), 'utf8');
  n++;
}
/* ---------- 减重项目独立索引（无截图，按模块分组） ---------- */
const WL_MODULES = {
  STATUS: '服务状态与卡片', RX: '处方·购药·订单', PLAN: '方案·评估·随访',
  EDU: '科普·内容', AI: 'AI 助理', RECORD: '数据记录', BASE: '规范与基线',
};
const WL_STYLE = `
.wlhero{max-width:1180px;margin:0 auto;padding:38px 24px 10px}
.wlhero h1{margin:0 0 8px;font-size:28px;letter-spacing:-.02em}
.wlhero p{margin:0;color:var(--ink-2);max-width:900px}
.wlnav{max-width:1180px;margin:18px auto 0;padding:0 24px;display:flex;gap:10px;flex-wrap:wrap}
.wlnav a{font-size:12.5px;padding:5px 12px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink-2)}
.wlnav a:hover{text-decoration:none;border-color:var(--brand);color:var(--brand)}
.wlsec{max-width:1180px;margin:0 auto;padding:6px 24px}
.wlsec__h{display:flex;align-items:baseline;gap:10px;margin:28px 0 12px}
.wlsec__h h2{margin:0;font-size:17px}
.wlsec__h span{font-size:11px;letter-spacing:.08em;color:var(--ink-3)}
.wlcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.wlcard{display:flex;flex-direction:column;gap:7px;background:#fff;border:1px solid var(--line);border-radius:var(--radius);
  padding:16px 18px;box-shadow:var(--shadow);transition:transform .16s ease,box-shadow .16s ease}
.wlcard:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(16,32,48,.06),0 14px 32px rgba(16,32,48,.09);text-decoration:none}
.wlcard__hd{display:flex;gap:8px;align-items:center}
.wlcard__id{font-size:11.5px;font-weight:700;letter-spacing:.04em;color:var(--brand);background:var(--brand-2);
  padding:3px 8px;border-radius:6px}
.wlcard__st{font-size:11.5px;color:var(--ink-3)}
.wlcard__t{font-size:14.5px;font-weight:600;color:var(--ink);line-height:1.45}
.wlcard__d{font-size:12.5px;color:var(--ink-3);line-height:1.6}
.wl__demos{display:flex;gap:8px;flex-wrap:wrap;margin-top:2px}
.wl__demo{font-size:11.5px;padding:3px 9px;border-radius:6px;background:#F3F7F9;color:var(--ink-2);border:1px solid var(--line-2)}
.wl__demo:hover{text-decoration:none;background:var(--brand-2);color:var(--brand);border-color:#CFE7E9}
.wlnote{max-width:1180px;margin:28px auto 0;padding:0 24px 70px}
.wlnote__in{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:16px 20px;font-size:12.5px;color:var(--ink-2);box-shadow:var(--shadow)}
.wlnote__in b{color:var(--ink)}
.wlnote__in code{background:#F1F5F8;border:1px solid var(--line-2);border-radius:5px;padding:1px 5px;font-size:11.5px}
`;
function renderWLIndex() {
  const groups = Object.keys(WL_MODULES).filter((m) => WL_DOCS.some((d) => d.module === m));
  const secs = groups.map((m) => {
    const rows = WL_DOCS.filter((d) => d.module === m).map((d) => {
      const id = idOf(d);
      const t = fs.readFileSync(path.join(ROOT, d.md), 'utf8').split('\n')[0].replace(/^#\s+/, '').trim();
      const demos = (d.demos || []).length
        ? `<div class="wl__demos">${d.demos.map(([n2, u]) => `<a class="wl__demo" href="${esc(u)}" target="_blank" rel="noopener">${esc(n2)} ↗</a>`).join('')}</div>`
        : '';
      const out = path.basename(d.md).replace(/\.md$/, '.html');
      return `<a class="wlcard" href="${esc(encodeURI(out))}">
  <div class="wlcard__hd"><span class="wlcard__id">${esc(id)}</span><span class="wlcard__st">${esc(d.status)} · ${esc(d.pri)}</span></div>
  <div class="wlcard__t">${esc(t)}</div>
  <div class="wlcard__d">${esc(d.desc)}</div>
  ${demos}
</a>`;
    }).join('\n');
    return `<section class="wlsec"><div class="wlsec__h"><h2>${esc(WL_MODULES[m])}</h2><span>${esc(m)}</span></div><div class="wlcards">${rows}</div></section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>减重项目 · 需求单索引</title>
<style>${CSS}${WL_STYLE}</style>
</head>
<body>
<div class="wlhero">
  <h1>减重项目 · 需求单索引</h1>
  <p>本页是<b>科学减重（WL）项目</b>的需求单唯一入口，与体检报告解读、线上健康 Portal 的旧索引完全分离。编号规范：<code>REQ-WL-{模块}-{序号}-{中文短名}</code>。</p>
</div>
<div class="wlnav">
  <a href="#STATUS">服务状态与卡片</a><a href="#RX">处方·购药·订单</a><a href="#PLAN">方案·评估·随访</a>
  <a href="#EDU">科普·内容</a><a href="#AI">AI 助理</a><a href="#RECORD">数据记录</a><a href="#BASE">规范与基线</a>
</div>
${secs}
<div class="wlnote">
  <div class="wlnote__in">
    <p style="margin:0 0 8px"><b>命名规范：</b><code>REQ-WL-{模块}-{序号}-{中文短名}</code>。模块：<code>STATUS</code> 服务状态与卡片 / <code>RX</code> 处方·购药·订单 / <code>PLAN</code> 方案·评估·随访 / <code>EDU</code> 科普·内容 / <code>AI</code> AI 助理 / <code>RECORD</code> 数据记录 / <code>BASE</code> 规范与基线。序号在模块内从 <code>01</code> 递增，<b>不复用、不重排</b>；废弃单保留编号并标注「已作废」。</p>
    <p style="margin:0 0 8px"><b>文档结构（6 节）：</b>1 背景与目标 · 2 规则 · 3 字段 · 4 验收与上线要求 · 5 依赖与风险 · 6 待决策。<b>埋点不写在单子里</b>，统一登记在 <code>REQ-WL-BASE-01 数据上报规范</code>；通用上线要求引用 <code>REQ-WL-BASE-02 上线基线</code>。</p>
    <p style="margin:0"><b>页面不放截图</b>，只保留相关 Demo 链接（在卡片下方）。改内容请改 <code>.md</code> 后 <code>cd _build &amp;&amp; npm run build</code>。</p>
  </div>
</div>
<script>${JS}</script>
</body>
</html>`;
}

fs.mkdirSync(path.join(ROOT, '减重'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '减重', 'index.html'), renderWLIndex(), 'utf8');
const hasOld = DOCS.some((d) => fs.existsSync(path.join(ROOT, d.md)));
if (hasOld) {
  fs.writeFileSync(path.join(ROOT, 'index.html'), renderIndex(counts), 'utf8');
} else {
  // 老单全部删除：根索引改为跳转到减重独立索引
  fs.writeFileSync(path.join(ROOT, 'index.html'),
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./减重/index.html"><title>需求单</title></head>' +
    '<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F8FA;color:#1B2733;font:15px/1.7 -apple-system,BlinkMacSystemFont,\'Segoe UI\',\'PingFang SC\',\'Microsoft YaHei\',sans-serif">' +
    '<p>正在跳转到减重需求单索引… 如未跳转请 <a href="./减重/index.html" style="color:#0F7C86">点此进入</a></p>' +
    '<script>location.replace("./减重/index.html")</script></body></html>', 'utf8');
}
console.log(`生成 HTML ${n} 份 + 索引 1 份；截图 ${Object.keys(MANIFEST).length} 张；待确认 ${counts.total} 项（Q${counts.Q}/A${counts.A}/B${counts.B}/C${counts.C}/D${counts.D}）`);
