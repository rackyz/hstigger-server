
exports.up = function(knex) {
  return Promise.all([
        knex.schema.createTable('project', function (table) {
          table.increments('id').index();
          table.string('code',32);
          table.string('name',64).notNullable ();
          table.integer('project_type').notNullable();
          table.integer('state_type').defaultValue(0);
          table.text('avatar');
         
          table.datetime('created_at');
          table.uuid('created_by');
        }),

        knex.schema.createTable('project_architecture_info',function(table){
          table.integer('id').index()
          table.integer('contract_type').notNullable ();
          table.integer('building_type').notNullable ();
          table.float('area');
          table.float('building_area');
          table.float('building_height');
          table.integer('levels');
          table.float('amount');
        }),

        knex.schema.createTable('project_user', function (table) {
          table.increments('id').index();
          table.string('user_id', 64);
          table.string('project_id', 64);
          table.integer('role_id');
        }),

        ...['project'].map(v=>
          knex.schema.raw(`ALTER TABLE ${v} AUTO_INCREMENT=1000`))
      
      
      ])
};

exports.down = function(knex) {
  return Promise.all([
      knex.schema.dropTable('project'),
      knex.schema.dropTable('project_architecture_info'),
      knex.schema.dropTable('project_user')
  ])
};
