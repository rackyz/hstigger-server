exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable("session",function (table){
      table.string('id',256).index()
      table.uuid('user_id').notNullable ()
      table.datetime('login_at').notNullable ()
      table.integer('expire_time').notNullable ()
      table.string('client_device',256).notNullable ()
      table.string('ip',16).notNullable ()
    }), 
    knex.schema.createTable('user', function (table) {
      table.uuid('id').index();
      table.string('user',16).unique();
      table.string('phone',16).unique();
      table.string('password',32).notNullable();
      table.string('frame',16);
      table.string('name',32);
      table.text('avatar');
      table.datetime('lastlogin_at');
      table.datetime('created_at');
      table.uuid('created_by');
      table.integer('state').defaultTo(0);
    }),
    knex.schema.createTable("type", function (table) {
      table.increments('id').index();
      table.string('key', 32);
      table.integer('parent_id');
      table.string('name',64).notNullable ();
      table.string('color',16).defaultTo('#000000');
      table.string('data',32);
      table.boolean('add');
      table.boolean('edit');
      table.boolean('del');
     
    }), 
    knex.schema.createTable('dep', function (table) {
      table.increments('id').index();
      table.integer('parent_id')
      table.string('name',64).notNullable ();
      table.string('color',16).defaultTo('#000000');
      table.string('data',32);
    }),
    knex.schema.createTable("role", function (table) {
      table.increments('id').index();
      table.integer('type_id');
      table.string('name',64).notNullable ();
      table.string('icon',32).notNullable();
      table.string('color',16).defaultTo('#000000');
      table.string('data',32);
      table.string('desc',64);
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


    ...['type','dep','role','task','file','archive'].map(v=>
      knex.schema.raw(`ALTER TABLE ${v} AUTO_INCREMENT=1000`))
    
  ]);
}

exports.down = function(knex){
  return Promise.all([
    knex.schema.dropTable('type'),
    knex.schema.dropTable('session'),
    knex.schema.dropTable('user'),
    knex.schema.dropTable('dep'),
    knex.schema.dropTable('role'),
    knex.schema.dropTable('task'),
    knex.schema.dropTable('file'),
    knex.schema.dropTable('archive'),
    knex.schema.dropTable('dep_user'),
    knex.schema.dropTable('role_user')
  ]);
}