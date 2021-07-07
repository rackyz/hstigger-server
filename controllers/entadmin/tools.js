const MYSQL = require('../../base/mysql')
const _ = require('lodash')
const UTIL = require('../../base/util')
const Exception = require('../../base/exception')
const Ding = require('../../models/Ding.js')
const REDIS = require('../../base/redis')
let o = {}

const GZSQL = require('../../base/nbgz_db')
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
  let enterprise_id = ctx.state.enterprise_id
  if(a == 'synchronize_employee'){
    let users = await MYSQL('account_enterprise').select('user_id as id').where({enterprise_id}).leftJoin('account','account.id','user_id').where('type',1)
    let exists = await MYSQL.E(enterprise_id,'employee').select('id')
    let excludes = _.difference(users.map(v=>v.id),exists.map(v=>v.id))
    excludes = _.uniq(excludes)
    console.log(excludes)
    await MYSQL.E(enterprise_id,'employee').insert(excludes.map(v=>({id:v})))

    return `UPDATED ${users.length} ${exists.length} ${excludes.length} RECORDS`
  }else if(a == 'sychronize_account'){
    let zzl_users = await GZSQL.withSchema('zzlatm').select().from('aclusr').where("allowed", "yes").where(t=>{
      t.where('company','like','%高专%').orWhere('company',"").orWhereNull("company")
    })
    let ding_users = await GetDDUsers()
    let users = await MYSQL('account').select('id','name','zzl_id','ding_id','user','phone')
    let ret = ""
    ret += `同步工作正在进行中... \n项目平台用户:${zzl_users.length},钉钉用户:${ding_users.length},已同步用户${ users.length}\n`

    let user_enterprises = await MYSQL('account_enterprise').select('user_id', 'enterprise_id')

    ret += `\n修复未注册企业的用户`
    let fix_enterprise = users.filter(v=>{
      
      let ue = user_enterprises.find(e => e.user_id == v.id)
      if(ue){
        return false
      }
      ret += `\n${v.name}`
      return true
    }).map(v=>({user_id:v.id,enterprise_id:"NBGZ"}))

    await MYSQL('account_enterprise').insert(fix_enterprise)

    ret += `
      zzl_user.uid -> user.zzl_id,
      zzl_user.
      zzl_user.phone -> ding_user.mobile-> user.phone
      md5(zzl_user.password) - > user.password,
      ding_user.user_id -> user.ding_id,
      ding_user.openId -> user.ding_open_id,
      ding_user.department ---> ADD_DEP_RELATIONS
    `
    let new_zzl_users = zzl_users.filter(z=>{
      if(z.name.includes('代理') || z.name.includes('测试'))
        return false
      if (!z.phone)
        return false
      let u = users.find(v=>v.zzl_id == z.uid || (v.phone != null && v.phone == z.phone))
      if(u)
        return false
      else
        return true
    })

    let ding_zzl_users = ding_users.filter(z=>{
      if(z.name.includes('詹红') || z.name.includes('张童英'))
        return false
       let u = users.find(v => v.ding_id == z.userid || (v.phone != null && v.phone != "" && v.phone == z.mobile))
       if (u)
         return false
       else
         return true
    })
    ret+= `\n平台新用户:${new_zzl_users.length} `
   

    let usermap = {}
    
    // create new zzl_account
    let departs = []
    let newAccounts = new_zzl_users.map(v => {
      let id = UTIL.createUUID()
      ret += `\n+ ${v.name}[${v.phone}] [${v.user}]`
      if (Array.isArray(v.departments))
          departs.concat(v.departments.map(d=>{
            return {
              dep_id:d,
              user_id:id
            }
          }))
    return {
      id,
      name:v.name,
      user:v.user,
      password:UTIL.encodeMD5(v.password),
      phone:v.phone,
      zzl_id:v.zzl_id
    }})

    let newEnterprise = new_zzl_users.map(v => ({
      user_id:v.id,
      enterprise_id:"NBGZ"
    }))

    let employees = newAccounts.map((v=>({
      id:v.id
    })))

    // await MYSQL('account').insert(newAccounts)
    // ret += "\n 账号已创建"
    
    // await MYSQL('account_enterprise').insert(newEnterprise)
    // ret += "\n 企业已绑定至'宁波高专'"

    // await MYSQL.E('NBGZ', 'employee').insert(employees)
    // ret += "\n 企业员工信息初始化完成"

    ret += "\n======================================================="
     ret += `\n钉钉新用户:${ding_zzl_users.length}`
    let newDingAccount = ding_zzl_users.map(v=>{
      ret += `\n+ ${v.name}[${v.mobile}]`

      return {
        id: UTIL.createUUID(),
        name: v.name,
        user: v.mobile,
        password: UTIL.encodeMD5("123456"),
        phone: v.mobile,
        ding_id: v.user_id,
        ding_open_id:v.openId
      }
    })
    
    let newDingEnterprise = newDingAccount.map(v => ({
      user_id: v.id,
      enterprise_id: "NBGZ"
    }))

    let dingEmployees = newDingAccount.map((v => ({
      id: v.id
    })))

    //  await MYSQL('account').insert(newDingAccount)
    //  ret += `\n ${newDingAccount.length} 账号已创建`

    //  await MYSQL('account_enterprise').insert(newDingEnterprise)
    //  ret += "\n 企业已绑定至'宁波高专'"

    //  await MYSQL.E('NBGZ', 'employee').insert(dingEmployees)
    //  ret += "\n 企业员工信息初始化完成"

    return ret




  }
}



module.exports = o