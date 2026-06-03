import React from 'react';

interface StreakProps {
  currentStreak: number;
}

const StreakBadge: React.FC<StreakProps> = ({ currentStreak }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#FFF3CD', // Soft amber theme layout
      border: '1px solid #FFEBAA',
      padding: '12px 18px',
      borderRadius: '14px',
      width: 'max-content',
      margin: '16px 0',
      boxShadow: '0px 2px 6px rgba(0,0,0,0,06)'
    }}>
      <span role="img" aria-label="fire" style={{ fontSize: '26px', marginRight: '10px' }}>🔥</span>
      <div>
        <h4 style={{ margin: 0, color: '#856404', fontSize: '16px', fontWeight: 'bold' }}>
          {currentStreak} Day Streak!
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#A57C00', marginTop: '2px' }}>
          {currentStreak > 0 ? "You're doing excellent! Keep the fire burning." : "Log your health stats to start a streak!"}
        </p>
      </div>
    </div>
  );
};

export default StreakBadge;