const Models = require('../models')


const InstallModel = async (MODELS,m,forced)=>{
  let model = MODELS[m]
  if(!model){
    console.error(`[model] model ${m} is not defined`)
    return
  }
  
  if(!model.initdb || model.inited)
    return

  if(Array.isArray(model.required)){
    for(let i=0;i<model.required.length;i++)
      await InstallModel(MODELS,model.required[i],forced)
  }

  await model.initdb(forced)
  model.inited = true
  console.log(` - [model] ${m} inited.`)
}


const install = async (forced) => {
  try{
    for (m in Models) 
      await InstallModel(Models,m,forced)
  }catch(e){
    console.error(`[model] (${m}) failed.: ${e}`)
  }
}



module.exports = install