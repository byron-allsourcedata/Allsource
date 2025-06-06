'use client'
import React, { Suspense, useEffect } from 'react';
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { shopifyLandingStyle } from "./bingAds-landing";
import { showErrorToast, showInfoToast, showToast } from '../../components/ToastNotification';
import CustomizedProgressBar from '@/components/FirstLevelLoader';

const BingAdsLanding = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {

    const fetchBingAdsLandingData = async () => {
      if (error) {
        showErrorToast(`Error connect to BingAds: ${error}`);
        return
      }
      const codeVerifier = localStorage.getItem('codeVerifier');
      try {
        const response = await axiosInstance.post(
          '/integrations/',
          {
            bing_ads: {
              code: code,
              state: state,
              code_verifier: codeVerifier
            },
          },
          {
            params: {
              service_name: 'bing_ads',
            },
          }
        );

        if (response.data.status == 'SUCCESS') {
          showToast('Connect to BingAds success!')
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
      <Link display={'flex'} sx={{ alignItems: 'center', textDecoration: 'none' }}>
        <Image src={'/logo.svg'} width={100} height={200} alt="Allsource" />
      </Link>
      <Image src={'/app_intalled.svg'} width={330} height={246} alt="AllSource installed" />
      <Typography variant="h6" fontSize={'16px'} fontWeight={400} mt={2}>
        Wait for BingAds token verification
      </Typography>
    </Box>
  );
};

const BingAdsLandingPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <BingAdsLanding />
    </Suspense>
  );
};

export default BingAdsLandingPage;
