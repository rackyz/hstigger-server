const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Account = require('./Account')
const Ding = require('./Ding')
const {
  UserLogger
} = require('../base/logger')
const { last } = require('lodash')


let o = {
  required: ['Type']
}

const T_INST = 'flow_instance'
const T_NODE = 'flow_history_node'
const T_DATA = 'flow_data'
const T_USER_NODE = 'user_flow_history_node'

const NodeStateTypes = [{
  id: 0,
  key: "initing",
  name: "初始化",
  color: "skyblue"
}, {
  id: 1,
  key: "active",
  name: "等待处理",
  color: "#aaa"
}, {
  id: 2,
  key: "submitted",
  name: "已提交",
  color: "orange"
}, {
  id: 3,
  key: "rejected",
  name: "已拒绝",
  color: "darkred"
}, {
  id: 4,
  key: "accepted",
  name: "已接受",
  color: "yellowgreen"
}, {
  id: 5,
  key: "retrying",
  name: "修改中",
  color: "oranged"
}, {
  id: 6,
  key: "processing",
  name: "处理中",
  color: "yellow"
}, {
  id: 7,
  key: "process_ok",
  name: "处理完毕",
  color: 'yellowgreen'
}, {
  id: 8,
  key: "process_failed",
  name: "处理失败",
  color: "red"
}, {
  id: 9,
  key: "freezed",
  name: "已冻结",
  color: "skyblue"
}, {
  id: 10,
  key: "closed",
  name: "已关闭",
  color: "skyblue"
}]

const ActionTypes = [{
  id: 0,
  key: "init",
  name: "初始化",
  color: 'red'
}, {
  id: 1,
  key: "submit",
  name: "提交",
  color: "yellowgreen"
}, {
  id: 2,
  key: "reject",
  name: "拒绝",
  color: "darkred"
}, {
  id: 3,
  key: "accept",
  name: "接收",
  color: "yellowgreen"
}, {
  id: 4,
  key: "process",
  name: "处理",
  color: "orange"
}, {
  id: 5,
  key: "retry",
  name: "重试",
  color: "orange"

}, {
  id: 6,
  key: "close",
  name: "关闭(支线)"
}, {
  id: 7,
  key: "pass",
  name: "跳过"
}]


const MapKey = (types) => {
  let o = {}
  types.forEach(v => {
    o[v.key] = v.id
  })
  return o
}

const GetType = (types, id) => {
  return types.find(v => v.id == id)
}

const NODE_STATES = MapKey(NodeStateTypes)
const ACTION_TYPES = MapKey(ActionTypes)


const makeAction = function(state, action) {
 if(state == NODE_STATES.initing || state == NODE_STATES.active || state == NODE_STATES.retrying || state == NODE_STATES.rejected){
   if(action == ACTION_TYPES.submit){
     return NODE_STATES.submitted
   }else if(action == ACTION_TYPES.accept){
     return NODE_STATES.accepted
   }else if(action == ACTION_TYPES.process){
     return NODE_STATES.processing
   }else if(action == ACTION_TYPES.reject){
     return NODE_STATES.rejected
   }else{
     return NODE_STATES.error
   }
 }else if(state == NODE_STATES.submitted){
   if(action == ACTION_TYPES.reject){
     return NODE_STATES.rejected
   }
 }
 
 if(action == ACTION_TYPES.close){
   return NODE_STATES.closed
 }else if(action == ACTION_TYPES.freeze){
   return NODE_STATES.freezed
 }

 return NODE_STATES.error
}



o.enterprise = true

o.initdb = async (ent_schema, forced) => {
  //forced = true
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
    t.string('action',32)
    t.string('from')
    t.string('to')
    t.uuid('op')
    t.text('executors')
    t.datetime('start_at')
    t.datetime('end_at')
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

  // await MYSQL.initdb(T_THREAD,t=>{
  //   t.increments('id').index().primary()
  //   t.
  // })

  await MYSQL.initdb(T_USER_NODE,t=>{
    t.increments('id').index().primary()
    t.uuid('user_id')
    t.bigInteger('history_node_id')
  },forced,ent_schema)
}

// o.init = async ()=>{
//   o.initdb('ENT_NBGZ',true)
//   o.inited = true
// }

const MYSQLE = (ent_id,t)=>MYSQL(t).withSchema('ENT_'+ent_id)

//STATE 0-active 1-submit 2-reject 3-retry
// create the instance
o.Create = async (ent_id,{flow},op)=>{
  let flow_id = flow.flow_id
  if(!flow_id)
    return 
  let inst_id = flow.id || UTIL.createUUID()
  let param = {
    state:0,
    id:inst_id,
    created_by:op,
    flow_id:flow.flow_id,
    desc:flow.desc,
    created_at:UTIL.getTimeStamp(),
    thread:1
  }
  
  await MYSQLE(ent_id,T_INST).insert(param)
  let StartNode = await MYSQL('flow_node').first('key').where({flow_id})
  if(!StartNode)
    throw 'FLOW undefined.'+flow_id
  // add first node
  let node = {
    flow_id:inst_id,
    // -> prototype node
    state:0,
    key:StartNode.key,
    op,
    start_at:UTIL.getTimeStamp(),
    executors:JSON.stringify([op])
  }

  let history_id = await MYSQLE(ent_id,T_NODE).returning('id').insert(node)
  param.history_id = history_id
  UserLogger.info(`${op}创建了流程实例${flow.desc}`)
  return param
}

o.Patch = async (ent_id,flow_id,{node,actions,data},op)=>{
  
  if(!actions || actions.length == 0)
    throw "ACTION UNEXPECTED"
  let history_id = node
  if(history_id == undefined)
    throw "UNEXPECTED HISTORY"

  let proto = await MYSQL.E(ent_id,T_INST).first('flow_id').where({id:flow_id})
  let proto_id = proto.flow_id
  // modify last history node
  let lastnode = await MYSQLE(ent_id,T_NODE).first('state','key').where({id:history_id,flow_id})
  if(!lastnode)
      throw "HISTORY_NOE_IS_NOT_EXIST"
  let mainAction = actions[0]
  // save data
  if(typeof data == 'object'){
    let data_params = Object.keys(data).map(key=>(
      {def_key:key,flow_id,history_node_id:history_id,value:JSON.stringify(data[key])}
    ))
    await MYSQLE(ent_id,T_DATA).insert(data_params)
  }

  // get executors
  let data_exe = await MYSQLE(ent_id,T_DATA).first('value').where({flow_id,def_key:'executors'})
  let executors = JSON.parse(data_exe.value)
  if(!executors)
    throw "UNEXPECTED EXECUTORS"
  
  // get node optional and change state
  let nodeOptions = await MYSQL('flow_option').select('value','key').where({flow_id:proto_id,type:1,item_key:lastnode.key}).whereIn('key',['optional'])
  nodeOptions.forEach(v=>{
    lastnode[v.key] = JSON.parse(v.value)
  })

  if(lastnode.optional)
    return 
  let actionObjects = await MYSQL('flow_action').select('key','to','from','type').where({flow_id:proto_id}).whereIn('key',actions)
  
  // retrying
  if(lastnode.state == 5)
    actions = [mainAction]

  let mainActionObejct = actionObjects[0]
  let state = makeAction(lastnode.state,mainActionObejct.type)
  
  if(state == 10)
      throw "NODE STATE UNEXPECTED"
  let history_node = {state,end_at:UTIL.getTimeStamp(),op}
  await MYSQLE(ent_id,T_NODE).update(history_node).where({id:history_id,flow_id})


  let nextNodes = await MYSQL('flow_node').select('key','in_type','out_type').where({flow_id:proto_id}).whereIn('key',actionObjects.map(v=>v.to))
  if(nextNodes.length != actionObjects.length)
    throw "WORKFLOW SETTING ERROR"

  console.log('next:',nextNodes)
  let now = UTIL.getTimeStamp()
  let nodes_param = []
  actionObjects.forEach((a,i)=>{
    let executor = executors[a.to]
    if(!Array.isArray(executor))
      executor = [executor]
    if(nextNodes[i].in_type == 1){
        let nodes = executor.map(e=>{
          return {
            key:a.to,
            from:history_id,
            flow_id,
            to:a.to,
            action:a.key,
            state:a.type == 2?5:1,
            start_at:now,
            executors:JSON.stringify([e])
          }
        })
        nodes_param = nodes_param.concat(nodes)
    }else{
        nodes_param.push({
          key:a.to,
          from:history_id,
          flow_id,
          to:a.to,
          action:a.key,
          start_at:now,
          state:a.type == 2?5:1,
          executors:JSON.stringify(executor)
        })
    }
  })
 console.log(nodes_param)
  await MYSQLE(ent_id,T_NODE).insert(nodes_param)

  
  //let node_raltions = 
  //await MYSQLE(ent_id,T_NODE).insert(nodeParam)
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



o.Recall = async (ent_id,flow_id,history_id,user_id)=>{
  console.log(history_id)
  // auth
  let current_node = await MYSQL.E(ent_id,T_NODE).first().where('id',history_id)
  if(!current_node || !current_node.from)
    throw "history node doesnt exist"
  let prev_node = await MYSQL.E(ent_id,T_NODE).first().where('id',current_node.from)
  if(!prev_node)
    throw "can not recall"
  // modify prev_node
  if(current_node.state == NODE_STATES.accepted)
  {
    await MYSQL.E(ent_id,T_NODE).update({state:1}).where({id:history_id})
  }else if(current_node.state == NODE_STATES.rejected){
    await MYSQL.E(ent_id,T_NODE).update({state:1}).where({id:history_id})
    await MYSQL.E(ent_id,T_NODE).update({state:NODE_STATES.submitted}).where({id:prev_node.id})
    await MYSQL.E(ent_id,T_DATA).where({flow_id,history_node_id:history_id}).del()
  }else{
    await MYSQL.E(ent_id,T_NODE).update({state:1}).where({id:prev_node.id})
    let nodesToDelete = await MYSQL.E(ent_id,T_NODE).select('id').where('from',prev_node.id)
    await MYSQL.E(ent_id,T_DATA).whereIn('history_node_id',nodesToDelete.map(v=>v.id)).del()
    await MYSQL.E(ent_id,T_NODE).whereIn('id',nodesToDelete.map(v=>v.id)).del()
    return
  }

 
}

o.Delete = async (instId)=>{
  
}
o.History = async (ent_id,inst_id,op)=>{
  let instance = await MYSQLE(ent_id,T_INST).first().where({id:inst_id})
  let history = await MYSQLE(ent_id,T_NODE).where({flow_id:inst_id})
  let data = await MYSQLE(ent_id,T_DATA).where({flow_id:inst_id})
  return {instance,history,data}
}

module.exports = o