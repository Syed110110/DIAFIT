exports.up = (pgm) => {
  pgm.createType('care_alert_kind', ['GLUCOSE_OUT_OF_RANGE', 'MISSED_DOSE', 'SOS']);
  pgm.createType('care_alert_severity', ['WARNING', 'CRITICAL']);
  pgm.createType('care_alert_state', ['OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED']);
  pgm.createType('in_app_delivery_state', ['PENDING', 'DELIVERED', 'FAILED']);

  pgm.addColumns('patient_care_settings', {
    critical_glucose_min_mg_dl: { type: 'numeric(6,2)' },
    critical_glucose_max_mg_dl: { type: 'numeric(6,2)' },
    alert_ack_window_minutes: { type: 'integer', notNull: true, default: 10 },
    alert_retry_limit: { type: 'integer', notNull: true, default: 3 },
  });
  pgm.sql("ALTER TABLE patient_care_settings ADD CONSTRAINT critical_glucose_range_valid CHECK (critical_glucose_min_mg_dl IS NULL OR critical_glucose_max_mg_dl IS NULL OR critical_glucose_min_mg_dl < critical_glucose_max_mg_dl)");
  pgm.sql('ALTER TABLE patient_care_settings ADD CONSTRAINT alert_window_valid CHECK (alert_ack_window_minutes > 0 AND alert_retry_limit >= 0)');

  pgm.createTable('caregiver_shifts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    patient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    caregiver_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    starts_at: { type: 'timestamptz', notNull: true },
    ends_at: { type: 'timestamptz', notNull: true },
    created_by: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    cancelled_at: { type: 'timestamptz' },
  });
  pgm.sql('ALTER TABLE caregiver_shifts ADD CONSTRAINT caregiver_shift_interval_valid CHECK (starts_at < ends_at)');
  pgm.sql('CREATE INDEX caregiver_shifts_current_idx ON caregiver_shifts (patient_id, starts_at, ends_at) WHERE cancelled_at IS NULL');

  pgm.createTable('care_alerts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    patient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    kind: { type: 'care_alert_kind', notNull: true },
    severity: { type: 'care_alert_severity', notNull: true },
    state: { type: 'care_alert_state', notNull: true, default: 'OPEN' },
    glucose_reading_id: { type: 'uuid', references: 'glucose_readings(id)', onDelete: 'RESTRICT' },
    dose_occurrence_id: { type: 'uuid', references: 'dose_occurrences(id)', onDelete: 'RESTRICT' },
    assigned_caregiver_id: { type: 'char(24)', references: 'users(id)', onDelete: 'RESTRICT' },
    escalated_coordinator_id: { type: 'char(24)', references: 'users(id)', onDelete: 'RESTRICT' },
    acknowledged_by: { type: 'char(24)', references: 'users(id)', onDelete: 'RESTRICT' },
    acknowledged_at: { type: 'timestamptz' },
    ack_due_at: { type: 'timestamptz' },
    retry_count: { type: 'integer', notNull: true, default: 0 },
    next_retry_at: { type: 'timestamptz' },
    resolved_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql('ALTER TABLE care_alerts ADD CONSTRAINT care_alert_retry_nonnegative CHECK (retry_count >= 0)');
  pgm.sql('CREATE UNIQUE INDEX care_alert_glucose_once ON care_alerts (glucose_reading_id) WHERE glucose_reading_id IS NOT NULL');
  pgm.sql('CREATE UNIQUE INDEX care_alert_missed_dose_once ON care_alerts (dose_occurrence_id) WHERE kind = \'MISSED_DOSE\' AND dose_occurrence_id IS NOT NULL');
  pgm.sql('CREATE INDEX care_alerts_patient_recent_idx ON care_alerts (patient_id, created_at DESC)');
  pgm.sql("CREATE INDEX care_alerts_ack_due_idx ON care_alerts (ack_due_at) WHERE state = 'OPEN'");

  pgm.createTable('alert_notifications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    alert_id: { type: 'uuid', notNull: true, references: 'care_alerts(id)', onDelete: 'CASCADE' },
    recipient_id: { type: 'char(24)', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    channel: { type: 'text', notNull: true, default: 'IN_APP' },
    state: { type: 'in_app_delivery_state', notNull: true, default: 'PENDING' },
    attempt_count: { type: 'integer', notNull: true, default: 0 },
    next_attempt_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    last_error: { type: 'text' },
    delivered_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql('CREATE INDEX alert_notifications_inbox_idx ON alert_notifications (recipient_id, created_at DESC)');
  pgm.sql("CREATE INDEX alert_notifications_retry_idx ON alert_notifications (next_attempt_at) WHERE state IN ('PENDING', 'FAILED')");

  pgm.createTable('alert_delivery_attempts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    notification_id: { type: 'uuid', notNull: true, references: 'alert_notifications(id)', onDelete: 'CASCADE' },
    attempt_number: { type: 'integer', notNull: true },
    outcome: { type: 'in_app_delivery_state', notNull: true },
    detail: { type: 'text', notNull: true, default: '' },
    attempted_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.sql('CREATE UNIQUE INDEX alert_delivery_attempt_unique ON alert_delivery_attempts (notification_id, attempt_number)');
};

exports.down = (pgm) => {
  pgm.dropTable('alert_delivery_attempts');
  pgm.dropTable('alert_notifications');
  pgm.dropTable('care_alerts');
  pgm.dropTable('caregiver_shifts');
  pgm.dropColumns('patient_care_settings', [
    'critical_glucose_min_mg_dl',
    'critical_glucose_max_mg_dl',
    'alert_ack_window_minutes',
    'alert_retry_limit',
  ]);
  pgm.dropType('in_app_delivery_state');
  pgm.dropType('care_alert_state');
  pgm.dropType('care_alert_severity');
  pgm.dropType('care_alert_kind');
};