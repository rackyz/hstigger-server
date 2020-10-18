// SYSTEM_DEFINED
//  INT < 1000
//  CHAR contains 'sys'

const DEFAULT_TYPES = [{
  id: 10, //"sys_role_type",
  name:"角色类型" ,
  key:'role_type'
},{
  id: 11, //"sys_common_role",
  parent_id:10,
  name:"通用角色",
},{
  id: 12, //"sys_project_role",
  parent_id: 10,
  name:"项目角色",
}, {
  id: 20, //"sys_dep_role",
  parent_id: 10,
  name: "部门角色" 
}, {
  id: 30,//'sys_permission_type',
  name:"权限类型",
   key: 'permission_type'
    
},{
  id: 31,//"sys_action_permission",
  parent_id: 30,
  name:"操作权限",
    
},{
  id: 32,//"sys_access_permission",
  parent_id: 30,
  name:"访问权限",
    
},{
  id:40,
  name:"项目类型",
}

]

const DEFAULT_USERS = [
  {
  id: "sys_root",
  user: 'root',
  password: 'root',
  name: '超级管理员'
}]

const DEFAULT_DEPS = [
  {
    id: 1,//"sys_my_enterprise",
    name: "我的企业",
    color: "#333",
     
  },
  {
    id: 2,//"sys_outter_company",
    name: "外部公司",
    color: "#333",
     
  },
  {
    id: 11,//"sys_leaders",
    parent_id: 1,
    name: "领导层",
    color: "#red",
  },{
    id:12,// "sys_financial_room",
    parent_id: 1,
    name:"财务室",
    color:"blue"
  },{
    id: 13,//"sys_chief_engineer_roome",
    parent_id:1,
    name:"总师室",
    color:"orange"
  },{
    id: 14 , // "sys_early_deparment",
    parent_id: 1 ,//"my_enterprise",
    name:"前期部",
    color:"#333"
  }, {
    id:15 ,// "sys_tech_deparment",
    parent_id: 1,//"my_enterprise",
    name: "技术部",
    color: "#333"
  }, {
    id:16,// "sys_pm_deparment",
    parent_id: 1,//"my_enterprise",
    name: "项目管理部",
    color: "#333"
  }, {
    id: 17,//"sys_contract_deparment",
    parent_id: 1,//"my_enterprise",
    name: "合约部",
    color: "#333"
  }, {
    id: 18,//"sys_tendering_deparment",
    parent_id: 1,//"my_enterprise",
    name: "招标部",
    color: "#333"
  }, {
    id:19,// "sys_billing_deparment",
    parent_id: 1,//"my_enterprise",
    name: "投标部",
    color: "#333"
  }, {
    id: 20,//"sys_admin_deparment",
    parent_id: 1,//"my_enterprise",
    name: "办公室",
    color: "#333"
  }
]

const DEFAULT_ROLES = [{
  id: 1,//"sys_role_admin",
  type_id:11,
  name:"系统管理员",
  color:"darkred",
  icon:'logo-twitter',
  desc:"具有系统的所有操作权限"
}, {
  id: 2, //"sys_role_ob",
  type_id: 11,
  name: "公司领导",
  icon: "md-star",
  color: "orange",
   desc: "具有所有数据查看权限"
} ,{
  id:3,//"sys_role_user",
   type_id: 11,
  name:"公司员工",
  color:"#aaa",
  icon:'ios-person',
  desc:"具有公司基本操作权限"
},{
   id: 4,//"sys_role_guest",
     type_id: 11,
     name: "外部人员",
     color: "#aaa",
     icon: 'ios-person-outline',
     desc:"仅供外部人员使用"
},{
  id:5, //"sys_project_manager",
  type_id:12,
  name:"项目经理",
  icon:"ios-voice",
  desc:"项目主要负责人"
},{
  id:6,
  name:"关注者",
  icon:"ios-eye",
  desc:"关注项目的人"
}]

exports.seed = function(knex) {
  // Deletes ALL existing entries
  let InitUser = knex('user').del()
    .then(function () {
      // Inserts seed entries
      return knex('user').insert(DEFAULT_USERS);
    });
  
  // Init Deps
  let InitDep = knex('dep').del()
    .then(()=>{
      return knex('dep').insert(DEFAULT_DEPS)
    })

  
    let InitRole = knex('role').del()
    .then(() => {
      return knex('role').insert(DEFAULT_ROLES)
    })

    let InitType = knex('type').del().then(()=>{
      return knex('type').insert(DEFAULT_TYPES)
    })

    let InitUserRole = knex('role_user').del().then(()=>{
      return knex('role_user').insert({user_id:'root',role_id:'1'})
    })

    return Promise.all([InitDep, InitRole, InitType, InitUserRole])
};
