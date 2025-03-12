'use client'
import React, { Suspense, useEffect } from 'react';
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { shopifyLandingStyle } from "./bingAds-landing";
import { showErrorToast, showInfoToast } from '../../../components/ToastNotification';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';

const GoogleAdsLanding = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const fetchBingAdsLandingData = async () => {
      if (error){
        showErrorToast(`Error connect to BingAds: ${error}`);
        return
      }
      try {
        const response = await axiosInstance.post(
          '/integrations/',
          {
            bing_ads: {
              code: code,
              state: state
            },
          },
          {
            params: {
              service_name: 'bing-ads',
            },
          }
        );

        if (response.data.status == 'SUCCESS') {
          showInfoToast('Connect to BingAds success!')
          router.push(`/integrations`);
        }
        else if (response.data.status == 'ERROR_BINGADS_TOKEN') {
          showErrorToast('Error connect to BingAds');
          router.push(`/integrations`);
        }
      } catch (error) {
        console.error('BingAds Landing:', error);
      }
    };

    fetchBingAdsLandingData();

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
        Wait for BingAds token verification
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
