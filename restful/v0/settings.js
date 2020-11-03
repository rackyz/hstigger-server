const {
  Q,
  E,
  U
} = require('../../models')


let out = {}

out.Get = async ctx=>{
  let id = ctx.params.id
  if(id == 'login'){

    return {
      ENABLE_REGISTER:true,
      ENABLE_OAUTH_LOGIN:true
    }
  }
}

module.exports = out