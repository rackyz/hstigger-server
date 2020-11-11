exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable('message', function (table) {
      table.increments('id').index();
      table.string('to', 64);
      table.string('from', 64);
      table.text('content');
      table.string('inputor',32)
      table.datetime('created_at')
    }),

    knex.schema.createTable('message_user_readed', function (table) {
      table.increments('id').index();
      table.integer('msg_id')
      table.string('user_id', 32);
      table.datetime('created_at')
    })
  ])
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTable('message'),
      knex.schema.dropTable('message_user_readed')
  ])
};
