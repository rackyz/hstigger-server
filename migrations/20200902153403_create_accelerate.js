
exports.up = function(knex) {
   return Promise.all([
         knex.schema.createTable('accelerate', function (table) {
           table.increments('id').index();
           table.string('user_id', 32);
           table.string('key', 32);
         })])
};

exports.down = function(knex) {
   return Promise.all([
         knex.schema.dropTable('accelerate')
   ])
};
