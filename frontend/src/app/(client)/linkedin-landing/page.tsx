'use client'
import React, { Suspense, useEffect } from 'react';
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { shopifyLandingStyle } from "./linkedin-landing";
import { showErrorToast, showToast } from '../../../components/ToastNotification';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';

const LinkedinLanding = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const fetchLinkedinLandingData = async () => {
      try {
        const response = await axiosInstance.post(
          '/integrations/',
          {
            linkedin: {
              code: code,
              state: state
            },
          },
          {
            params: {
              service_name: 'linkedin',
            },
          }
        );

        if (response.data.status == 'SUCCESS') {
          showToast('Connect to Linkedin success!')
          router.push(`/integrations`);
        } 
      } catch (error) {
        showErrorToast(`Error connect to Linkedin ${error}`);
        router.push(`/integrations`);
      }
    };
    if (error){
      showErrorToast(`Error connect to Linkedin: ${error}`);
      return
    }
    fetchLinkedinLandingData();

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [router, searchParams]);

  return (
    <Box sx={shopifyLandingStyle.mainContent}>
      <Link display={'flex'} sx={{ alignItems: 'center', textDecoration: 'none' }} href='https://maximiz.ai'>
        <Image src={'/logo.svg'} width={61} height={39} alt="Maximiz" />
        <Typography variant="h1" color={'#F8464B'} fontSize={'51.21px'} fontWeight={400}>Maximiz</Typography>
      </Link>
      <Image src={'/app_intalled.svg'} width={330} height={246} alt="Maximiz installed" />
      <Typography variant="h6" fontSize={'16px'} fontWeight={400} mt={2}>
        Wait for Linkedin token verification
      </Typography>
    </Box>
  );
};

const LinkedinLandingPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <LinkedinLandingPage />
    </Suspense>
  );
};

export default LinkedinLanding;
