const {
  File
} = require('../../models')
const E = require('../../base/exception')
let out = {}

out.Get = async ctx => {
  let id = ctx.params.id
  let url = await File.GetURL(id)
  console.log("redirect:",url)
  if (url)
    ctx.redirect(url)
  else
    throw 403
}



module.exports = out
