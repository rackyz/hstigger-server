const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Account = require('./Account')
const Dep = require('./Dep')
const Enterprise = require('./Enterprise')
const Ding = require('./Ding')
const {
  UserLogger
} = require('../base/logger')
const REDIS = require('../base/redis')
const {
  ContextParser
} = require('../base/util')

let o = {
  required: ['Type','Enterprise']
}


const T = 'employee'
const T_DEP = 'dep_employee'

o.initdb = async (ent_schema, forced) => {
  await MYSQL.initdb(T, t => {
    t.uuid('id').index()
    t.datetime('hiredDate')
    t.string('workPlace',128)
    t.string('email',64)
    t.datetime('birth')
    t.string('position',64)
  }, forced, ent_schema)

  await MYSQL.initdb(T_DEP,t=>{
    t.increments('id').index()
    t.uuid('user_id')
    t.integer('dep_id')
  }, forced, ent_schema)

  if (forced) {
    if (ent_schema == "ENT_NBGZ") {
      await MYSQL(T).withSchema(ent_schema).del()
      await MYSQL(T_DEP).withSchema(ent_schema).del()
      let groups = await Ding.getGroups()
      for (let i = 0; i < groups.length; i++){
          let users = await Ding.getEmployeeInfoList(groups[i].id)
        let accounts = users.map(v=>({
          name:v.name,
          phone:v.tel,
          avatar:v.avatar,
          ding_id:v.userid
        }))

        let department_relations = users.map(v => Array.isArray(v.department)?v.department.map(d => ({
          user_id: v.userid,
          dep_id: d
        })):[])

        let profiles = users.map(v=>({
          hiredDate:new Date(v.hiredDate),
          workPlace:v.workPlace,
          email:v.email,
          birth: v.extattr ? v.extattr["生日"]:null,
          position:v.position
        }))

        for(let i=0;i<users.length;i++){
          let account = accounts[i]
          let isExist =false
          let isExistName = false
          if (account.phone)
            isExist = await MYSQL('account').first('id').where('phone', account.phone)
          if(account.name)
            isExistName = await MYSQL('account').first('id').where('name', account.name)
          let id = null
          if(isExist){
            await MYSQL('account').update(account).where('phone',account.phone)
            id = isExist.id
          }
          else if (isExistName){
            await MYSQL('account').update(account).where('phone', account.name)
            id = isExistName.id
          }
          else{
            let updateInfo = {
              id: UTIL.createUUID(),
              created_at: UTIL.getTimeStamp(),
              password:UTIL.encodeMD5('123456')
            } 
            await MYSQL('account').insert(Object.assign(account, updateInfo))
            id = updateInfo.id
          }

          let profile = profiles[i]
          profile.id = id
          await MYSQL(T).withSchema(ent_schema).insert(profile)
          if(department_relations[i] && department_relations[i].length > 0)
            await MYSQL(T_DEP).withSchema(ent_schema).insert(department_relations[i])
        }

        UserLogger.info(`通过dingding导入了${users.length}个账号`)
      }
    }
  }

  

}

o.init = async (forced)=>{
  
}


o.List = async (state, queryCondition)=>{
  let ent_id = state.enterprise_id
  if(!ent_id)
    return []
  let user_ids = await MYSQL('account_enterprise').select('user_id').where({enterprise_id:ent_id})
  let ENT_DB = UTIL.getEnterpriseSchemeName(ent_id)
  let users = await MYSQL('account').leftJoin(`${ENT_DB}.employee`, `${ENT_DB}.employee.id`, 'account.id').select('account.id as id','user','avatar','name','frame','type','changed','lastlogin_at','created_at','phone','birth').whereIn('account.id', user_ids.map(v => v.user_id)).where({['account.type']: 1})
  let depRelations = await Dep.listRelations(ent_id)
  users.forEach(u=>{
    u.deps = depRelations.filter(v=>v.user_id == u.id).map(v=>v.dep_id)
  })

  return users

}


o.Create = async (state,data)=>{
  let {user,name,phone,email} = data
  let timeStamp = UTIL.getTimeStamp()
  let op = state.id
  let account = {user,name,phone,email,password:UTIL.encodeMD5("123456"),id:UTIL.createUUID(),created_at:timeStamp,created_by:op,type:1}
  await Account.Create(account)
  await Enterprise.addEnterprise(account.id,state.enterprise_id)
  return {
    id:account.id,
    created_at:account.created_at,
    created_by:account.created_by,
    type: 1
  }
}

o.Update = async (state,id,data)=>{
  if(!id)
    throw EXCEPTION.E_INVALID_DATA
  delete data.id
  await MYSQL.E(state.enterprise_id,"employee").update(data).where({id})
}

o.Delete = async (state,id)=>{
  await Enterprise.removeEnterprise(id,state.enterprise_id)
  await MYSQL.E(state.enterprise_id,"employee").where({id}).del()
}

module.exports = o