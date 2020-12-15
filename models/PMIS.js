// Gaozhuan platform Data Exchange Model

const GZSQL = require('../base/nbgz_db')
const MYSQL = require('../base/mysql')
const util = require('../base/util')
const Account = require('./Account')
let out = {}
const TABLE_DATASOURCE = 'datasource'
const TABLE_ACCOUNT_DATASOURCE = 'account_datasource'
out.require = ['Account','Enterprise']

out.initdb = async (forced)=>{
  
  await MYSQL.initdb(TABLE_DATASOURCE,t=>{
    t.string('id',32).index()
    t.string('name',64)
    t.string('desc',256)
  },forced)

  await MYSQL.initdb(TABLE_ACCOUNT_DATASOURCE,t=>{
    t.increments('id').index()
    t.string('user_id',64)
    t.string('datasource_id',64)
    t.string('datasource_user_id',64)
  },forced)
  // user->user
  // password->md5(password)
  // phone->phone
  // 
  if(forced){
    let res = await out.GetAccounts()
    let res2 = await out.GetWeappAvatar()
    res.forEach(v=>{
      let r = res2.find(s=>s.tel == v.phone)
      if(r)
        v.avatar = r.avatar
    })
    await Account.removeAll({frame:1})
    let createInfo = await Account.createAccounts(res.map(v=>({user:v.user,zzl_id:v.user,
    password:util.encodeMD5(v.password),phone:v.phone,name:v.name,avatar:v.avatar})),'ROOT')
    let enterprise_relations = createInfo.map(v=>({
      user_id:v.id,
      enterprise_id: 'NBGZ'
    }))
    await MYSQL('account_enterprise').insert(enterprise_relations)

  }
  
}

out.GetAccounts = async ()=>{
  
  let res = await GZSQL.withSchema('zzlatm').select('user','password','phone','uid','name').from('aclusr').where('allowed','yes')
  return res
}

out.GetWeappAvatar = async ()=>{
  let res = await GZSQL.withSchema('zzlatm').select('avatar','tel').from('weapp_user').whereNotNull('tel')
  return res
}


out.GetUserProject = async (username)=>{
  if(!username)
      return []
  let res =await GZSQL.withSchema('gzadmin').select().from('contract').where('charger','like',`%${username}%`).where('state','<=',2).limit(5)
  return res
}




module.exports = out