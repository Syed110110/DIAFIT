exports.up = (pgm) => {
  pgm.addColumns('users', {
    whatsapp_number: { type: 'text' },
    whatsapp_opt_in: { type: 'boolean', notNull: true, default: false },
  });
  pgm.sql("ALTER TABLE users ADD CONSTRAINT whatsapp_opt_in_requires_number CHECK (NOT whatsapp_opt_in OR (whatsapp_number IS NOT NULL AND whatsapp_number ~ '^\\+[1-9][0-9]{7,14}$'))");
};

exports.down = (pgm) => {
  pgm.dropConstraint('users', 'whatsapp_opt_in_requires_number');
  pgm.dropColumns('users', ['whatsapp_number', 'whatsapp_opt_in']);
};