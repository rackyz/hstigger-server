const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const o = {
  required:['Type']
}

const T_ENTERPRISE = "enterprise"
const NBGZ = {
  id:UTIL.createUUID(),
  name:"宁波高专建设监理有限公司",
  shortname:"宁波高专",
  avatar:"https://file-1301671707.cos.ap-chengdu.myqcloud.com/nbgz.png",
  desc: "...",
  created_at: UTIL.getTimeStamp()
}

const JBKT = {
  id:UTIL.createUUID(),
  name:"江北慈城开发投资有限公司",
  shortname:"江北开投",
  avatar:"https://file-1301671707.cos.ap-chengdu.myqcloud.com/jbkt.png",
  desc:"...",
  created_at:UTIL.getTimeStamp()
}

o.initdata = {NBGZ,JBKT}
o.initdb = async (forced) => {

  await MYSQL.initdb(T_ENTERPRISE,t=>{
    t.string('id',64).index();
    t.string('name',64);
    t.string('shortname',16);
    t.string('avatar',128);
    t.string('owner_id',64);
    t.datetime('created_at');
    t.text('desc');

  },forced)

  await MYSQL.seeds(T_ENTERPRISE,[NBGZ,JBKT],forced)
  await o.createScheme(NBGZ.id)
}

o.getEnterpriseListFull = async ()=>{
   let items = await MYSQL(T_ENTERPRISE).select('id', 'name', 'shortname', 'avatar','owner_id','created_at')
   return items
}


o.getEnterpriseList = async ()=>{
  let items = await MYSQL(T_ENTERPRISE).select('id','name','shortname','avatar')
  return items
}

o.getEnterpriseSchemeName = ent_id=>{
  return 'ENT_' + ent_id.replace(/(\-)/g, '_')
}

o.createScheme = async (ent_id) => {
  let ent_db_name = o.getEnterpriseSchemeName (ent_id)
  console.log(ent_db_name)
  let res = await MYSQL.raw(`SELECT * FROM information_schema.SCHEMATA where SCHEMA_NAME='${ent_db_name}'`)
  if(Array.isArray(res) && res[0]){
    await MYSQL.raw(`DROP DATABASE IF EXISTS ${ent_db_name}`)
  }
  await MYSQL.raw(`CREATE DATABASE ${ent_db_name}`)
}

module.exports = o
