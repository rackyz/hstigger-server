const MYSQL = require('../../base/mysql')
const _ = require('lodash')
const UTIL = require('../../base/util')
const Exception = require('../../base/exception')
let o = {}

const GZSQL = require('../../base/nbgz_db')
const OASQL = GZSQL.withSchema('gzadmin')


o.PostAction = async ctx=>{
  let a = ctx.params.action
  let enterprise_id = ctx.state.enterprise_id
  if(a == 'synchronize_employee'){
    let users = await MYSQL('account_enterprise').select('user_id as id').where({enterprise_id}).leftJoin('account','account.id','user_id').where('type',1)
    let exists = await MYSQL.E(enterprise_id,'employee').select('id')
    let excludes = _.difference(users.map(v=>v.id),exists.map(v=>v.id))
    excludes = _.uniq(excludes)
    console.log(excludes)
    await MYSQL.E(enterprise_id,'employee').insert(excludes.map(v=>({id:v})))

    return `UPDATED ${users.length} ${exists.length} ${excludes.length} RECORDS`
  }
}



module.exports = o