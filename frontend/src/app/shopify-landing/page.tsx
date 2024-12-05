'use client'
import React, { useEffect } from 'react';
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { useRouter, useSearchParams } from 'next/navigation';
import { shopifyLandingStyle } from "./shopify-landing";
import { CustomInfoToast } from '../../components/ToastNotification';

const ShopifyLanding = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const fetchShopifyLandingData = async () => {
      try {
        const queryString = searchParams.toString();

        const response = await axiosInterceptorInstance.get(`/integrations/shopify/landing?${queryString}`);
        const { token, message } = response.data;

        if (token) {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem('token', token);
        } else if (message && message == 'NO_USER_CONNECTED') {
          localStorage.clear();
          sessionStorage.clear();
          let msg = 'User not connected redirect to sign-up'
          CustomInfoToast({ message: msg });
          router.push(`/signup?${queryString}`);
        }
        else if (message && message == 'ERROR_SHOPIFY_TOKEN') {
          let msg = 'Error connect to shopify'
          CustomInfoToast({ message: msg });
        }
      } catch (error) {
        console.error('Ошибка при запросе Shopify Landing:', error);
      }
    };

    fetchShopifyLandingData();

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
        Wait for token verification
      </Typography>
    </Box>
  );
};

export default ShopifyLanding;
