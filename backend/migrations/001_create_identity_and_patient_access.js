exports.up = (pgm) => {
  pgm.createType('app_role', [
    'PATIENT',
    'CAREGIVER',
    'FAMILY_COORDINATOR',
    'DOCTOR',
    'ADMIN',
  ]);

  pgm.createTable('users', {
    id: { type: 'char(24)', primaryKey: true },
    name: { type: 'text', notNull: true },
    email: { type: 'text', notNull: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'app_role', notNull: true },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.sql('CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))');
  pgm.sql("ALTER TABLE users ADD CONSTRAINT users_id_mongo_object_id CHECK (id ~ '^[a-fA-F0-9]{24}$')");

  pgm.createTable('patient_access', {
    id: 'id',
    patient_id: {
      type: 'char(24)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    member_id: {
      type: 'char(24)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    status: { type: 'text', notNull: true, default: 'PENDING' },
    requested_by: {
      type: 'char(24)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'RESTRICT',
    },
    consented_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.sql("ALTER TABLE patient_access ADD CONSTRAINT patient_access_status_valid CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED'))");
  pgm.sql('ALTER TABLE patient_access ADD CONSTRAINT patient_access_not_self CHECK (patient_id <> member_id)');
  pgm.sql('CREATE UNIQUE INDEX patient_access_pair_unique ON patient_access (patient_id, member_id)');
  pgm.sql('CREATE INDEX patient_access_member_active_idx ON patient_access (member_id, patient_id) WHERE status = \'ACTIVE\' AND consented_at IS NOT NULL');
};

exports.down = (pgm) => {
  pgm.dropTable('patient_access');
  pgm.dropTable('users');
  pgm.dropType('app_role');
};