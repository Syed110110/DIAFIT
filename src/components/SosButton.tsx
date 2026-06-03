import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SosButton = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'locating' | 'sending' | 'sent' | 'error'>('idle');

  const handleSOSClick = () => {
    // Prevent accidental double-clicks
    if (status !== 'idle' && status !== 'error') return;

    setStatus('locating');

    // 1. Grab the exact GPS coordinates from the browser
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('sending');
        const { latitude, longitude } = position.coords;

        try {
          // Strictly type the user object to satisfy the linter without using 'any'
          type UserWithId = { id?: string; _id?: string };
          const safeUserId = (user as UserWithId)?.id || (user as UserWithId)?._id;

          // 2. Send the coordinates to your backend
          const response = await fetch('http://localhost:5000/api/users/sos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer ${token}` // Uncomment if using JWT
            },
            body: JSON.stringify({
              userId: safeUserId,
              latitude,
              longitude
            }),
          });

          if (response.ok) {
            setStatus('sent');
            // Reset button after 5 seconds
            setTimeout(() => setStatus('idle'), 5000);
          } else {
            setStatus('error');
          }
        } catch (error) {
          console.error('Error sending SOS:', error);
          setStatus('error');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please ensure location permissions are enabled.');
        setStatus('error');
      },
      // High accuracy required for emergencies
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button
      onClick={handleSOSClick}
      disabled={status === 'locating' || status === 'sending' || status === 'sent'}
      className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 z-50 ${
        status === 'idle' ? 'bg-red-600 hover:bg-red-700 animate-pulse' :
        status === 'locating' ? 'bg-orange-500' :
        status === 'sending' ? 'bg-yellow-500' :
        status === 'sent' ? 'bg-green-500' :
        'bg-red-800'
      }`}
      aria-label="Emergency SOS"
    >
      <AlertTriangle className="text-white" size={32} />
      
      {/* Expanding text that only shows when activated */}
      {status !== 'idle' && (
        <span className="text-white font-bold ml-2 pr-2">
          {status === 'locating' && 'Locating...'}
          {status === 'sending' && 'Sending...'}
          {status === 'sent' && 'Alert Sent!'}
          {status === 'error' && 'Failed'}
        </span>
      )}
    </button>
  );
};

export default SosButton;