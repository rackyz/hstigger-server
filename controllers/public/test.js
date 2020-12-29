// const docx2html = require('../../libs/docx2html')
// console.log(docx2html)
// let out = {}

// out.List = async ()=>{
//   let result = await docx2html("./test.docx")

//   return result
// }

// module.exports = out


const Ding  = require('../../models/Ding')
const out = {}
const REDIS = require("../../base/redis")
const MYSQL = require('../../base/mysql')
const GZSQL = require('../../base/nbgz_db')
const UTIL = require('../../base/util')
const {Account,Enterprise} = require('../../models')
out.List = async ()=>{
  // let dd_users = await GetDDUsers()
  // let old_users = await MYSQL('account')
  // let pmis_users = await GZSQL('zzlatm.aclusr').select('uid', 'user', 'name', 'phone').where('allowed', 'yes')
  // //await CompareAccount(dd_users, old_users, pmis_users)
  // await CheckDuplicated(old_users)

  await CompareNameWithAppraise()
}

const CompareNameWithAppraise = async ()=>{
  let users = await MYSQL('account').select('id','name','phone')
  let instances = await MYSQL.E("NBGZ", "flow_instance").select('desc', 'created_by')
  users.forEach(u=>{
    let instance = instances.find(v=>v.created_by == u.id)
   
    if(!instance)
      console.log(u.name,"NOT CREATE")
    else{
      
      if(instance.desc && instance.desc.includes(u.name)){
        
      }else{
         console.log(u.name,instance.desc)
      }
    }
   
  })
}

// 绑定dingid账号
const FixEmptyDingId = async()=>{
  let users = await MYSQL('account').select('id','name','phone').whereNull('ding_id')
  let insertData = []
  for(let i=0;i<users.length;i++){
    let user = users[i]
    console.log(user.name,user.phone)
    let ding_id = await Ding.getUserIdFromPhone(user.phone)
    console.log(ding_id)
    if(ding_id){
      await MYSQL('account').update({ding_id}).where({id:user.id})
    }
  }
 
}

const AddDingAccountEnterprise = async ()=>{
  let users = await MYSQL('account').select('id').where('zzl_id',"").orWhereNull('zzl_id')
  for(let i=0;i<users.length;i++){
    let exist = await MYSQL('account_enterprise').first('id').where('user_id',users[i].id) 
    if(!exist)
      await MYSQL('account_enterprise').insert({user_id:users[i].id,enterprise_id:'NBGZ'})
  }
}

const DeleteAccountEnterpriseExist = async (users)=>{
  let exist = {}
  let removed = []
  let relations = await MYSQL('account_enterprise')
  relations.forEach(v=>{
    if(exist[v.user_id+v.enterprise_id])
      removed.push(v.id)
    else
      exist[v.user_id + v.enterprise_id] = true
    
    let user = users.find(u=>u.id == v.user_id)
    if(!user){
      console.log('用户不存在:',v.user_id)
      removed.push(v.id)
    }
  })
  console.log(removed)
  // await MYSQL('account_enterprise').whereIn('id',removed).del()
}


const DeleteUnExistRelations = async ()=>{
  let idlist = await MYSQL('account_enterprise').select('account_enterprise.id').leftOuterJoin('account', 'user_id', 'account.id').whereNull('account.id')
  await MYSQL('account_enterprise').whereIn('id',idlist).del()

}

const CompareAccount = async (dd_users, old_users, pmis_users) => {
  let uu = {}
  for (let i = 0; i < dd_users.length; i++) {
    let isPhone = false
    let isName = false
    let du = dd_users[i]
    if (uu[du.name])
      continue
    uu[du.name] = true
    let ou = old_users.find(v => v.name == du.name || v.phone == du.mobile)

    if (ou) {
      if (du.name != ou.name)
        isName = true
      if (du.mobile != ou.phone)
        isPhone = true
    }
    
    if (isPhone || isName) {
      console.log("企业-DD:", ou ? ou.name : '', ou ? ou.phone : '',  '->', du.name, du.mobile)
    }
  }
}

const CheckDuplicated = async (old_users)=>{
  // 查重
  let existed = {}
  old_users.forEach(v=>{
    if (existed[v.phone])
      existed[v.phone].push(v.name)
    else
      existed[v.phone] = [v.name]
  })
  console.log('电话重复:', Object.values(existed).filter(v => v.length > 1))
  Object.keys(existed).filter(v => existed[v].length > 1).forEach(v => {
     let us = users.find(u => u.mobile == v)
    if (us)
      console.log(v, us.name)
    else
      console.log(v, "not DIngDINg")
  })

   old_users.forEach(v => {
     if (existed[v.name])
       existed[v.name].push(v.id)
     else
       existed[v.name] = [v.id]
   })
   console.log('姓名重复:', Object.values(existed).filter(v => v.length > 1))

  existed = {}
  old_users.forEach(v => {
    if (existed[v.name])
      existed[v.name].push(v)
    else
      existed[v.name] = [v]
  })

  // let toDel = []
  // Object.values(existed).filter(v => v.length > 1).forEach(u => {
  //   if(!Array.isArray(u))
  //     return
  //   let isPM = false
  //   let isDing = false
  //   for(let i=0;i<u.length;i++){
  //     let user = u[i]
  //      console.log(i, user.name)
  //     if(isPM)
  //     {
  //       toDel.push(user.id)
  //       console.log(user.id,user.lastlogin_at)
  //       continue
  //     }
  //     if(u[i].zzl_id)
  //       isPM = true
  //   }
  // })
}


const GetDDUsers = async (forced)=>{
  let users = []
  let u = await REDIS.ASC_GET_JSON('cached_users')
  console.log(u.length)
  if(u &&Array.isArray(u) && !forced)
    users = u
  else{
     let groups = await Ding.getGroups()
     for (let i = 0; i < groups.length; i++) {
       let group_users = await Ding.getEmployeeInfoList(groups[i].id)
       group_users.forEach(v => {
         v.group_id = groups[i].id
       })
       users = users.concat(group_users)

     }
       REDIS.SET('cached_users', JSON.stringify(users))
       REDIS.EXPIRE('cached_users',3600)
  }

  return users
}

module.exports = out


// let users = []
// let updated = []
// let existPhone = []
// let existName = []
// let notExist = []
// let zzl = []
// let u = await REDIS.ASC_GET_JSON('cached_users')
// console.log(u.length)
// if(u &&Array.isArray(u))
//   users = u
// else{
//    let groups = await Ding.getGroups()



//    for (let i = 0; i < groups.length; i++) {
//      let group_users = await Ding.getEmployeeInfoList(groups[i].id)
//      group_users.forEach(v => {
//        v.group_id = groups[i].id
//      })
//      users = users.concat(group_users)

//    }
//      REDIS.SET('cached_users', JSON.stringify(users))
// }

// await MYSQL('account').update({
//   zzl_id:"",
//   ding_id:""
// })


// let old_users = await MYSQL('account')
// console.log('OLD:',old_users.length)
// let existed = {}
// let pmis_users = await GZSQL('zzlatm.aclusr').select('uid','user', 'name','phone').where('allowed', 'yes')
// let count =0
// for(let i=0;i<old_users.length;i++){
//   let u = old_users[i]

//   let pmu = pmis_users.find(v=>v.user == u.user)
//   if(!pmu){
//     console.log(u.name,u.user,u.user,'not in pm')
//     continue
//   }
//   let object = 
//   {
//     zzl_id:pmu.uid,
//      name: pmu.name,
//      phone:pmu.phone
//   }

//   if(!u.zzl_id || u.name != pmu.name || u.phone != pmu.phone){
//     await MYSQL('account').update(object).where({id:u.id})
//     console.log(`${u.name}=>${pmu.name}`,object.zzl_id)
//     count++
//   }
// }
// console.log('updated:',count)

//DINGDINg 去重



// for(let i=0;i<old_users.length;i++){
//   let u = old_users[i]
//   let pmu = pmis_users.find(v=>v.user == u.user)
//   if(!pmu){
//     console.log(u.name,'not in pm')
//     continue
//   }
//   let object = 
//   {
//     zzl_id:pmu.uid,
//     name:pmu.name,
//     phone:pmu.phone
//   }

//   if(u.name != pmu.name || u.phone != pmu.phone){
//     await MYSQL('account').update(object).where({id:u.id})
//     console.log(`${u.name}=>${pmu.name}`)
//   }
// }

// // let pmis_users = await GZSQL('zzlatm.aclusr').select('user','name').where('allowed','yes')
// 

// let fixed = 0
// for(let i=0;i<users.length;i++){
//   let obj = {}

//   let index = old_users.findIndex(v => v.phone && v.phone == users[i].mobile)
//   if(index != -1){
//     obj.id = old_users[index].id
//     existPhone.push(users[i].name)
//     obj.ding_id = users[i].userid
//     obj.ding_open_id = users[i].openId
//     obj.name = users[i].name
//     let res = await Account.UpdateFromDing(obj, users[i].department)
//     if(res != -1)
//       fixed++
//     continue
//   }

//   index = old_users.findIndex(v =>v.name && v.name == users[i].name)
//   if (index != -1) {
//     obj.id = old_users[index].id
//     existName.push(users[i].name)
//     obj.phone = users[i].mobile
//     obj.ding_id = users[i].userid
//     obj.ding_open_id = users[i].openId
//     obj.name = users[i].name
//      let res = await Account.UpdateFromDing(obj, users[i].department)
//      if (res != -1)
//        fixed++
//     continue
//   }

//   obj.id = UTIL.createUUID()
//   obj.name = users[i].name
//   obj.phone = users[i].mobile
//   obj.ding_id = users[i].userid
//   obj.ding_open_id = users[i].openId
//    notExist.push(users[i].name)
//    let res = await Account.UpdateFromDing(obj, users[i].department)
//    if (res != -1)
//      fixed++
// } 

// 给已有的zzl_id添加digding





// console.log(toDel)