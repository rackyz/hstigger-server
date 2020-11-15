const {Account} = require('../models')

let out = {}

out.AddRelated = async (ctx)=>{
  let id = ctx.params.id
  let related = ctx.params.related
  let data = ctx.request.body
  if(id == 'self')
    id = ctx.state.id

  if(related == 'menus'){
    await Account.setMenus(id,data.value)
  }
}

out.Related = async (ctx)=>{
  let id = ctx.params.id
  let related = ctx.params.related
  if(id == 'self')
    id = ctx.state.id

  let menus = []
  if(related == 'menus'){
    menus = await Account.getMenus(id)
  }else if(related == 'action-menus'){
    menus = await Account.getActionMenus(id)
  }

  return menus
}


module.exports = out