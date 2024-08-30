"use client";
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { usePathname } from 'next/navigation'; // Import usePathname

const HeaderWrapper: React.FC = () => {
  const [showHeader, setShowHeader] = useState<boolean>(false);
  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    
    // List of pages on which Header should not be displayed
    const excludedPaths = ['/signin', '/signup', '/email-verificate', '/account-setup', '/reset-password', '/choose-plan', '/authentication/verify-token', '/admin/users'];
    
    // Check if the email exists and the current path is not in the exception list
    if (!excludedPaths.includes(pathname)) {
      setShowHeader(true);
    } else {
      setShowHeader(false);
    }
  }, [pathname]);

  if (!showHeader) {
    return null;
  }

  return <Header />;
};

export default HeaderWrapper;
