const {
  Q,
  D,
  U
} = require('../../models/index')
const CreateRestfulController = U.CreateRestfulController
const config = {
  prefix: 'PROJECT',
}

let controller = CreateRestfulController(Q, 'project', config)
module.exports = controller