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
  desc:"..."
}

const JBKT = {
  id:UTIL.createUUID(),
  name:"江北慈城开发投资有限公司",
  shortname:"江北开投",
  avatar:"https://file-1301671707.cos.ap-chengdu.myqcloud.com/jbkt.png",
  desc:"..."
}

o.initdb = async (forced) => {

  await MYSQL.initdb(T_ENTERPRISE,t=>{
    t.string('id',64).index();
    t.string('name',64);
    t.string('shortname',16);
    t.string('avatar',128);
    t.string('desc',1024);
  },forced)

  if(forced){
    await MYSQL(T_ENTERPRISE).del()
    await MYSQL(T_ENTERPRISE).insert([NBGZ,JBKT])
  }
}

o.initdata = {NBGZ,JBKT}

o.getEnterpriseList = async ()=>{
  let items = await MYSQL(T_ENTERPRISE).select('id','name','shortname','avatar')
  return items
}

module.exports = o
