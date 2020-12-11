// const docx2html = require('../../libs/docx2html')
// console.log(docx2html)
// let out = {}

// out.List = async ()=>{
//   let result = await docx2html("./test.docx")

//   return result
// }

// module.exports = out


const Ding  = require('../../models/Ding')
const out = {}
const REDIS = require("../../base/redis")
out.List = async ()=>{
  let groups = await Ding.getGroups()
  let users = []
  for(let i=0;i<groups.length;i++)
    users.push(await Ding.getEmployeeInfoList(groups[i].id))
  REDIS.SET('cached_users',JSON.stringify(users))
  return users
}


module.exports = out