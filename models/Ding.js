const axios = require('axios')
const cripto = require('crypto')
const debug = require('debug')('DING')
let api = {}
let token = null

const appId = 'dingxkpwvqjwzlkqy0rg'
const appSecret = 'zws-DL5eXKTT-r9QKRAdvzyQGZwQmn64eQIPrVKtEYoerObfeU1JOLzk0i9YFEfG'
const agentId = 605386993

api.LoginByScanCode = async (code)=>{
  const appid = 'dingoae9xk1uyq2lrxfp5v'
  const appSecret = 'gcUAadsbepBPMeWKnDGcPjL_abSKi-DSXDqf97SduNyUtBHdRcCuf0Gq3tVBQTAe'
  const timestamp = new Date().getTime().toString()
  var signature = cripto.createHmac('sha256', appSecret).update(timestamp, 'utf8').digest().toString('base64')
  signature = encodeURIComponent(signature).replace("+", "%20").replace("*", "%2A")
    .replace("~", "%7E").replace("/", "%2F")
  let res = await axios.post(`https://oapi.dingtalk.com/sns/getuserinfo_bycode?accessKey=${appid}&timestamp=${timestamp}&signature=${signature}`, {
    tmp_auth_code: code
  }).catch(e => {
    throw (e)
  })
  if (res.data.errcode) {
    throw (res.data.errmsg)
  }

  return res.data.user_info.unionid
}

api.loginWithH5 = async (code) => {
  const appid = "dingoixfxalle56pkkg7"
  const appSecret = "Ob0vWlulnQ7KLVSd-T0jIH94-8bPm7hAInslP9PZSPj1x4aYLyKYmGq0GJzJ5jYO"
  let access_token = await api.getAccessToken(appid,appSecret,false)
  let res = await axios.get(`https://oapi.dingtalk.com/user/getuserinfo?access_token=${access_token}&code=${code}`).catch(e => {
    throw (e)
  })
  debug('RES:',res)

  if (res.data.errcode) {
    throw (res.data.errmsg)
  }

  return res.data.userid
}

api.getAccessToken = async (_appId = appId, _appSecret = appSecret, cached = true) => {
  return new Promise((resolve,reject)=>{
    if(token != null && cached)
      resolve(token)

    return axios.get(`https://oapi.dingtalk.com/gettoken?appkey=${_appId}&appsecret=${_appSecret}`).then(res => {
      if(res.data.errcode){
        reject(res.data.errmsg)
      }

      let {access_token} = res.data
      if (cached)
        token = access_token
      
      resolve(access_token)
    }).catch(e=>{
      throw(e)
    })
  })
}

api.getUserInfoByAuthCode_QA = async (code)=>{
  let ACCESS_TOKEN = await api.getAccessToken('dingtgvpuj0ligjdppka', 'Hr2bAkx7cycy0Hife0FpdQpeSb2rYAsbOu64NjRUUkGH--iugu5ej4jLVLEsBXuh')
  return new Promise((resolve,reject)=>{
     return axios.get(`https://oapi.dingtalk.com/user/getuserinfo?access_token=${ACCESS_TOKEN}&code=${code}`).then(res => {
       resolve(res)
     }).catch(reject)
  })
 
}


api.getUserIdFromUnionId = async (unionId) =>{
   let ACCESS_TOKEN = await api.getAccessToken()
  return new Promise((resolve, reject) => {
   
    return axios.get(`https://oapi.dingtalk.com/user/getUseridByUnionid?access_token=${ACCESS_TOKEN}&unionid=${unionId}`).then(res=>{
      debug("GETUSER:",res)
      if(res.errcode){
        throw(res.errmsg)
      }
      let {userid} = res.data
      resolve(userid)
    }).catch(e=>{
      reject(e)
    })
  })
}

api.getUserIdFromPhone = async (phone)=>{
  let ACCESS_TOKEN = await api.getAccessToken()
  return new Promise((resolve, reject) => {
        return axios.get(`https://oapi.dingtalk.com/user/get_by_mobile?access_token=${ACCESS_TOKEN}&mobile=${phone}`).then(res => {
           debug("USERINFO", res)
          let {
            userid
          } = res.data
          resolve(userid)
        }).catch(e => {
          reject(e)
        })
      })

}


api.getUserInfo = async (userId) =>{
    let ACCESS_TOKEN = await api.getAccessToken()
   return new Promise((resolve, reject) => {
         return axios.get(`https://oapi.dingtalk.com/user/get?access_token=${ACCESS_TOKEN}&userid=${userId}`).then(res => {
          
           let userinfo = res.data
           resolve(userinfo)
         }).catch(e => {
           reject(e)
         })
       })

}


api.sendNoticeByPhone = async ({phone,msg})=>{
   let ACCESS_TOKEN = await api.getAccessToken()
   let userid = await api.getUserIdFromPhone(phone)
      return axios.post(`https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${ACCESS_TOKEN}`, {
        agent_id: agentId,
        userid_list:userid,
        msg:{
          "msgtype":"text",
          "text":{
            "content":msg
          }
        }})
}

api.sendNotice = async ({
  ding_id,
  msg
}) => {
  let ACCESS_TOKEN = await api.getAccessToken()
  console.log('DING-msg:',ding_id,msg)
  return axios.post(`https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${ACCESS_TOKEN}`, {
    agent_id: agentId,
    userid_list: ding_id,
    msg: {
      "msgtype": "text",
      "text": {
        "content": msg
      }
    }
  })
}

/** getEmployeeIds
 * 
 * 
 *  @return {data_list,next_cursor}
 */
api.getEmloyeeIds = async (status_list = "2,3,5,-1",offset = 0,size = 50) =>{
  let ACCESS_TOKEN = await api.getAccessToken()
  return new Promise((resolve,reject)=>{
     return axios.post(`https://oapi.dingtalk.com/topapi/smartwork/hrm/employee/queryonjob?access_token=${ACCESS_TOKEN}`, {
       status_list,
       offset,
       size
     }).then(res=>{
       let data = res.data.result
       resolve(data)
     }).catch(reject)
  })
  
}



/** getEmployeeList
 * 
 * @return {users}
 */
api.getEmployeeList = async (userid_list,field_filter_list)=>{
let ACCESS_TOKEN = await api.getAccessToken()
return new Promise((resolve,reject)=>{
  return axios.post(`https://oapi.dingtalk.com/topapi/smartwork/hrm/employee/list?access_token=${ACCESS_TOKEN}`, {
    userid_list,
    field_filter_list
  }).then(res=>{
    let data = res.data.result
    resolve(data)
  })
})

}


api.getEmployeeInfoList = async (dep_id = 1)=>{
  let ACCESS_TOKEN = await api.getAccessToken()
  return new Promise((resolve, reject) => {
    return axios.get(`https://oapi.dingtalk.com/user/listbypage?access_token=${ACCESS_TOKEN}&department_id=${dep_id}&offset=0&size=100`).then(res => {
      debug("EMPLOYEE:",res)
      let data = res.data.userlist
      resolve(data)
    })
  })
  
}


api.getExternelContactList = async ()=>{
   let ACCESS_TOKEN = await api.getAccessToken()
   return new Promise((resolve, reject) => {
     return axios.post(`https://oapi.dingtalk.com/topapi/extcontact/list?access_token=${ACCESS_TOKEN}`,{size:100,offset:0}).then(res => {
       debug("EMPLOYEE:", res)
       let data = res.data.results
       resolve(data)
     })
   })
  
}


api.getGroups = async (parent_id=1) => {
   let ACCESS_TOKEN = await api.getAccessToken()
   return new Promise((resolve, reject) => {
     let service = `https://oapi.dingtalk.com/department/list?access_token=${ACCESS_TOKEN}`
     if(parent_id)
      service += `&id=${parent_id}`
     return axios.get(service).then(res => {
      
       let data = res.data.department
       resolve(data)
     })
   })
}

api.getNotices = async (userid) => {
  let ACCESS_TOKEN = await api.getAccessToken()
  return new Promise((resolve, reject) => {
    return axios.post(`https://oapi.dingtalk.com/topapi/blackboard/listtopten?access_token=${ACCESS_TOKEN}`,{userid}).then(res => {
      debug("EMPLOYEE:", res)
      let data = res.data.blackboard_list
      resolve(data)
    })
  })
}

module.exports = api