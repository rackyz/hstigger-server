const {
  Q,
  E,
  U,
  R
} = require('../../models')


let out = {}

out.Get = async ctx=>{
  let id = ctx.params.id
  if(id == 'login'){

    return {
      ENABLE_REGISTER:true,
      ENABLE_OAUTH_LOGIN:true
    }
  }else if(id == 'env'){
    let hash = R.hgetall('ONLINE_USERS')
    
    let users = []
    if(Array.isArray(hash)){
      hash.forEach((v,i,a)=>{
        if(i % 2 && moment(a[i+1]).add(1,'hour').isAfter(moment())){
          users.push(v)
        }
      })
    }
   
    return {
      ONLINE_USERS:users
    }
  }
}

module.exports = out