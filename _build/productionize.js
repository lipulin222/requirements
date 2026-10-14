/* 给 22 张需求单注入「上线要求（生产级 · 微信小程序）」与「数据上报（埋点）」两节 */
const fs = require('fs');
const path = require('path');
const ROOT = 'd:\\VibeCodingDemo\\需求单';

const BASELINE = `### @N@.1 通用基线（所有需求单适用）

> 本单交付物是**可上线面向用户使用的产品能力**，不是演示原型。正文中出现的「演示 / 占位 / Toast 承接 / MOCK / 硬编码」等描述均为**现状**，上线前必须按下表替换为真实实现。

| 类别 | 上线要求 |
| --- | --- |
| 载体 | 同时支持 **H5**（移动端浏览器 + 微信内置浏览器）与 **微信小程序**；业务逻辑与视觉两端一致，差异仅在壳层 API |
| 接口 | 全部业务数据来自服务端接口，前端不得硬编码；本单涉及：%DATA% |
| 登录态 | 小程序静默授权（code → openid/unionid）+ 手机号授权（敏感操作前）；H5 走公众号网页授权；token 过期自动无感续期 |
| 异常兜底 | 每个请求具备 loading / 空态 / 失败重试 / 超时兜底；弱网、无网、接口降级均有明确提示与可恢复入口 |
| 性能 | 4G 中端机首屏 ≤1.5s、可交互 ≤2.5s；图片走 CDN + 懒加载；长列表分页或虚拟滚动；小程序分包加载 |
| 兼容 | iOS 14+ / Android 8+；微信 8.0+；小程序基础库 ≥2.30；刘海屏与底部安全区适配；真机回归清单 |
| 安全 | 全链路 HTTPS；接口签名与防重放；敏感信息脱敏；前端不落地任何密钥（含 AI 接口） |
| 隐私合规 | 隐私政策与用户协议首次进入需授权；未授权不采集设备信息；健康数据不落 URL、不落本地明文；未成年人需监护人同意 |
| 灰度与回滚 | 支持按版本/用户灰度，可一键回滚；发布前后核心指标对比 |
| 监控告警 | 接口成功率、前端错误、埋点上报成功率接入告警，异常 5 分钟内可感知 |`;

const REPORT_BASE = `### @N@.1 上报规则（全局规范）

> 本节**只定义「要报什么」**（事件名 / 触发时机 / 关键参数 / 用途）。上报协议细节（通道、批量、重试、采样、平台选型、隐私细则）**由数据侧在上线前补充**，见 [数据上报规范](../数据上报规范.html)。

| 项 | 现阶段约定 |
| --- | --- |
| 命名 | 统一 \`模块_对象_动作\`（全小写下划线），如 \`wcard_cta_click\`；一经上线不得改名，只能新增 |
| 公共字段 | 事件名 / 时间戳 / 用户标识 / 会话 / 页面 / 端（h5·wxapp）/ 版本 / 渠道 / 网络 / 机型 / 服务阶段（内部用，不上屏）——**字段口径以上线前协议为准** |
| 曝光口径 | 元素进入可视区且停留 ≥300ms 记为有效曝光，同元素单次会话只报一次 |
| 关键事件 | 支付、签署、生成计划书等转化类事件：端上上报 + 服务端留有记录，便于上线后做一致性校验 |
| 不报什么 | 报告原文、指标数值、姓名、手机号、地址、聊天内容一律不上报 |`;

/* ------------------------------------------------------------------ */
/* 每单配置                                                            */
/* ------------------------------------------------------------------ */
const CFG = {
  'REQ-P01': {
    data: '老/新客状态、日常事项、专项卡片、问诊入口配置',
    must: [
      '新老客判定改为服务端返回（是否建档、是否有进行中服务、是否有历史报告），不再由 `?state=` 决定；URL 参数仅保留为内部演示开关且默认关闭',
      '三大模块的显隐、文案、入口目标全部改为运营配置下发，前端不写死；配置需支持热更新与版本回滚',
      '「全部」类无落地页的入口一律不渲染（禁止 toast 占位、禁止死链）',
      '移除 420px 固定容器，改为流式自适应，适配小程序 web-view、刘海屏与底部安全区',
      '首屏数据合并为 1 个聚合接口（BFF），避免串行请求；接口失败时按模块降级而非整页失败',
      '微信小程序内嵌时：配置 web-view 业务域名白名单、实现分享卡片、处理返回键与路由同步',
    ],
    check: [
      '首页全部文案与数据来自接口/配置，代码中无业务硬编码',
      '老/新客状态由服务端判定，刷新与分享链接不改变状态',
      '420px 固定宽度已移除；iPhone SE / Pro Max / 安卓小屏均无横向滚动',
      '顶部状态栏与底部安全区适配通过真机验证',
      '不存在 toast 占位入口；未上线能力一律不渲染',
      '首屏接口 ≤1 个，4G 中端机首屏 ≤1.5s',
      '小程序 web-view 域名白名单、分享、返回键均真机通过',
      '埋点上报成功率 ≥99%，页面无 console 报错',
    ],
    events: [
      ['portal_page_view', '进入门户首页', 'platform,channel,is_new_user', '漏斗起点、活跃分析'],
      ['portal_module_view', '模块进入可视区 ≥300ms', 'module_id(1/2/3),duration', '模块关注度'],
      ['portal_entry_click', '点击模块内入口', 'module_id,entry_id,target', '入口转化率'],
      ['portal_more_click', '点击「全部」类入口', 'module_id', '二级页需求验证'],
    ],
    funnel: '`portal_page_view` → `portal_entry_click` →（转入对应业务单的漏斗）',
  },
  'REQ-P02': {
    data: '待办事项（随访 / 复查 / 儿保 / 健康计划）',
    must: [
      '事项数据来自服务端四个能力域（随访、复查、儿保、健康计划），排序由服务端按紧迫度返回，前端不排序',
      '每类事项必须落地真实页面；未上线的事项类型不下发（不允许前端出现无落地页的卡片）',
      '事项为空时展示空态与引导（新客引导卡逻辑），不得出现空白区块',
      '事项数量上限、折叠策略、文案模板由服务端配置',
      '事项的「已完成/已过期」状态需与实际业务状态同步，避免展示过期提醒',
      '点击事项后回写「已读/已处理」状态，再次进入门户时不再重复强提醒',
    ],
    check: [
      '事项由接口下发，前端无硬编码列表',
      '四个能力域均已落地页面对接，无死链',
      '空态、加载态、失败态均有设计并验证',
      '过期事项不再展示，已处理事项状态正确',
      '排序规则由服务端决定并有文档',
      '点击回写成功（弱网下本地先行、联网后补写）',
      '埋点齐全，曝光与点击可对应',
    ],
    events: [
      ['dh_item_view', '事项卡进入可视区', 'item_type,followup_id', '待办触达率'],
      ['dh_item_click', '点击事项卡', 'item_type,followup_id,target', '待办处理转化'],
      ['dh_all_click', '点击「全部健康事项」', 'count', '二级页需求验证'],
      ['dh_onboard_click', '新客点击「开始健康扫描」', 'source', '新客激活转化'],
    ],
    funnel: '`dh_item_view` → `dh_item_click` →（对应业务处理完成事件）',
  },
  'REQ-P03': {
    data: '专项列表与标签、减重卡当前阶段与卡片数据',
    must: [
      '专项列表与标签来自配置；未上线的专项（过敏/痤疮/心理）不渲染标签',
      '减重卡的服务阶段（stage）由服务端按用户真实疗程计算返回；**生产环境禁止用户点击状态标签切换阶段**（仅内部演示开关可切换）',
      '卡片核心区数据（方案名、周次、体重、提醒）与子页数据同源，统一由服务端下发，杜绝「卡片一处、兜底一处」的双份实现',
      '卡片数据需有缓存与过期策略，冷启动不阻塞首屏（骨架屏）',
      '卡片右上角多悬浮元素的点击层级需真机校验，避免误触',
    ],
    check: [
      '专项列表由配置下发，未上线专项不出现',
      '减重卡阶段由服务端决定，用户无法手动切换（演示开关默认关闭且需鉴权）',
      '卡片与子页数据口径一致，抽查任意字段数值相同',
      '无双份实现（静态兜底已由服务端预渲染或统一模板替代）',
      '骨架屏与加载态验证通过，冷启动无布局跳动',
      '真机点击热区 ≥44px，无误触',
      '埋点覆盖卡片曝光与各阶段 CTA',
    ],
    events: [
      ['spec_tag_click', '点击专项标签', 'tag_id,from_tag', '专项关注度'],
      ['wcard_view', '减重卡进入可视区', 'stage,plan_id', '核心卡触达'],
      ['wcard_stage_view', '卡片渲染某阶段核心区', 'stage', '阶段分布'],
      ['wcard_cta_click', '点击卡片按钮', 'stage,cta_id(agent/plan/pay/followup/record),target', '主链路转化'],
    ],
    funnel: '`wcard_view` → `wcard_cta_click` →（方案 / 购药 / 助理链路）',
  },
  'REQ-P04': {
    data: '问诊入口配置、家庭医生关系',
    must: [
      '问诊入口必须对接真实问诊系统（自研 IM 或第三方客服），落地图文/电话/视频三种会话',
      '家庭医生关系（是否签约、医生信息）来自服务端；未签约用户不展示医生个人信息',
      '图文·电话·视频不做成静态信息展示，需分别落到对应能力并按可用性置灰不可用项',
      '问诊入口需处理服务时间、排队状态与离线留言',
      'AI 助理与真人问诊必须有明确区分标识，禁止让用户误认为 AI 是医生',
    ],
    check: [
      '三种问诊形式均可真实进入会话',
      '未签约状态与签约状态均验证通过',
      '服务时间外有明确提示与留言入口',
      'AI 与医生身份标识清晰，无歧义',
      '埋点区分「AI 助理」与「真人问诊」',
      '弱网/失败有兜底提示',
    ],
    events: [
      ['consult_card_view', '问诊卡曝光', 'signed_doctor', '入口触达'],
      ['consult_card_click', '点击问诊卡', 'entry', '问诊入口转化'],
      ['consult_type_click', '选择问诊形式', 'type(im/phone/video),available', '形式偏好'],
      ['family_doctor_click', '点击家庭医生', 'signed_doctor', '签约引导转化'],
    ],
    funnel: '`consult_card_view` → `consult_card_click` → `consult_type_click` →（会话创建成功）',
  },
  'REQ-P05': {
    data: '入口 URL / 参数契约 / 跨页上下文',
    must: [
      '`BASE` 域名改为环境配置（构建期注入或运行时配置），代码中禁止出现任何硬编码域名',
      '入口参数契约固化为接口文档并纳入版本管理；前后端与 AI 助理三方对齐同一份参数定义',
      '**健康相关上下文禁止放 URL**：改为服务端返回一次性 `context_id`，由下游用 id 换取上下文，避免报告/指标泄漏在链接、日志与分享中',
      '跨页上下文统一走服务端 + 本地 sessionStorage 兜底，URL 仅携带无敏感信息的 id',
      '小程序端跳转使用绝对路径白名单配置，H5 端使用同源相对路径；两端跳转失败均有兜底页',
      '对话页收敛为一套（详见待确认清单 Q-05），避免两套参数契约并存',
    ],
    check: [
      '全站无硬编码域名，测试/预发/生产环境切换无需改代码',
      '参数契约文档已评审，三端（H5、小程序、AI 助理）实现一致',
      'URL 中不含任何健康数据、姓名、报告内容',
      'context 换取接口有鉴权与过期时间（建议 ≤30 分钟，一次性）',
      '跳转失败兜底页可达，不出现白屏',
      '两套对话页已收敛为一套，或明确下线一套',
      '埋点可观测跳转失败率',
    ],
    events: [
      ['nav_jump', '发生跨页跳转', 'from_page,to_page,entry,has_context', '路径分析'],
      ['nav_jump_fail', '跳转失败或参数缺失', 'from_page,to_page,reason', '异常监控'],
      ['context_fetch', '下游换取上下文', 'context_id_page,success,latency', '契约健康度'],
    ],
    funnel: '`nav_jump` → `context_fetch`（成功）',
  },

  'REQ-W01': {
    data: '模板与阶段装配关系（当前为前端常量）',
    must: [
      '「模板 × 阶段」装配表改为**服务端编排下发**：不同用户、不同疗程阶段返回不同的模块组合与顺序',
      '装配配置需支持热更新、灰度与版本回滚，前端只负责渲染，不内置业务规则',
      '本规范文档纳入版本管理，作为前端/后端/AI 三方的共同契约，变更需评审',
      '术语表统一（服务阶段与状态命名的三种叫法收敛为一套），前后端字段命名一致',
      '新增阶段或模板时必须给出对全部子页的影响面评估清单',
    ],
    check: [
      '装配关系由接口下发，前端无常量装配表（或仅保留本地兜底且默认不生效）',
      '配置支持灰度与回滚，已验证',
      '契约文档已评审并定版，字段命名与接口一致',
      '术语表全站唯一，代码中无第二套命名',
      '禁止项（阶段名、红点、倒计时、疗效承诺）在实现中可核查',
    ],
    events: [
      ['assembly_config_load', '装配配置拉取', 'source(remote/fallback),version,success', '配置下发健康度'],
      ['assembly_fallback', '降级到本地装配', 'reason', '降级监控'],
    ],
    funnel: '`assembly_config_load`（成功）→ 各阶段卡片曝光',
  },
  'REQ-W02': {
    data: '五个阶段的核心区内容与 CTA',
    must: [
      '卡片的阶段与核心区数据由服务端下发（stage、方案名、周次、体重、提醒），前端不内置 \`STAGE\` 模板文案',
      '生产环境**移除用户点击状态标签切换阶段**的能力；仅保留内部演示开关（需鉴权与埋点）',
      '各阶段 CTA 的目标页必须全部上线可用；未上线的 CTA 不渲染',
      '卡片数据失败时按模块降级（保留骨架与重试），不得整块消失',
      '阶段变化需要可观测：阶段跃迁写服务端事件，便于运营与医学随访核对',
    ],
    check: [
      '五阶段核心区内容全部来自接口',
      '用户无法手动切换阶段；演示开关默认关闭且不可枚举',
      '各阶段 CTA 均可达，无死链',
      '接口失败降级验证通过（骨架 + 重试）',
      '阶段跃迁服务端有记录，前端可查询当前阶段',
      '埋点覆盖阶段曝光与每个 CTA',
    ],
    events: [
      ['wcard_stage_view', '卡片渲染并曝光某阶段', 'stage,plan_id,plan_name,week', '阶段分布与触达'],
      ['wcard_cta_click', '点击阶段内 CTA', 'stage,cta_id,target', '主链路转化'],
      ['stage_transition', '阶段发生跃迁（服务端事件）', 'from_stage,to_stage,reason', '服务流程健康度'],
    ],
    funnel: '`wcard_stage_view` → `wcard_cta_click` →（对应子链路）',
  },
  'REQ-W03': {
    data: '知识库条目与 8 条提醒',
    must: [
      '知识库内容来自 CMS（含文章 id、标题、阶段映射），前端不硬编码条目；文章 id 需稳定并被服务端校验',
      '提醒来自服务端待办中心（复查、饮食、续药、转诊等），不再由前端维护 8 条固定文案；提醒需带真实跳转与「已完成」状态',
      '跑马灯间隔、条数、是否展示由配置下发；页面不可见/进入后台时暂停上报',
      '提醒文案需过合规词库校验（禁止「逾期」「最后期限」等施压措辞）',
      '提醒已处理后在门户上不再强提醒，避免骚扰',
    ],
    check: [
      '知识库条目与文章均来自接口，无死链（id 校验通过）',
      '提醒由服务端下发，带状态与落地页',
      '跑马灯间隔可配置，后台/不可见时暂停',
      '文案合规校验通过',
      '已处理提醒状态正确，不再重复提醒',
      '埋点覆盖曝光、切换、点击与助理入口',
    ],
    events: [
      ['kbroll_view', '知识库跑马灯进入可视区', 'stage,item_count', '内容触达'],
      ['kbroll_click', '点击知识库条目', 'stage,article_id,position', '内容消费'],
      ['reminder_view', '提醒卡曝光', 'reminder_type,reminder_id', '待办触达'],
      ['reminder_switch', '切换提醒', 'from_id,to_id,index', '提醒库使用度'],
      ['reminder_click', '点击提醒动作', 'reminder_id,action,target', '待办转化'],
      ['reminder_agent_click', '从提醒进入 AI 助理', 'reminder_id', '助理入口'],
    ],
    funnel: '`reminder_view` → `reminder_click` →（续药 / 随访完成）',
  },
  'REQ-W04': {
    data: 'Demo 的内存 MOCK 数据、调试器',
    must: [
      'MOCK 数据层全部替换为接口；删除 \`MOCK\` 常量与调试器（调试器如需保留必须鉴权 + 默认关闭 + 移除生产包）',
      'hash 路由改为小程序页面栈（wxml 页面）或 H5 History 路由，并保证小程序返回键/分享路径正确',
      '海报与分享必须真实实现：小程序用 canvas 绘制 + \`onShareAppMessage\`，H5 用生成图片下载/长按保存；不允许占位',
      '模板详情页的每个模板需对接各自后端能力（知识库、问卷、会话、预约、提醒、记录、回顾）',
      '记录类数据支持小程序手表/健康数据同步时需明确授权与失败兜底',
    ],
    check: [
      '生产包中不存在 MOCK 与调试器代码',
      '所有模板详情页数据来自接口',
      '路由在小程序与 H5 两端均可正确返回、刷新、分享',
      '海报/分享真实可用，分享内容已脱敏',
      '埋点覆盖各模板曝光与关键动作',
    ],
    events: [
      ['app_page_view', '进入应用页', 'page,from', '页面流量'],
      ['tpl_view', '模板详情曝光', 'tpl(education/assessment/advisor/booking/reminders/tracking/review)', '模板使用度'],
      ['tpl_action', '模板内关键动作', 'tpl,action', '模板转化'],
      ['poster_generate', '生成分享海报', 'tpl,success,latency', '传播完成度'],
      ['share_click', '点击分享', 'tpl,share_scene', '传播效果'],
    ],
    funnel: '`app_page_view` → `tpl_view` → `tpl_action` →（转化）',
  },
  'REQ-W05': {
    data: '对话历史（localStorage）、AI 接口地址与密钥（前端明文）',
    must: [
      '**AI 接口必须走服务端代理**，严禁前端携带密钥；服务端负责鉴权、限流、内容安全与审计',
      '会话历史存服务端（按 openid），本地仅缓存最近 N 条用于首屏渲染；跨端（H5/小程序）可续聊',
      '流式输出要有超时、中断重试与降级（失败给明确重试入口，不吞消息）',
      'AI 回复需过内容安全审核与医学边界校验（不承诺疗效、不指导用药调整、涉药引导线下复诊）',
      '会话内容按医疗数据留存要求存储并脱敏，提供用户删除权（隐私合规）',
      '小程序端分块传输需用支持流式的请求方案，并处理后台切换',
    ],
    check: [
      '前端代码中无任何密钥；抓包可见请求均带服务端签发的鉴权',
      '会话可跨端恢复，本地缓存清理后自动回源',
      '流式超时/中断/失败均有可恢复交互',
      '内容安全与医学边界校验已上线并留痕',
      '数据留存与删除权已实现，隐私政策已披露',
      '8 个入口的场景化开场文案由服务端返回并可配置',
    ],
    events: [
      ['agent_open', '打开 AI 助理', 'entry,plan_name,stage,week,remind_type', '助理入口分布'],
      ['agent_msg_send', '用户发送消息', 'entry,msg_index,has_option,is_multi', '会话深度'],
      ['agent_msg_recv', '收到 AI 回复', 'entry,latency,is_stream_end,success', '服务质量'],
      ['agent_option_click', '点选 AI 给出的选项', 'entry,option_index', '选择题有效性'],
      ['agent_summary_generate', '生成咨询小结', 'entry,turn_count', '价值达成'],
      ['agent_summary_cta', '点击小结后的下一步', 'entry,cta_id', '助理到主链路的转化'],
    ],
    funnel: '`agent_open` → `agent_msg_send` → `agent_summary_generate` → `agent_summary_cta`',
  },
  'REQ-W06': {
    data: '问卷题目与结论（前端定义）',
    must: [
      '问卷题库与版本由服务端下发，支持题目增删改与灰度；作答记录逐题上报以便断点续答',
      '**评估结论必须由服务端计算**，前端不参与判定；结论文案模板由服务端返回',
      '敏感题目的作答需加密存储、按医疗数据留存要求管理，并提供用户删除权',
      '结论需可追溯（题目版本 + 答案 + 结论 + 时间），供医学与合规复核',
      '结论页承接（看方案 / 问助理 / 约面诊）需全部真实可达；面诊需对接真实排班或客服',
    ],
    check: [
      '题库来自服务端且带版本号',
      '结论由服务端返回，前端无判断逻辑',
      '断点续答跨端/跨会话可恢复',
      '作答与结论加密存储且可追溯',
      '结论承接全部可达，无占位',
      '埋点覆盖每一步与结论',
    ],
    events: [
      ['assess_start', '进入评估', 'assess_type(eligibility/followup),entry', '评估进入率'],
      ['assess_step', '完成一题', 'assess_type,question_id,step,skipped', '题目流失分析'],
      ['assess_complete', '提交评估', 'assess_type,duration,result_code', '评估完成率'],
      ['assess_result_cta', '结论页点击承接', 'assess_type,cta_id', '结论转化'],
    ],
    funnel: '`assess_start` → `assess_step`（逐题）→ `assess_complete` → `assess_result_cta`',
  },
  'REQ-W07': {
    data: '方案内容与 15 篇科普文章（前端硬编码）',
    must: [
      '方案由服务端生成并与医生审核绑定（含审核医生、审核时间、方案版本），前端不拼装医疗内容',
      '科普文章接入 CMS：支持草稿/审核/发布流程，医生审核留痕，文章 id 稳定且可回溯',
      '文章正文需防 XSS（富文本白名单），图片走 CDN',
      '阅读行为（阅读进度、停留时长、是否读完）需上报，用于内容优化',
      '方案页与科普页的审核医生、免责声明由服务端统一提供，不允许前端各自硬编码',
    ],
    check: [
      '方案内容来自接口并带审核信息',
      '文章全部来自 CMS，无前端硬编码；id 与埋点一致',
      '富文本渲染安全（无 XSS 风险），图片 CDN 正常',
      '阅读事件上报完整，可算读完率',
      '审核医生与免责声明由服务端下发，全站一致',
      '文章数量、标题与实际内容一致（消除「38 篇」类口径偏差）',
    ],
    events: [
      ['plan_view', '方案页曝光', 'plan_id,plan_name,weeks', '方案触达'],
      ['plan_module_toggle', '展开/收起方案模块', 'plan_id,module_id,action', '内容关注度'],
      ['edu_list_view', '科普列表曝光', 'stage,entry', '内容入口'],
      ['article_read', '阅读文章', 'article_id,duration,progress,finished', '内容消费质量'],
      ['article_cta', '文章内 CTA 点击', 'article_id,cta_id(agent/assess)', '内容转化'],
    ],
    funnel: '`plan_view` → `plan_buy_click`（转入购药单）｜`edu_list_view` → `article_read` → `article_cta`',
  },
  'REQ-W08': {
    data: '处方/费用/知情同意/地址/回顾数据（前端硬编码）',
    must: [
      '处方、费用明细（原价/权益抵扣/应付）全部由服务端价格与订单中心返回，前端不计算金额',
      '知情同意：展示服务端下发的**同意书版本**，签署后服务端存证（用户、时间、版本、IP、设备），可查询与导出',
      '收货地址：加密存储、脱敏展示、支持冷链可达性校验；地址修改需二次确认',
      '支付：小程序走微信支付（\`wx.requestPayment\`），H5 走 JSAPI/H5 支付；支付结果以服务端回调为准并处理「支付中」中间态',
      '订单与物流状态由服务端驱动，续药提醒基于真实库存消耗计算',
      '回顾页数据来自服务端真实疗程数据，无数据时不生成叙事；分享需脱敏，不含姓名与报告信息',
    ],
    check: [
      '金额全部来自服务端，前端无计算逻辑',
      '同意书版本可追溯，签署存证字段齐全',
      '地址加密存储、脱敏展示，冷链校验生效',
      '两端支付走通，含成功/失败/取消/超时/重复支付',
      '订单与物流状态同步正确，续药提醒时点准确',
      '回顾数据与真实疗程一致；分享内容已脱敏',
      '全流程埋点可还原：进入 → 签署 → 填址 → 支付 → 结果',
    ],
    events: [
      ['invoice_view', '进入购药页', 'order_id,plan_id,amount', '转化漏斗关键节点'],
      ['consent_sign', '签署知情同意', 'order_id,consent_version,success', '合规留痕 + 卡点分析'],
      ['addr_save', '保存收货地址', 'order_id,has_region,success', '卡点分析'],
      ['pay_todo_block', '前置未完成时点击支付', 'order_id,missing(signed/addr)', '摩擦点定位'],
      ['pay_click', '点击支付', 'order_id,amount,pay_channel', '支付转化'],
      ['pay_result', '支付结果', 'order_id,amount,result(success/fail/cancel),err_code', '收入与失败分析'],
      ['recap_view', '进入结营回顾', 'plan_id,weeks,scroll_depth', '复购前置触达'],
      ['recap_share', '回顾页分享', 'plan_id,share_scene,success', '传播效果'],
    ],
    funnel: '`invoice_view` → `consent_sign` → `addr_save` → `pay_click` → `pay_result(success)`',
  },
  'REQ-W09': {
    data: '价格、周期、面诊次数、成果数字（多处硬编码且互相冲突）',
    must: [
      '价格与周期口径统一由**服务端价格中心/商品中心**下发，前端一律读取，禁止任何页面自行书写金额',
      '营销文案（含价格表述、权益说明）需合规审核并版本化，改动可追溯',
      '全站占位符（`¥ X,XXX`、`¥ XXX`）必须清零，未定价内容不得上线展示',
      '成果数字（体重、腰围等）只来自用户真实数据，无数据时不展示、不编造',
      '建立全站文案巡检机制（发布前扫描硬编码数字与违规词）',
    ],
    check: [
      '全站金额来自接口，代码中无金额字面量',
      '周期、面诊次数口径唯一，抽查任意两页一致',
      '无占位符残留（构建时校验）',
      '成果数据来自服务端且与真实记录一致',
      '营销文案有审核记录与版本号',
      '发布前文案巡检通过',
    ],
    events: [
      ['price_view', '价格信息曝光', 'sku_id,amount,page', '价格敏感度'],
      ['copy_audit_block', '文案被合规拦截（构建期）', 'file,rule', '质量监控'],
    ],
    funnel: '—（横切项，通过 `price_view` 与各页转化事件联合分析）',
  },

  'REQ-E01': {
    data: '各案例页的 SYS_INFO（前端硬编码）',
    must: [
      '报告解读数据来自报告服务接口，按人群模板（人群/年龄/性别）下发；前端不内置任何指标数据',
      '人群模板（系统分类、指标集、参考区间、人像素材）由服务端配置，新增人群不改前端代码',
      '`SYS_INFO` 需固化为接口契约（字段、类型、必填、枚举），前端与后端共同评审',
      '入口与默认页需明确：线上默认地址不能指向已删除页面（当前存在 404 风险，见待确认清单 Q-01）',
      '小程序承载方式需确定（web-view 内嵌或原生重写），影响整个项目的技术选型',
    ],
    check: [
      '全部案例数据来自接口，前端无指标硬编码',
      '人群模板由服务端下发，新增人群零前端改动',
      '接口契约已评审定版，字段与前端一致',
      '线上默认入口可达，无 404',
      '所有在册页面与切换菜单一致，无指向已删页面的菜单项',
      '字体与素材统一（无外部字体依赖），小程序内渲染正常',
      '埋点区分人群模板与模块',
    ],
    events: [
      ['report_view', '进入报告解读页', 'report_id,template,has_history', '入口与人群分布'],
      ['report_module_view', '模块曝光', 'report_id,module_id,position', '阅读路径分析'],
      ['report_switch', '切换报告/人群', 'from_report,to_report,from_template,to_template', '多报告使用度'],
    ],
    funnel: '`report_view` → `report_module_view`（③）→ `sys_zone_click` → `cta_click`（AI 深度解析）',
  },
  'REQ-E02': {
    data: '总览文案、AI 摘要、3 张问题卡',
    must: [
      'AI 摘要由服务端生成并缓存（含生成时间与模型版本），前端不写死；生成失败时降级为结构化结论而非空白',
      '整体标签与「N 项需关注」由异常项统计计算，需服务端返回，不可文案写死',
      '问题卡由异常项服务端生成（名称、结论、严重度、关联系统 key），数量与排序规则需定稿',
      '「查看详情」联动按服务端返回的系统 key 定位，不靠文案匹配',
      '报告日期取真实报告日期；缺失时应阻止展示而非编造',
      '面诊入口需对接真实排班/客服，未上线则不渲染',
    ],
    check: [
      'AI 摘要来自接口，含生成时间与版本，失败可降级',
      '标签与问题数量由服务端计算，保持一致',
      '问题卡数量规则（>3 项时的取舍）已定稿并实现',
      '详情联动定位准确率 100%（按 key 校验）',
      '报告日期真实，无编造与占位',
      '面诊入口真实可达或明确不渲染',
      '埋点覆盖摘要曝光、问题卡曝光与详情点击',
    ],
    events: [
      ['overview_view', '总览模块曝光', 'report_id,abnormal_count,ai_summary_status', '结论触达'],
      ['ai_summary_view', 'AI 摘要曝光并停留 ≥300ms', 'report_id,summary_version', 'AI 内容接受度'],
      ['issue_view', '问题卡曝光', 'report_id,issue_key,severity', '问题关注度'],
      ['issue_detail_click', '点击查看详情', 'report_id,issue_key,sys_key', '联动有效性'],
      ['issue_doctor_click', '点击预约面诊', 'report_id,issue_key', '转化'],
    ],
    funnel: '`overview_view` → `issue_view` → `issue_detail_click` →（③系统详情）',
  },
  'REQ-E03': {
    data: '系统分类、状态、指标、坐标与热区',
    must: [
      '系统分类、状态、指标、参考区间、`tone` 全部由接口按人群模板返回；**移除前端 `flagTone` 中文正则匹配**，改由接口显式返回语义（good/warn/none）',
      '热区坐标与卡片文案随人群模板配置化（7 卡/8 卡布局由配置驱动），不写死在 HTML',
      '人像素材需最终版权素材并随模板下发（当前老年男性/老年女性/儿童素材仍待替换）',
      '指标缩写解释（tip）内容来自服务端医学词条库，避免前端散落文案',
      '系统详情 CTA（预约专项检查 / AI 深度解析）需真实可达，AI 需带 context_id 而非 URL 明文指标',
    ],
    check: [
      '系统与指标数据完全来自接口，前端无正则推断',
      '7 卡/8 卡布局由配置驱动，切换人群不错位',
      '热区在不同分辨率与缩放下与卡片严格对齐（多机型验证）',
      '人像素材为最终版权版本，随模板下发',
      '缩写解释来自词条库',
      'CTA 真实可达，AI 上下文不落 URL',
      '埋点覆盖系统点击与详情曝光',
    ],
    events: [
      ['sys_zone_click', '点击人体图热区', 'report_id,sys_key,sys_status', '系统关注分布'],
      ['sys_detail_view', '系统详情卡曝光', 'report_id,sys_key,metric_count', '详情阅读率'],
      ['sys_metric_tip', '点击指标缩写解释', 'report_id,sys_key,metric_key', '理解成本'],
      ['sys_cta_click', '详情卡 CTA 点击', 'report_id,sys_key,cta_id(exam/ai)', '转化'],
    ],
    funnel: '`sys_zone_click` → `sys_detail_view` → `sys_cta_click`（→ AI 采集页）',
  },
  'REQ-E04': {
    data: '趋势指标与折线坐标（手绘 SVG）',
    must: [
      '趋势数据由服务端按历史报告聚合返回（指标、年份、数值、参考区间、方向语义），图表**数据驱动生成**，取消手绘坐标',
      '无历史数据时由接口明确返回「首次体检」标识，前端据此切换呈现，不展示空图',
      '参考区间与「升高/降低是否为问题」的方向语义由服务端给出，前端不推断',
      '数据点缺失（某年未体检）需支持断点展示，不用 0 补齐',
      '图表需在小程序端可用（canvas 或纯 DOM，避免仅 H5 支持的方案）',
    ],
    check: [
      '折线图由数据驱动生成，无手写坐标',
      '首次体检与多历史两种情况均验证通过',
      '参考区间与方向语义来自接口',
      '数据缺失断点展示正确，不误导',
      '小程序端图表渲染与 H5 一致',
      '埋点覆盖 Tab 切换与图表曝光',
    ],
    events: [
      ['trend_view', '趋势模块曝光', 'report_id,metric_count,has_history', '模块触达'],
      ['trend_tab_switch', '切换趋势指标', 'report_id,from_metric,to_metric', '关注指标分布'],
      ['trend_point_tap', '点选数据点', 'report_id,metric_key,year,value', '数据探索深度'],
    ],
    funnel: '`trend_view` → `trend_tab_switch` → `trend_point_tap`',
  },
  'REQ-E05': {
    data: '干预卡四段式文案',
    must: [
      '干预建议由服务端（医学知识库 + 用户异常项）生成并返回，前端不内置建议文案',
      '建议必须与用户实际异常项强关联，不得出现报告中没有的问题',
      '建议文案需医学审核并版本化；含量化目标（频次/时长）的字段结构化，便于后续打卡与随访复用',
      'CTA（AI 深度建议 / 深度定制）需带 context_id，进入 AI 后不重复采集已知信息',
      '两种卡形态（四段式 / 旧版）收敛为一套，避免双实现',
    ],
    check: [
      '建议来自接口，与异常项强关联（有关联校验）',
      '量化目标为结构化字段，非纯文案',
      '医学审核与版本可追溯',
      'CTA 真实可达且带上下文',
      '全站仅一种卡形态',
      '埋点覆盖曝光与 CTA',
    ],
    events: [
      ['lifestyle_view', '生活方式模块曝光', 'report_id,card_count', '模块触达'],
      ['lifestyle_card_view', '单卡曝光', 'report_id,sys_key,card_type', '建议关注度'],
      ['lifestyle_cta_click', '点击 AI 深度建议/深度定制', 'report_id,cta_id,sys_key', '转化到 AI'],
    ],
    funnel: '`lifestyle_view` → `lifestyle_card_view` → `lifestyle_cta_click` →（AI 采集）',
  },
  'REQ-E06': {
    data: '随访四档内容（前端正则分桶）',
    must: [
      '随访计划由服务端按异常项与医学规则生成，四档为**结构化字段**（时间、动作、项目、必要性、提醒时间），取消中文正则分桶',
      '随访计划需写入提醒中心，并通过小程序订阅消息 / 服务号模板消息在正确时间触达用户',
      '导流按钮（记录数据 / 设置提醒 / 预约复查）需真实对接：记录写入数据服务、提醒写订阅消息、预约跳真实排班',
      '用户可在页面上确认/关闭随访项，状态回写服务端，避免无效提醒',
      '随访计划变更（报告更新、医生调整）需可同步并留痕',
    ],
    check: [
      '随访四档为结构化字段，无正则分桶',
      '提醒已接入订阅消息，触达时间准确',
      '三个导流按钮均真实可用',
      '用户确认/关闭状态正确回写',
      '计划变更同步与留痕可用',
      '文案不制造恐慌（急症提示单独走合规文案）',
      '埋点覆盖计划曝光、确认与导流',
    ],
    events: [
      ['followup_view', '随访模块曝光', 'report_id,bucket_count', '模块触达'],
      ['followup_item_view', '单档曝光', 'report_id,bucket(daily/m1/m3/m6),item_count', '随访档关注度'],
      ['followup_action_click', '点击导流按钮', 'report_id,bucket,action(device/remind/appt)', '随访执行转化'],
      ['followup_confirm', '确认/关闭随访项', 'report_id,bucket,action(confirm/close)', '计划有效性'],
    ],
    funnel: '`followup_view` → `followup_action_click` → `followup_confirm`',
  },
  'REQ-E07': {
    data: '报告上下文（localStorage）、计划书提示词与离线兜底内容',
    must: [
      '报告上下文改为服务端 `context_id` 换取（禁止 localStorage 明文与 URL 明文），一次性、限时、鉴权',
      '计划书生成改为**异步任务**：提交 → 任务 id → 轮询/推送状态 → 完成取回；需处理排队、超时、失败重试',
      '计划书内容需医学规则校验 + 医生审核留痕（生成模型版本、审核人、审核时间）',
      '离线兜底内容只能用于异常降级，且必须明确标注为「示例内容」，不得冒充真实生成结果',
      '计划书分享必须脱敏：不含姓名、报告原文、指标数值；分享链接需鉴权或一次性 token',
      '计划书需支持再次查看、下载/保存（小程序内保存到相册或转发）',
    ],
    check: [
      '上下文经服务端换取，本地与 URL 无明文健康数据',
      '生成链路异步化，排队/超时/失败均有明确状态与重试',
      '生成内容有医学校验与审核留痕',
      '离线兜底仅降级使用且明确标注',
      '分享内容脱敏，链接有鉴权与有效期',
      '计划书可再次查看与保存',
      '埋点可还原：入口 → 采集 → 生成 → 查看 → 分享',
    ],
    events: [
      ['plan_entry_click', '从报告进入 AI/计划书', 'report_id,entry(module3/module5),sys_key', '入口转化'],
      ['plan_collect_finish', '采集完成', 'session_id,turn_count,duration', '采集完成率'],
      ['plan_generate_start', '提交生成任务', 'session_id,report_id', '生成发起'],
      ['plan_generate_result', '生成结果', 'task_id,result(success/fail/timeout),latency,is_fallback', '生成成功率'],
      ['plan_view', '查看计划书', 'plan_id,scroll_depth', '计划书阅读深度'],
      ['plan_share', '分享计划书', 'plan_id,success', '传播'],
    ],
    funnel: '`plan_entry_click` → `plan_collect_finish` → `plan_generate_start` → `plan_generate_result(success)` → `plan_view`',
  },
  'REQ-E08': {
    data: '儿童系统分类、指标与家长向文案',
    must: [
      '儿童人群模板（7 个系统、指标、参考区间）由服务端下发；儿童参考标准（P 值/百分位）需医学提供定稿并版本化',
      '未成年人信息处理需监护人授权（隐私合规硬要求），首次进入需明确告知并记录授权',
      '人像与文案面向家长，禁止标签化措辞（「肥胖」「超标」）；文案过合规词库校验',
      '趋势模块必须说明「儿童指标随年龄变化，按年龄别标准评估」，避免家长误读',
      '口腔/视力「需关注」的面诊入口需对接真实儿童专科排班',
    ],
    check: [
      '儿童模板由服务端下发，前端无硬编码分类',
      '儿童参考标准已定稿并版本化',
      '监护人授权流程已实现并可审计',
      '文案合规校验通过，无标签化措辞',
      '趋势说明文案存在且可读',
      '面诊入口真实可达',
      '埋点可区分儿童人群模板',
    ],
    events: [
      ['child_report_view', '进入儿童报告', 'report_id,template=child,age', '人群分布'],
      ['child_sys_click', '点击儿童系统热区', 'report_id,sys_key', '系统关注分布'],
      ['guardian_consent', '监护人授权', 'report_id,version,success', '合规留痕'],
      ['child_doctor_click', '点击儿童专科面诊', 'report_id,sys_key', '转化'],
    ],
    funnel: '`child_report_view` → `child_sys_click` → `child_doctor_click`',
  },

  'REQ-W10': {
    lean: true,
    data: 'service_record（三渠道归一的处方 + 支付购药记录）、判定输出（in_service / stage / week / source_channel）',
    must: [
      '三渠道记录统一由服务端归并为 `service_record`，前端只消费判定结果，**不做任何渠道判断或状态推断**',
      '判定接口与首屏其他数据合并下发（或前置请求），确保置顶在首屏渲染前确定；超时/失败降级为「不置顶」并上报',
      '用户匹配必须双因子（手机号 + 姓名同时一致），匹配失败即不展示，且结果留痕可追溯（医疗数据合规硬要求）',
      '支付成功后状态需实时生效；客服/线下渠道允许 T+1，并提供人工同步入口与状态可观测',
      '退款/处方作废/疗程结束超宽限期必须可撤回置顶与「进行中」状态，状态流转需有服务端记录',
      '小程序与 H5 两端呈现一致；首屏不得出现卡片位置跳动（骨架屏或服务端预判定）',
    ],
    check: [
      '三渠道各自产生「有效处方 + 支付成功」后线上均能看到置顶减重卡',
      '置顶后状态为「进行中」，代码中不存在回落到「未开始」的路径',
      '周次按 pay_time 起算并能随续费更新，不重置',
      '其他专项卡仍可见，仅排序在后',
      '退款/作废/超期可撤回置顶与状态',
      '线下手机号+姓名不匹配时不展示，且无技术口径暴露给用户',
      '判定接口失败时降级不置顶，页面其余部分正常',
      '首屏无卡片位置跳动，两端表现一致',
      '埋点可还原：记录同步 → 置顶曝光 → 进行中曝光 → CTA 点击',
    ],
    events: [
      ['service_record_sync', '渠道记录同步入库（服务端事件）', 'channel,delay,matched', '渠道数据健康度'],
      ['wcard_pin_view', '健康订阅区置顶减重卡曝光', 'source_channel,in_service,position', '置顶触达'],
      ['wcard_state_view', '卡片渲染「进行中」', 'stage,week,source_channel', '状态一致性'],
      ['service_detect_fail', '判定失败或数据缺失', 'reason,match_result', '异常监控'],
      ['wcard_cta_click', '进行中卡片的 CTA 点击', 'stage,cta_id,source_channel', '置顶后转化'],
    ],
    funnel: '`service_record_sync`（成功）→ `wcard_pin_view` → `wcard_state_view`（进行中）→ `wcard_cta_click`',
  },
};

/* ------------------------------------------------------------------ */

function sectionsFor(key, cfg) {
  return {
    report: REPORT_BASE.replace('%N1%', '@N@').replace('%DATA%', '') + `

### @N@.2 本单事件

| 事件名 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
${cfg.events.map((e) => `| \`${e[0]}\` | ${e[1]} | ${e[2]} | ${e[3]} |`).join('\n')}

### @N@.3 漏斗

${cfg.funnel}`,
    prod: BASELINE.replace('%N1%', '@N@').replace('%DATA%', cfg.data) + `

### @N@.2 本单上线必做

${cfg.must.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### @N@.3 上线放行检查清单

${cfg.check.map((s) => `- [ ] ${s}`).join('\n')}`,
  };
}

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(_|assets)/.test(e.name)) walk(p); }
    else if (/^REQ-.*\.md$/.test(e.name)) files.push(p);
  }
})(ROOT);

let done = 0;
for (const f of files.sort()) {
  const key = (path.basename(f).match(/REQ-[PWE]\d{2}/) || [])[0];
  const cfg = CFG[key];
  if (!cfg) { console.log('! 无配置 ' + key); continue; }
  // 精简版需求单：章节由人工撰写，本脚本不注入「上线要求 / 数据上报」两节
  if (cfg.lean) { console.log('  精简版跳过注入 ' + key); continue; }
  let lines = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);

  // 幂等：先移除已注入的两节
  const strip = (title) => {
    const i = lines.findIndex((l) => new RegExp('^##\\s+\\d+\\.\\s*' + title).test(l));
    if (i < 0) return;
    let j = i + 1;
    while (j < lines.length && !/^##\s/.test(lines[j])) j++;
    lines.splice(i, j - i);
  };
  strip('上线要求');
  strip('数据上报');

  const maxN = Math.max(0, ...lines.map((l) => (l.match(/^##\s+(\d+)\./) || [0, 0])[1]).map(Number));
  const nReport = maxN + 1, nProd = maxN + 2;
  const secs = sectionsFor(key, cfg);

  // 1) 数据上报：插在「数据与字段」之后（即下一个 ## 之前）
  let di = lines.findIndex((l) => /^##\s+\d+\.\s*数据与字段/.test(l));
  let insertAt = -1;
  if (di >= 0) {
    let j = di + 1;
    while (j < lines.length && !/^##\s/.test(lines[j])) j++;
    insertAt = j;
  } else {
    const k = lines.findIndex((l) => /^##\s+\d+\.\s*验收标准/.test(l));
    insertAt = k >= 0 ? k : lines.length;
  }
  // 注意：必须拆成「一行一个元素」，否则后续逐行正则无法命中整段
  const reportBlock = ['', '---', '', `## ${nReport}. 数据上报（埋点）`, '', ...secs.report.replace(/@N@/g, String(nReport)).split('\n'), ''];
  lines.splice(insertAt, 0, ...reportBlock);

  // 2) 上线要求：插在「待决策项」之前
  let pi = lines.findIndex((l) => /^##\s+\d+\.\s*待决策项/.test(l));
  if (pi < 0) pi = lines.length;
  const prodBlock = ['', '---', '', `## ${nProd}. 上线要求（生产级 · 微信小程序）`, '', ...secs.prod.replace(/@N@/g, String(nProd)).split('\n'), ''];
  lines.splice(pi, 0, ...prodBlock);

  // 3) 全文重排章节号：单次遍历，`## N.` 顺序递增，`### N.k` 跟随其所属小节
  let cur = 0, sub = 0;
  lines = lines.map((l) => {
    const h2 = l.match(/^##\s+(\d+)\.\s*(.*)$/);
    if (h2) { cur++; sub = 0; return `## ${cur}. ${h2[2]}`; }
    const h3 = l.match(/^###\s+(\d+)\.(\d+)\s*(.*)$/);
    if (h3) { sub++; return `### ${cur}.${sub} ${h3[3]}`; }
    return l;
  });

  // 4) 元信息补一行「交付目标」
  const mi = lines.findIndex((l) => /^\|\s*状态\s*\|/.test(l));
  if (mi >= 0 && !lines.some((l) => /^\|\s*交付目标\s*\|/.test(l))) {
    lines.splice(mi + 1, 0, '| 交付目标 | 可上线面向用户使用（H5 + 微信小程序） |');
  }

  // 5) 写入前安全校验：正文骨架必须完整，避免误删
  const h2 = lines.filter((l) => /^##\s/.test(l)).length;
  if (h2 < 9 || !lines.some((l) => /^##\s+\d+\.\s*背景与目标/.test(l)) || !lines.some((l) => /^##\s+\d+\.\s*待决策项/.test(l))) {
    console.log(`!! 结构异常，跳过写入：${path.basename(f)}（## 数量 ${h2}）`);
    continue;
  }

  fs.writeFileSync(f, lines.join('\n'), 'utf8');
  done++;
}
console.log(`已注入上线要求与数据上报：${done} 张需求单`);
