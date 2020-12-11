const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Account = require('./Account')
const Ding = require('./Ding')
const {
  UserLogger
} = require('../base/logger')


let o = {
  required: ['Type']
}

const T_INST = 'flow_instance'
const T_NODE = 'flow_history_node'
const T_DATA = 'flow_data'
const T_USER_NODE = 'user_flow_history_node'

o.enterprise = true

o.initdb = async (ent_schema, forced) => {
  forced = true
  await MYSQL.initdb(T_INST, t => {
    t.uuid('id').index().primary()  // uuid
    t.uuid('flow_id')               // flow-define
    t.string('desc',64)
    t.uuid('created_by')
    t.datetime('created_at')
    t.integer('state').defaultTo(0)
    t.integer('thread').defaultTo(0)
  }, forced, ent_schema)


  await MYSQL.initdb(T_NODE, t => {
    t.increments('id').index()
    t.uuid('flow_id')
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
    t.uuid('flow_id')
    t.string('def_type')
    t.bigInteger('history_node_id')
    t.integer('version').defaultTo(0)
    t.text('value')
  }, forced, ent_schema)

  await MYSQL.initdb(T_USER_NODE,t=>{
    t.increments('id').index().primary()
    t.uuid('user_id')
    t.bigInteger('history_node_id')
  },forced,ent_schema)
}

o.init = async ()=>{
  o.initdb('ENT_NBGZ',true)
  o.inited = true
}

const MYSQLE = (ent_id,t)=>MYSQL(t).withSchema('ENT_'+ent_id)

//STATE 0-active 1-submit 2-reject 3-retry
// create the instance
o.Create = async (ent_id,flow,op)=>{
  let param = {
    state:1,
    id:flow.id || UTIL.createUUID(),
    created_by:op,
    flow_id:flow.flow_id,
    desc:flow.desc,
    created_at:UTIL.getTimeStamp()
  }
  await MYSQLE(ent_id,T_INST).insert(param)

  // add first node
  let node = {
    flow_id:param.id,
    // -> prototype node
    state:0,
    key:flow.action.from,
    created_by:op,
    created_at:UTIL.getTimeStamp()
  }
  let node_id = await MYSQL(ent_id,T_NODE).insert(node).returning('id')
  param.history_id = node_id
  await MYSQL(ent_id,T_USER_NODE).insert({user_id:op,history_node_id:node_id})
  UserLogger.info(`${op}创建了流程实例${flow.desc}`)
  return param
}

o.GetFlowInstance = async (ent_id,instId)=>{
  let flowInstance = await MYSQLE(ent_id,T_INST).where({id:instId})
  flowInstance.history = await MYSQLE(ent_id,T_NODE).where({})
}

// get all executors
o.GetInstExecutors = async (ent_id,inst_id)=>{
  let res = await MYSQLE(ent_id,T_USER_NODE).select('user_id').where({inst_id}).leftJoin(T_NODE,`${T_NODE}.id`,'history_node_id')
  return res
}

o.GetUserThread = async (ent_id,user_id)=>{
  let res = await MYSQLE(ent_id,T_NODE).where({user_id}).leftJoin(T_USER_NODE,`history_node_id`,`${T_NODE}.id`)
  return res
}

o.Patch = async (ent_id,flow_id,history_node_id,action,data,op)=>{
  // modify last history node
  await MYSQLE(ent_id,T_NODE).update({state:action.state}).where({id:history_id})
  // save data
  if(typeof data == 'object'){
    let data_params = Object.keys(data).map(key=>(
      {history_node_id,def_key:key,flow_id,value:JSON.stringfy(data[key])}
    ))
    await MYSQLE(ent_id,T_DATA).insert(data_params)
  }
  if(!Array.isArray(action.to)){
    action.to = [action.to]
  }

  // get executors
  let {value:executors} = await MYSQLE(ent_id,T_DATA).first('value').where({flow_id,def_key:'executors'})

  let node_params = action.to.map(v=>({
    flow_id,
    key:action.to,
    state:0,
    from:action.from,
    to:v,
    created_by:op,
    created_at:UTIL.getTimeStamp()
  }))

  
  //let node_raltions = 
  //await MYSQLE(ent_id,T_NODE).insert(nodeParam)
}

o.Recall = async (action_key)=>{

}

o.Delete = async (instId)=>{
  
}

module.exports = o