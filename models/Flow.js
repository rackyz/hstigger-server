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
o.initdb = async (forced) => {
  if (forced) {
    await Type.AddType('FLOW_TYPE', FLOW_TYPES)
    await Type.AddType('FLOW_STATE', FLOW_STATES)
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
    t.string('key',16)
    t.string('name',32)
    t.string('desc',256)
    t.text('layout')
    t.integer('in_type').defaultTo(0)
    t.integer('out_type').defaultTo(0) //type == 1 copysend
  },forced)

  await MYSQL.initdb(T_ACTION,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.string('key',16)
    t.string('name',32)
    t.string('from',32),
    t.string('to',32)
    t.integer('type').defaultTo(0)
  })

  await MYSQL.initdb(T_FIELD,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.string('key',16)
    t.string('title',32)
    t.string('control',32)
    t.text('option')
  },forced)

  await MYSQL.initdb(T_OPTION,t=>{
    t.increments('id').index().primary()
    t.uuid('flow_id')
    t.integer('type')  // 0 - flow 1 - node 2 - action 3 - field
    t.string('key',16)
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

const ParseDefine = async (id,def)=>{
  // nodes
  //
  console.log(def)
  let nodes = def.nodes.forEach
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
  console.log(id)
  if(item.define)
    await ParseDefine(id,item.define)
  // await MYSQL(T_FLOW).update(item).where({
  //   id
  // })
}

o.deleteObjects = async (id_list, op) => {
  await MYSQL(T_FLOW).whereIn("id", id_list).del()
}

o.get = async id => {
  let item = await MYSQL(T_NOTICE).first().where({
    id
  })
  return item
}


o.GetUserFlows = async (id) => {
  return await o.list()
}



module.exports = o