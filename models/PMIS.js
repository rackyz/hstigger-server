// Gaozhuan platform Data Exchange Model

const GZSQL = require('../base/nbgz_db')
const MYSQL = require('../base/mysql')
const util = require('../base/util')
const Account = require('./Account')
const Rss = require('./Rss')
let out = {}
const TABLE_DATASOURCE = 'datasource'
const TABLE_ACCOUNT_DATASOURCE = 'account_datasource'
out.require = ['Account','Enterprise']



const RSS_KEY = "projectintro"
const RSS_KEY2 = "projectevent"
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

   await Rss.create({
     id: RSS_KEY,
     name: "项目展示",
     source_type: 2,
     link: '/core/projects',
     subject_type: 2,
     media_type: 1
   })

   await Rss.create({
     id: RSS_KEY2,
     name: "项目大事",
     source_type: 2,
     link: '/core/projects',
     subject_type: 2,
     media_type: 2
   })
  
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

out.rss = async (ent_id) => {
  let items = await GZSQL.withSchema('gzadmin').from('contract').select('id', 'name', 'images').whereNotNull('images').orderBy('inputTime', 'desc').limit(10)
  return items.map(v => ({
    id: v.id,
    title: v.name,
    image: v.images ? (JSON.parse(v.images)[0]) : 'https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/timg.jpg',
    link: "/core/projects/" + v.id
  }))
}

const moment = require('moment')
out.rss2 = async (ent_id) => {
  let items = await GZSQL.withSchema('zzlatm').from('project_important_thing').select('projectName as name', 'title', 'inputDate as date').orderBy('inputDate', 'desc').limit(10)
  return items.map(v => ({
    id: v.id,
    title: `[${v.name}] ${v.title}`,
    date: moment(v.date, 'YYYY-MM-DD').format('YYYY-MM-DD'),
    link: "/core/projects/" + v.id
  }))
}
Rss.register(RSS_KEY, out.rss)
Rss.register(RSS_KEY2,out.rss2)

module.exports = out