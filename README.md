# 巴西白糖进口中国CIF价格动态评估计算器

本项目是一个基于前端HTML/JS和Python Flask后台API的实时计算器，旨在动态评估从巴西进口45号白糖到中国的合理CIF价格。数据来源包括CEPEA、ICE期货、FOB Santos现货价格，结合中国海运费、关税、增值税等综合计算，支持每日自动更新。

## 主要特性

- 多源数据接口每日自动更新白糖市场关键价格
- 前端实时交互计算，支持调节FOB、ICE等价格及运费等参数
- 动态显示“最后更新日期”，价格计算结果即时反映市场变动
- 根据进口配额和关税率提供合理进口成本和套利建议
- 简洁现代响应式界面，手机PC均完美适配

---

## 项目结构
/ (根目录)
│
├── index.html # 主页面，前端UI
├── style.css # 页面样式
├── app.js # 前端逻辑及接口交互
├── api # 后端API代码目录
│ └── server.py # Python Flask后端服务
├── README.md # 本文档
├── requirements.txt # Python依赖
└── vercel.json # Vercel部署配置
