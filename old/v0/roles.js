const {
  B,
  E,
  Role
} = require('../../models')
const Debug = require('debug')('[ROLES]')
const out = {}

out.List = async ctx => {
  let items = await Role.fetchAll()
  return items.toJSON()
}

out.Post = async ctx => {
  let data = ctx.request.body

  let model = await Role.forge(data).save()
  return model.toJSON()
}

out.Patch = async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  data.id = id
  let model = await Role.forge(data).save()
  return model.toJSON()
}


out.Delete = async ctx => {
  let id = ctx.params.id
  await B.transaction(t => {
    return Role.forge({
      id
    }).destroy({
      transacting: t
    }).then(() => {
      return Role.forge({
        id
      }).users().detach(null, {
        transacting: t
      }).then(t.commit).catch(t.rollback)
    }).catch(t.rollback)
  })
  return
}

module.exports = out