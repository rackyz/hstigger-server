
const DEFAULT_TYPES = [{
  id: 100, //"sys_role_type",
  name:"角色类型" ,
  key:'role_type',
  values:['通用角色','项目角色','部门角色']
},{
  id: 200,//'sys_permission_type',
  name:"权限类型",
   key: 'permission_type',
   values:['操作权限','访问权限']
    
},{
  id:300, //"sys_project_type"
  name:"项目类型",
  key:"project_type",
  values:[{
    name:'工程建设',
    key:'project_arch_type',
    values: ['项目管理', '市政监理', '房建监理', 'BIM咨询', '造价咨询', '招标代理']}
    ,{
      name: '软件研发',
      key:'it_project',
      values: ['综合信息系统', '桌面程序', '插件开发', '移动端开发', 'WEB应用', '其他']
    } , {
      name:'组织活动',
      key:'organization',
      values: ['年会', '团建活动', '问卷调查', '其他']
    },
      '其他类型']
},{
  id:400,
  name:"建筑类型",
  key:"build_type",
  values:['学校']
},{
  id:500,
  name:'项目地点',
  key:'project_location',
  values:['鄞州','慈城','厦门']
},{
  id:600,
  name:'流程类型',
  key:"flow_type",
  values:['员工通用','行政综合','项目管理']
}

]

exports.seed = function(knex) {
    let types = []
    DEFAULT_TYPES.forEach(v=>{
      types.push({
        id:v.id,
        name:v.name,
        parent_id:v.parent_id,
        key:v.key
      })

      if(v.values){
        v.values.forEach((e,i)=>{
          if(typeof e == 'object'){
            e.id = v.id + (i + 1) * 10
            types.push({
              id:e.id,
              name:e.name,
              parent_id:v.id,
              key:e.key
            })

            if(e.values){
              e.values.forEach((f,j)=>{
                types.push({
                  id: e.id + j + 1,
                  parent_id:e.id,
                  name: f
                })
              })
            }
          }else{
            types.push({
              id: v.id + (i + 1) * 10,
              parent_id: v.id,
              name: e
            })
          }
          
        })
      }
    })

    let InitType = knex('type').del().then(()=>{
      return knex('type').insert(types)
    })

    return Promise.all([ InitType])
};
