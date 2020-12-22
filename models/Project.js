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
o.enterprise = true

o.initdb = async (ent_schema, forced) => {
  //forced = true
  await MYSQL.initdb(_T, t => {
    t.uuid('id').index().primary() // uuid
    t.string('name', 64)
    t.string('shortname',16)
    t.string('avatar',256)
    t.integer('state').defaultTo(0)
    t.uuid('created_by')
    t.datetime('created_at')
  }, forced, ent_schema)

  await MYSQL.initdb(_TR, t => {
    t.increments('id').index().primary() // uuid
    t.bigInteger('employee_id').notNull()
    t.uuid('project_id').notNull()
    t.bigInteger('position_id').notNull()
  }, forced, ent_schema)

}

// o.init = async ()=>{
//   o.initdb('ENT_NBGZ',true)
// }



o.list = async () => {
  let items = await MYSQL(_T).select('id', 'title', 'created_by', 'created_at')
  return items
}

o.post = async (item, op) => {
  let createInfo = {
    created_at: UTIL.getTimeStamp(),
    created_by: op
  }
  let id = await MYSQL(_T).insert(item).returning('id')
  createInfo.id = id
  return createInfo
}

o.patch = async (id, item, op) => {
  await MYSQL(_T).update(item).where({
    id
  })
}

o.deleteObjects = async (id_list, op) => {
  await MYSQL(_T).whereIn("id", id_list).del()
}

o.get = async id => {
  let item = await MYSQL(_T).first().where({
    id
  })
  return item
}


module.exports = o












module.exports = o