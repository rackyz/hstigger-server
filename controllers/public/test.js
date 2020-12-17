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

  
  // let u = await REDIS.ASC_GET_JSON('cached_users')
  // console.log(u.length)
  // if(u &&Array.isArray(u))
  //   return u

  let users = []
  let groups = await Ding.getGroups()
 console.log(groups)
  for(let i=0;i<groups.length;i++)
    users = users.concat(await Ding.getEmployeeInfoList(groups[i].id))
  REDIS.SET('cached_users',JSON.stringify(users))
  console.log(users.length)
  return users
}


module.exports = out