'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserData } from '../services/meService';

interface UserContextType {
  email: string | null;
  full_name: string | null;
  website: string | null;
  daysDifference: number | null;
  percent_steps: number | 0;
  isTrialPending: boolean | false;
  resetUserData: () => void;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [full_name, setFullName] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [daysDifference, setDaysDifference] = useState<number | null>(null);
  const [percent_steps, setPercent] = useState<number | 0>(0);
  const [isTrialPending, setIsTrialPending] = useState<boolean>(false);

    const resetUserData = () => {
      setEmail(null);
      setFullName(null);
      setWebsite(null);
      setDaysDifference(null);
      setPercent(0);
      setHasFetched(false);
    };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedMe = sessionStorage.getItem('me');
    const currentDomain = sessionStorage.getItem('current_domain');
    
    if (storedMe) {
      const storedData = JSON.parse(storedMe);
      setEmail(storedData.email);
      setFullName(storedData.full_name);
      setWebsite(storedData.company_website);
      setPercent(storedData.percent_steps)
      setIsTrialPending(storedData.is_trial_pending);

      const endDate = new Date(storedData.plan_end);
      if (storedData.plan_end == null) {
        setDaysDifference(null);
      } else {
        const currentDate = new Date();

        // Calculate the difference in days
        let timeDifference = endDate.getTime() - currentDate.getTime();

        if (timeDifference < currentDate.getTime()) {
          fetchUserData().then(userData => {
            if (userData) {
              setEmail(userData.email);
              setFullName(userData.full_name);
              setWebsite(userData.company_website);
              setPercent(userData.percent_steps)
              setIsTrialPending(userData.is_trial_pending);
            }
          });
          timeDifference = (new Date(storedData.plan_end).getTime()) - currentDate.getTime();
        }
        const daysDifference = Math.ceil((timeDifference - 3600000) / (1000 * 60 * 60 * 24));

        setDaysDifference(daysDifference);
      }

      setHasFetched(true);
    } else if (token && currentDomain && !hasFetched) {
      fetchUserData().then(userData => {
        if (userData) {
          setEmail(userData.email);
          setFullName(userData.full_name);
          setWebsite(userData.company_website);
          setPercent(userData.percent_steps)
          setIsTrialPending(userData.is_trial_pending);
        }
        setHasFetched(true);
      });
    }
  }, [hasFetched]);

  return (
    <UserContext.Provider value={{ email, full_name, website, daysDifference, percent_steps, isTrialPending, resetUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
