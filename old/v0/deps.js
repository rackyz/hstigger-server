const {
  B,
  E,
  Dep
} = require('../../models')
const Debug = require('debug')('[DEPS]')
const out = {}

out.List = async ctx=>{
  let items = await Dep.fetchAll()
  return items.toJSON()
}

out.Post = async ctx => {
  let data = ctx.request.body

  let model = await Dep.forge(data).save()
  return model.toJSON()
}



out.Delete = async ctx => {
  let id = ctx.params.id
  await B.transaction(t=>{
    return Dep.forge({
        id
      }).destroy({
        transacting: t
      }).then(() => {
      return Dep.forge({
          id
        }).users().detach(null, {
        transacting: t
      }).then(t.commit).catch(t.rollback)
    }).catch(t.rollback)
  })
  return
}

out.AddRelated = async ctx => {
  return Dep.AddRelated(ctx)
}

out.DelRelated = async ctx=>{
  return Dep.DelRelated(ctx)
}

module.exports = out