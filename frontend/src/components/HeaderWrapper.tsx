// HeaderWrapper.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import Header from './Header';

const HeaderWrapper: React.FC = () => {
  const { email } = useUser();
  const [showHeader, setShowHeader] = useState<boolean>(false);

  useEffect(() => {
    console.log("Email in HeaderWrapper:", email);
    setShowHeader(!!email);
  }, [email]);

  if (!showHeader) {
    return null;
  }

  return <Header />;
};

export default HeaderWrapper;

