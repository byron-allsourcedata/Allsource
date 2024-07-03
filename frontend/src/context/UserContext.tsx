'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../axios/axiosInterceptorInstance';

interface UserContextType {
  email: string | null;
}

interface UserProviderProps {
  children: ReactNode;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedMe = sessionStorage.getItem('me');

    if (storedMe) {
      // If the data is already stored in sessionStorage, use it.
      const storedData = JSON.parse(storedMe);
      setEmail(storedData.email);
      setHasFetched(true); // Set a flag to avoid repeated requests
    } else if (token && !hasFetched) {
      // If the data is not saved, make a request to the API
      axios.get('/api/me')
        .then(response => {
          const { email } = response.data;
          setEmail(email);
          sessionStorage.setItem('me', JSON.stringify({ email }));
          setHasFetched(true); // Set a flag to avoid repeated requests
        })
        .catch(error => {
          console.error('Error loading data:', error);
          setHasFetched(true); // Set a flag to avoid re-requesting in case of error
        });
    }
  }, [hasFetched]);

  return (
    <UserContext.Provider value={{ email }}>
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
