import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { careAlertService } from '../services/api';

const SosButton = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'locating' | 'sending' | 'sent' | 'recorded' | 'failed' | 'error'>('idle');

  if (!user || user.role === 'ADMIN') return null;

  const handleSOSClick = () => {
    // Prevent accidental double-clicks
    if (status !== 'idle' && status !== 'error') return;

    setStatus('locating');
    const send = async (coordinates?: { latitude: number; longitude: number }) => {
      setStatus('sending');
      try {
        const result = await careAlertService.triggerSos({ confirmed: true, ...coordinates }) as { whatsappDelivery?: string; recipientCount?: number };
        if (result.whatsappDelivery === 'DELIVERED') setStatus('sent');
        else if (result.whatsappDelivery === 'FAILED' || !result.recipientCount) setStatus('failed');
        else setStatus('recorded');
        setTimeout(() => setStatus('idle'), 8000);
      } catch (error) {
        console.error('Error sending SOS:', error);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    };

    if (!navigator.geolocation) {
      void send();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => void send({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => void send(),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 }
    );
  };

  const statusColor =
    status === 'idle' ? 'bg-red-600 hover:bg-red-700 animate-pulse' :
    status === 'locating' ? 'bg-orange-500' :
    status === 'sending' ? 'bg-yellow-500' :
    status === 'sent' || status === 'recorded' ? 'bg-green-700' :
    status === 'failed' ? 'bg-orange-700' :
    'bg-red-800';

  return (
    <button
      onClick={handleSOSClick}
      disabled={status === 'locating' || status === 'sending' || status === 'sent' || status === 'recorded' || status === 'failed'}
      className={'fixed bottom-6 right-6 p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 z-50 ' + statusColor}
      aria-label="Emergency SOS"
    >
      <AlertTriangle className="text-white" size={32} />
      
      {/* Expanding text that only shows when activated */}
      {status !== 'idle' && (
        <span className="text-white font-bold ml-2 pr-2">
          {status === 'locating' && 'Locating...'}
          {status === 'sending' && 'Sending...'}
          {status === 'sent' && 'WhatsApp sent'}
          {status === 'recorded' && 'In-app alert only'}
          {status === 'failed' && 'Saved - nobody reached'}
          {status === 'error' && 'Failed'}
        </span>
      )}
    </button>
  );
};

export default SosButton;