const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const Rss = require('./Rss')
const moment = require('moment')
const {
  UserLogger
} = require('../base/logger')

let o = {
  required: ['Type']
}


// -- PLATFORM
const _T = 'project'
const _TR = 'project_employee'
const _TC = 'project_category'

o.initdb = async (forced) => {
  await MYSQL.initdb(_T, t => {
    t.uuid('id').index().primary() // uuid
    t.string('code',16)
    t.string('name', 64)
    t.string('shortname',16)
    t.string('avatar',256)
    t.integer('state').defaultTo(0)
    t.uuid('created_by')
      t.uuid('charger')
    t.datetime('created_at')
    t.string('desc',256)
  }, forced)

  // 用工记录
  await MYSQL.initdb(_TR, t => {
    t.increments('id').index().primary() // uuid
    t.bigInteger('employee_id').notNull()
    t.uuid('project_id').notNull()
    t.bigInteger('position_id').notNull()
    t.double('factor')
    
    t.datetime('inDate')
    t.datetime('outDate')
    t.datetime('created_at')
    t.uuid('created_by')
  }, forced)

  // 项目分类
  await MYSQL.initdb(_TC, t => {
    t.increments('id').index().primary()
    t.uuid('project_id')
    t.integer('project_cat_id')
    t.string('project_cat_key')
  }, forced)

}

o.initdb_e = async (ent_schema, forced) => {
  await MYSQL.initdb(_T, t => {
    t.uuid('id').index().primary() // uuid
    t.string('code', 16)
    t.string('name', 64)
    t.string('shortname', 16)
    t.uuid('charger')
    t.string('avatar', 256)
    t.integer('state').defaultTo(0)
    t.uuid('created_by')
    t.string('desc',256)
    t.datetime('created_at')
  }, forced, ent_schema)

  // 用工记录
  await MYSQL.initdb(_TR, t => {
    t.increments('id').index().primary() // uuid
    t.bigInteger('employee_id').notNull()
    t.uuid('project_id').notNull()
    t.bigInteger('position_id').notNull()
    t.double('factor')
    t.datetime('inDate')
    t.datetime('outDate')
    t.datetime('created_at')
    t.uuid('created_by')
  }, forced, ent_schema)

  // 项目分类
  await MYSQL.initdb(_TC, t => {
    t.increments('id').index().primary()
    t.uuid('project_id')
    t.integer('project_cat_id')
    t.string('project_cat_key')
  },forced,ent_schema)

}

o.init = (ent_id,forced)=>{

}

// o.init = async ()=>{
//   o.initdb('ENT_NBGZ',true)
// }

o.GetList = async ent_id=>{
  return await o.query(null,null,ent_id)
}

o.query = async (ctx,condition,ent_id) => {
   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  let items = await Q.select('id', 'code','name', 'state','charger','avatar','created_by', 'created_at')
  return items
}

o.add = async (ctx,item, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  let createInfo = {
    id:UTIL.createUUID(),
    created_at: UTIL.getTimeStamp(),
    created_by:ctx.id,
    state:0
  }
  Object.assign(item,createInfo)
  await Q.insert(item)
  return createInfo
}

o.patch = async (ctx,id, item, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  await Q.update(item).where({
    id
  })
}

o.del = async (ctx,id_list,ent_id) => {
   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  await Q.whereIn("id", id_list).del()
}

o.get = async (ctx,id,ent_id) => {
   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  let item = Q.first().where({
    id
  })
  return item
}


module.exports = o









