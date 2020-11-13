const Models = require('../models')


const install = async (forced) => {
  try{
    for (m in Models) {
      let model = Models[m]
      console.info(`[model] (${m}) installing...`)
      if (model.initdb) {
        
        await model.initdb(forced)
      }
    }
  }catch(e){
    console.error(`[model] (${m}) failed.: ${e}`)
  }
}



module.exports = install