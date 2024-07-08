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
  const isWithoutCard = searchParams.get('is_without_card') === 'true';

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({ full_name: '', email: '', password: '', is_without_card: isWithoutCard ? 'true' : 'false'});
  const handleGoogleSignup = () => {
    console.log('Google signup clicked');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formValues.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formValues.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.email = 'Email address is invalid';
    }

    if (!formValues.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axiosInstance.post('api/sign-up', formValues);

        if (response.status === 200) {
          const responseData = response.data;

          if (responseData.status === "NEED_CHOOSE_PLAN") {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', responseData.token);
            }
            sessionStorage.setItem('me', JSON.stringify({ email: formValues.email }));
            router.push('/choose-plan');
          } else if (responseData.status === "EMAIL_ALREADY_EXISTS") {
            router.push('/login');
          } else if (responseData.status === "NEED_CONFIRM_EMAIL") {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', responseData.token);
            }
            sessionStorage.setItem('me', JSON.stringify({ email: formValues.email }));
            router.push('/email_verificate');
          }
        }
      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.data) {
          const errorData = error.response.data as { [key: string]: string };
          setErrors(errorData);
        } else {
          console.error('Error:', error);
        }
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  

  return (
    <>
      <Box sx={planStyles.logoContainer}>
        <Image src='./logo.svg' alt='logo' height={80} width={60} />
      </Box>
      <Typography variant="h4" component="h1" sx={planStyles.title}>
          Create a new account
        </Typography>
      <Box sx={planStyles.container}>
        <Box component="form" onSubmit={handleSubmit} sx={planStyles.form}>
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
