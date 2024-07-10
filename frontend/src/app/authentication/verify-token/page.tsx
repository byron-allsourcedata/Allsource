"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import ToastNotification from '@/components/ToastNotification';

const VerifyToken = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axiosInstance.get(`/api/authentication/verify-token?token=${token}`);
          console.log(response);

          if (response.data.status === 'SUCCESS' || response.data.status === 'EMAIL_ALREADY_VERIFIED') {
            if (typeof window !== 'undefined') {
              const newToken = response.data.token;
              localStorage.removeItem('token');
              localStorage.setItem('token', newToken);
              router.push('/dashboard');
            }
          }
          else if (response.data.status === 'INCORRECT_TOKEN') {
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
