const MYSQL = require('../../base/mysql')
const _ = require('lodash')
const UTIL = require('../../base/util')
const Exception = require('../../base/exception')
const Ding = require('../../models/Ding.js')
const REDIS = require('../../base/redis')
const {
  Oa,
  Tool
} = require('../../models')
let o = {}

const GZSQL = require('../../base/nbgz_db')
const mysql_oa = GZSQL
const OASQL = GZSQL.withSchema('gzadmin')
const GetDDUsers = async (forced) => {
  let users = []
  try{
  let u = await REDIS.ASC_GET_JSON('cached_users')
  if (u && Array.isArray(u) && u.length > 0 && !forced)
    users = u
  else {
    let groups = await Ding.getGroups(true)
    if(Array.isArray(groups)){
      for (let i = 0; i < groups.length; i++) {
        let group_users = await Ding.getEmployeeInfoList(groups[i].id)
        group_users.forEach(v => {
          v.group_id = groups[i].id
        })
        users = users.concat(group_users)

      }
    }
    users = _.uniqBy(users,e=>e.openId)
    REDIS.SET('cached_users', JSON.stringify(users))
    REDIS.EXPIRE('cached_users', 3600)
  }
  }catch(e){
    console.log("ERROR:",e) 
  }

  return users
}

o.PostAction = async ctx=>{
  let a = ctx.params.action
  let state= ctx.state
  let data = await Tool.invoke(state,a)
  if(data)
    return data
}



module.exports = o