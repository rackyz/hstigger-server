const {Dynamic} = require('../../models')

let o = {}

o.List = async ctx=>{
  let query = ctx.query
  let condition = {
    page_size:20,
    orders:[{key:'created_at',order:'desc'}]
  }
  if(query.project_id){
    condition.where = 
      {project_id:query.project_id}
    
  }

  if(condition){
    let items = await Dynamic.query(ctx.state,condition)
    return items
  }
} 


module.exports = o