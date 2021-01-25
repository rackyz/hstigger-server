const {
  File
} = require('../../models')
const E = require('../../base/exception')
let out = {}

out.Name = "文件"
out.Desc = "开放的文件访问接口"


out.GetDesc = "通过平台统一的文件ID(uuid)来下载文件,<br />私有文件会返回403权限不足"
out.GetOption = {timeout:30000}
out.GetParamsOption = {'id':'平台文件ID'}
out.GetThrowOption = {403:'权限不足'}
out.Get = async ctx => {
  let id = ctx.params.id
  let url = await File.GetFileUrl(id)
  console.log("redirect:",url)
  if (url)
    ctx.redirect(url)
  else
    throw 403
}



module.exports = out
