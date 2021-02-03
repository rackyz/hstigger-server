const MYSQL = require('../base/mysql')
const GZSQL = require('../base/nbgz_db')
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
  t.integer('business_type').defaultTo(0)
  // 关联项目
  t.uuid('project_id')
  // 关联部门
  t.integer('dep_id')
  // 任务状态：未初始化，进行中，已完成，已关闭，已结束
  t.integer('state').defaultTo(0)
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
  // for dep or project unique task template
  t.uuid('unique_tmpl_key')
  t.text('desc')
  t.text('files')
  t.datetime('start_at')
  t.datetime('finished_at')

  // 创建信息
  t.uuid('created_by')
  t.datetime('created_at')
})

DB.task_template = MYSQL.Create('task_template',t=>{
   // 名称
   t.uuid('id').primary()
   t.string('name', 64)
   // 任务类型: 跟踪任务,流程任务,
   t.integer('base_type').defaultTo(0)
   // 业务类型: -->自动关联部门
   t.integer('bussiness_type').defaultTo(0)
   // 任务期限：plan_duration(ms)
   t.integer('plan_duration')
  t.text('desc')
  t.text('files')
  // 是否启用
  t.boolean('actived')
   // 工作量占比
   t.double('percent')
   t.integer('sequence').defaultTo(0)
   // 父任务
  t.uuid('parent_id')
  t.integer('sub_task_count').defaultTo(0)
   // 创建信息
  t.uuid('created_by')
  t.datetime('created_at')
})

o.initdb = async (forced) => {
  
  await MYSQL.Migrate(DB,forced)

  if(forced){
    Type.AddType('TASK_TYPE',['任务','跟踪','工单','流程','数据','计划','审批'])
    Type.AddType("TASK_STATE",['准备中','进行中','已完成','已失败','已关闭'])
  }
}

o.initdb_e = async (ent_id, forced) => {
  await MYSQL.Migrate(DB,forced,ent_id)

  let items = await GZSQL('gzcloud.task_template').select('id','title','type_id','sequence')
  let types = {
    'type000000003001':'前期管理',
    'type000000003002':'设计管理',
    'type000000003003': '合约管理',
    'type000000003004': '招投标管理',
    'type000000003005': '现场管理'
  }
   let types_map = {
     'type000000003001': 95,
     'type000000003002': 98,
     'type000000003003': 97,
     'type000000003004': 101,
     'type000000003005': 100
   }
   let type_ids = {}
   let timeStamp = UTIL.getTimeStamp()
  let tasks = Object.keys(types).map((v,i)=>{
    let id = UTIL.createUUID()
    type_ids[v] = id
    return {
      id,
      business_type:types_map[v],
      base_type:156,
      name:types[v],
      created_by:"ROOT",
      sequence:i,
      created_at: timeStamp
    }
  })

  tasks =  tasks.concat(items.map(v=>{
    return {
      id:UTIL.createUUID(),
      business_type:types_map[v.type_id],
      base_type:156,
      parent_id:type_ids[v.type_id],
      name:v.title,
      sequence:v.sequence,
      created_by: "ROOT",
      created_at: timeStamp
    }
  }))

  DB.task_template.Query(ent_id).insert(tasks)
}


// 获取任务数目
o.count = async (state, queryCondition = {}, ent_id) => {
  const Q = DB.task.Query(ent_id)
  const condition = {}
  let res = await Q.count('count').where(condition)
  return res.count
}

// 查询
o.query = async (state, queryCondition = {}, ent_id) => {
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


o.listMine = async (state,ent_id)=>{
  let tasks = await o.query(state,{charger:state.id},ent_id)
  return tasks
}

// 获取任务内容
o.get = async (ctx, id, ent_id) => {
  const Q = DB.task.Query(ent_id)

  let item = await Q.first().where({
    id
  })
  

  return item
}

// 创建任务
o.create = async (ctx, data, ent_id) => {
  const Q = DB.task.Query(ent_id)

  let created_at = UTIL.getTimeStamp()
  let created_by = ctx.id
  let filelist = []

  let updateInfo = {
    id: UTIL.createUUID(),
    state:0,

    created_at,
    created_by
  }

  Object.assign(data, updateInfo)
  await Q.insert(data)
  return updateInfo
}

o.listTree = async (state, id, ent_id, table_name ,with_id_replaced) => {
   let Query = MYSQL[table_name].Query(ent_id)
   let item = await Query.where({id})
   if (with_id_replaced){
    delete item.parent_id
    item.id = UTIL.createUUID()
   }
   
   let subs = await o.cascadedListSubs(state, id, ent_id, "task_template", with_id_replaced ? item.id : null)
   return [item, ...subs]
}

o.cascadedChildren = async (state, id, ent_id, table_name, replaced_id) => {
  let QuerySubs = MYSQL[table_name].Query(ent_id)
  let subs = await QuerySubs.where('parent_id', id)
  let list = subs
  for(let i=0;i<subs.length;i++){
    let sub_id = subs[i].id
    if (replaced_id){
      subs[i].id = UTIL.createUUID()
      subs[i].parent_id = replaced_id
    }
    if(sub_id != id){
      let items = await o.cascadedList(state, sub_id, ent_id, table_name, subs[i].id)
      list = list.concat(items)
    }
  }
  return list
}

o.createFromTemplate =  async (state,tmpl_id,data,ent_id)=>{
  // list all tasks
  let templates = await o.listTree(state,tmpl_id,ent_id,true)
  let timeStamp = UTIL.getTimeStamp()
  // merge with param data
  let tasks = templates.map(v => {
    return {
      base_type:v.base_type,
      name:v.name,
      business_type:v.business_type,
      plan_duration:v.plan_duration,
      percent:v.percent,
      parent_id:v.parent_id,
      desc:v.desc,
      files:v.files,
      ...data,
      created_at: timeStamp,
      created_by:state.id
    }
  })
  // insert
  let InsertQuery = DB.task.Query('ent_id')
  await InsertQuery.insert(tasks)
}

o.saveTemplate = async (state,task_id,data,ent_id)=>{
    let tasks = await o.listTree(state,task_id,ent_id,"task",true)
    let timeStamp = UTIL.getTimeStamp()
    let templates = tasks.map(v=>({
        id:v.id,
        base_type: v.base_type,
        name: v.name,
        business_type: v.business_type,
        plan_duration: v.plan_duration,
        percent: v.percent,
         desc: v.desc,
           files: v.files,
        parent_id: v.parent_id,
        created_by:state.id,
        created_at:timeStamp
    }))

}


// 修改任务参数
o.patch = async (ctx, id, data, ent_id) => {
  const Q = DB.task.Query(ent_id)
  await Q.update(data).where({
    id
  })
}

o.process = async (state,id,data,ent_id)=>{
  //GET TYPE
  const Q = DB.task.Query(ent_id)
  let updateInfo = {
    result:data.files,
    finished_at:data.finished_at,
  //  result_desc:data.desc,
    state:2
  }
  await Q.update(updateInfo).where({id})
  return updateInfo
}

// 删除任务
o.del = async (ctx, id_list, ent_id) => {
  const Q = DB.task.Query(ent_id)
  await Q.whereIn('id', id_list).del()
  // 移除文件的关联
}




module.exports = o