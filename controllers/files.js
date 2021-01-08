const {
  File
} = require('../models')
const E = require('../base/exception')
let out = {}

out.Name = "文件"
out.Desc = "提供基于腾讯COS的个人文件的查询和处理API"
out.List = async ctx=>{
  let user_id = ctx.state.id
  
  return await File.listFromUser(user_id)
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let op = ctx.state.id
  let createInfo = await File.post(data,op)
  return createInfo
}


out.Get = async ctx=>{
   let id = ctx.params.id
   let url = await File.GetTempFileUrl(id)
   console.log("TEMP:",url)
   return url
}


out.PostAction = async ctx=>{
  let data = ctx.request.body
  let op = ctx.state.id
  let action = ctx.params.action

  if(action =='delete'){
    await File.deleteObjects(data,op)
  }
}

module.exports = out
