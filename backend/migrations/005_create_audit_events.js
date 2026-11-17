exports.up = (pgm) => {
  pgm.createTable('audit_events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    patient_id: { type: 'char(24)', references: 'users(id)', onDelete: 'SET NULL' },
    actor_id: { type: 'char(24)', references: 'users(id)', onDelete: 'SET NULL' },
    actor_role: { type: 'app_role' },
    action: { type: 'text', notNull: true },
    method: { type: 'text', notNull: true },
    route: { type: 'text', notNull: true },
    response_status: { type: 'smallint', notNull: true },
    request_id: { type: 'uuid', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql("ALTER TABLE audit_events ADD CONSTRAINT audit_action_valid CHECK (action IN ('READ', 'WRITE'))");
  pgm.sql('CREATE INDEX audit_events_patient_time_idx ON audit_events (patient_id, created_at DESC)');
  pgm.sql('CREATE INDEX audit_events_actor_time_idx ON audit_events (actor_id, created_at DESC)');
};

exports.down = (pgm) => {
  pgm.dropTable('audit_events');
};