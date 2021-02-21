const Models = require('../models')
const U = require('./util')
const ent_ids = []
const InstallModel = async (MODELS,m,forced)=>{
  let model = MODELS[m]
  if(!model){
    console.error(`[model] model ${m} is not defined`)
    return
  }
  
  if (!model.init && !model.initdb && !model.initdb_e && !model.init_e)
    return model

  if(Array.isArray(model.required)){
    for(let i=0;i<model.required.length;i++)
      await InstallModel(MODELS,model.required[i],forced)
  }

  if(!model.inited){
    model.inited = true
    if (model.initdb) {
      await model.initdb(forced)
      if(forced)
        console.log(m,"- Base Installed")
    }

    if(model.initdb_e) {
      let Enterprise = await InstallModel(MODELS,'Enterprise',forced)
      if (Enterprise) {
        let ent_ids = await Enterprise.getEnterpriseList()
        for(let i=0;i<ent_ids.length;i++){
          await model.initdb_e(ent_ids[i].id, forced)
          if(model.init_e){
            await model.init_e(ent_ids[i].id,forced)
          }
        }
      }
      if (forced)
        console.log(m,"- Enterprise Installed")
    }

    if (model.init) {
      await model.init(forced)
    }

   
  } 

  return model
}


const install = async (forced) => {
  try{
    for (m in Models) 
      await InstallModel(Models,m,forced)
  }catch(e){
    console.error(`[model] (${m}) failed.: ${e}`)
  }
}



module.exports = {install}