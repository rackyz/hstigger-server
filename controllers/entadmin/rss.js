let out = {}
const {
  Rss
} = require('../../models')

out.Auth = async (method, {
  user_id,
  ent_id
}) => {}

out.List = async ctx => {
  return await Rss.list()
}


module.exports = out