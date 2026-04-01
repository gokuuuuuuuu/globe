# MRIWP - 重大风险智能预警平台

Major Risk Intelligence Warning Platform (MRIWP) 是一个面向航空运营的综合风险监控与管理平台，提供航班风险评估、机场环境监控、人员管理、飞机维护追踪、治理闭环以及统计分析等功能。

## 技术栈

| 类别      | 技术                                              |
| --------- | ------------------------------------------------- |
| 框架      | React 19 + TypeScript 5.9                         |
| 构建      | Vite 7                                            |
| 路由      | React Router DOM 7                                |
| 状态管理  | Zustand 5                                         |
| 样式      | Tailwind CSS 4 + 原生 CSS                         |
| 图表      | Recharts 3                                        |
| 地图      | Leaflet 1.9 + react-leaflet 5                     |
| 3D 可视化 | Three.js + @react-three/fiber + @react-three/drei |
| 流程图    | @xyflow/react                                     |
| 国际化    | 自建 i18n（中/英双语）                            |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/        # 通用组件（Legend 图例等）
├── data/              # 模拟数据（航班、人员等）
├── i18n/              # 国际化（中英文切换）
│   ├── LanguageContext.tsx
│   ├── languageState.ts
│   └── useLanguage.ts
├── layouts/
│   └── AdminLayout.tsx   # 侧边栏布局框架
├── pages/             # 页面组件（28个页面）
└── App.tsx            # 路由配置
```

## 功能模块与页面

### 工作台 (Dashboard)

| 路由 | 页面     | 说明                                        |
| ---- | -------- | ------------------------------------------- |
| `/`  | HomePage | 3D 地球可视化工作台，集成气象图层与航班轨迹 |

### 风险监控 (Risk Monitoring)

| 路由                                  | 页面                  | 说明                         |
| ------------------------------------- | --------------------- | ---------------------------- |
| `/risk-monitoring/flights`            | FlightListPage        | 航班列表，风险等级筛选与排序 |
| `/risk-monitoring/flight-detail`      | FlightDetailPage      | 单航班风险详情、飞行阶段评分 |
| `/risk-monitoring/flight-report`      | FlightReportPage      | 航班风险报告，含多维因子分析 |
| `/risk-monitoring/factor-explanation` | FactorExplanationPage | 因子可解释性分析             |
| `/risk-monitoring/evidence-chain`     | EvidenceChainPage     | 证据链可视化                 |
| `/risk-monitoring/major-risk-detail`  | MajorRiskDetailPage   | 重大风险事件详情             |

### 机场中心 (Airport Center)

| 路由                              | 页面               | 说明               |
| --------------------------------- | ------------------ | ------------------ |
| `/airport-center/airport-list`    | AirportListPage    | 机场列表含风险地图 |
| `/airport-center/airport-detail`  | AirportDetailPage  | 机场详情与环境风险 |
| `/airport-center/airport-flights` | AirportFlightsPage | 机场关联航班       |

### 人员中心 (Personnel Center)

| 路由                                   | 页面                  | 说明               |
| -------------------------------------- | --------------------- | ------------------ |
| `/personnel-center/personnel-list`     | PersonnelListPage     | 人员列表与风险评估 |
| `/personnel-center/personnel-detail`   | PersonnelDetailPage   | 人员详情与风险概况 |
| `/personnel-center/personnel-trend`    | PersonnelTrendPage    | 个人风险趋势分析   |
| `/personnel-center/personnel-vs-fleet` | PersonnelVsFleetPage  | 个人 vs 机队对比   |
| `/personnel-center/training-data`      | TrainingDataPage      | 训练数据与模拟记录 |
| `/personnel-center/historical-flights` | HistoricalFlightsPage | 历史航班记录       |

### 飞机专题 (Aircraft Topic)

| 路由                               | 页面                | 说明               |
| ---------------------------------- | ------------------- | ------------------ |
| `/aircraft-topic/aircraft-detail`  | AircraftDetailPage  | 飞机详情与风险因子 |
| `/aircraft-topic/maintenance-info` | MaintenanceInfoPage | 维修信息与时间线   |

### 环境专题 (Environment Topic)

| 路由                                    | 页面                  | 说明                   |
| --------------------------------------- | --------------------- | ---------------------- |
| `/environment-topic/environment-detail` | EnvironmentDetailPage | 环境风险综合分析       |
| `/environment-topic/message-detail`     | MessageDetailPage     | NOTAM 报文详情解析     |
| `/environment-topic/notice-detail`      | NoticeDetailPage      | 通告详情与影响范围地图 |

### 治理闭环 (Governance)

| 路由                            | 页面                | 说明                           |
| ------------------------------- | ------------------- | ------------------------------ |
| `/governance/work-order-list`   | WorkOrderListPage   | 工单列表，多维筛选             |
| `/governance/work-order-detail` | WorkOrderDetailPage | 工单详情，含风险矩阵与建议操作 |
| `/governance/feedback-review`   | FeedbackReviewPage  | 反馈/复核表单与附件管理        |

### 统计分析 (Statistical Analysis)

| 路由                    | 页面                    | 说明                                     |
| ----------------------- | ----------------------- | ---------------------------------------- |
| `/statistical-analysis` | StatisticalAnalysisPage | 多维统计看板（航班/人员/机场/飞机/模型） |

### 规则与知识中心 (Rules & Knowledge Center)

| 路由                | 页面                  | 说明           |
| ------------------- | --------------------- | -------------- |
| `/knowledge-center` | RiskFactorLibraryPage | 风险因子库管理 |

### 系统管理 (System Management)

| 路由                 | 页面                 | 说明                     |
| -------------------- | -------------------- | ------------------------ |
| `/system-management` | SystemManagementPage | 用户与角色管理，权限矩阵 |

## 国际化

平台支持中英文双语切换，通过侧边栏底部的语言按钮切换。所有页面文本（除机场 ICAO 代码、航班号、飞机型号等技术标识外）均支持翻译。

```tsx
const { t, lang, setLang } = useLanguage();
// 使用方式
t("中文文本", "English text");
```

## 地图服务

地图组件使用 Leaflet + 高德地图瓦片，暗色主题通过 CSS filter 实现：

- 航班轨迹与机场标注
- 通告影响范围圆圈
- 机场风险热力标记

## 机场代码

项目统一使用 ICAO 四字码（如 ZBAA、ZSPD、KORD），不使用 IATA 三字码。
