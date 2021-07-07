const {
  Session,
  
  TrainingClass,
} = require('../../models')

let o = {}


o.List = async ctx => {
  let page = ctx.query.page ? parseInt(ctx.query.page) : 1
  let pagesize = ctx.query.pagesize ? parseInt(ctx.query.pagesize) : 20
  let items = await TrainingClass.query(ctx.state, {
    page,
    pagesize
  })
  return items
}

o.Get = async ctx => {
  let id = ctx.params.id
   let entid = ctx.query.ent
  let item = await TrainingClass.get({
    enterprise_id: entid
  }, id)
  return item
}

o.Patch = async ctx => {
  let id = ctx.params.id
  let data = ctx.request.body
  let q = ctx.query.q
  let entid = ctx.query.ent

  if (q == 'joinpub') {
    await Session.verifyForgetVcode(data.account,data.vcode)
    await TrainingClass.joinpub({enterprise_id:entid}, id, data)

  } 
}

module.exports = o