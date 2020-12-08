// Gaozhuan platform Data Exchange Model

const GZSQL = require('../base/nbgz_db')
const MYSQL = require('../base/mysql')
const util = require('../base/util')
const Account = require('./Account')
let out = {}
const TABLE_DATASOURCE = 'datasource'
const TABLE_ACCOUNT_DATASOURCE = 'account_datasource'
out.require = ['Account']

out.initdb = async (forced)=>{
  forced = true
  

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
    await Account.removeAll({frame:1})
    let createInfo = await Account.createAccounts(res.map(v=>({user:v.user,
    password:util.encodeMD5(v.password),phone:v.phone})),'ROOT')
    let enterprise_relations = createInfo.map(v=>({
      user_id:v.id,
      enterprise_id:'7415ec90-3838-11eb-ad7b-a928b6bb0d6a'
    }))

  }
  
}

out.GetAccounts = async ()=>{
  
  let res = await GZSQL.withSchema('zzlatm').select('user','password','phone','uid').from('aclusr').where('allowed','yes')
  return res
}





module.exports = out