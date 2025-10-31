// Hook separated from provider to satisfy Fast Refresh (non-component export)
import { useContext } from 'react';
import { AppContext } from './appContextCore';

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

