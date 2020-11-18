const {Type} = require('../models')

const out = {}



out.List = async (ctx)=>{
  let types = await Type.getTypes()
  return types
}







module.exports = out