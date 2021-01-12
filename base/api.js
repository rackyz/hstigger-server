const { query } = require("../models/Article")

let out = {}
const APIMap = {

  List: "GET {path}",
  Patch: "PATCH {path}/:id",
  Get: "GET {path}/:id",
  Post: "POST {path}",
  Delete: "DELTE {path}/:id",
  PostAction: "POST {path}/:action",
  Related: "GET {path}/:related",
  AddRelated: "POST {path}/:related/:relatedId",
  DelRelated: "DELETE {path}/:related/:relatedId"
}


out.APIPage = ""
out.APIObject = {
  core:{},
  public:{},
  enterprise:{},
  entadmin:{},
  admin:{}
}

const APIFrame ={
      public: {
        Name: "通用接口",
        Desc: "无需登录可直接访问的接口",
      },
      core: {
        Name: "登录用户接口",
        Desc: "普通登录用户接口",
      },
      enterprise: {
        Name: "企业级用户接口",
        Desc: "企业数据接口",
      },
      entadmin: {
        Name: "企业管理接口",
        Desc: "企业管理后台接口",
      },
      admin: {
        Name: "平台管理接口",
        Desc: "平台管理后台接口",
      }
    }

out.GetAPIObject = (root)=>{
  if (out.APIObject && out.APIObject.inited)
    return out.APIObject
  else{
    out.APIObject.inited = false
    GetAPIPage(root)
    out.APIObject = 
    out.APIObject.inited = true
    return out.APIObject
  }
}

GetAPIPage = (root) => {
  if (out.APIPage)
    return out.APIPage
  if (!root)
    return
  let frame = {...APIFrame}
  for (let x in root) {
    if (root[x]  && root[x].isCollection) {
      frame.core[x] = root[x]
    } else if (frame[x] && root[x]) {
      Object.assign(frame[x], root[x])
      out.APIObject[x] = {}
    }
  }

  let html = RenderAPI(frame)
  console.log(out.APIObject)
  return html
}

const RenderAPI = (root) => {
  let keys = Object.keys(root)
  return keys.map(v => {
    let o = root[v]
   
    let path = root ? (root.path || '') : ''
    if (typeof o == 'function') {
      let api = APIMap[v]
      if (api) {
        api = api.replace('{path}', path)
      } else {
        return `<li class="attr"><span class='attr-mark'>AUTH</span> ${root.AuthDesc || ''}</li>`
      }
      let key = (v + '_' + root.key).toUpperCase()
      console.log("root:",root.root)
      out.APIObject[root.root][key] = {
        url: api,
        
      }
      let option = root[v + 'Option'] 
      if (option){
        out.APIObject[root.root][key].option = option
      }

      let queryOption = root[v + 'QueryOption']
      let paramsOption = root[v + 'ParamsOption']
      let throwOption = root[v + 'ThrowOption']
      let domQuery = ""
      let domParams = ""
      let domOption = ""
      let domThrow = ""
      if(option)
        domOption = "- <span class='opt-mark'>OPTION</span>" + renderOption(option) + "<br />"

      if(queryOption)
        domQuery = "- <span class='opt-mark'>QUERY</span>" + renderHelper(queryOption) + "<br />"
      
      if (paramsOption)
        domParams = "- <span class='opt-mark'>PARAMS</span>" + renderHelper(paramsOption) + "<br />"

        if (throwOption)
          domThrow = "- <span class='opt-mark'>THROW</span>" + renderHelper(throwOption) + "<br />"

      return `<li class='api'><span class='api-mark'>${key}</span> ${api} ${root[v+'Desc']?"<br /><div class='desc'>"+root[v+'Desc']+"</div>":""} <div style='color:#aaa'>${domParams} ${domQuery} ${domOption} ${domThrow}</div></li>`
    } else if (typeof o == 'object' && o) {
      if(v.includes('Option'))
        return ""
      o.url = o.url || null
      o.Name = o.Name || null
      o.Desc = o.Desc || null
      // Accelerate Named API
      if(o.url){
        out.APIObject[root.root][v.toUpperCase()] = {url:o.url}
        if(o.option){
          out.APIObject[root.root][v.toUpperCase()].option = o.option
        }
         return `<li class='api'>-<span class='api-mark' style='background:orange;margin-left:5px;'>${v}</span> ${o.url} ${o.desc?"<br /><div class='desc' style='margin-left:10px'>"+o.desc+"</div>":""}</li>`
      }

      if (v != 'core')
        o.path = path = path + '/' + v
      console.log(root.root,v)
      o.root = root.root || v
      o.key = v
      return `<li class="${!o.isCollection?'dir':'ctl'}">${v} ${o.Name || ''} ${o.Desc?'<br /><div class="desc">'+o.Desc+'</div>':''} </li><ul>${RenderAPI(o)}</ul>`
    } else
      return ""
  }).join('')
}
renderHelper = option=>{
   if (!option)
     return ""

   let domTable = '<table  cellpadding="0" cellspacing="0" border="1"><tbody>'
   for (x in option) {
     let tr = `<tr><td>${x}</td><td>${option[x]}</td></tr>`
     domTable += tr
   }
   domTable += '</tbody></table>'
   return domTable
}
renderOption = option=>{
  if(!option)
    return ""
  
  let domTable = '<table  cellpadding="0" cellspacing="0" border="1"><tbody>'
  for(x in option){
    let tr = `<tr><td>${x}</td><td>${option[x]}</td></tr>`
    domTable += tr
  }
  domTable += '</tbody></table>'
  return domTable
}

out.SendAPIDoc = ctx => {
  ctx.body = `
    <link rel="shortcut icon" href="https://nbgzfiles-1257839135.cos.ap-shanghai.myqcloud.com/files/avatars/favicon.ico" />
    <title>高专企业信息平台接口文档</title>
    <div>
      <h1>高专企业信息平台接口文档  <span class='api-mark'>1.0.0</span><br /> <div style='font-weight:normal;font-size:20px;line-height:20px;color:#aaa;'>iNBGZ Enterprise Information Platform API</div> </h1>
      <div class="desc" style='margin-bottom:30px;padding:20px'>高专企业信息平台，是宁波高专建设监理有限公司开发的企业管理信息系统，基于数字化理念，打造集企业管理（OA）、任务、流程、项目管理、文件上传等多个模块服务一体化的多端信息平台。<br />平台接口API采用RESTFUL风格,接口按访问权限可分为五类（通用、用户、企业、企业管理、平台管理）。<div style='margin-top:5px'>接口类型：
      <div style='margin-left:10px;line-height:25px;'><span class="api-mark">原生接口</span> RESTFUL规范的默认接口</div>
      <div style='margin-left:10px;line-height:25px;'><span class="api-mark" style='background:orange;'>速记接口</span> 别名,方便快速调用提供的快捷接口</div>
      </div>
      <div style='line-height:24px'>
      接口使用说明:<br />
      &nbsp;&nbsp;1 - <b>权限验证 <span class='attr-mark'>AUTH</span></b>
      <span style=''>权限由服务器接口自行判断，客户端的权限时基于Bearer Token的验证方式</span><br />
      <span style='margin-left:40px'><b>用户token</b> headers.Authorization = Bearer Token</span> <br />
      <span style='margin-left:40px'><b>版本version</b> headers[api-version] = v0</span> <br />
      <span style='margin-left:40px'><b>企业id</b> headers.enterprise_id=ent_id <br /></span> 
      &nbsp;&nbsp;2 - <b>路径参数 <span class='opt-mark'>PARAMS</span></b> 用于RESTFUL路径中的参数,如 :id / :object / :related <br />
      &nbsp;&nbsp;3 - <b>查询参数 <span class='opt-mark'>QUERY</span></b> 用于URL中传递的参数，多用于查询条件,q=?&type=? <br />
      &nbsp;&nbsp;4 - <b>错误反馈 <span class='opt-mark'>THROW</span></b> <b>通用错误</b>直接返回文本错误信息，<b>表单错误</b>返回字段和错误信息，其余<b>系统错误</b>返回状态码403,404,501等 <br />
      </div>
       <div style='line-height:24px'>
      接口使用方法:<br />
      &nbsp;&nbsp;1 - 可直接使用<b>http-request/axios</b>进行访问, 如axios.post("https://api.hstigger.com/sessions",formData)<br />
      &nbsp;&nbsp;2 - <b>接口API清单</b>可通过设置headers[api-version]设置对应的版号后,使用GET/获取,如axios.get("https://api.hstigger.com/sessions",{headers:{['api-version']:'v1'}})<br />
      &nbsp;&nbsp;3 - <b>接口API文档</b>可以使用浏览器访问接口服务器地址(<a href="#">https://api.hstigger.com</a>)获取<br />
      </div>
      </div>
      
      ${GetAPIPage(ctx.apiRoot)}
    </div>
    <style>
    html{
      background:#dfdfdf;
    }
    body{
      background:#fff;
      color:#333;
      width:960px;
      margin:0 auto;
      padding:20px 60px;
    }
    .flex{
      display:flex;
      align-items:center;
    }
    h1{padding:10px 0;padding-bottom:0;margin-bottom:0;}
    ul{
      margin-top:5px;
      padding-left:25px;
    }
    li{
      list-style:none;
      margin:0;
       width: auto;
    }
    b{
      color:#888;
      margin:0 2px;
    }
    .dir{
      border-radius:5px;
      
      color:#333;
    }
    .ctl{
      border-radius:5px;
      padding:2px 8px;
      color:orange;
    
    }
    .api{
      font-size:12px;
      padding:5px;
    }
    .api-mark{
      padding:2px 5px;
      border-radius:5px;
      font-size:10px;
      color:#fff;
      background: #555;
      font-weight:bold;
     
    }
    .attr{
      font-size:5px;
      padding:5px;
    }

    .attr-mark{
      padding:2px 5px;
       border-radius:5px;
      font-size:10px;
       border:1px solid orange;
      color:orange;
    }

    .opt-mark{
      padding:0;
      font-weight:bold;
      font-size:10px;
      color: orange;
    }
    .desc{
      font-size:12px;
      border-top:1px solid #dfdfdf;
      padding:5px 0;
      margin-top:5px;
      color:#aaa;
    }

    table{
      font-size:12px;
       border-collapse:collapse;
       margin:5px;
       margin-left:10px;
       margin-top:5px;
       color:#dfdfdf;
    }
    table td,tr,th{
    border-width: 1px;
    border-style: solid;
   
    border-color:#dfdfdf;
    }

    /* Padding and font style */
    table th{
      background: #dfdfdf;
      color:#fff;
    }
    table td, table th {
    padding: 2px 5px;
    font-size: 12px;
    font-family: Verdana;
    color: #aaa;
    text-align:center;
    }

    /* Alternating background colors */
    table tr:nth-child(even) {
    background: rgb(238, 211, 210)
    }
    table tr:nth-child(odd) {
    background: #FFF
    }
    </style>`
}




module.exports = out