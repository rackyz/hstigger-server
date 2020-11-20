const {
  Q,
  B,
  E,
  User
} = require('../../models')
const Debug = require('debug')('[USERS]')
const out = {}


out.List = async ctx=>{
  let items = await User.List(ctx)
  return items
}

out.PostAction = async ctx=>{
  let res = await User.PostAction(ctx)
  return res
}

out.Post = async ctx=>{
  let updateInfo = await User.Post(ctx)
  return updateInfo
}

out.Patch = async ctx=>{
  let q = ctx.query.q
  let updateInfo = null
  if(q == 'reset-pass')
    updateInfo = await User.Patch_ResetPassword(ctx)
  else{
    updateInfo = await User.Patch(ctx)
  }

  return updateInfo
}


out.Get = async ctx=>{
  let id = ctx.params.id
  let q = ctx.query.q
  let forgeData = {id}
  if(q == 'user')
    forgeData = {user:id}

  let model = await User.forge(forgeData).fetch({
    withRelated: ['deps', 'roles']
  })
  if(!model){
    throw E.E_USER_UNREGISTERATED
  }
  let user = model.toJSON()
  user.deps = user.deps.map(v=>v.id)
  user.roles = user.roles.map(v=>v.id)
  return user
}

out.Delete = async ctx=>{
  let id = ctx.params.id

  if(id && id.includes('sys_'))
    throw E.E_DO_NOT_PERMITTED

  let user = User.forge({
    id
  })
  await B.transaction(trx=>{
      let promises = [user.destroy({
            transacting: trx
          }),user.deps().detach(null, {
            transacting: trx,
            require:false
          }),
        user.roles().detach(null, {
          transcting: trx,
          require: false
        }),
        user.sessions().invokeThen('destroy', {
          transacting: trx,
          require: false
        })
        ]
        return Promise.all(promises).then(trx.commit).catch(trx.rollback)
    
  })
  return "删除成功"
 
}


out.AddRelated = async ctx=>{
  let id = ctx.params.id
  let related = ctx.params.related
  let data =ctx.request.body
  if(related == 'deps'){
    let {dep_id} = data
    if(!dep_id)
      throw E.E_INVALID_DATA

    await Q('dep_user').insert({dep_id,user_id:id})
  }else if(related == 'projects'){
    let ids = data
    await Q('concerned_project_user').insert()
  }
}

out.DelRelated = async ctx=>{
 let id = ctx.params.id
 let related = ctx.params.related
 let relatedId = ctx.params.relatedId

 if (related == 'deps') {
  let dep_id = relatedId
  if (!dep_id)
    throw E.E_INVALID_DATA

  await Q('dep_user').where({
    dep_id,
    user_id: id
  }).del()
 }
}




module.exports = out