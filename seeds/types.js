
const DEFAULT_TYPES = [{
  id: 10, //"sys_role_type",
  name:"角色类型" ,
  key:'role_type',
  values:['通用角色','项目角色','部门角色']
},{
  id: 30,//'sys_permission_type',
  name:"权限类型",
   key: 'permission_type',
   values:['操作权限','访问权限']
    
},{
  id:40, //"sys_project_type"
  name:"项目类型",
  key:"project_type",
  values:['工程建设','软件研发','组织活动','其他类型']
},{
  id:60,
  name:"建筑类型",
  key:"build_type",
  values:['学校']
},{
  id:80,
  name:"项目服务类型",
  key:"project_service_type",
  values:['项目管理','市政监理','房建监理','BIM咨询','造价咨询','招标代理']
},{
  id:100,
  name:'项目地点',
  key:'project_location',
  values:['鄞州','慈城','厦门']
}

]

exports.seed = function(knex) {
    let types = []
    DEFAULT_TYPES.forEach(v=>{
      types.push({
        id:v.id,
        name:v.name,
        key:v.key
      })

      if(v.values){
        v.values.forEach((e,i)=>{
          types.push({
            id:v.id+i+1,
            parent_id:v.id,
            name:e
          })
        })
      }
    })

    let InitType = knex('type').del().then(()=>{
      return knex('type').insert(types)
    })

    return Promise.all([ InitType])
};
