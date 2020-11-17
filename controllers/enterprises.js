const {Enterprise} = require('../models')

let out = {}


out.List = async (ctx)=>{
  return await Enterprise.getEnterpriseListFull()
}


module.exports = out