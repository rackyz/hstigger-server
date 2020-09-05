const {
  Q,
  D,
  U
} = require('../../models/index')
const CreateRestfulController = U.CreateRestfulController
const config = {
  prefix: 'pos',
  list: {
    extend(ctx, query) {
      let q = ctx.query.q
      let uid = ctx.state.id
      if (q == 'mine') {
        return query.where('inputor', uid)
      } else {
        return query
      }
    }
  },
  Get: (knex) => async ctx => {
    let id = ctx.param.id
    let file = await knex('file').first('url').where('id', id)
    if (file && file.url)
      ctx.redirect("https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/files/" + file.url)
  },

  Post: (knex) => async ctx => {
    let files = ctx.request.body
    let now = U.getTimeStamp()
    for (let i = 0; i < files.length; i++) {
      files[i].id = U.createUUID()
      files[i].owner = ctx.state.id
      files[i].inputor = ctx.state.id
      files[i].inputTime = now
      files[i].url = files[i].vdisk + '/' + U.getDateStamp() + '/' + files[i].id + '.' + files[i].ext
    }

    await knex('file').insert(files).returning('id')
    return files.map((v,i) => ({
      url: v.url,
      id: v.id
    }))
  }
}

let controller = CreateRestfulController(Q, 'file', config)
module.exports = controller