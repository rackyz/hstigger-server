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

const DB = {}
DB.bidorder = MYSQL.Create('cocrecord',t=>{
  t.uuid('id').index().primary() // uuid
  t.string('code', 16)
  t.string('name', 64)
  t.string('project_id',43)
  t.datetime('date')
  t.text('files')
  t.uuid('created_by')
  t.datetime('created_at')
})



o.initdb_e = async (ent_id, forced) => {
  await MYSQL.Migrate(DB,forced, ent_id)
  
 

}



o.query = async (state, condition, ent_id) => {
  const Q = DB.bidorder.Query(ent_id)
  let items = await Q
  return items
}

o.add = async (state, item, ent_id) => {
  const Q = DB.bidorder.Query(ent_id)
  let createInfo = {
    id: UTIL.createUUID(),
    created_at: UTIL.getTimeStamp(),
    created_by: state.id
  }
  Object.assign(item, createInfo)
  await Q.insert(item)
  return createInfo
}

o.patch = async (ctx, id, item, ent_id) => {
  const Q = DB.bidorder.Query(ent_id)
  await Q.update(item).where({
    id
  })
}

o.del = async (ctx, id_list, ent_id) => {
  const Q = DB.bidorder.Query(ent_id)
  await Q.whereIn("id", id_list).del()
}

o.get = async (ctx, id, ent_id) => {
  const Q = DB.bidorder.Query(ent_id)
  let item = Q.first().where({
    id
  })
  return item
}


module.exports = o
