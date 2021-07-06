let {
  Account,
  Enterprise,
  Task,
  TrainingClass
} = require('../../models')
let out = {}


out.List = async ctx => {
  let ent_id = ctx.state.enterprise_id
  let state = ctx.state
  let query = ctx.query
  let project_id = query.project_id
  let parent_id = query.parent_id
  let q = ctx.query.q

  let items = await Task.query(state, {
   where: {
     project_id
   }, parent_id
  }, ent_id)
  return items
}


out.Post = async ctx => {
  let state = ctx.state
  let ent_id = state.enterprise_id
  let tmpl_id = ctx.query.tmpl
  let data = ctx.request.body
  if(tmpl_id){
    let updateInfo = await Task.createFromTemplate(state,tmpl_id,data,ent_id)
    return updateInfo
  }
  let updateInfo = await Task.create(state, data, ent_id)
  return updateInfo
}
out.PROCESS_TASK = {
  url:"PATCH /enterprise/tasks/:id?q=process&t=task",
  desc:"处理消息，提交数据"
}

out.ARRANGE_TASK = {
  url:"PATCH /enterprise/tasks/:id?q=arrange",
  desc:"分配任务,初始化"
}

out.DELETE_MORE_TASKS = {
  url:"POST /enterprise/tasks/delete",
  desc:"批量删除"
}


out.Patch = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let ent_id = state.enterprise_id
  let data = ctx.request.body
  let q = ctx.query.q
  let t = ctx.query.t
  if(q == 'process'){
    if(t == 'task'){
      return await Task.process(state,id,data,ent_id)
    }    
    let updateInfo = await TrainingClass.processTask(state, id, data, ent_id)
    return updateInfo
  }

  if(q == 'cancel'){
    if(t == 'task'){
      return await Task.patch(state,id,{state:1,finished_at:null},ent_id)
    }
   let updateInfo = await TrainingClass.cancelTask(state, id, ent_id)
    return updateInfo
  }

  if(q == 'accept'){
    let updateInfo = await TrainingClass.cancelTask(state, id, data)
    return updateInfo
  }

  if(q == 'reject'){
       let updateInfo = await TrainingClass.rejectTask(state, id, data)
       return updateInfo
  }

  if(q == 'arrange'){
    let updateInfo = await Task.arrange(state,id,data,ent_id)
    return updateInfo
  }

  let updateInfo = await Task.patch(state, id, data, ent_id)
  return updateInfo

  
}

out.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let ent_id = state.enterprise_id
  await Task.remove(state, id, ent_id)
}

out.Get = async ctx=>{
   let id = ctx.params.id
   let state = ctx.state
   let ent_id = state.enterprise_id
   let task = await TrainingClass.getTask(state, id, ent_id)
   return task
}

out.PostAction = async ctx=>{
  let action = ctx.params.action
  let ent_id = ctx.state.enterprise_id
  let data = ctx.request.body
  if(action == 'delete'){
    await Task.remove(ctx.state,data,ent_id)
  }else if(action == 'charger'){
    await Task.charge(ctx.state,data,ent_id)
  }
}


module.exports = out