
exports.up = function(knex) {
  return Promise.all([
        knex.schema.createTable('project_user', function (table) {
          table.increments('id').index();
          table.string('user_id', 64);
          table.string('project_id', 64);
          table.integer('role_id');
        })])
};

exports.down = function(knex) {
  return Promise.all([
        knex.schema.dropTable('project_user')
  ])
};
