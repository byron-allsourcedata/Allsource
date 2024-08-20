"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { showErrorToast, showInfoToast, showToast } from '@/components/ToastNotification';
import { Pause } from '@mui/icons-material';

const VerifyToken = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axiosInstance.get(`/authentication/verify-token?token=${token}`);

          if (response.data.status === 'SUCCESS' || response.data.status === 'EMAIL_ALREADY_VERIFIED') {
            if (typeof window !== 'undefined') {
              if (response.data.status === 'EMAIL_ALREADY_VERIFIED') {
                showInfoToast('Email has already been verified')
              }
              else if (response.data.status === 'SUCCESS') {
                showToast('You have successfully verified your email')
              }
              const newToken = response.data.token;
              localStorage.removeItem('token');
              localStorage.setItem('token', newToken);

              setTimeout(() => {
                router.push('/dashboard');
              }, 2500); 
            }
          }
          else if (response.data.status === 'INCORRECT_TOKEN') {
            showErrorToast('The link is incorrect or outdated')
            const localtoken = localStorage.getItem('token')
            if (localtoken) {
              router.push('/dashboard')
            }
            else {
              router.push('/signin')
            }
          }
        } catch (error) {
          console.error('Error verifying token:', error);
        }
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div>Check token, please wait</div>
  );
};

const VerifyTokenWithSuspense = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <VerifyToken />
  </Suspense>
);

export default VerifyTokenWithSuspense;
function Sleep(arg0: number) {
  throw new Error('Function not implemented.');
}

