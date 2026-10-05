# 星空天文馆（Star Observatory）

软件开发综合实践 期末大作业 —— 学号 20253060001 彭建仁

一个面向天文爱好者的科普展示型 Web 作品，将八大行星的科学数据以文字、图表与三维场景三种形式呈现。

## 功能模块

| 页面 | 说明 |
| --- | --- |
| 首页 index.html | 站点介绍、今日观星提示、功能入口 |
| 行星档案 planets.html | 基于 JSON 数据渲染行星卡片，支持搜索、类型筛选、排序、收藏（localStorage）、详情弹窗 |
| 数据可视化 charts.html | ECharts 柱状图（直径）、饼图（类型分布）、雷达图（特征对比） |
| 三维太阳系 space.html | Three.js 三维场景，拖拽旋转、滚轮缩放、点击行星查看信息 |
| 关于 about.html | 作品与技术栈说明 |

## 技术栈

- HTML5 + CSS3（Flex / Grid、媒体查询响应式）
- 原生 JavaScript（Fetch API、localStorage、ES5 兼容写法）
- ECharts 5.5
- Three.js r147 + OrbitControls
- JSON 数据（data/planets.json）

## 运行方式

由于页面使用 Fetch 加载本地 JSON 文件，请通过本地 HTTP 服务器访问，不要直接双击 HTML：

```bash
# 任选其一
npx serve .
python -m http.server 8080
```

然后浏览器打开 `http://localhost:8080`。

## 目录结构

```
├── index.html / planets.html / charts.html / space.html / about.html
├── css/style.css
├── js/  main.js / index.js / planets.js / charts.js / space.js
├── data/planets.json / empty.json
└── lib/ echarts.min.js / three.min.js / OrbitControls.js
```
