"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { usePathname } from 'next/navigation'; // Import usePathname
import { SliderProvider } from './SliderContext';

const SidebarWrapper: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    
    // List of pages on which Header should not be displayed
    const excludedPaths = ['/signin', '/signup', '/email-verificate', '/account-setup', '/reset-password', '/choose-plan', '/authentication/verify-token', '/admin/users'];
    
    // Check if the email exists and the current path is not in the exception list
    if (!excludedPaths.includes(pathname)) {
        setShowSidebar(true);
    } else {
        setShowSidebar(false);
    }
  }, [pathname]);

  if (!showSidebar) {
    return null;
  }

  return <SliderProvider><Sidebar /></SliderProvider>
};

export default SidebarWrapper;
