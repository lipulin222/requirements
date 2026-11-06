# 数据上报规范

> 编号 `REQ-WL-BASE-01` ｜ 项目：科学减重（WL）｜ 模块：规范与基线 ｜ 状态：制定中
> 本页是**减重项目埋点的唯一登记表**：各需求单末尾附本单相关的上报点（与本表口径一致），开发看单即知要报什么；新增或调整事件仍以本表为准。

---

## 1. 命名规范

- 格式：`模块_对象_动作`，全小写 + 下划线，如 `wcard_cta_click`。
- 动作收敛为：`view` 曝光、`click` 点击、`switch` 切换、`start`/`complete` 流程、`result` 结果、`fail` 失败。
- **事件名一经上线不得改名**，语义变化只能新增事件，旧事件标注废弃但保留字段。

---

## 2. 公共字段（所有事件必带）

| 字段 | 说明 |
| --- | --- |
| `event` / `ts` | 事件名 / 时间戳（ms） |
| `uid` / `session_id` | 用户标识（openid 或内部匿名 id）/ 会话 |
| `page` / `platform` | 页面标识 / `app`·`wxapp` |
| `app_version` / `channel` | 版本 / 渠道来源 |
| `net` / `device` | 网络 / 机型（未授权时置 `unknown`） |
| `stage` | 服务阶段（内部用，不上屏） |

---

## 3. 事件登记表

### 3.1 服务状态与卡片（STATUS）

卡片各阶段的可交互元素全部登记；主按钮统一走 `wcard_cta_click`，其余独立元素单独建事件。

| 事件 | 触发时机 | 关键参数 | 用途 | 来源单 |
| --- | --- | --- | --- | --- |
| `wcard_pin_view` | 健康订阅区置顶减重卡曝光 | `position` | 置顶触达 | STATUS-01 |
| `wcard_state_view` | 卡片渲染（各阶段） | `stage`、`month_index` | 状态一致性 | STATUS-01 |
| `wcard_cta_click` | 主按钮点击（`cta_id`：assess 快速评估 / report 查看评估报告 / more 查看更多 / consult 线上咨询 / book 预约面诊 / return 返回 / reorder 再次续订 / weight_edit 录体重 / rit_start 记录第一天） | `stage`、`cta_id` | 转化 | STATUS-01 |
| `wcard_ai_click` | 点「询问护士」按钮或页面级 AI 浮钮 | `stage`、`entry` | 助理入口转化 | STATUS-01 |
| `wcard_category_click` | 阶段① 四分类科普入口点击 | `category_id` | 分类入口效果 | STATUS-04 |
| `wcard_faq_view` | 猜你想问每条问题轮播曝光（自动换条逐次记） | `stage`、`article_id`、`seq` | 问题触达 | STATUS-04~07 |
| `wcard_faq_click` | 点猜你想问问题进文章 | `stage`、`article_id` | 深链点击 | STATUS-04~07 |
| `wcard_remind_view` | 提醒卡曝光（持续曝光逐次记） | `remind_id`、`expose_seq` | 曝光频次 | STATUS-07 |
| `wcard_remind_click` | 点提醒卡 | `remind_id` | 提醒转化 | STATUS-07 |
| `wcard_data_click` | 点体重数据块（进趋势页） | — | 数据关注行为 | STATUS-06 |
| `wcard_red_dot_click` | 点查看更多红点 | `todo_type(生成月报/new)` | 红点联动有效性 | RECORD-01 |
| `wcard_old_switch_click` | 点右上角「切换旧版」 | `stage` | 旧版切换意愿 | STATUS-01 |
| `wcard_ai_click` | 点「AI减重助理」按钮 | `stage`、`entry` | 助理入口转化 | STATUS-01 |
| `wcard_recap_click` | 点结营回顾入口 | `stage` | 回顾入口（二期） | STATUS-08 |

### 3.2 处方·健康订阅·订单（RX）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `invoice_view` | 进入首诊套餐页 | `order_id`、`plan_id`、`amount` | 转化漏斗节点 |
| `consent_sign` | 签署知情同意 | `order_id`、`consent_version`、`success` | 合规留痕 + 卡点 |
| `addr_save` | 保存收货地址 | `order_id`、`has_region`、`success` | 卡点分析 |
| `pay_todo_block` | 前置未完成时点支付 | `order_id`、`missing(signed/addr)` | 摩擦点定位 |
| `pay_click` | 点击支付 | `order_id`、`amount`、`pay_channel` | 支付转化 |
| `pay_result` | 支付结果 | `order_id`、`amount`、`result`、`err_code` | 收入与失败分析 |

### 3.3 方案·评估·随访（PLAN）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `assess_start` | 进入评估 | `assess_type`、`entry` | 进入率 |
| `assess_step` | 完成一题 | `assess_type`、`question_id`、`step`、`skipped` | 题目流失 |
| `assess_complete` | 提交评估 | `assess_type`、`duration`、`result_code` | 完成率 |
| `plan_view` | 方案页曝光 | `plan_id`、`weeks` | 方案触达 |
| `plan_buy_click` | 方案页点击订阅 | `plan_id` | 方案→订阅转化 |
| `report_view` | 报告页曝光 | `report_id`、`branch`、`generate_days` | 报告触达 + 时效分布 |
| `report_buy_click` | 报告内点购药 | `report_id`、`branch` | 购药意愿 |
| `report_buy_block` | 报告过时效被拦截并 toast | `report_id`、`reason(converted/expired)` | 时效拦截量 |
| `report_reassess_click` | toast 后点引导重新评估 | `report_id` | 拦截→重评挽回率 |
| `report_share_click` | 报告页点亲友分享类按钮（adapt「推荐给亲友做评估」/ normal「邀请亲友评估」） | `report_id`、`branch`、`share_type(native/copy)` | 亲友裂变 |

就诊人浮层（PLAN-05）前端不上报，由服务端记录。

### 3.4 科普·内容（EDU）

| 事件 | 触发时机 | 关键参数 | 用途 |
| --- | --- | --- | --- |
| `edu_list_view` | 科普列表曝光 | `stage`、`entry` | 内容入口 |
| `article_read` | 阅读文章 | `article_id`、`duration`、`progress`、`finished` | 内容质量 |
| `article_cta` | 文章内 CTA | `article_id`、`cta_id(assess)` | 内容转化 |
| `content_share_click` | 点分享（文章 / 评估报告 / 减重月报 / 结营回顾） | `content_type(article/report/month_report/recap)`、`content_id`、`method(poster 海报 / link 链接 / native 系统分享 / copy 复制)` | 分享行为与方式占比 |

### 3.5 通用技术事件

| 事件 | 说明 |
| --- | --- |
| `track_drop` | 队列超限丢弃 |
| `net_error` | 接口失败（带 `api`、`code`、`latency`） |
| `page_perf` | 首屏与可交互耗时 |
| `js_error` | 前端异常（不含用户数据） |

### 3.6 体重 · 聚合页 · 月报（STATUS-06 / RX-06 / RECORD-01）

体重、BMI 等数值属第 5 节红线，体重相关事件**只报动作、不报数值**。

| 事件 | 触发时机 | 关键参数 | 用途 | 来源单 |
| --- | --- | --- | --- | --- |
| `weight_edit_click` | 点画笔进录入体重页 | `entry(card/trend)` | 录入入口 | STATUS-06 |
| `weight_submit_result` | 录入体重提交成功 / 失败 | `success`（不含数值） | 录入完成率 | STATUS-06 |
| `trend_view` | 体重趋势页曝光 | — | 趋势页触达 | STATUS-06 |
| `more_view` | 聚合页入口页曝光 | — | 聚合页触达 | RX-06 |
| `more_entry_click` | 点三入口（评估报告 / 减重月报 / 相关订单） | `entry(report/month/orders)` | 入口分流 | RX-06 |
| `more_list_view` | 三个列表页曝光 | `list_type(report/month/orders)` | 列表触达 | RX-06 |
| `more_item_click` | 列表条目点击进明细 | `list_type`、`item_id` | 列表转化 | RX-06 |
| `more_new_assess_click` | 点吸底「新增评估」 | — | 重评入口 | RX-06 |
| `order_list_btn_click` | 订单列表点操作按钮 | `btn(logistics/reorder/review)`、`order_id` | 订单操作 | RX-06 |
| `month_report_generate_click` | 点「生成最新月报」 | — | 生成意愿 | RECORD-01 |
| `month_report_generate_result` | 月报生成成功 / 失败 | `success`（不含报告内容） | 生成成功率 | RECORD-01 |
| `month_report_view` | 月报详情曝光 | `issue` | 阅读触达 | RECORD-01 |
| `recap_view` | 结营回顾页曝光 | — | 回顾触达 | RECORD-02 |

---

## 4. 核心漏斗

| 漏斗 | 路径 | 回答的问题 |
| --- | --- | --- |
| **服务状态生效** | `wcard_pin_view` → `wcard_state_view`（进行中）→ `wcard_cta_click` | 置顶卡是否被看到并点击 |
| **减重成交** | `wcard_cta_click` → `assess_complete` → `plan_view` → `invoice_view` → `consent_sign` → `addr_save` → `pay_result`(success) | 从门户到成交，哪步流失最大 |
| **内容影响** | `edu_list_view` → `article_read` → `article_cta` | 科普对决策的影响 |

---

## 5. 不报什么（红线）

- 报告原文、指标数值、诊断结论
- 姓名、手机号、身份证、地址
- 聊天内容、处方图片

用户标识只用 `openid` / 内部匿名 id。
