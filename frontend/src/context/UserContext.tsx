'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInterceptorInstance from '../axios/axiosInterceptorInstance';

interface UserContextType {
  email: string | null;
  full_name: string | null;
}

interface UserProviderProps {
  children: ReactNode;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [full_name, setFullName] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedMe = sessionStorage.getItem('me');

    if (storedMe)  {
      const storedData = JSON.parse(storedMe);
      setEmail(storedData.email);
      setFullName(storedData.full_name);
      setHasFetched(true); 
    } else if (token && !hasFetched) {

      axiosInterceptorInstance.get('/me')
        .then(response => {
          const { email } = response.data;
          setEmail(email);
          setHasFetched(true); // Set a flag to avoid repeated requests
          setFullName(response.data.full_name);
          sessionStorage.setItem('me', JSON.stringify({ 
            email: response.data.email, 
            full_name: response.data.full_name 
          }));
          setHasFetched(true); 
        })
        .catch(error => {
          console.error('Error loading data:', error);
          setHasFetched(true);
        });
    }
  }, [hasFetched]);

  return (
    <UserContext.Provider value={{ email, full_name }}>
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
