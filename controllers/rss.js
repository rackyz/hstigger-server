let out = {}
const {
  Rss
} = require('../models')


out.Auth = (user_id,ent_id)=>{

}

out.Get = async ctx => {
  let id = ctx.params.id
  let data = await Rss.get(id,ctx.state.id)

  return data
}



module.exports = out