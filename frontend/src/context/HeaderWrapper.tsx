"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import Header from '../components/Header';
import { usePathname } from 'next/navigation'; // Import usePathname

const HeaderWrapper: React.FC = () => {
  const { email } = useUser();
  const [showHeader, setShowHeader] = useState<boolean>(false);
  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    console.log("Email in HeaderWrapper:", email);
    
    // List of pages on which Header should not be displayed
    const excludedPaths = ['/signin', '/signup'];
    
    // Check if the email exists and the current path is not in the exception list
    if (email) {
      setShowHeader(true);
    } else {
      setShowHeader(false);
    }
  }, [email, pathname]);

  if (!showHeader) {
    return null;
  }

  return <Header />;
};

export default HeaderWrapper;
