"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import CustomNotification from '@/components/CustomNotification';

interface Data {
  num: number;
}

interface SSEContextType {
  data: Data | null;
  newNotification: boolean;
}

interface SSEProviderProps {
  children: ReactNode;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const SSEProvider: React.FC<SSEProviderProps> = ({ children }) => {
  const [data, setData] = useState<Data | null>(null);
  const [newNotification, setNewNotifications] = useState(false);
  const [latestNotification, setLatestNotification] = useState<{ id: number; text: string } | null>(null);

  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  const handleNotificationDismiss = () => {
    setNewNotifications(false);
    setLatestNotification(null);
  };

  if (!url) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    const evtSource = new EventSource(`${url}event-source?token=${token}`);
    evtSource.onmessage = (event) => {
      if (event.data) {
        const data = JSON.parse(event.data);
        if (data.status === "PIXEL_CODE_PARSE_FAILED") {
          showErrorToast("Could not find pixel code on your site")
        }
        else if(data.notification_id && data.notification_text) {
          setLatestNotification({
            id: data.notification_id,
            text: data.notification_text,
          })
        }
        else if(data.update_subscription && data.status) {
          showToast(`Subscription updated ${data.status}!`);
        }
        else if(data.status) {
          showToast(`${data.status}!`);
        }
        else {
          showToast("Pixel code is installed successfully!");
          if (data.percent) {
            const meItem = sessionStorage.getItem('me');
            const meData = meItem ? JSON.parse(meItem) : {};
            meData.percent_steps = data.percent;
            sessionStorage.setItem('me', JSON.stringify(meData));
          }
          setData(data);
          window.location.reload();
        }
      }
    };

    evtSource.onerror = (error) => {
      evtSource.close();
    };

    return () => {
      evtSource.close();
    };
  }, [url]);

  return (
    <SSEContext.Provider value={{ data, newNotification }}>
      {children}
      {latestNotification && (
        <CustomNotification 
          id={latestNotification.id} 
          message={latestNotification.text} 
          showDismiss={true}
          onDismiss={handleNotificationDismiss} 
        />
      )}
    </SSEContext.Provider>
  );
};

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error('useSSE must be used within a SSEProvider');
  }
  return context;
};
