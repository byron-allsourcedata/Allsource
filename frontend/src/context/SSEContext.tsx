"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Data {
  num: number;
}

interface SSEContextType {
  data: Data | null;
}

interface SSEProviderProps {
  children: ReactNode;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const SSEProvider: React.FC<SSEProviderProps> = ({ children }) => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token not found');
      return;
    }
    const evtSource = new EventSource(`http://localhost:8000/event-source?token=${token}`);
    evtSource.onmessage = (event) => {
      if (event.data) {
        setData(JSON.parse(event.data));
        window.location.reload();
      }
    };

    evtSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      evtSource.close();
    };

    return () => {
      console.log('Closing EventSource');
      evtSource.close();
    };
  }, []);

  return (
    <SSEContext.Provider value={{ data }}>
      {children}
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
