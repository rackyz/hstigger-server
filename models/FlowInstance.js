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
o.Create = async (ent_id,flow,action,data,op)=>{
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
    action:action,
    key:flow.action.from,
    created_by:op,
    created_at:UTIL.getTimeStamp()
  }

  Object,keys(data).map(key=>{
    return {

    }
  })
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

o.Patch = async (ent_id,flow_id,history_id,actions,data,op)=>{
  if(!actions || actions.length == 0)
    throw "ACTION UNEXPECTED"

  if(history_id == undefined)
    throw "UNEXPECTED HISTORY"
  // modify last history node
  let lastnode = await MYSQLE(ent_id,T_NODE).first('state','key').where({id:history_id,flow_id})

  let mainAction = actions[0]
  
  // save data
  if(typeof data == 'object'){
    let data_params = Object.keys(data).map(key=>(
      {history_id,def_key:key,flow_id,value:JSON.stringfy(data[key])}
    ))
    await MYSQLE(ent_id,T_DATA).insert(data_params)
  }

  // get executors
  let data_exe = await MYSQLE(ent_id,T_DATA).first('value').where({flow_id,def_key:'executors'})
  let executors = JSON.parse(data_exe.value)
  if(!executors)
    throw "UNEXPECTED EXECUTORS"
  
  // get node optional and change state
  let nodeOptions = await MYSQL('flow_option').select('value','key').where({flow_id,type:1,item_key:lastnode.key}).whereIn(key,['optional','in_type'])
  nodeOptions.forEach(v=>{
    lastnode[v.key] = JSON.parse(v.value)
  })

  let state = makeAction(lastnode.state,mainAction)
  if(state == 10)
      throw "NODE STATE UNEXPECTED"
  let history_node = {state,end_at:UTIL.getTimeStamp(),op}
  await MYSQLE(ent_id,T_NODE).update(history_node).where({id:history_id,flow_id})

  // retrying
  if(lastnode.state == 5)
    actions = [mainAction]

  if(lastnode.optional)
    return [history_node]
  let actionObjects = await MYSQL('flow_action').select('key','to','from','type').where({flow_id}).whereIn('key',actions)

  let nodes_param = []
  actionObjects.forEach(a=>{
    let executor = executors[a.to]
    if(!Array.isArray(executor))
      executor = [executor]
    if(node.in_type == 1){
        let nodes = executor.map(e=>{
          return {
            key:lastnode.key,
            from:history_id,
            to:a.to,
            action:a.key,
            state:a.type == 2?5:1,
            executors:JSON.stringify([v])
          }
        })
        nodes_param = nodes_param.concat(nodes)
    }else{
        nodes_param.push({
          key:lastnode.key,
          from:history_id,
          to:a.to,
          action:a.key,
          state:a.type == 2?5:1,
          executors:JSON.stringify([v])
        })
    }
  })

  await MYSQLE(ent_id,T_NODE).insert(nodes_param)

  
  //let node_raltions = 
  //await MYSQLE(ent_id,T_NODE).insert(nodeParam)
}

o.Recall = async (action_key)=>{

}

o.Delete = async (instId)=>{
  
}

module.exports = o