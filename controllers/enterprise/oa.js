const MYSQL = require('../../base/mysql')
const GZSQL = require('../../base/nbgz_db')
const OASQL = GZSQL.withSchema('gzadmin')
const CLOUDSQL = GZSQL.withSchema('gzcloud')

const moment = require('moment')



let o = {}

o.Patch = async ctx=>{
  let contracts = await OASQL.from('contract')
  return contracts
  // 转移所有项目

  // 转移开票信息

  // 转移阶段计划

  // 转移人员信息

  // 转移建安工作量
}


module.exports = o