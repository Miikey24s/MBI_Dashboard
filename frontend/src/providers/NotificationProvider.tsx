'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use a timeout to defer state updates to avoid synchronous setState warning
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('notifications_enabled');
      if (saved !== null) {
        setNotificationsEnabled(JSON.parse(saved));
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('notifications_enabled', JSON.stringify(newState));
    
    if (!newState) {
      toast.dismiss(); // Clear existing when turning off
    }
  };

  const clearAllNotifications = () => {
    toast.dismiss();
  };

  return (
    <NotificationContext.Provider value={{ notificationsEnabled, toggleNotifications, clearAllNotifications }}>
      {children}
      {mounted && notificationsEnabled && (
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          expand={true}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
