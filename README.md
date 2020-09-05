# 高专云服务端解决方案 GZCLOUD-ORM - Node.js

Node.js 版本 GZCLOUD 的服务端 


项目结构

## 项目结构

```
GZCLOUD-ORM
├── README.md                   说明文档
├── app.js                      项目入口
├── restful                     RESTFUL对象
│   └── v0                        v0版本
│       ├── index.js                汇总脚本
│       ├── sessions.js             会话/登录          
│       ├── users.js                用户
│       ├── types.js                类型
│       ├── contracts.js            合约
│       ├── ...
│       └── deps.js                 部门
├── middlewares                 中间件
│   ├── auth.js                   用户身份验证
│   └── response.js               返回结构解析
├── models                      ORM对象
│   ├── index.js                  汇总脚本                   
|   ├── util.js                   辅助函数库
│   ├── ...
│   └── user.js                   ORM对象 - 用户
├── config.js                   项目配置文件
├── package.json                npm包配置文件
├── nodemon.json                nodemon配置文件
├── tools                       非NPM插件集成
├── migrations                  KNEX迁移脚本
│   ├── ...
│   └── install.js              数据库初始化脚本
├── logs                        服务日志文件
└── routes
    └── index.js
```