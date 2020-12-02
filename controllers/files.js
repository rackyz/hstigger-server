const {
  File
} = require('../models')
const E = require('../base/exception')
let out = {}

out.List = async ctx=>{
  return await File.list()
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let op = ctx.state.id
  let createInfo = await File.post(data,op)
  return createInfo
}


out.Get = async ctx=>{
    let id = ctx.params.id
   let url = await File.GetFileUrl(id)
   if (url)
     ctx.redirect("https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/files/" + url)
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
