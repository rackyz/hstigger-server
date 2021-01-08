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
out.APIObject = {}

const APIFrame ={
      public: {
        Name: "通用接口",
        Desc: "无需登录可直接访问的接口",
      },
      core: {
        Name: "登录用户接口",
        Desc: "普通登录用户对应的接口",
      },
      enterprise: {
        Name: "企业级用户接口",
        Desc: "企业级用户相关接口",
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
  if (out.APIObject)
    return out.APIObject
  else{
    GetAPIPage(root)
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
  console.log(o.APIObject)
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
        return `<li class="attr"><span class='attr-mark'>${v}</span> ${root.AuthDesc || ''}</li>`
      }
      console.log(`root:[${root.root}]`, out.APIObject[root.root])
      out.APIObject[root.root][v] = {
        path:api,
        option:root[v+'Option']
      }
      return `<li class='api'><span class='api-mark'>${v}</span> ${api} ${root[v+'Desc']?"<br /><div class='desc'>"+root[v+'Desc']+"</div>":""}</li>`
    } else if (typeof o == 'object') {
      if (v != 'core')
        o.path = path = path + '/' + v
      o.root = root.root || v
      return `<li class="${!o.isCollection?'dir':'ctl'}">${v} ${o.Name || ''} ${o.Desc?'<br /><div class="desc">'+o.Desc+'</div>':''} </li><ul>${RenderAPI(o)}</ul>`
    } else
      return ""
  }).join('')
}

out.SendAPIDoc = ctx => {
  ctx.body = `
    <div>
      <h1>高专企业信息平台接口文档  <span class='api-mark'>1.0.0</span><br /> <div style='font-weight:normal;font-size:20px;line-height:20px;color:#aaa;'>iNBGZ Enterprise Information Platform API</div> </h1>
      <div class="desc" style='margin-bottom:30px;'>高专企业云接口采用RESTFUL风格</div>
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
      color:red;
    
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
    }
    .attr{
      font-size:5px;
      padding:5px;
    }

    .attr-mark{
      padding:2px 5px;
      font-size:10px;
      color:orange;
      background: #555;
    }
    .desc{
      font-size:12px;
      border-top:1px solid #dfdfdf;
      padding:5px 0;
      margin-top:5px;
      color:#aaa;
    }
    </style>`
}


module.exports = out