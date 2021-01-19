const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const moment = require('moment')
const {
  UserLogger
} = require('../base/logger')
const REDIS = require('../base/redis')

let o = {
  required: ['Type']
}

// -- PLATFORM
const T_FLOW = 'flow'
const T_NODE = 'flow_node'
const T_ACTION = 'flow_action'
const T_FIELD = 'flow_field'
const T_OPTION = 'flow_option'
const FLOW_TYPES = ['平台运维','行政综合', '财务审批', '人事审批', '项目管理']
const FLOW_STATES = ['设计中','待测试','已启用','已禁用']
const NODE_TYPES = ['待处理','已发送','已退回','已接受','处理中','处理成功','处理失败','等待中','已跳过']
const ACTION_TYPES = ['等待','发送','退回','接收','处理','关闭','跳过']
const ActionType = {
  ACTIVE:0,
  SUBMIT:1,
  REJECT:2,
  RETRY:3,
  ACCEPT:4,
  PROCESS:5,
  PROCESSED:6,
  PROCESS_FAIL:7,
  WAIT:8
}
const FLOW_OBJ_TYPES = ['流程','节点','操作','字段','表单','实例']
o.initdb = async (forced) => {
  if (forced) {
    await Type.AddType('FLOW_TYPE', FLOW_TYPES)
    await Type.AddType('FLOW_STATE', FLOW_STATES)
    await Type.AddType('ACTION_TYPE',ACTION_TYPES)
    await Type.AddType('FLOW_OBJ_TYPE', FLOW_OBJ_TYPES)
  }
  await MYSQL.initdb(T_FLOW, t => {
    t.uuid('id').index()
    t.string('name', 64).notNull()
    t.string('desc',256)
    t.string('icon',32)
    t.integer('flow_type').defaultTo(0)
    t.integer('state').defaultTo(0)
    t.boolean('private').defaultTo(false)
    t.text('define')
    t.uuid('created_by')
    t.datetime('created_at')
  }, forced)

  await MYSQL.initdb(T_NODE,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.string('key',32)
    t.string('name',32)
    t.string('desc',256)
    t.text('layout')
    t.text('view')
    t.integer('in_type').defaultTo(0)
    t.integer('out_type').defaultTo(0) //type == 1 copysend
  },forced)

  await MYSQL.initdb(T_ACTION,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.string('key',32)
    t.string('name',32)
    t.string('from',32),
    t.string('to',32)
    t.integer('type').defaultTo(0)
  })

  await MYSQL.initdb(T_FIELD,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.string('key',32)
    t.string('label',32)
    t.string('control',32)
    t.text('option')
  },forced)

  await MYSQL.initdb(T_OPTION,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.key('item_key')
    t.integer('type')  // 0 - flow 1 - node 2 - action 3 - field
    t.string('key',32)
    t.text('value')
  })

  const initData = [{
    id:UTIL.createUUID(),
    name: '年终考核(个人)',
    desc:"宁波高专建设监理有限公司，2020年度年终考核流程，请填写相关内容并上传文件完成本次年终考核",
    flow_type:1,
    icon: 'gongzuobaogao',
    state:2,
    private:true,
    created_at:UTIL.getTimeStamp()
  }]

  await MYSQL.seeds(T_FLOW, initData, forced)

}



const ParseDefine = async (flow_id,def)=>{
  // nodes
  //
  let options = []
  const predefined_options = ['executor_getters', 'executor_multiple',
    'executor_max', 'executor_default', 'optional', 'executor_default_getter', 'executor_modifiable', 'executor_default_getter_key','sms'
  ]
  let nodes = def.nodes.map(node=>{
    predefined_options.forEach(op_key=>{
      let op_val = node[op_key]
      if(op_val != undefined){
        console.log(op_key,op_val)
        options.push({
          flow_id,
          item_key:node.key,
          type:1,
          key:op_key,
          value: JSON.stringify(op_val)
        })
      }
    })
    return {
      flow_id,
      name:node.name,
      key:node.key,
      desc:node.desc,
      layout:node.layout,
      view:node.view,
      in_type:node.in_type,
      out_type:node.out_type
    }
  })

  //with TEXT 是否作为从属发送（所属操作后，同时进行此操作）
  const action_options = ['with']
  let actions = def.actions.map(action=>{
    action_options.forEach(op_key=>{
       let op_val = action[op_key]
       if (op_val != undefined) {
         console.log(op_key, op_val)
         options.push({
           flow_id,
           item_key: action.key,
           
           type: 2,
           key: op_key,
           value: JSON.stringify(op_val)
         })
       }
    })
    return {
      flow_id,
      name: action.name,
      key:action.key,
      type: action.type,
      from: action.from,
      to: action.to
    }
  })
  let fields = Object.keys(def.def).map(fkey=>{
    let f = def.def[fkey]
    return {
      flow_id,
      key:fkey,
      label:f.label,
      control:f.control,
      option:JSON.stringify(f.option)
    }
  })
  await MYSQL(T_NODE).where({flow_id}).delete()
  await MYSQL(T_ACTION).where({
    flow_id
  }).delete()
  await MYSQL(T_FIELD).where({
    flow_id
  }).delete()
  await MYSQL(T_OPTION).where({
    flow_id
  }).delete()

  if(nodes && nodes.length > 0)
    await MYSQL(T_NODE).insert(nodes)
  else
    throw '未定义{nodes}'
  
  if(actions && actions.length > 0)
    await MYSQL(T_ACTION).insert(actions)
  else
    throw '未定义{actions}'
    
  if (fields && fields.length > 0)
    await MYSQL(T_FIELD).insert(fields)
  else
    throw '未定义{fields}'

  if(options && options.length > 0)
    await MYSQL(T_OPTION).insert(options)
  
  console.log(`FLOW_INSTALLED:nodes=${nodes.length},actions=${actions.length},fields=${fields.length},options=${options.length}`)
}

o.list = async () => {
  let items = await MYSQL(T_FLOW).select('id', 'name','desc','flow_type','icon','private','state', 'created_by', 'created_at')
  return items
}

o.post = async (item, op) => {
  let createInfo = {
    id:UTIL.createUUID(),
    created_at: UTIL.getTimeStamp(),
    created_by: op
  }
  let id = await MYSQL(T_FLOW).insert(item).returning('id')
  if(item.define){
    
  }
  createInfo.id = id
  return createInfo
}

o.patch = async (id, item, op) => {
  if(item.define)
    await ParseDefine(id,item.define)
  delete item.define
  if(Object.keys(item).length > 0)
    await MYSQL(T_FLOW).update(item).where({
      id
    })
  REDIS.DEL('flow_' + id)
}

o.deleteObjects = async (id_list, op) => {
  await MYSQL(T_FLOW).whereIn("id", id_list).del()
}

o.get = async flow_id => {
  let cached = await REDIS.ASC_GET_JSON('flow_' + flow_id)
  if(cached)
    return cached
    
  let item = await MYSQL(T_FLOW).first().where({
    id: flow_id
  })
  
  item.nodes = await MYSQL(T_NODE).where({flow_id})
  item.actions = await MYSQL(T_ACTION).where({flow_id})
  item.fields = await MYSQL(T_FIELD).where({flow_id})
  item.fields.forEach(v=>{
    if(v.option)
      v.option = JSON.parse(v.option)
  })
  item.def = {}
  item.fields.forEach(f=>{
    item.def[f.key] = f
  })
  item.options = await MYSQL(T_OPTION).where({flow_id})
  item.options.forEach(v=>{
    if(v.type == 1){
      let node = item.nodes.find(n=>n.key == v.item_key)
      if(node)
        node[v.key] = JSON.parse(v.value)
    }else if(v.type == 2){
      let action = item.actions.find(a=>a.key == v.item_key)
      if(action)
        action[v.key] = JSON.parse(v.value)
    }
  })

  REDIS.ASC_SET_JSON('flow_'+flow_id,item)
  REDIS.EXPIRE('flow_' + flow_id,24*3600)

  return item
}

o.getNodes = async (flow_id) => {
   let nodes = await MYSQL(T_NODE).select('name','key').where({
     flow_id
   })
   return nodes
}


o.GetUserFlows = async (id) => {
  return await o.list()
}




module.exports = o