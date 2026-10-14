# REQ-WL-BASE-01 · 数据上报规范

> 编号 `REQ-WL-BASE-01` ｜ 项目：科学减重（WL）｜ 模块：规范与基线 ｜ 状态：制定中
> 本页是**减重项目埋点的唯一登记表**：所有需求单不再各写埋点章节，统一在此登记。

---

## 1. 目的与范围

一张表管住「要报什么」。需求单只写业务规则，**不写埋点**；埋点在本页按模块登记，开发按本页实现，数据侧按本页验收。

- **本期只定「要报什么」**：事件名 / 触发时机 / 关键参数 / 用途。
- **上报协议后续同步**：通道（H5 `sendBeacon` / 小程序 `wx.request`）、批量、重试、采样、平台选型、留存期限由数据侧在上线前补充，不阻塞开发。

---

## 2. 命名规范

- 格式：`模块_对象_动作`，全小写 + 下划线，如 `wcard_cta_click`。
- 动作收敛为：`view` 曝光、`click` 点击、`switch` 切换、`start`/`complete` 流程、`result` 结果、`fail` 失败。
- **事件名一经上线不得改名**，语义变化只能新增事件，旧事件标注废弃但保留字段。

---

## 3. 公共字段（所有事件必带）

| 字段 | 说明 |
| --- | --- |
| `event` / `ts` | 事件名 / 时间戳（ms） |
| `uid` / `session_id` | 用户标识（openid 或内部匿名 id）/ 会话 |
| `page` / `platform` | 页面标识 / `h5`·`wxapp` |
| `app_version` / `channel` | 版本 / 渠道来源 |
| `net` / `device` | 网络 / 机型（未授权时置 `unknown`） |
| `stage` | 服务阶段（内部用，不上屏） |

**字段口径以上线前协议为准。**

---

## 4. 事件登记表

### 4.1 服务状态与卡片（STATUS）

| 事件 | 触发时机 | 关键参数 | 用途 | 来源单 |
| --- | --- | --- | --- | --- |
| `service_record_sync` | 渠道记录同步入库（服务端） | `channel`、`delay`、`matched` | 渠道数据健康度 | STATUS-01 |
| `wcard_pin_view` | 健康订阅区置顶减重卡曝光 | `source_channel`、`in_service`、`position` | 置顶触达 | STATUS-01 |
| `wcard_state_view` | 卡片渲染「进行中」 | `stage`、`month_index`、`source_channel` | 状态一致性 | STATUS-01 |
| `service_detect_fail` | 判定失败或数据缺失 | `reason`、`match_result` | 异常监控 | STATUS-01 |
| `wcard_cta_click` | 卡片 CTA 点击 | `stage`、`cta_id`、`source_channel` | 转化 | STATUS-01 |

### 4.2 处方·购药·订单（RX）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `invoice_view` | 进入确认购药页 | `order_id`、`plan_id`、`amount` | 转化漏斗节点 |
| `consent_sign` | 签署知情同意 | `order_id`、`consent_version`、`success` | 合规留痕 + 卡点 |
| `addr_save` | 保存收货地址 | `order_id`、`has_region`、`success` | 卡点分析 |
| `pay_todo_block` | 前置未完成时点支付 | `order_id`、`missing(signed/addr)` | 摩擦点定位 |
| `pay_click` | 点击支付 | `order_id`、`amount`、`pay_channel` | 支付转化 |
| `pay_result` | 支付结果 | `order_id`、`amount`、`result`、`err_code` | 收入与失败分析 |

### 4.3 方案·评估·随访（PLAN）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `assess_start` | 进入评估 | `assess_type`、`entry` | 进入率 |
| `assess_step` | 完成一题 | `assess_type`、`question_id`、`step`、`skipped` | 题目流失 |
| `assess_complete` | 提交评估 | `assess_type`、`duration`、`result_code` | 完成率 |
| `plan_view` | 方案页曝光 | `plan_id`、`weeks` | 方案触达 |
| `plan_buy_click` | 方案页点击购药 | `plan_id` | 方案→购药转化 |

### 4.4 科普·内容（EDU）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `edu_list_view` | 科普列表曝光 | `stage`、`entry` | 内容入口 |
| `article_read` | 阅读文章 | `article_id`、`duration`、`progress`、`finished` | 内容质量 |
| `article_cta` | 文章内 CTA | `article_id`、`cta_id(agent/assess)` | 内容转化 |

### 4.5 AI 助理（AI）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `agent_open` | 打开助理 | `entry`、`plan_name`、`stage`、`week`、`remind_type` | 入口分布 |
| `agent_msg_send` | 用户发送 | `entry`、`msg_index`、`has_option` | 会话深度 |
| `agent_msg_recv` | 收到回复 | `entry`、`latency`、`success` | 服务质量 |
| `agent_summary_generate` | 生成小结 | `entry`、`turn_count` | 价值达成 |
| `agent_summary_cta` | 小结后下一步 | `entry`、`cta_id` | 助理→主链路转化 |

### 4.6 通用技术事件

| 事件 | 说明 |
| --- | --- |
| `track_drop` | 队列超限丢弃 |
| `net_error` | 接口失败（带 `api`、`code`、`latency`） |
| `page_perf` | 首屏与可交互耗时 |
| `js_error` | 前端异常（不含用户数据） |

---

## 5. 核心漏斗

| 漏斗 | 路径 | 回答的问题 |
| --- | --- | --- |
| **服务状态生效** | `service_record_sync`（成功）→ `wcard_pin_view` → `wcard_state_view`（进行中）→ `wcard_cta_click` | 跨渠道用户是否被线上正确识别 |
| **减重成交** | `wcard_cta_click` → `assess_complete` → `plan_view` → `invoice_view` → `consent_sign` → `addr_save` → `pay_result`(success) | 从门户到成交，哪步流失最大 |
| **AI 助理价值** | `agent_open` → `agent_msg_send` → `agent_summary_generate` → `agent_summary_cta` | AI 是否真的推动下一步 |
| **内容影响** | `edu_list_view` → `article_read` → `article_cta` | 科普对决策的影响 |

---

## 6. 不报什么（红线）

- 报告原文、指标数值、诊断结论
- 姓名、手机号、身份证、地址
- 聊天内容、处方图片

用户标识只用 `openid` / 内部匿名 id。

---

## 7. 变更流程

1. 新需求单产生埋点 → 在本页对应模块**追加行**，注明「来源单」。
2. 事件名冻结后不得修改；语义变更新增事件并标注旧事件废弃。
3. 上线前由数据侧按本页核对实现；本页是验收依据。

---

## 8. 待补充（后续同步）

1. 埋点平台（自建 / 采购）与 SDK 形态
2. 上报网关域名与鉴权
3. 批量、重试、采样策略
4. 数据保存期限
5. 看板与北极星指标
