
exports.up = function(knex) {
  return Promise.all([
  knex.schema.createTable('workflow', function (table) {
    table.uuid('id').index();
    table.string ('name',32);
    table.string ('desc',128);
    table.integer('flow_type');
    table.datetime('created_at');
    table.uuid('created_by');
  }),
  knex.schema.createTable('workflow_node', function (table) {
    table.uuid('id').index();
    table.uuid('flow_id');
    table.integer('type_id');
    table.string ('name',32);
    table.text('view');
  }),
  knex.schema.createTable('workflow_action', function (table) {
    table.uuid('id').index();
    table.uuid('workflow_id');
    table.uuid('from');
    table.uuid('to');
    table.string ('name',32);
    table.integer('type_id');
  }),
  knex.schema.createTable('workflow_field', function (table) {
    table.uuid('id').index();
    table.uuid('workflow_id');
    table.string ('name',32);
    table.integer('type_id');
    table.text('option');
  }),
  knex.schema.createTable('workflow_instance', function (table) {
    table.uuid('id').index();
    table.uuid('workflow_id');
    table.text('states');         //adundant field:executors
    table.text('executors');      //adudant field:executors
    table.datetime('created_at');
    table.datetime('updated_at');
    table.uuid('created_by');
    table.uuid('updated_by');
  }),
  knex.schema.createTable('workflow_data', function (table) {
    table.uuid('id').index();
    table.uuid('field_id');
    table.uuid('workflow_id');
    table.uuid('node_id');
    table.uuid('record_id');
    table.integer('version').defaultTo(0);
    table.text('value');
    table.integer('stage');   // 0 - basic  // 1 - config  // 2 - runtime
  }),
  knex.schema.createTable('workflow_record', function (table) {
    table.uuid('id').index();
    table.uuid('workflow_id');
    table.datetime('created_at');
    table.datetime('updated_at');
    table.uuid('created_by');
    table.uuid('updated_by');
  }),
  knex.schema.createTable('user_workflow', function (table) {
    table.increments('id').index();
    table.uuid('workflow_id');
    table.uuid('user_id');
  }),
  ])

};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('workflow'),
    knex.schema.dropTable('workflow_action'),
    knex.schema.dropTable('workflow_field'),
    knex.schema.dropTable('workflow_instance'),
    knex.schema.dropTable('workflow_node'),
    knex.schema.dropTable('workflow_record'),
    knex.schema.dropTable('workflow_data'),
    knex.schema.dropTable('user_workflow'),
]);
};
