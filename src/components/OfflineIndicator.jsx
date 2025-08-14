import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  const styles = {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    backgroundColor: '#333',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  };

  return (
    <div style={styles}>
      Vous êtes actuellement hors ligne. Les modifications seront synchronisées une fois la connexion rétablie.
    </div>
  );
};

export default OfflineIndicator;
