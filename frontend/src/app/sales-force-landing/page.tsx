'use client'
import React, { Suspense, useEffect } from 'react';
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { shopifyLandingStyle } from "./salesForce-landing";
import { showErrorToast, showInfoToast, showToast } from '../../../components/ToastNotification';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';

const GoogleAdsLanding = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const fetchGoogleAdsLandingData = async () => {
      try {
        const response = await axiosInstance.post(
          '/integrations/',
          {
            sales_force: {
              code: code
            },
          },
          {
            params: {
              service_name: 'sales_force',
            },
          }
        );

        if (response.data.status == 'SUCCESS') {
          showToast('Connect to SalesForce success!')
          router.push(`/integrations`);
        }
      } catch (error) {
        showErrorToast(`Error connect to SalesForce ${error}`);
        router.push(`/integrations`);
      }
    };

    fetchGoogleAdsLandingData();

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
        Wait for SalesForce token verification
      </Typography>
    </Box>
  );
};

const GoogleAdsLandingPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <GoogleAdsLanding />
    </Suspense>
  );
};

export default GoogleAdsLandingPage;
