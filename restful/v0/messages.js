const {Q,E,D} = require('../../models')

let out = {}

out.List = async ctx=>{
  let user_id = ctx.state.id
  let user_range = [user_id,'all']
  let res = await Q('message').select('message.*', 'message_user_readed.created_at as readtime').whereIn('to', user_range).leftOuterJoin('message_user_readed', 'msg_id', 'message.id').orderBy('message.created_at', 'desc')
  return res
}

out.Patch = async ctx=>{
  let q = ctx.query.q
  let message_id = ctx.params.id
  let user_id = ctx.state.od
  if(!message_id)
    throw E.E_INVALID_DATA
  if(!user_id)
    throw E.E_USER_UNLOGIN

  if(q == 'read'){
    await Q('message_user_readed').insert({
      user_id,
      message_id
    })
  }
}


out.Del = async ctx=>{
  let message_id = ctx.params.id
  if(!message_id)
    throw E.E_INVALID_DATA

  await Q.transaction(t=>{
    Q('message_user_readed').transacting(t).where({messaeg_id}).del().then(
      ()=>{
        Q('message').transacting(t).where({id:message_id}).del().then(t.commit).catch(t.rollback)
      }
    ).catch(t.rollback)
  })
}

module.exports = out