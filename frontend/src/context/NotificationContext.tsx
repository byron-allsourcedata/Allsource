import React, { createContext, useContext, ReactNode } from 'react';

interface NotificationContextProps {
  hasNotification?: boolean;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ hasNotification: boolean; children: ReactNode }> = ({
  hasNotification,
  children
}) => (
  <NotificationContext.Provider value={{ hasNotification }}>
    {children}
  </NotificationContext.Provider>
);

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
