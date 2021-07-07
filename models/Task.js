const MYSQL = require('../base/mysql')
const GZSQL = require('../base/nbgz_db')
const Type = require('./Type')
const UTIL = require('../base/util')
const Archive = require('./Archive')
const Exception = require('../base/exception')
const moment = require('moment')
const { uniqueId } = require('lodash')
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
  t.text('comment')
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
  t.integer('sub_task_count').defaultTo(0)
  //t.boolean('enabled_subtask')
  //t.boolean('')
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
   t.integer('business_type').defaultTo(0)
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
    Type.AddType('TASK_TYPE',['任务','跟踪','工单','流程','数据','计划','审批','考核'])
    Type.AddType("TASK_STATE",['准备中','进行中','已完成','已失败','已关闭'])
 }
}

o.initdb_e = async (ent_id, forced) => {
  
  await MYSQL.Migrate(DB,forced,ent_id)
  
  if(forced){
    let items = await GZSQL('gzcloud.task_template').select('id','title','type_id','sequence')
    let types = {
      'type000000003001':'前期管理',
      'type000000003002':'设计管理',
      'type000000003003': '合约管理',
      'type000000003004': '招投标管理',
      'type000000003005': '现场管理',
      'type000000003006': '施工管理'
    }
    let types_map = {
      'type000000003001': 0,
      'type000000003002': 3,
      'type000000003003': 2,
      'type000000003004': 6,
      'type000000003005': 5,
      'type000000003006': 5
    }
    let type_ids = {}
    let timeStamp = UTIL.getTimeStamp()
    let tasks = Object.keys(types).map((v,i)=>{
      let id = UTIL.createUUID()
      type_ids[v] = id
      return {
        id,
        business_type:types_map[v],
        base_type:0,
        name:types[v],
        created_by:"ROOT",
        sequence:i,
        sub_task_count:0,
        actived: 1,
        created_at: timeStamp
      }
    })

    tasks = tasks.concat(items.map(v=>{
      let parentId = tasks.findIndex(p=>p.id == type_ids[v.type_id])
      if (parentId != -1)
        tasks[parentId].sub_task_count++
      return {
        id:UTIL.createUUID(),
        business_type:types_map[v.type_id],
        base_type:0,
        parent_id:type_ids[v.type_id],
        name:v.title,
        actived:1,
        sequence:v.sequence,
        created_by: "ROOT",
        created_at: timeStamp
      }
    }))

    await DB.task_template.Query(ent_id).del()
    await DB.task.Query(ent_id).del()
    await DB.task_template.Query(ent_id).insert(tasks)
  }
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
  let pageSize = queryCondition.pageSize || 500
  let page = queryCondition.page || 1
  const condition = queryCondition.where
  console.log(condition)
  let Q = DB.task.Query(ent_id)
  if (condition) {
    Q = Q.where(condition)
  }
  if(queryCondition.parent_id == -1)
    Q = Q.where('base_type',0)
  Q = Q.offset((page - 1) * pageSize).limit(pageSize).orderBy('created_at', 'desc')
  let items = await Q

  return items
}


o.listMine = async (state,ent_id)=>{
  let tasks = await o.query(state,{charger:state.id},ent_id)
  return tasks
}

// 获取任务内容
o.get = async (state, id, ent_id) => {
  const Q = DB.task.Query(ent_id)

  let item = await Q.first().where({
    id
  })
  
  const QC = DB.task.Query(ent_id)
  item.children = await QC.where({parent_id:id})

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
    base_type:data.base_type || 0,
    created_at,
    created_by
  }

  Object.assign(data, updateInfo)
  await Q.insert(data)
  return updateInfo
}

o.createTasks = async (state,dataItems,ent_id)=>{
  const Q = DB.task.Query(ent_id)
   let created_at = UTIL.getTimeStamp()
   let created_by = state.id

  let updateinfos = []
  dataItems = dataItems.map(data=>{
         let updateInfo = {
           id: data.id || UTIL.createUUID(),
           state: 0,
           base_type: data.base_type || 0,
           created_at,
           created_by
         }

        Object.assign(data, updateInfo)
        updateinfos.push(updateInfo)
        return data
    })
  
   await Q.insert(dataItems)
   return updateinfos
}

o.listTree = async (state, id, ent_id, table_name ,with_id_replaced,array_list,exist_id) => {
   let Query = DB[table_name].Query(ent_id)
   let item = await Query.first().where({id})
   if (with_id_replaced){
    delete item.parent_id
    item.unique_tmpl_key = item.id
    item.base_type = 1
    item.id = exist_id || UTIL.createUUID()
   }
   
   let subs = await o.cascadedChildren(state, id, ent_id, "task_template", with_id_replaced ? item.id : null,array_list)
   return [item, ...subs]
}

o.cascadedChildren = async (state, id, ent_id, table_name, replaced_id,array_list) => {
  let QuerySubs = DB[table_name].Query(ent_id)
  let subs = await QuerySubs.where('parent_id', id)
  let list = subs
  if(replaced_id && Array.isArray(array_list)){
    list = subs.filter(v=>array_list.includes(v.id))
  }
  for(let i=0;i<subs.length;i++){
    let sub_id = subs[i].id
    
    if (replaced_id){
      subs[i].id = UTIL.createUUID()
      subs[i].parent_id = replaced_id
      subs[i].unique_tmpl_key = sub_id
    }
    if(sub_id != id){
      let items = await o.cascadedChildren(state, sub_id, ent_id, table_name, subs[i].id)
      list = list.concat(items)
    }
  }
  return list
}

o.listTemplates = async (state,condition = {},ent_id)=>{
  let Q = DB.task_template.Query(ent_id)
  if(condition.parent_id)
    Q = Q.where({parent_id:condition.parent_id,actived:1})
  else
    Q = Q.whereNull('parent_id')
    
  let items = await Q
  return items
}


o.createFromTemplate =  async (state,tmpl_id,data,ent_id)=>{
  // list all tasks
  
  let timeStamp = UTIL.getTimeStamp()
  let list = data.list || []
  delete data.list
  let init_data = {}
  if(data.project_id)
    init_data.project_id = data.project_id
  if(list.length == 0)
    throw "未选择任务" 

  let queryExistTmplId = DB.task.Query(ent_id)
   let uniqueIds = await queryExistTmplId.select('id', 'unique_tmpl_key').where('project_id', data.project_id)
  let rootExist = uniqueIds.find(v=>v.unique_tmpl_key == tmpl_id)

  let templates = await o.listTree(state, tmpl_id, ent_id, 'task_template', true, list, rootExist ? rootExist.id:undefined)
  

  // remove exist

  // merge with param data
  let tasks = templates.filter(v => !uniqueIds.find(t => t.unique_tmpl_key == v.unique_tmpl_key)).map(v => {
    return {
      id:v.id,
      base_type:v.base_type,
      name:v.sequence?(v.sequence+'-'+v.name):v.name,
      business_type:v.business_type,
      plan_duration:v.plan_duration,
      percent:v.percent,
      parent_id:v.parent_id,
      sub_task_count:v.sub_task_count,
      desc:v.desc,
      files:v.files,
      unique_tmpl_key: v.unique_tmpl_key,
      created_at: timeStamp,
      created_by:state.id,
      ...init_data
    }
  })

  // insert
  let InsertQuery = DB.task.Query(ent_id)
  await InsertQuery.insert(tasks)
  return
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

    let InsertQuery = DB.task_template.Query(ent_id)
    await InsertQuery.insert(templates)
    return
}


// 修改任务参数
o.patch = async (ctx, id, data, ent_id) => {
  const Q = DB.task.Query(ent_id)
  await Q.update(data).where({
    id
  })
  return data
}

o.charge = async (ctx,data,ent_id)=>{
  const Q = DB.task.Query(ent_id)
  console.log('charge',data)
  await Q.update({charger:data.charger,state:1,finished_at:null}).whereIn('id',data.idlist)
}

o.process = async (state,id,data,ent_id)=>{
  //GET TYPE
  const Q = DB.task.Query(ent_id)
  let task = await Q.first('base_type', 'name', 'business_type','project_id','dep_id','result').where({
    id
  })
  if(!task){
    throw "任务ID不存在:"+id
  }
  console.log(data)
  if(task.base_type == 0){
    const Update = DB.task.Query(ent_id)
    let updateInfo = {
      result: data.files,
      finished_at: data.finished_at,
      comment: data.comment,
      state: data.state != undefined ? data.state : 2
    }

    if(data.type2){
      let archive = {
        code:moment().format("YYYYMMDDHms"),
        type1: task.business_type,
        files:data.files || task.result,
        project_id:task.project_id,
        dep_id:task.dep_id,
        created_at:UTIL.getTimeStamp(),
        created_by:state.id,
        desc:data.comment,
        name:task.name,
        type2:data.type2,
        type3:data.type3
      }
      console.log('archive',archive)

      await Archive.add(state,archive,ent_id)
    }
    await Update.update(updateInfo).where({
      id
    })
    return updateInfo
  }else{
    // 任务跟踪
    throw "暂不支持该类型任务处理"
  }
  
}

o.arrange = async (state,id,data,ent_id)=>{
  let {charger,start_at,plan_duration, comment} = data
  const Q = DB.task.Query(ent_id)
  let task = await Q.first('base_type').where({id})
  // 1 - check user prvillege
  // let user_id = state.id

  // 2 - check task state && type
  // Only normal(type=0) and uninited(state=0) task can be arranged
  // 
  let U = DB.task.Query(en_id)
  await U.update({charger,start_at,plan_duration,comment}).where({id})
  return {charger,start_at,plan_duration,comment,state:1}
}

// 删除任务
o.remove = async (ctx, id_list = [], ent_id) => {
  const D = DB.task.Query(ent_id)
  const Q = DB.task.Query(ent_id)
  
  let children_id_list = await Q.whereIn('parent_id', id_list).select('id').map(v=>v.id)
  let list = [...id_list,...children_id_list]
  await D.whereIn('id', id_list).del()
  while (children_id_list.length != 0) {
    await DB.task.Query(ent_id).whereIn('id', children_id_list).del()
    children_id_list = await DB.task.Query(ent_id).whereIn('parent_id', children_id_list).select('id').map(v=>v.id)
    list = list.concat(children_id_list)
  }
  
  // 移除文件的关联
  return list
}




module.exports = o