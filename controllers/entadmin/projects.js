const {
  Project
} = require('../../models')


let o = {}

o.List = async ctx => {
  let queryParams = ctx.query
  let state = ctx.state
  let res = await Project.query(state, queryParams, state.enterprise_id)
  return res
}

o.PostAction = async ctx=>{
  let action = ctx.params.action
  if(action == "sync"){
    let projects = await Project.sync(ctx.state.enterprise_id)
    return projects
  }
}

o.SYNC_PROJECTS = {
  url: "POST /entadmin/projects/sync",
  desc: "同步OA平台的项目及更新工作"
}

module.exports = o