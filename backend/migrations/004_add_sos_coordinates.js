exports.up = (pgm) => {
  pgm.addColumns('care_alerts', {
    latitude: { type: 'numeric(9,6)' },
    longitude: { type: 'numeric(9,6)' },
  });
  pgm.sql(`ALTER TABLE care_alerts ADD CONSTRAINT care_alert_location_valid
    CHECK ((latitude IS NULL AND longitude IS NULL) OR
      (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))`);
};

exports.down = (pgm) => {
  pgm.dropConstraint('care_alerts', 'care_alert_location_valid');
  pgm.dropColumns('care_alerts', ['latitude', 'longitude']);
};