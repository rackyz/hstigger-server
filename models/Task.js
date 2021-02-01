const MYSQL = require('../base/mysql')
const Type = require('./Type')
const UTIL = require('../base/util')
const Exception = require('../base/exception')
let o = {}

o.required = ['Type']
let DB = {}

DB.task = MYSQL.Create('task',t=>{
  t.uuid('id').index().primary() // uuid
  
  // 名称
  t.string('name', 64)
  // 任务类型: 跟踪任务,流程任务,
  t.integer('base_type').defaultTo(0)
  // 业务类型: -->自动关联部门
  t.integer('bussiness_type').defaultTo(0)
  // 关联项目
  t.uuid('project_id')
  // 关联部门
  t.integer('dep_id')
  // 任务状态：未初始化，进行中，已完成，已关闭，已结束
  t.integer('state')
  // 任务期限：plan_duration(ms)
  t.integer('plan_duration')
  // 负责人：charger
  t.uuid('charger')
  // 任务成果：file/files/dataObject
  t.text('result')
  // 工作量占比
  t.double('percent')
  // 父任务
  t.uuid('parent_id')
  // 创建信息
  t.uuid('created_by')
  t.datetime('created_at')
})

DB.task_templates = MYSQL.Create('task_templates',t=>{
   // 名称
   t.string('name', 64)
   // 任务类型: 跟踪任务,流程任务,
   t.integer('base_type').defaultTo(0)
   // 业务类型: -->自动关联部门
   t.integer('bussiness_type').defaultTo(0)
   // 任务期限：plan_duration(ms)
  t.integer('plan_duration')
   // 工作量占比
   t.double('percent')
   // 父任务
  t.uuid('parent_id')
  t.integer('sub_task_count')
   // 创建信息
  t.uuid('created_by')
  t.datetime('created_at')
})

o.initdb = async (forced) => {
  //forced = true
  await MYSQL.Migrate(DB,forced)
}

o.initdb_e = async (ent_id, forced) => {
  forced = true
  await MYSQL.Migrate(DB,forced,ent_id)
}



// 
o.count = async (state, queryCondition = {}, ent_id) => {
  const Q = DB.task.Query(ent_id)
  const condition = {}
  let res = await Q.count('count').where(condition)
  return res.count
}

o.query = async (ctx, queryCondition = {}, ent_id) => {
  let pageSize = queryCondition.pageSize || 100
  let page = queryCondition.page || 1
  const condition = null
  const Q = DB.task.Query(ent_id)
  if (condition) {
    Q = Q.where(condition)
  }
  let items = await Q.offset((page - 1) * pageSize).limit(pageSize)

  return items
}

o.get = async (ctx, id, ent_id) => {
  const Q = DB.task.Query(ent_id)

  let item = await Q.first().where({
    id
  })
  

  return item
}

o.create = async (ctx, data, ent_id) => {
  const Q = DB.task.Query(ent_id)

  let created_at = UTIL.getTimeStamp()
  let created_by = ctx.id
  let filelist = []

  let updateInfo = {
    id: UTIL.createUUID(),
    created_at,
    created_by
  }

  Object.assign(data, updateInfo)
  await Q.insert(data)
  return updateInfo
}

o.patch = async (ctx, id, data, ent_id) => {
  const Q = DB.task.Query(ent_id)
  await Q.update(data).where({
    id
  })
}

o.del = async (ctx, id_list, ent_id) => {
  const Q = DB.task.Query(ent_id)
  await Q.whereIn('id', id_list).del()
  // 移除文件的关联
}




module.exports = o