exports.up = function (knex) {
  return Promise.all([
   
    knex.schema.createTable('account', function (table) {
      table.uuid('id').index();
      table.string('user',16).unique();
      table.string('phone',16).unique();
      table.string('password',32).notNullable();
      table.string('frame',16);
      table.text('avatar');
      table.integer('type').defaultTo(0);
      table.datetime('lastlogin_at');
      table.datetime('created_at');
      table.integer('created_type');
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

    knex.schema.createTable("session",function (table) {
      table.increments('id').index()
      table.
    })
   
    ...['type'].map(v=>
      knex.schema.raw(`ALTER TABLE ${v} AUTO_INCREMENT=1000`))
    
  ]);
}

exports.down = function(knex){
  return Promise.all([
    knex.schema.dropTable('type'),
    knex.schema.dropTable('session')
  ]);
}
