"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TrialContextType {
  trial: boolean;
  daysDifference: number | null;
  setTrial: (trial: boolean) => void;
  setDaysLeft: (daysLeft: number | null) => void;
  resetTrialData: () => void;
}

interface TrialProviderProps {
  children: ReactNode;
}

export const TrialContext = createContext<TrialContextType | undefined>(undefined);

export const TrialProvider: React.FC<TrialProviderProps> = ({ children }) => {
  const [trial, setTrial] = useState<boolean>(false);
  const [daysDifference, setDaysDifference] = useState<number | null>(null);

  const resetTrialData = () => {
    setTrial(false)
    setDaysDifference(null)
  };
  

  useEffect(() => {
    const storedMe = sessionStorage.getItem('me');
    
    if (storedMe) {
      try {
        const me = JSON.parse(storedMe);
        if (me.trial !== undefined) {
          setTrial(me.trial);
        }
        if (me.plan_end) {
          const endDate = new Date(me.plan_end);
          const currentDate = new Date();
          
          // Calculate the difference in days
          const timeDifference = endDate.getTime() - currentDate.getTime();
          const daysDifferences = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
          
          // Update the state with the calculated days difference
          setDaysDifference(daysDifferences);
        }
      } catch (error) {
        console.error('Failed to parse sessionStorage item "me":', error);
      }
    }
  }, [trial]);

  

  return (
    <TrialContext.Provider value={{ trial, daysDifference, setTrial, setDaysLeft: setDaysDifference, resetTrialData }}>
      {children}
    </TrialContext.Provider>
  );
};

export const useTrial = () => {
  const context = useContext(TrialContext);
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider');
  }
  return context;
};
