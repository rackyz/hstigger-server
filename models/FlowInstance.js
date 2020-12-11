const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Account = require('./Account')
const Ding = require('./Ding')
const {
  UserLogger
} = require('../base/logger')
const REDIS = require('../base/redis')
const {
  ContextParser
} = require('../base/util')

let o = {
  required: ['Type']
}

const T_INST = 'flow_instance'
const T_NODE = 'flow_history_node'
const T_DATA = 'flow_data'

o.enterprise = true

o.initdb = async (ent_schema, forced) => {
  await MYSQL.initdb(T_INST, t => {
    t.uuid('id').index().primary()
    t.uuid('flow_id')
    t.string('desc',64)
    t.uuid('created_by')
    t.datetime('created_at')
    t.integer('state')
    t.integer('thread')
  }, forced, ent_schema)


  await MYSQL.initdb(T_NODE, t => {
    t.increments('id').index()
    t.string('key',32)
    t.integer('state')
    t.string('from')
    t.string('to')
    t.uuid('created_by')
    t.datetime('created_at')
  }, forced, ent_schema)

  await MYSQL.initdb(T_DATA, t => {
    t.increments('id').index()
    t.string('def_key')
    t.string('def_type')
    t.bigInteger('history_node_id')
    t.integer('version').defaultTo(0)
    t.text('value')
  }, forced, ent_schema)
}


o.Create = async (data)=>{
  
  let createInfo = {
    id:data.id || UTIL.createUUID(),
    created_at:UTIL.getTimeStamp()
  }
  Object.assign(data,createInfo)
  await MYSQL(T_INST).insert(data)
  o.PushNode(data.id,node)

  return createInfo
}

o.Patch = async (action_key,data)=>{
  // modify last 
}

o.Recall = async (action_key)=>{

}

o.Delete = async (instId)=>{
  
}

module.exports = o