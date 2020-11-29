const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const { UserLogger } = require('../base/logger')
const { update } = require('./account')
const o = {
  required:['Type','Message']
}

const ENTERPRISE_STATES = [{
  key: 'ENT_INACTIVE',
  name: "未激活",
  color:"#aaa"
}, {
  key: 'ENT_ACTIVE',
  name: "正常",
  color:"green"
}, {
  key: 'ENT_LOCKED',
  name: "锁定",
  color:"darkred"
}
]

const T_ENTERPRISE = "enterprise"


o.initdb = async (forced) => {
  let EnterpriseStateType = await Type.AddType('EntStateType',ENTERPRISE_STATES)
 
  const NBGZ = {
    id:UTIL.createUUID(),
    name:"宁波高专建设监理有限公司",
    shortname:"宁波高专",
    avatar:"https://file-1301671707.cos.ap-chengdu.myqcloud.com/nbgz.png",
    desc: "...",
    state:EnterpriseStateType.ENT_ACTIVE,
    created_at: UTIL.getTimeStamp() 
  }
  
  const JBKT = {
    id:UTIL.createUUID(),
    name:"江北慈城开发投资有限公司",
    shortname:"江北开投",
    avatar:"https://file-1301671707.cos.ap-chengdu.myqcloud.com/jbkt.png",
    desc:"...",
    state:EnterpriseStateType.ENT_ACTIVE,
    created_at:UTIL.getTimeStamp()
  }
  
  o.initdata = {NBGZ,JBKT}

  await MYSQL.initdb(T_ENTERPRISE,t=>{
    t.string('id',64).index();
    t.string('name',64);
    t.string('shortname',16);
    t.string('avatar',128);
    t.string('owner_id',64);
    t.integer('state').defaultTo(0)
    t.datetime('created_at');
    t.text('desc');

  },forced)

  await MYSQL.seeds(T_ENTERPRISE,[NBGZ,JBKT],forced)
  
  // if(forced)
  //   o.__removeEnterpriseDB()
  //await o.createScheme(NBGZ.id)
}

o.patchEnterPrise = async (id,data,op)=>{
  let {name,shortname,avatar,owner_id} = data
  let updateParam = {}
  if(name)
    updateParam.name = name
  if(shortname)
    updateParam.shortname = shortname
  if(avatar)
    updateParam.avatar = avatar
  if(owner_id)
    updateParam.owner_id = owner_id
  await MYSQL(T_ENTERPRISE).update(updateParam).where({id})
}

o.getEnterpriseListFull = async ()=>{
   let items = await MYSQL(T_ENTERPRISE).select('id', 'name', 'shortname', 'avatar','owner_id','state','created_at')

   items.forEach(v=>{
     v.memberCount = 0
     v.database = o.getEnterpriseSchemeName(v.id),
     v.storageCount = 1023315
     v.moduleCount = 4
   })
   return items
}


o.getEnterpriseList = async ()=>{
  let items = await MYSQL(T_ENTERPRISE).select('id','name','shortname','avatar')
  return items
}

o.getEnterpriseSchemeName = ent_id=>{
  return 'ENT_' + ent_id.replace(/(\-)/g, '_')
}

o.createEnterprise = async (data,op)=>{
  let {name,avatar,shortname} = data

  if(name == undefined || name == "")
    throw EXCEPTION.E_INVALID_DATA

  let createInfo = {
    id:UTIL.createUUID(),
    created_at:UTIL.getTimeStamp(),
    owner_id:op
  }
  let item = {
    name,
    avatar,
    shortname,
    ...createInfo
  }

  await MYSQL(T_ENTERPRISE).insert(item)
  UserLogger.info(`${op}创建了企业${name}`)
  return createInfo
}

o.deleteEnterprises = async (id_list,op)=>{
  
  await MYSQL(T_ENTERPRISE).whereIn("id",id_list).delete()
  UserLogger.info(`${op}删除了企业${id_list.join(',')}`)
}

o.createScheme = async (ent_id) => {
  let ent_db_name = o.getEnterpriseSchemeName (ent_id)
  let res = await MYSQL.raw(`SELECT * FROM information_schema.SCHEMATA where SCHEMA_NAME='${ent_db_name}'`)
  if(Array.isArray(res) && res[0]){
    await MYSQL.raw(`DROP DATABASE IF EXISTS ${ent_db_name}`)
  }
  await MYSQL.raw(`CREATE DATABASE ${ent_db_name}`)
  UserLogger.info(`创建企业数据库${ent_id}完成`)
}

o.removeScheme = async (ent_id)=>{
  let ent_db_name = o.getEnterpriseSchemeName (ent_id)
  await MYSQL.raw(`DROP DATABASE IF EXISTS ${ent_db_name}`)
  serLogger.info(`删除企业数据库${ent_id}完成`)
}

/** DANGER */
o.__removeEnterpriseDB = async (ent)=>{
 let res = await MYSQL.raw(`SELECT * FROM information_schema.SCHEMATA where SCHEMA_NAME like 'ENT_%';`)
 if(Array.isArray(res)){
  for(let i=0;i<res[0].length;i++){
   
    let SCHEMA_NAME = res[0][i].SCHEMA_NAME
    console.log("DROP DB:", SCHEMA_NAME)
    if(SCHEMA_NAME.indexOf('ENT_') === 0)
     { await MYSQL.raw(`DROP DATABASE IF EXISTS ${SCHEMA_NAME}`)
      
    }
  }
}
}

module.exports = o
