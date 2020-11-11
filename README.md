# 高专云服务端解决方案 hstigger-server - Node.js

Node.js 版本 HSTigger-Server 的服务端 


项目结构

## 项目结构

```
GZCLOUD-ORM
├── app.js                      项目入口
├── restful                     RESTFUL对象 - 负责将数据从ctx中提取出来，鉴别有效性，调用models进行处理并返回
│   └── v0                          v0版本
│       ├── index.js                汇总脚本
│       ├── sessions.js             会话/登录          
│       ├── users.js                用户
│       ├── types.js                类型
│       ├── contracts.js            合约
│       ├── ...
│       └── deps.js                 部门
├── middlewares                 中间件 
│   ├── auth.js                   用户身份验证
│   ├── router.js                 restful路由
│   └── response.js               返回结构解析
├── models                      数据模型    -   
│   ├── index.js                  汇总脚本     
│   ├── ...
│   └── user.js                   ORM对象 - 用户
├── libs                        非NPM插件集成
│   ├── index.js                  汇总脚本            
|   ├── util.js                   辅助函数库
│   ├── ...
│   └── user.js                   ORM对象 - 用户
├── logs                        服务日志目录
├── backup                      数据库备份目录
├── README.md                   说明文档
├── config.js                   项目配置文件
├── package.json                npm包配置文件
└── process.prod.json           pm2配置文件
```

## 功能描述

1. 账户系统
2. 任务系统
3. 流程系统 
4. 项目管理
5. 企业管理
6. 文件管理
7. 档案管理

