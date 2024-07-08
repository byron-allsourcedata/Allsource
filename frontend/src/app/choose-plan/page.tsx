'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { planStyles } from './planStyles';

const PlanPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();


  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  

  return (
    <>
      <Box sx={planStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>
      <Typography variant="h4" component="h1" sx={planStyles.title}>
        We’ve got a plan thats perfect for you!
      </Typography>
      <Box sx={planStyles.formContainer}>
        <Box sx={planStyles.formWrapper}>
          <Box component="form"  sx={planStyles.form}>
            <Button
              type="submit"
              variant="contained"
              sx={planStyles.submitButton}
              fullWidth
            >
              Talk to us
            </Button>
          </Box>
        </Box>
        <Box sx={planStyles.formWrapper}>
          <Box component="form"  sx={planStyles.form}>
            <Button
              type="submit"
              variant="contained"
              sx={planStyles.submitButton}
              fullWidth
            >
              Talk to us
            </Button>
          </Box>
        </Box>
        <Box sx={planStyles.formWrapper}>
          <Box component="form"  sx={planStyles.form}>
            <Button
              type="submit"
              variant="contained"
              sx={planStyles.submitButton}
              fullWidth
            >
              Talk to us
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const ChoosePlanPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlanPage />
    </Suspense>
  );
};

export default ChoosePlanPage;
