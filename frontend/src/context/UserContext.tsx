'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserData } from '../services/meService';

interface UserContextType {
  email: string | null;
  full_name: string | null;
  website: string | null;
  daysDifference: number | null;
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedMe = sessionStorage.getItem('me');
    
    if (storedMe) {
      const storedData = JSON.parse(storedMe);
      setEmail(storedData.email);
      setFullName(storedData.full_name);
      setWebsite(storedData.company_website);

      const endDate = new Date(storedData.plan_end);
      if (storedData.plan_end == null) {
        setDaysDifference(null);
      } else {
        const currentDate = new Date();

        // Calculate the difference in days
        const timeDifference = endDate.getTime() - currentDate.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        // Update the state with the calculated days difference
        setDaysDifference(daysDifference);
      }

      setHasFetched(true);
    } else if (token && !hasFetched) {
      fetchUserData().then(userData => {
        if (userData) {
          setEmail(userData.email);
          setFullName(userData.full_name);
          setWebsite(userData.company_website);
        }
        setHasFetched(true);
      });
    }
  }, [hasFetched]);

  return (
    <UserContext.Provider value={{ email, full_name, website, daysDifference }}>
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
