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


module.exports = o