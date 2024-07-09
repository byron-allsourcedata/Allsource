'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { dashboardStyles } from './dashboardStyles';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  

  return (
    <>
      <Box sx={dashboardStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>
      <Typography variant="h4" component="h1" sx={dashboardStyles.title}>
        Dashboard
      </Typography>
      <Button
          onClick={handleSignOut}
          sx={dashboardStyles.title}
        >
          Sign Out
        </Button>
    </>
  );
};

const DashboardPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
};

export default DashboardPage;
