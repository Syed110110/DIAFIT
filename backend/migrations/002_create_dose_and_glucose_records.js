exports.up = (pgm) => {
  pgm.createType('dose_state', ['PENDING', 'TAKEN', 'LATE', 'MISSED']);
  pgm.createType('record_source', ['MANUAL', 'VOICE', 'SYSTEM']);
  pgm.createType('dose_log_kind', ['LOG', 'CORRECTION']);
  pgm.createType('glucose_context', ['FASTING', 'BEFORE_MEAL', 'AFTER_MEAL', 'BEDTIME', 'OTHER']);

  pgm.createTable('patient_care_settings', {
    patient_id: {
      type: 'char(24)',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    safe_glucose_min_mg_dl: { type: 'numeric(6,2)' },
    safe_glucose_max_mg_dl: { type: 'numeric(6,2)' },
    dose_grace_minutes: { type: 'integer', notNull: true, default: 15 },
    dose_miss_after_minutes: { type: 'integer', notNull: true, default: 120 },
    conflict_window_seconds: { type: 'integer', notNull: true, default: 300 },
    updated_by: { type: 'char(24)', references: 'users(id)', onDelete: 'SET NULL' },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql("ALTER TABLE patient_care_settings ADD CONSTRAINT patient_glucose_range_valid CHECK (safe_glucose_min_mg_dl IS NULL OR safe_glucose_max_mg_dl IS NULL OR safe_glucose_min_mg_dl < safe_glucose_max_mg_dl)");
  pgm.sql('ALTER TABLE patient_care_settings ADD CONSTRAINT dose_windows_valid CHECK (dose_grace_minutes >= 0 AND dose_miss_after_minutes > dose_grace_minutes AND conflict_window_seconds >= 0)');

  pgm.createTable('medications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    patient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    name: { type: 'text', notNull: true },
    instructions: { type: 'text', notNull: true, default: '' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_by: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql('CREATE INDEX medications_patient_active_idx ON medications (patient_id, is_active)');

  pgm.createTable('dose_occurrences', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    patient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    medication_id: { type: 'uuid', references: 'medications(id)', onDelete: 'SET NULL' },
    medication_name: { type: 'text', notNull: true },
    scheduled_for: { type: 'timestamptz', notNull: true },
    state: { type: 'dose_state', notNull: true, default: 'PENDING' },
    conflict_state: { type: 'text', notNull: true, default: 'NONE' },
    confirmed_log_id: { type: 'uuid' },
    created_by: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql("ALTER TABLE dose_occurrences ADD CONSTRAINT dose_conflict_state_valid CHECK (conflict_state IN ('NONE', 'OPEN', 'RESOLVED'))");
  pgm.sql('CREATE INDEX dose_occurrences_patient_schedule_idx ON dose_occurrences (patient_id, scheduled_for DESC)');
  pgm.sql("CREATE INDEX dose_occurrences_pending_due_idx ON dose_occurrences (scheduled_for) WHERE state = 'PENDING'");

  pgm.createTable('dose_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    occurrence_id: { type: 'uuid', notNull: true, references: 'dose_occurrences(id)', onDelete: 'RESTRICT' },
    patient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    author_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    author_role: { type: 'app_role', notNull: true },
    source: { type: 'record_source', notNull: true },
    kind: { type: 'dose_log_kind', notNull: true, default: 'LOG' },
    resulting_state: { type: 'dose_state', notNull: true },
    taken_at: { type: 'timestamptz', notNull: true },
    notes: { type: 'text', notNull: true, default: '' },
    supersedes_log_id: { type: 'uuid', references: 'dose_logs(id)', onDelete: 'RESTRICT' },
    confirmed_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql('CREATE INDEX dose_logs_occurrence_time_idx ON dose_logs (occurrence_id, confirmed_at)');
  pgm.sql('ALTER TABLE dose_occurrences ADD CONSTRAINT dose_confirmed_log_fk FOREIGN KEY (confirmed_log_id) REFERENCES dose_logs(id) ON DELETE RESTRICT');

  pgm.createTable('dose_conflicts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    occurrence_id: { type: 'uuid', notNull: true, references: 'dose_occurrences(id)', onDelete: 'RESTRICT' },
    first_log_id: { type: 'uuid', notNull: true, references: 'dose_logs(id)', onDelete: 'RESTRICT' },
    second_log_id: { type: 'uuid', notNull: true, references: 'dose_logs(id)', onDelete: 'RESTRICT' },
    status: { type: 'text', notNull: true, default: 'OPEN' },
    detected_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    resolved_by: { type: 'char(24)', references: 'users(id)', onDelete: 'RESTRICT' },
    resolved_log_id: { type: 'uuid', references: 'dose_logs(id)', onDelete: 'RESTRICT' },
    resolved_at: { type: 'timestamptz' },
  });
  pgm.sql("ALTER TABLE dose_conflicts ADD CONSTRAINT dose_conflict_status_valid CHECK (status IN ('OPEN', 'RESOLVED'))");
  pgm.sql('CREATE UNIQUE INDEX dose_conflicts_open_occurrence_unique ON dose_conflicts (occurrence_id) WHERE status = \'OPEN\'');

  pgm.createTable('glucose_readings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    patient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    author_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    author_role: { type: 'app_role', notNull: true },
    source: { type: 'record_source', notNull: true },
    value_mg_dl: { type: 'numeric(6,2)', notNull: true },
    context: { type: 'glucose_context', notNull: true },
    measured_at: { type: 'timestamptz', notNull: true },
    confirmed_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    notes: { type: 'text', notNull: true, default: '' },
  });
  pgm.sql('CREATE INDEX glucose_readings_patient_measured_idx ON glucose_readings (patient_id, measured_at DESC)');
};

exports.down = (pgm) => {
  pgm.dropTable('glucose_readings');
  pgm.dropTable('dose_conflicts');
  pgm.dropTable('dose_logs');
  pgm.dropTable('dose_occurrences');
  pgm.dropTable('medications');
  pgm.dropTable('patient_care_settings');
  pgm.dropType('glucose_context');
  pgm.dropType('dose_log_kind');
  pgm.dropType('record_source');
  pgm.dropType('dose_state');
};