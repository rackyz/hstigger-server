exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable("session",function (table){
      table.string('id',256).index()
      table.uuid('user_id').notNullable ()
      table.datetime('login_at').notNullable ()
      table.integer('expire_time').notNullable ()
      table.string('client_device',32).notNullable ()
      table.string('ip',16).notNullable ()
    }), 
    knex.schema.createTable('user', function (table) {
      table.uuid('id').index();
      table.string('user',16).unique();
      table.string('phone',16).unique();
      table.string('password',32).notNullable();
      table.string('name',32);
      table.text('avatar');
      table.datetime('created_at');
      table.uuid('created_by');
      table.integer('state').defaultTo(0);
    }),
    knex.schema.createTable("type", function (table) {
      table.increments('id').index();
      table.string('key', 16);
      table.integer('parent_id');
      table.string('name',64).notNullable ();
      table.string('color',16).notNullable ();
      table.string('data',32).notNullable ();
      table.boolean('add');
      table.boolean('edit');
      table.boolean('del');
     
    }), 
    knex.schema.createTable('dep', function (table) {
      table.increments('id').index();
      table.integer('parent_id')
      table.string('name',64).notNullable ();
      table.string('color',16).notNullable ();
      table.string('data',32).notNullable ();
    }),
    knex.schema.createTable("role", function (table) {
      table.increments('id').index();
      table.string('name',64).notNullable ();
      table.string('icon',32).notNullable();
      table.string('color',16).notNullable ();
      table.string('data',32)
      table.string('desc',64)
    }),
    knex.schema.createTable('project', function (table) {
      table.increments('id').index();
      table.string('name',64).notNullable ();
      table.integer('state').notNullable();
      table.integer('contract_type').notNullable ();
      table.integer('building_type').notNullable ();
      table.float('area');
      table.float('building_area');
      table.float('building_height');
      table.integer('levels');
      table.float('amount');
      table.string('data',32).notNullable ();
      table.datetime('created_at');
      table.uuid('created_by');
    }),

    knex.schema.createTable('task', function (table) {
      table.increments('id').index();
      table.integer('parent_id');
      table.integer('root_id');
      table.string('name',64).notNullable ();
      table.integer('state').notNullable();
      table.integer('task_type').notNullable ();
      table.integer('duration');
      table.uuid('charger');
      table.datetime('start_at');
      table.datetime('finish_at');
      table.datetime('created_at');
      table.uuid('created_by');
    }),

    knex.schema.createTable("file", function (table) {
      table.increments('id').index();
      table.string('name',64).notNullable ();
      table.string('url',64).notNullable ();
      table.integer('dlcount').notNullable ().defaultTo(0) ;
      table.datetime('created_at');
      table.uuid('created_by');
    }),

    knex.schema.createTable("archive", function (table) {
      table.increments('id').index();
      table.integer('parent_id');
      table.integer('root_id');
      table.string('name',64).notNullable ();
      table.string('desc',512);
      table.text('data');
      table.text('files').notNullable ();
      table.integer('dlcount').notNullable ().defaultTo(0) ;
      table.datetime('created_at');
      table.uuid('created_by');
    }),


    
    knex.schema.createTable('dep_user', function (table) {
      table.increments('id').index();
      table.integer('dep_id');
      table.uuid('user_id');
      table.uuid('role_id');
    }),


    knex.schema.createTable('role_user', function (table) {
      table.increments('id').index();
      table.integer ('role_id');
      table.uuid('user_id');
    }),


    ...['type','dep','role','project','task','file','archive'].map(v=>
      knex.schema.raw(`ALTER TABLE ${v} SET AUTO_INCREMENT=1000`))
    
  ]);
}

exports.down = function(knex){
  return Promise.all([
    knex.schema.dropTable('session'),
    knex.schema.dropTable('user'),
    knex.schema.dropTable('dep'),
    knex.schema.dropTable('role'),
    knex.schema.dropTable('project'),
    knex.schema.dropTable('task'),
    knex.schema.dropTable('file'),
    knex.schema.dropTable('archive'),
    knex.schema.dropTable('dep_user'),
    knex.schema.dropTable('role_user')
  ]);
}